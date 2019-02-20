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

import {Service, Operation} from '@google-cloud/common-grpc';
import {paginator} from '@google-cloud/paginator';
import {replaceProjectIdToken} from '@google-cloud/projectify';
import {promisifyAll} from '@google-cloud/promisify';
import * as extend from 'extend';
import {GoogleAuth, GoogleAuthOptions} from 'google-auth-library';
import * as is from 'is';
import * as path from 'path';
import * as streamEvents from 'stream-events';
import * as through from 'through2';
import {GrpcServiceConfig} from '@google-cloud/common-grpc/build/src/service';
import {codec} from './codec';
import {Database} from './database';
import {Instance} from './instance';
import {Session} from './session';
import {SessionPool} from './session-pool';
import {Table} from './table';
import {PartitionedDml, Snapshot, Transaction} from './transaction';

// Import the clients for each version supported by this package.
const gapic = Object.freeze({
  v1: require('./v1'),
});

const gcpApiConfig = require('./spanner_grpc_config.json');

/*!
 * DO NOT DELETE THE FOLLOWING NAMESPACE DEFINITIONS
 */
/**
 * @namespace google
 */
/**
 * @namespace google.iam
 */
/**
 * @namespace google.iam.v1
 */
/**
 * @namespace google.protobuf
 */
/**
 * @namespace google.rpc
 */
/**
 * @namespace google.longrunning
 */
/**
 * @namespace google.spanner
 */
/**
 * @namespace google.spanner.admin
 */
/**
 * @namespace google.spanner.admin.database.v1
 */
/**
 * @namespace google.spanner.admin.instance.v1
 */
/**
 * @namespace google.spanner.database
 */
/**
 * @namespace google.spanner.database.v1
 */
/**
 * @namespace google.spanner.instance
 */
/**
 * @namespace google.spanner.instance.v1
 */
/**
 * @namespace google.spanner.v1
 */
/**
 * @typedef {array} BasicResponse
 * @property {object} 0 The full API response.
 */
/**
 * @callback BasicCallback
 * @param {?Error} err Request error, if any.
 * @param {object} apiResponse The full API response.
 */
/**
 * @typedef {array} LongRunningOperationResponse
 * @property {Operation} 0 An {@link Operation} object that can be used to check
 *     the status of the request.
 * @property {object} 1 The full API response.
 */
/**
 * @callback LongRunningOperationCallback
 * @param {?Error} err Request error, if any.
 * @param {Operation} operation An {@link Operation} object that can be used to
 *     check the status of the request.
 * @param {object} apiResponse The full API response.
 */
/**
 * @typedef {object} ClientConfig
 * @property {string} [projectId] The project ID from the Google Developer's
 *     Console, e.g. 'grape-spaceship-123'. We will also check the environment
 *     variable `GCLOUD_PROJECT` for your project ID. If your app is running in
 *     an environment which supports {@link
 * https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application
 * Application Default Credentials}, your project ID will be detected
 * automatically.
 * @property {string} [keyFilename] Full path to the a .json, .pem, or .p12 key
 *     downloaded from the Google Developers Console. If you provide a path to a
 *     JSON file, the `projectId` option above is not necessary. NOTE: .pem and
 *     .p12 require you to specify the `email` option as well.
 * @property {string} [email] Account email address. Required when using a .pem
 *     or .p12 keyFilename.
 * @property {object} [credentials] Credentials object.
 * @property {string} [credentials.client_email]
 * @property {string} [credentials.private_key]
 * @property {boolean} [autoRetry=true] Automatically retry requests if the
 *     response is related to rate limits or certain intermittent server errors.
 *     We will exponentially backoff subsequent requests by default.
 * @property {number} [maxRetries=3] Maximum number of automatic retries
 *     attempted before returning the error.
 * @property {Constructor} [promise] Custom promise module to use instead of
 *     native Promises.
 */
/**
 * [Cloud Spanner](https://cloud.google.com/spanner) is a highly scalable,
 * transactional, managed, NewSQL database service. Cloud Spanner solves the
 * need for a horizontally-scaling database with consistent global transaction
 * and SQL semantics. With Cloud Spanner you don't need to choose between
 * consistency and horizontal scaling — you get both.
 *
 * @class
 *
 * @see [Cloud Spanner Documentation](https://cloud.google.com/spanner/docs)
 * @see [Cloud Spanner Concepts](https://cloud.google.com/spanner/docs/concepts)
 *
 * @example <caption>Install the client library with <a
 * href="https://www.npmjs.com/">npm</a>:</caption> npm install --save
 * @google-cloud/spanner
 *
 * @example <caption>Create a client that uses <a
 * href="https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application">Application
 * Default Credentials (ADC)</a>:</caption> const client = new Spanner();
 *
 * @example <caption>Create a client with <a
 * href="https://cloud.google.com/docs/authentication/production#obtaining_and_providing_service_account_credentials_manually">explicit
 * credentials</a>:</caption> const client = new Spanner({ projectId:
 * 'your-project-id', keyFilename: '/path/to/keyfile.json'
 * });
 *
 * @example <caption>include:samples/quickstart.js</caption>
 * region_tag:spanner_quickstart
 * Full quickstart example:
 *
 * @param {ClientConfig} [options] Configuration options.
 */
class Spanner extends Service {
  options: GoogleAuthOptions;
  auth: GoogleAuth;
  clients_: Map<string, {}>;
  instances_: Map<string, {}>;
  getInstancesStream: Function;

  /**
   * Placeholder used to auto populate a column with the commit timestamp.
   * This can only be used for timestamp columns that have set the option
   * "(allow_commit_timestamp=true)" in the schema.
   *
   * @type {string}
   */
  static COMMIT_TIMESTAMP = 'spanner.commit_timestamp()';

  constructor(options) {
    const scopes: Array<{}> = [];
    const clientClasses = [
      gapic.v1.DatabaseAdminClient,
      gapic.v1.InstanceAdminClient,
      gapic.v1.SpannerClient,
    ];
    for (const clientClass of clientClasses) {
      for (const scope of clientClass.scopes) {
        if (scopes.indexOf(scope) === -1) {
          scopes.push(scope);
        }
      }
    }
    options = extend(
      {
        libName: 'gccl',
        libVersion: require('../../package.json').version,
        scopes,
      },
      options || {}
    );

    // Enable grpc-gcp support
    options = Object.assign({'grpc_gcp.apiConfig': gcpApiConfig}, options);

    const config = ({
      baseUrl: options.servicePath || gapic.v1.SpannerClient.servicePath,
      protosDir: path.resolve(__dirname, '../protos'),
      protoServices: {
        Operations: {
          path: 'google/longrunning/operations.proto',
          service: 'longrunning',
        },
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      packageJson: require('../../package.json'),
    } as {}) as GrpcServiceConfig;
    super(config, options);
    this.options = options;
    this.auth = new GoogleAuth(this.options);
    this.clients_ = new Map();
    this.instances_ = new Map();

    /**
     * Get a list of {@link Instance} objects as a readable object stream.
     *
     * Wrapper around {@link v1.InstanceAdminClient#listInstances}.
     *
     * @see {@link v1.InstanceAdminClient#listInstances}
     * @see [ListInstances API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.ListInstances)
     *
     * @method Spanner#getInstancesStream
     * @param {GetInstancesRequest} [query] Query object for listing instances.
     * @returns {ReadableStream} A readable stream that emits {@link Instance}
     *     instances.
     *
     * @example
     * const {Spanner} = require('@google-cloud/spanner');
     * const spanner = new Spanner();
     *
     * spanner.getInstancesStream()
     *   .on('error', console.error)
     *   .on('data', function(instance) {
     *     // `instance` is an `Instance` object.
     *   })
     *   .on('end', function() {
     *     // All instances retrieved.
     *   });
     *
     * //-
     * // If you anticipate many results, you can end a stream early to prevent
     * // unnecessary processing and API requests.
     * //-
     * spanner.getInstancesStream()
     *   .on('data', function(instance) {
     *     this.end();
     *   });
     */
    this.getInstancesStream = paginator.streamify('getInstances');
  }

  /**
   * Config for the new instance.
   *
   * @typedef {object} CreateInstanceRequest
   * @property {string} config The name of the instance's configuration.
   * @property {number} nodes The number of nodes allocated to this instance.
   */
  /**
   * @typedef {array} CreateInstanceResponse
   * @property {Instance} 0 The new {@link Instance}.
   * @property {Operation} 1 An {@link Operation} object that can be used to check
   *     the status of the request.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback CreateInstanceCallback
   * @param {?Error} err Request error, if any.
   * @param {Instance} instance The new {@link Instance}.
   * @param {Operation} operation An {@link Operation} object that can be used to
   *     check the status of the request.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Create an instance.
   *
   * Wrapper around {@link v1.InstanceAdminClient#createInstance}.
   *
   * @see {@link v1.InstanceAdminClient#createInstance}
   * @see [CreateInstace API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.CreateInstance)
   *
   * @throws {Error} If a name is not provided.
   * @throws {Error} If a configuration object is not provided.
   *
   * @param {string} name The name of the instance to be created.
   * @param {CreateInstanceRequest} config Configuration object.
   * @param {CreateInstanceCallback} [callback] Callback function.
   * @returns {Promise<CreateInstanceResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const config = {
   *   config: 'regional-us-central1',
   *   nodes: 1
   * };
   *
   * function callback(err, instance, operation, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   operation
   *     .on('error', function(err) {})
   *     .on('complete', function() {
   *       // Instance created successfully.
   *     });
   * }
   *
   * spanner.createInstance('new-instance-name', config, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * spanner.createInstance('new-instance-name', config)
   *   .then(function(data) {
   *     const instance = data[0];
   *     const operation = data[1];
   *     return operation.promise();
   *   })
   *   .then(function() {
   *     // Instance created successfully.
   *   });
   */
  createInstance(name: string, config?, callback?) {
    if (!name) {
      throw new Error('A name is required to create an instance.');
    }
    if (!config) {
      throw new Error(
        ['A configuration object is required to create an instance.'].join('')
      );
    }
    const formattedName = Instance.formatName_(this.projectId, name);
    const shortName = formattedName.split('/').pop();
    const reqOpts = {
      parent: 'projects/' + this.projectId,
      instanceId: shortName,
      instance: extend(
        {
          name: formattedName,
          displayName: shortName,
        },
        config
      ),
    };
    if (is.defined(config.nodes)) {
      reqOpts.instance.nodeCount = config.nodes;
      delete reqOpts.instance.nodes;
    }
    if (config.config && config.config.indexOf('/') === -1) {
      reqOpts.instance.config = `projects/${this.projectId}/instanceConfigs/${
        config.config
      }`;
    }
    this.request(
      {
        client: 'InstanceAdminClient',
        method: 'createInstance',
        reqOpts,
      },
      (err, operation, resp) => {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        const instance = this.instance(formattedName);
        callback(null, instance, operation, resp);
      }
    );
  }

  /**
   * Query object for listing instances.
   *
   * @typedef {object} GetInstancesRequest
   * @property {boolean} [autoPaginate=true] Have pagination handled
   *     automatically.
   * @property {string} [filter] An expression for filtering the results of the
   *     request. Filter rules are case insensitive. The fields eligible for
   *     filtering are:
   *     - **`name`**
   *     - **`display_name`**
   *     - **`labels.key`** where key is the name of a label
   *
   *     Some examples of using filters are:
   *     - **`name:*`** The instance has a name.
   *     - **`name:Howl`** The instance's name is howl.
   *     - **`labels.env:*`** The instance has the label env.
   *     - **`labels.env:dev`** The instance's label env has the value dev.
   *     - **`name:howl labels.env:dev`** The instance's name is howl and it has
   *       the label env with value dev.
   * @property {number} [maxApiCalls] Maximum number of API calls to make.
   * @property {number} [maxResults] Maximum number of items to return.
   * @property {number} [pageSize] Maximum number of results per page.
   * @property {string} [pageToken] A previously-returned page token
   *     representing part of the larger set of results to view.
   */
  /**
   * @typedef {array} GetInstancesResponse
   * @property {Instance[]} 0 Array of {@link Instance} instances.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetInstancesCallback
   * @param {?Error} err Request error, if any.
   * @param {Instance[]} instances Array of {@link Instance} instances.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get a list of instances.
   *
   * Wrapper around {@link v1.InstanceAdminClient#listInstances}.
   *
   * @see {@link v1.InstanceAdminClient#listInstances}
   * @see [ListInstances API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.ListInstances)
   *
   * @param {GetInstancesRequest} [query] Query object for listing instances.
   * @param {GetInstancesCallback} [callback] Callback function.
   * @returns {Promise<GetInstancesResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * spanner.getInstances(function(err, instances) {
   *   // `instances` is an array of `Instance` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, instances, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     spanner.getInstances(nextQuery, callback);
   *   }
   * }
   *
   * spanner.getInstances({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * spanner.getInstances().then(function(data) {
   *   const instances = data[0];
   * });
   */
  getInstances(query, callback?) {
    const self = this;
    if (is.fn(query)) {
      callback = query;
      query = {};
    }
    const reqOpts = extend({}, query, {
      parent: 'projects/' + this.projectId,
    });
    this.request(
      {
        client: 'InstanceAdminClient',
        method: 'listInstances',
        reqOpts,
        gaxOpts: query,
      },
      // tslint:disable-next-line only-arrow-functions
      function(err, instances) {
        if (instances) {
          arguments[1] = instances.map(instance => {
            const instanceInstance = self.instance(instance.name);
            // tslint:disable-next-line no-any
            (instanceInstance as any).metadata = instance;
            return instanceInstance;
          });
        }
        callback.apply(null, arguments);
      }
    );
  }

  /**
   * Query object for listing instance configs.
   *
   * @typedef {object} GetInstanceConfigsRequest
   * @property {boolean} [autoPaginate=true] Have pagination handled
   *     automatically.
   * @property {number} [maxApiCalls] Maximum number of API calls to make.
   * @property {number} [maxResults] Maximum number of items to return.
   * @property {number} [pageSize] Maximum number of results per page.
   * @property {string} [pageToken] A previously-returned page token
   *     representing part of the larger set of results to view.
   */
  /**
   * @typedef {array} GetInstanceConfigsResponse
   * @property {object[]} 0 List of all available instance configs.
   * @property {string} 0.name The unique identifier for the instance config.
   * @property {string} 0.displayName The name of the instance config as it
   *     appears in UIs.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetInstanceConfigsCallback
   * @param {?Error} err Request error, if any.
   * @param {object[]} instanceConfigs List of all available instance configs.
   * @param {string} instanceConfigs.name The unique identifier for the instance
   *     config.
   * @param {string} instanceConfigs.displayName The name of the instance config
   *     as it appears in UIs.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get a list of instance configs.
   *
   * Wrapper around {@link v1.InstanceAdminClient#listInstanceConfigs}.
   *
   * @see {@link v1.InstanceAdminClient#listInstanceConfigs}
   * @see [ListInstanceConfigs API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.ListInstanceConfigs)
   *
   * @param {GetInstanceConfigsRequest} [query] Query object for listing instance
   *     configs.
   * @param {GetInstanceConfigsCallback} [callback] Callback function.
   * @returns {Promise<GetInstanceConfigsResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * spanner.getInstanceConfigs(function(err, instanceConfigs) {
   *   // `instanceConfigs` is an array of instance configuration descriptors.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, instanceConfigs, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     spanner.getInstanceConfigs(nextQuery, callback);
   *   }
   * }
   *
   * spanner.getInstanceConfigs({
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * spanner.getInstanceConfigs().then(function(data) {
   *   const instanceConfigs = data[0];
   * });
   */
  getInstanceConfigs(query, callback?) {
    if (is.fn(query)) {
      callback = query;
      query = {};
    }
    const reqOpts = extend({}, query, {
      parent: 'projects/' + this.projectId,
    });
    return this.request(
      {
        client: 'InstanceAdminClient',
        method: 'listInstanceConfigs',
        reqOpts,
        gaxOpts: query,
      },
      callback
    );
  }

  /**
   * Get a list of instance configs as a readable object stream.
   *
   * Wrapper around {@link v1.InstanceAdminClient#listInstanceConfigsStream}.
   *
   * @see {@link v1.InstanceAdminClient#listInstanceConfigsStream}
   * @see [ListInstanceConfigs API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.ListInstanceConfigs)
   *
   * @method Spanner#getInstanceConfigsStream
   * @param {GetInstanceConfigsRequest} [query] Query object for listing instance
   *     configs.
   * @returns {ReadableStream} A readable stream that emits instance configs.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * spanner.getInstanceConfigsStream()
   *   .on('error', console.error)
   *   .on('data', function(instanceConfig) {})
   *   .on('end', function() {
   *     // All instances retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * spanner.getInstanceConfigsStream()
   *   .on('data', function(instanceConfig) {
   *     this.end();
   *   });
   */
  getInstanceConfigsStream(query) {
    const reqOpts = extend({}, query, {
      parent: 'projects/' + this.projectId,
    });
    return this.requestStream({
      client: 'InstanceAdminClient',
      method: 'listInstanceConfigsStream',
      reqOpts,
      gaxOpts: query,
    });
  }

  /**
   * Get a reference to an Instance object.
   *
   * @throws {Error} If a name is not provided.
   *
   * @param {string} name The name of the instance.
   * @returns {Instance} An Instance object.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   */
  instance(name: string) {
    if (!name) {
      throw new Error('A name is required to access an Instance object.');
    }
    const key = name.split('/').pop()!;
    if (!this.instances_.has(key)) {
      this.instances_.set(key, new Instance(this, name));
    }
    return this.instances_.get(key);
  }

  /**
   * Get a reference to an Operation object.
   *
   * @throws {Error} If a name is not provided.
   *
   * @param {string} name The name of the operation.
   * @returns {Operation} An Operation object.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const operation = spanner.operation('operation-name');
   */
  operation(name) {
    if (!name) {
      throw new Error('A name is required to access an Operation object.');
    }
    // tslint:disable-next-line no-any
    return new Operation(this as any, name);
  }

  /**
   * Prepare a gapic request. This will cache the GAX client and replace
   * {{projectId}} placeholders, if necessary.
   *
   * @private
   *
   * @param {object} config Request config
   * @param {function} callback Callback function
   */
  prepareGapicRequest_(config, callback) {
    this.auth.getProjectId((err, projectId) => {
      if (err) {
        callback(err);
        return;
      }
      const clientName = config.client;
      if (!this.clients_.has(clientName)) {
        this.clients_.set(clientName, new gapic.v1[clientName](this.options));
      }
      const gaxClient = this.clients_.get(clientName)!;
      let reqOpts = extend(true, {}, config.reqOpts);
      reqOpts = replaceProjectIdToken(reqOpts, projectId!);
      const requestFn = gaxClient[config.method].bind(
        gaxClient,
        reqOpts,
        config.gaxOpts
      );
      callback(null, requestFn);
    });
  }

  /**
   * Funnel all API requests through this method to be sure we have a project
   * ID.
   *
   * @param {object} config Configuration object.
   * @param {object} config.gaxOpts GAX options.
   * @param {function} config.method The gax method to call.
   * @param {object} config.reqOpts Request options.
   * @param {function} [callback] Callback function.
   * @returns {Promise}
   */
  // tslint:disable-next-line no-any
  request(config: any, callback?: any): any {
    if (is.fn(callback)) {
      this.prepareGapicRequest_(config, (err, requestFn) => {
        if (err) {
          callback(err);
        } else {
          requestFn(callback);
        }
      });
    } else {
      return new this.Promise((resolve, reject) => {
        this.prepareGapicRequest_(config, (err, requestFn) => {
          if (err) {
            reject(err);
          } else {
            resolve(requestFn());
          }
        });
      });
    }
  }

  /**
   * Funnel all streaming API requests through this method to be sure we have a
   * project ID.
   *
   * @param {object} config Configuration object.
   * @param {object} config.gaxOpts GAX options.
   * @param {function} config.method The gax method to call.
   * @param {object} config.reqOpts Request options.
   * @param {function} [callback] Callback function.
   * @returns {Stream}
   */
  // tslint:disable-next-line no-any
  requestStream(config): any {
    const stream = streamEvents(through.obj());
    stream.once('reading', () => {
      this.prepareGapicRequest_(config, (err, requestFn) => {
        if (err) {
          stream.destroy(err);
          return;
        }
        requestFn()
          .on('error', err => {
            stream.destroy(err);
          })
          .pipe(stream);
      });
    });
    return stream;
  }

  /**
   * Helper function to get a Cloud Spanner Date object.
   *
   * @method Spanner.date
   * @param {string|date} value The date as a string or Date object.
   * @returns {object}
   * @see {@link Spanner#date}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const date = Spanner.date('08-20-1969');
   */
  static date(value?) {
    return new codec.SpannerDate(value);
  }

  /**
   * Helper function to get a Cloud Spanner Float64 object.
   *
   * @method Spanner.float
   * @param {string|number} value The float as a number or string.
   * @returns {object}
   * @see {@link Spanner#float}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const float = Spanner.float(10);
   */
  static float(value) {
    return new codec.Float(value);
  }

  /**
   * Helper function to get a Cloud Spanner Int64 object.
   *
   * @method Spanner.int
   * @param {string|number} value The int as a number or string.
   * @returns {object}
   * @see {@link Spanner#int}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const int = Spanner.int(10);
   */
  static int(value) {
    return new codec.Int(value);
  }

  /**
   * Helper function to get a Cloud Spanner Struct object.
   *
   * @param {object} value The struct as a JSON object.
   * @returns {object}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const struct = Spanner.struct({
   *   user: 'bob',
   *   age: 32
   * });
   */
  static struct(value) {
    if (Array.isArray(value)) {
      return codec.Struct.fromArray(value);
    }
    return codec.Struct.fromJSON(value);
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Spanner, {
  exclude: [
    'date',
    'float',
    'getInstanceConfigs',
    'instance',
    'int',
    'operation',
  ],
});

/**
 * The default export of the `@google-cloud/spanner` package is the
 * {@link Spanner} class.
 *
 * See {@link Spanner} and {@link ClientConfig} for client methods and
 * configuration options.
 *
 * @module {constructor} @google-cloud/spanner
 * @alias nodejs-spanner
 *
 * @example <caption>Install the client library with <a
 * href="https://www.npmjs.com/">npm</a>:</caption> npm install --save
 * @google-cloud/spanner
 *
 * @example <caption>Import the client library</caption>
 * const {Spanner} = require('@google-cloud/spanner');
 *
 * @example <caption>Create a client that uses <a
 * href="https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application">Application
 * Default Credentials (ADC)</a>:</caption> const client = new Spanner();
 *
 * @example <caption>Create a client with <a
 * href="https://cloud.google.com/docs/authentication/production#obtaining_and_providing_service_account_credentials_manually">explicit
 * credentials</a>:</caption> const client = new Spanner({ projectId:
 * 'your-project-id', keyFilename: '/path/to/keyfile.json'
 * });
 *
 * @example <caption>include:samples/quickstart.js</caption>
 * region_tag:spanner_quickstart
 * Full quickstart example:
 */
export {Spanner};

/**
 * {@link Instance} class.
 *
 * @name Spanner.Instance
 * @see Instance
 * @type {Constructor}
 */
export {Instance};

/**
 * {@link Database} class.
 *
 * @name Spanner.Database
 * @see Database
 * @type {Constructor}
 */
export {Database};

/**
 * {@link Session} class.
 *
 * @name Spanner.Session
 * @see Session
 * @type {Constructor}
 */
export {Session};

/**
 * {@link SessionPool} class.
 *
 * @name Spanner.SessionPool
 * @see SessionPool
 * @type {Constructor}
 */
export {SessionPool};

/**
 * {@link Table} class.
 *
 * @name Spanner.Table
 * @see Table
 * @type {Constructor}
 */
export {Table};

/**
 * {@link PartitionedDml} class.
 *
 * @name Spanner.PartitionedDml
 * @see PartitionedDml
 * @type {Constructor}
 */
export {PartitionedDml};

/**
 * {@link Snapshot} class.
 *
 * @name Spanner.Snapshot
 * @see Snapshot
 * @type {Constructor}
 */
export {Snapshot};

/**
 * {@link Transaction} class.
 *
 * @name Spanner.Transaction
 * @see Transaction
 * @type {Constructor}
 */
export {Transaction};

/**
 * @type {object}
 * @property {constructor} DatabaseAdminClient
 *   Reference to {@link v1.DatabaseAdminClient}
 * @property {constructor} InstanceAdminClient
 *   Reference to {@link v1.InstanceAdminClient}
 * @property {constructor} SpannerClient
 *   Reference to {@link v1.SpannerClient}
 */
module.exports.v1 = gapic.v1;

// Alias `module.exports` as `module.exports.default`, for future-proofing.
module.exports.default = Object.assign({}, module.exports);
