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

const assert = require('assert');
const common = require('@google-cloud/common');
const extend = require('extend');
const through = require('through2');

describe('SessionPool', function() {
  let SessionPool;

  let DATABASE = {
    request: common.util.noop,
    requestStream: common.util.noop,
  };

  before(function() {
    SessionPool = require('../src/session-pool.js');
  });

  describe('tests with no min sessions sessionPool before hook', function() {
    let sessionPool;
    // Because we create a sessionPool here for every test tests which want to open
    // their own pool must first close this one and wait on its returned promise.
    // Otherwise the tests will have resource leaks.
    beforeEach(function() {
      sessionPool = new SessionPool(DATABASE, {
        maxReads: 10,
        maxWrites: 5,
        acquireTimeout: 50,
      });
    });

    afterEach(function() {
      clearTimeout(sessionPool.pingTimeoutHandle);
      if (sessionPool.isOpen) {
        return sessionPool.close();
      }
    });

    describe('instantiation', function() {
      it('should localize the database instance', function() {
        assert.strictEqual(sessionPool.database, DATABASE);
      });

      describe('options', function() {
        it('should apply defaults to non-modified options', function() {
          assert.strictEqual(sessionPool.options.acquireTimeout, 50);
          assert.strictEqual(sessionPool.options.concurrency, 10);
          assert.strictEqual(sessionPool.options.maxWait, 50);
          assert.strictEqual(sessionPool.options.idlesAfter, 50);
          assert.strictEqual(sessionPool.options.maxReads, 10);
          assert.strictEqual(sessionPool.options.maxWrites, 5);
          assert.strictEqual(sessionPool.options.minReads, 0);
          assert.strictEqual(sessionPool.options.minWrites, 0);
        });

        it('should not override user options', function() {
          return sessionPool.close().then(function() {
            sessionPool = new SessionPool(DATABASE, {acquireTimeout: 1});
            assert.strictEqual(sessionPool.options.acquireTimeout, 1);
            assert.strictEqual(
              sessionPool.readPool._config.acquireTimeoutMillis,
              1
            );
            assert.strictEqual(
              sessionPool.writePool._config.acquireTimeoutMillis,
              1
            );
          });
        });

        it('should apply defaults', function() {
          return sessionPool.close().then(function() {
            sessionPool = new SessionPool(DATABASE);
            assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
            assert.strictEqual(sessionPool.options.concurrency, 10);
            assert.strictEqual(sessionPool.options.maxWait, 50);
            assert.strictEqual(sessionPool.options.idlesAfter, 50);
            assert.strictEqual(sessionPool.options.max, 100);
            assert.strictEqual(sessionPool.options.writes, 0);
            assert.strictEqual(sessionPool.options.min, 0);
            assert.strictEqual(sessionPool.options.maxReads, 100);
            assert.strictEqual(sessionPool.options.maxWrites, 0);
            assert.strictEqual(sessionPool.options.minReads, 0);
            assert.strictEqual(sessionPool.options.minWrites, 0);
          });
        });

        it('should override DEFAULT for writes', function() {
          return sessionPool.close().then(function() {
            sessionPool = new SessionPool(DATABASE, {writes: 0.5});
            assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
            assert.strictEqual(sessionPool.options.concurrency, 10);
            assert.strictEqual(sessionPool.options.maxWait, 50);
            assert.strictEqual(sessionPool.options.idlesAfter, 50);
            assert.strictEqual(sessionPool.options.max, 100);
            assert.strictEqual(sessionPool.options.writes, 0.5);
            assert.strictEqual(sessionPool.options.min, 0);
            assert.strictEqual(sessionPool.options.maxReads, 50);
            assert.strictEqual(sessionPool.options.maxWrites, 50);
            assert.strictEqual(sessionPool.options.minReads, 0);
            assert.strictEqual(sessionPool.options.minWrites, 0);
          });
        });

        it('should override DEFAULT for maxWrites', function() {
          return sessionPool.close().then(function() {
            sessionPool = new SessionPool(DATABASE, {
              maxWrites: 21,
              writes: 0.5,
            });
            assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
            assert.strictEqual(sessionPool.options.concurrency, 10);
            assert.strictEqual(sessionPool.options.maxWait, 50);
            assert.strictEqual(sessionPool.options.idlesAfter, 50);
            assert.strictEqual(sessionPool.options.max, 100);
            assert.strictEqual(sessionPool.options.writes, 0.5);
            assert.strictEqual(sessionPool.options.min, 0);
            assert.strictEqual(sessionPool.options.maxReads, 79);
            assert.strictEqual(sessionPool.options.maxWrites, 21);
            assert.strictEqual(sessionPool.options.minReads, 0);
            assert.strictEqual(sessionPool.options.minWrites, 0);
          });
        });

        it('should override DEFAULT for maxReads', function() {
          return sessionPool.close().then(function() {
            sessionPool = new SessionPool(DATABASE, {
              writes: 0.5,
              maxReads: 40,
            });
            assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
            assert.strictEqual(sessionPool.options.concurrency, 10);
            assert.strictEqual(sessionPool.options.maxWait, 50);
            assert.strictEqual(sessionPool.options.idlesAfter, 50);
            assert.strictEqual(sessionPool.options.max, 100);
            assert.strictEqual(sessionPool.options.writes, 0.5);
            assert.strictEqual(sessionPool.options.min, 0);
            assert.strictEqual(sessionPool.options.maxReads, 40);
            assert.strictEqual(sessionPool.options.maxWrites, 60);
            assert.strictEqual(sessionPool.options.minReads, 0);
            assert.strictEqual(sessionPool.options.minWrites, 0);
          });
        });

        it('should override DEFAULT for minReads and minWrites', function() {
          return sessionPool.close().then(function() {
            sessionPool = new SessionPool(DATABASE, {
              writes: 0.5,
              maxReads: 40,
              minReads: 41,
              minWrites: 61,
              min: 70,
            });
            assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
            assert.strictEqual(sessionPool.options.concurrency, 10);
            assert.strictEqual(sessionPool.options.maxWait, 50);
            assert.strictEqual(sessionPool.options.idlesAfter, 50);
            assert.strictEqual(sessionPool.options.max, 100);
            assert.strictEqual(sessionPool.options.writes, 0.5);
            assert.strictEqual(sessionPool.options.min, 70);
            assert.strictEqual(sessionPool.options.maxReads, 40);
            assert.strictEqual(sessionPool.options.maxWrites, 60);
            assert.strictEqual(sessionPool.options.minReads, 40);
            assert.strictEqual(sessionPool.options.minWrites, 60);
          });
        });

        it('should override DEFAULT for minReads and minWrites', function() {
          return sessionPool.close().then(function() {
            sessionPool = new SessionPool(DATABASE, {
              writes: 0.5,
              maxReads: 40,
              min: 70,
            });
            assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
            assert.strictEqual(sessionPool.options.concurrency, 10);
            assert.strictEqual(sessionPool.options.maxWait, 50);
            assert.strictEqual(sessionPool.options.idlesAfter, 50);
            assert.strictEqual(sessionPool.options.max, 100);
            assert.strictEqual(sessionPool.options.writes, 0.5);
            assert.strictEqual(sessionPool.options.min, 70);
            assert.strictEqual(sessionPool.options.maxReads, 40);
            assert.strictEqual(sessionPool.options.maxWrites, 60);
            assert.strictEqual(sessionPool.options.minReads, 40);
            assert.strictEqual(sessionPool.options.minWrites, 60);
          });
        });

        it('should override DEFAULT for minReads and minWrites', function() {
          return sessionPool.close().then(function() {
            sessionPool = new SessionPool(DATABASE, {
              writes: 0.5,
              maxReads: 40,
              min: 20,
            });
            assert.strictEqual(sessionPool.options.acquireTimeout, Infinity);
            assert.strictEqual(sessionPool.options.concurrency, 10);
            assert.strictEqual(sessionPool.options.maxWait, 50);
            assert.strictEqual(sessionPool.options.idlesAfter, 50);
            assert.strictEqual(sessionPool.options.max, 100);
            assert.strictEqual(sessionPool.options.writes, 0.5);
            assert.strictEqual(sessionPool.options.min, 20);
            assert.strictEqual(sessionPool.options.maxReads, 40);
            assert.strictEqual(sessionPool.options.maxWrites, 60);
            assert.strictEqual(sessionPool.options.minReads, 20);
            assert.strictEqual(sessionPool.options.minWrites, 20);
          });
        });

        it('should throw when writes is greater than 1', function() {
          assert.throws(function() {
            return new SessionPool(DATABASE, {writes: 50});
          }, /Write percentage should be represented as a float between 0\.0 and 1\.0\./);
        });
      });

      it('should set isOpen to false', function() {
        assert.strictEqual(sessionPool.isOpen, false);
      });

      it('should localize database request functions', function() {
        assert.strictEqual(sessionPool.request_, DATABASE.request);
        assert.strictEqual(sessionPool.requestStream_, DATABASE.requestStream);
      });

      it('should set read and write pool sizes to 0', function() {
        assert.strictEqual(sessionPool.getStats().readPool.size, 0);
        assert.strictEqual(sessionPool.getStats().writePool.size, 0);
      });

      it('read and write pools should be initialized with the parameters passed in', function() {
        const readPoolOptions = sessionPool.readPool._config;
        const writePoolOptions = sessionPool.writePool._config;
        assert.strictEqual(readPoolOptions.fifo, true);
        assert.strictEqual(readPoolOptions.priorityRange, 1);
        assert.strictEqual(readPoolOptions.testOnBorrow, true);
        assert.strictEqual(readPoolOptions.testOnReturn, false);
        assert.strictEqual(readPoolOptions.autostart, false);
        assert.strictEqual(readPoolOptions.maxWaitingClients, 50);
        assert.strictEqual(readPoolOptions.max, 10);
        assert.strictEqual(readPoolOptions.min, 0);
        assert.strictEqual(readPoolOptions.evictionRunIntervalMillis, 3000000);
        assert.strictEqual(readPoolOptions.numTestsPerEvictionRun, 3);
        assert.strictEqual(readPoolOptions.softIdleTimeoutMillis, -1);
        assert.strictEqual(readPoolOptions.idleTimeoutMillis, 3000000);
        assert.strictEqual(writePoolOptions.fifo, true);
        assert.strictEqual(writePoolOptions.priorityRange, 1);
        assert.strictEqual(writePoolOptions.testOnBorrow, true);
        assert.strictEqual(writePoolOptions.testOnReturn, false);
        assert.strictEqual(writePoolOptions.autostart, false);
        assert.strictEqual(writePoolOptions.maxWaitingClients, 50);
        assert.strictEqual(writePoolOptions.max, 5);
        assert.strictEqual(writePoolOptions.min, 0);
        assert.strictEqual(writePoolOptions.evictionRunIntervalMillis, 3000000);
        assert.strictEqual(writePoolOptions.numTestsPerEvictionRun, 3);
        assert.strictEqual(writePoolOptions.softIdleTimeoutMillis, -1);
        assert.strictEqual(writePoolOptions.idleTimeoutMillis, 3000000);
      });

      it('should create a request queue', function() {
        const poolOptions = {
          concurrency: 11,
        };

        return sessionPool.close().then(function() {
          sessionPool = new SessionPool(DATABASE, poolOptions);
          assert.strictEqual(sessionPool.requestQueue_._concurrency, 11);
        });
      });
    });

    describe('session_', function() {
      it('should return a session object', function() {
        const fakeSession = {};

        DATABASE.session_ = function() {
          return fakeSession;
        };

        const session = sessionPool.session_();

        assert.strictEqual(session, fakeSession);
        assert(isAround(session.lastUsed, Date.now()));
      });
    });

    describe('createReadSession', function() {
      it('should create a read only session', function() {
        let created = false;

        const fakeSession = {
          create: function() {
            created = true;
            return Promise.resolve();
          },
        };
        sessionPool.session_ = function() {
          return fakeSession;
        };
        return sessionPool.createReadSession().then(function(session) {
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(session.type, 'readonly');
          assert.strictEqual(created, true);
        });
      });

      it('should fail in creating a read only session', function() {
        let deleteCalled = false;
        const fakeSession = {
          create: () => Promise.reject('Error'),
          delete: () => {
            deleteCalled = true;
            return Promise.resolve();
          },
        };

        sessionPool.session_ = function() {
          return fakeSession;
        };

        return sessionPool.createReadSession().catch(error => {
          assert.strictEqual(error, 'Error');
          assert.strictEqual(deleteCalled, true);
        });
      });
    });

    describe('createWriteSession_', function() {
      it('should create a write session', function() {
        const fakeSession = {
          create: () => Promise.resolve(),
        };

        sessionPool.session_ = () => fakeSession;

        sessionPool.createTransaction_ = function(session) {
          assert.strictEqual(session, fakeSession);
          return Promise.resolve();
        };

        return sessionPool.createWriteSession().then(function(session) {
          assert.strictEqual(session, fakeSession);
          assert.strictEqual(session.type, 'readwrite');
        });
      });

      it('should fail in creating a read/write session', function() {
        let deleteCalled = false;
        const fakeSession = {
          create: () => Promise.reject('Error'),
          delete: () => {
            deleteCalled = true;
            return Promise.resolve();
          },
        };

        sessionPool.session_ = function() {
          return fakeSession;
        };

        return sessionPool.createWriteSession().catch(error => {
          assert.strictEqual(error, 'Error');
          assert.strictEqual(deleteCalled, true);
        });
      });
    });

    describe('open', function() {
      it('should set isOpen to true', function() {
        return sessionPool.close().then(function() {
          sessionPool = new SessionPool(DATABASE, {minReads: 4, minWrites: 4});
          sessionPool.session_ = function() {
            return new Object({
              create: () => Promise.resolve(),
              delete: () => Promise.resolve(),
            });
          };
          sessionPool.open();
          assert.strictEqual(sessionPool.isOpen, true);
          assert.strictEqual(sessionPool.getStats().readPool.size, 4);
          assert.strictEqual(sessionPool.getStats().writePool.size, 0);
          clearTimeout(sessionPool.pingTimeoutHandle);
          return sessionPool.close();
        });
      });
    });

    describe('close', function() {
      it('should destroy all sessions', function() {
        return sessionPool.close().then(function() {
          sessionPool = new SessionPool(DATABASE, {minReads: 4, minWrites: 4});
          sessionPool.createTransaction_ = () => Promise.resolve();
          sessionPool.session_ = function() {
            return new Object({
              create: () => Promise.resolve(),
              delete: () => Promise.resolve(),
            });
          };
          sessionPool.open();
          assert.strictEqual(sessionPool.isOpen, true);
          assert.strictEqual(sessionPool.getStats().readPool.size, 4);
          assert.strictEqual(sessionPool.getStats().writePool.size, 0);
          clearTimeout(sessionPool.pingTimeoutHandle);
          return sessionPool.close().then(() => {
            assert.strictEqual(sessionPool.isOpen, false);
            assert.strictEqual(sessionPool.getStats().readPool.size, 0);
            assert.strictEqual(sessionPool.getStats().writePool.size, 0);
          });
        });
      });
    });

    describe('getReadSession and getWriteSession with minReads and minWrites', function() {
      beforeEach(() => {
        sessionPool = new SessionPool(DATABASE, {
          minReads: 2,
          minWrites: 2,
          acquireTimeout: 50,
        });
      });

      afterEach(() => {
        clearTimeout(sessionPool.pingTimeoutHandle);
      });

      it('should get a read session', function() {
        sessionPool.createTransaction_ = () => Promise.resolve();
        sessionPool.session_ = function() {
          return new Object({
            lastUsed: Date.now(),
            create: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          });
        };
        sessionPool.open();
        return new Promise(resolve => setTimeout(resolve, 300)).then(() =>
          sessionPool.getReadSession().then(function(s) {
            assert.strictEqual(s.type, 'readonly');
            sessionPool.release(s);
          })
        );
      });

      it('should get a write session', function() {
        sessionPool.createTransaction_ = () => Promise.resolve();
        sessionPool.session_ = function() {
          return new Object({
            create: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          });
        };
        sessionPool.open();
        return new Promise(resolve => setTimeout(resolve, 300)).then(() =>
          sessionPool.getWriteSession().then(function(s) {
            assert.strictEqual(s.type, 'readwrite');
            sessionPool.release(s);
          })
        );
      });

      it('should not get a read session as database is closed', function() {
        sessionPool.session_ = function() {
          return new Object({
            create: () => Promise.reject(),
            delete: () => Promise.resolve(),
          });
        };
        return sessionPool.getReadSession().catch(error => {
          assert.strictEqual(error.message, 'Database is closed.');
        });
      });

      it('should not get a write session as database is closed', function() {
        sessionPool.session_ = function() {
          return new Object({
            create: () => Promise.reject(),
            delete: () => Promise.resolve(),
          });
        };
        return sessionPool.getWriteSession().catch(error => {
          assert.strictEqual(error.message, 'Database is closed.');
        });
      });
    });

    describe('release', function() {
      it('verify that a read and write session are borrowed and then release them', function() {
        sessionPool.createTransaction_ = () => Promise.resolve();
        sessionPool.session_ = function() {
          return new Object({
            create: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          });
        };
        sessionPool.open();
        clearTimeout(sessionPool.pingTimeoutHandle);
        return Promise.all([
          sessionPool.getReadSession(),
          sessionPool.getWriteSession(),
        ]).then(function(sessions) {
          const readSession = sessions[0];
          const writeSession = sessions[1];
          assert.strictEqual(sessionPool.getStats().writePool.borrowed, 1);
          assert.strictEqual(sessionPool.getStats().readPool.borrowed, 1);
          return Promise.all([
            sessionPool.release(readSession),
            sessionPool.release(writeSession),
          ]);
        });
      });

      it('should throw an error while release a write session', function() {
        let isSecondCall = false;
        sessionPool.createTransaction_ = () => {
          if (isSecondCall) {
            return Promise.reject({});
          }
          isSecondCall = true;
          return Promise.resolve();
        };
        sessionPool.session_ = function() {
          return new Object({
            create: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          });
        };
        sessionPool.open();
        clearTimeout(sessionPool.pingTimeoutHandle);
        return sessionPool.getWriteSession().then(session =>
          sessionPool.release(session).then(() => {
            assert.strictEqual(sessionPool.getStats().writePool.available, 0);
          })
        );
      });
    });

    describe('request', function() {
      let CONFIG;
      const SESSION = {
        formattedName_: 'formatted-name',
      };

      beforeEach(function() {
        CONFIG = {
          reqOpts: {},
        };

        sessionPool.getReadSession = function() {
          return Promise.resolve(SESSION);
        };

        sessionPool.release = common.util.noop;
      });

      it('should get a session', function(done) {
        sessionPool.getReadSession = function() {
          setImmediate(done);
          return Promise.resolve(SESSION);
        };

        sessionPool.request(CONFIG, assert.ifError);
      });

      it('should return error if it cannot get a session', function(done) {
        const error = new Error('Error.');

        sessionPool.getReadSession = function() {
          return Promise.reject(error);
        };

        sessionPool.request(CONFIG, function(err) {
          assert.strictEqual(err, error);
          done();
        });
      });

      it('should call the method with the session', function(done) {
        CONFIG.reqOpts = {
          a: 'b',
        };

        sessionPool.request_ = function(config) {
          assert.deepEqual(
            config.reqOpts,
            extend({}, CONFIG.reqOpts, {
              session: SESSION.formattedName_,
            })
          );
          done();
        };

        sessionPool.request(CONFIG, assert.ifError);
      });

      it('should release the session after calling the method', function(done) {
        sessionPool.release = function(session) {
          assert.strictEqual(session, SESSION);
          done();
        };

        sessionPool.request_ = function(config, callback) {
          callback();
        };

        sessionPool.request(CONFIG, assert.ifError);
      });

      it('should execute the callback with original arguments', function(done) {
        const originalArgs = ['a', 'b', 'c'];

        sessionPool.request_ = function(config, callback) {
          callback.apply(null, originalArgs);
        };

        sessionPool.request(CONFIG, function() {
          const args = [].slice.call(arguments);
          assert.deepEqual(args, originalArgs);
          done();
        });
      });
    });

    describe('requestStream', function() {
      let CONFIG;
      let REQUEST_STREAM;

      const SESSION = {
        formattedName_: 'formatted-name',
      };

      beforeEach(function() {
        REQUEST_STREAM = through();

        CONFIG = {
          reqOpts: {},
        };

        sessionPool.requestStream_ = function() {
          return REQUEST_STREAM;
        };

        sessionPool.getReadSession = function() {
          return Promise.resolve(SESSION);
        };

        sessionPool.release = common.util.noop;
      });

      it('should get a session when stream opens', function(done) {
        sessionPool.getReadSession = function() {
          setImmediate(done);
          return Promise.resolve(SESSION);
        };

        sessionPool.requestStream(CONFIG).emit('reading');
      });

      describe('could not get session', function() {
        const ERROR = new Error('Error.');

        beforeEach(function() {
          sessionPool.getReadSession = function() {
            return Promise.reject(ERROR);
          };
        });

        it('should destroy the stream', function(done) {
          sessionPool
            .requestStream(CONFIG)
            .on('error', function(err) {
              assert.strictEqual(err, ERROR);
              done();
            })
            .emit('reading');
        });
      });

      describe('session retrieved successfully', function() {
        beforeEach(function() {
          sessionPool.getReadSession = function() {
            return Promise.resolve(SESSION);
          };
        });

        it('should assign session to request options', function(done) {
          sessionPool.requestStream_ = function(config) {
            assert.strictEqual(config.reqOpts.session, SESSION.formattedName_);
            setImmediate(done);
            return through.obj();
          };

          sessionPool.requestStream(CONFIG).emit('reading');
        });

        it('should make request and pipe to the stream', function(done) {
          const responseData = Buffer.from('response-data');

          sessionPool.requestStream(CONFIG).on('data', function(data) {
            assert.deepEqual(data, responseData);
            done();
          });

          REQUEST_STREAM.end(responseData);
        });

        it('should release session when request stream ends', function(done) {
          sessionPool.release = function(session) {
            assert.strictEqual(session, SESSION);
            done();
          };

          sessionPool.requestStream(CONFIG).emit('reading');

          REQUEST_STREAM.end();
        });

        it('should release session when request stream errors', function(done) {
          sessionPool.release = function(session) {
            assert.strictEqual(session, SESSION);
            done();
          };

          sessionPool.requestStream(CONFIG).emit('reading');

          setImmediate(function() {
            REQUEST_STREAM.emit('error');
          });
        });

        it('should error user stream when request stream errors', function(done) {
          const error = new Error('Error.');

          sessionPool
            .requestStream(CONFIG)
            .on('error', function(err) {
              assert.strictEqual(err, error);
              done();
            })
            .emit('reading');

          setImmediate(function() {
            REQUEST_STREAM.destroy(error);
          });
        });
      });

      describe('abort', function() {
        let SESSION;

        beforeEach(function() {
          REQUEST_STREAM.cancel = common.util.noop;

          SESSION = {
            cancel: common.util.noop,
          };

          sessionPool.getReadSession = function() {
            return Promise.resolve(SESSION);
          };
        });

        it('should release the session', function(done) {
          sessionPool.release = function(session) {
            assert.strictEqual(session, SESSION);
            done();
          };

          const requestStream = sessionPool.requestStream(CONFIG);

          requestStream.emit('reading');

          setImmediate(function() {
            requestStream.abort();
          });
        });

        it('should not release the session more than once', function(done) {
          let numTimesReleased = 0;
          sessionPool.release = function(session) {
            numTimesReleased++;
            assert.strictEqual(session, SESSION);
          };

          const requestStream = sessionPool.requestStream(CONFIG);

          requestStream.emit('reading');

          setImmediate(function() {
            requestStream.abort();
            assert.strictEqual(numTimesReleased, 1);

            requestStream.abort();
            assert.strictEqual(numTimesReleased, 1);

            done();
          });
        });

        it('should cancel the request stream', function(done) {
          REQUEST_STREAM.cancel = done;

          const requestStream = sessionPool.requestStream(CONFIG);

          requestStream.emit('reading');

          setImmediate(function() {
            requestStream.abort();
          });
        });
      });
    });

    describe('createTransaction_', function() {
      let fakeSession;
      let fakeTxn;

      beforeEach(function() {
        fakeTxn = {
          end: function(callback) {
            (common.util.noop || callback)();
          },
          begin: function() {
            return Promise.resolve();
          },
        };

        fakeSession = {
          transaction: function() {
            return fakeTxn;
          },
        };

        sessionPool.release = common.util.noop;
      });

      it('should create a txn object', function(done) {
        const fakeOptions = {};

        fakeSession.transaction = function(options) {
          assert.strictEqual(options, fakeOptions);
          setImmediate(done);
          return fakeTxn;
        };

        sessionPool.createTransaction_(fakeSession, fakeOptions);
      });

      it('should stub Transaction#end', function(done) {
        let released = false;
        sessionPool.release = function(session) {
          assert.strictEqual(session, fakeSession);
          released = true;
        };

        fakeTxn.end = function(callback) {
          assert.strictEqual(this, fakeTxn);
          assert.strictEqual(released, true);
          callback(); // the done fn
        };

        sessionPool.createTransaction_(fakeSession);
        fakeTxn.end(done);
      });

      it('should cache the txn object', function() {
        return sessionPool.createTransaction_(fakeSession).then(function() {
          assert.strictEqual(fakeSession.txn, fakeTxn);
        });
      });
    });

    describe('destroySession', function() {
      let fakeSession;

      beforeEach(function() {
        fakeSession = {
          type: 'readonly',
          delete: function() {
            return Promise.resolve();
          },
        };

        sessionPool.reads_ = [fakeSession];
      });

      it('should delete the session', function() {
        let deleted = false;

        fakeSession.delete = function() {
          deleted = true;
          return Promise.resolve();
        };

        return sessionPool.destroySession(fakeSession).then(function() {
          assert.strictEqual(deleted, true);
        });
      });
    });
  });

  describe('tests with min session pool before hook', function() {
    let sessionPool;
    // Because we create a sessionPool here for every test tests which want to open
    // their own pool must first close this one and wait on its returned promise.
    // Otherwise the tests will have resource leaks.
    beforeEach(function() {
      sessionPool = new SessionPool(DATABASE, {
        minReads: 10,
        minWrites: 5,
        acquireTimeout: 50,
      });
    });

    afterEach(function() {
      clearTimeout(sessionPool.pingTimeoutHandle);
      if (sessionPool.isOpen) {
        return sessionPool.close();
      }
    });

    describe('sendKeepAlive_', function() {
      let readSession = null;
      let writeSession = null;
      beforeEach(function() {
        sessionPool.createTransaction_ = a => Promise.resolve(a);
        sessionPool.session_ = function() {
          return new Object({
            create: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          });
        };
        sessionPool.open();
        return sessionPool.getReadSession().then(function(rs) {
          readSession = rs;
          return sessionPool.getWriteSession().then(function(ws) {
            writeSession = ws;
          });
        });
      });

      afterEach(function() {
        clearTimeout(sessionPool.pingTimeoutHandle);
        return Promise.all([
          sessionPool.release(readSession),
          sessionPool.release(writeSession),
        ]).catch(err => {
          // Tests which destroy sessions will cause this error
          if (err.message !== 'Resource not currently part of this pool') {
            throw err;
          }
        });
      });

      it('should send keep alive on read session', function() {
        let keptAlive = false;
        readSession.keepAlive = function() {
          keptAlive = true;
          return Promise.resolve();
        };
        return sessionPool.sendKeepAlive_(readSession).then(function() {
          assert.strictEqual(keptAlive, true);
        });
      });

      it('should send keep alive on write session', function() {
        let keptAlive = false;
        writeSession.keepAlive = function() {
          keptAlive = true;
          return Promise.resolve();
        };
        return sessionPool.sendKeepAlive_(writeSession).then(function() {
          assert.strictEqual(keptAlive, true);
        });
      });

      it('should destroy the read session when keep alive message fails', function() {
        let keptAlive = false;
        let deleted = false;
        readSession.keepAlive = function() {
          keptAlive = false;
          return Promise.reject();
        };
        readSession.delete = function() {
          deleted = true;
          return Promise.resolve();
        };

        return sessionPool.sendKeepAlive_(readSession).then(function() {
          assert.strictEqual(keptAlive, false);
          assert.strictEqual(deleted, true);
          assert.strictEqual(sessionPool.getStats().readPool.available, 9);
        });
      });

      it('should destroy the write session when keep alive message fails', function() {
        let keptAlive = false;
        let deleted = false;
        writeSession.keepAlive = function() {
          keptAlive = false;
          return Promise.reject();
        };
        writeSession.delete = function() {
          deleted = true;
          return Promise.resolve();
        };

        return sessionPool.sendKeepAlive_(writeSession).then(function() {
          assert.strictEqual(keptAlive, false);
          assert.strictEqual(deleted, true);
        });
      });

      it('should handle when invalid session is passed', function() {
        let keptAlive = false;
        let deleted = false;
        writeSession.keepAlive = function() {
          keptAlive = false;
          return Promise.reject();
        };
        writeSession.delete = function() {
          deleted = true;
          return Promise.resolve();
        };

        sessionPool.sendKeepAlive_().then(function() {
          assert.strictEqual(keptAlive, false);
          assert.strictEqual(deleted, false);
        });
      });
    });
  });

  describe('pingSession', function() {
    let sessionPool;
    beforeEach(function() {
      sessionPool = new SessionPool(DATABASE, {
        maxReads: 10,
        minReads: 10,
        minWrites: 5,
        keepAlive: 0.0001,
      });
    });

    it('should ping min read and write session', function() {
      let readKeepAlive = 0;
      let writeKeepAlive = 0;
      sessionPool.createTransaction_ = () => Promise.resolve();
      sessionPool.sendKeepAlive_ = s => {
        if (s.type === 'readonly') {
          readKeepAlive++;
        } else {
          writeKeepAlive++;
        }
        sessionPool.release(s);
        return Promise.resolve();
      };
      sessionPool.session_ = function() {
        return new Object({
          create: () => Promise.resolve(),
          delete: () => Promise.resolve(),
        });
      };
      sessionPool.open();
      // Clear timeout open() call sets
      // sessionPool.pingSessions_();
      return new Promise(resolve => {
        setTimeout(() => {
          clearTimeout(sessionPool.pingTimeoutHandle);
          assert.strictEqual(readKeepAlive, 20);
          assert.strictEqual(writeKeepAlive, 10);
          return resolve();
        }, 16);
      });
    });

    afterEach(function() {
      return sessionPool.close();
    });
  });

  describe('should convert one session into another', function() {
    let sessionPool;
    // Because we create a sessionPool here for every test tests which want to open
    // their own pool must first close this one and wait on its returned promise.
    // Otherwise the tests will have resource leaks.
    beforeEach(function() {
      sessionPool = new SessionPool(DATABASE, {
        maxReads: 3,
        maxWrites: 3,
        minReads: 2,
        minWrites: 2,
        acquireTimeout: 50,
      });
      sessionPool.createTransaction_ = a => Promise.resolve(a);
      sessionPool.session_ = function() {
        return new Object({
          create: () => Promise.resolve(),
          delete: () => Promise.resolve(),
        });
      };
      sessionPool.open();
      clearTimeout(sessionPool.pingTimeoutHandle);
    });

    afterEach(() => {
      if (sessionPool.isOpen) {
        return sessionPool.close();
      }
    });

    function releaseAllSessions(sessions, sessionpool) {
      const promises = [];
      sessions.forEach(session => {
        if (!session.deleted) {
          promises.push(sessionpool.release(session));
        }
      });
      return Promise.all(promises);
    }

    it('convert a write session into a read session', () => {
      let allSessions = [];
      return new Promise(resolve => setTimeout(resolve, 100)).then(() =>
        Promise.all([
          sessionPool.getReadSession(),
          sessionPool.getReadSession(),
          sessionPool.getReadSession(),
          sessionPool.getWriteSession(),
          sessionPool.getWriteSession(),
        ])
          .then(sessions => {
            allSessions = allSessions.concat(sessions);
            let stats = sessionPool.getStats();
            assert.strictEqual(stats.readPool.spareResourceCapacity, 0);
            assert.strictEqual(stats.readPool.size, 3);
            assert.strictEqual(stats.readPool.available, 0);
            assert.strictEqual(stats.readPool.borrowed, 3);
            assert.strictEqual(stats.readPool.pending, 0);
            assert.strictEqual(stats.readPool.max, 3);
            assert.strictEqual(stats.readPool.min, 2);
            assert.strictEqual(stats.writePool.spareResourceCapacity, 1);
            assert.strictEqual(stats.writePool.size, 2);
            assert.strictEqual(stats.writePool.available, 0);
            assert.strictEqual(stats.writePool.borrowed, 2);
            assert.strictEqual(stats.writePool.pending, 0);
            assert.strictEqual(stats.writePool.max, 3);
            assert.strictEqual(stats.writePool.min, 2);
            sessions[4].deleted = true;
            return sessionPool.release(sessions[4]);
          })
          .then(() => {
            let stats = sessionPool.getStats();
            assert.strictEqual(stats.readPool.spareResourceCapacity, 0);
            assert.strictEqual(stats.readPool.size, 3);
            assert.strictEqual(stats.readPool.available, 0);
            assert.strictEqual(stats.readPool.borrowed, 3);
            assert.strictEqual(stats.readPool.pending, 0);
            assert.strictEqual(stats.readPool.max, 3);
            assert.strictEqual(stats.readPool.min, 2);
            assert.strictEqual(stats.writePool.spareResourceCapacity, 1);
            assert.strictEqual(stats.writePool.size, 2);
            assert.strictEqual(stats.writePool.available, 1);
            assert.strictEqual(stats.writePool.borrowed, 1);
            assert.strictEqual(stats.writePool.pending, 0);
            assert.strictEqual(stats.writePool.max, 3);
            assert.strictEqual(stats.writePool.min, 2);
            return sessionPool.getReadSession();
          })
          .then(session => {
            allSessions = allSessions.concat([session]);
            let stats = sessionPool.getStats();
            assert.strictEqual(stats.readPool.spareResourceCapacity, 0);
            assert.strictEqual(stats.readPool.size, 3);
            assert.strictEqual(stats.readPool.available, 0);
            assert.strictEqual(stats.readPool.borrowed, 3);
            assert.strictEqual(stats.readPool.pending, 0);
            assert.strictEqual(stats.readPool.max, 3);
            assert.strictEqual(stats.readPool.min, 2);
            assert.strictEqual(stats.writePool.spareResourceCapacity, 1);
            assert.strictEqual(stats.writePool.size, 2);
            assert.strictEqual(stats.writePool.available, 0);
            assert.strictEqual(stats.writePool.borrowed, 2);
            assert.strictEqual(stats.writePool.pending, 0);
            assert.strictEqual(stats.writePool.max, 3);
            assert.strictEqual(stats.writePool.min, 2);
            return releaseAllSessions(allSessions, sessionPool);
          })
      );
    });

    it('convert a read session into a write session', () => {
      let allSessions = [];
      return new Promise(resolve => setTimeout(resolve, 200)).then(() =>
        Promise.all([
          sessionPool.getReadSession(),
          sessionPool.getReadSession(),
          sessionPool.getWriteSession(),
          sessionPool.getWriteSession(),
          sessionPool.getWriteSession(),
        ])
          .then(sessions => {
            allSessions = allSessions.concat(sessions);
            let stats = sessionPool.getStats();
            assert.strictEqual(stats.readPool.spareResourceCapacity, 1);
            assert.strictEqual(stats.readPool.size, 2);
            assert.strictEqual(stats.readPool.available, 0);
            assert.strictEqual(stats.readPool.borrowed, 2);
            assert.strictEqual(stats.readPool.pending, 0);
            assert.strictEqual(stats.readPool.max, 3);
            assert.strictEqual(stats.readPool.min, 2);
            assert.strictEqual(stats.writePool.spareResourceCapacity, 0);
            assert.strictEqual(stats.writePool.size, 3);
            assert.strictEqual(stats.writePool.available, 0);
            assert.strictEqual(stats.writePool.borrowed, 3);
            assert.strictEqual(stats.writePool.pending, 0);
            assert.strictEqual(stats.writePool.max, 3);
            assert.strictEqual(stats.writePool.min, 2);
            sessions[0].deleted = true;
            return sessionPool.release(sessions[0]);
          })
          .then(() => {
            let stats = sessionPool.getStats();
            assert.strictEqual(stats.readPool.spareResourceCapacity, 1);
            assert.strictEqual(stats.readPool.size, 2);
            assert.strictEqual(stats.readPool.available, 1);
            assert.strictEqual(stats.readPool.borrowed, 1);
            assert.strictEqual(stats.readPool.pending, 0);
            assert.strictEqual(stats.readPool.max, 3);
            assert.strictEqual(stats.readPool.min, 2);
            assert.strictEqual(stats.writePool.spareResourceCapacity, 0);
            assert.strictEqual(stats.writePool.size, 3);
            assert.strictEqual(stats.writePool.available, 0);
            assert.strictEqual(stats.writePool.borrowed, 3);
            assert.strictEqual(stats.writePool.pending, 0);
            assert.strictEqual(stats.writePool.max, 3);
            assert.strictEqual(stats.writePool.min, 2);
            return sessionPool.getWriteSession();
          })
          .then(session => {
            allSessions = allSessions.concat([session]);
            let stats = sessionPool.getStats();
            assert.strictEqual(stats.readPool.spareResourceCapacity, 1);
            assert.strictEqual(stats.readPool.size, 2);
            assert.strictEqual(stats.readPool.available, 0);
            assert.strictEqual(stats.readPool.borrowed, 2);
            assert.strictEqual(stats.readPool.pending, 0);
            assert.strictEqual(stats.readPool.max, 3);
            assert.strictEqual(stats.readPool.min, 2);
            assert.strictEqual(stats.writePool.spareResourceCapacity, 0);
            assert.strictEqual(stats.writePool.size, 3);
            assert.strictEqual(stats.writePool.available, 0);
            assert.strictEqual(stats.writePool.borrowed, 3);
            assert.strictEqual(stats.writePool.pending, 0);
            assert.strictEqual(stats.writePool.max, 3);
            assert.strictEqual(stats.writePool.min, 2);
            return releaseAllSessions(allSessions, sessionPool);
          })
      );
    });

    it('convert a read session into a write session and vice versa (this is for more test coverage)', () => {
      let allSessions = [];
      return new Promise(resolve => setTimeout(resolve, 100)).then(() =>
        Promise.all([
          sessionPool.getReadSession(),
          sessionPool.getReadSession(),
          sessionPool.getReadSession(),
          sessionPool.getWriteSession(),
          sessionPool.getWriteSession(),
          sessionPool.getWriteSession(),
        ])
          .then(sessions => {
            allSessions = sessions;
            sessions[0].deleted = true;
            let stats = sessionPool.getStats();
            assert(stats.readPool.borrowed, 3);
            assert(stats.writePool.borrowed, 3);
            return sessionPool.release(sessions[0]);
          })
          .then(() => {
            let stats = sessionPool.getStats();
            assert(stats.readPool.borrowed, 2);
            assert(stats.writePool.borrowed, 3);
            return sessionPool.getWriteSession();
          })
          .then(session => {
            let stats = sessionPool.getStats();
            assert(stats.readPool.borrowed, 3);
            assert(stats.writePool.borrowed, 3);
            return sessionPool.release(session);
          })
          .then(() => {
            let stats = sessionPool.getStats();
            assert(stats.readPool.borrowed, 2);
            assert(stats.writePool.borrowed, 3);
            return sessionPool.getReadSession();
          })
          .then(session => {
            let stats = sessionPool.getStats();
            assert(stats.readPool.borrowed, 3);
            assert(stats.writePool.borrowed, 3);
            let t = allSessions[5];
            t.deleted = true;
            allSessions.push(session);
            return sessionPool.release(t);
          })
          .then(() => {
            let stats = sessionPool.getStats();
            assert(stats.readPool.borrowed, 3);
            assert(stats.writePool.borrowed, 2);
            return sessionPool.getReadSession();
          })
          .then(session => {
            let stats = sessionPool.getStats();
            assert(stats.readPool.borrowed, 3);
            assert(stats.writePool.borrowed, 3);
            allSessions.push(session);
            return releaseAllSessions(allSessions, sessionPool);
          })
      );
    });
  });

  function isAround(expected, actual) {
    return actual > expected - 10 && actual < expected + 50;
  }
});
