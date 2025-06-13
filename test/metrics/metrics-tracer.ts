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

const PROJECT_ID = 'test-project';

describe('MetricsTracer', () => {
  let tracer: MetricsTracer;
  let fakeAttemptCounter: any;
  let fakeAttemptLatency: any;
  let fakeOperationCounter: any;
  let fakeOperationLatency: any;
  let fakeGfeCounter: any;
  let fakeGfeLatency: any;
  let attributes: {[key: string]: string};

  beforeEach(() => {
    attributes = {
      [Constants.MONITORED_RES_LABEL_KEY_PROJECT]: PROJECT_ID,
    };

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
      attributes,
      fakeAttemptCounter,
      fakeAttemptLatency,
      fakeOperationCounter,
      fakeOperationLatency,
      fakeGfeCounter,
      fakeGfeLatency,
      true, // enabled
    );
  });

  describe('recordAttemptCompletion', () => {
    it('should record attempt latency when enabled', () => {
      tracer.recordAttemptStart();
      assert.ok(tracer.currentOperation.currentAttempt);
      assert.ok(tracer.currentOperation.currentAttempt.startTime);
      assert.strictEqual(tracer.currentOperation.attemptCount, 1);

      tracer.recordAttemptCompletion(Status.OK);

      assert.strictEqual(fakeAttemptLatency.record.calledOnce, true);
      const [[latency, otelAttrs]] = fakeAttemptLatency.record.args;
      assert.strictEqual(typeof latency, 'number');
      assert.strictEqual(
        otelAttrs[Constants.MONITORED_RES_LABEL_KEY_PROJECT],
        PROJECT_ID,
      );
      assert.strictEqual(
        otelAttrs[Constants.METRIC_LABEL_KEY_STATUS],
        Status.OK.toString(),
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
      tracer.recordOperationStart();
      assert.ok(tracer.currentOperation.startTime);
      tracer.recordAttemptStart();
      tracer.recordOperationCompletion();

      assert.strictEqual(fakeOperationCounter.add.calledOnce, true);
      assert.strictEqual(fakeAttemptCounter.add.calledOnce, true);
      assert.strictEqual(fakeOperationLatency.record.calledOnce, true);

      const [[_, opAttrs]] = fakeOperationLatency.record.args;
      assert.strictEqual(opAttrs[Constants.METRIC_LABEL_KEY_STATUS], '-1');
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
      tracer.recordGfeLatency(123);
      assert.strictEqual(fakeGfeLatency.record.calledOnce, true);
    });

    it('should not record if disabled', () => {
      tracer.enabled = false;
      tracer.recordGfeLatency(123);
      assert.strictEqual(fakeGfeLatency.record.called, false);
    });
  });

  describe('recordGfeConnectivityErrorCount', () => {
    it('should increment GFE error counter if enabled', () => {
      tracer.recordGfeConnectivityErrorCount();
      assert.strictEqual(fakeGfeCounter.add.calledOnce, true);
    });

    it('should not increment if disabled', () => {
      tracer.enabled = false;
      tracer.recordGfeConnectivityErrorCount();
      assert.strictEqual(fakeGfeCounter.add.called, false);
    });
  });

  it('should not overwrite project if already set', () => {
    tracer.project = 'new-project';
    assert.strictEqual(
      attributes[Constants.MONITORED_RES_LABEL_KEY_PROJECT],
      PROJECT_ID,
    );
  });

  it('should set all other attribute setters', () => {
    tracer.instance = 'test-instance';
    tracer.instanceConfig = 'config';
    tracer.location = 'us-central1';
    tracer.clientHash = 'hash123';
    tracer.clientUid = 'uid123';
    tracer.clientName = 'name123';
    tracer.database = 'db123';
    tracer.methodName = 'method';

    assert.strictEqual(
      attributes[Constants.MONITORED_RES_LABEL_KEY_INSTANCE],
      'test-instance',
    );
    assert.strictEqual(
      attributes[Constants.MONITORED_RES_LABEL_KEY_INSTANCE_CONFIG],
      'config',
    );
    assert.strictEqual(
      attributes[Constants.MONITORED_RES_LABEL_KEY_LOCATION],
      'us-central1',
    );
    assert.strictEqual(
      attributes[Constants.MONITORED_RES_LABEL_KEY_CLIENT_HASH],
      'hash123',
    );
    assert.strictEqual(
      attributes[Constants.METRIC_LABEL_KEY_CLIENT_UID],
      'uid123',
    );
    assert.strictEqual(
      attributes[Constants.METRIC_LABEL_KEY_CLIENT_NAME],
      'name123',
    );
    assert.strictEqual(
      attributes[Constants.METRIC_LABEL_KEY_DATABASE],
      'db123',
    );
    assert.strictEqual(attributes[Constants.METRIC_LABEL_KEY_METHOD], 'method');
  });
});
