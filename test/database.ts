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

import * as assert from 'assert';
import {EventEmitter} from 'events';
import * as extend from 'extend';
import {ApiError} from '@google-cloud/common';
import * as proxyquire from 'proxyquire';
import * as through from 'through2';
import {util} from '@google-cloud/common-grpc';
import * as pfy from '@google-cloud/promisify';
import * as db from '../src/database';
import {Instance} from '../src';

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll(klass, options) {
    if (klass.name !== 'Database') {
      return;
    }
    promisified = true;
    assert.deepStrictEqual(options.exclude, [
      'batchTransaction',
      'getMetadata',
      'runTransaction',
      'table',
      'updateSchema',
      'session',
    ]);
  },
});

class FakeBatchTransaction {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

class FakeGrpcServiceObject extends EventEmitter {
  calledWith_: IArguments;
  constructor() {
    super();
    this.calledWith_ = arguments;
  }
}

function fakePartialResultStream(this: Function&{calledWith_: IArguments}) {
  this.calledWith_ = arguments;
  return this;
}

class FakeSession {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

class FakeSessionPool extends EventEmitter {
  calledWith_: IArguments;
  constructor() {
    super();
    this.calledWith_ = arguments;
  }
  open() {}
}

class FakeTable {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

class FakeTransactionRequest {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

// tslint:disable-next-line no-any
const fakeCodec: any = {
  encode: util.noop,
  Int() {},
  Float() {},
  SpannerDate() {},
};

describe('Database', () => {
  // tslint:disable-next-line variable-name
  let Database: typeof db.Database;
  // tslint:disable-next-line variable-name
  let DatabaseCached: typeof db.Database;

  const INSTANCE = {
    request: util.noop,
    requestStream: util.noop,
    formattedName_: 'instance-name',
    databases_: new Map(),
  } as {} as Instance;

  const NAME = 'table-name';
  const DATABASE_FORMATTED_NAME =
      INSTANCE.formattedName_ + '/databases/' + NAME;

  const POOL_OPTIONS = {};

  let database;

  before(() => {
    Database =
        proxyquire('../src/database.js', {
          '@google-cloud/common-grpc': {
            ServiceObject: FakeGrpcServiceObject,
          },
          '@google-cloud/promisify': fakePfy,
          './batch-transaction': {BatchTransaction: FakeBatchTransaction},
          './codec': {codec: fakeCodec},
          './partial-result-stream':
              {partialResultStream: fakePartialResultStream},
          './session-pool': {SessionPool: FakeSessionPool},
          './session': {Session: FakeSession},
          './table': {Table: FakeTable},
          './transaction-request': {TransactionRequest: FakeTransactionRequest},
        }).Database;
    DatabaseCached = extend({}, Database);
  });

  beforeEach(() => {
    fakeCodec.encode = util.noop;
    extend(Database, DatabaseCached);
    database = new Database(INSTANCE, NAME, POOL_OPTIONS);
    database.parent = INSTANCE;
  });

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should localize the request function', () => {
      assert.strictEqual(database.request, INSTANCE.request);
    });

    it('should localize the requestStream function', () => {
      assert.strictEqual(database.requestStream, INSTANCE.requestStream);
    });

    it('should format the name', () => {
      const formatName_ = Database.formatName_;
      const formattedName = 'formatted-name';

      Database.formatName_ = (instanceName, name) => {
        Database.formatName_ = formatName_;

        assert.strictEqual(instanceName, INSTANCE.formattedName_);
        assert.strictEqual(name, NAME);

        return formattedName;
      };

      const database = new Database(INSTANCE, NAME);
      assert(database.formattedName_, formattedName);
    });

    it('should create a SessionPool object', () => {
      assert(database.pool_ instanceof FakeSessionPool);
      assert.strictEqual(database.pool_.calledWith_[0], database);
      assert.strictEqual(database.pool_.calledWith_[1], POOL_OPTIONS);
    });

    it('should accept a custom Pool class', () => {
      function FakePool() {}
      FakePool.prototype.on = util.noop;
      FakePool.prototype.open = util.noop;

      const database = new Database(INSTANCE, NAME, FakePool);
      assert(database.pool_ instanceof FakePool);
    });

    it('should re-emit SessionPool errors', done => {
      const error = new Error('err');

      database.on('error', err => {
        assert.strictEqual(err, error);
        done();
      });

      database.pool_.emit('error', error);
    });

    it('should open the pool', done => {
      FakeSessionPool.prototype.open = () => {
        FakeSessionPool.prototype.open = util.noop;
        done();
      };

      const x = new Database(INSTANCE, NAME);
    });

    it('should inherit from ServiceObject', done => {
      const options = {};

      const instanceInstance = extend({}, INSTANCE, {
        createDatabase(name, options_, callback) {
          assert.strictEqual(name, database.formattedName_);
          assert.strictEqual(options_, options);
          callback();  // done()
        },
      });

      const database = new Database(instanceInstance, NAME);
      assert(database instanceof FakeGrpcServiceObject);

      const calledWith = database.calledWith_[0];

      assert.strictEqual(calledWith.parent, instanceInstance);
      assert.strictEqual(calledWith.id, NAME);
      assert.deepStrictEqual(calledWith.methods, {create: true});

      calledWith.createMethod(null, options, done);
    });
  });

  describe('formatName_', () => {
    it('should return the name if already formatted', () => {
      assert.strictEqual(
          Database.formatName_(
              INSTANCE.formattedName_, DATABASE_FORMATTED_NAME),
          DATABASE_FORMATTED_NAME);
    });

    it('should format the name', () => {
      const formattedName_ =
          Database.formatName_(INSTANCE.formattedName_, NAME);
      assert.strictEqual(formattedName_, DATABASE_FORMATTED_NAME);
    });
  });

  describe('batchTransaction', () => {
    const SESSION = {id: 'hijklmnop'};
    const ID = 'abcdefg';
    const READ_TIMESTAMP = {seconds: 0, nanos: 0};

    it('should create a transaction object', () => {
      const identifier = {
        session: SESSION,
        transaction: ID,
        readTimestamp: READ_TIMESTAMP,
      };

      const transaction = database.batchTransaction(identifier);

      assert(transaction instanceof FakeBatchTransaction);
      assert.deepStrictEqual(transaction.calledWith_[0], SESSION);
      assert.strictEqual(transaction.id, ID);
      assert.strictEqual(transaction.readTimestamp, READ_TIMESTAMP);
    });

    it('should optionally accept a session id', () => {
      const identifier = {
        session: SESSION.id,
        transaction: ID,
        readTimestamp: READ_TIMESTAMP,
      };

      database.session = (id) => {
        assert.strictEqual(id, SESSION.id);
        return SESSION;
      };

      const transaction = database.batchTransaction(identifier);
      assert.deepStrictEqual(transaction.calledWith_[0], SESSION);
    });
  });

  describe('close', () => {
    const FAKE_ID = 'a/c/b/d';

    beforeEach(() => {
      database.id = FAKE_ID;
    });

    describe('success', () => {
      beforeEach(() => {
        database.parent = INSTANCE;
        database.pool_ = {
          close(callback) {
            callback(null);
          },
        };
      });

      it('should close the database', done => {
        database.close(done);
      });

      it('should remove the database cache', done => {
        const cache = INSTANCE.databases_;
        const cacheId = FAKE_ID.split('/').pop();

        cache.set(cacheId, database);
        assert(cache.has(cacheId));

        database.close(err => {
          assert.ifError(err);
          assert.strictEqual(cache.has(cacheId), false);
          done();
        });
      });
    });

    describe('error', () => {
      it('should return the closing error', done => {
        const error = new Error('err.');

        database.pool_ = {
          close(callback) {
            callback(error);
          },
        };

        database.close(err => {
          assert.strictEqual(err, error);
          done();
        });
      });
    });
  });

  describe('createBatchTransaction', () => {
    const SESSION = {};
    const RESPONSE = {a: 'b'};

    beforeEach(() => {
      database.createSession = (callback) => {
        callback(null, SESSION, RESPONSE);
      };
    });

    it('should return any session creation errors', done => {
      const error = new Error('err');
      const apiResponse = {c: 'd'};

      database.createSession = (callback) => {
        callback(error, null, apiResponse);
      };

      database.createBatchTransaction((err, transaction, resp) => {
        assert.strictEqual(err, error);
        assert.strictEqual(transaction, null);
        assert.strictEqual(resp, apiResponse);
        done();
      });
    });

    it('should create a transaction', done => {
      const opts = {a: 'b'};

      const fakeTransaction = {
        begin(callback) {
          callback(null, RESPONSE);
        },
      };

      database.batchTransaction = (identifier) => {
        assert.deepStrictEqual(identifier, {session: SESSION});
        return fakeTransaction;
      };

      database.createBatchTransaction(opts, (err, transaction, resp) => {
        assert.strictEqual(err, null);
        assert.strictEqual(transaction, fakeTransaction);
        assert.deepStrictEqual(transaction.options, opts);
        assert.strictEqual(resp, RESPONSE);
        done();
      });
    });

    it('should return any transaction errors', done => {
      const error = new Error('err');

      const fakeTransaction = {
        begin(callback) {
          callback(error, RESPONSE);
        },
      };

      database.batchTransaction = () => {
        return fakeTransaction;
      };

      database.createBatchTransaction((err, transaction, resp) => {
        assert.strictEqual(err, error);
        assert.strictEqual(transaction, null);
        assert.strictEqual(resp, RESPONSE);
        done();
      });
    });
  });

  describe('createTable', () => {
    const TABLE_NAME = 'table-name';
    const SCHEMA = 'CREATE TABLE `' + TABLE_NAME + '`';

    it('should call updateSchema', done => {
      database.updateSchema = (schema) => {
        assert.strictEqual(schema, SCHEMA);
        done();
      };

      database.createTable(SCHEMA, assert.ifError);
    });

    describe('error', () => {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(() => {
        database.updateSchema = (name, callback) => {
          callback(ERROR, null, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', done => {
        database.createTable(SCHEMA, (err, table, op, apiResponse) => {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(table, null);
          assert.strictEqual(op, null);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });

    describe('success', () => {
      const OPERATION = {};
      const API_RESPONSE = {};

      beforeEach(() => {
        database.updateSchema = (name, callback) => {
          callback(null, OPERATION, API_RESPONSE);
        };
      });

      describe('table name parsing', () => {
        it('should recognize an escaped name', done => {
          database.table = (name) => {
            assert.strictEqual(name, TABLE_NAME);
            done();
          };

          database.createTable(SCHEMA, assert.ifError);
        });

        it('should recognize a non-escaped name', done => {
          database.table = (name) => {
            assert.strictEqual(name, TABLE_NAME);
            done();
          };

          database.createTable('CREATE TABLE ' + TABLE_NAME, assert.ifError);
        });
      });

      it('should exec callback with Table, op & API response', done => {
        const tableInstance = {};

        database.table = (name) => {
          assert.strictEqual(name, TABLE_NAME);
          return tableInstance;
        };

        database.createTable(SCHEMA, (err, table, op, apiResponse) => {
          assert.ifError(err);
          assert.strictEqual(table, tableInstance);
          assert.strictEqual(op, OPERATION);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });
  });

  describe('decorateTransaction_', () => {
    beforeEach(() => {
      database.pool_ = {
        release: util.noop,
      };
    });

    it('should decorate the end() method', done => {
      // tslint:disable-next-line no-any
      const transaction: any = {};
      const end = function(this: {}, callback) {
        assert.strictEqual(this, transaction);
        callback();  // done fn
      };

      transaction.end = end;

      const decoratedTransaction = database.decorateTransaction_(transaction);

      assert.strictEqual(decoratedTransaction, transaction);
      assert.notStrictEqual(end, decoratedTransaction.end);

      decoratedTransaction.end(done);
    });

    it('should release the session back into the pool', done => {
      const SESSION = {};
      const transaction = {end: util.noop};

      database.pool_.release = (session) => {
        assert.strictEqual(session, SESSION);
        done();
      };

      const decoratedTransaction =
          database.decorateTransaction_(transaction, SESSION);
      decoratedTransaction.end();
    });

    it('should return any release errors via callback', done => {
      const transaction = {end: callback => callback()};
      const fakeError = new Error('err');

      database.pool_.release = () => {
        throw fakeError;
      };

      const decoratedTransaction =
          database.decorateTransaction_(transaction, {});

      decoratedTransaction.end(err => {
        assert.deepStrictEqual(err, fakeError);
        done();
      });
    });

    it('should return any release errors via promise', () => {
      const transaction = {end: () => Promise.resolve()};
      const fakeError = new Error('err');

      database.pool_.release = () => {
        throw fakeError;
      };

      const decoratedTransaction =
          database.decorateTransaction_(transaction, {});

      return decoratedTransaction.end().then(
          () => {
            throw new Error('Should not be called.');
          },
          err => {
            assert.deepStrictEqual(err, fakeError);
          });
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      database.close = (callback) => {
        callback();
      };
    });

    it('should close the database', done => {
      database.close = () => {
        done();
      };

      database.delete();
    });

    it('should make the correct request', () => {
      database.request = (config, callback) => {
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

  describe('exists', () => {
    it('should return any non-404 like errors', done => {
      const error = {code: 3};

      database.getMetadata = (callback) => {
        callback(error);
      };

      database.exists((err, exists) => {
        assert.strictEqual(err, error);
        assert.strictEqual(exists, undefined);
        done();
      });
    });

    it('should return true if error is absent', done => {
      database.getMetadata = (callback) => {
        callback(null);
      };

      database.exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, true);
        done();
      });
    });

    it('should return false if not found error if present', done => {
      const error = {code: 5};

      database.getMetadata = (callback) => {
        callback(error);
      };

      database.exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, false);
        done();
      });
    });
  });

  describe('get', () => {
    it('should call getMetadata', done => {
      const options = {};

      database.getMetadata = () => {
        done();
      };

      database.get(options, assert.ifError);
    });

    it('should not require an options object', done => {
      database.getMetadata = () => {
        done();
      };

      database.get(assert.ifError);
    });

    describe('autoCreate', () => {
      const error = new Error('Error.');
      (error as ApiError).code = 5;

      const OPTIONS = {
        autoCreate: true,
      };

      const OPERATION = {
        listeners: {},
        on(eventName, callback) {
          OPERATION.listeners[eventName] = callback;
          return OPERATION;
        },
      };

      beforeEach(() => {
        OPERATION.listeners = {};

        database.getMetadata = (callback) => {
          callback(error);
        };

        database.create = (options, callback) => {
          callback(null, null, OPERATION);
        };
      });

      it('should call create', done => {
        database.create = (options) => {
          assert.strictEqual(options, OPTIONS);
          done();
        };

        database.get(OPTIONS, assert.ifError);
      });

      it('should return error if create failed', done => {
        const error = new Error('Error.');

        database.create = (options, callback) => {
          callback(error);
        };

        database.get(OPTIONS, err => {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should return operation error', done => {
        const error = new Error('Error.');

        setImmediate(() => {
          OPERATION.listeners['error'](error);
        });

        database.get(OPTIONS, err => {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should execute callback if opereation succeeded', done => {
        const metadata = {};

        setImmediate(() => {
          OPERATION.listeners['complete'](metadata);
        });

        database.get(OPTIONS, (err, database_, apiResponse) => {
          assert.ifError(err);
          assert.strictEqual(database_, database);
          assert.strictEqual(database.metadata, metadata);
          assert.strictEqual(metadata, apiResponse);
          done();
        });
      });
    });

    it('should not auto create without error code 5', done => {
      const error = new Error('Error.');
      // tslint:disable-next-line no-any
      (error as any).code = 'NOT-5';

      const options = {
        autoCreate: true,
      };

      database.getMetadata = (callback) => {
        callback(error);
      };

      database.create = () => {
        throw new Error('Should not create.');
      };

      database.get(options, err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should not auto create unless requested', done => {
      const error = new ApiError('Error.');
      error.code = 5;

      database.getMetadata = (callback) => {
        callback(error);
      };

      database.create = () => {
        throw new Error('Should not create.');
      };

      database.get(err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return an error from getMetadata', done => {
      const error = new Error('Error.');

      database.getMetadata = (callback) => {
        callback(error);
      };

      database.get(err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return self and API response', done => {
      const apiResponse = {};

      database.getMetadata = (callback) => {
        callback(null, apiResponse);
      };

      database.get((err, database_, apiResponse_) => {
        assert.ifError(err);
        assert.strictEqual(database_, database);
        assert.strictEqual(apiResponse_, apiResponse);
        done();
      });
    });
  });

  describe('getMetadata', () => {
    it('should call and return the request', () => {
      const requestReturnValue = {};

      database.request = (config, callback) => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'getDatabase');
        assert.deepStrictEqual(config.reqOpts, {
          name: database.formattedName_,
        });
        assert.strictEqual(callback, assert.ifError);
        return requestReturnValue;
      };

      const returnValue = database.getMetadata(assert.ifError);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('getSchema', () => {
    it('should make the correct request', done => {
      database.request = (config) => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'getDatabaseDdl');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });
        done();
      };

      database.getSchema(assert.ifError);
    });

    describe('error', () => {
      const ARG_1 = {};
      const STATEMENTS_ARG = null;
      const ARG_3 = {};
      const ARG_4 = {};
      const ARG_5 = {};

      beforeEach(() => {
        database.request = (config, callback) => {
          callback(ARG_1, STATEMENTS_ARG, ARG_3, ARG_4, ARG_5);
        };
      });

      it('should return the arguments from the request', done => {
        database.getSchema((arg1, arg2, arg3, arg4, arg5) => {
          assert.strictEqual(arg1, ARG_1);
          assert.strictEqual(arg2, STATEMENTS_ARG);
          assert.strictEqual(arg3, ARG_3);
          assert.strictEqual(arg4, ARG_4);
          assert.strictEqual(arg5, ARG_5);
          done();
        });
      });
    });

    describe('success', () => {
      const ARG_1 = {};
      const ARG_3 = {};
      const ARG_4 = {};
      const ARG_5 = {};

      const STATEMENTS_ARG = {
        statements: {},
      };

      beforeEach(() => {
        database.request = (config, callback) => {
          callback(ARG_1, STATEMENTS_ARG, ARG_3, ARG_4, ARG_5);
        };
      });

      it('should return just the statements property', done => {
        database.getSchema((arg1, statements, arg3, arg4, arg5) => {
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

  describe('makePooledRequest_', () => {
    let CONFIG;

    const SESSION = {
      formattedName_: 'formatted-name',
    };

    // tslint:disable-next-line no-any
    const POOL: any = {};

    beforeEach(() => {
      CONFIG = {
        reqOpts: {},
      };

      database.pool_ = POOL;

      POOL.getReadSession = (callback) => {
        callback(null, SESSION);
      };

      POOL.release = util.noop;
    });

    it('should get a session', done => {
      POOL.getReadSession = () => {
        done();
      };

      database.makePooledRequest_(CONFIG, assert.ifError);
    });

    it('should return error if it cannot get a session', done => {
      const error = new Error('Error.');

      POOL.getReadSession = (callback) => {
        callback(error);
      };

      database.makePooledRequest_(CONFIG, err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should call the method with the session', done => {
      CONFIG.reqOpts = {
        a: 'b',
      };

      database.request = (config) => {
        assert.deepStrictEqual(config.reqOpts, extend({}, CONFIG.reqOpts, {
                                 session: SESSION.formattedName_,
                               }));
        done();
      };

      database.makePooledRequest_(CONFIG, assert.ifError);
    });

    it('should release the session after calling the method', done => {
      POOL.release = (session) => {
        assert.deepStrictEqual(session, SESSION);
        done();
      };

      database.request = (config, callback) => {
        callback();
      };

      database.makePooledRequest_(CONFIG, assert.ifError);
    });

    it('should execute the callback with original arguments', done => {
      const originalArgs = ['a', 'b', 'c'];

      database.request = (config, callback) => {
        callback.apply(null, originalArgs);
      };

      database.makePooledRequest_(CONFIG, (...args) => {
        assert.deepStrictEqual(args, originalArgs);
        done();
      });
    });
  });

  describe('makePooledStreamingRequest_', () => {
    let CONFIG;
    let REQUEST_STREAM;

    const SESSION = {
      formattedName_: 'formatted-name',
    };

    // tslint:disable-next-line no-any
    const POOL: any = {};

    beforeEach(() => {
      REQUEST_STREAM = through();

      CONFIG = {
        reqOpts: {},
      };

      database.pool_ = POOL;

      database.requestStream = () => {
        return REQUEST_STREAM;
      };

      POOL.getReadSession = (callback) => {
        callback(null, SESSION);
      };

      POOL.release = util.noop;
    });

    it('should get a session when stream opens', done => {
      POOL.getReadSession = () => {
        done();
      };

      database.makePooledStreamingRequest_(CONFIG).emit('reading');
    });

    describe('could not get session', () => {
      const ERROR = new Error('Error.');

      beforeEach(() => {
        POOL.getReadSession = (callback) => {
          callback(ERROR);
        };
      });

      it('should destroy the stream', done => {
        database.makePooledStreamingRequest_(CONFIG)
            .on('error',
                err => {
                  assert.strictEqual(err, ERROR);
                  done();
                })
            .emit('reading');
      });
    });

    describe('session retrieved successfully', () => {
      beforeEach(() => {
        POOL.getReadSession = (callback) => {
          callback(null, SESSION);
        };
      });

      it('should assign session to request options', done => {
        database.requestStream = (config) => {
          assert.strictEqual(config.reqOpts.session, SESSION.formattedName_);
          setImmediate(done);
          return through.obj();
        };

        database.makePooledStreamingRequest_(CONFIG).emit('reading');
      });

      it('should make request and pipe to the stream', done => {
        const responseData = Buffer.from('response-data');

        database.makePooledStreamingRequest_(CONFIG).on('data', data => {
          assert.deepStrictEqual(data, responseData);
          done();
        });

        REQUEST_STREAM.end(responseData);
      });

      it('should release session when request stream ends', done => {
        POOL.release = (session) => {
          assert.strictEqual(session, SESSION);
          done();
        };

        database.makePooledStreamingRequest_(CONFIG).emit('reading');

        REQUEST_STREAM.end();
      });

      it('should release session when request stream errors', done => {
        POOL.release = (session) => {
          assert.strictEqual(session, SESSION);
          done();
        };

        database.makePooledStreamingRequest_(CONFIG).emit('reading');

        setImmediate(() => {
          REQUEST_STREAM.emit('error');
        });
      });

      it('should error user stream when request stream errors', done => {
        const error = new Error('Error.');

        database.makePooledStreamingRequest_(CONFIG)
            .on('error',
                err => {
                  assert.strictEqual(err, error);
                  done();
                })
            .emit('reading');

        setImmediate(() => {
          REQUEST_STREAM.destroy(error);
        });
      });
    });

    describe('abort', () => {
      let SESSION;

      beforeEach(() => {
        REQUEST_STREAM.cancel = util.noop;

        SESSION = {
          cancel: util.noop,
        };

        POOL.getReadSession = (callback) => {
          callback(null, SESSION);
        };
      });

      it('should release the session', done => {
        POOL.release = (session) => {
          assert.strictEqual(session, SESSION);
          done();
        };

        const requestStream = database.makePooledStreamingRequest_(CONFIG);

        requestStream.emit('reading');

        setImmediate(() => {
          requestStream.abort();
        });
      });

      it('should not release the session more than once', done => {
        let numTimesReleased = 0;

        POOL.release = (session) => {
          numTimesReleased++;
          assert.strictEqual(session, SESSION);
        };

        const requestStream = database.makePooledStreamingRequest_(CONFIG);

        requestStream.emit('reading');

        setImmediate(() => {
          requestStream.abort();
          assert.strictEqual(numTimesReleased, 1);

          requestStream.abort();
          assert.strictEqual(numTimesReleased, 1);

          done();
        });
      });

      it('should cancel the request stream', done => {
        REQUEST_STREAM.cancel = done;
        const requestStream = database.makePooledStreamingRequest_(CONFIG);
        requestStream.emit('reading');
        setImmediate(() => {
          requestStream.abort();
        });
      });
    });
  });

  describe('run', () => {
    const QUERY = 'SELECT query FROM query';

    let QUERY_STREAM;

    const ROW_1 = {};
    const ROW_2 = {};
    const ROW_3 = {};

    beforeEach(() => {
      QUERY_STREAM = through.obj();
      QUERY_STREAM.push(ROW_1);
      QUERY_STREAM.push(ROW_2);
      QUERY_STREAM.push(ROW_3);

      database.runStream = () => {
        return QUERY_STREAM;
      };
    });

    it('should correctly call runStream', done => {
      database.runStream = (query, options) => {
        assert.strictEqual(query, QUERY);
        assert.strictEqual(options, null);
        setImmediate(done);
        return QUERY_STREAM;
      };

      database.run(QUERY, assert.ifError);
    });

    it('should optionally accept options', done => {
      const OPTIONS = {};

      database.runStream = (query, options) => {
        assert.strictEqual(options, OPTIONS);
        setImmediate(done);
        return QUERY_STREAM;
      };

      database.run(QUERY, OPTIONS, assert.ifError);
    });

    it('should return rows from the stream to the callback', done => {
      QUERY_STREAM.end();

      database.run(QUERY, (err, rows) => {
        assert.ifError(err);
        assert.deepStrictEqual(rows, [ROW_1, ROW_2, ROW_3]);
        done();
      });
    });

    it('should execute callback with error from stream', done => {
      const error = new Error('Error.');

      QUERY_STREAM.destroy(error);

      database.run(QUERY, err => {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('runStream', () => {
    const QUERY = {
      sql: 'SELECT * FROM table',
      a: 'b',
      c: 'd',
    };

    const ENCODED_QUERY = extend({}, QUERY);

    beforeEach(() => {
      fakeCodec.encodeQuery = () => {
        return ENCODED_QUERY;
      };
    });

    it('should accept a query object', done => {
      fakeCodec.encodeQuery = (query) => {
        assert.strictEqual(query, QUERY);
        return ENCODED_QUERY;
      };

      database.makePooledStreamingRequest_ = (config) => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'executeStreamingSql');
        assert.deepStrictEqual(config.reqOpts, ENCODED_QUERY);
        done();
      };

      const stream = database.runStream(QUERY);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should accept a query string', done => {
      fakeCodec.encodeQuery = (query) => {
        assert.strictEqual(query.sql, QUERY.sql);
        return ENCODED_QUERY;
      };

      database.makePooledStreamingRequest_ = (config) => {
        assert.deepStrictEqual(config.reqOpts, ENCODED_QUERY);
        done();
      };

      const stream = database.runStream(QUERY.sql);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should return PartialResultStream', () => {
      const stream = database.runStream(QUERY);
      assert.strictEqual(stream.partialResultStream, fakePartialResultStream);
    });

    it('should pass json, jsonOptions to PartialResultStream', () => {
      // tslint:disable-next-line no-any
      const query: any = extend({}, QUERY);
      query.json = {};
      query.jsonOptions = {};

      const stream = database.runStream(query);
      assert.deepStrictEqual(stream.calledWith_[1], {
        json: query.json,
        jsonOptions: query.jsonOptions,
      });
    });

    it('should not pass json, jsonOptions to request', done => {
      database.makePooledStreamingRequest_ = (config) => {
        assert.strictEqual(config.reqOpts.json, undefined);
        assert.strictEqual(config.reqOpts.jsonOptions, undefined);
        done();
      };

      // tslint:disable-next-line no-any
      const query: any = extend({}, QUERY);
      query.json = {};
      query.jsonOptions = {};

      const stream = database.runStream(query);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });

    it('should assign a resumeToken to the request', done => {
      const resumeToken = 'resume-token';

      database.makePooledStreamingRequest_ = (config) => {
        assert.strictEqual(config.reqOpts.resumeToken, resumeToken);
        done();
      };

      const stream = database.runStream(QUERY);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn(resumeToken);
    });

    it('should add timestamp options', done => {
      const OPTIONS = {a: 'a'};
      const FORMATTED_OPTIONS = {b: 'b'};

      // tslint:disable-next-line no-any
      (FakeTransactionRequest as any).formatTimestampOptions_ = (options) => {
        assert.strictEqual(options, OPTIONS);
        return FORMATTED_OPTIONS;
      };

      database.makePooledStreamingRequest_ = (config) => {
        assert.deepStrictEqual(
            config.reqOpts.transaction.singleUse.readOnly, FORMATTED_OPTIONS);

        done();
      };

      const stream = database.runStream(QUERY, OPTIONS);
      const makeRequestFn = stream.calledWith_[0];
      makeRequestFn();
    });
  });

  describe('runTransaction', () => {
    it('should get a Transaction object', done => {
      database.getTransaction = () => {
        done();
      };

      database.runTransaction(assert.ifError);
    });

    it('should execute callback with error', done => {
      const error = new Error('Error.');

      database.getTransaction = (options, callback) => {
        callback(error);
      };

      database.runTransaction(err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should run the transaction', done => {
      const TRANSACTION = {};
      const OPTIONS = {
        a: 'a',
      };

      const dateNow = Date.now;
      const fakeDate = 123445668382;

      Date.now = () => {
        return fakeDate;
      };

      database.getTransaction = (options, callback) => {
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

    it('should capture the timeout', done => {
      const TRANSACTION = {};
      const OPTIONS = {
        timeout: 1000,
      };

      database.getTransaction = (options, callback) => {
        callback(null, TRANSACTION);
      };

      database.runTransaction(OPTIONS, (err, txn) => {
        assert.ifError(err);
        assert.strictEqual(txn.timeout_, OPTIONS.timeout);
        done();
      });
    });
  });

  describe('table', () => {
    const NAME = 'table-name';

    it('should throw if a name is not provided', () => {
      assert.throws(() => {
        database.table();
      }, /A name is required to access a Table object\./);
    });

    it('should return an instance of Tession', () => {
      const table = database.table(NAME);

      assert(table instanceof FakeTable);
      assert.strictEqual(table.calledWith_[0], database);
      assert.strictEqual(table.calledWith_[1], NAME);
    });
  });

  describe('updateSchema', () => {
    const STATEMENTS = ['statement-1', 'statement-2'];

    it('should call and return the request', () => {
      const requestReturnValue = {};

      database.request = (config, callback) => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'updateDatabaseDdl');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
          statements: STATEMENTS,
        });
        assert.strictEqual(callback, assert.ifError);
        return requestReturnValue;
      };

      const returnValue = database.updateSchema(STATEMENTS, assert.ifError);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should arrify a string statement', done => {
      database.request = (config) => {
        assert.deepStrictEqual(config.reqOpts.statements, [STATEMENTS[0]]);
        done();
      };

      database.updateSchema(STATEMENTS[0], assert.ifError);
    });

    it('should accept an object', done => {
      const config = {
        statements: STATEMENTS,
        otherConfiguration: {},
      };

      const expectedReqOpts = extend({}, config, {
        database: database.formattedName_,
      });

      database.request = (config) => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        done();
      };

      database.updateSchema(config, assert.ifError);
    });
  });

  describe('createSession', () => {
    const OPTIONS = {};

    it('should make the correct request', done => {
      database.request = (config) => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'createSession');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });

        assert.deepStrictEqual(config.gaxOpts, OPTIONS);

        done();
      };

      database.createSession(OPTIONS, assert.ifError);
    });

    it('should not require options', done => {
      database.request = (config) => {
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });

        assert.deepStrictEqual(config.gaxOpts, {});

        done();
      };

      database.createSession(assert.ifError);
    });

    it('should send labels correctly', done => {
      const labels = {a: 'b'};
      const options = {a: 'b', labels};
      const originalOptions = extend(true, {}, options);

      database.request = (config) => {
        assert.deepStrictEqual(config.reqOpts.session, {labels});
        assert.deepStrictEqual(options, originalOptions);
        done();
      };

      database.createSession({labels}, assert.ifError);
    });

    describe('error', () => {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(() => {
        database.request = (config, callback) => {
          callback(ERROR, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', done => {
        database.createSession((err, session, apiResponse) => {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(session, null);
          assert.strictEqual(apiResponse, API_RESPONSE);
          done();
        });
      });
    });

    describe('success', () => {
      const API_RESPONSE = {
        name: 'session-name',
      };

      beforeEach(() => {
        database.request = (config, callback) => {
          callback(null, API_RESPONSE);
        };
      });

      it('should execute callback with session & API response', done => {
        const sessionInstance = {};

        database.session = (name) => {
          assert.strictEqual(name, API_RESPONSE.name);
          return sessionInstance;
        };

        database.createSession((err, session, apiResponse) => {
          assert.ifError(err);

          assert.strictEqual(session, sessionInstance);
          assert.strictEqual(session.metadata, API_RESPONSE);

          assert.strictEqual(apiResponse, API_RESPONSE);

          done();
        });
      });
    });
  });

  describe('getTransaction', () => {
    let SESSION;
    let TRANSACTION;

    beforeEach(() => {
      TRANSACTION = {};

      SESSION = {
        beginTransaction(options, callback) {
          callback(null, TRANSACTION);
        },
      };

      database.pool_ = {
        getWriteSession(callback) {
          callback(null, SESSION, TRANSACTION);
        },
      };

      database.decorateTransaction_ = (txn) => {
        return txn;
      };
    });

    describe('write mode', () => {
      it('should get a session from the pool', done => {
        database.getTransaction((err, transaction) => {
          assert.ifError(err);
          assert.strictEqual(transaction, TRANSACTION);
          done();
        });
      });

      it('should decorate the transaction', done => {
        const DECORATED_TRANSACTION = {};

        database.decorateTransaction_ = (transaction, session) => {
          assert.strictEqual(transaction, TRANSACTION);
          assert.strictEqual(session, SESSION);
          return DECORATED_TRANSACTION;
        };

        database.getTransaction((err, transaction) => {
          assert.ifError(err);
          assert.strictEqual(transaction, DECORATED_TRANSACTION);
          done();
        });
      });

      it('should return errors to the callback', done => {
        const error = new Error('Error.');

        database.pool_ = {
          getWriteSession(callback) {
            callback(error);
          },
        };

        database.getTransaction(err => {
          assert.strictEqual(err, error);
          done();
        });
      });
    });

    describe('readOnly mode', () => {
      const OPTIONS = {
        readOnly: true,
        a: 'a',
      };

      beforeEach(() => {
        database.pool_ = {
          getReadSession(callback) {
            callback(null, SESSION);
          },
          release: util.noop,
        };
      });

      it('should get a session from the pool', done => {
        database.pool_.getReadSession = () => {
          done();
        };

        database.getTransaction(OPTIONS, assert.ifError);
      });

      it('should return an error if could not get session', done => {
        const error = new Error('err.');

        database.pool_.getReadSession = (callback) => {
          callback(error);
        };

        database.getTransaction(OPTIONS, err => {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should should create a transaction', done => {
        SESSION.beginTransaction = (options) => {
          assert.strictEqual(options, OPTIONS);
          done();
        };

        database.getTransaction(OPTIONS, assert.ifError);
      });

      it('should decorate the transaction', done => {
        const DECORATED_TRANSACTION = {};

        database.decorateTransaction_ = (transaction, session) => {
          assert.strictEqual(transaction, TRANSACTION);
          assert.strictEqual(session, SESSION);
          return DECORATED_TRANSACTION;
        };

        database.getTransaction(OPTIONS, (err, transaction) => {
          assert.ifError(err);
          assert.strictEqual(transaction, DECORATED_TRANSACTION);
          done();
        });
      });

      it('should return an error if transaction cannot begin', done => {
        const error = new Error('err');

        SESSION.beginTransaction = (options, callback) => {
          callback(error);
        };

        database.getTransaction(OPTIONS, err => {
          assert.strictEqual(err, error);
          done();
        });
      });
    });

    describe('partitioned mode', () => {
      const OPTIONS = {
        partitioned: true,
      };

      it('should get a session from the pool', (done) => {
        database.pool_.getReadSession = () => {
          setImmediate(done);
          return Promise.resolve();
        };
        database.getTransaction(OPTIONS, assert.ifError);
      });
    });
  });

  describe('getSessions', () => {
    it('should make the correct request', done => {
      const gaxOpts = {};
      const options = {a: 'a', gaxOptions: gaxOpts};

      const expectedReqOpts = extend({}, options, {
        database: database.formattedName_,
      });

      delete expectedReqOpts.gaxOptions;

      database.request = (config) => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'listSessions');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.strictEqual(config.gaxOpts, gaxOpts);
        done();
      };

      database.getSessions(options, assert.ifError);
    });

    it('should not require a query', done => {
      database.request = (config) => {
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });
        done();
      };
      database.getSessions(assert.ifError);
    });

    it('should return all arguments on error', done => {
      const ARGS = [new Error('err'), null, {}];
      database.request = (config, callback) => {
        callback.apply(null, ARGS);
      };
      database.getSessions((...args) => {
        assert.deepStrictEqual(args, ARGS);
        done();
      });
    });

    it('should create and return Session objects', done => {
      const SESSIONS = [{name: 'abc'}];
      const SESSION_INSTANCE = {};
      const RESPONSE = {};

      database.request = (config, callback) => {
        callback(null, SESSIONS, RESPONSE);
      };

      database.session = (name) => {
        assert.strictEqual(name, SESSIONS[0].name);
        return SESSION_INSTANCE;
      };

      database.getSessions((err, sessions, resp) => {
        assert.ifError(err);
        assert.strictEqual(sessions[0], SESSION_INSTANCE);
        assert.strictEqual(resp, RESPONSE);
        done();
      });
    });
  });

  describe('runPartitionedUpdate', () => {
    it('should get a session from the pool', done => {
      database.getTransaction = (options) => {
        assert.deepStrictEqual(options, {partitioned: true});
        done();
      };
      database.runPartitionedUpdate({}, assert.ifError);
    });

    it('should return any getTransaction errors', done => {
      const error = new Error('err');

      database.getTransaction = (options, callback) => {
        callback(error);
      };
      database.runPartitionedUpdate({}, err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should run the query', done => {
      const fakeQuery = {};
      const transaction = {
        runUpdate(query) {
          assert.strictEqual(query, fakeQuery);
          done();
        },
      };

      database.getTransaction = (options, callback) => {
        callback(null, transaction);
      };

      database.runPartitionedUpdate(fakeQuery, assert.ifError);
    });

    it('should end the transaction', done => {
      const transaction = {
        runUpdate(query, callback) {
          callback(null);
        },
        end: done,
      };

      database.getTransaction = (options, callback) => {
        callback(null, transaction);
      };

      database.runPartitionedUpdate({}, assert.ifError);
    });

    it('should pass back the row count', done => {
      const error = new Error('err');
      const fakeRowCount = 5;
      const transaction = {
        runUpdate: (query, callback) => {
          callback(error, fakeRowCount);
        },
        end: () => {},
      };

      database.getTransaction = (options, callback) => {
        callback(null, transaction);
      };

      database.runPartitionedUpdate({}, (err, rowCount) => {
        assert.strictEqual(err, error);
        assert.strictEqual(rowCount, fakeRowCount);
        done();
      });
    });
  });

  describe('session', () => {
    const NAME = 'session-name';

    it('should return an instance of Session', () => {
      const session = database.session(NAME);
      assert(session instanceof FakeSession);
      assert.strictEqual(session.calledWith_[0], database);
      assert.strictEqual(session.calledWith_[1], NAME);
    });
  });
});
