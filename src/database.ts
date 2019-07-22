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
  DeleteCallback,
  ExistsCallback,
  Metadata,
  MetadataCallback,
  ServiceObjectConfig,
} from '@google-cloud/common';
import {ServiceObject} from '@google-cloud/common-grpc';
import {promisify, promisifyAll} from '@google-cloud/promisify';
import arrify = require('arrify');
import * as extend from 'extend';
import * as is from 'is';
import * as r from 'request';
import * as streamEvents from 'stream-events';
import * as through from 'through2';

import {BatchTransaction} from './batch-transaction';
import {codec} from './codec';
import {Instance} from './instance';
import {
  partialResultStream,
  PartialResultStream,
} from './partial-result-stream';
import {Session} from './session';
import {SessionPool} from './session-pool';
import {Table} from './table';
import {
  PartitionedDml,
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

export interface GetDatabaseOptions {
  autoCreate?: boolean;
}
export type DatabaseResponse = [Database, r.Response];
export interface DatabaseCallback {
  (err: Error | null, database?: Database, apiResponse?: r.Response): void;
}

export interface GetSnapshotCallback {
  (err: Error, snapshot?: null): void;
  (err: null, snapshot: Snapshot): void;
}

export interface GetTransactionCallback {
  (err: Error, transaction?: null): void;
  (err: null, transaction: Transaction): void;
}

/**
 * Create a Database object to interact with a Cloud Spanner database.
 *
 * @class
 *
 * @param {string} name Name of the database.
 * @param {SessionPoolOptions|SessionPoolInterface} options Session pool
 *     configuration options or custom pool interface.
 *
 * @example
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 */
class Database extends ServiceObject {
  formattedName_: string;
  pool_: SessionPool;
  constructor(instance: Instance, name: string, poolOptions?) {
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
      createMethod: (_, options, callback) => {
        return instance.createDatabase(formattedName_, options, callback);
      },
    } as {}) as ServiceObjectConfig);

    this.formattedName_ = formattedName_;
    this.request = instance.request;
    this.requestStream = instance.requestStream;
    // tslint:disable-next-line variable-name
    let PoolCtor = SessionPool;
    if (is.fn(poolOptions)) {
      PoolCtor = poolOptions;
      poolOptions = null;
    }
    this.pool_ = new PoolCtor(this, poolOptions);
    this.pool_.on('error', this.emit.bind(this, 'error'));
    this.pool_.open();
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
  batchTransaction(identifier, options?) {
    let session = identifier.session;
    const id = identifier.transaction;
    if (is.string(session)) {
      session = this.session(session);
    }
    const transaction = new BatchTransaction(session, options);
    transaction.id = id;
    transaction.readTimestamp = identifier.readTimestamp;
    return transaction;
  }
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
  close(callback) {
    const key = this.id!.split('/').pop();
    // tslint:disable-next-line no-any
    (this.parent as any).databases_.delete(key);
    this.pool_.close(callback);
  }
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
  createBatchTransaction(options, callback) {
    if (is.fn(options)) {
      callback = options;
      options = null;
    }
    this.createSession((err, session, resp) => {
      if (err) {
        callback(err, null, resp);
        return;
      }
      const transaction = this.batchTransaction({session}, options);
      transaction.begin((err, resp) => {
        if (err) {
          callback(err, null, resp);
          return;
        }
        callback(null, transaction, resp);
      });
    });
  }
  /**
   * @typedef {array} CreateSessionResponse
   * @property {Session} 0 The newly created session.
   * @property {object} 2 The full API response.
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
  createSession(options, callback?) {
    if (is.function(options)) {
      callback = options;
      options = {};
    }

    const gaxOpts = extend({}, options);
    // tslint:disable-next-line no-any
    const reqOpts: any = {
      database: this.formattedName_,
    };

    if (gaxOpts.labels) {
      reqOpts.session = {labels: gaxOpts.labels};
      delete gaxOpts.labels;
    }

    this.request(
      {
        client: 'SpannerClient',
        method: 'createSession',
        reqOpts,
        gaxOpts,
      },
      (err, resp) => {
        if (err) {
          callback(err, null, resp);
          return;
        }
        const session = this.session(resp.name);
        session.metadata = resp;
        callback(null, session, resp);
      }
    );
  }
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
  createTable(schema, callback) {
    this.updateSchema(schema, (err, operation, resp) => {
      if (err) {
        callback(err, null, null, resp);
        return;
      }
      const tableName = schema.match(/CREATE TABLE `*([^\s`(]+)/)[1];
      const table = this.table(tableName);
      callback(null, table, operation, resp);
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
  private _releaseOnEnd(session, transaction) {
    transaction.once('end', () => {
      try {
        this.pool_.release(session);
      } catch (e) {
        this.emit('error', e);
      }
    });
  }
  delete(): Promise<[r.Response]>;
  delete(callback: DeleteCallback): void;
  /**
   * Delete the database.
   *
   * Wrapper around {@link v1.DatabaseAdminClient#dropDatabase}.
   *
   * @see {@link v1.DatabaseAdminClient#dropDatabase}
   * @see [DropDatabase API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.database.v1#google.spanner.admin.database.v1.DatabaseAdmin.DropDatabase)
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
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
  delete(callback?: DeleteCallback): void | Promise<[r.Response]> {
    const reqOpts = {
      database: this.formattedName_,
    };
    this.close(() => {
      this.request(
        {
          client: 'DatabaseAdminClient',
          method: 'dropDatabase',
          reqOpts,
        },
        callback!
      );
    });
  }
  exists(): Promise<[boolean]>;
  exists(callback: ExistsCallback): void;
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
  exists(callback?: ExistsCallback): void | Promise<[boolean]> {
    const NOT_FOUND = 5;

    this.getMetadata(err => {
      if (err && (err as ApiError).code !== NOT_FOUND) {
        callback!(err);
        return;
      }
      const exists = !err || (err as ApiError).code !== NOT_FOUND;
      callback!(null, exists);
    });
  }
  get(options?: GetDatabaseOptions): Promise<DatabaseResponse>;
  get(options: GetDatabaseOptions, callback: DatabaseCallback): void;
  get(callback: DatabaseCallback): void;
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
    optionsOrCallback?: GetDatabaseOptions | DatabaseCallback,
    cb?: DatabaseCallback
  ): void | Promise<DatabaseResponse> {
    const options =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb;
    this.getMetadata((err, metadata) => {
      if (err) {
        if (options.autoCreate && (err as ApiError).code === 5) {
          this.create(options, (err, database, operation) => {
            if (err) {
              callback!(err);
              return;
            }
            operation!.on('error', callback!).on('complete', metadata => {
              this.metadata = metadata;
              callback!(null, this, metadata);
            });
          });
          return;
        }
        callback!(err);
        return;
      }
      callback!(null, this, metadata);
    });
  }
  getMetadata(): Promise<Metadata>;
  getMetadata(callback: MetadataCallback): void;
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
   *
   * @param {GetDatabaseMetadataCallback} [callback] Callback function.
   * @returns {Promise<GetDatabaseMetadataResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.getMetadata(function(err, metadata, apiResponse) {
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
  getMetadata(callback?: MetadataCallback): void | Promise<Metadata> {
    const reqOpts = {
      name: this.formattedName_,
    };
    return this.request(
      {
        client: 'DatabaseAdminClient',
        method: 'getDatabase',
        reqOpts,
      },
      callback!
    );
  }
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
  getSchema(callback) {
    const reqOpts = {
      database: this.formattedName_,
    };
    this.request(
      {
        client: 'DatabaseAdminClient',
        method: 'getDatabaseDdl',
        reqOpts,
      },
      // tslint:disable-next-line only-arrow-functions
      function(err, statements) {
        if (statements) {
          arguments[1] = statements.statements;
        }
        callback.apply(null, arguments);
      }
    );
  }
  /**
   * Options object for listing sessions.
   *
   * @typedef {object} GetSessionsRequest
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
   * @typedef {array} GetSessionsResponse
   * @property {Session[]} 0 Array of {@link Session} instances.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetSessionsCallback
   * @param {?Error} err Request error, if any.
   * @param {Session[]} instances Array of {@link Session} instances.
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
   * @param {GetSessionsRequest} [options] Options object for listing sessions.
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
   *   autoPaginate: false
   * }, callback);
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * database.getInstances().then(function(data) {
   *   const sessions = data[0];
   * });
   */
  getSessions(options, callback) {
    const self = this;
    if (is.fn(options)) {
      callback = options;
      options = {};
    }
    const gaxOpts = options.gaxOptions;
    const reqOpts = extend({}, options, {database: this.formattedName_});
    delete reqOpts.gaxOptions;
    this.request(
      {
        client: 'SpannerClient',
        method: 'listSessions',
        reqOpts,
        gaxOpts,
      },
      // tslint:disable-next-line only-arrow-functions
      function(err, sessions) {
        if (sessions) {
          arguments[1] = sessions.map(metadata => {
            const session = self.session(metadata.name);
            session.metadata = metadata;
            return session;
          });
        }
        callback.apply(null, arguments);
      }
    );
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
    let options: TimestampBounds;
    let callback: GetSnapshotCallback;

    if (is.fn(optionsOrCallback)) {
      callback = optionsOrCallback! as GetSnapshotCallback;
      options = {};
    } else {
      options = optionsOrCallback as TimestampBounds;
      callback = cb!;
    }

    this.pool_.getReadSession((err, session) => {
      if (err) {
        callback(err);
        return;
      }

      const snapshot = session.snapshot(options);

      snapshot.begin((err: null | Error): void => {
        if (err) {
          this.pool_.release(session);
          callback(err);
          return;
        }

        this._releaseOnEnd(session, snapshot);
        callback(err, snapshot);
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
        this._releaseOnEnd(session, transaction);
      }
      callback!(err, transaction);
    });
  }
  /**
   * Make an API request, first assuring an active session is used.
   *
   * @private
   *
   * @param {object} config Request config
   * @param {function} callback Callback function
   */
  makePooledRequest_(config, callback) {
    const pool = this.pool_;
    pool.getReadSession((err, session) => {
      if (err) {
        callback(err, null);
        return;
      }
      config.reqOpts.session = session!.formattedName_;
      // tslint:disable-next-line only-arrow-functions
      this.request(config, function() {
        pool.release(session!);
        callback.apply(null, arguments);
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
  makePooledStreamingRequest_(config) {
    const self = this;
    const pool = this.pool_;
    let requestStream;
    let session;
    const waitForSessionStream = streamEvents(through.obj());
    // tslint:disable-next-line no-any
    (waitForSessionStream as any).abort = () => {
      releaseSession();
      if (requestStream) {
        requestStream.cancel();
      }
    };
    function destroyStream(err) {
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
        session = session_;
        config.reqOpts.session = session.formattedName_;
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
   * @property {array[]} 0 Rows are returned as an array of objects. Each object
   *     has a `name` and `value` property. To get a serialized object, call
   *     `toJSON()`.
   */
  /**
   * @callback RunCallback
   * @param {?Error} err Request error, if any.
   * @param {array[]} rows Rows are returned as an array of objects. Each object
   *     has a `name` and `value` property. To get a serialized object, call
   *     `toJSON()`.
   * @param {object} stats Stats returned for the provided SQL statement.
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
  run(query, options, callback) {
    const rows: Array<{}> = [];
    if (is.fn(options)) {
      callback = options;
      options = null;
    }
    this.runStream(query, options)
      .on('error', callback)
      .on('data', row => {
        rows.push(row);
      })
      .on('end', () => {
        callback(null, rows);
      });
  }
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
  runPartitionedUpdate(query, callback) {
    this.pool_.getReadSession((err, session) => {
      if (err) {
        callback(err, 0);
        return;
      }

      const transaction = session.partitionedDml();

      transaction.begin((err: null | Error) => {
        if (err) {
          this.pool_.release(session);
          callback(err, 0);
          return;
        }

        this._releaseOnEnd(session, transaction);
        transaction.runUpdate(query, callback);
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
  runStream(query, options = {}): PartialResultStream {
    const proxyStream = through.obj();

    this.pool_.getReadSession((err, session) => {
      if (err) {
        proxyStream.destroy(err);
        return;
      }

      const snapshot = session.snapshot(options);

      this._releaseOnEnd(session, snapshot);

      snapshot
        .runStream(query)
        .once('error', err => {
          proxyStream.destroy(err);
          snapshot.end();
        })
        .once('end', () => snapshot.end())
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
    let options: RunTransactionOptions;
    let runFn: RunTransactionCallback;

    if (is.fn(optionsOrRunFn)) {
      runFn = optionsOrRunFn as RunTransactionCallback;
      options = {};
    } else {
      options = optionsOrRunFn as RunTransactionOptions;
      runFn = fn!;
    }

    this.pool_.getWriteSession((err, session, transaction) => {
      if (err) {
        runFn(err);
        return;
      }

      const release = this.pool_.release.bind(this.pool_, session);
      const runner = new TransactionRunner(
        session,
        transaction,
        runFn,
        options
      );

      runner.run().then(release, err => {
        setImmediate(runFn, err);
        release();
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
    let options: RunTransactionOptions;
    let runFn: AsyncRunTransactionCallback<T>;

    if (is.fn(optionsOrRunFn)) {
      runFn = optionsOrRunFn as AsyncRunTransactionCallback<T>;
      options = {};
    } else {
      options = optionsOrRunFn as RunTransactionOptions;
      runFn = fn!;
    }

    const getWriteSession = this.pool_.getWriteSession.bind(this.pool_);
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
  table(name) {
    if (!name) {
      throw new Error('A name is required to access a Table object.');
    }
    return new Table(this, name);
  }
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
  updateSchema(statements, callback) {
    if (!is.object(statements)) {
      statements = {
        statements: arrify(statements),
      };
    }
    const reqOpts = extend(
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
      },
      callback
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
   * // 'projects/grape-spaceship-123/instances/my-instance/tables/my-database'
   */
  static formatName_(instanceName, name) {
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
    'getMetadata',
    'runTransaction',
    'table',
    'updateSchema',
    'session',
  ],
});

/**
 * Reference to the {@link Database} class.
 * @name module:@google-cloud/spanner.Database
 * @see Database
 */
export {Database};
