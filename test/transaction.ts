/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import {util} from '@google-cloud/common-grpc';
import * as pfy from '@google-cloud/promisify';
import * as assert from 'assert';
import * as extend from 'extend';
import * as gax from 'google-gax';
import * as path from 'path';
import * as proxyquire from 'proxyquire';
import {split} from 'split-array-stream';
import * as through from 'through2';

// tslint:disable-next-line no-any variable-name
const FakeRetryInfo: any = {
  decode: util.noop,
};

const fakeGax = {
  GoogleProtoFilesRoot: class extends gax.GoogleProtoFilesRoot{
    loadSync(filename) {
      assert.strictEqual(
          filename,
          path.resolve(__dirname, '../protos/google/rpc/error_details.proto'));
      const result = super.loadSync(filename);
      const n = 'nested';
      result[n]!.google[n].rpc[n].RetryInfo = FakeRetryInfo;
      return result;
    }
  },
};

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll(klass, options) {
    if (klass.name !== 'Transaction') {
      return;
    }
    promisified = true;
    assert.strictEqual(options, undefined);
    pfy.promisifyAll(klass, options);
  },
});

class FakeGrpcService {
  static objToStruct_() {}
}

function fakePartialResultStream(this: Function&{calledWith_: IArguments}) {
  this.calledWith_ = arguments;
  return this;
}

class FakeTransactionRequest {
  calledWith_: IArguments;
  options: {};
  constructor(options: {}) {
    this.calledWith_ = arguments;
    this.options = options;
  }
}

// tslint:disable-next-line no-any
const fakeCodec: any = {
  encode: util.noop,
};

const FAKE_COMMIT_TIMEOUT = 12345;
const fakeConfig = {
  interfaces: {
    'google.spanner.v1.Spanner': {
      methods: {
        Commit: {
          timeout_millis: FAKE_COMMIT_TIMEOUT,
        },
      },
    },
  },
};

describe('Transaction', () => {
  // tslint:disable-next-line no-any variable-name
  let TransactionCached: any;
  // tslint:disable-next-line no-any variable-name
  let Transaction: any;
  let transaction;

  const SESSION = {
    request: util.noop,
    formattedName_: 'formatted-session-name',
  };

  const ID = 'transaction-id';

  before(() => {
    Transaction =
        proxyquire('../src/transaction', {
          'google-gax': fakeGax,
          '@google-cloud/common-grpc': {
            Service: FakeGrpcService,
          },
          '@google-cloud/promisify': fakePfy,
          './codec': {codec: fakeCodec},
          './partial-result-stream':
              {partialResultStream: fakePartialResultStream},
          './transaction-request': {TransactionRequest: FakeTransactionRequest},
          './v1/spanner_client_config.json': fakeConfig,
        }).Transaction;

    TransactionCached = extend({}, Transaction);
  });

  beforeEach(() => {
    FakeGrpcService.objToStruct_ = util.noop;
    FakeRetryInfo.decode = util.noop;

    extend(Transaction, TransactionCached);
    transaction = new Transaction(SESSION);
  });

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should localize the session', () => {
      assert.strictEqual(transaction.session, SESSION);
    });

    it('should set flag to identify as a Transaction object', () => {
      assert.strictEqual(transaction.transaction, true);
    });

    it('should track the number of attempts made', () => {
      assert.strictEqual(transaction.attempts_, 0);
    });

    it('should initialize the seqno property', () => {
      assert.strictEqual(transaction.seqno, 1);
    });

    it('should initialize an empty queue', () => {
      assert.deepStrictEqual(transaction.queuedMutations_, []);
    });

    it('should initialize a null run function', () => {
      assert.strictEqual(transaction.runFn_, null);
    });

    it('should set ended_ to false', () => {
      assert.strictEqual(transaction.ended_, false);
    });

    it('should inherit from TransactionRequest', () => {
      const OPTIONS = {};
      transaction = new Transaction(SESSION, OPTIONS);
      assert(transaction instanceof FakeTransactionRequest);
    });

    describe('timeout_', () => {
      it('should default to the commit timeout', () => {
        assert.strictEqual(transaction.timeout_, FAKE_COMMIT_TIMEOUT);
      });

      it('should capture the user timeout', () => {
        const timeout = 321;
        const transaction = new Transaction(SESSION, {timeout});

        assert.strictEqual(transaction.timeout_, timeout);
        // check to make sure the timeout isn't captured for requests
        assert.deepStrictEqual(transaction.calledWith_[0], {});
      });

      it('should ignore non-number values', () => {
        const timeout = 'abc';
        const transaction = new Transaction(SESSION, {timeout});

        assert.strictEqual(transaction.timeout_, FAKE_COMMIT_TIMEOUT);
      });

      it('should not alter user options', () => {
        const options = {timeout: 1234};
        const optionsCopy = Object.assign({}, options);
        const transaction = new Transaction(SESSION, options);

        assert.strictEqual(transaction.timeout_, options.timeout);
        assert.deepStrictEqual(options, optionsCopy);
      });
    });
  });

  describe('createDeadlineError_', () => {
    it('should augment the error', () => {
      const originalError = {
        code: 10,
        message: 'Transaction aborted.',
        a: 'a',
        b: 'b',
      };

      const formattedError = Transaction.createDeadlineError_(originalError);

      assert.strictEqual(formattedError.code, 4);
      assert.strictEqual(
          formattedError.message,
          'Deadline for Transaction exceeded. - Transaction aborted.');
      assert.deepStrictEqual(originalError, formattedError.errors[0]);
      assert.notStrictEqual(originalError, formattedError);
    });
  });

  describe('getRetryDelay_', () => {
    it('should return the retry delay when available', () => {
      const fakeError = new Error('err');
      const fakeRetryInfo = Buffer.from('hi');

      // tslint:disable-next-line no-any
      (fakeError as any).metadata = {
        get(key) {
          assert.strictEqual(key, 'google.rpc.retryinfo-bin');
          return [fakeRetryInfo];
        },
      };

      const seconds = 25;
      const nanos = 100;

      FakeRetryInfo.decode = (retryInfo) => {
        assert.strictEqual(retryInfo, fakeRetryInfo);

        return {
          retryDelay: {
            seconds: {
              toNumber() {
                return seconds;
              },
            },
            nanos,
          },
        };
      };

      const expectedDelay = seconds * 1000 + nanos / 1e6;
      const delay = Transaction.getRetryDelay_(fakeError);

      assert.strictEqual(delay, expectedDelay);
    });

    it('should create backoff from counter when delay is absent', () => {
      const fakeError = new Error('err');
      // tslint:disable-next-line no-any
      (fakeError as any).metadata = {
        get() {
          return [];
        },
      };

      const random = Math.random();
      const _random = Math.random;

      global.Math.random = () => random;
      const attempts = 3;
      const expectedDelay =
          Math.pow(2, attempts) * 1000 + Math.floor(random * 1000);
      const delay = Transaction.getRetryDelay_(fakeError, attempts);

      assert.strictEqual(delay, expectedDelay);

      global.Math.random = _random;
    });
  });

  describe('begin', () => {
    const OPTIONS = {
      readOnly: true,
      boundOptions: true,
      returnReadTimestamp: true,
    };

    const EXPECTED_REQ_OPTS = {
      options: {
        readOnly: OPTIONS,
      },
    };

    it('should make the correct request', done => {
      const transaction = new Transaction(SESSION, OPTIONS);

      transaction.readOnly = true;
      transaction.request = (config) => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'beginTransaction');
        assert.deepStrictEqual(config.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      transaction.begin(assert.ifError);
    });

    it('should not require options', done => {
      transaction.readOnly = false;
      transaction.request = (config) => {
        assert.deepStrictEqual(config.reqOpts, {
          options: {
            readWrite: {},
          },
        });
        done();
      };

      transaction.begin(assert.ifError);
    });

    it('should send the partitioned options', done => {
      transaction.partitioned = true;

      transaction.request = (config) => {
        assert.deepStrictEqual(config.reqOpts, {
          options: {
            partitionedDml: {},
          },
        });

        done();
      };

      transaction.begin(assert.ifError);
    });

    it('should execute callback with error', done => {
      const error = new Error('Error.');

      transaction.request = (config, callback) => {
        callback(error);
      };

      transaction.begin(err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    describe('success', () => {
      const API_RESPONSE = {
        id: 'transaction-id',
      };

      beforeEach(() => {
        transaction.request = (config, callback) => {
          callback(null, API_RESPONSE);
        };
      });

      it('should increment the attempts property', done => {
        transaction.begin(err => {
          assert.ifError(err);
          assert.strictEqual(transaction.attempts_, 1);
          done();
        });
      });

      it('should set ended_ to false', done => {
        transaction.begin(err => {
          assert.ifError(err);
          assert.strictEqual(transaction.ended_, false);
          done();
        });
      });

      it('should update ID', done => {
        transaction.begin(err => {
          assert.ifError(err);
          assert.strictEqual(transaction.id, API_RESPONSE.id);
          done();
        });
      });

      it('should update metadata', done => {
        transaction.begin(err => {
          assert.ifError(err);
          assert.strictEqual(transaction.metadata, API_RESPONSE);
          done();
        });
      });

      it('should execute callback with API response', done => {
        transaction.begin((err, apiResponse) => {
          assert.ifError(err);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });

      it('should set the timestamp if applicable', done => {
        const fakeProtoTimestamp = {};
        const fakeDate = new Date();

        transaction.request = (config, callback) => {
          callback(
              null,
              extend(
                  {
                    readTimestamp: fakeProtoTimestamp,
                  },
                  API_RESPONSE));
        };

        // tslint:disable-next-line no-any
        (FakeTransactionRequest as any).fromProtoTimestamp_ = (value) => {
          assert.strictEqual(value, fakeProtoTimestamp);
          return fakeDate;
        };

        transaction.begin(err => {
          assert.ifError(err);
          assert.strictEqual(transaction.readTimestamp, fakeDate);
          done();
        });
      });
    });
  });

  describe('commit', () => {
    const QUEUED_MUTATIONS = [{}];

    beforeEach(() => {
      transaction.queuedMutations_ = QUEUED_MUTATIONS;
    });

    it('should return an error if the transaction was ended', done => {
      const expectedError = new Error('Transaction has already been ended.');

      transaction.ended_ = true;

      transaction.commit(err => {
        assert.deepStrictEqual(err, expectedError);
        done();
      });
    });

    it('should make the correct request with an ID', done => {
      transaction.id = 'transaction-id';

      transaction.request = (config) => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'commit');
        assert.deepStrictEqual(config.reqOpts, {
          transactionId: transaction.id,
          mutations: QUEUED_MUTATIONS,
        });

        done();
      };

      transaction.commit(assert.ifError);
    });

    it('should make the correct request without an ID', done => {
      delete transaction.id;

      transaction.request = (config) => {
        assert.deepStrictEqual(config.reqOpts, {
          singleUseTransaction: {
            readWrite: {},
          },
          mutations: QUEUED_MUTATIONS,
        });
        done();
      };

      transaction.commit(assert.ifError);
    });

    describe('error', () => {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(() => {
        transaction.request = (config, callback) => {
          callback(ERROR, API_RESPONSE);
        };
      });

      it('should execute callback with error and API response', done => {
        transaction.commit((err, apiResponse) => {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });

    describe('success', () => {
      const API_RESPONSE = {};

      beforeEach(() => {
        transaction.request = (config, callback) => {
          callback(null, API_RESPONSE);
        };
      });

      it('should destroy the transaction', done => {
        transaction.end = () => done();
        transaction.commit(assert.ifError);
      });

      it('should execute callback with the API response', done => {
        transaction.commit((err, apiResponse) => {
          assert.ifError(err);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });
  });

  describe('end', () => {
    it('should set ended_ to true', () => {
      transaction.end();

      assert.strictEqual(transaction.ended_, true);
    });

    it('should empty the queue', () => {
      transaction.queuedMutations_ = [{}, {}];
      transaction.end();
      assert.strictEqual(transaction.queuedMutations_.length, 0);
    });

    it('should nullify the run function', () => {
      transaction.runFn_ = () => {};
      transaction.end();
      assert.strictEqual(transaction.runFn_, null);
    });

    it('should reset the attempts property', () => {
      transaction.attempts_ = 100;
      transaction.end();
      assert.strictEqual(transaction.attempts_, 0);
    });

    it('should delete the ID', () => {
      transaction.id = 'transaction-id';
      transaction.end();
      assert.strictEqual(transaction.id, undefined);
    });

    it('should optionally execute a callback', done => {
      transaction.end(done);
    });
  });

  describe('queue_', () => {
    it('should push a mutation object into the queue array', () => {
      const mutation = {};
      assert.deepStrictEqual(transaction.queuedMutations_, []);
      transaction.queue_(mutation);
      assert.strictEqual(transaction.queuedMutations_[0], mutation);
    });
  });

  describe('request', () => {
    it('should make the correct request', done => {
      const config = {
        reqOpts: {
          a: 'b',
          c: 'd',
        },
      };

      transaction.session.request = (config_) => {
        const expectedReqOpts = extend({}, config.reqOpts, {
          session: transaction.session.formattedName_,
        });
        assert.deepStrictEqual(config_.reqOpts, expectedReqOpts);
        done();
      };

      transaction.request(config, assert.ifError);
    });

    it('should pass the response back to the callback', done => {
      const resp = {};

      const config = {
        reqOpts: {},
      };

      transaction.session.request = (config_, callback) => {
        callback(null, resp);
      };

      transaction.request(config, (err, apiResponse) => {
        assert.ifError(err);
        assert.strictEqual(apiResponse, resp);
        done();
      });
    });

    describe('aborted errors', () => {
      const abortedError = {code: 10};
      const resp = {};

      const fakeDelay = 123;
      const config = {};
      let getRetryDelay;

      before(() => {
        getRetryDelay = Transaction.getRetryDelay_;
      });

      beforeEach(() => {
        transaction.session.request = (config, callback) => {
          callback(abortedError, resp);
        };
        Transaction.getRetryDelay_ = () => fakeDelay;
      });

      after(() => {
        Transaction.getRetryDelay_ = getRetryDelay;
      });

      it('should pass error code to isRetryableErrorCode', done => {
        transaction.runFn_ = () => {};

        const config = {
          reqOpts: {},
        };

        transaction.isRetryableErrorCode_ = (code: number) => {
          assert.strictEqual(code, abortedError.code);
          done();
        };

        transaction.request(config, () => {});
      });

      it('should retry the txn if abort occurs', done => {
        const attempts_ = 123;

        Transaction.getRetryDelay_ = (err: Error, attempts: number) => {
          assert.strictEqual(err, abortedError);
          assert.strictEqual(attempts, attempts_);
          return fakeDelay;
        };

        transaction.retry_ = (delay: number) => {
          assert.strictEqual(delay, fakeDelay);
          done();
        };

        transaction.shouldRetry_ = (err: Error) => {
          assert.strictEqual(err, abortedError);
          return true;
        };

        transaction.runFn_ = () => {
          done(new Error('Should not have been called.'));
        };

        transaction.attempts_ = attempts_;

        transaction.request(config, () => {
          done(new Error('Should not have been called.'));
        });
      });

      it('should return a deadline error if not retrying', done => {
        transaction.retry_ = () => {
          done(new Error('Should not have been called.'));
        };

        transaction.shouldRetry_ = (err: Error) => {
          assert.strictEqual(err, abortedError);
          return false;
        };

        const createDeadlineError = Transaction.createDeadlineError_;
        const deadlineError = {};

        Transaction.createDeadlineError_ = (err: Error) => {
          assert.strictEqual(err, abortedError);
          return deadlineError;
        };

        transaction.runFn_ = (err: Error) => {
          assert.strictEqual(err, deadlineError);

          Transaction.createDeadlineError_ = createDeadlineError;
          done();
        };

        transaction.request(config, () => {
          done(new Error('Should not have been called.'));
        });
      });

      it('should return the aborted error if no runFn', done => {
        transaction.runFn_ = null;

        transaction.request(config, err => {
          assert.strictEqual(err, abortedError);
          done();
        });
      });
    });
  });

  describe('requestStream', () => {
    it('should make the correct request', () => {
      const methodReturnValue = {};

      const config = {
        reqOpts: {
          a: 'b',
          c: 'd',
        },
      };

      transaction.session.requestStream = (config_) => {
        const expectedReqOpts = extend({}, config.reqOpts, {
          session: transaction.session.formattedName_,
        });

        assert.deepStrictEqual(config_.reqOpts, expectedReqOpts);

        return methodReturnValue;
      };

      const returnValue = transaction.requestStream(config);
      assert.strictEqual(returnValue, methodReturnValue);
    });

    describe('runTransaction mode', () => {
      let fakeStream;

      const config = {
        reqOpts: {},
      };

      beforeEach(() => {
        fakeStream = through.obj();
        transaction.session.requestStream = () => {
          return fakeStream;
        };
        transaction.runFn_ = () => {};
      });

      it('should pipe the request stream to the user stream', done => {
        const fakeData = {
          a: 'a',
        };

        transaction.requestStream(config).on('error', done).on('data', data => {
          assert.strictEqual(data, fakeData);
          done();
        });

        fakeStream.push(fakeData);
      });

      it('should emit non-abort errors to the user stream', done => {
        const error = new Error('ohnoes');
        const userStream = transaction.requestStream(config);

        userStream.destroy = (err: Error) => {
          assert.strictEqual(err, error);
          done();
        };

        fakeStream.emit('error', error);
      });

      it('isRetryableErrorCode should be called on error', done => {
        const error = {code: 'sentinel'};
        const userStream = transaction.requestStream(config);

        transaction.isRetryableErrorCode_ = (code: number) => {
          assert.strictEqual(code, error.code);
          done();
        };

        userStream.destroy = () => {};

        fakeStream.emit('error', error);
      });

      it('should retry the transaction for UNKNOWN', done => {
        const error = {code: 2};
        const fakeDelay = 123;
        const attempts_ = 321;
        const getRetryDelay = Transaction.getRetryDelay_;

        Transaction.getRetryDelay_ = (err: Error, attempts: number) => {
          assert.strictEqual(err, error);
          assert.strictEqual(attempts, attempts_);
          Transaction.getRetryDelay_ = getRetryDelay;
          return fakeDelay;
        };

        transaction.shouldRetry_ = (err: Error) => {
          assert.strictEqual(err, error);
          return true;
        };

        transaction.runFn_ = done;  // should not be called
        transaction.attempts_ = attempts_;

        transaction.retry_ = (delay: number) => {
          assert.strictEqual(delay, fakeDelay);
          assert(stream._destroyed);
          done();
        };

        const stream = transaction.requestStream(config);
        stream.on('error', done);  // should not be called

        fakeStream.emit('error', error);
      });

      it('should retry the transaction for ABORTED', done => {
        const error = {code: 10};
        const fakeDelay = 123;
        const getRetryDelay = Transaction.getRetryDelay_;

        Transaction.getRetryDelay_ = (err: Error) => {
          assert.strictEqual(err, error);
          Transaction.getRetryDelay_ = getRetryDelay;
          return fakeDelay;
        };

        transaction.shouldRetry_ = (err: Error) => {
          assert.strictEqual(err, error);
          return true;
        };

        transaction.runFn_ = done;  // should not be called

        transaction.retry_ = (delay: number) => {
          assert.strictEqual(delay, fakeDelay);
          assert(stream._destroyed);
          done();
        };

        const stream = transaction.requestStream(config);
        stream.on('error', done);  // should not be called

        fakeStream.emit('error', error);
      });

      it('should send a deadline error to the runFn', done => {
        const error = {code: 10};
        const deadlineError = {};
        const createDeadlineError = Transaction.createDeadlineError_;

        Transaction.createDeadlineError_ = (err: Error) => {
          assert.strictEqual(err, error);
          return deadlineError;
        };

        transaction.shouldRetry_ = (err: Error) => {
          assert.strictEqual(err, error);
          return false;
        };

        transaction.retry_ = done;  // should not be called

        transaction.runFn_ = (err: Error) => {
          assert.strictEqual(err, deadlineError);
          assert(stream._destroyed);

          Transaction.createDeadlineError_ = createDeadlineError;
          done();
        };

        const stream = transaction.requestStream(config);
        stream.on('error', done);  // should not be called
        fakeStream.emit('error', error);
      });
    });
  });

  describe('rollback', () => {
    beforeEach(() => {
      transaction.id = ID;
    });

    it('should return an error if transaction ID is not set', done => {
      const expectedError =
          new Error('Transaction ID is unknown, nothing to rollback.');

      delete transaction.id;

      transaction.rollback(err => {
        assert.deepStrictEqual(err, expectedError);
        done();
      });
    });

    it('should make the correct request', done => {
      transaction.request = (config) => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'rollback');
        assert.deepStrictEqual(config.reqOpts, {
          transactionId: transaction.id,
        });

        done();
      };

      transaction.rollback(assert.ifError);
    });

    it('should execute callback with error & API response', done => {
      const error = new Error('Error.');
      const apiResponse = {};

      transaction.request = (config, callback) => {
        callback(error, apiResponse);
      };

      transaction.end = () => {
        done(new Error('Should not be destroyed.'));
      };

      transaction.rollback((err, apiResponse_) => {
        assert.strictEqual(err, error);
        assert.strictEqual(apiResponse_, apiResponse);
        done();
      });
    });

    it('should destroy the transaction if rollback worked', done => {
      const apiResponse = {};

      transaction.request = (config, callback) => {
        callback(null, apiResponse);
      };

      let destroyed = false;
      transaction.end = callback => {
        destroyed = true;
        callback(null);
      };

      transaction.rollback((err, apiResponse_) => {
        assert.strictEqual(err, null);
        assert.strictEqual(apiResponse_, apiResponse);
        assert.strictEqual(destroyed, true);
        done();
      });
    });
  });

  describe('run', () => {
    it('should call and collect results from a stream', done => {
      const query = {};

      const rows = [{}, {}];
      const fakeStats = {};

      transaction.runStream = (query_: {}) => {
        assert.strictEqual(query_, query);

        const stream = through.obj();

        setImmediate(() => {
          stream.emit('stats', fakeStats);

          split(rows, stream).then(() => {
            stream.end();
          });
        });

        return stream;
      };

      transaction.run(query, (err, rows_, stats) => {
        assert.ifError(err);
        assert.deepStrictEqual(rows_, rows);
        assert.strictEqual(stats, fakeStats);
        done();
      });
    });

    it('should execute callback with error', done => {
      const error = new Error('Error.');

      transaction.runStream = () => {
        const stream = through.obj();

        setImmediate(() => {
          stream.destroy(error);
        });

        return stream;
      };

      transaction.run({}, err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return a promise when callback is not specified', () => {
      const query = {};

      const rows = [{}, {}];

      transaction.runStream = (query_: {}) => {
        assert.strictEqual(query_, query);
        const stream = through.obj();
        setImmediate(() => {
          split(rows, stream).then(() => {
            stream.end();
          });
        });
        return stream;
      };

      return transaction.run(query).then(args => {
        assert.deepStrictEqual(args[0], rows);
      });
    });
  });

  describe('runStream', () => {
    const QUERY = {
      sql: 'SELECT * FROM table',
      a: 'b',
      c: 'd',
    };

    const OPTIONS = {
      timestampBoundOptions: true,
    };

    const ENCODED_QUERY = extend({}, QUERY);

    const EXPECTED_REQ_OPTS = extend({}, QUERY, {
      transaction: {
        id: ID,
      },
    });

    beforeEach(() => {
      transaction = new Transaction(SESSION, OPTIONS);
      transaction.id = ID;

      fakeCodec.encodeQuery = () => {
        return ENCODED_QUERY;
      };
    });

    it('should make the correct request', done => {
      fakeCodec.encodeQuery = query => {
        assert.strictEqual(query, QUERY);
        return ENCODED_QUERY;
      };

      transaction.requestStream = config => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'executeStreamingSql');
        assert.deepStrictEqual(config.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      const stream = transaction.runStream(QUERY, OPTIONS);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should accept a query string', done => {
      fakeCodec.encodeQuery = (query) => {
        assert.strictEqual(query.sql, QUERY.sql);
        return ENCODED_QUERY;
      };

      transaction.requestStream = (options) => {
        assert.deepStrictEqual(options.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      const stream = transaction.runStream(QUERY.sql, OPTIONS);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should not require a transaction ID', done => {
      delete transaction.id;

      transaction.requestStream = (options) => {
        const expectedReqOpts = extend(true, {}, EXPECTED_REQ_OPTS, {
          transaction: {
            singleUse: {
              readOnly: OPTIONS,
            },
          },
        });

        delete expectedReqOpts.transaction.id;
        assert.deepStrictEqual(options.reqOpts, expectedReqOpts);
        done();
      };

      const stream = transaction.runStream(QUERY, OPTIONS);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should not require timestamp bounds', done => {
      delete transaction.id;
      delete transaction.options;

      transaction.requestStream = (options) => {
        const expectedReqOpts = extend(true, {}, EXPECTED_REQ_OPTS, {
          transaction: {
            singleUse: {
              readOnly: {},
            },
          },
        });
        delete expectedReqOpts.transaction.id;
        assert.deepStrictEqual(options.reqOpts, expectedReqOpts);
        done();
      };

      const stream = transaction.runStream(QUERY);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should return PartialResultStream', () => {
      const stream = transaction.runStream(QUERY, OPTIONS);
      assert.strictEqual(stream.partialResultStream, fakePartialResultStream);
    });

    it('should assign a resumeToken to the request', done => {
      const resumeToken = 'resume-token';

      transaction.requestStream = (options) => {
        assert.strictEqual(options.reqOpts.resumeToken, resumeToken);
        done();
      };

      const stream = transaction.runStream(QUERY, OPTIONS);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn(resumeToken);
    });
  });

  describe('runUpdate', () => {
    it('should run the query', done => {
      const fakeQuery = {sql: 'SELECT 1'};
      const expectedQuery = extend({seqno: transaction.seqno}, fakeQuery);

      transaction.run = (query: {}) => {
        assert.deepStrictEqual(query, expectedQuery);
        done();
      };

      transaction.runUpdate(fakeQuery, assert.ifError);
    });

    it('should accept a sql string', done => {
      const fakeQuery = 'SELECT 1';
      const expectedQuery = {
        sql: fakeQuery,
        seqno: transaction.seqno,
      };

      transaction.run = (query: {}) => {
        assert.deepStrictEqual(query, expectedQuery);
        done();
      };

      transaction.runUpdate(fakeQuery, assert.ifError);
    });

    it('should return any request errors', done => {
      const error = new Error('err');

      transaction.run = (query, callback) => {
        callback(error);
      };

      transaction.runUpdate({}, err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return the rowCount if available', done => {
      const stats = {
        rowCount: 'rowCountExact',
        rowCountExact: 5,
      };

      transaction.run = (query, callback) => {
        callback(null, [], stats);
      };

      transaction.runUpdate({}, (err, rowCount) => {
        assert.strictEqual(rowCount, stats.rowCountExact);
        done();
      });
    });
  });

  describe('retry_', () => {
    it('should begin the transaction', done => {
      transaction.begin = () => {
        done();
      };

      transaction.retry_();
    });

    it('should return an error if transaction cannot begin', done => {
      const error = new Error('Error.');

      transaction.begin = (callback) => {
        callback(error);
      };

      transaction.runFn_ = (err: Error) => {
        assert.strictEqual(err, error);
        done();
      };

      transaction.retry_();
    });

    describe('transaction began successfully', () => {
      const fakeDelay = 1123123;
      let _setTimeout;

      before(() => {
        _setTimeout = global.setTimeout;
      });

      beforeEach(() => {
        // tslint:disable-next-line no-any
        (global as any).setTimeout = () => {};
        transaction.runFn_ = () => {};
        transaction.begin = (callback) => callback();
      });

      after(() => {
        global.setTimeout = _setTimeout;
      });

      it('should empty queued mutations', () => {
        transaction.queuedMutations_ = [{}];
        transaction.retry_(fakeDelay);

        assert.deepStrictEqual(transaction.queuedMutations_, []);
      });

      it('should execute run function after timeout', done => {
        // tslint:disable-next-line no-any
        (global as any).setTimeout = (cb, timeout) => {
          assert.strictEqual(timeout, fakeDelay);
          cb();
        };

        transaction.runFn_ = (err, txn) => {
          assert.strictEqual(err, null);
          assert.strictEqual(txn, transaction);
          done();
        };

        transaction.retry_(fakeDelay);
      });
    });
  });

  describe('shouldRetry_', () => {
    let abortedError;
    let unknownError;

    beforeEach(() => {
      abortedError = {
        code: 10,
        metadata: {
          get() {
            return [];
          },
        },
      };
      unknownError = {
        code: 2,
        metadata: {
          get() {
            return [];
          },
        },
      };
    });

    it('should pass error code to isRetryableErrorCode', () => {
      const error = {code: 'sentinel'};

      const isRetryableErrorCode = Transaction.isRetryableErrorCode_;
      Transaction.isRetryableErrorCode_ = (code: number) => {
        assert.strictEqual(code, error.code);
        return isRetryableErrorCode(code);
      };

      transaction.shouldRetry_(error);
    });

    it('should not retry if non-aborted error', () => {
      const shouldRetry = transaction.shouldRetry_({code: 4});
      assert.strictEqual(shouldRetry, false);
    });

    it('should not retry if runFn is missing', () => {
      transaction.runFn_ = null;

      const shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, false);
    });

    it('should not retry if deadline is exceeded', () => {
      transaction.timeout_ = 1;
      transaction.beginTime_ = Date.now() - 2;

      const shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, false);
    });

    it('should retry if all conditions are met - Aborted', () => {
      transaction.runFn_ = () => {};
      transaction.timeout_ = 1000;
      transaction.beginTime_ = Date.now() - 2;
      abortedError.metadata.get = (key) => {
        assert.strictEqual(key, 'google.rpc.retryinfo-bin');
        return [{}];
      };

      const shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, true);
    });

    it('should retry if all conditions are met - Unknown', () => {
      transaction.runFn_ = () => {};
      transaction.timeout_ = 1000;
      transaction.beginTime_ = Date.now() - 2;
      unknownError.metadata.get = (key) => {
        assert.strictEqual(key, 'google.rpc.retryinfo-bin');
        return [{}];
      };

      const shouldRetry = transaction.shouldRetry_(unknownError);
      assert.strictEqual(shouldRetry, true);
    });
  });

  describe('isRetryableErrorCode_', () => {
    const abortedErrorCode = 10;
    const unknownErrorCode = 2;

    it('should return true for ABORTED', () => {
      const isRetryable = transaction.isRetryableErrorCode_(abortedErrorCode);
      assert.strictEqual(isRetryable, true);
    });

    it('should return true for UNKNOWN', () => {
      const isRetryable = transaction.isRetryableErrorCode_(unknownErrorCode);
      assert.strictEqual(isRetryable, true);
    });

    it('should return false for other error codes', () => {
      const isRetryable = transaction.isRetryableErrorCode_(4);
      assert.strictEqual(isRetryable, false);
    });
  });
});
