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

import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as Constants from '../../src/metrics/constants';
import {MetricsTracerFactory} from '../../src/metrics/metrics-tracer-factory';
import {CloudMonitoringMetricsExporter} from '../../src/metrics/spanner-metrics-exporter';

describe('MetricsTracerFactory', () => {
  let sandbox: sinon.SinonSandbox;
  let mockExporter: CloudMonitoringMetricsExporter;
  let recordAttemptLatencyStub: sinon.SinonStub;
  let addAttemptCounterStub: sinon.SinonStub;
  let recordOperationLatencyStub: sinon.SinonStub;
  let addOperationCounterStub: sinon.SinonStub;
  let recordGfeLatencyStub: sinon.SinonStub;
  let addGfeConnectivityErrorCountStub: sinon.SinonStub;

  before(() => {
    sandbox = sinon.createSandbox();

    recordAttemptLatencyStub = sandbox.stub();
    addAttemptCounterStub = sandbox.stub();
    recordOperationLatencyStub = sandbox.stub();
    addOperationCounterStub = sandbox.stub();
    recordGfeLatencyStub = sandbox.stub();
    addGfeConnectivityErrorCountStub = sandbox.stub();

    const meterStub = {
      createHistogram: sandbox.stub(),
      createCounter: sandbox.stub(),
    };

    // Stub the methods called by _createMetricInstruments
    meterStub.createHistogram
      .onFirstCall()
      .returns({record: recordAttemptLatencyStub})
      .onSecondCall()
      .returns({record: recordOperationLatencyStub})
      .onThirdCall()
      .returns({record: recordGfeLatencyStub});

    meterStub.createCounter
      .onFirstCall()
      .returns({add: addAttemptCounterStub})
      .onSecondCall()
      .returns({add: addOperationCounterStub})
      .onThirdCall()
      .returns({add: addGfeConnectivityErrorCountStub});

    sandbox.stub(MeterProvider.prototype, 'getMeter').returns(meterStub as any);

    // metrics provider and related objects
    mockExporter = sandbox.createStubInstance(CloudMonitoringMetricsExporter);
    MetricsTracerFactory.resetInstance();
    const provider = MetricsTracerFactory.getInstance(true).getMeterProvider();
    const reader = new PeriodicExportingMetricReader({
      exporter: mockExporter,
      exportIntervalMillis: 60000,
    });
    provider.addMetricReader(reader);
  });

  after(() => {
    sandbox.restore();
    MetricsTracerFactory.getInstance(true).resetMeterProvider();
    MetricsTracerFactory.resetInstance();
  });

  beforeEach(() => {
    sandbox.resetHistory();
  });

  it('should use the set meter provider', async () => {
    const factory = MetricsTracerFactory.getInstance(true);
    const tracer = factory.createMetricsTracer(
      'project',
      'instance',
      'database',
    );

    const operations = 3;
    const attempts = 5;
    for (let i = 0; i < operations; i++) {
      tracer!.recordOperationStart();
      for (let j = 0; j < attempts; j++) {
        tracer!.recordAttemptStart();
        // Simulate processing time during attempt
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
        tracer!.recordAttemptCompletion();
      }
      tracer!.recordOperationCompletion();
    }

    assert.ok(recordOperationLatencyStub.calledWith(sinon.match.number));
    assert.strictEqual(recordOperationLatencyStub.callCount, operations);

    assert.ok(recordAttemptLatencyStub.calledWith(sinon.match.number));
    assert.strictEqual(
      recordAttemptLatencyStub.callCount,
      operations * attempts,
    );
  });

  it('should initialize metric instruments when enabled', () => {
    const factory = MetricsTracerFactory.getInstance(true);

    assert.deepStrictEqual(factory.instrumentAttemptLatency, {
      record: recordAttemptLatencyStub,
    });
    assert.deepStrictEqual(factory.instrumentAttemptCounter, {
      add: addAttemptCounterStub,
    });
    assert.deepStrictEqual(factory.instrumentOperationLatency, {
      record: recordOperationLatencyStub,
    });
    assert.deepStrictEqual(factory.instrumentOperationCounter, {
      add: addOperationCounterStub,
    });
    assert.deepStrictEqual(factory.instrumentGfeLatency, {
      record: recordGfeLatencyStub,
    });
    assert.deepStrictEqual(factory.instrumentGfeConnectivityErrorCount, {
      add: addGfeConnectivityErrorCountStub,
    });
  });

  it('should create a MetricsTracer instance', () => {
    const factory = MetricsTracerFactory.getInstance(true);
    const tracer = factory.createMetricsTracer();
    assert.ok(tracer);
  });

  it('should correctly set default attributes', () => {
    const factory = MetricsTracerFactory.getInstance(true);
    const tracer = factory.createMetricsTracer(
      'project',
      'instance',
      'database',
    );
    assert.strictEqual(
      tracer!.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_PROJECT],
      'project',
    );
    assert.strictEqual(
      tracer!.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_INSTANCE],
      'instance',
    );
    assert.strictEqual(
      tracer!.clientAttributes[Constants.METRIC_LABEL_KEY_DATABASE],
      'database',
    );
    assert.ok(tracer!.clientAttributes[Constants.METRIC_LABEL_KEY_CLIENT_NAME]);
    assert.ok(tracer!.clientAttributes[Constants.METRIC_LABEL_KEY_CLIENT_UID]);
    assert.ok(
      tracer!.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_LOCATION],
    );
  });
});
