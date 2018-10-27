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

import * as assert from 'assert';
import * as events from 'events';
import * as extend from 'extend';
import * as PQueue from 'p-queue';
import * as proxyquire from 'proxyquire';
import * as stackTrace from 'stack-trace';
import * as timeSpan from 'time-span';

let pQueueOverride: any = null;

function FakePQueue(options) {
  return new (pQueueOverride || PQueue)(options);
}

class FakeTransaction {
  options;
  constructor(options?) {
    this.options = options;
  }
  begin() {
    return Promise.resolve([this]);
  }
}

class FakeSession {
  created;
  deleted;
  keptAlive;
  createOptions;
  txn?;
  lastUsed?;
  type?;
  id?;
  constructor() {
    this.created = false;
    this.deleted = false;
    this.keptAlive = false;
  }
  beginTransaction(options) {
    return new FakeTransaction(options).begin();
  }
  create(options) {
    this.created = true;
    this.createOptions = options;
    return Promise.resolve();
  }
  delete() {
    this.deleted = true;
    return Promise.resolve();
  }
  keepAlive() {
    this.keptAlive = true;
    return Promise.resolve();
  }
}

const fakeStackTrace = extend({}, stackTrace);

function noop() {}

describe('SessionPool', () => {
  let sessionPool;
  let SessionPool;

  const DATABASE: any = {};

  before(() => {
    SessionPool = proxyquire('../src/session-pool.js', {
      'p-queue': FakePQueue,
      'stack-trace': fakeStackTrace,
    });
  });

  beforeEach(() => {
    DATABASE.session = () => new FakeSession();
    sessionPool = new SessionPool(DATABASE);
  });

  afterEach(() => {
    pQueueOverride = null;
  });

  describe('formatTrace', () => {
    const fakeFileName = 'path/to/file.js';
    const fakeLineNumber = '99';
    const fakeColumnNumber = '13';
    const file = `${fakeFileName}:${fakeLineNumber}:${fakeColumnNumber}`;

    let fakeFunction;
    let fakeMethod;

    const fakeTrace = [
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

    it('should return a trace with the method name', () => {
      fakeMethod = 'MyClass.myMethod';

      const expected = `Session leak detected!\n    at ${fakeMethod} (${file})`;
      const actual = SessionPool.formatTrace(fakeTrace);

      assert.strictEqual(expected, actual);
    });

    it('should return a trace with the function name', () => {
      fakeFunction = 'myFunction';

      const expected = `Session leak detected!\n    at ${fakeFunction} (${file})`;
      const actual = SessionPool.formatTrace(fakeTrace);

      assert.strictEqual(expected, actual);
    });
  });

  describe('available', () => {
    it('should return the number of available sessions', () => {
      sessionPool._inventory = {
        readonly: [{}],
        readwrite: [{}, {}],
      };

      assert.strictEqual(sessionPool.available, 3);
    });
  });

  describe('borrowed', () => {
    it('should return the number of borrowed sessions', () => {
      sessionPool._inventory.borrowed = new Set([{}, {}]);

      assert.strictEqual(sessionPool.borrowed, 2);
    });
  });

  describe('isFull', () => {
    it('should indicate if the pool is full', () => {
      sessionPool.options.max = 1;

      assert.strictEqual(sessionPool.isFull, false);
      sessionPool._inventory.borrowed = new Set([{}]);
      assert.strictEqual(sessionPool.isFull, true);
    });
  });

  describe('reads', () => {
    it('should get the total number of read sessions', () => {
      sessionPool._inventory.readonly = [{}, {}, {}];
      assert.strictEqual(sessionPool.reads, 3);
    });

    it('should factor in borrowed sessions', () => {
      sessionPool.options.min = 4;

      return sessionPool
        .open()
        .then(() => {
          return sessionPool._acquire('readonly');
        })
        .then(() => {
          assert.strictEqual(sessionPool.reads, 4);
          assert.strictEqual(sessionPool.available, 3);
          assert.strictEqual(sessionPool.borrowed, 1);
        });
    });
  });

  describe('size', () => {
    it('should return the size of the pool', () => {
      sessionPool._inventory = {
        readonly: [{}],
        readwrite: [{}, {}],
        borrowed: new Set([{}]),
      };

      assert.strictEqual(sessionPool.size, 4);
    });
  });

  describe('writes', () => {
    it('should get the total number of read/write sessions', () => {
      sessionPool._inventory.readwrite = [{}, {}, {}];
      assert.strictEqual(sessionPool.writes, 3);
    });

    it('should factor in borrowed sessions', () => {
      sessionPool.options.min = 4;
      sessionPool.options.writes = 1;

      return sessionPool
        .open()
        .then(() => {
          return sessionPool._acquire('readwrite');
        })
        .then(() => {
          assert.strictEqual(sessionPool.writes, 4);
          assert.strictEqual(sessionPool.available, 3);
          assert.strictEqual(sessionPool.borrowed, 1);
        });
    });
  });

  describe('instantiation', () => {
    it('should localize the database instance', () => {
      assert.strictEqual(sessionPool.database, DATABASE);
    });

    describe('options', () => {
      it('should apply defaults', () => {
        assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
        assert.strictEqual(sessionPool.options.concurrency, Infinity);
        assert.strictEqual(sessionPool.options.fail, false);
        assert.strictEqual(sessionPool.options.idlesAfter, 10);
        assert.strictEqual(sessionPool.options.keepAlive, 30);
        assert.deepStrictEqual(sessionPool.options.labels, {});
        assert.strictEqual(sessionPool.options.max, 100);
        assert.strictEqual(sessionPool.options.maxIdle, 1);
        assert.strictEqual(sessionPool.options.min, 0);
        assert.strictEqual(sessionPool.options.writes, 0);
      });

      it('should not override user options', () => {
        sessionPool = new SessionPool(DATABASE, {acquireTimeout: 0});
        assert.strictEqual(sessionPool.options.acquireTimeout, 0);
      });

      describe('writes', () => {
        const writeErrReg = /Write percentage should be represented as a float between 0\.0 and 1\.0\./;

        it('should throw when writes is less than 0', () => {
          assert.throws(() => {
            return new SessionPool(DATABASE, {writes: -1});
          }, writeErrReg);
        });

        it('should throw when writes is greater than 1', () => {
          assert.throws(() => {
            return new SessionPool(DATABASE, {writes: 50});
          }, writeErrReg);
        });
      });
    });

    it('should set isOpen to false', () => {
      assert.strictEqual(sessionPool.isOpen, false);
    });

    it('should create an inventory object', () => {
      assert.deepStrictEqual(sessionPool._inventory, {
        readonly: [],
        readwrite: [],
        borrowed: new Set(),
      });
    });

    it('should create a request queue', () => {
      const poolOptions = {
        concurrency: 11,
      };

      pQueueOverride = function(options) {
        return options;
      };

      sessionPool = new SessionPool(DATABASE, poolOptions);
      assert.deepStrictEqual(sessionPool._requests, {
        concurrency: poolOptions.concurrency,
      });
    });

    it('should create an acquire queue', () => {
      pQueueOverride = function(options) {
        return options;
      };

      sessionPool = new SessionPool(DATABASE);
      assert.deepStrictEqual(sessionPool._acquires, {
        concurrency: 1,
      });
    });

    it('should create a map of traces', () => {
      assert.deepStrictEqual(sessionPool._traces, new Map());
    });

    it('should inherit from EventEmitter', () => {
      assert(sessionPool instanceof events.EventEmitter);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      sessionPool._inventory = {
        readonly: [{}, {}],
        readwrite: [{}],
        borrowed: new Set([{}, {}]),
      };

      sessionPool._destroy = noop;
    });

    it('should clear the inventory', () => {
      sessionPool.close(noop);
      assert.strictEqual(sessionPool.size, 0);
    });

    it('should stop housekeeping', done => {
      sessionPool._stopHouseKeeping = done;
      sessionPool.close(noop);
    });

    it('should set isOpen to false', () => {
      sessionPool.isOpen = true;
      sessionPool.close(noop);

      assert.strictEqual(sessionPool.isOpen, false);
    });

    it('should emit the close event', done => {
      sessionPool.on('close', done);
      sessionPool.close(noop);
    });

    it('should destroy all the sessions', () => {
      const sessions = [].concat(
        sessionPool._inventory.readonly,
        sessionPool._inventory.readwrite,
        Array.from(sessionPool._inventory.borrowed)
      );

      let destroyed = 0;

      sessionPool._destroy = function(session) {
        assert.strictEqual(session, sessions[destroyed++]);
      };

      sessionPool.close(noop);
      assert.strictEqual(destroyed, sessions.length);
    });

    it('should execute the callback on idle', done => {
      let idleCalled = false;

      sessionPool._requests.onIdle = function() {
        idleCalled = true;
        return Promise.resolve();
      };

      sessionPool.close(err => {
        assert.ifError(err);
        assert.strictEqual(idleCalled, true);
        done();
      });
    });

    it('should return a leak error', done => {
      const fakeLeaks = [{}, {}];

      sessionPool._getLeaks = function() {
        return fakeLeaks;
      };

      sessionPool.close(err => {
        assert.strictEqual(
          err.message,
          `${fakeLeaks.length} session leak(s) detected.`
        );
        assert.strictEqual(err.messages, fakeLeaks);
        done();
      });
    });
  });

  describe('getReadSession', () => {
    it('should acquire a read session', done => {
      const fakeSession = new FakeSession();

      sessionPool._acquire = function(type) {
        assert.strictEqual(type, 'readonly');
        return Promise.resolve(fakeSession);
      };

      sessionPool.getReadSession((err, session) => {
        assert.ifError(err);
        assert.strictEqual(session, fakeSession);
        done();
      });
    });

    it('should pass any errors to the callback', done => {
      const error = new Error('err');

      sessionPool._acquire = function() {
        return Promise.reject(error);
      };

      sessionPool.getReadSession(err => {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('getWriteSession', () => {
    it('should pass back the session and txn', done => {
      const fakeSession = new FakeSession();
      const fakeTxn = new FakeTransaction();

      fakeSession.txn = fakeTxn;

      sessionPool._acquire = function(type) {
        assert.strictEqual(type, 'readwrite');
        return Promise.resolve(fakeSession);
      };

      sessionPool.getWriteSession((err, session, txn) => {
        assert.ifError(err);
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(txn, fakeTxn);
        done();
      });
    });

    it('should pass any errors to the callback', done => {
      const error = new Error('err');

      sessionPool._acquire = function() {
        return Promise.reject(error);
      };

      sessionPool.getWriteSession(err => {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('open', () => {
    beforeEach(() => {
      sessionPool._stopHouseKeeping = noop;
      sessionPool._fill = noop;
    });

    it('should create an onclose promise', () => {
      sessionPool.open();

      assert(sessionPool._onClose instanceof Promise);
      setImmediate(() => sessionPool.emit('close'));
      return sessionPool._onClose;
    });

    it('should start housekeeping', done => {
      sessionPool._startHouseKeeping = done;
      sessionPool.open();
    });

    it('should set isOpen to true', () => {
      sessionPool.open();
      assert.strictEqual(sessionPool.isOpen, true);
    });

    it('should emit the open event', done => {
      sessionPool.on('open', done);
      sessionPool.open();
    });

    it('should fill the pool', () => {
      const fakeFillReturn = {};

      sessionPool._fill = function() {
        return Promise.resolve(fakeFillReturn);
      };

      return sessionPool.open().then(obj => {
        assert.strictEqual(obj, fakeFillReturn);
      });
    });
  });

  describe('release', () => {
    beforeEach(() => {
      sessionPool._prepareTransaction = function() {
        return Promise.resolve();
      };
    });

    it('should throw an error when returning unknown resources', () => {
      const badResource = {};

      try {
        sessionPool.release(badResource);
        throw new Error('Should not have made it this far.');
      } catch (e) {
        assert.strictEqual(e.message, 'Unable to release unknown resource.');
        assert.strictEqual(e.resource, badResource);
      }
    });

    it('should delete any old transactions', () => {
      const session = new FakeSession();

      sessionPool._release = noop;
      sessionPool._inventory.borrowed.add(session);
      session.txn = {};

      sessionPool.release(session);
      assert.strictEqual(session.txn, undefined);
    });

    it('should update the lastUsed timestamp', () => {
      const session = new FakeSession();

      sessionPool._release = noop;
      sessionPool._inventory.borrowed.add(session);
      session.lastUsed = null;

      sessionPool.release(session);
      assert(isAround(session.lastUsed, Date.now()));
    });

    describe('readonly', () => {
      it('should release readonly sessions', done => {
        const fakeSession = new FakeSession();

        sessionPool._prepareTransaction = shouldNotBeCalled;

        sessionPool._release = function(session) {
          assert.strictEqual(session, fakeSession);
          done();
        };

        fakeSession.type = 'readonly';
        sessionPool._inventory.borrowed.add(fakeSession);
        sessionPool.release(fakeSession);
      });
    });

    describe('readwrite', () => {
      let fakeSession;

      beforeEach(() => {
        fakeSession = new FakeSession();
        fakeSession.type = 'readwrite';
        sessionPool._inventory.borrowed.add(fakeSession);
      });

      it('should prep a new transaction', done => {
        sessionPool._prepareTransaction = function(session) {
          assert.strictEqual(session, fakeSession);
          setImmediate(done);
          return Promise.resolve();
        };

        sessionPool._release = noop;
        sessionPool.release(fakeSession);
      });

      it('should release the read/write session', done => {
        sessionPool._prepareTransaction = function() {
          return Promise.resolve();
        };

        sessionPool._release = function(session) {
          assert.strictEqual(session, fakeSession);
          done();
        };

        sessionPool.release(fakeSession);
      });

      it('should convert to a read session if txn fails', done => {
        sessionPool._prepareTransaction = function() {
          return Promise.reject();
        };

        sessionPool._release = function(session) {
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(session.type, 'readonly');
          done();
        };

        sessionPool.release(fakeSession);
      });
    });
  });

  describe('_acquire', () => {
    beforeEach(() => {
      sessionPool.isOpen = true;
      sessionPool._isValidSession = () => true;
    });

    it('should return a closed error if not open', () => {
      sessionPool.isOpen = false;

      return sessionPool._acquire().then(shouldNotBeCalled, err => {
        assert.strictEqual(err.message, 'Database is closed.');
      });
    });

    it('should return a timeout error if a timeout happens', () => {
      sessionPool.options.acquireTimeout = 1;

      sessionPool._acquires.add = function(fn) {
        return new Promise(r => setTimeout(r, 2)).then(fn);
      };

      return sessionPool._acquire().then(shouldNotBeCalled, err => {
        assert.strictEqual(
          err.message,
          'Timeout occurred while acquiring session.'
        );
      });
    });

    it('should return a session', () => {
      const fakeSession = new FakeSession();
      const fakeType = 'readonly';
      const now = Date.now();

      sessionPool._getSession = function(type, startTime) {
        assert.strictEqual(type, fakeType);
        assert(isAround(startTime, now));
        return Promise.resolve(fakeSession);
      };

      return sessionPool._acquire(fakeType).then(session => {
        assert.strictEqual(session, fakeSession);
      });
    });

    it('should drop expired sessions', () => {
      const badSession = new FakeSession();
      const goodSession = new FakeSession();
      const fakeSessions = [badSession, goodSession];

      sessionPool._isValidSession = function(session) {
        return session === goodSession;
      };

      sessionPool._getSession = function() {
        return Promise.resolve(fakeSessions.shift());
      };

      sessionPool._inventory.borrowed = new Set(fakeSessions);

      return sessionPool._acquire('readonly').then(session => {
        assert.strictEqual(session, goodSession);
        assert.strictEqual(sessionPool.size, 1);
      });
    });

    it('should capture the stack trace', () => {
      const id = 'abc';
      const fakeSession = new FakeSession();

      fakeSession.id = id;

      sessionPool._getSession = function() {
        return Promise.resolve(fakeSession);
      };

      const fakeTrace = {};

      (fakeStackTrace as any).get = function() {
        return fakeTrace;
      };

      return sessionPool._acquire('readonly').then(() => {
        const trace = sessionPool._traces.get(id);
        assert.strictEqual(trace, fakeTrace);
      });
    });

    it('should convert read sessions to write sessions', () => {
      const fakeSession = new FakeSession();
      const convertedSession = new FakeSession();

      sessionPool._getSession = function() {
        return Promise.resolve(fakeSession);
      };

      sessionPool._convertSession = function(session) {
        assert.strictEqual(session, fakeSession);
        return convertedSession;
      };

      return sessionPool._acquire('readwrite').then(session => {
        assert.strictEqual(session, convertedSession);
      });
    });
  });

  describe('_borrow', () => {
    it('should mark the session as borrowed', () => {
      const fakeSession = new FakeSession();
      const inv = sessionPool._inventory;

      fakeSession.type = 'readonly';
      inv.readonly.push(fakeSession);

      sessionPool._borrow(fakeSession);

      assert.strictEqual(inv.readonly.indexOf(fakeSession), -1);
      assert(inv.borrowed.has(fakeSession));
    });
  });

  describe('_borrowFrom', () => {
    it('should borrow the first available type', () => {
      const fakeSession = new FakeSession();
      let borrowed = false;

      sessionPool._inventory.readonly.push(fakeSession, new FakeSession());

      sessionPool._borrow = function(session) {
        assert.strictEqual(session, fakeSession);
        borrowed = true;
      };

      const session = sessionPool._borrowFrom('readonly');

      assert.strictEqual(session, fakeSession);
      assert.strictEqual(borrowed, true);
    });
  });

  describe('_borrowNextAvailableSession', () => {
    it('should borrow from readonly when available', () => {
      const fakeSession = new FakeSession();

      sessionPool._inventory.readonly.push(fakeSession);

      sessionPool._borrowFrom = function(type) {
        assert.strictEqual(type, 'readonly');
        return fakeSession;
      };

      const session = sessionPool._borrowNextAvailableSession('readonly');

      assert.strictEqual(session, fakeSession);
    });

    it('should borrow from readwrites when available', () => {
      const fakeSession = new FakeSession();

      sessionPool._inventory.readwrite.push(fakeSession);

      sessionPool._borrowFrom = function(type) {
        assert.strictEqual(type, 'readwrite');
        return fakeSession;
      };

      const session = sessionPool._borrowNextAvailableSession('readwrite');

      assert.strictEqual(session, fakeSession);
    });

    it('should borrow from rw when readonly isnt available', () => {
      const fakeSession = new FakeSession();

      sessionPool._inventory.readwrite.push(fakeSession);

      sessionPool._borrowFrom = function(type) {
        assert.strictEqual(type, 'readwrite');
        return fakeSession;
      };

      const session = sessionPool._borrowNextAvailableSession('readonly');

      assert.strictEqual(session, fakeSession);
    });

    it('should borrow from readonly when rw isnt available', () => {
      const fakeSession = new FakeSession();

      sessionPool._inventory.readonly.push(fakeSession);

      sessionPool._borrowFrom = function(type) {
        assert.strictEqual(type, 'readonly');
        return fakeSession;
      };

      const session = sessionPool._borrowNextAvailableSession('readwrite');

      assert.strictEqual(session, fakeSession);
    });
  });

  describe('_convertSession', () => {
    it('should prepare a transaction', () => {
      const fakeSession = new FakeSession();

      let prepared = false;

      sessionPool._prepareTransaction = function(session) {
        assert.strictEqual(session, fakeSession);
        prepared = true;
        return Promise.resolve();
      };

      return sessionPool._convertSession(fakeSession).then(session => {
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(prepared, true);
      });
    });

    it('should release the session if it fails', () => {
      const fakeSession = new FakeSession();
      const error = new Error('err');

      let released = false;

      sessionPool._release = function(session) {
        assert.strictEqual(session, fakeSession);
        released = true;
      };

      sessionPool._prepareTransaction = function() {
        return Promise.reject(error);
      };

      return sessionPool
        ._convertSession(fakeSession)
        .then(shouldNotBeCalled, err => {
          assert.strictEqual(err, error);
          assert.strictEqual(released, true);
        });
    });
  });

  describe('_createSession', () => {
    it('should put the session into a borrowed state', () => {
      sessionPool._requests.add = () => Promise.resolve();
      sessionPool._createSession('readonly');

      assert.strictEqual(sessionPool.borrowed, 1);
    });

    it('should create the session', () => {
      return sessionPool._createSession('readonly').then(() => {
        const session = sessionPool._inventory.readonly[0];
        assert.strictEqual(session.created, true);
      });
    });

    it('should pass along the session labels', () => {
      const labels = {a: 'b'};

      sessionPool.options.labels = labels;

      return sessionPool._createSession('readonly').then(() => {
        const session = sessionPool._inventory.readonly[0];
        assert.deepStrictEqual(session.createOptions, {labels});
      });
    });

    it('should discard the session if unable to create', () => {
      const error = new Error('err');

      class BadFakeSession extends FakeSession {
        create() {
          return Promise.reject(error);
        }
      }

      DATABASE.session = function() {
        return new BadFakeSession();
      };

      return sessionPool._createSession().then(shouldNotBeCalled, err => {
        assert.strictEqual(err, error);
        assert.strictEqual(sessionPool.borrowed, 0);
        assert.strictEqual(sessionPool.available, 0);
      });
    });

    it('should prepare a transaction for readwrite sessions', () => {
      let prepared = false;

      sessionPool._prepareTransaction = function(session) {
        assert(session instanceof FakeSession);
        prepared = true;
        return Promise.resolve();
      };

      return sessionPool._createSession('readwrite').then(() => {
        assert.strictEqual(sessionPool.writes, 1);
        assert.strictEqual(prepared, true);
      });
    });

    it('should convert rw to readonly if unable to prepare txn', () => {
      sessionPool._prepareTransaction = function() {
        return Promise.reject(new Error('err'));
      };

      return sessionPool._createSession('readwrite').then(() => {
        assert.strictEqual(sessionPool.reads, 1);
        assert.strictEqual(sessionPool.writes, 0);
      });
    });

    it('should update the session state', () => {
      return sessionPool._createSession('readonly').then(() => {
        const session = sessionPool._inventory.readonly[0];

        assert.strictEqual(session.type, 'readonly');
        assert(isAround(session.lastUsed, Date.now()));

        assert.strictEqual(sessionPool.borrowed, 0);
        assert.strictEqual(sessionPool.available, 1);
      });
    });
  });

  describe('_createSessionInBackground', () => {
    it('should emit available on success', done => {
      sessionPool._createSession = function(type) {
        assert.strictEqual(type, 'readonly');
        return Promise.resolve();
      };

      sessionPool.on('available', done);
      sessionPool._createSessionInBackground('readonly');
    });

    it('should emit error on error', done => {
      const error = new Error('err');

      sessionPool._createSession = function() {
        return Promise.reject(error);
      };

      sessionPool.on('error', err => {
        assert.strictEqual(err, error);
        done();
      });

      sessionPool._createSessionInBackground();
    });
  });

  describe('_destroy', () => {
    it('should delete the session', () => {
      const fakeSession = new FakeSession();

      return sessionPool._destroy(fakeSession).then(() => {
        assert.strictEqual(fakeSession.deleted, true);
      });
    });

    it('should emit any errors', done => {
      const error = new Error('err');
      const fakeSession = {
        delete: () => Promise.reject(error),
      };

      sessionPool.on('error', err => {
        assert.strictEqual(err, error);
        done();
      });

      sessionPool._destroy(fakeSession);
    });
  });

  describe('_evictIdleSessions', () => {
    let fakeSessions;

    beforeEach(() => {
      fakeSessions = [
        {type: 'readonly'},
        {type: 'readwrite'},
        {type: 'readwrite'},
      ];

      sessionPool.options.maxIdle = 0;
      sessionPool.options.min = 0;
      sessionPool._inventory.readonly = fakeSessions.slice();

      sessionPool._getIdleSessions = function() {
        return fakeSessions.slice();
      };
    });

    it('should evict the sessions', () => {
      let destroyCallCount = 0;

      sessionPool._destroy = function(session) {
        const fakeSessionIndex = fakeSessions.length - ++destroyCallCount;
        const fakeSession = fakeSessions[fakeSessionIndex];

        assert.strictEqual(session, fakeSession);
      };

      sessionPool._evictIdleSessions();
      assert.strictEqual(destroyCallCount, fakeSessions.length);
    });

    it('should respect the maxIdle option', () => {
      let destroyCallCount = 0;

      sessionPool._destroy = function(session) {
        const fakeSessionIndex = fakeSessions.length - ++destroyCallCount;
        const fakeSession = fakeSessions[fakeSessionIndex];

        assert.strictEqual(session, fakeSession);
      };

      sessionPool.options.maxIdle = fakeSessions.length - 1;

      sessionPool._evictIdleSessions();
      assert.strictEqual(destroyCallCount, 1);
    });

    it('should respect the min value', () => {
      let destroyCallCount = 0;

      sessionPool._destroy = function(session) {
        const fakeSessionIndex = fakeSessions.length - ++destroyCallCount;
        const fakeSession = fakeSessions[fakeSessionIndex];

        assert.strictEqual(session, fakeSession);
      };

      sessionPool.options.min = fakeSessions.length - 2;

      sessionPool._evictIdleSessions();
      assert.strictEqual(destroyCallCount, 2);
    });
  });

  describe('_fill', () => {
    let created;

    beforeEach(() => {
      sessionPool.options.min = 8;

      created = {
        readonly: 0,
        readwrite: 0,
      };

      sessionPool._createSessionInBackground = function(type) {
        created[type] += 1;
      };
    });

    it('should create the min number of required sessions', () => {
      sessionPool._fill();

      assert.strictEqual(created.readonly, 8);
      assert.strictEqual(created.readwrite, 0);
    });

    it('should create the min number of write sessions', () => {
      sessionPool.options.writes = 0.5;
      sessionPool._fill();

      assert.strictEqual(created.readonly, 4);
      assert.strictEqual(created.readwrite, 4);
    });

    it('should respect the current size of the pool', () => {
      sessionPool.options.writes = 0.5;
      sessionPool._inventory = {
        readonly: [{}],
        readwrite: [{}, {}],
        borrowed: new Set(),
      };

      sessionPool._fill();

      assert.strictEqual(created.readonly, 3);
      assert.strictEqual(created.readwrite, 2);
    });

    it('should settle once all the sessions are created', () => {
      const end = timeSpan();

      sessionPool._createSessionInBackground = function() {
        return new Promise(resolve => {
          setTimeout(resolve, 500);
        });
      };

      return sessionPool._fill().then(() => {
        assert(isAround(500, end()));
      });
    });
  });

  describe('_getIdleSessions', () => {
    it('should return a list of idle sessions', () => {
      const idlesAfter = (sessionPool.options.idlesAfter = 1); // 1 minute
      const idleTimestamp = Date.now() - idlesAfter * 60000;

      const fakeReads = (sessionPool._inventory.readonly = [
        {lastUsed: Date.now()},
        {lastUsed: idleTimestamp},
      ]);

      const fakeWrites = (sessionPool._inventory.readwrite = [
        {lastUsed: idleTimestamp},
      ]);

      const expectedSessions = [fakeReads[1], fakeWrites[0]];
      const idleSessions = sessionPool._getIdleSessions();

      assert.deepStrictEqual(idleSessions, expectedSessions);
    });
  });

  describe('_getLeaks', () => {
    it('should return an array of leaks', () => {
      sessionPool._traces.set('a', 'aaa');
      sessionPool._traces.set('b', 'bbb');

      const values = Array.from(sessionPool._traces.values());
      const formatted = ['ccc', 'ddd'];

      let formatCalls = 0;

      SessionPool.formatTrace = function(log) {
        assert.strictEqual(log, values[formatCalls]);
        return formatted[formatCalls++];
      };

      const leaks = sessionPool._getLeaks();

      assert.deepStrictEqual(leaks, formatted);
    });
  });

  describe('_getSession', () => {
    beforeEach(() => {
      sessionPool._onClose = new Promise(resolve => {
        sessionPool.on('close', resolve);
      });
      sessionPool.options.max = 0;
    });

    it('should return a session if one is available', () => {
      const fakeSession = new FakeSession();

      sessionPool._inventory.readonly = [fakeSession];

      sessionPool._borrowNextAvailableSession = function(type) {
        assert.strictEqual(type, 'readonly');
        return fakeSession;
      };

      return sessionPool._getSession('readonly').then(session => {
        assert.strictEqual(session, fakeSession);
      });
    });

    it('should return an error if empty and fail = true', () => {
      sessionPool.options.fail = true;

      return sessionPool._getSession().then(shouldNotBeCalled, err => {
        assert.strictEqual(err.message, 'No resources available.');
      });
    });

    it('should throw a closed error if the pool closes', () => {
      setTimeout(() => sessionPool.emit('close'), 100);

      return sessionPool._getSession().then(shouldNotBeCalled, err => {
        assert.strictEqual(err.message, 'Database is closed.');
      });
    });

    it('should return a session when it becomes available', () => {
      const fakeSession = new FakeSession();

      sessionPool._borrowNextAvailableSession = function(type) {
        assert.strictEqual(type, 'readonly');
        return fakeSession;
      };

      setTimeout(() => sessionPool.emit('available'), 100);

      return sessionPool._getSession('readonly').then(session => {
        assert.strictEqual(session, fakeSession);
      });
    });

    it('should use the acquireTimeout if set', () => {
      const end = timeSpan();
      const timeout = (sessionPool.options.acquireTimeout = 100);

      return sessionPool
        ._getSession('readonly', Date.now())
        .then(shouldNotBeCalled, err => {
          assert(isAround(timeout, end()));
          assert.strictEqual(
            err.message,
            'Timeout occurred while acquiring session.'
          );
        });
    });

    it('should create a session if the pool is not full', () => {
      const fakeSession = new FakeSession();

      sessionPool.options.max = 1;

      let created = false;

      sessionPool._createSession = function(type) {
        assert.strictEqual(type, 'readonly');
        created = true;
        return Promise.resolve();
      };

      sessionPool._borrowNextAvailableSession = function() {
        return fakeSession;
      };

      return sessionPool._getSession('readonly').then(session => {
        assert.strictEqual(created, true);
        assert.strictEqual(session, fakeSession);
      });
    });

    it('should return any create errors', () => {
      const error = new Error('err');

      sessionPool.options.max = 1;

      sessionPool._createSession = function() {
        return Promise.reject(error);
      };

      return sessionPool._getSession().then(shouldNotBeCalled, err => {
        assert.strictEqual(err, error);
      });
    });

    it('should remove the available listener on error', () => {
      sessionPool.options.acquireTimeout = 100;

      const promise = sessionPool._getSession('readonly');

      assert.strictEqual(sessionPool.listenerCount('available'), 1);

      return promise.then(shouldNotBeCalled, () => {
        assert.strictEqual(sessionPool.listenerCount('available'), 0);
      });
    });
  });

  describe('_isValidSession', () => {
    it('should return true if the session is good', () => {
      const fakeSession = {lastUsed: Date.now()};
      const isValid = sessionPool._isValidSession(fakeSession);

      assert.strictEqual(isValid, true);
    });

    it('should return true if the session has gone bad', () => {
      const fakeSession = {lastUsed: Date.now() - 61 * 60000};
      const isValid = sessionPool._isValidSession(fakeSession);

      assert.strictEqual(isValid, false);
    });
  });

  describe('_ping', () => {
    beforeEach(() => {
      sessionPool._borrow = function(session) {
        sessionPool._inventory.borrowed.add(session);
      };
    });

    it('should borrow the session', () => {
      const fakeSession = new FakeSession();

      sessionPool._borrow = function(session) {
        assert.strictEqual(session, fakeSession);
      };

      sessionPool._ping(fakeSession);
    });

    it('should discard it if expired', () => {
      const fakeSession = new FakeSession();

      fakeSession.lastUsed = Date.now() - 61 * 60000;

      return sessionPool._ping(fakeSession).then(() => {
        const inPool = sessionPool._inventory.borrowed.has(fakeSession);

        assert.strictEqual(inPool, false);
        assert.strictEqual(fakeSession.keptAlive, false);
      });
    });

    it('should keep alive the session then release it', () => {
      const fakeSession = new FakeSession();

      fakeSession.lastUsed = Date.now();

      let released = false;

      sessionPool.release = function(session) {
        assert.strictEqual(session, fakeSession);
        released = true;
      };

      return sessionPool._ping(fakeSession).then(() => {
        assert.strictEqual(fakeSession.keptAlive, true);
        assert.strictEqual(released, true);
      });
    });

    it('should destroy the session if the ping fails', () => {
      const fakeSession = new FakeSession();

      fakeSession.lastUsed = Date.now();
      fakeSession.keepAlive = () => Promise.reject();
      sessionPool.release = shouldNotBeCalled;

      let destroyed = false;

      sessionPool._destroy = function(session) {
        assert.strictEqual(session, fakeSession);
        destroyed = true;
      };

      return sessionPool._ping(fakeSession).then(() => {
        const inPool = sessionPool._inventory.borrowed.has(fakeSession);

        assert.strictEqual(inPool, false);
        assert.strictEqual(destroyed, true);
      });
    });
  });

  describe('_pingIdleSessions', () => {
    it('should ping each idle session', () => {
      const fakeSessions = [{}, {}, {}];

      sessionPool._getIdleSessions = function() {
        return fakeSessions;
      };

      let pingCalls = 0;

      sessionPool._ping = function(session) {
        assert.strictEqual(session, fakeSessions[pingCalls++]);
        return Promise.resolve();
      };

      sessionPool._fill = noop;

      return sessionPool._pingIdleSessions().then(() => {
        assert.strictEqual(pingCalls, 3);
      });
    });

    it('should fill the pool after pinging', () => {
      let filled = false;

      sessionPool._fill = function() {
        filled = true;
      };

      sessionPool._getIdleSessions = function() {
        return [];
      };

      return sessionPool._pingIdleSessions().then(() => {
        assert.strictEqual(filled, true);
      });
    });
  });

  describe('_prepareTransaction', () => {
    it('should prepare a transaction', () => {
      const fakeSession = new FakeSession();
      const options = {};

      return sessionPool._prepareTransaction(fakeSession, options).then(() => {
        assert(fakeSession.txn instanceof FakeTransaction);
        assert.strictEqual(fakeSession.txn.options, options);
      });
    });
  });

  describe('_release', () => {
    it('should release the session', () => {
      const inv = sessionPool._inventory;
      const fakeSession = {type: 'readonly'};

      inv.borrowed.add(fakeSession);
      sessionPool._release(fakeSession);

      assert.strictEqual(inv.borrowed.has(fakeSession), false);
      assert.strictEqual(inv.readonly.indexOf(fakeSession), 0);
    });

    it('should delete any stack traces', () => {
      const id = 'abc';
      const fakeSession = {type: 'readonly', id};

      sessionPool._traces.set(id, 'def');
      sessionPool._release(fakeSession);

      assert.strictEqual(sessionPool._traces.has(id), false);
    });

    it('should emit the available event', done => {
      const fakeSession = {type: 'readonly'};

      sessionPool.on('available', done);
      sessionPool._release(fakeSession);
    });
  });

  describe('_startHouseKeeping', () => {
    let _setInterval;

    before(() => {
      _setInterval = global.setInterval;
    });

    afterEach(() => {
      global.setInterval = _setInterval;
    });

    it('should set an interval to evict idle sessions', done => {
      const callIndex = 0;
      const expectedInterval = sessionPool.options.idlesAfter * 60000;

      let intervalCalls = 0;
      let unreffed = false;

      const fakeHandle = {
        unref: function() {
          unreffed = true;
        },
      };

      (global as any).setInterval = function(fn, interval) {
        if (intervalCalls++ !== callIndex) {
          return {unref: noop};
        }

        assert.strictEqual(interval, expectedInterval);
        setImmediate(fn);
        return fakeHandle;
      };

      sessionPool._evictIdleSessions = function() {
        assert.strictEqual(sessionPool._evictHandle, fakeHandle);
        assert.strictEqual(unreffed, true);
        done();
      };

      sessionPool._startHouseKeeping();
    });

    it('should set an interval to ping sessions', done => {
      const callIndex = 1;
      const expectedInterval = sessionPool.options.keepAlive * 60000;

      let intervalCalls = 0;
      let unreffed = false;

      const fakeHandle = {
        unref: function() {
          unreffed = true;
        },
      };

      (global as any).setInterval = function(fn, interval) {
        if (intervalCalls++ !== callIndex) {
          return {unref: noop};
        }

        assert.strictEqual(interval, expectedInterval);
        setImmediate(fn);
        return fakeHandle;
      };

      sessionPool._pingIdleSessions = function() {
        assert.strictEqual(sessionPool._pingHandle, fakeHandle);
        assert.strictEqual(unreffed, true);
        done();
      };

      sessionPool._startHouseKeeping();
    });
  });

  describe('_stopHouseKeeping', () => {
    let _clearInterval;

    before(() => {
      _clearInterval = global.clearInterval;
    });

    afterEach(() => {
      global.clearInterval = _clearInterval;
    });

    it('should clear the intervals', () => {
      sessionPool._pingHandle = 'a';
      sessionPool._evictHandle = 'b';

      const fakeHandles = [sessionPool._pingHandle, sessionPool._evictHandle];

      let clearCalls = 0;

      global.clearInterval = function(handle) {
        assert.strictEqual(handle, fakeHandles[clearCalls++]);
      };

      sessionPool._stopHouseKeeping();
      assert.strictEqual(clearCalls, 2);
    });
  });
});

function isAround(actual, expected) {
  return actual > expected - 50 && actual < expected + 50;
}

function shouldNotBeCalled() {
  throw new Error('Should not be called.');
}
