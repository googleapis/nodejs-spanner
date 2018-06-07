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

const extend = require('extend');
const PQueue = require('p-queue');
const streamEvents = require('stream-events');
const through = require('through2');
const Pool = require('generic-pool');

const DEFAULTS = {
  acquireTimeout: Infinity,
  concurrency: 10,
  maxWait: 50,
  fail: false,
  idlesAfter: 50,
  max: 100,
  min: 0,
  writes: 0,
  maxReads: 0,
  maxWrites: 0,
  minReads: -1,
  minWrites: -1,
  keepAlive: 50,
};

const READONLY = 'readonly';
const READWRITE = 'readwrite';

/**
 * Session pool configuration options.
 *
 * @typedef {object} SessionPoolOptions
 * @property {number} [acquireTimeout=Infinity] Time in milliseconds before
 *     giving up trying to acquire a session. If the specified value is
 *     Infinity, a timeout will not occur. A non-zero positive integer
 * @property {boolean} [fail=false] If set to true, an error will be thrown when
 *     there are no available sessions for a request.
 * @property {number} [min=0] Minimum number of resources to keep in the pool at
 *     any given time.
 * @property {number} [max=100] Maximum number of resources to create at any
 *     given time.
 * @property {number} [writes=0.0] Percentage of sessions to be pre-allocated as
 *     write sessions represented as a float.
 * @property {number} [concurrency=10] How many concurrent requests the pool is
 *     allowed to make.
 * @property {number} [maxWait=50] This property specifies how many acquire sessions call are allowed
 *     to wait before returning an error. Default is 50. This supercedes fail property
 * @property {number} [idlesAfter=50] How long until a resource becomes idle, in
 *     minutes after which the resource will be destroyed and if required, a recourd will be created
 *     to respect the minReads or minWrites options. It will default to 50 if provide more than 50 minutes
 * @property {number} [maxReads=100] Maximum number of write sessions to create at any
 *     given time. This supercedes max property
 * @property {number} [maxWrites=100] Maximum number of read sessions to create at any
 *     given time. This supercedes min property and writes property
 * @property {number} [minReads=0] Minimum number of read sessions to create at any
 *     given time. This supercedes min property
 * @property {number} [minWrites=0] Minimum number of write sessions to keep in the pool at
 *     any given time. This supercedes max property and writes property
 * @property {number} [keepAlive=50] How often to ping idle sessions, in
 *     minutes. Must be less than 1 hour.

/**
 * Class used to manage connections to Spanner.
 *
 * **You don't need to use this class directly, connections will be handled for
 * you.**
 *
 * @class
 * @extends {EventEmitter}
 *
 * @param {Database} database The DB instance.
 * @param {SessionPoolOptions} [options] Configuration options.
 */
function SessionPool(database, options) {
  /**
   * @name SessionPool#database
   * @readonly
   * @type {Database}
   */
  this.database = database;

  /**
   * @name SessionPool#options
   * @readonly
   * @type {SessionPoolOptions}
   */
  this.options = extend({}, DEFAULTS, options);

  /**
   * @name SessionPool#isOpen
   * @readonly
   * @type {boolean}
   */
  this.isOpen = false;

  this.request_ = database.request;
  this.requestStream_ = database.requestStream;
  this.requestQueue_ = new PQueue({concurrency: this.options.concurrency});
  this.acquireQueue_ = new PQueue({concurrency: 1});

  if (this.options.writes > 1) {
    throw new TypeError(
      'Write percentage should be represented as a float between 0.0 and 1.0.'
    );
  }

  // this code is for backward compatibility. Convert the max value provided into maxReads and maxWrites
  if (this.options.maxWrites === 0) {
    if (this.options.maxReads === 0) {
      if (this.options.writes !== 0) {
        // create dedicated write sessions based on maxWrites
        this.options.maxWrites = Math.floor(
          this.options.writes * this.options.max
        );
      }
    } else {
      this.options.maxWrites = this.options.max - this.options.maxReads;
    }
  }

  if (this.options.maxReads === 0) {
    this.options.maxReads = this.options.max - this.options.maxWrites;
  }

  this.options.minReads = Math.min(
    this.options.minReads,
    this.options.maxReads
  );
  // this code is for backward compatibility. Initialize the minReads value
  if (this.options.minReads === -1) {
    this.options.minReads = Math.min(this.options.min, this.options.maxReads);
  }

  this.options.minWrites = Math.min(
    this.options.minWrites,
    this.options.maxWrites
  );
  // this code is for backward compatibility. Initialize the minWrites value
  if (this.options.minWrites === -1) {
    this.options.minWrites = Math.min(this.options.min, this.options.maxWrites);
  }

  this.maxIdleResourceTimeout =
    Math.min(this.options.idlesAfter, DEFAULTS.idlesAfter) * 60000;

  this.readPool = Pool.createPool(
    {
      create: this.createReadSession.bind(this),
      destroy: this.destroySession.bind(this),
      validate: validateSession.bind(this),
    },
    {
      max: this.options.maxReads,
      min: this.options.minReads,
      acquireTimeoutMillis:
        this.options.acquireTimeout === Infinity
          ? 0
          : this.options.acquireTimeout,
      autostart: false,
      maxWaitingClients: this.options.maxWait,
      evictionRunIntervalMillis: this.maxIdleResourceTimeout,
      numTestsPerEvictionRun: this.options.minReads,
      idleTimeoutMillis: this.maxIdleResourceTimeout,
      testOnBorrow: true,
    }
  );

  this.writePool = Pool.createPool(
    {
      create: this.createWriteSession.bind(this),
      destroy: this.destroySession.bind(this),
      validate: validateSession.bind(this),
    },
    {
      max: this.options.maxWrites,
      min: this.options.minWrites,
      acquireTimeoutMillis:
        this.options.acquireTimeout === Infinity
          ? 0
          : this.options.acquireTimeout,
      autostart: false,
      evictionRunIntervalMillis: this.maxIdleResourceTimeout,
      maxWaitingClients: this.options.maxWait,
      numTestsPerEvictionRun: this.options.minWrites,
      idleTimeoutMillis: this.maxIdleResourceTimeout,
      testOnBorrow: true,
    }
  );
}

/**
 * This method validates the session. The session is invalid if the session is idle for more than the maxIdleResourceTimeout
 * This is internally used by generic-pool and hence there is no need to make it a method of the class.
 *
 * @param {Object} session
 */
function validateSession(session) {
  const now = Date.now();
  if (!session || !session.lastUsed) {
    return Promise.resolve(false);
  }
  const flag = now - session.lastUsed < this.maxIdleResourceTimeout;
  session.lastUsed = now;
  return Promise.resolve(flag);
}
/**
 * Opens the pool, filling it to the configured number of read and write
 * sessions.
 *
 * @return {Promise}
 */
SessionPool.prototype.open = function() {
  const self = this;
  // Start the pinging of sessions
  this.isOpen = true;
  // Start both pools creation & internal processes
  this.readPool.start();
  this.writePool.start();
  self.pingTimeoutHandle = setTimeout(
    () => self.pingSessions_.call(self),
    60000 * self.options.keepAlive
  );
};

/**
 * Closes and the pool.
 *
 * @returns {Promise}
 */
SessionPool.prototype.close = function() {
  const self = this;
  self.isOpen = false;
  clearTimeout(self.pingTimeoutHandle);
  return Promise.all([
    self.readPool.drain(),
    self.writePool.drain(),
    self.requestQueue_.onEmpty(),
  ]).then(() => {
    self.readPool.clear();
    self.writePool.clear();
  });
};

/**
 * Make an API request as a stream, first assuring an active session is used.
 *
 * @param {object} config
 * @returns {Stream}
 */
SessionPool.prototype.requestStream = function(config) {
  const self = this;

  let requestStream;
  let session;

  let waitForSessionStream = streamEvents(through.obj());
  waitForSessionStream.abort = function() {
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
      self.release(session);
      session = null;
    }
  }

  waitForSessionStream.on('reading', function() {
    self.getReadSession().then(function(session_) {
      session = session_;
      config.reqOpts.session = session_.formattedName_;

      requestStream = self.requestStream_(config);

      requestStream
        .on('error', releaseSession)
        .on('error', destroyStream)
        .on('end', releaseSession)
        .pipe(waitForSessionStream);
    }, destroyStream);
  });

  return waitForSessionStream;
};

/**
 * This method returns a read/write session (which ever is available)
 */
SessionPool.prototype.getNextAvailableSession_ = function() {
  const self = this;
  let resolved = false;

  function getRead() {
    return self.getReadSession('race').then(session => {
      if (resolved) {
        return self.release(session);
      }
      resolved = true;
      return session;
    });
  }

  function getWrite() {
    return self.getWriteSession('race').then(session => {
      if (resolved) {
        return self.release(session);
      }
      resolved = true;
      return session;
    });
  }

  return self.acquireQueue_.add(() => Promise.race([getRead(), getWrite()]));
};

/**
 * Returns a read session
 *
 * @returns {Promise}
 */
SessionPool.prototype.getReadSession = function(callee) {
  const self = this;

  if (!self.isOpen) {
    return Promise.reject(new Error('Database is closed.'));
  }
  /*
    getReadSession calling race_, race_ calling getReadSession and the loop continues.
    If race_ method calls getReadSession then it should skip this check.
    Also, we do not want to get stuck in the acquire queue loop as we want the first session available
  */
  if (callee === 'race') {
    return self.readPool.acquire();
  }

  /*
    if readpool is maxed and there are no available session
    and if writePool has any available session then use it
   */
  if (
    self.readPool.spareResourceCapacity === 0 &&
    self.readPool.available === 0
  ) {
    if (self.writePool.spareResourceCapacity || self.writePool.available > 0) {
      return self.getWriteSession();
    } else {
      // return the first available session
      return self.getNextAvailableSession_();
    }
  }

  return self.acquireQueue_.add(() => self.readPool.acquire());
};

/**
 * Returns a write session
 *
 * @returns {Promise}
 */
SessionPool.prototype.getWriteSession = function(callee) {
  const self = this;

  if (!self.isOpen) {
    return Promise.reject(new Error('Database is closed.'));
  }

  /*
    getWriteSession calling race_, race_ calling getWriteSession and the loop continues.
    If race_ method calls getWriteSession then it should skip this check
    Also, we do not want to get stuck in the acquire queue loop as we want the first session available
  */
  if (callee === 'race') {
    return self.writePool.acquire();
  }
  /*
    if writepool is maxed and there are no available session
    and if readpool has any available session then use it
  */
  if (
    self.writePool.spareResourceCapacity === 0 &&
    self.writePool.available === 0
  ) {
    if (
      self.readPool.spareResourceCapacity ||
      self.readPool.available > 0 ||
      self.writePool.max === 0
    ) {
      return self
        .getReadSession()
        .then(session => self.createTransaction_(session));
    } else {
      return self.getNextAvailableSession_().then(session => {
        if (session.type === READONLY) {
          return self.createTransaction_(session);
        }
        return session;
      });
    }
  }
  return self.acquireQueue_.add(() => self.writePool.acquire());
};

/**
 * Releases a session back into the pool.
 *
 * @param {Session} session The session object.
 */
SessionPool.prototype.release = function(session) {
  const self = this;
  if (session.type !== READWRITE) {
    return self.readPool.release(session);
  }
  return self
    .createTransaction_(session)
    .then(() => self.writePool.release(session))
    .catch(() => self.writePool.destroy(session));
};

/**
 * Creates a transaction for a session.
 *
 * @private
 *
 * @param {Session} session The session object.
 * @param {object} options The transaction options.
 * @returns {Promise<Transaction>}
 */
SessionPool.prototype.createTransaction_ = function(session, options) {
  const self = this;
  const transaction = session.transaction(options);
  const end = transaction.end.bind(transaction);

  transaction.end = function(callback) {
    self.release(session);
    return end(callback);
  };

  return transaction.begin().then(function() {
    session.txn = transaction;
    return transaction;
  });
};

/**
 * Attemps to create a write session
 *
 *
 * @return {Promise<Session>}
 */
SessionPool.prototype.createWriteSession = function() {
  const self = this;
  return self.requestQueue_.add(() => {
    const session = self.session_();

    return session
      .create()
      .then(function() {
        session.type = READWRITE;
        return self.createTransaction_(session);
      })
      .then(() => session)
      .catch(err => {
        self.destroySession(session);
        throw err;
      });
  });
};

/**
 * Attemps to create a read session
 *
 *
 * @return {Promise<Session>}
 */
SessionPool.prototype.createReadSession = function() {
  const self = this;
  return self.requestQueue_.add(() => {
    const session = self.session_();
    return session
      .create()
      .then(() => {
        session.type = READONLY;
        return session;
      })
      .catch(err => {
        self.destroySession(session);
        throw err;
      });
  });
};

/**
 * Creates a session object.
 *
 * @private
 *
 * @returns {Session}
 */
SessionPool.prototype.session_ = function() {
  const session = this.database.session_();
  session.lastUsed = Date.now();
  return session;
};

/**
 * Make an API request, first assuring an active session is used.
 *
 * @param {object} config
 * @param {function} callback
 */
SessionPool.prototype.request = function(config, callback) {
  const self = this;

  this.getReadSession().then(function(session) {
    config.reqOpts.session = session.formattedName_;

    self.request_(config, function() {
      self.release(session);
      callback.apply(null, arguments);
    });
  }, callback);
};

/**
 * This method will give you stats for the read and write sessions
 * @returns {Object} stats
 */
SessionPool.prototype.getStats = function() {
  const readPool = this.readPool;
  const writePool = this.writePool;
  const stats = {
    readPool: {
      spareResourceCapacity: readPool.spareResourceCapacity,
      size: readPool.size,
      available: readPool.available,
      borrowed: readPool.borrowed,
      pending: readPool.pending,
      max: readPool.max,
      min: readPool.min,
    },
    writePool: {
      spareResourceCapacity: writePool.spareResourceCapacity,
      size: writePool.size,
      available: writePool.available,
      borrowed: writePool.borrowed,
      pending: writePool.pending,
      max: writePool.max,
      min: writePool.min,
    },
  };
  return stats;
};

/**
 * Attempts to delete a session
 *
 *
 * @param {Session} session The session to delete.
 * @returns {Promise}
 */
SessionPool.prototype.destroySession = function(session) {
  return this.requestQueue_.add(() => session.delete());
};

/**
 * Send a keep alive request on the session
 *
 * @returns {Promise}
 */
SessionPool.prototype.sendKeepAlive_ = function(session) {
  if (!session) {
    return Promise.resolve();
  }
  const self = this;
  return self.requestQueue_.add(() => {
    return session
      .keepAlive()
      .then(() => self.release(session))
      .catch(() => {
        if (session.type === READWRITE) {
          return self.writePool.destroy(session);
        }
        return self.readPool.destroy(session);
      });
  });
};

/**
 * Pings read and write sessions pool to maintain the min sessions.
 *
 */
SessionPool.prototype.pingSessions_ = function() {
  const self = this;
  const readPool = self.readPool;
  const writePool = self.writePool;

  // Setup next call based on the keepAlive options provided
  self.pingTimeoutHandle = setTimeout(
    () => self.pingSessions_.call(self),
    60000 * self.options.keepAlive
  );
  for (let i = 0; i < readPool.min; i++) {
    self.getReadSession().then(self.sendKeepAlive_.bind(self));
  }
  for (let i = 0; i < writePool.min; i++) {
    self.getWriteSession().then(self.sendKeepAlive_.bind(self));
  }
};

module.exports = SessionPool;
