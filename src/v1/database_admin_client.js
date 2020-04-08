// Copyright 2020 Google LLC
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
 * databases. It can be also used to create, delete and list backups for a
 * database and to restore from an existing backup.
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
      backupPathTemplate: new gaxModule.PathTemplate(
        'projects/{project}/instances/{instance}/backups/{backup}'
      ),
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
      listBackups: new gaxModule.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'backups'
      ),
      listDatabaseOperations: new gaxModule.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'operations'
      ),
      listBackupOperations: new gaxModule.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'operations'
      ),
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
    const createBackupResponse = protoFilesRoot.lookup(
      'google.spanner.admin.database.v1.Backup'
    );
    const createBackupMetadata = protoFilesRoot.lookup(
      'google.spanner.admin.database.v1.CreateBackupMetadata'
    );
    const restoreDatabaseResponse = protoFilesRoot.lookup(
      'google.spanner.admin.database.v1.Database'
    );
    const restoreDatabaseMetadata = protoFilesRoot.lookup(
      'google.spanner.admin.database.v1.RestoreDatabaseMetadata'
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
      createBackup: new gaxModule.LongrunningDescriptor(
        this.operationsClient,
        createBackupResponse.decode.bind(createBackupResponse),
        createBackupMetadata.decode.bind(createBackupMetadata)
      ),
      restoreDatabase: new gaxModule.LongrunningDescriptor(
        this.operationsClient,
        restoreDatabaseResponse.decode.bind(restoreDatabaseResponse),
        restoreDatabaseMetadata.decode.bind(restoreDatabaseMetadata)
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
      'createDatabase',
      'getDatabase',
      'updateDatabaseDdl',
      'dropDatabase',
      'getDatabaseDdl',
      'setIamPolicy',
      'getIamPolicy',
      'testIamPermissions',
      'createBackup',
      'getBackup',
      'updateBackup',
      'deleteBackup',
      'listBackups',
      'restoreDatabase',
      'listDatabaseOperations',
      'listBackupOperations',
      'listDatabases',
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
   * Creates a new Cloud Spanner database and starts to prepare it for serving.
   * The returned long-running operation will
   * have a name of the format `<database_name>/operations/<operation_id>` and
   * can be used to track preparation of the database. The
   * metadata field type is
   * CreateDatabaseMetadata. The
   * response field type is
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
   *   Optional. A list of DDL statements to run inside the newly created
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
   * UpdateDatabaseDdlMetadata.  The operation has no response.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.database
   *   Required. The database to update.
   * @param {string[]} request.statements
   *   Required. DDL statements to be applied to the database.
   * @param {string} [request.operationId]
   *   If empty, the new update request is assigned an
   *   automatically-generated operation ID. Otherwise, `operation_id`
   *   is used to construct the name of the resulting
   *   Operation.
   *
   *   Specifying an explicit operation ID simplifies determining
   *   whether the statements were executed in the event that the
   *   UpdateDatabaseDdl call is replayed,
   *   or the return value is otherwise lost: the database and
   *   `operation_id` fields can be combined to form the
   *   name of the resulting
   *   longrunning.Operation: `<database>/operations/<operation_id>`.
   *
   *   `operation_id` should be unique within the database, and must be
   *   a valid identifier: `[a-z][a-z0-9_]*`. Note that
   *   automatically-generated operation IDs always begin with an
   *   underscore. If the named operation already exists,
   *   UpdateDatabaseDdl returns
   *   `ALREADY_EXISTS`.
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
   * Completed backups for the database will be retained according to their
   * `expire_time`.
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
   * Sets the access control policy on a database or backup resource.
   * Replaces any existing policy.
   *
   * Authorization requires `spanner.databases.setIamPolicy`
   * permission on resource.
   * For backups, authorization requires `spanner.backups.setIamPolicy`
   * permission on resource.
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
   * const resource = '';
   * const policy = {};
   * const request = {
   *   resource: resource,
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
   * Gets the access control policy for a database or backup resource.
   * Returns an empty policy if a database or backup exists but does not have a
   * policy set.
   *
   * Authorization requires `spanner.databases.getIamPolicy` permission on
   * resource.
   * For backups, authorization requires `spanner.backups.getIamPolicy`
   * permission on resource.
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
   * const resource = '';
   * client.getIamPolicy({resource: resource})
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
   * Returns permissions that the caller has on the specified database or backup
   * resource.
   *
   * Attempting this RPC on a non-existent Cloud Spanner database will
   * result in a NOT_FOUND error if the user has
   * `spanner.databases.list` permission on the containing Cloud
   * Spanner instance. Otherwise returns an empty set of permissions.
   * Calling this method on a backup that does not exist will
   * result in a NOT_FOUND error if the user has
   * `spanner.backups.list` permission on the containing instance.
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
   * const resource = '';
   * const permissions = [];
   * const request = {
   *   resource: resource,
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

  /**
   * Starts creating a new Cloud Spanner Backup.
   * The returned backup long-running operation
   * will have a name of the format
   * `projects/<project>/instances/<instance>/backups/<backup>/operations/<operation_id>`
   * and can be used to track creation of the backup. The
   * metadata field type is
   * CreateBackupMetadata. The
   * response field type is
   * Backup, if successful. Cancelling the returned operation will stop the
   * creation and delete the backup.
   * There can be only one pending backup creation per database. Backup creation
   * of different databases can run concurrently.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The name of the instance in which the backup will be
   *   created. This must be the same instance that contains the database the
   *   backup will be created from. The backup will be stored in the
   *   location(s) specified in the instance configuration of this
   *   instance. Values are of the form
   *   `projects/<project>/instances/<instance>`.
   * @param {string} request.backupId
   *   Required. The id of the backup to be created. The `backup_id` appended to
   *   `parent` forms the full backup name of the form
   *   `projects/<project>/instances/<instance>/backups/<backup_id>`.
   * @param {Object} request.backup
   *   Required. The backup to create.
   *
   *   This object should have the same structure as [Backup]{@link google.spanner.admin.database.v1.Backup}
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
   * const backupId = '';
   * const backup = {};
   * const request = {
   *   parent: formattedParent,
   *   backupId: backupId,
   *   backup: backup,
   * };
   *
   * // Handle the operation using the promise pattern.
   * client.createBackup(request)
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
   * const backupId = '';
   * const backup = {};
   * const request = {
   *   parent: formattedParent,
   *   backupId: backupId,
   *   backup: backup,
   * };
   *
   * // Handle the operation using the event emitter pattern.
   * client.createBackup(request)
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
   * const backupId = '';
   * const backup = {};
   * const request = {
   *   parent: formattedParent,
   *   backupId: backupId,
   *   backup: backup,
   * };
   *
   * // Handle the operation using the await pattern.
   * const [operation] = await client.createBackup(request);
   *
   * const [response] = await operation.promise();
   */
  createBackup(request, options, callback) {
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

    return this._innerApiCalls.createBackup(request, options, callback);
  }

  /**
   * Gets metadata on a pending or completed Backup.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Required. Name of the backup.
   *   Values are of the form
   *   `projects/<project>/instances/<instance>/backups/<backup>`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Backup]{@link google.spanner.admin.database.v1.Backup}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Backup]{@link google.spanner.admin.database.v1.Backup}.
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
   * const formattedName = client.backupPath('[PROJECT]', '[INSTANCE]', '[BACKUP]');
   * client.getBackup({name: formattedName})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getBackup(request, options, callback) {
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

    return this._innerApiCalls.getBackup(request, options, callback);
  }

  /**
   * Updates a pending or completed Backup.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {Object} request.backup
   *   Required. The backup to update. `backup.name`, and the fields to be updated
   *   as specified by `update_mask` are required. Other fields are ignored.
   *   Update is only supported for the following fields:
   *    * `backup.expire_time`.
   *
   *   This object should have the same structure as [Backup]{@link google.spanner.admin.database.v1.Backup}
   * @param {Object} request.updateMask
   *   Required. A mask specifying which fields (e.g. `expire_time`) in the
   *   Backup resource should be updated. This mask is relative to the Backup
   *   resource, not to the request message. The field mask must always be
   *   specified; this prevents any future fields from being erased accidentally
   *   by clients that do not know about them.
   *
   *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Backup]{@link google.spanner.admin.database.v1.Backup}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Backup]{@link google.spanner.admin.database.v1.Backup}.
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
   * const backup = {};
   * const updateMask = {};
   * const request = {
   *   backup: backup,
   *   updateMask: updateMask,
   * };
   * client.updateBackup(request)
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  updateBackup(request, options, callback) {
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
      'backup.name': request.backup.name,
    });

    return this._innerApiCalls.updateBackup(request, options, callback);
  }

  /**
   * Deletes a pending or completed Backup.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Required. Name of the backup to delete.
   *   Values are of the form
   *   `projects/<project>/instances/<instance>/backups/<backup>`.
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
   * const formattedName = client.backupPath('[PROJECT]', '[INSTANCE]', '[BACKUP]');
   * client.deleteBackup({name: formattedName}).catch(err => {
   *   console.error(err);
   * });
   */
  deleteBackup(request, options, callback) {
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

    return this._innerApiCalls.deleteBackup(request, options, callback);
  }

  /**
   * Lists completed and pending backups.
   * Backups returned are ordered by `create_time` in descending order,
   * starting from the most recent `create_time`.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The instance to list backups from.  Values are of the
   *   form `projects/<project>/instances/<instance>`.
   * @param {string} [request.filter]
   *   An expression that filters the list of returned backups.
   *
   *   A filter expression consists of a field name, a comparison operator, and a
   *   value for filtering.
   *   The value must be a string, a number, or a boolean. The comparison operator
   *   must be one of: `<`, `>`, `<=`, `>=`, `!=`, `=`, or `:`.
   *   Colon `:` is the contains operator. Filter rules are not case sensitive.
   *
   *   The following fields in the Backup are eligible for filtering:
   *
   *     * `name`
   *     * `database`
   *     * `state`
   *     * `create_time` (and values are of the format YYYY-MM-DDTHH:MM:SSZ)
   *     * `expire_time` (and values are of the format YYYY-MM-DDTHH:MM:SSZ)
   *     * `size_bytes`
   *
   *   You can combine multiple expressions by enclosing each expression in
   *   parentheses. By default, expressions are combined with AND logic, but
   *   you can specify AND, OR, and NOT logic explicitly.
   *
   *   Here are a few examples:
   *
   *     * `name:Howl` - The backup's name contains the string "howl".
   *     * `database:prod`
   *            - The database's name contains the string "prod".
   *     * `state:CREATING` - The backup is pending creation.
   *     * `state:READY` - The backup is fully created and ready for use.
   *     * `(name:howl) AND (create_time < \"2018-03-28T14:50:00Z\")`
   *            - The backup name contains the string "howl" and `create_time`
   *                of the backup is before 2018-03-28T14:50:00Z.
   *     * `expire_time < \"2018-03-28T14:50:00Z\"`
   *            - The backup `expire_time` is before 2018-03-28T14:50:00Z.
   *     * `size_bytes > 10000000000` - The backup's size is greater than 10GB
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
   *   The second parameter to the callback is Array of [Backup]{@link google.spanner.admin.database.v1.Backup}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListBackupsResponse]{@link google.spanner.admin.database.v1.ListBackupsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Backup]{@link google.spanner.admin.database.v1.Backup}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Backup]{@link google.spanner.admin.database.v1.Backup} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListBackupsResponse]{@link google.spanner.admin.database.v1.ListBackupsResponse}.
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
   * client.listBackups({parent: formattedParent})
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
   *     return client.listBackups(nextRequest, options).then(callback);
   *   }
   * }
   * client.listBackups({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listBackups(request, options, callback) {
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

    return this._innerApiCalls.listBackups(request, options, callback);
  }

  /**
   * Equivalent to {@link listBackups}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listBackups} continuously
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
   *   Required. The instance to list backups from.  Values are of the
   *   form `projects/<project>/instances/<instance>`.
   * @param {string} [request.filter]
   *   An expression that filters the list of returned backups.
   *
   *   A filter expression consists of a field name, a comparison operator, and a
   *   value for filtering.
   *   The value must be a string, a number, or a boolean. The comparison operator
   *   must be one of: `<`, `>`, `<=`, `>=`, `!=`, `=`, or `:`.
   *   Colon `:` is the contains operator. Filter rules are not case sensitive.
   *
   *   The following fields in the Backup are eligible for filtering:
   *
   *     * `name`
   *     * `database`
   *     * `state`
   *     * `create_time` (and values are of the format YYYY-MM-DDTHH:MM:SSZ)
   *     * `expire_time` (and values are of the format YYYY-MM-DDTHH:MM:SSZ)
   *     * `size_bytes`
   *
   *   You can combine multiple expressions by enclosing each expression in
   *   parentheses. By default, expressions are combined with AND logic, but
   *   you can specify AND, OR, and NOT logic explicitly.
   *
   *   Here are a few examples:
   *
   *     * `name:Howl` - The backup's name contains the string "howl".
   *     * `database:prod`
   *            - The database's name contains the string "prod".
   *     * `state:CREATING` - The backup is pending creation.
   *     * `state:READY` - The backup is fully created and ready for use.
   *     * `(name:howl) AND (create_time < \"2018-03-28T14:50:00Z\")`
   *            - The backup name contains the string "howl" and `create_time`
   *                of the backup is before 2018-03-28T14:50:00Z.
   *     * `expire_time < \"2018-03-28T14:50:00Z\"`
   *            - The backup `expire_time` is before 2018-03-28T14:50:00Z.
   *     * `size_bytes > 10000000000` - The backup's size is greater than 10GB
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
   *   An object stream which emits an object representing [Backup]{@link google.spanner.admin.database.v1.Backup} on 'data' event.
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
   * client.listBackupsStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listBackupsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listBackups.createStream(
      this._innerApiCalls.listBackups,
      request,
      options
    );
  }

  /**
   * Create a new database by restoring from a completed backup. The new
   * database must be in the same project and in an instance with the same
   * instance configuration as the instance containing
   * the backup. The returned database long-running
   * operation has a name of the format
   * `projects/<project>/instances/<instance>/databases/<database>/operations/<operation_id>`,
   * and can be used to track the progress of the operation, and to cancel it.
   * The metadata field type is
   * RestoreDatabaseMetadata.
   * The response type
   * is Database, if
   * successful. Cancelling the returned operation will stop the restore and
   * delete the database.
   * There can be only one database being restored into an instance at a time.
   * Once the restore operation completes, a new restore operation can be
   * initiated, without waiting for the optimize operation associated with the
   * first restore to complete.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The name of the instance in which to create the
   *   restored database. This instance must be in the same project and
   *   have the same instance configuration as the instance containing
   *   the source backup. Values are of the form
   *   `projects/<project>/instances/<instance>`.
   * @param {string} request.databaseId
   *   Required. The id of the database to create and restore to. This
   *   database must not already exist. The `database_id` appended to
   *   `parent` forms the full database name of the form
   *   `projects/<project>/instances/<instance>/databases/<database_id>`.
   * @param {string} [request.backup]
   *   Name of the backup from which to restore.  Values are of the form
   *   `projects/<project>/instances/<instance>/backups/<backup>`.
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
   * const databaseId = '';
   * const request = {
   *   parent: formattedParent,
   *   databaseId: databaseId,
   * };
   *
   * // Handle the operation using the promise pattern.
   * client.restoreDatabase(request)
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
   * const databaseId = '';
   * const request = {
   *   parent: formattedParent,
   *   databaseId: databaseId,
   * };
   *
   * // Handle the operation using the event emitter pattern.
   * client.restoreDatabase(request)
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
   * const databaseId = '';
   * const request = {
   *   parent: formattedParent,
   *   databaseId: databaseId,
   * };
   *
   * // Handle the operation using the await pattern.
   * const [operation] = await client.restoreDatabase(request);
   *
   * const [response] = await operation.promise();
   */
  restoreDatabase(request, options, callback) {
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

    return this._innerApiCalls.restoreDatabase(request, options, callback);
  }

  /**
   * Lists database longrunning-operations.
   * A database operation has a name of the form
   * `projects/<project>/instances/<instance>/databases/<database>/operations/<operation>`.
   * The long-running operation
   * metadata field type
   * `metadata.type_url` describes the type of the metadata. Operations returned
   * include those that have completed/failed/canceled within the last 7 days,
   * and pending operations.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The instance of the database operations.
   *   Values are of the form `projects/<project>/instances/<instance>`.
   * @param {string} [request.filter]
   *   An expression that filters the list of returned operations.
   *
   *   A filter expression consists of a field name, a
   *   comparison operator, and a value for filtering.
   *   The value must be a string, a number, or a boolean. The comparison operator
   *   must be one of: `<`, `>`, `<=`, `>=`, `!=`, `=`, or `:`.
   *   Colon `:` is the contains operator. Filter rules are not case sensitive.
   *
   *   The following fields in the Operation
   *   are eligible for filtering:
   *
   *     * `name` - The name of the long-running operation
   *     * `done` - False if the operation is in progress, else true.
   *     * `metadata.@type` - the type of metadata. For example, the type string
   *        for RestoreDatabaseMetadata is
   *        `type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata`.
   *     * `metadata.<field_name>` - any field in metadata.value.
   *     * `error` - Error associated with the long-running operation.
   *     * `response.@type` - the type of response.
   *     * `response.<field_name>` - any field in response.value.
   *
   *   You can combine multiple expressions by enclosing each expression in
   *   parentheses. By default, expressions are combined with AND logic. However,
   *   you can specify AND, OR, and NOT logic explicitly.
   *
   *   Here are a few examples:
   *
   *     * `done:true` - The operation is complete.
   *     * `(metadata.@type=type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata) AND` <br/>
   *       `(metadata.source_type:BACKUP) AND` <br/>
   *       `(metadata.backup_info.backup:backup_howl) AND` <br/>
   *       `(metadata.name:restored_howl) AND` <br/>
   *       `(metadata.progress.start_time < \"2018-03-28T14:50:00Z\") AND` <br/>
   *       `(error:*)` - Return operations where:
   *       * The operation's metadata type is RestoreDatabaseMetadata.
   *       * The database is restored from a backup.
   *       * The backup name contains "backup_howl".
   *       * The restored database's name contains "restored_howl".
   *       * The operation started before 2018-03-28T14:50:00Z.
   *       * The operation resulted in an error.
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
   *   The second parameter to the callback is Array of [Operation]{@link google.longrunning.Operation}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListDatabaseOperationsResponse]{@link google.spanner.admin.database.v1.ListDatabaseOperationsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Operation]{@link google.longrunning.Operation}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Operation]{@link google.longrunning.Operation} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListDatabaseOperationsResponse]{@link google.spanner.admin.database.v1.ListDatabaseOperationsResponse}.
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
   * client.listDatabaseOperations({parent: formattedParent})
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
   *     return client.listDatabaseOperations(nextRequest, options).then(callback);
   *   }
   * }
   * client.listDatabaseOperations({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listDatabaseOperations(request, options, callback) {
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

    return this._innerApiCalls.listDatabaseOperations(
      request,
      options,
      callback
    );
  }

  /**
   * Equivalent to {@link listDatabaseOperations}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listDatabaseOperations} continuously
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
   *   Required. The instance of the database operations.
   *   Values are of the form `projects/<project>/instances/<instance>`.
   * @param {string} [request.filter]
   *   An expression that filters the list of returned operations.
   *
   *   A filter expression consists of a field name, a
   *   comparison operator, and a value for filtering.
   *   The value must be a string, a number, or a boolean. The comparison operator
   *   must be one of: `<`, `>`, `<=`, `>=`, `!=`, `=`, or `:`.
   *   Colon `:` is the contains operator. Filter rules are not case sensitive.
   *
   *   The following fields in the Operation
   *   are eligible for filtering:
   *
   *     * `name` - The name of the long-running operation
   *     * `done` - False if the operation is in progress, else true.
   *     * `metadata.@type` - the type of metadata. For example, the type string
   *        for RestoreDatabaseMetadata is
   *        `type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata`.
   *     * `metadata.<field_name>` - any field in metadata.value.
   *     * `error` - Error associated with the long-running operation.
   *     * `response.@type` - the type of response.
   *     * `response.<field_name>` - any field in response.value.
   *
   *   You can combine multiple expressions by enclosing each expression in
   *   parentheses. By default, expressions are combined with AND logic. However,
   *   you can specify AND, OR, and NOT logic explicitly.
   *
   *   Here are a few examples:
   *
   *     * `done:true` - The operation is complete.
   *     * `(metadata.@type=type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata) AND` <br/>
   *       `(metadata.source_type:BACKUP) AND` <br/>
   *       `(metadata.backup_info.backup:backup_howl) AND` <br/>
   *       `(metadata.name:restored_howl) AND` <br/>
   *       `(metadata.progress.start_time < \"2018-03-28T14:50:00Z\") AND` <br/>
   *       `(error:*)` - Return operations where:
   *       * The operation's metadata type is RestoreDatabaseMetadata.
   *       * The database is restored from a backup.
   *       * The backup name contains "backup_howl".
   *       * The restored database's name contains "restored_howl".
   *       * The operation started before 2018-03-28T14:50:00Z.
   *       * The operation resulted in an error.
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
   *   An object stream which emits an object representing [Operation]{@link google.longrunning.Operation} on 'data' event.
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
   * client.listDatabaseOperationsStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listDatabaseOperationsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listDatabaseOperations.createStream(
      this._innerApiCalls.listDatabaseOperations,
      request,
      options
    );
  }

  /**
   * Lists the backup long-running operations in
   * the given instance. A backup operation has a name of the form
   * `projects/<project>/instances/<instance>/backups/<backup>/operations/<operation>`.
   * The long-running operation
   * metadata field type
   * `metadata.type_url` describes the type of the metadata. Operations returned
   * include those that have completed/failed/canceled within the last 7 days,
   * and pending operations. Operations returned are ordered by
   * `operation.metadata.value.progress.start_time` in descending order starting
   * from the most recently started operation.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. The instance of the backup operations. Values are of
   *   the form `projects/<project>/instances/<instance>`.
   * @param {string} [request.filter]
   *   An expression that filters the list of returned backup operations.
   *
   *   A filter expression consists of a field name, a
   *   comparison operator, and a value for filtering.
   *   The value must be a string, a number, or a boolean. The comparison operator
   *   must be one of: `<`, `>`, `<=`, `>=`, `!=`, `=`, or `:`.
   *   Colon `:` is the contains operator. Filter rules are not case sensitive.
   *
   *   The following fields in the operation
   *   are eligible for filtering:
   *
   *     * `name` - The name of the long-running operation
   *     * `done` - False if the operation is in progress, else true.
   *     * `metadata.@type` - the type of metadata. For example, the type string
   *        for CreateBackupMetadata is
   *        `type.googleapis.com/google.spanner.admin.database.v1.CreateBackupMetadata`.
   *     * `metadata.<field_name>` - any field in metadata.value.
   *     * `error` - Error associated with the long-running operation.
   *     * `response.@type` - the type of response.
   *     * `response.<field_name>` - any field in response.value.
   *
   *   You can combine multiple expressions by enclosing each expression in
   *   parentheses. By default, expressions are combined with AND logic, but
   *   you can specify AND, OR, and NOT logic explicitly.
   *
   *   Here are a few examples:
   *
   *     * `done:true` - The operation is complete.
   *     * `metadata.database:prod` - The database the backup was taken from has
   *        a name containing the string "prod".
   *     * `(metadata.@type=type.googleapis.com/google.spanner.admin.database.v1.CreateBackupMetadata) AND` <br/>
   *       `(metadata.name:howl) AND` <br/>
   *       `(metadata.progress.start_time < \"2018-03-28T14:50:00Z\") AND` <br/>
   *       `(error:*)` - Returns operations where:
   *       * The operation's metadata type is CreateBackupMetadata.
   *       * The backup name contains the string "howl".
   *       * The operation started before 2018-03-28T14:50:00Z.
   *       * The operation resulted in an error.
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
   *   The second parameter to the callback is Array of [Operation]{@link google.longrunning.Operation}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListBackupOperationsResponse]{@link google.spanner.admin.database.v1.ListBackupOperationsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Operation]{@link google.longrunning.Operation}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Operation]{@link google.longrunning.Operation} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListBackupOperationsResponse]{@link google.spanner.admin.database.v1.ListBackupOperationsResponse}.
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
   * client.listBackupOperations({parent: formattedParent})
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
   *     return client.listBackupOperations(nextRequest, options).then(callback);
   *   }
   * }
   * client.listBackupOperations({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listBackupOperations(request, options, callback) {
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

    return this._innerApiCalls.listBackupOperations(request, options, callback);
  }

  /**
   * Equivalent to {@link listBackupOperations}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listBackupOperations} continuously
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
   *   Required. The instance of the backup operations. Values are of
   *   the form `projects/<project>/instances/<instance>`.
   * @param {string} [request.filter]
   *   An expression that filters the list of returned backup operations.
   *
   *   A filter expression consists of a field name, a
   *   comparison operator, and a value for filtering.
   *   The value must be a string, a number, or a boolean. The comparison operator
   *   must be one of: `<`, `>`, `<=`, `>=`, `!=`, `=`, or `:`.
   *   Colon `:` is the contains operator. Filter rules are not case sensitive.
   *
   *   The following fields in the operation
   *   are eligible for filtering:
   *
   *     * `name` - The name of the long-running operation
   *     * `done` - False if the operation is in progress, else true.
   *     * `metadata.@type` - the type of metadata. For example, the type string
   *        for CreateBackupMetadata is
   *        `type.googleapis.com/google.spanner.admin.database.v1.CreateBackupMetadata`.
   *     * `metadata.<field_name>` - any field in metadata.value.
   *     * `error` - Error associated with the long-running operation.
   *     * `response.@type` - the type of response.
   *     * `response.<field_name>` - any field in response.value.
   *
   *   You can combine multiple expressions by enclosing each expression in
   *   parentheses. By default, expressions are combined with AND logic, but
   *   you can specify AND, OR, and NOT logic explicitly.
   *
   *   Here are a few examples:
   *
   *     * `done:true` - The operation is complete.
   *     * `metadata.database:prod` - The database the backup was taken from has
   *        a name containing the string "prod".
   *     * `(metadata.@type=type.googleapis.com/google.spanner.admin.database.v1.CreateBackupMetadata) AND` <br/>
   *       `(metadata.name:howl) AND` <br/>
   *       `(metadata.progress.start_time < \"2018-03-28T14:50:00Z\") AND` <br/>
   *       `(error:*)` - Returns operations where:
   *       * The operation's metadata type is CreateBackupMetadata.
   *       * The backup name contains the string "howl".
   *       * The operation started before 2018-03-28T14:50:00Z.
   *       * The operation resulted in an error.
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
   *   An object stream which emits an object representing [Operation]{@link google.longrunning.Operation} on 'data' event.
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
   * client.listBackupOperationsStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listBackupOperationsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listBackupOperations.createStream(
      this._innerApiCalls.listBackupOperations,
      request,
      options
    );
  }

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

  // --------------------
  // -- Path templates --
  // --------------------

  /**
   * Return a fully-qualified backup resource name string.
   *
   * @param {String} project
   * @param {String} instance
   * @param {String} backup
   * @returns {String}
   */
  backupPath(project, instance, backup) {
    return this._pathTemplates.backupPathTemplate.render({
      project: project,
      instance: instance,
      backup: backup,
    });
  }

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
   * Parse the backupName from a backup resource.
   *
   * @param {String} backupName
   *   A fully-qualified path representing a backup resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromBackupName(backupName) {
    return this._pathTemplates.backupPathTemplate.match(backupName).project;
  }

  /**
   * Parse the backupName from a backup resource.
   *
   * @param {String} backupName
   *   A fully-qualified path representing a backup resources.
   * @returns {String} - A string representing the instance.
   */
  matchInstanceFromBackupName(backupName) {
    return this._pathTemplates.backupPathTemplate.match(backupName).instance;
  }

  /**
   * Parse the backupName from a backup resource.
   *
   * @param {String} backupName
   *   A fully-qualified path representing a backup resources.
   * @returns {String} - A string representing the backup.
   */
  matchBackupFromBackupName(backupName) {
    return this._pathTemplates.backupPathTemplate.match(backupName).backup;
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
