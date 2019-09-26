/*!
 * Copyright 2017, Google, LLC.
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

import * as assert from 'assert';
import * as events from 'events';
import * as extend from 'extend';
import PQueue from 'p-queue';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import stackTrace = require('stack-trace');
import timeSpan from 'time-span';

import {Database} from '../src/database';
import {Session, types} from '../src/session';
import * as sp from '../src/session-pool';
import {Transaction} from '../src/transaction';
import {util} from '@google-cloud/common-grpc';

let pQueueOverride: typeof PQueue | null = null;

function FakePQueue(options) {
  return new (pQueueOverride || PQueue)(options);
}

FakePQueue.default = FakePQueue;

class FakeTransaction {
  options;
  constructor(options?) {
    this.options = options;
  }
  async begin(): Promise<void> {}
}

const fakeStackTrace = extend({}, stackTrace);

function noop() {}

describe('SessionPool', () => {
  let sessionPool: sp.SessionPool;
  // tslint:disable-next-line variable-name
  let SessionPool: typeof sp.SessionPool;
  let inventory;

  const DATABASE = ({batchCreateSessions: noop} as unknown) as Database;
  const sandbox = sinon.createSandbox();
  const shouldNotBeCalled = sandbox.stub().throws('Should not be called.');

  const createSession = (name = 'id', props?): Session => {
    props = props || {};

    if (!props.type) {
      props.type = types.ReadOnly;
    }

    return Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
      delete: sandbox.stub().resolves(),
      keepAlive: sandbox.stub().resolves(),
      transaction: sandbox.stub().returns(new FakeTransaction()),
    });
  };

  const createStackFrame = (): stackTrace.StackFrame => {
    return {
      getFunctionName: sandbox.stub().returns('myFunction'),
      getMethodName: sandbox.stub().returns('MyClass.myMethod'),
      getFileName: sandbox.stub().returns('path/to/file.js'),
      getLineNumber: sandbox.stub().returns('99'),
      getColumnNumber: sandbox.stub().returns('13'),
      getTypeName: sandbox.stub().returns('type'),
      isNative: sandbox.stub().returns(false),
    };
  };

  before(() => {
    SessionPool = proxyquire('../src/session-pool.js', {
      'p-queue': FakePQueue,
      'stack-trace': fakeStackTrace,
    }).SessionPool;
  });

  beforeEach(() => {
    DATABASE.session = createSession;
    sessionPool = new SessionPool(DATABASE);
    inventory = sessionPool._inventory;
  });

  afterEach(() => {
    pQueueOverride = null;
    sandbox.restore();
  });

  describe('formatTrace', () => {
    let stackFrame: stackTrace.StackFrame;
    let fakeTrace: stackTrace.StackFrame[];
    let file: string;

    beforeEach(() => {
      stackFrame = createStackFrame();
      fakeTrace = [stackFrame];
      file = `${stackFrame.getFileName()}:${stackFrame.getLineNumber()}:${stackFrame.getColumnNumber()}`;
    });

    it('should return a trace with the method name', () => {
      (stackFrame.getFunctionName as sinon.SinonStub).returns(undefined);

      const expected = `Session leak detected!\n    at ${stackFrame.getMethodName()} (${file})`;
      const actual = SessionPool.formatTrace(fakeTrace);

      assert.strictEqual(expected, actual);
    });

    it('should return a trace with the function name', () => {
      (stackFrame.getMethodName as sinon.SinonStub).returns(undefined);

      const expected = `Session leak detected!\n    at ${stackFrame.getFunctionName()} (${file})`;
      const actual = SessionPool.formatTrace(fakeTrace);

      assert.strictEqual(expected, actual);
    });
  });

  describe('available', () => {
    it('should return the number of available sessions', () => {
      inventory[types.ReadOnly] = [createSession()];
      inventory[types.ReadWrite] = [createSession(), createSession()];

      assert.strictEqual(sessionPool.available, 3);
    });
  });

  describe('borrowed', () => {
    beforeEach(() => {
      inventory.borrowed = new Set([createSession(), createSession()]);
    });

    it('should return the number of borrowed sessions', () => {
      assert.strictEqual(sessionPool.borrowed, 2);
    });

    it('should factor in any creation pending sessions', () => {
      sessionPool._pending = 1;
      assert.strictEqual(sessionPool.borrowed, 3);
    });
  });

  describe('isFull', () => {
    it('should indicate if the pool is full', () => {
      sessionPool.options.max = 1;

      assert.strictEqual(sessionPool.isFull, false);
      inventory.borrowed = new Set([createSession()]);
      assert.strictEqual(sessionPool.isFull, true);
    });
  });

  describe('reads', () => {
    beforeEach(() => {
      sessionPool.options.min = 3;

      inventory[types.ReadOnly] = [
        createSession(),
        createSession(),
        createSession(),
      ];
    });

    it('should get the total number of read sessions', () => {
      assert.strictEqual(sessionPool.reads, 3);
    });

    it('should factor in borrowed sessions', () => {
      inventory.borrowed.add(createSession());

      assert.strictEqual(sessionPool.reads, 4);
      assert.strictEqual(sessionPool.available, 3);
      assert.strictEqual(sessionPool.borrowed, 1);
    });
  });

  describe('size', () => {
    it('should return the size of the pool', () => {
      inventory[types.ReadOnly] = [createSession()];
      inventory[types.ReadWrite] = [createSession(), createSession()];
      inventory.borrowed = new Set([createSession()]);

      assert.strictEqual(sessionPool.size, 4);
    });
  });

  describe('writes', () => {
    beforeEach(() => {
      inventory[types.ReadWrite] = [
        createSession(),
        createSession(),
        createSession(),
      ];
    });

    it('should get the total number of read/write sessions', () => {
      assert.strictEqual(sessionPool.writes, 3);
    });

    it('should factor in borrowed sessions', () => {
      const session = createSession('id', {type: types.ReadWrite});

      inventory.borrowed.add(session);

      assert.strictEqual(sessionPool.writes, 4);
      assert.strictEqual(sessionPool.available, 3);
      assert.strictEqual(sessionPool.borrowed, 1);
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
      assert.deepStrictEqual(inventory, {
        readonly: [],
        readwrite: [],
        borrowed: new Set(),
      });
    });

    it('should create a request queue', () => {
      const poolOptions = {
        concurrency: 11,
      };

      pQueueOverride = class {
        constructor(options) {
          return options;
        }
      } as typeof PQueue;

      sessionPool = new SessionPool(DATABASE, poolOptions);
      assert.deepStrictEqual(sessionPool._requests, {
        concurrency: poolOptions.concurrency,
      });
    });

    it('should create an acquire queue', () => {
      pQueueOverride = class {
        constructor(options) {
          return options;
        }
      } as typeof PQueue;

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
      inventory[types.ReadOnly] = [createSession(), createSession()];
      inventory[types.ReadWrite] = [createSession()];
      inventory.borrowed = new Set([createSession(), createSession()]);
      sessionPool._destroy = sandbox.stub().resolves();
    });

    it('should clear the inventory', done => {
      sessionPool.close(() => {
        assert.strictEqual(sessionPool.size, 0);
        done();
      });
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

    it('should destroy all the sessions', done => {
      const sessions = [
        ...inventory[types.ReadOnly],
        ...inventory[types.ReadWrite],
        ...inventory.borrowed,
      ];

      let destroyed = 0;

      sessionPool._destroy = async session => {
        assert.strictEqual(session, sessions[destroyed++]);
      };

      sessionPool.close(err => {
        assert.ifError(err);
        assert.strictEqual(destroyed, sessions.length);
        done();
      });
    });

    it('should execute the callback on idle', done => {
      const stub = sandbox.stub(sessionPool._requests, 'onIdle').resolves();

      sessionPool.close(err => {
        assert.ifError(err);
        assert.strictEqual(stub.callCount, 1);
        done();
      });
    });

    it('should return a leak error', done => {
      const fakeLeaks = ['a', 'b'];

      sandbox.stub(sessionPool, '_getLeaks').returns(fakeLeaks);

      sessionPool.close((err?: sp.SessionLeakError) => {
        assert.strictEqual(
          err!.message,
          `${fakeLeaks.length} session leak(s) detected.`
        );
        assert.strictEqual(err!.messages, fakeLeaks);
        done();
      });
    });
  });

  describe('getReadSession', () => {
    it('should acquire a read session', done => {
      const fakeSession = createSession();

      sandbox
        .stub(sessionPool, '_acquire')
        .withArgs(types.ReadOnly)
        .resolves(fakeSession);

      sessionPool.getReadSession((err, session) => {
        assert.ifError(err);
        assert.strictEqual(session, fakeSession);
        done();
      });
    });

    it('should pass any errors to the callback', done => {
      const error = new Error('err');

      sandbox.stub(sessionPool, '_acquire').rejects(error);

      sessionPool.getReadSession(err => {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('getWriteSession', () => {
    it('should pass back the session and txn', done => {
      const fakeTxn = (new FakeTransaction() as unknown) as Transaction;
      const fakeSession = createSession();

      fakeSession.txn = fakeTxn;

      sandbox
        .stub(sessionPool, '_acquire')
        .withArgs(types.ReadWrite)
        .resolves(fakeSession);

      sessionPool.getWriteSession((err, session, txn) => {
        assert.ifError(err);
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(txn, fakeTxn);
        done();
      });
    });

    it('should pass any errors to the callback', done => {
      const error = new Error('err');

      sandbox.stub(sessionPool, '_acquire').rejects(error);

      sessionPool.getWriteSession(err => {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('open', () => {
    let fillStub: sinon.SinonStub<[], Promise<void>>;

    beforeEach(() => {
      sessionPool._stopHouseKeeping = sandbox.stub();
      fillStub = sandbox.stub(sessionPool, '_fill').resolves();
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
      sessionPool.open();
      assert.strictEqual(fillStub.callCount, 1);
    });
  });

  describe('release', () => {
    let prepStub: sinon.SinonStub<[Session], Promise<void>>;

    beforeEach(() => {
      prepStub = sandbox.stub(sessionPool, '_prepareTransaction').resolves();
    });

    it('should throw an error when returning unknown resources', () => {
      const badResource = createSession();

      try {
        sessionPool.release(badResource);
        shouldNotBeCalled();
      } catch (e) {
        assert.strictEqual(e.message, 'Unable to release unknown resource.');
        assert.strictEqual((e as sp.ReleaseError).resource, badResource);
      }
    });

    it('should delete any old transactions', () => {
      const session = createSession();

      sessionPool._release = noop;
      inventory.borrowed.add(session);
      session.txn = {} as Transaction;

      sessionPool.release(session);
      assert.strictEqual(session.txn, undefined);
    });

    it('should update the lastUsed timestamp', () => {
      const session = createSession();

      sessionPool._release = noop;
      inventory.borrowed.add(session);
      session.lastUsed = null!;

      sessionPool.release(session);
      assert(isAround(session.lastUsed, Date.now()));
    });

    describe('reads', () => {
      it('should release readonly sessions', done => {
        const fakeSession = createSession('id', {type: types.ReadOnly});

        prepStub.rejects();
        sandbox
          .stub(sessionPool, '_release')
          .withArgs(fakeSession)
          .callsFake(() => done());

        inventory.borrowed.add(fakeSession);
        sessionPool.release(fakeSession);
      });
    });

    describe('readwrite', () => {
      let fakeSession;

      beforeEach(() => {
        fakeSession = createSession('id', {type: types.ReadWrite});
        inventory.borrowed.add(fakeSession);
      });

      it('should prep a new transaction', done => {
        sandbox.stub(sessionPool, '_release');
        prepStub.withArgs(fakeSession).callsFake(async () => done());

        sessionPool.release(fakeSession);
      });

      it('should release the read/write session', done => {
        prepStub.resolves();
        sandbox
          .stub(sessionPool, '_release')
          .withArgs(fakeSession)
          .callsFake(() => done());

        sessionPool.release(fakeSession);
      });

      it('should convert to a read session if txn fails', done => {
        const stub = sandbox.stub(sessionPool, '_release').callsFake(() => {
          const session = stub.getCall(0).args[0];
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(session.type, types.ReadOnly);
          done();
        });

        prepStub.rejects();
        sessionPool.release(fakeSession);
      });
    });
  });

  describe('_acquire', () => {
    beforeEach(() => {
      sessionPool.isOpen = true;
      sessionPool._isValidSession = () => true;
    });

    it('should return a closed error if not open', async () => {
      sessionPool.isOpen = false;

      try {
        await sessionPool._acquire(types.ReadOnly);
        shouldNotBeCalled();
      } catch (e) {
        assert.strictEqual(e.message, 'Database is closed.');
      }
    });

    it('should return a timeout error if a timeout happens', async () => {
      sessionPool.options.acquireTimeout = 1;

      sessionPool._acquires.add = fn => {
        return new Promise(r => setTimeout(r, 2)).then(fn);
      };

      try {
        await sessionPool._acquire(types.ReadOnly);
        shouldNotBeCalled();
      } catch (e) {
        assert.strictEqual(
          e.message,
          'Timeout occurred while acquiring session.'
        );
      }
    });

    it('should return a session', async () => {
      const fakeSession = createSession();
      const now = Date.now();

      const stub = sandbox
        .stub(sessionPool, '_getSession')
        .resolves(fakeSession);
      const session = await sessionPool._acquire(types.ReadOnly);
      const [type, startTime] = stub.getCall(0).args;

      assert.strictEqual(type, types.ReadOnly);
      assert(isAround(startTime, now));
      assert.strictEqual(session, fakeSession);
    });

    it('should drop expired sessions', async () => {
      const badSession = createSession();
      const goodSession = createSession();

      sessionPool._isValidSession = session => session === goodSession;
      inventory.borrowed.add(badSession);
      inventory.borrowed.add(goodSession);

      const stub = sandbox.stub(sessionPool, '_getSession');

      stub.onFirstCall().resolves(badSession);
      stub.onSecondCall().resolves(goodSession);

      const session = await sessionPool._acquire(types.ReadOnly);

      assert.strictEqual(session, goodSession);
      assert.strictEqual(sessionPool.size, 1);
    });

    it('should capture the stack trace', async () => {
      const id = 'abc';
      const fakeSession = createSession();
      const fakeTrace = [];

      fakeSession.id = id;
      sandbox.stub(sessionPool, '_getSession').resolves(fakeSession);
      sandbox.stub(fakeStackTrace, 'get').returns(fakeTrace);

      await sessionPool._acquire(types.ReadOnly);

      const trace = sessionPool._traces.get(id);
      assert.strictEqual(trace, fakeTrace);
    });

    it('should convert read sessions to write sessions', async () => {
      const fakeSession = createSession('id', {id: types.ReadOnly});

      sandbox.stub(sessionPool, '_getSession').resolves(fakeSession);
      const prepStub = sandbox
        .stub(sessionPool, '_prepareTransaction')
        .withArgs(fakeSession);

      const session = await sessionPool._acquire(types.ReadWrite);

      assert.strictEqual(session, fakeSession);
      assert.strictEqual(prepStub.callCount, 1);
    });

    it('should propagate error from `_prepareTransaction`', done => {
      const fakeSession = createSession('id', {id: types.ReadOnly});
      const fakeError = new Error('err');

      sandbox.stub(sessionPool, '_getSession').resolves(fakeSession);
      sandbox
        .stub(sessionPool, '_prepareTransaction')
        .withArgs(fakeSession)
        .rejects(fakeError);

      sessionPool._acquire(types.ReadWrite).then(util.noop, err => {
        assert.deepStrictEqual(err, fakeError);
        done();
      });
    });
  });

  describe('_borrow', () => {
    it('should mark the session as borrowed', () => {
      const fakeSession = createSession();

      fakeSession.type = types.ReadOnly;
      inventory[types.ReadOnly].push(fakeSession);

      sessionPool._borrow(fakeSession);

      assert.strictEqual(inventory[types.ReadOnly].indexOf(fakeSession), -1);
      assert(inventory.borrowed.has(fakeSession));
    });
  });

  describe('_borrowFrom', () => {
    it('should borrow the first available type', () => {
      const fakeSession = createSession();
      const stub = sandbox.stub(sessionPool, '_borrow').withArgs(fakeSession);

      inventory[types.ReadOnly].push(fakeSession, createSession());

      const session = sessionPool._borrowFrom(types.ReadOnly);
      assert.strictEqual(session, fakeSession);
      assert.strictEqual(stub.callCount, 1);
    });
  });

  describe('_borrowNextAvailableSession', () => {
    it('should borrow from readonly when available', () => {
      const fakeSession = createSession();

      inventory[types.ReadOnly].push(fakeSession);
      sandbox
        .stub(sessionPool, '_borrowFrom')
        .withArgs(types.ReadOnly)
        .returns(fakeSession);

      const session = sessionPool._borrowNextAvailableSession(types.ReadOnly);

      assert.strictEqual(session, fakeSession);
    });

    it('should borrow from readwrites when available', () => {
      const fakeSession = createSession();

      inventory[types.ReadWrite].push(fakeSession);
      sandbox
        .stub(sessionPool, '_borrowFrom')
        .withArgs(types.ReadWrite)
        .returns(fakeSession);

      const session = sessionPool._borrowNextAvailableSession(types.ReadWrite);

      assert.strictEqual(session, fakeSession);
    });

    it('should borrow from rw when readonly isnt available', () => {
      const fakeSession = createSession();

      inventory[types.ReadWrite].push(fakeSession);
      sandbox
        .stub(sessionPool, '_borrowFrom')
        .withArgs(types.ReadWrite)
        .returns(fakeSession);

      const session = sessionPool._borrowNextAvailableSession(types.ReadOnly);

      assert.strictEqual(session, fakeSession);
    });

    it('should borrow from readonly when rw isnt available', () => {
      const fakeSession = createSession();

      inventory[types.ReadOnly].push(fakeSession);
      sandbox
        .stub(sessionPool, '_borrowFrom')
        .withArgs(types.ReadOnly)
        .returns(fakeSession);

      const session = sessionPool._borrowNextAvailableSession(types.ReadWrite);

      assert.strictEqual(session, fakeSession);
    });
  });

  describe('_createSession', () => {
    let stub: sinon.SinonStub<[sp.CreateSessionsOptions], Promise<void>>;

    beforeEach(() => {
      stub = sandbox.stub(sessionPool, '_createSessions').resolves();
    });

    it('should create a single read session', () => {
      sessionPool._createSession(types.ReadOnly);
      const [options] = stub.lastCall.args;
      assert.deepStrictEqual(options, {reads: 1});
    });

    it('should create a single write session', () => {
      sessionPool._createSession(types.ReadWrite);
      const [options] = stub.lastCall.args;
      assert.deepStrictEqual(options, {writes: 1});
    });
  });

  describe('_createSessions', () => {
    const OPTIONS = {reads: 1, writes: 2};
    const RESPONSE = [[{}, {}, {}]];

    let stub;
    let releaseStub;

    beforeEach(() => {
      stub = sandbox.stub(DATABASE, 'batchCreateSessions').resolves(RESPONSE);
      releaseStub = sandbox.stub(sessionPool, 'release');
    });

    it('should update the number of pending sessions', async () => {
      await sessionPool._createSessions(OPTIONS);
      assert.strictEqual(sessionPool.size, 3);
    });

    it('should create the appropriate number of sessions', async () => {
      await sessionPool._createSessions(OPTIONS);
      const [options] = stub.lastCall.args;
      assert.strictEqual(options.count, 3);
    });

    it('should pass the session labels', async () => {
      const labels = {foo: 'bar'};
      sessionPool.options.labels = labels;
      await sessionPool._createSessions(OPTIONS);
      const [options] = stub.lastCall.args;
      assert.strictEqual(options.labels, labels);
    });

    it('should make multiple requests if needed', async () => {
      stub.onCall(0).resolves([[{}, {}]]);
      stub.onCall(1).resolves([[{}]]);

      await sessionPool._createSessions(OPTIONS);

      assert.strictEqual(stub.callCount, 2);
      assert.strictEqual(sessionPool.size, 3);
    });

    it('should reject with any request errors', async () => {
      const error = new Error('err');
      stub.rejects(error);

      try {
        await sessionPool._createSessions(OPTIONS);
        throw new Error('Should not make it this far.');
      } catch (e) {
        assert.strictEqual(e, error);
      }
    });

    it('should add each session to the inventory', async () => {
      await sessionPool._createSessions(OPTIONS);
      assert.strictEqual(sessionPool.borrowed, 3);

      RESPONSE[0].forEach((fakeSession, i) => {
        const [session] = releaseStub.getCall(i).args;
        assert.strictEqual(session, fakeSession);
      });
    });

    it('should prepare the correct number of write sessions', async () => {
      await sessionPool._createSessions(OPTIONS);

      assert.strictEqual(sessionPool.reads, OPTIONS.reads);
      assert.strictEqual(sessionPool.writes, OPTIONS.writes);
    });
  });

  describe('_destroy', () => {
    it('should delete the session', async () => {
      const fakeSession = createSession();
      const stub = fakeSession.delete as sinon.SinonStub;

      await sessionPool._destroy(fakeSession);
      assert.strictEqual(stub.callCount, 1);
    });

    it('should emit any errors', done => {
      const error = new Error('err');
      const fakeSession = createSession();
      const stub = fakeSession.delete as sinon.SinonStub;

      stub.rejects(error);

      sessionPool.on('error', err => {
        assert.strictEqual(err, error);
        done();
      });

      sessionPool._destroy(fakeSession);
    });
  });

  describe('_evictIdleSessions', () => {
    let destroyStub: sinon.SinonStub<[Session], Promise<void>>;
    let fakeSessions;

    beforeEach(() => {
      const reads = [createSession('id', {type: types.ReadOnly})];
      const writes = [
        createSession('id', {type: types.ReadWrite}),
        createSession('id', {type: types.ReadWrite}),
      ];

      inventory[types.ReadOnly] = reads;
      inventory[types.ReadWrite] = writes;

      sessionPool.options.maxIdle = 0;
      sessionPool.options.min = 0;

      fakeSessions = [...reads, ...writes];

      sandbox
        .stub(sessionPool, '_getIdleSessions')
        .returns(fakeSessions.slice());

      fakeSessions.reverse();
      destroyStub = sandbox.stub(sessionPool, '_destroy').resolves();
    });

    it('should evict the sessions', () => {
      sessionPool._evictIdleSessions();

      assert.strictEqual(destroyStub.callCount, fakeSessions.length);

      fakeSessions.forEach((session, i) => {
        const destroyed = destroyStub.getCall(i).args[0];
        assert.strictEqual(destroyed, session);
      });
    });

    it('should respect the maxIdle option', () => {
      sessionPool.options.maxIdle = 2;
      sessionPool._evictIdleSessions();

      assert.strictEqual(destroyStub.callCount, 1);
      const destroyed = destroyStub.getCall(0).args[0];
      assert.strictEqual(destroyed, fakeSessions[0]);
    });

    it('should respect the min value', () => {
      sessionPool.options.min = 1;
      sessionPool._evictIdleSessions();

      assert.strictEqual(destroyStub.callCount, 2);

      fakeSessions.slice(0, 2).forEach((session, i) => {
        const destroyed = destroyStub.getCall(i).args[0];
        assert.strictEqual(destroyed, session);
      });
    });

    it('should not evict if the session is not there', () => {
      sandbox.restore();
      fakeSessions[1] = undefined;
      sandbox
        .stub(sessionPool, '_getIdleSessions')
        .returns(fakeSessions.slice());
      destroyStub = sandbox.stub(sessionPool, '_destroy').resolves();

      sessionPool._evictIdleSessions();

      assert.strictEqual(destroyStub.callCount, fakeSessions.length - 1);
    });
  });

  describe('_fill', () => {
    let stub: sinon.SinonStub<[sp.CreateSessionsOptions], Promise<void>>;

    beforeEach(() => {
      stub = sandbox.stub(sessionPool, '_createSessions');
      sessionPool.options.min = 8;
    });

    it('should create the min number of required sessions', () => {
      sessionPool._fill();

      const {reads, writes} = stub.lastCall.args[0];

      assert.strictEqual(reads, 8);
      assert.strictEqual(writes, 0);
    });

    it('should create the min number of write sessions', () => {
      sessionPool.options.writes = 0.5;
      sessionPool._fill();

      const {reads, writes} = stub.lastCall.args[0];

      assert.strictEqual(reads, 4);
      assert.strictEqual(writes, 4);
    });

    it('should respect the current size of the pool', () => {
      sessionPool.options.writes = 0.5;

      inventory[types.ReadOnly] = [createSession()];
      inventory[types.ReadWrite] = [createSession(), createSession()];

      sessionPool._fill();

      const {reads, writes} = stub.lastCall.args[0];

      assert.strictEqual(reads, 3);
      assert.strictEqual(writes, 2);
    });

    it('should noop when no sessions are needed', () => {
      sessionPool.options.min = 0;
      sessionPool._fill();

      assert.strictEqual(stub.callCount, 0);
    });

    it('should emit any request errors that occur', done => {
      const error = new Error('err');

      stub.rejects(error);

      sessionPool.once('error', err => {
        assert.strictEqual(err, error);
        done();
      });

      sessionPool._fill();
    });
  });

  describe('_getIdleSessions', () => {
    it('should return a list of idle sessions', () => {
      const idlesAfter = (sessionPool.options.idlesAfter = 1); // 1 minute
      const idleTimestamp = Date.now() - idlesAfter * 60000;

      const fakeReads = (inventory[types.ReadOnly] = [
        {lastUsed: Date.now()},
        {lastUsed: idleTimestamp},
      ]);

      const fakeWrites = (inventory[types.ReadWrite] = [
        {lastUsed: idleTimestamp},
      ]);

      const expectedSessions = [fakeReads[1], fakeWrites[0]];
      const idleSessions = sessionPool._getIdleSessions();

      assert.deepStrictEqual(idleSessions, expectedSessions);
    });
  });

  describe('_getLeaks', () => {
    it('should return an array of leaks', () => {
      const trace1 = [createStackFrame()];
      const trace2 = [createStackFrame(), createStackFrame()];

      const formatted1 = 'c';
      const formatted2 = 'd';

      const stub = sandbox.stub(SessionPool, 'formatTrace');

      stub.withArgs(trace1).returns(formatted1);
      stub.withArgs(trace2).returns(formatted2);

      sessionPool._traces.set('a', trace1);
      sessionPool._traces.set('b', trace2);

      const leaks = sessionPool._getLeaks();

      assert.deepStrictEqual(leaks, [formatted1, formatted2]);
    });
  });

  describe('_getSession', () => {
    let startTime: number;

    beforeEach(() => {
      sessionPool._onClose = new Promise(resolve => {
        sessionPool.on('close', resolve);
      });
      sessionPool.options.max = 0;
      startTime = Date.now();
    });

    it('should return a session if one is available', async () => {
      const fakeSession = createSession();

      inventory[types.ReadOnly] = [fakeSession];

      sandbox
        .stub(sessionPool, '_borrowNextAvailableSession')
        .withArgs(types.ReadOnly)
        .returns(fakeSession);

      const session = await sessionPool._getSession(types.ReadOnly, startTime);
      assert.strictEqual(session, fakeSession);
    });

    it('should return an error if empty and fail = true', async () => {
      sessionPool.options.fail = true;

      try {
        await sessionPool._getSession(types.ReadOnly, startTime);
        shouldNotBeCalled();
      } catch (e) {
        assert.strictEqual(e.message, 'No resources available.');
      }
    });

    it('should throw a closed error if the pool closes', async () => {
      setTimeout(() => sessionPool.emit('close'), 100);

      try {
        await sessionPool._getSession(types.ReadOnly, startTime);
        shouldNotBeCalled();
      } catch (e) {
        assert.strictEqual(e.message, 'Database is closed.');
      }
    });

    it('should return a session when it becomes available', async () => {
      const fakeSession = createSession();

      sandbox
        .stub(sessionPool, '_borrowNextAvailableSession')
        .withArgs(types.ReadOnly)
        .returns(fakeSession);
      setTimeout(() => sessionPool.emit('available'), 100);

      const session = await sessionPool._getSession(types.ReadOnly, startTime);
      assert.strictEqual(session, fakeSession);
    });

    it('should use the acquireTimeout if set', async () => {
      const end = timeSpan();
      const timeout = (sessionPool.options.acquireTimeout = 100);

      try {
        await sessionPool._getSession(types.ReadOnly, startTime);
        shouldNotBeCalled();
      } catch (e) {
        assert(isAround(timeout, end()));
        assert.strictEqual(
          e.message,
          'Timeout occurred while acquiring session.'
        );
      }
    });

    it('should create a session if the pool is not full', async () => {
      const fakeSession = createSession();
      const stub = sandbox
        .stub(sessionPool, '_createSession')
        .withArgs(types.ReadOnly)
        .callsFake(() => {
          // this will fire off via _createSessions
          setImmediate(() => sessionPool.emit('available'));
          return Promise.resolve();
        });

      sessionPool.options.max = 1;
      sandbox
        .stub(sessionPool, '_borrowNextAvailableSession')
        .returns(fakeSession);

      const session = await sessionPool._getSession(types.ReadOnly, startTime);

      assert.strictEqual(session, fakeSession);
      assert.strictEqual(stub.callCount, 1);
    });

    it('should return any create errors', async () => {
      const error = new Error('err');

      sessionPool.options.max = 1;
      sandbox.stub(sessionPool, '_createSession').rejects(error);

      try {
        await sessionPool._getSession(types.ReadOnly, startTime);
        shouldNotBeCalled();
      } catch (e) {
        assert.strictEqual(e, error);
      }
    });

    it('should remove the available listener on error', async () => {
      sessionPool.options.acquireTimeout = 100;

      const promise = sessionPool._getSession(types.ReadOnly, startTime);

      assert.strictEqual(sessionPool.listenerCount('available'), 1);

      try {
        await promise;
        shouldNotBeCalled();
      } catch (e) {
        assert.strictEqual(sessionPool.listenerCount('available'), 0);
      }
    });
  });

  describe('_isValidSession', () => {
    it('should return true if the session is good', () => {
      const fakeSession = createSession('id', {lastUsed: Date.now()});
      const isValid = sessionPool._isValidSession(fakeSession);

      assert.strictEqual(isValid, true);
    });

    it('should return true if the session has gone bad', () => {
      const fakeSession = createSession('id', {
        lastUsed: Date.now() - 61 * 60000,
      });
      const isValid = sessionPool._isValidSession(fakeSession);

      assert.strictEqual(isValid, false);
    });
  });

  describe('_ping', () => {
    beforeEach(() => {
      sandbox.stub(sessionPool, '_borrow');
    });

    it('should borrow the session', () => {
      const fakeSession = createSession();
      const stub = sessionPool._borrow as sinon.SinonStub;

      stub.withArgs(fakeSession);
      sessionPool._ping(fakeSession);

      assert.strictEqual(stub.callCount, 1);
    });

    it('should discard it if expired', async () => {
      const fakeSession = createSession();
      const keepAliveStub = fakeSession.keepAlive as sinon.SinonStub;

      inventory.borrowed.add(fakeSession);
      sandbox.stub(sessionPool, '_isValidSession').returns(false);
      await sessionPool._ping(fakeSession);

      const inPool = inventory.borrowed.has(fakeSession);

      assert.strictEqual(inPool, false);
      assert.strictEqual(keepAliveStub.callCount, 0);
    });

    it('should keep alive the session then release it', async () => {
      const fakeSession = createSession();
      const keepAliveStub = fakeSession.keepAlive as sinon.SinonStub;

      const releaseStub = sandbox
        .stub(sessionPool, 'release')
        .withArgs(fakeSession);
      sandbox.stub(sessionPool, '_isValidSession').returns(true);

      await sessionPool._ping(fakeSession);

      assert.strictEqual(keepAliveStub.callCount, 1);
      assert.strictEqual(releaseStub.callCount, 1);
    });

    it('should destroy the session if the ping fails', async () => {
      const fakeSession = createSession();
      const keepAliveStub = fakeSession.keepAlive as sinon.SinonStub;

      keepAliveStub.rejects();
      sandbox.stub(sessionPool, '_isValidSession').returns(true);

      const destroyStub = sandbox
        .stub(sessionPool, '_destroy')
        .withArgs(fakeSession)
        .resolves();

      await sessionPool._ping(fakeSession);

      const inPool = inventory.borrowed.has(fakeSession);

      assert.strictEqual(inPool, false);
      assert.strictEqual(destroyStub.callCount, 1);
    });
  });

  describe('_pingIdleSessions', () => {
    it('should ping each idle session', async () => {
      const fakeSessions = [createSession(), createSession(), createSession()];

      const pingStub = sandbox.stub(sessionPool, '_ping').resolves();
      sandbox.stub(sessionPool, '_getIdleSessions').returns(fakeSessions);
      sandbox.stub(sessionPool, '_fill').resolves();

      await sessionPool._pingIdleSessions();

      assert.strictEqual(pingStub.callCount, 3);

      fakeSessions.forEach((session, i) => {
        const pinged = pingStub.getCall(i).args[0];
        assert.strictEqual(pinged, session);
      });
    });

    it('should fill the pool after pinging', async () => {
      const fillStub = sandbox.stub(sessionPool, '_fill').resolves();

      sandbox.stub(sessionPool, '_getIdleSessions').returns([]);
      await sessionPool._pingIdleSessions();

      assert.strictEqual(fillStub.callCount, 1);
    });
  });

  describe('_prepareTransaction', () => {
    it('should prepare a transaction', async () => {
      const fakeSession = createSession();
      const fakeTransaction = new FakeTransaction();
      const beginStub = sandbox.stub(fakeTransaction, 'begin').resolves();

      fakeSession.transaction = sandbox.stub().returns(fakeTransaction);

      await sessionPool._prepareTransaction(fakeSession);

      assert.strictEqual(fakeSession.txn, fakeTransaction);
      assert.strictEqual(beginStub.callCount, 1);
    });
  });

  describe('_release', () => {
    it('should release the session', () => {
      const fakeSession = createSession('id', {type: types.ReadOnly});

      inventory.borrowed.add(fakeSession);
      sessionPool._release(fakeSession);

      assert.strictEqual(inventory.borrowed.has(fakeSession), false);
      assert.strictEqual(inventory[types.ReadOnly].indexOf(fakeSession), 0);
    });

    it('should delete any stack traces', () => {
      const id = 'abc';
      const fakeSession = createSession(id, {type: types.ReadOnly});

      sessionPool._traces.set(id, []);
      sessionPool._release(fakeSession);

      assert.strictEqual(sessionPool._traces.has(id), false);
    });

    it('should emit the available event', done => {
      const fakeSession = createSession('id', {type: types.ReadOnly});

      sessionPool.on('available', done);
      sessionPool._release(fakeSession);
    });
  });

  describe('_startHouseKeeping', () => {
    it('should set an interval to evict idle sessions', done => {
      const expectedInterval = sessionPool.options.idlesAfter! * 60000;
      const clock = sandbox.useFakeTimers();

      sandbox.stub(sessionPool, '_evictIdleSessions').callsFake(done);

      sessionPool._startHouseKeeping();
      clock.tick(expectedInterval);
    });

    it('should set an interval to ping sessions', done => {
      const expectedInterval = sessionPool.options.keepAlive! * 60000;
      const clock = sandbox.useFakeTimers();

      sandbox
        .stub(sessionPool, '_pingIdleSessions')
        .callsFake(async () => done());

      sessionPool._startHouseKeeping();
      clock.tick(expectedInterval);
    });
  });

  describe('_stopHouseKeeping', () => {
    it('should clear the intervals', () => {
      sessionPool._pingHandle = setTimeout(noop, 1);
      sessionPool._evictHandle = setTimeout(noop, 1);

      const fakeHandles = [sessionPool._pingHandle, sessionPool._evictHandle];
      const stub = sandbox.stub(global, 'clearInterval');

      sessionPool._stopHouseKeeping();

      fakeHandles.forEach((fakeHandle, i) => {
        const [handle] = stub.getCall(i).args;
        assert.strictEqual(handle, fakeHandle);
      });
    });
  });
});

function isAround(actual, expected) {
  return actual > expected - 50 && actual < expected + 50;
}
