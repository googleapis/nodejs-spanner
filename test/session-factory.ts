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

import {Database, Session, SessionPool} from '../src';
import {SessionFactory} from '../src/session-factory';
import * as sinon from 'sinon';
import * as assert from 'assert';
import {MultiplexedSession} from '../src/multiplexed-session';
import {util} from '@google-cloud/common';
import * as db from '../src/database';
import {FakeTransaction} from './session-pool';

describe('SessionFactory', () => {
  let sessionFactory;
  const sandbox = sinon.createSandbox();
  const NAME = 'table-name';
  const POOL_OPTIONS = {};
  function noop() {}
  const DATABASE = {
    createSession: noop,
    databaseRole: 'parent_role',
  } as unknown as Database;

  const createMuxSession = (name = 'id', props?): Session => {
    props = props || {multiplexed: true};

    return Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
      transaction: sandbox.stub().returns(new FakeTransaction()),
    });
  };

  const createSession = (name = 'id', props?): Session => {
    props = props || {};

    return Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
      transaction: sandbox.stub().returns(new FakeTransaction()),
    });
  };

  beforeEach(() => {
    sessionFactory = new SessionFactory(DATABASE, NAME, POOL_OPTIONS);
    sessionFactory.parent = DATABASE;
  });

  afterEach(() => {
    sandbox.restore();
    process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'false';
  });

  describe('instantiation', () => {
    it('should create a SessionPool object', () => {
      assert(sessionFactory.pool_ instanceof SessionPool);
    });

    it('should create a MultiplexedSession object', () => {
      assert(sessionFactory.multiplexedSession_ instanceof MultiplexedSession);
    });

    it('should accept a custom Pool class', () => {
      function FakePool() {}
      FakePool.prototype.on = util.noop;
      FakePool.prototype.open = util.noop;

      const getSession = new SessionFactory(
        DATABASE,
        NAME,
        FakePool as {} as db.SessionPoolConstructor
      );
      assert(getSession.pool_ instanceof FakePool);
    });

    it('should re-emit SessionPool errors', done => {
      const error = new Error('err');

      sessionFactory.on('error', err => {
        assert.strictEqual(err, error);
        done();
      });

      sessionFactory.pool_.emit('error', error);
    });

    it('should open the pool', () => {
      const openStub = sandbox
        .stub(SessionPool.prototype, 'open')
        .callsFake(() => {});

      new SessionFactory(DATABASE, NAME, POOL_OPTIONS);

      assert.strictEqual(openStub.callCount, 1);
    });

    it('should re-emit MultiplexedSession errors', done => {
      process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'true';
      const error = new Error('err');

      sessionFactory.on('error', err => {
        assert.strictEqual(err, error);
        done();
      });

      sessionFactory.pool_.emit('error', error);
    });

    it('should initiate the multiplexed session creation if the env is enabled', () => {
      process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'true';
      const createSessionStub = sandbox
        .stub(MultiplexedSession.prototype, 'createSession')
        .callsFake(() => {});

      new SessionFactory(DATABASE, NAME, POOL_OPTIONS);

      assert.strictEqual(createSessionStub.callCount, 1);
    });
  });

  describe('getSession', () => {
    let multiplexedSession;
    let fakeMuxSession;
    let sessionPool;
    let fakeSession;

    beforeEach(() => {
      multiplexedSession = new MultiplexedSession(DATABASE);
      fakeMuxSession = createMuxSession();
      sessionPool = new SessionPool(DATABASE, POOL_OPTIONS);
      fakeSession = createSession();
    });

    afterEach(() => {
      process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'false';
    });

    it('should return the multiplexed session if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is enabled', () => {
      process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'true';
      (
        sandbox.stub(multiplexedSession, 'getSession') as sinon.SinonStub
      ).callsFake(callback => callback(null, fakeMuxSession));
      sessionFactory.getSession((err, resp) => {
        assert.strictEqual(err, null);
        assert.strictEqual(resp, fakeMuxSession);
        assert.strictEqual(resp.multiplexed, true);
        assert.strictEqual(fakeMuxSession.multiplexed, true);
      });
    });

    it('should return the err for getSession if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is enabled', () => {
      process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'true';
      const fakeError = new Error();
      (
        sandbox.stub(multiplexedSession, 'getSession') as sinon.SinonStub
      ).callsFake(callback => callback(fakeError, null));
      sessionFactory.getSession((err, resp) => {
        assert.strictEqual(err, fakeError);
        assert.strictEqual(resp, null);
      });
    });

    it('should return the multiplexed session if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is disabled', () => {
      (sandbox.stub(sessionPool, 'getSession') as sinon.SinonStub).callsFake(
        callback => callback(null, fakeSession)
      );
      sessionFactory.getSession((err, resp) => {
        assert.strictEqual(err, null);
        assert.strictEqual(resp, fakeSession);
      });
    });

    it('should return the err for getSession if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is disabled', () => {
      const fakeError = new Error();
      (sandbox.stub(sessionPool, 'getSession') as sinon.SinonStub).callsFake(
        callback => callback(fakeError, null)
      );
      sessionFactory.getSession((err, resp) => {
        assert.strictEqual(err, fakeError);
        assert.strictEqual(resp, null);
      });
    });
  });

  describe('getPool', () => {
    it('should return an instance of SessionPool', () => {
      const sessionFactory = new SessionFactory(DATABASE, NAME, POOL_OPTIONS);
      assert(sessionFactory.getPool() instanceof SessionPool);
    });
  });

  describe('getMultiplexedSession', () => {
    it('should return an instance of MultiplexedSession', () => {
      const sessionFactory = new SessionFactory(DATABASE, NAME, POOL_OPTIONS);
      assert(
        sessionFactory.getMultiplexedSession() instanceof MultiplexedSession
      );
    });
  });
});
