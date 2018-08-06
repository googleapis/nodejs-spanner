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

const spannerModule = require('../src');

var FAKE_STATUS_CODE = 1;
var error = new Error();
error.code = FAKE_STATUS_CODE;

describe('InstanceAdminClient', () => {
  describe('listInstanceConfigs', () => {
    it('invokes listInstanceConfigs without error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.projectPath('[PROJECT]');
      var request = {
        parent: formattedParent,
      };

      // Mock response
      var nextPageToken = '';
      var instanceConfigsElement = {};
      var instanceConfigs = [instanceConfigsElement];
      var expectedResponse = {
        nextPageToken: nextPageToken,
        instanceConfigs: instanceConfigs,
      };

      // Mock Grpc layer
      client._innerApiCalls.listInstanceConfigs = (
        actualRequest,
        options,
        callback
      ) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.instanceConfigs);
      };

      client.listInstanceConfigs(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.instanceConfigs);
        done();
      });
    });

    it('invokes listInstanceConfigs with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.projectPath('[PROJECT]');
      var request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.listInstanceConfigs = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.listInstanceConfigs(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('getInstanceConfig', () => {
    it('invokes getInstanceConfig without error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.instanceConfigPath(
        '[PROJECT]',
        '[INSTANCE_CONFIG]'
      );
      var request = {
        name: formattedName,
      };

      // Mock response
      var name2 = 'name2-1052831874';
      var displayName = 'displayName1615086568';
      var expectedResponse = {
        name: name2,
        displayName: displayName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getInstanceConfig = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.getInstanceConfig(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getInstanceConfig with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.instanceConfigPath(
        '[PROJECT]',
        '[INSTANCE_CONFIG]'
      );
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getInstanceConfig = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.getInstanceConfig(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('listInstances', () => {
    it('invokes listInstances without error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.projectPath('[PROJECT]');
      var request = {
        parent: formattedParent,
      };

      // Mock response
      var nextPageToken = '';
      var instancesElement = {};
      var instances = [instancesElement];
      var expectedResponse = {
        nextPageToken: nextPageToken,
        instances: instances,
      };

      // Mock Grpc layer
      client._innerApiCalls.listInstances = (
        actualRequest,
        options,
        callback
      ) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.instances);
      };

      client.listInstances(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.instances);
        done();
      });
    });

    it('invokes listInstances with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.projectPath('[PROJECT]');
      var request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.listInstances = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.listInstances(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('getInstance', () => {
    it('invokes getInstance without error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.instancePath('[PROJECT]', '[INSTANCE]');
      var request = {
        name: formattedName,
      };

      // Mock response
      var name2 = 'name2-1052831874';
      var config = 'config-1354792126';
      var displayName = 'displayName1615086568';
      var nodeCount = 1539922066;
      var expectedResponse = {
        name: name2,
        config: config,
        displayName: displayName,
        nodeCount: nodeCount,
      };

      // Mock Grpc layer
      client._innerApiCalls.getInstance = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.getInstance(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getInstance with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.instancePath('[PROJECT]', '[INSTANCE]');
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getInstance = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.getInstance(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('createInstance', function() {
    it('invokes createInstance without error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.projectPath('[PROJECT]');
      var instanceId = 'instanceId-2101995259';
      var instance = {};
      var request = {
        parent: formattedParent,
        instanceId: instanceId,
        instance: instance,
      };

      // Mock response
      var name = 'name3373707';
      var config = 'config-1354792126';
      var displayName = 'displayName1615086568';
      var nodeCount = 1539922066;
      var expectedResponse = {
        name: name,
        config: config,
        displayName: displayName,
        nodeCount: nodeCount,
      };

      // Mock Grpc layer
      client._innerApiCalls.createInstance = mockLongRunningGrpcMethod(
        request,
        expectedResponse
      );

      client
        .createInstance(request)
        .then(responses => {
          var operation = responses[0];
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

    it('invokes createInstance with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedParent = client.projectPath('[PROJECT]');
      var instanceId = 'instanceId-2101995259';
      var instance = {};
      var request = {
        parent: formattedParent,
        instanceId: instanceId,
        instance: instance,
      };

      // Mock Grpc layer
      client._innerApiCalls.createInstance = mockLongRunningGrpcMethod(
        request,
        null,
        error
      );

      client
        .createInstance(request)
        .then(responses => {
          var operation = responses[0];
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
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });
      assert(
        client._descriptors.longrunning.createInstance
          .responseDecoder instanceof Function
      );
      assert(
        client._descriptors.longrunning.createInstance
          .metadataDecoder instanceof Function
      );
    });
  });

  describe('updateInstance', function() {
    it('invokes updateInstance without error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var instance = {};
      var fieldMask = {};
      var request = {
        instance: instance,
        fieldMask: fieldMask,
      };

      // Mock response
      var name = 'name3373707';
      var config = 'config-1354792126';
      var displayName = 'displayName1615086568';
      var nodeCount = 1539922066;
      var expectedResponse = {
        name: name,
        config: config,
        displayName: displayName,
        nodeCount: nodeCount,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateInstance = mockLongRunningGrpcMethod(
        request,
        expectedResponse
      );

      client
        .updateInstance(request)
        .then(responses => {
          var operation = responses[0];
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

    it('invokes updateInstance with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var instance = {};
      var fieldMask = {};
      var request = {
        instance: instance,
        fieldMask: fieldMask,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateInstance = mockLongRunningGrpcMethod(
        request,
        null,
        error
      );

      client
        .updateInstance(request)
        .then(responses => {
          var operation = responses[0];
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
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });
      assert(
        client._descriptors.longrunning.updateInstance
          .responseDecoder instanceof Function
      );
      assert(
        client._descriptors.longrunning.updateInstance
          .metadataDecoder instanceof Function
      );
    });
  });

  describe('deleteInstance', () => {
    it('invokes deleteInstance without error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.instancePath('[PROJECT]', '[INSTANCE]');
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteInstance = mockSimpleGrpcMethod(request);

      client.deleteInstance(request, err => {
        assert.ifError(err);
        done();
      });
    });

    it('invokes deleteInstance with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedName = client.instancePath('[PROJECT]', '[INSTANCE]');
      var request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteInstance = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.deleteInstance(request, err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('setIamPolicy', () => {
    it('invokes setIamPolicy without error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
      var policy = {};
      var request = {
        resource: formattedResource,
        policy: policy,
      };

      // Mock response
      var version = 351608024;
      var etag = '21';
      var expectedResponse = {
        version: version,
        etag: etag,
      };

      // Mock Grpc layer
      client._innerApiCalls.setIamPolicy = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.setIamPolicy(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes setIamPolicy with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
      var policy = {};
      var request = {
        resource: formattedResource,
        policy: policy,
      };

      // Mock Grpc layer
      client._innerApiCalls.setIamPolicy = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

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
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
      var request = {
        resource: formattedResource,
      };

      // Mock response
      var version = 351608024;
      var etag = '21';
      var expectedResponse = {
        version: version,
        etag: etag,
      };

      // Mock Grpc layer
      client._innerApiCalls.getIamPolicy = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.getIamPolicy(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getIamPolicy with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
      var request = {
        resource: formattedResource,
      };

      // Mock Grpc layer
      client._innerApiCalls.getIamPolicy = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

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
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
      var permissions = [];
      var request = {
        resource: formattedResource,
        permissions: permissions,
      };

      // Mock response
      var expectedResponse = {};

      // Mock Grpc layer
      client._innerApiCalls.testIamPermissions = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.testIamPermissions(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes testIamPermissions with error', done => {
      var client = new spannerModule.v1.InstanceAdminClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
      var permissions = [];
      var request = {
        resource: formattedResource,
        permissions: permissions,
      };

      // Mock Grpc layer
      client._innerApiCalls.testIamPermissions = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.testIamPermissions(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
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

function mockLongRunningGrpcMethod(expectedRequest, response, error) {
  return request => {
    assert.deepStrictEqual(request, expectedRequest);
    var mockOperation = {
      promise: function() {
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
