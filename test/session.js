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

var assert = require('assert');
var extend = require('extend');
var proxyquire = require('proxyquire');
var util = require('@google-cloud/common-grpc').util;

var promisified = false;
var fakeUtil = extend({}, util, {
  promisifyAll: function(Class, options) {
    if (Class.name !== 'Session') {
      return;
    }

    promisified = true;
    assert.deepStrictEqual(options.exclude, ['delete', 'getMetadata', 'transaction']);
  },
});

function FakeGrpcServiceObject() {
  this.calledWith_ = arguments;
}

function FakeTransaction() {
  this.calledWith_ = arguments;
}

describe('Session', function() {
  var Session;
  var session;

  var DATABASE = {
    request: util.noop,
    formattedName_: 'formatted-database-name',
  };

  var NAME = 'session-name';

  before(function() {
    Session = proxyquire('../src/session.js', {
      '@google-cloud/common-grpc': {
        util: fakeUtil,
        ServiceObject: FakeGrpcServiceObject,
      },
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
      var formatName_ = Session.formatName_;
      var formattedName = 'formatted-name';

      Session.formatName_ = function(databaseName, name) {
        Session.formatName_ = formatName_;

        assert.strictEqual(databaseName, DATABASE.formattedName_);
        assert.strictEqual(name, NAME);

        return formattedName;
      };

      var instance = new Session(DATABASE, NAME);
      assert(instance.formattedName_, formattedName);
    });

    it('should inherit from ServiceObject', function() {
      assert(session instanceof FakeGrpcServiceObject);

      var calledWith = session.calledWith_[0];

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
        var options = {};

        var apiResponse = {};

        var createdSession = {
          uniqueProperty: true,
        };

        var databaseInstance = extend({}, DATABASE, {
          createSession: function(options_, callback) {
            assert.strictEqual(options_, options);
            callback(null, createdSession, apiResponse);
          },
        });

        var session = new Session(databaseInstance, NAME);
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
        var error = new Error('Error.');
        var apiResponse = {};

        var databaseInstance = extend({}, DATABASE, {
          createSession: function(options_, callback) {
            callback(error, null, apiResponse);
          },
        });

        var session = new Session(databaseInstance, NAME);
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
    var PATH = DATABASE.formattedName_ + '/sessions/' + NAME;

    it('should return the name if already formatted', function() {
      assert.strictEqual(
        Session.formatName_(DATABASE.formattedName_, PATH),
        PATH
      );
    });

    it('should format the name', function() {
      var formattedName = Session.formatName_(DATABASE.formattedName_, NAME);
      assert.strictEqual(formattedName, PATH);
    });
  });

  describe('delete', function() {
    it('should correctly call and return the request', function() {
      var requestReturnValue = {};

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

      var returnValue = session.delete(callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('getMetadata', function() {
    it('should correctly call and return the request', function() {
      var requestReturnValue = {};

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

      var returnValue = session.getMetadata(callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('keepAlive', function() {
    it('should correctly call and return the request', function() {
      var requestReturnValue = {};

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

      var returnValue = session.keepAlive(callback);
      assert.strictEqual(returnValue, requestReturnValue);
    });
  });

  describe('transaction', function() {
    var ID = 'transaction-id';

    it('should return a Transaction object', function() {
      var transaction = session.transaction(ID);
      assert(transaction instanceof FakeTransaction);
      assert.strictEqual(transaction.calledWith_[0], session);
      assert.strictEqual(transaction.calledWith_[1], ID);
    });
  });
});
