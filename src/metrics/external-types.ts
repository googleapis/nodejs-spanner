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

import {GoogleAuthOptions} from 'google-auth-library';

export interface ExporterOptions {
  /**
   * Optional authentication options for Google services.
   */
  authOptions?: GoogleAuthOptions;
  /**
   * Prefix prepended to OpenTelemetry metric names when writing to Cloud Monitoring. See
   * https://cloud.google.com/monitoring/custom-metrics#identifier for more details.
   *
   * Optional, default is `workload.googleapis.com`.
   */
  prefix?: string;
  /**
   * Add a custom user agent and version strings to all monitoring exports
   */
  userAgent?: {
    product: string;
    version: string;
  };
  /**
   * The api endpoint of the cloud monitoring service. Defaults to
   * monitoring.googleapis.com:443.
   */
  apiEndpoint?: string;
}

export enum MetricKind {
  UNSPECIFIED = 'METRIC_KIND_UNSPECIFIED',
  GAUGE = 'GAUGE',
  DELTA = 'DELTA',
  CUMULATIVE = 'CUMULATIVE',
}

/** The value type of a metric. */
export enum ValueType {
  VALUE_TYPE_UNSPECIFIED = 'VALUE_TYPE_UNSPECIFIED',
  INT64 = 'INT64',
  DOUBLE = 'DOUBLE',
  DISTRIBUTION = 'DISTRIBUTION',
}
