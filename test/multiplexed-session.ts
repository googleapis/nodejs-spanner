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
import {beforeEach, afterEach, describe, it} from 'mocha';
import * as events from 'events';
import * as sinon from 'sinon';
import {Database} from '../src/database';
import {Session} from '../src/session';
import {
  MultiplexedSession,
  MUX_SESSION_AVAILABLE,
  MUX_SESSION_CREATE_ERROR,
} from '../src/multiplexed-session';
import {Transaction} from '../src/transaction';
import {FakeTransaction} from './session-pool';

describe('MultiplexedSession', () => {
  let multiplexedSession;

  function noop() {}
  const DATABASE = {
    createSession: noop,
    databaseRole: 'parent_role',
  } as unknown as Database;

  let fakeMuxSession;
  let createSessionStub;
  const sandbox = sinon.createSandbox();

  const createSession = (name = 'id', props?): Session => {
    props = props || {multiplexed: true};

    return Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
      transaction: sandbox.stub().returns(new FakeTransaction()),
    });
  };

  beforeEach(() => {
    fakeMuxSession = createSession();
    createSessionStub = sandbox
      .stub(DATABASE, 'createSession')
      .withArgs({multiplexed: true})
      .callsFake(() => {
        return Promise.resolve([fakeMuxSession]);
      });
    multiplexedSession = new MultiplexedSession(DATABASE);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('instantiation', () => {
    it('should correctly initialize the fields', () => {
      assert.strictEqual(multiplexedSession.database, DATABASE);
      assert.strictEqual(multiplexedSession.refreshRate, 7);
      assert.deepStrictEqual(multiplexedSession._multiplexedSession, null);
      assert(multiplexedSession instanceof events.EventEmitter);
    });
  });

  describe('createSession', () => {
    let _createSessionStub;
    let _maintainStub;

    beforeEach(() => {
      _maintainStub = sandbox.stub(multiplexedSession, '_maintain');
      _createSessionStub = sandbox
        .stub(multiplexedSession, '_createSession')
        .resolves();
    });

    it('should create mux session', () => {
      multiplexedSession.createSession();
      assert.strictEqual(_createSessionStub.callCount, 1);
    });

    it('should start housekeeping', done => {
      multiplexedSession.createSession();
      setImmediate(() => {
        try {
          assert.strictEqual(_maintainStub.callCount, 1);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('should propagate errors for Multiplexed Session which gets emitted', async () => {
      const multiplexedSession = new MultiplexedSession(DATABASE);
      const fakeError = new Error();
      sandbox.stub(multiplexedSession, '_createSession').rejects(fakeError);
      const errorPromise = new Promise<void>((resolve, reject) => {
        multiplexedSession.once('error', err => {
          try {
            assert.strictEqual(err, fakeError);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

      multiplexedSession.createSession();

      await errorPromise;
    });
  });

  describe('_maintain', () => {
    let clock;
    let createSessionStub;

    beforeEach(() => {
      createSessionStub = sandbox
        .stub(multiplexedSession, '_createSession')
        .resolves();
      clock = sandbox.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should set an interval to refresh mux sessions', () => {
      const expectedInterval =
        multiplexedSession.refreshRate! * 24 * 60 * 60000;

      multiplexedSession._maintain();
      clock.tick(expectedInterval);
      assert.strictEqual(createSessionStub.callCount, 1);
    });
  });

  describe('_createSession', () => {
    it('should create the mux sessions with multiplexed option', async () => {
      await multiplexedSession._createSession();
      assert.strictEqual(createSessionStub.callCount, 1);
      assert.deepStrictEqual(createSessionStub.lastCall.args[0], {
        multiplexed: true,
      });
    });

    it('should emit the MUX_SESSION_AVAILABLE event on successfully creating mux session', done => {
      multiplexedSession.on(MUX_SESSION_AVAILABLE, () => {
        assert.strictEqual(
          multiplexedSession._multiplexedSession,
          fakeMuxSession
        );
        done();
      });
      multiplexedSession._createSession();
    });

    it('should reject with any request errors', async () => {
      const error = new Error(MUX_SESSION_CREATE_ERROR);
      createSessionStub.rejects(error);

      try {
        await multiplexedSession._createSession();
        throw new Error('Should not make it this far.');
      } catch (e) {
        assert.strictEqual(e, error);
      }
    });

    it('should emit the error event on failed creation of mux session', done => {
      const error = new Error(MUX_SESSION_CREATE_ERROR);
      createSessionStub.rejects(error);
      multiplexedSession.on(MUX_SESSION_CREATE_ERROR, () => {
        done();
      });
      multiplexedSession._createSession().catch(err => {
        assert.strictEqual(err, error);
      });
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
      assert.strictEqual(session.multiplexed, true);
      assert.strictEqual(fakeMuxSession.multiplexed, true);
    });
  });

  describe('_getSession', () => {
    it('should return a session if one is available', async () => {
      multiplexedSession._multiplexedSession = fakeMuxSession;
      assert.doesNotThrow(async () => {
        const session = await multiplexedSession._getSession();
        assert.strictEqual(session, fakeMuxSession);
      });
    });

    it('should wait for a pending session to become available', async () => {
      multiplexedSession._multiplexedSession = fakeMuxSession;
      setTimeout(() => multiplexedSession.emit(MUX_SESSION_AVAILABLE), 100);
      const session = await multiplexedSession._getSession();
      assert.strictEqual(session, fakeMuxSession);
    });

    it('should remove the available listener', async () => {
      const promise = multiplexedSession._getSession();
      setTimeout(() => multiplexedSession.emit(MUX_SESSION_AVAILABLE), 100);
      assert.strictEqual(
        multiplexedSession.listenerCount(MUX_SESSION_AVAILABLE),
        1
      );
      try {
        await promise;
      } finally {
        assert.strictEqual(
          multiplexedSession.listenerCount(MUX_SESSION_AVAILABLE),
          0
        );
      }
    });

    it('should remove the error listener', async () => {
      const error = new Error('mux session create error');
      const promise = multiplexedSession._getSession();
      setTimeout(
        () => multiplexedSession.emit(MUX_SESSION_CREATE_ERROR, error),
        100
      );
      assert.strictEqual(
        multiplexedSession.listenerCount(MUX_SESSION_CREATE_ERROR),
        1
      );
      try {
        await promise;
      } catch (e) {
        assert.strictEqual(e, error);
        assert.strictEqual(
          multiplexedSession.listenerCount(MUX_SESSION_CREATE_ERROR),
          0
        );
      }
    });
  });
});