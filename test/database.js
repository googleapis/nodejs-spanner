/*!
 * Copyright 2016 Google Inc. All Rights Reserved.
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
var events = require('events');
var extend = require('extend');
var nodeutil = require('util');
var proxyquire = require('proxyquire');
var through = require('through2');
var util = require('@google-cloud/common-grpc').util;

var promisified = false;
var fakeUtil = extend({}, util, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'Database') {
      return;
    }

    promisified = true;
    assert.deepStrictEqual(options.exclude, [
      'batchTransaction',
      'getMetadata',
      'runTransaction',
      'table',
      'updateSchema',
      'session_',
    ]);
  },
});

function FakeBatchTransaction() {
  this.calledWith_ = arguments;
}

function FakeGrpcServiceObject() {
  this.calledWith_ = arguments;
}

function FakePartialResultStream() {
  this.calledWith_ = arguments;
}

function FakeSession() {
  this.calledWith_ = arguments;
}

function FakeSessionPool() {
  this.calledWith_ = arguments;
  events.EventEmitter.call(this);
}
nodeutil.inherits(FakeSessionPool, events.EventEmitter);
FakeSessionPool.prototype.open = util.noop;

function FakeTable() {
  this.calledWith_ = arguments;
}

function FakeTransactionRequest() {
  this.calledWith_ = arguments;
}

var fakeCodec = {
  encode: util.noop,
  Int: function() {},
  Float: function() {},
  SpannerDate: function() {},
};

var fakeModelo = {
  inherits: function() {
    this.calledWith_ = arguments;
    return require('modelo').inherits.apply(this, arguments);
  },
};

describe('Database', function() {
  var Database;
  var DatabaseCached;

  var INSTANCE = {
    request: util.noop,
    requestStream: util.noop,
    formattedName_: 'instance-name',
    databases_: new Map(),
  };

  var NAME = 'table-name';
  var DATABASE_FORMATTED_NAME = INSTANCE.formattedName_ + '/databases/' + NAME;

  var POOL_OPTIONS = {};

  var database;

  before(function() {
    Database = proxyquire('../src/database.js', {
      '@google-cloud/common-grpc': {
        util: fakeUtil,
        ServiceObject: FakeGrpcServiceObject,
      },
      modelo: fakeModelo,
      './batch-transaction.js': FakeBatchTransaction,
      './codec.js': fakeCodec,
      './partial-result-stream.js': FakePartialResultStream,
      './session-pool.js': FakeSessionPool,
      './session.js': FakeSession,
      './table.js': FakeTable,
      './transaction-request.js': FakeTransactionRequest,
    });
    DatabaseCached = extend({}, Database);
  });

  beforeEach(function() {
    fakeCodec.encode = util.noop;
    extend(Database, DatabaseCached);
    database = new Database(INSTANCE, NAME, POOL_OPTIONS);
    database.parent = INSTANCE;
  });

  describe('instantiation', function() {
    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should localize the request function', function() {
      assert.strictEqual(database.request, INSTANCE.request);
    });

    it('should localize the requestStream function', function() {
      assert.strictEqual(database.requestStream, INSTANCE.requestStream);
    });

    it('should format the name', function() {
      var formatName_ = Database.formatName_;
      var formattedName = 'formatted-name';

      Database.formatName_ = function(instanceName, name) {
        Database.formatName_ = formatName_;

        assert.strictEqual(instanceName, INSTANCE.formattedName_);
        assert.strictEqual(name, NAME);

        return formattedName;
      };

      var database = new Database(INSTANCE, NAME);
      assert(database.formattedName_, formattedName);
    });

    it('should create a SessionPool object', function() {
      assert(database.pool_ instanceof FakeSessionPool);
      assert.strictEqual(database.pool_.calledWith_[0], database);
      assert.strictEqual(database.pool_.calledWith_[1], POOL_OPTIONS);
    });

    it('should re-emit SessionPool errors', function(done) {
      var error = new Error('err');

      database.on('error', function(err) {
        assert.strictEqual(err, error);
        done();
      });

      database.pool_.emit('error', error);
    });

    it('should open the pool', function(done) {
      FakeSessionPool.prototype.open = function() {
        FakeSessionPool.prototype.open = util.noop;
        done();
      };

      new Database(INSTANCE, NAME);
    });

    it('should inherit from ServiceObject', function(done) {
      var database;
      var options = {};

      var instanceInstance = extend({}, INSTANCE, {
        createDatabase: function(name, options_, callback) {
          assert.strictEqual(name, database.formattedName_);
          assert.strictEqual(options_, options);
          callback(); // done()
        },
      });

      database = new Database(instanceInstance, NAME);
      assert(database instanceof FakeGrpcServiceObject);

      var calledWith = database.calledWith_[0];

      assert.strictEqual(calledWith.parent, instanceInstance);
      assert.strictEqual(calledWith.id, NAME);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
      });

      calledWith.createMethod(null, options, done);
    });

    it('should inherit from EventEmitter', function() {
      var args = fakeModelo.calledWith_;
      assert.strictEqual(args[0], Database);
      assert.strictEqual(args[2], events.EventEmitter);
    });
  });

  describe('formatName_', function() {
    it('should return the name if already formatted', function() {
      assert.strictEqual(
        Database.formatName_(INSTANCE.formattedName_, DATABASE_FORMATTED_NAME),
        DATABASE_FORMATTED_NAME
      );
    });

    it('should format the name', function() {
      var formattedName_ = Database.formatName_(INSTANCE.formattedName_, NAME);
      assert.strictEqual(formattedName_, DATABASE_FORMATTED_NAME);
    });
  });

  describe('batchTransaction', function() {
    var SESSION = {id: 'hijklmnop'};
    var ID = 'abcdefg';
    var READ_TIMESTAMP = {seconds: 0, nanos: 0};

    it('should create a transaction object', function() {
      var identifier = {
        session: SESSION,
        transaction: ID,
        readTimestamp: READ_TIMESTAMP,
      };

      var transaction = database.batchTransaction(identifier);

      assert(transaction instanceof FakeBatchTransaction);
      assert.deepStrictEqual(transaction.calledWith_[0], SESSION);
      assert.strictEqual(transaction.id, ID);
      assert.strictEqual(transaction.readTimestamp, READ_TIMESTAMP);
    });

    it('should optionally accept a session id', function() {
      var identifier = {
        session: SESSION.id,
        transaction: ID,
        readTimestamp: READ_TIMESTAMP,
      };

      database.session_ = function(id) {
        assert.strictEqual(id, SESSION.id);
        return SESSION;
      };

      var transaction = database.batchTransaction(identifier);
      assert.deepStrictEqual(transaction.calledWith_[0], SESSION);
    });
  });

  describe('close', function() {
    var FAKE_ID = 'a/c/b/d';

    beforeEach(function() {
      database.id = FAKE_ID;
    });

    describe('success', function() {
      beforeEach(function() {
        database.parent = INSTANCE;
        database.pool_ = {
          close: function() {
            return Promise.resolve();
          },
          getLeaks: function() {
            return [];
          },
        };
      });

      it('should close the database', function(done) {
        database.close(done);
      });

      it('should remove the database cache', function(done) {
        var cache = INSTANCE.databases_;
        var cacheId = FAKE_ID.split('/').pop();

        cache.set(cacheId, database);
        assert(cache.has(cacheId));

        database.close(function(err) {
          assert.ifError(err);
          assert.strictEqual(cache.has(cacheId), false);
          done();
        });
      });
    });

    describe('error', function() {
      it('should return the closing error', function(done) {
        var error = new Error('err.');

        database.pool_ = {
          close: function() {
            return Promise.reject(error);
          },
          getLeaks: function() {
            return [];
          },
        };

        database.close(function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should report session leaks', function(done) {
        var fakeLeaks = ['abc', 'def'];

        database.pool_ = {
          close: function() {
            return Promise.resolve();
          },
          getLeaks: function() {
            return fakeLeaks;
          },
        };

        database.close(function(err) {
          assert(err instanceof Error);
          assert.strictEqual(err.message, '2 session leak(s) found.');
          assert.strictEqual(err.messages, fakeLeaks);
          done();
        });
      });
    });
  });

  describe('createBatchTransaction', function() {
    var SESSION = {};
    var RESPONSE = {a: 'b'};

    beforeEach(function() {
      database.createSession = function(callback) {
        callback(null, SESSION, RESPONSE);
      };
    });

    it('should return any session creation errors', function(done) {
      var error = new Error('err');
      var apiResponse = {c: 'd'};

      database.createSession = function(callback) {
        callback(error, null, apiResponse);
      };

      database.createBatchTransaction(function(err, transaction, resp) {
        assert.strictEqual(err, error);
        assert.strictEqual(transaction, null);
        assert.strictEqual(resp, apiResponse);
        done();
      });
    });

    it('should create a transaction', function(done) {
      var opts = {a: 'b'};

      var fakeTransaction = {
        begin: function(callback) {
          callback(null, RESPONSE);
        },
      };

      database.batchTransaction = function(identifier) {
        assert.deepStrictEqual(identifier, {session: SESSION});
        return fakeTransaction;
      };

      database.createBatchTransaction(opts, function(err, transaction, resp) {
        assert.strictEqual(err, null);
        assert.strictEqual(transaction, fakeTransaction);
        assert.deepStrictEqual(transaction.options, opts);
        assert.strictEqual(resp, RESPONSE);
        done();
      });
    });

    it('should return any transaction errors', function(done) {
      var error = new Error('err');

      var fakeTransaction = {
        begin: function(callback) {
          callback(error, RESPONSE);
        },
      };

      database.batchTransaction = function() {
        return fakeTransaction;
      };

      database.createBatchTransaction(function(err, transaction, resp) {
        assert.strictEqual(err, error);
        assert.strictEqual(transaction, null);
        assert.strictEqual(resp, RESPONSE);
        done();
      });
    });
  });

  describe('createTable', function() {
    var TABLE_NAME = 'table-name';
    var SCHEMA = 'CREATE TABLE `' + TABLE_NAME + '`';

    it('should call updateSchema', function(done) {
      database.updateSchema = function(schema) {
        assert.strictEqual(schema, SCHEMA);
        done();
      };

      database.createTable(SCHEMA, assert.ifError);
    });

    describe('error', function() {
      var ERROR = new Error('Error.');
      var API_RESPONSE = {};

      beforeEach(function() {
        database.updateSchema = function(name, callback) {
          callback(ERROR, null, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', function(done) {
        database.createTable(SCHEMA, function(err, table, op, apiResponse) {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(table, null);
          assert.strictEqual(op, null);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });

    describe('success', function() {
      var OPERATION = {};
      var API_RESPONSE = {};

      beforeEach(function() {
        database.updateSchema = function(name, callback) {
          callback(null, OPERATION, API_RESPONSE);
        };
      });

      describe('table name parsing', function() {
        it('should recognize an escaped name', function(done) {
          database.table = function(name) {
            assert.strictEqual(name, TABLE_NAME);
            done();
          };

          database.createTable(SCHEMA, assert.ifError);
        });

        it('should recognize a non-escaped name', function(done) {
          database.table = function(name) {
            assert.strictEqual(name, TABLE_NAME);
            done();
          };

          database.createTable('CREATE TABLE ' + TABLE_NAME, assert.ifError);
        });
      });

      it('should exec callback with Table, op & API response', function(done) {
        var tableInstance = {};

        database.table = function(name) {
          assert.strictEqual(name, TABLE_NAME);
          return tableInstance;
        };

        database.createTable(SCHEMA, function(err, table, op, apiResponse) {
          assert.ifError(err);
          assert.strictEqual(table, tableInstance);
          assert.strictEqual(op, OPERATION);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });
  });

  describe('delete', function() {
    beforeEach(function() {
      database.close = function(callback) {
        callback();
      };
    });

    it('should close the database', function(done) {
      database.close = function() {
        done();
      };

      database.delete();
    });

    it('should make the correct request', function() {
      database.request = function(config, callback) {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'dropDatabase');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });
        assert.strictEqual(callback, assert.ifError);
      };

      database.delete(assert.ifError);
    });
  });

  describe('get', function() {
    it('should call getMetadata', function(done) {
      var options = {};

      database.getMetadata = function() {
        done();
      };

      database.get(options, assert.ifError);
    });

    it('should not require an options object', function(done) {
      database.getMetadata = function() {
        done();
      };

      database.get(assert.ifError);
    });

    describe('autoCreate', function() {
      var error = new Error('Error.');
      error.code = 5;

      var OPTIONS = {
        autoCreate: true,
      };

      var OPERATION = {
        listeners: {},
        on: function(eventName, callback) {
          OPERATION.listeners[eventName] = callback;
          return OPERATION;
        },
      };

      beforeEach(function() {
        OPERATION.listeners = {};

        database.getMetadata = function(callback) {
          callback(error);
        };

        database.create = function(options, callback) {
          callback(null, null, OPERATION);
        };
      });

      it('should call create', function(done) {
        database.create = function(options) {
          assert.strictEqual(options, OPTIONS);
          done();
        };

        database.get(OPTIONS, assert.ifError);
      });

      it('should return error if create failed', function(done) {
        var error = new Error('Error.');

        database.create = function(options, callback) {
          callback(error);
        };

        database.get(OPTIONS, function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should return operation error', function(done) {
        var error = new Error('Error.');

        setImmediate(function() {
          OPERATION.listeners['error'](error);
        });

        database.get(OPTIONS, function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should execute callback if opereation succeeded', function(done) {
        var metadata = {};

        setImmediate(function() {
          OPERATION.listeners['complete'](metadata);
        });

        database.get(OPTIONS, function(err, database_, apiResponse) {
          assert.ifError(err);
          assert.strictEqual(database_, database);
          assert.strictEqual(database.metadata, metadata);
          assert.strictEqual(metadata, apiResponse);
          done();
        });
      });
    });

    it('should not auto create without error code 5', function(done) {
      var error = new Error('Error.');
      error.code = 'NOT-5';

      var options = {
        autoCreate: true,
      };

      database.getMetadata = function(callback) {
        callback(error);
      };

      database.create = function() {
        throw new Error('Should not create.');
      };

      database.get(options, function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should not auto create unless requested', function(done) {
      var error = new Error('Error.');
      error.code = 5;

      database.getMetadata = function(callback) {
        callback(error);
      };

      database.create = function() {
        throw new Error('Should not create.');
      };

      database.get(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return an error from getMetadata', function(done) {
      var error = new Error('Error.');

      database.getMetadata = function(callback) {
        callback(error);
      };

      database.get(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return self and API response', function(done) {
      var apiResponse = {};

      database.getMetadata = function(callback) {
        callback(null, apiResponse);
      };

      database.get(function(err, database_, apiResponse_) {
        assert.ifError(err);
        assert.strictEqual(database_, database);
        assert.strictEqual(apiResponse_, apiResponse);
        done();
      });
    });
  });

  describe('getMetadata', function() {
    it('should call and return the request', function() {
      var requestReturnValue = {};

      database.request = function(config, callback) {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'getDatabase');
        assert.deepStrictEqual(config.reqOpts, {
          name: database.formattedName_,
        });
        assert.strictEqual(callback, assert.ifError);
        return requestReturnValue;
      };

      var returnValue = database.getMetadata(assert.ifError);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('getSchema', function() {
    it('should make the correct request', function(done) {
      database.request = function(config) {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'getDatabaseDdl');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });
        done();
      };

      database.getSchema(assert.ifError);
    });

    describe('error', function() {
      var ARG_1 = {};
      var STATEMENTS_ARG = null;
      var ARG_3 = {};
      var ARG_4 = {};
      var ARG_5 = {};

      beforeEach(function() {
        database.request = function(config, callback) {
          callback(ARG_1, STATEMENTS_ARG, ARG_3, ARG_4, ARG_5);
        };
      });

      it('should return the arguments from the request', function(done) {
        database.getSchema(function(arg1, arg2, arg3, arg4, arg5) {
          assert.strictEqual(arg1, ARG_1);
          assert.strictEqual(arg2, STATEMENTS_ARG);
          assert.strictEqual(arg3, ARG_3);
          assert.strictEqual(arg4, ARG_4);
          assert.strictEqual(arg5, ARG_5);
          done();
        });
      });
    });

    describe('success', function() {
      var ARG_1 = {};
      var ARG_3 = {};
      var ARG_4 = {};
      var ARG_5 = {};

      var STATEMENTS_ARG = {
        statements: {},
      };

      beforeEach(function() {
        database.request = function(config, callback) {
          callback(ARG_1, STATEMENTS_ARG, ARG_3, ARG_4, ARG_5);
        };
      });

      it('should return just the statements property', function(done) {
        database.getSchema(function(arg1, statements, arg3, arg4, arg5) {
          assert.strictEqual(arg1, ARG_1);
          assert.strictEqual(statements, STATEMENTS_ARG.statements);
          assert.strictEqual(arg3, ARG_3);
          assert.strictEqual(arg4, ARG_4);
          assert.strictEqual(arg5, ARG_5);
          done();
        });
      });
    });
  });

  describe('run', function() {
    var QUERY = 'SELECT query FROM query';

    var QUERY_STREAM;

    var ROW_1 = {};
    var ROW_2 = {};
    var ROW_3 = {};

    beforeEach(function() {
      QUERY_STREAM = through.obj();
      QUERY_STREAM.push(ROW_1);
      QUERY_STREAM.push(ROW_2);
      QUERY_STREAM.push(ROW_3);

      database.runStream = function() {
        return QUERY_STREAM;
      };
    });

    it('should correctly call runStream', function(done) {
      database.runStream = function(query, options) {
        assert.strictEqual(query, QUERY);
        assert.strictEqual(options, null);
        setImmediate(done);
        return QUERY_STREAM;
      };

      database.run(QUERY, assert.ifError);
    });

    it('should optionally accept options', function(done) {
      var OPTIONS = {};

      database.runStream = function(query, options) {
        assert.strictEqual(options, OPTIONS);
        setImmediate(done);
        return QUERY_STREAM;
      };

      database.run(QUERY, OPTIONS, assert.ifError);
    });

    it('should return rows from the stream to the callback', function(done) {
      QUERY_STREAM.end();

      database.run(QUERY, function(err, rows) {
        assert.ifError(err);
        assert.deepStrictEqual(rows, [ROW_1, ROW_2, ROW_3]);
        done();
      });
    });

    it('should execute callback with error from stream', function(done) {
      var error = new Error('Error.');

      QUERY_STREAM.destroy(error);

      database.run(QUERY, function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('runStream', function() {
    var QUERY = {
      sql: 'SELECT * FROM table',
      a: 'b',
      c: 'd',
    };

    var ENCODED_QUERY = extend({}, QUERY);

    beforeEach(function() {
      fakeCodec.encodeQuery = function() {
        return ENCODED_QUERY;
      };
    });

    it('should accept a query object', function(done) {
      fakeCodec.encodeQuery = function(query) {
        assert.strictEqual(query, QUERY);
        return ENCODED_QUERY;
      };

      database.pool_.requestStream = function(config) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'executeStreamingSql');
        assert.deepStrictEqual(config.reqOpts, ENCODED_QUERY);
        done();
      };

      var stream = database.runStream(QUERY);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should accept a query string', function(done) {
      fakeCodec.encodeQuery = function(query) {
        assert.strictEqual(query.sql, QUERY.sql);
        return ENCODED_QUERY;
      };
      database.pool_.requestStream = function(config) {
        assert.deepStrictEqual(config.reqOpts, ENCODED_QUERY);
        done();
      };

      var stream = database.runStream(QUERY.sql);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should return PartialResultStream', function() {
      var stream = database.runStream(QUERY);
      assert(stream instanceof FakePartialResultStream);
    });

    it('should pass json, jsonOptions to PartialResultStream', function() {
      var query = extend({}, QUERY);
      query.json = {};
      query.jsonOptions = {};

      var stream = database.runStream(query);
      assert.deepStrictEqual(stream.calledWith_[1], {
        json: query.json,
        jsonOptions: query.jsonOptions,
      });
    });

    it('should not pass json, jsonOptions to request', function(done) {
      database.pool_.requestStream = function(config) {
        assert.strictEqual(config.reqOpts.json, undefined);
        assert.strictEqual(config.reqOpts.jsonOptions, undefined);
        done();
      };

      var query = extend({}, QUERY);
      query.json = {};
      query.jsonOptions = {};

      var stream = database.runStream(query);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should assign a resumeToken to the request', function(done) {
      var resumeToken = 'resume-token';

      database.pool_.requestStream = function(config) {
        assert.strictEqual(config.reqOpts.resumeToken, resumeToken);
        done();
      };

      var stream = database.runStream(QUERY);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn(resumeToken);
    });

    it('should add timestamp options', function(done) {
      var OPTIONS = {a: 'a'};
      var FORMATTED_OPTIONS = {b: 'b'};

      FakeTransactionRequest.formatTimestampOptions_ = function(options) {
        assert.strictEqual(options, OPTIONS);
        return FORMATTED_OPTIONS;
      };

      database.pool_.requestStream = function(config) {
        assert.deepStrictEqual(
          config.reqOpts.transaction.singleUse.readOnly,
          FORMATTED_OPTIONS
        );

        done();
      };

      var stream = database.runStream(QUERY, OPTIONS);
      var makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });
  });

  describe('runTransaction', function() {
    it('should get a Transaction object', function(done) {
      database.getTransaction = function() {
        done();
      };

      database.runTransaction(assert.ifError);
    });

    it('should execute callback with error', function(done) {
      var error = new Error('Error.');

      database.getTransaction = function(options, callback) {
        callback(error);
      };

      database.runTransaction(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should run the transaction', function(done) {
      var TRANSACTION = {};
      var OPTIONS = {
        a: 'a',
      };

      var dateNow = Date.now;
      var fakeDate = 123445668382;

      Date.now = function() {
        return fakeDate;
      };

      database.getTransaction = function(options, callback) {
        assert.deepStrictEqual(options, OPTIONS);
        callback(null, TRANSACTION);
      };

      function runFn(err, transaction) {
        assert.strictEqual(err, null);
        assert.strictEqual(transaction, TRANSACTION);
        assert.strictEqual(transaction.runFn_, runFn);
        assert.strictEqual(transaction.beginTime_, fakeDate);

        Date.now = dateNow;
        done();
      }

      database.runTransaction(OPTIONS, runFn);
    });

    it('should capture the timeout', function(done) {
      var TRANSACTION = {};
      var OPTIONS = {
        timeout: 1000,
      };

      database.getTransaction = function(options, callback) {
        callback(null, TRANSACTION);
      };

      database.runTransaction(OPTIONS, function(err, txn) {
        assert.ifError(err);
        assert.strictEqual(txn.timeout_, OPTIONS.timeout);
        done();
      });
    });
  });

  describe('table', function() {
    var NAME = 'table-name';

    it('should throw if a name is not provided', function() {
      assert.throws(function() {
        database.table();
      }, /A name is required to access a Table object\./);
    });

    it('should return an instance of Tession', function() {
      var table = database.table(NAME);

      assert(table instanceof FakeTable);
      assert.strictEqual(table.calledWith_[0], database);
      assert.strictEqual(table.calledWith_[1], NAME);
    });
  });

  describe('updateSchema', function() {
    var STATEMENTS = ['statement-1', 'statement-2'];

    it('should call and return the request', function() {
      var requestReturnValue = {};

      database.request = function(config, callback) {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'updateDatabaseDdl');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
          statements: STATEMENTS,
        });
        assert.strictEqual(callback, assert.ifError);
        return requestReturnValue;
      };

      var returnValue = database.updateSchema(STATEMENTS, assert.ifError);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should arrify a string statement', function(done) {
      database.request = function(config) {
        assert.deepStrictEqual(config.reqOpts.statements, [STATEMENTS[0]]);
        done();
      };

      database.updateSchema(STATEMENTS[0], assert.ifError);
    });

    it('should accept an object', function(done) {
      var config = {
        statements: STATEMENTS,
        otherConfiguration: {},
      };

      var expectedReqOpts = extend({}, config, {
        database: database.formattedName_,
      });

      database.request = function(config) {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        done();
      };

      database.updateSchema(config, assert.ifError);
    });
  });

  describe('createSession', function() {
    var OPTIONS = {};

    it('should make the correct request', function(done) {
      database.request = function(config) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'createSession');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });

        assert.strictEqual(config.gaxOpts, OPTIONS);

        done();
      };

      database.createSession(OPTIONS, assert.ifError);
    });

    it('should not require options', function(done) {
      database.request = function(config) {
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });

        assert.deepStrictEqual(config.gaxOpts, {});

        done();
      };

      database.createSession(assert.ifError);
    });

    describe('error', function() {
      var ERROR = new Error('Error.');
      var API_RESPONSE = {};

      beforeEach(function() {
        database.request = function(config, callback) {
          callback(ERROR, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', function(done) {
        database.createSession(function(err, session, apiResponse) {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(session, null);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });

    describe('success', function() {
      var API_RESPONSE = {
        name: 'session-name',
      };

      beforeEach(function() {
        database.request = function(config, callback) {
          callback(null, API_RESPONSE);
        };
      });

      it('should execute callback with session & API response', function(done) {
        var sessionInstance = {};

        database.session_ = function(name) {
          assert.strictEqual(name, API_RESPONSE.name);
          return sessionInstance;
        };

        database.createSession(function(err, session, apiResponse) {
          assert.ifError(err);

          assert.strictEqual(session, sessionInstance);
          assert.strictEqual(session.metadata, API_RESPONSE);

          assert.strictEqual(apiResponse, API_RESPONSE);

          done();
        });
      });
    });
  });

  describe('getTransaction', function() {
    describe('write mode', function() {
      it('should get a session from the pool', function(done) {
        var transaction = {};
        var session = {txn: transaction};

        database.pool_ = {
          getWriteSession: function() {
            return Promise.resolve(session);
          },
        };

        database.getTransaction(function(err, transaction_) {
          assert.ifError(err);
          assert.strictEqual(transaction_, transaction);
          done();
        });
      });

      it('should return errors to the callback', function(done) {
        var error = new Error('Error.');

        database.pool_ = {
          getWriteSession: function() {
            return Promise.reject(error);
          },
        };

        database.getTransaction(function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });
    });

    describe('readOnly mode', function() {
      var OPTIONS = {
        readOnly: true,
        a: 'a',
      };

      beforeEach(function() {
        database.pool_ = {
          createTransaction_: function() {
            return Promise.resolve();
          },
        };
      });

      it('should get a session from the pool', function(done) {
        database.pool_.getSession = function() {
          setImmediate(done);
          return Promise.resolve();
        };

        database.getTransaction(OPTIONS, assert.ifError);
      });

      it('should return an error if could not get session', function(done) {
        var error = new Error('err.');

        database.pool_.getSession = function() {
          return Promise.reject(error);
        };

        database.getTransaction(OPTIONS, function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should should create a transaction', function(done) {
        var SESSION = {};
        var TRANSACTION = {
          begin: function() {},
        };

        database.pool_ = {
          getSession: function() {
            return Promise.resolve(SESSION);
          },
          createTransaction_: function(session, options) {
            assert.strictEqual(session, SESSION);
            assert.strictEqual(options, OPTIONS);

            setImmediate(done);

            return Promise.resolve(TRANSACTION);
          },
        };

        database.getTransaction(OPTIONS, assert.ifError);
      });

      it('should return an error if transaction cannot begin', function(done) {
        var error = new Error('err');

        var SESSION = {};

        database.pool_ = {
          getSession: function() {
            return Promise.resolve(SESSION);
          },
          createTransaction_: function() {
            return Promise.reject(error);
          },
        };

        database.getTransaction(OPTIONS, function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });
    });
  });

  describe('getSessions', function() {
    it('should make the correct request', function(done) {
      var gaxOpts = {};
      var options = {a: 'a', gaxOptions: gaxOpts};

      var expectedReqOpts = extend({}, options, {
        database: database.formattedName_,
      });

      delete expectedReqOpts.gaxOptions;

      database.request = function(config) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'listSessions');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.strictEqual(config.gaxOpts, gaxOpts);
        done();
      };

      database.getSessions(options, assert.ifError);
    });

    it('should not require a query', function(done) {
      database.request = function(config) {
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });

        done();
      };

      database.getSessions(assert.ifError);
    });

    it('should return all arguments on error', function(done) {
      var ARGS = [new Error('err'), null, {}];

      database.request = function(config, callback) {
        callback.apply(null, ARGS);
      };

      database.getSessions(function() {
        var args = [].slice.call(arguments);
        assert.deepStrictEqual(args, ARGS);
        done();
      });
    });

    it('should create and return Session objects', function(done) {
      var SESSIONS = [{name: 'abc'}];
      var SESSION_INSTANCE = {};
      var RESPONSE = {};

      database.request = function(config, callback) {
        callback(null, SESSIONS, RESPONSE);
      };

      database.session_ = function(name) {
        assert.strictEqual(name, SESSIONS[0].name);
        return SESSION_INSTANCE;
      };

      database.getSessions(function(err, sessions, resp) {
        assert.ifError(err);
        assert.strictEqual(sessions[0], SESSION_INSTANCE);
        assert.strictEqual(resp, RESPONSE);
        done();
      });
    });
  });

  describe('session_', function() {
    var NAME = 'session-name';

    it('should return an instance of Session', function() {
      var session = database.session_(NAME);

      assert(session instanceof FakeSession);
      assert.strictEqual(session.calledWith_[0], database);
      assert.strictEqual(session.calledWith_[1], NAME);
    });
  });
});
