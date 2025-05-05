// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {status as Status} from '@grpc/grpc-js';
import {Counter, Histogram} from '@opentelemetry/api';
import {
  METRIC_LABEL_KEY_CLIENT_NAME,
  METRIC_LABEL_KEY_CLIENT_UID,
  METRIC_LABEL_KEY_DATABASE,
  METRIC_LABEL_KEY_METHOD,
  METRIC_LABEL_KEY_STATUS,
  MONITORED_RES_LABEL_KEY_CLIENT_HASH,
  MONITORED_RES_LABEL_KEY_INSTANCE,
  MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG,
  MONITORED_RES_LABEL_KEY_LOCATION,
  MONITORED_RES_LABEL_KEY_PROJECT,
} from './constants';

class MetricAttemptTracer {
  private _startTime: Date;
  public status: number;

  constructor() {
    this._startTime = new Date(Date.now());
    this.status = -1;
  }

  get startTime() {
    return this._startTime;
  }
}

class MetricOperationTracer {
  private _attemptCount: number;
  private _startTime: Date;
  private _currentAttempt;
  public status: number;

  constructor() {
    this._attemptCount = 0;
    this._startTime = new Date(Date.now());
    this._currentAttempt = null;
    this.status = -1;
  }

  get attemptCount() {
    return this._attemptCount;
  }

  get currentAttempt() {
    return this._currentAttempt;
  }

  get startTime() {
    return this._startTime;
  }

  public start() {
    this._startTime = new Date(Date.now());
  }

  public createNewAttempt() {
    this._attemptCount += 1;
    this._currentAttempt = new MetricAttemptTracer();
  }
}

export class MetricsTracer {
  public currentOperation: MetricOperationTracer = new MetricOperationTracer();

  constructor(
    private _clientAttributes: {[key: string]: string},
    private _instrumentAttemptCounter: Counter,
    private _instrumentAttemptLatency: Histogram,
    private _instrumentOperationCounter: Counter,
    private _instrumentOperationLatency: Histogram,
    private _instrumentGfeConnectivityErrorCount: Counter,
    private _instrumentGfeLatency: Histogram,
    public enabled: boolean,
  ) {}

  private _getMillisecondTimeDifference(start: Date, end: Date): number {
    return end.valueOf() - start.valueOf();
  }

  get clientAttributes() {
    return this._clientAttributes;
  }

  get instrumentAttemptCounter() {
    return this._instrumentAttemptCounter;
  }

  get instrumentAttemptLatency() {
    return this._instrumentAttemptLatency;
  }

  get instrumentOperationCounter() {
    return this._instrumentOperationCounter;
  }

  get instrumentOperationLatency() {
    return this._instrumentOperationLatency;
  }

  public recordAttemptStart() {
    if (!this.enabled) return;
    this.currentOperation.createNewAttempt();
  }

  public recordAttemptCompletion(status: number = Status.OK) {
    if (!this.enabled) return;
    this.currentOperation.currentAttempt.status = status;
    const attemptAttributes = this._createAttemptOtelAttributes();
    const endTime = new Date(Date.now());
    const attemptLatencyMilliseconds = this._getMillisecondTimeDifference(
      this.currentOperation.currentAttempt.startTime,
      endTime,
    );
    this.instrumentAttemptLatency.record(
      attemptLatencyMilliseconds,
      attemptAttributes,
    );
  }

  public recordOperationStart() {
    if (!this.enabled) return;
    this.currentOperation = new MetricOperationTracer();
    this.currentOperation.start();
  }

  public recordOperationCompletion() {
    if (!this.enabled) return;
    const endTime = new Date(Date.now());
    const operationAttributes = this._createOperationOtelAttributes();
    const attemptAttributes = this._createAttemptOtelAttributes();
    const operationLatencyMilliseconds = this._getMillisecondTimeDifference(
      this.currentOperation.startTime,
      endTime,
    );

    this.instrumentOperationCounter.add(1, operationAttributes);
    this.instrumentOperationLatency.record(
      operationLatencyMilliseconds,
      operationAttributes,
    );
    this.instrumentAttemptCounter.add(
      this.currentOperation.attemptCount,
      attemptAttributes,
    );
  }

  public recordGfeLatency(latency: number) {
    if (!this.enabled) return;
    this._instrumentGfeLatency.record(latency, this.clientAttributes);
  }

  public recordGfeConnectivityErrorCount() {
    if (!this.enabled) return;
    this._instrumentGfeConnectivityErrorCount.add(1, this.clientAttributes);
  }

  private _createOperationOtelAttributes() {
    if (!this.enabled) return {};
    const attributes = {...this._clientAttributes};
    attributes[METRIC_LABEL_KEY_STATUS] =
      this.currentOperation.status.toString();

    return attributes;
  }

  private _createAttemptOtelAttributes() {
    if (!this.enabled) return {};
    const attributes = {...this._clientAttributes};
    if (this.currentOperation.currentAttempt === null) return attributes;
    attributes[METRIC_LABEL_KEY_STATUS] =
      this.currentOperation.currentAttempt.status.toString();

    return attributes;
  }

  set project(project: string) {
    if (!(MONITORED_RES_LABEL_KEY_PROJECT in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_PROJECT] = project;
    }
  }

  set instance(instance: string) {
    if (!(MONITORED_RES_LABEL_KEY_INSTANCE in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_INSTANCE] = instance;
    }
  }

  set instanceConfig(instanceConfig: string) {
    if (!(MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG] =
        instanceConfig;
    }
  }

  set location(location: string) {
    if (!(MONITORED_RES_LABEL_KEY_LOCATION in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_LOCATION] = location;
    }
  }

  set clientHash(clientHash: string) {
    if (!(MONITORED_RES_LABEL_KEY_CLIENT_HASH in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_CLIENT_HASH] = clientHash;
    }
  }

  set clientUid(clientUid: string) {
    if (!(METRIC_LABEL_KEY_CLIENT_UID in this._clientAttributes)) {
      this._clientAttributes[METRIC_LABEL_KEY_CLIENT_UID] = clientUid;
    }
  }

  set clientName(clientName: string) {
    if (!(METRIC_LABEL_KEY_CLIENT_NAME in this._clientAttributes)) {
      this._clientAttributes[METRIC_LABEL_KEY_CLIENT_NAME] = clientName;
    }
  }

  set database(database: string) {
    if (!(METRIC_LABEL_KEY_DATABASE in this._clientAttributes)) {
      this._clientAttributes[METRIC_LABEL_KEY_DATABASE] = database;
    }
  }

  set methodName(methodName: string) {
    if (!(METRIC_LABEL_KEY_METHOD in this._clientAttributes)) {
      this._clientAttributes[METRIC_LABEL_KEY_METHOD] = methodName;
    }
  }
}
