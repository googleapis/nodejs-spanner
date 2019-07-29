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

/*!
 * @module spanner/session
 */

'use strict';

import {ServiceObject} from '@google-cloud/common-grpc';
import {promisifyAll} from '@google-cloud/promisify';
import * as extend from 'extend';
import * as is from 'is';
import * as r from 'request';
import {
  Snapshot,
  Transaction,
  PartitionedDml,
  TimestampBounds,
} from './transaction';
import {Database} from './database';
import {
  ServiceObjectConfig,
  DeleteCallback,
  Metadata,
  MetadataCallback,
} from '@google-cloud/common';
import {CreateSessionOptions} from './common';

export type GetSessionResponse = [Session, r.Response];

export interface CreateSessionCallback {
  (err: Error | null, session?: Session | null, apiResponse?: r.Response): void;
}

/**
 * enum to capture the possible session types
 */
export const enum types {
  ReadOnly = 'readonly',
  ReadWrite = 'readwrite',
}

/**
 * Create a Session object to interact with a Cloud Spanner session.
 *
 * **It is unlikely you will need to interact with sessions directly. By
 * default, sessions are created and utilized for maximum performance
 * automatically.**
 *
 * @class
 * @param {Database} database Parent {@link Database} instance.
 * @param {string} [name] The name of the session. If not provided, it is
 *     assumed you are going to create it.
 *
 * @example
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 *
 * //-
 * // To create a session manually, don't provide a name.
 * //-
 * const session = database.session();
 *
 * session.create(function(err) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   // Session created successfully.
 *   // `session.id` = The name of the session.
 * });
 *
 * //-
 * // To access a previously-created session, provide a name.
 * //-
 * const session = database.session('session-name');
 */
export class Session extends ServiceObject {
  id!: string;
  formattedName_?: string;
  type?: types;
  txn?: Transaction;
  lastUsed?: number;
  constructor(database: Database, name?: string) {
    const methods = {
      /**
       * Create a session.
       *
       * @method Session#create
       * @param {object} [options] See {@link Database#createSession}.
       * @param {CreateSessionCallback} [callback] Callback function.
       * @returns {Promise<CreateSessionResponse>}
       *
       * @example
       * session.create(function(err, session, apiResponse) {
       *   if (err) {
       *     // Error handling omitted.
       *   }
       *
       *   // Session created successfully.
       * });
       *
       * //-
       * //Returns a Promise if the callback is omitted.
       * //-
       * session.create()
       *   .then(function(data) {
       *     const session = data[0];
       *     const apiResponse = data[1];
       *
       *     // Session created successfully.
       *   });
       */
      create: true,
      /**
       * @typedef {array} SessionExistsResponse
       * @property {boolean} 0 Whether the {@link Session} exists.
       */
      /**
       * @callback SessionExistsCallback
       * @param {?Error} err Request error, if any.
       * @param {boolean} exists Whether the {@link Session} exists.
       */
      /**
       * Check if a session exists.
       *
       * @method Session#exists
       * @param {SessionExistsCallback} [callback] Callback function.
       * @returns {Promise<SessionExistsResponse>}
       *
       * @example
       * session.exists(function(err, exists) {});
       *
       * //-
       * //Returns a Promise if the callback is omitted.
       * //-
       * session.exists().then(function(data) {
       *   const exists = data[0];
       * });
       */
      exists: true,
      /**
       * @typedef {array} GetSessionResponse
       * @property {Session} 0 The {@link Session}.
       * @property {object} 1 The full API response.
       */
      /**
       * @callback CreateSessionCallback
       * @param {?Error} err Request error, if any.
       * @param {Session} session The {@link Session}.
       * @param {object} apiResponse The full API response.
       */
      /**
       * Get a session if it exists.
       *
       * You may optionally use this to "get or create" an object by providing
       * an object with `autoCreate` set to `true`. Any extra configuration that
       * is normally required for the `create` method must be contained within
       * this object as well.
       *
       * @method Session#get
       * @param {options} [options] Configuration object.
       * @param {boolean} [options.autoCreate=false] Automatically create the
       *     object if it does not exist.
       * @param {CreateSessionCallback} [callback] Callback function.
       * @returns {Promise<GetSessionResponse>}
       *
       * @example
       * session.get(function(err, session, apiResponse) {
       *   // `session.metadata` has been populated.
       * });
       *
       * //-
       * //Returns a Promise if the callback is omitted.
       * //-
       * session.get().then(function(data) {
       *   const session = data[0];
       *   const apiResponse = data[0];
       * });
       */
      get: true,
    };
    super(({
      parent: database,
      /**
       * @name Session#id
       * @type {string}
       */
      id: name,
      methods,
      createMethod: (
        _: {},
        optionsOrCallback: CreateSessionOptions | CreateSessionCallback,
        callback: CreateSessionCallback
      ) => {
        const options =
          typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        callback =
          typeof optionsOrCallback === 'function'
            ? (optionsOrCallback as CreateSessionCallback)
            : callback;
        return database.createSession(
          options,
          (err: Error, session: Session, apiResponse: r.Response) => {
            if (err) {
              callback(err, null, apiResponse);
              return;
            }

            extend(this, session);
            callback(null, this, apiResponse);
          }
        );
      },
    } as {}) as ServiceObjectConfig);

    this.request = database.request;
    this.requestStream = database.requestStream;

    if (name) {
      this.formattedName_ = Session.formatName_(database.formattedName_, name);
    }
  }
  delete(): Promise<[r.Response]>;
  delete(callback: DeleteCallback): void;
  /**
   * Delete a session.
   *
   * Wrapper around {@link v1.SpannerClient#deleteSession}.
   *
   * @see {@link v1.SpannerClient#deleteSession}
   * @see [DeleteSession API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.DeleteSession)
   *
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
   *
   * @example
   * session.delete(function(err, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Session deleted successfully.
   * });
   *
   * //-
   * //Returns a Promise if the callback is omitted.
   * //-
   * session.delete().then(function(data) {
   *   const apiResponse = data[0];
   * });
   */
  delete(callback?: DeleteCallback): void | Promise<[r.Response]> {
    const reqOpts = {
      name: this.formattedName_,
    };
    return this.request(
      {
        client: 'SpannerClient',
        method: 'deleteSession',
        reqOpts,
      },
      callback!
    );
  }
  getMetadata(): Promise<[Metadata]>;
  getMetadata(callback: MetadataCallback): void;
  /**
   * @typedef {array} GetSessionMetadataResponse
   * @property {object} 0 The session's metadata.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetSessionMetadataCallback
   * @param {?Error} err Request error, if any.
   * @param {object} metadata The session's metadata.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Get the session's metadata.
   *
   * Wrapper around {@link v1.SpannerClient#getSession}.
   *
   * @see {@link v1.SpannerClient#getSession}
   * @see [GetSession API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.GetSession)
   *
   * @param {GetSessionMetadataCallback} [callback] Callback function.
   * @returns {Promise<GetSessionMetadataResponse>}
   *
   * @example
   * session.getMetadata(function(err, metadata, apiResponse) {});
   *
   * //-
   * //Returns a Promise if the callback is omitted.
   * //-
   * session.getMetadata().then(function(data) {
   *   const metadata = data[0];
   *   const apiResponse = data[1];
   * });
   */
  getMetadata(callback?: MetadataCallback): void | Promise<[Metadata]> {
    const reqOpts = {
      name: this.formattedName_,
    };
    return this.request(
      {
        client: 'SpannerClient',
        method: 'getSession',
        reqOpts,
      },
      callback!
    );
  }
  /**
   * Ping the session with `SELECT 1` to prevent it from expiring.
   *
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
   *
   * @example
   * session.keepAlive(function(err) {
   *   if (err) {
   *     // An error occurred while trying to keep this session alive.
   *   }
   * });
   */
  keepAlive(callback?): void | Promise<void> {
    const reqOpts = {
      session: this.formattedName_,
      sql: 'SELECT 1',
    };
    return this.request(
      {
        client: 'SpannerClient',
        method: 'executeSql',
        reqOpts,
      },
      callback!
    );
  }
  /**
   * Create a PartitionedDml transaction.
   *
   * @returns {PartitionedDml}
   *
   * @example
   * const transaction = session.partitionedDml();
   */
  partitionedDml(): PartitionedDml {
    return new PartitionedDml(this);
  }
  /**
   * Create a Snapshot transaction.
   *
   * @param {TimestampBounds} [options] The timestamp bounds.
   * @returns {Snapshot}
   *
   * @example
   * const snapshot = session.snapshot({strong: false});
   */
  snapshot(options?: TimestampBounds): Snapshot {
    return new Snapshot(this, options);
  }
  /**
   * Create a read write Transaction.
   *
   * @return {Transaction}
   *
   * @example
   * const transaction = session.transaction();
   */
  transaction(): Transaction {
    return new Transaction(this);
  }
  /**
   * Format the session name to include the parent database's name.
   *
   * @private
   *
   * @param {string} databaseName The parent database's name.
   * @param {string} name The instance name.
   * @returns {string}
   *
   * @example
   * Session.formatName_('my-database', 'my-session');
   * // 'projects/grape-spaceship-123/instances/my-instance/' +
   * // 'databases/my-database/sessions/my-session'
   */
  static formatName_(databaseName: string, name: string): string {
    if (name.indexOf('/') > -1) {
      return name;
    }
    const sessionName = name.split('/').pop();
    return databaseName + '/sessions/' + sessionName;
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Session, {
  exclude: [
    'delete',
    'getMetadata',
    'partitionedDml',
    'snapshot',
    'transaction',
  ],
});
