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

var EventEmitter = require('events').EventEmitter;
var arrify = require('arrify');
var delay = require('delay');
var extend = require('extend');
var is = require('is');
var PQueue = require('p-queue');
var stackTrace = require('stack-trace');
var streamEvents = require('stream-events');
var through = require('through2');
var util = require('util');

var DEFAULTS = {
  acquireTimeout: Infinity,
  concurrency: 10,
  fail: false,
  idlesAfter: 10,
  keepAlive: 50,
  max: 100,
  maxIdle: 1,
  min: 0,
  writes: 0,
};

var READONLY = 'readonly';
var READWRITE = 'readwrite';

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
 * @property {number} [writes=0] Percentage of session to be pre-allocated as
 *     write sessions.

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

  this.reads_ = [];
  this.writes_ = [];
  this.borrowed_ = [];

  this.pendingCreates_ = 0;
  this.acquireQueue_ = new PQueue({concurrency: 1});
  this.requestQueue_ = new PQueue({concurrency: this.options.concurrency});

  this.evictHandle_ = null;
  this.pingHandle_ = null;

  this.traces_ = new Map();

  EventEmitter.call(this);
}

util.inherits(SessionPool, EventEmitter);

/**
 * Formats stack trace objects into Node-like stack trace.
 *
 * @private
 *
 * @param {object[]} trace The trace object.
 * @return {string}
 */
SessionPool.formatTrace_ = function(trace) {
  var formatted = trace.slice(2).map(function(t) {
    return `    at ${t.getFunctionName() ||
      t.getMethodName()} (${t.getFileName()}:${t.getLineNumber()}:${t.getColumnNumber()})`;
  });

  return `Session leak detected!\n${formatted.join('\n')}`;
};

/**
 * Returns the number of available sessions.
 *
 * @return {number}
 */
SessionPool.prototype.available = function() {
  return this.reads_.length + this.writes_.length;
};

/**
 * Returns the number of borrowed sessions.
 *
 * @return {number}
 */
SessionPool.prototype.borrowed = function() {
  return this.borrowed_.length;
};

/**
 * Closes and the pool.
 *
 * @emits SessionPool#close
 * @returns {Promise}
 */
SessionPool.prototype.close = function() {
  var self = this;
  var sessions = this.reads_.concat(this.writes_, this.borrowed_);

  this.isOpen = false;

  this.reads_ = [];
  this.writes_ = [];
  this.borrowed_ = [];

  this.stopHouseKeeping_();

  this.emit('empty');
  this.emit('close');

  return Promise.all(
    sessions.map(function(session) {
      return self.destroySession_(session);
    })
  );
};

/**
 * Fills the pool with the minimum number of sessions.
 *
 * @return {Promise}
 */
SessionPool.prototype.fill = function() {
  var requests = [];
  var i;

  var minReadWrite = Math.floor(this.options.min * this.options.writes);
  var neededReadWrite = Math.max(minReadWrite - this.writes_.length, 0);

  for (i = 0; i < neededReadWrite; i++) {
    requests.push(this.createSessionInBackground_(READWRITE));
  }

  var minReadOnly = Math.ceil(this.options.min - minReadWrite);
  var neededReadOnly = Math.max(minReadOnly - this.reads_.length, 0);

  for (i = 0; i < neededReadOnly; i++) {
    requests.push(this.createSessionInBackground_(READONLY));
  }

  return Promise.all(requests);
};

/**
 * Returns stack traces for sessions that have not been released.
 *
 * @return {string[]}
 */
SessionPool.prototype.getLeaks = function() {
  return Array.from(this.traces_.values()).map(SessionPool.formatTrace_);
};

/**
 * Retrieve a read session.
 *
 * @returns {Promise<Session>}
 */
SessionPool.prototype.getSession = function() {
  return this.acquireSession_(READONLY);
};

/**
 * Retrieve the write session.
 *
 * @returns {Promise<Session>}
 */
SessionPool.prototype.getWriteSession = function() {
  return this.acquireSession_(READWRITE);
};

/**
 * Checks to see if the pool is full by calculating the current size and the
 * pending number of sessions being created.
 *
 * @return {boolean}
 */
SessionPool.prototype.isFull = function() {
  return this.size() + this.pendingCreates_ === this.options.max;
};

/**
 * Opens the pool, filling it to the configured number of read and write
 * sessions.
 *
 * @emits SessionPool#open
 * @return {Promise}
 */
SessionPool.prototype.open = function() {
  var self = this;

  this.isOpen = true;
  this.onClose_ = new Promise(function(resolve) {
    self.once('close', resolve);
  });

  this.startHouseKeeping_();
  this.emit('open');

  return this.fill();
};

/**
 * Releases session back into the pool. If the session is a write session it
 * will also prepare a new transaction before releasing it.
 *
 * @throws {Error} For unknown sessions.
 * @emits SessionPool#available
 * @emits SessionPool#error
 * @param {Session} session The session to release.
 */
SessionPool.prototype.release = function(session) {
  var self = this;

  if (this.borrowed_.indexOf(session) === -1) {
    throw new Error('Unable to release unknown session.');
  }

  this.traces_.delete(session.id);

  if (session.type !== READWRITE) {
    this.release_(session);
    return;
  }

  this.createTransaction_(session)
    .catch(function() {
      session.type = READONLY;
    })
    .then(function() {
      self.release_(session);
    });
};

/**
 * Make an API request, first assuring an active session is used.
 *
 * @param {object} config
 * @param {function} callback
 */
SessionPool.prototype.request = function(config, callback) {
  var self = this;

  this.getSession().then(function(session) {
    config.reqOpts.session = session.formattedName_;

    self.request_(config, function() {
      self.release(session);
      callback.apply(null, arguments);
    });
  }, callback);
};

/**
 * Make an API request as a stream, first assuring an active session is used.
 *
 * @param {object} config
 * @returns {Stream}
 */
SessionPool.prototype.requestStream = function(config) {
  var self = this;

  var requestStream;
  var session;

  var waitForSessionStream = streamEvents(through.obj());
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
    self.getSession().then(function(session_) {
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
 * Returns the current size of the pool.
 *
 * @returns {number}
 */
SessionPool.prototype.size = function() {
  return this.available() + this.borrowed();
};

/**
 * Attempts to borrow a session from the pool.
 *
 * @private
 *
 * @param {string} type The desired type to borrow.
 * @returns {Promise<Session>}
 */
SessionPool.prototype.acquireSession_ = function(type) {
  var self = this;

  if (!this.isOpen) {
    return Promise.reject(new Error('Database is closed.'));
  }

  var trace = stackTrace.get();

  return this.getSession_(type).then(function(session) {
    session.lastUsed = Date.now();

    self.borrowSession_(session);
    self.traces_.set(session.id, trace);

    if (!self.available()) {
      self.emit('empty');
    }

    return session;
  });
};

/**
 * Moves a session into the borrowed group.
 *
 * @private
 *
 * @param {Session} session The session object.
 */
SessionPool.prototype.borrowSession_ = function(session) {
  this.spliceSession_(session);
  this.borrowed_.push(session);
};

/**
 * Creates a read session.
 *
 * @private
 *
 * @return {Promise<Session>}
 */
SessionPool.prototype.createReadSession_ = function() {
  var session = this.session_();

  return session.create().then(function() {
    session.type = READONLY;
    return session;
  });
};

/**
 * Attemps to create a write session - may return a read session.
 *
 * @private
 *
 * @return {Promise<Session>}
 */
SessionPool.prototype.createWriteSession_ = function() {
  var self = this;
  var session = this.session_();

  return session
    .create()
    .then(function() {
      session.type = READWRITE;

      return self.createTransaction_(session).catch(function() {
        session.type = READONLY;
      });
    })
    .then(function() {
      return session;
    });
};

/**
 * Attempts to create a session of a certain type.
 *
 * @private
 *
 * @param {string} type The desired type to create.
 * @returns {Promise<Session>}
 */
SessionPool.prototype.createSession_ = function(type) {
  var self = this;

  this.pendingCreates_ += 1;

  return this.requestQueue_
    .add(function() {
      if (type === READWRITE) {
        return self.createWriteSession_();
      }

      return self.createReadSession_();
    })
    .then(
      function(session) {
        self.getSessionGroup_(session).push(session);
        self.pendingCreates_ -= 1;
      },
      function(err) {
        self.pendingCreates_ -= 1;
        throw err;
      }
    );
};

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
SessionPool.prototype.createSessionInBackground_ = function(type) {
  var self = this;

  return this.createSession_(type).then(
    function() {
      self.emit('available');
    },
    function(err) {
      self.emit('error', err);
    }
  );
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
  var self = this;
  var transaction = session.transaction(options);
  var end = transaction.end.bind(transaction);

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
 * Attempts to delete a session, optionally creating a new one of the same type
 * if the pool is still open and we're under the configured min value.
 *
 * @private
 *
 * @fires SessionPool#destroy
 * @fires SessoinPool#error
 * @param {Session} session The session to delete.
 * @returns {Promise}
 */
SessionPool.prototype.destroySession_ = function(session) {
  var self = this;

  this.spliceSession_(session);

  if (!this.available()) {
    this.emit('empty');
  }

  if (this.isOpen && this.needsFill_()) {
    this.fill();
  }

  return this.requestQueue_
    .add(function() {
      return session.delete();
    })
    .catch(function(err) {
      self.emit('error', err);
    });
};

/**
 * Deletes idle sessions that exceed the maxIdle configuration.
 *
 * @private
 *
 * @returns {Promise}
 */
SessionPool.prototype.evictIdleSessions_ = function() {
  var self = this;
  var evicted = [];

  var maxIdle = this.options.maxIdle;
  var min = this.options.min;
  var size = this.size();

  var idle = this.getIdleSessions_();
  var count = idle.length;

  while (count-- > maxIdle && size - evicted.length > min) {
    evicted.push(idle.pop());
  }

  return Promise.all(
    evicted.map(function(session) {
      return self.destroySession_(session);
    })
  );
};

/**
 * Retrieves a list of all the idle sessions.
 *
 * @private
 *
 * @returns {Session[]}
 */
SessionPool.prototype.getIdleSessions_ = function() {
  var idlesAfter = this.options.idlesAfter * 60000;
  var sessions = this.reads_.concat(this.writes_);

  return sessions.filter(function(session) {
    return Date.now() - session.lastUsed >= idlesAfter;
  });
};

/**
 *
 */
SessionPool.prototype.getNextAvailableSession_ = function(type) {
  var self = this;

  if (type === READONLY && this.reads_.length) {
    return Promise.resolve(this.reads_.shift());
  }

  if (this.writes_.length) {
    return Promise.resolve(this.writes_.shift());
  }

  var session = this.reads_.shift();

  return this.race_(self.createTransaction_(session))
    .then(function() {
      return session;
    })
    .catch(function(err) {
      self.release_(session);
      throw err;
    });
};

/**
 * Attempts to get a session of a specific type. If the type is unavailable it
 * may try to use a different type.
 *
 * @private
 *
 * @param {string} type The desired session type.
 * @returns {Promise<Session>}
 */
SessionPool.prototype.getSession_ = function(type) {
  var self = this;

  var available = this.available();
  var acquires = this.acquireQueue_.size;

  if (available && !acquires) {
    return this.getNextAvailableSession_(type);
  }

  if (this.options.fail) {
    return Promise.reject(new Error('No resources available.'));
  }

  var promises = [self.waitForNextAvailable_()];

  if (!this.isFull() && available + this.pendingCreates_ < acquires + 1) {
    var createPromise = new Promise(function(resolve, reject) {
      self.createSession_(type).then(function() {
        self.emit('available');
      }, reject);
    });

    promises.push(createPromise);
  }

  return this.race_(promises).then(function() {
    return self.getNextAvailableSession_(type);
  });
};

/**
 * Get the corresponding session group.
 *
 * @private
 *
 * @param {Session} session The session to get the group for.
 * @returns {Session[]}
 */
SessionPool.prototype.getSessionGroup_ = function(session) {
  return session.type === READWRITE ? this.writes_ : this.reads_;
};

/**
 * Indicates whether or not the pool needs to be filled.
 *
 * @private
 *
 * @return {boolean}
 */
SessionPool.prototype.needsFill_ = function() {
  return this.pendingCreates_ + this.size() < this.options.min;
};

/**
 * Creates a promise that will settle once a Session becomes available.
 *
 * @private
 *
 * @returns {Promise}
 */
SessionPool.prototype.onAvailable_ = function() {
  var self = this;

  if (this.available() > 0) {
    return Promise.resolve();
  }

  return new Promise(function(resolve) {
    self.once('available', resolve);
  });
};

/**
 * Makes a keep alive request to all the idle sessions.
 *
 * @private
 *
 * @fires SessionPool#error
 * @returns {Promise}
 */
SessionPool.prototype.pingIdleSessions_ = function() {
  var self = this;
  var sessions = this.getIdleSessions_();

  return Promise.all(
    sessions.map(function(session) {
      return self.pingSession_(session);
    })
  ).then(function() {
    if (self.needsFill_()) {
      self.fill();
    }
  });
};

/**
 * Pings an individual session.
 *
 * @private
 *
 * @returns {Promise}
 */
SessionPool.prototype.pingSession_ = function(session) {
  var self = this;

  this.borrowSession_(session);

  return this.requestQueue_
    .add(function() {
      return session
        .keepAlive()
        .catch(function(err) {
          self.emit('error', err);

          if (err.code === 404) {
            throw err;
          }
        })
        .then(function() {
          self.release(session);
        });
    })
    .catch(function() {
      var index = self.borrowed_.indexOf(session);
      self.borrowed_.splice(index, 1);
    });
};

/**
 * Races a function against the pool being closed and optionally a timeout
 * specified through the acquireTimeout option.
 *
 * @private
 *
 * @param {Promise[]} promises The promises to race.
 * @returns {Promise}
 */
SessionPool.prototype.race_ = function(promises) {
  var timeout = this.options.acquireTimeout;

  promises = arrify(promises);

  promises.push(
    this.onClose_.then(function() {
      throw new Error('Database is closed.');
    })
  );

  if (!is.infinite(timeout)) {
    promises.push(
      delay.reject(timeout, new Error('Timed out acquiring session.'))
    );
  }

  return Promise.race(promises);
};

/**
 * Releases a session back into the pool.
 *
 * @private
 *
 * @fires SessionPool#available
 * @param {Session} session The session object.
 */
SessionPool.prototype.release_ = function(session) {
  var index = this.borrowed_.indexOf(session);

  this.borrowed_.splice(index, 1);
  this.getSessionGroup_(session).unshift(session);

  this.emit('available');
};

/**
 * Creates a session object.
 *
 * @private
 *
 * @returns {Session}
 */
SessionPool.prototype.session_ = function() {
  var session = this.database.session_();
  session.lastUsed = Date.now();
  return session;
};

/**
 * Removes a session from its group.
 *
 * @private
 *
 * @param {Session} session The session to splice.
 */
SessionPool.prototype.spliceSession_ = function(session) {
  var group = this.getSessionGroup_(session);
  var index = group.indexOf(session);

  group.splice(index, 1);
};

/**
 * Starts housekeeping (pinging/evicting) of idle sessions.
 *
 * @private
 */
SessionPool.prototype.startHouseKeeping_ = function() {
  var self = this;
  var keepAliveInterval = this.options.keepAlive * 60000;
  var evictInterval = this.options.idlesAfter * 60000;

  this.once('available', onavailable);
  this.once('close', onclose);

  function onempty() {
    self.once('available', onavailable);
    self.stopHouseKeeping_();
  }

  function onavailable() {
    self.pingHandle_ = setInterval(function() {
      self.pingIdleSessions_();
    }, keepAliveInterval);

    self.evictHandle_ = setInterval(function() {
      self.evictIdleSessions_();
    }, evictInterval);

    self.pingHandle_.unref();
    self.evictHandle_.unref();

    self.once('empty', onempty);
  }

  function onclose() {
    self.removeListener('available', onavailable);
    self.removeListener('empty', onempty);
  }
};

/**
 * Stops housekeeping.
 *
 * @private
 */
SessionPool.prototype.stopHouseKeeping_ = function() {
  clearInterval(this.pingHandle_);
  clearInterval(this.evictHandle_);
};

/**
 *
 */
SessionPool.prototype.waitForNextAvailable_ = function() {
  var self = this;

  return this.acquireQueue_.add(function() {
    return self.onAvailable_();
  });
};

module.exports = SessionPool;
