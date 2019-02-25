/*!
 * Copyright 2019 Google Inc. All Rights Reserved.
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

import * as assert from 'assert';
import {EventEmitter} from 'events';
import {Metadata, ServiceError, status} from 'grpc';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as through from 'through2';

const concat = require('concat-stream');

class FakeTransaction extends EventEmitter {
  async begin(): Promise<void> {}
  request(config, callback) {}
  requestStream(config) {}
}

describe('TransactionRunner', () => {
  const sandbox = sinon.createSandbox();

  const RETRY_KEY = 'google.rpc.retryinfo-bin';
  const DECODE = sandbox.stub();

  const RETRY_INFO = {
    decode: DECODE,
  };

  const LOOKUP = sandbox.stub().withArgs(RETRY_KEY).returns(RETRY_INFO);
  const LOAD_SYNC = sandbox.stub().returns({lookup: LOOKUP});

  const SESSION = {
    transaction: () => fakeTransaction,
  };

  // tslint:disable-next-line no-any variable-name
  let Runner;
  // tslint:disable-next-line no-any variable-name
  let TransactionRunner;
  // tslint:disable-next-line no-any variable-name
  let AsyncTransactionRunner;

  let fakeTransaction;

  before(() => {
    const runners = proxyquire('../src/transaction-runner', {
      protobufjs: {loadSync: LOAD_SYNC},
    });

    Runner = runners.Runner;
    TransactionRunner = runners.TransactionRunner;
    AsyncTransactionRunner = runners.AsyncTransactionRunner;
  });

  beforeEach(() => {
    fakeTransaction = new FakeTransaction();
    sandbox.stub(fakeTransaction, 'begin').resolves();
    sandbox.stub(fakeTransaction, 'request');
    sandbox.stub(fakeTransaction, 'requestStream');
  });

  afterEach(() => sandbox.restore());

  describe('Runner', () => {
    // tslint:disable-next-line no-any variable-name
    let ExtendedRunner;

    let runFn;
    let runner;

    beforeEach(() => {
      runFn = sandbox.stub();

      ExtendedRunner = class ExtendedRunner extends Runner {
        protected async _run(transaction): Promise<void> {
          return runFn(transaction);
        }
      };

      runner = new ExtendedRunner(SESSION, fakeTransaction);
    });

    describe('initialization', () => {
      it('should initialize `attempts` to 0', () => {
        assert.strictEqual(runner.attempts, 0);
      });

      it('should localize the `session`', () => {
        assert.strictEqual(runner.session, SESSION);
      });

      it('should localize the `transaction`', () => {
        assert.strictEqual(runner.transaction, fakeTransaction);
      });

      it('should set default `options`', () => {
        const expectedOptions = {timeout: 3600000};

        assert.deepStrictEqual(runner.options, expectedOptions);
      });

      it('should accept user `options`', () => {
        const options = {timeout: 1000};
        const r = new ExtendedRunner(SESSION, fakeTransaction, options);

        assert.deepStrictEqual(r.options, options);
        assert.notStrictEqual(r.options, options);
      });
    });

    describe('getNextDelay', () => {
      const FAKE_RETRY_INFO = Buffer.from('fake-retry-info');

      const FAKE_ERROR: ServiceError = new Error('err');
      FAKE_ERROR.metadata = new Metadata();
      FAKE_ERROR.metadata.set(RETRY_KEY, FAKE_RETRY_INFO);

      it('should extract `retryInfo` when available', () => {
        const fakeRetryDelay = {
          nanos: 10,
          seconds: 5,
        };

        DECODE.withArgs(FAKE_RETRY_INFO).returns({retryDelay: fakeRetryDelay});

        const expectedDelay = 5000.00001;
        const delay = runner.getNextDelay(FAKE_ERROR);

        assert.strictEqual(delay, expectedDelay);
      });

      it('should check if `seconds` is a Long', () => {
        const fakeRetryDelay = {
          nanos: 10,
          seconds: {toNumber: () => 5},
        };

        DECODE.withArgs(FAKE_RETRY_INFO).returns({retryDelay: fakeRetryDelay});

        const expectedDelay = 5000.00001;
        const delay = runner.getNextDelay(FAKE_ERROR);

        assert.strictEqual(delay, expectedDelay);
      });

      it('should create a backoff when `retryInfo` is absent', () => {
        const random = Math.random();

        runner.attempts = 5;
        sandbox.stub(global.Math, 'random').returns(random);

        const badError: ServiceError = new Error('err');
        badError.metadata = new Metadata();

        const expectedDelay = Math.pow(2, 5) * 1000 + Math.floor(random * 1000);
        const delay = runner.getNextDelay(badError);

        assert.strictEqual(delay, expectedDelay);
      });
    });

    describe('getTransaction', () => {
      it('should return and forget the prepared transaction', async () => {
        sandbox.stub(SESSION, 'transaction').throws(
            new Error('Should not be called'));

        const cachedTransaction = runner.transaction;
        const transaction = await runner.getTransaction();

        assert.strictEqual(transaction, cachedTransaction);
        assert.strictEqual(runner.transaction, undefined);
      });

      it('should create a new transaction if need be', async () => {
        const expectedTransaction = new FakeTransaction();
        const beginStub = sandbox.stub(expectedTransaction, 'begin').resolves();

        sandbox.stub(SESSION, 'transaction').returns(expectedTransaction);
        delete runner.transaction;

        const transaction = await runner.getTransaction();

        assert.strictEqual(transaction, expectedTransaction);
        assert.strictEqual(beginStub.callCount, 1);
      });
    });

    describe('run', () => {
      beforeEach(() => {
        sandbox.stub(runner, 'getTransaction').resolves(fakeTransaction);
      });

      it('should run a transaction', async () => {
        await runner.run();

        const transaction = runFn.lastCall.args[0];

        assert.strictEqual(transaction, fakeTransaction);
        assert.strictEqual(runFn.callCount, 1);
      });

      it('should return the transaction results', async () => {
        const fakeReturnValue = 10;

        runFn.resolves(fakeReturnValue);

        const returnVal = await runner.run();

        assert.strictEqual(returnVal, fakeReturnValue);
      });

      it('should reject for non-retryable errors', done => {
        const fakeError: ServiceError = new Error('err');
        fakeError.code = status.DEADLINE_EXCEEDED;

        runFn.rejects(fakeError);

        runner.run().catch(err => {
          assert.strictEqual(err, fakeError);
          done();
        });
      });

      it('should retry on ABORTED errors', async () => {
        const fakeReturnValue = 11;
        const fakeError: ServiceError = new Error('err');
        fakeError.code = status.ABORTED;

        runFn.onCall(0).rejects(fakeError);
        runFn.onCall(1).resolves(fakeReturnValue);

        const delayStub =
            sandbox.stub(runner, 'getNextDelay').withArgs(fakeError).returns(0);

        const returnValue = await runner.run();

        assert.strictEqual(returnValue, fakeReturnValue);
        assert.strictEqual(runner.attempts, 1);
        assert.strictEqual(delayStub.callCount, 1);
      });

      it('should retry on UNKNOWN errors', async () => {
        const fakeReturnValue = 12;
        const fakeError: ServiceError = new Error('err');
        fakeError.code = status.UNKNOWN;

        runFn.onCall(0).rejects(fakeError);
        runFn.onCall(1).resolves(fakeReturnValue);

        const delayStub =
            sandbox.stub(runner, 'getNextDelay').withArgs(fakeError).returns(0);

        const returnValue = await runner.run();

        assert.strictEqual(returnValue, fakeReturnValue);
        assert.strictEqual(runner.attempts, 1);
        assert.strictEqual(delayStub.callCount, 1);
      });

      it('should throw a DeadlineError if the timeout is exceeded', done => {
        const fakeError: ServiceError = new Error('err');
        fakeError.code = status.ABORTED;

        runFn.onCall(0).rejects(fakeError);
        sandbox.stub(runner, 'getNextDelay').returns(2);
        runner.options.timeout = 1;

        runner.run().catch(err => {
          assert.strictEqual(err.code, status.DEADLINE_EXCEEDED);
          assert.deepStrictEqual(err.errors, [fakeError]);
          done();
        });
      });
    });
  });

  describe('TransactionRunner', () => {
    let runFn;
    let runner;

    beforeEach(() => {
      runFn = sandbox.stub();
      runner = new TransactionRunner(SESSION, fakeTransaction, runFn);
      sandbox.stub(runner, 'getNextDelay').returns(0);
    });

    describe('initialization', () => {
      it('should pass the `session` to `Runner`', () => {
        assert.strictEqual(runner.session, SESSION);
      });

      it('should pass the `transaction` to `Runner`', () => {
        assert.strictEqual(runner.transaction, fakeTransaction);
      });

      it('should pass `options` to `Runner`', () => {
        const options = {timeout: 1};
        const r =
            new TransactionRunner(SESSION, fakeTransaction, runFn, options);

        assert.deepStrictEqual(r.options, options);
      });

      it('should localize the `runFn`', () => {
        assert.strictEqual(runner.runFn, runFn);
      });
    });

    describe('run', () => {
      it('should correctly call the `runFn`', async () => {
        setImmediate(() => fakeTransaction.emit('end'));
        await runner.run();

        const {args} = runFn.lastCall;

        assert.deepStrictEqual(args, [null, fakeTransaction]);
      });

      describe('transaction requests', () => {
        const CONFIG = {};

        let callbackStub;

        beforeEach(() => {
          callbackStub = sandbox.spy();

          runFn.callsFake((err, transaction) => {
            assert.ifError(err);
            transaction.request(CONFIG, callbackStub);
          });
        });

        it('should return the request response', async () => {
          const fakeResponse = {};

          fakeTransaction.request.withArgs(CONFIG).callsFake((_, callback) => {
            callback(null, fakeResponse);
            setImmediate(() => fakeTransaction.emit('end'));
          });

          await runner.run();

          const [error, response] = callbackStub.lastCall.args;

          assert.strictEqual(error, null);
          assert.strictEqual(response, fakeResponse);
          assert.strictEqual(runFn.callCount, 1);
        });

        it('should return non-retryable request errors', async () => {
          const fakeError: ServiceError = new Error('err');
          fakeError.code = status.DEADLINE_EXCEEDED;

          fakeTransaction.request.withArgs(CONFIG).callsFake((_, callback) => {
            callback(fakeError);
            setImmediate(() => fakeTransaction.emit('end'));
          });

          await runner.run();

          const error = callbackStub.lastCall.args[0];

          assert.strictEqual(error, fakeError);
          assert.strictEqual(callbackStub.callCount, 1);
          assert.strictEqual(runFn.callCount, 1);
        });

        it('should intercept ABORTED request errors', async () => {
          const fakeError: ServiceError = new Error('err');
          fakeError.code = status.ABORTED;

          fakeTransaction.request.onCall(0).callsFake(
              (_, callback) => callback(fakeError));

          fakeTransaction.request.onCall(1).callsFake((_, callback) => {
            callback(null);
            setImmediate(() => fakeTransaction.emit('end'));
          });

          await runner.run();

          assert.strictEqual(callbackStub.callCount, 1);
          assert.strictEqual(runFn.callCount, 2);
        });

        it('should intercept UNKNOWN request errors', async () => {
          const fakeError: ServiceError = new Error('err');
          fakeError.code = status.UNKNOWN;

          fakeTransaction.request.onCall(0).callsFake(
              (_, callback) => callback(fakeError));

          fakeTransaction.request.onCall(1).callsFake((_, callback) => {
            callback(null);
            setImmediate(() => fakeTransaction.emit('end'));
          });

          await runner.run();

          assert.strictEqual(callbackStub.callCount, 1);
          assert.strictEqual(runFn.callCount, 2);
        });
      });

      describe('transaction streams', () => {
        const CONFIG = {};

        it('should pipe the data through', done => {
          const fakeStream = through.obj();
          fakeTransaction.requestStream.withArgs(CONFIG).returns(fakeStream);

          const fakeData = [{a: 'b'}, {c: 'd'}, {e: 'f'}];
          fakeData.forEach(data => fakeStream.push(data));
          fakeStream.push(null);

          runFn.callsFake((err, transaction) => {
            assert.ifError(err);

            transaction.requestStream(CONFIG).pipe(concat(data => {
              assert.deepStrictEqual(data, fakeData);
              done();
            }));
          });

          runner.run().catch(done);
        });

        it('should destroy on non-retryable streaming errors', done => {
          const fakeStream = through.obj();
          fakeTransaction.requestStream.withArgs(CONFIG).returns(fakeStream);

          const fakeError: ServiceError = new Error('err');
          fakeError.code = status.DEADLINE_EXCEEDED;

          runFn.callsFake((err, transaction) => {
            assert.ifError(err);

            transaction.requestStream(CONFIG).on('error', err => {
              assert.strictEqual(err, fakeError);
              done();
            });
          });

          runner.run().catch(done);
          setImmediate(() => fakeStream.destroy(fakeError));
        });

        it('should intercept ABORTED streaming errors', done => {
          const badStream = through.obj();
          const goodStream = through.obj();

          const fakeError: ServiceError = new Error('err');
          fakeError.code = status.ABORTED;

          const fakeData = [{a: 'b'}, {c: 'd'}, {e: 'f'}];
          fakeData.forEach(data => goodStream.push(data));
          goodStream.push(null);

          fakeTransaction.requestStream.onCall(0).returns(badStream);
          fakeTransaction.requestStream.onCall(1).returns(goodStream);

          runFn.callsFake((err, transaction) => {
            assert.ifError(err);

            transaction.requestStream(CONFIG)
                .on('error', done)
                .pipe(concat(data => {
                  assert.deepStrictEqual(data, fakeData);
                  assert.strictEqual(runFn.callCount, 2);
                  done();
                }));
          });

          runner.run().catch(done);
          setImmediate(() => badStream.destroy(fakeError));
        });

        it('should intercept UNKNOWN streaming errors', done => {
          const badStream = through.obj();
          const goodStream = through.obj();

          const fakeError: ServiceError = new Error('err');
          fakeError.code = status.UNKNOWN;

          const fakeData = [{a: 'b'}, {c: 'd'}, {e: 'f'}];
          fakeData.forEach(data => goodStream.push(data));
          goodStream.push(null);

          fakeTransaction.requestStream.onCall(0).returns(badStream);
          fakeTransaction.requestStream.onCall(1).returns(goodStream);

          runFn.callsFake((err, transaction) => {
            assert.ifError(err);

            transaction.requestStream(CONFIG)
                .on('error', done)
                .pipe(concat(data => {
                  assert.deepStrictEqual(data, fakeData);
                  assert.strictEqual(runFn.callCount, 2);
                  done();
                }));
          });

          runner.run().catch(done);
          setImmediate(() => badStream.destroy(fakeError));
        });
      });
    });
  });

  describe('AsyncTransactionRunner', () => {
    let runFn;
    let runner;

    beforeEach(() => {
      runFn = sandbox.stub();
      runner = new AsyncTransactionRunner(SESSION, fakeTransaction, runFn);
      sandbox.stub(runner, 'getNextDelay').returns(0);
    });

    describe('initialization', () => {
      it('should pass the `session` to `Runner`', () => {
        assert.strictEqual(runner.session, SESSION);
      });

      it('should pass the `transaction` to `Runner`', () => {
        assert.strictEqual(runner.transaction, fakeTransaction);
      });

      it('should pass `options` to `Runner`', () => {
        const options = {timeout: 1};
        const r = new AsyncTransactionRunner(
            SESSION, fakeTransaction, runFn, options);

        assert.deepStrictEqual(r.options, options);
      });

      it('should localize the `runFn`', () => {
        assert.strictEqual(runner.runFn, runFn);
      });
    });

    describe('run', () => {
      it('should correctly call the `runFn`', async () => {
        runFn.resolves();
        await runner.run();

        const {args} = runFn.lastCall;

        assert.deepStrictEqual(args, [fakeTransaction]);
      });

      it('should resolve with the `runFn` return value', async () => {
        const fakeReturnValue = 'abc';

        runFn.resolves(fakeReturnValue);

        const returnValue = await runner.run();

        assert.strictEqual(returnValue, fakeReturnValue);
      });
    });
  });
});
