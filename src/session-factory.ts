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

export interface SessionFactoryInterface {
  getSession(callback: GetSessionCallback): void;
  getPool(): SessionPoolInterface;
  getMultiplexedSession(): MultiplexedSessionInterface | undefined;
}

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
    this.multiplexedSession_ = new MultiplexedSession(database);
    this.pool_.on('error', this.emit.bind(this, 'error'));
    this.pool_.open();
    // multiplexed session should only get created if the env varaible is enabled
    if (process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS === 'true') {
      this.multiplexedSession_.on('error', this.emit.bind(this, 'error'));
      this.multiplexedSession_.createSession();
    }
  }

  getSession(callback: GetSessionCallback): void {
    if (process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS === 'true') {
      this.multiplexedSession_?.getSession((err, session) => {
        err ? callback(err, null) : callback(null, session);
      });
    } else {
      this.pool_?.getSession((err, session) => {
        err ? callback(err, null) : callback(null, session);
      });
    }
  }

  getPool(): SessionPoolInterface {
    return this.pool_;
  }

  getMultiplexedSession(): MultiplexedSessionInterface | undefined {
    return this.multiplexedSession_;
  }
}
