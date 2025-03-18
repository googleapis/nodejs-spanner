import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  MeterProvider,
  MetricReader,
  ResourceMetrics,
} from '@opentelemetry/sdk-metrics';
import {CloudMonitoringMetricsExporter} from '../../src/metrics/spanner-metrics-exporter';
import {
  GAX_METER_NAME,
  METRIC_NAME_ATTEMPT_COUNT,
  METRIC_NAME_ATTEMPT_LATENCIES,
  METRIC_NAME_OPERATION_COUNT,
  METRIC_NAME_OPERATION_LATENCIES,
  METRIC_NAME_GFE_MISSING_HEADER_COUNT,
  METRIC_NAME_GFE_LATENCY,
} from '../../src/metrics/constants';
import {Counter, Meter, Histogram} from '@opentelemetry/api';
import {ExportResult, ExportResultCode} from '@opentelemetry/core';

const PROJECT_ID = 'test_projectid';
const INSTANCE_ID = 'test_instance';
const DATABASE_ID = 'test_db';

// Ensure custom exporter is valid
describe('CustomExporter', () => {
  beforeEach(() => {
    process.env.GCLOUD_PROJECT = PROJECT_ID;
  });

  it('should construct an exporter', () => {
    const exporter = new CloudMonitoringMetricsExporter();
    assert.ok(typeof exporter.export === 'function');
    assert.ok(typeof exporter.shutdown === 'function');
  });

  it('should construct an exporter with credentials', () => {
    const exporter = new CloudMonitoringMetricsExporter({
      authOptions: {
        credentials: {
          client_email: 'noreply@fake.example.com',
          private_key: 'this is a key',
        },
      },
    });

    assert(exporter);
    return (exporter['_projectId'] as Promise<string>).then(id => {
      assert.deepStrictEqual(id, PROJECT_ID);
    });
  });

  it('should be able to shutdown', async () => {
    const exporter = new CloudMonitoringMetricsExporter();
    await assert.doesNotReject(exporter.shutdown());
  });

  it('should be able to force flush', async () => {
    const exporter = new CloudMonitoringMetricsExporter();
    await assert.doesNotReject(exporter.forceFlush());
  });
});

// Verify that the export call will convert and send the requests out.
describe('Export', () => {
  class InMemoryMetricReader extends MetricReader {
    protected async onShutdown(): Promise<void> {}
    protected async onForceFlush(): Promise<void> {}
  }
  let reader: MetricReader;
  let meterProvider: MeterProvider;
  let meter: Meter;
  let attempt_counter: Counter;
  let operation_counter: Counter;
  let gfe_missing_header_count: Counter;
  let attempt_latency: Histogram;
  let operation_latency: Histogram;
  let gfe_latencey: Histogram;
  let metricAttributes: {[key: string]: string};
  let exporter: CloudMonitoringMetricsExporter;

  beforeEach(() => {
    reader = new InMemoryMetricReader();
    meterProvider = new MeterProvider({
      readers: [reader],
    });
    meter = meterProvider.getMeter(GAX_METER_NAME);
    metricAttributes = {
      project_id: PROJECT_ID,
      instance_id: INSTANCE_ID,
      instance_config: 'test_config',
      location: 'test_location',
      client_hash: 'test_hash',
      client_uid: 'test_uid',
      client_name: 'test_name',
      database: DATABASE_ID,
      method: 'test_method',
      status: 'test_status',
      directpath_enabled: 'true',
      directpath_used: 'false',
      other: 'ignored',
    };

    attempt_counter = meter.createCounter(METRIC_NAME_ATTEMPT_COUNT, {
      description: 'Count of attempts',
      unit: '1',
    });

    operation_counter = meter.createCounter(METRIC_NAME_OPERATION_COUNT, {
      description: 'Count of operations',
      unit: '1',
    });

    gfe_missing_header_count = meter.createCounter(
      METRIC_NAME_GFE_MISSING_HEADER_COUNT,
      {
        description: 'Count of missing headers',
        unit: '1',
      }
    );

    attempt_latency = meter.createHistogram(METRIC_NAME_ATTEMPT_LATENCIES, {
      description: 'Test attempt latencies in ms',
      unit: 'ms',
    });

    operation_latency = meter.createHistogram(METRIC_NAME_OPERATION_LATENCIES, {
      description: 'Test operation latencies in ms',
      unit: 'ms',
    });

    gfe_latencey = meter.createHistogram(METRIC_NAME_GFE_LATENCY, {
      description: 'Test GFE latencies in ms',
      unit: 'ms',
    });

    exporter = new CloudMonitoringMetricsExporter();
  });

  it('should export GCM metrics', async () => {
    attempt_counter.add(10, metricAttributes);
    operation_counter.add(25, metricAttributes);
    gfe_missing_header_count.add(12, metricAttributes);
    attempt_latency.record(30, metricAttributes);
    operation_latency.record(45, metricAttributes);
    gfe_latencey.record(22, metricAttributes);

    const {errors, resourceMetrics} = await reader.collect();
    if (errors.length !== 0) {
      throw errors;
    }

    const sendTimeSeriesStub = sinon
      .stub(exporter as any, '_sendTimeSeries')
      .resolves();

    await new Promise<ExportResult>(resolve => {
      exporter.export(resourceMetrics, result => {
        if (result.error) {
          console.error(result.error);
        }
        resolve(result);
      });
    });

    assert(sendTimeSeriesStub.calledOnce);

    const [timeseries] = sendTimeSeriesStub.getCall(0).args;

    assert.strictEqual(timeseries.length, 6);
  });

  it('should exit early if resource metrics are empty', async () => {
    const {errors, resourceMetrics} = await reader.collect();

    if (errors.length !== 0) {
      throw errors;
    }
    const sendTimeSeriesStub = sinon
      .stub(exporter as any, '_sendTimeSeries')
      .resolves();

    await new Promise<ExportResult>(resolve => {
      exporter.export(resourceMetrics, result => {
        if (result.error) {
          console.error(result.error);
        }
        resolve(result);
      });
    });

    assert(sendTimeSeriesStub.notCalled);
  });

  it('should handle failed send during time series export with callback', async () => {
    const sendTimeSeriesStub = sinon
      .stub(exporter as any, '_sendTimeSeries')
      .rejects(new Error('Network error'));

    attempt_counter.add(10, metricAttributes);

    const {resourceMetrics} = await reader.collect();

    const resultCallbackSpy = sinon.spy();

    exporter.export(resourceMetrics, resultCallbackSpy);

    await new Promise(resolve => setImmediate(resolve));

    const callbackResult = resultCallbackSpy.getCall(0).args[0];
    assert.strictEqual(callbackResult.code, ExportResultCode.FAILED);
    assert.strictEqual(
      callbackResult.error.message,
      'Send TimeSeries failed: Network error'
    );

    assert(sendTimeSeriesStub.calledOnce);
  });
});
