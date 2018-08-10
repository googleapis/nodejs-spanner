/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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

const assert = require('assert');
const extend = require('extend');
const proxyquire = require('proxyquire');
const {util} = require('@google-cloud/common-grpc');
const pfy = require('@google-cloud/promisify');

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'BatchTransaction') {
      return;
    }
    assert.deepStrictEqual(options.exclude, ['identifier']);
    promisified = true;
  },
});

const fakeCodec = {
  encode: util.noop,
  Int: function() {},
  Float: function() {},
  SpannerDate: function() {},
};

function FakeTransaction(session) {
  this.calledWith_ = arguments;
  this.session = session;
}

describe('BatchTransaction', function() {
  let BatchTransaction;
  let batchTransaction;

  const SESSION = {};

  before(function() {
    BatchTransaction = proxyquire('../src/batch-transaction.js', {
      '@google-cloud/promisify': fakePfy,
      './codec.js': fakeCodec,
      './transaction.js': FakeTransaction,
    });
  });

  beforeEach(function() {
    batchTransaction = new BatchTransaction(SESSION);
  });

  describe('instantiation', function() {
    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should extend the Transaction class', function() {
      const batchTransaction = new BatchTransaction(SESSION);

      assert(batchTransaction instanceof FakeTransaction);
      assert.strictEqual(batchTransaction.calledWith_[0], SESSION);
      assert.deepStrictEqual(batchTransaction.calledWith_[1], {readOnly: true});
    });
  });

  describe('close', function() {
    it('should delete the session', function(done) {
      SESSION.delete = function(callback) {
        callback(); // the done fn
      };

      batchTransaction.close(done);
    });
  });

  describe('createQueryPartitions', function() {
    const GAX_OPTS = {a: 'b'};
    const QUERY = {
      sql: 'SELECT * FROM Singers',
      gaxOptions: GAX_OPTS,
    };

    it('should make the correct request', function(done) {
      fakeCodec.encodeQuery = function(query) {
        assert.deepStrictEqual(query, {sql: QUERY.sql});
        return QUERY;
      };

      batchTransaction.createPartitions_ = function(config, callback) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'partitionQuery');
        assert.strictEqual(config.reqOpts, QUERY);
        callback(); // the done fn
      };

      batchTransaction.createQueryPartitions(QUERY.sql, done);
    });

    it('should remove gax options from the query', function(done) {
      const fakeQuery = {
        sql: QUERY.sql,
        gaxOptions: GAX_OPTS,
      };

      fakeCodec.encodeQuery = function(query) {
        assert.strictEqual(query, fakeQuery);
        return extend({a: 'b'}, QUERY);
      };

      batchTransaction.createPartitions_ = function(config, callback) {
        assert.deepStrictEqual(config.reqOpts, {sql: QUERY.sql, a: 'b'});
        assert.strictEqual(config.gaxOpts, GAX_OPTS);
        callback(); // the done fn
      };

      batchTransaction.createQueryPartitions(fakeQuery, done);
    });
  });

  describe('createPartitions_', function() {
    const SESSION = {formattedName_: 'abcdef'};
    const ID = 'ghijkl';
    const TIMESTAMP = {seconds: 0, nanos: 0};

    const PARTITIONS = [{partitionToken: 'a'}, {partitionToken: 'b'}];
    const RESPONSE = {partitions: PARTITIONS};

    const QUERY = {a: 'b'};
    const CONFIG = {reqOpts: QUERY};

    beforeEach(function() {
      batchTransaction.session = SESSION;
      batchTransaction.id = ID;

      batchTransaction.request = function(config, callback) {
        callback(null, RESPONSE);
      };
    });

    it('should insert the session and transaction ids', function(done) {
      batchTransaction.request = function(config) {
        assert.strictEqual(config.reqOpts.a, 'b');
        assert.strictEqual(config.reqOpts.session, SESSION.formattedName_);
        assert.deepStrictEqual(config.reqOpts.transaction, {id: ID});
        done();
      };

      batchTransaction.createPartitions_(CONFIG, assert.ifError);
    });

    it('should return any request errors', function(done) {
      const error = new Error('err');
      const response = {};

      batchTransaction.request = function(config, callback) {
        callback(error, response);
      };

      batchTransaction.createPartitions_(CONFIG, function(err, parts, resp) {
        assert.strictEqual(err, error);
        assert.strictEqual(parts, null);
        assert.strictEqual(resp, response);
        done();
      });
    });

    it('should return the prepared partition configs', function(done) {
      const expectedQuery = {
        a: 'b',
        session: SESSION.formattedName_,
        transaction: {id: ID},
      };

      batchTransaction.createPartitions_(CONFIG, function(err, parts) {
        assert.ifError(err);

        parts.forEach(function(partition, i) {
          const expectedPartition = extend({}, expectedQuery, PARTITIONS[i]);
          assert.deepStrictEqual(partition, expectedPartition);
        });

        done();
      });
    });

    it('should update the transaction with returned metadata', function(done) {
      const response = extend({}, RESPONSE, {
        transaction: {
          id: ID,
          readTimestamp: TIMESTAMP,
        },
      });

      batchTransaction.request = function(config, callback) {
        callback(null, response);
      };

      batchTransaction.createPartitions_(CONFIG, function(err, parts, resp) {
        assert.strictEqual(resp, response);
        assert.strictEqual(batchTransaction.id, ID);
        assert.strictEqual(batchTransaction.readTimestamp, TIMESTAMP);
        done();
      });
    });
  });

  describe('createReadPartitions', function() {
    const GAX_OPTS = {};
    const QUERY = {table: 'abc', gaxOptions: GAX_OPTS};

    it('should make the correct request', function(done) {
      const query = {};

      fakeCodec.encodeRead = function(options) {
        assert.strictEqual(options, query);
        return QUERY;
      };

      batchTransaction.createPartitions_ = function(config, callback) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'partitionRead');
        assert.strictEqual(config.reqOpts, QUERY);
        callback(); // the done fn
      };

      batchTransaction.createReadPartitions(query, done);
    });

    it('should remove gax options from the query', function(done) {
      const query = {gaxOptions: GAX_OPTS};

      fakeCodec.encodeRead = function() {
        return extend({}, QUERY);
      };

      batchTransaction.createPartitions_ = function(config, callback) {
        assert.deepStrictEqual(config.reqOpts, {table: QUERY.table});
        assert.strictEqual(config.gaxOpts, GAX_OPTS);
        callback(); // the done fn
      };

      batchTransaction.createReadPartitions(query, done);
    });
  });

  describe('execute', function() {
    it('should make read requests for read partitions', function(done) {
      const partition = {table: 'abc'};

      batchTransaction.read = function(table, options, callback) {
        assert.strictEqual(table, partition.table);
        assert.strictEqual(options, partition);
        callback(); // the done fn
      };

      batchTransaction.execute(partition, done);
    });

    it('should make query requests for non-read partitions', function(done) {
      const partition = {sql: 'SELECT * FROM Singers'};

      batchTransaction.run = function(query, callback) {
        assert.strictEqual(query, partition);
        callback(); // the done fn
      };

      batchTransaction.execute(partition, done);
    });
  });

  describe('executeStream', function() {
    const STREAM = {};

    it('should make read streams for read partitions', function() {
      const partition = {table: 'abc'};

      batchTransaction.createReadStream = function(table, options) {
        assert.strictEqual(table, partition.table);
        assert.strictEqual(options, partition);
        return STREAM;
      };

      const stream = batchTransaction.executeStream(partition);

      assert.strictEqual(stream, STREAM);
    });

    it('should make query streams for query partitions', function() {
      const partition = {sql: 'SELECT * FROM Singers'};

      batchTransaction.runStream = function(query) {
        assert.strictEqual(query, partition);
        return STREAM;
      };

      const stream = batchTransaction.executeStream(partition);

      assert.strictEqual(stream, STREAM);
    });
  });

  describe('identifier', function() {
    const ID = Buffer.from('abc');
    const SESSION = {id: 'def'};
    const TIMESTAMP = {seconds: 0, nanos: 0};

    beforeEach(function() {
      batchTransaction.id = ID;
      batchTransaction.session = SESSION;
      batchTransaction.readTimestamp = TIMESTAMP;
    });

    it('should create a transaction identifier', function() {
      const expectedId = ID.toString('base64');
      const identifier = batchTransaction.identifier();

      assert.strictEqual(identifier.transaction, expectedId);
      assert.strictEqual(identifier.session, SESSION.id);
      assert.strictEqual(identifier.timestamp, TIMESTAMP);
    });
  });
});
