/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
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

const assert = require('assert');
const common = require('@google-cloud/common');
const events = require('events');
const extend = require('extend');
const proxyquire = require('proxyquire');
const through = require('through2');
const PQueue = require('p-queue');

var pQueueOverride = null;
function FakePQueue(options) {
  return new (pQueueOverride || PQueue)(options);
}

describe('SessionPool', function() {
  var SessionPool;
  var sessionPool;

  let DATABASE = {
    request: common.util.noop,
    requestStream: common.util.noop,
  };

  before(function() {
    SessionPool = proxyquire('../src/session-pool.js', {
      'p-queue': FakePQueue,
    });
  });

  beforeEach(function() {
    sessionPool = new SessionPool(DATABASE, {minReads: 10, minWrites: 5});
  });

  afterEach(function() {
    pQueueOverride = null;
  });

  describe('instantiation', function() {
    it('should localize the database instance', function() {
      assert.strictEqual(sessionPool.database, DATABASE);
    });

    describe('options', function() {
      it('should apply defaults', function() {
        assert.strictEqual(sessionPool.options.acquireTimeout, 0);
        assert.strictEqual(sessionPool.options.concurrency, 10);
        assert.strictEqual(sessionPool.options.maxWait, 50);
        assert.strictEqual(sessionPool.options.idlesAfter, 10);
        assert.strictEqual(sessionPool.options.keepAlive, 50);
        assert.strictEqual(sessionPool.options.maxReads, 100);
        assert.strictEqual(sessionPool.options.maxWrites, 100);
        assert.strictEqual(sessionPool.options.minReads, 10);
        assert.strictEqual(sessionPool.options.minWrites, 5);
      });

      it('should not override user options', function() {
        sessionPool = new SessionPool(DATABASE, {acquireTimeout: 1});
        assert.strictEqual(sessionPool.options.acquireTimeout, 1);
        assert.strictEqual(
          sessionPool.readPool._config.acquireTimeoutMillis,
          1
        );
        assert.strictEqual(
          sessionPool.writePool._config.acquireTimeoutMillis,
          1
        );
      });
    });

    it('should set isOpen to false', function() {
      assert.strictEqual(sessionPool.isOpen, false);
    });

    it('should localize database request functions', function() {
      assert.strictEqual(sessionPool.request_, DATABASE.request);
      assert.strictEqual(sessionPool.requestStream_, DATABASE.requestStream);
    });

    it('should set read and write pool sizes to 0', function() {
      assert.strictEqual(sessionPool.getStats().readPool.size, 0);
      assert.strictEqual(sessionPool.getStats().writePool.size, 0);
    });

    it('read and write pools should be initialized with the parameters passed in', function() {
      const readPoolOptions = sessionPool.readPool._config;
      const writePoolOptions = sessionPool.writePool._config;
      assert.strictEqual(readPoolOptions.fifo, true);
      assert.strictEqual(readPoolOptions.priorityRange, 1);
      assert.strictEqual(readPoolOptions.testOnBorrow, false);
      assert.strictEqual(readPoolOptions.testOnReturn, false);
      assert.strictEqual(readPoolOptions.autostart, false);
      assert.strictEqual(readPoolOptions.maxWaitingClients, 50);
      assert.strictEqual(readPoolOptions.max, 100);
      assert.strictEqual(readPoolOptions.min, 10);
      assert.strictEqual(readPoolOptions.evictionRunIntervalMillis, 0);
      assert.strictEqual(readPoolOptions.numTestsPerEvictionRun, 3);
      assert.strictEqual(readPoolOptions.softIdleTimeoutMillis, -1);
      assert.strictEqual(readPoolOptions.idleTimeoutMillis, 600000);
      assert.strictEqual(writePoolOptions.fifo, true);
      assert.strictEqual(writePoolOptions.priorityRange, 1);
      assert.strictEqual(writePoolOptions.testOnBorrow, false);
      assert.strictEqual(writePoolOptions.testOnReturn, false);
      assert.strictEqual(writePoolOptions.autostart, false);
      assert.strictEqual(writePoolOptions.maxWaitingClients, 50);
      assert.strictEqual(writePoolOptions.max, 100);
      assert.strictEqual(writePoolOptions.min, 5);
      assert.strictEqual(writePoolOptions.evictionRunIntervalMillis, 0);
      assert.strictEqual(writePoolOptions.numTestsPerEvictionRun, 3);
      assert.strictEqual(writePoolOptions.softIdleTimeoutMillis, -1);
      assert.strictEqual(writePoolOptions.idleTimeoutMillis, 600000);
    });

    it('should create a request queue', function() {
      var poolOptions = {
        concurrency: 11,
      };

      sessionPool = new SessionPool(DATABASE, poolOptions);
      assert.strictEqual(sessionPool.requestQueue_._concurrency, 11);
    });
  });

  describe('session_', function() {
    it('should return a session object', function() {
      var fakeSession = {};

      DATABASE.session_ = function() {
        return fakeSession;
      };

      var session = sessionPool.session_();

      assert.strictEqual(session, fakeSession);
      assert(isAround(session.created, Date.now()));
    });
  });

  describe('createReadSession', function() {
    it('should create a read only session', function() {
      var created = false;

      var fakeSession = {
        create: function() {
          created = true;
          return Promise.resolve();
        },
      };
      sessionPool.session_ = function() {
        return fakeSession;
      };
      return sessionPool.createReadSession().then(function(session) {
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(session.type, 'readonly');
        assert.strictEqual(created, true);
      });
    });

    it('should fail in creating a read only session', function() {
      let deleteCalled = false;
      const fakeSession = {
        create: () => Promise.reject('Error'),
        delete: () => {
          deleteCalled = true;
          return Promise.resolve();
        },
      };

      sessionPool.session_ = function() {
        return fakeSession;
      };

      return sessionPool.createReadSession().catch(error => {
        assert.strictEqual(error, 'Error');
        assert.strictEqual(deleteCalled, true);
      });
    });
  });

  describe('createWriteSession_', function() {
    it('should create a write session', function() {
      const fakeSession = {
        create: () => Promise.resolve(),
      };

      sessionPool.session_ = () => fakeSession;

      sessionPool.createTransaction_ = function(session) {
        assert.strictEqual(session, fakeSession);
        return Promise.resolve();
      };

      return sessionPool.createWriteSession().then(function(session) {
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(session.type, 'readwrite');
      });
    });

    it('should fail in creating a read/write session', function() {
      let deleteCalled = false;
      const fakeSession = {
        create: () => Promise.reject('Error'),
        delete: () => {
          deleteCalled = true;
          return Promise.resolve();
        },
      };

      sessionPool.session_ = function() {
        return fakeSession;
      };

      return sessionPool.createWriteSession().catch(error => {
        assert.strictEqual(error, 'Error');
        assert.strictEqual(deleteCalled, true);
      });
    });
  });

  describe('open', function() {
    it('should set isOpen to true', function() {
      sessionPool.createReadSession = () => Promise.resolve({});
      sessionPool.createWriteSession = () => Promise.resolve({});

      sessionPool.open();
      assert.strictEqual(sessionPool.isOpen, true);
      assert.strictEqual(sessionPool.getStats().readPool.size, 10);
      assert.strictEqual(sessionPool.getStats().writePool.size, 5);
    });
  });

  describe('close', function() {
    it('should destroy all sessions', function() {
      sessionPool.createTransaction_ = () => Promise.resolve();
      sessionPool.session_ = function() {
        return new Object({
          create: Promise.resolve(),
          delete: Promise.resolve(),
        });
      };
      sessionPool.open();
      assert.strictEqual(sessionPool.isOpen, true);
      assert.strictEqual(sessionPool.getStats().readPool.size, 10);
      assert.strictEqual(sessionPool.getStats().writePool.size, 5);
      return sessionPool.close().then(() => {
        setTimeout(() => {
          assert.strictEqual(sessionPool.isOpen, false);
          assert.strictEqual(sessionPool.getStats().readPool.size, 0);
          assert.strictEqual(sessionPool.getStats().writePool.size, 0);
        }, 50);
      });
    });
  });

  describe('getReadSession and getWriteSessio', function() {
    it('should get a read session', function() {
      sessionPool.createTransaction_ = () => Promise.resolve();
      sessionPool.session_ = function() {
        return new Object({
          create: function() {
            return Promise.resolve();
          },
        });
      };
      sessionPool.open();
      return sessionPool.getReadSession().then(function(s) {
        assert.strictEqual(s.type, 'readonly');
      });
    });

    it('should get a write session', function() {
      sessionPool.createTransaction_ = () => Promise.resolve();
      sessionPool.session_ = function() {
        return new Object({
          create: function() {
            return Promise.resolve();
          },
        });
      };
      sessionPool.open();
      return sessionPool.getWriteSession().then(function(s) {
        assert.strictEqual(s.type, 'readwrite');
      });
    });

    it('should not get a read session as database is closed', function() {
      sessionPool.session_ = function() {
        return new Object({
          create: function() {
            return Promise.reject();
          },
        });
      };
      return sessionPool.getReadSession().catch(error => {
        assert.strictEqual(error.message, 'Database is closed.');
      });
    });

    it('should not get a write session as database is closed', function() {
      sessionPool.session_ = function() {
        return new Object({
          create: function() {
            return Promise.reject();
          },
        });
      };
      return sessionPool.getWriteSession().catch(error => {
        assert.strictEqual(error.message, 'Database is closed.');
      });
    });
  });

  describe('release', function() {
    let readSession = null;
    let writeSession = null;
    let tempSession = null;
    before(function() {
      tempSession = sessionPool;
      sessionPool.createTransaction_ = () => Promise.resolve();
      sessionPool.session_ = function() {
        return new Object({
          create: () => Promise.resolve(),
          delete: () => Promise.resolve(),
        });
      };
      sessionPool.open();
      return sessionPool.getReadSession().then(function(rs) {
        readSession = rs;
        return sessionPool.getWriteSession().then(function(ws) {
          writeSession = ws;
        });
      });
    });

    it('verify that a read and write session are borrowed', function() {
      assert.strictEqual(tempSession.getStats().writePool.borrowed, 1);
      assert.strictEqual(tempSession.getStats().readPool.borrowed, 1);
    });

    it('should successfully release a read and a write session', function() {
      tempSession.release(readSession);
      return tempSession.release(writeSession);
    });

    it('verify that a read and write session are released', function() {
      assert.strictEqual(tempSession.getStats().writePool.borrowed, 0);
      assert.strictEqual(tempSession.getStats().readPool.borrowed, 0);
    });

    it('should throw an error while release a write session', function() {
      tempSession.createTransaction_ = () => Promise.reject();
      return tempSession
        .getWriteSession()
        .then(ws => tempSession.release(ws))
        .then(() =>
          assert.strictEqual(tempSession.getStats().writePool.available, 4)
        );
    });
  });

  describe('request', function() {
    var CONFIG;
    var SESSION = {
      formattedName_: 'formatted-name',
    };

    beforeEach(function() {
      CONFIG = {
        reqOpts: {},
      };

      sessionPool.getReadSession = function() {
        return Promise.resolve(SESSION);
      };

      sessionPool.release = common.util.noop;
    });

    it('should get a session', function(done) {
      sessionPool.getReadSession = function() {
        setImmediate(done);
        return Promise.resolve(SESSION);
      };

      sessionPool.request(CONFIG, assert.ifError);
    });

    it('should return error if it cannot get a session', function(done) {
      var error = new Error('Error.');

      sessionPool.getReadSession = function() {
        return Promise.reject(error);
      };

      sessionPool.request(CONFIG, function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });

    it('should call the method with the session', function(done) {
      CONFIG.reqOpts = {
        a: 'b',
      };

      sessionPool.request_ = function(config) {
        assert.deepEqual(
          config.reqOpts,
          extend({}, CONFIG.reqOpts, {
            session: SESSION.formattedName_,
          })
        );
        done();
      };

      sessionPool.request(CONFIG, assert.ifError);
    });

    it('should release the session after calling the method', function(done) {
      sessionPool.release = function(session) {
        assert.strictEqual(session, SESSION);
        done();
      };

      sessionPool.request_ = function(config, callback) {
        callback();
      };

      sessionPool.request(CONFIG, assert.ifError);
    });

    it('should execute the callback with original arguments', function(done) {
      var originalArgs = ['a', 'b', 'c'];

      sessionPool.request_ = function(config, callback) {
        callback.apply(null, originalArgs);
      };

      sessionPool.request(CONFIG, function() {
        var args = [].slice.call(arguments);
        assert.deepEqual(args, originalArgs);
        done();
      });
    });
  });

  describe('requestStream', function() {
    var CONFIG;
    var REQUEST_STREAM;

    var SESSION = {
      formattedName_: 'formatted-name',
    };

    beforeEach(function() {
      REQUEST_STREAM = through();

      CONFIG = {
        reqOpts: {},
      };

      sessionPool.requestStream_ = function() {
        return REQUEST_STREAM;
      };

      sessionPool.getReadSession = function() {
        return Promise.resolve(SESSION);
      };

      sessionPool.release = common.util.noop;
    });

    it('should get a session when stream opens', function(done) {
      sessionPool.getReadSession = function() {
        setImmediate(done);
        return Promise.resolve(SESSION);
      };

      sessionPool.requestStream(CONFIG).emit('reading');
    });

    describe('could not get session', function() {
      var ERROR = new Error('Error.');

      beforeEach(function() {
        sessionPool.getReadSession = function() {
          return Promise.reject(ERROR);
        };
      });

      it('should destroy the stream', function(done) {
        sessionPool
          .requestStream(CONFIG)
          .on('error', function(err) {
            assert.strictEqual(err, ERROR);
            done();
          })
          .emit('reading');
      });
    });

    describe('session retrieved successfully', function() {
      beforeEach(function() {
        sessionPool.getReadSession = function() {
          return Promise.resolve(SESSION);
        };
      });

      it('should assign session to request options', function(done) {
        sessionPool.requestStream_ = function(config) {
          assert.strictEqual(config.reqOpts.session, SESSION.formattedName_);
          setImmediate(done);
          return through.obj();
        };

        sessionPool.requestStream(CONFIG).emit('reading');
      });

      it('should make request and pipe to the stream', function(done) {
        var responseData = Buffer.from('response-data');

        sessionPool.requestStream(CONFIG).on('data', function(data) {
          assert.deepEqual(data, responseData);
          done();
        });

        REQUEST_STREAM.end(responseData);
      });

      it('should release session when request stream ends', function(done) {
        sessionPool.release = function(session) {
          assert.strictEqual(session, SESSION);
          done();
        };

        sessionPool.requestStream(CONFIG).emit('reading');

        REQUEST_STREAM.end();
      });

      it('should release session when request stream errors', function(done) {
        sessionPool.release = function(session) {
          assert.strictEqual(session, SESSION);
          done();
        };

        sessionPool.requestStream(CONFIG).emit('reading');

        setImmediate(function() {
          REQUEST_STREAM.emit('error');
        });
      });

      it('should error user stream when request stream errors', function(done) {
        var error = new Error('Error.');

        sessionPool
          .requestStream(CONFIG)
          .on('error', function(err) {
            assert.strictEqual(err, error);
            done();
          })
          .emit('reading');

        setImmediate(function() {
          REQUEST_STREAM.destroy(error);
        });
      });
    });

    describe('abort', function() {
      var SESSION;

      beforeEach(function() {
        REQUEST_STREAM.cancel = common.util.noop;

        SESSION = {
          cancel: common.util.noop,
        };

        sessionPool.getReadSession = function() {
          return Promise.resolve(SESSION);
        };
      });

      it('should release the session', function(done) {
        sessionPool.release = function(session) {
          assert.strictEqual(session, SESSION);
          done();
        };

        var requestStream = sessionPool.requestStream(CONFIG);

        requestStream.emit('reading');

        setImmediate(function() {
          requestStream.abort();
        });
      });

      it('should not release the session more than once', function(done) {
        var numTimesReleased = 0;
        sessionPool.release = function(session) {
          numTimesReleased++;
          assert.strictEqual(session, SESSION);
        };

        var requestStream = sessionPool.requestStream(CONFIG);

        requestStream.emit('reading');

        setImmediate(function() {
          requestStream.abort();
          assert.strictEqual(numTimesReleased, 1);

          requestStream.abort();
          assert.strictEqual(numTimesReleased, 1);

          done();
        });
      });

      it('should cancel the request stream', function(done) {
        REQUEST_STREAM.cancel = done;

        var requestStream = sessionPool.requestStream(CONFIG);

        requestStream.emit('reading');

        setImmediate(function() {
          requestStream.abort();
        });
      });
    });
  });

  describe('createTransaction_', function() {
    var fakeSession;
    var fakeTxn;

    beforeEach(function() {
      fakeTxn = {
        end: function(callback) {
          (common.util.noop || callback)();
        },
        begin: function() {
          return Promise.resolve();
        },
      };

      fakeSession = {
        transaction: function() {
          return fakeTxn;
        },
      };

      sessionPool.release = common.util.noop;
    });

    it('should create a txn object', function(done) {
      var fakeOptions = {};

      fakeSession.transaction = function(options) {
        assert.strictEqual(options, fakeOptions);
        setImmediate(done);
        return fakeTxn;
      };

      sessionPool.createTransaction_(fakeSession, fakeOptions);
    });

    it('should stub Transaction#end', function(done) {
      var released = false;
      sessionPool.release = function(session) {
        assert.strictEqual(session, fakeSession);
        released = true;
      };

      fakeTxn.end = function(callback) {
        assert.strictEqual(this, fakeTxn);
        assert.strictEqual(released, true);
        callback(); // the done fn
      };

      sessionPool.createTransaction_(fakeSession);
      fakeTxn.end(done);
    });

    it('should cache the txn object', function() {
      return sessionPool.createTransaction_(fakeSession).then(function() {
        assert.strictEqual(fakeSession.txn, fakeTxn);
      });
    });
  });

  describe('destroySession', function() {
    var fakeSession;

    beforeEach(function() {
      fakeSession = {
        type: 'readonly',
        delete: function() {
          return Promise.resolve();
        },
      };

      sessionPool.reads_ = [fakeSession];
    });

    it('should delete the session', function() {
      var deleted = false;

      fakeSession.delete = function() {
        deleted = true;
        return Promise.resolve();
      };

      return sessionPool.destroySession(fakeSession).then(function() {
        assert.strictEqual(deleted, true);
      });
    });
  });

  describe('sendKeepAlive', function() {
    let readSession = null;
    let writeSession = null;
    let tempSession = null;
    beforeEach(function() {
      tempSession = sessionPool;
      sessionPool.createTransaction_ = () => Promise.resolve();
      sessionPool.session_ = function() {
        return new Object({
          create: () => Promise.resolve(),
          delete: () => Promise.resolve(),
        });
      };
      sessionPool.open();
      return sessionPool.getReadSession().then(function(rs) {
        readSession = rs;
        return sessionPool.getWriteSession().then(function(ws) {
          writeSession = ws;
        });
      });
    });

    it('should send keep alive on read session', function() {
      var keptAlive = false;
      readSession.keepAlive = function() {
        keptAlive = true;
        return Promise.resolve();
      };
      return tempSession.sendKeepAlive(readSession).then(function() {
        assert.strictEqual(keptAlive, true);
      });
    });

    it('should send keep alive on write session', function() {
      var keptAlive = false;
      writeSession.keepAlive = function() {
        keptAlive = true;
        return Promise.resolve();
      };
      return tempSession.sendKeepAlive(writeSession).then(function() {
        assert.strictEqual(keptAlive, true);
      });
    });

    it('should destroy the read session when keep alive message fails', function() {
      let keptAlive = false;
      let deleted = false;
      readSession.keepAlive = function() {
        keptAlive = false;
        return Promise.reject();
      };
      readSession.delete = function() {
        deleted = true;
        return Promise.resolve();
      };

      return tempSession.sendKeepAlive(readSession).then(function() {
        assert.strictEqual(keptAlive, false);
        assert.strictEqual(deleted, true);
        assert.strictEqual(tempSession.getStats().readPool.available, 9);
      });
    });

    it('should destroy the write session when keep alive message fails', function() {
      let keptAlive = false;
      let deleted = false;
      writeSession.keepAlive = function() {
        keptAlive = false;
        return Promise.reject();
      };
      writeSession.delete = function() {
        deleted = true;
        return Promise.resolve();
      };

      return tempSession.sendKeepAlive(writeSession).then(function() {
        assert.strictEqual(keptAlive, false);
        assert.strictEqual(deleted, true);
        assert.strictEqual(tempSession.getStats().writePool.available, 4);
      });
    });

    it('should handle when invalid session is passed', function() {
      let keptAlive = false;
      let deleted = false;
      writeSession.keepAlive = function() {
        keptAlive = false;
        return Promise.reject();
      };
      writeSession.delete = function() {
        deleted = true;
        return Promise.resolve();
      };

      tempSession.sendKeepAlive().then(function() {
        assert.strictEqual(keptAlive, false);
        assert.strictEqual(deleted, false);
      });
    });
  });

  describe('pingSession', function() {
    let tempSession = null;
    let readKeepAlive = 0;
    let writeKeepAlive = 0;
    before(function() {
      tempSession = sessionPool;
      tempSession.createTransaction_ = () => Promise.resolve();
      tempSession.sendKeepAlive = s => {
        if (s.type === 'readonly') {
          readKeepAlive++;
        } else {
          writeKeepAlive++;
        }
        return Promise.resolve();
      };
      tempSession.session_ = function() {
        return new Object({
          create: () => Promise.resolve(),
          delete: () => Promise.resolve(),
        });
      };
      tempSession.open();
    });

    it('should ping min read and write session', function() {
      tempSession.pingSessions_();
      setTimeout(() => {
        assert.strictEqual(readKeepAlive, 10);
        assert.strictEqual(writeKeepAlive, 5);
      }, 0);
    });
  });

  function isAround(expected, actual) {
    return actual > expected - 10 && actual < expected + 50;
  }
});
