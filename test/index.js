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
const path = require('path');
const proxyquire = require('proxyquire');
const through = require('through2');
const {util} = require('@google-cloud/common-grpc');
const {replaceProjectIdToken} = require('@google-cloud/projectify');
const pfy = require('@google-cloud/promisify');

let replaceProjectIdTokenOverride;
function fakeReplaceProjectIdToken() {
  return (replaceProjectIdTokenOverride || replaceProjectIdToken).apply(
    null,
    arguments
  );
}

const fakePaginator = {
  paginator: {
    streamify: function(methodName) {
      return methodName;
    },
  },
};

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'Spanner') {
      return;
    }
    promisified = true;
    assert.deepStrictEqual(options.exclude, [
      'date',
      'float',
      'getInstanceConfigs',
      'instance',
      'int',
      'operation',
    ]);
  },
});

let fakeGapicClient = util.noop;
fakeGapicClient.scopes = [];

const fakeV1 = {
  DatabaseAdminClient: fakeGapicClient,
  InstanceAdminClient: fakeGapicClient,
  SpannerClient: fakeGapicClient,
};

function fakeGoogleAuth() {
  return {
    calledWith_: arguments,
  };
}

const fakeCodec = {
  SpannerDate: util.noop,
};

function FakeGrpcOperation() {
  this.calledWith_ = arguments;
}

function FakeGrpcService() {
  this.calledWith_ = arguments;
}

function FakeInstance() {
  this.calledWith_ = arguments;
}

describe('Spanner', function() {
  let Spanner;
  let spanner;

  const OPTIONS = {
    projectId: 'project-id',
  };

  before(function() {
    Spanner = proxyquire('../src/index.js', {
      '@google-cloud/common-grpc': {
        Operation: FakeGrpcOperation,
        Service: FakeGrpcService,
      },
      '@google-cloud/paginator': fakePaginator,
      '@google-cloud/promisify': fakePfy,
      '@google-cloud/projectify': {
        replaceProjectIdToken: fakeReplaceProjectIdToken,
      },
      'google-auth-library': {
        GoogleAuth: fakeGoogleAuth,
      },
      './codec.js': fakeCodec,
      './instance.js': FakeInstance,
      './v1': fakeV1,
    });
  });

  beforeEach(function() {
    fakeGapicClient = util.noop;
    fakeGapicClient.scopes = [];
    fakeV1.DatabaseAdminClient = fakeGapicClient;
    fakeV1.InstanceAdminClient = fakeGapicClient;
    fakeV1.SpannerClient = fakeGapicClient;
    fakeCodec.SpannerDate = util.noop;
    fakeCodec.Int = util.noop;
    spanner = new Spanner(OPTIONS);
    spanner.projectId = OPTIONS.projectId;
    replaceProjectIdTokenOverride = null;
  });

  describe('instantiation', function() {
    it('should localize a cached gapic client map', function() {
      assert(spanner.clients_ instanceof Map);
      assert.strictEqual(spanner.clients_.size, 0);
    });

    it('should localize an instance map', function() {
      assert(spanner.instances_ instanceof Map);
      assert.strictEqual(spanner.instances_.size, 0);
    });

    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should streamify the correct methods', function() {
      assert.strictEqual(spanner.getInstancesStream, 'getInstances');
    });

    it('should work without new', function() {
      assert.doesNotThrow(function() {
        Spanner(OPTIONS);
      });
    });

    it('should create an auth instance from google-auth-library', function() {
      const expectedOptions = extend({}, OPTIONS, {
        libName: 'gccl',
        libVersion: require('../package.json').version,
        scopes: [],
      });

      assert.deepStrictEqual(spanner.auth.calledWith_[0], expectedOptions);
    });

    it('should combine and uniquify all gapic client scopes', function() {
      const expectedScopes = ['a', 'b', 'c'];
      fakeV1.DatabaseAdminClient.scopes = ['a', 'c'];
      fakeV1.InstanceAdminClient.scopes = ['a', 'b'];
      fakeV1.SpannerClient.scopes = ['a', 'b', 'c'];

      const spanner = new Spanner(OPTIONS);

      const expectedOptions = extend({}, OPTIONS, {
        libName: 'gccl',
        libVersion: require('../package.json').version,
        scopes: expectedScopes,
      });

      assert.deepStrictEqual(spanner.auth.calledWith_[0], expectedOptions);
    });

    it('should inherit from GrpcService', function() {
      assert(spanner instanceof FakeGrpcService);

      const config = spanner.calledWith_[0];
      const options = spanner.calledWith_[1];

      assert.deepStrictEqual(config, {
        baseUrl: fakeV1.SpannerClient.servicePath,
        protosDir: path.resolve(__dirname, '../protos'),
        protoServices: {
          Operations: {
            path: 'google/longrunning/operations.proto',
            service: 'longrunning',
          },
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        packageJson: require('../package.json'),
      });

      assert.deepStrictEqual(
        options,
        extend({}, OPTIONS, {
          libName: 'gccl',
          libVersion: require('../package.json').version,
          scopes: [],
        })
      );
    });

    it('should optionally accept a servicePath', function() {
      const SERVICE_PATH = 'abc.def.ghi';
      const spanner = new Spanner({servicePath: SERVICE_PATH});

      const config = spanner.calledWith_[0];

      assert.strictEqual(config.baseUrl, SERVICE_PATH);
    });
  });

  describe('date', function() {
    it('should create a SpannerDate instance', function() {
      const value = {};
      const customValue = {};

      fakeCodec.SpannerDate = function(value_) {
        assert.strictEqual(value_, value);
        return customValue;
      };

      const date = Spanner.date(value);
      assert.strictEqual(date, customValue);
    });
  });

  describe('float', function() {
    it('should create a SpannerDate instance', function() {
      const value = {};
      const customValue = {};

      fakeCodec.Float = function(value_) {
        assert.strictEqual(value_, value);
        return customValue;
      };

      const float = Spanner.float(value);
      assert.strictEqual(float, customValue);
    });
  });

  describe('int', function() {
    it('should create an Int instance', function() {
      const value = {};
      const customValue = {};

      fakeCodec.Int = function(value_) {
        assert.strictEqual(value_, value);
        return customValue;
      };

      const int = Spanner.int(value);
      assert.strictEqual(int, customValue);
    });
  });

  describe('struct', function() {
    it('should create a struct from JSON', function() {
      const json = {};
      const fakeStruct = [];

      fakeCodec.Struct = {
        fromJSON: function(value) {
          assert.strictEqual(value, json);
          return fakeStruct;
        },
      };

      const struct = Spanner.struct(json);

      assert.strictEqual(struct, fakeStruct);
    });

    it('should create a struct from an Array', function() {
      const arr = [];
      const fakeStruct = [];

      fakeCodec.Struct = {
        fromArray: function(value) {
          assert.strictEqual(value, arr);
          return fakeStruct;
        },
      };

      const struct = Spanner.struct(arr);

      assert.strictEqual(struct, fakeStruct);
    });
  });

  describe('createInstance', function() {
    const NAME = 'instance-name';
    let PATH;

    const CONFIG = {
      a: 'b',
    };
    const ORIGINAL_CONFIG = extend({}, CONFIG);

    let formatName_;

    before(function() {
      formatName_ = FakeInstance.formatName_;
    });

    after(function() {
      FakeInstance.formatName_ = formatName_;
    });

    beforeEach(function() {
      FakeInstance.formatName_ = formatName_;
      PATH = 'projects/' + spanner.projectId + '/instances/' + NAME;

      spanner.request = util.noop;
    });

    it('should throw if a name is not provided', function() {
      assert.throws(function() {
        spanner.createInstance();
      }, /A name is required to create an instance\./);
    });

    it('should throw if a config object is not provided', function() {
      assert.throws(function() {
        spanner.createInstance(NAME);
      }, /A configuration object is required to create an instance\./);
    });

    it('should set the correct defaults on the request', function(done) {
      FakeInstance.formatName_ = function(projectId, name) {
        assert.strictEqual(projectId, spanner.projectId);
        assert.strictEqual(name, NAME);
        return PATH;
      };

      spanner.request = function(config) {
        assert.deepStrictEqual(CONFIG, ORIGINAL_CONFIG);

        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'createInstance');

        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, {
          parent: 'projects/' + spanner.projectId,
          instanceId: NAME,
          instance: extend(
            {
              name: PATH,
              displayName: NAME,
            },
            CONFIG
          ),
        });

        done();
      };

      spanner.createInstance(NAME, CONFIG, assert.ifError);
    });

    it('should accept a path', function(done) {
      FakeInstance.formatName_ = function(projectId, name) {
        assert.strictEqual(name, PATH);
        setImmediate(done);
        return name;
      };

      spanner.createInstance(PATH, CONFIG, assert.ifError);
    });

    describe('config.nodes', function() {
      it('should rename to nodeCount', function(done) {
        const config = extend({}, CONFIG, {nodes: 10});

        spanner.request = function(config_) {
          const reqOpts = config_.reqOpts;
          assert.strictEqual(reqOpts.instance.nodeCount, config.nodes);
          assert.strictEqual(reqOpts.instance.nodes, undefined);
          done();
        };

        spanner.createInstance(NAME, config, assert.ifError);
      });
    });

    describe('config.config', function() {
      it('should format a name', function(done) {
        const name = 'config-name';
        const config = extend({}, CONFIG, {config: name});
        const originalConfig = extend({}, config);

        spanner.request = function(config_) {
          assert.deepStrictEqual(config, originalConfig);

          const reqOpts = config_.reqOpts;
          assert.strictEqual(
            reqOpts.instance.config,
            'projects/' + spanner.projectId + '/instanceConfigs/' + name
          );

          done();
        };

        spanner.createInstance(NAME, config, assert.ifError);
      });
    });

    describe('error', function() {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(function() {
        spanner.request = function(config, callback) {
          callback(ERROR, null, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', function(done) {
        spanner.createInstance(NAME, CONFIG, function(err, instance, op, resp) {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(instance, null);
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
        spanner.request = function(config, callback) {
          callback(null, OPERATION, API_RESPONSE);
        };
      });

      it('should create an Instance and return an Operation', function(done) {
        const formattedName = 'formatted-name';
        FakeInstance.formatName_ = function() {
          return formattedName;
        };

        const fakeInstanceInstance = {};
        spanner.instance = function(name) {
          assert.strictEqual(name, formattedName);
          return fakeInstanceInstance;
        };

        spanner.createInstance(NAME, CONFIG, function(err, instance, op, resp) {
          assert.ifError(err);
          assert.strictEqual(instance, fakeInstanceInstance);
          assert.strictEqual(op, OPERATION);
          assert.strictEqual(resp, API_RESPONSE);
          done();
        });
      });
    });
  });

  describe('getInstances', function() {
    const QUERY = {
      a: 'b',
    };
    const ORIGINAL_QUERY = extend({}, QUERY);

    beforeEach(function() {
      spanner.request = util.noop;
    });

    it('should make the correct request', function(done) {
      const expectedReqOpts = extend({}, QUERY, {
        parent: 'projects/' + spanner.projectId,
      });

      spanner.request = function(config) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstances');

        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.reqOpts, QUERY);
        assert.deepStrictEqual(QUERY, ORIGINAL_QUERY);

        assert.strictEqual(config.gaxOpts, QUERY);

        done();
      };

      spanner.getInstances(QUERY, assert.ifError);
    });

    it('should not require a query', function(done) {
      spanner.request = function(config) {
        assert.deepStrictEqual(config.reqOpts, {
          parent: 'projects/' + spanner.projectId,
        });

        assert.deepStrictEqual(config.gaxOpts, {});

        done();
      };

      spanner.getInstances(assert.ifError);
    });

    describe('error', function() {
      const GAX_RESPONSE_ARGS = [new Error('Error.'), null, {}];

      beforeEach(function() {
        spanner.request = function(config, callback) {
          callback.apply(null, GAX_RESPONSE_ARGS);
        };
      });

      it('should execute callback with original arguments', function(done) {
        spanner.getInstances(QUERY, function() {
          assert.deepStrictEqual([].slice.call(arguments), GAX_RESPONSE_ARGS);
          done();
        });
      });
    });

    describe('success', function() {
      const INSTANCES = [
        {
          name: 'instance-name',
        },
      ];

      const GAX_RESPONSE_ARGS = [null, INSTANCES, {}];

      beforeEach(function() {
        spanner.request = function(config, callback) {
          callback.apply(null, GAX_RESPONSE_ARGS);
        };
      });

      it('should create and return Instance objects', function(done) {
        const fakeInstanceInstance = {};

        spanner.instance = function(name) {
          assert.strictEqual(name, INSTANCES[0].name);
          return fakeInstanceInstance;
        };

        spanner.getInstances(QUERY, function(err) {
          assert.ifError(err);

          assert.strictEqual(arguments[0], GAX_RESPONSE_ARGS[0]);

          const instance = arguments[1].pop();
          assert.strictEqual(instance, fakeInstanceInstance);
          assert.strictEqual(instance.metadata, GAX_RESPONSE_ARGS[1][0]);

          assert.strictEqual(arguments[2], GAX_RESPONSE_ARGS[2]);

          done();
        });
      });
    });
  });

  describe('getInstanceConfigs', function() {
    beforeEach(function() {
      spanner.request = util.noop;
    });

    it('should make and return the correct request', function() {
      const query = {a: 'b'};
      const expectedQuery = extend({}, query, {
        parent: 'projects/' + spanner.projectId,
      });

      function callback() {}

      const returnValue = {};

      spanner.request = function(config, callback_) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstanceConfigs');

        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, expectedQuery);
        assert.notStrictEqual(reqOpts, query);

        const gaxOpts = config.gaxOpts;
        assert.strictEqual(gaxOpts, query);

        assert.strictEqual(callback_, callback);

        return returnValue;
      };

      const returnedValue = spanner.getInstanceConfigs(query, callback);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should not require a query', function(done) {
      spanner.request = function(config) {
        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, {
          parent: 'projects/' + spanner.projectId,
        });
        done();
      };

      spanner.getInstanceConfigs(assert.ifError);
    });
  });

  describe('getInstanceConfigsStream', function() {
    beforeEach(function() {
      spanner.requestStream = util.noop;
    });

    it('should make and return the correct gax API call', function() {
      const query = {a: 'b'};
      const expectedQuery = extend({}, query, {
        parent: 'projects/' + spanner.projectId,
      });
      const returnValue = {};

      spanner.requestStream = function(config) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstanceConfigsStream');

        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, expectedQuery);
        assert.notStrictEqual(reqOpts, query);

        const gaxOpts = config.gaxOpts;
        assert.strictEqual(gaxOpts, query);

        return returnValue;
      };

      const returnedValue = spanner.getInstanceConfigsStream(query);
      assert.strictEqual(returnedValue, returnValue);
    });
  });

  describe('instance', function() {
    const NAME = 'instance-name';

    it('should throw if a name is not provided', function() {
      assert.throws(function() {
        spanner.instance();
      }, /A name is required to access an Instance object\./);
    });

    it('should create and cache an Instance', function() {
      const cache = spanner.instances_;

      assert.strictEqual(cache.has(NAME), false);

      const instance = spanner.instance(NAME);

      assert(instance instanceof FakeInstance);
      assert.strictEqual(instance.calledWith_[0], spanner);
      assert.strictEqual(instance.calledWith_[1], NAME);
      assert.strictEqual(instance, cache.get(NAME));
    });

    it('should re-use cached objects', function() {
      const cache = spanner.instances_;
      const fakeInstance = {};

      cache.set(NAME, fakeInstance);

      const instance = spanner.instance(NAME);

      assert.strictEqual(instance, fakeInstance);
    });
  });

  describe('operation', function() {
    const NAME = 'op-name';

    it('should throw if a name is not provided', function() {
      assert.throws(function() {
        spanner.operation();
      }, /A name is required to access an Operation object\./);
    });

    it('should return an Operation object', function() {
      const operation = spanner.operation(NAME);
      assert(operation instanceof FakeGrpcOperation);
      assert.strictEqual(operation.calledWith_[0], spanner);
      assert.strictEqual(operation.calledWith_[1], NAME);
    });
  });

  describe('prepareGapicRequest_', function() {
    const PROJECT_ID = 'project-id';
    const CONFIG = {
      client: 'SpannerClient',
      method: 'methodName',
      reqOpts: {
        a: 'b',
        c: 'd',
      },
      gaxOpts: {},
    };

    const FAKE_GAPIC_CLIENT = {
      [CONFIG.method]: util.noop,
    };

    beforeEach(function() {
      FAKE_GAPIC_CLIENT[CONFIG.method] = util.noop;

      spanner.auth.getProjectId = function(callback) {
        callback(null, PROJECT_ID);
      };

      fakeV1[CONFIG.client] = function() {
        return FAKE_GAPIC_CLIENT;
      };
    });

    it('should get the project ID from google-auth-library', function(done) {
      spanner.auth.getProjectId = function() {
        done();
      };

      spanner.prepareGapicRequest_(CONFIG, assert.ifError);
    });

    it('should return an error from google-auth-library', function(done) {
      const error = new Error('Error.');

      spanner.auth.getProjectId = function(callback) {
        callback(error);
      };

      spanner.prepareGapicRequest_(CONFIG, function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should create and cache a gapic client', function(done) {
      fakeV1[CONFIG.client] = function(options) {
        assert.strictEqual(options, spanner.options);

        setImmediate(function() {
          const cachedClient = spanner.clients_.get(CONFIG.client);
          assert.strictEqual(cachedClient, FAKE_GAPIC_CLIENT);
          done();
        });

        return FAKE_GAPIC_CLIENT;
      };

      spanner.prepareGapicRequest_(CONFIG, assert.ifError);
    });

    it('should re-use a cached gapic client', function() {
      fakeV1[CONFIG.client] = function() {
        throw new Error('Should not have re-created client!');
      };

      spanner.clients_.set(CONFIG.client, FAKE_GAPIC_CLIENT);

      spanner.prepareGapicRequest_(CONFIG, assert.ifError);
    });

    it('should replace project ID tokens within the reqOpts', function(done) {
      const replacedReqOpts = {};

      replaceProjectIdTokenOverride = function(reqOpts, projectId) {
        assert.deepStrictEqual(reqOpts, CONFIG.reqOpts);
        assert.notStrictEqual(reqOpts, CONFIG.reqOpts);

        assert.strictEqual(projectId, PROJECT_ID);

        return replacedReqOpts;
      };

      FAKE_GAPIC_CLIENT[CONFIG.method] = function(reqOpts) {
        assert.strictEqual(reqOpts, replacedReqOpts);
        done();
      };

      spanner.prepareGapicRequest_(CONFIG, function(err, requestFn) {
        requestFn(); // (FAKE_GAPIC_CLIENT[CONFIG.method])
      });
    });

    it('should return the gax client method with correct args', function(done) {
      replaceProjectIdTokenOverride = function(reqOpts) {
        return reqOpts;
      };

      FAKE_GAPIC_CLIENT[CONFIG.method] = function(reqOpts, gaxOpts, arg) {
        assert.strictEqual(this, FAKE_GAPIC_CLIENT);

        assert.deepStrictEqual(reqOpts, CONFIG.reqOpts);
        assert.notStrictEqual(reqOpts, CONFIG.reqOpts);

        assert.strictEqual(gaxOpts, CONFIG.gaxOpts);

        arg(); // done()
      };

      spanner.prepareGapicRequest_(CONFIG, function(err, requestFn) {
        requestFn(done); // (FAKE_GAPIC_CLIENT[CONFIG.method])
      });
    });
  });

  describe('request', function() {
    const CONFIG = {};

    beforeEach(function() {
      spanner.prepareGapicRequest_ = util.noop;
      spanner.Promise = Promise;
    });

    describe('callback mode', function() {
      it('should not return a promise', function() {
        const returnedValue = spanner.request(CONFIG, assert.ifError);
        assert.strictEqual(returnedValue, undefined);
      });

      it('should prepare the gapic request', function(done) {
        spanner.prepareGapicRequest_ = function(config) {
          assert.strictEqual(config, CONFIG);
          done();
        };

        spanner.request(CONFIG, assert.ifError);
      });

      it('should execute callback with error', function(done) {
        const error = new Error('Error.');

        spanner.prepareGapicRequest_ = function(config, callback) {
          callback(error);
        };

        spanner.request(CONFIG, function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should pass callback to request function', function(done) {
        function gapicRequestFn(callback) {
          callback(); // done()
        }

        spanner.prepareGapicRequest_ = function(config, callback) {
          callback(null, gapicRequestFn);
        };

        spanner.request(CONFIG, done);
      });
    });

    describe('promise mode', function() {
      it('should return a promise', function() {
        const returnedValue = spanner.request(CONFIG);
        assert(returnedValue instanceof Promise);
      });

      it('should prepare the gapic request', function(done) {
        spanner.prepareGapicRequest_ = function(config) {
          assert.strictEqual(config, CONFIG);
          done();
        };

        spanner.request(CONFIG);
      });

      it('should reject the promise', function(done) {
        const error = new Error('Error.');

        spanner.prepareGapicRequest_ = function(config, callback) {
          callback(error);
        };

        spanner.request(CONFIG).catch(function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should resolve the promise with the request fn', function() {
        const gapicRequestFnResult = {};

        function gapicRequestFn() {
          return gapicRequestFnResult;
        }

        spanner.prepareGapicRequest_ = function(config, callback) {
          callback(null, gapicRequestFn);
        };

        return spanner.request(CONFIG).then(function(result) {
          assert.strictEqual(result, gapicRequestFnResult);
        });
      });
    });
  });

  describe('requestStream', function() {
    const CONFIG = {};

    beforeEach(function() {
      spanner.prepareGapicRequest_ = util.noop;
    });

    it('should prepare the gapic request', function(done) {
      spanner.prepareGapicRequest_ = function(config) {
        assert.strictEqual(config, CONFIG);
        done();
      };

      spanner.requestStream(CONFIG).emit('reading');
    });

    it('should destroy the stream with an error', function(done) {
      const error = new Error('Error.');

      spanner.prepareGapicRequest_ = function(config, callback) {
        callback(error);
      };

      spanner
        .requestStream(CONFIG)
        .on('error', function(err) {
          assert.strictEqual(err, error);
          done();
        })
        .emit('reading');
    });

    it('should pipe the request stream to the user stream', function(done) {
      const requestStream = through.obj();
      const data = {};

      spanner.prepareGapicRequest_ = function(config, callback) {
        callback(null, function() {
          setImmediate(function() {
            requestStream.end(data);
          });

          return requestStream;
        });
      };

      spanner
        .requestStream(CONFIG)
        .on('data', function(data_) {
          assert.strictEqual(data_, data);
          done();
        })
        .emit('reading');
    });

    it('should pass errors from the request stream', function(done) {
      const requestStream = through.obj();
      const error = new Error('Error.');

      spanner.prepareGapicRequest_ = function(config, callback) {
        callback(null, function() {
          setImmediate(function() {
            requestStream.destroy(error);
          });

          return requestStream;
        });
      };

      spanner
        .requestStream(CONFIG)
        .on('error', function(err) {
          assert.strictEqual(err, error);
          done();
        })
        .emit('reading');
    });
  });
});
