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

export const SPANNER_METER_NAME = 'spanner-nodejs';
export const CLIENT_METRICS_PREFIX = 'spanner.googleapis.com/internal/client';
export const SPANNER_RESOURCE_TYPE = 'spanner_instance_client';

// Monitored resource labels
export const MONITORED_RES_LABEL_KEY_PROJECT = 'project_id';
export const MONITORED_RES_LABEL_KEY_INSTANCE = 'instance_id';
export const MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG = 'instance_config';
export const MONITORED_RES_LABEL_KEY_LOCATION = 'location';
export const MONITORED_RES_LABEL_KEY_CLIENT_HASH = 'client_hash';
export const MONITORED_RESOURCE_LABELS = new Set([
  MONITORED_RES_LABEL_KEY_PROJECT,
  MONITORED_RES_LABEL_KEY_INSTANCE,
  MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG,
  MONITORED_RES_LABEL_KEY_LOCATION,
  MONITORED_RES_LABEL_KEY_CLIENT_HASH,
]);

// Metric labels
export const METRIC_LABEL_KEY_CLIENT_UID = 'client_uid';
export const METRIC_LABEL_KEY_CLIENT_NAME = 'client_name';
export const METRIC_LABEL_KEY_DATABASE = 'database';
export const METRIC_LABEL_KEY_METHOD = 'method';
export const METRIC_LABEL_KEY_STATUS = 'status';
export const METRIC_LABELS = new Set([
  METRIC_LABEL_KEY_CLIENT_UID,
  METRIC_LABEL_KEY_CLIENT_NAME,
  METRIC_LABEL_KEY_DATABASE,
  METRIC_LABEL_KEY_METHOD,
  METRIC_LABEL_KEY_STATUS,
]);

// Metric names
export const METRIC_NAME_OPERATION_LATENCIES = 'operation_latencies';
export const METRIC_NAME_ATTEMPT_LATENCIES = 'attempt_latencies';
export const METRIC_NAME_OPERATION_COUNT = 'operation_count';
export const METRIC_NAME_ATTEMPT_COUNT = 'attempt_count';
export const METRIC_NAME_GFE_LATENCIES = 'gfe_latencies';
export const METRIC_NAME_GFE_CONNECTIVITY_ERROR_COUNT =
  'gfe_connectivity_error_count';
export const METRIC_NAMES = new Set([
  METRIC_NAME_OPERATION_LATENCIES,
  METRIC_NAME_ATTEMPT_LATENCIES,
  METRIC_NAME_GFE_LATENCIES,
  METRIC_NAME_OPERATION_COUNT,
  METRIC_NAME_ATTEMPT_COUNT,
  METRIC_NAME_GFE_CONNECTIVITY_ERROR_COUNT,
]);
