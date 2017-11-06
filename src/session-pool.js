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

var extend = require('extend');
var is = require('is');
var Pool = require('pewl');
var streamEvents = require('stream-events');
var through = require('through2');

var DEFAULTS = {
  acquireTimeout: Infinity,
  concurrency: 10,
  idleAfter: 10 * 60000,
  keepAlive: 55,
  max: 100,
  maxIdle: 0,
  min: 0
};

/**
 * Session pool configuration options.
 *
 * @typedef {object} SessionPoolOptions
 * @property {number} [acquireTimeout=0] Time in milliseconds before giving up
 *     trying to acquire a session. If the specified value is `0`, a timeout
 *     will not occur.
 * @property {boolean} [fail=false] If set to true, an error will be thrown when
 *     there are no available sessions for a request.
 * @property {number} [max=100] Maximum number of resources to create at any
 *     given time.
 * @property {number} [maxIdle=1] Maximum number of idle resources to keep in
 *     the pool at any given time.
 * @property {number} [min=0] Minimum number of resources to keep in the pool at
 *     any given time.
 * @property {number} [keepAlive=59] How often to ping idle sessions, in
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

  this.request_ = database.request;
  this.requestStream_ = database.requestStream;

  options = extend({}, DEFAULTS, options);

  if (options.fail) {
    options.acquireTimeout = 0;
  }

  this.cluster_ = new Pool.Cluster({
    acquireTimeout: options.acquireTimeout,
    concurrency: options.concurrency,
    idleAfter: options.idleAfter,
    skimInterval: options.idleAfter,
    pingInterval: options.keepAlive * 60000,
    ping: function(session) {
      return session.keepAlive();
    }
  });

  this.createPools_(options);
  this.cluster_.open();
}

/**
 * Destroys all sessions within the pool.
 *
 * @returns {Promise}
 */
SessionPool.prototype.clear = function() {
  return this.cluster_.close();
};

/**
 * @callback GetSessionCallback
 * @param {?Error} err Request error, if any.
 * @param {Session} session The session object.
 */
/**
 * Retrieve a read session.
 *
 * @param {GetSessionCallback} callback Callback function.
 */
SessionPool.prototype.getSession = function(callback) {
  this.cluster_.acquire().then(
    function(session) {
      callback(null, session);
    },
    callback
  );
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
 * @param {GetWriteSessionCallback} callback Callback function.
 */
SessionPool.prototype.getWriteSession = function(callback) {
  var self = this;
  var stats = this.cluster_.stats(['write']);

  if (stats.available > 0) {
    this.cluster_.acquire({ attributes: ['write'] })
      .then(passback, callback)
    return;
  }

  this.cluster_.acquire()
    .then(function(session) {
      if (session.isWriteSession) {
        return session;
      }

      return self.createTransaction_(session).then(function() {
        return session;
      });
    })
    .then(passback, callback);

  function passback(session) {
    callback(null, session, session.transaction_);
  }
};

/**
 * Release a session back into the pool.
 *
 * @param {Session} session The session to be released.
 * @returns {Promise}
 */
SessionPool.prototype.release = function(session) {
  if (!session.isWriteSession) {
    this.cluster_.release(session);
    return;
  }

  var self = this;

  this.createTransaction_(session).then(
    function() {
      self.cluster_.release(session);
    },
    function() {
      self.cluster_.destroy(session);
    }
  );
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
 * Create a session.
 *
 * @private
 *
 * @returns {Promise} - Resolves to {Session}.
 */
SessionPool.prototype.createSession_ = function() {
  var session = this.database.session_();

  return session.create().then(function() {
    return session;
  });
};

/**
 * Creates the necessary pools and adds them to the cluster.
 *
 * @private
 */
SessionPool.prototype.createPools_ = function(options) {
  var self = this;

  var pool = new Pool({
    min: options.min,
    max: options.max ,
    maxIdle: options.maxIdle,
    create: function() {
      return self.createSession_();
    },
    destroy: function(session) {
      return session.delete();
    }
  });

  this.cluster_.add(pool);

  if (!options.writes) {
    return;
  }

  pool
    .set('max', options.max - options.writes)
    .set('min', Math.floor(options.min / 2))
    .set('maxIdle', Math.floor(options.maxIdle / 2));

  var writePool = new Pool({
    attributes: ['write'],
    max: options.writes,
    min: Math.ceil(options.min / 2),
    maxIdle: Math.ceil(options.maxIdle, 2),
    create: function() {
      return self.createWriteSession_();
    },
    destroy: function(session) {
      return session.delete();
    }
  });

  this.cluster_.add(writePool);
};

/**
 * Creates a Transaction, stubs a destroy method to return the transaction
 * back into the pool.
 *
 * @private
 *
 * @return {Transaction}
 */
SessionPool.prototype.createTransaction_ = function(session, options) {
  var self = this;

  var transaction = session.transaction(options);
  var end = transaction.end.bind(transaction);

  transaction.end = function(callback) {
    self.release(session);
    end(callback);
  };

  session.transaction_ = transaction;

  return transaction.begin().then(function() {
    return transaction;
  }, function(err) {
    transaction.end();
    return Promise.reject(err);
  });
};

/**
 * Create a session, then begin a new transaction.
 *
 * @private
 *
 * @returns {Promise} - Resolves to {Session}.
 */
SessionPool.prototype.createWriteSession_ = function() {
  var self = this;

  return this.createSession_().then(function(session) {
    session.isWriteSession = true;

    return self.createTransaction_(session).then(function() {
      return session;
    });
  });
};

module.exports = SessionPool;
