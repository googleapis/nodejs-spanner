// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const assert = require('assert');
const through2 = require('through2');

const spannerModule = require('../src');

var FAKE_STATUS_CODE = 1;
var error = new Error();
error.code = FAKE_STATUS_CODE;

describe('SpannerClient', () => {
  describe('createSession', () => {
    it('invokes createSession without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databasePath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock response
      var name = 'name3373707';
      var expectedResponse = {
        name: name,
      };

      // Mock Grpc layer
      client._innerApiCalls.createSession = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.createSession(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes createSession with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databasePath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.createSession = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.createSession(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('getSession', () => {
    it('invokes getSession without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var request = {
        name: formattedName,
      };

      // Mock response
      var name2 = 'name2-1052831874';
      var expectedResponse = {
        name: name2,
      };

      // Mock Grpc layer
      client._innerApiCalls.getSession = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.getSession(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getSession with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getSession = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.getSession(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('listSessions', () => {
    it('invokes listSessions without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databasePath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock response
      var nextPageToken = '';
      var sessionsElement = {};
      var sessions = [sessionsElement];
      var expectedResponse = {
        nextPageToken: nextPageToken,
        sessions: sessions,
      };

      // Mock Grpc layer
      client._innerApiCalls.listSessions = (
        actualRequest,
        options,
        callback
      ) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.sessions);
      };

      client.listSessions(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.sessions);
        done();
      });
    });

    it('invokes listSessions with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedDatabase = client.databasePath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]'
      );
      var request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.listSessions = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.listSessions(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('deleteSession', () => {
    it('invokes deleteSession without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteSession = mockSimpleGrpcMethod(request);

      client.deleteSession(request, err => {
        assert.ifError(err);
        done();
      });
    });

    it('invokes deleteSession with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteSession = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.deleteSession(request, err => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('executeSql', () => {
    it('invokes executeSql without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var sql = 'sql114126';
      var request = {
        session: formattedSession,
        sql: sql,
      };

      // Mock response
      var expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.executeSql = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.executeSql(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes executeSql with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var sql = 'sql114126';
      var request = {
        session: formattedSession,
        sql: sql,
      };

      // Mock Grpc layer
      client._innerApiCalls.executeSql = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.executeSql(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('executeStreamingSql', () => {
    it('invokes executeStreamingSql without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var sql = 'sql114126';
      var request = {
        session: formattedSession,
        sql: sql,
      };

      // Mock response
      var chunkedValue = true;
      var resumeToken = '103';
      var expectedResponse = {
        chunkedValue: chunkedValue,
        resumeToken: resumeToken,
      };

      // Mock Grpc layer
      client._innerApiCalls.executeStreamingSql = mockServerStreamingGrpcMethod(
        request,
        expectedResponse
      );

      var stream = client.executeStreamingSql(request);
      stream.on('data', response => {
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
      stream.on('error', err => {
        done(err);
      });

      stream.write();
    });

    it('invokes executeStreamingSql with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var sql = 'sql114126';
      var request = {
        session: formattedSession,
        sql: sql,
      };

      // Mock Grpc layer
      client._innerApiCalls.executeStreamingSql = mockServerStreamingGrpcMethod(
        request,
        null,
        error
      );

      var stream = client.executeStreamingSql(request);
      stream.on('data', () => {
        assert.fail();
      });
      stream.on('error', err => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        done();
      });

      stream.write();
    });
  });

  describe('read', () => {
    it('invokes read without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var table = 'table110115790';
      var columns = [];
      var keySet = {};
      var request = {
        session: formattedSession,
        table: table,
        columns: columns,
        keySet: keySet,
      };

      // Mock response
      var expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.read = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.read(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes read with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var table = 'table110115790';
      var columns = [];
      var keySet = {};
      var request = {
        session: formattedSession,
        table: table,
        columns: columns,
        keySet: keySet,
      };

      // Mock Grpc layer
      client._innerApiCalls.read = mockSimpleGrpcMethod(request, null, error);

      client.read(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('streamingRead', () => {
    it('invokes streamingRead without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var table = 'table110115790';
      var columns = [];
      var keySet = {};
      var request = {
        session: formattedSession,
        table: table,
        columns: columns,
        keySet: keySet,
      };

      // Mock response
      var chunkedValue = true;
      var resumeToken = '103';
      var expectedResponse = {
        chunkedValue: chunkedValue,
        resumeToken: resumeToken,
      };

      // Mock Grpc layer
      client._innerApiCalls.streamingRead = mockServerStreamingGrpcMethod(
        request,
        expectedResponse
      );

      var stream = client.streamingRead(request);
      stream.on('data', response => {
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
      stream.on('error', err => {
        done(err);
      });

      stream.write();
    });

    it('invokes streamingRead with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var table = 'table110115790';
      var columns = [];
      var keySet = {};
      var request = {
        session: formattedSession,
        table: table,
        columns: columns,
        keySet: keySet,
      };

      // Mock Grpc layer
      client._innerApiCalls.streamingRead = mockServerStreamingGrpcMethod(
        request,
        null,
        error
      );

      var stream = client.streamingRead(request);
      stream.on('data', () => {
        assert.fail();
      });
      stream.on('error', err => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        done();
      });

      stream.write();
    });
  });

  describe('beginTransaction', () => {
    it('invokes beginTransaction without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var options = {};
      var request = {
        session: formattedSession,
        options: options,
      };

      // Mock response
      var id = '27';
      var expectedResponse = {
        id: id,
      };

      // Mock Grpc layer
      client._innerApiCalls.beginTransaction = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.beginTransaction(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes beginTransaction with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var options = {};
      var request = {
        session: formattedSession,
        options: options,
      };

      // Mock Grpc layer
      client._innerApiCalls.beginTransaction = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.beginTransaction(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('commit', () => {
    it('invokes commit without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var mutations = [];
      var request = {
        session: formattedSession,
        mutations: mutations,
      };

      // Mock response
      var expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.commit = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.commit(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes commit with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var mutations = [];
      var request = {
        session: formattedSession,
        mutations: mutations,
      };

      // Mock Grpc layer
      client._innerApiCalls.commit = mockSimpleGrpcMethod(request, null, error);

      client.commit(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('rollback', () => {
    it('invokes rollback without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var transactionId = '28';
      var request = {
        session: formattedSession,
        transactionId: transactionId,
      };

      // Mock Grpc layer
      client._innerApiCalls.rollback = mockSimpleGrpcMethod(request);

      client.rollback(request, err => {
        assert.ifError(err);
        done();
      });
    });

    it('invokes rollback with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var transactionId = '28';
      var request = {
        session: formattedSession,
        transactionId: transactionId,
      };

      // Mock Grpc layer
      client._innerApiCalls.rollback = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.rollback(request, err => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('partitionQuery', () => {
    it('invokes partitionQuery without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var sql = 'sql114126';
      var request = {
        session: formattedSession,
        sql: sql,
      };

      // Mock response
      var expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.partitionQuery = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.partitionQuery(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes partitionQuery with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var sql = 'sql114126';
      var request = {
        session: formattedSession,
        sql: sql,
      };

      // Mock Grpc layer
      client._innerApiCalls.partitionQuery = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.partitionQuery(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('partitionRead', () => {
    it('invokes partitionRead without error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var table = 'table110115790';
      var keySet = {};
      var request = {
        session: formattedSession,
        table: table,
        keySet: keySet,
      };

      // Mock response
      var expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.partitionRead = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.partitionRead(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes partitionRead with error', done => {
      var client = new spannerModule.v1.SpannerClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedSession = client.sessionPath(
        '[PROJECT]',
        '[INSTANCE]',
        '[DATABASE]',
        '[SESSION]'
      );
      var table = 'table110115790';
      var keySet = {};
      var request = {
        session: formattedSession,
        table: table,
        keySet: keySet,
      };

      // Mock Grpc layer
      client._innerApiCalls.partitionRead = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.partitionRead(request, (err, response) => {
        assert(err instanceof Error);
        assert.equal(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });
});

function mockSimpleGrpcMethod(expectedRequest, response, error) {
  return function(actualRequest, options, callback) {
    assert.deepStrictEqual(actualRequest, expectedRequest);
    if (error) {
      callback(error);
    } else if (response) {
      callback(null, response);
    } else {
      callback(null);
    }
  };
}

function mockServerStreamingGrpcMethod(expectedRequest, response, error) {
  return actualRequest => {
    assert.deepStrictEqual(actualRequest, expectedRequest);
    var mockStream = through2.obj((chunk, enc, callback) => {
      if (error) {
        callback(error);
      } else {
        callback(null, response);
      }
    });
    return mockStream;
  };
}
