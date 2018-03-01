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

const gapicConfig = require('./instance_admin_client_config');
const gax = require('google-gax');
const merge = require('lodash.merge');
const path = require('path');
const protobuf = require('protobufjs');

const VERSION = require('../../package.json').version;

/**
 * Cloud Spanner Instance Admin API
 *
 * The Cloud Spanner Instance Admin API can be used to create, delete,
 * modify and list instances. Instances are dedicated Cloud Spanner serving
 * and storage resources to be used by Cloud Spanner databases.
 *
 * Each instance has a "configuration", which dictates where the
 * serving resources for the Cloud Spanner instance are located (e.g.,
 * US-central, Europe). Configurations are created by Google based on
 * resource availability.
 *
 * Cloud Spanner billing is based on the instances that exist and their
 * sizes. After an instance exists, there are no additional
 * per-database or per-operation charges for use of the instance
 * (though there may be additional network bandwidth charges).
 * Instances offer isolation: problems with databases in one instance
 * will not affect other instances. However, within an instance
 * databases can affect each other. For example, if one database in an
 * instance receives a lot of requests and consumes most of the
 * instance resources, fewer resources are available for other
 * databases in that instance, and their performance may suffer.
 *
 * @class
 * @memberof v1
 */
class InstanceAdminClient {
  /**
   * Construct an instance of InstanceAdminClient.
   *
   * @param {object} [options] - The configuration object. See the subsequent
   *   parameters for more details.
   * @param {object} [options.credentials] - Credentials object.
   * @param {string} [options.credentials.client_email]
   * @param {string} [options.credentials.private_key]
   * @param {string} [options.email] - Account email address. Required when
   *     using a .pem or .p12 keyFilename.
   * @param {string} [options.keyFilename] - Full path to the a .json, .pem, or
   *     .p12 key downloaded from the Google Developers Console. If you provide
   *     a path to a JSON file, the projectId option below is not necessary.
   *     NOTE: .pem and .p12 require you to specify options.email as well.
   * @param {number} [options.port] - The port on which to connect to
   *     the remote host.
   * @param {string} [options.projectId] - The project ID from the Google
   *     Developer's Console, e.g. 'grape-spaceship-123'. We will also check
   *     the environment variable GCLOUD_PROJECT for your project ID. If your
   *     app is running in an environment which supports
   *     {@link https://developers.google.com/identity/protocols/application-default-credentials Application Default Credentials},
   *     your project ID will be detected automatically.
   * @param {function} [options.promise] - Custom promise module to use instead
   *     of native Promises.
   * @param {string} [options.servicePath] - The domain name of the
   *     API remote host.
   */
  constructor(opts) {
    this._descriptors = {};

    // Ensure that options include the service address and port.
    opts = Object.assign(
      {
        clientConfig: {},
        port: this.constructor.port,
        servicePath: this.constructor.servicePath,
      },
      opts
    );

    // Create a `gaxGrpc` object, with any grpc-specific options
    // sent to the client.
    opts.scopes = this.constructor.scopes;
    var gaxGrpc = gax.grpc(opts);

    // Save the auth object to the client, for use by other methods.
    this.auth = gaxGrpc.auth;

    // Determine the client header string.
    var clientHeader = [
      `gl-node/${process.version.node}`,
      `grpc/${gaxGrpc.grpcVersion}`,
      `gax/${gax.version}`,
      `gapic/${VERSION}`,
    ];
    if (opts.libName && opts.libVersion) {
      clientHeader.push(`${opts.libName}/${opts.libVersion}`);
    }

    // Load the applicable protos.
    var protos = merge(
      {},
      gaxGrpc.loadProto(
        path.join(__dirname, '..', '..', 'protos'),
        'google/spanner/admin/instance/v1/spanner_instance_admin.proto'
      )
    );

    // This API contains "path templates"; forward-slash-separated
    // identifiers to uniquely identify resources within the API.
    // Create useful helper objects for these.
    this._pathTemplates = {
      projectPathTemplate: new gax.PathTemplate('projects/{project}'),
      instanceConfigPathTemplate: new gax.PathTemplate(
        'projects/{project}/instanceConfigs/{instance_config}'
      ),
      instancePathTemplate: new gax.PathTemplate(
        'projects/{project}/instances/{instance}'
      ),
    };

    // Some of the methods on this service return "paged" results,
    // (e.g. 50 results at a time, with tokens to get subsequent
    // pages). Denote the keys used for pagination and results.
    this._descriptors.page = {
      listInstanceConfigs: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'instanceConfigs'
      ),
      listInstances: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'instances'
      ),
    };
    var protoFilesRoot = new gax.grpc.GoogleProtoFilesRoot();
    protoFilesRoot = protobuf.loadSync(
      path.join(
        __dirname,
        '..',
        '..',
        'protos',
        'google/spanner/admin/instance/v1/spanner_instance_admin.proto'
      ),
      protoFilesRoot
    );

    // This API contains "long-running operations", which return a
    // an Operation object that allows for tracking of the operation,
    // rather than holding a request open.
    this.operationsClient = new gax.lro({
      auth: gaxGrpc.auth,
      grpc: gaxGrpc.grpc,
    }).operationsClient(opts);

    var createInstanceResponse = protoFilesRoot.lookup(
      'google.spanner.admin.instance.v1.Instance'
    );
    var createInstanceMetadata = protoFilesRoot.lookup(
      'google.spanner.admin.instance.v1.CreateInstanceMetadata'
    );
    var updateInstanceResponse = protoFilesRoot.lookup(
      'google.spanner.admin.instance.v1.Instance'
    );
    var updateInstanceMetadata = protoFilesRoot.lookup(
      'google.spanner.admin.instance.v1.UpdateInstanceMetadata'
    );

    this._descriptors.longrunning = {
      createInstance: new gax.LongrunningDescriptor(
        this.operationsClient,
        createInstanceResponse.decode.bind(createInstanceResponse),
        createInstanceMetadata.decode.bind(createInstanceMetadata)
      ),
      updateInstance: new gax.LongrunningDescriptor(
        this.operationsClient,
        updateInstanceResponse.decode.bind(updateInstanceResponse),
        updateInstanceMetadata.decode.bind(updateInstanceMetadata)
      ),
    };

    // Put together the default options sent with requests.
    var defaults = gaxGrpc.constructSettings(
      'google.spanner.admin.instance.v1.InstanceAdmin',
      gapicConfig,
      opts.clientConfig,
      {'x-goog-api-client': clientHeader.join(' ')}
    );

    // Set up a dictionary of "inner API calls"; the core implementation
    // of calling the API is handled in `google-gax`, with this code
    // merely providing the destination and request information.
    this._innerApiCalls = {};

    // Put together the "service stub" for
    // google.spanner.admin.instance.v1.InstanceAdmin.
    var instanceAdminStub = gaxGrpc.createStub(
      protos.google.spanner.admin.instance.v1.InstanceAdmin,
      opts
    );

    // Iterate over each of the methods that the service provides
    // and create an API call method for each.
    var instanceAdminStubMethods = [
      'listInstanceConfigs',
      'getInstanceConfig',
      'listInstances',
      'getInstance',
      'createInstance',
      'updateInstance',
      'deleteInstance',
      'setIamPolicy',
      'getIamPolicy',
      'testIamPermissions',
    ];
    for (let methodName of instanceAdminStubMethods) {
      this._innerApiCalls[methodName] = gax.createApiCall(
        instanceAdminStub.then(
          stub =>
            function() {
              var args = Array.prototype.slice.call(arguments, 0);
              return stub[methodName].apply(stub, args);
            }
        ),
        defaults[methodName],
        this._descriptors.page[methodName] ||
          this._descriptors.longrunning[methodName]
      );
    }
  }

  /**
   * The DNS address for this API service.
   */
  static get servicePath() {
    return 'spanner.googleapis.com';
  }

  /**
   * The port for this API service.
   */
  static get port() {
    return 443;
  }

  /**
   * The scopes needed to make gRPC calls for every method defined
   * in this service.
   */
  static get scopes() {
    return [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/spanner.admin',
    ];
  }

  /**
   * Return the project ID used by this class.
   * @param {function(Error, string)} callback - the callback to
   *   be called with the current project Id.
   */
  getProjectId(callback) {
    return this.auth.getProjectId(callback);
  }

  // -------------------
  // -- Service calls --
  // -------------------

  /**
   * Lists the supported instance configurations for a given project.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The name of the project for which a list of supported instance
   *   configurations is requested. Values are of the form
   *   `projects/<project>`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [InstanceConfig]{@link google.spanner.admin.instance.v1.InstanceConfig}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListInstanceConfigsResponse]{@link google.spanner.admin.instance.v1.ListInstanceConfigsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [InstanceConfig]{@link google.spanner.admin.instance.v1.InstanceConfig}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [InstanceConfig]{@link google.spanner.admin.instance.v1.InstanceConfig} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListInstanceConfigsResponse]{@link google.spanner.admin.instance.v1.ListInstanceConfigsResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * var formattedParent = client.projectPath('[PROJECT]');
   *
   * client.listInstanceConfigs({parent: formattedParent})
   *   .then(responses => {
   *     var resources = responses[0];
   *     for (let i = 0; i < resources.length; i += 1) {
   *       // doThingsWith(resources[i])
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * var formattedParent = client.projectPath('[PROJECT]');
   *
   *
   * var options = {autoPaginate: false};
   * var callback = responses => {
   *   // The actual resources in a response.
   *   var resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   var nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // var rawResponse = responses[2];
   *   for (let i = 0; i < resources.length; i += 1) {
   *     // doThingsWith(resources[i]);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listInstanceConfigs(nextRequest, options).then(callback);
   *   }
   * }
   * client.listInstanceConfigs({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listInstanceConfigs(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.listInstanceConfigs(request, options, callback);
  }

  /**
   * Equivalent to {@link listInstanceConfigs}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listInstanceConfigs} continuously
   * and invokes the callback registered for 'data' event for each element in the
   * responses.
   *
   * The returned object has 'end' method when no more elements are required.
   *
   * autoPaginate option will be ignored.
   *
   * @see {@link https://nodejs.org/api/stream.html}
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The name of the project for which a list of supported instance
   *   configurations is requested. Values are of the form
   *   `projects/<project>`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [InstanceConfig]{@link google.spanner.admin.instance.v1.InstanceConfig} on 'data' event.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedParent = client.projectPath('[PROJECT]');
   * client.listInstanceConfigsStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listInstanceConfigsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listInstanceConfigs.createStream(
      this._innerApiCalls.listInstanceConfigs,
      request,
      options
    );
  }

  /**
   * Gets information about a particular instance configuration.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Required. The name of the requested instance configuration. Values are of
   *   the form `projects/<project>/instanceConfigs/<config>`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [InstanceConfig]{@link google.spanner.admin.instance.v1.InstanceConfig}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [InstanceConfig]{@link google.spanner.admin.instance.v1.InstanceConfig}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedName = client.instanceConfigPath('[PROJECT]', '[INSTANCE_CONFIG]');
   * client.getInstanceConfig({name: formattedName})
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getInstanceConfig(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.getInstanceConfig(request, options, callback);
  }

  /**
   * Lists all instances in the given project.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The name of the project for which a list of instances is
   *   requested. Values are of the form `projects/<project>`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {string} [request.filter]
   *   An expression for filtering the results of the request. Filter rules are
   *   case insensitive. The fields eligible for filtering are:
   *
   *     * `name`
   *     * `display_name`
   *     * `labels.key` where key is the name of a label
   *
   *   Some examples of using filters are:
   *
   *     * `name:*` --> The instance has a name.
   *     * `name:Howl` --> The instance's name contains the string "howl".
   *     * `name:HOWL` --> Equivalent to above.
   *     * `NAME:howl` --> Equivalent to above.
   *     * `labels.env:*` --> The instance has the label "env".
   *     * `labels.env:dev` --> The instance has the label "env" and the value of
   *                          the label contains the string "dev".
   *     * `name:howl labels.env:dev` --> The instance's name contains "howl" and
   *                                    it has the label "env" with its value
   *                                    containing "dev".
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [Instance]{@link google.spanner.admin.instance.v1.Instance}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListInstancesResponse]{@link google.spanner.admin.instance.v1.ListInstancesResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Instance]{@link google.spanner.admin.instance.v1.Instance}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Instance]{@link google.spanner.admin.instance.v1.Instance} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListInstancesResponse]{@link google.spanner.admin.instance.v1.ListInstancesResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * var formattedParent = client.projectPath('[PROJECT]');
   *
   * client.listInstances({parent: formattedParent})
   *   .then(responses => {
   *     var resources = responses[0];
   *     for (let i = 0; i < resources.length; i += 1) {
   *       // doThingsWith(resources[i])
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * var formattedParent = client.projectPath('[PROJECT]');
   *
   *
   * var options = {autoPaginate: false};
   * var callback = responses => {
   *   // The actual resources in a response.
   *   var resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   var nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // var rawResponse = responses[2];
   *   for (let i = 0; i < resources.length; i += 1) {
   *     // doThingsWith(resources[i]);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listInstances(nextRequest, options).then(callback);
   *   }
   * }
   * client.listInstances({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listInstances(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.listInstances(request, options, callback);
  }

  /**
   * Equivalent to {@link listInstances}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listInstances} continuously
   * and invokes the callback registered for 'data' event for each element in the
   * responses.
   *
   * The returned object has 'end' method when no more elements are required.
   *
   * autoPaginate option will be ignored.
   *
   * @see {@link https://nodejs.org/api/stream.html}
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The name of the project for which a list of instances is
   *   requested. Values are of the form `projects/<project>`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {string} [request.filter]
   *   An expression for filtering the results of the request. Filter rules are
   *   case insensitive. The fields eligible for filtering are:
   *
   *     * `name`
   *     * `display_name`
   *     * `labels.key` where key is the name of a label
   *
   *   Some examples of using filters are:
   *
   *     * `name:*` --> The instance has a name.
   *     * `name:Howl` --> The instance's name contains the string "howl".
   *     * `name:HOWL` --> Equivalent to above.
   *     * `NAME:howl` --> Equivalent to above.
   *     * `labels.env:*` --> The instance has the label "env".
   *     * `labels.env:dev` --> The instance has the label "env" and the value of
   *                          the label contains the string "dev".
   *     * `name:howl labels.env:dev` --> The instance's name contains "howl" and
   *                                    it has the label "env" with its value
   *                                    containing "dev".
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Instance]{@link google.spanner.admin.instance.v1.Instance} on 'data' event.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedParent = client.projectPath('[PROJECT]');
   * client.listInstancesStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listInstancesStream(request, options) {
    options = options || {};

    return this._descriptors.page.listInstances.createStream(
      this._innerApiCalls.listInstances,
      request,
      options
    );
  }

  /**
   * Gets information about a particular instance.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Required. The name of the requested instance. Values are of the form
   *   `projects/<project>/instances/<instance>`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Instance]{@link google.spanner.admin.instance.v1.Instance}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Instance]{@link google.spanner.admin.instance.v1.Instance}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedName = client.instancePath('[PROJECT]', '[INSTANCE]');
   * client.getInstance({name: formattedName})
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getInstance(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.getInstance(request, options, callback);
  }

  /**
   * Creates an instance and begins preparing it to begin serving. The
   * returned long-running operation
   * can be used to track the progress of preparing the new
   * instance. The instance name is assigned by the caller. If the
   * named instance already exists, `CreateInstance` returns
   * `ALREADY_EXISTS`.
   *
   * Immediately upon completion of this request:
   *
   *   * The instance is readable via the API, with all requested attributes
   *     but no allocated resources. Its state is `CREATING`.
   *
   * Until completion of the returned operation:
   *
   *   * Cancelling the operation renders the instance immediately unreadable
   *     via the API.
   *   * The instance can be deleted.
   *   * All other attempts to modify the instance are rejected.
   *
   * Upon completion of the returned operation:
   *
   *   * Billing for all successfully-allocated resources begins (some types
   *     may have lower than the requested levels).
   *   * Databases can be created in the instance.
   *   * The instance's allocated resource levels are readable via the API.
   *   * The instance's state becomes `READY`.
   *
   * The returned long-running operation will
   * have a name of the format `<instance_name>/operations/<operation_id>` and
   * can be used to track creation of the instance.  The
   * metadata field type is
   * CreateInstanceMetadata.
   * The response field type is
   * Instance, if successful.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The name of the project in which to create the instance. Values
   *   are of the form `projects/<project>`.
   * @param {string} request.instanceId
   *   Required. The ID of the instance to create.  Valid identifiers are of the
   *   form `[a-z][-a-z0-9]*[a-z0-9]` and must be between 6 and 30 characters in
   *   length.
   * @param {Object} request.instance
   *   Required. The instance to create.  The name may be omitted, but if
   *   specified must be `<parent>/instances/<instance_id>`.
   *
   *   This object should have the same structure as [Instance]{@link google.spanner.admin.instance.v1.Instance}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/Operation} object.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/Operation} object.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedParent = client.projectPath('[PROJECT]');
   * var instanceId = '';
   * var instance = {};
   * var request = {
   *   parent: formattedParent,
   *   instanceId: instanceId,
   *   instance: instance,
   * };
   *
   * // Handle the operation using the promise pattern.
   * client.createInstance(request)
   *   .then(responses => {
   *     var operation = responses[0];
   *     var initialApiResponse = responses[1];
   *
   *     // Operation#promise starts polling for the completion of the LRO.
   *     return operation.promise();
   *   })
   *   .then(responses => {
   *     // The final result of the operation.
   *     var result = responses[0];
   *
   *     // The metadata value of the completed operation.
   *     var metadata = responses[1];
   *
   *     // The response of the api call returning the complete operation.
   *     var finalApiResponse = responses[2];
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * var formattedParent = client.projectPath('[PROJECT]');
   * var instanceId = '';
   * var instance = {};
   * var request = {
   *   parent: formattedParent,
   *   instanceId: instanceId,
   *   instance: instance,
   * };
   *
   * // Handle the operation using the event emitter pattern.
   * client.createInstance(request)
   *   .then(responses => {
   *     var operation = responses[0];
   *     var initialApiResponse = responses[1];
   *
   *     // Adding a listener for the "complete" event starts polling for the
   *     // completion of the operation.
   *     operation.on('complete', (result, metadata, finalApiResponse) => {
   *       // doSomethingWith(result);
   *     });
   *
   *     // Adding a listener for the "progress" event causes the callback to be
   *     // called on any change in metadata when the operation is polled.
   *     operation.on('progress', (metadata, apiResponse) => {
   *       // doSomethingWith(metadata)
   *     });
   *
   *     // Adding a listener for the "error" event handles any errors found during polling.
   *     operation.on('error', err => {
   *       // throw(err);
   *     });
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  createInstance(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.createInstance(request, options, callback);
  }

  /**
   * Updates an instance, and begins allocating or releasing resources
   * as requested. The returned long-running
   * operation can be used to track the
   * progress of updating the instance. If the named instance does not
   * exist, returns `NOT_FOUND`.
   *
   * Immediately upon completion of this request:
   *
   *   * For resource types for which a decrease in the instance's allocation
   *     has been requested, billing is based on the newly-requested level.
   *
   * Until completion of the returned operation:
   *
   *   * Cancelling the operation sets its metadata's
   *     cancel_time, and begins
   *     restoring resources to their pre-request values. The operation
   *     is guaranteed to succeed at undoing all resource changes,
   *     after which point it terminates with a `CANCELLED` status.
   *   * All other attempts to modify the instance are rejected.
   *   * Reading the instance via the API continues to give the pre-request
   *     resource levels.
   *
   * Upon completion of the returned operation:
   *
   *   * Billing begins for all successfully-allocated resources (some types
   *     may have lower than the requested levels).
   *   * All newly-reserved resources are available for serving the instance's
   *     tables.
   *   * The instance's new resource levels are readable via the API.
   *
   * The returned long-running operation will
   * have a name of the format `<instance_name>/operations/<operation_id>` and
   * can be used to track the instance modification.  The
   * metadata field type is
   * UpdateInstanceMetadata.
   * The response field type is
   * Instance, if successful.
   *
   * Authorization requires `spanner.instances.update` permission on
   * resource name.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {Object} request.instance
   *   Required. The instance to update, which must always include the instance
   *   name.  Otherwise, only fields mentioned in [][google.spanner.admin.instance.v1.UpdateInstanceRequest.field_mask] need be included.
   *
   *   This object should have the same structure as [Instance]{@link google.spanner.admin.instance.v1.Instance}
   * @param {Object} request.fieldMask
   *   Required. A mask specifying which fields in [][google.spanner.admin.instance.v1.UpdateInstanceRequest.instance] should be updated.
   *   The field mask must always be specified; this prevents any future fields in
   *   [][google.spanner.admin.instance.v1.Instance] from being erased accidentally by clients that do not know
   *   about them.
   *
   *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/Operation} object.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/Operation} object.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var instance = {};
   * var fieldMask = {};
   * var request = {
   *   instance: instance,
   *   fieldMask: fieldMask,
   * };
   *
   * // Handle the operation using the promise pattern.
   * client.updateInstance(request)
   *   .then(responses => {
   *     var operation = responses[0];
   *     var initialApiResponse = responses[1];
   *
   *     // Operation#promise starts polling for the completion of the LRO.
   *     return operation.promise();
   *   })
   *   .then(responses => {
   *     // The final result of the operation.
   *     var result = responses[0];
   *
   *     // The metadata value of the completed operation.
   *     var metadata = responses[1];
   *
   *     // The response of the api call returning the complete operation.
   *     var finalApiResponse = responses[2];
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * var instance = {};
   * var fieldMask = {};
   * var request = {
   *   instance: instance,
   *   fieldMask: fieldMask,
   * };
   *
   * // Handle the operation using the event emitter pattern.
   * client.updateInstance(request)
   *   .then(responses => {
   *     var operation = responses[0];
   *     var initialApiResponse = responses[1];
   *
   *     // Adding a listener for the "complete" event starts polling for the
   *     // completion of the operation.
   *     operation.on('complete', (result, metadata, finalApiResponse) => {
   *       // doSomethingWith(result);
   *     });
   *
   *     // Adding a listener for the "progress" event causes the callback to be
   *     // called on any change in metadata when the operation is polled.
   *     operation.on('progress', (metadata, apiResponse) => {
   *       // doSomethingWith(metadata)
   *     });
   *
   *     // Adding a listener for the "error" event handles any errors found during polling.
   *     operation.on('error', err => {
   *       // throw(err);
   *     });
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  updateInstance(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.updateInstance(request, options, callback);
  }

  /**
   * Deletes an instance.
   *
   * Immediately upon completion of the request:
   *
   *   * Billing ceases for all of the instance's reserved resources.
   *
   * Soon afterward:
   *
   *   * The instance and *all of its databases* immediately and
   *     irrevocably disappear from the API. All data in the databases
   *     is permanently deleted.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Required. The name of the instance to be deleted. Values are of the form
   *   `projects/<project>/instances/<instance>`
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error)} [callback]
   *   The function which will be called with the result of the API call.
   * @returns {Promise} - The promise which resolves when API call finishes.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedName = client.instancePath('[PROJECT]', '[INSTANCE]');
   * client.deleteInstance({name: formattedName}).catch(err => {
   *   console.error(err);
   * });
   */
  deleteInstance(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.deleteInstance(request, options, callback);
  }

  /**
   * Sets the access control policy on an instance resource. Replaces any
   * existing policy.
   *
   * Authorization requires `spanner.instances.setIamPolicy` on
   * resource.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.resource
   *   REQUIRED: The resource for which the policy is being specified.
   *   `resource` is usually specified as a path. For example, a Project
   *   resource is specified as `projects/{project}`.
   * @param {Object} request.policy
   *   REQUIRED: The complete policy to be applied to the `resource`. The size of
   *   the policy is limited to a few 10s of KB. An empty policy is a
   *   valid policy but certain Cloud Platform services (such as Projects)
   *   might reject them.
   *
   *   This object should have the same structure as [Policy]{@link google.iam.v1.Policy}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Policy]{@link google.iam.v1.Policy}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Policy]{@link google.iam.v1.Policy}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
   * var policy = {};
   * var request = {
   *   resource: formattedResource,
   *   policy: policy,
   * };
   * client.setIamPolicy(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  setIamPolicy(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.setIamPolicy(request, options, callback);
  }

  /**
   * Gets the access control policy for an instance resource. Returns an empty
   * policy if an instance exists but does not have a policy set.
   *
   * Authorization requires `spanner.instances.getIamPolicy` on
   * resource.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.resource
   *   REQUIRED: The resource for which the policy is being requested.
   *   `resource` is usually specified as a path. For example, a Project
   *   resource is specified as `projects/{project}`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Policy]{@link google.iam.v1.Policy}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Policy]{@link google.iam.v1.Policy}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
   * client.getIamPolicy({resource: formattedResource})
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getIamPolicy(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.getIamPolicy(request, options, callback);
  }

  /**
   * Returns permissions that the caller has on the specified instance resource.
   *
   * Attempting this RPC on a non-existent Cloud Spanner instance resource will
   * result in a NOT_FOUND error if the user has `spanner.instances.list`
   * permission on the containing Google Cloud Project. Otherwise returns an
   * empty set of permissions.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.resource
   *   REQUIRED: The resource for which the policy detail is being requested.
   *   `resource` is usually specified as a path. For example, a Project
   *   resource is specified as `projects/{project}`.
   * @param {string[]} request.permissions
   *   The set of permissions to check for the `resource`. Permissions with
   *   wildcards (such as '*' or 'storage.*') are not allowed. For more
   *   information see
   *   [IAM Overview](https://cloud.google.com/iam/docs/overview#permissions).
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [TestIamPermissionsResponse]{@link google.iam.v1.TestIamPermissionsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [TestIamPermissionsResponse]{@link google.iam.v1.TestIamPermissionsResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.InstanceAdminClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedResource = client.instancePath('[PROJECT]', '[INSTANCE]');
   * var permissions = [];
   * var request = {
   *   resource: formattedResource,
   *   permissions: permissions,
   * };
   * client.testIamPermissions(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  testIamPermissions(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.testIamPermissions(request, options, callback);
  }

  // --------------------
  // -- Path templates --
  // --------------------

  /**
   * Return a fully-qualified project resource name string.
   *
   * @param {String} project
   * @returns {String}
   */
  projectPath(project) {
    return this._pathTemplates.projectPathTemplate.render({
      project: project,
    });
  }

  /**
   * Return a fully-qualified instance_config resource name string.
   *
   * @param {String} project
   * @param {String} instanceConfig
   * @returns {String}
   */
  instanceConfigPath(project, instanceConfig) {
    return this._pathTemplates.instanceConfigPathTemplate.render({
      project: project,
      instance_config: instanceConfig,
    });
  }

  /**
   * Return a fully-qualified instance resource name string.
   *
   * @param {String} project
   * @param {String} instance
   * @returns {String}
   */
  instancePath(project, instance) {
    return this._pathTemplates.instancePathTemplate.render({
      project: project,
      instance: instance,
    });
  }

  /**
   * Parse the projectName from a project resource.
   *
   * @param {String} projectName
   *   A fully-qualified path representing a project resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromProjectName(projectName) {
    return this._pathTemplates.projectPathTemplate.match(projectName).project;
  }

  /**
   * Parse the instanceConfigName from a instance_config resource.
   *
   * @param {String} instanceConfigName
   *   A fully-qualified path representing a instance_config resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromInstanceConfigName(instanceConfigName) {
    return this._pathTemplates.instanceConfigPathTemplate.match(
      instanceConfigName
    ).project;
  }

  /**
   * Parse the instanceConfigName from a instance_config resource.
   *
   * @param {String} instanceConfigName
   *   A fully-qualified path representing a instance_config resources.
   * @returns {String} - A string representing the instance_config.
   */
  matchInstanceConfigFromInstanceConfigName(instanceConfigName) {
    return this._pathTemplates.instanceConfigPathTemplate.match(
      instanceConfigName
    ).instance_config;
  }

  /**
   * Parse the instanceName from a instance resource.
   *
   * @param {String} instanceName
   *   A fully-qualified path representing a instance resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromInstanceName(instanceName) {
    return this._pathTemplates.instancePathTemplate.match(instanceName).project;
  }

  /**
   * Parse the instanceName from a instance resource.
   *
   * @param {String} instanceName
   *   A fully-qualified path representing a instance resources.
   * @returns {String} - A string representing the instance.
   */
  matchInstanceFromInstanceName(instanceName) {
    return this._pathTemplates.instancePathTemplate.match(instanceName)
      .instance;
  }
}

module.exports = InstanceAdminClient;
