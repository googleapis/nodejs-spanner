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
const extend = require('extend');
const proxyquire = require('proxyquire');
const {util} = require('@google-cloud/common-grpc');
const pfy = require('@google-cloud/promisify');

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

function FakeGrpcServiceObject() {
  this.calledWith_ = arguments;
}

function FakeTransaction() {
  this.calledWith_ = arguments;
}

describe('Session', function() {
  let Session;
  let session;

  const DATABASE = {
    request: util.noop,
    formattedName_: 'formatted-database-name',
  };

  const NAME = 'session-name';

  before(function() {
    Session = proxyquire('../src/session.js', {
      '@google-cloud/common-grpc': {
        ServiceObject: FakeGrpcServiceObject,
      },
      '@google-cloud/promisify': fakePfy,
      './transaction.js': FakeTransaction,
    });
  });

  beforeEach(function() {
    session = new Session(DATABASE, NAME);
  });

  describe('instantiation', function() {
    it('should promisify all the things', function() {
      assert(promisified);
    });

    it('should localize the request function', function() {
      assert.strictEqual(session.request, DATABASE.request);
    });

    it('should localize the requestStream function', function() {
      assert.strictEqual(session.requestStream, DATABASE.requestStream);
    });

    it('should format the name', function() {
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

    it('should inherit from ServiceObject', function() {
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

    describe('createMethod', function() {
      it('should create and return a Session', function(done) {
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

        session.calledWith_[0].createMethod(options, function(err, sess, resp) {
          assert.ifError(err);

          assert.strictEqual(sess, session);

          assert.strictEqual(session.uniqueProperty, true);

          assert.strictEqual(resp, apiResponse);

          done();
        });
      });

      it('should return an error from creating a Session', function(done) {
        const error = new Error('Error.');
        const apiResponse = {};

        const databaseInstance = extend({}, DATABASE, {
          createSession: function(options_, callback) {
            callback(error, null, apiResponse);
          },
        });

        const session = new Session(databaseInstance, NAME);
        assert(session instanceof FakeGrpcServiceObject);

        session.calledWith_[0].createMethod({}, function(err, sess, resp) {
          assert.strictEqual(err, error);
          assert.strictEqual(sess, null);
          assert.strictEqual(resp, apiResponse);
          done();
        });
      });
    });
  });

  describe('formatName_', function() {
    const PATH = DATABASE.formattedName_ + '/sessions/' + NAME;

    it('should return the name if already formatted', function() {
      assert.strictEqual(
        Session.formatName_(DATABASE.formattedName_, PATH),
        PATH
      );
    });

    it('should format the name', function() {
      const formattedName = Session.formatName_(DATABASE.formattedName_, NAME);
      assert.strictEqual(formattedName, PATH);
    });
  });

  describe('beginTransaction', function() {
    let TRANSACTION;
    let RESPONSE;

    beforeEach(function() {
      TRANSACTION = {begin: util.noop};
      RESPONSE = {};
      session.transaction = () => TRANSACTION;
    });

    it('should pass the transaction options', function(done) {
      const OPTIONS = {};

      session.transaction = function(options) {
        assert.strictEqual(options, OPTIONS);
        done();
      };

      session.beginTransaction(OPTIONS, assert.ifError);
    });

    it('should begin a transaction', function(done) {
      TRANSACTION.begin = function(callback) {
        callback(null, RESPONSE);
      };

      session.beginTransaction(function(err, transaction, response) {
        assert.ifError(err);
        assert.strictEqual(transaction, TRANSACTION);
        assert.strictEqual(response, RESPONSE);
        done();
      });
    });

    it('should return any api errors', function(done) {
      const ERROR = new Error('err');

      TRANSACTION.begin = function(callback) {
        callback(ERROR, RESPONSE);
      };

      session.beginTransaction(function(err, transaction, response) {
        assert.strictEqual(err, ERROR);
        assert.strictEqual(transaction, null);
        assert.strictEqual(response, RESPONSE);
        done();
      });
    });
  });

  describe('delete', function() {
    it('should correctly call and return the request', function() {
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

  describe('getMetadata', function() {
    it('should correctly call and return the request', function() {
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

  describe('keepAlive', function() {
    it('should correctly call and return the request', function() {
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

  describe('transaction', function() {
    const ID = 'transaction-id';

    it('should return a Transaction object', function() {
      const transaction = session.transaction(ID);
      assert(transaction instanceof FakeTransaction);
      assert.strictEqual(transaction.calledWith_[0], session);
      assert.strictEqual(transaction.calledWith_[1], ID);
    });
  });
});
