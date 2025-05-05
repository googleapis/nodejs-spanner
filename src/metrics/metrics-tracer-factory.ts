/*!
 * Copyright 2025 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Counter, Histogram, metrics} from '@opentelemetry/api';
import * as constants from './constants';
import {MetricsTracer} from './metrics-tracer';
const version = require('../../../package.json').version;

export class MetricsTracerFactory {
  private _clientAttributes: {[key: string]: string};
  private _instrumentAttemptCounter!: Counter;
  private _instrumentAttemptLatency!: Histogram;
  private _instrumentOperationCounter!: Counter;
  private _instrumentOperationLatency!: Histogram;
  private _instrumentGfeConnectivityErrorCount!: Counter;
  private _instrumentGfeLatency!: Histogram;
  public enabled: boolean;
  public gfeEnabled: boolean;

  constructor(enabled: boolean, gfeEnabled = false) {
    this.enabled = enabled;
    this.gfeEnabled = gfeEnabled;
    this._createMetricInstruments();
    this._clientAttributes = {};
  }

  get instrumentAttemptLatency(): Histogram {
    return this._instrumentAttemptLatency;
  }

  get instrumentAttemptCounter(): Counter {
    return this._instrumentAttemptCounter;
  }

  get instrumentOperationLatency(): Histogram {
    return this._instrumentOperationLatency;
  }

  get instrumentOperationCounter(): Counter {
    return this._instrumentOperationCounter;
  }

  get instrumentGfeConnectivityErrorCount(): Counter {
    return this._instrumentGfeConnectivityErrorCount;
  }

  get instrumentGfeLatency(): Histogram {
    return this._instrumentGfeLatency;
  }

  get clientAttributes(): Record<string, string> {
    return this._clientAttributes;
  }

  set project(project: string) {
    this._clientAttributes[constants.MONITORED_RES_LABEL_KEY_PROJECT] = project;
  }

  set instance(instance: string) {
    this._clientAttributes[constants.MONITORED_RES_LABEL_KEY_INSTANCE] =
      instance;
  }

  set instanceConfig(instanceConfig: string) {
    this._clientAttributes[constants.MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG] =
      instanceConfig;
  }

  set location(location: string) {
    this._clientAttributes[constants.MONITORED_RES_LABEL_KEY_LOCATION] =
      location;
  }

  set clientHash(hash: string) {
    this._clientAttributes[constants.MONITORED_RES_LABEL_KEY_CLIENT_HASH] =
      hash;
  }

  set clientUid(clientUid: string) {
    this._clientAttributes[constants.METRIC_LABEL_KEY_CLIENT_UID] = clientUid;
  }

  set clientName(clientName: string) {
    this._clientAttributes[constants.METRIC_LABEL_KEY_CLIENT_NAME] = clientName;
  }

  set database(database: string) {
    this._clientAttributes[constants.METRIC_LABEL_KEY_DATABASE] = database;
  }

  public createMetricsTracer(): MetricsTracer {
    return new MetricsTracer(
      this._clientAttributes,
      this._instrumentAttemptCounter,
      this._instrumentAttemptLatency,
      this._instrumentOperationCounter,
      this._instrumentOperationLatency,
      this._instrumentGfeConnectivityErrorCount,
      this._instrumentGfeLatency,
      this.enabled,
      this.gfeEnabled,
    );
  }

  private _createMetricInstruments() {
    // This uses the globally registered provider (defaults to Noop provider)
    const meterProvider = metrics.getMeterProvider();
    const meter = meterProvider.getMeter(constants.SPANNER_METER_NAME, version);

    this._instrumentAttemptLatency = meter.createHistogram(
      constants.METRIC_NAME_ATTEMPT_LATENCIES,
      {unit: 'ms', description: 'Time an individual attempt took.'},
    );

    this._instrumentAttemptCounter = meter.createCounter(
      constants.METRIC_NAME_ATTEMPT_COUNT,
      {unit: '1', description: 'Number of attempts.'},
    );

    this._instrumentOperationLatency = meter.createHistogram(
      constants.METRIC_NAME_OPERATION_LATENCIES,
      {
        unit: 'ms',
        description:
          'Total time until final operation success or failure, including retries and backoff.',
      },
    );

    this._instrumentOperationCounter = meter.createCounter(
      constants.METRIC_NAME_OPERATION_COUNT,
      {unit: '1', description: 'Number of operations.'},
    );

    this._instrumentGfeLatency = meter.createHistogram(
      constants.METRIC_NAME_GFE_LATENCIES,
      {unit: 'ms', description: 'GFE Latency.'},
    );

    this._instrumentGfeConnectivityErrorCount = meter.createCounter(
      constants.METRIC_NAME_GFE_CONNECTIVITY_ERROR_COUNT,
      {unit: '1', description: 'GFE missing header count.'},
    );
  }
}
