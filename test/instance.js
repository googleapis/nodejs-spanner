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
const util = require('@google-cloud/common-grpc').util;

const fakePaginator = {
  streamify: function(methodName) {
    return methodName;
  },
};

let promisified = false;
const fakeUtil = extend({}, util, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'Instance') {
      return;
    }

    promisified = true;
    assert.deepStrictEqual(options.exclude, ['database']);
  },
});

function FakeDatabase() {
  this.calledWith_ = arguments;
}

function FakeGrpcServiceObject() {
  this.calledWith_ = arguments;
}

describe('Instance', function() {
  let Instance;
  let instance;

  const SPANNER = {
    request: util.noop,
    requestStream: util.noop,
    projectId: 'project-id',
    instances_: new Map(),
  };

  const NAME = 'instance-name';

  before(function() {
    Instance = proxyquire('../src/instance.js', {
      '@google-cloud/common-grpc': {
        paginator: fakePaginator,
        util: fakeUtil,
        ServiceObject: FakeGrpcServiceObject,
      },
      './database.js': FakeDatabase,
    });
  });

  beforeEach(function() {
    instance = new Instance(SPANNER, NAME);
  });

  describe('instantiation', function() {
    it('should localize an database map', function() {
      assert(instance.databases_ instanceof Map);
    });

    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should format the name', function() {
      const formatName_ = Instance.formatName_;
      const formattedName = 'formatted-name';

      Instance.formatName_ = function(projectId, name) {
        Instance.formatName_ = formatName_;

        assert.strictEqual(projectId, SPANNER.projectId);
        assert.strictEqual(name, NAME);

        return formattedName;
      };

      const instance = new Instance(SPANNER, NAME);
      assert(instance.formattedName_, formattedName);
    });

    it('should localize the request function', function(done) {
      const spannerInstance = extend({}, SPANNER);

      spannerInstance.request = function() {
        assert.strictEqual(this, spannerInstance);
        done();
      };

      const instance = new Instance(spannerInstance, NAME);
      instance.request();
    });

    it('should localize the requestStream function', function(done) {
      const spannerInstance = extend({}, SPANNER);

      spannerInstance.requestStream = function() {
        assert.strictEqual(this, spannerInstance);
        done();
      };

      const instance = new Instance(spannerInstance, NAME);
      instance.requestStream();
    });

    it('should inherit from ServiceObject', function(done) {
      let instance;
      const options = {};

      const spannerInstance = extend({}, SPANNER, {
        createInstance: function(name, options_, callback) {
          assert.strictEqual(name, instance.formattedName_);
          assert.strictEqual(options_, options);
          callback(); // done()
        },
      });

      instance = new Instance(spannerInstance, NAME);
      assert(instance instanceof FakeGrpcServiceObject);

      const calledWith = instance.calledWith_[0];

      assert.strictEqual(calledWith.parent, spannerInstance);
      assert.strictEqual(calledWith.id, NAME);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
      });

      calledWith.createMethod(null, options, done);
    });
  });

  describe('formatName_', function() {
    const PATH = 'projects/' + SPANNER.projectId + '/instances/' + NAME;

    it('should return the name if already formatted', function() {
      assert.strictEqual(Instance.formatName_(SPANNER.projectId, PATH), PATH);
    });

    it('should format the name', function() {
      const formattedName = Instance.formatName_(SPANNER.projectId, NAME);
      assert.strictEqual(formattedName, PATH);
    });
  });

  describe('createDatabase', function() {
    const NAME = 'database-name';
    const PATH = 'projects/project-id/databases/' + NAME;

    const OPTIONS = {
      a: 'b',
    };
    const ORIGINAL_OPTIONS = extend({}, OPTIONS);

    it('should throw if a name is not provided', function() {
      assert.throws(function() {
        instance.createDatabase();
      }, /A name is required to create a database\./);
    });

    it('should make the correct default request', function(done) {
      instance.request = function(config) {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'createDatabase');
        assert.deepStrictEqual(config.reqOpts, {
          parent: instance.formattedName_,
          createStatement: 'CREATE DATABASE `' + NAME + '`',
        });

        done();
      };

      instance.createDatabase(NAME, assert.ifError);
    });

    it('should accept options', function(done) {
      instance.request = function(config) {
        assert.deepStrictEqual(OPTIONS, ORIGINAL_OPTIONS);

        const expectedReqOpts = extend(
          {
            parent: instance.formattedName_,
            createStatement: 'CREATE DATABASE `' + NAME + '`',
          },
          OPTIONS
        );

        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        done();
      };

      instance.createDatabase(NAME, OPTIONS, assert.ifError);
    });

    it('should only use the name in the createStatement', function(done) {
      instance.request = function(config) {
        const expectedReqOpts = extend(
          {
            parent: instance.formattedName_,
            createStatement: 'CREATE DATABASE `' + NAME + '`',
          },
          OPTIONS
        );

        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        done();
      };

      instance.createDatabase(PATH, OPTIONS, assert.ifError);
    });

    describe('options.poolOptions', function() {
      it('should allow specifying session pool options', function(done) {
        const poolOptions = {};

        const options = extend({}, OPTIONS, {
          poolOptions: poolOptions,
        });

        instance.request = function(config, callback) {
          assert.strictEqual(config.reqOpts.poolOptions, undefined);
          callback();
        };

        instance.database = function(name, poolOptions_) {
          assert.strictEqual(poolOptions_, poolOptions);
          done();
        };

        instance.createDatabase(PATH, options, assert.ifError);
      });
    });

    describe('options.schema', function() {
      it('should arrify and rename to extraStatements', function(done) {
        const SCHEMA = 'schema';

        const options = extend({}, OPTIONS, {
          schema: SCHEMA,
        });

        instance.request = function(config) {
          assert.deepStrictEqual(config.reqOpts.extraStatements, [SCHEMA]);
          assert.strictEqual(config.reqOpts.schema, undefined);
          done();
        };

        instance.createDatabase(NAME, options, assert.ifError);
      });
    });

    describe('error', function() {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(function() {
        instance.request = function(config, callback) {
          callback(ERROR, null, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', function(done) {
        instance.createDatabase(NAME, OPTIONS, function(err, db, op, resp) {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(op, null);
          assert.strictEqual(resp, API_RESPONSE);
          done();
        });
      });
    });

    describe('success', function() {
      const OPERATION = {};
      const API_RESPONSE = {};

      beforeEach(function() {
        instance.request = function(config, callback) {
          callback(null, OPERATION, API_RESPONSE);
        };
      });

      it('should exec callback with a Database and Operation', function(done) {
        const fakeDatabaseInstance = {};

        instance.database = function(name) {
          assert.strictEqual(name, NAME);
          return fakeDatabaseInstance;
        };

        instance.createDatabase(NAME, OPTIONS, function(err, db, op, resp) {
          assert.ifError(err);
          assert.strictEqual(db, fakeDatabaseInstance);
          assert.strictEqual(op, OPERATION);
          assert.strictEqual(resp, API_RESPONSE);
          done();
        });
      });
    });
  });

  describe('database', function() {
    const NAME = 'database-name';

    it('should throw if a name is not provided', function() {
      assert.throws(function() {
        instance.database();
      }, /A name is required to access a Database object\./);
    });

    it('should create and cache a Database', function() {
      const cache = instance.databases_;
      const poolOptions = {};

      assert.strictEqual(cache.has(NAME), false);

      const database = instance.database(NAME, poolOptions);

      assert(database instanceof FakeDatabase);
      assert.strictEqual(database.calledWith_[0], instance);
      assert.strictEqual(database.calledWith_[1], NAME);
      assert.strictEqual(database.calledWith_[2], poolOptions);
      assert.strictEqual(database, cache.get(NAME));
    });

    it('should re-use cached objects', function() {
      const cache = instance.databases_;
      const fakeDatabase = {};

      cache.set(NAME, fakeDatabase);

      const database = instance.database(NAME);

      assert.strictEqual(database, fakeDatabase);
    });
  });

  describe('delete', function() {
    beforeEach(function() {
      instance.parent = SPANNER;
    });

    it('should close all cached databases', function(done) {
      let closed = false;

      instance.databases_.set('key', {
        close: function() {
          closed = true;
          return Promise.resolve();
        },
      });

      instance.request = function() {
        assert.strictEqual(closed, true);
        assert.strictEqual(instance.databases_.size, 0);
        done();
      };

      instance.delete(assert.ifError);
    });

    it('should ignore closing errors', function(done) {
      instance.databases_.set('key', {
        close: function() {
          return Promise.reject(new Error('err'));
        },
      });

      instance.request = function() {
        done();
      };

      instance.delete(assert.ifError);
    });

    it('should make the correct request', function(done) {
      instance.request = function(config, callback) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'deleteInstance');
        assert.deepStrictEqual(config.reqOpts, {
          name: instance.formattedName_,
        });
        callback(); // done()
      };

      instance.delete(done);
    });

    it('should remove the Instance from the cache', function(done) {
      const cache = instance.parent.instances_;

      instance.request = function(config, callback) {
        callback(null);
      };

      cache.set(instance.id, instance);
      assert.strictEqual(cache.get(instance.id), instance);

      instance.delete(function(err) {
        assert.ifError(err);
        assert.strictEqual(cache.has(instance.id), false);
        done();
      });
    });
  });

  describe('get', function() {
    it('should call getMetadata', function(done) {
      const options = {};

      instance.getMetadata = function() {
        done();
      };

      instance.get(options, assert.ifError);
    });

    it('should not require an options object', function(done) {
      instance.getMetadata = function() {
        done();
      };

      instance.get(assert.ifError);
    });

    describe('autoCreate', function() {
      const error = new Error('Error.');
      error.code = 5;

      const OPTIONS = {
        autoCreate: true,
      };

      const OPERATION = {
        listeners: {},
        on: function(eventName, callback) {
          OPERATION.listeners[eventName] = callback;
          return OPERATION;
        },
      };

      beforeEach(function() {
        OPERATION.listeners = {};

        instance.getMetadata = function(callback) {
          callback(error);
        };

        instance.create = function(options, callback) {
          callback(null, null, OPERATION);
        };
      });

      it('should call create', function(done) {
        instance.create = function(options) {
          assert.strictEqual(options, OPTIONS);
          done();
        };

        instance.get(OPTIONS, assert.ifError);
      });

      it('should return error if create failed', function(done) {
        const error = new Error('Error.');

        instance.create = function(options, callback) {
          callback(error);
        };

        instance.get(OPTIONS, function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should return operation error', function(done) {
        const error = new Error('Error.');

        setImmediate(function() {
          OPERATION.listeners['error'](error);
        });

        instance.get(OPTIONS, function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should execute callback if opereation succeeded', function(done) {
        const metadata = {};

        setImmediate(function() {
          OPERATION.listeners['complete'](metadata);
        });

        instance.get(OPTIONS, function(err, instance_, apiResponse) {
          assert.ifError(err);
          assert.strictEqual(instance_, instance);
          assert.strictEqual(instance.metadata, metadata);
          assert.strictEqual(metadata, apiResponse);
          done();
        });
      });
    });

    it('should not auto create without error code 5', function(done) {
      const error = new Error('Error.');
      error.code = 'NOT-5';

      const options = {
        autoCreate: true,
      };

      instance.getMetadata = function(callback) {
        callback(error);
      };

      instance.create = function() {
        throw new Error('Should not create.');
      };

      instance.get(options, function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should not auto create unless requested', function(done) {
      const error = new Error('Error.');
      error.code = 5;

      instance.getMetadata = function(callback) {
        callback(error);
      };

      instance.create = function() {
        throw new Error('Should not create.');
      };

      instance.get(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return an error from getMetadata', function(done) {
      const error = new Error('Error.');

      instance.getMetadata = function(callback) {
        callback(error);
      };

      instance.get(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should return self and API response', function(done) {
      const apiResponse = {};

      instance.getMetadata = function(callback) {
        callback(null, apiResponse);
      };

      instance.get(function(err, instance_, apiResponse_) {
        assert.ifError(err);
        assert.strictEqual(instance_, instance);
        assert.strictEqual(apiResponse_, apiResponse);
        done();
      });
    });
  });

  describe('getDatabases', function() {
    const QUERY = {
      a: 'b',
    };
    const ORIGINAL_QUERY = extend({}, QUERY);

    it('should make the correct request', function(done) {
      const expectedReqOpts = extend({}, QUERY, {
        parent: instance.formattedName_,
      });

      instance.request = function(config) {
        assert.strictEqual(config.client, 'DatabaseAdminClient');
        assert.strictEqual(config.method, 'listDatabases');
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);

        assert.notStrictEqual(config.reqOpts, QUERY);
        assert.deepStrictEqual(QUERY, ORIGINAL_QUERY);

        assert.strictEqual(config.gaxOpts, QUERY);

        done();
      };

      instance.getDatabases(QUERY, assert.ifError);
    });

    it('should not require a query', function(done) {
      instance.request = function(config) {
        assert.deepStrictEqual(config.reqOpts, {
          parent: instance.formattedName_,
        });

        assert.deepStrictEqual(config.gaxOpts, {});

        done();
      };

      instance.getDatabases(assert.ifError);
    });

    describe('error', function() {
      const REQUEST_RESPONSE_ARGS = [new Error('Error.'), null, {}];

      beforeEach(function() {
        instance.request = function(config, callback) {
          callback.apply(null, REQUEST_RESPONSE_ARGS);
        };
      });

      it('should execute callback with original arguments', function(done) {
        instance.getDatabases(QUERY, function() {
          assert.deepStrictEqual(
            [].slice.call(arguments),
            REQUEST_RESPONSE_ARGS
          );
          done();
        });
      });
    });

    describe('success', function() {
      const DATABASES = [
        {
          name: 'database-name',
        },
      ];

      const REQUEST_RESPONSE_ARGS = [null, DATABASES, {}];

      beforeEach(function() {
        instance.request = function(config, callback) {
          callback.apply(null, REQUEST_RESPONSE_ARGS);
        };
      });

      it('should create and return Database objects', function(done) {
        const fakeDatabaseInstance = {};

        instance.database = function(name) {
          assert.strictEqual(name, DATABASES[0].name);
          return fakeDatabaseInstance;
        };

        instance.getDatabases(QUERY, function(err) {
          assert.ifError(err);

          assert.strictEqual(arguments[0], REQUEST_RESPONSE_ARGS[0]);

          const database = arguments[1].pop();
          assert.strictEqual(database, fakeDatabaseInstance);
          assert.strictEqual(database.metadata, REQUEST_RESPONSE_ARGS[1][0]);

          assert.strictEqual(arguments[2], REQUEST_RESPONSE_ARGS[2]);

          done();
        });
      });
    });
  });

  describe('getMetadata', function() {
    it('should correctly call and return request', function() {
      const requestReturnValue = {};

      function callback() {}

      instance.request = function(config, callback_) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'getInstance');
        assert.deepStrictEqual(config.reqOpts, {
          name: instance.formattedName_,
        });
        assert.strictEqual(callback_, callback);
        return requestReturnValue;
      };

      const returnValue = instance.getMetadata(callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('setMetadata', function() {
    const METADATA = {
      needsToBeSnakeCased: true,
    };
    const ORIGINAL_METADATA = extend({}, METADATA);

    it('should make and return the request', function() {
      const requestReturnValue = {};

      function callback() {}

      instance.request = function(config, callback_) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'updateInstance');

        const expectedReqOpts = extend({}, METADATA, {
          name: instance.formattedName_,
        });

        assert.deepStrictEqual(config.reqOpts.instance, expectedReqOpts);
        assert.deepStrictEqual(config.reqOpts.fieldMask, {
          paths: ['needs_to_be_snake_cased'],
        });

        assert.deepStrictEqual(METADATA, ORIGINAL_METADATA);

        assert.strictEqual(callback_, callback);

        return requestReturnValue;
      };

      const returnValue = instance.setMetadata(METADATA, callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });

    it('should not require a callback', function() {
      assert.doesNotThrow(function() {
        instance.setMetadata(METADATA);
      });
    });
  });
});
