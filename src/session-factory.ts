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
    transaction?: Transaction | null,
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
 *     configuration options or custom pool inteface.
 */
export class SessionFactory
  extends common.GrpcServiceObject
  implements SessionFactoryInterface
{
  multiplexedSession_: MultiplexedSessionInterface;
  constructor(database: Database, name: String) {
    super({
      parent: database,
      id: name,
    } as {} as ServiceObjectConfig);

    // initialize multiplexed session
    this.multiplexedSession_ = new MultiplexedSession(database);
    this.multiplexedSession_.createSession();
  }

  /**
   * Retrieves a multiplexed session.
   *
   * @param {GetSessionCallback} callback The callback function.
   */

  getSession(callback: GetSessionCallback): void {
    this.multiplexedSession_.getSession(callback);
  }
}
