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

import {GrpcService, GrpcServiceConfig} from './common-grpc/service';
import {PreciseDate} from '@google-cloud/precise-date';
import {replaceProjectIdToken} from '@google-cloud/projectify';
import {promisifyAll} from '@google-cloud/promisify';
import * as extend from 'extend';
import {GoogleAuth, GoogleAuthOptions} from 'google-auth-library';
import * as path from 'path';
import {common as p} from 'protobufjs';
import * as streamEvents from 'stream-events';
import * as through from 'through2';
import {codec, Float, Int, SpannerDate, Struct} from './codec';
import {Backup} from './backup';
import {Database} from './database';
import {
  Instance,
  CreateInstanceCallback,
  CreateInstanceResponse,
} from './instance';
import {grpc, GrpcClientOptions, CallOptions} from 'google-gax';
import {google as instanceAdmin} from '../protos/protos';
import {
  PagedOptions,
  PagedResponse,
  PagedCallback,
  PagedOptionsWithFilter,
  addResourcePrefixHeader,
} from './common';
import {Session} from './session';
import {SessionPool} from './session-pool';
import {Table} from './table';
import {PartitionedDml, Snapshot, Transaction} from './transaction';
import grpcGcpModule = require('grpc-gcp');
const grpcGcp = grpcGcpModule(grpc);
import * as v1 from './v1';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const gcpApiConfig = require('./spanner_grpc_config.json');

export type IOperation = instanceAdmin.longrunning.IOperation;

export type GetInstancesOptions = PagedOptionsWithFilter;

export type GetInstancesResponse = PagedResponse<
  Instance,
  instanceAdmin.spanner.admin.instance.v1.IListInstancesResponse
>;
export type GetInstancesCallback = PagedCallback<
  Instance,
  instanceAdmin.spanner.admin.instance.v1.IListInstancesResponse
>;

export type GetInstanceConfigsOptions = PagedOptions;
export type GetInstanceConfigsResponse = PagedResponse<
  instanceAdmin.spanner.admin.instance.v1.InstanceConfig,
  instanceAdmin.spanner.admin.instance.v1.IListInstanceConfigsResponse
>;
export type GetInstanceConfigsCallback = PagedCallback<
  instanceAdmin.spanner.admin.instance.v1.InstanceConfig,
  instanceAdmin.spanner.admin.instance.v1.IListInstanceConfigsResponse
>;

export interface SpannerOptions extends GrpcClientOptions {
  apiEndpoint?: string;
  servicePath?: string;
  port?: number;
  sslCreds?: grpc.ChannelCredentials;
}
export interface RequestConfig {
  client: string;
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reqOpts: any;
  gaxOpts?: CallOptions;
}
export interface CreateInstanceRequest {
  config?: string;
  nodes?: number;
  displayName?: string;
  labels?: {[k: string]: string} | null;
  gaxOptions?: CallOptions;
}
/**
 * Translates enum values to string keys.
 *
 * @param E enum type.
 */
export type EnumKey<E extends {[index: string]: unknown}> = keyof E;

/**
 * Translates an enum property of an object from enum value to enum key, leaving
 * all other properties as-is.
 *
 * @param T type containing properties to translate.
 * @param U name of the enum property.
 * @param E enum type to translate.
 */
export type TranslateEnumKeys<
  T,
  U extends keyof T,
  E extends {[index: string]: unknown}
> = {
  [P in keyof T]: P extends U ? EnumKey<E> | null | undefined : T[P];
};

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
class Spanner extends GrpcService {
  options: GoogleAuthOptions;
  auth: GoogleAuth;
  clients_: Map<string, {}>;
  instances_: Map<string, Instance>;

  /**
   * Placeholder used to auto populate a column with the commit timestamp.
   * This can only be used for timestamp columns that have set the option
   * "(allow_commit_timestamp=true)" in the schema.
   *
   * @type {string}
   */
  static COMMIT_TIMESTAMP = 'spanner.commit_timestamp()';

  /**
   * Gets the configured Spanner emulator host from an environment variable.
   */
  static getSpannerEmulatorHost():
    | {endpoint: string; port?: number}
    | undefined {
    const endpointWithPort = process.env.SPANNER_EMULATOR_HOST;
    if (endpointWithPort) {
      if (
        endpointWithPort.startsWith('http:') ||
        endpointWithPort.startsWith('https:')
      ) {
        throw new Error(
          'SPANNER_EMULATOR_HOST must not start with a protocol specification (http/https)'
        );
      }
      const index = endpointWithPort.indexOf(':');
      if (index > -1) {
        const portName = endpointWithPort.substring(index + 1);
        const port = +portName;
        if (!port || port < 1 || port > 65535) {
          throw new Error(`Invalid port number: ${portName}`);
        }
        return {
          endpoint: endpointWithPort.substring(0, index),
          port: +endpointWithPort.substring(index + 1),
        };
      }
      return {endpoint: endpointWithPort};
    }
    return undefined;
  }

  constructor(options?: SpannerOptions) {
    const scopes: Array<{}> = [];
    const clientClasses = [
      v1.DatabaseAdminClient,
      v1.InstanceAdminClient,
      v1.SpannerClient,
    ];
    for (const clientClass of clientClasses) {
      for (const scope of clientClass.scopes) {
        if (scopes.indexOf(scope) === -1) {
          scopes.push(scope);
        }
      }
    }
    options = (Object.assign(
      {
        libName: 'gccl',
        libVersion: require('../../package.json').version,
        scopes,
        // Enable grpc-gcp support
        'grpc.callInvocationTransformer': grpcGcp.gcpCallInvocationTransformer,
        'grpc.channelFactoryOverride': grpcGcp.gcpChannelFactoryOverride,
        'grpc.gcpApiConfig': grpcGcp.createGcpApiConfig(gcpApiConfig),
        grpc,
      },
      options || {}
    ) as {}) as SpannerOptions;
    const emulatorHost = Spanner.getSpannerEmulatorHost();
    if (
      emulatorHost &&
      emulatorHost.endpoint &&
      emulatorHost.endpoint.length > 0
    ) {
      options.servicePath = emulatorHost.endpoint;
      options.port = emulatorHost.port;
      options.sslCreds = grpc.credentials.createInsecure();
    }
    const config = ({
      baseUrl:
        options.apiEndpoint ||
        options.servicePath ||
        v1.SpannerClient.servicePath,
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
  }

  createInstance(
    name: string,
    config: CreateInstanceRequest
  ): Promise<CreateInstanceResponse>;
  createInstance(
    name: string,
    config: CreateInstanceRequest,
    callback: CreateInstanceCallback
  ): void;
  /**
   * Config for the new instance.
   *
   * @typedef {object} CreateInstanceRequest
   * @property {string} config The name of the instance's configuration.
   * @property {number} [nodes=1] The number of nodes allocated to this instance.
   *     Defaults to 1.
   * @property {Object.<string, string>} [labels] Labels are a flexible and
   *     lightweight mechanism for organizing cloud resources into groups that
   *     reflect a customer's organizational needs and deployment strategies.
   *     Cloud Labels can be used to filter collections of resources. They can
   *     be used to control how resource metrics are aggregated. And they can
   *     be used as arguments to policy management rules (e.g. route,
   *     firewall, load balancing, etc.).
   * @property {string} [displayName] The descriptive name for this instance
   *     as it appears in UIs. Must be unique per project and between 4 and 30
   *     characters in length.
   *     Defaults to the instance unique identifier '<instance>' of the full
   *     instance name of the form 'projects/<project>/instances/<instance>'.
   */
  /**
   * @typedef {array} CreateInstanceResponse
   * @property {Instance} 0 The new {@link Instance}.
   * @property {Operation} 1 An operation object that can be used to check
   *     the status of the request.
   * @property {IOperation} 2 The full API response.
   */
  /**
   * @callback CreateInstanceCallback
   * @param {?Error} err Request error, if any.
   * @param {Instance} instance The new {@link Instance}.
   * @param {Operation} operation An operation object that can be used to
   *     check the status of the request.
   * @param {IOperation} apiResponse The full API response.
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
  createInstance(
    name: string,
    config: CreateInstanceRequest,
    callback?: CreateInstanceCallback
  ): void | Promise<CreateInstanceResponse> {
    if (!name) {
      throw new Error('A name is required to create an instance.');
    }
    if (!config) {
      throw new Error(
        ['A configuration object is required to create an instance.'].join('')
      );
    }
    const formattedName = Instance.formatName_(this.projectId, name);
    const displayName = config.displayName || formattedName.split('/').pop();
    const reqOpts = {
      parent: 'projects/' + this.projectId,
      instanceId: formattedName.split('/').pop(),
      instance: extend(
        {
          name: formattedName,
          displayName,
          nodeCount: config.nodes || 1,
        },
        config
      ),
    };

    delete reqOpts.instance.nodes;
    delete reqOpts.instance.gaxOptions;

    if (config.config!.indexOf('/') === -1) {
      reqOpts.instance.config = `projects/${this.projectId}/instanceConfigs/${config.config}`;
    }
    this.request(
      {
        client: 'InstanceAdminClient',
        method: 'createInstance',
        reqOpts,
        gaxOpts: addResourcePrefixHeader(config.gaxOptions!, reqOpts.parent),
      },
      (err, operation, resp) => {
        if (err) {
          callback!(err, null, null, resp);
          return;
        }
        const instance = this.instance(formattedName);
        callback!(null, instance, operation, resp);
      }
    );
  }

  getInstances(options?: GetInstancesOptions): Promise<GetInstancesResponse>;
  getInstances(callback: GetInstancesCallback): void;
  getInstances(
    query: GetInstancesOptions,
    callback: GetInstancesCallback
  ): void;
  /**
   * Query object for listing instances.
   *
   * @typedef {object} GetInstancesOptions
   * @property {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/global.html#CallOptions.
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
   * @property {number} [pageSize] Maximum number of results per page.
   * @property {string} [pageToken] A previously-returned page token
   *     representing part of the larger set of results to view.
   */
  /**
   * @typedef {array} GetInstancesResponse
   * @property {Instance[]} 0 Array of {@link Instance} instances.
   * @property {object} 1 A query object to receive more results.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback GetInstancesCallback
   * @param {?Error} err Request error, if any.
   * @param {Instance[]} instances Array of {@link Instance} instances.
   * @param {string} nextQuery A query object to receive more results.
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
   * @param {GetInstancesOptions} [options] Query object for listing instances.
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
   *   gaxOptions: {
   *     autoPaginate: false,
   *   }
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * spanner.getInstances().then(function(data) {
   *   const instances = data[0];
   * });
   */
  getInstances(
    optionsOrCallback?: GetInstancesOptions | GetInstancesCallback,
    cb?: GetInstancesCallback
  ): Promise<GetInstancesResponse> | void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetInstancesOptions);
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    const gaxOpts = addResourcePrefixHeader(
      options.gaxOptions!,
      'projects/' + this.projectId
    );

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: 'projects/' + this.projectId,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    this.request(
      {
        client: 'InstanceAdminClient',
        method: 'listInstances',
        reqOpts,
        gaxOpts,
      },
      (err, instances, ...args) => {
        let instanceInstances: Instance[] | null = null;
        if (instances) {
          instanceInstances = instances.map(instance => {
            const instanceInstance = self.instance(instance.name);
            instanceInstance.metadata = instance;
            return instanceInstance;
          });
        }
        callback!(err, instanceInstances, ...args);
      }
    );
  }

  /**
   * Get a list of {@link Instance} objects as a readable object stream.
   *
   * Wrapper around {@link v1.InstanceAdminClient#listInstances}.
   *
   * @see {@link v1.InstanceAdminClient#listInstances}
   * @see [ListInstances API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.ListInstances)
   *
   * @method Spanner#getInstancesStream
   * @param {GetInstancesOptions} [options] Query object for listing instances.
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
  getInstancesStream(options: GetInstancesOptions = {}): NodeJS.ReadableStream {
    const gaxOpts = addResourcePrefixHeader(
      options.gaxOptions!,
      'projects/' + this.projectId
    );

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: 'projects/' + this.projectId,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    return this.requestStream({
      client: 'InstanceAdminClient',
      method: 'listInstancesStream',
      reqOpts,
      gaxOpts,
    });
  }

  getInstanceConfigs(
    query?: GetInstanceConfigsOptions
  ): Promise<GetInstanceConfigsResponse>;
  getInstanceConfigs(callback: GetInstanceConfigsCallback): void;
  getInstanceConfigs(
    query: GetInstanceConfigsOptions,
    callback: GetInstanceConfigsCallback
  ): void;
  /**
   * Lists the supported instance configurations for a given project.
   *
   * @typedef {object} GetInstanceConfigsOptions
   * @property {number} [pageSize] Maximum number of results per page.
   * @property {string} [pageToken] A previously-returned page token
   *     representing part of the larger set of results to view.
   * @property {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/global.html#CallOptions.

   */
  /**
   * @typedef {array} GetInstanceConfigsResponse
   * @property {object[]} 0 List of all available instance configs.
   * @property {string} 0.name The unique identifier for the instance config.
   * @property {string} 0.displayName The name of the instance config as it
   *     appears in UIs.
   * @property {object} 1 A query object to receive more results.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback GetInstanceConfigsCallback
   * @param {?Error} err Request error, if any.
   * @param {object[]} instanceConfigs List of all available instance configs.
   * @param {string} instanceConfigs.name The unique identifier for the instance
   *     config.
   * @param {string} instanceConfigs.displayName The name of the instance config
   *     as it appears in UIs.
   * @param {object} nextQuery A query object to receive more results.
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
   * @param {GetInstanceConfigsOptions} [options] Query object for listing instance
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
   *   gaxOptions: {
   *     autoPaginate: false,
   *   }
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * spanner.getInstanceConfigs().then(function(data) {
   *   const instanceConfigs = data[0];
   * });
   */
  getInstanceConfigs(
    optionsOrCallback?: GetInstanceConfigsOptions | GetInstanceConfigsCallback,
    cb?: GetInstanceConfigsCallback
  ): Promise<GetInstanceConfigsResponse> | void {
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetInstanceConfigsOptions);

    const gaxOpts = addResourcePrefixHeader(
      options.gaxOptions!,
      'projects/' + this.projectId
    );

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: 'projects/' + this.projectId,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    return this.request(
      {
        client: 'InstanceAdminClient',
        method: 'listInstanceConfigs',
        reqOpts,
        gaxOpts,
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
   * @param {GetInstanceConfigsOptions} [options] Query object for listing instance
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
  getInstanceConfigsStream(
    options: GetInstanceConfigsOptions = {}
  ): NodeJS.ReadableStream {
    const gaxOpts = addResourcePrefixHeader(
      options.gaxOptions!,
      'projects/' + this.projectId
    );

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: 'projects/' + this.projectId,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    delete reqOpts.gaxOptions;
    return this.requestStream({
      client: 'InstanceAdminClient',
      method: 'listInstanceConfigsStream',
      reqOpts,
      gaxOpts,
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
  instance(name: string): Instance {
    if (!name) {
      throw new Error('A name is required to access an Instance object.');
    }
    const key = name.split('/').pop()!;
    if (!this.instances_.has(key)) {
      this.instances_.set(key, new Instance(this, name));
    }
    return this.instances_.get(key)!;
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
        this.clients_.set(clientName, new v1[clientName](this.options));
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request(config: any, callback?: any): any {
    if (typeof callback === 'function') {
      this.prepareGapicRequest_(config, (err, requestFn) => {
        if (err) {
          callback(err);
        } else {
          requestFn(callback);
        }
      });
    } else {
      return new Promise((resolve, reject) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  static date(dateString?: string);
  static date(year: number, month: number, date: number);
  /**
   * Helper function to get a Cloud Spanner Date object.
   *
   * DATE types represent a logical calendar date, independent of time zone.
   * DATE values do not represent a specific 24-hour period. Rather, a given
   * DATE value represents a different 24-hour period when interpreted in a
   * different time zone. Because of this, all values passed to
   * {@link Spanner.date} will be interpreted as local time.
   *
   * To represent an absolute point in time, use {@link Spanner.timestamp}.
   *
   * @param {string|number} [date] String representing the date or number
   *     representing the year.
   * @param {number} [month] Number representing the month.
   * @param {number} [date] Number representing the date.
   * @returns {SpannerDate}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const date = Spanner.date('08-20-1969');
   */
  static date(
    dateStringOrYear?: string | number,
    month?: number,
    date?: number
  ): SpannerDate {
    if (typeof dateStringOrYear === 'number') {
      return new codec.SpannerDate(dateStringOrYear, month!, date!);
    }
    return new codec.SpannerDate(dateStringOrYear);
  }

  /**
   * Date object with nanosecond precision. Supports all standard Date arguments
   * in addition to several custom types.
   * @external PreciseDate
   * @see {@link https://github.com/googleapis/nodejs-precise-date|PreciseDate}
   */
  /**
   * Helper function to get a Cloud Spanner Timestamp object.
   *
   * String timestamps should have a canonical format of
   * `YYYY-[M]M-[D]D[( |T)[H]H:[M]M:[S]S[.DDDDDDDDD]]Z`
   *
   * **Timestamp values must be expressed in Zulu time and cannot include a UTC
   * offset.**
   *
   * @see https://cloud.google.com/spanner/docs/data-types#timestamp-type
   *
   * @param {string|number|google.protobuf.Timestamp|external:PreciseDate}
   *     [timestamp] Either a RFC 3339 timestamp formatted string or a
   *     {@link google.protobuf.Timestamp} object. If a PreciseDate is given, it
   *     will return that timestamp as is.
   * @returns {external:PreciseDate}
   *
   * @example
   * const timestamp = Spanner.timestamp('2019-02-08T10:34:29.481145231Z');
   *
   * @example <caption>With a `google.protobuf.Timestamp` object</caption>
   * const [seconds, nanos] = process.hrtime();
   * const timestamp = Spanner.timestamp({seconds, nanos});
   *
   * @example <caption>With a Date timestamp</caption>
   * const timestamp = Spanner.timestamp(Date.now());
   */
  static timestamp(
    value?: string | number | p.ITimestamp | PreciseDate
  ): PreciseDate {
    value = value || Date.now();
    if (value instanceof PreciseDate) {
      return value;
    }
    return new PreciseDate(value as number);
  }

  /**
   * Helper function to get a Cloud Spanner Float64 object.
   *
   * @param {string|number} value The float as a number or string.
   * @returns {Float}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const float = Spanner.float(10);
   */
  static float(value): Float {
    return new codec.Float(value);
  }

  /**
   * Helper function to get a Cloud Spanner Int64 object.
   *
   * @param {string|number} value The int as a number or string.
   * @returns {Int}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const int = Spanner.int(10);
   */
  static int(value): Int {
    return new codec.Int(value);
  }

  /**
   * Helper function to get a Cloud Spanner Struct object.
   *
   * @param {object} value The struct as a JSON object.
   * @returns {Struct}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const struct = Spanner.struct({
   *   user: 'bob',
   *   age: 32
   * });
   */
  static struct(value?): Struct {
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
    'timestamp',
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
 * {@link Backup} class.
 *
 * @name Spanner.Backup
 * @see Backup
 * @type {Constructor}
 */
export {Backup};

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
import * as protos from '../protos/protos';
export {v1, protos};
export default {Spanner};
