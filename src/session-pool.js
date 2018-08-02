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

'use strict';

const EventEmitter = require('events').EventEmitter;
const is = require('is');
const PQeue = require('p-queue');
const stackTrace = require('stack-trace');

const READONLY = 'readonly';
const READWRITE = 'readwrite';
const SESSION_TYPE = Symbol();

const DEFAULTS = {
  acquireTimeout: Infinity,
  concurrency: 10,
  fail: false,
  idlesAfter: 10,
  keepAlive: 30,
  max: 100,
  maxIdle: 1,
  min: 0,
  writes: 0,
};

/**
 *
 */
class ClosedError extends Error {
  constructor() {
    super('Database is closed.');
  }
}

/**
 *
 */
class EmptyError extends Error {
  constructor() {
    super('No resources available.');
  }
}

/**
 *
 */
class ReleaseError extends Error {
  constructor(resource) {
    super('Unable to release unknown resource.');
    this.resource = session;
  }
}

/**
 *
 */
class SessionLeakError extends Error {
  constructor(leaks) {
    super(`${leaks.length} session leak(s) detected.`);
    this.messages = leaks;
  }
}

/**
 *
 */
class TimeoutError extends Error {
  constructor() {
    super('Timeout occurred while acquiring session.');
  }
}

/**
 *
 */
class WritePercentError extends TypeError {
  constructor() {
    super(
      'Write percentage should be represented as a float between 0.0 and 1.0.'
    );
  }
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
 * @property {number} [max=100] Maximum number of resources to create at any
 *     given time.
 * @property {number} [maxIdle=1] Maximum number of idle resources to keep in
 *     the pool at any given time.
 * @property {number} [min=0] Minimum number of resources to keep in the pool at
 *     any given time.
 * @property {number} [keepAlive=50] How often to ping idle sessions, in
 *     minutes. Must be less than 1 hour.
 * @property {number} [writes=0.0] Percentage of sessions to be pre-allocated as
 *     write sessions represented as a float.
 */

/**
 * Class used to manage connections to Spanner.
 *
 * **You don't need to use this class directly, connections will be handled for
 * you.**
 *
 * @class
 * @extends {EventEmitter}
 */
class SessionPool extends EventEmitter {

  /**
   * Formats stack trace objects into Node-like stack trace.
   *
   * @param {object[]} trace The trace object.
   * @return {string}
   */
  static formatTrace(trace) {
    const stack = trace.map(t => {
      const name = t.getFunctionName() || t.getMethodName();
      const file = t.getFileName();
      const lineno = t.getLineNumber();
      const columnno = t.getColumnNumber();

      return `    at ${name} (${file}:${lineno}:${columnno})`;
    });

    return `Session leak detected!\n${stack.join('\n')}`;
  }

  /**
   * Total number of available sessions.
   * @type {number}
   */
  get available() {
    const reads = this._inventory[READONLY];
    const writes = this._inventory[READWRITE];

    return reads.length + writes.length;
  }

  /**
   * Total number of borrowed sessions.
   * @type {number}
   */
  get borrowed() {
    return this._inventory.borrowed.size;
  }

  /**
   * Flag to determine if Pool is full.
   * @type {boolean}
   */
  get isFull() {
    return this.size >= this.options.max;
  }

  /**
   * Total number of read sessions.
   * @type {number}
   */
  get reads() {
    const {readonly, borrowed} = this._inventory;
    const available = readonly.length;
    const used = Array.from(borrowed).filter(
      session => session[SESSION_TYPE] === READWRITE
    ).length;

    return available + used;
  }

  /**
   * Total size of pool.
   * @type {number}
   */
  get size() {
    return this.available + this.borrowed;
  }

  /**
   * Total number of write sessions.
   * @type {number}
   */
  get writes() {
    const {readwrite, borrowed} = this._inventory;
    const available = readwrite.length;
    const used = Array.from(borrowed).filter(
      session => session[SESSION_TYPE] === READWRITE
    ).length;

    return available + used;
  }

  /**
   * @constructor
   * @param {Database} database The DB instance.
   * @param {SessionPoolOptions} [options] Configuration options.
   */
  constructor(database, options) {
    super();

    this.isOpen = false;
    this.database = database;
    this.options = Object.assign({}, DEFAULTS, options);

    if (this.options.writes > 1) {
      throw new WritePercentError();
    }

    this._inventory = {
      [READONLY]: [],
      [READWRITE]: [],
      borrowed: new Set(),
    };

    this._requests = new PQeue({
      concurrency: this.options.concurrency,
    });

    this._acquires = new PQeue({
      concurrency: 1,
    });

    this._traces = new Map();
  }

  /**
   * Closes and the pool.
   *
   * @emits SessionPool#close
   * @param {function} callback The callback function.
   */
  close(callback) {
    const sessions = [].concat(
      this._inventory[READONLY],
      this._inventory[READWRITE],
      Array.from(this._inventory.borrowed)
    );

    this._inventory[READONLY] = [];
    this._inventory[READWRITE] = [];
    this._inventory.borrowed.clear();

    this._stopHouseKeeping();

    this.isOpen = false;
    this.emit('close');

    sessions.forEach(session => this._destroy(session));

    this._requests
      .onIdle()
      .then(() => {
        const leaks = this._getLeaks();

        if (leaks.length) {
          throw new SessionLeakError(leaks);
        }
      })
      .then(() => callback(null), callback);
  }

  /**
   * Retrieve a read session.
   *
   * @param {function} callback The callback function.
   * @param {?Error} err Error, if any.
   * @param {Session} session The read session.
   */
  getReadSession(callback) {
    this._acquire(READONLY).then(session => callback(null, session), callback);
  }

  /**
   * Retrieve a read/write session.
   *
   * @param {function} callback The callback function.
   * @param {?Error} err Error, if any.
   * @param {Session} session The read/write session.
   * @param {Transaction} transaction The transaction object.
   */
  getWriteSession(callback) {
    this._acquire(READWRITE).then(
      session => callback(null, session, session.txn),
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
  open() {
    this._onClose = new Promise(resolve => this.once('close', resolve));
    this._startHouseKeeping();

    this.isOpen = true;
    this.emit('open');

    return this._fill();
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
  release(session) {
    if (!this._inventory.borrowed.has(session)) {
      throw new ReleaseError(session);
    }

    if (session[SESSION_TYPE] === READONLY) {
      this._release(session);
      return;
    }

    this._prepareTransaction(session)
      .catch(() => (session[SESSION_TYPE] = READONLY))
      .then(() => this._release(session));
  }

  /**
   * Attempts to borrow a session from the pool.
   *
   * @private
   *
   * @param {string} type The desired type to borrow.
   * @returns {Promise<Session>}
   */
  _acquire(type) {
    if (!this.isOpen) {
      return Promise.reject(new ClosedError());
    }

    const trace = stackTrace.get();
    const getSession = () =>
      this._getSession(type).then(session => {
        if (!this._isValidSession(session)) {
          this.inventory.borrowed.delete(session);
          return getSession();
        }

        session.lastUsed = Date.now();
        this._traces.set(session.id, trace);
        return session;
      });

    return this._acquires.add(getSession);
  }

  /**
   * Moves a session into the borrowed group.
   *
   * @private
   *
   * @param {Session} session The session object.
   */
  _borrow(session) {
    const type = session[SESSION_TYPE];
    const index = this._inventory[type].indexOf(session);

    this._inventory.borrowed.add(session);
    this._inventory[type].splice(index, 1);
  }

  /**
   * Borrows session from specific group.
   *
   * @private
   *
   * @param {string} type The desired session type.
   * @return {Session}
   */
  _borrowFrom(type) {
    const session = this._inventory[type][0];
    this._borrow(session);
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
  _borrowNextAvailableSession(type) {
    const hasReads = this._inventory[READONLY].length > 0;

    if (type === READONLY && hasReads) {
      return Promise.resolve(this._borrowFrom(READONLY));
    }

    const hasWrites = this._inventory[READWRITE].length > 0;

    if (hasWrites) {
      return Promise.resolve(this._borrowFrom(READWRITE));
    }

    const session = this._borrowFrom(READONLY);

    return this._prepareTransaction(session)
      .then(() => session)
      .catch(err => {
        this._release(session);
        throw err;
      });
  }

  /**
   * Attempts to create a session of a certain type.
   *
   * @private
   *
   * @param {string} type The desired type to create.
   * @returns {Promise}
   */
  _createSession(type) {
    const session = this.database.session();

    this._inventory.borrowed.add(session);

    return this._requests
      .add(() => {
        return session.create().then(() => {
          if (type === READWRITE) {
            return this._prepareTransaction(session).catch(
              () => (type = READONLY)
            );
          }
        });
      })
      .then(
        () => {
          session[SESSION_TYPE] = type;
          session.lastUsed = Date.now();

          this._inventory[type].push(session);
          this._inventory.borrowed.delete(session);
        },
        err => {
          this._inventory.borrowed.delete(session);
          throw err;
        }
      );
  }

  /**
   * Attempts to create a session but emits any errors that occur.
   *
   * @private
   *
   * @emits SessionPool#available
   * @emits SessionPool#error
   * @param {string} type The desired type to create.
   * @returns {Promise}
   */
  _createSessionInBackground(type) {
    return this._createSession(type).then(
      () => this.emit('available'),
      err => this.emit('error', err)
    );
  }

  /**
   * Attempts to delete a session, optionally creating a new one of the same type
   * if the pool is still open and we're under the configured min value.
   *
   * @private
   *
   * @fires SessoinPool#error
   * @param {Session} session The session to delete.
   * @returns {Promise}
   */
  _destroy(session) {
    return this._requests
      .add(() => session.delete())
      .catch(err => this.emit('error', err));
  }

  /**
   * Deletes idle sessions that exceed the maxIdle configuration.
   *
   * @private
   */
  _evictIdleSessions() {
    const {maxIdle, min} = this.options;
    const size = this.size;
    const idle = this._getIdleSessions();

    let count = idle.length;
    let evicted = 0;

    while (count-- > maxIdle && size - evicted++ > min) {
      let session = idle.pop();
      let type = session[SESSION_TYPE];
      let index = this._inventory[type].indexOf(session);

      this._inventory.splice(index, 1);
      this._destroy(session);
    }
  }

  /**
   * Fills the pool with the minimum number of sessions.
   *
   * @return {Promise}
   */
  _fill() {
    const requests = [];

    const minReadWrite = Math.floor(this.options.min * this.options.writes);
    const neededReadWrite = Math.max(minReadWrite - this.writes, 0);

    for (let i = 0; i < neededReadWrite; i++) {
      requests.push(this._createSessionInBackground(READWRITE));
    }

    const minReadOnly = Math.ceil(this.options.min - minReadWrite);
    const neededReadOnly = Math.max(minReadOnly - this.reads, 0);

    for (let i = 0; i < neededReadOnly; i++) {
      requests.push(this._createSessionInBackground(READONLY));
    }

    return Promise.all(requests);
  }

  /**
   * Retrieves a list of all the idle sessions.
   *
   * @private
   *
   * @returns {Session[]}
   */
  _getIdleSessions() {
    const idlesAfter = this.options.idlesAfter * 60000;
    const sessions = [].concat(
      this._inventory[READWRITE],
      this._inventory[READONLY]
    );

    return sessions.filter(session => {
      return Date.now() - session.lastUsed >= idlesAfter;
    });
  }

  /**
   * Returns stack traces for sessions that have not been released.
   *
   * @return {string[]}
   */
  _getLeaks() {
    return Array.from(this._traces.values()).map(SessionPool.formatTrace);
  }

  /**
   * Attempts to get a session of a specific type. If the type is unavailable it
   * may try to use a different type.
   *
   * @private
   *
   * @param {string} type The desired session type.
   * @returns {Promise<Session>}
   */
  _getSession(type) {
    if (this.available) {
      return this._borrowNextAvailableSession(type);
    }

    if (this.options.fail) {
      return Promise.reject(new EmptyError());
    }

    const promises = [
      this._onClose.then(() => Promise.reject(new ClosedError())),
      this._waitForNextAavailable(type),
    ];

    const timeout = this.options.acquireTimeout;

    if (!is.infinite(timeout)) {
      promises.push(delay.reject(timeout, new TimeoutError()));
    }

    if (!this.isFull) {
      promises.push(
        new Promise((resolve, reject) => {
          this._createSession(type).then(() => this.emit('available'), reject);
        })
      );
    }

    return Promise.race(promises);
  }

  /**
   * Checks to see whether or not session is expired.
   *
   * @param {Session} session The session to check.
   * @returns {boolean}
   */
  _isValidSession(session) {
    // unpinged sessions only stay good for 1 hour
    const MAX_DURATION = 60000 * 60;

    return Date.now() - session.lastUsed < MAX_DURATION;
  }

  /**
   * Creates a promise that will settle once a Session becomes available.
   *
   * @private
   *
   * @returns {Promise}
   */
  _onAvailable() {
    return new Promise(resolve => this.once('available', resolve));
  }

  /**
   * Pings an individual session.
   *
   * @private
   *
   * @param {Session} session The session to ping.
   * @returns {Promise}
   */
  _ping(session) {
    this._borrow(session);

    if (!this._isValidSession(session)) {
      this._inventory.borrowed.delete(session);
      return Promise.resolve();
    }

    return session.keepAlive().then(
      () => this.release(session),
      () => {
        this._inventory.borrowed.delete(session);
        this._destroy(session);
      }
    );
  }

  /**
   * Makes a keep alive request to all the idle sessions.
   *
   * @private
   *
   * @returns {Promise}
   */
  _pingIdleSessions() {
    const sessions = this._getIdleSessions();

    return Promise.all(sessions.map(session => this._ping(session))).then(() =>
      this._fill()
    );
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
  _prepareTransaction(session, options) {
    return session
      .beginTransaction(options)
      .then(([transaction]) => {
        session.txn = transaction;
      });
  }

  /**
   * Releases a session back into the pool.
   *
   * @private
   *
   * @fires SessionPool#available
   * @param {Session} session The session object.
   */
  _release(session) {
    const type = session[SESSION_TYPE];

    this._inventory[type].unshift(session);
    this._inventory.borrowed.delete(session);
    this._traces.delete(session.id);

    this.emit('available');
  }

  /**
   * Starts housekeeping (pinging/evicting) of idle sessions.
   *
   * @private
   */
  _startHouseKeeping() {
    const evictRate = this.options.idlesAfter * 60000;

    this._evictHandle = setInterval(() => this._evictIdleSessions(), evictRate);
    this._evictHandle.unref();

    const pingRate = this.options.keepAlive * 60000;

    this._pingHandle = setInterval(() => this._pingIdleSessions(), pingRate);
    this._pingHandle.unref();
  }

  /**
   * Stops housekeeping.
   *
   * @private
   */
  _stopHouseKeeping() {
    clearInterval(this._pingHandle);
    clearInterval(this._evictHandle);
  }

  /**
   * Waits for the next available session and returns it.
   *
   * @private
   *
   * @param {string} type The desired session type.
   * @return {Promise<Session>}
   */
  _waitForNextAavailable(type) {
    return this._onAvailable().then(() =>
      this._borrowNextAvailableSession(type)
    );
  }
}

module.exports = SessionPool;
