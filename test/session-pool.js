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
var stackTrace = require('stack-trace');
var through = require('through2');
var timeSpan = require('time-span');

var pQueueOverride = null;
function FakePQueue(options) {
  return new (pQueueOverride || PQueue)(options);
}

var fakeStackTrace = extend({}, stackTrace);

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
      'stack-trace': fakeStackTrace,
    });
  });

  beforeEach(function() {
    sessionPool = new SessionPool(DATABASE);
    sessionPool.onClose_ = new Promise(function() {});
  });

  afterEach(function() {
    pQueueOverride = null;
    fakeStackTrace.get = stackTrace.get;
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

    it('should localize database request functions', function() {
      assert.strictEqual(sessionPool.request_, DATABASE.request);
      assert.strictEqual(sessionPool.requestStream_, DATABASE.requestStream);
    });

    it('should set pendingCreates to 0', function() {
      assert.strictEqual(sessionPool.pendingCreates_, 0);
    });

    it('should create arrays for available and borrowed sessions', function() {
      assert.deepEqual(sessionPool.reads_, []);
      assert.deepEqual(sessionPool.writes_, []);
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
  });

  describe('formatTrace_', function() {
    var fakeFileName = 'path/to/file.js';
    var fakeLineNumber = '99';
    var fakeColumnNumber = '13';
    var file = `${fakeFileName}:${fakeLineNumber}:${fakeColumnNumber}`;

    var fakeFunction;
    var fakeMethod;

    var fakeTrace = [
      {},
      {},
      {
        getFunctionName: function() {
          return fakeFunction;
        },
        getMethodName: function() {
          return fakeMethod;
        },
        getFileName: function() {
          return fakeFileName;
        },
        getLineNumber: function() {
          return fakeLineNumber;
        },
        getColumnNumber: function() {
          return fakeColumnNumber;
        },
      },
    ];

    it('should return a trace with the method name', function() {
      fakeMethod = 'MyClass.myMethod';

      var expected = `Session leak detected!\n    at ${fakeMethod} (${file})`;
      var actual = SessionPool.formatTrace_(fakeTrace);

      assert.strictEqual(expected, actual);
    });

    it('should return a trace with the function name', function() {
      fakeFunction = 'myFunction';

      var expected = `Session leak detected!\n    at ${fakeFunction} (${file})`;
      var actual = SessionPool.formatTrace_(fakeTrace);

      assert.strictEqual(expected, actual);
    });
  });

  describe('available', function() {
    it('should return the number of available sessions', function() {
      sessionPool.reads_ = [{}];
      sessionPool.writes_ = [{}, {}];

      assert.strictEqual(sessionPool.available(), 3);
    });
  });

  describe('borrowed', function() {
    it('should return the number of borrowed sessions', function() {
      sessionPool.borrowed_ = [{}, {}];

      assert.strictEqual(sessionPool.borrowed(), 2);
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

    it('should emit an empty event', function(done) {
      sessionPool.on('empty', done);
      sessionPool.close();
    });

    it('should call stopHouseKeeping_', function(done) {
      sessionPool.stopHouseKeeping_ = done;
      sessionPool.close();
    });

    it('should destroy all sessions', function() {
      var fakeReads = [{}, {}];
      var fakeWrites = [{}];
      var fakeBorrowed = [{}, {}, {}];

      var fakeAll = fakeReads.concat(fakeWrites, fakeBorrowed);

      sessionPool.reads_ = fakeReads;
      sessionPool.writes_ = fakeWrites;
      sessionPool.borrowed_ = fakeBorrowed;

      var destroyCallCount = 0;
      sessionPool.destroySession_ = function(session) {
        assert.strictEqual(session, fakeAll[destroyCallCount++]);
      };

      sessionPool.close();

      assert.strictEqual(destroyCallCount, fakeAll.length);
      assert.deepEqual(sessionPool.reads_, []);
      assert.deepEqual(sessionPool.writes_, []);
      assert.deepEqual(sessionPool.borrowed_, []);
    });

    it('should settle once all sessions are destroyed', function() {
      var delay = 500;

      sessionPool.reads_ = [{}];
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
  });

  describe('fill', function() {
    var created;

    beforeEach(function() {
      sessionPool.options.min = 8;

      created = {
        readonly: 0,
        readwrite: 0,
      };

      sessionPool.createSessionInBackground_ = function(type) {
        created[type] += 1;
      };
    });

    it('should create the min number of required sessions', function() {
      sessionPool.fill();

      assert.strictEqual(created.readonly, 8);
      assert.strictEqual(created.readwrite, 0);
    });

    it('should create the min number of write sessions', function() {
      sessionPool.options.writes = 0.5;
      sessionPool.fill();

      assert.strictEqual(created.readonly, 4);
      assert.strictEqual(created.readwrite, 4);
    });

    it('should respect the current size of the pool', function() {
      sessionPool.options.writes = 0.5;
      sessionPool.reads_ = [{}];
      sessionPool.writes_ = [{}, {}];
      sessionPool.fill();

      assert.strictEqual(created.readonly, 3);
      assert.strictEqual(created.readwrite, 2);
    });

    it('should settle once all the sessions are created', function() {
      var end = timeSpan();

      sessionPool.createSessionInBackground_ = function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, 500);
        });
      };

      return sessionPool.fill().then(function() {
        assert(isAround(500, end()));
      });
    });
  });

  describe('getLeaks', function() {
    var formatTrace_;

    before(function() {
      formatTrace_ = SessionPool.formatTrace_;
    });

    after(function() {
      SessionPool.formatTrace_ = formatTrace_;
    });

    it('should return a list of leaks', function() {
      var fakeTraces = ['abc', 'def'];

      sessionPool.traces_ = new Map(
        fakeTraces.map(function(t, i) {
          return [i, t];
        })
      );

      var formatCallCount = 0;
      SessionPool.formatTrace_ = function(trace) {
        assert.strictEqual(trace, fakeTraces[formatCallCount++]);
        return trace
          .split('')
          .reverse()
          .join('');
      };

      var traces = sessionPool.getLeaks();

      assert.deepEqual(traces, ['cba', 'fed']);
    });
  });

  describe('getSession', function() {
    it('should call through to acquireSession_', function() {
      var fakeSession = {};

      sessionPool.acquireSession_ = function(type) {
        assert.strictEqual(type, 'readonly');
        return Promise.resolve(fakeSession);
      };

      return sessionPool.getSession().then(function(session) {
        assert.strictEqual(session, fakeSession);
      });
    });
  });

  describe('getWriteSession', function() {
    it('should call through to acquireSession_', function() {
      var fakeSession = {};

      sessionPool.acquireSession_ = function(type) {
        assert.strictEqual(type, 'readwrite');
        return Promise.resolve(fakeSession);
      };

      return sessionPool.getWriteSession().then(function(session) {
        assert.strictEqual(session, fakeSession);
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

    it('should create an onclose promise', function() {
      sessionPool.open();

      setImmediate(function() {
        sessionPool.emit('close');
      });

      return sessionPool.onClose_;
    });

    it('should start house keeping', function(done) {
      sessionPool.startHouseKeeping_ = done;
      sessionPool.open();
    });

    it('should emit an open event', function(done) {
      sessionPool.once('open', done);
      sessionPool.open();
    });
  });

  describe('release', function() {
    it('should throw an error for unknown sessions', function() {
      assert.throws(function() {
        sessionPool.release({});
      }, /Unable to release unknown session\./);
    });

    it('should delete the stack trace associated with the session', function() {
      var fakeId = 'abc';
      var fakeSession = {id: fakeId};

      sessionPool.borrowed_ = [fakeSession];
      sessionPool.traces_.set(fakeId, [{}]);

      sessionPool.release(fakeSession);

      var hasTrace = sessionPool.traces_.has(fakeId);
      assert.strictEqual(hasTrace, false);
    });

    it('should release readonly sessions', function(done) {
      var fakeSession = {};

      sessionPool.borrowed_ = [fakeSession];
      sessionPool.release_ = function(session) {
        assert.strictEqual(session, fakeSession);
        done();
      };

      sessionPool.release(fakeSession);
    });

    describe('readwrite sessions', function() {
      var fakeSession;

      beforeEach(function() {
        fakeSession = {
          type: 'readwrite',
        };

        sessionPool.borrowed_ = [fakeSession];
      });

      it('should create a new transaction', function(done) {
        sessionPool.createTransaction_ = function(session) {
          assert.strictEqual(session, fakeSession);
          return Promise.resolve();
        };

        sessionPool.release_ = function(session) {
          assert.strictEqual(session, fakeSession);
          done();
        };

        sessionPool.release(fakeSession);
      });

      it('should set to readonly if it fails to create a txn', function(done) {
        sessionPool.createTransaction_ = function() {
          return Promise.reject();
        };

        sessionPool.release_ = function(session) {
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(fakeSession.type, 'readonly');
          done();
        };

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

      sessionPool.getSession = function() {
        return Promise.resolve(SESSION);
      };

      sessionPool.release = common.util.noop;
    });

    it('should get a session', function(done) {
      sessionPool.getSession = function() {
        setImmediate(done);
        return Promise.resolve(SESSION);
      };

      sessionPool.request(CONFIG, assert.ifError);
    });

    it('should return error if it cannot get a session', function(done) {
      var error = new Error('Error.');

      sessionPool.getSession = function() {
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

      sessionPool.getSession = function() {
        return Promise.resolve(SESSION);
      };

      sessionPool.release = common.util.noop;
    });

    it('should get a session when stream opens', function(done) {
      sessionPool.getSession = function() {
        setImmediate(done);
        return Promise.resolve(SESSION);
      };

      sessionPool.requestStream(CONFIG).emit('reading');
    });

    describe('could not get session', function() {
      var ERROR = new Error('Error.');

      beforeEach(function() {
        sessionPool.getSession = function() {
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
        sessionPool.getSession = function() {
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

        sessionPool.getSession = function() {
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

  describe('size', function() {
    it('should return the total number of sessions', function() {
      sessionPool.reads_ = [{}, {}];
      sessionPool.borrowed_ = [{}, {}, {}];

      assert.strictEqual(sessionPool.size(), 5);
    });
  });

  describe('acquireSession_', function() {
    beforeEach(function() {
      sessionPool.isOpen = true;
      sessionPool.available = function() {
        return true;
      };
      sessionPool.getSession_ = function() {
        return Promise.resolve({});
      };
    });

    it('should reject if the pool is closed', function() {
      sessionPool.isOpen = false;

      return sessionPool.acquireSession_().then(
        function() {
          throw new Error('Should not be called.');
        },
        function(err) {
          assert.strictEqual(err.message, 'Database is closed.');
        }
      );
    });

    it('should get a session', function() {
      var fakeType = 'readonly';
      var fakeSession = {};
      var borrowCalled = false;

      sessionPool.getSession_ = function(type) {
        assert.strictEqual(type, fakeType);
        return Promise.resolve(fakeSession);
      };

      sessionPool.borrowSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        borrowCalled = true;
      };

      return sessionPool.acquireSession_(fakeType).then(function(session) {
        assert.strictEqual(session, fakeSession);
        assert(isAround(session.lastUsed, Date.now()));
      });
    });

    it('should capture the stack trace', function() {
      var fakeId = 'abc';
      var fakeSession = {id: fakeId};
      var fakeTrace = [{}];

      fakeStackTrace.get = function() {
        return fakeTrace;
      };

      sessionPool.getSession_ = function() {
        return Promise.resolve(fakeSession);
      };

      return sessionPool.acquireSession_().then(function() {
        var trace = sessionPool.traces_.get(fakeId);
        assert.strictEqual(trace, fakeTrace);
      });
    });

    it('should emit an empty event if no sessions are left', function(done) {
      sessionPool.available = function() {
        return false;
      };

      sessionPool.on('empty', done);
      sessionPool.acquireSession_('readonly');
    });
  });

  describe('borrowSession_', function() {
    it('should borrow the session', function() {
      var fakeSession = {};
      var spliced = false;

      sessionPool.spliceSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        spliced = true;
      };

      sessionPool.borrowSession_(fakeSession);

      assert.strictEqual(spliced, true);
      assert.deepEqual(sessionPool.borrowed_, [fakeSession]);
    });
  });

  describe('createReadSession_', function() {
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

      return sessionPool.createReadSession_().then(function(session) {
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(session.type, 'readonly');
        assert.strictEqual(created, true);
      });
    });
  });

  describe('createWriteSession_', function() {
    it('should create a write session', function() {
      var created = true;

      var fakeSession = {
        create: function() {
          created = true;
          return Promise.resolve();
        },
      };

      sessionPool.session_ = function() {
        return fakeSession;
      };

      sessionPool.createTransaction_ = function(session) {
        assert.strictEqual(session, fakeSession);
        return Promise.resolve();
      };

      return sessionPool.createWriteSession_().then(function(session) {
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(session.type, 'readwrite');
        assert.strictEqual(created, true);
      });
    });

    it('should make session readonly if unable to create txn', function() {
      var fakeSession = {
        create: function() {
          return Promise.resolve();
        },
      };

      sessionPool.session_ = function() {
        return fakeSession;
      };

      sessionPool.createTransaction_ = function() {
        return Promise.reject();
      };

      return sessionPool.createWriteSession_().then(function(session) {
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(session.type, 'readonly');
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
      var fakeGroup = [];

      sessionPool.createReadSession_ = function() {
        return Promise.resolve(fakeSession);
      };

      sessionPool.getSessionGroup_ = function(session) {
        assert.strictEqual(session, fakeSession);
        return fakeGroup;
      };

      return sessionPool.createSession_(fakeType).then(function() {
        assert.strictEqual(sessionPool.pendingCreates_, 0);
        assert.deepEqual(fakeGroup, [fakeSession]);
      });
    });

    it('should create a readwrite session', function() {
      var fakeType = 'readwrite';
      var fakeGroup = [];

      sessionPool.createWriteSession_ = function() {
        return Promise.resolve(fakeSession);
      };

      sessionPool.getSessionGroup_ = function(session) {
        assert.strictEqual(session, fakeSession);
        return fakeGroup;
      };

      return sessionPool.createSession_(fakeType).then(function() {
        assert.deepEqual(fakeGroup, [fakeSession]);
      });
    });

    it('should return an error', function() {
      var error = new Error('err');

      sessionPool.createReadSession_ = function() {
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

  describe('destroySession_', function() {
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

    it('should remove the session from the pool', function(done) {
      sessionPool.spliceSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        done();
      };

      sessionPool.destroySession_(fakeSession);
    });

    it('should emit an empty event if empty', function(done) {
      sessionPool.available = function() {
        return false;
      };

      sessionPool.on('empty', done);
      sessionPool.destroySession_(fakeSession);
    });

    describe('refilling', function() {
      beforeEach(function() {
        sessionPool.isOpen = true;
        sessionPool.needsFill_ = function() {
          return true;
        };
      });

      it('should create a new session', function(done) {
        sessionPool.fill = done;
        sessionPool.destroySession_(fakeSession);
      });

      it('should not create a session if the pool is closed', function() {
        sessionPool.fill = function() {
          throw new Error('Should not be called.');
        };

        sessionPool.isOpen = false;
        sessionPool.destroySession_(fakeSession);
      });

      it('should not create if the pool has min sessions', function() {
        sessionPool.fill = function() {
          throw new Error('Should not be called.');
        };

        sessionPool.needsFill_ = function() {
          return false;
        };

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

      sessionPool.size = function() {
        return fakeSessions.length;
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

      var fakeReads = (sessionPool.reads_ = [
        {lastUsed: Date.now()},
        {lastUsed: idleTimestamp},
      ]);

      var fakeWrites = (sessionPool.writes_ = [{lastUsed: idleTimestamp}]);

      var expectedSessions = [fakeReads[1], fakeWrites[0]];
      var idleSessions = sessionPool.getIdleSessions_();

      assert.deepEqual(idleSessions, expectedSessions);
    });
  });

  describe('getNextAvailableSession_', function() {
    it('should return a read session if the type is readonly', function() {
      var fakeSession = {};

      sessionPool.reads_ = [fakeSession];

      var borrowCalled = false;
      sessionPool.borrowSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        borrowCalled = true;
      };
      return sessionPool
        .getNextAvailableSession_('readonly')
        .then(function(session) {
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(borrowCalled, true);
        });
    });

    it('should return a write session if no reads are available', function() {
      var fakeSession = {};

      sessionPool.writes_ = [fakeSession];

      var borrowCalled = false;
      sessionPool.borrowSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        borrowCalled = true;
      };

      return sessionPool
        .getNextAvailableSession_('readonly')
        .then(function(session) {
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(borrowCalled, true);
        });
    });

    it('should return a write session for read/write', function() {
      var fakeSession = {};

      sessionPool.writes_ = [fakeSession];

      var borrowCalled = false;
      sessionPool.borrowSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        borrowCalled = true;
      };
      return sessionPool
        .getNextAvailableSession_('readwrite')
        .then(function(session) {
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(borrowCalled, true);
        });
    });

    it('should transform a read to a readwrite if need be', function() {
      var fakeSession = {};

      sessionPool.reads_ = [fakeSession];

      var borrowCalled = false;
      sessionPool.borrowSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        borrowCalled = true;
      };

      var transformed = false;
      var fakePromise = Promise.resolve();
      sessionPool.createTransaction_ = function(session) {
        assert.strictEqual(session, fakeSession);
        transformed = true;
        return fakePromise;
      };

      sessionPool.race_ = function(promise) {
        assert.strictEqual(promise, fakePromise);
        return fakePromise;
      };

      return sessionPool
        .getNextAvailableSession_('readwrite')
        .then(function(session) {
          assert.strictEqual(transformed, true);
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(borrowCalled, true);
        });
    });

    it('should release the session if an error occurs converting', function() {
      var fakeSession = {};

      sessionPool.reads_ = [fakeSession];

      var fakeError = new Error('err');
      sessionPool.createTransaction_ = function() {
        return Promise.reject(fakeError);
      };

      var released = false;
      sessionPool.release_ = function(session) {
        assert.strictEqual(session, fakeSession);
        released = true;
      };

      var borrowCalled = false;
      sessionPool.borrowSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        borrowCalled = true;
      };

      sessionPool.race_ = function(promise) {
        return promise;
      };

      return sessionPool.getNextAvailableSession_('readwrite').then(
        function() {
          throw new Error('Should not be called.');
        },
        function(err) {
          assert.strictEqual(err, fakeError);
          assert.strictEqual(released, true);
          assert.strictEqual(borrowCalled, true);
        }
      );
    });
  });

  describe('getSession_', function() {
    it('should return a session if one is available', function() {
      var fakeType = 'readwrite';
      var fakeSession = {};

      sessionPool.acquireQueue_ = {size: 0};
      sessionPool.available = function() {
        return 1;
      };

      sessionPool.getNextAvailableSession_ = function(type) {
        assert.strictEqual(type, fakeType);
        return Promise.resolve(fakeSession);
      };

      return sessionPool.getSession_(fakeType).then(function(session) {
        assert.strictEqual(session, fakeSession);
      });
    });

    describe('when none are available', function() {
      beforeEach(function() {
        sessionPool.available = function() {
          return 0;
        };
      });

      it('should fail if set and none are available', function() {
        sessionPool.options.fail = true;
        sessionPool.acquireQueue_ = {size: 1};

        return sessionPool.getSession_().then(
          function() {
            throw new Error('Should not be called.');
          },
          function(err) {
            assert(err instanceof Error);
            assert.strictEqual(err.message, 'No resources available.');
          }
        );
      });

      it('should wait for the next available session', function() {
        var fakeType = 'readwrite';
        var fakeSession = {};

        var fakePromise = Promise.resolve(fakeSession);
        sessionPool.waitForNextAvailable_ = function(type) {
          assert.strictEqual(type, fakeType);
          return fakePromise;
        };

        sessionPool.isFull = function() {
          return true;
        };

        sessionPool.race_ = function(promises) {
          assert.deepEqual(promises, [fakePromise]);
          return fakePromise;
        };

        return sessionPool.getSession_(fakeType).then(function(session) {
          assert.strictEqual(session, fakeSession);
        });
      });

      it('should create a session if there is room', function() {
        var fakeType = 'readwrite';
        var fakeSession = {};

        sessionPool.isFull = function() {
          return false;
        };

        sessionPool.createSession_ = function(type) {
          assert.strictEqual(type, fakeType);
          sessionPool.writes_ = [fakeSession];
          return Promise.resolve();
        };

        return sessionPool.getSession_(fakeType).then(function(session) {
          assert.strictEqual(session, fakeSession);
        });
      });

      it('should not create unneeded sessions', function() {
        var fakeSession = {};

        sessionPool.acquireQueue_ = {size: 1};
        sessionPool.pendingCreates_ = 2;

        sessionPool.waitForNextAvailable_ = function() {
          return Promise.resolve(fakeSession);
        };

        sessionPool.isFull = function() {
          return false;
        };

        sessionPool.createSession_ = function() {
          throw new Error('Should not be called.');
        };

        sessionPool.race_ = function(promises) {
          assert.strictEqual(promises.length, 1);
          return promises[0];
        };

        return sessionPool.getSession_().then(function(session) {
          assert.strictEqual(session, fakeSession);
        });
      });
    });
  });

  describe('getSessionGroup_', function() {
    it('should get the read group for readonly sessions', function() {
      var fakeSession = {type: 'readonly'};
      var group = sessionPool.getSessionGroup_(fakeSession);

      assert.strictEqual(group, sessionPool.reads_);
    });

    it('should get the writes group for readwrite sessions', function() {
      var fakeSession = {type: 'readwrite'};
      var group = sessionPool.getSessionGroup_(fakeSession);

      assert.strictEqual(group, sessionPool.writes_);
    });
  });

  describe('needsFill_', function() {
    it('should return true if pool is under min value', function() {
      sessionPool.options.min = 8;
      sessionPool.pendingCreates_ = 0;
      sessionPool.size = function() {
        return 7;
      };

      assert.strictEqual(sessionPool.needsFill_(), true);
    });

    it('should return false if it is at or above min value', function() {
      sessionPool.options.min = 8;
      sessionPool.pendingCreates_ = 3;
      sessionPool.size = function() {
        return 5;
      };

      assert.strictEqual(sessionPool.needsFill_(), false);
    });
  });

  describe('onAvailable_', function() {
    it('should resolve right away if there are available sessions', function() {
      var end = timeSpan();

      sessionPool.available = function() {
        return 1;
      };

      return sessionPool.onAvailable_().then(function() {
        assert(isAround(0, end()));
      });
    });

    it('should settle once the available event fires', function() {
      var delay = 500;
      var end = timeSpan();

      sessionPool.available = function() {
        return 0;
      };

      setTimeout(function() {
        sessionPool.emit('available');
      }, delay);

      return sessionPool.onAvailable_().then(function() {
        assert(isAround(delay, end()));
      });
    });
  });

  describe('pingIdleSessions_', function() {
    var fakeSessions = [{}, {}];

    beforeEach(function() {
      sessionPool.getIdleSessions_ = function() {
        return fakeSessions;
      };
    });

    it('should ping all the idle sessions', function() {
      var pingCalls = 0;

      sessionPool.pingSession_ = function(session) {
        assert.strictEqual(session, fakeSessions[pingCalls++]);
        return Promise.resolve();
      };

      return sessionPool.pingIdleSessions_().then(function() {
        assert.strictEqual(pingCalls, fakeSessions.length);
      });
    });

    it('should refill the pool if necessary', function(done) {
      sessionPool.pingSession_ = function() {
        return Promise.resolve();
      };

      sessionPool.needsFill_ = function() {
        return true;
      };

      sessionPool.fill = done;
      sessionPool.pingIdleSessions_();
    });
  });

  describe('pingSession_', function() {
    beforeEach(function() {
      sessionPool.borrowSession_ = function() {};
    });

    it('should keep alive sessions', function() {
      var keptAlive = false;
      var fakeSession = {
        keepAlive: function() {
          keptAlive = true;
          return Promise.resolve();
        },
      };

      var borrowed = false;
      sessionPool.borrowSession_ = function(session) {
        assert.strictEqual(session, fakeSession);
        borrowed = true;
      };

      var released = false;
      sessionPool.release = function(session) {
        assert.strictEqual(session, fakeSession);
        released = true;
      };

      return sessionPool.pingSession_(fakeSession).then(function() {
        assert.strictEqual(borrowed, true);
        assert.strictEqual(keptAlive, true);
        assert.strictEqual(released, true);
      });
    });

    it('should emit and ignore errors', function() {
      var fakeError = new Error('err');

      var fakeSession = {
        keepAlive: function() {
          return Promise.reject(fakeError);
        },
      };

      var emitted = false;
      sessionPool.on('error', function(err) {
        assert.strictEqual(err, fakeError);
        emitted = true;
      });

      var released = false;
      sessionPool.release = function(session) {
        assert.strictEqual(session, fakeSession);
        released = true;
      };

      return sessionPool.pingSession_(fakeSession).then(function() {
        assert.strictEqual(emitted, true);
        assert.strictEqual(released, true);
      });
    });

    it('should not release not found sessions', function() {
      var fakeError = {code: 404};
      var fakeSession = {
        keepAlive: function() {
          return Promise.reject(fakeError);
        },
      };

      var emitted = false;
      sessionPool.on('error', function(err) {
        assert.strictEqual(err, fakeError);
        emitted = true;
      });

      var released = false;
      sessionPool.release = function() {
        released = true;
      };

      sessionPool.borrowed_ = [fakeSession];

      return sessionPool.pingSession_(fakeSession).then(function() {
        assert.strictEqual(emitted, true);
        assert.strictEqual(released, true);
      });
    });
  });

  describe('race_', function() {
    beforeEach(function() {
      sessionPool.onClose_ = new Promise(function(resolve) {
        sessionPool.once('close', resolve);
      });
    });

    it('should resolve in a perfect world', function() {
      var fakeData = {};

      return sessionPool.race_(Promise.resolve(fakeData)).then(function(data) {
        assert.strictEqual(data, fakeData);
      });
    });

    it('should fail if the pool closes', function() {
      sessionPool.onClose_ = Promise.resolve();

      return sessionPool.race_(delay(500)).then(
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

      return sessionPool.race_(delay(100)).then(
        function() {
          throw new Error('Should not be called.');
        },
        function(err) {
          assert.strictEqual(err.message, 'Timed out acquiring session.');
        }
      );
    });
  });

  describe('release_', function() {
    it('should release the session', function(done) {
      var fakeSession = {};
      var fakeGroup = [];

      sessionPool.borrowed_ = [fakeSession];
      sessionPool.getSessionGroup_ = function(session) {
        assert.strictEqual(session, fakeSession);
        return fakeGroup;
      };

      sessionPool.on('available', function() {
        assert.deepEqual(fakeGroup, [fakeSession]);
        assert.deepEqual(sessionPool.borrowed_, []);
        done();
      });

      sessionPool.release_(fakeSession);
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
      assert(isAround(session.lastUsed, Date.now()));
    });
  });

  describe('spliceSession_', function() {
    it('should remove the session from the right group', function() {
      var fakeSession = {};
      var fakeGroup = [fakeSession];

      sessionPool.getSessionGroup_ = function(session) {
        assert.strictEqual(session, fakeSession);
        return fakeGroup;
      };

      sessionPool.spliceSession_(fakeSession);
      assert.deepEqual(fakeGroup, []);
    });

    it('should not remove sessions unnecessarily', function() {
      var fakeSession = {};
      var fakeGroup = [{}];

      sessionPool.getSessionGroup_ = function() {
        return fakeGroup;
      };

      sessionPool.spliceSession_(fakeSession);
      assert.strictEqual(fakeGroup.length, 1);
    });
  });

  describe('startHouseKeeping_', function() {
    var _setInterval;

    function FakeTimer() {
      this.called = false;
    }

    FakeTimer.prototype.unref = function() {
      this.called = true;
    };

    before(function() {
      _setInterval = global.setInterval;
    });

    after(function() {
      global.setInterval = _setInterval;
    });

    beforeEach(function() {
      global.setInterval = function() {
        return new FakeTimer();
      };
    });

    it('should start the intervals on available', function() {
      sessionPool.startHouseKeeping_();
      sessionPool.emit('available');

      assert(sessionPool.pingHandle_ instanceof FakeTimer);
      assert(sessionPool.evictHandle_ instanceof FakeTimer);
    });

    it('should unref the intervals', function() {
      global.setInterval = function() {
        return new FakeTimer();
      };

      sessionPool.startHouseKeeping_();
      sessionPool.emit('available');

      assert.strictEqual(sessionPool.pingHandle_.called, true);
      assert.strictEqual(sessionPool.evictHandle_.called, true);
    });

    it('should call pingIdleSessions_', function(done) {
      var callCount = 0;

      sessionPool.pingIdleSessions_ = done;

      global.setInterval = function(cb, speed) {
        if (++callCount === 1) {
          assert.strictEqual(speed, sessionPool.options.keepAlive * 60000);
          cb();
        }

        return new FakeTimer();
      };

      sessionPool.startHouseKeeping_();
      sessionPool.emit('available');
    });

    it('should call evictIdleSession_', function(done) {
      var callCount = 0;

      sessionPool.evictIdleSessions_ = done;

      global.setInterval = function(cb, speed) {
        if (++callCount === 2) {
          assert.strictEqual(speed, sessionPool.options.idlesAfter * 60000);
          cb();
        }

        return new FakeTimer();
      };

      sessionPool.startHouseKeeping_();
      sessionPool.emit('available');
    });

    it('should listen for the pool to become empty', function(done) {
      sessionPool.stopHouseKeeping_ = function() {
        assert.strictEqual(sessionPool.listenerCount('available'), 1);
        done();
      };

      sessionPool.startHouseKeeping_();
      sessionPool.emit('available');

      assert.strictEqual(sessionPool.listenerCount('available'), 0);

      sessionPool.emit('empty');
    });

    it('should remove all listeners on close', function() {
      sessionPool.startHouseKeeping_();
      assert.strictEqual(sessionPool.listenerCount('available'), 1);

      sessionPool.emit('close');

      assert.strictEqual(sessionPool.listenerCount('available'), 0);
      assert.strictEqual(sessionPool.listenerCount('empty'), 0);
    });
  });

  describe('stopHouseKeeping_', function() {
    var _clearInterval;

    before(function() {
      _clearInterval = global.clearInterval;
    });

    after(function() {
      global.clearInterval = _clearInterval;
    });

    it('should clear the intervals', function() {
      sessionPool.pingHandle_ = 1;
      sessionPool.evictHandle_ = 2;

      var calls = 0;
      global.clearInterval = function(handle) {
        assert.strictEqual(handle, ++calls);
      };

      sessionPool.stopHouseKeeping_();
      assert.strictEqual(calls, 2);
    });
  });

  describe('waitForNextAvailable_', function() {
    it('should queue an acquire request', function() {
      var fakeType = 'readwrite';
      var fakeSession = {};

      var queued = false;
      sessionPool.acquireQueue_ = {
        add: function(fn) {
          queued = true;
          return fn();
        },
      };

      var available = false;
      sessionPool.onAvailable_ = function() {
        assert.strictEqual(queued, true);
        available = true;
        return Promise.resolve();
      };

      sessionPool.getNextAvailableSession_ = function(type) {
        assert.strictEqual(available, true);
        assert.strictEqual(type, fakeType);
        return fakeSession;
      };

      return sessionPool
        .waitForNextAvailable_(fakeType)
        .then(function(session) {
          assert.strictEqual(session, fakeSession);
        });
    });
  });

  function isAround(expected, actual) {
    return actual > expected - 10 && actual < expected + 50;
  }
});
