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
import {ExportResult, ExportResultCode} from '@opentelemetry/core';
import {ExporterOptions} from './external-types';
import {MetricServiceClient} from '@google-cloud/monitoring';
import {transformResourceMetricToTimeSeriesArray} from './transform';
import {status} from '@grpc/grpc-js';

// Stackdriver Monitoring v3 only accepts up to 200 TimeSeries per
// CreateTimeSeries call.
export const MAX_BATCH_EXPORT_SIZE = 200;

/**
 * Format and sends metrics information to Google Cloud Monitoring.
 */
export class CloudMonitoringMetricsExporter implements PushMetricExporter {
  private _projectId: string | void | Promise<string | void>;

  private readonly _client: MetricServiceClient;

  constructor({auth}: ExporterOptions) {
    this._client = new MetricServiceClient({auth: auth});

    // Start this async process as early as possible. It will be
    // awaited on the first export because constructors are synchronous
    this._projectId = auth.getProjectId().catch(err => {
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
    resultCallback: (result: ExportResult) => void,
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
    resourceMetrics: ResourceMetrics,
  ): Promise<ExportResult> {
    if (this._projectId instanceof Promise) {
      this._projectId = await this._projectId;
    }

    if (!this._projectId) {
      const error = new Error('expecting a non-blank ProjectID');
      console.error(error.message);
      return {code: ExportResultCode.FAILED, error};
    }

    const timeSeriesList =
      transformResourceMetricToTimeSeriesArray(resourceMetrics);

    let failure: {sendFailed: false} | {sendFailed: true; error: Error} = {
      sendFailed: false,
    };
    await Promise.all(
      this._partitionList(timeSeriesList, MAX_BATCH_EXPORT_SIZE).map(
        async batchedTimeSeries => this._sendTimeSeries(batchedTimeSeries),
      ),
    ).catch(e => {
      const error = e as {code: number};
      if (error.code === status.PERMISSION_DENIED) {
        console.warn(
          `Need monitoring metric writer permission on project ${this._projectId}. Follow https://cloud.google.com/spanner/docs/view-manage-client-side-metrics#access-client-side-metrics to set up permissions`,
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

  private async _sendTimeSeries(timeSeries) {
    if (timeSeries.length === 0) {
      return Promise.resolve();
    }

    // TODO: Use createServiceTimeSeries when it is available
    await this._client.createTimeSeries({
      name: `projects/${this._projectId}`,
      timeSeries: timeSeries,
    });
  }

  /** Returns the minimum number of arrays of max size chunkSize, partitioned from the given array. */
  private _partitionList(list, chunkSize: number) {
    return Array.from({length: Math.ceil(list.length / chunkSize)}, (_, i) =>
      list.slice(i * chunkSize, (i + 1) * chunkSize),
    );
  }
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
