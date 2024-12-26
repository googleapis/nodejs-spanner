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
import {ReleaseError} from '../src/session-pool';

describe('SessionFactory', () => {
  process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'true';
  let sessionFactory;
  let fakeSession;
  let fakeMuxSession;
  const sandbox = sinon.createSandbox();
  const NAME = 'table-name';
  const POOL_OPTIONS = {};
  function noop() {}
  const DATABASE = {
    createSession: noop,
    batchCreateSessions: noop,
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
    fakeSession = createSession();
    fakeMuxSession = createMuxSession();
    sandbox.stub(DATABASE, 'batchCreateSessions').callsFake(() => {
      return Promise.resolve([[fakeSession, fakeSession, fakeSession]]);
    });
    sandbox
      .stub(DATABASE, 'createSession')
      .withArgs({multiplexed: true})
      .callsFake(() => {
        return Promise.resolve([fakeMuxSession]);
      });
    sessionFactory = new SessionFactory(DATABASE, NAME, POOL_OPTIONS);
    sessionFactory.parent = DATABASE;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('instantiation', () => {
    before(() => {
      process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'false';
    });

    it('should create a SessionPool object', () => {
      assert(sessionFactory.pool_ instanceof SessionPool);
    });

    it('should accept a custom Pool class', () => {
      function FakePool() {}
      FakePool.prototype.on = util.noop;
      FakePool.prototype.open = util.noop;

      const sessionFactory = new SessionFactory(
        DATABASE,
        NAME,
        FakePool as {} as db.SessionPoolConstructor
      );
      assert(sessionFactory.pool_ instanceof FakePool);
    });

    it('should open the pool', () => {
      const openStub = sandbox
        .stub(SessionPool.prototype, 'open')
        .callsFake(() => {});

      new SessionFactory(DATABASE, NAME, POOL_OPTIONS);

      assert.strictEqual(openStub.callCount, 1);
    });

    it('should set the isMuxCreated to be false if env is disabled', () => {
      assert.strictEqual(sessionFactory.isMuxCreated, false);
    });

    describe('when env GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS is enabled', () => {
      before(() => {
        process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'true';
      });

      it('should set the isMuxCreated to be true if env is enabled', () => {
        assert.strictEqual(sessionFactory.isMuxCreated, true);
      });

      it('should create a MultiplexedSession object', () => {
        assert(
          sessionFactory.multiplexedSession_ instanceof MultiplexedSession
        );
      });

      it('should initiate the multiplexed session creation if the env is enabled', () => {
        const createSessionStub = sandbox
          .stub(MultiplexedSession.prototype, 'createSession')
          .callsFake(() => {});

        new SessionFactory(DATABASE, NAME, POOL_OPTIONS);

        assert.strictEqual(createSessionStub.callCount, 1);
      });
    });
  });

  describe('getSession', () => {
    describe('for regular session', () => {
      before(() => {
        process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'false';
      });

      it('should return the regular session if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is disabled', done => {
        (
          sandbox.stub(sessionFactory.pool_, 'getSession') as sinon.SinonStub
        ).callsFake(callback => callback(null, fakeSession));
        sessionFactory.getSession((err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp, fakeSession);
          done();
        });
      });

      it('should return the error from getSession if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is disabled and regular session creation get failed', done => {
        const fakeError = new Error();
        (
          sandbox.stub(sessionFactory.pool_, 'getSession') as sinon.SinonStub
        ).callsFake(callback => callback(fakeError, null));
        sessionFactory.getSession((err, resp) => {
          assert.strictEqual(err, fakeError);
          assert.strictEqual(resp, null);
          done();
        });
      });
    });

    describe('for multiplexed session', () => {
      before(() => {
        process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'true';
      });

      it('should return the multiplexed session if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is enabled', done => {
        (
          sandbox.stub(
            sessionFactory.multiplexedSession_,
            'getSession'
          ) as sinon.SinonStub
        ).callsFake(callback => callback(null, fakeMuxSession));
        sessionFactory.getSession((err, resp) => {
          assert.strictEqual(err, null);
          assert.strictEqual(resp, fakeMuxSession);
          assert.strictEqual(resp?.multiplexed, true);
          assert.strictEqual(fakeMuxSession.multiplexed, true);
          done();
        });
      });

      it('should return the error from getSession if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is enabled and multiplexed session creation get failed', done => {
        const fakeError = new Error();
        (
          sandbox.stub(
            sessionFactory.multiplexedSession_,
            'getSession'
          ) as sinon.SinonStub
        ).callsFake(callback => callback(fakeError, null));
        sessionFactory.getSession((err, resp) => {
          assert.strictEqual(err, fakeError);
          assert.strictEqual(resp, null);
          done();
        });
      });
    });
  });

  describe('getPool', () => {
    it('should return the session pool object', () => {
      const pool = sessionFactory.getPool();
      assert(pool instanceof SessionPool);
      assert.deepStrictEqual(pool, sessionFactory.pool_);
    });
  });

  describe('release', () => {
    before(() => {
      process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'false';
    });

    it('should call the release method to release a regular session', () => {
      const releaseStub = sandbox.stub(sessionFactory.pool_, 'release');
      const fakeSession = createSession();
      sessionFactory.release(fakeSession);
      assert.strictEqual(releaseStub.callCount, 1);
    });

    it('should throw an error if encounters any error during release', () => {
      const fakeSession = createSession();
      try {
        sessionFactory.release(fakeSession);
        assert.fail('Expected error was not thrown');
      } catch (error) {
        assert.strictEqual(
          (error as ReleaseError).message,
          'Unable to release unknown resource.'
        );
        assert.strictEqual((error as ReleaseError).resource, fakeSession);
      }
    });
  });
});
