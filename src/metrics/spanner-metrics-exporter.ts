// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {PushMetricExporter, ResourceMetrics} from '@opentelemetry/sdk-metrics';
import {
  ExportResult,
  ExportResultCode,
  SDK_INFO
} from '@opentelemetry/core';
import {ExporterOptions} from './external-types';
import {GoogleAuth, JWT} from 'google-auth-library';
import {monitoring_v3} from 'googleapis';
import {transformResourceMetricToTimeSeriesArray} from './transform';
import {status} from '@grpc/grpc-js';
const version = require('../../../package.json').version;

// Stackdriver Monitoring v3 only accepts up to 200 TimeSeries per
// CreateTimeSeries call.
const MAX_BATCH_EXPORT_SIZE = 200;
const VERSION = version;
const OT_VERSION = SDK_INFO['telemetry.sdk.version'];
const OT_USER_AGENTS = [
  {
    product: 'opentelemetry-js',
    version: OT_VERSION,
  },
  {
    product: 'google-cloud-metric-exporter',
    version: VERSION,
  },
];
const OT_REQUEST_HEADER = {
  'x-opentelemetry-outgoing-request': 0x1,
};

const DEFAULT_API_ENDPOINT = 'monitoring.googleapis.com:443';
/**
 * Format and sends metrics information to Google Cloud Monitoring.
 */
export class CloudMonitoringMetricsExporter implements PushMetricExporter {
  private _projectId: string | void | Promise<string | void>;
  private readonly _auth: GoogleAuth;

  private _monitoring: monitoring_v3.Monitoring;

  constructor({auth, userAgent, apiEndpoint}: ExporterOptions) {
    this._auth = auth;

    this._monitoring = new monitoring_v3.Monitoring({
      rootUrl: `https://${apiEndpoint || DEFAULT_API_ENDPOINT}`,
      headers: OT_REQUEST_HEADER,
      userAgentDirectives: OT_USER_AGENTS.concat(userAgent ? [userAgent] : []),
    });

    // Start this async process as early as possible. It will be
    // awaited on the first export because constructors are synchronous
    this._projectId = this._auth.getProjectId().catch(err => {
      console.error(err);
    });
  }

  /**
   * Implementation for {@link PushMetricExporter.export}.
   * Calls the async wrapper method {@link _exportAsync} and
   * assures no rejected promises bubble up to the caller.
   *
   * @param metrics Metrics to be sent to the Google Cloud Monitoring backend
   * @param resultCallback result callback to be called on finish
   */
  export(
    metrics: ResourceMetrics,
    resultCallback: (result: ExportResult) => void
  ): void {
    this._exportAsync(metrics).then(resultCallback, err => {
      console.error(err.message);
      resultCallback({code: ExportResultCode.FAILED, error: err});
    });
  }

  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}

  /**
   * Asnyc wrapper for the {@link export} implementation.
   * Writes the current values of all exported {@link MetricRecord}s
   * to the Google Cloud Monitoring backend.
   *
   * @param resourceMetrics Metrics to be sent to the Google Cloud Monitoring backend
   */
  private async _exportAsync(
    resourceMetrics: ResourceMetrics
  ): Promise<ExportResult> {
    if (this._projectId instanceof Promise) {
      this._projectId = await this._projectId;
    }

    if (!this._projectId) {
      const error = new Error('expecting a non-blank ProjectID');
      console.error(error.message);
      return {code: ExportResultCode.FAILED, error};
    }

    const timeSeriesList: monitoring_v3.Schema$TimeSeries[] =
      transformResourceMetricToTimeSeriesArray(resourceMetrics);

    let failure: {sendFailed: false} | {sendFailed: true; error: Error} = {
      sendFailed: false,
    };
    await Promise.all(
      this._partitionList(timeSeriesList, MAX_BATCH_EXPORT_SIZE).map(
        async batchedTimeSeries => this._sendTimeSeries(batchedTimeSeries)
      )
    ).catch(e => {
      const error = e as {code: number};
      if (error.code === status.PERMISSION_DENIED) {
        console.warn(
          `Need monitoring metric writer permission on project ${this._projectId}. Follow https://cloud.google.com/spanner/docs/view-manage-client-side-metrics#access-client-side-metrics to set up permissions`
        );
      }
      const err = asError(e);
      err.message = `Send TimeSeries failed: ${err.message}`;
      failure = {sendFailed: true, error: err};
      console.error(`ERROR: ${err.message}`);
    });

    return failure.sendFailed
      ? {
          code: ExportResultCode.FAILED,
          error: (failure as {sendFailed: boolean; error: Error}).error,
        }
      : {code: ExportResultCode.SUCCESS};
  }

  private async _sendTimeSeries(timeSeries: monitoring_v3.Schema$TimeSeries[]) {
    if (timeSeries.length === 0) {
      return Promise.resolve();
    }

    const authClient = await this._authorize();
    // await this._monitoring.projects.timeSeries.createService({
    //   name: `projects/${this._projectId}`,
    //   requestBody: {timeSeries},
    //   auth: authClient,
    // });
  }

  /** Returns the minimum number of arrays of max size chunkSize, partitioned from the given array. */
  private _partitionList(
    list: monitoring_v3.Schema$TimeSeries[],
    chunkSize: number
  ) {
    return Array.from({length: Math.ceil(list.length / chunkSize)}, (_, i) =>
      list.slice(i * chunkSize, (i + 1) * chunkSize)
    );
  }

  /**
   * Gets the Google Application Credentials from the environment variables
   * and authenticates the client.
   */
  private async _authorize(): Promise<JWT> {
    return this._auth.getClient() as Promise<JWT>;
  }
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
