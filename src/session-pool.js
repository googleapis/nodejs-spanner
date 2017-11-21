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
var delay = require('delay');
var extend = require('extend');
var is = require('is');
var PQueue = require('p-queue');
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
 * @property {number} [writes=0] Pre-allocate transactions for the number of
 *     sessions specified.
 */

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
  var self = this;

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

  if (this.options.min < this.options.writes) {
    this.options.min = this.options.writes;
  }

  this.request_ = database.request;
  this.requestStream_ = database.requestStream;

  this.pendingCreates_ = 0;

  this.reads_ = [];
  this.writes_ = [];
  this.borrowed_ = [];

  this.acquireQueue_ = new PQueue({concurrency: 1});
  this.requestQueue_ = new PQueue({concurrency: this.options.concurrency});

  this.evictHandle_ = null;
  this.pingHandle_ = null;

  EventEmitter.call(this);

  this.onClose_ = new Promise(function(resolve) {
    self.once('close', resolve);
  });
}

util.inherits(SessionPool, EventEmitter);

/**
 * Closes and the pool.
 *
 * @emits SessionPool#close
 * @param {function} [callback] A callback function.
 * @returns {Promise}
 */
SessionPool.prototype.close = function(callback) {
  var self = this;
  var sessions = this.reads_.concat(this.writes_, this.borrowed_);

  this.isOpen = false;
  this.reads_.length = this.writes_.length = this.borrowed_.length = 0;
  this.emit('close');

  var promise = Promise.all(
    sessions.map(function(session) {
      return self.destroySession_(session);
    })
  );

  if (!is.fn(callback)) {
    return promise;
  }

  promise.then(function() {
    callback(null);
  }, callback);
};

/**
 * @callback GetSessionCallback
 * @param {?Error} err Request error, if any.
 * @param {Session} session The session object.
 */
/**
 * Retrieve a read session.
 *
 * @param {GetSessionCallback} [callback] Callback function.
 * @returns {Promise<Session>}
 */
SessionPool.prototype.getSession = function(callback) {
  var promise = this.borrowSession_(READONLY);

  if (!is.fn(callback)) {
    return promise;
  }

  promise.then(function(session) {
    callback(null, session);
  }, callback);
};

/**
 * @callback GetWriteSessionCallback
 * @param {?Error} err Request error, if any.
 * @param {Session} session The session object.
 * @param {Transaction} transaction The transaction object.
 */
/**
 * Retrieve the write session.
 *
 * @param {GetWriteSessionCallback} [callback] Callback function.
 * @returns {Promise<Session>}
 */
SessionPool.prototype.getWriteSession = function(callback) {
  var promise = this.borrowSession_(READWRITE);

  if (!is.fn(callback)) {
    return promise;
  }

  promise.then(function(session) {
    callback(null, session, session.txn);
  }, callback);
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
 * @param {function} [callback] The callback function.
 * @return {Promise}
 */
SessionPool.prototype.open = function(callback) {
  this.isOpen = true;
  this.listenForEvents_();
  this.emit('open');

  var neededReadWrite = this.options.writes;
  var neededReadOnly = this.options.min - neededReadWrite;

  var requests = [];
  var i;

  for (i = 0; i < neededReadWrite; i++) {
    requests.push(this.createSessionInBackground_(READWRITE));
  }

  for (i = 0; i < neededReadOnly; i++) {
    requests.push(this.createSessionInBackground_(READONLY));
  }

  var promise = Promise.all(requests);

  if (!is.fn(callback)) {
    return promise;
  }

  promise.then(function() {
    callback(null);
  }, callback);
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
  var index = this.borrowed_.indexOf(session);

  if (index === -1) {
    throw new Error('Unable to release unknown session.');
  }

  if (session.type !== READWRITE) {
    release();
    return;
  }

  this.prepareTransaction_(session).then(release, function(err) {
    self.emit('error', err);
  });

  function release() {
    self.borrowed_.splice(index, 1);
    self.makeSessionAvailable_(session);
    self.emit('available');
  }
};

/**
 * Make an API request, first assuring an active session is used.
 *
 * @param {object} config
 * @param {function} callback
 */
SessionPool.prototype.request = function(config, callback) {
  var self = this;

  this.getSession(function(err, session) {
    if (err) {
      callback(err);
      return;
    }

    config.reqOpts.session = session.formattedName_;

    self.request_(config, function() {
      self.release(session);
      callback.apply(null, arguments);
    });
  });
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

  function releaseSession() {
    if (session) {
      self.release(session);
      session = null;
    }
  }

  waitForSessionStream.on('reading', function() {
    self.getSession(function(err, session_) {
      if (err) {
        waitForSessionStream.destroy(err);
        return;
      }

      session = session_;
      config.reqOpts.session = session_.formattedName_;

      requestStream = self.requestStream_(config);

      requestStream
        .on('error', releaseSession)
        .on('error', function(err) {
          waitForSessionStream.destroy(err);
        })
        .on('end', releaseSession)
        .pipe(waitForSessionStream);
    });
  });

  return waitForSessionStream;
};

/**
 * Creates a half initialized Session object.
 *
 * @param {string} type The session type.
 * @returns {Session}
 */
SessionPool.prototype.session = function(type) {
  var self = this;
  var session = this.database.session_();

  session.type = type;
  session.lastUsed = Date.now();

  if (type === READWRITE) {
    var create = session.create;
    session.create = function() {
      return create.call(session).then(function() {
        return self.prepareTransaction_(session);
      });
    };
  }

  return session;
};

/**
 * Returns the current size of the pool.
 *
 * @returns {number}
 */
SessionPool.prototype.size = function() {
  return this.reads_.length + this.writes_.length + this.borrowed_.length;
};

/**
 * Attempts to borrow a session from the pool.
 *
 * @private
 *
 * @param {string} type The desired type to borrow.
 * @returns {Promise<Session>}
 */
SessionPool.prototype.borrowSession_ = function(type) {
  var self = this;

  return this.getSession_(type).then(function(session) {
    session.lastUsed = Date.now();

    self.makeSessionUnavailable_(session);
    self.borrowed_.push(session);

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
  var session = this.session(type);

  this.pendingCreates_ += 1;

  return this.requestQueue_
    .add(function() {
      return session.create();
    })
    .then(
      function() {
        self.makeSessionAvailable_(session);
        self.pendingCreates_ -= 1;
        return session;
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

  this.makeSessionUnavailable_(session);
  this.emit('destroy');

  if (this.isOpen && this.size() < this.options.min) {
    this.createSessionInBackground_(session.type);
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

  while (count-- > maxIdle && size - evicted.length >= min) {
    evicted.push(idle.pop());
  }

  var requests = evicted.map(function(session) {
    return self.destroySession_(session);
  });

  return Promise.all(requests);
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

  if (type === READONLY && this.reads_.length) {
    return Promise.resolve(this.reads_.shift());
  }

  if (this.writes_.length) {
    return Promise.resolve(this.writes_.shift());
  }

  if (type === READWRITE && this.reads_.length) {
    var session = this.reads_.shift();

    return this.race_(function() {
      return self.prepareTransaction_(session);
    }).then(function() {
      return session;
    });
  }

  if (this.options.fail) {
    return Promise.reject(new Error('No resources available.'));
  }

  if (!this.isFull()) {
    return this.race_(function() {
      return self.createSession_(type);
    });
  }

  return this.race_(function() {
    return self.onAvailable_();
  }).then(function() {
    return self.getSession_(type);
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
 * Listens for coming and going sessions and starts and stops cleanup tasks.
 *
 * @private
 */
SessionPool.prototype.listenForEvents_ = function() {
  var self = this;

  var keepAliveInterval = this.options.keepAlive * 60000;
  var evictInterval = this.options.idlesAfter * 60000;

  this.once('available', startIntervals);

  this.once('close', function() {
    killIntervals();

    self.removeListener('available', startIntervals);
    self.removeListener('destroy', onDestroy);
  });

  function startIntervals() {
    self.on('destroy', onDestroy);

    self.pingHandle_ = setInterval(function() {
      self.pingIdleSessions_();
    }, keepAliveInterval);

    self.evictHandle_ = setInterval(function() {
      self.evictIdleSessions_();
    }, evictInterval);
  }

  function onDestroy() {
    if (!self.reads_.length && !self.writes_.length) {
      killIntervals();

      self.removeListener('destroy', onDestroy);
      self.once('available', startIntervals);
    }
  }

  function killIntervals() {
    clearInterval(self.pingHandle_);
    clearInterval(self.evictHandle_);
  }
};

/**
 * Makes a Session available to be acquired.
 *
 * @private
 *
 * @param {Session} session The session to make available.
 */
SessionPool.prototype.makeSessionAvailable_ = function(session) {
  this.getSessionGroup_(session).unshift(session);
};

/**
 * Makes a session unavailable.
 *
 * @private
 *
 * @param {Session} session The session to make unavailable.
 */
SessionPool.prototype.makeSessionUnavailable_ = function(session) {
  var group = this.getSessionGroup_(session);
  var index = group.indexOf(session);

  group.splice(index, 1);
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
  var requests = sessions.map(function(session) {
    return self.requestQueue_
      .add(function() {
        return session.keepAlive();
      })
      .catch(function(err) {
        self.destroySession_(session);
        self.emit('error', err);
      });
  });

  return Promise.all(requests);
};

/**
 * Prepares a transaction.
 *
 * @private
 *
 * @param {Session} session The session to prepare the transaction for.
 * @param {TransactionOptions} [options] The transaction options.
 * @returns {Promise<Transaction>}
 */
SessionPool.prototype.prepareTransaction_ = function(session, options) {
  var self = this;

  var transaction = session.transaction(options);
  var end = transaction.end;

  transaction.end = function(callback) {
    self.release(session);
    return end.call(transaction, callback);
  };

  return transaction.begin().then(
    function() {
      session.txn = transaction;
      return transaction;
    },
    function(err) {
      transaction.end();
      self.destroySession_(session);
      throw err;
    }
  );
};

/**
 * Races a function against the pool being closed and optionally a timeout
 * specified through the acquireTimeout option.
 *
 * @private
 *
 * @returns {Promise}
 */
SessionPool.prototype.race_ = function(fn) {
  var acquireTimeout = this.options.acquireTimeout;
  var promises = [
    this.onClose_.then(function() {
      throw new Error('Database is closed.');
    }),
    this.acquireQueue_.add(fn),
  ];

  if (!is.infinite(acquireTimeout)) {
    promises.push(
      delay.reject(acquireTimeout, new Error('Timed out acquiring session.'))
    );
  }

  return Promise.race(promises);
};

module.exports = SessionPool;
