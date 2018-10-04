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

'use strict';

const assert = require('assert');
const common = require('@google-cloud/common-grpc');
const extend = require('extend');
const gax = require('google-gax');
const path = require('path');
const proxyquire = require('proxyquire');
const {split} = require('split-array-stream');
const through = require('through2');
const {util} = require('@google-cloud/common-grpc');
const pfy = require('@google-cloud/promisify');

const FakeRetryInfo = {
  decode: util.noop,
};

const fakeGax = {
  GoogleProtoFilesRoot: class extends gax.GoogleProtoFilesRoot {
    loadSync(filename) {
      assert.strictEqual(
        filename,
        path.resolve(__dirname, '../protos/google/rpc/error_details.proto')
      );
      const result = super.loadSync(filename);
      const n = 'nested';
      result[n].google[n].rpc[n].RetryInfo = FakeRetryInfo;
      return result;
    }
  },
};

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'Transaction') {
      return;
    }
    promisified = true;
    assert.strictEqual(options, undefined);
    pfy.promisifyAll(Class, options);
  },
});

function FakeGrpcService() {}

function FakePartialResultStream() {
  this.calledWith_ = arguments;
}

function FakeTransactionRequest(options) {
  this.calledWith_ = arguments;
  this.options = options;
}

const fakeCodec = {
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
  let TransactionCached;
  let Transaction;
  let transaction;

  const SESSION = {
    request: util.noop,
    formattedName_: 'formatted-session-name',
  };

  const ID = 'transaction-id';

  before(() => {
    Transaction = proxyquire('../src/transaction', {
      'google-gax': fakeGax,
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService,
      },
      '@google-cloud/promisify': fakePfy,
      './codec': fakeCodec,
      './partial-result-stream': FakePartialResultStream,
      './transaction-request': FakeTransactionRequest,
      './v1/spanner_client_config.json': fakeConfig,
    });

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
      assert(transaction.calledWith_[0], OPTIONS);
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
        'Deadline for Transaction exceeded. - Transaction aborted.'
      );
      assert.strictEqual(typeof formattedError, typeof common.util.ApiError());
      assert.deepStrictEqual(originalError, formattedError.errors[0]);
      assert.notStrictEqual(originalError, formattedError);
    });
  });

  describe('getRetryDelay_', () => {
    it('should return the retry delay when available', () => {
      const fakeError = new Error('err');
      const fakeRetryInfo = Buffer.from('hi');

      fakeError.metadata = {
        get: function(key) {
          assert.strictEqual(key, 'google.rpc.retryinfo-bin');
          return [fakeRetryInfo];
        },
      };

      const seconds = 25;
      const nanos = 100;

      FakeRetryInfo.decode = function(retryInfo) {
        assert.strictEqual(retryInfo, fakeRetryInfo);

        return {
          retryDelay: {
            seconds: {
              toNumber: function() {
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

      fakeError.metadata = {
        get: function() {
          return [];
        },
      };

      const random = Math.random();
      const _random = Math.random;

      global.Math.random = function() {
        return random;
      };

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
      transaction.request = function(config) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'beginTransaction');
        assert.deepStrictEqual(config.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      transaction.begin(assert.ifError);
    });

    it('should not require options', done => {
      transaction.readOnly = false;
      transaction.request = function(config) {
        assert.deepStrictEqual(config.reqOpts, {
          options: {
            readWrite: {},
          },
        });
        done();
      };

      transaction.begin(assert.ifError);
    });

    it('should execute callback with error', done => {
      const error = new Error('Error.');

      transaction.request = function(config, callback) {
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
        transaction.request = function(config, callback) {
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

        transaction.request = function(config, callback) {
          callback(
            null,
            extend(
              {
                readTimestamp: fakeProtoTimestamp,
              },
              API_RESPONSE
            )
          );
        };

        FakeTransactionRequest.fromProtoTimestamp_ = function(value) {
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

    it('should throw an error if the transaction was ended', () => {
      transaction.ended_ = true;

      assert.throws(() => {
        transaction.commit(assert.ifError);
      }, /Transaction has already been ended\./);
    });

    it('should make the correct request with an ID', done => {
      transaction.id = 'transaction-id';

      transaction.request = function(config) {
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

      transaction.request = function(config) {
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
        transaction.request = function(config, callback) {
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
        transaction.request = function(config, callback) {
          callback(null, API_RESPONSE);
        };
      });

      it('should destroy the transaction', done => {
        transaction.end = done;
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
    it('should throw an error if the transaction was ended', () => {
      transaction.ended_ = true;

      assert.throws(() => {
        transaction.end(assert.ifError);
      }, /Transaction has already been ended\./);
    });

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
      transaction.runFn_ = function() {};

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

      transaction.session.request = function(config_) {
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

      transaction.session.request = function(config_, callback) {
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
        transaction.session.request = function(config, callback) {
          callback(abortedError, resp);
        };

        Transaction.getRetryDelay_ = function() {
          return fakeDelay;
        };
      });

      after(() => {
        Transaction.getRetryDelay_ = getRetryDelay;
      });

      it('should pass error code to isRetryableErrorCode', done => {
        transaction.runFn_ = function() {};

        const config = {
          reqOpts: {},
        };

        transaction.isRetryableErrorCode_ = function(code) {
          assert.strictEqual(code, abortedError.code);
          done();
        };

        transaction.request(config, () => {});
      });

      it('should retry the txn if abort occurs', done => {
        const attempts_ = 123;

        Transaction.getRetryDelay_ = function(err, attempts) {
          assert.strictEqual(err, abortedError);
          assert.strictEqual(attempts, attempts_);
          return fakeDelay;
        };

        transaction.retry_ = function(delay) {
          assert.strictEqual(delay, fakeDelay);
          done();
        };

        transaction.shouldRetry_ = function(err) {
          assert.strictEqual(err, abortedError);
          return true;
        };

        transaction.runFn_ = function() {
          done(new Error('Should not have been called.'));
        };

        transaction.attempts_ = attempts_;

        transaction.request(config, () => {
          done(new Error('Should not have been called.'));
        });
      });

      it('should return a deadline error if not retrying', done => {
        transaction.retry_ = function() {
          done(new Error('Should not have been called.'));
        };

        transaction.shouldRetry_ = function(err) {
          assert.strictEqual(err, abortedError);
          return false;
        };

        const createDeadlineError = Transaction.createDeadlineError_;
        const deadlineError = {};

        Transaction.createDeadlineError_ = function(err) {
          assert.strictEqual(err, abortedError);
          return deadlineError;
        };

        transaction.runFn_ = function(err) {
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

      transaction.session.requestStream = function(config_) {
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
        transaction.session.requestStream = function() {
          return fakeStream;
        };
        transaction.runFn_ = function() {};
      });

      it('should pipe the request stream to the user stream', done => {
        const fakeData = {
          a: 'a',
        };

        transaction
          .requestStream(config)
          .on('error', done)
          .on('data', data => {
            assert.strictEqual(data, fakeData);
            done();
          });

        fakeStream.push(fakeData);
      });

      it('should emit non-abort errors to the user stream', done => {
        const error = new Error('ohnoes');
        const userStream = transaction.requestStream(config);

        userStream.destroy = function(err) {
          assert.strictEqual(err, error);
          done();
        };

        fakeStream.emit('error', error);
      });

      it('isRetryableErrorCode should be called on error', done => {
        const error = {code: 'sentinel'};
        const userStream = transaction.requestStream(config);

        transaction.isRetryableErrorCode_ = function(code) {
          assert.strictEqual(code, error.code);
          done();
        };

        userStream.destroy = function() {};

        fakeStream.emit('error', error);
      });

      it('should retry the transaction for UNKNOWN', done => {
        const error = {code: 2};
        const fakeDelay = 123;
        const attempts_ = 321;
        const getRetryDelay = Transaction.getRetryDelay_;

        Transaction.getRetryDelay_ = function(err, attempts) {
          assert.strictEqual(err, error);
          assert.strictEqual(attempts, attempts_);
          Transaction.getRetryDelay_ = getRetryDelay;
          return fakeDelay;
        };

        transaction.shouldRetry_ = function(err) {
          assert.strictEqual(err, error);
          return true;
        };

        transaction.runFn_ = done; // should not be called
        transaction.attempts_ = attempts_;

        transaction.retry_ = function(delay) {
          assert.strictEqual(delay, fakeDelay);
          assert(stream._destroyed);
          done();
        };

        const stream = transaction.requestStream(config);
        stream.on('error', done); // should not be called

        fakeStream.emit('error', error);
      });

      it('should retry the transaction for ABORTED', done => {
        const error = {code: 10};
        const fakeDelay = 123;
        const getRetryDelay = Transaction.getRetryDelay_;

        Transaction.getRetryDelay_ = function(err) {
          assert.strictEqual(err, error);
          Transaction.getRetryDelay_ = getRetryDelay;
          return fakeDelay;
        };

        transaction.shouldRetry_ = function(err) {
          assert.strictEqual(err, error);
          return true;
        };

        transaction.runFn_ = done; // should not be called

        transaction.retry_ = function(delay) {
          assert.strictEqual(delay, fakeDelay);
          assert(stream._destroyed);
          done();
        };

        const stream = transaction.requestStream(config);
        stream.on('error', done); // should not be called

        fakeStream.emit('error', error);
      });

      it('should send a deadline error to the runFn', done => {
        const error = {code: 10};
        const deadlineError = {};
        const createDeadlineError = Transaction.createDeadlineError_;

        Transaction.createDeadlineError_ = function(err) {
          assert.strictEqual(err, error);
          return deadlineError;
        };

        transaction.shouldRetry_ = function(err) {
          assert.strictEqual(err, error);
          return false;
        };

        transaction.retry_ = done; // should not be called

        transaction.runFn_ = function(err) {
          assert.strictEqual(err, deadlineError);
          assert(stream._destroyed);

          Transaction.createDeadlineError_ = createDeadlineError;
          done();
        };

        const stream = transaction.requestStream(config);
        stream.on('error', done); // should not be called
        fakeStream.emit('error', error);
      });
    });
  });

  describe('rollback', () => {
    beforeEach(() => {
      transaction.id = ID;
    });

    it('should throw if a transaction ID is not set', () => {
      delete transaction.id;

      assert.throws(() => {
        transaction.rollback(assert.ifError);
      }, /Transaction ID is unknown, nothing to rollback\./);
    });

    it('should make the correct request', done => {
      transaction.request = function(config) {
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

      transaction.request = function(config, callback) {
        callback(error, apiResponse);
      };

      transaction.end = function() {
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

      transaction.request = function(config, callback) {
        callback(null, apiResponse);
      };

      let destroyed = false;
      transaction.end = function() {
        destroyed = true;
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

      transaction.runStream = function(query_) {
        assert.strictEqual(query_, query);

        const stream = through.obj();

        setImmediate(() => {
          split(rows, stream).then(() => {
            stream.end();
          });
        });

        return stream;
      };

      transaction.run(query, (err, rows_) => {
        assert.ifError(err);
        assert.deepStrictEqual(rows_, rows);
        done();
      });
    });

    it('should execute callback with error', done => {
      const error = new Error('Error.');

      transaction.runStream = function() {
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

      transaction.runStream = function(query_) {
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
      fakeCodec.encodeQuery = function(query) {
        assert.strictEqual(query.sql, QUERY.sql);
        return ENCODED_QUERY;
      };

      transaction.requestStream = function(options) {
        assert.deepStrictEqual(options.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      const stream = transaction.runStream(QUERY.sql, OPTIONS);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should not require a transaction ID', done => {
      delete transaction.id;

      transaction.requestStream = function(options) {
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

      transaction.requestStream = function(options) {
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
      assert(stream instanceof FakePartialResultStream);
    });

    it('should assign a resumeToken to the request', done => {
      const resumeToken = 'resume-token';

      transaction.requestStream = function(options) {
        assert.strictEqual(options.reqOpts.resumeToken, resumeToken);
        done();
      };

      const stream = transaction.runStream(QUERY, OPTIONS);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn(resumeToken);
    });
  });

  describe('retry_', () => {
    it('should begin the transaction', done => {
      transaction.begin = function() {
        done();
      };

      transaction.retry_();
    });

    it('should return an error if transaction cannot begin', done => {
      const error = new Error('Error.');

      transaction.begin = function(callback) {
        callback(error);
      };

      transaction.runFn_ = function(err) {
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
        global.setTimeout = function() {};
        transaction.runFn_ = function() {};

        transaction.begin = function(callback) {
          callback();
        };
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
        global.setTimeout = function(cb, timeout) {
          assert.strictEqual(timeout, fakeDelay);
          cb();
        };

        transaction.runFn_ = function(err, txn) {
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
          get: function() {
            return [];
          },
        },
      };
      unknownError = {
        code: 2,
        metadata: {
          get: function() {
            return [];
          },
        },
      };
    });

    it('should pass error code to isRetryableErrorCode', () => {
      const error = {code: 'sentinel'};

      const isRetryableErrorCode = Transaction.isRetryableErrorCode_;
      Transaction.isRetryableErrorCode_ = function(code) {
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
      transaction.runFn_ = function() {};
      transaction.timeout_ = 1000;
      transaction.beginTime_ = Date.now() - 2;
      abortedError.metadata.get = function(key) {
        assert.strictEqual(key, 'google.rpc.retryinfo-bin');
        return [{}];
      };

      const shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, true);
    });

    it('should retry if all conditions are met - Unknown', () => {
      transaction.runFn_ = function() {};
      transaction.timeout_ = 1000;
      transaction.beginTime_ = Date.now() - 2;
      unknownError.metadata.get = function(key) {
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
