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

import * as assert from 'assert';
import * as extend from 'extend';
import * as proxyquire from 'proxyquire';
import {util} from '@google-cloud/common-grpc';
import * as pfy from '@google-cloud/promisify';

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'Session') {
      return;
    }

    promisified = true;
    assert.deepStrictEqual(options.exclude, [
      'delete',
      'getMetadata',
      'transaction',
    ]);
  },
});

class FakeGrpcServiceObject {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

class FakeTransaction {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

describe('Session', () => {
  let Session;
  let session;

  const DATABASE: any = {
    request: util.noop,
    formattedName_: 'formatted-database-name',
  };

  const NAME = 'session-name';

  before(() => {
    Session = proxyquire('../src/session.js', {
      '@google-cloud/common-grpc': {
        ServiceObject: FakeGrpcServiceObject,
      },
      '@google-cloud/promisify': fakePfy,
      './transaction.js': {Transaction: FakeTransaction},
    }).Session;
  });

  beforeEach(() => {
    session = new Session(DATABASE, NAME);
  });

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should localize the request function', () => {
      assert.strictEqual(session.request, DATABASE.request);
    });

    it('should localize the requestStream function', () => {
      assert.strictEqual(session.requestStream, DATABASE.requestStream);
    });

    it('should format the name', () => {
      const formatName_ = Session.formatName_;
      const formattedName = 'formatted-name';

      Session.formatName_ = function(databaseName, name) {
        Session.formatName_ = formatName_;

        assert.strictEqual(databaseName, DATABASE.formattedName_);
        assert.strictEqual(name, NAME);

        return formattedName;
      };

      const instance = new Session(DATABASE, NAME);
      assert(instance.formattedName_, formattedName);
    });

    it('should inherit from ServiceObject', () => {
      assert(session instanceof FakeGrpcServiceObject);

      const calledWith = session.calledWith_[0];

      assert.strictEqual(calledWith.parent, DATABASE);
      assert.strictEqual(calledWith.id, NAME);
      assert.deepStrictEqual(calledWith.methods, {
        create: true,
        exists: true,
        get: true,
      });
    });

    describe('createMethod', () => {
      it('should create and return a Session', done => {
        const options = {};

        const apiResponse = {};

        const createdSession = {
          uniqueProperty: true,
        };

        const databaseInstance = extend({}, DATABASE, {
          createSession: function(options_, callback) {
            assert.strictEqual(options_, options);
            callback(null, createdSession, apiResponse);
          },
        });

        const session = new Session(databaseInstance, NAME);
        assert(session instanceof FakeGrpcServiceObject);

        session.calledWith_[0].createMethod(
          null,
          options,
          (err, sess, resp) => {
            assert.ifError(err);

            assert.strictEqual(sess, session);

            assert.strictEqual(session.uniqueProperty, true);

            assert.strictEqual(resp, apiResponse);

            done();
          }
        );
      });

      it('should check for options', done => {
        const databaseInstance = extend({}, DATABASE, {
          createSession: function(options, callback) {
            assert.deepStrictEqual(options, {});
            callback(null, {}, apiResponse);
          },
        });

        const session = new Session(databaseInstance, NAME);
        const apiResponse = {};

        session.calledWith_[0].createMethod(null, (err, sess, resp) => {
          assert.ifError(err);
          assert.strictEqual(sess, session);
          assert.strictEqual(resp, apiResponse);
          done();
        });
      });

      it('should return an error from creating a Session', done => {
        const error = new Error('Error.');
        const apiResponse = {};

        const databaseInstance = extend({}, DATABASE, {
          createSession: function(options_, callback) {
            callback(error, null, apiResponse);
          },
        });

        const session = new Session(databaseInstance, NAME);
        assert(session instanceof FakeGrpcServiceObject);

        session.calledWith_[0].createMethod(null, {}, (err, sess, resp) => {
          assert.strictEqual(err, error);
          assert.strictEqual(sess, null);
          assert.strictEqual(resp, apiResponse);
          done();
        });
      });
    });
  });

  describe('formatName_', () => {
    const PATH = DATABASE.formattedName_ + '/sessions/' + NAME;

    it('should return the name if already formatted', () => {
      assert.strictEqual(
        Session.formatName_(DATABASE.formattedName_, PATH),
        PATH
      );
    });

    it('should format the name', () => {
      const formattedName = Session.formatName_(DATABASE.formattedName_, NAME);
      assert.strictEqual(formattedName, PATH);
    });
  });

  describe('beginTransaction', () => {
    let TRANSACTION;
    let RESPONSE;

    beforeEach(() => {
      TRANSACTION = {begin: util.noop};
      RESPONSE = {};
      session.transaction = () => TRANSACTION;
    });

    it('should pass the transaction options', done => {
      const OPTIONS = {};

      session.transaction = function(options) {
        assert.strictEqual(options, OPTIONS);
        done();
      };

      session.beginTransaction(OPTIONS, assert.ifError);
    });

    it('should begin a transaction', done => {
      TRANSACTION.begin = function(callback) {
        callback(null, RESPONSE);
      };

      session.beginTransaction((err, transaction, response) => {
        assert.ifError(err);
        assert.strictEqual(transaction, TRANSACTION);
        assert.strictEqual(response, RESPONSE);
        done();
      });
    });

    it('should return any api errors', done => {
      const ERROR = new Error('err');

      TRANSACTION.begin = function(callback) {
        callback(ERROR, RESPONSE);
      };

      session.beginTransaction((err, transaction, response) => {
        assert.strictEqual(err, ERROR);
        assert.strictEqual(transaction, null);
        assert.strictEqual(response, RESPONSE);
        done();
      });
    });
  });

  describe('delete', () => {
    it('should correctly call and return the request', () => {
      const requestReturnValue = {};

      function callback() {}

      session.request = function(config, callback_) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'deleteSession');
        assert.deepStrictEqual(config.reqOpts, {
          name: session.formattedName_,
        });
        assert.strictEqual(callback_, callback);
        return requestReturnValue;
      };

      const returnValue = session.delete(callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('getMetadata', () => {
    it('should correctly call and return the request', () => {
      const requestReturnValue = {};

      function callback() {}

      session.request = function(config, callback_) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'getSession');
        assert.deepStrictEqual(config.reqOpts, {
          name: session.formattedName_,
        });
        assert.strictEqual(callback_, callback);
        return requestReturnValue;
      };

      const returnValue = session.getMetadata(callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('keepAlive', () => {
    it('should correctly call and return the request', () => {
      const requestReturnValue = {};

      function callback() {}

      session.request = function(config, callback_) {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'executeSql');
        assert.deepStrictEqual(config.reqOpts, {
          session: session.formattedName_,
          sql: 'SELECT 1',
        });
        assert.strictEqual(callback_, callback);
        return requestReturnValue;
      };

      const returnValue = session.keepAlive(callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('transaction', () => {
    const ID = 'transaction-id';

    it('should return a Transaction object', () => {
      const transaction = session.transaction(ID);
      assert(transaction instanceof FakeTransaction);
      assert.strictEqual(transaction.calledWith_[0], session);
      assert.strictEqual(transaction.calledWith_[1], ID);
    });
  });
});
