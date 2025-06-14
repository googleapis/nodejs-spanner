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

import * as crypto from 'crypto';
import * as os from 'os';
import * as process from 'process';
import {v4 as uuidv4} from 'uuid';
import {MeterProvider, MetricReader} from '@opentelemetry/sdk-metrics';
import {Counter, Histogram, createNoopMeter} from '@opentelemetry/api';
import {detectResources, Resource} from '@opentelemetry/resources';
import {GcpDetectorSync} from '@google-cloud/opentelemetry-resource-util';
import * as Constants from './constants';
import {MetricsTracer} from './metrics-tracer';
const version = require('../../../package.json').version;

export class MetricsTracerFactory {
  private static _instance: MetricsTracerFactory | null = null;
  private _meterProvider: MeterProvider | null = null;
  private _instrumentAttemptCounter!: Counter;
  private _instrumentAttemptLatency!: Histogram;
  private _instrumentOperationCounter!: Counter;
  private _instrumentOperationLatency!: Histogram;
  private _instrumentGfeConnectivityErrorCount!: Counter;
  private _instrumentGfeLatency!: Histogram;
  private _clientHash: string;
  private _clientName: string;
  private _clientUid: string;
  private _location = 'global';
  private _projectId: string;
  public static _readers: MetricReader[] = [];
  public enabled: boolean;

  private constructor(enabled = false, projectId: string) {
    this.enabled = enabled;

    this._projectId = projectId;
    this._clientUid = MetricsTracerFactory._generateClientUId();
    this._clientName = `${Constants.SPANNER_METER_NAME}/${version}`;
    (async () => {
      const location = await MetricsTracerFactory._detectClientLocation();
      this._location = location.length > 0 ? location : 'global';
    })().catch(error => {
      throw error;
    });
    this._clientHash = MetricsTracerFactory._generateClientHash(
      this._clientUid,
    );
  }

  public static getInstance(enabled = false, projectId = '') {
    // Create a singleton instance, enabling/disabling metrics can only be done on the initial call
    if (MetricsTracerFactory._instance === null) {
      MetricsTracerFactory._instance = new MetricsTracerFactory(
        enabled,
        projectId,
      );
    }
    return MetricsTracerFactory._instance;
  }

  public getMeterProvider(readers: MetricReader[] = []): MeterProvider {
    if (this._meterProvider === null) {
      const resource = new Resource({
        [Constants.MONITORED_RES_LABEL_KEY_PROJECT]: this._projectId,
        [Constants.MONITORED_RES_LABEL_KEY_CLIENT_HASH]: this._clientHash,
        [Constants.MONITORED_RES_LABEL_KEY_LOCATION]: this._location,
        [Constants.METRIC_LABEL_KEY_CLIENT_NAME]: this._clientName,
        [Constants.METRIC_LABEL_KEY_CLIENT_UID]: this._clientUid,
      });
      MetricsTracerFactory._readers = readers;
      this._meterProvider = new MeterProvider({
        resource: resource,
        readers: readers,
      });
      this._createMetricInstruments();
    }

    return this._meterProvider;
  }

  public static resetInstance() {
    MetricsTracerFactory._instance = null;
  }

  public resetMeterProvider() {
    this._meterProvider = null;
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

  public createMetricsTracer(
    project = '',
    instance = '',
    database = '',
  ): MetricsTracer | null {
    if (!this.enabled) {
      return null;
    }
    const tracer = new MetricsTracer(
      this._instrumentAttemptCounter,
      this._instrumentAttemptLatency,
      this._instrumentOperationCounter,
      this._instrumentOperationLatency,
      this._instrumentGfeConnectivityErrorCount,
      this._instrumentGfeLatency,
      this.enabled,
    );
    tracer.projectId = project;
    tracer.instance = instance;
    tracer.instanceConfig = 'unknown';
    tracer.database = database;
    tracer.location = this._location;
    tracer.clientName = this._clientName;
    tracer.clientUid = this._clientUid;
    tracer.clientHash = this._clientHash;
    return tracer;
  }

  /**
   * Takes a formatted name and parses the project, instance, and database.
   */
  public getInstanceAttributes(formattedName: string) {
    const regex =
      /projects\/(?<projectId>[^/]+)\/instances\/(?<instanceId>[^/]+)(?:\/databases\/(?<databaseId>[^/]+))?/;
    const match = formattedName.match(regex);
    const project = match?.groups?.projectId || '';
    const instance = match?.groups?.instanceId || '';
    const database = match?.groups?.databaseId || '';
    return {project: project, instance: instance, database: database};
  }

  private _createMetricInstruments() {
    if (!this.enabled) {
      return;
    }

    const meter = this.getMeterProvider().getMeter(
      Constants.SPANNER_METER_NAME,
      version,
    );
    this._instrumentAttemptLatency = meter.createHistogram(
      Constants.METRIC_NAME_ATTEMPT_LATENCIES,
      {unit: 'ms', description: 'Time an individual attempt took.'},
    );

    this._instrumentAttemptCounter = meter.createCounter(
      Constants.METRIC_NAME_ATTEMPT_COUNT,
      {unit: '1', description: 'Number of attempts.'},
    );

    this._instrumentOperationLatency = meter.createHistogram(
      Constants.METRIC_NAME_OPERATION_LATENCIES,
      {
        unit: 'ms',
        description:
          'Total time until final operation success or failure, including retries and backoff.',
      },
    );

    this._instrumentOperationCounter = meter.createCounter(
      Constants.METRIC_NAME_OPERATION_COUNT,
      {unit: '1', description: 'Number of operations.'},
    );

    this._instrumentGfeLatency = meter.createHistogram(
      Constants.METRIC_NAME_GFE_LATENCIES,
      {
        unit: 'ms',
        description:
          "Latency between Google's network receiving an RPC and reading back the first byte of the response",
      },
    );

    this._instrumentGfeConnectivityErrorCount = meter.createCounter(
      Constants.METRIC_NAME_GFE_CONNECTIVITY_ERROR_COUNT,
      {
        unit: '1',
        description:
          'Number of requests that failed to reach the Google network.',
      },
    );
  }

  /**
   * Generates a unique identifier for the client_uid metric field. The identifier is composed of a
   * UUID, the process ID (PID), and the hostname.
   */
  private static _generateClientUId(): string {
    const identifier = uuidv4();
    const pid = process.pid.toString();
    let hostname = 'localhost';

    try {
      hostname = os.hostname();
    } catch (err) {
      console.warn('Unable to get the hostname.', err);
    }

    return `${identifier}@${pid}@${hostname}`;
  }

  /**
   * Generates a 6-digit zero-padded lowercase hexadecimal hash using the 10 most significant bits
   * of a 64-bit hash value.
   *
   * The primary purpose of this function is to generate a hash value for the `client_hash`
   * resource label using `client_uid` metric field. The range of values is chosen to be small
   * enough to keep the cardinality of the Resource targets under control. Note: If at later time
   * the range needs to be increased, it can be done by increasing the value of `kPrefixLength` to
   * up to 24 bits without changing the format of the returned value.
   */
  private static _generateClientHash(clientUid: string): string {
    if (clientUid === null || clientUid === undefined) {
      return '000000';
    }

    const hash = crypto.createHash('sha256');
    hash.update(clientUid);
    const digest = hash.digest('hex');
    const hashPart = digest.substring(0, 16);
    const longHash = BigInt('0x' + hashPart);
    const kPrefixLength = 10;
    const shiftedValue = longHash >> BigInt(64 - kPrefixLength);
    return shiftedValue.toString(16).padStart(6, '0');
  }

  /**
   * Gets the location (region) of the client, otherwise returns to the "global" region.
   */
  private static async _detectClientLocation(): Promise<string> {
    const defaultRegion = 'global';
    try {
      const resource = await detectResources({
        detectors: [new GcpDetectorSync()],
      });

      await resource?.waitForAsyncAttributes?.();

      const region = resource.attributes[Constants.ATTR_CLOUD_REGION];
      if (typeof region === 'string' && region) {
        return region;
      }
    } catch (err) {
      console.warn('Unable to detect location.', err);
    }
    return defaultRegion;
  }
}
