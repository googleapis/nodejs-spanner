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

import {EventEmitter} from 'events';
import {Database} from './database';
import {Session} from './session';
import {Transaction} from './transaction';
import {NormalCallback} from './common';
import {GoogleError, ServiceError} from 'google-gax';
import {GetSessionCallback} from './session-factory';

/**
 * @deprecated Session pool is deprecated and will be removed in a future release.
    Multiplexed sessions are now used for all operations by default, eliminating
    the need for session pooling.
 * @callback SessionPoolCloseCallback
 * @param {?Error} error Closing error, if any.
 */
export interface SessionPoolCloseCallback {
  (error?: Error): void;
}

/** @deprecated Session pool is deprecated and will be removed in a future release.
    Multiplexed sessions are now used for all operations by default, eliminating
    the need for session pooling. */
export type GetReadSessionCallback = NormalCallback<Session>;

/** * @deprecated Session pool is deprecated and will be removed in a future release.
    Multiplexed sessions are now used for all operations by default, eliminating
    the need for session pooling. */
export interface GetWriteSessionCallback {
  (
    err: Error | null,
    session?: Session | null,
    transaction?: Transaction | null,
  ): void;
}

/** * @deprecated Session pool is deprecated and will be removed in a future release.
    Multiplexed sessions are now used for all operations by default, eliminating
    the need for session pooling.

 * Interface for implementing custom session pooling logic, it should extend the
 * {@link https://nodejs.org/api/events.html|EventEmitter} class and emit any
 * asynchronous errors via an error event.
 *
 * @interface SessionPoolInterface
 * @extends external:{@link https://nodejs.org/api/events.html|EventEmitter}
 */
/**
 * @constructs SessionPoolInterface
 * @param {Database} database The database to create a pool for.
 */
export interface SessionPoolInterface extends EventEmitter {
  /**
   * Will be called via {@link Database#close}. Indicates that the pool should
   * perform any necessary teardown actions to its resources.
   *
   * @name SessionPoolInterface#close
   * @param {SessionPoolCloseCallback} callback The callback function.
   */
  /**
   * Will be called by the Database object, should be used to start creating
   * sessions/etc.
   *
   * @name SessionPoolInterface#open
   */
  /**
   * When called returns a session.
   *
   * @name SessionPoolInterface#getSession
   * @param {GetSessionCallback} callback The callback function.
   */
  /**
   * When called returns a session.
   *
   * @deprecated Use getSession instead.
   * @name SessionPoolInterface#getReadSession
   * @param {GetReadSessionCallback} callback The callback function.
   */
  /**
   * When called returns a session.
   *
   * @deprecated Use getSession instead.
   * @name SessionPoolInterface#getWriteSession
   * @param {GetWriteSessionCallback} callback The callback function.
   */
  /**
   * To be called when releasing a session back into the pool.
   *
   * @name SessionPoolInterface#release
   * @param {Session} session The session to be released.
   */
  close(callback: SessionPoolCloseCallback): void;
  open(): void;
  getSession(callback: GetSessionCallback): void;
  getReadSession(callback: GetReadSessionCallback): void;
  getWriteSession(callback: GetWriteSessionCallback): void;
  release(session: Session): void;
}

/**
 * Session pool configuration options.
 *
 * @deprecated Session pool is deprecated and will be removed in a future release.
    Multiplexed sessions are now used for all operations by default, eliminating
    the need for session pooling.
 *
 * @typedef {object} SessionPoolOptions
 * @property {number} [acquireTimeout=Infinity] Time in milliseconds before
 *     giving up trying to acquire a session. If the specified value is
 *     `Infinity`, a timeout will not occur.
 * @property {number} [concurrency=Infinity] How many concurrent requests the pool is
 *     allowed to make.
 * @property {boolean} [fail=false] If set to true, an error will be thrown when
 *     there are no available sessions for a request.
 * @property {number} [idlesAfter=10] How long until a resource becomes idle, in
 *     minutes.
 * @property {number} [keepAlive=30] How often to ping idle sessions, in
 *     minutes. Must be less than 1 hour.
 * @property {Object<string, string>} [labels] Labels to apply to any session
 *     created by the pool.
 * @property {number} [max=100] Maximum number of resources to create at any
 *     given time.
 * @property {number} [maxIdle=1] Maximum number of idle resources to keep in
 *     the pool at any given time.
 * @property {number} [min=25] Minimum number of resources to keep in the pool at
 *     any given time.
 * @property {number} [writes=0.0]. Deprecated.
 * @property {number} [incStep=25] The number of new sessions to create when at
 *     least one more session is needed.
 */
export interface SessionPoolOptions {
  acquireTimeout?: number;
  concurrency?: number;
  fail?: boolean;
  idlesAfter?: number;
  keepAlive?: number;
  /**
   * @deprecated. Use SpannerOptions to specify the session labels..
   */
  labels?: {[label: string]: string};
  max?: number;
  maxIdle?: number;
  min?: number;
  writes?: number;
  incStep?: number;
  /**
   * @deprecated. Use Database constructor to specify the database role.
   */
  databaseRole?: string | null;
}

/**
 * * @deprecated Session pool is deprecated and will be removed in a future release.
    Multiplexed sessions are now used for all operations by default, eliminating
    the need for session pooling.

 * Class used to manage connections to Spanner.
 *
 * **You don't need to use this class directly, connections will be handled for
 * you.**
 *
 * @class
 * @extends {EventEmitter}
 */
export class SessionPool extends EventEmitter implements SessionPoolInterface {
  database: Database;
  isOpen: boolean;
  options: SessionPoolOptions;

  /** @deprecated Use totalWaiters instead. */
  get available(): number {
    return 0;
  }
  /** @deprecated Starting from v6.5.0 the same session can be reused for
   * different types of transactions.
   */
  get currentWriteFraction(): number {
    return 0;
  }

  /**
   * Total number of borrowed sessions.
   * @type {number}
   */
  get borrowed(): number {
    return 0;
  }

  /**
   * Flag to determine if Pool is full.
   * @type {boolean}
   */
  get isFull(): boolean {
    return false;
  }

  /** @deprecated Use `size()` instead. */
  get reads(): number {
    return this.size;
  }

  /**
   * Total size of pool.
   * @type {number}
   */
  get size(): number {
    return this.available + this.borrowed;
  }

  /** @deprecated Use `size()` instead. */
  get writes(): number {
    return this.size;
  }

  /** @deprecated Starting v6.5.0 the pending prepare state is obsolete. */
  get pendingPrepare(): number {
    return 0;
  }

  /**
   * Number of sessions being created or prepared for a read/write transaction.
   * @type {number}
   */
  get totalPending(): number {
    return 0;
  }

  /** @deprecated Use totalWaiters instead. */
  get numReadWaiters(): number {
    return this.totalWaiters;
  }

  /** @deprecated Use totalWaiters instead. */
  get numWriteWaiters(): number {
    return 0;
  }

  /**
   * Sum of read and write waiters.
   * @type {number}
   */
  get totalWaiters(): number {
    return 0;
  }

  /**
   * @constructor
   * @param {Database} database The DB instance.
   * @param {SessionPoolOptions} [options] Configuration options.
   */
  constructor(database: Database, options?: SessionPoolOptions) {
    super();
    this.isOpen = false;
    this.database = database;
    this.options = options || {};
  }

  /**
   * Closes and the pool.
   *
   * @emits SessionPool#close
   * @param {SessionPoolCloseCallback} callback The callback function.
   */
  close(callback: SessionPoolCloseCallback): void {}

  /**
   * Retrieve a read session.
   *
   * @deprecated Use getSession instead.
   * @param {GetReadSessionCallback} callback The callback function.
   */
  getReadSession(callback: GetReadSessionCallback): void {
    this.getSession((error, session) =>
      callback(error as ServiceError, session),
    );
  }

  /**
   * Retrieve a read/write session.
   *
   * @deprecated use getSession instead.
   * @param {GetWriteSessionCallback} callback The callback function.
   */
  getWriteSession(callback: GetWriteSessionCallback): void {
    this.getSession(callback);
  }

  /**
   * Retrieve a session.
   *
   * @param {GetSessionCallback} callback The callback function.
   */
  getSession(callback: GetSessionCallback): void {
    callback(null, null, null);
  }

  /**
   * Opens the pool, filling it to the configured number of read and write
   * sessions.
   *
   * @emits SessionPool#open
   * @return {Promise}
   */
  open(): void {}

  /**
   * Releases session back into the pool.
   *
   * @throws {Error} For unknown sessions.
   * @emits SessionPool#available
   * @emits SessionPool#error
   * @fires SessionPool#session-available
   * @fires @deprecated SessionPool#readonly-available
   * @fires @deprecated SessionPool#readwrite-available
   * @param {Session} session The session to release.
   */
  release(session: Session): void {}
}
