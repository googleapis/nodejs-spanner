// Copyright 2019 Google LLC
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

const gapicConfig = require('./database_admin_client_config.json');
const gax = require('google-gax');
const path = require('path');

const VERSION = require('../../../package.json').version;

/**
 * Cloud Spanner Database Admin API
 *
 * The Cloud Spanner Database Admin API can be used to create, drop, and
 * list databases. It also enables updating the schema of pre-existing
 * databases.
 *
 * @class
 * @memberof v1
 */
class DatabaseAdminClient {
  /**
   * Construct an instance of DatabaseAdminClient.
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
   * @param {string} [options.apiEndpoint] - The domain name of the
   *     API remote host.
   */
  constructor(opts) {
    opts = opts || {};
    this._descriptors = {};

    if (global.isBrowser) {
      // If we're in browser, we use gRPC fallback.
      opts.fallback = true;
    }

    // If we are in browser, we are already using fallback because of the
    // "browser" field in package.json.
    // But if we were explicitly requested to use fallback, let's do it now.
    const gaxModule = !global.isBrowser && opts.fallback ? gax.fallback : gax;

    const servicePath =
      opts.servicePath || opts.apiEndpoint || this.constructor.servicePath;

    // Ensure that options include the service address and port.
    opts = Object.assign(
      {
        clientConfig: {},
        port: this.constructor.port,
        servicePath,
      },
      opts
    );

    // Create a `gaxGrpc` object, with any grpc-specific options
    // sent to the client.
    opts.scopes = this.constructor.scopes;
    const gaxGrpc = new gaxModule.GrpcClient(opts);

    // Save the auth object to the client, for use by other methods.
    this.auth = gaxGrpc.auth;

    // Determine the client header string.
    const clientHeader = [];

    if (typeof process !== 'undefined' && 'versions' in process) {
      clientHeader.push(`gl-node/${process.versions.node}`);
    }
    clientHeader.push(`gax/${gaxModule.version}`);
    if (opts.fallback) {
      clientHeader.push(`gl-web/${gaxModule.version}`);
    } else {
      clientHeader.push(`grpc/${gaxGrpc.grpcVersion}`);
    }
    clientHeader.push(`gapic/${VERSION}`);
    if (opts.libName && opts.libVersion) {
      clientHeader.push(`${opts.libName}/${opts.libVersion}`);
    }

    // Load the applicable protos.
    // For Node.js, pass the path to JSON proto file.
    // For browsers, pass the JSON content.

    const nodejsProtoPath = path.join(
      __dirname,
      '..',
      '..',
      'protos',
      'protos.json'
    );
    const protos = gaxGrpc.loadProto(
      opts.fallback ? require('../../protos/protos.json') : nodejsProtoPath
    );

    // This API contains "path templates"; forward-slash-separated
    // identifiers to uniquely identify resources within the API.
    // Create useful helper objects for these.
    this._pathTemplates = {
      databasePathTemplate: new gaxModule.PathTemplate(
        'projects/{project}/instances/{instance}/databases/{database}'
      ),
      instancePathTemplate: new gaxModule.PathTemplate(
        'projects/{project}/instances/{instance}'
      ),
    };

    // Some of the methods on this service return "paged" results,
    // (e.g. 50 results at a time, with tokens to get subsequent
    // pages). Denote the keys used for pagination and results.
    this._descriptors.page = {
      listDatabases: new gaxModule.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'databases'
      ),
    };

    const protoFilesRoot = opts.fallback
      ? gaxModule.protobuf.Root.fromJSON(require('../../protos/protos.json'))
      : gaxModule.protobuf.loadSync(nodejsProtoPath);

    // This API contains "long-running operations", which return a
    // an Operation object that allows for tracking of the operation,
    // rather than holding a request open.
    this.operationsClient = new gaxModule.lro({
      auth: gaxGrpc.auth,
      grpc: gaxGrpc.grpc,
    }).operationsClient(opts);

    const createDatabaseResponse = protoFilesRoot.lookup(
      'google.spanner.admin.database.v1.Database'
    );
    const createDatabaseMetadata = protoFilesRoot.lookup(
      'google.spanner.admin.database.v1.CreateDatabaseMetadata'
    );
    const updateDatabaseDdlResponse = protoFilesRoot.lookup(
      'google.protobuf.Empty'
    );
    const updateDatabaseDdlMetadata = protoFilesRoot.lookup(
      'google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata'
    );

    this._descriptors.longrunning = {
      createDatabase: new gaxModule.LongrunningDescriptor(
        this.operationsClient,
        createDatabaseResponse.decode.bind(createDatabaseResponse),
        createDatabaseMetadata.decode.bind(createDatabaseMetadata)
      ),
      updateDatabaseDdl: new gaxModule.LongrunningDescriptor(
        this.operationsClient,
        updateDatabaseDdlResponse.decode.bind(updateDatabaseDdlResponse),
        updateDatabaseDdlMetadata.decode.bind(updateDatabaseDdlMetadata)
      ),
    };

    // Put together the default options sent with requests.
    const defaults = gaxGrpc.constructSettings(
      'google.spanner.admin.database.v1.DatabaseAdmin',
      gapicConfig,
      opts.clientConfig,
      {'x-goog-api-client': clientHeader.join(' ')}
    );

    // Set up a dictionary of "inner API calls"; the core implementation
    // of calling the API is handled in `google-gax`, with this code
    // merely providing the destination and request information.
    this._innerApiCalls = {};

    // Put together the "service stub" for
    // google.spanner.admin.database.v1.DatabaseAdmin.
    const databaseAdminStub = gaxGrpc.createStub(
      opts.fallback
        ? protos.lookupService('google.spanner.admin.database.v1.DatabaseAdmin')
        : protos.google.spanner.admin.database.v1.DatabaseAdmin,
      opts
    );

    // Iterate over each of the methods that the service provides
    // and create an API call method for each.
    const databaseAdminStubMethods = [
      'listDatabases',
      'createDatabase',
      'getDatabase',
      'updateDatabaseDdl',
      'dropDatabase',
      'getDatabaseDdl',
      'setIamPolicy',
      'getIamPolicy',
      'testIamPermissions',
    ];
    for (const methodName of databaseAdminStubMethods) {
      const innerCallPromise = databaseAdminStub.then(
        stub => (...args) => {
          return stub[methodName].apply(stub, args);
        },
        err => () => {
          throw err;
        }
      );
      this._innerApiCalls[methodName] = gaxModule.createApiCall(
        innerCallPromise,
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
   * The DNS address for this API service - same as servicePath(),
   * exists for compatibility reasons.
   */
  static get apiEndpoint() {
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
   * Lists Cloud Spanner databases.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The instance whose databases should be listed.
   *   Values are of the form `projects/<project>/instances/<instance>`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [Database]{@link google.spanner.admin.database.v1.Database}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListDatabasesResponse]{@link google.spanner.admin.database.v1.ListDatabasesResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Database]{@link google.spanner.admin.database.v1.Database}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Database]{@link google.spanner.admin.database.v1.Database} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListDatabasesResponse]{@link google.spanner.admin.database.v1.ListDatabasesResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
   *
   * client.listDatabases({parent: formattedParent})
   *   .then(responses => {
   *     const resources = responses[0];
   *     for (const resource of resources) {
   *       // doThingsWith(resource)
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
   *
   *
   * const options = {autoPaginate: false};
   * const callback = responses => {
   *   // The actual resources in a response.
   *   const resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   const nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // const rawResponse = responses[2];
   *   for (const resource of resources) {
   *     // doThingsWith(resource);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listDatabases(nextRequest, options).then(callback);
   *   }
   * }
   * client.listDatabases({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listDatabases(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      parent: request.parent,
    });

    return this._innerApiCalls.listDatabases(request, options, callback);
  }

  /**
   * Equivalent to {@link listDatabases}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listDatabases} continuously
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
   *   Required. The instance whose databases should be listed.
   *   Values are of the form `projects/<project>/instances/<instance>`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Database]{@link google.spanner.admin.database.v1.Database} on 'data' event.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
   * client.listDatabasesStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listDatabasesStream(request, options) {
    options = options || {};

    return this._descriptors.page.listDatabases.createStream(
      this._innerApiCalls.listDatabases,
      request,
      options
    );
  }

  /**
   * Creates a new Cloud Spanner database and starts to prepare it for serving.
   * The returned long-running operation will
   * have a name of the format `<database_name>/operations/<operation_id>` and
   * can be used to track preparation of the database. The
   * metadata field type is
   * CreateDatabaseMetadata.
   * The response field type is
   * Database, if successful.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The name of the instance that will serve the new database.
   *   Values are of the form `projects/<project>/instances/<instance>`.
   * @param {string} request.createStatement
   *   Required. A `CREATE DATABASE` statement, which specifies the ID of the
   *   new database.  The database ID must conform to the regular expression
   *   `[a-z][a-z0-9_\-]*[a-z0-9]` and be between 2 and 30 characters in length.
   *   If the database ID is a reserved word or if it contains a hyphen, the
   *   database ID must be enclosed in backticks (`` ` ``).
   * @param {string[]} [request.extraStatements]
   *   An optional list of DDL statements to run inside the newly created
   *   database. Statements can create tables, indexes, etc. These
   *   statements execute atomically with the creation of the database:
   *   if there is an error in any statement, the database is not created.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/classes/Operation.html} object.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/classes/Operation.html} object.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
   * const createStatement = '';
   * const request = {
   *   parent: formattedParent,
   *   createStatement: createStatement,
   * };
   *
   * // Handle the operation using the promise pattern.
   * client.createDatabase(request)
   *   .then(responses => {
   *     const [operation, initialApiResponse] = responses;
   *
   *     // Operation#promise starts polling for the completion of the LRO.
   *     return operation.promise();
   *   })
   *   .then(responses => {
   *     const result = responses[0];
   *     const metadata = responses[1];
   *     const finalApiResponse = responses[2];
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
   * const createStatement = '';
   * const request = {
   *   parent: formattedParent,
   *   createStatement: createStatement,
   * };
   *
   * // Handle the operation using the event emitter pattern.
   * client.createDatabase(request)
   *   .then(responses => {
   *     const [operation, initialApiResponse] = responses;
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
   *
   * const formattedParent = client.instancePath('[PROJECT]', '[INSTANCE]');
   * const createStatement = '';
   * const request = {
   *   parent: formattedParent,
   *   createStatement: createStatement,
   * };
   *
   * // Handle the operation using the await pattern.
   * const [operation] = await client.createDatabase(request);
   *
   * const [response] = await operation.promise();
   */
  createDatabase(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      parent: request.parent,
    });

    return this._innerApiCalls.createDatabase(request, options, callback);
  }

  /**
   * Gets the state of a Cloud Spanner database.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Required. The name of the requested database. Values are of the form
   *   `projects/<project>/instances/<instance>/databases/<database>`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Database]{@link google.spanner.admin.database.v1.Database}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Database]{@link google.spanner.admin.database.v1.Database}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * client.getDatabase({name: formattedName})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getDatabase(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      name: request.name,
    });

    return this._innerApiCalls.getDatabase(request, options, callback);
  }

  /**
   * Updates the schema of a Cloud Spanner database by
   * creating/altering/dropping tables, columns, indexes, etc. The returned
   * long-running operation will have a name of
   * the format `<database_name>/operations/<operation_id>` and can be used to
   * track execution of the schema change(s). The
   * metadata field type is
   * UpdateDatabaseDdlMetadata.
   * The operation has no response.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.database
   *   Required. The database to update.
   * @param {string[]} request.statements
   *   DDL statements to be applied to the database.
   * @param {string} [request.operationId]
   *   If empty, the new update request is assigned an
   *   automatically-generated operation ID. Otherwise, `operation_id`
   *   is used to construct the name of the resulting
   *   Operation.
   *
   *   Specifying an explicit operation ID simplifies determining
   *   whether the statements were executed in the event that the
   *   UpdateDatabaseDdl
   *   call is replayed, or the return value is otherwise lost: the
   *   database
   *   and `operation_id` fields can be combined to form the
   *   name of the resulting
   *   longrunning.Operation:
   *   `<database>/operations/<operation_id>`.
   *
   *   `operation_id` should be unique within the database, and must be
   *   a valid identifier: `[a-z][a-z0-9_]*`. Note that
   *   automatically-generated operation IDs always begin with an
   *   underscore. If the named operation already exists,
   *   UpdateDatabaseDdl
   *   returns `ALREADY_EXISTS`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/classes/Operation.html} object.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/classes/Operation.html} object.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * const statements = [];
   * const request = {
   *   database: formattedDatabase,
   *   statements: statements,
   * };
   *
   * // Handle the operation using the promise pattern.
   * client.updateDatabaseDdl(request)
   *   .then(responses => {
   *     const [operation, initialApiResponse] = responses;
   *
   *     // Operation#promise starts polling for the completion of the LRO.
   *     return operation.promise();
   *   })
   *   .then(responses => {
   *     const result = responses[0];
   *     const metadata = responses[1];
   *     const finalApiResponse = responses[2];
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * const formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * const statements = [];
   * const request = {
   *   database: formattedDatabase,
   *   statements: statements,
   * };
   *
   * // Handle the operation using the event emitter pattern.
   * client.updateDatabaseDdl(request)
   *   .then(responses => {
   *     const [operation, initialApiResponse] = responses;
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
   *
   * const formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * const statements = [];
   * const request = {
   *   database: formattedDatabase,
   *   statements: statements,
   * };
   *
   * // Handle the operation using the await pattern.
   * const [operation] = await client.updateDatabaseDdl(request);
   *
   * const [response] = await operation.promise();
   */
  updateDatabaseDdl(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      database: request.database,
    });

    return this._innerApiCalls.updateDatabaseDdl(request, options, callback);
  }

  /**
   * Drops (aka deletes) a Cloud Spanner database.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.database
   *   Required. The database to be dropped.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error)} [callback]
   *   The function which will be called with the result of the API call.
   * @returns {Promise} - The promise which resolves when API call finishes.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * client.dropDatabase({database: formattedDatabase}).catch(err => {
   *   console.error(err);
   * });
   */
  dropDatabase(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      database: request.database,
    });

    return this._innerApiCalls.dropDatabase(request, options, callback);
  }

  /**
   * Returns the schema of a Cloud Spanner database as a list of formatted
   * DDL statements. This method does not show pending schema updates, those may
   * be queried using the Operations API.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.database
   *   Required. The database whose schema we wish to get.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [GetDatabaseDdlResponse]{@link google.spanner.admin.database.v1.GetDatabaseDdlResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [GetDatabaseDdlResponse]{@link google.spanner.admin.database.v1.GetDatabaseDdlResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const spanner = require('@google-cloud/spanner');
   *
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * client.getDatabaseDdl({database: formattedDatabase})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getDatabaseDdl(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      database: request.database,
    });

    return this._innerApiCalls.getDatabaseDdl(request, options, callback);
  }

  /**
   * Sets the access control policy on a database resource. Replaces any
   * existing policy.
   *
   * Authorization requires `spanner.databases.setIamPolicy` permission on
   * resource.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.resource
   *   REQUIRED: The resource for which the policy is being specified.
   *   See the operation documentation for the appropriate value for this field.
   * @param {Object} request.policy
   *   REQUIRED: The complete policy to be applied to the `resource`. The size of
   *   the policy is limited to a few 10s of KB. An empty policy is a
   *   valid policy but certain Cloud Platform services (such as Projects)
   *   might reject them.
   *
   *   This object should have the same structure as [Policy]{@link google.iam.v1.Policy}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
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
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedResource = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * const policy = {};
   * const request = {
   *   resource: formattedResource,
   *   policy: policy,
   * };
   * client.setIamPolicy(request)
   *   .then(responses => {
   *     const response = responses[0];
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
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      resource: request.resource,
    });

    return this._innerApiCalls.setIamPolicy(request, options, callback);
  }

  /**
   * Gets the access control policy for a database resource. Returns an empty
   * policy if a database exists but does not have a policy set.
   *
   * Authorization requires `spanner.databases.getIamPolicy` permission on
   * resource.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.resource
   *   REQUIRED: The resource for which the policy is being requested.
   *   See the operation documentation for the appropriate value for this field.
   * @param {Object} [request.options]
   *   OPTIONAL: A `GetPolicyOptions` object for specifying options to
   *   `GetIamPolicy`. This field is only used by Cloud IAM.
   *
   *   This object should have the same structure as [GetPolicyOptions]{@link google.iam.v1.GetPolicyOptions}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
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
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedResource = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * client.getIamPolicy({resource: formattedResource})
   *   .then(responses => {
   *     const response = responses[0];
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
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      resource: request.resource,
    });

    return this._innerApiCalls.getIamPolicy(request, options, callback);
  }

  /**
   * Returns permissions that the caller has on the specified database resource.
   *
   * Attempting this RPC on a non-existent Cloud Spanner database will result in
   * a NOT_FOUND error if the user has `spanner.databases.list` permission on
   * the containing Cloud Spanner instance. Otherwise returns an empty set of
   * permissions.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.resource
   *   REQUIRED: The resource for which the policy detail is being requested.
   *   See the operation documentation for the appropriate value for this field.
   * @param {string[]} request.permissions
   *   The set of permissions to check for the `resource`. Permissions with
   *   wildcards (such as '*' or 'storage.*') are not allowed. For more
   *   information see
   *   [IAM Overview](https://cloud.google.com/iam/docs/overview#permissions).
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
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
   * const client = new spanner.v1.DatabaseAdminClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedResource = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * const permissions = [];
   * const request = {
   *   resource: formattedResource,
   *   permissions: permissions,
   * };
   * client.testIamPermissions(request)
   *   .then(responses => {
   *     const response = responses[0];
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
    request = request || {};
    options = options || {};
    options.otherArgs = options.otherArgs || {};
    options.otherArgs.headers = options.otherArgs.headers || {};
    options.otherArgs.headers[
      'x-goog-request-params'
    ] = gax.routingHeader.fromParams({
      resource: request.resource,
    });

    return this._innerApiCalls.testIamPermissions(request, options, callback);
  }

  // --------------------
  // -- Path templates --
  // --------------------

  /**
   * Return a fully-qualified database resource name string.
   *
   * @param {String} project
   * @param {String} instance
   * @param {String} database
   * @returns {String}
   */
  databasePath(project, instance, database) {
    return this._pathTemplates.databasePathTemplate.render({
      project: project,
      instance: instance,
      database: database,
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
   * Parse the databaseName from a database resource.
   *
   * @param {String} databaseName
   *   A fully-qualified path representing a database resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromDatabaseName(databaseName) {
    return this._pathTemplates.databasePathTemplate.match(databaseName).project;
  }

  /**
   * Parse the databaseName from a database resource.
   *
   * @param {String} databaseName
   *   A fully-qualified path representing a database resources.
   * @returns {String} - A string representing the instance.
   */
  matchInstanceFromDatabaseName(databaseName) {
    return this._pathTemplates.databasePathTemplate.match(databaseName)
      .instance;
  }

  /**
   * Parse the databaseName from a database resource.
   *
   * @param {String} databaseName
   *   A fully-qualified path representing a database resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromDatabaseName(databaseName) {
    return this._pathTemplates.databasePathTemplate.match(databaseName)
      .database;
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

module.exports = DatabaseAdminClient;
