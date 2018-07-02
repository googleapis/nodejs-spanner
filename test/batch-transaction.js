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

var assert = require('assert');
var extend = require('extend');
var proxyquire = require('proxyquire');
var util = require('@google-cloud/common-grpc').util;

var promisified = false;
var fakeUtil = extend({}, util, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'BatchTransaction') {
      return;
    }

    assert.deepEqual(options.exclude, ['identifier']);
    promisified = true;
  },
});

var fakeCodec = {
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
  var BatchTransaction;
  var batchTransaction;

  var SESSION = {};

  before(function() {
    BatchTransaction = proxyquire('../src/batch-transaction.js', {
      '@google-cloud/common-grpc': {
        util: fakeUtil,
      },
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
      var batchTransaction = new BatchTransaction(SESSION);

      assert(batchTransaction instanceof FakeTransaction);
      assert.strictEqual(batchTransaction.calledWith_[0], SESSION);
      assert.deepEqual(batchTransaction.calledWith_[1], {readOnly: true});
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
    var GAX_OPTS = {a: 'b'};
    var QUERY = {
      sql: 'SELECT * FROM Singers',
      gaxOptions: GAX_OPTS,
    };

    it('should make the correct request', function(done) {
      fakeCodec.encodeQuery = function(query) {
        assert.deepEqual(query, {sql: QUERY.sql});
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
      var fakeQuery = {
        sql: QUERY.sql,
        gaxOptions: GAX_OPTS,
      };

      fakeCodec.encodeQuery = function(query) {
        assert.strictEqual(query, fakeQuery);
        return extend({a: 'b'}, QUERY);
      };

      batchTransaction.createPartitions_ = function(config, callback) {
        assert.deepEqual(config.reqOpts, {sql: QUERY.sql, a: 'b'});
        assert.strictEqual(config.gaxOpts, GAX_OPTS);
        callback(); // the done fn
      };

      batchTransaction.createQueryPartitions(fakeQuery, done);
    });
  });

  describe('createPartitions_', function() {
    var SESSION = {formattedName_: 'abcdef'};
    var ID = 'ghijkl';
    var TIMESTAMP = {seconds: 0, nanos: 0};

    var PARTITIONS = [{partitionToken: 'a'}, {partitionToken: 'b'}];
    var RESPONSE = {partitions: PARTITIONS};

    var QUERY = {a: 'b'};
    var CONFIG = {reqOpts: QUERY};

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
        assert.deepEqual(config.reqOpts.transaction, {id: ID});
        done();
      };

      batchTransaction.createPartitions_(CONFIG, assert.ifError);
    });

    it('should return any request errors', function(done) {
      var error = new Error('err');
      var response = {};

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
      var expectedQuery = {
        a: 'b',
        session: SESSION.formattedName_,
        transaction: {id: ID},
      };

      batchTransaction.createPartitions_(CONFIG, function(err, parts) {
        assert.ifError(err);

        parts.forEach(function(partition, i) {
          var expectedPartition = extend({}, expectedQuery, PARTITIONS[i]);
          assert.deepEqual(partition, expectedPartition);
        });

        done();
      });
    });

    it('should update the transaction with returned metadata', function(done) {
      var response = extend({}, RESPONSE, {
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
    var GAX_OPTS = {};
    var QUERY = {table: 'abc', gaxOptions: GAX_OPTS};

    it('should make the correct request', function(done) {
      var query = {};

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
      var query = {gaxOptions: GAX_OPTS};

      fakeCodec.encodeRead = function() {
        return extend({}, QUERY);
      };

      batchTransaction.createPartitions_ = function(config, callback) {
        assert.deepEqual(config.reqOpts, {table: QUERY.table});
        assert.strictEqual(config.gaxOpts, GAX_OPTS);
        callback(); // the done fn
      };

      batchTransaction.createReadPartitions(query, done);
    });
  });

  describe('execute', function() {
    it('should make read requests for read partitions', function(done) {
      var partition = {table: 'abc'};

      batchTransaction.read = function(table, options, callback) {
        assert.strictEqual(table, partition.table);
        assert.strictEqual(options, partition);
        callback(); // the done fn
      };

      batchTransaction.execute(partition, done);
    });

    it('should make query requests for non-read partitions', function(done) {
      var partition = {sql: 'SELECT * FROM Singers'};

      batchTransaction.run = function(query, callback) {
        assert.strictEqual(query, partition);
        callback(); // the done fn
      };

      batchTransaction.execute(partition, done);
    });
  });

  describe('executeStream', function() {
    var STREAM = {};

    it('should make read streams for read partitions', function() {
      var partition = {table: 'abc'};

      batchTransaction.createReadStream = function(table, options) {
        assert.strictEqual(table, partition.table);
        assert.strictEqual(options, partition);
        return STREAM;
      };

      var stream = batchTransaction.executeStream(partition);

      assert.strictEqual(stream, STREAM);
    });

    it('should make query streams for query partitions', function() {
      var partition = {sql: 'SELECT * FROM Singers'};

      batchTransaction.runStream = function(query) {
        assert.strictEqual(query, partition);
        return STREAM;
      };

      var stream = batchTransaction.executeStream(partition);

      assert.strictEqual(stream, STREAM);
    });
  });

  describe('identifier', function() {
    var ID = Buffer.from('abc');
    var SESSION = {id: 'def'};
    var TIMESTAMP = {seconds: 0, nanos: 0};

    beforeEach(function() {
      batchTransaction.id = ID;
      batchTransaction.session = SESSION;
      batchTransaction.readTimestamp = TIMESTAMP;
    });

    it('should create a transaction identifier', function() {
      var expectedId = ID.toString('base64');
      var identifier = batchTransaction.identifier();

      assert.strictEqual(identifier.transaction, expectedId);
      assert.strictEqual(identifier.session, SESSION.id);
      assert.strictEqual(identifier.timestamp, TIMESTAMP);
    });
  });
});
