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
    util.promisifyAll(Class, options);
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

describe('Transaction', function() {
  let TransactionCached;
  let Transaction;
  let transaction;

  const SESSION = {
    request: util.noop,
    formattedName_: 'formatted-session-name',
  };

  const ID = 'transaction-id';

  before(function() {
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

  beforeEach(function() {
    FakeGrpcService.objToStruct_ = util.noop;
    FakeRetryInfo.decode = util.noop;

    extend(Transaction, TransactionCached);
    transaction = new Transaction(SESSION);
  });

  describe('instantiation', function() {
    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should localize the session', function() {
      assert.strictEqual(transaction.session, SESSION);
    });

    it('should set flag to identify as a Transaction object', function() {
      assert.strictEqual(transaction.transaction, true);
    });

    it('should initialize an empty queue', function() {
      assert.deepStrictEqual(transaction.queuedMutations_, []);
    });

    it('should initialize a null run function', function() {
      assert.strictEqual(transaction.runFn_, null);
    });

    it('should set ended_ to false', function() {
      assert.strictEqual(transaction.ended_, false);
    });

    it('should inherit from TransactionRequest', function() {
      const OPTIONS = {};

      transaction = new Transaction(SESSION, OPTIONS);

      assert(transaction instanceof FakeTransactionRequest);
      assert(transaction.calledWith_[0], OPTIONS);
    });

    describe('timeout_', function() {
      it('should default to the commit timeout', function() {
        assert.strictEqual(transaction.timeout_, FAKE_COMMIT_TIMEOUT);
      });

      it('should capture the user timeout', function() {
        const timeout = 321;
        const transaction = new Transaction(SESSION, {timeout});

        assert.strictEqual(transaction.timeout_, timeout);
        // check to make sure the timeout isn't captured for requests
        assert.deepStrictEqual(transaction.calledWith_[0], {});
      });

      it('should ignore non-number values', function() {
        const timeout = 'abc';
        const transaction = new Transaction(SESSION, {timeout});

        assert.strictEqual(transaction.timeout_, FAKE_COMMIT_TIMEOUT);
      });

      it('should not alter user options', function() {
        const options = {timeout: 1234};
        const optionsCopy = Object.assign({}, options);
        const transaction = new Transaction(SESSION, options);

        assert.strictEqual(transaction.timeout_, options.timeout);
        assert.deepStrictEqual(options, optionsCopy);
      });
    });
  });

  describe('createDeadlineError_', function() {
    it('should augment the error', function() {
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
        'Deadline for Transaction exceeded.'
      );
      assert.deepStrictEqual(originalError, formattedError.errors[0]);
      assert.notStrictEqual(originalError, formattedError);
    });
  });

  describe('getRetryDelay_', function() {
    it('should return the retry delay', function() {
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
  });

  describe('begin', function() {
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

    it('should make the correct request', function(done) {
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

    it('should not require options', function(done) {
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

    it('should execute callback with error', function(done) {
      const error = new Error('Error.');

      transaction.request = function(config, callback) {
        callback(error);
      };

      transaction.begin(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    describe('success', function() {
      const API_RESPONSE = {
        id: 'transaction-id',
      };

      beforeEach(function() {
        transaction.request = function(config, callback) {
          callback(null, API_RESPONSE);
        };
      });

      it('should set ended_ to false', function(done) {
        transaction.begin(function(err) {
          assert.ifError(err);
          assert.strictEqual(transaction.ended_, false);
          done();
        });
      });

      it('should update ID', function(done) {
        transaction.begin(function(err) {
          assert.ifError(err);
          assert.strictEqual(transaction.id, API_RESPONSE.id);
          done();
        });
      });

      it('should update metadata', function(done) {
        transaction.begin(function(err) {
          assert.ifError(err);
          assert.strictEqual(transaction.metadata, API_RESPONSE);
          done();
        });
      });

      it('should execute callback with API response', function(done) {
        transaction.begin(function(err, apiResponse) {
          assert.ifError(err);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });

      it('should set the timestamp if applicable', function(done) {
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

        transaction.begin(function(err) {
          assert.ifError(err);
          assert.strictEqual(transaction.readTimestamp, fakeDate);
          done();
        });
      });
    });
  });

  describe('commit', function() {
    const QUEUED_MUTATIONS = [{}];

    beforeEach(function() {
      transaction.queuedMutations_ = QUEUED_MUTATIONS;
    });

    it('should throw an error if the transaction was ended', function() {
      transaction.ended_ = true;

      assert.throws(function() {
        transaction.commit(assert.ifError);
      }, /Transaction has already been ended\./);
    });

    it('should make the correct request with an ID', function(done) {
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

    it('should make the correct request without an ID', function(done) {
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

    describe('error', function() {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(function() {
        transaction.request = function(config, callback) {
          callback(ERROR, API_RESPONSE);
        };
      });

      it('should execute callback with error and API response', function(done) {
        transaction.commit(function(err, apiResponse) {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });

    describe('success', function() {
      const API_RESPONSE = {};

      beforeEach(function() {
        transaction.request = function(config, callback) {
          callback(null, API_RESPONSE);
        };
      });

      it('should destroy the transaction', function(done) {
        transaction.end = done;
        transaction.commit(assert.ifError);
      });

      it('should execute callback with the API response', function(done) {
        transaction.commit(function(err, apiResponse) {
          assert.ifError(err);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });
  });

  describe('end', function() {
    it('should throw an error if the transaction was ended', function() {
      transaction.ended_ = true;

      assert.throws(function() {
        transaction.end(assert.ifError);
      }, /Transaction has already been ended\./);
    });

    it('should set ended_ to true', function() {
      transaction.end();

      assert.strictEqual(transaction.ended_, true);
    });

    it('should empty the queue', function() {
      transaction.queuedMutations_ = [{}, {}];

      transaction.end();

      assert.strictEqual(transaction.queuedMutations_.length, 0);
    });

    it('should nullify the run function', function() {
      transaction.runFn_ = function() {};

      transaction.end();

      assert.strictEqual(transaction.runFn_, null);
    });

    it('should delete the ID', function() {
      transaction.id = 'transaction-id';

      transaction.end();

      assert.strictEqual(transaction.id, undefined);
    });

    it('should optionally execute a callback', function(done) {
      transaction.end(done);
    });
  });

  describe('queue_', function() {
    it('should push a mutation object into the queue array', function() {
      const mutation = {};

      assert.deepStrictEqual(transaction.queuedMutations_, []);

      transaction.queue_(mutation);

      assert.strictEqual(transaction.queuedMutations_[0], mutation);
    });
  });

  describe('request', function() {
    it('should make the correct request', function(done) {
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

    it('should pass the response back to the callback', function(done) {
      const resp = {};

      const config = {
        reqOpts: {},
      };

      transaction.session.request = function(config_, callback) {
        callback(null, resp);
      };

      transaction.request(config, function(err, apiResponse) {
        assert.ifError(err);
        assert.strictEqual(apiResponse, resp);
        done();
      });
    });

    describe('aborted errors', function() {
      const abortedError = {code: 10};
      const resp = {};

      const fakeDelay = 123;
      const config = {};
      let getRetryDelay;

      before(function() {
        getRetryDelay = Transaction.getRetryDelay_;
      });

      beforeEach(function() {
        transaction.session.request = function(config, callback) {
          callback(abortedError, resp);
        };

        Transaction.getRetryDelay_ = function() {
          return fakeDelay;
        };
      });

      after(function() {
        Transaction.getRetryDelay_ = getRetryDelay;
      });

      it('should pass error code to isRetryableErrorCode', function(done) {
        transaction.runFn_ = function() {};

        const config = {
          reqOpts: {},
        };

        transaction.isRetryableErrorCode_ = function(code) {
          assert.strictEqual(code, abortedError.code);
          done();
        };

        transaction.request(config, function() {});
      });

      it('should retry the txn if abort occurs', function(done) {
        Transaction.getRetryDelay_ = function(err) {
          assert.strictEqual(err, abortedError);
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

        transaction.request(config, function() {
          done(new Error('Should not have been called.'));
        });
      });

      it('should return a deadline error if not retrying', function(done) {
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

        transaction.request(config, function() {
          done(new Error('Should not have been called.'));
        });
      });

      it('should return the aborted error if no runFn', function(done) {
        transaction.runFn_ = null;

        transaction.request(config, function(err) {
          assert.strictEqual(err, abortedError);
          done();
        });
      });
    });
  });

  describe('requestStream', function() {
    it('should make the correct request', function() {
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

    describe('runTransaction mode', function() {
      let fakeStream;

      const config = {
        reqOpts: {},
      };

      beforeEach(function() {
        fakeStream = through.obj();
        transaction.session.requestStream = function() {
          return fakeStream;
        };
        transaction.runFn_ = function() {};
      });

      it('should pipe the request stream to the user stream', function(done) {
        const fakeData = {
          a: 'a',
        };

        transaction
          .requestStream(config)
          .on('error', done)
          .on('data', function(data) {
            assert.strictEqual(data, fakeData);
            done();
          });

        fakeStream.push(fakeData);
      });

      it('should emit non-abort errors to the user stream', function(done) {
        const error = new Error('ohnoes');
        const userStream = transaction.requestStream(config);

        userStream.destroy = function(err) {
          assert.strictEqual(err, error);
          done();
        };

        fakeStream.emit('error', error);
      });

      it('isRetryableErrorCode should be called on error', function(done) {
        const error = {code: 'sentinel'};
        const userStream = transaction.requestStream(config);

        transaction.isRetryableErrorCode_ = function(code) {
          assert.strictEqual(code, error.code);
          done();
        };

        userStream.destroy = function() {};

        fakeStream.emit('error', error);
      });

      it('should retry the transaction for UNKNOWN', function(done) {
        const error = {code: 2};
        const fakeDelay = 123;
        let stream;
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

        stream = transaction.requestStream(config);
        stream.on('error', done); // should not be called

        fakeStream.emit('error', error);
      });

      it('should retry the transaction for ABORTED', function(done) {
        const error = {code: 10};
        const fakeDelay = 123;
        let stream;

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

        stream = transaction.requestStream(config);
        stream.on('error', done); // should not be called

        fakeStream.emit('error', error);
      });

      it('should send a deadline error to the runFn', function(done) {
        const error = {code: 10};
        let stream;

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

        stream = transaction.requestStream(config);
        stream.on('error', done); // should not be called

        fakeStream.emit('error', error);
      });
    });
  });

  describe('rollback', function() {
    beforeEach(function() {
      transaction.id = ID;
    });

    it('should throw if a transaction ID is not set', function() {
      delete transaction.id;

      assert.throws(function() {
        transaction.rollback(assert.ifError);
      }, /Transaction ID is unknown, nothing to rollback\./);
    });

    it('should make the correct request', function(done) {
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

    it('should execute callback with error & API response', function(done) {
      const error = new Error('Error.');
      const apiResponse = {};

      transaction.request = function(config, callback) {
        callback(error, apiResponse);
      };

      transaction.end = function() {
        done(new Error('Should not be destroyed.'));
      };

      transaction.rollback(function(err, apiResponse_) {
        assert.strictEqual(err, error);
        assert.strictEqual(apiResponse_, apiResponse);
        done();
      });
    });

    it('should destroy the transaction if rollback worked', function(done) {
      const apiResponse = {};

      transaction.request = function(config, callback) {
        callback(null, apiResponse);
      };

      let destroyed = false;
      transaction.end = function() {
        destroyed = true;
      };

      transaction.rollback(function(err, apiResponse_) {
        assert.strictEqual(err, null);
        assert.strictEqual(apiResponse_, apiResponse);
        assert.strictEqual(destroyed, true);
        done();
      });
    });
  });

  describe('run', function() {
    it('should call and collect results from a stream', function(done) {
      const query = {};

      const rows = [{}, {}];

      transaction.runStream = function(query_) {
        assert.strictEqual(query_, query);

        const stream = through.obj();

        setImmediate(function() {
          split(rows, stream).then(function() {
            stream.end();
          });
        });

        return stream;
      };

      transaction.run(query, function(err, rows_) {
        assert.ifError(err);
        assert.deepStrictEqual(rows_, rows);
        done();
      });
    });

    it('should execute callback with error', function(done) {
      const error = new Error('Error.');

      transaction.runStream = function() {
        const stream = through.obj();

        setImmediate(function() {
          stream.destroy(error);
        });

        return stream;
      };

      transaction.run({}, function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return a promise when callback is not specified', function() {
      const query = {};

      const rows = [{}, {}];

      transaction.runStream = function(query_) {
        assert.strictEqual(query_, query);

        const stream = through.obj();

        setImmediate(function() {
          split(rows, stream).then(function() {
            stream.end();
          });
        });

        return stream;
      };

      return transaction.run(query).then(function(args) {
        assert.deepStrictEqual(args[0], rows);
      });
    });
  });

  describe('runStream', function() {
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

    beforeEach(function() {
      transaction = new Transaction(SESSION, OPTIONS);
      transaction.id = ID;

      fakeCodec.encodeQuery = function() {
        return ENCODED_QUERY;
      };
    });

    it('should make the correct request', function(done) {
      fakeCodec.encodeQuery = function(query) {
        assert.strictEqual(query, QUERY);
        return ENCODED_QUERY;
      };

      transaction.requestStream = function(config) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'executeStreamingSql');
        assert.deepStrictEqual(config.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      const stream = transaction.runStream(QUERY, OPTIONS);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should accept a query string', function(done) {
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

    it('should not require a transaction ID', function(done) {
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

    it('should not require timestamp bounds', function(done) {
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

    it('should return PartialResultStream', function() {
      const stream = transaction.runStream(QUERY, OPTIONS);
      assert(stream instanceof FakePartialResultStream);
    });

    it('should assign a resumeToken to the request', function(done) {
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

  describe('retry_', function() {
    it('should begin the transaction', function(done) {
      transaction.begin = function() {
        done();
      };

      transaction.retry_();
    });

    it('should return an error if transaction cannot begin', function(done) {
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

    describe('transaction began successfully', function() {
      const fakeDelay = 1123123;
      let _setTimeout;

      before(function() {
        _setTimeout = global.setTimeout;
      });

      beforeEach(function() {
        global.setTimeout = function() {};
        transaction.runFn_ = function() {};

        transaction.begin = function(callback) {
          callback();
        };
      });

      after(function() {
        global.setTimeout = _setTimeout;
      });

      it('should empty queued mutations', function() {
        transaction.queuedMutations_ = [{}];
        transaction.retry_(fakeDelay);

        assert.deepStrictEqual(transaction.queuedMutations_, []);
      });

      it('should execute run function after timeout', function(done) {
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

  describe('shouldRetry_', function() {
    let abortedError;
    let unknownError;

    beforeEach(function() {
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

    it('should pass error code to isRetryableErrorCode', function() {
      const error = {code: 'sentinel'};

      const isRetryableErrorCode = Transaction.isRetryableErrorCode_;
      Transaction.isRetryableErrorCode_ = function(code) {
        assert.strictEqual(code, error.code);
        return isRetryableErrorCode(code);
      };

      transaction.shouldRetry_(error);
    });

    it('should not retry if non-aborted error', function() {
      const shouldRetry = transaction.shouldRetry_({code: 4});
      assert.strictEqual(shouldRetry, false);
    });

    it('should not retry if runFn is missing', function() {
      transaction.runFn_ = null;

      const shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, false);
    });

    it('should not retry if deadline is exceeded', function() {
      transaction.timeout_ = 1;
      transaction.beginTime_ = Date.now() - 2;

      const shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, false);
    });

    it('should not retry if retry info metadata is absent', function() {
      transaction.runFn_ = function() {};
      transaction.timeout_ = 1000;
      transaction.beginTime_ = Date.now() - 2;

      const shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, false);
    });

    it('should retry if all conditions are met - Aborted', function() {
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

    it('should retry if all conditions are met - Unknown', function() {
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

  describe('isRetryableErrorCode_', function() {
    const abortedErrorCode = 10;
    const unknownErrorCode = 2;

    it('should return true for ABORTED', function() {
      const isRetryable = transaction.isRetryableErrorCode_(abortedErrorCode);
      assert.strictEqual(isRetryable, true);
    });

    it('should return true for UNKNOWN', function() {
      const isRetryable = transaction.isRetryableErrorCode_(unknownErrorCode);
      assert.strictEqual(isRetryable, true);
    });

    it('should return false for other error codes', function() {
      const isRetryable = transaction.isRetryableErrorCode_(4);
      assert.strictEqual(isRetryable, false);
    });
  });
});
