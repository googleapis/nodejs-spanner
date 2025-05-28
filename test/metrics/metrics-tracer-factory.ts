/*!
 * Copyright 2025 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {metrics, MeterProvider as ApiMeterProvider} from '@opentelemetry/api';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import {GoogleAuth} from 'google-auth-library';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as Constants from '../../src/metrics/constants';
import {MetricsTracerFactory} from '../../src/metrics/metrics-tracer-factory';
import {CloudMonitoringMetricsExporter} from '../../src/metrics/spanner-metrics-exporter';

const PROJECT_ID = 'test-project';

const auth = new GoogleAuth();
auth.getProjectId = sinon.stub().resolves(PROJECT_ID);

describe('MetricsTracerFactory', () => {
  let originalProvider: ApiMeterProvider;
  let sandbox: sinon.SinonSandbox;
  let recordAttemptLatencyStub: sinon.SinonStub;
  let addAttemptCounterStub: sinon.SinonStub;
  let recordOperationLatencyStub: sinon.SinonStub;
  let addOperationCounterStub: sinon.SinonStub;
  let recordGfeLatencyStub: sinon.SinonStub;
  let addGfeConnectivityErrorCountStub: sinon.SinonStub;

  beforeEach(() => {
    // Set the global metrics provider and related objects
    originalProvider = metrics.getMeterProvider();
    const exporter = new CloudMonitoringMetricsExporter({auth});
    const reader = new PeriodicExportingMetricReader({
      exporter: exporter,
      exportIntervalMillis: 60000,
    });
    const provider = new MeterProvider({
      readers: [reader],
    });
    metrics.setGlobalMeterProvider(provider);

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
  });

  afterEach(() => {
    metrics.setGlobalMeterProvider(originalProvider);
    sandbox.restore();
  });

  it('should use the globally set meter provider', async () => {
    const factory = new MetricsTracerFactory(true);
    const tracer = factory.createMetricsTracer();

    for (let i = 0; i < 3; i++) {
      tracer.recordOperationStart();
      for (let j = 0; j < 5; j++) {
        tracer.recordAttemptStart();
        tracer.recordAttemptCompletion();
      }
      tracer.recordOperationCompletion();
    }

    assert.ok(recordAttemptLatencyStub.calledWith(sinon.match.number));
    assert.strictEqual(recordAttemptLatencyStub.callCount, 3 * 5);

    assert.ok(recordOperationLatencyStub.calledWith(sinon.match.number));
    assert.strictEqual(recordOperationLatencyStub.callCount, 3);
  });

  it('should initialize metric instruments when enabled', () => {
    const factory = new MetricsTracerFactory(true);

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
    const factory = new MetricsTracerFactory(true);
    const tracer = factory.createMetricsTracer();
    assert.ok(tracer);
  });

  it('should correctly set default attributes', () => {
    const factory = new MetricsTracerFactory(true);
    assert.ok(factory.clientAttributes[Constants.METRIC_LABEL_KEY_CLIENT_NAME]);
    assert.ok(factory.clientAttributes[Constants.METRIC_LABEL_KEY_CLIENT_UID]);
    assert.ok(
      factory.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_CLIENT_HASH],
    );
    assert.ok(
      factory.clientAttributes[
        Constants.MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG
      ],
    );
    assert.ok(
      factory.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_LOCATION],
    );
  });

  it('should correctly set project attribute', () => {
    const factory = new MetricsTracerFactory(true);
    factory.project = 'test-project';
    assert.strictEqual(
      factory.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_PROJECT],
      'test-project',
    );
  });

  it('should correctly set instance attribute', () => {
    const factory = new MetricsTracerFactory(true);
    factory.instance = 'my-instance';
    assert.strictEqual(
      factory.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_INSTANCE],
      'my-instance',
    );
  });

  it('should correctly set instanceConfig attribute', () => {
    const factory = new MetricsTracerFactory(true);
    factory.instanceConfig = 'my-config';
    assert.strictEqual(
      factory.clientAttributes[
        Constants.MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG
      ],
      'my-config',
    );
  });

  it('should correctly set location attribute', () => {
    const factory = new MetricsTracerFactory(true);
    factory.location = 'us-central1';
    assert.strictEqual(
      factory.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_LOCATION],
      'us-central1',
    );
  });

  it('should correctly set clientHash attribute', () => {
    const factory = new MetricsTracerFactory(true);
    factory.clientHash = 'abc123';
    assert.strictEqual(
      factory.clientAttributes[Constants.MONITORED_RES_LABEL_KEY_CLIENT_HASH],
      'abc123',
    );
  });

  it('should correctly set clientUid attribute', () => {
    const factory = new MetricsTracerFactory(true);
    factory.clientUid = 'uid123';
    assert.strictEqual(
      factory.clientAttributes[Constants.METRIC_LABEL_KEY_CLIENT_UID],
      'uid123',
    );
  });

  it('should correctly set clientName attribute', () => {
    const factory = new MetricsTracerFactory(true);
    factory.clientName = 'client-app';
    assert.strictEqual(
      factory.clientAttributes[Constants.METRIC_LABEL_KEY_CLIENT_NAME],
      'client-app',
    );
  });

  it('should correctly set database attribute', () => {
    const factory = new MetricsTracerFactory(true);
    factory.database = 'my-database';
    assert.strictEqual(
      factory.clientAttributes[Constants.METRIC_LABEL_KEY_DATABASE],
      'my-database',
    );
  });
});
