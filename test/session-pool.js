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

var assert = require('assert');
var common = require('@google-cloud/common');
var delay = require('delay');
var events = require('events');
var extend = require('extend');
var PQueue = require('p-queue');
var proxyquire = require('proxyquire');
var through = require('through2');
var timeSpan = require('time-span');

var pQueueOverride = null;
function FakePQueue(options) {
  return new (pQueueOverride || PQueue)(options);
}

describe('SessionPool', function() {
  var SessionPool;
  var sessionPool;

  var DATABASE = {
    request: common.util.noop,
    requestStream: common.util.noop,
  };

  before(function() {
    SessionPool = proxyquire('../src/session-pool.js', {
      'p-queue': FakePQueue,
    });
  });

  beforeEach(function() {
    sessionPool = new SessionPool(DATABASE);
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
        assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
        assert.strictEqual(sessionPool.options.concurrency, 10);
        assert.strictEqual(sessionPool.options.fail, false);
        assert.strictEqual(sessionPool.options.idlesAfter, 10);
        assert.strictEqual(sessionPool.options.keepAlive, 50);
        assert.strictEqual(sessionPool.options.max, 100);
        assert.strictEqual(sessionPool.options.maxIdle, 1);
        assert.strictEqual(sessionPool.options.min, 0);
        assert.strictEqual(sessionPool.options.writes, 0);
      });

      it('should not override user options', function() {
        sessionPool = new SessionPool(DATABASE, {acquireTimeout: 0});
        assert.strictEqual(sessionPool.options.acquireTimeout, 0);
      });
    });

    it('should set isOpen to false', function() {
      assert.strictEqual(sessionPool.isOpen, false);
    });

    it('should set min = writes if writes > min', function() {
      sessionPool = new SessionPool(DATABASE, {
        writes: 10,
        min: 5,
      });

      assert.strictEqual(sessionPool.options.min, 10);
    });

    it('should localize database request functions', function() {
      assert.strictEqual(sessionPool.request_, DATABASE.request);
      assert.strictEqual(sessionPool.requestStream_, DATABASE.requestStream);
    });

    it('should set pendingCreates to 0', function() {
      assert.strictEqual(sessionPool.pendingCreates_, 0);
    });

    it('should create arrays for available and borrowed sessions', function() {
      assert.deepEqual(sessionPool.available_, []);
      assert.deepEqual(sessionPool.borrowed_, []);
    });

    it('should create an acquire queue with 1 concurrency', function() {
      pQueueOverride = function(options) {
        return options;
      };

      sessionPool = new SessionPool(DATABASE);
      assert.deepEqual(sessionPool.acquireQueue_, {
        concurrency: 1,
      });
    });

    it('should create a request queue', function() {
      var poolOptions = {
        concurrency: 11,
      };

      pQueueOverride = function(options) {
        return options;
      };

      sessionPool = new SessionPool(DATABASE, poolOptions);
      assert.deepEqual(sessionPool.requestQueue_, {
        concurrency: poolOptions.concurrency,
      });
    });

    it('should create handles for intervals', function() {
      assert.strictEqual(sessionPool.evictHandle_, null);
      assert.strictEqual(sessionPool.pingHandle_, null);
    });

    it('should inherit from EventEmitter', function() {
      assert(sessionPool instanceof events.EventEmitter);
    });

    it('should create a promise that settles when the pool closes', function() {
      assert(sessionPool.onClose_ instanceof Promise);

      setImmediate(function() {
        sessionPool.emit('close');
      });

      return sessionPool.onClose_;
    });
  });

  describe('close', function() {
    it('should set isOpen to false', function() {
      sessionPool.isOpen = true;
      sessionPool.close();
      assert.strictEqual(sessionPool.isOpen, false);
    });

    it('should emit a close event', function(done) {
      sessionPool.on('close', done);
      sessionPool.close();
    });

    it('should destroy all sessions', function() {
      var fakeAvailable = [{}, {}, {}];
      var fakeBorrowed = [{}, {}, {}];
      var fakeAll = fakeAvailable.concat(fakeBorrowed);

      sessionPool.available_ = fakeAvailable;
      sessionPool.borrowed_ = fakeBorrowed;

      var destroyCallCount = 0;
      sessionPool.destroySession_ = function(session) {
        assert.strictEqual(session, fakeAll[destroyCallCount++]);
      };

      sessionPool.close();

      assert.strictEqual(destroyCallCount, fakeAll.length);
      assert.deepEqual(sessionPool.available_, []);
      assert.deepEqual(sessionPool.borrowed_, []);
    });

    it('should settle once all sessions are destroyed', function() {
      var delay = 500;

      sessionPool.available_ = [{}];
      sessionPool.destroySession_ = function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, delay);
        });
      };

      var end = timeSpan();

      return sessionPool.close().then(function() {
        assert(isAround(delay, end()));
      });
    });

    it('should optionally accept a callback', function(done) {
      sessionPool.close(done);
    });

    it('should send errors to the callback', function(done) {
      var error = new Error('err');

      sessionPool.available_ = [{}];
      sessionPool.destroySession_ = function() {
        return Promise.reject(error);
      };

      sessionPool.close(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('getSession', function() {
    it('should call through to borrowSession_', function() {
      var fakeSession = {};

      sessionPool.borrowSession_ = function(type) {
        assert.strictEqual(type, 'readonly');
        return Promise.resolve(fakeSession);
      };

      return sessionPool.getSession().then(function(session) {
        assert.strictEqual(session, fakeSession);
      });
    });

    it('should optionally accept a callback', function(done) {
      var fakeSession = {};

      sessionPool.borrowSession_ = function() {
        return Promise.resolve(fakeSession);
      };

      sessionPool.getSession(function(err, session) {
        assert.ifError(err);
        assert.strictEqual(session, fakeSession);
        done();
      });
    });

    it('should return errors to the callback', function(done) {
      var error = new Error('err');

      sessionPool.borrowSession_ = function() {
        return Promise.reject(error);
      };

      sessionPool.getSession(function(err, session) {
        assert.strictEqual(err, error);
        assert.strictEqual(session, undefined);
        done();
      });
    });
  });

  describe('getWriteSession', function() {
    it('should call through to borrowSession_', function() {
      var fakeSession = {};

      sessionPool.borrowSession_ = function(type) {
        assert.strictEqual(type, 'readwrite');
        return Promise.resolve(fakeSession);
      };

      return sessionPool.getWriteSession().then(function(session) {
        assert.strictEqual(session, fakeSession);
      });
    });

    it('should optionally accept a callback', function(done) {
      var fakeTxn = {};
      var fakeSession = {txn: fakeTxn};

      sessionPool.borrowSession_ = function() {
        return Promise.resolve(fakeSession);
      };

      sessionPool.getWriteSession(function(err, session, txn) {
        assert.ifError(err);
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(txn, fakeTxn);
        done();
      });
    });

    it('should return errors to the callback', function(done) {
      var error = new Error('err');

      sessionPool.borrowSession_ = function() {
        return Promise.reject(error);
      };

      sessionPool.getWriteSession(function(err, session, txn) {
        assert.strictEqual(err, error);
        assert.strictEqual(session, undefined);
        assert.strictEqual(txn, undefined);
        done();
      });
    });
  });

  describe('isFull', function() {
    it('should return true if it is full', function() {
      sessionPool.pendingCreates_ = 0;

      sessionPool.size = function() {
        return sessionPool.options.max;
      };

      assert.strictEqual(sessionPool.isFull(), true);
    });

    it('should return true if the size + pending creates == max', function() {
      var pending = (sessionPool.pendingCreates_ = 21);

      sessionPool.size = function() {
        return sessionPool.options.max - pending;
      };

      assert.strictEqual(sessionPool.isFull(), true);
    });

    it('should return false if not', function() {
      sessionPool.pendingCreates_ = 0;

      sessionPool.size = function() {
        return 0;
      };

      assert.strictEqual(sessionPool.isFull(), false);
    });
  });

  describe('open', function() {
    beforeEach(function() {
      sessionPool.options.min = 1;
      sessionPool.createSessionInBackground_ = function() {
        return Promise.resolve();
      };
    });

    it('should set isOpen to true', function() {
      sessionPool.open();
      assert.strictEqual(sessionPool.isOpen, true);
    });

    it('should start listening for events', function(done) {
      sessionPool.listenForEvents_ = done;
      sessionPool.open();
    });

    it('should emit an open event', function(done) {
      sessionPool.once('open', done);
      sessionPool.open();
    });

    it('should create the min. of readonly sessions', function() {
      var min = (sessionPool.options.min = 10);
      var createCallCount = 0;

      sessionPool.createSessionInBackground_ = function(type) {
        assert.strictEqual(type, 'readonly');
        createCallCount += 1;
      };

      sessionPool.open();

      assert.strictEqual(createCallCount, min);
    });

    it('should factor in the number of desired write sessions', function() {
      var min = (sessionPool.options.min = 10);
      var writes = (sessionPool.options.writes = 5);

      var callCounts = {
        readonly: 0,
        readwrite: 0,
      };

      sessionPool.createSessionInBackground_ = function(type) {
        callCounts[type] += 1;
      };

      sessionPool.open();

      assert.strictEqual(callCounts.readonly, min - writes);
      assert.strictEqual(callCounts.readwrite, writes);
    });

    it('should settle once all sessions are created', function() {
      var delay = 500;

      sessionPool.createSessionInBackground_ = function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, delay);
        });
      };

      var end = timeSpan();

      return sessionPool.open().then(function() {
        assert(isAround(delay, end()));
      });
    });

    it('should optionally accept a callback', function(done) {
      sessionPool.open(done);
    });

    it('should return any errors to the callback', function(done) {
      var error = new Error('err');

      sessionPool.createSessionInBackground_ = function() {
        return Promise.reject(error);
      };

      sessionPool.open(function(err) {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('release', function() {
    it('should throw an error for unknown sessions', function() {
      assert.throws(function() {
        sessionPool.release({});
      }, /Unable to release unknown session\./);
    });

    it('should make the session available', function(done) {
      var fakeSession = {
        type: 'readonly',
      };

      sessionPool.once('available', function() {
        assert.deepEqual(sessionPool.borrowed_, []);
        assert.deepEqual(sessionPool.available_, [fakeSession]);
        done();
      });

      sessionPool.borrowed_ = [fakeSession];
      sessionPool.release(fakeSession);
    });

    describe('readwrite sessions', function() {
      var fakeSession = {
        type: 'readwrite',
      };

      beforeEach(function() {
        sessionPool.borrowed_ = [fakeSession];
      });

      it('should prepare a new transaction', function(done) {
        sessionPool.prepareTransaction_ = function(session) {
          assert.strictEqual(session, fakeSession);
          setImmediate(done);
          return Promise.resolve();
        };

        sessionPool.release(fakeSession);
      });

      it('should make the session available', function(done) {
        sessionPool.prepareTransaction_ = function() {
          return Promise.resolve();
        };

        sessionPool.once('available', function() {
          assert.deepEqual(sessionPool.borrowed_, []);
          assert.deepEqual(sessionPool.available_, [fakeSession]);
          done();
        });

        sessionPool.release(fakeSession);
      });

      it('should emit any errors that occur', function(done) {
        var error = new Error('err');

        sessionPool.prepareTransaction_ = function() {
          return Promise.reject(error);
        };

        sessionPool.on('error', function(err) {
          assert.strictEqual(err, error);
          done();
        });

        sessionPool.release(fakeSession);
      });
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

      sessionPool.getSession = function(callback) {
        callback(null, SESSION);
      };

      sessionPool.release = common.util.noop;
    });

    it('should get a session', function(done) {
      sessionPool.getSession = function() {
        done();
      };

      sessionPool.request(CONFIG, assert.ifError);
    });

    it('should return error if it cannot get a session', function(done) {
      var error = new Error('Error.');

      sessionPool.getSession = function(callback) {
        callback(error);
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

    beforeEach(function() {
      REQUEST_STREAM = through();

      CONFIG = {
        reqOpts: {},
      };

      sessionPool.requestStream_ = function() {
        return REQUEST_STREAM;
      };

      sessionPool.getSession = common.util.noop;
      sessionPool.release = common.util.noop;
    });

    it('should get a session when stream opens', function(done) {
      sessionPool.getSession = function() {
        done();
      };

      sessionPool.requestStream(CONFIG).emit('reading');
    });

    describe('could not get session', function() {
      var ERROR = new Error('Error.');

      beforeEach(function() {
        sessionPool.getSession = function(callback) {
          callback(ERROR);
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
      var SESSION = {
        formattedName_: 'formatted-name',
      };

      beforeEach(function() {
        sessionPool.getSession = function(callback) {
          callback(null, SESSION);
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

        REQUEST_STREAM.emit('error');
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

        REQUEST_STREAM.destroy(error);
      });
    });

    describe('abort', function() {
      var SESSION;

      beforeEach(function() {
        REQUEST_STREAM.cancel = common.util.noop;

        SESSION = {
          cancel: common.util.noop,
        };

        sessionPool.getSession = function(callback) {
          callback(null, SESSION);
        };
      });

      it('should release the session', function(done) {
        sessionPool.release = function(session) {
          assert.strictEqual(session, SESSION);
          done();
        };

        var requestStream = sessionPool.requestStream(CONFIG);

        requestStream.emit('reading');

        requestStream.abort();
      });

      it('should not release the session more than once', function() {
        var numTimesReleased = 0;
        sessionPool.release = function(session) {
          numTimesReleased++;
          assert.strictEqual(session, SESSION);
        };

        var requestStream = sessionPool.requestStream(CONFIG);

        requestStream.emit('reading');

        requestStream.abort();
        assert.strictEqual(numTimesReleased, 1);

        requestStream.abort();
        assert.strictEqual(numTimesReleased, 1);
      });

      it('should cancel the request stream', function(done) {
        REQUEST_STREAM.cancel = done;

        var requestStream = sessionPool.requestStream(CONFIG);

        requestStream.emit('reading');

        requestStream.abort();
      });
    });
  });

  describe('session', function() {
    var fakeSession;

    beforeEach(function() {
      fakeSession = {
        create: common.util.noop,
      };

      DATABASE.session_ = function() {
        return fakeSession;
      };
    });

    it('should call through to Database#session_', function() {
      var session = sessionPool.session();
      assert.strictEqual(session, fakeSession);
    });

    it('should capture the session type', function() {
      var type = 'readonly';
      var session = sessionPool.session(type);

      assert.strictEqual(session.type, type);
    });

    it('should set the lastUsed time to now', function() {
      var session = sessionPool.session();

      assert(isAround(Date.now(), session.lastUsed));
    });

    describe('write sessions', function() {
      it('should prepare a transaction on create', function() {
        fakeSession.create = function() {
          assert.strictEqual(this, fakeSession);
          return Promise.resolve();
        };

        sessionPool.prepareTransaction_ = function(session) {
          assert.strictEqual(session, fakeSession);
          return Promise.resolve();
        };

        return sessionPool.session('readwrite').create();
      });
    });
  });

  describe('size', function() {
    it('should return the total number of sessions', function() {
      sessionPool.available_ = [{}, {}];
      sessionPool.borrowed_ = [{}, {}, {}];

      assert.strictEqual(sessionPool.size(), 5);
    });
  });

  describe('borrowSession_', function() {
    it('should borrow a session', function() {
      var fakeSession = {};
      var fakeType = 'readonly';

      sessionPool.available_ = [fakeSession];
      sessionPool.getSession_ = function(type) {
        assert.strictEqual(type, fakeType);
        return Promise.resolve(fakeSession);
      };

      return sessionPool.borrowSession_(fakeType).then(function(session) {
        assert.strictEqual(session, fakeSession);
        assert.deepEqual(sessionPool.available_, []);
        assert.deepEqual(sessionPool.borrowed_, [fakeSession]);
        assert(isAround(Date.now(), session.lastUsed));
      });
    });
  });

  describe('createSession_', function() {
    var fakeSession;

    beforeEach(function() {
      fakeSession = {};
      sessionPool.session = function() {
        return fakeSession;
      };
    });

    it('should create a session', function() {
      var fakeType = 'readonly';

      fakeSession.session = function(type) {
        assert.strictEqual(type, fakeType);
        return fakeSession;
      };

      fakeSession.create = function() {
        assert.strictEqual(sessionPool.pendingCreates_, 1);
        return Promise.resolve();
      };

      return sessionPool.createSession_(fakeType).then(function(session) {
        assert.deepEqual(sessionPool.available_, [fakeSession]);
        assert.strictEqual(sessionPool.pendingCreates_, 0);
        assert.strictEqual(session, fakeSession);
      });
    });

    it('should return an error', function() {
      var error = new Error('err');

      fakeSession.create = function() {
        assert.strictEqual(sessionPool.pendingCreates_, 1);
        return Promise.reject(error);
      };

      return sessionPool.createSession_().catch(function(err) {
        assert.strictEqual(sessionPool.pendingCreates_, 0);
        assert.strictEqual(err, error);
      });
    });
  });

  describe('createSessionInBackground_', function() {
    it('should emit an available event', function(done) {
      var fakeType = 'readonly';

      sessionPool.createSession_ = function(type) {
        assert.strictEqual(type, fakeType);
        return Promise.resolve();
      };

      sessionPool.on('available', done);
      sessionPool.createSessionInBackground_(fakeType);
    });

    it('should emit an error event', function(done) {
      var error = new Error('err');

      sessionPool.createSession_ = function() {
        return Promise.reject(error);
      };

      sessionPool.on('error', function(err) {
        assert.strictEqual(err, error);
        done();
      });

      sessionPool.createSessionInBackground_();
    });
  });

  describe('destroySession_', function() {
    var fakeSession;

    beforeEach(function() {
      fakeSession = {
        type: 'readonly',
        delete: function() {
          return Promise.resolve();
        },
      };

      sessionPool.available_ = [fakeSession];
    });

    it('should remove the session from the pool', function() {
      sessionPool.destroySession_(fakeSession);
      assert.deepEqual(sessionPool.available_, []);
    });

    it('should emit a destroy event', function(done) {
      sessionPool.on('destroy', done);
      sessionPool.destroySession_(fakeSession);
    });

    describe('refilling', function() {
      beforeEach(function() {
        sessionPool.isOpen = true;
        sessionPool.options.min = 10;
        sessionPool.size = function() {
          return 0;
        };
      });

      it('should create a new session', function(done) {
        sessionPool.createSessionInBackground_ = function(type) {
          assert.strictEqual(type, fakeSession.type);
          done();
        };

        sessionPool.destroySession_(fakeSession);
      });

      it('should not create a session if the pool is closed', function() {
        sessionPool.createSessionInBackground_ = function() {
          throw new Error('Should not be called.');
        };

        sessionPool.isOpen = false;
        sessionPool.destroySession_(fakeSession);
      });

      it('should not create if the pool has min sessions', function() {
        sessionPool.createSessionInBackground_ = function() {
          throw new Error('Should not be called.');
        };

        sessionPool.options.min = 0;
        sessionPool.destroySession_(fakeSession);
      });
    });

    it('should delete the session', function() {
      var deleted = false;

      fakeSession.delete = function() {
        deleted = true;
        return Promise.resolve();
      };

      return sessionPool.destroySession_(fakeSession).then(function() {
        assert.strictEqual(deleted, true);
      });
    });

    it('should emit any errors', function(done) {
      var error = new Error('err');

      fakeSession.delete = function() {
        return Promise.reject(error);
      };

      sessionPool.on('error', function(err) {
        assert.strictEqual(err, error);
        done();
      });

      sessionPool.destroySession_(fakeSession);
    });
  });

  describe('evictIdleSessions_', function() {
    var fakeSessions;

    beforeEach(function() {
      sessionPool.options.maxIdle = 0;
      sessionPool.options.min = 0;

      fakeSessions = [{}, {}, {}];

      sessionPool.getIdleSessions_ = function() {
        return fakeSessions.slice();
      };
    });

    it('should evict the sessions', function() {
      var destroyCallCount = 0;

      sessionPool.destroySession_ = function(session) {
        var fakeSessionIndex = fakeSessions.length - ++destroyCallCount;
        var fakeSession = fakeSessions[fakeSessionIndex];

        assert.strictEqual(session, fakeSession);
      };

      return sessionPool.evictIdleSessions_().then(function() {
        assert.strictEqual(destroyCallCount, fakeSessions.length);
      });
    });

    it('should respect the maxIdle option', function() {
      var destroyCallCount = 0;

      sessionPool.destroySession_ = function(session) {
        var fakeSessionIndex = fakeSessions.length - ++destroyCallCount;
        var fakeSession = fakeSessions[fakeSessionIndex];

        assert.strictEqual(session, fakeSession);
      };

      sessionPool.options.maxIdle = fakeSessions.length - 1;

      return sessionPool.evictIdleSessions_().then(function() {
        assert.strictEqual(destroyCallCount, 1);
      });
    });

    it('should respect the min value', function() {
      var destroyCallCount = 0;

      sessionPool.destroySession_ = function(session) {
        var fakeSessionIndex = fakeSessions.length - ++destroyCallCount;
        var fakeSession = fakeSessions[fakeSessionIndex];

        assert.strictEqual(session, fakeSession);
      };

      sessionPool.options.min = fakeSessions.length - 2;

      return sessionPool.evictIdleSessions_().then(function() {
        assert.strictEqual(destroyCallCount, 2);
      });
    });
  });

  describe('getIdleSessions_', function() {
    it('should return a list of idle sessions', function() {
      var idlesAfter = (sessionPool.options.idlesAfter = 1); // 1 minute
      var idleTimestamp = Date.now() - idlesAfter * 60000;

      var fakeSessions = (sessionPool.available_ = [
        {lastUsed: idleTimestamp},
        {lastUsed: Date.now()},
        {lastUsed: idleTimestamp},
      ]);

      var expectedSessions = [fakeSessions[0], fakeSessions[2]];
      var idleSessions = sessionPool.getIdleSessions_();

      assert.deepEqual(idleSessions, expectedSessions);
    });
  });

  describe('getSession_', function() {
    describe('none available', function() {
      beforeEach(function() {
        sessionPool.available_.length = 0;
      });

      it('should error if fail is set to true', function() {
        sessionPool.options.fail = true;

        return sessionPool.getSession_().then(
          function() {
            throw new Error('Should not resolve.');
          },
          function(err) {
            assert.strictEqual(err.message, 'No resources available.');
          }
        );
      });

      it('should create a new session if there is room', function() {
        var fakeType = 'readonly';
        var fakeSession = {};

        sessionPool.isFull = function() {
          return false;
        };

        sessionPool.race_ = function(fn) {
          return fn();
        };

        sessionPool.createSession_ = function(type) {
          assert.strictEqual(type, fakeType);
          return Promise.resolve(fakeSession);
        };

        return sessionPool.getSession_(fakeType).then(function(session) {
          assert.strictEqual(session, fakeSession);
        });
      });

      it('should wait for a session to become available if full', function() {
        var fakeType = 'readOnly';
        var fakeSession = {};

        sessionPool.isFull = function() {
          return true;
        };

        sessionPool.race_ = function(fn) {
          sessionPool.getSession_ = function(type) {
            assert.strictEqual(type, fakeType);
            return Promise.resolve(fakeSession);
          };

          setImmediate(function() {
            sessionPool.emit('available');
          });

          return fn();
        };

        return sessionPool.getSession_(fakeType).then(function(session) {
          assert.strictEqual(session, fakeSession);
        });
      });
    });

    describe('available', function() {
      it('should return the correct type when available', function() {
        var fakeType = 'readonly';
        var fakeSession = {
          type: fakeType,
        };

        sessionPool.available_ = [fakeSession];

        return sessionPool.getSession_(fakeType).then(function(session) {
          assert.strictEqual(session, fakeSession);
        });
      });

      it('should return write sessions when no readonly', function() {
        var fakeSession = {
          type: 'readwrite',
        };

        sessionPool.available_ = [fakeSession];

        return sessionPool.getSession_('readonly').then(function(session) {
          assert.strictEqual(session, fakeSession);
        });
      });

      it('should prepare a transaction for readonly', function() {
        var fakeTxn = {};
        var fakeSession = {
          type: 'readonly',
        };

        sessionPool.available_ = [fakeSession];

        sessionPool.prepareTransaction_ = function(session) {
          assert.strictEqual(session, fakeSession);
          fakeSession.txn = fakeTxn;
          return Promise.resolve();
        };

        return sessionPool.getSession_('readwrite').then(function(session) {
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(session.txn, fakeTxn);
        });
      });
    });
  });

  describe('listenForEvents_', function() {
    var _clearInterval;
    var _setInterval;

    var fakeHandle = 1;
    var pingCallCount = 0;
    var evictCallCount = 0;

    before(function() {
      _clearInterval = global.clearInterval;
      _setInterval = global.setInterval;
    });

    beforeEach(function() {
      fakeHandle = 1;
      pingCallCount = evictCallCount = 0;

      sessionPool.pingIdleSessions_ = function() {
        pingCallCount += 1;
      };

      sessionPool.evictIdleSessions_ = function() {
        evictCallCount += 1;
      };

      global.clearInterval = common.util.noop;

      global.setInterval = function(cb) {
        cb();
        return fakeHandle++;
      };
    });

    after(function() {
      global.clearInterval = _clearInterval;
      global.setInterval = _setInterval;
    });

    it('should start polling when a session is available', function() {
      var expectedKeepAlive = sessionPool.options.keepAlive * 60000;
      var expectedEvict = sessionPool.options.idlesAfter * 60000;

      global.setInterval = function(cb, speed) {
        cb();

        if (fakeHandle === 1) {
          assert.strictEqual(speed, expectedKeepAlive);
          assert.strictEqual(pingCallCount, 1);
        } else {
          assert.strictEqual(speed, expectedEvict);
          assert.strictEqual(evictCallCount, 1);
        }

        return fakeHandle++;
      };

      sessionPool.listenForEvents_();
      sessionPool.emit('available');

      assert.strictEqual(sessionPool.pingHandle_, 1);
      assert.strictEqual(sessionPool.evictHandle_, 2);
    });

    it('should not kill the intervals if there are sessions', function() {
      global.clearInterval = function() {
        throw new Error('Should not be called.');
      };

      sessionPool.listenForEvents_();
      sessionPool.emit('available');

      sessionPool.available_ = [{}];
      sessionPool.emit('destroy');
    });

    it('should kill the intervals if there are no sessions', function() {
      var clearCallCount = 0;

      global.clearInterval = function(handle) {
        assert.strictEqual(handle, ++clearCallCount);
      };

      sessionPool.listenForEvents_();
      sessionPool.emit('available');

      sessionPool.available_.length = 0;
      sessionPool.emit('destroy');

      assert.strictEqual(clearCallCount, 2);
    });

    it('should start watching for sessions once empty', function() {
      global.setInterval = function(cb) {
        cb();

        if (fakeHandle === 3) {
          assert.strictEqual(pingCallCount, 2);
        } else if (fakeHandle === 4) {
          assert.strictEqual(evictCallCount, 2);
        }

        return fakeHandle++;
      };

      sessionPool.listenForEvents_();
      sessionPool.emit('available');

      sessionPool.available_.length = 0;
      sessionPool.emit('destroy');

      sessionPool.emit('available');

      assert.strictEqual(sessionPool.pingHandle_, 3);
      assert.strictEqual(sessionPool.evictHandle_, 4);
    });

    it('should clean up all the things on close', function() {
      var clearCallCount = 0;

      global.clearInterval = function(handle) {
        assert.strictEqual(handle, ++clearCallCount);
      };

      sessionPool.listenForEvents_();
      sessionPool.emit('available');
      sessionPool.emit('close');

      sessionPool.available_.length = 0;

      sessionPool.emit('destroy'); //should do nothing
      sessionPool.emit('available'); // should do nothing

      assert.strictEqual(clearCallCount, 2);
      assert.strictEqual(pingCallCount, 1);
      assert.strictEqual(evictCallCount, 1);
    });
  });

  describe('pingIdleSessions_', function() {
    it('should keep idle sessions alive', function() {
      var keepAliveCallCount = 0;
      var fakeSession = {
        keepAlive: function() {
          keepAliveCallCount += 1;
          return Promise.resolve();
        },
      };

      sessionPool.getIdleSessions_ = function() {
        return [fakeSession, fakeSession];
      };

      return sessionPool.pingIdleSessions_().then(function() {
        assert.strictEqual(keepAliveCallCount, 2);
      });
    });

    it('should destroy and report failures', function(done) {
      var error = new Error('err');
      var destroyed = false;

      var fakeSession = {
        keepAlive: function() {
          return Promise.reject(error);
        },
      };

      sessionPool.getIdleSessions_ = function() {
        return [fakeSession];
      };

      sessionPool.destroySession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        destroyed = true;
      };

      sessionPool.on('error', function(err) {
        assert.strictEqual(err, error);
        assert.strictEqual(destroyed, true);
        done();
      });

      sessionPool.pingIdleSessions_();
    });
  });

  describe('prepareTransaction_', function() {
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

      sessionPool.prepareTransaction_(fakeSession, fakeOptions);
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

      sessionPool.prepareTransaction_(fakeSession);
      fakeTxn.end(done);
    });

    it('should cache the txn object', function() {
      return sessionPool.prepareTransaction_(fakeSession).then(function() {
        assert.strictEqual(fakeSession.txn, fakeTxn);
      });
    });

    it('should destroy all the things on error', function() {
      var error = new Error('err');
      fakeTxn.begin = function() {
        return Promise.reject(error);
      };

      var destroyed = false;
      sessionPool.destroySession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        destroyed = true;
      };

      var ended = false;
      fakeTxn.end = function() {
        ended = true;
      };

      return sessionPool.prepareTransaction_(fakeSession).then(
        function() {
          throw new Error('Should not be called.');
        },
        function(err) {
          assert.strictEqual(err, error);
          assert.strictEqual(destroyed, true);
          assert.strictEqual(ended, true);
        }
      );
    });
  });

  describe('race_', function() {
    it('should resolve in a perfect world', function() {
      var fakeData = {};

      return sessionPool
        .race_(function() {
          return Promise.resolve(fakeData);
        })
        .then(function(data) {
          assert.strictEqual(data, fakeData);
        });
    });

    it('should fail if the pool closes', function() {
      sessionPool.onClose_ = Promise.resolve();

      return sessionPool
        .race_(function() {
          return Promise.resolve('wat');
        })
        .then(
          function() {
            throw new Error('Should not be called.');
          },
          function(err) {
            assert.strictEqual(err.message, 'Database is closed.');
          }
        );
    });

    it('should add a timeout if configured', function() {
      sessionPool.options.acquireTimeout = 1;

      return sessionPool
        .race_(function() {
          return delay(100, 'wat');
        })
        .then(
          function() {
            throw new Error('Should not be called.');
          },
          function(err) {
            assert.strictEqual(err.message, 'Timed out acquiring session.');
          }
        );
    });
  });

  function isAround(expected, actual) {
    return actual > expected - 10 && actual < expected + 10;
  }
});
