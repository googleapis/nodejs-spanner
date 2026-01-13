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

import {Database, Session} from '../src';
import {SessionFactory} from '../src/session-factory';
import * as sinon from 'sinon';
import * as assert from 'assert';
import {MultiplexedSession} from '../src/multiplexed-session';

export class FakeTransaction {
  options;
  constructor(options?) {
    this.options = options;
  }
  async begin(): Promise<void> {}
}

describe('SessionFactory', () => {
  let sessionFactory;
  let fakeSession;
  let fakeMuxSession;
  const sandbox = sinon.createSandbox();
  const NAME = 'table-name';
  function noop() {}
  const DATABASE = {
    createSession: noop,
    batchCreateSessions: noop,
    databaseRole: 'parent_role',
  } as unknown as Database;

  const createMuxSession = (name = 'id', props?): Session => {
    props = props || {};

    const muxSession = Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
      transaction: sandbox.stub().returns(new FakeTransaction()),
    });

    muxSession.metadata = {
      multiplexed: true,
    };

    return muxSession;
  };

  const createSession = (name = 'id', props?): Session => {
    props = props || {};

    const session = Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
    });

    session.metadata = {multiplexed: false};

    return session;
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
    sessionFactory = new SessionFactory(DATABASE, NAME);
    sessionFactory.parent = DATABASE;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('instantiation', () => {
    it('should create a MultiplexedSession object', () => {
      assert(sessionFactory.multiplexedSession_ instanceof MultiplexedSession);
    });

    it('should initiate the multiplexed session creation', () => {
      const createSessionStub = sandbox
        .stub(MultiplexedSession.prototype, 'createSession')
        .callsFake(() => {});

      new SessionFactory(DATABASE, NAME);

      assert.strictEqual(createSessionStub.callCount, 1);
    });
  });

  describe('getSession', () => {
    it('should return the multiplexed session', done => {
      (
        sandbox.stub(
          sessionFactory.multiplexedSession_,
          'getSession',
        ) as sinon.SinonStub
      ).callsFake(callback => callback(null, fakeMuxSession));
      sessionFactory.getSession((err, resp) => {
        assert.strictEqual(err, null);
        assert.strictEqual(resp, fakeMuxSession);
        assert.strictEqual(resp?.metadata.multiplexed, true);
        assert.strictEqual(fakeMuxSession.metadata.multiplexed, true);
        done();
      });
    });

    it('should propagate error when multiplexed session return fails', done => {
      const fakeError = new Error();
      (
        sandbox.stub(
          sessionFactory.multiplexedSession_,
          'getSession',
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
