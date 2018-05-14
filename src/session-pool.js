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
  acquireTimeout: 0,
  concurrency: 10,
  maxWait: 50,
  idlesAfter: 10,
  keepAlive: 50,
  maxReads: 100,
  maxWrites: 100,
  minReads: 0,
  minWrites: 0,
};

const READONLY = 'readonly';
const READWRITE = 'readwrite';

/**
 * Session pool configuration options.
 *
 * @typedef {object} SessionPoolOptions
 * @property {number} [acquireTimeout=0] Time in milliseconds before
 *     giving up trying to acquire a session. If the specified value is
 *     `0`, a timeout will not occur. A non-zero positive integer
 * @property {number} [concurrency=10] How many concurrent requests the pool is
 *     allowed to make.
 * @property {number} [maxWait=50] This property specifies how many acquire sessions call are allowed
 *     to wait before returning an error. Default is 50
 * @property {number} [idlesAfter=10] How long until a resource becomes idle, in
 *     minutes.
 * @property {number} [maxReads=100] Maximum number of write sessions to create at any
 *     given time.
 * @property {number} [maxWrites=100] Maximum number of read sessions to create at any
 *     given time.
 * @property {number} [minReads=0] Minimum number of read sessions to create at any
 *     given time.
 * @property {number} [minWrites=0] Minimum number of write sessions to keep in the pool at
 *     any given time.
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

  this.readPool = Pool.createPool(
    {
      create: this.createReadSession.bind(this),
      destroy: this.destroySession.bind(this),
    },
    {
      max: this.options.maxReads,
      min: this.options.minReads,
      acquireTimeoutMillis: this.options.acquireTimeout,
      autostart: false,
      maxWaitingClients: this.options.maxWait,
      idleTimeoutMillis: this.options.idlesAfter * 60000,
    }
  );

  this.writePool = Pool.createPool(
    {
      create: this.createWriteSession.bind(this),
      destroy: this.destroySession.bind(this),
    },
    {
      max: this.options.maxWrites,
      min: this.options.minWrites,
      acquireTimeoutMillis: this.options.acquireTimeout,
      autostart: false,
      maxWaitingClients: this.options.maxWait,
      idleTimeoutMillis: this.options.idlesAfter * 60000,
    }
  );
}

/**
 * Opens the pool, filling it to the configured number of read and write
 * sessions.
 *
 * @return {Promise}
 */
SessionPool.prototype.open = function() {
  // Start the pinging of sessions
  this.pingSessions_();
  this.isOpen = true;
  // Start both pools creation & internal processes
  this.readPool.start();
  this.writePool.start();
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
 * Returns a read session
 *
 * @returns {Promise}
 */
SessionPool.prototype.getReadSession = function() {
  const self = this;

  if (!self.isOpen) {
    return Promise.reject(new Error('Database is closed.'));
  }
  return self.requestQueue_.add(() => self.readPool.acquire());
};

/**
 * Returns a write session
 *
 * @returns {Promise}
 */
SessionPool.prototype.getWriteSession = function() {
  const self = this;

  if (!self.isOpen) {
    return Promise.reject(new Error('Database is closed.'));
  }
  return self.requestQueue_.add(() => self.writePool.acquire());
};

/**
 * Releases a session back into the pool.
 *
 * @param {Session} session The session object.
 */
SessionPool.prototype.release = function(session) {
  const self = this;

  return self.requestQueue_.add(() => {
    if (session.type !== READWRITE) {
      return self.readPool.release(session);
    }

    return self
      .createTransaction_(session)
      .then(() => self.writePool.release(session))
      .catch(() => self.writePool.destroy(session));
  });
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
  session.created = Date.now();
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
SessionPool.prototype.sendKeepAlive = function(session) {
  if (!session) {
    return Promise.resolve();
  }
  const self = this;
  return self.requestQueue_.add(() =>
    session
      .keepAlive()
      .then(() => self.release(session))
      .catch(() => {
        if (session.type === READWRITE) {
          return self.writePool.destroy(session);
        }
        return self.readPool.destroy(session);
      })
  );
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

  /*
    if the readPool or writePool size is less than min values, then no need to send the keep alive message
    as the pool is not yet ready
  */
  if (readPool.size >= readPool.min) {
    for (let i = 0; i < readPool.min; i++) {
      self.getReadSession().then(self.sendKeepAlive.bind(self));
    }
  }
  if (writePool.size >= writePool.min) {
    for (let i = 0; i < writePool.min; i++) {
      self.getWriteSession().then(self.sendKeepAlive.bind(self));
    }
  }
};

module.exports = SessionPool;
