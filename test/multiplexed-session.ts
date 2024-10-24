/*!
 * Copyright 2024 Google Inc. All Rights Reserved.
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
import timeSpan = require('time-span');

import {Database} from '../src/database';
import {Session} from '../src/session';
import * as mux from '../src/multiplexed-session';
import {Transaction} from '../src/transaction';
import {grpc} from 'google-gax';

const pQueueOverride: typeof PQueue | null = null;

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

describe('MultiplexedSession', () => {
  let multiplexedSession: mux.MultiplexedSession;
  // tslint:disable-next-line variable-name
  let MultiplexedSession: typeof mux.MultiplexedSession;
  let inventory;

  const DATABASE = {
    Database: noop,
    databaseRole: 'parent_role',
  } as unknown as Database;

  const sandbox = sinon.createSandbox();
  const shouldNotBeCalled = sandbox.stub().throws('Should not be called.');

  const createSession = (name = 'id', props?): Session => {
    props = props || {};

    return Object.assign(new Session(DATABASE, name), props, {
      create: sandbox.stub().resolves(),
      transaction: sandbox.stub().returns(new FakeTransaction()),
    });
  };

  before(() => {
    MultiplexedSession = proxyquire('../src/multiplexed-session.js', {
      'stack-trace': fakeStackTrace,
    }).MultiplexedSession;
  });

  beforeEach(() => {
    DATABASE.session = createSession;
    multiplexedSession = new MultiplexedSession(DATABASE);
    inventory = multiplexedSession._multiplexedInventory;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getSession', () => {
    it('should acquire a session', done => {
      const fakeSession = createSession();

      sandbox.stub(multiplexedSession, '_acquire').resolves(fakeSession);

      multiplexedSession.getSession((err, session) => {
        assert.ifError(err);
        assert.strictEqual(session, fakeSession);
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
      const fakeSession = createSession();

      fakeSession.txn = fakeTxn;

      sandbox.stub(multiplexedSession, '_acquire').resolves(fakeSession);

      multiplexedSession.getSession((err, session, txn) => {
        assert.ifError(err);
        assert.strictEqual(session, fakeSession);
        assert.strictEqual(txn, fakeTxn);
        done();
      });
    });
  });
});
