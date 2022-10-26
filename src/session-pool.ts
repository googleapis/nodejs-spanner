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
import {GoogleError, grpc, ServiceError} from 'google-gax';
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
  /**
   * Will be called by the Database object, should be used to start creating
   * sessions/etc.
   *
   * @name SessionPoolInterface#open
   */
  /**
   * When called returns a read-only session.
   *
   * @name SessionPoolInterface#getReadSession
   * @param {GetReadSessionCallback} callback The callback function.
   */
  /**
   * When called returns a read-write session with prepared transaction.
   *
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
  getReadSession(
    longRunningTransaction: boolean,
    callback: GetReadSessionCallback
  ): void;
  getWriteSession(
    longRunningTransaction: boolean,
    callback: GetWriteSessionCallback
  ): void;
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
  killLongRunningTransactions?: boolean;
  logging?: boolean;
  loggingEndpoint?: string;
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
  min: 25,
  writes: 0,
  incStep: 25,
  killLongRunningTransactions: false,
  logging: false,
};

/**
 * Error to be thrown when attempting to release unknown resources.
 *
 * @private
 */
export class ReleaseError extends GoogleError {
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
export class SessionLeakError extends GoogleError {
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
export class SessionPoolExhaustedError extends GoogleError {
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
 * Checks whether the given error is a 'Database not found' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is a 'Database not found' error, and otherwise false.
 */
export function isDatabaseNotFoundError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.code === grpc.status.NOT_FOUND &&
    error.message.includes('Database not found')
  );
}

/**
 * Checks whether the given error is an 'Instance not found' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is an 'Instance not found' error, and otherwise false.
 */
export function isInstanceNotFoundError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.code === grpc.status.NOT_FOUND &&
    error.message.includes('Instance not found')
  );
}

/**
 * Checks whether the given error is a 'Create session permission' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is a 'Create session permission' error, and otherwise false.
 */
export function isCreateSessionPermissionError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.code === grpc.status.PERMISSION_DENIED &&
    error.message.includes('spanner.sessions.create')
  );
}

/**
 * Checks whether the given error is a 'Could not load the default credentials' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is a 'Could not load the default credentials' error, and otherwise false.
 */
export function isDefaultCredentialsNotSetError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.message.includes('Could not load the default credentials')
  );
}

/**
 * Checks whether the given error is an 'Unable to detect a Project Id in the current environment' error.
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is an 'Unable to detect a Project Id in the current environment' error, and otherwise false.
 */
export function isProjectIdNotSetInEnvironmentError(
  error: grpc.ServiceError | undefined
): boolean {
  return (
    error !== undefined &&
    error.message.includes(
      'Unable to detect a Project Id in the current environment'
    )
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

interface Waiters {
  [types.ReadOnly]: number;
  [types.ReadWrite]: number;
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
  _waiters: Waiters;
  _numInProcessPrepare = 0;
  _pingHandle!: NodeJS.Timer;
  _requests: PQueue;
  _traces: Map<Session, trace.StackFrame[]>;
  _longRunningTransactionHandle?: NodeJS.Timer;
  _ongoingTransactionDeletion: boolean;

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
   * Current fraction of write-prepared sessions in the pool.
   * @type {number}
   */
  get currentWriteFraction(): number {
    if (this.available + this.pendingPrepare === 0) {
      // There are no sessions in the pool. Define the current write fraction as
      // 0.5. That means that if the user has configured a write fraction >= 0.5
      // the first session to be created will be a write session, while it will
      // otherwise be a read-only session.
      return 0.5;
    }
    const writes =
      this._inventory[types.ReadWrite].length + this.pendingPrepare;
    return writes / (this.available + this.pendingPrepare);
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
   * Number of sessions currently being prepared for a read/write transaction
   * before being released into the pool. This number does not include the
   * number of sessions being prepared for a read/write transaction that have
   * already been checked out of the pool.
   * @type {number}
   */
  get pendingPrepare(): number {
    return this._pendingPrepare;
  }

  /**
   * Number of sessions being created or prepared for a read/write transaction.
   * @type {number}
   */
  get totalPending(): number {
    return this._pending + this._pendingPrepare;
  }

  /**
   * Current number of waiters for a read-only session.
   * @type {number}
   */
  get numReadWaiters(): number {
    return this._waiters[types.ReadOnly];
  }

  /**
   * Current number of waiters for a read/write session.
   * @type {number}
   */
  get numWriteWaiters(): number {
    return this._waiters[types.ReadWrite];
  }

  /**
   * Sum of read and write waiters.
   * @type {number}
   */
  get totalWaiters(): number {
    return this.numReadWaiters + this.numWriteWaiters;
  }

  get maxSessions(): number {
    return this.options.max
      ? this.options.max
      : DEFAULTS.max
      ? DEFAULTS.max
      : 100;
  }

  /**
   * @constructor
   * @param {Database} database The DB instance.
   * @param {SessionPoolOptions} [options] Configuration options.
   */
  constructor(database: Database, options?: SessionPoolOptions) {
    super();

    if (options && options.min && options.max && options.min > options.max) {
      throw new TypeError('Min sessions may not be greater than max sessions.');
    }
    this.isOpen = false;
    this.database = database;
    this.options = Object.assign({}, DEFAULTS, options);
    this.options.min = Math.min(this.options.min!, this.options.max!);
    this._ongoingTransactionDeletion = false;

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
    this._waiters = {
      [types.ReadOnly]: 0,
      [types.ReadWrite]: 0,
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
  getReadSession(
    longRunningTransaction: boolean,
    callback: GetReadSessionCallback
  ): void {
    this._acquire(types.ReadOnly, longRunningTransaction).then(
      session => callback(null, session),
      callback
    );
  }

  /**
   * Retrieve a read/write session.
   *
   * @param {GetWriteSessionCallback} callback The callback function.
   */
  getWriteSession(
    longRunningTransaction: boolean,
    callback: GetWriteSessionCallback
  ): void {
    this._acquire(types.ReadWrite, longRunningTransaction).then(
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

    this._fill().catch(err => {
      // Ignore `Database not found` error. This allows a user to call instance.database('db-name')
      // for a database that does not yet exist with SessionPoolOptions.min > 0.
      if (
        isDatabaseNotFoundError(err) ||
        isInstanceNotFoundError(err) ||
        isCreateSessionPermissionError(err) ||
        isDefaultCredentialsNotSetError(err) ||
        isProjectIdNotSetInEnvironmentError(err)
      ) {
        return;
      }
      this.emit('error', err);
    });
  }

  /**
   * Releases session back into the pool. If the session is a write session it
   * will also prepare a new transaction before releasing it.
   *
   * @throws {Error} For unknown sessions.
   * @emits SessionPool#available
   * @emits SessionPool#error
   * @emits SessionPool#readonly-available
   * @emits SessionPool#readwrite-available
   * @param {Session} session The session to release.
   */
  release(session: Session): void {
    if (!this._inventory.borrowed.has(session)) {
      throw new ReleaseError(session);
    }

    delete session.txn;
    session.lastUsed = Date.now();
    session.longRunningTransaction = false;

    if (isSessionNotFoundError(session.lastError)) {
      // Remove the session from the pool. It is not necessary to call _destroy,
      // as the session is already removed from the backend.
      this._inventory.borrowed.delete(session);
      this._traces.delete(session);
      return;
    }
    session.lastError = undefined;

    // Release it into the pool as a read-only session in the following cases:
    // 1. There are more waiters than there are sessions available. Releasing it
    //    into the pool will ensure that a waiter will be unblocked as soon as
    //    possible.
    // 2. The user has not set a write fraction, but this session has been used
    //    as a read/write session. This is an indication that the application
    //    needs read/write sessions, and the pool should try to keep that number
    //    of read/write sessions dynamically.
    // 3. The user has set a write fraction and that fraction has been reached.
    const shouldBeWrite =
      (session.type === types.ReadWrite && this.options.writes === 0) ||
      (this.options.writes! > 0 &&
        this.currentWriteFraction < this.options.writes!);
    if (this.totalWaiters > this.available || !shouldBeWrite) {
      session.type = types.ReadOnly;
      this._release(session);
      return;
    }

    // Delete the trace associated with this session to mark the session as checked
    // back into the pool. This will prevent the session to be marked as leaked if
    // the pool is closed while the session is being prepared.
    this._traces.delete(session);
    this._pendingPrepare++;
    session.type = types.ReadWrite;
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
  async _acquire(
    type: types,
    longRunningTransaction: boolean
  ): Promise<Session> {
    if (!this.isOpen) {
      throw new GoogleError(errors.Closed);
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
        throw new GoogleError(errors.Timeout);
      }

      const session = await this._getSession(
        type,
        startTime,
        longRunningTransaction
      );

      if (this._isValidSession(session)) {
        return session;
      }

      this._inventory.borrowed.delete(session);
      return getSession();
    };

    const session = await this._acquires.add(getSession);

    if (type === types.ReadWrite && session.type === types.ReadOnly) {
      this._numInProcessPrepare++;
      try {
        await this._prepareTransaction(session);
      } catch (e) {
        if (isSessionNotFoundError(e as ServiceError)) {
          this._inventory.borrowed.delete(session);
        } else {
          this._release(session);
        }
        throw e;
      }
    }
    // Mark the session as the type that was requested. This ensures that the
    // fraction of read/write sessions in the pool is kept aligned with the
    // actual need if the user has not specified a write fraction in the session
    // pool options.
    session.type = type;

    this._traces.set(session, frames);
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
  _borrowFrom(type: types, longRunningTransaction: boolean): Session {
    const session = this._inventory[type].pop()!;
    this._inventory.borrowed.add(session);
    session.lastUsed = Date.now();
    session.longRunningTransaction = longRunningTransaction;

    const maxSessions = this.maxSessions;

    if (
      this.options.killLongRunningTransactions &&
      this.borrowed / maxSessions >= 0.95
    ) {
      this._startCleaningLongRunningSessions();
    }

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
  _borrowNextAvailableSession(
    type: types,
    longRunningTransaction: boolean
  ): Session {
    const hasReads = !!this._inventory[types.ReadOnly].length;

    if (type === types.ReadOnly && hasReads) {
      return this._borrowFrom(types.ReadOnly, longRunningTransaction);
    }

    const hasWrites = !!this._inventory[types.ReadWrite].length;

    if (hasWrites) {
      return this._borrowFrom(types.ReadWrite, longRunningTransaction);
    }

    return this._borrowFrom(types.ReadOnly, longRunningTransaction);
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
    const options = {[kind]: 1};

    return this._createSessions(options);
  }

  /**
   * Batch creates sessions and prepares any necessary transactions.
   *
   * @private
   *
   * @param {object} [options] Config specifying how many sessions to create.
   * @returns {Promise}
   * @emits SessionPool#createError
   */
  async _createSessions({
    reads = 0,
    writes = 0,
  }: CreateSessionsOptions): Promise<void> {
    const labels = this.options.labels!;

    let needed = reads + writes;
    if (needed <= 0) {
      return;
    }
    this._pending += needed;

    // while we can request as many sessions be created as we want, the backend
    // will return at most 100 at a time, hence the need for a while loop.
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
        this.emit('createError', e);
        throw e;
      }

      sessions.forEach((session: Session) => {
        session.type = writes-- > 0 ? types.ReadWrite : types.ReadOnly;

        setImmediate(() => {
          this._inventory.borrowed.add(session);
          this._pending -= 1;
          this.release(session);
        });
      });
    }
  }

  /**
   * Attempts to delete a session, optionally creating a new one of the same
   * type if the pool is still open and we're under the configured min value.
   *
   * @private
   *
   * @fires SessionPool#error
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
    const needed = this.options.min! - this.size;
    if (needed <= 0) {
      return;
    }

    try {
      await this._createSessions({reads: needed, writes: 0});
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
   * Returns true if the pool has a session that is usable for the specified
   * type, i.e. if a read-only session is requested, it returns true if the
   * pool has a read-only or a read/write session. If a read/write session is
   * requested, the method only returns true if the pool has a read/write
   * session available.
   * @param type The type of session.
   * @private
   */
  _hasSessionUsableFor(type: types): boolean {
    return (
      this._inventory[type].length > 0 ||
      this._inventory[types.ReadWrite].length > 0
    );
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
  async _getSession(
    type: types,
    startTime: number,
    longRunningTransaction: boolean
  ): Promise<Session> {
    if (this._hasSessionUsableFor(type)) {
      return this._borrowNextAvailableSession(type, longRunningTransaction);
    }
    // If a read/write session is requested and the pool has a read-only session
    // available, we should return that session unless there is a session
    // currently being prepared for read/write that is not already claimed by
    // another requester.
    if (
      type === types.ReadWrite &&
      this._hasSessionUsableFor(types.ReadOnly) &&
      this.numWriteWaiters >= this.pendingPrepare
    ) {
      return this._borrowNextAvailableSession(type, longRunningTransaction);
    }

    if (this.isFull && this.options.fail!) {
      throw new SessionPoolExhaustedError(this._getLeaks());
    }

    let removeOnceCloseListener: Function;
    let removeListener: Function;

    // Wait for the requested type of session to become available.
    const availableEvent = type + '-available';
    const promises = [
      new Promise((_, reject) => {
        const onceCloseListener = () => reject(new GoogleError(errors.Closed));
        this.once('close', onceCloseListener);
        removeOnceCloseListener = this.removeListener.bind(
          this,
          'close',
          onceCloseListener
        );
      }),
      new Promise(resolve => {
        this.once(availableEvent, resolve);
        removeListener = this.removeListener.bind(
          this,
          availableEvent,
          resolve
        );
      }),
    ];

    const timeout = this.options.acquireTimeout;

    let removeTimeoutListener = () => {};
    if (!is.infinite(timeout!)) {
      const elapsed = Date.now() - startTime!;
      const remaining = timeout! - elapsed;

      promises.push(
        new Promise((_, reject) => {
          const error = new Error(errors.Timeout);
          const timeoutFunction = setTimeout(
            reject.bind(null, error),
            remaining
          );
          removeTimeoutListener = () => clearTimeout(timeoutFunction);
        })
      );
    }

    // Only create a new session if there are more waiters than sessions already
    // being created. The current requester will be waiter number _numWaiters+1.
    if (!this.isFull && this.totalPending <= this.totalWaiters) {
      let reads = this.options.incStep
        ? this.options.incStep
        : DEFAULTS.incStep!;
      // Create additional sessions if the configured minimum has not been reached.
      const min = this.options.min ? this.options.min : 0;
      if (this.size + this.totalPending + reads < min) {
        reads = min - this.size - this.totalPending;
      }
      // Make sure we don't create more sessions than the pool should have.
      if (reads + this.size > this.options.max!) {
        reads = this.options.max! - this.size;
      }
      if (reads > 0) {
        this._pending += reads;
        promises.push(
          new Promise((_, reject) => {
            this._pending -= reads;
            this._createSessions({reads, writes: 0}).catch(reject);
          })
        );
      }
    }

    let removeErrorListener: Function;
    promises.push(
      new Promise((_, reject) => {
        this.once('createError', reject);
        removeErrorListener = this.removeListener.bind(
          this,
          'createError',
          reject
        );
      })
    );

    try {
      this._waiters[type]++;
      await Promise.race(promises);
    } finally {
      this._waiters[type]--;
      removeOnceCloseListener!();
      removeListener!();
      removeErrorListener!();
      removeTimeoutListener();
    }

    return this._borrowNextAvailableSession(type, longRunningTransaction);
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

  async _deleteLongRunningTransactions(): Promise<void> {
    if (this._ongoingTransactionDeletion) return;
    this._ongoingTransactionDeletion = true;
    for (const session of this._traces.keys()) {
      if (session.lastUsed && !session.longRunningTransaction) {
        if (
          !session.longRunningTransaction &&
          (Date.now() - session?.lastUsed) / 6000 > 60
        ) {
          this.release(session);
        }
      }
    }
    this._ongoingTransactionDeletion = false;
  }

  /**
   * Releases a session back into the pool.
   *
   * @private
   *
   * @fires SessionPool#available
   * @fires SessionPool#readonly-available
   * @fires SessionPool#readwrite-available
   * @param {Session} session The session object.
   */
  _release(session: Session): void {
    const type = session.type!;

    this._inventory[type].push(session);
    this._inventory.borrowed.delete(session);
    this._traces.delete(session);

    this.emit('available');
    // Determine the type of waiter to unblock.
    let emitType: types;
    if (
      type === types.ReadOnly &&
      !this.numReadWaiters &&
      this.numWriteWaiters
    ) {
      emitType = types.ReadWrite;
    } else if (
      type === types.ReadWrite &&
      !this.numWriteWaiters &&
      this.numReadWaiters
    ) {
      emitType = types.ReadOnly;
    } else {
      emitType = type;
    }
    this.emit(emitType + '-available');

    const maxSessions = this.maxSessions;

    if (
      this.options.killLongRunningTransactions &&
      this.borrowed / maxSessions < 0.95
    ) {
      this._stopCleaningLongRunningSessions();
    }
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

  _startCleaningLongRunningSessions(): void {
    if (this._longRunningTransactionHandle) return;
    this._longRunningTransactionHandle = setInterval(
      () => this._deleteLongRunningTransactions(),
      120000
    );
    this._longRunningTransactionHandle.ref();
  }

  _stopCleaningLongRunningSessions(): void {
    if (this._longRunningTransactionHandle)
      clearInterval(this._longRunningTransactionHandle);
    this._longRunningTransactionHandle = undefined;
  }
}
