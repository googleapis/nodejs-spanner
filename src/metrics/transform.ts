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

import {
  Histogram,
  MetricData,
  DataPoint,
  DataPointType,
  ExponentialHistogram,
  ResourceMetrics,
} from '@opentelemetry/sdk-metrics';
import {MonitoredResource} from '@google-cloud/opentelemetry-resource-util';
import * as path from 'path';
import {MetricKind, ValueType} from './external-types';
import {monitoring_v3} from 'googleapis';
import {PreciseDate} from '@google-cloud/precise-date';
import {
  SPANNER_METER_NAME,
  CLIENT_METRICS_PREFIX,
  SPANNER_RESOURCE_TYPE,
  METRIC_LABELS,
  MONITORED_RESOURCE_LABELS,
  METRIC_NAMES,
} from './constants';

/** Transforms a OpenTelemetry instrument type to a GCM MetricKind. */
function _transformMetricKind(metric: MetricData): MetricKind {
  switch (metric.dataPointType) {
    case DataPointType.SUM:
      return metric.isMonotonic ? MetricKind.CUMULATIVE : MetricKind.GAUGE;
    case DataPointType.GAUGE:
      return MetricKind.GAUGE;
    case DataPointType.HISTOGRAM:
    case DataPointType.EXPONENTIAL_HISTOGRAM:
      return MetricKind.CUMULATIVE;
    default:
      exhaust(metric);
      // No logging needed as it will be done in transformPoints()
      return MetricKind.UNSPECIFIED;
  }
}

/** Transforms resource to Google Cloud Monitoring monitored resource */
function _transformResource(labels: {
  [key: string]: string;
}): MonitoredResource {
  return {
    type: SPANNER_RESOURCE_TYPE,
    labels: labels,
  } as MonitoredResource;
}

/** Transforms a OpenTelemetry ValueType to a GCM ValueType. */
function _transformValueType(metric: MetricData): ValueType {
  const {
    dataPointType,
    descriptor: {name},
  } = metric;

  if (
    dataPointType === DataPointType.HISTOGRAM ||
    dataPointType === DataPointType.EXPONENTIAL_HISTOGRAM
  ) {
    return ValueType.DISTRIBUTION;
  } else if (name.includes('count')) {
    return ValueType.INT64;
  }
  console.info('Encountered unexpected metric %s', name);
  return ValueType.VALUE_TYPE_UNSPECIFIED;
}

/**
 * Convert the metrics data to a list of Google Cloud Monitoring time series.
 */
export function transformResourceMetricToTimeSeriesArray({
  scopeMetrics,
}: ResourceMetrics): monitoring_v3.Schema$TimeSeries[] {
  if (!scopeMetrics) return [];

  return (
    scopeMetrics
      // Only keep those whose scope.name matches 'spanner-nodejs'.
      .filter(({scope: {name}}) => name === SPANNER_METER_NAME)
      // Takes each metric array and flattens it into one array
      .flatMap(({metrics}) =>
        // Only keeps metrics that match our spanner metric names
        metrics.filter(metric => METRIC_NAMES.has(metric.descriptor.name)),
      )
      // Flatmap the data points in each metric to create a TimeSeries for each point
      .flatMap(metric =>
        metric.dataPoints.flatMap(dataPoint =>
          _createTimeSeries(metric, dataPoint),
        ),
      )
  );
}
/**
 * Creates a GCM TimeSeries.
 */
function _createTimeSeries<T>(
  metric: MetricData,
  dataPoint: DataPoint<T>,
): monitoring_v3.Schema$TimeSeries {
  const type = path.posix.join(CLIENT_METRICS_PREFIX, metric.descriptor.name);
  const {metricLabels: labels, monitoredResourceLabels} =
    _extractLabels(dataPoint);
  const transformedMetric = {
    type,
    labels,
  } as monitoring_v3.Schema$Metric;

  return {
    metric: transformedMetric,
    resource: _transformResource(monitoredResourceLabels),
    metricKind: _transformMetricKind(metric),
    valueType: _transformValueType(metric),
    points: [_transformPoint(metric, dataPoint)],
    unit: metric.descriptor.unit,
  };
}

/**
 * Transform timeseries's point, so that metric can be uploaded to GCM.
 */
function _transformPoint<T>(
  metric: MetricData,
  dataPoint: DataPoint<T>,
): monitoring_v3.Schema$Point {
  switch (metric.dataPointType) {
    case DataPointType.SUM:
    case DataPointType.GAUGE:
      return {
        value: _transformNumberValue(
          _transformValueType(metric),
          dataPoint.value as number,
        ),
        interval: {
          // Add start time for non-gauge points
          ...(metric.dataPointType === DataPointType.SUM && metric.isMonotonic
            ? {
                startTime: new PreciseDate(dataPoint.startTime).toISOString(),
              }
            : null),
          endTime: new PreciseDate(dataPoint.endTime).toISOString(),
        },
      };
    case DataPointType.HISTOGRAM:
      return {
        value: _transformHistogramValue(dataPoint.value as Histogram),
        interval: {
          startTime: new PreciseDate(dataPoint.startTime).toISOString(),
          endTime: new PreciseDate(dataPoint.endTime).toISOString(),
        },
      };
    case DataPointType.EXPONENTIAL_HISTOGRAM:
      return {
        value: _transformExponentialHistogramValue(
          dataPoint.value as ExponentialHistogram,
        ),
        interval: {
          startTime: new PreciseDate(dataPoint.startTime).toISOString(),
          endTime: new PreciseDate(dataPoint.endTime).toISOString(),
        },
      };
    default:
      exhaust(metric);
      return {
        value: dataPoint.value as monitoring_v3.Schema$TypedValue,
        interval: {
          endTime: new PreciseDate(dataPoint.endTime).toISOString(),
        },
      };
  }
}

/** Extracts metric and monitored resource labels from data point */
function _extractLabels<T>({attributes = {}}: DataPoint<T>) {
  return Object.entries(attributes).reduce(
    (result, [key, value]) => {
      const normalizedKey = _normalizeLabelKey(key);
      const val = value?.toString();

      if (METRIC_LABELS.has(key)) result.metricLabels[normalizedKey] = val;

      if (MONITORED_RESOURCE_LABELS.has(key))
        result.monitoredResourceLabels[normalizedKey] = val;

      return result;
    },
    {metricLabels: {}, monitoredResourceLabels: {}},
  );
}

function _normalizeLabelKey(key: string): string {
  // Replace characters which are not Letter or Decimal_Number unicode category with "_", see
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Unicode_Property_Escapes
  //
  // Reimplementation of reference impl in Go:
  // https://github.com/GoogleCloudPlatform/opentelemetry-operations-go/blob/e955c204f4f2bfdc92ff0ad52786232b975efcc2/exporter/metric/metric.go#L595-L604
  let sanitized = key.replace(/[^\p{Letter}\p{Decimal_Number}_]/gu, '_');

  if (sanitized[0].match(/\p{Decimal_Number}/u)) {
    sanitized = 'key_' + sanitized;
  }
  return sanitized;
}

/** Transforms a OpenTelemetry Point's value to a GCM Point value. */
function _transformNumberValue(
  valueType: ValueType,
  value: number,
): monitoring_v3.Schema$TypedValue {
  if (valueType === ValueType.INT64) {
    return {int64Value: value.toString()};
  } else if (valueType === ValueType.DOUBLE) {
    return {doubleValue: value};
  }
  throw Error(`unsupported value type: ${valueType}`);
}

function _transformHistogramValue(
  value: Histogram,
): monitoring_v3.Schema$TypedValue {
  return {
    distributionValue: {
      // sumOfSquaredDeviation param not aggregated
      count: value.count.toString(),
      mean: value.count && value.sum ? value.sum / value.count : 0,
      bucketOptions: {
        explicitBuckets: {bounds: value.buckets.boundaries},
      },
      bucketCounts: value.buckets.counts.map(value => value.toString()),
    },
  };
}

function _transformExponentialHistogramValue(
  value: ExponentialHistogram,
): monitoring_v3.Schema$TypedValue {
  // Adapated from reference impl in Go which has more explanatory comments
  // https://github.com/GoogleCloudPlatform/opentelemetry-operations-go/blob/v1.8.0/exporter/collector/metrics.go#L582
  const underflow =
    value.zeroCount +
    value.negative.bucketCounts.reduce((prev, current) => prev + current, 0);
  const bucketCounts = [
    underflow,
    ...value.positive.bucketCounts,
    0, // overflow bucket is always empty
  ];

  let bucketOptions: monitoring_v3.Schema$BucketOptions;
  if (value.positive.bucketCounts.length === 0) {
    bucketOptions = {
      explicitBuckets: {bounds: []},
    };
  } else {
    const growthFactor = Math.pow(2, Math.pow(2, -value.scale)); //exp2(exp2(-value.scale));
    const scale = Math.pow(growthFactor, value.positive.offset);
    bucketOptions = {
      exponentialBuckets: {
        growthFactor,
        scale,
        numFiniteBuckets: bucketCounts.length - 2,
      },
    };
  }

  const mean =
    value.sum === undefined || value.count === 0 ? 0 : value.sum / value.count;

  return {
    distributionValue: {
      // sumOfSquaredDeviation param not aggregated
      count: value.count.toString(),
      mean,
      bucketOptions,
      bucketCounts: bucketCounts.map(value => value.toString()),
    },
  };
}

/**
 * Assert switch case is exhaustive
 */
function exhaust(switchValue: never) {
  return switchValue;
}

export const _TEST_ONLY = {
  _normalizeLabelKey,
  _transformMetricKind,
  _extractLabels,
  _transformResource,
  _transformPoint,
  _transformValueType,
  transformResourceMetricToTimeSeriesArray,
};
