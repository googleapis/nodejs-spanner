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
import * as sp from '../src/session-pool';
import * as mux from '../src/multiplexed-session';
import {Transaction} from '../src/transaction';
import {grpc} from 'google-gax';

const pQueueOverride: typeof PQueue | null = null;

function FakePQueue(options) {
  return new (pQueueOverride || PQueue)(options);
}

// FakePQueue.default = FakePQueue;

// class FakeTransaction {
//   options;
//   constructor(options?) {
//     this.options = options;
//   }
//   async begin(): Promise<void> {}
// }

// const fakeStackTrace = extend({}, stackTrace);

// function noop() {}

// describe('MultiplexedSession', ()=>{
//     let multiplexedSession: mux.MultiplexedSession;
//     // tslint:disable-next-line variable-name
//     let MultiplexedSession: typeof mux.MultiplexedSession;
//     let inventory;

//     const DATABASE = {
//         createMultiplexedSession: noop,
//         databaseRole: 'parent_role',
//     } as unknown as Database;

//     const sandbox = sinon.createSandbox();
//     const shouldNotBeCalled = sandbox.stub().throws('Should not be called.');

//     const createMultiplexedSession = (name = 'id', props?): Session => {
//         props = props || {};

//         return Object.assign(new Session(DATABASE, name), props, {
//             create: sandbox.stub().resolves(),
//             delete: sandbox.stub().resolves(),
//             keepAlive: sandbox.stub().resolves(),
//             transaction: sandbox.stub().returns(new FakeTransaction()),
//         });
//     };

//     const createStackFrame = (): stackTrace.StackFrame => {
//         return {
//         getFunctionName: sandbox.stub().returns('myFunction'),
//         getMethodName: sandbox.stub().returns('MyClass.myMethod'),
//         getFileName: sandbox.stub().returns('path/to/file.js'),
//         getLineNumber: sandbox.stub().returns('99'),
//         getColumnNumber: sandbox.stub().returns('13'),
//         getTypeName: sandbox.stub().returns('type'),
//         isNative: sandbox.stub().returns(false),
//         isConstructor: sandbox.stub().returns(false),
//         };
//     };

//     before(() => {
//         SessionPool = proxyquire('../src/session-pool.js', {
//         'p-queue': FakePQueue,
//         'stack-trace': fakeStackTrace,
//         }).SessionPool;
//     });

//     beforeEach(() => {
//         DATABASE.session = createSession;
//         sessionPool = new SessionPool(DATABASE);
//         inventory = sessionPool._inventory;
//     });

//     afterEach(() => {
//         pQueueOverride = null;
//         sandbox.restore();
//     });

//     describe('available', () => {
//         it('should return the number of available sessions', () => {
//             inventory.sessions = [createSession(), createSession(), createSession()];

//             assert.strictEqual(sessionPool.available, 3);
//         });
//     });
// });
