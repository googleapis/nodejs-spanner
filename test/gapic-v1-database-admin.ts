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

import {ApiError} from '@google-cloud/common';
import * as assert from 'assert';

const spannerModule = require('../src');

const FAKE_STATUS_CODE = 1;
const error = new Error();
(error as ApiError).code = FAKE_STATUS_CODE;

describe('DatabaseAdminClient', () => {
  describe('listDatabases', () => {
    it('invokes listDatabases without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
      const request = {
        parent: formattedParent,
      };

      // Mock response
      const nextPageToken = '';
      const databasesElement = {};
      const databases = [databasesElement];
      const expectedResponse = {
        nextPageToken,
        databases,
      };

      // Mock Grpc layer
      client._innerApiCalls.listDatabases =
          (actualRequest, options, callback) => {
            assert.deepStrictEqual(actualRequest, request);
            callback(null, expectedResponse.databases);
          };

      client.listDatabases(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.databases);
        done();
      });
    });

    it('invokes listDatabases with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
      const request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.listDatabases =
          mockSimpleGrpcMethod(request, null, error);

      client.listDatabases(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('createDatabase', () => {
    it('invokes createDatabase without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
      const createStatement = 'createStatement552974828';
      const request = {
        parent: formattedParent,
        createStatement,
      };

      // Mock response
      const name = 'name3373707';
      const expectedResponse = {
        name,
      };

      // Mock Grpc layer
      client._innerApiCalls.createDatabase =
          mockLongRunningGrpcMethod(request, expectedResponse);

      client.createDatabase(request)
          .then(responses => {
            const operation = responses[0];
            return operation.promise();
          })
          .then(responses => {
            assert.deepStrictEqual(responses[0], expectedResponse);
            done();
          })
          .catch(err => {
            done(err);
          });
    });

    it('invokes createDatabase with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
      const createStatement = 'createStatement552974828';
      const request = {
        parent: formattedParent,
        createStatement,
      };

      // Mock Grpc layer
      client._innerApiCalls.createDatabase =
          mockLongRunningGrpcMethod(request, null, error);

      client.createDatabase(request)
          .then(responses => {
            const operation = responses[0];
            return operation.promise();
          })
          .then(() => {
            assert.fail();
          })
          .catch(err => {
            assert(err instanceof Error);
            assert.strictEqual(err.code, FAKE_STATUS_CODE);
            done();
          });
    });

    it('has longrunning decoder functions', () => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });
      assert(
          client._descriptors.longrunning.createDatabase
              .responseDecoder instanceof
          Function);
      assert(
          client._descriptors.longrunning.createDatabase
              .metadataDecoder instanceof
          Function);
    });
  });

  describe('getDatabase', () => {
    it('invokes getDatabase without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const request = {
        name: formattedName,
      };

      // Mock response
      const name2 = 'name2-1052831874';
      const expectedResponse = {
        name: name2,
      };

      // Mock Grpc layer
      client._innerApiCalls.getDatabase =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.getDatabase(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getDatabase with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getDatabase =
          mockSimpleGrpcMethod(request, null, error);

      client.getDatabase(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('updateDatabaseDdl', () => {
    it('invokes updateDatabaseDdl without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const statements = [];
      const request = {
        database: formattedDatabase,
        statements,
      };

      // Mock response
      const expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.updateDatabaseDdl =
          mockLongRunningGrpcMethod(request, expectedResponse);

      client.updateDatabaseDdl(request)
          .then(responses => {
            const operation = responses[0];
            return operation.promise();
          })
          .then(responses => {
            assert.deepStrictEqual(responses[0], expectedResponse);
            done();
          })
          .catch(err => {
            done(err);
          });
    });

    it('invokes updateDatabaseDdl with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const statements = [];
      const request = {
        database: formattedDatabase,
        statements,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateDatabaseDdl =
          mockLongRunningGrpcMethod(request, null, error);

      client.updateDatabaseDdl(request)
          .then(responses => {
            const operation = responses[0];
            return operation.promise();
          })
          .then(() => {
            assert.fail();
          })
          .catch(err => {
            assert(err instanceof Error);
            assert.strictEqual(err.code, FAKE_STATUS_CODE);
            done();
          });
    });

    it('has longrunning decoder functions', () => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });
      assert(
          client._descriptors.longrunning.updateDatabaseDdl
              .responseDecoder instanceof
          Function);
      assert(
          client._descriptors.longrunning.updateDatabaseDdl
              .metadataDecoder instanceof
          Function);
    });
  });

  describe('dropDatabase', () => {
    it('invokes dropDatabase without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.dropDatabase = mockSimpleGrpcMethod(request);

      client.dropDatabase(request, err => {
        assert.ifError(err);
        done();
      });
    });

    it('invokes dropDatabase with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.dropDatabase =
          mockSimpleGrpcMethod(request, null, error);

      client.dropDatabase(request, err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('getDatabaseDdl', () => {
    it('invokes getDatabaseDdl without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock response
      const expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.getDatabaseDdl =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.getDatabaseDdl(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getDatabaseDdl with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedDatabase =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const request = {
        database: formattedDatabase,
      };

      // Mock Grpc layer
      client._innerApiCalls.getDatabaseDdl =
          mockSimpleGrpcMethod(request, null, error);

      client.getDatabaseDdl(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('setIamPolicy', () => {
    it('invokes setIamPolicy without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedResource =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const policy = {};
      const request = {
        resource: formattedResource,
        policy,
      };

      // Mock response
      const version = 351608024;
      const etag = '21';
      const expectedResponse = {
        version,
        etag,
      };

      // Mock Grpc layer
      client._innerApiCalls.setIamPolicy =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.setIamPolicy(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes setIamPolicy with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedResource =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const policy = {};
      const request = {
        resource: formattedResource,
        policy,
      };

      // Mock Grpc layer
      client._innerApiCalls.setIamPolicy =
          mockSimpleGrpcMethod(request, null, error);

      client.setIamPolicy(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('getIamPolicy', () => {
    it('invokes getIamPolicy without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedResource =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const request = {
        resource: formattedResource,
      };

      // Mock response
      const version = 351608024;
      const etag = '21';
      const expectedResponse = {
        version,
        etag,
      };

      // Mock Grpc layer
      client._innerApiCalls.getIamPolicy =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.getIamPolicy(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getIamPolicy with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedResource =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const request = {
        resource: formattedResource,
      };

      // Mock Grpc layer
      client._innerApiCalls.getIamPolicy =
          mockSimpleGrpcMethod(request, null, error);

      client.getIamPolicy(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('testIamPermissions', () => {
    it('invokes testIamPermissions without error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedResource =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const permissions = [];
      const request = {
        resource: formattedResource,
        permissions,
      };

      // Mock response
      const expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.testIamPermissions =
          mockSimpleGrpcMethod(request, expectedResponse);

      client.testIamPermissions(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes testIamPermissions with error', done => {
      const client = new spannerModule.v1.DatabaseAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedResource =
          client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
      const permissions = [];
      const request = {
        resource: formattedResource,
        permissions,
      };

      // Mock Grpc layer
      client._innerApiCalls.testIamPermissions =
          mockSimpleGrpcMethod(request, null, error);

      client.testIamPermissions(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });
});

function mockSimpleGrpcMethod(expectedRequest, response?, error?) {
  return (actualRequest, options, callback) => {
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

function mockLongRunningGrpcMethod(expectedRequest, response, error?) {
  return request => {
    assert.deepStrictEqual(request, expectedRequest);
    const mockOperation = {
      promise() {
        return new Promise((resolve, reject) => {
          if (error) {
            reject(error);
          } else {
            resolve([response]);
          }
        });
      },
    };
    return Promise.resolve([mockOperation]);
  };
}
