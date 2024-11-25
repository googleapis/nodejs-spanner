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
import {grpc, Status} from 'google-gax';
import {Database} from '../src/database';
import {Session} from '../src/session';
import {MultiplexedSession} from '../src/multiplexed-session';
import {Transaction} from '../src/transaction';
import { FakeTransaction } from './session-pool';

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
    props = props || {};

    return Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
      transaction: sandbox.stub().returns(new FakeTransaction()),
      getMetadata: sandbox.stub().resolves({multiplexed: true}),
    });
  };

  const shouldNotBeCalled = sandbox.stub().throws('Should not be called.');

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
    it('should localize the database instance', () => {
      assert.strictEqual(multiplexedSession.database, DATABASE);
    });

    it('should apply defaults', () => {
      assert.strictEqual(multiplexedSession.refreshRate, 7);
    });

    it('should create a session object', () => {
      assert.deepStrictEqual(multiplexedSession._multiplexedSession, null);
    });

    it('should inherit from EventEmitter', () => {
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

    it('should not propagate instance and database not found errors for Multiplexed Session', () => {
      const multiplexedSession = new MultiplexedSession(DATABASE);
      const error = {
        code: Status.NOT_FOUND,
        message: 'Database not found',
      } as grpc.ServiceError;
      sandbox.stub(multiplexedSession, '_createSession').rejects(error);
      try {
        multiplexedSession.createSession();
      } catch (e) {
        shouldNotBeCalled();
      }
    });

    it('should not propagate errors for Multiplexed Session when default credentials not set', () => {
      const multiplexedSession = new MultiplexedSession(DATABASE);
      const error = {
        message: 'Could not load the default credentials',
      } as grpc.ServiceError;
      sandbox.stub(multiplexedSession, '_createSession').rejects(error);
      try {
        multiplexedSession.createSession();
      } catch (e) {
        shouldNotBeCalled();
      }
    });

    it('should not propagate errors for Multiplexed Session when projectId not set', () => {
      const multiplexedSession = new MultiplexedSession(DATABASE);
      const error = {
        code: Status.NOT_FOUND,
        message: 'Unable to detect a Project Id in the current environment',
      } as grpc.ServiceError;
      sandbox.stub(multiplexedSession, '_createSession').rejects(error);
      try {
        multiplexedSession.createSession();
      } catch (e) {
        shouldNotBeCalled();
      }
    });

    it('should propagate errors for Multiplexed Session which gets emitted', async () => {
      const multiplexedSession = new MultiplexedSession(DATABASE);
      const fakeError = new Error();
      sandbox.stub(multiplexedSession, '_createSession').rejects(fakeError);
      const errorPromise = new Promise<void>((resolve, reject) => {
        multiplexedSession.once('error', err => {
          if (err === fakeError) {
            resolve();
          } else {
            reject(new Error('Unexpected error emitted'));
          }
        });
      });

      multiplexedSession.createSession();

      await errorPromise;
    });
  });

  describe('_maintain', () => {
    it('should set an interval to refresh mux sessions', done => {
      const expectedInterval =
        multiplexedSession.refreshRate! * 24 * 60 * 60000;
      const clock = sandbox.useFakeTimers();

      const _refreshStub = sandbox
        .stub(multiplexedSession, '_refresh')
        .callsFake(async () => done());

      multiplexedSession._maintain();
      clock.tick(expectedInterval);
      assert.strictEqual(_refreshStub.callCount, 1);
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
      multiplexedSession._multiplexedSession = fakeMuxSession;
      try {
        const session = await multiplexedSession._getSession();
        assert.strictEqual(session, fakeMuxSession);
      } catch (e) {
        shouldNotBeCalled();
      }
    });

    it('should wait for a pending session to become available', async () => {
      multiplexedSession._multiplexedSession = fakeMuxSession;
      setTimeout(() => multiplexedSession.emit('mux-session-available'), 100);
      const stub = sandbox
        .stub(multiplexedSession, 'createSession')
        .rejects(new Error('should not be called'));
      const session = await multiplexedSession._getSession();
      assert.strictEqual(session, fakeMuxSession);
      assert.strictEqual(stub.callCount, 0);
    });

    it('should remove the available listener', async () => {
      const promise = multiplexedSession._getSession();

      setTimeout(() => multiplexedSession.emit('mux-session-available'), 100);

      assert.strictEqual(
        multiplexedSession.listenerCount('mux-session-available'),
        1
      );

      try {
        await promise;
      } finally {
        assert.strictEqual(
          multiplexedSession.listenerCount('mux-session-available'),
          0
        );
      }
    });
  });
});
