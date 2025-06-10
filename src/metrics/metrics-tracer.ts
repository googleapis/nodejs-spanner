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
import {MetricsTracerFactory} from './metrics-tracer-factory';
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

/**
 * MetricAttemptTracer tracks the start time and status of a single gRPC attempt.
 *
 * This class is used to record the timestamp when an attempt begins and to store
 * the status code of the attempt upon completion. It is to be used
 * by MetricsTracer to monitor and report metrics for each individual gRPC call attempt.
 */
class MetricAttemptTracer {
  private _startTime: Date;
  public status: string;

  constructor() {
    this._startTime = new Date(Date.now());
    this.status = 'UNKNOWN';
  }

  /**
   * Returns the start time of the attempt.
   */
  get startTime() {
    return this._startTime;
  }
}

/**
 * MetricOperationTracer tracks the lifecycle and metadata of a single gRPC spanner operation,
 * which may consist of multiple attempts.
 *
 * This class is responsible for:
 * - Recording the start time of the operation.
 * - Tracking the number of attempts made for the operation.
 * - Holding a reference to the current attempt's tracer (MetricAttemptTracer).
 * - Storing the final status code of the operation.
 *
 * Usage:
 * - Call `start()` to reset the operation's start time.
 * - Call `createNewAttempt()` to begin tracking a new attempt within the operation.
 * - Access `currentAttempt` to retrieve the current MetricAttemptTracer instance.
 * - Access `attemptCount` to get the number of attempts made so far.
 * - Access `startTime` to get the operation's start time.
 * - Set or read `status` to track the operation's final status code.
 */
class MetricOperationTracer {
  private _attemptCount: number;
  private _startTime: Date;
  private _currentAttempt;
  public status: string;

  constructor() {
    this._attemptCount = 0;
    this._startTime = new Date(Date.now());
    this._currentAttempt = null;
    this.status = 'UNKNOWN';
  }

  /**
   * Returns the number of attempts made for this operation.
   */
  get attemptCount() {
    return this._attemptCount;
  }

  /**
   * Returns the current MetricAttemptTracer instance for the ongoing attempt.
   */
  get currentAttempt() {
    return this._currentAttempt;
  }

  /**
   * Returns the start time of the operation.
   */
  get startTime() {
    return this._startTime;
  }

  /**
   * Resets the operation's start time to the current time.
   */
  public start() {
    this._startTime = new Date(Date.now());
  }

  /**
   * Increments the attempt count and creates a new MetricAttemptTracer
   * for tracking the next attempt within this operation.
   */
  public createNewAttempt() {
    this._attemptCount += 1;
    this._currentAttempt = new MetricAttemptTracer();
  }
}

/**
 * MetricsTracer is responsible for recording and managing metrics related to
 * gRPC Spanner operations and attempts counters, and latencies,
 * as well as Google Front End (GFE) metrics such as latency and connectivity errors.
 *
 * This class provides methods to record the start and completion of operations
 * and attempts, extract GFE latency from response headers.
 * It also handles setting of required Spanner metric attributes to
 * be later consumed by the SpannerMetricsExporter.
 */
export class MetricsTracer {
  /**
   * The current MetricOperationTracer instance tracking the ongoing operation.
   */
  public currentOperation: MetricOperationTracer | null = null;

  /**
   * Stores client and resource attributes for labeling metrics.
   */
  private _clientAttributes: {[key: string]: string} = {};

  /**
   * The gRPC Spanner method name associated with this tracer.
   */
  private _methodName = '';

  /*
   * The current GFE latency associated with this tracer.
   */
  public gfeLatency: number | null = null;
  /**
   * Constructs a new MetricsTracer.
   *
   * @param _instrumentAttemptCounter Counter for attempt count metrics.
   * @param _instrumentAttemptLatency Histogram for attempt latency metrics.
   * @param _instrumentOperationCounter Counter for operation count metrics.
   * @param _instrumentOperationLatency Histogram for operation latency metrics.
   * @param _instrumentGfeConnectivityErrorCount Counter for GFE connectivity errors.
   * @param _instrumentGfeLatency Histogram for GFE latency metrics.
   * @param enabled Whether metrics recording is enabled.
   */
  constructor(
    private _instrumentAttemptCounter: Counter | null,
    private _instrumentAttemptLatency: Histogram | null,
    private _instrumentOperationCounter: Counter | null,
    private _instrumentOperationLatency: Histogram | null,
    private _instrumentGfeConnectivityErrorCount: Counter | null,
    private _instrumentGfeLatency: Histogram | null,
    public enabled: boolean,
  ) {}

  /**
   * Returns the difference in milliseconds between two Date objects.
   * @param start The start time.
   * @param end The end time.
   * @returns The time difference in milliseconds.
   */
  private _getMillisecondTimeDifference(start: Date, end: Date): number {
    return end.valueOf() - start.valueOf();
  }

  /**
   * Gets the current client and resource attributes for metrics.
   */
  get clientAttributes() {
    return this._clientAttributes;
  }

  /**
   * Gets the attempt counter OTEL instrument.
   */
  get instrumentAttemptCounter() {
    return this._instrumentAttemptCounter;
  }

  /**
   * Gets the attempt latency histogram OTEL instrument.
   */
  get instrumentAttemptLatency() {
    return this._instrumentAttemptLatency;
  }

  /**
   * Gets the operation counter OTEL instrument.
   */
  get instrumentOperationCounter() {
    return this._instrumentOperationCounter;
  }

  /**
   * Gets the operation latency histogram OTEL instrument.
   */
  get instrumentOperationLatency() {
    return this._instrumentOperationLatency;
  }

  /**
   * Records the start of a new attempt within the current operation.
   * Increments the attempt count and creates a new MetricAttemptTracer.
   */
  public recordAttemptStart() {
    if (!this.enabled) return;
    this.currentOperation!.createNewAttempt();
  }

  /**
   * Records the completion of the current attempt, including its status and latency.
   * These statuses code are defined in grpc.status
   * @param status The status code of the attempt (default: Status.OK).
   */
  public recordAttemptCompletion(statusCode: Status = Status.OK) {
    if (!this.enabled) return;
    this.currentOperation!.currentAttempt.status = Status[statusCode];
    this.currentOperation!.status = Status[statusCode];

    const attemptAttributes = this._createAttemptOtelAttributes();
    const endTime = new Date(Date.now());
    const attemptLatencyMilliseconds = this._getMillisecondTimeDifference(
      this.currentOperation!.currentAttempt.startTime,
      endTime,
    );
    this.instrumentAttemptLatency?.record(
      attemptLatencyMilliseconds,
      attemptAttributes,
    );
  }

  /**
   * Records the start of a new operation, resetting the operation tracer and start time.
   */
  public recordOperationStart() {
    if (!this.enabled) return;
    if (this.currentOperation) {
      return; // Don't re-start an already started operation
    }
    this.currentOperation = new MetricOperationTracer();
    this.currentOperation!.start();
  }

  /**
   * Records the completion of the current operation, including its status,
   * latency, and attempt count. Also clears the current tracer from the factory.
   */
  public recordOperationCompletion() {
    if (!this.enabled || !this.currentOperation) return;
    const endTime = new Date(Date.now());
    const operationAttributes = this._createOperationOtelAttributes();
    const attemptAttributes = this._createAttemptOtelAttributes();
    const operationLatencyMilliseconds = this._getMillisecondTimeDifference(
      this.currentOperation!.startTime,
      endTime,
    );

    this.instrumentOperationCounter?.add(1, operationAttributes);
    this.instrumentOperationLatency?.record(
      operationLatencyMilliseconds,
      operationAttributes,
    );
    this.instrumentAttemptCounter?.add(
      this.currentOperation!.attemptCount,
      attemptAttributes,
    );
    MetricsTracerFactory.getInstance()!.clearCurrentTracer(this._methodName);
  }

  /**
   * Extracts the GFE latency value (in milliseconds) from a 'server-timing' header string.
   * Returns null if the header is missing or does not contain a valid latency value.
   *
   * @param header The 'server-timing' header string.
   * @returns The extracted GFE latency in milliseconds, or null if not found.
   */
  public extractGfeLatency(header: string): number | null {
    const regex = /gfet4t7; dur=([0-9]+).*/;
    if (header === undefined) return null;
    const match = header.match(regex);
    if (!match) return null;
    return Number(match[1]);
  }

  /**
   * Records the provided GFE latency.
   * @param latency The GFE latency in milliseconds.
   */
  public recordGfeLatency(statusCode: Status) {
    if (!this.enabled) return;
    if (!this.gfeLatency) {
      console.error(
        'ERROR: Attempted to record GFE metric with no latency value.',
      );
      return;
    }

    const attributes = {...this._clientAttributes};
    attributes[METRIC_LABEL_KEY_STATUS] = Status[statusCode];

    this._instrumentGfeLatency?.record(this.gfeLatency, attributes);
    this.gfeLatency = null; // Reset latency value
  }

  /**
   * Increments the GFE connectivity error count metric.
   */
  public recordGfeConnectivityErrorCount(statusCode: Status) {
    if (!this.enabled) return;
    const attributes = {...this._clientAttributes};
    attributes[METRIC_LABEL_KEY_STATUS] = Status[statusCode];
    this._instrumentGfeConnectivityErrorCount?.add(1, attributes);
  }

  /**
   * Creates and returns a set of OTEL attributes for operation-level metrics.
   * @returns The operation attributes object.
   */
  private _createOperationOtelAttributes() {
    if (!this.enabled) return {};
    const attributes = {...this._clientAttributes};
    attributes[METRIC_LABEL_KEY_STATUS] =
      this.currentOperation!.status.toString();

    return attributes;
  }

  /**
   * Creates and returns a set of OTEL attributes for attempt-level metrics.
   * The overall operation status is set at this time based on the last
   * attempt's status.
   * @returns The attempt attributes object.
   */
  private _createAttemptOtelAttributes() {
    if (!this.enabled) return {};
    const attributes = {...this._clientAttributes};
    if (this.currentOperation!.currentAttempt === null) return attributes;
    attributes[METRIC_LABEL_KEY_STATUS] =
      this.currentOperation!.currentAttempt.status;

    return attributes;
  }

  /**
   * Sets the project ID attribute if not already set.
   */
  set projectId(projectId: string) {
    if (!(MONITORED_RES_LABEL_KEY_PROJECT in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_PROJECT] = projectId;
    }
  }

  /**
   * Sets the instance attribute if not already set.
   */
  set instance(instance: string) {
    if (!(MONITORED_RES_LABEL_KEY_INSTANCE in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_INSTANCE] = instance;
    }
  }

  /**
   * Sets the instance config attribute if not already set.
   */
  set instanceConfig(instanceConfig: string) {
    if (!(MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG] =
        instanceConfig;
    }
  }

  /**
   * Sets the location attribute if not already set.
   */
  set location(location: string) {
    if (!(MONITORED_RES_LABEL_KEY_LOCATION in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_LOCATION] = location;
    }
  }

  /**
   * Sets the client hash attribute if not already set.
   */
  set clientHash(clientHash: string) {
    if (!(MONITORED_RES_LABEL_KEY_CLIENT_HASH in this._clientAttributes)) {
      this._clientAttributes[MONITORED_RES_LABEL_KEY_CLIENT_HASH] = clientHash;
    }
  }

  /**
   * Sets the client UID attribute if not already set.
   */
  set clientUid(clientUid: string) {
    if (!(METRIC_LABEL_KEY_CLIENT_UID in this._clientAttributes)) {
      this._clientAttributes[METRIC_LABEL_KEY_CLIENT_UID] = clientUid;
    }
  }

  /**
   * Sets the client name attribute if not already set.
   */
  set clientName(clientName: string) {
    if (!(METRIC_LABEL_KEY_CLIENT_NAME in this._clientAttributes)) {
      this._clientAttributes[METRIC_LABEL_KEY_CLIENT_NAME] = clientName;
    }
  }

  /**
   * Sets the database attribute if not already set.
   */
  set database(database: string) {
    if (!(METRIC_LABEL_KEY_DATABASE in this._clientAttributes)) {
      this._clientAttributes[METRIC_LABEL_KEY_DATABASE] = database;
    }
  }

  /**
   * Sets the method name attribute if not already set, and stores it for later use.
   */
  set methodName(methodName: string) {
    if (!(METRIC_LABEL_KEY_METHOD in this._clientAttributes)) {
      this._methodName = methodName;
      this._clientAttributes[METRIC_LABEL_KEY_METHOD] = methodName;
    }
  }
}
