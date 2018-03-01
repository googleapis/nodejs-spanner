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
var extend = require('extend');
var proxyquire = require('proxyquire');
var split = require('split-array-stream');
var through = require('through2');
var util = require('@google-cloud/common').util;

function FakeGrpcService() {}

function FakePartialResultStream() {
  this.calledWith_ = arguments;
}

var promisified = false;
var fakeUtil = extend({}, util, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'TransactionRequest') {
      return;
    }

    promisified = true;
    assert.deepEqual(options, {
      exclude: ['deleteRows', 'insert', 'replace', 'update', 'upsert'],
    });
    util.promisifyAll(Class, options);
  },
});

var fakeCodec = {
  encode: util.noop,
};

describe('TransactionRequest', function() {
  var TransactionRequest;
  var transactionRequest;

  before(function() {
    TransactionRequest = proxyquire('../src/transaction-request.js', {
      '@google-cloud/common': {
        util: fakeUtil,
      },
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService,
      },
      './codec.js': fakeCodec,
      './partial-result-stream.js': FakePartialResultStream,
    });
  });

  beforeEach(function() {
    FakeGrpcService.encodeValue_ = util.noop;
    fakeCodec.encode = util.noop;
    transactionRequest = new TransactionRequest();
    transactionRequest.request = util.noop;
    transactionRequest.requestStream = util.noop;
  });

  describe('instantiation', function() {
    var formatTimestamp;

    before(function() {
      formatTimestamp = TransactionRequest.formatTimestampOptions_;
    });

    beforeEach(function() {
      TransactionRequest.formatTimestampOptions_ = function() {};
    });

    after(function() {
      TransactionRequest.formatTimestampOptions_ = formatTimestamp;
    });

    it('should default readOnly to false', function() {
      assert.strictEqual(transactionRequest.readOnly, false);
    });

    it('should localize the transaction options', function() {
      var UNFORMATTED_OPTIONS = {
        b: 'b',
      };

      var FORMATTED_OPTIONS = {
        a: 'a',
      };

      TransactionRequest.formatTimestampOptions_ = function(options) {
        assert.deepEqual(options, UNFORMATTED_OPTIONS);
        assert.notStrictEqual(options, UNFORMATTED_OPTIONS);
        return FORMATTED_OPTIONS;
      };

      var transaction = new TransactionRequest(UNFORMATTED_OPTIONS);

      assert.strictEqual(transaction.options, FORMATTED_OPTIONS);
      TransactionRequest.formatTimestampOptions_ = formatTimestamp;
    });

    it('should not localize an empty options object', function() {
      var formatTimestamp = TransactionRequest.formatTimestampOptions_;

      TransactionRequest.formatTimestampOptions_ = function() {
        throw new Error('Should not have been called.');
      };

      var transaction = new TransactionRequest({});

      assert.strictEqual(transaction.options, undefined);
      TransactionRequest.formatTimestampOptions_ = formatTimestamp;
    });

    it('should capture the readOnly option', function() {
      TransactionRequest.formatTimestampOptions_ = function(options) {
        assert.strictEqual(options.readOnly, undefined);
      };

      var transaction = new TransactionRequest({
        readOnly: true,
      });

      assert.strictEqual(transaction.readOnly, true);
    });

    it('should promisify all the things', function() {
      assert(promisified);
    });
  });

  describe('formatTimestampOptions_', function() {
    it('should format all the options', function() {
      var options = {
        strong: true,
        minReadTimestamp: new Date('2016-12-04'),
        maxStaleness: 10,
        readTimestamp: new Date('2016-12-05'),
        exactStaleness: 11,
        returnReadTimestamp: true,
      };

      var expected = {
        strong: true,
        minReadTimestamp: {
          seconds: 1480809600,
          nanos: 0,
        },
        maxStaleness: {
          seconds: 10,
          nanos: 0,
        },
        readTimestamp: {
          seconds: 1480896000,
          nanos: 0,
        },
        exactStaleness: {
          seconds: 11,
          nanos: 0,
        },
        returnReadTimestamp: true,
      };

      var formatted = TransactionRequest.formatTimestampOptions_(options);
      assert.deepEqual(formatted, expected);
    });
  });

  describe('fromProtoTimestamp_', function() {
    it('should format into a date object', function() {
      var now = new Date();

      var protoTimestamp = {
        seconds: Math.floor(now.getTime() / 1000),
        nanos: now.getMilliseconds() * 1e6,
      };

      var date = TransactionRequest.fromProtoTimestamp_(protoTimestamp);

      assert.deepEqual(date, now);
    });
  });

  describe('createReadStream', function() {
    var TABLE = 'table-name';
    var QUERY = {e: 'f'};

    beforeEach(function() {
      fakeCodec.encodeRead = function() {
        return QUERY;
      };
    });

    it('should accept a query object', function(done) {
      var query = {
        a: 'b',
        c: 'd',
      };

      var expectedReqOpts = extend({}, QUERY, {
        table: TABLE,
      });

      fakeCodec.encodeRead = function(readRequest) {
        assert.strictEqual(readRequest, query);
        return QUERY;
      };

      transactionRequest.requestStream = function(options) {
        assert.deepEqual(options.reqOpts, expectedReqOpts);
        done();
      };

      var stream = transactionRequest.createReadStream(TABLE, query);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should set the transaction id', function(done) {
      var ID = 'abc';

      transactionRequest.transaction = true;
      transactionRequest.id = ID;

      var expectedReqOpts = extend(
        {
          table: TABLE,
          transaction: {
            id: ID,
          },
        },
        QUERY
      );

      transactionRequest.requestStream = function(options) {
        assert.deepEqual(options.reqOpts, expectedReqOpts);
        done();
      };

      var stream = transactionRequest.createReadStream(TABLE, {});
      var makeRequestFn = stream.calledWith_[0];

      makeRequestFn();
    });

    describe('PartialResultStream', function() {
      it('should return PartialResultStream', function() {
        var stream = transactionRequest.createReadStream(TABLE, QUERY);
        assert(stream instanceof FakePartialResultStream);
      });

      it('should make and return the correct request', function(done) {
        var query = {
          a: 'b',
        };

        var expectedQuery = extend({}, QUERY, {
          table: TABLE,
          resumeToken: undefined,
        });

        transactionRequest.requestStream = function(config) {
          assert.strictEqual(config.client, 'SpannerClient');
          assert.strictEqual(config.method, 'streamingRead');
          assert.deepEqual(config.reqOpts, expectedQuery);
          assert.strictEqual(config.gaxOpts, undefined);
          done();
        };

        var stream = transactionRequest.createReadStream(TABLE, query);
        var makeRequestFn = stream.calledWith_[0];
        makeRequestFn();
      });

      it('should respect gaxOptions', function(done) {
        var query = {
          gaxOptions: {},
        };

        transactionRequest.requestStream = function(config) {
          assert.strictEqual(config.gaxOpts, query.gaxOptions);
          done();
        };

        var stream = transactionRequest.createReadStream(TABLE, query);
        var makeRequestFn = stream.calledWith_[0];
        makeRequestFn();
      });

      it('should assign a resumeToken to the request', function(done) {
        var resumeToken = 'resume-token';

        transactionRequest.requestStream = function(config) {
          assert.strictEqual(config.reqOpts.resumeToken, resumeToken);
          done();
        };

        var stream = transactionRequest.createReadStream(TABLE, QUERY);
        var makeRequestFn = stream.calledWith_[0];
        makeRequestFn(resumeToken);
      });

      it('should accept json and jsonOptions', function() {
        var query = {
          json: {},
          jsonOptions: {},
        };

        var stream = transactionRequest.createReadStream(TABLE, query);
        var streamOptions = stream.calledWith_[1];

        assert.strictEqual(streamOptions.json, query.json);
        assert.strictEqual(streamOptions.jsonOptions, query.jsonOptions);
      });

      it('should delete json, jsonOptions from reqOpts', function(done) {
        var query = {
          json: {},
          jsonOptions: {},
        };

        transactionRequest.requestStream = function(config) {
          assert.strictEqual(config.reqOpts.json, undefined);
          assert.strictEqual(config.reqOpts.jsonOptions, undefined);
          done();
        };

        var stream = transactionRequest.createReadStream(TABLE, query);
        var makeRequestFn = stream.calledWith_[0];
        makeRequestFn();
      });
    });
  });

  describe('deleteRows', function() {
    var TABLE = 'table-name';
    var KEYS = ['key', ['composite', 'key']];

    var ENCODED_VALUE = {
      encoded: true,
    };

    var EXPECTED_MUTATION = {
      delete: {
        table: TABLE,
        keySet: {
          keys: [
            {
              values: [ENCODED_VALUE],
            },
            {
              values: [ENCODED_VALUE, ENCODED_VALUE],
            },
          ],
        },
      },
    };

    beforeEach(function() {
      fakeCodec.encode = function() {
        return ENCODED_VALUE;
      };
    });

    it('should correctly make and return the request', function() {
      var requestReturnValue = {};

      function callback() {}

      var numEncodeRequests = 0;

      fakeCodec.encode = function(key) {
        numEncodeRequests++;

        switch (numEncodeRequests) {
          case 1: {
            assert.strictEqual(key, KEYS[0]);
            break;
          }
          case 2: {
            assert.strictEqual(key, KEYS[1][0]);
            break;
          }
          case 3: {
            assert.strictEqual(key, KEYS[1][1]);
            break;
          }
        }

        return ENCODED_VALUE;
      };

      var expectedReqOpts = {
        singleUseTransaction: {
          readWrite: {},
        },
        mutations: [EXPECTED_MUTATION],
      };

      transactionRequest.request = function(config, callback_) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'commit');
        assert.deepEqual(config.reqOpts, expectedReqOpts);
        assert.strictEqual(callback_, callback);
        return requestReturnValue;
      };

      var returnValue = transactionRequest.deleteRows(TABLE, KEYS, callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should push the request to the queue if a transaction', function(done) {
      transactionRequest.transaction = true;

      transactionRequest.queue_ = function(mutation) {
        assert.deepEqual(mutation, EXPECTED_MUTATION);
        done();
      };

      transactionRequest.deleteRows(TABLE, KEYS, assert.ifError);
    });

    it('should accept just a key', function(done) {
      transactionRequest.transaction = true;

      var encodedValue = {
        encoded: true,
      };
      fakeCodec.encode = function() {
        return encodedValue;
      };

      transactionRequest.queue_ = function(mutation) {
        var expectedSingleMutation = extend(true, {}, EXPECTED_MUTATION);

        // Pop out the second mutation. We're only expecting one.
        expectedSingleMutation.delete.keySet.keys.pop();

        assert.deepEqual(mutation, expectedSingleMutation);

        done();
      };

      transactionRequest.deleteRows(TABLE, KEYS[0], assert.ifError);
    });
  });

  describe('insert', function() {
    it('should call and return mutate_ method', function() {
      var mutateReturnValue = {};

      var table = 'table-name';
      var keyVals = [];
      function callback() {}

      transactionRequest.mutate_ = function(method, table_, keyVals_, cb) {
        assert.strictEqual(method, 'insert');
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(cb, callback);
        return mutateReturnValue;
      };

      var returnValue = transactionRequest.insert(table, keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('read', function() {
    it('should call and collect results from a stream', function(done) {
      var table = 'table-name';
      var keyVals = [];

      var rows = [{}, {}];

      transactionRequest.createReadStream = function(table_, keyVals_) {
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);

        var stream = through.obj();

        setImmediate(function() {
          split(rows, stream, function() {
            stream.end();
          });
        });

        return stream;
      };

      transactionRequest.read(table, keyVals, function(err, rows_) {
        assert.ifError(err);
        assert.deepEqual(rows_, rows);
        done();
      });
    });

    it('should execute callback with error', function(done) {
      var error = new Error('Error.');

      transactionRequest.createReadStream = function() {
        var stream = through.obj();

        setImmediate(function() {
          stream.destroy(error);
        });

        return stream;
      };

      transactionRequest.read('table-name', [], function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('replace', function() {
    it('should call and return mutate_ method', function() {
      var mutateReturnValue = {};

      var table = 'table-name';
      var keyVals = [];
      function callback() {}

      transactionRequest.mutate_ = function(method, table_, keyVals_, cb) {
        assert.strictEqual(method, 'replace');
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(cb, callback);
        return mutateReturnValue;
      };

      var returnValue = transactionRequest.replace(table, keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('update', function() {
    it('should call and return mutate_ method', function() {
      var mutateReturnValue = {};

      var table = 'table-name';
      var keyVals = [];
      function callback() {}

      transactionRequest.mutate_ = function(method, table_, keyVals_, cb) {
        assert.strictEqual(method, 'update');
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(cb, callback);
        return mutateReturnValue;
      };

      var returnValue = transactionRequest.update(table, keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('upsert', function() {
    it('should call and return mutate_ method', function() {
      var mutateReturnValue = {};

      var table = 'table-name';
      var keyVals = [];
      function callback() {}

      transactionRequest.mutate_ = function(method, table_, keyVals_, cb) {
        assert.strictEqual(method, 'insertOrUpdate');
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(cb, callback);
        return mutateReturnValue;
      };

      var returnValue = transactionRequest.upsert(table, keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('mutate_', function() {
    var METHOD = 'methodName';
    var TABLE = 'table-name';
    var KEYVALS = [
      {
        key: '1-key-value',
        anotherNullable: '1-anotherNullable-value',
        nonNullable: '1-nonNullable-value',
        nullable: '1-nullable-value',
      },
      {
        /* keys defined in different order */
        key: '2-key-value',
        nullable: null,
        nonNullable: '2-nonNullable-value',
        anotherNullable: null,
      },
    ];

    var EXPECTED_MUTATION = {};
    EXPECTED_MUTATION[METHOD] = {
      table: TABLE,
      columns: ['anotherNullable', 'key', 'nonNullable', 'nullable'],
      values: [
        {
          values: [
            KEYVALS[0].anotherNullable,
            KEYVALS[0].key,
            KEYVALS[0].nonNullable,
            KEYVALS[0].nullable,
          ],
        },
        {
          values: [
            KEYVALS[1].anotherNullable,
            KEYVALS[1].key,
            KEYVALS[1].nonNullable,
            KEYVALS[1].nullable,
          ],
        },
      ],
    };

    beforeEach(function() {
      fakeCodec.encode = function(value) {
        return value;
      };
    });

    it('should correctly make and return the request', function() {
      var requestReturnValue = {};

      function callback() {}

      var numEncodeRequests = 0;
      fakeCodec.encode = function(value) {
        numEncodeRequests++;

        switch (numEncodeRequests) {
          case 1: {
            assert.strictEqual(value, KEYVALS[0].anotherNullable);
            break;
          }
          case 2: {
            assert.strictEqual(value, KEYVALS[0].key);
            break;
          }
          case 3: {
            assert.strictEqual(value, KEYVALS[0].nonNullable);
            break;
          }
          case 4: {
            assert.strictEqual(value, KEYVALS[0].nullable);
            break;
          }
          case 5: {
            assert.strictEqual(value, KEYVALS[1].anotherNullable);
            break;
          }
          case 6: {
            assert.strictEqual(value, KEYVALS[1].key);
            break;
          }
          case 7: {
            assert.strictEqual(value, KEYVALS[1].nonNullable);
            break;
          }
          case 8: {
            assert.strictEqual(value, KEYVALS[1].nullable);
            break;
          }
        }

        return value;
      };

      var expectedReqOpts = {
        singleUseTransaction: {
          readWrite: {},
        },
        mutations: [EXPECTED_MUTATION],
      };

      transactionRequest.request = function(config, callback_) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'commit');
        assert.deepEqual(config.reqOpts, expectedReqOpts);
        assert.strictEqual(callback_, callback);
        return requestReturnValue;
      };

      var returnValue = transactionRequest.mutate_(
        METHOD,
        TABLE,
        KEYVALS,
        callback
      );
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should throw when rows have incorrect amount of columns', function() {
      var invalidEntry = {key1: 'val'};
      var caughtError;

      try {
        transactionRequest.mutate_(
          METHOD,
          TABLE,
          [invalidEntry, {key1: 'val', key2: 'val'}],
          assert.ifError
        );
      } catch (e) {
        caughtError = e;
      }

      if (!caughtError) {
        throw new Error('Expected error was not thrown.');
      }

      var expectedErrorMessage = [
        'Row at index 0 does not contain the correct number of columns.',
        'Missing columns: ["key2"]',
      ].join('\n\n');

      assert.strictEqual(caughtError.message, expectedErrorMessage);
    });

    it('should push the request to the queue if a transaction', function(done) {
      transactionRequest.transaction = true;

      transactionRequest.queue_ = function(mutation) {
        assert.deepEqual(mutation, EXPECTED_MUTATION);
        done();
      };

      transactionRequest.mutate_(METHOD, TABLE, KEYVALS, assert.ifError);
    });

    it('should accept just a key', function(done) {
      transactionRequest.transaction = true;

      transactionRequest.queue_ = function(mutation) {
        assert.deepEqual(mutation, EXPECTED_MUTATION);
        done();
      };

      transactionRequest.mutate_(METHOD, TABLE, KEYVALS, assert.ifError);
    });
  });
});
