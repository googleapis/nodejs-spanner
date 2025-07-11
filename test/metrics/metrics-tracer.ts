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

import {status as Status} from '@grpc/grpc-js';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as Constants from '../../src/metrics/constants';
import {MetricsTracer} from '../../src/metrics/metrics-tracer';

import {MetricsTracerFactory} from '../../src/metrics/metrics-tracer-factory';

const DATABASE = 'test-db';
const INSTANCE = 'instance';
const METHOD = 'test-method';
const REQUEST = 'test-request';

describe('MetricsTracer', () => {
  let tracer: MetricsTracer;
  let fakeAttemptCounter: any;
  let fakeAttemptLatency: any;
  let fakeOperationCounter: any;
  let fakeOperationLatency: any;
  let fakeGfeCounter: any;
  let fakeGfeLatency: any;
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    fakeAttemptCounter = {
      add: sinon.spy(),
    };

    fakeAttemptLatency = {
      record: sinon.spy(),
    };

    fakeOperationCounter = {
      add: sinon.spy(),
    };

    fakeOperationLatency = {
      record: sinon.spy(),
    };

    fakeGfeCounter = {
      add: sinon.spy(),
    };

    fakeGfeLatency = {
      record: sinon.spy(),
    };

    tracer = new MetricsTracer(
      fakeAttemptCounter,
      fakeAttemptLatency,
      fakeOperationCounter,
      fakeOperationLatency,
      fakeGfeCounter,
      fakeGfeLatency,
      true, // enabled,
      DATABASE,
      INSTANCE,
      METHOD,
      REQUEST,
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('recordAttemptCompletion', () => {
    it('should record attempt latency when enabled', () => {
      tracer.recordOperationStart();
      tracer.recordAttemptStart();
      assert.ok(tracer.currentOperation!.currentAttempt);
      assert.ok(tracer.currentOperation!.currentAttempt.startTime);
      assert.strictEqual(tracer.currentOperation!.attemptCount, 1);

      tracer.recordAttemptCompletion(Status.OK);

      assert.strictEqual(fakeAttemptLatency.record.calledOnce, true);
      const [[latency, otelAttrs]] = fakeAttemptLatency.record.args;
      assert.strictEqual(typeof latency, 'number');
      assert.strictEqual(
        otelAttrs[Constants.METRIC_LABEL_KEY_STATUS],
        Status[Status.OK],
      );
    });

    it('should do nothing if disabled', () => {
      tracer.enabled = false;
      tracer.recordAttemptStart();
      tracer.recordAttemptCompletion(Status.OK);
      assert.strictEqual(fakeAttemptLatency.record.called, false);
    });
  });

  describe('recordOperationCompletion', () => {
    it('should record operation and attempt metrics when enabled', () => {
      const factory = sandbox
        .stub(MetricsTracerFactory, 'getInstance')
        .returns({
          clearCurrentTracer: sinon.spy(),
        } as any);
      tracer.recordOperationStart();
      assert.ok(tracer.currentOperation!.startTime);
      tracer.recordAttemptStart();
      tracer.recordAttemptCompletion(Status.OK);
      tracer.recordOperationCompletion();

      assert.strictEqual(fakeOperationCounter.add.calledOnce, true);
      assert.strictEqual(fakeAttemptCounter.add.calledOnce, true);
      assert.strictEqual(fakeOperationLatency.record.calledOnce, true);

      const [[_, opAttrs]] = fakeOperationLatency.record.args;
      assert.strictEqual(opAttrs[Constants.METRIC_LABEL_KEY_STATUS], 'OK');
    });

    it('should do nothing if disabled', () => {
      tracer.enabled = false;
      tracer.recordOperationCompletion();
      assert.strictEqual(fakeOperationCounter.add.called, false);
      assert.strictEqual(fakeOperationLatency.record.called, false);
    });
  });

  describe('recordGfeLatency', () => {
    it('should record GFE latency if enabled', () => {
      tracer.enabled = true;
      tracer.gfeLatency = 123;
      tracer.recordGfeLatency(Status.OK);
      assert.strictEqual(fakeGfeLatency.record.calledOnce, true);
    });

    it('should not record if disabled', () => {
      tracer.enabled = false;
      tracer.gfeLatency = 123;
      tracer.recordGfeLatency(Status.OK);
      assert.strictEqual(fakeGfeLatency.record.called, false);
    });
  });

  describe('recordGfeConnectivityErrorCount', () => {
    it('should increment GFE error counter if enabled', () => {
      tracer.recordGfeConnectivityErrorCount(Status.OK);
      assert.strictEqual(fakeGfeCounter.add.calledOnce, true);
    });

    it('should not increment if disabled', () => {
      tracer.enabled = false;
      tracer.recordGfeConnectivityErrorCount(Status.OK);
      assert.strictEqual(fakeGfeCounter.add.called, false);
    });
  });

  describe('extractGfeLatency', () => {
    let tracer: MetricsTracer;
    beforeEach(() => {
      tracer = new MetricsTracer(
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        DATABASE,
        INSTANCE,
        METHOD,
        REQUEST,
      );
    });

    it('should extract latency from a valid server-timing header', () => {
      const header = 'gfet4t7; dur=123';
      const latency = tracer.extractGfeLatency(header);
      assert.strictEqual(latency, 123);
    });

    it('should return null if header is undefined', () => {
      const latency = tracer.extractGfeLatency(undefined as any);
      assert.strictEqual(latency, null);
    });

    it('should return null if header does not match expected format', () => {
      const header = 'some-other-header';
      const latency = tracer.extractGfeLatency(header);
      assert.strictEqual(latency, null);
    });

    it('should extract only the first number if extra data is present', () => {
      const header = 'gfet4t7; dur=456; other=value';
      const latency = tracer.extractGfeLatency(header);
      assert.strictEqual(latency, 456);
    });
  });
});
