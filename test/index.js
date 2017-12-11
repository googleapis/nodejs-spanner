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
var path = require('path');
var proxyquire = require('proxyquire');
var through = require('through2');
var util = require('@google-cloud/common').util;

var fakePaginator = {
  streamify: function(methodName) {
    return methodName;
  },
};

var promisified = false;
var fakeUtil = extend({}, util, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'Spanner') {
      return;
    }

    promisified = true;
    assert.deepEqual(options.exclude, [
      'date',
      'float',
      'getInstanceConfigs',
      'instance',
      'int',
      'operation',
    ]);
  },
});

var fakeGapicClient = util.noop;
fakeGapicClient.scopes = [];

var fakeV1 = {
  DatabaseAdminClient: fakeGapicClient,
  InstanceAdminClient: fakeGapicClient,
  SpannerClient: fakeGapicClient,
};

function fakeGoogleAutoAuth() {
  return {
    calledWith_: arguments,
  };
}

var fakeCodec = {
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
  var Spanner;
  var spanner;

  var OPTIONS = {
    projectId: 'project-id',
  };

  before(function() {
    Spanner = proxyquire('../src/index.js', {
      '@google-cloud/common': {
        paginator: fakePaginator,
        util: fakeUtil,
      },
      '@google-cloud/common-grpc': {
        Operation: FakeGrpcOperation,
        Service: FakeGrpcService,
      },
      'google-auto-auth': fakeGoogleAutoAuth,
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

    it('should normalize the arguments', function() {
      var normalizeArguments = fakeUtil.normalizeArguments;
      var normalizeArgumentsCalled = false;
      var fakeOptions = {projectId: OPTIONS.projectId};
      var fakeContext = {};

      fakeUtil.normalizeArguments = function(context, options) {
        normalizeArgumentsCalled = true;
        assert.strictEqual(context, fakeContext);
        assert.strictEqual(options, fakeOptions);
        return options;
      };

      Spanner.call(fakeContext, fakeOptions);
      assert(normalizeArgumentsCalled);

      fakeUtil.normalizeArguments = normalizeArguments;
    });

    it('should create an auth instance from google-auto-auth', function() {
      var expectedOptions = extend({}, OPTIONS, {
        libName: 'gccl',
        libVersion: require('../package.json').version,
        scopes: [],
      });

      assert.deepEqual(spanner.auth.calledWith_[0], expectedOptions);
    });

    it('should combine and uniquify all gapic client scopes', function() {
      var expectedScopes = ['a', 'b', 'c'];
      fakeV1.DatabaseAdminClient.scopes = ['a', 'c'];
      fakeV1.InstanceAdminClient.scopes = ['a', 'b'];
      fakeV1.SpannerClient.scopes = ['a', 'b', 'c'];

      var spanner = new Spanner(OPTIONS);

      var expectedOptions = extend({}, OPTIONS, {
        libName: 'gccl',
        libVersion: require('../package.json').version,
        scopes: expectedScopes,
      });

      assert.deepEqual(spanner.auth.calledWith_[0], expectedOptions);
    });

    it('should inherit from GrpcService', function() {
      assert(spanner instanceof FakeGrpcService);

      var config = spanner.calledWith_[0];
      var options = spanner.calledWith_[1];

      assert.deepEqual(config, {
        baseUrl: 'spanner.googleapis.com',
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

      assert.deepEqual(
        options,
        extend({}, OPTIONS, {
          libName: 'gccl',
          libVersion: require('../package.json').version,
          scopes: [],
        })
      );
    });
  });

  describe('date', function() {
    it('should create a SpannerDate instance', function() {
      var value = {};
      var customValue = {};

      fakeCodec.SpannerDate = function(value_) {
        assert.strictEqual(value_, value);
        return customValue;
      };

      var date = Spanner.date(value);
      assert.strictEqual(date, customValue);
    });
  });

  describe('float', function() {
    it('should create a SpannerDate instance', function() {
      var value = {};
      var customValue = {};

      fakeCodec.Float = function(value_) {
        assert.strictEqual(value_, value);
        return customValue;
      };

      var float = Spanner.float(value);
      assert.strictEqual(float, customValue);
    });
  });

  describe('int', function() {
    it('should create an Int instance', function() {
      var value = {};
      var customValue = {};

      fakeCodec.Int = function(value_) {
        assert.strictEqual(value_, value);
        return customValue;
      };

      var int = Spanner.int(value);
      assert.strictEqual(int, customValue);
    });
  });

  describe('createInstance', function() {
    var NAME = 'instance-name';
    var PATH;

    var CONFIG = {
      a: 'b',
    };
    var ORIGINAL_CONFIG = extend({}, CONFIG);

    var formatName_;

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
        assert.deepEqual(CONFIG, ORIGINAL_CONFIG);

        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'createInstance');

        var reqOpts = config.reqOpts;
        assert.deepEqual(reqOpts, {
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
        var config = extend({}, CONFIG, {nodes: 10});

        spanner.request = function(config_) {
          var reqOpts = config_.reqOpts;
          assert.strictEqual(reqOpts.instance.nodeCount, config.nodes);
          assert.strictEqual(reqOpts.instance.nodes, undefined);
          done();
        };

        spanner.createInstance(NAME, config, assert.ifError);
      });
    });

    describe('config.config', function() {
      it('should format a name', function(done) {
        var name = 'config-name';
        var config = extend({}, CONFIG, {config: name});
        var originalConfig = extend({}, config);

        spanner.request = function(config_) {
          assert.deepEqual(config, originalConfig);

          var reqOpts = config_.reqOpts;
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
      var ERROR = new Error('Error.');
      var API_RESPONSE = {};

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
      var OPERATION = {};
      var API_RESPONSE = {};

      beforeEach(function() {
        spanner.request = function(config, callback) {
          callback(null, OPERATION, API_RESPONSE);
        };
      });

      it('should create an Instance and return an Operation', function(done) {
        var formattedName = 'formatted-name';
        FakeInstance.formatName_ = function() {
          return formattedName;
        };

        var fakeInstanceInstance = {};
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
    var QUERY = {
      a: 'b',
    };
    var ORIGINAL_QUERY = extend({}, QUERY);

    beforeEach(function() {
      spanner.request = util.noop;
    });

    it('should make the correct request', function(done) {
      var expectedReqOpts = extend({}, QUERY, {
        parent: 'projects/' + spanner.projectId,
      });

      spanner.request = function(config) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstances');

        assert.deepEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.reqOpts, QUERY);
        assert.deepEqual(QUERY, ORIGINAL_QUERY);

        assert.strictEqual(config.gaxOpts, QUERY);

        done();
      };

      spanner.getInstances(QUERY, assert.ifError);
    });

    it('should not require a query', function(done) {
      spanner.request = function(config) {
        assert.deepEqual(config.reqOpts, {
          parent: 'projects/' + spanner.projectId,
        });

        assert.deepEqual(config.gaxOpts, {});

        done();
      };

      spanner.getInstances(assert.ifError);
    });

    describe('error', function() {
      var GAX_RESPONSE_ARGS = [new Error('Error.'), null, {}];

      beforeEach(function() {
        spanner.request = function(config, callback) {
          callback.apply(null, GAX_RESPONSE_ARGS);
        };
      });

      it('should execute callback with original arguments', function(done) {
        spanner.getInstances(QUERY, function() {
          assert.deepEqual([].slice.call(arguments), GAX_RESPONSE_ARGS);
          done();
        });
      });
    });

    describe('success', function() {
      var INSTANCES = [
        {
          name: 'instance-name',
        },
      ];

      var GAX_RESPONSE_ARGS = [null, INSTANCES, {}];

      beforeEach(function() {
        spanner.request = function(config, callback) {
          callback.apply(null, GAX_RESPONSE_ARGS);
        };
      });

      it('should create and return Instance objects', function(done) {
        var fakeInstanceInstance = {};

        spanner.instance = function(name) {
          assert.strictEqual(name, INSTANCES[0].name);
          return fakeInstanceInstance;
        };

        spanner.getInstances(QUERY, function(err) {
          assert.ifError(err);

          assert.strictEqual(arguments[0], GAX_RESPONSE_ARGS[0]);

          var instance = arguments[1].pop();
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
      var query = {a: 'b'};
      var expectedQuery = extend({}, query, {
        parent: 'projects/' + spanner.projectId,
      });

      function callback() {}

      var returnValue = {};

      spanner.request = function(config, callback_) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstanceConfigs');

        var reqOpts = config.reqOpts;
        assert.deepEqual(reqOpts, expectedQuery);
        assert.notStrictEqual(reqOpts, query);

        var gaxOpts = config.gaxOpts;
        assert.strictEqual(gaxOpts, query);

        assert.strictEqual(callback_, callback);

        return returnValue;
      };

      var returnedValue = spanner.getInstanceConfigs(query, callback);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should not require a query', function(done) {
      spanner.request = function(config) {
        var reqOpts = config.reqOpts;
        assert.deepEqual(reqOpts, {
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
      var query = {a: 'b'};
      var expectedQuery = extend({}, query, {
        parent: 'projects/' + spanner.projectId,
      });
      var returnValue = {};

      spanner.requestStream = function(config) {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstanceConfigsStream');

        var reqOpts = config.reqOpts;
        assert.deepEqual(reqOpts, expectedQuery);
        assert.notStrictEqual(reqOpts, query);

        var gaxOpts = config.gaxOpts;
        assert.strictEqual(gaxOpts, query);

        return returnValue;
      };

      var returnedValue = spanner.getInstanceConfigsStream(query);
      assert.strictEqual(returnedValue, returnValue);
    });
  });

  describe('instance', function() {
    var NAME = 'instance-name';

    it('should throw if a name is not provided', function() {
      assert.throws(function() {
        spanner.instance();
      }, /A name is required to access an Instance object\./);
    });

    it('should create and cache an Instance', function() {
      var cache = spanner.instances_;

      assert.strictEqual(cache.has(NAME), false);

      var instance = spanner.instance(NAME);

      assert(instance instanceof FakeInstance);
      assert.strictEqual(instance.calledWith_[0], spanner);
      assert.strictEqual(instance.calledWith_[1], NAME);
      assert.strictEqual(instance, cache.get(NAME));
    });

    it('should re-use cached objects', function() {
      var cache = spanner.instances_;
      var fakeInstance = {};

      cache.set(NAME, fakeInstance);

      var instance = spanner.instance(NAME);

      assert.strictEqual(instance, fakeInstance);
    });
  });

  describe('operation', function() {
    var NAME = 'op-name';

    it('should throw if a name is not provided', function() {
      assert.throws(function() {
        spanner.operation();
      }, /A name is required to access an Operation object\./);
    });

    it('should return an Operation object', function() {
      var operation = spanner.operation(NAME);
      assert(operation instanceof FakeGrpcOperation);
      assert.strictEqual(operation.calledWith_[0], spanner);
      assert.strictEqual(operation.calledWith_[1], NAME);
    });
  });

  describe('prepareGapicRequest_', function() {
    var PROJECT_ID = 'project-id';
    var CONFIG = {
      client: 'SpannerClient',
      method: 'methodName',
      reqOpts: {
        a: 'b',
        c: 'd',
      },
      gaxOpts: {},
    };

    var FAKE_GAPIC_CLIENT = {
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

    it('should get the project ID from google-auto-auth', function(done) {
      spanner.auth.getProjectId = function() {
        done();
      };

      spanner.prepareGapicRequest_(CONFIG, assert.ifError);
    });

    it('should return an error from google-auto-auth', function(done) {
      var error = new Error('Error.');

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
          var cachedClient = spanner.clients_.get(CONFIG.client);
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
      var replacedReqOpts = {};

      fakeUtil.replaceProjectIdToken = function(reqOpts, projectId) {
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
      fakeUtil.replaceProjectIdToken = function(reqOpts) {
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
    var CONFIG = {};

    beforeEach(function() {
      spanner.prepareGapicRequest_ = util.noop;
      spanner.Promise = Promise;
    });

    describe('callback mode', function() {
      it('should not return a promise', function() {
        var returnedValue = spanner.request(CONFIG, assert.ifError);
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
        var error = new Error('Error.');

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
        var returnedValue = spanner.request(CONFIG);
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
        var error = new Error('Error.');

        spanner.prepareGapicRequest_ = function(config, callback) {
          callback(error);
        };

        spanner.request(CONFIG).catch(function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should resolve the promise with the request fn', function() {
        var gapicRequestFnResult = {};

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
    var CONFIG = {};

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
      var error = new Error('Error.');

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
      var requestStream = through.obj();
      var data = {};

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
      var requestStream = through.obj();
      var error = new Error('Error.');

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
