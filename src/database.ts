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

import {
  ApiError,
  ExistsCallback,
  GetConfig,
  Metadata,
  ServiceObjectConfig,
} from '@google-cloud/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./common-grpc/service-object');
import {promisify, promisifyAll, callbackifyAll} from '@google-cloud/promisify';
import * as extend from 'extend';
import * as r from 'teeny-request';
import * as streamEvents from 'stream-events';
import * as through from 'through2';
import {CallOptions, grpc, Operation as GaxOperation} from 'google-gax';
import {Backup} from './backup';
import {BatchTransaction, TransactionIdentifier} from './batch-transaction';
import {
  google as databaseAdmin,
  google,
  google as spannerClient,
} from '../protos/protos';
import {
  CreateDatabaseCallback,
  CreateDatabaseOptions,
  GetDatabaseOperationsOptions,
  GetDatabaseOperationsResponse,
  Instance,
  GetDatabaseOperationsCallback,
} from './instance';
import {PartialResultStream, Row} from './partial-result-stream';
import {Session} from './session';
import {
  isSessionNotFoundError,
  SessionPool,
  SessionPoolCloseCallback,
  SessionPoolInterface,
  SessionPoolOptions,
} from './session-pool';
import {CreateTableCallback, CreateTableResponse, Table} from './table';
import {
  ExecuteSqlRequest,
  RunCallback,
  RunResponse,
  RunUpdateCallback,
  Snapshot,
  TimestampBounds,
  Transaction,
} from './transaction';
import {
  AsyncRunTransactionCallback,
  AsyncTransactionRunner,
  RunTransactionCallback,
  RunTransactionOptions,
  TransactionRunner,
} from './transaction-runner';
import {
  IOperation,
  LongRunningCallback,
  NormalCallback,
  PagedOptionsWithFilter,
  CLOUD_RESOURCE_HEADER,
  PagedResponse,
  RequestCallback,
  ResourceCallback,
  Schema,
} from './common';
import {Duplex, Readable, Transform} from 'stream';
import {PreciseDate} from '@google-cloud/precise-date';
import {EnumKey, RequestConfig, TranslateEnumKeys} from '.';
import arrify = require('arrify');

type CreateBatchTransactionCallback = ResourceCallback<
  BatchTransaction,
  google.spanner.v1.ITransaction | google.spanner.v1.ISession
>;

type CreateBatchTransactionResponse = [
  BatchTransaction,
  google.spanner.v1.ITransaction | google.spanner.v1.ISession
];
type DatabaseResponse = [Database, r.Response];
type DatabaseCallback = ResourceCallback<Database, r.Response>;

type GetSnapshotCallback = NormalCallback<Snapshot>;

type GetTransactionCallback = NormalCallback<Transaction>;

export interface SessionPoolConstructor {
  new (
    database: Database,
    options?: SessionPoolOptions | null
  ): SessionPoolInterface;
}

export type UpdateSchemaCallback = ResourceCallback<
  GaxOperation,
  databaseAdmin.longrunning.IOperation
>;

export type UpdateSchemaResponse = [
  GaxOperation,
  databaseAdmin.longrunning.IOperation
];

type PoolRequestCallback = RequestCallback<Session>;

type ResultSetStats = spannerClient.spanner.v1.ResultSetStats;

export type GetSessionsOptions = PagedOptionsWithFilter;

/**
 * IDatabase structure with database state enum translated to string form.
 */
type IDatabaseTranslatedEnum = Omit<
  TranslateEnumKeys<
    databaseAdmin.spanner.admin.database.v1.IDatabase,
    'state',
    typeof databaseAdmin.spanner.admin.database.v1.Database.State
  >,
  'restoreInfo'
> & {restoreInfo?: IRestoreInfoTranslatedEnum | null};

/**
 * IRestoreInfo structure with restore source type enum translated to string form.
 */
type IRestoreInfoTranslatedEnum = TranslateEnumKeys<
  databaseAdmin.spanner.admin.database.v1.IRestoreInfo,
  'sourceType',
  typeof databaseAdmin.spanner.admin.database.v1.RestoreSourceType
>;

type GetMetadataResponse = [IDatabaseTranslatedEnum];
type GetMetadataCallback = RequestCallback<IDatabaseTranslatedEnum>;

type GetSchemaCallback = RequestCallback<
  string,
  databaseAdmin.spanner.admin.database.v1.IGetDatabaseDdlResponse
>;
type GetSchemaResponse = [
  string[],
  databaseAdmin.spanner.admin.database.v1.IGetDatabaseDdlResponse
];

type GetSessionsCallback = RequestCallback<
  Session,
  google.spanner.v1.IListSessionsResponse
>;

type GetSessionsResponse = PagedResponse<
  Session,
  google.spanner.v1.IListSessionsResponse
>;

export type GetDatabaseConfig = GetConfig &
  databaseAdmin.spanner.admin.database.v1.GetDatabaseRequest & {
    gaxOptions?: CallOptions;
  };
type DatabaseCloseResponse = [google.protobuf.IEmpty];

export type CreateSessionResponse = [
  Session,
  spannerClient.spanner.v1.ISession
];

export interface CreateSessionOptions {
  labels?: {[k: string]: string} | null;
  gaxOptions?: CallOptions;
}

export type CreateSessionCallback = ResourceCallback<
  Session,
  spannerClient.spanner.v1.ISession
>;

export interface BatchCreateSessionsOptions extends CreateSessionOptions {
  count: number;
}

export type BatchCreateSessionsResponse = [
  Session[],
  spannerClient.spanner.v1.IBatchCreateSessionsResponse
];

export type BatchCreateSessionsCallback = ResourceCallback<
  Session[],
  spannerClient.spanner.v1.IBatchCreateSessionsResponse
>;

export type DatabaseDeleteResponse = [databaseAdmin.protobuf.IEmpty];
export type DatabaseDeleteCallback = NormalCallback<
  databaseAdmin.protobuf.IEmpty
>;

export interface CancelableDuplex extends Duplex {
  cancel(): void;
}

export type RestoreDatabaseCallback = LongRunningCallback<Database>;

export type RestoreDatabaseResponse = [
  Database,
  GaxOperation,
  databaseAdmin.longrunning.IOperation
];

export type GetRestoreInfoCallback = NormalCallback<IRestoreInfoTranslatedEnum>;
export type GetStateCallback = NormalCallback<
  EnumKey<typeof databaseAdmin.spanner.admin.database.v1.Database.State>
>;

interface DatabaseRequest {
  (
    config: RequestConfig,
    callback: ResourceCallback<GaxOperation, IOperation>
  ): void;
  <T>(config: RequestConfig, callback: RequestCallback<T>): void;
  <T, R>(config: RequestConfig, callback: RequestCallback<T, R>): void;
}
/**
 * Create a Database object to interact with a Cloud Spanner database.
 *
 * @class
 *
 * @param {string} name Name of the database.
 * @param {SessionPoolOptions|SessionPoolInterface} options Session pool
 *     configuration options or custom pool interface.
 * @param {spannerClient.spanner.v1.ExecuteSqlRequest.IQueryOptions} queryOptions
 *     The default query options to use for queries on the database.
 *
 * @example
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 */
class Database extends common.GrpcServiceObject {
  private instance: Instance;
  formattedName_: string;
  pool_: SessionPoolInterface;
  queryOptions_?: spannerClient.spanner.v1.ExecuteSqlRequest.IQueryOptions;
  resourceHeader_: {[k: string]: string};
  request: DatabaseRequest;
  constructor(
    instance: Instance,
    name: string,
    poolOptions?: SessionPoolConstructor | SessionPoolOptions,
    queryOptions?: spannerClient.spanner.v1.ExecuteSqlRequest.IQueryOptions
  ) {
    const methods = {
      /**
       * Create a database.
       *
       * @method Database#create
       * @param {CreateDatabaseRequest} [options] Configuration object.
       * @param {CreateDatabaseCallback} [callback] Callback function.
       * @returns {Promise<CreateDatabaseResponse>}
       *
       * @example
       * const {Spanner} = require('@google-cloud/spanner');
       * const spanner = new Spanner();
       * const instance = spanner.instance('my-instance');
       * const database = instance.database('my-database');
       *
       * database.create(function(err, database, operation, apiResponse) {
       *   if (err) {
       *     // Error handling omitted.
       *   }
       *
       *   operation
       *     .on('error', function(err) {})
       *     .on('complete', function() {
       *       // Database created successfully.
       *     });
       * });
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * database.create()
       *   .then(function(data) {
       *     const operation = data[0];
       *     const apiResponse = data[1];
       *
       *     return operation.promise();
       *   })
       *   .then(function() {
       *     // Database created successfully.
       *   });
       */
      create: true,
    };

    const formattedName_ = Database.formatName_(instance.formattedName_, name);

    super(({
      parent: instance,
      id: name,
      methods,
      createMethod: (
        _: {},
        options: CreateDatabaseOptions,
        callback: CreateDatabaseCallback
      ) => {
        const pool = this.pool_ as SessionPool;
        if (pool._pending > 0) {
          // If there are BatchCreateSessions requests pending, then we should
          // wait until these have finished before we try to create the database.
          // Otherwise the results of these requests might be propagated to
          // client requests that are submitted after the database has been
          // created. If the pending requests have not finished within 10 seconds,
          // they will be ignored and the database creation will proceed.
          let timeout;
          const promises = [
            new Promise<void>(
              resolve => (timeout = setTimeout(resolve, 10000))
            ),
            new Promise<void>(resolve => {
              pool
                .on('available', () => {
                  if (pool._pending === 0) {
                    clearTimeout(timeout);
                    resolve();
                  }
                })
                .on('createError', () => {
                  if (pool._pending === 0) {
                    clearTimeout(timeout);
                    resolve();
                  }
                });
            }),
          ];
          Promise.race(promises).then(() =>
            instance.createDatabase(formattedName_, options, callback)
          );
        } else {
          return instance.createDatabase(formattedName_, options, callback);
        }
      },
    } as {}) as ServiceObjectConfig);

    this.pool_ =
      typeof poolOptions === 'function'
        ? new (poolOptions as SessionPoolConstructor)(this, null)
        : new SessionPool(this, poolOptions);
    this.formattedName_ = formattedName_;
    this.instance = instance;
    this.resourceHeader_ = {
      [CLOUD_RESOURCE_HEADER]: this.formattedName_,
    };
    this.request = instance.request;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.requestStream = instance.requestStream as any;
    this.pool_.on('error', this.emit.bind(this, 'error'));
    this.pool_.open();
    this.queryOptions_ = Object.assign(
      Object.assign({}, queryOptions),
      Database.getEnvironmentQueryOptions()
    );
  }

  static getEnvironmentQueryOptions() {
    const options = {} as spannerClient.spanner.v1.ExecuteSqlRequest.IQueryOptions;
    if (process.env.SPANNER_OPTIMIZER_VERSION) {
      options.optimizerVersion = process.env.SPANNER_OPTIMIZER_VERSION;
    }
    return options;
  }

  batchCreateSessions(
    options: number | BatchCreateSessionsOptions
  ): Promise<BatchCreateSessionsResponse>;
  batchCreateSessions(
    options: number | BatchCreateSessionsOptions,
    callback: BatchCreateSessionsCallback
  ): void;
  /**
   * @typedef {object} BatchCreateSessionsOptions
   * @property {number} count The number of sessions to create.
   * @property {object.<string, string>} [labels] Labels to apply to each
   *     session.
   */
  /**
   * @typedef {array} BatchCreateSessionsResponse
   * @property {Session[]} 0 The newly created sessions.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback BatchCreateSessionsCallback
   * @param {?Error} err Request error, if any.
   * @param {Session[]} sessions The newly created sessions.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Create a batch of sessions, which can be used to perform transactions that
   * read and/or modify data.
   *
   * **It is unlikely you will need to interact with sessions directly. By
   * default, sessions are created and utilized for maximum performance
   * automatically.**
   *
   * Wrapper around {@link v1.SpannerClient#batchCreateSessions}.
   *
   * @see {@link v1.SpannerClient#batchCreateSessions}
   * @see [BatchCreateSessions API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.BatchCreateSessions)
   *
   * @param {number|BatchCreateSessionsOptions} options Desired session count or
   *     a configuration object.
   * @param {BatchCreateSessionsCallback} [callback] Callback function.
   * @returns {Promise<BatchCreateSessionsResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const count = 5;
   *
   * database.batchCreateSession(count, (err, sessions, response) => {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // `sessions` is an array of Session objects.
   * });
   *
   * @example <caption>If the callback is omitted, we'll return a Promise.</caption>
   * const [sessions, response] = await database.batchCreateSessions(count);
   */
  batchCreateSessions(
    options: number | BatchCreateSessionsOptions,
    callback?: BatchCreateSessionsCallback
  ): void | Promise<BatchCreateSessionsResponse> {
    if (typeof options === 'number') {
      options = {count: options};
    }

    const count = options.count;
    const labels = options.labels || {};

    const reqOpts: google.spanner.v1.IBatchCreateSessionsRequest = {
      database: this.formattedName_,
      sessionTemplate: {labels},
      sessionCount: count,
    };

    this.request<google.spanner.v1.IBatchCreateSessionsResponse>(
      {
        client: 'SpannerClient',
        method: 'batchCreateSessions',
        reqOpts,
        gaxOpts: options.gaxOptions,
        headers: this.resourceHeader_,
      },
      (err, resp) => {
        if (err) {
          callback!(err, null, resp!);
          return;
        }

        const sessions = (resp!.session || []).map(metadata => {
          const session = this.session(metadata.name!);
          session.metadata = metadata;
          return session;
        });

        callback!(null, sessions, resp!);
      }
    );
  }

  /**
   * Get a reference to a {@link BatchTransaction} object.
   *
   * @see {@link BatchTransaction#identifier} to generate an identifier.
   *
   * @param {TransactionIdentifier} identifier The transaction identifier.
   * @param {TransactionOptions} [options] [Transaction options](https://cloud.google.com/spanner/docs/timestamp-bounds).
   * @returns {BatchTransaction} A batch transaction object.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const transaction = database.batchTransaction({
   *   session: 'my-session',
   *   transaction: 'my-transaction',
   *   readTimestamp: 1518464696657
   * });
   */
  batchTransaction(
    identifier: TransactionIdentifier,
    options?: TimestampBounds
  ): BatchTransaction {
    const session =
      typeof identifier.session === 'string'
        ? this.session(identifier.session)
        : identifier.session;
    const id = identifier.transaction;
    const transaction = new BatchTransaction(session, options);
    transaction.id = id;
    transaction.readTimestamp = identifier.timestamp as PreciseDate;
    return transaction;
  }
  close(callback: SessionPoolCloseCallback): void;
  close(): Promise<DatabaseCloseResponse>;
  /**
   * @callback CloseDatabaseCallback
   * @param {?Error} err Request error, if any.
   */
  /**
   * Close the database connection and destroy all sessions associated with it.
   *
   * @param {CloseDatabaseCallback} [callback] Callback function.
   * @returns {Promise}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.close(function(err) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   * });
   *
   * //-
   * // In the event of a session leak, the error object will contain a
   * // `messages` field.
   * //-
   * database.close(function(err) {
   *   if (err && err.messages) {
   *     err.messages.forEach(function(message) {
   *       console.error(message);
   *     });
   *   }
   * });
   */
  close(
    callback?: SessionPoolCloseCallback
  ): void | Promise<DatabaseCloseResponse> {
    const key = this.id!.split('/').pop();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.parent as any).databases_.delete(key);
    this.pool_.close(callback!);
  }
  createBatchTransaction(
    options?: TimestampBounds
  ): Promise<CreateBatchTransactionResponse>;
  createBatchTransaction(callback: CreateBatchTransactionCallback): void;
  createBatchTransaction(
    options: TimestampBounds,
    callback: CreateBatchTransactionCallback
  ): void;
  /**
   * @typedef {array} CreateTransactionResponse
   * @property {BatchTransaction} 0 The {@link BatchTransaction}.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback CreateTransactionCallback
   * @param {?Error} err Request error, if any.
   * @param {BatchTransaction} transaction The {@link BatchTransaction}.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Create a transaction that can be used for batch querying.
   *
   * @param {TransactionOptions} [options] [Transaction options](https://cloud.google.com/spanner/docs/timestamp-bounds).
   * @param {CreateTransactionCallback} [callback] Callback function.
   * @returns {Promise<CreateTransactionResponse>}
   */
  createBatchTransaction(
    optionsOrCallback?: TimestampBounds | CreateBatchTransactionCallback,
    cb?: CreateBatchTransactionCallback
  ): void | Promise<CreateBatchTransactionResponse> {
    const callback =
      typeof optionsOrCallback === 'function'
        ? (optionsOrCallback as CreateBatchTransactionCallback)
        : cb;
    const options =
      typeof optionsOrCallback === 'object'
        ? (optionsOrCallback as TimestampBounds)
        : {};

    this.pool_.getReadSession((err, session) => {
      if (err) {
        callback!(err, null, undefined);
        return;
      }
      const transaction = this.batchTransaction({session: session!}, options);
      this._releaseOnEnd(session!, transaction);
      transaction.begin((err, resp) => {
        if (err) {
          callback!(err, null, resp!);
          return;
        }
        callback!(null, transaction, resp!);
      });
    });
  }
  createSession(options: CreateSessionOptions): Promise<CreateSessionResponse>;
  createSession(callback: CreateSessionCallback): void;
  createSession(
    options: CreateSessionOptions,
    callback: CreateSessionCallback
  ): void;
  /**
   * Create a new session.
   *
   * @typedef {object} CreateSessionOptions
   * @property {Object.<string, string>} [labels] The labels for the session.
   *
   *   * Label keys must be between 1 and 63 characters long and must conform to
   *     the following regular expression: `[a-z]([-a-z0-9]*[a-z0-9])?`.
   *   * Label values must be between 0 and 63 characters long and must conform
   *     to the regular expression `([a-z]([-a-z0-9]*[a-z0-9])?)?`.
   *   * No more than 64 labels can be associated with a given session.
   * @property {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/global.html#CallOptions.
   */
  /**
   * @typedef {array} CreateSessionResponse
   * @property {Session} 0 The newly created session.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback CreateSessionCallback
   * @param {?Error} err Request error, if any.
   * @param {Session} session The newly created session.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Create a new session, which can be used to perform transactions that read
   * and/or modify data.
   *
   * Sessions can only execute one transaction at a time. To execute multiple
   * concurrent read-write/write-only transactions, create multiple sessions.
   * Note that standalone reads and queries use a transaction internally, and
   * count toward the one transaction limit.
   *
   * **It is unlikely you will need to interact with sessions directly. By
   * default, sessions are created and utilized for maximum performance
   * automatically.**
   *
   * Wrapper around {@link v1.SpannerClient#createSession}.
   *
   * @see {@link v1.SpannerClient#createSession}
   * @see [CreateSession API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.CreateSession)
   *
   * @param {object} [options] Configuration object.
   * @param {CreateSessionCallback} [callback] Callback function.
   * @returns {Promise<CreateSessionResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.createSession(function(err, session, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // `session` is a Session object.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.createSession().then(function(data) {
   *   const session = data[0];
   *   const apiResponse = data[1];
   * });
   */
  createSession(
    optionsOrCallback: CreateSessionOptions | CreateSessionCallback,
    cb?: CreateSessionCallback
  ): void | Promise<CreateSessionResponse> {
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object' && optionsOrCallback
        ? extend({}, optionsOrCallback)
        : ({} as CreateSessionOptions);

    const reqOpts: google.spanner.v1.ICreateSessionRequest = {
      database: this.formattedName_,
    };

    if (options.labels) {
      reqOpts.session = {labels: options.labels};
    }

    this.request<google.spanner.v1.ISession>(
      {
        client: 'SpannerClient',
        method: 'createSession',
        reqOpts,
        gaxOpts: options.gaxOptions,
        headers: this.resourceHeader_,
      },
      (err, resp) => {
        if (err) {
          callback(err, null, resp!);
          return;
        }
        const session = this.session(resp!.name!);
        session.metadata = resp;
        callback(null, session, resp!);
      }
    );
  }
  createTable(
    schema: Schema,
    gaxOptions?: CallOptions
  ): Promise<CreateTableResponse>;
  createTable(schema: Schema, callback: CreateTableCallback): void;
  createTable(
    schema: Schema,
    gaxOptions: CallOptions,
    callback: CreateTableCallback
  ): void;
  /**
   * @typedef {array} CreateTableResponse
   * @property {Table} 0 The new {@link Table}.
   * @property {Operation} 1 An {@link Operation} object that can be used to check
   *     the status of the request.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback CreateTableCallback
   * @param {?Error} err Request error, if any.
   * @param {Table} table The new {@link Table}.
   * @param {Operation} operation An {@link Operation} object that can be used to
   *     check the status of the request.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Create a table.
   *
   * Wrapper around {@link Database#updateSchema}.
   *
   * @see {@link Database#updateSchema}
   *
   * @param {string} schema A DDL CREATE statement describing the table.
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {CreateTableCallback} [callback] Callback function.
   * @returns {Promise<CreateTableResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const schema =
   *   'CREATE TABLE Singers (' +
   *   '  SingerId INT64 NOT NULL,' +
   *   '  FirstName STRING(1024),' +
   *   '  LastName STRING(1024),' +
   *   '  SingerInfo BYTES(MAX),' +
   *   ') PRIMARY KEY(SingerId)';
   *
   * database.createTable(schema, function(err, table, operation, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   operation
   *     .on('error', function(err) {})
   *     .on('complete', function() {
   *       // Table created successfully.
   *     });
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.createTable(schema)
   *   .then(function(data) {
   *     const table = data[0];
   *     const operation = data[1];
   *
   *     return operation.promise();
   *   })
   *   .then(function() {
   *     // Table created successfully.
   *   });
   */
  createTable(
    schema: Schema,
    gaxOptionsOrCallback?: CallOptions | CreateTableCallback,
    cb?: CreateTableCallback
  ): void | Promise<CreateTableResponse> {
    const gaxOptions =
      typeof gaxOptionsOrCallback === 'object' ? gaxOptionsOrCallback : {};
    const callback =
      typeof gaxOptionsOrCallback === 'function' ? gaxOptionsOrCallback : cb!;

    this.updateSchema(schema, gaxOptions, (err, operation, resp) => {
      if (err) {
        callback!(err, null, null, resp!);
        return;
      }
      const tableName = (schema as string).match(
        /CREATE TABLE `*([^\s`(]+)/
      )![1];
      const table = this.table(tableName!);
      callback!(null, table, operation!, resp!);
    });
  }
  /**
   * Decorates transaction so that when end() is called it will return the session
   * back into the pool.
   *
   * @private
   *
   * @param {Session} session The session to release.
   * @param {Transaction} transaction The transaction to observe.
   * @returns {Transaction}
   */
  private _releaseOnEnd(session: Session, transaction: Snapshot) {
    transaction.once('end', () => {
      try {
        this.pool_.release(session);
      } catch (e) {
        this.emit('error', e);
      }
    });
  }
  delete(gaxOptions?: CallOptions): Promise<DatabaseDeleteResponse>;
  delete(callback: DatabaseDeleteCallback): void;
  delete(gaxOptions: CallOptions, callback: DatabaseDeleteCallback): void;
  /**
   * Delete the database.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#dropDatabase}.
   *
   * @see {@link v1.DatabaseAdminClient#dropDatabase}
   * @see [DropDatabase API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.DropDatabase)
   *
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {DatabaseDeleteCallback} [callback] Callback function.
   * @returns {Promise<DatabaseDeleteResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.delete(function(err, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Database was deleted successfully.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.delete().then(function(data) {
   *   const apiResponse = data[0];
   * });
   */
  delete(
    optionsOrCallback?: CallOptions | DatabaseDeleteCallback,
    cb?: DatabaseDeleteCallback
  ): void | Promise<DatabaseDeleteResponse> {
    const gaxOpts =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    const reqOpts: databaseAdmin.spanner.admin.database.v1.IDropDatabaseRequest = {
      database: this.formattedName_,
    };
    this.close(() => {
      this.request<r.Response>(
        {
          client: 'DatabaseAdminClient',
          method: 'dropDatabase',
          reqOpts,
          gaxOpts,
          headers: this.resourceHeader_,
        },
        callback!
      );
    });
  }
  exists(gaxOptions?: CallOptions): Promise<[boolean]>;
  exists(callback: ExistsCallback): void;
  exists(gaxOptions: CallOptions, callback: ExistsCallback): void;
  /**
   * @typedef {array} DatabaseExistsResponse
   * @property {boolean} 0 Whether the {@link Database} exists.
   */
  /**
   * @callback DatabaseExistsCallback
   * @param {?Error} err Request error, if any.
   * @param {boolean} exists Whether the {@link Database} exists.
   */
  /**
   * Check if a database exists.
   *
   * @method Database#exists
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {DatabaseExistsCallback} [callback] Callback function.
   * @returns {Promise<DatabaseExistsResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.exists(function(err, exists) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.exists().then(function(data) {
   *   const exists = data[0];
   * });
   */
  exists(
    gaxOptionsOrCallback?: CallOptions | ExistsCallback,
    cb?: ExistsCallback
  ): void | Promise<[boolean]> {
    const gaxOptions =
      typeof gaxOptionsOrCallback === 'object' ? gaxOptionsOrCallback : {};
    const callback =
      typeof gaxOptionsOrCallback === 'function' ? gaxOptionsOrCallback : cb!;

    const NOT_FOUND = 5;

    this.getMetadata(gaxOptions, err => {
      if (err && (err as ApiError).code !== NOT_FOUND) {
        callback!(err);
        return;
      }
      const exists = !err || (err as ApiError).code !== NOT_FOUND;
      callback!(null, exists);
    });
  }
  get(options?: GetDatabaseConfig): Promise<DatabaseResponse>;
  get(callback: DatabaseCallback): void;
  get(options: GetDatabaseConfig, callback: DatabaseCallback): void;
  /**
   * @typedef {array} GetDatabaseResponse
   * @property {Database} 0 The {@link Database}.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetDatabaseCallback
   * @param {?Error} err Request error, if any.
   * @param {Database} database The {@link Database}.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get a database if it exists.
   *
   * You may optionally use this to "get or create" an object by providing an
   * object with `autoCreate` set to `true`. Any extra configuration that is
   * normally required for the `create` method must be contained within this
   * object as well.
   *
   * @param {options} [options] Configuration object.
   * @param {boolean} [options.autoCreate=false] Automatically create the
   *     object if it does not exist.
   * @param {GetDatabaseCallback} [callback] Callback function.
   * @returns {Promise<GetDatabaseResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.get(function(err, database, apiResponse) {
   *   // `database.metadata` has been populated.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.get().then(function(data) {
   *   const database = data[0];
   *   const apiResponse = data[0];
   * });
   */
  get(
    optionsOrCallback?: GetDatabaseConfig | DatabaseCallback,
    cb?: DatabaseCallback
  ): void | Promise<DatabaseResponse> {
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetDatabaseConfig);
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb;
    this.getMetadata(options.gaxOptions!, (err, metadata) => {
      if (err) {
        if (options.autoCreate && (err as ApiError).code === 5) {
          this.create(
            options,
            (err, database: Database, operation: GaxOperation) => {
              if (err) {
                callback!(err as grpc.ServiceError);
                return;
              }
              operation
                .on('error', callback!)
                .on('complete', (metadata: Metadata) => {
                  this.metadata = metadata;
                  callback!(null, this, metadata as r.Response);
                });
            }
          );
          return;
        }
        callback!(err);
        return;
      }
      callback!(null, this, metadata as r.Response);
    });
  }
  getMetadata(gaxOptions?: CallOptions): Promise<GetMetadataResponse>;
  getMetadata(callback: GetMetadataCallback): void;
  getMetadata(gaxOptions: CallOptions, callback: GetMetadataCallback): void;
  /**
   * @typedef {array} GetDatabaseMetadataResponse
   * @property {object} 0 The {@link Database} metadata.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetDatabaseMetadataCallback
   * @param {?Error} err Request error, if any.
   * @param {object} metadata The {@link Database} metadata.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get the database's metadata.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#getDatabase}.
   *
   * @see {@link v1.DatabaseAdminClient#getDatabase}
   * @see [GetDatabase API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.GetDatabase)
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {GetMetadataCallback} [callback] Callback function.
   * @returns {Promise<GetMetadataResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.getMetadata(function(err, metadata) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Database was deleted successfully.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.getMetadata().then(function(data) {
   *   const metadata = data[0];
   *   const apiResponse = data[1];
   * });
   */
  getMetadata(
    gaxOptionsOrCallback?: CallOptions | GetMetadataCallback,
    cb?: GetMetadataCallback
  ): void | Promise<GetMetadataResponse> {
    const callback =
      typeof gaxOptionsOrCallback === 'function'
        ? (gaxOptionsOrCallback as GetMetadataCallback)
        : cb;
    const gaxOpts =
      typeof gaxOptionsOrCallback === 'object'
        ? (gaxOptionsOrCallback as CallOptions)
        : {};

    const reqOpts: databaseAdmin.spanner.admin.database.v1.IGetDatabaseRequest = {
      name: this.formattedName_,
    };
    return this.request(
      {
        client: 'DatabaseAdminClient',
        method: 'getDatabase',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      (err, resp) => {
        if (resp) {
          this.metadata = resp;
        }
        callback!(err, resp);
      }
    );
  }

  getRestoreInfo(
    options?: CallOptions
  ): Promise<IRestoreInfoTranslatedEnum | undefined>;
  getRestoreInfo(callback: GetRestoreInfoCallback): void;
  getRestoreInfo(options: CallOptions, callback: GetRestoreInfoCallback): void;
  /**
   * {@link google.spanner.admin.database.v1#RestoreInfo} structure with restore
   * source type enum translated to string form.
   *
   * @typedef {object} IRestoreInfoTranslatedEnum
   */
  /**
   * Retrieves the restore information of the database.
   *
   * @see {@link #getMetadata}
   *
   * @method Database#getRestoreInfo
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {GetRestoreInfoCallback} [callback] Callback function.
   * @returns {Promise<IRestoreInfoTranslatedEnum | undefined>} When resolved,
   *     contains the restore information for the database if it was restored
   *     from a backup.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const restoreInfo = await database.getRestoreInfo();
   * console.log(`Database restored from ${restoreInfo.backupInfo.backup}`);
   */
  async getRestoreInfo(
    optionsOrCallback?: CallOptions | GetRestoreInfoCallback
  ): Promise<IRestoreInfoTranslatedEnum | undefined> {
    const gaxOptions =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};

    const [metadata] = await this.getMetadata(gaxOptions);
    return metadata.restoreInfo ? metadata.restoreInfo : undefined;
  }

  getState(
    options?: CallOptions
  ): Promise<
    | EnumKey<typeof databaseAdmin.spanner.admin.database.v1.Database.State>
    | undefined
  >;
  getState(callback: GetStateCallback): void;
  getState(options: CallOptions, callback: GetStateCallback): void;
  /**
   * Retrieves the state of the database.
   *
   * The database state indicates if the database is ready after creation or
   * after being restored from a backup.
   *
   * @see {@link #getMetadata}
   *
   * @method Database#getState
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {GetStateCallback} [callback] Callback function.
   * @returns {Promise<EnumKey<typeof, databaseAdmin.spanner.admin.database.v1.Database.State> | undefined>}
   *     When resolved, contains the current state of the database if the state
   *     is defined.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const state = await database.getState();
   * const isReady = (state === 'READY');
   */
  async getState(
    optionsOrCallback?: CallOptions | GetStateCallback
  ): Promise<
    | EnumKey<typeof databaseAdmin.spanner.admin.database.v1.Database.State>
    | undefined
  > {
    const gaxOptions =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};

    const [metadata] = await this.getMetadata(gaxOptions);
    return metadata.state || undefined;
  }

  getSchema(options?: CallOptions): Promise<GetSchemaResponse>;
  getSchema(callback: GetSchemaCallback): void;
  getSchema(options: CallOptions, callback: GetSchemaCallback): void;
  /**
   * @typedef {array} GetSchemaResponse
   * @property {string[]} 0 An array of database DDL statements.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetSchemaCallback
   * @param {?Error} err Request error, if any.
   * @param {string[]} statements An array of database DDL statements.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get this database's schema as a list of formatted DDL statements.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#getDatabaseDdl}.
   *
   * @see {@link v1.DatabaseAdminClient#getDatabaseDdl}
   * @see [Data Definition Language (DDL)](https://cloud.google.com/spanner/docs/data-definition-language)
   * @see [GetDatabaseDdl API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.GetDatabaseDdl)
   *
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {GetSchemaCallback} [callback] Callback function.
   * @returns {Promise<GetSchemaResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.getSchema(function(err, statements, apiResponse) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.getSchema().then(function(data) {
   *   const statements = data[0];
   *   const apiResponse = data[1];
   * });
   */
  getSchema(
    optionsOrCallback?: CallOptions | GetSchemaCallback,
    cb?: GetSchemaCallback
  ): void | Promise<GetSchemaResponse> {
    const gaxOpts =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    const reqOpts: databaseAdmin.spanner.admin.database.v1.IGetDatabaseDdlRequest = {
      database: this.formattedName_,
    };
    this.request<
      databaseAdmin.spanner.admin.database.v1.IGetDatabaseDdlResponse
    >(
      {
        client: 'DatabaseAdminClient',
        method: 'getDatabaseDdl',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err, statements, ...args: any[]) => {
        callback!(err, statements ? statements.statements : null, ...args);
      }
    );
  }
  getSessions(options?: GetSessionsOptions): Promise<GetSessionsResponse>;
  getSessions(callback: GetSessionsCallback): void;
  getSessions(options: GetSessionsOptions, callback: GetSessionsCallback): void;
  /**
   * Options object for listing sessions.
   *
   * @typedef {object} GetSessionsOptions
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
   * @property {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/global.html#CallOptions.
   */
  /**
   * @typedef {array} GetSessionsResponse
   * @property {Session[]} 0 Array of {@link Session} instances.
   * @property {object} 1 A query object to receive more results.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback GetSessionsCallback
   * @param {?Error} err Request error, if any.
   * @param {Session[]} instances Array of {@link Session} instances.
   * @param {object} nextQuery A query object to receive more results.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Gets a list of sessions.
   *
   * Wrapper around {@link v1.SpannerClient#listSessions}
   *
   * @see {@link v1.SpannerClient#listSessions}
   * @see [ListSessions API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ListSessions)
   *
   * @param {GetSessionsOptions} [options] Options object for listing sessions.
   * @param {GetSessionsCallback} [callback] Callback function.
   * @returns {Promise<GetSessionsResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.getSessions(function(err, sessions) {
   *   // `sessions` is an array of `Session` objects.
   * });
   *
   * //-
   * // To control how many API requests are made and page through the results
   * // manually, set `autoPaginate` to `false`.
   * //-
   * function callback(err, sessions, nextQuery, apiResponse) {
   *   if (nextQuery) {
   *     // More results exist.
   *     database.getSessions(nextQuery, callback);
   *   }
   * }
   *
   * database.getInstances({
   *   gaxOptions: {autoPaginate: false}
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.getInstances().then(function(data) {
   *   const sessions = data[0];
   * });
   */
  getSessions(
    optionsOrCallback?: GetSessionsOptions | GetSessionsCallback,
    cb?: GetSessionsCallback
  ): void | Promise<GetSessionsResponse> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetSessionsOptions);
    const gaxOpts = extend(true, {}, options.gaxOptions);
    let reqOpts = extend({}, options, {
      database: this.formattedName_,
    });
    delete reqOpts.gaxOptions;

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    if (gaxOpts) {
      reqOpts = extend(
        {},
        {
          pageSize: gaxOpts.pageSize,
          pageToken: gaxOpts.pageToken,
        },
        reqOpts
      );
      delete gaxOpts.pageSize;
      delete gaxOpts.pageToken;
    }

    this.request<
      google.spanner.v1.ISession,
      google.spanner.v1.IListSessionsResponse
    >(
      {
        client: 'SpannerClient',
        method: 'listSessions',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      (err, sessions, nextPageRequest, ...args) => {
        let sessionInstances: Session[] | null = null;
        if (sessions) {
          sessionInstances = sessions.map(metadata => {
            const session = self.session(metadata.name!);
            session.metadata = metadata;
            return session;
          });
        }
        const nextQuery = nextPageRequest!
          ? extend({}, options, nextPageRequest!)
          : null;
        callback!(err, sessionInstances!, nextQuery, ...args);
      }
    );
  }

  /**
   * Get a list of sessions as a readable object stream.
   *
   * Wrapper around {@link v1.SpannerClient#listSessions}
   *
   * @see {@link v1.SpannerClient#listSessions}
   * @see [ListSessions API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ListSessions)
   *
   * @method Spanner#getSessionsStream
   * @param {GetSessionsOptions} [options] Options object for listing sessions.
   * @returns {ReadableStream} A readable stream that emits {@link Session}
   *     instances.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.getSessionsStream()
   *   .on('error', console.error)
   *   .on('data', function(database) {
   *     // `sessions` is a `Session` object.
   *   })
   *   .on('end', function() {
   *     // All sessions retrieved.
   *   });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * database.getSessionsStream()
   *   .on('data', function(session) {
   *     this.end();
   *   });
   */
  getSessionsStream(options: GetSessionsOptions = {}): NodeJS.ReadableStream {
    const gaxOpts = extend(true, {}, options.gaxOptions);

    let reqOpts = extend({}, options, {
      database: this.formattedName_,
    });
    delete reqOpts.gaxOptions;

    // Copy over pageSize and pageToken values from gaxOptions.
    // However values set on options take precedence.
    if (gaxOpts) {
      reqOpts = extend(
        {},
        {
          pageSize: gaxOpts.pageSize,
          pageToken: gaxOpts.pageToken,
        },
        reqOpts
      );
      delete gaxOpts.pageSize;
      delete gaxOpts.pageToken;
    }

    return this.requestStream({
      client: 'SpannerClient',
      method: 'listSessionsStream',
      reqOpts,
      gaxOpts,
      headers: this.resourceHeader_,
    });
  }

  getSnapshot(options?: TimestampBounds): Promise<[Snapshot]>;
  getSnapshot(callback: GetSnapshotCallback): void;
  getSnapshot(options: TimestampBounds, callback: GetSnapshotCallback): void;
  /**
   * @typedef {array} GetSnapshotResponse
   * @property {Snapshot} 0 The snapshot object.
   */
  /**
   * @callback GetSnapshotCallback
   * @param {?Error} err Request error, if any.
   * @param {Snapshot} snapshot The snapshot object.
   */
  /**
   * Get a read only {@link Snapshot} transaction.
   *
   * Wrapper around {@link v1.SpannerClient#beginTransaction}.
   *
   * **NOTE:** When finished with the Snapshot, {@link Snapshot#end} should be
   * called to release the underlying {@link Session}. **Failure to do could
   * result in a Session leak.**
   *
   * **NOTE:** Since the returned {@link Snapshot} transaction is not a
   * single-use transaction, it is invalid to set the `minReadTimestamp` and
   * `maxStaleness` parameters in {@link TimestampBounds} as those parameters
   * can only be set for single-use transactions.
   * https://cloud.google.com/spanner/docs/reference/rest/v1/TransactionOptions#bounded-staleness
   *
   * @see {@link v1.SpannerClient#beginTransaction}
   *
   * @param {TimestampBounds} [options] Timestamp bounds.
   * @param {GetSnapshotCallback} [callback] Callback function.
   * @returns {Promise<GetSnapshotResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.getSnapshot(function(err, transaction) {
   *   if (err) {
   *    // Error handling omitted.
   *   }
   *
   *   // Should be called when finished with Snapshot.
   *   transaction.end();
   * });
   *
   * @example <caption>If the callback is omitted, we'll return a Promise.
   * </caption>
   * database.getSnapshot().then(function(data) {
   *   const transaction = data[0];
   * });
   *
   * @example <caption>include:samples/transaction.js</caption>
   * region_tag:spanner_read_only_transaction
   * Read-only transaction:
   */
  getSnapshot(
    optionsOrCallback?: TimestampBounds | GetSnapshotCallback,
    cb?: GetSnapshotCallback
  ): void | Promise<[Snapshot]> {
    const callback =
      typeof optionsOrCallback === 'function'
        ? (optionsOrCallback as GetSnapshotCallback)
        : cb;
    const options =
      typeof optionsOrCallback === 'object'
        ? (optionsOrCallback as TimestampBounds)
        : {};

    this.pool_.getReadSession((err, session) => {
      if (err) {
        callback!(err);
        return;
      }

      const snapshot = session!.snapshot(options, this.queryOptions_);

      snapshot.begin(err => {
        if (err) {
          if (isSessionNotFoundError(err)) {
            session!.lastError = err;
            this.pool_.release(session!);
            this.getSnapshot(options, callback!);
          } else {
            this.pool_.release(session!);
            callback!(err);
          }
          return;
        }

        this._releaseOnEnd(session!, snapshot);
        callback!(err, snapshot);
      });
    });
  }
  getTransaction(): Promise<[Transaction]>;
  getTransaction(callback: GetTransactionCallback): void;
  /**
   * @typedef {array} GetTransactionResponse
   * @property {Transaction} 0 The transaction object.
   */
  /**
   * @callback GetTransactionCallback
   * @param {?Error} err Request error, if any.
   * @param {Transaction} transaction The transaction object.
   */
  /**
   * Get a read/write ready {@link Transaction} object.
   *
   * **NOTE:** In the event that you encounter an error while reading/writing,
   * if you decide to forgo calling {@link Transaction#commit} or
   * {@link Transaction#rollback}, then you need to call
   * {@link Transaction#end} to release the underlying {@link Session} object.
   * **Failure to do could result in a Session leak.**
   *
   * Wrapper around {@link v1.SpannerClient#beginTransaction}.
   *
   * @see {@link v1.SpannerClient#beginTransaction}
   *
   * @param {GetTransactionCallback} [callback] Callback function.
   * @returns {Promise<GetTransactionResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.getTransaction(function(err, transaction) {});
   *
   * @example <caption>If the callback is omitted, we'll return a Promise.
   * </caption>
   * database.getTransaction().then(function(data) {
   *   const transaction = data[0];
   * });
   */
  getTransaction(
    callback?: GetTransactionCallback
  ): void | Promise<[Transaction]> {
    this.pool_.getWriteSession((err, session, transaction) => {
      if (!err) {
        this._releaseOnEnd(session!, transaction!);
      }
      callback!(err as grpc.ServiceError | null, transaction);
    });
  }

  getOperations(
    options?: GetDatabaseOperationsOptions
  ): Promise<GetDatabaseOperationsResponse>;
  getOperations(callback: GetDatabaseOperationsCallback): void;
  getOperations(
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
   * @param {GetDatabaseOperationsCallback} [callback] Callback function.
   */
  /**
   * @typedef {array} GetDatabaseOperationsResponse
   * @property {IOperation[]} 0 Array of {@link IOperation} instances.
   * @property {object} 1 The full API response.
   */
  /**
   * List pending and completed operations for the database.
   *
   * @see {@link Instance.getDatabaseOperations}
   *
   * @param {GetDatabaseOperationsOptions} [options] Contains query object for
   *     listing database operations and request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @returns {Promise<GetDatabaseOperationsResponse>} When resolved, contains
   *     a paged list of database operations.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const [operations] = await database.getOperations();
   *
   * //-
   * // To manually handle pagination, set autoPaginate:false in gaxOptions.
   * //-
   * let pageToken = undefined;
   * do {
   *   const [operations, , response] = await database.getOperations({
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
  async getOperations(
    optionsOrCallback?:
      | GetDatabaseOperationsOptions
      | GetDatabaseOperationsCallback
  ): Promise<GetDatabaseOperationsResponse> {
    const options =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    // Create a query that lists database operations only on this database from
    // the instance. Operation name will be prefixed with the database path for
    // all operations on this database
    let dbSpecificFilter = `name:${this.formattedName_}`;
    if (options && options.filter) {
      dbSpecificFilter = `(${dbSpecificFilter}) AND (${options.filter})`;
    }
    const dbSpecificQuery: GetDatabaseOperationsOptions = {
      ...options,
      filter: dbSpecificFilter,
    };

    return this.instance.getDatabaseOperations(dbSpecificQuery);
  }

  makePooledRequest_(config: RequestConfig): Promise<Session>;
  makePooledRequest_(
    config: RequestConfig,
    callback: PoolRequestCallback
  ): void;
  /**
   * Make an API request, first assuring an active session is used.
   *
   * @private
   *
   * @param {object} config Request config
   * @param {function} callback Callback function
   */
  makePooledRequest_(
    config: RequestConfig,
    callback?: PoolRequestCallback
  ): void | Promise<Session> {
    const pool = this.pool_;
    pool.getReadSession((err, session) => {
      if (err) {
        callback!(err, null);
        return;
      }
      config.reqOpts.session = session!.formattedName_;
      this.request<Session>(config, (err, ...args) => {
        pool.release(session!);
        callback!(err, ...args);
      });
    });
  }

  /**
   * Make an API request as a stream, first assuring an active session is used.
   *
   * @private
   *
   * @param {object} config Request config
   * @returns {Stream}
   */
  makePooledStreamingRequest_(config: RequestConfig): Readable {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const pool = this.pool_;
    let requestStream: CancelableDuplex;
    let session: Session | null;
    const waitForSessionStream = streamEvents(through.obj());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (waitForSessionStream as any).abort = () => {
      releaseSession();
      if (requestStream) {
        requestStream.cancel();
      }
    };
    function destroyStream(err: grpc.ServiceError) {
      waitForSessionStream.destroy(err);
    }
    function releaseSession() {
      if (session) {
        pool.release(session);
        session = null;
      }
    }
    waitForSessionStream.on('reading', () => {
      pool.getReadSession((err, session_) => {
        if (err) {
          destroyStream(err);
          return;
        }
        session = session_!;
        config.reqOpts.session = session!.formattedName_;
        requestStream = self.requestStream(config);
        requestStream
          .on('error', releaseSession)
          .on('error', destroyStream)
          .on('end', releaseSession)
          .pipe(waitForSessionStream);
      });
    });
    return waitForSessionStream;
  }

  restore(backupPath: string): Promise<RestoreDatabaseResponse>;
  restore(
    backupPath: string,
    options?: CallOptions
  ): Promise<RestoreDatabaseResponse>;
  restore(backupPath: string, callback: RestoreDatabaseCallback): void;
  restore(
    backupPath: string,
    options: CallOptions,
    callback: RestoreDatabaseCallback
  ): void;
  /**
   * @typedef {array} RestoreDatabaseResponse
   * @property {Database} 0 The new {@link Database}.
   * @property {Operation} 1 An {@link Operation} object that can be used to check
   *     the status of the request.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback RestoreDatabaseCallback
   * @param {?Error} err Request error, if any.
   * @param {Database} database The new {@link Database}.
   * @param {Operation} operation An {@link Operation} object that can be used to
   *     check the status of the request.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Restore a backup into this database.
   *
   * When this call completes, the restore will have commenced but will not
   * necessarily have completed.
   *
   * @param backupPath The path of the backup to restore.
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @returns Promise<RestoreDatabaseResponse> When resolved, contains the restore operation.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const backupName = 'projects/my-project/instances/my-instance/backups/my-backup';
   * const [, restoreOperation] = await database.restore(backupName);
   * // Wait for restore to complete
   * await restoreOperation.promise();
   */
  restore(
    backupName: string,
    optionsOrCallback?: CallOptions | RestoreDatabaseCallback,
    cb?: RestoreDatabaseCallback
  ): Promise<RestoreDatabaseResponse> | void {
    const callback =
      typeof optionsOrCallback === 'function'
        ? (optionsOrCallback as RestoreDatabaseCallback)
        : cb;
    const gaxOpts =
      typeof optionsOrCallback === 'object'
        ? (optionsOrCallback as CallOptions)
        : {};
    const reqOpts: databaseAdmin.spanner.admin.database.v1.IRestoreDatabaseRequest = {
      parent: this.instance.formattedName_,
      databaseId: this.id,
      backup: Backup.formatName_(this.instance.formattedName_, backupName),
    };
    return this.request(
      {
        client: 'DatabaseAdminClient',
        method: 'restoreDatabase',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      (err, operation, resp) => {
        if (err) {
          callback!(err, null, null, resp);
          return;
        }
        callback!(null, this, operation, resp);
      }
    );
  }

  run(query: string | ExecuteSqlRequest): Promise<RunResponse>;
  run(
    query: string | ExecuteSqlRequest,
    options?: TimestampBounds
  ): Promise<RunResponse>;
  run(query: string | ExecuteSqlRequest, callback: RunCallback): void;
  run(
    query: string | ExecuteSqlRequest,
    options: TimestampBounds,
    callback: RunCallback
  ): void;
  /**
   * Transaction options.
   *
   * @typedef {object} DatabaseRunRequest
   * @property {number} [exactStaleness] Executes all reads at the timestamp
   *     that is `exactStaleness` old.
   * @property {date} [readTimestamp] Execute all reads at the given
   *     timestamp.
   * @property {boolean} [strong] Read at the timestamp where all previously
   *     committed transactions are visible.
   */
  /**
   * @typedef {array} RunResponse
   * @property {Array<Row | Json>} 0 Rows are returned as an array objects. Each
   *     object has a `name` and `value` property. To get a serialized object,
   *     call `toJSON()`.
   * @property {?ResultSetStats} 1 Query statistics, if the query is executed in
   *     PLAN or PROFILE mode.
   */
  /**
   * @callback RunCallback
   * @param {?Error} err Request error, if any.
   * @param {Array<Row | Json>} rows Rows are returned as an array of objects.
   *     Each object has a `name` and `value` property. To get a serialized
   *     object, call `toJSON()`.
   * @param {?ResultSetStats} stats Query statistics, if the query is executed
   *     in PLAN or PROFILE mode.
   */
  /**
   * Execute a SQL statement on this database.
   *
   * Wrapper around {@link v1.SpannerClient#executeStreamingSql}.
   *
   * @see {@link v1.SpannerClient#executeStreamingSql}
   * @see [Query Syntax](https://cloud.google.com/spanner/docs/query-syntax)
   * @see [ExecuteSql API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ExecuteSql)
   *
   * @param {string|ExecuteSqlRequest} query A SQL query or
   *     {@link ExecuteSqlRequest} object.
   * @param {TimestampBounds} [options] Snapshot timestamp bounds.
   * @param {RunCallback} [callback] Callback function.
   * @returns {Promise<RunResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const query = 'SELECT * FROM Singers';
   *
   * database.run(query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   const firstRow = rows[0];
   *
   *   // firstRow = [
   *   //   {
   *   //     name: 'SingerId',
   *   //     value: '1'
   *   //   },
   *   //   {
   *   //     name: 'Name',
   *   //     value: 'Eddie Wilson'
   *   //   }
   *   // ]
   * });
   *
   * //-
   * // Rows are returned as an array of object arrays. Each object has a `name`
   * // and `value` property. To get a serialized object, call `toJSON()`.
   * //-
   * database.run(query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   const firstRow = rows[0];
   *
   *   // firstRow.toJSON() = {
   *   //   SingerId: '1',
   *   //   Name: 'Eddie Wilson'
   *   // }
   * });
   *
   * //-
   * // Alternatively, set `query.json` to `true`, and this step will be performed
   * // automatically.
   * //-
   * database.run(query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   const firstRow = rows[0];
   *
   *   // firstRow = {
   *   //   SingerId: '1',
   *   //   Name: 'Eddie Wilson'
   *   // }
   * });
   *
   * //-
   * // The SQL query string can contain parameter placeholders. A parameter
   * // placeholder consists of '@' followed by the parameter name.
   * //-
   * const query = {
   *   sql: 'SELECT * FROM Singers WHERE name = @name',
   *   params: {
   *     name: 'Eddie Wilson'
   *   }
   * };
   *
   * database.run(query, function(err, rows) {});
   *
   * //-
   * // If you need to enforce a specific param type, a types map can be provided.
   * // This is typically useful if your param value can be null.
   * //-
   * const query = {
   *   sql: 'SELECT * FROM Singers WHERE name = @name AND id = @id',
   *   params: {
   *     id: spanner.int(8),
   *     name: null
   *   },
   *   types: {
   *     id: 'int64',
   *     name: 'string'
   *   }
   * };
   *
   * database.run(query, function(err, rows) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.run(query).then(function(data) {
   *   const rows = data[0];
   * });
   *
   * @example <caption>include:samples/crud.js</caption>
   * region_tag:spanner_query_data
   * Full example:
   *
   * @example <caption>include:samples/indexing.js</caption>
   * region_tag:spanner_query_data_with_index
   * Querying data with an index:
   */
  run(
    query: string | ExecuteSqlRequest,
    optionsOrCallback?: TimestampBounds | RunCallback,
    cb?: RunCallback
  ): void | Promise<RunResponse> {
    let stats: ResultSetStats;
    const rows: Row[] = [];
    const callback =
      typeof optionsOrCallback === 'function'
        ? (optionsOrCallback as RunCallback)
        : cb;
    const options =
      typeof optionsOrCallback === 'object'
        ? (optionsOrCallback as TimestampBounds)
        : {};

    this.runStream(query, options)
      .on('error', callback!)
      .on('stats', _stats => (stats = _stats))
      .on('data', row => {
        rows.push(row);
      })
      .on('end', () => {
        callback!(null, rows, stats);
      });
  }
  runPartitionedUpdate(query: string | ExecuteSqlRequest): Promise<[number]>;
  runPartitionedUpdate(
    query: string | ExecuteSqlRequest,
    callback?: RunUpdateCallback
  ): void;
  /**
   * Partitioned DML transactions are used to execute DML statements with a
   * different execution strategy that provides different, and often better,
   * scalability properties for large, table-wide operations than DML in a
   * Transaction transaction. Smaller scoped statements, such as an OLTP workload,
   * should prefer using Transaction transactions.
   *
   * @see {@link Transaction#runUpdate}
   *
   * @param {string|object} query A DML statement or
   *     [`ExecuteSqlRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
   *     object.
   * @param {object} [query.params] A map of parameter name to values.
   * @param {object} [query.types] A map of parameter types.
   * @param {RunUpdateCallback} [callback] Callback function.
   * @returns {Promise<RunUpdateResponse>}
   */
  runPartitionedUpdate(
    query: string | ExecuteSqlRequest,
    callback?: RunUpdateCallback
  ): void | Promise<[number]> {
    this.pool_.getReadSession((err, session) => {
      if (err) {
        callback!(err, 0);
        return;
      }

      this._runPartitionedUpdate(session!, query, callback);
    });
  }

  _runPartitionedUpdate(
    session: Session,
    query: string | ExecuteSqlRequest,
    callback?: RunUpdateCallback
  ): void | Promise<number> {
    const transaction = session.partitionedDml();

    transaction.begin(err => {
      if (err) {
        this.pool_.release(session!);
        callback!(err, 0);
        return;
      }

      transaction.runUpdate(query, (err, updateCount) => {
        if (err) {
          if (err.code !== grpc.status.ABORTED) {
            this.pool_.release(session!);
            callback!(err, 0);
            return;
          }
          this._runPartitionedUpdate(session, query, callback);
        } else {
          this.pool_.release(session!);
          callback!(null, updateCount);
          return;
        }
      });
    });
  }

  /**
   * Create a readable object stream to receive resulting rows from a SQL
   * statement.
   *
   * Wrapper around {@link v1.SpannerClient#executeStreamingSql}.
   *
   * @see {@link v1.SpannerClient#executeStreamingSql}
   * @see [Query Syntax](https://cloud.google.com/spanner/docs/query-syntax)
   * @see [ExecuteSql API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ExecuteSql)
   *
   * @fires PartialResultStream#response
   *
   * @param {string|ExecuteSqlRequest} query A SQL query or
   *     {@link ExecuteSqlRequest} object.
   * @param {TimestampBounds} [options] Snapshot timestamp bounds.
   * @returns {ReadableStream} A readable stream that emits rows.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const query = 'SELECT * FROM Singers';
   *
   * database.runStream(query)
   *   .on('error', function(err) {})
   *   .on('data', function(row) {
   *     // row = [
   *     //   {
   *     //     name: 'SingerId',
   *     //     value: '1'
   *     //   },
   *     //   {
   *     //     name: 'Name',
   *     //     value: 'Eddie Wilson'
   *     //   }
   *     // ]
   *   // ]
   *   })
   *   .on('end', function() {
   *     // All results retrieved.
   *   });
   *
   * //-
   * // Rows are returned as an array of objects. Each object has a `name` and
   * // `value` property. To get a serialized object, call `toJSON()`.
   * //-
   * database.runStream(query)
   *   .on('error', function(err) {})
   *   .on('data', function(row) {
   *     // row.toJSON() = {
   *     //   SingerId: '1',
   *     //   Name: 'Eddie Wilson'
   *     // }
   *   })
   *   .on('end', function() {
   *     // All results retrieved.
   *   });
   *
   * //-
   * // Alternatively, set `query.json` to `true`, and this step will be performed
   * // automatically.
   * //-
   * query.json = true;
   *
   * database.runStream(query)
   *   .on('error', function(err) {})
   *   .on('data', function(row) {
   *     // row = {
   *     //   SingerId: '1',
   *     //   Name: 'Eddie Wilson'
   *     // }
   *   })
   *   .on('end', function() {
   *     // All results retrieved.
   *   });
   *
   * //-
   * // The SQL query string can contain parameter placeholders. A parameter
   * // placeholder consists of '@' followed by the parameter name.
   * //-
   * const query = {
   *   sql: 'SELECT * FROM Singers WHERE name = @name',
   *   params: {
   *     name: 'Eddie Wilson'
   *   }
   * };
   *
   * database.runStream(query)
   *   .on('error', function(err) {})
   *   .on('data', function(row) {})
   *   .on('end', function() {});
   *
   * //-
   * // If you need to enforce a specific param type, a types map can be provided.
   * // This is typically useful if your param value can be null.
   * //-
   * const query = {
   *   sql: 'SELECT * FROM Singers WHERE name = @name',
   *   params: {
   *     name: 'Eddie Wilson'
   *   },
   *   types: {
   *     name: 'string'
   *   }
   * };
   *
   * database.runStream(query)
   *   .on('error', function(err) {})
   *   .on('data', function(row) {})
   *   .on('end', function() {});
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * database.runStream(query)
   *   .on('data', function(row) {
   *     this.end();
   *   });
   */
  runStream(
    query: string | ExecuteSqlRequest,
    options?: TimestampBounds
  ): PartialResultStream {
    const proxyStream: Transform = through.obj();

    this.pool_.getReadSession((err, session) => {
      if (err) {
        proxyStream.destroy(err);
        return;
      }

      const snapshot = session!.snapshot(options, this.queryOptions_);

      this._releaseOnEnd(session!, snapshot);

      let dataReceived = false;
      let dataStream = snapshot.runStream(query);
      const endListener = () => snapshot.end();
      dataStream
        .once('data', () => (dataReceived = true))
        .once('error', err => {
          if (
            !dataReceived &&
            isSessionNotFoundError(err as grpc.ServiceError)
          ) {
            // If it is a 'Session not found' error and we have not yet received
            // any data, we can safely retry the query on a new session.
            // Register the error on the session so the pool can discard it.
            if (session) {
              session.lastError = err as grpc.ServiceError;
            }
            // Remove the current data stream from the end user stream.
            dataStream.unpipe(proxyStream);
            dataStream.removeListener('end', endListener);
            dataStream.end();
            snapshot.end();
            // Create a new data stream and add it to the end user stream.
            dataStream = this.runStream(query, options);
            dataStream.pipe(proxyStream);
          } else {
            proxyStream.destroy(err);
            snapshot.end();
          }
        })
        .on('stats', stats => proxyStream.emit('stats', stats))
        .once('end', endListener)
        .pipe(proxyStream);
    });

    return proxyStream as PartialResultStream;
  }

  runTransaction(runFn: RunTransactionCallback): void;
  runTransaction(
    options: RunTransactionOptions,
    runFn: RunTransactionCallback
  ): void;
  /**
   * A transaction in Cloud Spanner is a set of reads and writes that execute
   * atomically at a single logical point in time across columns, rows, and tables
   * in a database.
   *
   * Note that Cloud Spanner does not support nested transactions. If a new
   * transaction is started inside of the run function, it will be an independent
   * transaction.
   *
   * The callback you provide to this function will become the "run function". It
   * will be executed with either an error or a {@link Transaction}
   * object. The Transaction object will let you run queries and queue mutations
   * until you are ready to {@link Transaction#commit}.
   *
   * In the event that an aborted error occurs, we will re-run the `runFn` in its
   * entirety. If you prefer to handle aborted errors for yourself please refer to
   * {@link Database#getTransaction}.
   *
   * **NOTE:** In the event that you encounter an error while reading/writing,
   * if you decide to forgo calling {@link Transaction#commit} or
   * {@link Transaction#rollback}, then you need to call
   * {@link Transaction#end} to release the underlying {@link Session} object.
   * **Failure to do could result in a Session leak.**
   *
   * For a more complete listing of functionality available to a Transaction, see
   * the {@link Transaction} API documentation. For a general overview of
   * transactions within Cloud Spanner, see
   * [Transactions](https://cloud.google.com/spanner/docs/transactions) from the
   * official Cloud Spanner documentation.
   *
   * If you would like to run a transaction and receive a promise or use
   * async/await, use {@link Database#runTransactionAsync}.
   *
   * @see [Transactions](https://cloud.google.com/spanner/docs/transactions)
   *
   * @param {RunTransactionOptions} [options] Transaction runner options.
   * @param {RunTransactionCallback} callback A function to execute in the context
   *     of a transaction.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Run a transactional query.
   *   transaction.run('SELECT * FROM Singers', function(err, rows) {
   *     if (err) {
   *       // Error handling omitted.
   *     }
   *
   *     // Queue a mutation (note that there is no callback passed to `insert`).
   *     transaction.insert('Singers', {
   *       SingerId: 'Id3b',
   *       Name: 'Joe West'
   *     });
   *
   *     // Commit the transaction.
   *     transaction.commit(function(err) {
   *       if (!err) {
   *         // Transaction committed successfully.
   *       }
   *     });
   *   });
   * });
   *
   * @example <caption>include:samples/transaction.js</caption>
   * region_tag:spanner_read_write_transaction
   * Read-write transaction:
   */
  runTransaction(
    optionsOrRunFn: RunTransactionOptions | RunTransactionCallback,
    fn?: RunTransactionCallback
  ): void {
    const runFn =
      typeof optionsOrRunFn === 'function'
        ? (optionsOrRunFn as RunTransactionCallback)
        : fn;
    const options =
      typeof optionsOrRunFn === 'object' && optionsOrRunFn
        ? (optionsOrRunFn as RunTransactionOptions)
        : {};

    this.pool_.getWriteSession((err, session?, transaction?) => {
      if (err && isSessionNotFoundError(err as grpc.ServiceError)) {
        this.runTransaction(options, runFn!);
        return;
      }
      if (err) {
        runFn!(err as grpc.ServiceError);
        return;
      }

      const release = this.pool_.release.bind(this.pool_, session!);
      const runner = new TransactionRunner(
        session!,
        transaction!,
        runFn!,
        options
      );

      runner.run().then(release, err => {
        if (isSessionNotFoundError(err)) {
          release();
          this.runTransaction(options, runFn!);
        } else {
          setImmediate(runFn!, err);
          release();
        }
      });
    });
  }

  runTransactionAsync<T = {}>(
    runFn: AsyncRunTransactionCallback<T>
  ): Promise<T>;
  runTransactionAsync<T = {}>(
    options: RunTransactionOptions,
    runFn: AsyncRunTransactionCallback<T>
  ): Promise<T>;
  /**
   * A transaction in Cloud Spanner is a set of reads and writes that execute
   * atomically at a single logical point in time across columns, rows, and tables
   * in a database.
   *
   * Note that Cloud Spanner does not support nested transactions. If a new
   * transaction is started inside of the run function, it will be an independent
   * transaction.
   *
   * The async function you provide will become the "run function". It
   * will be executed with a {@link Transaction}
   * object. The Transaction object will let you run queries and queue mutations
   * until you are ready to {@link Transaction#commit}.
   *
   * In the event that an aborted error occurs, we will re-run the `runFn` in its
   * entirety. If you prefer to handle aborted errors for yourself please refer to
   * {@link Database#getTransaction}.
   *
   * **NOTE:** In the event that you encounter an error while reading/writing,
   * if you decide to forgo calling {@link Transaction#commit} or
   * {@link Transaction#rollback}, then you need to call
   * {@link Transaction#end} to release the underlying {@link Session} object.
   * **Failure to do could result in a Session leak.**
   *
   * For a more complete listing of functionality available to a Transaction, see
   * the {@link Transaction} API documentation. For a general overview of
   * transactions within Cloud Spanner, see
   * [Transactions](https://cloud.google.com/spanner/docs/transactions) from the
   * official Cloud Spanner documentation.
   *
   * @see [Transactions](https://cloud.google.com/spanner/docs/transactions)
   *
   * @param {RunTransactionOptions} [options] Transaction runner options.
   * @param {AsyncRunTransactionCallback} callback A function to execute in the
   *      context of a transaction.
   * @returns {Promise}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const data = await database.runTransactionAsync(async (transaction) => {
   *   const [rows] = await transaction.run('SELECT * FROM MyTable');
   *   const data = rows.map(row => row.thing);
   *
   *   await transaction.commit();
   *   return data;
   * });
   */
  async runTransactionAsync<T = {}>(
    optionsOrRunFn: RunTransactionOptions | AsyncRunTransactionCallback<T>,
    fn?: AsyncRunTransactionCallback<T>
  ): Promise<T> {
    const runFn =
      typeof optionsOrRunFn === 'function'
        ? (optionsOrRunFn as AsyncRunTransactionCallback<T>)
        : fn!;
    const options =
      typeof optionsOrRunFn === 'object'
        ? (optionsOrRunFn as RunTransactionOptions)
        : {};

    const getWriteSession = this.pool_.getWriteSession.bind(this.pool_);
    // Loop to retry 'Session not found' errors.
    // (and yes, we like while (true) more than for (;;) here)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const [session, transaction] = await promisify(getWriteSession)();
        const runner = new AsyncTransactionRunner<T>(
          session,
          transaction,
          runFn,
          options
        );

        try {
          return await runner.run();
        } finally {
          this.pool_.release(session);
        }
      } catch (e) {
        if (!isSessionNotFoundError(e)) {
          throw e;
        }
      }
    }
  }
  /**
   * Create a Session object.
   *
   * It is unlikely you will need to interact with sessions directly. By default,
   * sessions are created and utilized for maximum performance automatically.
   *
   * @param {string} [name] The name of the session. If not provided, it is
   *     assumed you are going to create it.
   * @returns {Session} A Session object.
   *
   * @example
   * var session = database.session('session-name');
   */
  session(name?: string) {
    return new Session(this, name);
  }
  /**
   * Get a reference to a Table object.
   *
   * @throws {Error} If a name is not provided.
   *
   * @param {string} name The name of the table.
   * @return {Table} A Table object.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const table = database.table('Singers');
   */
  table(name: string) {
    if (!name) {
      throw new Error('A name is required to access a Table object.');
    }
    return new Table(this, name);
  }
  updateSchema(
    statements: Schema,
    gaxOptions?: CallOptions
  ): Promise<UpdateSchemaResponse>;
  updateSchema(statements: Schema, callback: UpdateSchemaCallback): void;
  updateSchema(
    statements: Schema,
    gaxOptions: CallOptions,
    callback: UpdateSchemaCallback
  ): void;
  /**
   * Update the schema of the database by creating/altering/dropping tables,
   * columns, indexes, etc.
   *
   * This method immediately responds with an Operation object. Register event
   * handlers for the "error" and "complete" events to see how the operation
   * finishes. Follow along with the examples below.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#updateDatabaseDdl}.
   *
   * @see {@link v1.DatabaseAdminClient#updateDatabaseDdl}
   * @see [Data Definition Language (DDL)](https://cloud.google.com/spanner/docs/data-definition-language)
   * @see [Schema and Data Model](https://cloud.google.com/spanner/docs/schema-and-data-model)
   * @see [UpdateDatabaseDdl API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.UpdateDatabaseDdlRequest)
   *
   * @param {string|string[]|object} statements An array of database DDL
   *     statements, or an
   *     [`UpdateDatabaseDdlRequest` object](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.UpdateDatabaseDdlRequest).
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {LongRunningOperationCallback} [callback] Callback function.
   * @returns {Promise<LongRunningOperationResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const statements = [
   *   'CREATE TABLE Singers (' +
   *   '  SingerId INT64 NOT NULL,' +
   *   '  FirstName STRING(1024),' +
   *   '  LastName STRING(1024),' +
   *   '  SingerInfo BYTES(MAX),' +
   *   ') PRIMARY KEY(SingerId)'
   * ];
   *
   * database.updateSchema(statements, function(err, operation, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   operation
   *     .on('error', function(err) {})
   *     .on('complete', function() {
   *       // Database schema updated successfully.
   *     });
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.updateSchema(statements)
   *   .then(function(data) {
   *     const operation = data[0];
   *     return operation.promise();
   *   })
   *   .then(function() {
   *     // Database schema updated successfully.
   *   });
   *
   * @example <caption>include:samples/schema.js</caption>
   * region_tag:spanner_add_column
   * Adding a column:
   *
   * @example <caption>include:samples/indexing.js</caption>
   * region_tag:spanner_create_index
   * Creating an index:
   *
   * @example <caption>include:samples/indexing.js</caption>
   * region_tag:spanner_create_storing_index
   * Creating a storing index:
   */
  updateSchema(
    statements: Schema,
    optionsOrCallback?: CallOptions | UpdateSchemaCallback,
    cb?: UpdateSchemaCallback
  ): Promise<UpdateSchemaResponse> | void {
    const gaxOpts =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    if (typeof statements === 'string' || Array.isArray(statements)) {
      statements = {
        statements: arrify(statements) as string[],
      };
    }
    const reqOpts: databaseAdmin.spanner.admin.database.v1.IUpdateDatabaseDdlRequest = extend(
      {
        database: this.formattedName_,
      },
      statements
    );
    return this.request(
      {
        client: 'DatabaseAdminClient',
        method: 'updateDatabaseDdl',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      callback!
    );
  }
  /**
   * Format the database name to include the instance name.
   *
   * @private
   *
   * @param {string} instanceName The formatted instance name.
   * @param {string} name The table name.
   * @returns {string}
   *
   * @example
   * Database.formatName_(
   *   'projects/grape-spaceship-123/instances/my-instance',
   *   'my-database'
   * );
   * // 'projects/grape-spaceship-123/instances/my-instance/databases/my-database'
   */
  static formatName_(instanceName: string, name: string) {
    if (name.indexOf('/') > -1) {
      return name;
    }
    const databaseName = name.split('/').pop();
    return instanceName + '/databases/' + databaseName;
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Database, {
  exclude: [
    'batchTransaction',
    'getRestoreInfo',
    'getState',
    'getOperations',
    'runTransaction',
    'runTransactionAsync',
    'table',
    'session',
  ],
});

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
callbackifyAll(Database, {
  exclude: [
    'create',
    'batchCreateSessions',
    'batchTransaction',
    'close',
    'createBatchTransaction',
    'createSession',
    'createTable',
    'delete',
    'exists',
    'get',
    'getMetadata',
    'getSchema',
    'getSessions',
    'getSnapshot',
    'getTransaction',
    'restore',
    'run',
    'runPartitionedUpdate',
    'runTransaction',
    'runTransactionAsync',
    'session',
    'table',
    'updateSchema',
  ],
});

/**
 * Reference to the {@link Database} class.
 * @name module:@google-cloud/spanner.Database
 * @see Database
 */
export {Database};
