/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
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
import {before, beforeEach, afterEach, describe, it} from 'mocha';
import * as events from 'events';
import * as extend from 'extend';
import PQueue from 'p-queue';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import stackTrace = require('stack-trace');
import {grpc} from 'google-gax';
import {Database} from '../src/database';
import {Session} from '../src/session';
import * as mux from '../src/multiplexed-session';
import {Transaction} from '../src/transaction';

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

describe('MultiplexedSession', () => {
  let multiplexedSession: mux.MultiplexedSession;
  // tslint:disable-next-line variable-name
  let MultiplexedSession: typeof mux.MultiplexedSession;
  let muxSession;

  function noop() {}
  const DATABASE = {
    createSession: noop,
    databaseRole: 'parent_role',
  } as unknown as Database;

  let fakeMuxSession;
  let createSessionStub;
  const sandbox = sinon.createSandbox();

  const createSession = (name = 'id', props?): Session => {
    props = props || {};

    return Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
      transaction: sandbox.stub().returns(new FakeTransaction()),
      getMetadata: sandbox.stub().resolves({multiplexed: true}),
    });
  };

  const shouldNotBeCalled = sandbox.stub().throws('Should not be called.');

  before(() => {
    MultiplexedSession = proxyquire('../src/multiplexed-session.js', {
      'p-queue': FakePQueue,
      'stack-trace': fakeStackTrace,
    }).MultiplexedSession;
  });

  beforeEach(() => {
    fakeMuxSession = createSession();
    createSessionStub = sandbox
      .stub(DATABASE, 'createSession')
      .withArgs({multiplexed: true})
      .callsFake(() => {
        return Promise.resolve([fakeMuxSession]);
      });
    multiplexedSession = new MultiplexedSession(DATABASE);
    muxSession = multiplexedSession._muxSession;
  });

  afterEach(() => {
    pQueueOverride = null;
    sandbox.restore();
  });

  describe('instantiation', () => {
    it('should localize the database instance', () => {
      assert.strictEqual(multiplexedSession.database, DATABASE);
    });

    describe('options', () => {
      it('should apply defaults', () => {
        assert.strictEqual(multiplexedSession.options.refreshRate, 7);
      });

      it('should not override user options', () => {
        multiplexedSession = new MultiplexedSession(DATABASE, {
          refreshRate: 10,
        });
        assert.strictEqual(multiplexedSession.options.refreshRate, 10);
      });

      it('should not override user options for databaseRole', () => {
        multiplexedSession = new MultiplexedSession(DATABASE, {
          databaseRole: 'child_role',
        });
        assert.strictEqual(
          multiplexedSession.options.databaseRole,
          'child_role'
        );
      });

      it('should use default value of Database for databaseRole', () => {
        multiplexedSession = new MultiplexedSession(DATABASE);
        assert.strictEqual(
          multiplexedSession.options.databaseRole,
          'parent_role'
        );
      });
    });

    it('should create a session object', () => {
      assert.deepStrictEqual(muxSession, {
        multiplexedSession: null,
      });
    });

    it('should create an acquire queue', () => {
      pQueueOverride = class {
        constructor(options) {
          return options;
        }
      } as typeof PQueue;

      const multiplexedSession = new MultiplexedSession(DATABASE);
      assert.deepStrictEqual(multiplexedSession._acquires.concurrency, 1);
    });

    it('should inherit from EventEmitter', () => {
      assert(multiplexedSession instanceof events.EventEmitter);
    });
  });

  describe('createSession', () => {
    let createSessionStub: sinon.SinonStub<[], Promise<void>>;

    beforeEach(() => {
      multiplexedSession._maintain = sandbox.stub();
      createSessionStub = sandbox
        .stub(multiplexedSession, '_createSession')
        .resolves();
    });

    it('should create mux session', () => {
      multiplexedSession.createSession();
      assert.strictEqual(createSessionStub.callCount, 1);
    });

    it('should start housekeeping', done => {
      multiplexedSession._maintain = done;
      multiplexedSession.createSession();
    });

    it('should not trigger unhandled promise rejection', () => {
      const error = {
        code: grpc.status.PERMISSION_DENIED,
        message: 'spanner.sessions.create',
      } as grpc.ServiceError;

      sandbox.restore();
      sandbox.stub(multiplexedSession, '_createSession').rejects(error);

      const originalRejection = process.listeners('unhandledRejection').pop();
      if (originalRejection) {
        process.removeListener('unhandledRejection', originalRejection!);
      }

      process.once('unhandledRejection', err => {
        assert.ifError(err);
      });

      multiplexedSession.createSession();

      if (originalRejection) {
        process.listeners('unhandledRejection').push(originalRejection!);
      }
    });

    it('should not trigger unhandled promise rejection when default credentials not set', () => {
      const error = {
        message: 'Could not load the default credentials',
      } as grpc.ServiceError;

      sandbox.restore();
      sandbox.stub(multiplexedSession, '_createSession').rejects(error);

      const originalRejection = process.listeners('unhandledRejection').pop();
      if (originalRejection) {
        process.removeListener('unhandledRejection', originalRejection!);
      }

      process.once('unhandledRejection', err => {
        assert.ifError(err);
      });

      multiplexedSession.createSession();

      if (originalRejection) {
        process.listeners('unhandledRejection').push(originalRejection!);
      }
    });

    it('should not trigger unhandled promise rejection when projectId not set', () => {
      const error = {
        message: 'Unable to detect a Project Id in the current environment',
      } as grpc.ServiceError;

      sandbox.restore();
      sandbox.stub(multiplexedSession, '_createSession').rejects(error);

      const originalRejection = process.listeners('unhandledRejection').pop();
      if (originalRejection) {
        process.removeListener('unhandledRejection', originalRejection!);
      }

      process.once('unhandledRejection', err => {
        assert.ifError(err);
      });

      multiplexedSession.createSession();

      if (originalRejection) {
        process.listeners('unhandledRejection').push(originalRejection!);
      }
    });
  });

  describe('_maintain', () => {
    it('should set an interval to refresh mux sessions', done => {
      const expectedInterval =
        multiplexedSession.options.refreshRate! * 24 * 60 * 60000;
      const clock = sandbox.useFakeTimers();

      sandbox
        .stub(multiplexedSession, '_refresh')
        .callsFake(async () => done());

      multiplexedSession._maintain();
      clock.tick(expectedInterval);
    });
  });

  describe('_createSession', () => {
    it('should create the mux sessions', async () => {
      await multiplexedSession._createSession();
      assert.strictEqual(createSessionStub.callCount, 1);
    });

    it('should pass the multiplexed option', async () => {
      const multiplexed = {multiplexed: true};
      await multiplexedSession._createSession();
      assert.deepStrictEqual(createSessionStub.lastCall.args[0], multiplexed);
    });

    it('should not make multiple requests', async () => {
      createSessionStub.onCall(0).resolves([[{}, {}]]);
      createSessionStub.onCall(1).resolves([[{}]]);

      await multiplexedSession._createSession();

      assert.strictEqual(createSessionStub.callCount, 1);
    });

    it('should reject with any request errors', async () => {
      const error = new Error('err');
      createSessionStub.rejects(error);

      try {
        await multiplexedSession._createSession();
        throw new Error('Should not make it this far.');
      } catch (e) {
        assert.strictEqual(e, error);
      }
    });
  });

  describe('getSession', () => {
    it('should acquire a session', done => {
      sandbox.stub(multiplexedSession, '_acquire').resolves(fakeMuxSession);

      multiplexedSession.getSession((err, session) => {
        assert.ifError(err);
        assert.strictEqual(session, fakeMuxSession);
        done();
      });
    });
    it('should pass any errors to the callback', done => {
      const error = new Error('err');
      sandbox.stub(multiplexedSession, '_acquire').rejects(error);
      multiplexedSession.getSession(err => {
        assert.strictEqual(err, error);
        done();
      });
    });
    it('should pass back the session and txn', done => {
      const fakeTxn = new FakeTransaction() as unknown as Transaction;

      fakeMuxSession.txn = fakeTxn;

      sandbox.stub(multiplexedSession, '_acquire').resolves(fakeMuxSession);

      multiplexedSession.getSession((err, session, txn) => {
        assert.ifError(err);
        assert.strictEqual(session, fakeMuxSession);
        assert.strictEqual(txn, fakeTxn);
        done();
      });
    });
  });

  describe('_acquire', () => {
    it('should return a session', async () => {
      sandbox.stub(multiplexedSession, '_getSession').resolves(fakeMuxSession);
      const session = await multiplexedSession._acquire();
      assert.strictEqual(session, fakeMuxSession);
    });
    it('should have the multiplexed property set to true', async () => {
      sandbox.stub(multiplexedSession, '_getSession').resolves(fakeMuxSession);
      const session = await multiplexedSession._acquire();
      assert.strictEqual((await session!.getMetadata()).multiplexed, true);
      assert.strictEqual(
        (await fakeMuxSession!.getMetadata()).multiplexed,
        true
      );
    });
  });

  describe('_getSession', () => {
    it('should return a session if one is available', async () => {
      sandbox
        .stub(multiplexedSession, '_multiplexedSession')
        .returns(fakeMuxSession);

      muxSession.multiplexedSession = fakeMuxSession;

      const session = await multiplexedSession._getSession();
      assert.strictEqual(session, fakeMuxSession);
    });
    it('should wait for a pending session to become available', async () => {
      await multiplexedSession.createSession();
      const session = await multiplexedSession._getSession();
      assert.strictEqual(session, fakeMuxSession);
    });
    it('should remove the mux session available listener on error', async () => {
      setTimeout(() => {
        multiplexedSession._createSession(),
          multiplexedSession.emit('mux-session-available');
      }, 100);
      const promise = multiplexedSession._getSession();

      assert.strictEqual(
        multiplexedSession.listenerCount('mux-session-available'),
        1
      );

      try {
        await promise;
        shouldNotBeCalled();
      } catch (e) {
        assert.strictEqual(
          multiplexedSession.listenerCount('mux-session-available'),
          0
        );
      }
    });
  });
});
