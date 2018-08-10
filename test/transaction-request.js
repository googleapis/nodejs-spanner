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
const proxyquire = require('proxyquire');
const {split} = require('split-array-stream');
const through = require('through2');
const {util} = require('@google-cloud/common-grpc');
const pfy = require('@google-cloud/promisify');

function FakeGrpcService() {}

function FakePartialResultStream() {
  this.calledWith_ = arguments;
}

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'TransactionRequest') {
      return;
    }
    promisified = true;
    assert.deepStrictEqual(options, {
      exclude: ['deleteRows', 'insert', 'replace', 'update', 'upsert'],
    });
    util.promisifyAll(Class, options);
  },
});

const fakeCodec = {
  encode: util.noop,
};

describe('TransactionRequest', function() {
  let TransactionRequest;
  let transactionRequest;

  before(function() {
    TransactionRequest = proxyquire('../src/transaction-request', {
      '@google-cloud/common-grpc': {
        Service: FakeGrpcService,
      },
      '@google-cloud/promisify': fakePfy,
      './codec.js': fakeCodec,
      './partial-result-stream': FakePartialResultStream,
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
    let formatTimestamp;

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
      const UNFORMATTED_OPTIONS = {
        b: 'b',
      };

      const FORMATTED_OPTIONS = {
        a: 'a',
      };

      TransactionRequest.formatTimestampOptions_ = function(options) {
        assert.deepStrictEqual(options, UNFORMATTED_OPTIONS);
        assert.notStrictEqual(options, UNFORMATTED_OPTIONS);
        return FORMATTED_OPTIONS;
      };

      const transaction = new TransactionRequest(UNFORMATTED_OPTIONS);

      assert.strictEqual(transaction.options, FORMATTED_OPTIONS);
      TransactionRequest.formatTimestampOptions_ = formatTimestamp;
    });

    it('should not localize an empty options object', function() {
      const formatTimestamp = TransactionRequest.formatTimestampOptions_;

      TransactionRequest.formatTimestampOptions_ = function() {
        throw new Error('Should not have been called.');
      };

      const transaction = new TransactionRequest({});

      assert.strictEqual(transaction.options, undefined);
      TransactionRequest.formatTimestampOptions_ = formatTimestamp;
    });

    it('should capture the readOnly option', function() {
      TransactionRequest.formatTimestampOptions_ = function(options) {
        assert.strictEqual(options.readOnly, undefined);
      };

      const transaction = new TransactionRequest({
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
      const options = {
        strong: true,
        minReadTimestamp: new Date('2016-12-04'),
        maxStaleness: 10,
        readTimestamp: new Date('2016-12-05'),
        exactStaleness: 11,
        returnReadTimestamp: true,
      };

      const expected = {
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

      const formatted = TransactionRequest.formatTimestampOptions_(options);
      assert.deepStrictEqual(formatted, expected);
    });
  });

  describe('fromProtoTimestamp_', function() {
    it('should format into a date object', function() {
      const now = new Date();

      const protoTimestamp = {
        seconds: Math.floor(now.getTime() / 1000),
        nanos: now.getMilliseconds() * 1e6,
      };

      const date = TransactionRequest.fromProtoTimestamp_(protoTimestamp);

      assert.deepStrictEqual(date, now);
    });
  });

  describe('createReadStream', function() {
    const TABLE = 'table-name';
    const QUERY = {e: 'f'};

    beforeEach(function() {
      fakeCodec.encodeRead = function() {
        return QUERY;
      };
    });

    it('should accept a query object', function(done) {
      const query = {
        a: 'b',
        c: 'd',
      };

      const expectedReqOpts = extend({}, QUERY, {
        table: TABLE,
      });

      fakeCodec.encodeRead = function(readRequest) {
        assert.strictEqual(readRequest, query);
        return QUERY;
      };

      transactionRequest.requestStream = function(options) {
        assert.deepStrictEqual(options.reqOpts, expectedReqOpts);
        done();
      };

      const stream = transactionRequest.createReadStream(TABLE, query);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should set the transaction id', function(done) {
      const ID = 'abc';

      transactionRequest.transaction = true;
      transactionRequest.id = ID;

      const expectedReqOpts = extend(
        {
          table: TABLE,
          transaction: {
            id: ID,
          },
        },
        QUERY
      );

      transactionRequest.requestStream = function(options) {
        assert.deepStrictEqual(options.reqOpts, expectedReqOpts);
        done();
      };

      const stream = transactionRequest.createReadStream(TABLE, {});
      const makeRequestFn = stream.calledWith_[0];

      makeRequestFn();
    });

    describe('PartialResultStream', function() {
      it('should return PartialResultStream', function() {
        const stream = transactionRequest.createReadStream(TABLE, QUERY);
        assert(stream instanceof FakePartialResultStream);
      });

      it('should make and return the correct request', function(done) {
        const query = {
          a: 'b',
        };

        const expectedQuery = extend({}, QUERY, {
          table: TABLE,
          resumeToken: undefined,
        });

        transactionRequest.requestStream = function(config) {
          assert.strictEqual(config.client, 'SpannerClient');
          assert.strictEqual(config.method, 'streamingRead');
          assert.deepStrictEqual(config.reqOpts, expectedQuery);
          assert.strictEqual(config.gaxOpts, undefined);
          done();
        };

        const stream = transactionRequest.createReadStream(TABLE, query);
        const makeRequestFn = stream.calledWith_[0];
        makeRequestFn();
      });

      it('should respect gaxOptions', function(done) {
        const query = {
          gaxOptions: {},
        };

        transactionRequest.requestStream = function(config) {
          assert.strictEqual(config.gaxOpts, query.gaxOptions);
          done();
        };

        const stream = transactionRequest.createReadStream(TABLE, query);
        const makeRequestFn = stream.calledWith_[0];
        makeRequestFn();
      });

      it('should assign a resumeToken to the request', function(done) {
        const resumeToken = 'resume-token';

        transactionRequest.requestStream = function(config) {
          assert.strictEqual(config.reqOpts.resumeToken, resumeToken);
          done();
        };

        const stream = transactionRequest.createReadStream(TABLE, QUERY);
        const makeRequestFn = stream.calledWith_[0];
        makeRequestFn(resumeToken);
      });

      it('should accept json and jsonOptions', function() {
        const query = {
          json: {},
          jsonOptions: {},
        };

        const stream = transactionRequest.createReadStream(TABLE, query);
        const streamOptions = stream.calledWith_[1];

        assert.strictEqual(streamOptions.json, query.json);
        assert.strictEqual(streamOptions.jsonOptions, query.jsonOptions);
      });

      it('should delete json, jsonOptions from reqOpts', function(done) {
        const query = {
          json: {},
          jsonOptions: {},
        };

        transactionRequest.requestStream = function(config) {
          assert.strictEqual(config.reqOpts.json, undefined);
          assert.strictEqual(config.reqOpts.jsonOptions, undefined);
          done();
        };

        const stream = transactionRequest.createReadStream(TABLE, query);
        const makeRequestFn = stream.calledWith_[0];
        makeRequestFn();
      });
    });
  });

  describe('deleteRows', function() {
    const TABLE = 'table-name';
    const KEYS = ['key', ['composite', 'key']];

    const ENCODED_VALUE = {
      encoded: true,
    };

    const EXPECTED_MUTATION = {
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
      const requestReturnValue = {};

      function callback() {}

      let numEncodeRequests = 0;

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

      const expectedReqOpts = {
        singleUseTransaction: {
          readWrite: {},
        },
        mutations: [EXPECTED_MUTATION],
      };

      transactionRequest.request = function(config, callback_) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'commit');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.strictEqual(callback_, callback);
        return requestReturnValue;
      };

      const returnValue = transactionRequest.deleteRows(TABLE, KEYS, callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should push the request to the queue if a transaction', function(done) {
      transactionRequest.transaction = true;

      transactionRequest.queue_ = function(mutation) {
        assert.deepStrictEqual(mutation, EXPECTED_MUTATION);
        done();
      };

      transactionRequest.deleteRows(TABLE, KEYS, assert.ifError);
    });

    it('should accept just a key', function(done) {
      transactionRequest.transaction = true;

      const encodedValue = {
        encoded: true,
      };
      fakeCodec.encode = function() {
        return encodedValue;
      };

      transactionRequest.queue_ = function(mutation) {
        const expectedSingleMutation = extend(true, {}, EXPECTED_MUTATION);

        // Pop out the second mutation. We're only expecting one.
        expectedSingleMutation.delete.keySet.keys.pop();

        assert.deepStrictEqual(mutation, expectedSingleMutation);

        done();
      };

      transactionRequest.deleteRows(TABLE, KEYS[0], assert.ifError);
    });
  });

  describe('insert', function() {
    it('should call and return mutate_ method', function() {
      const mutateReturnValue = {};

      const table = 'table-name';
      const keyVals = [];
      function callback() {}

      transactionRequest.mutate_ = function(method, table_, keyVals_, cb) {
        assert.strictEqual(method, 'insert');
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(cb, callback);
        return mutateReturnValue;
      };

      const returnValue = transactionRequest.insert(table, keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('read', function() {
    it('should call and collect results from a stream', function(done) {
      const table = 'table-name';
      const keyVals = [];

      const rows = [{}, {}];

      transactionRequest.createReadStream = function(table_, keyVals_) {
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);

        const stream = through.obj();

        setImmediate(function() {
          split(rows, stream).then(function() {
            stream.end();
          });
        });

        return stream;
      };

      transactionRequest.read(table, keyVals, function(err, rows_) {
        assert.ifError(err);
        assert.deepStrictEqual(rows_, rows);
        done();
      });
    });

    it('should execute callback with error', function(done) {
      const error = new Error('Error.');

      transactionRequest.createReadStream = function() {
        const stream = through.obj();

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
      const mutateReturnValue = {};

      const table = 'table-name';
      const keyVals = [];
      function callback() {}

      transactionRequest.mutate_ = function(method, table_, keyVals_, cb) {
        assert.strictEqual(method, 'replace');
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(cb, callback);
        return mutateReturnValue;
      };

      const returnValue = transactionRequest.replace(table, keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('update', function() {
    it('should call and return mutate_ method', function() {
      const mutateReturnValue = {};

      const table = 'table-name';
      const keyVals = [];
      function callback() {}

      transactionRequest.mutate_ = function(method, table_, keyVals_, cb) {
        assert.strictEqual(method, 'update');
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(cb, callback);
        return mutateReturnValue;
      };

      const returnValue = transactionRequest.update(table, keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('upsert', function() {
    it('should call and return mutate_ method', function() {
      const mutateReturnValue = {};

      const table = 'table-name';
      const keyVals = [];
      function callback() {}

      transactionRequest.mutate_ = function(method, table_, keyVals_, cb) {
        assert.strictEqual(method, 'insertOrUpdate');
        assert.strictEqual(table_, table);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(cb, callback);
        return mutateReturnValue;
      };

      const returnValue = transactionRequest.upsert(table, keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('mutate_', function() {
    const METHOD = 'methodName';
    const TABLE = 'table-name';
    const KEYVALS = [
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

    const EXPECTED_MUTATION = {};
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
      const requestReturnValue = {};

      function callback() {}

      let numEncodeRequests = 0;
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

      const expectedReqOpts = {
        singleUseTransaction: {
          readWrite: {},
        },
        mutations: [EXPECTED_MUTATION],
      };

      transactionRequest.request = function(config, callback_) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'commit');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.strictEqual(callback_, callback);
        return requestReturnValue;
      };

      const returnValue = transactionRequest.mutate_(
        METHOD,
        TABLE,
        KEYVALS,
        callback
      );
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should throw when rows have incorrect amount of columns', function() {
      const invalidEntry = {key1: 'val'};
      let caughtError;

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

      const expectedErrorMessage = [
        'Row at index 0 does not contain the correct number of columns.',
        'Missing columns: ["key2"]',
      ].join('\n\n');

      assert.strictEqual(caughtError.message, expectedErrorMessage);
    });

    it('should push the request to the queue if a transaction', function(done) {
      transactionRequest.transaction = true;

      transactionRequest.queue_ = function(mutation) {
        assert.deepStrictEqual(mutation, EXPECTED_MUTATION);
        done();
      };

      transactionRequest.mutate_(METHOD, TABLE, KEYVALS, assert.ifError);
    });

    it('should accept just a key', function(done) {
      transactionRequest.transaction = true;

      transactionRequest.queue_ = function(mutation) {
        assert.deepStrictEqual(mutation, EXPECTED_MUTATION);
        done();
      };

      transactionRequest.mutate_(METHOD, TABLE, KEYVALS, assert.ifError);
    });
  });
});
