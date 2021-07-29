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

/* eslint-disable prefer-rest-params */

import * as assert from 'assert';
import {before, beforeEach, afterEach, describe, it} from 'mocha';
import * as extend from 'extend';
import * as path from 'path';
import * as proxyquire from 'proxyquire';
import * as through from 'through2';
import {util} from '@google-cloud/common';
import {PreciseDate} from '@google-cloud/precise-date';
import {replaceProjectIdToken} from '@google-cloud/projectify';
import * as pfy from '@google-cloud/promisify';
import {grpc} from 'google-gax';
import * as sinon from 'sinon';
import * as spnr from '../src';
import {Duplex} from 'stream';
import {CreateInstanceRequest} from '../src/index';
import {
  GetInstanceConfigOptions,
  GetInstanceConfigsOptions,
  GetInstancesOptions,
} from '../src';
import {CLOUD_RESOURCE_HEADER} from '../src/common';

// Verify that CLOUD_RESOURCE_HEADER is set to a correct value.
assert.strictEqual(CLOUD_RESOURCE_HEADER, 'google-cloud-resource-prefix');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const apiConfig = require('../src/spanner_grpc_config.json');

function getFake(obj: {}) {
  return obj as {
    calledWith_: IArguments;
  };
}

function asAny(obj) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return obj as any;
}

let replaceProjectIdTokenOverride;
function fakeReplaceProjectIdToken(...args) {
  return (replaceProjectIdTokenOverride || replaceProjectIdToken)(...args);
}

const fakeGrpcGcp = () => {
  return {
    gcpChannelFactoryOverride: {},
    gcpCallInvocationTransformer: {},
    createGcpApiConfig: apiConfig => {
      return {
        calledWith_: apiConfig,
      };
    },
  };
};

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll(klass, options) {
    if (klass.name !== 'Spanner') {
      return;
    }
    promisified = true;
    assert.deepStrictEqual(options.exclude, [
      'date',
      'float',
      'instance',
      'int',
      'numeric',
      'operation',
      'timestamp',
    ]);
  },
});

let fakeGapicClient = util.noop;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(fakeGapicClient as any).scopes = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakeV1: any = {
  DatabaseAdminClient: fakeGapicClient,
  InstanceAdminClient: fakeGapicClient,
  SpannerClient: fakeGapicClient,
};

function fakeGoogleAuth() {
  return {
    calledWith_: arguments,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakeCodec: any = {
  SpannerDate: util.noop,
};

class FakeGrpcService {
  calledWith_: IArguments;
  projectId: string;
  constructor() {
    this.calledWith_ = arguments;
    this.projectId = arguments[1].projectId;
  }
}

class FakeInstance {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
  static formatName_(projectId: string, name: string) {
    return name;
  }
}

describe('Spanner', () => {
  // tslint:disable-next-line variable-name
  let Spanner: typeof spnr.Spanner;
  let spanner: spnr.Spanner;
  let sandbox: sinon.SinonSandbox;

  const OPTIONS = {
    projectId: 'project-id',
  };

  before(() => {
    Spanner = proxyquire('../src', {
      './common-grpc/service': {
        GrpcService: FakeGrpcService,
      },
      '@google-cloud/promisify': fakePfy,
      '@google-cloud/projectify': {
        replaceProjectIdToken: fakeReplaceProjectIdToken,
      },
      'google-auth-library': {
        GoogleAuth: fakeGoogleAuth,
      },
      'grpc-gcp': fakeGrpcGcp,
      './codec.js': {codec: fakeCodec},
      './instance.js': {Instance: FakeInstance},
      './v1': fakeV1,
    }).Spanner;
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    fakeGapicClient = util.noop;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fakeGapicClient as any).scopes = [];
    fakeV1.DatabaseAdminClient = fakeGapicClient;
    fakeV1.InstanceAdminClient = fakeGapicClient;
    fakeV1.SpannerClient = fakeGapicClient;
    fakeCodec.SpannerDate = util.noop;
    fakeCodec.Int = util.noop;
    spanner = new Spanner(OPTIONS);
    spanner.projectId = OPTIONS.projectId;
    replaceProjectIdTokenOverride = null;
  });

  afterEach(() => sandbox.restore());

  describe('instantiation', () => {
    const EXPECTED_OPTIONS = extend({}, OPTIONS, {
      libName: 'gccl',
      libVersion: require('../../package.json').version,
      scopes: [],
      grpc,
      'grpc.callInvocationTransformer':
        fakeGrpcGcp().gcpCallInvocationTransformer,
      'grpc.channelFactoryOverride': fakeGrpcGcp().gcpChannelFactoryOverride,
      'grpc.gcpApiConfig': {
        calledWith_: apiConfig,
      },
    });

    it('should localize a cached gapic client map', () => {
      assert(spanner.clients_ instanceof Map);
      assert.strictEqual(spanner.clients_.size, 0);
    });

    it('should localize an instance map', () => {
      assert(spanner.instances_ instanceof Map);
      assert.strictEqual(spanner.instances_.size, 0);
    });

    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should create an auth instance from google-auth-library', () => {
      assert.deepStrictEqual(
        getFake(spanner.auth).calledWith_[0],
        EXPECTED_OPTIONS
      );
    });

    it('should combine and uniquify all gapic client scopes', () => {
      const expectedScopes = ['a', 'b', 'c'];
      fakeV1.DatabaseAdminClient.scopes = ['a', 'c'];
      fakeV1.InstanceAdminClient.scopes = ['a', 'b'];
      fakeV1.SpannerClient.scopes = ['a', 'b', 'c'];

      const spanner = new Spanner(OPTIONS);

      const expectedOptions = extend({}, EXPECTED_OPTIONS, {
        scopes: expectedScopes,
      });

      assert.deepStrictEqual(
        getFake(spanner.auth).calledWith_[0],
        expectedOptions
      );
    });

    it('should inherit from GrpcService', () => {
      assert(spanner instanceof FakeGrpcService);

      const config = getFake(spanner).calledWith_[0];
      const options = getFake(spanner).calledWith_[1];

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
        packageJson: require('../../package.json'),
      });

      assert.deepStrictEqual(options, EXPECTED_OPTIONS);
    });

    it('should optionally accept a servicePath', () => {
      const SERVICE_PATH = 'abc.def.ghi';
      const spanner = new Spanner({servicePath: SERVICE_PATH});

      const config = getFake(spanner).calledWith_[0];

      assert.strictEqual(config.baseUrl, SERVICE_PATH);
    });

    it('should set projectFormattedName_', () => {
      assert.strictEqual(
        spanner.projectFormattedName_,
        `projects/${spanner.projectId}`
      );
    });

    it('should set the resourceHeader_', () => {
      assert.deepStrictEqual(spanner.resourceHeader_, {
        [CLOUD_RESOURCE_HEADER]: spanner.projectFormattedName_,
      });
    });

    describe('SPANNER_EMULATOR_HOST', () => {
      let currentEmulator: string | undefined;

      beforeEach(() => (currentEmulator = process.env.SPANNER_EMULATOR_HOST));

      afterEach(() => {
        if (currentEmulator) {
          process.env.SPANNER_EMULATOR_HOST = currentEmulator;
        } else {
          delete process.env.SPANNER_EMULATOR_HOST;
        }
      });

      it('should parse emulator host without port correctly', () => {
        const EMULATOR_HOST = 'somehost.local';
        process.env.SPANNER_EMULATOR_HOST = `${EMULATOR_HOST}`;

        const emulator = Spanner.getSpannerEmulatorHost();

        assert.deepStrictEqual(emulator, {endpoint: EMULATOR_HOST});
      });

      it('should parse emulator host with port correctly', () => {
        const EMULATOR_HOST = 'somehost.local';
        const EMULATOR_PORT = 1610;
        process.env.SPANNER_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_PORT}`;

        const emulator = Spanner.getSpannerEmulatorHost();

        assert.deepStrictEqual(emulator, {
          endpoint: EMULATOR_HOST,
          port: EMULATOR_PORT,
        });
      });

      it('should reject emulator host with protocol', () => {
        try {
          const EMULATOR_HOST = 'https://somehost.local:1234';
          process.env.SPANNER_EMULATOR_HOST = `${EMULATOR_HOST}`;
          Spanner.getSpannerEmulatorHost();
          assert.fail('Missing expected error');
        } catch (e) {
          assert.strictEqual(
            e.message,
            'SPANNER_EMULATOR_HOST must not start with a protocol specification (http/https)'
          );
        }
      });

      it('should reject emulator host with invalid port number', () => {
        try {
          const EMULATOR_HOST = 'somehost.local:not_a_port';
          process.env.SPANNER_EMULATOR_HOST = `${EMULATOR_HOST}`;
          Spanner.getSpannerEmulatorHost();
          assert.fail('Missing expected error');
        } catch (e) {
          assert.strictEqual(e.message, 'Invalid port number: not_a_port');
        }
      });

      it('should use SPANNER_EMULATOR_HOST', () => {
        const EMULATOR_HOST = 'somehost.local';
        const EMULATOR_PORT = 1610;
        process.env.SPANNER_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_PORT}`;
        const spanner = new Spanner();

        const config = getFake(spanner).calledWith_[0];
        const options = getFake(spanner).calledWith_[1];

        assert.strictEqual(config.baseUrl, EMULATOR_HOST);
        assert.strictEqual(options.port, EMULATOR_PORT);
      });
    });
  });

  describe('date', () => {
    it('should create a default SpannerDate instance', () => {
      const customValue = {};

      fakeCodec.SpannerDate = class {
        constructor() {
          return customValue;
        }
      };

      const date = Spanner.date();
      assert.strictEqual(date, customValue);
    });

    it('should create a SpannerDate instance', () => {
      const value = '1999-1-1';
      const customValue = {};

      fakeCodec.SpannerDate = class {
        constructor(value_) {
          assert.strictEqual(value_, value);
          return customValue;
        }
      };

      const date = Spanner.date(value);
      assert.strictEqual(date, customValue);
    });

    it('should create a SpannerDate instance from year/month/day', () => {
      const year = 1999;
      const month = 1;
      const day = 1;
      const customValue = {};

      fakeCodec.SpannerDate = class {
        constructor(year_, month_, day_) {
          assert.strictEqual(year_, year);
          assert.strictEqual(month_, month);
          assert.strictEqual(day_, day);
          return customValue;
        }
      };

      const date = Spanner.date(year, month, day);
      assert.strictEqual(date, customValue);
    });

    it('should create a SpannerDate instance in year 0', () => {
      const year = 0;
      const month = 1;
      const day = 1;
      const customValue = {};

      fakeCodec.SpannerDate = class {
        constructor(year_, month_, day_) {
          assert.strictEqual(year_, year);
          assert.strictEqual(month_, month);
          assert.strictEqual(day_, day);
          return customValue;
        }
      };

      const date = Spanner.date(year, month, day);
      assert.strictEqual(date, customValue);
    });
  });

  describe('timestamp', () => {
    it('should create a PreciseDate instance', () => {
      const date = Spanner.timestamp();
      assert(date instanceof PreciseDate);
    });

    it('should return same instance if a PreciseData was given', () => {
      const timestamp = new PreciseDate('2019-02-08T10:34:29.481145231Z');
      const converted_timestamp = Spanner.timestamp(timestamp);
      assert(timestamp instanceof PreciseDate);
      assert.deepStrictEqual(converted_timestamp, timestamp);
    });
  });

  describe('float', () => {
    it('should create a Float instance', () => {
      const value = {};
      const customValue = {};

      fakeCodec.Float = class {
        constructor(value_) {
          assert.strictEqual(value_, value);
          return customValue;
        }
      };

      const float = Spanner.float(value);
      assert.strictEqual(float, customValue);
    });
  });

  describe('int', () => {
    it('should create an Int instance', () => {
      const value = {};
      const customValue = {};

      fakeCodec.Int = class {
        constructor(value_) {
          assert.strictEqual(value_, value);
          return customValue;
        }
      };

      const int = Spanner.int(value);
      assert.strictEqual(int, customValue);
    });
  });

  describe('struct', () => {
    it('should create a struct from JSON', () => {
      const json = {};
      const fakeStruct = [];
      fakeCodec.Struct = {
        fromJSON(value) {
          assert.strictEqual(value, json);
          return fakeStruct;
        },
      };
      const struct = Spanner.struct(json);
      assert.strictEqual(struct, fakeStruct);
    });

    it('should create a struct from an Array', () => {
      const arr = [];
      const fakeStruct = [];

      fakeCodec.Struct = {
        fromArray(value) {
          assert.strictEqual(value, arr);
          return fakeStruct;
        },
      };

      const struct = Spanner.struct(arr);

      assert.strictEqual(struct, fakeStruct);
    });
  });

  describe('numeric', () => {
    it('should create a Numeric instance', () => {
      const value = '3.145';
      const customValue = {value: '3.145'};

      fakeCodec.Numeric = class {
        constructor(value_) {
          assert.strictEqual(value_, value);
          return customValue;
        }
      };

      const numeric = Spanner.numeric(value);
      assert.strictEqual(numeric, customValue);
    });
  });

  describe('createInstance', () => {
    const NAME = 'instance-name';
    let PATH;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CONFIG: any = {
      config: 'b',
    };
    const ORIGINAL_CONFIG = extend({}, CONFIG);

    beforeEach(() => {
      PATH = 'projects/' + spanner.projectId + '/instances/' + NAME;
      spanner.request = util.noop;
    });

    it('should throw if a name is not provided', () => {
      assert.throws(() => {
        spanner.createInstance(null!, {} as CreateInstanceRequest);
      }, /A name is required to create an instance\./);
    });

    it('should throw if a config object is not provided', () => {
      assert.throws(() => {
        spanner.createInstance(NAME, null!);
      }, /A configuration object is required to create an instance\./);
    });

    it('should set the correct defaults on the request', done => {
      const stub = sandbox.stub(FakeInstance, 'formatName_').returns(PATH);

      spanner.request = config => {
        const [projectId, name] = stub.lastCall.args;
        assert.strictEqual(projectId, spanner.projectId);
        assert.strictEqual(name, NAME);

        assert.deepStrictEqual(CONFIG, ORIGINAL_CONFIG);
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'createInstance');

        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, {
          parent: 'projects/' + spanner.projectId,
          instanceId: NAME,
          instance: {
            name: PATH,
            displayName: NAME,
            nodeCount: 1,
            processingUnits: undefined,
            config: `projects/project-id/instanceConfigs/${CONFIG.config}`,
          },
        });
        assert.strictEqual(config.gaxOpts, undefined);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);
        done();
      };
      spanner.createInstance(NAME, CONFIG, assert.ifError);
    });

    it('should accept a path', () => {
      const stub = sandbox.stub(FakeInstance, 'formatName_').callThrough();
      spanner.createInstance(PATH, CONFIG, assert.ifError);

      const [, name] = stub.lastCall.args;
      assert.strictEqual(name, PATH);
    });

    it('should accept the displayName', done => {
      const displayName = 'my-instance';
      const config = Object.assign({}, CONFIG, {displayName});

      spanner.request = config => {
        assert.strictEqual(config.reqOpts.instance.displayName, displayName);
        done();
      };

      spanner.createInstance(NAME, config, assert.ifError);
    });

    it('should create an instance with processing units', done => {
      const processingUnits = 500;
      const config = Object.assign({}, CONFIG, {processingUnits});

      spanner.request = config => {
        assert.strictEqual(
          config.reqOpts.instance.processingUnits,
          processingUnits
        );
        assert.strictEqual(config.reqOpts.instance.nodeCount, undefined);
        done();
      };

      spanner.createInstance(NAME, config, assert.ifError);
    });

    it('should throw if both nodes and processingUnits are given', () => {
      const nodeCount = 1;
      const processingUnits = 500;
      const config = Object.assign({}, CONFIG, {nodeCount, processingUnits});

      assert.throws(() => {
        spanner.createInstance(NAME, config);
      }, /Only one of nodeCount or processingUnits can be specified\./);
    });

    it('should accept gaxOptions', done => {
      const cfg = Object.assign({}, CONFIG, {gaxOptions: {}});
      spanner.request = config => {
        assert.strictEqual(config.gaxOpts, cfg.gaxOptions);
        done();
      };
      spanner.createInstance(NAME, cfg, assert.ifError);
    });

    describe('config.nodes', () => {
      it('should rename to nodeCount', () => {
        const config = extend({}, CONFIG, {nodes: 10});
        const stub = sandbox.stub(spanner, 'request');
        spanner.createInstance(NAME, config, assert.ifError);

        const [config_] = stub.lastCall.args;
        const reqOpts = config_.reqOpts;
        assert.strictEqual(reqOpts.instance.nodeCount, config.nodes);
        assert.strictEqual(reqOpts.instance.nodes, undefined);
      });
    });

    describe('config.config', () => {
      it('should format a name', done => {
        const name = 'config-name';
        const config = extend({}, CONFIG, {config: name});
        const originalConfig = extend({}, config);
        spanner.request = config_ => {
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

    describe('error', () => {
      const ERROR = new Error('Error.');
      const API_RESPONSE = {};

      beforeEach(() => {
        spanner.request = (config, callback) => {
          callback(ERROR, null, API_RESPONSE);
        };
      });

      it('should execute callback with error & API response', done => {
        spanner.createInstance(NAME, CONFIG, (err, instance, op, resp) => {
          assert.strictEqual(err, ERROR);
          assert.strictEqual(instance, null);
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
        spanner.request = (config, callback) => {
          callback(null, OPERATION, API_RESPONSE);
        };
      });

      it('should create an Instance and return an Operation', done => {
        const formattedName = 'formatted-name';
        sandbox.stub(FakeInstance, 'formatName_').returns(formattedName);
        const fakeInstanceInstance = {} as spnr.Instance;
        const instanceStub = sandbox
          .stub(spanner, 'instance')
          .returns(fakeInstanceInstance);

        spanner.createInstance(NAME, CONFIG, (err, instance, op, resp) => {
          assert.ifError(err);
          const [instanceName] = instanceStub.lastCall.args;
          assert.strictEqual(instanceName, formattedName);
          assert.strictEqual(instance, fakeInstanceInstance);
          assert.strictEqual(op, OPERATION);
          assert.strictEqual(resp, API_RESPONSE);
          done();
        });
      });
    });
  });

  describe('getInstances', () => {
    const OPTIONS: GetInstancesOptions = {
      filter: 'b',
    };
    const ORIGINAL_OPTIONS = extend({}, OPTIONS);

    beforeEach(() => {
      spanner.request = util.noop;
    });

    it('should make the correct request', done => {
      const expectedReqOpts = extend({}, OPTIONS, {
        parent: 'projects/' + spanner.projectId,
      });

      spanner.request = config => {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstances');

        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.reqOpts, OPTIONS);
        assert.deepStrictEqual(OPTIONS, ORIGINAL_OPTIONS);

        assert.deepStrictEqual(config.gaxOpts, {});
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        done();
      };

      spanner.getInstances(OPTIONS as GetInstancesOptions, assert.ifError);
    });

    it('should pass pageSize and pageToken from gaxOptions into reqOpts', done => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const options = Object.assign({}, OPTIONS, {gaxOptions});
      const expectedReqOpts = extend(
        {},
        OPTIONS,
        {
          parent: 'projects/' + spanner.projectId,
        },
        {pageSize: gaxOptions.pageSize, pageToken: gaxOptions.pageToken}
      );
      const expectedGaxOpts = {timeout: 1000};

      spanner.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        done();
      };

      spanner.getInstances(options, assert.ifError);
    });

    it('pageSize and pageToken in options should take precedence over gaxOptions', done => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};

      const optionsPageSize = 5;
      const optionsPageToken = 'optionsToken';
      const options = Object.assign({}, OPTIONS, {
        pageSize: optionsPageSize,
        pageToken: optionsPageToken,
        gaxOptions,
      });
      const expectedReqOpts = extend(
        {},
        OPTIONS,
        {
          parent: 'projects/' + spanner.projectId,
        },
        {pageSize: optionsPageSize, pageToken: optionsPageToken}
      );

      const expectedGaxOpts = {timeout: 1000};

      spanner.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        done();
      };

      spanner.getInstances(options, assert.ifError);
    });

    it('should not require options', done => {
      spanner.request = config => {
        assert.deepStrictEqual(config.reqOpts, {
          parent: 'projects/' + spanner.projectId,
        });

        assert.deepStrictEqual(config.gaxOpts, {});

        done();
      };

      spanner.getInstances(assert.ifError);
    });

    describe('error', () => {
      const GAX_RESPONSE_ARGS = [new Error('Error.'), null, null, {}];

      beforeEach(() => {
        spanner.request = (config, callback) => {
          callback(...GAX_RESPONSE_ARGS);
        };
      });

      it('should execute callback with original arguments', done => {
        spanner.getInstances(OPTIONS as GetInstancesOptions, (...args) => {
          assert.deepStrictEqual(args, GAX_RESPONSE_ARGS);
          done();
        });
      });
    });

    describe('success', () => {
      const INSTANCES = [
        {
          name: 'instance-name',
        },
      ];

      const GAX_RESPONSE_ARGS = [null, INSTANCES, null, {}];

      beforeEach(() => {
        spanner.request = (config, callback) => {
          callback(...GAX_RESPONSE_ARGS);
        };
      });

      it('should create and return Instance objects', done => {
        const fakeInstanceInstance = {} as spnr.Instance;

        spanner.instance = name => {
          assert.strictEqual(name, INSTANCES[0].name);
          return fakeInstanceInstance;
        };

        spanner.getInstances(OPTIONS as GetInstancesOptions, (...args) => {
          assert.ifError(args[0]);
          assert.strictEqual(args[0], GAX_RESPONSE_ARGS[0]);
          const instance = args[1]!.pop();
          assert.strictEqual(instance, fakeInstanceInstance);
          assert.strictEqual(instance!.metadata, GAX_RESPONSE_ARGS[1]![0]);
          assert.strictEqual(args[2], GAX_RESPONSE_ARGS[2]);
          assert.strictEqual(args[3], GAX_RESPONSE_ARGS[3]);
          done();
        });
      });

      it('should return a complete nextQuery object', done => {
        const pageSize = 1;
        const filter = 'filter';
        const NEXTPAGEREQUEST = {
          parent: 'projects/' + spanner.projectId,
          pageSize,
          filter,
          pageToken: 'pageToken',
        };
        const GAX_RESPONSE_ARGS = [null, [], NEXTPAGEREQUEST, {}];

        const GETINSTANCESOPTIONS = {
          pageSize,
          filter,
          gaxOptions: {timeout: 1000, autoPaginate: false},
        };
        const EXPECTEDNEXTQUERY = extend(
          {},
          GETINSTANCESOPTIONS,
          NEXTPAGEREQUEST
        );
        spanner.request = (config, callback) => {
          callback(...GAX_RESPONSE_ARGS);
        };
        function callback(err, instances, nextQuery) {
          assert.deepStrictEqual(nextQuery, EXPECTEDNEXTQUERY);
          done();
        }
        spanner.getInstances(GETINSTANCESOPTIONS, callback);
      });
    });
  });

  describe('getInstancesStream', () => {
    const OPTIONS: GetInstancesOptions = {
      filter: 'b',
    };
    const ORIGINAL_OPTIONS = extend({}, OPTIONS);
    const returnValue = {};

    it('should make and return the correct gax API call', () => {
      const expectedReqOpts = extend({}, OPTIONS, {
        parent: 'projects/' + spanner.projectId,
      });

      spanner.requestStream = config => {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstancesStream');

        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.reqOpts, OPTIONS);
        assert.deepStrictEqual(OPTIONS, ORIGINAL_OPTIONS);

        assert.deepStrictEqual(config.gaxOpts, {});
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);
        return returnValue as Duplex;
      };

      const returnedValue = spanner.getInstancesStream(OPTIONS);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should pass pageSize and pageToken from gaxOptions into reqOpts', () => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const options = {gaxOptions};
      const expectedReqOpts = extend(
        {},
        {
          parent: 'projects/' + spanner.projectId,
        },
        {pageSize: gaxOptions.pageSize, pageToken: gaxOptions.pageToken}
      );
      const expectedGaxOpts = {timeout: 1000};

      spanner.requestStream = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        return returnValue;
      };

      const returnedValue = spanner.getInstancesStream(options);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('pageSize and pageToken in options should take precedence over gaxOptions', () => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};

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
          parent: 'projects/' + spanner.projectId,
        },
        {pageSize: optionsPageSize, pageToken: optionsPageToken}
      );
      const expectedGaxOpts = {timeout: 1000};

      spanner.requestStream = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        return returnValue;
      };

      const returnedValue = spanner.getInstancesStream(options);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should not require options', () => {
      spanner.requestStream = config => {
        assert.deepStrictEqual(config.reqOpts, {
          parent: 'projects/' + spanner.projectId,
        });

        assert.deepStrictEqual(config.gaxOpts, {});

        return returnValue;
      };

      const returnedValue = spanner.getInstancesStream();
      assert.strictEqual(returnedValue, returnValue);
    });
  });

  describe('getInstanceConfigs', () => {
    beforeEach(() => {
      spanner.request = util.noop;
    });

    it('should make and return the correct request', () => {
      const options: GetInstanceConfigsOptions = {
        pageSize: 5,
        gaxOptions: {autoPaginate: false},
      };
      const expectedQuery = extend({}, options, {
        parent: 'projects/' + spanner.projectId,
      });
      delete expectedQuery.gaxOptions;

      function callback() {}

      const returnValue = {};

      spanner.request = config => {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstanceConfigs');

        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, expectedQuery);
        assert.notStrictEqual(reqOpts, options);

        const gaxOpts = config.gaxOpts;
        assert.deepStrictEqual(gaxOpts, options.gaxOptions);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        return returnValue;
      };

      const returnedValue = spanner.getInstanceConfigs(options, callback);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should pass pageSize and pageToken from gaxOptions into reqOpts', done => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const options = Object.assign({}, OPTIONS, {gaxOptions});
      const expectedReqOpts = extend(
        {},
        OPTIONS,
        {
          parent: 'projects/' + spanner.projectId,
        },
        {pageSize: gaxOptions.pageSize, pageToken: gaxOptions.pageToken}
      );
      const expectedGaxOpts = {timeout: 1000};

      spanner.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        done();
      };

      spanner.getInstanceConfigs(options, assert.ifError);
    });

    it('pageSize and pageToken in options should take precedence over gaxOptions', done => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};

      const optionsPageSize = 5;
      const optionsPageToken = 'optionsToken';
      const options = Object.assign({}, OPTIONS, {
        pageSize: optionsPageSize,
        pageToken: optionsPageToken,
        gaxOptions,
      });
      const expectedReqOpts = extend(
        {},
        OPTIONS,
        {
          parent: 'projects/' + spanner.projectId,
        },
        {pageSize: optionsPageSize, pageToken: optionsPageToken}
      );
      const expectedGaxOpts = {timeout: 1000};

      spanner.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        done();
      };

      spanner.getInstanceConfigs(options, assert.ifError);
    });

    it('should not require options', done => {
      spanner.request = config => {
        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, {
          parent: 'projects/' + spanner.projectId,
        });
        assert.deepStrictEqual(config.gaxOpts, {});

        done();
      };

      spanner.getInstanceConfigs(assert.ifError);
    });

    it('should return a complete nextQuery object', done => {
      const pageSize = 1;
      const filter = 'filter';
      const NEXTPAGEREQUEST = {
        parent: 'projects/' + spanner.projectId,
        pageSize,
        filter,
        pageToken: 'pageToken',
      };
      const RESPONSE = [null, [], NEXTPAGEREQUEST, {}];

      const GETINSTANCECONFIGSOPTIONS = {
        pageSize,
        filter,
        gaxOptions: {timeout: 1000, autoPaginate: false},
      };
      const EXPECTEDNEXTQUERY = extend(
        {},
        GETINSTANCECONFIGSOPTIONS,
        NEXTPAGEREQUEST
      );
      spanner.request = (config, callback) => {
        callback(...RESPONSE);
      };
      function callback(err, instanceConfigs, nextQuery) {
        assert.deepStrictEqual(nextQuery, EXPECTEDNEXTQUERY);
        done();
      }
      spanner.getInstanceConfigs(GETINSTANCECONFIGSOPTIONS, callback);
    });
  });

  describe('getInstanceConfigsStream', () => {
    beforeEach(() => {
      spanner.requestStream = util.noop;
    });

    const OPTIONS = {
      gaxOptions: {autoPaginate: false},
    };
    const returnValue = {};

    it('should make and return the correct gax API call', () => {
      const expectedOptions = extend({}, OPTIONS, {
        parent: 'projects/' + spanner.projectId,
      });
      delete expectedOptions.gaxOptions;
      const returnValue = {};

      spanner.requestStream = config => {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstanceConfigsStream');

        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, expectedOptions);
        assert.notStrictEqual(reqOpts, OPTIONS);

        assert.deepStrictEqual(config.gaxOpts, OPTIONS.gaxOptions);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        return returnValue;
      };

      const returnedValue = spanner.getInstanceConfigsStream(
        OPTIONS as GetInstanceConfigsOptions
      );
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should not require options', () => {
      const expectedOptions = {
        parent: 'projects/' + spanner.projectId,
      };
      const returnValue = {};

      spanner.requestStream = config => {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'listInstanceConfigsStream');

        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, expectedOptions);

        assert.deepStrictEqual(config.gaxOpts, {});

        return returnValue;
      };
      const returnedValue = spanner.getInstanceConfigsStream();
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should pass pageSize and pageToken from gaxOptions into reqOpts', () => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};
      const options = {gaxOptions};
      const expectedReqOpts = extend(
        true,
        {},
        options,
        {
          parent: 'projects/' + spanner.projectId,
        },
        {pageSize: gaxOptions.pageSize, pageToken: gaxOptions.pageToken}
      );
      delete expectedReqOpts.gaxOptions;
      const expectedGaxOpts = {timeout: 1000};

      spanner.requestStream = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        return returnValue;
      };

      const returnedValue = spanner.getInstanceConfigsStream(options);
      assert.strictEqual(returnedValue, returnValue);
    });

    it('pageSize and pageToken in options should take precedence over gaxOptions', () => {
      const pageSize = 3;
      const pageToken = 'token';
      const gaxOptions = {pageSize, pageToken, timeout: 1000};

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
        OPTIONS,
        {
          parent: 'projects/' + spanner.projectId,
        },
        {pageSize: optionsPageSize, pageToken: optionsPageToken}
      );
      delete expectedReqOpts.gaxOptions;
      const expectedGaxOpts = {timeout: 1000};

      spanner.request = config => {
        assert.deepStrictEqual(config.reqOpts, expectedReqOpts);
        assert.notStrictEqual(config.gaxOpts, gaxOptions);
        assert.notDeepStrictEqual(config.gaxOpts, gaxOptions);
        assert.deepStrictEqual(config.gaxOpts, expectedGaxOpts);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        return returnValue;
      };

      const returnedValue = spanner.getInstanceConfigs(options, assert.ifError);
      assert.strictEqual(returnedValue, returnValue);
    });
  });

  describe('getInstanceConfig', () => {
    beforeEach(() => {
      spanner.request = util.noop;
    });

    it('should make and return the correct request', () => {
      const options: GetInstanceConfigOptions = {
        gaxOptions: {timeout: 5},
      };
      const expectedReqOpts = {
        name: `projects/${spanner.projectId}/instanceConfigs/nam1`,
      };

      function callback() {}

      const returnValue = {};

      spanner.request = config => {
        assert.strictEqual(config.client, 'InstanceAdminClient');
        assert.strictEqual(config.method, 'getInstanceConfig');

        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, expectedReqOpts);
        assert.notStrictEqual(reqOpts, options);

        const gaxOpts = config.gaxOpts;
        assert.deepStrictEqual(gaxOpts, options.gaxOptions);
        assert.deepStrictEqual(config.headers, spanner.resourceHeader_);

        return returnValue;
      };

      const returnedValue = spanner.getInstanceConfig(
        'nam1',
        options,
        callback
      );
      assert.strictEqual(returnedValue, returnValue);
    });

    it('should not require options', done => {
      spanner.request = config => {
        const reqOpts = config.reqOpts;
        assert.deepStrictEqual(reqOpts, {
          name: `projects/${spanner.projectId}/instanceConfigs/nam1`,
        });
        assert.deepStrictEqual(config.gaxOpts, {});

        done();
      };

      spanner.getInstanceConfig('nam1', assert.ifError);
    });
  });

  describe('instance', () => {
    const NAME = 'instance-name';

    it('should throw if a name is not provided', () => {
      assert.throws(() => {
        spanner.instance(null!);
      }, /A name is required to access an Instance object\./);
    });

    it('should create and cache an Instance', () => {
      const cache = spanner.instances_;
      assert.strictEqual(cache.has(NAME), false);

      const instance = spanner.instance(NAME)!;
      assert(instance instanceof FakeInstance);
      assert.strictEqual(getFake(instance).calledWith_[0], spanner);
      assert.strictEqual(getFake(instance).calledWith_[1], NAME);
      assert.strictEqual(instance, cache.get(NAME));
    });

    it('should re-use cached objects', () => {
      const cache = spanner.instances_;
      const fakeInstance = {} as spnr.Instance;
      cache.set(NAME, fakeInstance);

      const instance = spanner.instance(NAME);
      assert.strictEqual(instance, fakeInstance);
    });
  });

  describe('prepareGapicRequest_', () => {
    const PROJECT_ID = 'project-id';
    const CONFIG = {
      client: 'SpannerClient',
      method: 'methodName',
      reqOpts: {
        a: 'b',
        c: 'd',
      },
      gaxOpts: {},
      headers: {
        [CLOUD_RESOURCE_HEADER]: 'header',
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FAKE_GAPIC_CLIENT: any = {
      [CONFIG.method]: util.noop,
    };

    beforeEach(() => {
      FAKE_GAPIC_CLIENT[CONFIG.method] = util.noop;

      asAny(spanner).auth.getProjectId = callback => {
        callback(null, PROJECT_ID);
      };

      fakeV1[CONFIG.client] = class {
        constructor() {
          return FAKE_GAPIC_CLIENT;
        }
      };
    });

    it('should get the project ID from google-auth-library', done => {
      asAny(spanner).auth.getProjectId = () => {
        done();
      };

      spanner.prepareGapicRequest_(CONFIG, assert.ifError);
    });

    it('should return an error from google-auth-library', done => {
      const error = new Error('Error.');

      asAny(spanner).auth.getProjectId = callback => {
        callback(error);
      };

      spanner.prepareGapicRequest_(CONFIG, err => {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should create and cache a gapic client', done => {
      fakeV1[CONFIG.client] = class {
        constructor(options) {
          assert.strictEqual(options, spanner.options);

          setImmediate(() => {
            const cachedClient = spanner.clients_.get(CONFIG.client);
            assert.strictEqual(cachedClient, FAKE_GAPIC_CLIENT);
            done();
          });

          return FAKE_GAPIC_CLIENT;
        }
      };
      spanner.prepareGapicRequest_(CONFIG, assert.ifError);
    });

    it('should re-use a cached gapic client', () => {
      fakeV1[CONFIG.client] = () => {
        throw new Error('Should not have re-created client!');
      };
      spanner.clients_.set(CONFIG.client, FAKE_GAPIC_CLIENT);
      spanner.prepareGapicRequest_(CONFIG, assert.ifError);
    });

    it('should replace project ID tokens within the reqOpts', done => {
      const replacedReqOpts = {};

      replaceProjectIdTokenOverride = (reqOpts, projectId) => {
        if (typeof reqOpts === 'object') {
          assert.deepStrictEqual(reqOpts, CONFIG.reqOpts);
          assert.notStrictEqual(reqOpts, CONFIG.reqOpts);
        }
        assert.strictEqual(projectId, PROJECT_ID);
        return replacedReqOpts;
      };

      FAKE_GAPIC_CLIENT[CONFIG.method] = reqOpts => {
        assert.strictEqual(reqOpts, replacedReqOpts);
        done();
      };

      spanner.prepareGapicRequest_(CONFIG, (err, requestFn) => {
        requestFn(); // (FAKE_GAPIC_CLIENT[CONFIG.method])
      });
    });

    it('should return the gax client method with correct args', done => {
      replaceProjectIdTokenOverride = reqOpts => {
        return reqOpts;
      };
      const expectedGaxOpts = extend(true, {}, CONFIG.gaxOpts, {
        otherArgs: {
          headers: CONFIG.headers,
        },
      });

      FAKE_GAPIC_CLIENT[CONFIG.method] = function (reqOpts, gaxOpts, arg) {
        assert.strictEqual(this, FAKE_GAPIC_CLIENT);
        assert.deepStrictEqual(reqOpts, CONFIG.reqOpts);
        assert.notStrictEqual(reqOpts, CONFIG.reqOpts);
        assert.deepStrictEqual(gaxOpts, expectedGaxOpts);
        arg(); // done()
      };

      spanner.prepareGapicRequest_(CONFIG, (err, requestFn) => {
        requestFn(done); // (FAKE_GAPIC_CLIENT[CONFIG.method])
      });
    });
  });

  describe('request', () => {
    const CONFIG = {};

    beforeEach(() => {
      spanner.prepareGapicRequest_ = util.noop;
    });

    describe('callback mode', () => {
      it('should not return a promise', () => {
        const returnedValue = spanner.request(CONFIG, assert.ifError);
        assert.strictEqual(returnedValue, undefined);
      });

      it('should prepare the gapic request', done => {
        spanner.prepareGapicRequest_ = config => {
          assert.strictEqual(config, CONFIG);
          done();
        };

        spanner.request(CONFIG, assert.ifError);
      });

      it('should execute callback with error', done => {
        const error = new Error('Error.');

        spanner.prepareGapicRequest_ = (config, callback) => {
          callback(error);
        };

        spanner.request(CONFIG, err => {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should pass callback to request function', done => {
        function gapicRequestFn(callback) {
          callback(); // done()
        }

        spanner.prepareGapicRequest_ = (config, callback) => {
          callback(null, gapicRequestFn);
        };

        spanner.request(CONFIG, done);
      });
    });

    describe('promise mode', () => {
      it('should return a promise', () => {
        const returnedValue = spanner.request(CONFIG);
        assert(returnedValue instanceof Promise);
      });

      it('should prepare the gapic request', done => {
        spanner.prepareGapicRequest_ = config => {
          assert.strictEqual(config, CONFIG);
          done();
        };

        spanner.request(CONFIG);
      });

      it('should reject the promise', done => {
        const error = new Error('Error.');

        spanner.prepareGapicRequest_ = (config, callback) => {
          callback(error);
        };

        spanner.request(CONFIG).catch(err => {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should resolve the promise with the request fn', () => {
        const gapicRequestFnResult = {};

        function gapicRequestFn() {
          return gapicRequestFnResult;
        }

        spanner.prepareGapicRequest_ = (config, callback) => {
          callback(null, gapicRequestFn);
        };

        return spanner.request(CONFIG).then(result => {
          assert.strictEqual(result, gapicRequestFnResult);
        });
      });
    });
  });

  describe('requestStream', () => {
    const CONFIG = {};

    beforeEach(() => {
      spanner.prepareGapicRequest_ = util.noop;
    });

    it('should prepare the gapic request', done => {
      spanner.prepareGapicRequest_ = config => {
        assert.strictEqual(config, CONFIG);
        done();
      };

      spanner.requestStream(CONFIG).emit('reading');
    });

    it('should destroy the stream with an error', done => {
      const error = new Error('Error.');

      spanner.prepareGapicRequest_ = (config, callback) => {
        callback(error);
      };

      spanner
        .requestStream(CONFIG)
        .on('error', err => {
          assert.strictEqual(err, error);
          done();
        })
        .emit('reading');
    });

    it('should pipe the request stream to the user stream', done => {
      const requestStream = through.obj();
      const data = {};

      spanner.prepareGapicRequest_ = (config, callback) => {
        callback(null, () => {
          setImmediate(() => {
            requestStream.end(data);
          });

          return requestStream;
        });
      };

      spanner
        .requestStream(CONFIG)
        .on('data', data_ => {
          assert.strictEqual(data_, data);
          done();
        })
        .emit('reading');
    });

    it('should pass errors from the request stream', done => {
      const requestStream = through.obj();
      const error = new Error('Error.');

      spanner.prepareGapicRequest_ = (config, callback) => {
        callback(null, () => {
          setImmediate(() => {
            requestStream.destroy(error);
          });

          return requestStream;
        });
      };

      spanner
        .requestStream(CONFIG)
        .on('error', err => {
          assert.strictEqual(err, error);
          done();
        })
        .emit('reading');
    });
  });
});
