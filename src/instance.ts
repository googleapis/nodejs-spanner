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

import arrify = require('arrify');
import {ServiceObjectConfig, GetConfig} from '@google-cloud/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./common-grpc/service-object');
import {promisifyAll} from '@google-cloud/promisify';
import * as extend from 'extend';
import snakeCase = require('lodash.snakecase');
import {Database, SessionPoolConstructor} from './database';
import {Spanner, RequestConfig} from '.';
import {
  RequestCallback,
  PagedOptions,
  PagedResponse,
  LongRunningCallback,
  NormalCallback,
  ResourceCallback,
  PagedOptionsWithFilter,
  CLOUD_RESOURCE_HEADER,
} from './common';
import {Duplex} from 'stream';
import {SessionPoolOptions, SessionPool} from './session-pool';
import {grpc, Operation as GaxOperation, CallOptions} from 'google-gax';
import {Backup} from './backup';
import {google as instanceAdmin} from '../protos/protos';
import {google as databaseAdmin} from '../protos/protos';
import {google as spannerClient} from '../protos/protos';
import {CreateInstanceRequest} from './index';

export type IBackup = databaseAdmin.spanner.admin.database.v1.IBackup;
export type IDatabase = databaseAdmin.spanner.admin.database.v1.IDatabase;
export type IInstance = instanceAdmin.spanner.admin.instance.v1.IInstance;
export type IOperation = instanceAdmin.longrunning.IOperation;
export type CreateInstanceResponse = [Instance, GaxOperation, IOperation];
export type CreateDatabaseResponse = [Database, GaxOperation, IOperation];
export type DeleteInstanceResponse = [instanceAdmin.protobuf.IEmpty];
export type ExistsInstanceResponse = [boolean];
export type GetInstanceResponse = [Instance, IInstance];
export type GetInstanceMetadataResponse = [IInstance];
export interface GetInstanceMetadataOptions {
  fieldNames?: string | string[];
  gaxOptions?: CallOptions;
}
export type GetDatabasesResponse = PagedResponse<
  Database,
  databaseAdmin.spanner.admin.database.v1.IListDatabasesResponse
>;
export type SetInstanceMetadataResponse = [GaxOperation, IOperation];
export type GetBackupsResponse = PagedResponse<
  Backup,
  databaseAdmin.spanner.admin.database.v1.IListBackupsResponse
>;
export type GetBackupOperationsResponse = PagedResponse<
  IOperation,
  databaseAdmin.spanner.admin.database.v1.IListBackupOperationsResponse
>;
export type GetDatabaseOperationsResponse = PagedResponse<
  IOperation,
  databaseAdmin.spanner.admin.database.v1.IListDatabaseOperationsResponse
>;

export interface CreateDatabaseOptions
  extends databaseAdmin.spanner.admin.database.v1.ICreateDatabaseRequest {
  poolOptions?: SessionPoolOptions;
  poolCtor?: SessionPool;
  schema?: string;
  gaxOptions?: CallOptions;
}
export type GetDatabasesOptions = PagedOptions;
export type CreateInstanceCallback = LongRunningCallback<Instance>;
export type CreateDatabaseCallback = LongRunningCallback<Database>;
export type DeleteInstanceCallback = NormalCallback<
  instanceAdmin.protobuf.IEmpty
>;

export type ExistsInstanceCallback = NormalCallback<boolean>;
export type GetDatabasesCallback = RequestCallback<
  Database,
  databaseAdmin.spanner.admin.database.v1.IListDatabasesResponse
>;
export type GetInstanceCallback = ResourceCallback<Instance, IInstance>;
export type GetInstanceMetadataCallback = NormalCallback<IInstance>;
export type SetInstanceMetadataCallback = ResourceCallback<
  GaxOperation,
  IOperation
>;
export type GetBackupsOptions = PagedOptionsWithFilter;

export type GetBackupsCallback = RequestCallback<
  Backup,
  databaseAdmin.spanner.admin.database.v1.IListBackupsResponse
>;
export type GetBackupOperationsOptions = PagedOptionsWithFilter;

export type GetBackupOperationsCallback = RequestCallback<
  IOperation,
  databaseAdmin.spanner.admin.database.v1.IListBackupOperationsResponse
>;
export type GetDatabaseOperationsOptions = PagedOptionsWithFilter;

export type GetDatabaseOperationsCallback = RequestCallback<
  IOperation,
  databaseAdmin.spanner.admin.database.v1.IListDatabaseOperationsResponse
>;
export interface GetInstanceConfig
  extends GetConfig,
    CreateInstanceRequest,
    GetInstanceMetadataOptions {}

interface InstanceRequest {
  (
    config: RequestConfig,
    callback: ResourceCallback<GaxOperation, IOperation>
  ): void;
  <T>(config: RequestConfig, callback: RequestCallback<T>): void;
  <T, R>(config: RequestConfig, callback: RequestCallback<T, R>): void;
}
/**
 * The {@link Instance} class represents a [Cloud Spanner
 * instance](https://cloud.google.com/spanner/docs/instances).
 *
 * Create an `Instance` object to interact with a Cloud Spanner instance.
 *
 * @class
 *
 * @param {Spanner} spanner {@link Spanner} instance.
 * @param {string} name Name of the instance.
 *
 * @example
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 * const instance = spanner.instance('my-instance');
 */
class Instance extends common.GrpcServiceObject {
  formattedName_: string;
  request: InstanceRequest;
  requestStream: (config: RequestConfig) => Duplex;
  databases_: Map<string, Database>;
  metadata?: IInstance;
  resourceHeader_: {[k: string]: string};
  constructor(spanner: Spanner, name: string) {
    const formattedName_ = Instance.formatName_(
      spanner.projectFormattedName_,
      name
    );
    const methods = {
      /**
       * Create an instance.
       *
       * Wrapper around {@link v1.InstanceAdminClient#createInstance}.
       *
       * @see {@link v1.InstanceAdminClient#createInstance}
       * @see [CreateInstance API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.CreateInstance)
       *
       * @method Instance#create
       * @param {CreateInstanceRequest} config Configuration object.
       * @param {CreateInstanceCallback} [callback] Callback function.
       * @returns {Promise<CreateInstanceResponse>}
       *
       * @example
       * const {Spanner} = require('@google-cloud/spanner');
       * const spanner = new Spanner();
       *
       * const instance = spanner.instance('my-instance');
       *
       * instance.create(function(err, instance, operation, apiResponse) {
       *   if (err) {
       *     // Error handling omitted.
       *   }
       *
       *   operation
       *     .on('error', function(err) {})
       *     .on('complete', function() {
       *       // Instance created successfully.
       *     });
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * instance.create()
       *   .then(function(data) {
       *     const operation = data[0];
       *     const apiResponse = data[1];
       *
       *     return operation.promise();
       *   })
       *   .then(function() {
       *     // Instance created successfully.
       *   });
       */
      create: true,
    };
    super(({
      parent: spanner,
      /**
       * @name Instance#id
       * @type {string}
       */
      id: name,
      methods,
      createMethod(
        _: {},
        options: CreateInstanceRequest,
        callback: CreateInstanceCallback
      ): void {
        spanner.createInstance(formattedName_, options, callback);
      },
    } as {}) as ServiceObjectConfig);
    this.formattedName_ = formattedName_;
    this.request = spanner.request.bind(spanner);
    this.requestStream = spanner.requestStream.bind(spanner);
    this.databases_ = new Map<string, Database>();
    this.resourceHeader_ = {
      [CLOUD_RESOURCE_HEADER]: this.formattedName_,
    };
  }

  /**
   * Get a reference to a Backup object.
   *
   * @throws {Error} If any parameter is not provided.
   *
   * @param {string} backupId The name of the backup.
   * @return {Backup} A Backup object.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   */
  backup(backupId: string): Backup {
    if (!backupId) {
      throw new Error('A backup ID is required to create a Backup.');
    }

    return new Backup(this, backupId);
  }

  getBackups(options?: GetBackupsOptions): Promise<GetBackupsResponse>;
  getBackups(callback: GetBackupsCallback): void;
  getBackups(options: GetBackupsOptions, callback: GetBackupsCallback): void;
  /**
   * Query object for listing backups.
   *
   * @typedef {object} GetBackupsOptions
   * @property {string} [filter] An expression for filtering the results of the
   *     request. Filter can be configured as outlined in
   *     {@link v1.DatabaseAdminClient#listBackups}.
   * @property {number} [pageSize] Maximum number of results per page.
   * @property {string} [pageToken] A previously-returned page token
   *     representing part of the larger set of results to view.
   * @property {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/global.html#CallOptions.
   */
  /**
   * @typedef {array} GetBackupsResponse
   * @property {Backup[]} 0 Array of {@link Backup} instances.
   * @property {object} 1 A query object to receive more results.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback GetBackupsCallback
   * @param {?Error} err Request error, if any.
   * @param {Backup[]} 0 Array of {@link Backup} instances.
   * @param {object} nextQuery A query object to receive more results.
   * @param {object} apiResponse The full API response.
   */
  /**
   * List backups on the instance.
   *
   * Both completed and in-progress backups are listed if no filter is supplied.
   *
   * @see {@link #backup}
   *
   * @param {GetBackupsOptions} [options] The query object for listing backups.
   * @param {gax.CallOptions} [options.gaxOptions] The request configuration
   *     options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @returns {Promise<GetBackupsResponse>} When resolved, contains a paged list
   *     of backups.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const [backups] = await instance.getBackups();
   *
   * //-
   * // To manually handle pagination, set autoPaginate:false in gaxOptions.
   * //-
   * let pageToken = undefined;
   * do {
   *   const [backups, , response] = await instance.getBackups({
   *     pageSize: 3,
   *     pageToken,
   *     gaxOptions: {autoPaginate: false},
   *   });
   *   backups.forEach(backup => {
   *     // Do something with backup
   *   });
   *   pageToken = response.nextPageToken;
   * } while (pageToken);
   */
  getBackups(
    optionsOrCallback?: GetBackupsOptions | GetBackupsCallback,
    cb?: GetBackupsCallback
  ): void | Promise<GetBackupsResponse> {
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetBackupsOptions);
    const gaxOpts = extend(true, {}, options.gaxOptions);

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: this.formattedName_,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    this.request<
      IBackup,
      databaseAdmin.spanner.admin.database.v1.IListBackupsResponse
    >(
      {
        client: 'DatabaseAdminClient',
        method: 'listBackups',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      (err, backups, ...args) => {
        let backupInstances: Backup[] | null = null;
        if (backups) {
          backupInstances = backups.map(backup => {
            return this.backup(backup.name!);
          });
        }

        callback(err, backupInstances, ...args);
      }
    );
  }

  /**
   * Get a list of backups as a readable object stream.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#listBackups}.
   *
   * @see {@link v1.DatabaseAdminClient#listBackups}
   * @see [ListBackups API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.ListBackups)
   *
   * @method Spanner#getBackupsStream
   * @param {GetBackupOptions} [options] Query object for listing backups.
   * @returns {ReadableStream} A readable stream that emits {@link Backup}
   *     instances.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * instance.getBackupsStream()
   *   .on('error', console.error)
   *   .on('data', function(database) {
   *     // `backups` is a `Backup` object.
   *   })
   *   .on('end', function() {
   *     // All backups retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * instance.getBackupsStream()
   *   .on('data', function(database) {
   *     this.end();
   *   });
   */
  getBackupsStream(options: GetBackupsOptions = {}): NodeJS.ReadableStream {
    const gaxOpts = extend(true, {}, options.gaxOptions);

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: this.formattedName_,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    return this.requestStream({
      client: 'DatabaseAdminClient',
      method: 'listBackupsStream',
      reqOpts,
      gaxOpts,
      headers: this.resourceHeader_,
    });
  }

  getBackupOperations(
    options?: GetBackupOperationsOptions
  ): Promise<GetBackupOperationsResponse>;
  getBackupOperations(callback: GetBackupOperationsCallback): void;
  getBackupOperations(
    options: GetBackupOperationsOptions,
    callback: GetBackupOperationsCallback
  ): void;
  /**
   * Query object for listing backup operations.
   *
   * @typedef {object} GetBackupOperationsOptions
   * @property {string} [filter] An expression for filtering the results of the
   *     request. Filter can be configured as outlined in
   *     {@link v1.DatabaseAdminClient#listBackupOperations}.
   * @property {number} [pageSize] Maximum number of results per page.
   * @property {string} [pageToken] A previously-returned page token
   *     representing part of the larger set of results to view.
   * @property {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/global.html#CallOptions.
   */
  /**
   * @typedef {array} GetBackupOperationsResponse
   * @property {IOperation[]} 0 Array of {@link IOperation} instances.
   * @property {object} 1 A query object to receive more results.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback GetBackupOperationsCallback
   * @param {?Error} err Request error, if any.
   * @param {IOperation[]} 0 Array of {@link IOperation} instances.
   * @param {object} nextQuery A query object to receive more results.
   * @param {object} apiResponse The full API response.
   */

  /**
   * List pending and completed backup operations for all databases in the instance.
   *
   * @see {@link #listOperations}
   *
   * @param {GetBackupOperationsOptions} [options] The query object for listing
   *     backup operations.
   * @param {gax.CallOptions} [options.gaxOptions] The request configuration
   *     options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @returns {Promise<GetBackupOperationsResponse>} When resolved, contains a
   *     paged list of backup operations.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const [operations] = await instance.getBackupOperations();
   *
   * //-
   * // To manually handle pagination, set autoPaginate:false in gaxOptions.
   * //-
   * let pageToken = undefined;
   * do {
   *   const [operations, , response] = await instance.getBackupOperations({
   *     pageSize: 3,
   *     pageToken,
   *     gaxOptions: {autoPaginate: false},
   *   });
   *   operations.forEach(operation => {
   *     // Do something with operation
   *   });
   *   pageToken = response.nextPageToken;
   * } while (pageToken);
   */
  getBackupOperations(
    optionsOrCallback?:
      | GetBackupOperationsOptions
      | GetBackupOperationsCallback,
    cb?: GetBackupOperationsCallback
  ): void | Promise<GetBackupOperationsResponse> {
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetBackupOperationsOptions);
    const gaxOpts = extend(true, {}, options.gaxOptions);

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: this.formattedName_,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    this.request<
      IOperation,
      databaseAdmin.spanner.admin.database.v1.IListBackupOperationsResponse
    >(
      {
        client: 'DatabaseAdminClient',
        method: 'listBackupOperations',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      callback
    );
  }

  getDatabaseOperations(
    options?: GetDatabaseOperationsOptions
  ): Promise<GetDatabaseOperationsResponse>;
  getDatabaseOperations(callback: GetDatabaseOperationsCallback): void;
  getDatabaseOperations(
    options: GetDatabaseOperationsOptions,
    callback: GetDatabaseOperationsCallback
  ): void;
  /**
   * Query object for listing database operations.
   *
   * @typedef {object} GetDatabaseOperationsOptions
   * @property {string} [filter] An expression for filtering the results of the
   *     request. Filter can be configured as outlined in
   *     {@link v1.DatabaseAdminClient#listDatabaseOperations}.
   * @property {number} [pageSize] Maximum number of results per page.
   * @property {string} [pageToken] A previously-returned page token
   *     representing part of the larger set of results to view.
   * @property {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/global.html#CallOptions.
   */
  /**
   * @typedef {array} GetDatabaseOperationsResponse
   * @property {IOperation[]} 0 Array of {@link IOperation} instances.
   * @property {object} 1 A query object to receive more results.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback GetDatabaseOperationsCallback
   * @param {?Error} err Request error, if any.
   * @param {IOperation[]} 0 Array of {@link IOperation} instances.
   * @param {object} nextQuery A query object to receive more results.
   * @param {object} apiResponse The full API response.
   */

  /**
   * List pending and completed operations for all databases in the instance.
   *
   * @see {@link Database.getDatabaseOperations}
   *
   * @param {GetDatabaseOperationsOptions} [options] The query object for
   *     listing database operations.
   * @param {gax.CallOptions} [options.gaxOptions] The request configuration
   *     options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @returns {Promise<GetDatabaseOperationsResponse>} When resolved, contains a
   *     paged list of database operations.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const [operations] = await instance.getDatabaseOperations();
   * // ... then do something with the operations
   *
   * //-
   * // To manually handle pagination, set autoPaginate:false in gaxOptions.
   * //-
   * let pageToken = undefined;
   * do {
   *   const [operations, , response] = await instance.getDatabaseOperations({
   *     pageSize: 3,
   *     pageToken,
   *     gaxOptions: {autoPaginate: false},
   *   });
   *   operations.forEach(operation => {
   *     // Do something with operation
   *   });
   *   pageToken = response.nextPageToken;
   * } while (pageToken);
   */
  getDatabaseOperations(
    optionsOrCallback?:
      | GetDatabaseOperationsOptions
      | GetDatabaseOperationsCallback,
    cb?: GetDatabaseOperationsCallback
  ): void | Promise<GetDatabaseOperationsResponse> {
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetDatabaseOperationsOptions);
    const gaxOpts = extend(true, {}, options.gaxOptions);

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: this.formattedName_,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    this.request<
      IOperation,
      databaseAdmin.spanner.admin.database.v1.IListDatabaseOperationsResponse
    >(
      {
        client: 'DatabaseAdminClient',
        method: 'listDatabaseOperations',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      callback
    );
  }

  createDatabase(
    name: string,
    options?: CreateDatabaseOptions
  ): Promise<CreateDatabaseResponse>;
  createDatabase(name: string, callback: CreateDatabaseCallback): void;
  createDatabase(
    name: string,
    options: CreateDatabaseOptions,
    callback: CreateDatabaseCallback
  ): void;
  /**
   * Config for the new database.
   *
   * @typedef {object} CreateDatabaseRequest
   * @property {SessionPoolOptions} [poolOptions]
   * @property {SessionPoolCtor} [poolCtor]
   */
  /**
   * @typedef {array} CreateDatabaseResponse
   * @property {Database} 0 The new {@link Database}.
   * @property {Operation} 1 An {@link Operation} object that can be used to check
   *     the status of the request.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback CreateDatabaseCallback
   * @param {?Error} err Request error, if any.
   * @param {Database} database The new {@link Database}.
   * @param {Operation} operation An {@link Operation} object that can be used to
   *     check the status of the request.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Create a database in this instance.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#createDatabase}.
   *
   * @see {@link v1.DatabaseAdminClient#createDatabase}
   * @see [CreateDatabase API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.CreateDatabase)
   *
   * @throws {Error} If a name is not provided.
   *
   * @param {name} name The name of the database to create.
   * @param {CreateDatabaseRequest} [options] Configuration object.
   * @param {CreateDatabaseCallback} [callback] Callback function.
   * @returns {Promise<CreateDatabaseResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * function callback(err, database, operation, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   operation
   *     .on('error', function(err) {})
   *     .on('complete', function() {
   *       // Database created successfully.
   *     });
   * }
   *
   * instance.createDatabase('new-database-name', callback);
   *
   * //-
   * // Set the schema for the database.
   * //-
   * instance.createDatabase('new-database-name', {
   *   schema:
   *     'CREATE TABLE Singers (' +
   *     '  SingerId STRING(1024) NOT NULL,' +
   *     '  Name STRING(1024),' +
   *     ') PRIMARY KEY(SingerId)'
   * }, callback);
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instance.createDatabase('new-database-name')
   *   .then(function(data) {
   *     const database = data[0];
   *     const operation = data[1];
   *     return operation.promise();
   *   })
   *   .then(function() {
   *     // Database created successfully.
   *   });
   *
   * @example <caption>include:samples/schema.js</caption>
   * region_tag:spanner_create_database
   * Full example:
   */
  createDatabase(
    name: string,
    optionsOrCallback?: CreateDatabaseOptions | CreateDatabaseCallback,
    cb?: CreateDatabaseCallback
  ): void | Promise<CreateDatabaseResponse> {
    if (!name) {
      throw new Error('A name is required to create a database.');
    }
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as CreateDatabaseOptions);

    const poolOptions = options.poolOptions;
    const poolCtor = options.poolCtor;
    const reqOpts = extend(
      {
        parent: this.formattedName_,
        createStatement: 'CREATE DATABASE `' + name.split('/').pop() + '`',
      },
      options
    );

    delete reqOpts.poolOptions;
    delete reqOpts.poolCtor;
    delete reqOpts.gaxOptions;

    if (reqOpts.schema) {
      reqOpts.extraStatements = arrify(reqOpts.schema);
      delete reqOpts.schema;
    }
    this.request(
      {
        client: 'DatabaseAdminClient',
        method: 'createDatabase',
        reqOpts,
        gaxOpts: options.gaxOptions,
        headers: this.resourceHeader_,
      },
      (err, operation, resp) => {
        if (err) {
          callback(err, null, null, resp);
          return;
        }
        const database = this.database(name, poolOptions || poolCtor);
        callback(null, database, operation, resp);
      }
    );
  }

  /**
   * Get a reference to a Database object.
   *
   * @throws {Error} If a name is not provided.
   *
   * @param {string} name The name of the instance.
   * @param {SessionPoolOptions|SessionPoolCtor} [poolOptions] Session pool
   *     configuration options.
   * @param {spannerClient.spanner.v1.ExecuteSqlRequest.IQueryOptions} [queryOptions]
   *     Default query options to use with the database. These options will be
   *     overridden by any query options set in environment variables or that
   *     are specified on a per-query basis.
   * @return {Database} A Database object.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   */
  database(
    name: string,
    poolOptions?: SessionPoolOptions | SessionPoolConstructor,
    queryOptions?: spannerClient.spanner.v1.ExecuteSqlRequest.IQueryOptions
  ): Database {
    if (!name) {
      throw new Error('A name is required to access a Database object.');
    }
    // Only add an additional key for SessionPoolOptions and QueryOptions if an
    // options object with at least one value was passed in.
    let optionsKey =
      poolOptions && Object.keys(poolOptions).length > 0
        ? '/' + JSON.stringify(Object.entries(poolOptions).sort())
        : '';
    if (queryOptions && Object.keys(queryOptions).length > 0) {
      optionsKey =
        optionsKey + '/' + JSON.stringify(Object.entries(queryOptions!).sort());
    }
    const key = name.split('/').pop() + optionsKey;
    if (!this.databases_.has(key!)) {
      this.databases_.set(
        key!,
        new Database(this, name, poolOptions, queryOptions)
      );
    }
    return this.databases_.get(key!)!;
  }

  delete(gaxOptions?: CallOptions): Promise<DeleteInstanceResponse>;
  delete(callback: DeleteInstanceCallback): void;
  delete(gaxOptions: CallOptions, callback: DeleteInstanceCallback): void;
  /**
   * @typedef {array} DeleteInstanceResponse
   * @property {object} 0 The full API response.
   */
  /**
   * @callback DeleteInstanceCallback
   * @param {?Error} err Request error, if any.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Delete the instance.
   *
   * Wrapper around {@link v1.InstanceAdminClient#deleteInstance}.
   *
   * @see {@link v1.InstanceAdminClient#deleteInstance}
   * @see [DeleteInstance API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.DeleteInstance)
   *
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {DeleteInstanceCallback} [callback] Callback function.
   * @returns {Promise<DeleteInstanceResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * instance.delete(function(err, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Instance was deleted successfully.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instance.delete().then(function(data) {
   *   const apiResponse = data[0];
   * });
   */
  delete(
    optionsOrCallback?: CallOptions | DeleteInstanceCallback,
    cb?: DeleteInstanceCallback
  ): void | Promise<DeleteInstanceResponse> {
    const gaxOpts =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    const reqOpts = {
      name: this.formattedName_,
    };
    Promise.all(
      Array.from(this.databases_.values()).map(database => {
        return database.close();
      })
    )
      .catch(() => {})
      .then(() => {
        this.databases_.clear();
        this.request<instanceAdmin.protobuf.IEmpty>(
          {
            client: 'InstanceAdminClient',
            method: 'deleteInstance',
            reqOpts,
            gaxOpts,
            headers: this.resourceHeader_,
          },
          (err, resp) => {
            if (!err) {
              this.parent.instances_.delete(this.id);
            }
            callback!(err, resp!);
          }
        );
      });
  }

  exists(gaxOptions?: CallOptions): Promise<ExistsInstanceResponse>;
  exists(callback: ExistsInstanceCallback): void;
  exists(gaxOptions: CallOptions, callback: ExistsInstanceCallback): void;
  /**
   * @typedef {array} InstanceExistsResponse
   * @property {boolean} 0 Whether the {@link Instance} exists.
   */
  /**
   * @callback InstanceExistsCallback
   * @param {?Error} err Request error, if any.
   * @param {boolean} exists Whether the {@link Instance} exists.
   */
  /**
   * Check if an instance exists.
   *
   * @method Instance#exists
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {InstanceExistsCallback} [callback] Callback function.
   * @returns {Promise<InstanceExistsResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * instance.exists(function(err, exists) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instance.exists().then(function(data) {
   *   const exists = data[0];
   * });
   */
  exists(
    optionsOrCallback?: CallOptions | ExistsInstanceCallback,
    cb?: ExistsInstanceCallback
  ): void | Promise<ExistsInstanceResponse> {
    const gaxOptions =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    const NOT_FOUND = 5;

    this.getMetadata({gaxOptions}, err => {
      if (err && err.code !== NOT_FOUND) {
        callback!(err, null);
        return;
      }

      const exists = !err || err.code !== NOT_FOUND;
      callback!(null, exists);
    });
  }

  get(options?: GetInstanceConfig): Promise<GetInstanceResponse>;
  get(callback: GetInstanceCallback): void;
  get(options: GetInstanceConfig, callback: GetInstanceCallback): void;
  /**
   * @typedef {array} GetInstanceResponse
   * @property {Instance} 0 The {@link Instance}.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetInstanceCallback
   * @param {?Error} err Request error, if any.
   * @param {Instance} instance The {@link Instance}.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get an instance if it exists.
   *
   * You may optionally use this to "get or create" an object by providing an
   * object with `autoCreate` set to `true`. Any extra configuration that is
   * normally required for the `create` method must be contained within this
   * object as well.
   *
   * @param {options} [options] Configuration object.
   * @param {boolean} [options.autoCreate=false] Automatically create the
   *     object if it does not exist.
   * @param {string | string[]} [options.fieldNames] A list of `Instance` field
   *     names to be requested. Eligible values are: `name`, `displayName`,
   *     `endpointUris`, `labels`, `config`, `nodeCount`, `state`.
   * @param {GetInstanceCallback} [callback] Callback function.
   * @returns {Promise<GetInstanceResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * instance.get(function(err, instance, apiResponse) {
   *   // `instance.metadata` has been populated.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instance.get().then(function(data) {
   *   const instance = data[0];
   *   const apiResponse = data[0];
   * });
   */
  get(
    optionsOrCallback?: GetInstanceConfig | GetInstanceCallback,
    cb?: GetInstanceCallback
  ): void | Promise<GetInstanceResponse> {
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetInstanceConfig);

    const getMetadataOptions: GetInstanceMetadataOptions = new Object(null);
    if (options.fieldNames) {
      getMetadataOptions.fieldNames = options.fieldNames;
    }
    if (options.gaxOptions) {
      getMetadataOptions.gaxOptions = options.gaxOptions;
    }

    this.getMetadata(getMetadataOptions, (err, metadata) => {
      if (err) {
        if (err.code === 5 && options.autoCreate) {
          const createOptions = extend(true, {}, options);
          delete createOptions.fieldNames;
          delete createOptions.autoCreate;
          this.create(
            createOptions,
            (
              err: grpc.ServiceError | null,
              instance?: Instance,
              operation?: GaxOperation | null
            ) => {
              if (err) {
                callback(err);
                return;
              }
              operation!
                .on('error', callback)
                .on('complete', (metadata: IInstance) => {
                  this.metadata = metadata;
                  callback(null, this, metadata);
                });
            }
          );
          return;
        }
        callback(err);
        return;
      }
      callback(null, this, metadata!);
    });
  }

  getDatabases(options?: GetDatabasesOptions): Promise<GetDatabasesResponse>;
  getDatabases(callback: GetDatabasesCallback): void;
  getDatabases(
    options: GetDatabasesOptions,
    callback: GetDatabasesCallback
  ): void;
  /**
   * Query object for listing databases.
   *
   * @typedef {object} GetDatabasesRequest
   * @property {number} [pageSize] Maximum number of results per page.
   * @property {string} [pageToken] A previously-returned page token
   *     representing part of the larger set of results to view.
   * @property {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/global.html#CallOptions.
   */
  /**
   * @typedef {array} GetDatabasesResponse
   * @property {Database[]} 0 Array of {@link Database} instances.
   * @property {object} nextQuery A query object to receive more results.
   * @property {object} apiResponse The full API response.
   */
  /**
   * @callback GetDatabasesCallback
   * @param {?Error} err Request error, if any.
   * @param {Database[]} databases Array of {@link Database} instances.
   * @param {object} nextQuery A query object to receive more results.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get a list of databases.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#listDatabases}.
   *
   * @see {@link v1.DatabaseAdminClient#listDatabases}
   * @see [ListDatabases API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.ListDatabases)
   *
   * @param {GetDatabasesOptions} [options] Query object for listing databases.
   * @param {GetDatabasesCallback} [callback] Callback function.
   * @returns {Promise<GetDatabasesResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * instance.getDatabases(function(err, databases) {
   *   // `databases` is an array of `Database` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, databases, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     instance.getDatabases(nextQuery, callback);
   *   }
   * }
   *
   * instance.getDatabases({
   *   gaxOptions: {autoPaginate: false}
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instance.getDatabases().then(function(data) {
   *   const databases = data[0];
   * });
   */
  getDatabases(
    optionsOrCallback?: GetDatabasesOptions | GetDatabasesCallback,
    cb?: GetDatabasesCallback
  ): void | Promise<GetDatabasesResponse> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetDatabasesOptions);

    const gaxOpts = extend(true, {}, options.gaxOptions);
    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: this.formattedName_,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    this.request<
      IDatabase,
      databaseAdmin.spanner.admin.database.v1.IListDatabasesResponse
    >(
      {
        client: 'DatabaseAdminClient',
        method: 'listDatabases',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      (err, rowDatabases, ...args) => {
        let databases: Database[] | null = null;
        if (rowDatabases) {
          databases = rowDatabases.map(database => {
            const databaseInstance = self.database(database.name!);
            databaseInstance.metadata = database;
            return databaseInstance;
          });
        }
        callback(err, databases, ...args);
      }
    );
  }

  /**
   * Get a list of databases as a readable object stream.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#listDatabases}.
   *
   * @see {@link v1.DatabaseAdminClient#listDatabases}
   * @see [ListDatabases API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.ListDatabases)
   *
   * @method Spanner#getDatabasesStream
   * @param {GetDatabasesOptions} [options] Query object for listing databases.
   * @returns {ReadableStream} A readable stream that emits {@link Database}
   *     instances.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * instance.getDatabasesStream()
   *   .on('error', console.error)
   *   .on('data', function(database) {
   *     // `database` is a `Database` object.
   *   })
   *   .on('end', function() {
   *     // All databases retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * instance.getDatabasesStream()
   *   .on('data', function(database) {
   *     this.end();
   *   });
   */
  getDatabasesStream(options: GetDatabasesOptions = {}): NodeJS.ReadableStream {
    const gaxOpts = extend(true, {}, options.gaxOptions);

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    const reqOpts = extend(
      {},
      {
        parent: this.formattedName_,
        pageSize: gaxOpts.pageSize,
        pageToken: gaxOpts.pageToken,
      },
      options
    );
    delete gaxOpts.pageSize;
    delete gaxOpts.pageToken;
    delete reqOpts.gaxOptions;

    return this.requestStream({
      client: 'DatabaseAdminClient',
      method: 'listDatabasesStream',
      reqOpts,
      gaxOpts,
      headers: this.resourceHeader_,
    });
  }

  getMetadata(
    options?: GetInstanceMetadataOptions
  ): Promise<GetInstanceMetadataResponse>;
  getMetadata(callback: GetInstanceMetadataCallback): void;
  getMetadata(
    options: GetInstanceMetadataOptions,
    callback: GetInstanceMetadataCallback
  ): void;
  /**
   * @typedef {array} GetInstanceMetadataResponse
   * @property {object} 0 The {@link Instance} metadata.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetInstanceMetadataCallback
   * @param {?Error} err Request error, if any.
   * @param {object} metadata The {@link Instance} metadata.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get the instance's metadata.
   *
   * Wrapper around {@link v1.InstanceAdminClient#getInstance}.
   *
   * @see {@link v1.InstanceAdminClient#getInstance}
   * @see [GetInstance API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.GetInstance)
   *
   * @param {GetInstanceMetadataOptions} [options] Configuration object
   * @param {string | string[]} [options.fieldNames] A list of `Instance` field
   *     names to be requested. Eligible values are: `name`, `displayName`,
   *     `endpointUris`, `labels`, `config`, `nodeCount`, `state`.
   * @param {GetInstanceMetadataCallback} [callback] Callback function.
   * @returns {Promise<GetInstanceMetadataResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * instance.getMetadata(function(err, metadata, apiResponse) {});
   *
   * //-
   * // Request only `displayName`.
   * //-
   * instance.getMetadata({fieldNames: 'displayName'}, (err, metadata, apiResponse) => {
   *   // metadata will only contain value for `displayName`
   *   const displayName = metadata['displayName'];
   * })
   *
   * //-
   * // Request multiple specific field names.
   * //-
   * instance.getMetadata({fieldNames: ['displayName', 'nodeCount']}, (err, metadata, apiResponse) => {
   *   // metadata will only contain value for `displayName` and 'nodeCount'
   *   const displayName = metadata['displayName'];
   *   const nodeCount = metadata['nodeCount'];
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instance.getMetadata().then(function(data) {
   *   const metadata = data[0];
   *   const apiResponse = data[1];
   * });
   */
  getMetadata(
    optionsOrCallback?:
      | GetInstanceMetadataOptions
      | GetInstanceMetadataCallback,
    cb?: GetInstanceMetadataCallback
  ): Promise<GetInstanceMetadataResponse> | void {
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const reqOpts = {
      name: this.formattedName_,
    };
    if (options.fieldNames) {
      reqOpts['fieldMask'] = {
        paths: arrify(options['fieldNames']!).map(snakeCase),
      };
    }
    return this.request<IInstance>(
      {
        client: 'InstanceAdminClient',
        method: 'getInstance',
        reqOpts,
        gaxOpts: options.gaxOptions,
        headers: this.resourceHeader_,
      },
      callback!
    );
  }

  setMetadata(
    metadata: IInstance,
    gaxOptions?: CallOptions
  ): Promise<SetInstanceMetadataResponse>;
  setMetadata(metadata: IInstance, callback: SetInstanceMetadataCallback): void;
  setMetadata(
    metadata: IInstance,
    gaxOptions: CallOptions,
    callback: SetInstanceMetadataCallback
  ): void;
  /**
   * Update the metadata for this instance. Note that this method follows PATCH
   * semantics, so previously-configured settings will persist.
   *
   * Wrapper around {@link v1.InstanceAdminClient#updateInstance}.
   *
   * @see {@link v1.InstanceAdminClient#updateInstance}
   * @see [UpdateInstance API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.UpdateInstance)
   *
   * @param {object} metadata The metadata you wish to set.
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {SetInstanceMetadataCallback} [callback] Callback function.
   * @returns {Promise<LongRunningOperationResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   *
   * const metadata = {
   *   displayName: 'My Instance'
   * };
   *
   * instance.setMetadata(metadata, function(err, operation, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   operation
   *     .on('error', function(err) {})
   *     .on('complete', function() {
   *       // Metadata updated successfully.
   *     });
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * instance.setMetadata(metadata).then(function(data) {
   *   const operation = data[0];
   *   const apiResponse = data[1];
   * });
   */
  setMetadata(
    metadata: IInstance,
    optionsOrCallback?: CallOptions | SetInstanceMetadataCallback,
    cb?: SetInstanceMetadataCallback
  ): void | Promise<SetInstanceMetadataResponse> {
    const gaxOpts =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    const reqOpts = {
      instance: extend(
        {
          name: this.formattedName_,
        },
        metadata
      ),
      fieldMask: {
        paths: Object.keys(metadata).map(snakeCase),
      },
    };
    return this.request(
      {
        client: 'InstanceAdminClient',
        method: 'updateInstance',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      callback!
    );
  }
  /**
   * Format the instance name to include the project ID.
   *
   * @private
   *
   * @param {string} projectId The project ID.
   * @param {string} name The instance name.
   * @returns {string}
   *
   * @example
   * Instance.formatName_('grape-spaceship-123', 'my-instance');
   * // 'projects/grape-spaceship-123/instances/my-instance'
   */
  static formatName_(projectName: string, name: string) {
    if (name.indexOf('/') > -1) {
      return name;
    }
    const instanceName = name.split('/').pop();
    return projectName + '/instances/' + instanceName;
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Instance, {
  exclude: ['database', 'backup'],
});

/**
 * Reference to the {@link Instance} class.
 * @name module:@google-cloud/spanner.Instance
 * @see Instance
 */
export {Instance};
