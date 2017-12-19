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

var assert = require('assert');
var Buffer = require('safe-buffer').Buffer;
var extend = require('extend');
var gax = require('google-gax');
var path = require('path');
var proxyquire = require('proxyquire');
var split = require('split-array-stream');
var through = require('through2');
var util = require('@google-cloud/common').util;

var FakeRetryInfo = {
  decode: util.noop,
};

var grpc = gax.grpc();
var fakeGrpc = {
  load: function(options, type, config) {
    assert.strictEqual(options.root, path.resolve(__dirname, '../protos'));
    assert.strictEqual(options.file, 'google/rpc/error_details.proto');
    assert.strictEqual(type, 'proto');
    assert.strictEqual(config.binaryAsBase64, true);
    assert.strictEqual(config.convertFieldsToCamelCase, true);

    var services = grpc.load(options, type, config);
    services.google.rpc.RetryInfo = FakeRetryInfo;
    return services;
  },
};

var fakeGax = {
  grpc: function() {
    return fakeGrpc;
  },
};

var promisified = false;
var fakeUtil = extend({}, util, {
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

var fakeCodec = {
  encode: util.noop,
};

var FAKE_COMMIT_TIMEOUT = 12345;
var fakeConfig = {
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
  var TransactionCached;
  var Transaction;
  var transaction;

  var SESSION = {
    request: util.noop,
    formattedName_: 'formatted-session-name',
  };

  var ID = 'transaction-id';

  before(function() {
    Transaction = proxyquire('../src/transaction.js', {
      'google-gax': fakeGax,
      '@google-cloud/common': {
        util: fakeUtil,
      },
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService,
      },
      './codec.js': fakeCodec,
      './partial-result-stream.js': FakePartialResultStream,
      './transaction-request.js': FakeTransactionRequest,
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
      assert.deepEqual(transaction.queuedMutations_, []);
    });

    it('should initialize a null run function', function() {
      assert.strictEqual(transaction.runFn_, null);
    });

    it('should inherit from TransactionRequest', function() {
      var OPTIONS = {};

      transaction = new Transaction(SESSION, OPTIONS);

      assert(transaction instanceof FakeTransactionRequest);
      assert(transaction.calledWith_[0], OPTIONS);
    });

    describe('timeout_', function() {
      it('should default to the commit timeout', function() {
        assert.strictEqual(transaction.timeout_, FAKE_COMMIT_TIMEOUT);
      });

      it('should capture the user timeout', function() {
        var timeout = 321;
        var transaction = new Transaction(SESSION, {timeout});

        assert.strictEqual(transaction.timeout_, timeout);
        // check to make sure the timeout isn't captured for requests
        assert.deepEqual(transaction.calledWith_[0], {});
      });

      it('should ignore non-number values', function() {
        var timeout = 'abc';
        var transaction = new Transaction(SESSION, {timeout});

        assert.strictEqual(transaction.timeout_, FAKE_COMMIT_TIMEOUT);
      });

      it('should not alter user options', function() {
        var options = {timeout: 1234};
        var optionsCopy = Object.assign({}, options);
        var transaction = new Transaction(SESSION, options);

        assert.strictEqual(transaction.timeout_, options.timeout);
        assert.deepEqual(options, optionsCopy);
      });
    });
  });

  describe('createDeadlineError_', function() {
    it('should augment the error', function() {
      var originalError = {
        code: 10,
        message: 'Transaction aborted.',
        a: 'a',
        b: 'b',
      };

      var expectedError = {
        code: 4,
        message: 'Deadline for Transaction exceeded.',
        a: 'a',
        b: 'b',
      };

      var formattedError = Transaction.createDeadlineError_(originalError);

      assert.deepEqual(expectedError, formattedError);
      assert.notStrictEqual(originalError, formattedError);
    });
  });

  describe('getRetryDelay_', function() {
    it('should return the retry delay', function() {
      var fakeError = new Error('err');
      var fakeRetryInfo = new Buffer('hi');

      fakeError.metadata = {
        get: function(key) {
          assert.strictEqual(key, 'google.rpc.retryinfo-bin');
          return [fakeRetryInfo];
        },
      };

      var seconds = 25;
      var nanos = 100;

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

      var expectedDelay = seconds * 1000 + nanos / 1e6;
      var delay = Transaction.getRetryDelay_(fakeError);

      assert.strictEqual(delay, expectedDelay);
    });
  });

  describe('begin', function() {
    var OPTIONS = {
      readOnly: true,
      boundOptions: true,
      returnReadTimestamp: true,
    };

    var EXPECTED_REQ_OPTS = {
      options: {
        readOnly: OPTIONS,
      },
    };

    it('should make the correct request', function(done) {
      var transaction = new Transaction(SESSION, OPTIONS);

      transaction.readOnly = true;
      transaction.request = function(config) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'beginTransaction');
        assert.deepEqual(config.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      transaction.begin(assert.ifError);
    });

    it('should not require options', function(done) {
      transaction.readOnly = false;
      transaction.request = function(config) {
        assert.deepEqual(config.reqOpts, {
          options: {
            readWrite: {},
          },
        });
        done();
      };

      transaction.begin(assert.ifError);
    });

    it('should execute callback with error', function(done) {
      var error = new Error('Error.');

      transaction.request = function(config, callback) {
        callback(error);
      };

      transaction.begin(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    describe('success', function() {
      var API_RESPONSE = {
        id: 'transaction-id',
      };

      beforeEach(function() {
        transaction.request = function(config, callback) {
          callback(null, API_RESPONSE);
        };
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
        var fakeProtoTimestamp = {};
        var fakeDate = new Date();

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
    var QUEUED_MUTATIONS = [{}];

    beforeEach(function() {
      transaction.queuedMutations_ = QUEUED_MUTATIONS;
    });

    it('should make the correct request with an ID', function(done) {
      transaction.id = 'transaction-id';

      transaction.request = function(config) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'commit');
        assert.deepEqual(config.reqOpts, {
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
        assert.deepEqual(config.reqOpts, {
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
      var ERROR = new Error('Error.');
      var API_RESPONSE = {};

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
      var API_RESPONSE = {};

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
      var mutation = {};

      assert.deepEqual(transaction.queuedMutations_, []);

      transaction.queue_(mutation);

      assert.strictEqual(transaction.queuedMutations_[0], mutation);
    });
  });

  describe('request', function() {
    it('should make the correct request', function(done) {
      var config = {
        reqOpts: {
          a: 'b',
          c: 'd',
        },
      };

      transaction.session.request = function(config_) {
        var expectedReqOpts = extend({}, config.reqOpts, {
          session: transaction.session.formattedName_,
        });

        assert.deepEqual(config_.reqOpts, expectedReqOpts);
        done();
      };

      transaction.request(config, assert.ifError);
    });

    it('should pass the response back to the callback', function(done) {
      var resp = {};

      var config = {
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
      var abortedError = {code: 10};
      var resp = {};

      var fakeDelay = 123;
      var config = {};
      var getRetryDelay;

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

        var createDeadlineError = Transaction.createDeadlineError_;
        var deadlineError = {};

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
      var methodReturnValue = {};

      var config = {
        reqOpts: {
          a: 'b',
          c: 'd',
        },
      };

      transaction.session.requestStream = function(config_) {
        var expectedReqOpts = extend({}, config.reqOpts, {
          session: transaction.session.formattedName_,
        });

        assert.deepEqual(config_.reqOpts, expectedReqOpts);

        return methodReturnValue;
      };

      var returnValue = transaction.requestStream(config);
      assert.strictEqual(returnValue, methodReturnValue);
    });

    describe('runTransaction mode', function() {
      var fakeStream;

      var config = {
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
        var fakeData = {
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
        var error = new Error('ohnoes');
        var userStream = transaction.requestStream(config);

        userStream.destroy = function(err) {
          assert.strictEqual(err, error);
          done();
        };

        fakeStream.emit('error', error);
      });

      it('should retry the transaction', function(done) {
        var error = {code: 10};
        var fakeDelay = 123;
        var stream;

        var getRetryDelay = Transaction.getRetryDelay_;

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
        var error = {code: 10};
        var stream;

        var deadlineError = {};
        var createDeadlineError = Transaction.createDeadlineError_;

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
        assert.deepEqual(config.reqOpts, {
          transactionId: transaction.id,
        });

        done();
      };

      transaction.rollback(assert.ifError);
    });

    it('should execute callback with error & API response', function(done) {
      var error = new Error('Error.');
      var apiResponse = {};

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
      var apiResponse = {};

      transaction.request = function(config, callback) {
        callback(null, apiResponse);
      };

      var destroyed = false;
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
      var query = {};

      var rows = [{}, {}];

      transaction.runStream = function(query_) {
        assert.strictEqual(query_, query);

        var stream = through.obj();

        setImmediate(function() {
          split(rows, stream, function() {
            stream.end();
          });
        });

        return stream;
      };

      transaction.run(query, function(err, rows_) {
        assert.ifError(err);
        assert.deepEqual(rows_, rows);
        done();
      });
    });

    it('should execute callback with error', function(done) {
      var error = new Error('Error.');

      transaction.runStream = function() {
        var stream = through.obj();

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
      var query = {};

      var rows = [{}, {}];

      transaction.runStream = function(query_) {
        assert.strictEqual(query_, query);

        var stream = through.obj();

        setImmediate(function() {
          split(rows, stream, function() {
            stream.end();
          });
        });

        return stream;
      };

      return transaction.run(query).then(function(args) {
        assert.deepEqual(args[0], rows);
      });
    });
  });

  describe('runStream', function() {
    var QUERY = {
      sql: 'SELECT * FROM table',
      a: 'b',
      c: 'd',
    };

    var OPTIONS = {
      timestampBoundOptions: true,
    };

    var ENCODED_QUERY = extend({}, QUERY);

    var EXPECTED_REQ_OPTS = extend({}, QUERY, {
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
        assert.deepEqual(config.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      var stream = transaction.runStream(QUERY, OPTIONS);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should accept a query string', function(done) {
      fakeCodec.encodeQuery = function(query) {
        assert.strictEqual(query.sql, QUERY.sql);
        return ENCODED_QUERY;
      };

      transaction.requestStream = function(options) {
        assert.deepEqual(options.reqOpts, EXPECTED_REQ_OPTS);
        done();
      };

      var stream = transaction.runStream(QUERY.sql, OPTIONS);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should not require a transaction ID', function(done) {
      delete transaction.id;

      transaction.requestStream = function(options) {
        var expectedReqOpts = extend(true, {}, EXPECTED_REQ_OPTS, {
          transaction: {
            singleUse: {
              readOnly: OPTIONS,
            },
          },
        });

        delete expectedReqOpts.transaction.id;

        assert.deepEqual(options.reqOpts, expectedReqOpts);

        done();
      };

      var stream = transaction.runStream(QUERY, OPTIONS);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should not require timestamp bounds', function(done) {
      delete transaction.id;
      delete transaction.options;

      transaction.requestStream = function(options) {
        var expectedReqOpts = extend(true, {}, EXPECTED_REQ_OPTS, {
          transaction: {
            singleUse: {
              readOnly: {},
            },
          },
        });

        delete expectedReqOpts.transaction.id;

        assert.deepEqual(options.reqOpts, expectedReqOpts);

        done();
      };

      var stream = transaction.runStream(QUERY);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should return PartialResultStream', function() {
      var stream = transaction.runStream(QUERY, OPTIONS);
      assert(stream instanceof FakePartialResultStream);
    });

    it('should assign a resumeToken to the request', function(done) {
      var resumeToken = 'resume-token';

      transaction.requestStream = function(options) {
        assert.strictEqual(options.reqOpts.resumeToken, resumeToken);
        done();
      };

      var stream = transaction.runStream(QUERY, OPTIONS);
      var makeRequestFn = stream.calledWith_[0];
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
      var error = new Error('Error.');

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
      var fakeDelay = 1123123;
      var _setTimeout;

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

        assert.deepEqual(transaction.queuedMutations_, []);
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
    var abortedError;

    beforeEach(function() {
      abortedError = {
        code: 10,
        metadata: {
          get: function() {
            return [];
          },
        },
      };
    });

    it('should not retry if non-aborted error', function() {
      var shouldRetry = transaction.shouldRetry_({code: 4});
      assert.strictEqual(shouldRetry, false);
    });

    it('should not retry if runFn is missing', function() {
      transaction.runFn_ = null;

      var shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, false);
    });

    it('should not retry if deadline is exceeded', function() {
      transaction.timeout_ = 1;
      transaction.beginTime_ = Date.now() - 2;

      var shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, false);
    });

    it('should not retry if retry info metadata is absent', function() {
      transaction.runFn_ = function() {};
      transaction.timeout_ = 1000;
      transaction.beginTime_ = Date.now() - 2;

      var shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, false);
    });

    it('should retry if all conditions are met', function() {
      transaction.runFn_ = function() {};
      transaction.timeout_ = 1000;
      transaction.beginTime_ = Date.now() - 2;
      abortedError.metadata.get = function(key) {
        assert.strictEqual(key, 'google.rpc.retryinfo-bin');
        return [{}];
      };

      var shouldRetry = transaction.shouldRetry_(abortedError);
      assert.strictEqual(shouldRetry, true);
    });
  });
});
