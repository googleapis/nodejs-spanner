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

/* eslint-disable prefer-rest-params */

import * as assert from 'assert';
import {before, beforeEach, afterEach, describe, it} from 'mocha';
import {EventEmitter} from 'events';
import * as extend from 'extend';
import {ApiError, util} from '@google-cloud/common';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import {Transform, Duplex} from 'stream';
import * as through from 'through2';
import * as pfy from '@google-cloud/promisify';
import {grpc} from 'google-gax';
import * as db from '../src/database';
import {Instance} from '../src';
import {MockError} from './mockserver/mockspanner';
import {IOperation} from '../src/instance';
import {CLOUD_RESOURCE_HEADER} from '../src/common';
import {google} from '../protos/protos';
import RequestOptions = google.spanner.v1.RequestOptions;
import EncryptionType = google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.EncryptionType;

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll(klass, options) {
    if (klass.name !== 'Database') {
      return;
    }
    promisified = true;
    assert.deepStrictEqual(options.exclude, [
      'batchTransaction',
      'getRestoreInfo',
      'getState',
      'getOperations',
      'runTransaction',
      'runTransactionAsync',
      'table',
      'session',
    ]);
  },
});

class FakeBatchTransaction {
  calledWith_: IArguments;
  id?: string;
  readTimestamp?: {seconds: number; nanos: number};
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

function fakePartialResultStream(this: Function & {calledWith_: IArguments}) {
  this.calledWith_ = arguments;
  return this;
}

class FakeSession {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
  partitionedDml(): FakeTransaction {
    return new FakeTransaction();
  }
  snapshot(): FakeTransaction {
    return new FakeTransaction();
  }
}

interface ReadSessionCallback {
  (err: Error, session?: null): void;
  (err: null, session: FakeSession): void;
}

interface WriteSessionCallback {
  (err: Error, session?: null, transaction?: null): void;
  (err: null, session: FakeSession, transaction: FakeTransaction): void;
}

class FakeSessionPool extends EventEmitter {
  calledWith_: IArguments;
  constructor() {
    super();
    this.calledWith_ = arguments;
  }
  open() {}
  getReadSession() {}
  getWriteSession() {}
  release() {}
}

class FakeTable {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

class FakeTransaction extends EventEmitter {
  calledWith_: IArguments;
  constructor() {
    super();
    this.calledWith_ = arguments;
  }
  begin() {}
  end() {}
  runStream(): Transform {
    return through.obj();
  }
  runUpdate() {}
}

let fakeTransactionRunner: FakeTransactionRunner;

class FakeTransactionRunner {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
    fakeTransactionRunner = this;
  }
  async run(): Promise<void> {}
}

let fakeAsyncTransactionRunner: FakeAsyncTransactionRunner<{}>;

class FakeAsyncTransactionRunner<T> {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
    fakeAsyncTransactionRunner = this;
  }
  async run(): Promise<T> {
    return {} as T;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakeCodec: any = {
  encode: util.noop,
  Int() {},
  Float() {},
  SpannerDate() {},
};

class FakeAbortError {
  error;
  constructor(err) {
    this.error = err;
  }
}

const fakeRetry = fn => {
  return fn();
};

fakeRetry.AbortError = FakeAbortError;

describe('Database', () => {
  const sandbox = sinon.createSandbox();

  // tslint:disable-next-line variable-name
  let Database: typeof db.Database;
  // tslint:disable-next-line variable-name
  let DatabaseCached: typeof db.Database;

  const INSTANCE = ({
    request: util.noop,
    requestStream: util.noop,
    formattedName_: 'instance-name',
    databases_: new Map(),
  } as {}) as Instance;

  const NAME = 'table-name';
  const DATABASE_FORMATTED_NAME =
    INSTANCE.formattedName_ + '/databases/' + NAME;

  const POOL_OPTIONS = {};

  let database;

  before(() => {
    Database = proxyquire('../src/database.js', {
      './common-grpc/service-object': {
        GrpcServiceObject: FakeGrpcServiceObject,
      },
      '@google-cloud/promisify': fakePfy,
      'p-retry': fakeRetry,
      './batch-transaction': {BatchTransaction: FakeBatchTransaction},
      './codec': {codec: fakeCodec},
      './partial-result-stream': {partialResultStream: fakePartialResultStream},
      './session-pool': {SessionPool: FakeSessionPool},
      './session': {Session: FakeSession},
      './table': {Table: FakeTable},
      './transaction-runner': {
        TransactionRunner: FakeTransactionRunner,
        AsyncTransactionRunner: FakeAsyncTransactionRunner,
      },
    }).Database;
    // The following commented out line is the one that will trigger the error.
    // DatabaseCached = extend({}, Database);
    DatabaseCached = Object.assign({}, Database);
  });

  beforeEach(() => {
    fakeCodec.encode = util.noop;
    extend(Database, DatabaseCached);
    database = new Database(INSTANCE, NAME, POOL_OPTIONS);
    database.parent = INSTANCE;
  });

  afterEach(() => sandbox.restore());

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

      const database = new Database(
        INSTANCE,
        NAME,
        (FakePool as {}) as db.SessionPoolConstructor
      );
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

      new Database(INSTANCE, NAME);
    });

    it('should inherit from ServiceObject', done => {
      const options = {};

      const instanceInstance = extend({}, INSTANCE, {
        createDatabase(name, options_, callback) {
          assert.strictEqual(name, database.formattedName_);
          assert.strictEqual(options_, options);
          callback(); // done()
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const database: any = new Database(instanceInstance, NAME);
      assert(database instanceof FakeGrpcServiceObject);

      const calledWith = database.calledWith_[0];

      assert.strictEqual(calledWith.parent, instanceInstance);
      assert.strictEqual(calledWith.id, NAME);
      assert.deepStrictEqual(calledWith.methods, {create: true});

      calledWith.createMethod(null, options, done);
    });

    it('should set the resourceHeader_', () => {
      assert.deepStrictEqual(database.resourceHeader_, {
        [CLOUD_RESOURCE_HEADER]: database.formattedName_,
      });
    });
  });

  describe('formatName_', () => {
    it('should return the name if already formatted', () => {
      assert.strictEqual(
        Database.formatName_(INSTANCE.formattedName_, DATABASE_FORMATTED_NAME),
        DATABASE_FORMATTED_NAME
      );
    });

    it('should format the name', () => {
      const formattedName_ = Database.formatName_(
        INSTANCE.formattedName_,
        NAME
      );
      assert.strictEqual(formattedName_, DATABASE_FORMATTED_NAME);
    });
  });

  describe('batchCreateSessions', () => {
    it('should make the correct request', () => {
      const stub = sandbox.stub(database, 'request');
      const count = 10;

      database.batchCreateSessions({count}, assert.ifError);

      const {client, method, reqOpts, gaxOpts, headers} = stub.lastCall.args[0];

      assert.strictEqual(client, 'SpannerClient');
      assert.strictEqual(method, 'batchCreateSessions');
      assert.strictEqual(reqOpts.database, DATABASE_FORMATTED_NAME);
      assert.strictEqual(reqOpts.sessionCount, count);
      assert.strictEqual(gaxOpts, undefined);
      assert.deepStrictEqual(headers, database.resourceHeader_);
    });

    it('should accept just a count number', () => {
      const stub = sandbox.stub(database, 'request');
      const count = 10;

      database.batchCreateSessions(count, assert.ifError);

      const {reqOpts} = stub.lastCall.args[0];
      assert.strictEqual(reqOpts.sessionCount, count);
    });

    it('should accept session labels', () => {
      const stub = sandbox.stub(database, 'request');
      const labels = {foo: 'bar'};

      database.batchCreateSessions({count: 10, labels}, assert.ifError);

      const {reqOpts} = stub.lastCall.args[0];

      assert.deepStrictEqual(reqOpts.sessionTemplate, {labels});
    });

    it('should accept gaxOptions', () => {
      const stub = sandbox.stub(database, 'request');
      const gaxOptions = {timeout: 1000};

      database.batchCreateSessions({count: 10, gaxOptions}, assert.ifError);

      const {gaxOpts} = stub.lastCall.args[0];

      assert.strictEqual(gaxOpts, gaxOptions);
    });

    it('should return any request errors', done => {
      const error = new Error('err');
      const response = {};

      sandbox.stub(database, 'request').callsFake((_, cb) => {
        cb(error, response);
      });

      database.batchCreateSessions({count: 10}, (err, sessions, resp) => {
        assert.strictEqual(err, error);
        assert.strictEqual(sessions, null);
        assert.strictEqual(resp, response);
        done();
      });
    });

    it('should create session objects from the response', done => {
      const stub = sandbox.stub(database, 'session');
      const fakeSessions = [{}, {}, {}];
      const response = {
        session: [{name: 'a'}, {name: 'b'}, {name: 'c'}],
      };

      response.session.forEach((session, i) => {
        stub.withArgs(session.name).returns(fakeSessions[i]);
      });

      sandbox.stub(database, 'request').callsFake((_, cb) => {
        cb(null, response);
      });

      database.batchCreateSessions({count: 10}, (err, sessions, resp) => {
        assert.strictEqual(err, null);
        assert.deepStrictEqual(sessions, fakeSessions);
        assert.strictEqual(resp, response);
        done();
      });
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
        timestamp: READ_TIMESTAMP,
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
        timestamp: READ_TIMESTAMP,
      };

      database.session = id => {
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
        const cacheId = FAKE_ID.split('/').pop()!;

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
      database.pool_ = {
        getReadSession(callback) {
          callback(null, SESSION);
        },
      };
    });

    it('should return any get session errors', done => {
      const error = new Error('err');

      database.pool_ = {
        getReadSession(callback) {
          callback(error);
        },
      };

      database.createBatchTransaction((err, transaction, resp) => {
        assert.strictEqual(err, error);
        assert.strictEqual(transaction, null);
        assert.strictEqual(resp, undefined);
        done();
      });
    });

    it('should create a transaction', done => {
      const opts = {a: 'b'};

      const fakeTransaction = {
        begin(callback) {
          callback(null, RESPONSE);
        },

        once() {},
      };

      database.batchTransaction = (identifier, options) => {
        assert.deepStrictEqual(identifier, {session: SESSION});
        assert.strictEqual(options, opts);
        return fakeTransaction;
      };

      database.createBatchTransaction(opts, (err, transaction, resp) => {
        assert.strictEqual(err, null);
        assert.strictEqual(transaction, fakeTransaction);
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

        once() {},
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
      database.updateSchema = schema => {
        assert.strictEqual(schema, SCHEMA);
        done();
      };

      database.createTable(SCHEMA, assert.ifError);
    });

    it('should accept and pass gaxOptions to updateSchema', done => {
      const gaxOptions = {};
      database.updateSchema = (schema, options) => {
        assert.strictEqual(options, gaxOptions);
        done();
      };
      database.createTable(SCHEMA, gaxOptions, assert.ifError);
    });

    describe('error', () => {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(() => {
        database.updateSchema = (name, options, callback) => {
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
        database.updateSchema = (name, options, callback) => {
          callback(null, OPERATION, API_RESPONSE);
        };
      });

      describe('table name parsing', () => {
        it('should recognize an escaped name', done => {
          database.table = name => {
            assert.strictEqual(name, TABLE_NAME);
            done();
          };

          database.createTable(SCHEMA, assert.ifError);
        });

        it('should recognize a non-escaped name', done => {
          database.table = name => {
            assert.strictEqual(name, TABLE_NAME);
            done();
          };

          database.createTable('CREATE TABLE ' + TABLE_NAME, assert.ifError);
        });
      });

      it('should exec callback with Table, op & API response', done => {
        const tableInstance = {};

        database.table = name => {
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

  describe('delete', () => {
    beforeEach(() => {
      database.close = callback => {
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
        assert.deepStrictEqual(config.gaxOpts, {});
        assert.deepStrictEqual(config.headers, database.resourceHeader_);
        assert.strictEqual(callback, assert.ifError);
      };

      database.delete(assert.ifError);
    });

    it('should accept gaxOptions', done => {
      const gaxOptions = {};

      database.request = config => {
        assert.strictEqual(config.gaxOpts, gaxOptions);
        done();
      };

      database.delete(gaxOptions, assert.ifError);
    });
  });

  describe('exists', () => {
    it('should return any non-404 like errors', done => {
      const error = {code: 3};

      database.getMetadata = (options, callback) => {
        callback(error);
      };

      database.exists((err, exists) => {
        assert.strictEqual(err, error);
        assert.strictEqual(exists, undefined);
        done();
      });
    });

    it('should return true if error is absent', done => {
      database.getMetadata = (options, callback) => {
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

      database.getMetadata = (options, callback) => {
        callback(error);
      };

      database.exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, false);
        done();
      });
    });

    it('should accept and pass gaxOptions to getMetadata', done => {
      const gaxOptions = {};

      database.getMetadata = options => {
        assert.strictEqual(options, gaxOptions);
        done();
      };
      database.exists(gaxOptions, assert.ifError);
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

    it('should accept and pass gaxOptions to getMetadata', done => {
      const gaxOptions = {};
      database.getMetadata = options => {
        assert.strictEqual(options, gaxOptions);
        done();
      };

      database.get({gaxOptions});
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

        database.getMetadata = (options, callback) => {
          callback(error);
        };

        database.create = (options, callback) => {
          callback(null, null, OPERATION);
        };
      });

      it('should call create', done => {
        database.create = options => {
          assert.strictEqual(options, OPTIONS);
          done();
        };

        database.get(OPTIONS, assert.ifError);
      });

      it('should pass gaxOptions to create', done => {
        const gaxOptions = {};
        const options = Object.assign({}, OPTIONS, {gaxOptions});
        database.create = opts => {
          assert.strictEqual(opts.gaxOptions, options.gaxOptions);
          done();
        };

        database.get(options, assert.ifError);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).code = 'NOT-5';

      const options = {
        autoCreate: true,
      };

      database.getMetadata = (options, callback) => {
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

      database.getMetadata = (options, callback) => {
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

      database.getMetadata = (options, callback) => {
        callback(error);
      };

      database.get(err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return self and API response', done => {
      const apiResponse = {};

      database.getMetadata = (options, callback) => {
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

      database.request = config => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'getDatabase');
        assert.deepStrictEqual(config.reqOpts, {
          name: database.formattedName_,
        });
        assert.deepStrictEqual(config.gaxOpts, {});
        assert.deepStrictEqual(config.headers, database.resourceHeader_);
        return requestReturnValue;
      };

      const returnValue = database.getMetadata(assert.ifError);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should accept gaxOptions', done => {
      const gaxOptions = {};
      database.request = config => {
        assert.strictEqual(config.gaxOpts, gaxOptions);
        done();
      };
      database.getMetadata(gaxOptions, assert.ifError);
    });
  });

  describe('getSchema', () => {
    it('should make the correct request', done => {
      database.request = config => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'getDatabaseDdl');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });
        assert.deepStrictEqual(config.gaxOpts, {});
        assert.deepStrictEqual(config.headers, database.resourceHeader_);
        done();
      };

      database.getSchema(assert.ifError);
    });

    it('should accept gaxOptions', done => {
      const gaxOptions = {};
      database.request = config => {
        assert.strictEqual(config.gaxOpts, gaxOptions);
        done();
      };

      database.getSchema(gaxOptions, assert.ifError);
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

      it('should update metadata', done => {
        const metadata = {};
        database.request = (config: {}, callback: Function) => {
          callback(null, metadata);
        };
        database.getMetadata(() => {
          assert.strictEqual(database.metadata, metadata);
          done();
        });
      });

      it('should call callback with error', done => {
        const error = new Error('Error');
        database.request = (config: {}, callback: Function) => {
          callback(error);
        };
        database.getMetadata(err => {
          assert.strictEqual(err, error);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const POOL: any = {};

    beforeEach(() => {
      CONFIG = {
        reqOpts: {},
      };

      database.pool_ = POOL;

      POOL.getReadSession = callback => {
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

      POOL.getReadSession = callback => {
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

      database.request = config => {
        assert.deepStrictEqual(
          config.reqOpts,
          extend({}, CONFIG.reqOpts, {
            session: SESSION.formattedName_,
          })
        );
        done();
      };

      database.makePooledRequest_(CONFIG, assert.ifError);
    });

    it('should release the session after calling the method', done => {
      POOL.release = session => {
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
        callback(...originalArgs);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      POOL.getReadSession = callback => {
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
        POOL.getReadSession = callback => {
          callback(ERROR);
        };
      });

      it('should destroy the stream', done => {
        database
          .makePooledStreamingRequest_(CONFIG)
          .on('error', err => {
            assert.strictEqual(err, ERROR);
            done();
          })
          .emit('reading');
      });
    });

    describe('session retrieved successfully', () => {
      beforeEach(() => {
        POOL.getReadSession = callback => {
          callback(null, SESSION);
        };
      });

      it('should assign session to request options', done => {
        database.requestStream = config => {
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
        POOL.release = session => {
          assert.strictEqual(session, SESSION);
          done();
        };

        database.makePooledStreamingRequest_(CONFIG).emit('reading');

        REQUEST_STREAM.end();
      });

      it('should release session when request stream errors', done => {
        POOL.release = session => {
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

        database
          .makePooledStreamingRequest_(CONFIG)
          .on('error', err => {
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

        POOL.getReadSession = callback => {
          callback(null, SESSION);
        };
      });

      it('should release the session', done => {
        POOL.release = session => {
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

        POOL.release = session => {
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
        assert.deepStrictEqual(options, {});
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

    let fakePool: FakeSessionPool;
    let fakeSession: FakeSession;
    let fakeSession2: FakeSession;
    let fakeSnapshot: FakeTransaction;
    let fakeSnapshot2: FakeTransaction;
    let fakeStream: Transform;
    let fakeStream2: Transform;

    let getReadSessionStub: sinon.SinonStub;
    let snapshotStub: sinon.SinonStub;
    let runStreamStub: sinon.SinonStub;

    beforeEach(() => {
      fakePool = database.pool_;
      fakeSession = new FakeSession();
      fakeSession2 = new FakeSession();
      fakeSnapshot = new FakeTransaction();
      fakeSnapshot2 = new FakeTransaction();
      fakeStream = through.obj();
      fakeStream2 = through.obj();

      getReadSessionStub = (sandbox.stub(
        fakePool,
        'getReadSession'
      ) as sinon.SinonStub)
        .onFirstCall()
        .callsFake(callback => callback(null, fakeSession))
        .onSecondCall()
        .callsFake(callback => callback(null, fakeSession2));

      snapshotStub = sandbox
        .stub(fakeSession, 'snapshot')
        .returns(fakeSnapshot);

      sandbox.stub(fakeSession2, 'snapshot').returns(fakeSnapshot2);

      runStreamStub = sandbox
        .stub(fakeSnapshot, 'runStream')
        .returns(fakeStream);

      sandbox.stub(fakeSnapshot2, 'runStream').returns(fakeStream2);
    });

    it('should get a read session via `getReadSession`', () => {
      getReadSessionStub.callsFake(() => {});
      database.runStream(QUERY);

      assert.strictEqual(getReadSessionStub.callCount, 1);
    });

    it('should destroy the stream if `getReadSession` errors', done => {
      const fakeError = new Error('err');

      getReadSessionStub
        .onFirstCall()
        .callsFake(callback => callback(fakeError));

      database.runStream(QUERY).on('error', err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should pass through timestamp bounds', () => {
      const fakeOptions = {strong: false};
      database.runStream(QUERY, fakeOptions);

      const options = snapshotStub.lastCall.args[0];
      assert.strictEqual(options, fakeOptions);
    });

    it('should call through to `snapshot.runStream`', () => {
      const pipeStub = sandbox.stub(fakeStream, 'pipe');
      const proxyStream = database.runStream(QUERY);

      const query = runStreamStub.lastCall.args[0];
      assert.strictEqual(query, QUERY);

      const stream = pipeStub.lastCall.args[0];
      assert.strictEqual(stream, proxyStream);
    });

    it('should end the snapshot on stream end', done => {
      const endStub = sandbox.stub(fakeSnapshot, 'end');

      database
        .runStream(QUERY)
        .on('data', done)
        .on('end', () => {
          assert.strictEqual(endStub.callCount, 1);
          done();
        });

      fakeStream.push(null);
    });

    it('should clean up the stream/transaction on error', done => {
      const fakeError = new Error('err');
      const endStub = sandbox.stub(fakeSnapshot, 'end');

      database.runStream(QUERY).on('error', err => {
        assert.strictEqual(err, fakeError);
        assert.strictEqual(endStub.callCount, 1);
        done();
      });

      fakeStream.destroy(fakeError);
    });

    it('should release the session on transaction end', () => {
      const releaseStub = sandbox.stub(fakePool, 'release') as sinon.SinonStub;

      database.runStream(QUERY);
      fakeSnapshot.emit('end');

      const session = releaseStub.lastCall.args[0];
      assert.strictEqual(session, fakeSession);
    });

    it('should retry "Session not found" error', done => {
      const sessionNotFoundError = {
        code: grpc.status.NOT_FOUND,
        message: 'Session not found',
      } as grpc.ServiceError;
      const endStub = sandbox.stub(fakeSnapshot, 'end');
      const endStub2 = sandbox.stub(fakeSnapshot2, 'end');
      let rows = 0;

      database
        .runStream(QUERY)
        .on('data', () => rows++)
        .on('error', err => {
          assert.fail(err);
        })
        .on('end', () => {
          assert.strictEqual(endStub.callCount, 1);
          assert.strictEqual(endStub2.callCount, 1);
          assert.strictEqual(rows, 1);
          done();
        });

      fakeStream.emit('error', sessionNotFoundError);
      fakeStream2.push('row1');
      fakeStream2.push(null);
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
        assert.deepStrictEqual(config.gaxOpts, {});
        assert.deepStrictEqual(config.headers, database.resourceHeader_);
        assert.strictEqual(callback, assert.ifError);
        return requestReturnValue;
      };

      const returnValue = database.updateSchema(STATEMENTS, assert.ifError);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should arrify a string statement', done => {
      database.request = config => {
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

      database.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        done();
      };

      database.updateSchema(config, assert.ifError);
    });

    it('should accept gaxOptions', done => {
      const gaxOptions = {};
      database.request = config => {
        assert.strictEqual(config.gaxOpts, gaxOptions);
        done();
      };
      database.updateSchema(STATEMENTS, gaxOptions, assert.ifError);
    });
  });

  describe('createSession', () => {
    const gaxOptions = {};
    const OPTIONS = {gaxOptions};

    it('should make the correct request', done => {
      database.request = config => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'createSession');
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });
        assert.strictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.headers, database.resourceHeader_);

        done();
      };

      database.createSession(OPTIONS, assert.ifError);
    });

    it('should not require options', done => {
      database.request = config => {
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });

        assert.strictEqual(config.gaxOpts, undefined);
        done();
      };

      database.createSession(assert.ifError);
    });

    it('should send labels correctly', done => {
      const labels = {a: 'b'};
      const options = {a: 'b', labels};
      const originalOptions = extend(true, {}, options);

      database.request = config => {
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

        database.session = name => {
          assert.strictEqual(name, API_RESPONSE.name);
          return sessionInstance;
        };

        database.createSession((err, session, apiResponse) => {
          assert.ifError(err);

          assert.strictEqual(session, sessionInstance);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          assert.strictEqual((session as any).metadata, API_RESPONSE);

          assert.strictEqual(apiResponse, API_RESPONSE);

          done();
        });
      });
    });
  });

  describe('getSnapshot', () => {
    let fakePool: FakeSessionPool;
    let fakeSession: FakeSession;
    let fakeSnapshot: FakeTransaction;

    let beginSnapshotStub: sinon.SinonStub;
    let getReadSessionStub: sinon.SinonStub;
    let snapshotStub: sinon.SinonStub;

    beforeEach(() => {
      fakePool = database.pool_;
      fakeSession = new FakeSession();
      fakeSnapshot = new FakeTransaction();

      beginSnapshotStub = (sandbox.stub(
        fakeSnapshot,
        'begin'
      ) as sinon.SinonStub).callsFake(callback => callback(null));

      getReadSessionStub = (sandbox.stub(
        fakePool,
        'getReadSession'
      ) as sinon.SinonStub).callsFake(callback => callback(null, fakeSession));

      snapshotStub = sandbox
        .stub(fakeSession, 'snapshot')
        .returns(fakeSnapshot);
    });

    it('should call through to `SessionPool#getReadSession`', () => {
      getReadSessionStub.callsFake(() => {});

      database.getSnapshot(assert.ifError);

      assert.strictEqual(getReadSessionStub.callCount, 1);
    });

    it('should return any pool errors', done => {
      const fakeError = new Error('err');

      getReadSessionStub.callsFake(callback => callback(fakeError));

      database.getSnapshot(err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should pass the timestamp bounds to the snapshot', () => {
      const fakeTimestampBounds = {};

      database.getSnapshot(fakeTimestampBounds, assert.ifError);

      const bounds = snapshotStub.lastCall.args[0];
      assert.strictEqual(bounds, fakeTimestampBounds);
    });

    it('should begin a snapshot', () => {
      beginSnapshotStub.callsFake(() => {});

      database.getSnapshot(assert.ifError);

      assert.strictEqual(beginSnapshotStub.callCount, 1);
    });

    it('should release the session if `begin` errors', done => {
      const fakeError = new Error('err');

      beginSnapshotStub.callsFake(callback => callback(fakeError));

      const releaseStub = (sandbox.stub(
        fakePool,
        'release'
      ) as sinon.SinonStub).withArgs(fakeSession);

      database.getSnapshot(err => {
        assert.strictEqual(err, fakeError);
        assert.strictEqual(releaseStub.callCount, 1);
        done();
      });
    });

    it('should retry if `begin` errors with `Session not found`', done => {
      const fakeError = {
        code: grpc.status.NOT_FOUND,
        message: 'Session not found',
      } as MockError;

      const fakeSession2 = new FakeSession();
      const fakeSnapshot2 = new FakeTransaction();
      (sandbox.stub(
        fakeSnapshot2,
        'begin'
      ) as sinon.SinonStub).callsFake(callback => callback(null));
      sandbox.stub(fakeSession2, 'snapshot').returns(fakeSnapshot2);

      getReadSessionStub
        .onFirstCall()
        .callsFake(callback => callback(null, fakeSession))
        .onSecondCall()
        .callsFake(callback => callback(null, fakeSession2));
      beginSnapshotStub.callsFake(callback => callback(fakeError));

      // The first session that was not found should be released back into the
      // pool, so that the pool can remove it from its inventory.
      const releaseStub = sandbox.stub(fakePool, 'release');

      database.getSnapshot((err, snapshot) => {
        assert.ifError(err);
        assert.strictEqual(snapshot, fakeSnapshot2);
        // The first session that error should already have been released back
        // to the pool.
        assert.strictEqual(releaseStub.callCount, 1);
        // Ending the valid snapshot will release its session back into the
        // pool.
        snapshot.emit('end');
        assert.strictEqual(releaseStub.callCount, 2);
        done();
      });
    });

    it('should return the `snapshot`', done => {
      database.getSnapshot((err, snapshot) => {
        assert.ifError(err);
        assert.strictEqual(snapshot, fakeSnapshot);
        done();
      });
    });

    it('should release the snapshot on `end`', done => {
      const releaseStub = (sandbox.stub(
        fakePool,
        'release'
      ) as sinon.SinonStub).withArgs(fakeSession);

      database.getSnapshot(err => {
        assert.ifError(err);
        fakeSnapshot.emit('end');
        assert.strictEqual(releaseStub.callCount, 1);
        done();
      });
    });
  });

  describe('getTransaction', () => {
    let fakePool: FakeSessionPool;
    let fakeSession: FakeSession;
    let fakeTransaction: FakeTransaction;

    let getWriteSessionStub: sinon.SinonStub;

    beforeEach(() => {
      fakePool = database.pool_;
      fakeSession = new FakeSession();
      fakeTransaction = new FakeTransaction();

      getWriteSessionStub = (sandbox.stub(
        fakePool,
        'getWriteSession'
      ) as sinon.SinonStub).callsFake(callback => {
        callback(null, fakeSession, fakeTransaction);
      });
    });

    it('should get a read/write transaction', () => {
      getWriteSessionStub.callsFake(() => {});

      database.getTransaction(assert.ifError);

      assert.strictEqual(getWriteSessionStub.callCount, 1);
    });

    it('should return any pool errors', done => {
      const fakeError = new Error('err');

      getWriteSessionStub.callsFake(callback => callback(fakeError));

      database.getTransaction(err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should return the read/write transaction', done => {
      database.getTransaction((err, transaction) => {
        assert.ifError(err);
        assert.strictEqual(transaction, fakeTransaction);
        done();
      });
    });

    it('should propagate an error', done => {
      const error = new Error('resource');
      (sandbox.stub(fakePool, 'release') as sinon.SinonStub)
        .withArgs(fakeSession)
        .throws(error);

      database.on('error', err => {
        assert.deepStrictEqual(err, error);
        done();
      });

      database.getTransaction((err, transaction) => {
        assert.ifError(err);
        transaction.emit('end');
      });
    });

    it('should release the session on transaction end', done => {
      const releaseStub = (sandbox.stub(
        fakePool,
        'release'
      ) as sinon.SinonStub).withArgs(fakeSession);

      database.getTransaction((err, transaction) => {
        assert.ifError(err);
        transaction.emit('end');
        assert.strictEqual(releaseStub.callCount, 1);
        done();
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

      database.request = config => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'listSessions');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.deepStrictEqual(config.gaxOpts, gaxOpts);
        assert.deepStrictEqual(config.headers, database.resourceHeader_);
        done();
      };

      database.getSessions(options, assert.ifError);
    });

    it('should pass pageSize and pageToken from gaxOptions into reqOpts', done => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const expectedGaxOpts = {timeout: 1000};
      const options = {a: 'a', gaxOptions: gaxOptions};
      const expectedReqOpts = extend(
        {},
        options,
        {
          database: database.formattedName_,
        },
        {pageSize: gaxOptions.pageSize, pageToken: gaxOptions.pageToken}
      );
      delete expectedReqOpts.gaxOptions;

      database.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);

        done();
      };

      database.getSessions(options, assert.ifError);
    });

    it('pageSize and pageToken in options should take precedence over gaxOptions', done => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const expectedGaxOpts = {timeout: 1000};

      const optionsPageSize = 5;
      const optionsPageToken = 'optionsToken';
      const options = Object.assign(
        {},
        {
          pageSize: optionsPageSize,
          pageToken: optionsPageToken,
          gaxOptions,
        }
      );
      const expectedReqOpts = extend(
        {},
        options,
        {
          database: database.formattedName_,
        },
        {pageSize: optionsPageSize, pageToken: optionsPageToken}
      );
      delete expectedReqOpts.gaxOptions;

      database.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);

        done();
      };

      database.getSessions(options, assert.ifError);
    });

    it('should not require options', done => {
      database.request = config => {
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });
        assert.deepStrictEqual(config.gaxOpts, {});
        done();
      };
      database.getSessions(assert.ifError);
    });

    it('should return all arguments on error', done => {
      const ARGS = [new Error('err'), null, {}];
      database.request = (config, callback) => {
        callback(...ARGS);
      };
      database.getSessions((...args) => {
        assert.deepStrictEqual(args, ARGS);
        done();
      });
    });

    it('should create and return Session objects', done => {
      const ERR = null;
      const SESSIONS = [{name: 'abc'}];
      const NEXTPAGEREQUEST = null;
      const FULLAPIRESPONSE = {};
      const SESSION_INSTANCE = {};
      const RESPONSE = [ERR, SESSIONS, NEXTPAGEREQUEST, FULLAPIRESPONSE];

      database.request = (config, callback) => {
        callback(...RESPONSE);
      };

      database.session = name => {
        assert.strictEqual(name, SESSIONS[0].name);
        return SESSION_INSTANCE;
      };

      database.getSessions((err, sessions, nextQuery, resp) => {
        assert.ifError(err);
        assert.strictEqual(sessions[0], SESSION_INSTANCE);
        assert.strictEqual(resp, FULLAPIRESPONSE);
        done();
      });
    });

    it('should return a complete nexQuery object', done => {
      const pageSize = 1;
      const filter = 'filter';
      const NEXTPAGEREQUEST = {
        database: database.formattedName_,
        pageSize,
        filter,
        pageToken: 'pageToken',
      };
      const RESPONSE = [null, [], NEXTPAGEREQUEST, {}];

      const GETSESSIONOPTIONS = {
        pageSize,
        filter,
        gaxOptions: {timeout: 1000, autoPaginate: false},
      };
      const EXPECTEDNEXTQUERY = extend({}, GETSESSIONOPTIONS, NEXTPAGEREQUEST);
      database.request = (config, callback) => {
        callback(...RESPONSE);
      };
      function callback(err, sessions, nextQuery) {
        assert.deepStrictEqual(nextQuery, EXPECTEDNEXTQUERY);
        done();
      }
      database.getSessions(GETSESSIONOPTIONS, callback);
    });
  });

  describe('getSessionsStream', () => {
    const OPTIONS = {
      gaxOptions: {autoPaginate: false},
    } as db.GetSessionsOptions;
    const returnValue = {} as Duplex;

    it('should make and return the correct gax API call', () => {
      const expectedReqOpts = extend({}, OPTIONS, {
        database: database.formattedName_,
      });
      delete expectedReqOpts.gaxOptions;

      database.requestStream = config => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'listSessionsStream');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        assert.notStrictEqual(config.reqOpts, OPTIONS);

        assert.deepStrictEqual(config.gaxOpts, OPTIONS.gaxOptions);
        assert.deepStrictEqual(config.headers, database.resourceHeader_);
        return returnValue;
      };

      const returnedValue = database.getSessionsStream(OPTIONS);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should pass pageSize and pageToken from gaxOptions into reqOpts', () => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const expectedGaxOpts = {timeout: 1000};
      const options = {gaxOptions};
      const expectedReqOpts = extend(
        {},
        {
          database: database.formattedName_,
        },
        {pageSize: gaxOptions.pageSize, pageToken: gaxOptions.pageToken}
      );

      database.requestStream = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);

        return returnValue;
      };

      const returnedValue = database.getSessionsStream(options);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('pageSize and pageToken in options should take precedence over gaxOptions', () => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const expectedGaxOpts = {timeout: 1000};

      const optionsPageSize = 5;
      const optionsPageToken = 'optionsToken';
      const options = {
        pageSize: optionsPageSize,
        pageToken: optionsPageToken,
        gaxOptions,
      };
      const expectedReqOpts = extend(
        {},
        {
          database: database.formattedName_,
        },
        {pageSize: optionsPageSize, pageToken: optionsPageToken}
      );

      database.requestStream = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);

        return returnValue;
      };

      const returnedValue = database.getSessionsStream(options);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should not require options', () => {
      database.requestStream = config => {
        assert.deepStrictEqual(config.reqOpts, {
          database: database.formattedName_,
        });

        assert.deepStrictEqual(config.gaxOpts, {});

        return returnValue;
      };

      const returnedValue = database.getSessionsStream();
      assert.strictEqual(returnedValue, returnValue);
    });
  });

  describe('runPartitionedUpdate', () => {
    const QUERY = {
      sql: 'INSERT INTO `MyTable` (Key, Thing) VALUES(@key, @thing)',
      params: {
        key: 'k999',
        thing: 'abc',
      },
    };

    let fakePool: FakeSessionPool;
    let fakeSession: FakeSession;
    let fakePartitionedDml: FakeTransaction;

    let getReadSessionStub;
    let beginStub;
    let runUpdateStub;

    beforeEach(() => {
      fakePool = database.pool_;
      fakeSession = new FakeSession();
      fakePartitionedDml = new FakeTransaction();

      getReadSessionStub = (sandbox.stub(
        fakePool,
        'getReadSession'
      ) as sinon.SinonStub).callsFake(callback => {
        callback(null, fakeSession);
      });

      sandbox.stub(fakeSession, 'partitionedDml').returns(fakePartitionedDml);

      beginStub = (sandbox.stub(
        fakePartitionedDml,
        'begin'
      ) as sinon.SinonStub).callsFake(callback => callback(null));

      runUpdateStub = (sandbox.stub(
        fakePartitionedDml,
        'runUpdate'
      ) as sinon.SinonStub).callsFake((_, callback) => callback(null));
    });

    it('should get a read only session from the pool', () => {
      getReadSessionStub.callsFake(() => {});

      database.runPartitionedUpdate(QUERY, assert.ifError);

      assert.strictEqual(getReadSessionStub.callCount, 1);
    });

    it('should return any pool errors', () => {
      const fakeError = new Error('err');
      const fakeCallback = sandbox.spy();

      getReadSessionStub.callsFake(callback => callback(fakeError));
      database.runPartitionedUpdate(QUERY, fakeCallback);

      const [err, rowCount] = fakeCallback.lastCall.args;

      assert.strictEqual(err, fakeError);
      assert.strictEqual(rowCount, 0);
    });

    it('should call transaction begin', () => {
      beginStub.callsFake(() => {});
      database.runPartitionedUpdate(QUERY, assert.ifError);

      assert.strictEqual(beginStub.callCount, 1);
    });

    it('should return any begin errors', done => {
      const fakeError = new Error('err');

      beginStub.callsFake(callback => callback(fakeError));

      const releaseStub = (sandbox.stub(
        fakePool,
        'release'
      ) as sinon.SinonStub).withArgs(fakeSession);

      database.runPartitionedUpdate(QUERY, (err, rowCount) => {
        assert.strictEqual(err, fakeError);
        assert.strictEqual(rowCount, 0);
        assert.strictEqual(releaseStub.callCount, 1);
        done();
      });
    });

    it('call `runUpdate` on the transaction', () => {
      const fakeCallback = sandbox.spy();

      database.runPartitionedUpdate(QUERY, fakeCallback);

      const [query] = runUpdateStub.lastCall.args;

      assert.strictEqual(query, QUERY);
      assert.ok(fakeCallback.calledOnce);
    });

    it('should release the session on transaction end', () => {
      const releaseStub = (sandbox.stub(
        fakePool,
        'release'
      ) as sinon.SinonStub).withArgs(fakeSession);

      database.runPartitionedUpdate(QUERY, assert.ifError);
      fakePartitionedDml.emit('end');

      assert.strictEqual(releaseStub.callCount, 1);
    });

    it('should accept requestOptions', () => {
      const fakeCallback = sandbox.spy();

      database.runPartitionedUpdate(
        {
          sql: QUERY.sql,
          params: QUERY.params,
          requestOptions: {priority: RequestOptions.Priority.PRIORITY_LOW},
        },
        fakeCallback
      );

      const [query] = runUpdateStub.lastCall.args;

      assert.deepStrictEqual(query, {
        sql: QUERY.sql,
        params: QUERY.params,
        requestOptions: {priority: RequestOptions.Priority.PRIORITY_LOW},
      });
      assert.ok(fakeCallback.calledOnce);
    });
  });

  describe('runTransaction', () => {
    const SESSION = new FakeSession();
    const TRANSACTION = new FakeTransaction();

    let pool: FakeSessionPool;

    beforeEach(() => {
      pool = database.pool_;

      (sandbox.stub(pool, 'getWriteSession') as sinon.SinonStub).callsFake(
        callback => {
          callback(null, SESSION, TRANSACTION);
        }
      );
    });

    it('should return any errors getting a session', done => {
      const fakeErr = new Error('err');

      (pool.getWriteSession as sinon.SinonStub).callsFake(callback =>
        callback(fakeErr)
      );

      database.runTransaction(err => {
        assert.strictEqual(err, fakeErr);
        done();
      });
    });

    it('should create a `TransactionRunner`', () => {
      const fakeRunFn = sandbox.spy();

      database.runTransaction(fakeRunFn);

      const [
        session,
        transaction,
        runFn,
        options,
      ] = fakeTransactionRunner.calledWith_;

      assert.strictEqual(session, SESSION);
      assert.strictEqual(transaction, TRANSACTION);
      assert.strictEqual(runFn, fakeRunFn);
      assert.deepStrictEqual(options, {});
    });

    it('should optionally accept runner `options`', () => {
      const fakeOptions = {timeout: 1};

      database.runTransaction(fakeOptions, assert.ifError);

      const options = fakeTransactionRunner.calledWith_[3];

      assert.strictEqual(options, fakeOptions);
    });

    it('should release the session when finished', done => {
      const releaseStub = (sandbox.stub(
        pool,
        'release'
      ) as sinon.SinonStub).withArgs(SESSION);

      sandbox.stub(FakeTransactionRunner.prototype, 'run').resolves();

      database.runTransaction(assert.ifError);

      setImmediate(() => {
        assert.strictEqual(releaseStub.callCount, 1);
        done();
      });
    });

    it('should catch any run errors and return them', done => {
      const releaseStub = (sandbox.stub(
        pool,
        'release'
      ) as sinon.SinonStub).withArgs(SESSION);
      const fakeError = new Error('err');

      sandbox.stub(FakeTransactionRunner.prototype, 'run').rejects(fakeError);

      database.runTransaction(err => {
        assert.strictEqual(err, fakeError);
        assert.strictEqual(releaseStub.callCount, 1);
        done();
      });
    });
  });

  describe('runTransactionAsync', () => {
    const SESSION = new FakeSession();
    const TRANSACTION = new FakeTransaction();

    let pool: FakeSessionPool;

    beforeEach(() => {
      pool = database.pool_;

      (sandbox.stub(pool, 'getWriteSession') as sinon.SinonStub).callsFake(
        callback => {
          callback(null, SESSION, TRANSACTION);
        }
      );
    });

    it('should create an `AsyncTransactionRunner`', async () => {
      const fakeRunFn = sandbox.spy();

      await database.runTransactionAsync(fakeRunFn);

      const [
        session,
        transaction,
        runFn,
        options,
      ] = fakeAsyncTransactionRunner.calledWith_;
      assert.strictEqual(session, SESSION);
      assert.strictEqual(transaction, TRANSACTION);
      assert.strictEqual(runFn, fakeRunFn);
      assert.deepStrictEqual(options, {});
    });

    it('should optionally accept runner `options`', async () => {
      const fakeOptions = {timeout: 1};

      await database.runTransactionAsync(fakeOptions, assert.ifError);

      const options = fakeAsyncTransactionRunner.calledWith_[3];
      assert.strictEqual(options, fakeOptions);
    });

    it('should return the runners resolved value', async () => {
      const fakeValue = {};

      sandbox
        .stub(FakeAsyncTransactionRunner.prototype, 'run')
        .resolves(fakeValue);

      const value = await database.runTransactionAsync(assert.ifError);
      assert.strictEqual(value, fakeValue);
    });

    it('should release the session when finished', async () => {
      const releaseStub = (sandbox.stub(
        pool,
        'release'
      ) as sinon.SinonStub).withArgs(SESSION);

      sandbox.stub(FakeAsyncTransactionRunner.prototype, 'run').resolves();

      await database.runTransactionAsync(assert.ifError);
      assert.strictEqual(releaseStub.callCount, 1);
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

  describe('getState', () => {
    it('should get state from database metadata', async () => {
      database.getMetadata = async () => [{state: 'READY'}];
      const result = await database.getState();
      assert.strictEqual(result, 'READY');
    });

    it('should accept and pass gaxOptions to getMetadata', async () => {
      const options = {};
      database.getMetadata = async gaxOptions => {
        assert.strictEqual(gaxOptions, options);
        return [{}];
      };
      await database.getState(options);
    });

    it('should accept callback and return state', done => {
      const state = 'READY';
      database.getMetadata = async () => [{state}];
      database.getState((err, result) => {
        assert.ifError(err);
        assert.strictEqual(result, state);
        done();
      });
    });
  });

  describe('getRestoreInfo', () => {
    it('should get restore info from database metadata', async () => {
      const restoreInfo = {sourceType: 'BACKUP'};
      database.getMetadata = async () => [{restoreInfo}];
      const result = await database.getRestoreInfo();
      assert.deepStrictEqual(result, restoreInfo);
    });

    it('should accept and pass gaxOptions to getMetadata', async () => {
      const options = {};
      database.getMetadata = async gaxOptions => {
        assert.strictEqual(gaxOptions, options);
        return [{}];
      };
      await database.getRestoreInfo(options);
    });

    it('should accept callback and return info', done => {
      const restoreInfo = {sourceType: 'BACKUP'};
      database.getMetadata = async () => [{restoreInfo}];
      database.getRestoreInfo((err, result) => {
        assert.ifError(err);
        assert.strictEqual(result, restoreInfo);
        done();
      });
    });
  });

  describe('getOperations', () => {
    it('should create filter for querying the database', async () => {
      const operations: IOperation[] = [{name: 'my-operation'}];

      database.instance.getDatabaseOperations = async options => {
        assert.strictEqual(options.filter, `name:${DATABASE_FORMATTED_NAME}`);
        return [operations, {}];
      };

      const [results] = await database.getOperations();
      assert.deepStrictEqual(results, operations);
    });

    it('should create filter for querying the database in combination with user supplied filter', async () => {
      const operations: IOperation[] = [{name: 'my-operation'}];

      database.instance.getDatabaseOperations = async options => {
        assert.strictEqual(
          options.filter,
          `(name:${DATABASE_FORMATTED_NAME}) AND (someOtherAttribute: aValue)`
        );
        return [operations, {}];
      };

      const [results] = await database.getOperations({
        filter: 'someOtherAttribute: aValue',
      });
      assert.deepStrictEqual(results, operations);
    });

    it('should accept options with given gaxOptions', async () => {
      const operations: IOperation[] = [{name: 'my-operation'}];
      const gaxOpts = {
        timeout: 1000,
      };

      database.instance.getDatabaseOperations = async options => {
        assert.strictEqual(options.gaxOptions, gaxOpts);
        return [operations, {}];
      };

      const [results] = await database.getOperations({
        filter: 'someOtherAttribute: aValue',
        gaxOptions: gaxOpts,
      });
      assert.deepStrictEqual(results, operations);
    });

    it('should accept callback', done => {
      const operations: IOperation[] = [{name: 'my-operation'}];

      database.instance.getDatabaseOperations = async () => [operations, {}];

      database.getOperations((err, results) => {
        assert.ifError(err);
        assert.deepStrictEqual(results, operations);
        done();
      });
    });
  });

  describe('restore', () => {
    const BACKUP_NAME = 'backup-name';
    const BACKUP_FORMATTED_NAME =
      INSTANCE.formattedName_ + '/backups/' + BACKUP_NAME;

    it('should make the correct request', done => {
      const QUERY = {};
      const ORIGINAL_QUERY = extend({}, QUERY);
      const expectedReqOpts = extend({}, QUERY, {
        databaseId: NAME,
        parent: INSTANCE.formattedName_,
        backup: BACKUP_FORMATTED_NAME,
      });

      database.id = NAME;
      database.request = config => {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'restoreDatabase');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        assert.notStrictEqual(config.reqOpts, QUERY);
        assert.deepStrictEqual(QUERY, ORIGINAL_QUERY);
        assert.deepStrictEqual(config.gaxOpts, {});
        assert.deepStrictEqual(config.headers, database.resourceHeader_);
        done();
      };

      database.restore(BACKUP_FORMATTED_NAME, assert.ifError);
    });

    it('should accept a backup name', done => {
      const QUERY = {};
      const expectedReqOpts = extend({}, QUERY, {
        databaseId: NAME,
        parent: INSTANCE.formattedName_,
        backup: BACKUP_FORMATTED_NAME,
      });

      database.id = NAME;
      database.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        done();
      };

      database.restore(BACKUP_NAME, assert.ifError);
    });

    it('should accept restore options', done => {
      const encryptionConfig = {
        encryptionType: EncryptionType.CUSTOMER_MANAGED_ENCRYPTION,
        kmsKeyName: 'some/key/path',
      };
      const options = {encryptionConfig};

      database.request = config => {
        assert.deepStrictEqual(
          config.reqOpts.encryptionConfig,
          encryptionConfig
        );
        done();
      };

      database.restore(BACKUP_NAME, options, assert.ifError);
    });

    it('should accept gaxOpts as CallOptions', done => {
      const gaxOptions = {timeout: 1000};

      database.request = config => {
        assert.deepStrictEqual(config.gaxOpts, gaxOptions);
        done();
      };

      database.restore(BACKUP_NAME, gaxOptions, assert.ifError);
    });

    it('should accept restore and gax options', done => {
      const encryptionConfig = {
        encryptionType: EncryptionType.CUSTOMER_MANAGED_ENCRYPTION,
        kmsKeyName: 'some/key/path',
      };
      const gaxOptions = {timeout: 1000};
      const options = {gaxOptions, encryptionConfig};

      database.request = config => {
        assert.deepStrictEqual(
          config.reqOpts.encryptionConfig,
          encryptionConfig
        );
        assert.deepStrictEqual(config.gaxOpts, options.gaxOptions);
        done();
      };

      database.restore(BACKUP_NAME, options, assert.ifError);
    });

    describe('error', () => {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(() => {
        database.request = (config, callback: Function) => {
          callback(ERROR, null, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', done => {
        database.restore(BACKUP_FORMATTED_NAME, (err, db, op, resp) => {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(db, null);
          assert.strictEqual(op, null);
          assert.strictEqual(resp, API_RESPONSE);
          done();
        });
      });
    });

    describe('success', () => {
      const OPERATION = {};
      const API_RESPONSE = {};

      beforeEach(() => {
        database.request = (config, callback: Function) => {
          callback(null, OPERATION, API_RESPONSE);
        };
      });

      it('should execute callback with a Database and Operation', done => {
        database.restore(BACKUP_FORMATTED_NAME, (err, db, op, resp) => {
          assert.ifError(err);
          assert.strictEqual(db, database);
          assert.strictEqual(op, OPERATION);
          assert.strictEqual(resp, API_RESPONSE);
          done();
        });
      });
    });
  });
});
