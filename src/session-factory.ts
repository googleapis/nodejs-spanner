/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
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

import {Database, Session, Transaction} from '.';
import {
  MultiplexedSession,
  MultiplexedSessionInterface,
} from './multiplexed-session';
import {
  SessionPool,
  SessionPoolInterface,
  SessionPoolOptions,
} from './session-pool';
import {SessionPoolConstructor} from './database';
import {ServiceObjectConfig} from '@google-cloud/common';
const common = require('./common-grpc/service-object');

/**
 * @callback GetSessionCallback
 * @param {?Error} error Request error, if any.
 * @param {Session} session The read-write session.
 * @param {Transaction} transaction The transaction object.
 */
export interface GetSessionCallback {
  (
    err: Error | null,
    session?: Session | null,
    transaction?: Transaction | null
  ): void;
}

/**
 * Interface for implementing session-factory logic.
 *
 * @interface SessionFactoryInterface
 */
export interface SessionFactoryInterface {
  getSession(callback: GetSessionCallback): void;
  getPool(): SessionPoolInterface;
  release(session: Session): void;
}

/**
 * Creates a SessionFactory object to manage the creation of
 *      session-pool and multiplexed session.
 *
 * @class
 *
 * @param {Database} database Database object.
 * @param {String} name Name of the database.
 * @param {SessionPoolOptions|SessionPoolInterface} options Session pool
 *     configuration options or custom pool interface.
 */
export class SessionFactory
  extends common.GrpcServiceObject
  implements SessionFactoryInterface
{
  multiplexedSession_?: MultiplexedSessionInterface;
  pool_: SessionPoolInterface;
  constructor(
    database: Database,
    name: String,
    poolOptions?: SessionPoolConstructor | SessionPoolOptions
  ) {
    super({
      parent: database,
      id: name,
    } as {} as ServiceObjectConfig);
    this.pool_ =
      typeof poolOptions === 'function'
        ? new (poolOptions as SessionPoolConstructor)(database, null)
        : new SessionPool(database, poolOptions);
    this.pool_.on('error', this.emit.bind(database, 'error'));
    this.pool_.open();
    // multiplexed session should only get created if the env variable is enabled
    if (process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS === 'true') {
      this.multiplexedSession_ = new MultiplexedSession(database);
      this.multiplexedSession_.on('error', this.emit.bind(database, 'error'));
      this.multiplexedSession_.createSession();
    }
  }

  /**
   * Retrieves the session, either the regular session or the multiplexed session based upon the environment varibale
   * If the environment variable GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS is set to `true` the method will attempt to
   * retrieve the multiplexed session. Otherwise it will retrieve the session from the pool.
   *
   * The session is returned asynchronously via the provided callback, which will receive either an error or the session object.
   * @param callback
   */

  getSession(callback: GetSessionCallback): void {
    const sessionHandler =
      process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS === 'true'
        ? this.multiplexedSession_
        : this.pool_;
    sessionHandler?.getSession((err, session) => callback(err, session));
  }

  /**
   * Returns the SessionPoolInterface used by the current instance, which provide access to the session pool
   * for obtaining database sessions.
   *
   * @returns {SessionPoolInterface} The session pool used by current instance.
   * This object allows interaction with the pool for acquiring and managing sessions.
   */

  getPool(): SessionPoolInterface {
    return this.pool_;
  }

  /**
   * Releases the session back to the pool.
   *
   * This method is used to return the session back to the pool after it is no longer needed.
   *
   * It only performs the operation if the Multiplexed Session is disabled which is controlled via the
   * env variable GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS.
   *
   * @param session The session to be released. This should be an instance of `Session` that was previously
   * acquired from the session pool.
   *
   * @throws {Error} Throws an error if the session is invalid or cannot be released.
   */
  release(session: Session): void {
    if (process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS === 'false') {
      this.pool_.release(session);
    }
  }
}
