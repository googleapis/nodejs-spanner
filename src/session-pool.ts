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
import * as is from 'is';
import PQueue from 'p-queue';

import {Database} from './database';
import {Session, types} from './session';
import {Transaction} from './transaction';
import {NormalCallback} from './common';
import {grpc} from 'google-gax';
import trace = require('stack-trace');

/**
 * @callback SessionPoolCloseCallback
 * @param {?Error} error Closing error, if any.
 */
export interface SessionPoolCloseCallback {
  (error?: SessionLeakError): void;
}

/**
 * @callback GetReadSessionCallback
 * @param {?Error} error Request error, if any.
 * @param {Session} session The read-only session.
 */
export type GetReadSessionCallback = NormalCallback<Session>;

/**
 * @callback GetWriteSessionCallback
 * @param {?Error} error Request error, if any.
 * @param {Session} session The read-write session.
 * @param {Transaction} transaction The transaction object.
 */
export interface GetWriteSessionCallback {
  (
    err: Error | null,
    session?: Session | null,
    transaction?: Transaction | null
  ): void;
}

/**
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
  close(callback: SessionPoolCloseCallback): void;
  /**
   * Will be called by the Database object, should be used to start creating
   * sessions/etc.
   *
   * @name SessionPoolInterface#open
   */
  open(): void;
  /**
   * When called returns a read-only session.
   *
   * @name SessionPoolInterface#getReadSession
   * @param {GetReadSessionCallback} callback The callback function.
   */
  getReadSession(callback: GetReadSessionCallback): void;
  /**
   * When called returns a read-write session with prepared transaction.
   *
   * @name SessionPoolInterface#getWriteSession
   * @param {GetWriteSessionCallback} callback The callback function.
   */
  getWriteSession(callback: GetWriteSessionCallback): void;
  /**
   * To be called when releasing a session back into the pool.
   *
   * @name SessionPoolInterface#release
   * @param {Session} session The session to be released.
   */
  release(session: Session): void;
}

/**
 * Session pool configuration options.
 *
 * @typedef {object} SessionPoolOptions
 * @property {number} [acquireTimeout=Infinity] Time in milliseconds before
 *     giving up trying to acquire a session. If the specified value is
 *     `Infinity`, a timeout will not occur.
 * @property {number} [concurrency=10] How many concurrent requests the pool is
 *     allowed to make.
 * @property {boolean} [fail=false] If set to true, an error will be thrown when
 *     there are no available sessions for a request.
 * @property {number} [idlesAfter=10] How long until a resource becomes idle, in
 *     minutes.
 * @property {number} [keepAlive=50] How often to ping idle sessions, in
 *     minutes. Must be less than 1 hour.
 * @property {Object<string, string>} [labels] Labels to apply to any session
 *     created by the pool.
 * @property {number} [max=100] Maximum number of resources to create at any
 *     given time.
 * @property {number} [maxIdle=1] Maximum number of idle resources to keep in
 *     the pool at any given time.
 * @property {number} [min=0] Minimum number of resources to keep in the pool at
 *     any given time.
 * @property {number} [writes=0.0] Percentage of sessions to be pre-allocated as
 *     write sessions represented as a float.
 * @property {number} [incStep=25] The number of new sessions to create when at
 *     least one more session is needed.
 */
export interface SessionPoolOptions {
  acquireTimeout?: number;
  concurrency?: number;
  fail?: boolean;
  idlesAfter?: number;
  keepAlive?: number;
  labels?: {[label: string]: string};
  max?: number;
  maxIdle?: number;
  min?: number;
  writes?: number;
  incStep?: number;
}

const DEFAULTS: SessionPoolOptions = {
  acquireTimeout: Infinity,
  concurrency: Infinity,
  fail: false,
  idlesAfter: 10,
  keepAlive: 30,
  labels: {},
  max: 100,
  maxIdle: 1,
  min: 0,
  writes: 0,
  incStep: 25,
};

/**
 * Error to be thrown when attempting to release unknown resources.
 *
 * @private
 */
export class ReleaseError extends Error {
  resource: unknown;
  constructor(resource: unknown) {
    super('Unable to release unknown resource.');
    this.resource = resource;
  }
}

/**
 * Error to be thrown when session leaks are detected.
 *
 * @private
 */
export class SessionLeakError extends Error {
  messages: string[];
  constructor(leaks: string[]) {
    super(`${leaks.length} session leak(s) detected.`);
    // Restore error name that was overwritten by the super constructor call.
    this.name = SessionLeakError.name;
    this.messages = leaks;
  }
}

/**
 * Error to be thrown when the session pool is exhausted.
 */
export class SessionPoolExhaustedError extends Error {
  messages: string[];
  constructor(leaks: string[]) {
    super(errors.Exhausted);
    // Restore error name that was overwritten by the super constructor call.
    this.name = SessionPoolExhaustedError.name;
    this.messages = leaks;
  }
}

/**
 * Checks whether the given error is a 'Session not found' error.
 * @param error the error to check
 * @return true if the error is a 'Session not found' error, and otherwise false.
 */
export function isSessionNotFoundError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.code === grpc.status.NOT_FOUND &&
    error.message.includes('Session not found')
  );
}

/**
 * enum to capture errors that can appear from multiple places
 */
const enum errors {
  Closed = 'Database is closed.',
  Timeout = 'Timeout occurred while acquiring session.',
  Exhausted = 'No resources available.',
}

interface SessionInventory {
  [types.ReadOnly]: Session[];
  [types.ReadWrite]: Session[];
  borrowed: Set<Session>;
}

export interface CreateSessionsOptions {
  writes?: number;
  reads?: number;
}

/**
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
  _acquires: PQueue;
  _evictHandle!: NodeJS.Timer;
  _inventory: SessionInventory;
  _onClose!: Promise<void>;
  _pending = 0;
  _pendingPrepare = 0;
  _numWaiters = 0;
  _pingHandle!: NodeJS.Timer;
  _requests: PQueue;
  _traces: Map<string, trace.StackFrame[]>;

  /**
   * Formats stack trace objects into Node-like stack trace.
   *
   * @param {object[]} trace The trace object.
   * @return {string}
   */
  static formatTrace(frames: trace.StackFrame[]): string {
    const stack = frames.map(frame => {
      const name = frame.getFunctionName() || frame.getMethodName();
      const file = frame.getFileName();
      const lineno = frame.getLineNumber();
      const columnno = frame.getColumnNumber();

      return `    at ${name} (${file}:${lineno}:${columnno})`;
    });

    return `Session leak detected!\n${stack.join('\n')}`;
  }

  /**
   * Total number of available sessions.
   * @type {number}
   */
  get available(): number {
    const reads = this._inventory[types.ReadOnly];
    const writes = this._inventory[types.ReadWrite];

    return reads.length + writes.length;
  }

  /**
   * Total number of borrowed sessions.
   * @type {number}
   */
  get borrowed(): number {
    return this._inventory.borrowed.size + this._pending;
  }

  /**
   * Flag to determine if Pool is full.
   * @type {boolean}
   */
  get isFull(): boolean {
    return this.size >= this.options.max!;
  }

  /**
   * Total number of read sessions.
   * @type {number}
   */
  get reads(): number {
    const available = this._inventory[types.ReadOnly].length;
    const borrowed = [...this._inventory.borrowed].filter(
      session => session.type === types.ReadOnly
    ).length;

    return available + borrowed;
  }

  /**
   * Total size of pool.
   * @type {number}
   */
  get size(): number {
    return this.available + this.borrowed;
  }

  /**
   * Total number of write sessions.
   * @type {number}
   */
  get writes(): number {
    const available = this._inventory[types.ReadWrite].length;
    const borrowed = [...this._inventory.borrowed].filter(
      session => session.type === types.ReadWrite
    ).length;

    return available + borrowed;
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
    this.options = Object.assign({}, DEFAULTS, options);

    const {writes} = this.options;

    if (writes! < 0 || writes! > 1) {
      throw new TypeError(
        'Write percentage should be represented as a float between 0.0 and 1.0.'
      );
    }

    this._inventory = {
      [types.ReadOnly]: [],
      [types.ReadWrite]: [],
      borrowed: new Set(),
    };

    this._requests = new PQueue({
      concurrency: this.options.concurrency!,
    });

    this._acquires = new PQueue({
      concurrency: 1,
    });

    this._traces = new Map();
  }

  /**
   * Closes and the pool.
   *
   * @emits SessionPool#close
   * @param {SessionPoolCloseCallback} callback The callback function.
   */
  close(callback: SessionPoolCloseCallback): void {
    const sessions: Session[] = [
      ...this._inventory[types.ReadOnly],
      ...this._inventory[types.ReadWrite],
      ...this._inventory.borrowed,
    ];

    this.isOpen = false;

    this._stopHouseKeeping();
    this.emit('close');

    sessions.forEach(session => this._destroy(session));

    this._requests.onIdle().then(() => {
      const leaks = this._getLeaks();
      let error;

      this._inventory[types.ReadOnly] = [];
      this._inventory[types.ReadWrite] = [];
      this._inventory.borrowed.clear();

      if (leaks.length) {
        error = new SessionLeakError(leaks);
      }

      callback(error);
    });
  }

  /**
   * Retrieve a read session.
   *
   * @param {GetReadSessionCallback} callback The callback function.
   */
  getReadSession(callback: GetReadSessionCallback): void {
    this._acquire(types.ReadOnly).then(
      session => callback(null, session),
      callback
    );
  }

  /**
   * Retrieve a read/write session.
   *
   * @param {GetWriteSessionCallback} callback The callback function.
   */
  getWriteSession(callback: GetWriteSessionCallback): void {
    this._acquire(types.ReadWrite).then(
      session => callback(null, session, session.txn!),
      callback
    );
  }

  /**
   * Opens the pool, filling it to the configured number of read and write
   * sessions.
   *
   * @emits SessionPool#open
   * @return {Promise}
   */
  open(): void {
    this._onClose = new Promise(resolve => this.once('close', resolve));
    this._startHouseKeeping();

    this.isOpen = true;
    this.emit('open');

    this._fill();
  }

  /**
   * Releases session back into the pool. If the session is a write session it
   * will also prepare a new transaction before releasing it.
   *
   * @throws {Error} For unknown sessions.
   * @emits SessionPool#available
   * @emits SessionPool#error
   * @param {Session} session The session to release.
   */
  release(session: Session): void {
    if (!this._inventory.borrowed.has(session)) {
      throw new ReleaseError(session);
    }

    delete session.txn;
    session.lastUsed = Date.now();

    if (isSessionNotFoundError(session.lastError)) {
      // Remove the session from the pool. It is not necessary to call _destroy,
      // as the session is already removed from the backend.
      this._inventory.borrowed.delete(session);
      this._traces.delete(session.id);
      return;
    }
    session.lastError = undefined;

    if (session.type === types.ReadOnly) {
      this._release(session);
      return;
    }

    // Delete the trace associated with this session to mark the session as checked
    // back into the pool. This will prevent the session to be marked as leaked if
    // the pool is closed while the session is being prepared.
    this._traces.delete(session.id);
    this._pendingPrepare++;
    this._prepareTransaction(session)
      .catch(() => (session.type = types.ReadOnly))
      .then(() => {
        this._pendingPrepare--;
        this._release(session);
      });
  }

  /**
   * Attempts to borrow a session from the pool.
   *
   * @private
   *
   * @param {string} type The desired type to borrow.
   * @returns {Promise<Session>}
   */
  async _acquire(type: types): Promise<Session> {
    if (!this.isOpen) {
      throw new Error(errors.Closed);
    }

    // Get the stacktrace of the caller before we call any async methods, as calling an async method will break the stacktrace.
    const frames = trace.get();
    const startTime = Date.now();
    const timeout = this.options.acquireTimeout;

    // wrapping this logic in a function to call recursively if the session
    // we end up with is already dead
    const getSession = async (): Promise<Session> => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= timeout!) {
        throw new Error(errors.Timeout);
      }

      const session = await this._getSession(type, startTime);

      if (this._isValidSession(session)) {
        return session;
      }

      this._inventory.borrowed.delete(session);
      return getSession();
    };

    const session = await this._acquires.add(getSession);

    if (type === types.ReadWrite && session.type === types.ReadOnly) {
      try {
        await this._prepareTransaction(session);
      } catch (e) {
        if (isSessionNotFoundError(e)) {
          this._inventory.borrowed.delete(session);
        } else {
          this._release(session);
        }
        throw e;
      }
    }

    this._traces.set(session.id, frames);
    return session;
  }

  /**
   * Moves a session into the borrowed group.
   *
   * @private
   *
   * @param {Session} session The session object.
   */
  _borrow(session: Session): void {
    const type = session.type!;
    const index = this._inventory[type].indexOf(session);

    this._inventory.borrowed.add(session);
    this._inventory[type].splice(index, 1);
  }

  /**
   * Borrows the first session from specific group. This method may only be called if the inventory
   * actually contains a session of the desired type.
   *
   * @private
   *
   * @param {string} type The desired session type.
   * @return {Session}
   */
  _borrowFrom(type: types): Session {
    const session = this._inventory[type].pop()!;
    this._inventory.borrowed.add(session);
    return session;
  }

  /**
   * Grabs the next available session.
   *
   * @private
   *
   * @param {string} type The desired session type.
   * @returns {Promise<Session>}
   */
  _borrowNextAvailableSession(type: types): Session {
    const hasReads = !!this._inventory[types.ReadOnly].length;

    if (type === types.ReadOnly && hasReads) {
      return this._borrowFrom(types.ReadOnly);
    }

    const hasWrites = !!this._inventory[types.ReadWrite].length;

    if (hasWrites) {
      return this._borrowFrom(types.ReadWrite);
    }

    return this._borrowFrom(types.ReadOnly);
  }

  /**
   * Attempts to create a single session of a certain type.
   *
   * @private
   *
   * @param {string} type The desired type to create.
   * @returns {Promise}
   */
  _createSession(type: types): Promise<void> {
    const kind = type === types.ReadOnly ? 'reads' : 'writes';
    const options = {
      [kind]: 1,
    };

    return this._createSessions(options);
  }

  /**
   * Batch creates sessions and prepares any necessary transactions.
   *
   * @private
   *
   * @param {object} [options] Config specifying how many sessions to create.
   * @returns {Promise}
   */
  async _createSessions({
    reads = 0,
    writes = 0,
  }: CreateSessionsOptions): Promise<void> {
    const labels = this.options.labels!;

    let needed = reads + writes;
    this._pending += needed;

    // while we can request as many sessions be created as we want, the backend
    // will return at most 100 at a time. hence the need for a while loop
    while (needed > 0) {
      let sessions: Session[] | null = null;

      try {
        [sessions] = await this.database.batchCreateSessions({
          count: needed,
          labels,
        });

        needed -= sessions.length;
      } catch (e) {
        this._pending -= needed;
        throw e;
      }

      sessions.forEach((session: Session) => {
        session.type = writes-- > 0 ? types.ReadWrite : types.ReadOnly;

        this._inventory.borrowed.add(session);
        this._pending -= 1;

        this.release(session);
      });
    }
  }

  /**
   * Attempts to delete a session, optionally creating a new one of the same
   * type if the pool is still open and we're under the configured min value.
   *
   * @private
   *
   * @fires SessoinPool#error
   * @param {Session} session The session to delete.
   * @returns {Promise}
   */
  async _destroy(session: Session): Promise<void> {
    try {
      await this._requests.add(() => session.delete());
    } catch (e) {
      this.emit('error', e);
    }
  }

  /**
   * Deletes idle sessions that exceed the maxIdle configuration.
   *
   * @private
   */
  _evictIdleSessions(): void {
    const {maxIdle, min} = this.options;
    const size = this.size;
    const idle = this._getIdleSessions();

    let count = idle.length;
    let evicted = 0;

    while (count-- > maxIdle! && size - evicted++ > min!) {
      const session = idle.pop();

      if (!session) {
        continue;
      }

      const type = session.type!;
      const index = this._inventory[type].indexOf(session);

      this._inventory[type].splice(index, 1);
      this._destroy(session);
    }
  }

  /**
   * Fills the pool with the minimum number of sessions.
   *
   * @return {Promise}
   */
  async _fill(): Promise<void> {
    const minReadWrite = Math.floor(this.options.min! * this.options.writes!);
    const writes = Math.max(minReadWrite - this.writes, 0);
    const minReadOnly = Math.ceil(this.options.min! - minReadWrite);
    const reads = Math.max(minReadOnly - this.reads, 0);
    const totalNeeded = writes + reads;

    if (totalNeeded === 0) {
      return;
    }

    try {
      await this._createSessions({reads, writes});
    } catch (e) {
      this.emit('error', e);
    }
  }

  /**
   * Retrieves a list of all the idle sessions.
   *
   * @private
   *
   * @returns {Session[]}
   */
  _getIdleSessions(): Session[] {
    const idlesAfter = this.options.idlesAfter! * 60000;
    const sessions: Session[] = [
      ...this._inventory[types.ReadOnly],
      ...this._inventory[types.ReadWrite],
    ];

    return sessions.filter(session => {
      return Date.now() - session.lastUsed! >= idlesAfter;
    });
  }

  /**
   * Returns stack traces for sessions that have not been released.
   *
   * @return {string[]}
   */
  _getLeaks(): string[] {
    return [...this._traces.values()].map(SessionPool.formatTrace);
  }

  /**
   * Attempts to get a session of a specific type. If the type is unavailable it
   * may try to use a different type.
   *
   * @private
   *
   * @param {string} type The desired session type.
   * @param {number} startTime Timestamp to use when determining timeouts.
   * @returns {Promise<Session>}
   */
  async _getSession(type: types, startTime: number): Promise<Session> {
    if (this.available) {
      return this._borrowNextAvailableSession(type);
    }

    if (this.isFull && this.options.fail!) {
      throw new SessionPoolExhaustedError(this._getLeaks());
    }

    let removeListener: Function;

    const promises = [
      this._onClose.then(() => {
        throw new Error(errors.Closed);
      }),
      new Promise(resolve => {
        this.once('available', resolve);
        removeListener = this.removeListener.bind(this, 'available', resolve);
      }),
    ];

    const timeout = this.options.acquireTimeout;

    if (!is.infinite(timeout!)) {
      const elapsed = Date.now() - startTime!;
      const remaining = timeout! - elapsed;

      promises.push(
        new Promise((_, reject) => {
          const error = new Error(errors.Timeout);
          setTimeout(reject.bind(null, error), remaining);
        })
      );
    }

    // Only create a new session if there are more waiters than sessions already
    // being created. The current requester will be waiter number _numWaiters+1.
    if (
      !this.isFull &&
      this._pending + this._pendingPrepare <= this._numWaiters
    ) {
      let reads = this.options.incStep
        ? this.options.incStep
        : DEFAULTS.incStep!;
      let writes = 0;
      if (type === types.ReadWrite) {
        writes++;
        reads--;
      }
      promises.push(
        new Promise((_, reject) => {
          this._createSessions({reads, writes}).catch(reject);
        })
      );
    }

    try {
      this._numWaiters++;
      await Promise.race(promises);
    } catch (e) {
      removeListener!();
      throw e;
    } finally {
      this._numWaiters--;
    }

    return this._borrowNextAvailableSession(type);
  }

  /**
   * Checks to see whether or not session is expired.
   *
   * @param {Session} session The session to check.
   * @returns {boolean}
   */
  _isValidSession(session: Session): boolean {
    // unpinged sessions only stay good for 1 hour
    const MAX_DURATION = 60000 * 60;

    return Date.now() - session.lastUsed! < MAX_DURATION;
  }

  /**
   * Pings an individual session.
   *
   * @private
   *
   * @param {Session} session The session to ping.
   * @returns {Promise}
   */
  async _ping(session: Session): Promise<void> {
    this._borrow(session);

    if (!this._isValidSession(session)) {
      this._inventory.borrowed.delete(session);
      return;
    }

    try {
      await session.keepAlive();
      this.release(session);
    } catch (e) {
      this._inventory.borrowed.delete(session);
      this._destroy(session);
    }
  }

  /**
   * Makes a keep alive request to all the idle sessions.
   *
   * @private
   *
   * @returns {Promise}
   */
  async _pingIdleSessions(): Promise<void> {
    const sessions = this._getIdleSessions();
    const pings = sessions.map(session => this._ping(session));

    await Promise.all(pings);
    return this._fill();
  }

  /**
   * Creates a transaction for a session.
   *
   * @private
   *
   * @param {Session} session The session object.
   * @param {object} options The transaction options.
   * @returns {Promise}
   */
  async _prepareTransaction(session: Session): Promise<void> {
    const transaction = session.transaction(
      (session.parent as Database).queryOptions_
    );
    await transaction.begin();
    session.txn = transaction;
  }

  /**
   * Releases a session back into the pool.
   *
   * @private
   *
   * @fires SessionPool#available
   * @param {Session} session The session object.
   */
  _release(session: Session): void {
    const type = session.type!;

    this._inventory[type].push(session);
    this._inventory.borrowed.delete(session);
    this._traces.delete(session.id);

    this.emit('available');
  }

  /**
   * Starts housekeeping (pinging/evicting) of idle sessions.
   *
   * @private
   */
  _startHouseKeeping(): void {
    const evictRate = this.options.idlesAfter! * 60000;

    this._evictHandle = setInterval(() => this._evictIdleSessions(), evictRate);
    this._evictHandle.unref();

    const pingRate = this.options.keepAlive! * 60000;

    this._pingHandle = setInterval(() => this._pingIdleSessions(), pingRate);
    this._pingHandle.unref();
  }

  /**
   * Stops housekeeping.
   *
   * @private
   */
  _stopHouseKeeping(): void {
    clearInterval(this._pingHandle);
    clearInterval(this._evictHandle);
  }
}
