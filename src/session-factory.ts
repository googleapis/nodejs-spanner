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
  /**
   * When called returns a session.
   *
   * @name SessionFactoryInterface#getSession
   * @param {GetSessionCallback} callback The callback function.
   */
  getSession(callback: GetSessionCallback): void;

  /**
   * When called returns the pool object.
   *
   * @name SessionFactoryInterface#getPool
   */
  getPool(): SessionPoolInterface;

  /**
   * To be called when releasing a session.
   *
   * @name SessionFactoryInterface#release
   * @param {Session} session The session to be released.
   */
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
  multiplexedSession_: MultiplexedSessionInterface;
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
    this.multiplexedSession_ = new MultiplexedSession(database);
    // Multiplexed sessions should only be created if its enabled.
    if ((this.multiplexedSession_ as MultiplexedSession).isMultiplexedEnabled) {
      this.multiplexedSession_.on('error', this.emit.bind(database, 'error'));
      this.multiplexedSession_.createSession();
    }
  }

  /**
   * Retrieves a session, either a regular session or a multiplexed session, based on the environment variable configuration.
   *
   * If the environment variable `GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS` is set to `true`, the method will attempt to
   * retrieve a multiplexed session. Otherwise, it will retrieve a session from the regular pool.
   *
   * @param {GetSessionCallback} callback The callback function.
   */

  getSession(callback: GetSessionCallback): void {
    const sessionHandler = (this.multiplexedSession_ as MultiplexedSession)
      .isMultiplexedEnabled
      ? this.multiplexedSession_
      : this.pool_;

    sessionHandler!.getSession((err, session) => callback(err, session));
  }

  /**
   * Returns the regular session pool object.
   *
   * @returns {SessionPoolInterface} The session pool used by current instance.
   */

  getPool(): SessionPoolInterface {
    return this.pool_;
  }

  /**
   * Releases a session back to the session pool.
   *
   * This method returns a session to the pool after it is no longer needed.
   * It is a no-op for multiplexed sessions.
   *
   * @param {Session} session - The session to be released. This should be an instance of `Session` that was
   * previously acquired from the session pool.
   *
   * @throws {Error} If the session is invalid or cannot be released.
   */
  release(session: Session): void {
    if (
      !(this.multiplexedSession_ as MultiplexedSession).isMultiplexedEnabled
    ) {
      this.pool_.release(session);
    }
  }
}
