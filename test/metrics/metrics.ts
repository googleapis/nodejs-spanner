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

import * as sinon from 'sinon';
import * as assert from 'assert';

import {grpc} from 'google-gax';
import * as mock from '../mockserver/mockspanner';
import {MockError, SimulatedExecutionTime} from '../mockserver/mockspanner';
import {Database, Instance, Spanner} from '../../src';
import {MetricsTracerFactory} from '../../src/metrics/metrics-tracer-factory';
import {MetricsTracer} from '../../src/metrics/metrics-tracer';
import {MetricReader} from '@opentelemetry/sdk-metrics';
import {
  METRIC_NAME_OPERATION_LATENCIES,
  METRIC_NAME_ATTEMPT_LATENCIES,
  METRIC_NAME_OPERATION_COUNT,
  METRIC_NAME_ATTEMPT_COUNT,
  METRIC_NAME_GFE_LATENCIES,
  METRIC_NAME_GFE_CONNECTIVITY_ERROR_COUNT,
} from '../../src/metrics/constants';

describe('Test metrics with mock server', () => {
  let sandbox: sinon.SinonSandbox;
  let instance: Instance;
  let spanner: Spanner;
  let port: number;
  let dbCounter = 0;
  const selectSql = 'SELECT NUM, NAME FROM NUMBERS';
  const server = new grpc.Server();
  const spannerMock = mock.createMockSpanner(server);

  class InMemoryMetricReader extends MetricReader {
    protected async onForceFlush(): Promise<void> {}
    protected async onShutdown(): Promise<void> {}
  }

  function newTestDatabase(): Database {
    return instance.database(`database-${++dbCounter}`, undefined);
  }

  function assertApprox(expected: number, actual: number, delta: number) {
    assert.ok(
      Math.abs(expected - actual) <= delta,
      `Expected value of ${expected} and actual value of ${actual} is greater than the approximation delta (${delta})`,
    );
  }

  function compareAttributes(expected: object, actual: object): boolean {
    // Check that all expected keys match in actual
    for (const key of Object.keys(expected)) {
      if ((actual as any)[key] !== (expected as any)[key]) {
        return false;
      }
    }
    // Check that actual does not contain extra keys
    for (const key of Object.keys(actual)) {
      // Check if the key in 'actual' is not present in 'expected'
      if (!Object.prototype.hasOwnProperty.call(expected, key)) {
        return false;
      }
    }
    return true;
  }

  function getMetricData(resourceMetrics, metricName: string) {
    const filteredMetrics = resourceMetrics.scopeMetrics.flatMap(scopeMetric =>
      scopeMetric.metrics.filter(
        metric => metric.descriptor.name === metricName,
      ),
    );
    assert.ok(
      filteredMetrics.length > 0,
      `No metric entry found with name: ${metricName}`,
    );
    assert.strictEqual(
      filteredMetrics.length,
      1,
      `Found multiple metrics with name: ${metricName}`,
    );
    return filteredMetrics[0];
  }

  function hasMetricData(resourceMetrics, metricName: string): boolean {
    const filteredMetrics = resourceMetrics.scopeMetrics.flatMap(scopeMetric =>
      scopeMetric.metrics.filter(
        metric => metric.descriptor.name === metricName,
      ),
    );
    return filteredMetrics.length > 0;
  }

  function getAggregatedValue(metricsData: any, attributes: any) {
    const dataPoint = metricsData.dataPoints.filter(dp =>
      compareAttributes(dp.attributes, attributes),
    );
    assert.strictEqual(
      dataPoint.length,
      1,
      `Failed to filter for attribute values.`,
    );
    switch (metricsData.descriptor.type) {
      case 'HISTOGRAM':
        return dataPoint[0].value.sum / dataPoint[0].value.count;
      case 'COUNTER':
        return dataPoint[0].value;
      default:
        return 0;
    }
  }

  async function setupMockSpanner() {
    sandbox = sinon.createSandbox();
    port = await new Promise((resolve, reject) => {
      server.bindAsync(
        '0.0.0.0:0',
        grpc.ServerCredentials.createInsecure(),
        (err, assignedPort) => {
          if (err) {
            reject(err);
          } else {
            resolve(assignedPort);
          }
        },
      );
    });
    spannerMock.putStatementResult(
      selectSql,
      mock.StatementResult.resultSet(mock.createSimpleResultSet()),
    );
    MetricsTracerFactory.resetInstance();
    process.env.SPANNER_DISABLE_BUILTIN_METRICS = 'false';
    spanner = new Spanner({
      projectId: 'test-project',
      servicePath: 'localhost',
      port,
      sslCreds: grpc.credentials.createInsecure(),
    });
    instance = spanner.instance('instance');
  }

  before(async () => {
    await setupMockSpanner();
  });

  after(async () => {
    spanner.close();
    server.tryShutdown(() => {});
    delete process.env.SPANNER_EMULATOR_HOST;
    sandbox.restore();
    MetricsTracerFactory.resetInstance();
  });

  describe('With InMemMetricReaderf', async () => {
    let reader: InMemoryMetricReader;
    let factory: MetricsTracerFactory | null;
    let gfeStub;
    const MIN_LATENCY = 0;
    const commonAttributes = {
      instance_id: 'instance',
      status: 'OK',
    };

    beforeEach(async () => {
      spannerMock.resetRequests();
      spannerMock.removeExecutionTimes();
      // Reset the MetricsFactoryReader to an in-memory reader for the tests
      factory = MetricsTracerFactory.getInstance();
      await factory!.resetMeterProvider();
      reader = new InMemoryMetricReader();
      factory!.getMeterProvider([reader]);
    });

    afterEach(() => {
      gfeStub?.restore();
    });

    it('should have correct latency values in metrics', async () => {
      gfeStub = sandbox
        .stub(MetricsTracer.prototype, 'extractGfeLatency')
        .callsFake((header: string) => 123);
      const database = newTestDatabase();
      const startTime = new Date();
      await database.run(selectSql);
      const endTime = new Date();

      const elapsedTime = endTime.valueOf() - startTime.valueOf();

      const methods = ['batchCreateSessions', 'executeStreamingSql'];

      const {resourceMetrics} = await reader.collect();
      const operationCountData = getMetricData(
        resourceMetrics,
        METRIC_NAME_OPERATION_COUNT,
      );
      const gfeLatenciesData = getMetricData(
        resourceMetrics,
        METRIC_NAME_GFE_LATENCIES,
      );
      const attemptCountData = getMetricData(
        resourceMetrics,
        METRIC_NAME_ATTEMPT_COUNT,
      );
      const operationLatenciesData = getMetricData(
        resourceMetrics,
        METRIC_NAME_OPERATION_LATENCIES,
      );
      const attemptLatenciesData = getMetricData(
        resourceMetrics,
        METRIC_NAME_ATTEMPT_LATENCIES,
      );

      let totalOperationLatency = 0;
      methods.forEach(method => {
        const attributes = {
          ...commonAttributes,
          database: `database-${dbCounter}`,
          method: method,
        };
        const operationCount = getAggregatedValue(
          operationCountData,
          attributes,
        );
        assert.strictEqual(operationCount, 1);

        const attemptCount = getAggregatedValue(attemptCountData, attributes);
        assert.strictEqual(attemptCount, 1);

        const operationLatency = getAggregatedValue(
          operationLatenciesData,
          attributes,
        );
        totalOperationLatency += operationLatency;

        const attemptLatency = getAggregatedValue(
          attemptLatenciesData,
          attributes,
        );
        // Since we only have one attempt, the attempt latency should be fairly close to the operation latency
        assertApprox(MIN_LATENCY, attemptLatency, 30);

        const gfeLatency = getAggregatedValue(gfeLatenciesData, attributes);
        assert.strictEqual(gfeLatency, 123);
      });

      // check that the latency matches up with the measured elapsed time within 10ms
      assertApprox(elapsedTime, totalOperationLatency, 10);

      // Make sure no GFE connectivity errors ar emitted since we got GFE latencies
      const gfeMissingData = hasMetricData(
        resourceMetrics,
        METRIC_NAME_GFE_CONNECTIVITY_ERROR_COUNT,
      );

      assert.ok(!gfeMissingData);

      await database.close();
    });

    it('should increase attempts on retries', async () => {
      gfeStub = sandbox
        .stub(MetricsTracer.prototype, 'extractGfeLatency')
        .callsFake((header: string) => 123);
      const database = newTestDatabase();
      const err = {
        message: 'Temporary unavailable',
        code: grpc.status.UNAVAILABLE,
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err),
      );

      await database.run(selectSql);
      const {resourceMetrics} = await reader.collect();

      const operationCountData = getMetricData(
        resourceMetrics,
        METRIC_NAME_OPERATION_COUNT,
      );
      const attemptCountData = getMetricData(
        resourceMetrics,
        METRIC_NAME_ATTEMPT_COUNT,
      );
      const operationLatenciesData = getMetricData(
        resourceMetrics,
        METRIC_NAME_OPERATION_LATENCIES,
      );
      const attemptLatenciesData = getMetricData(
        resourceMetrics,
        METRIC_NAME_ATTEMPT_LATENCIES,
      );
      const gfeLatenciesData = getMetricData(
        resourceMetrics,
        METRIC_NAME_GFE_LATENCIES,
      );

      const sessionAttributes = {
        ...commonAttributes,
        database: `database-${dbCounter}`,
        method: 'batchCreateSessions',
      };
      // Verify batchCreateSession metrics are unaffected
      assert.strictEqual(
        getAggregatedValue(operationCountData, sessionAttributes),
        1,
      );
      getAggregatedValue(operationLatenciesData, sessionAttributes);
      assert.strictEqual(
        getAggregatedValue(attemptCountData, sessionAttributes),
        1,
      );
      getAggregatedValue(attemptLatenciesData, sessionAttributes);
      assert.strictEqual(
        getAggregatedValue(gfeLatenciesData, sessionAttributes),
        123,
      );

      const executeAttributes = {
        ...commonAttributes,
        database: `database-${dbCounter}`,
        method: 'executeStreamingSql',
      };
      // Verify executeStreamingSql has 2 attempts and 1 operation
      assert.strictEqual(
        getAggregatedValue(operationCountData, executeAttributes),
        1,
      );
      getAggregatedValue(operationLatenciesData, executeAttributes);
      assert.strictEqual(
        getAggregatedValue(attemptCountData, executeAttributes),
        2,
      );
      getAggregatedValue(attemptLatenciesData, executeAttributes);
      assert.strictEqual(
        getAggregatedValue(gfeLatenciesData, executeAttributes),
        123,
      );
    });

    it('should create connectivity error count metric if GFE latency is not in header', async () => {
      gfeStub = sandbox
        .stub(MetricsTracer.prototype, 'extractGfeLatency')
        .callsFake((header: string) => null);
      const database = newTestDatabase();
      await database.run(selectSql);
      const {resourceMetrics} = await reader.collect();

      const operationCountData = getMetricData(
        resourceMetrics,
        METRIC_NAME_OPERATION_COUNT,
      );
      const attemptCountData = getMetricData(
        resourceMetrics,
        METRIC_NAME_ATTEMPT_COUNT,
      );
      const operationLatenciesData = getMetricData(
        resourceMetrics,
        METRIC_NAME_OPERATION_LATENCIES,
      );
      const attemptLatenciesData = getMetricData(
        resourceMetrics,
        METRIC_NAME_ATTEMPT_LATENCIES,
      );
      const connectivityErrorCountData = getMetricData(
        resourceMetrics,
        METRIC_NAME_GFE_CONNECTIVITY_ERROR_COUNT,
      );

      // Verify GFE latency doesn't exist
      assert.ok(!hasMetricData(resourceMetrics, METRIC_NAME_GFE_LATENCIES));
      const methods = ['batchCreateSessions', 'executeStreamingSql'];
      methods.forEach(method => {
        const attributes = {
          ...commonAttributes,
          database: `database-${dbCounter}`,
          method: method,
        };
        // Verify attempt and operational metrics are unaffected
        assert.strictEqual(
          getAggregatedValue(operationCountData, attributes),
          1,
        );
        getAggregatedValue(operationLatenciesData, attributes);
        assert.strictEqual(getAggregatedValue(attemptCountData, attributes), 1);
        getAggregatedValue(attemptLatenciesData, attributes);

        // Verify that GFE connectivity error count increased
        assert.strictEqual(
          getAggregatedValue(connectivityErrorCountData, attributes),
          1,
        );
      });
    });
  });
});
