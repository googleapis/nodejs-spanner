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

const gapicConfig = require('./spanner_client_config');
const gax = require('google-gax');
const merge = require('lodash.merge');
const path = require('path');

const VERSION = require('../../package.json').version;

/**
 * Cloud Spanner API
 *
 * The Cloud Spanner API can be used to manage sessions and execute
 * transactions on data stored in Cloud Spanner databases.
 *
 * @class
 * @memberof v1
 */
class SpannerClient {
  /**
   * Construct an instance of SpannerClient.
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
    var gaxGrpc = new gax.GrpcClient(opts);

    // Save the auth object to the client, for use by other methods.
    this.auth = gaxGrpc.auth;

    // Determine the client header string.
    var clientHeader = [
      `gl-node/${process.version}`,
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
        'google/spanner/v1/spanner.proto'
      )
    );

    // This API contains "path templates"; forward-slash-separated
    // identifiers to uniquely identify resources within the API.
    // Create useful helper objects for these.
    this._pathTemplates = {
      databasePathTemplate: new gax.PathTemplate(
        'projects/{project}/instances/{instance}/databases/{database}'
      ),
      sessionPathTemplate: new gax.PathTemplate(
        'projects/{project}/instances/{instance}/databases/{database}/sessions/{session}'
      ),
    };

    // Some of the methods on this service return "paged" results,
    // (e.g. 50 results at a time, with tokens to get subsequent
    // pages). Denote the keys used for pagination and results.
    this._descriptors.page = {
      listSessions: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'sessions'
      ),
    };

    // Some of the methods on this service provide streaming responses.
    // Provide descriptors for these.
    this._descriptors.stream = {
      executeStreamingSql: new gax.StreamDescriptor(
        gax.StreamType.SERVER_STREAMING
      ),
      streamingRead: new gax.StreamDescriptor(gax.StreamType.SERVER_STREAMING),
    };

    // Put together the default options sent with requests.
    var defaults = gaxGrpc.constructSettings(
      'google.spanner.v1.Spanner',
      gapicConfig,
      opts.clientConfig,
      {'x-goog-api-client': clientHeader.join(' ')}
    );

    // Set up a dictionary of "inner API calls"; the core implementation
    // of calling the API is handled in `google-gax`, with this code
    // merely providing the destination and request information.
    this._innerApiCalls = {};

    // Put together the "service stub" for
    // google.spanner.v1.Spanner.
    var spannerStub = gaxGrpc.createStub(
      protos.google.spanner.v1.Spanner,
      opts
    );

    // Iterate over each of the methods that the service provides
    // and create an API call method for each.
    var spannerStubMethods = [
      'createSession',
      'getSession',
      'listSessions',
      'deleteSession',
      'executeSql',
      'executeStreamingSql',
      'read',
      'streamingRead',
      'beginTransaction',
      'commit',
      'rollback',
      'partitionQuery',
      'partitionRead',
    ];
    for (let methodName of spannerStubMethods) {
      this._innerApiCalls[methodName] = gax.createApiCall(
        spannerStub.then(
          stub =>
            function() {
              var args = Array.prototype.slice.call(arguments, 0);
              return stub[methodName].apply(stub, args);
            }
        ),
        defaults[methodName],
        this._descriptors.page[methodName] ||
          this._descriptors.stream[methodName]
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
      'https://www.googleapis.com/auth/spanner.data',
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
   * Creates a new session. A session can be used to perform
   * transactions that read and/or modify data in a Cloud Spanner database.
   * Sessions are meant to be reused for many consecutive
   * transactions.
   *
   * Sessions can only execute one transaction at a time. To execute
   * multiple concurrent read-write/write-only transactions, create
   * multiple sessions. Note that standalone reads and queries use a
   * transaction internally, and count toward the one transaction
   * limit.
   *
   * Cloud Spanner limits the number of sessions that can exist at any given
   * time; thus, it is a good idea to delete idle and/or unneeded sessions.
   * Aside from explicit deletes, Cloud Spanner can delete sessions for which no
   * operations are sent for more than an hour. If a session is deleted,
   * requests to it return `NOT_FOUND`.
   *
   * Idle sessions can be kept alive by sending a trivial SQL query
   * periodically, e.g., `"SELECT 1"`.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.database
   *   Required. The database in which the new session is created.
   * @param {Object} [request.session]
   *   The session to create.
   *
   *   This object should have the same structure as [Session]{@link google.spanner.v1.Session}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Session]{@link google.spanner.v1.Session}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Session]{@link google.spanner.v1.Session}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * client.createSession({database: formattedDatabase})
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  createSession(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.createSession(request, options, callback);
  }

  /**
   * Gets a session. Returns `NOT_FOUND` if the session does not exist.
   * This is mainly useful for determining whether a session is still
   * alive.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Required. The name of the session to retrieve.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Session]{@link google.spanner.v1.Session}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Session]{@link google.spanner.v1.Session}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedName = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * client.getSession({name: formattedName})
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getSession(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.getSession(request, options, callback);
  }

  /**
   * Lists all sessions in a given database.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.database
   *   Required. The database in which to list sessions.
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
   *     * `labels.key` where key is the name of a label
   *
   *   Some examples of using filters are:
   *
   *     * `labels.env:*` --> The session has the label "env".
   *     * `labels.env:dev` --> The session has the label "env" and the value of
   *                          the label contains the string "dev".
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [Session]{@link google.spanner.v1.Session}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListSessionsResponse]{@link google.spanner.v1.ListSessionsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Session]{@link google.spanner.v1.Session}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Session]{@link google.spanner.v1.Session} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListSessionsResponse]{@link google.spanner.v1.ListSessionsResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * var formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   *
   * client.listSessions({database: formattedDatabase})
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
   * var formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
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
   *     return client.listSessions(nextRequest, options).then(callback);
   *   }
   * }
   * client.listSessions({database: formattedDatabase}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listSessions(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.listSessions(request, options, callback);
  }

  /**
   * Equivalent to {@link listSessions}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listSessions} continuously
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
   * @param {string} request.database
   *   Required. The database in which to list sessions.
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
   *     * `labels.key` where key is the name of a label
   *
   *   Some examples of using filters are:
   *
   *     * `labels.env:*` --> The session has the label "env".
   *     * `labels.env:dev` --> The session has the label "env" and the value of
   *                          the label contains the string "dev".
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Session]{@link google.spanner.v1.Session} on 'data' event.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedDatabase = client.databasePath('[PROJECT]', '[INSTANCE]', '[DATABASE]');
   * client.listSessionsStream({database: formattedDatabase})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listSessionsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listSessions.createStream(
      this._innerApiCalls.listSessions,
      request,
      options
    );
  }

  /**
   * Ends a session, releasing server resources associated with it.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   Required. The name of the session to delete.
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
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedName = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * client.deleteSession({name: formattedName}).catch(err => {
   *   console.error(err);
   * });
   */
  deleteSession(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.deleteSession(request, options, callback);
  }

  /**
   * Executes an SQL query, returning all rows in a single reply. This
   * method cannot be used to return a result set larger than 10 MiB;
   * if the query yields more data than that, the query fails with
   * a `FAILED_PRECONDITION` error.
   *
   * Queries inside read-write transactions might return `ABORTED`. If
   * this occurs, the application should restart the transaction from
   * the beginning. See Transaction for more details.
   *
   * Larger result sets can be fetched in streaming fashion by calling
   * ExecuteStreamingSql instead.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session in which the SQL query should be performed.
   * @param {string} request.sql
   *   Required. The SQL query string.
   * @param {Object} [request.transaction]
   *   The transaction to use. If none is provided, the default is a
   *   temporary read-only transaction with strong concurrency.
   *
   *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
   * @param {Object} [request.params]
   *   The SQL query string can contain parameter placeholders. A parameter
   *   placeholder consists of `'@'` followed by the parameter
   *   name. Parameter names consist of any combination of letters,
   *   numbers, and underscores.
   *
   *   Parameters can appear anywhere that a literal value is expected.  The same
   *   parameter name can be used more than once, for example:
   *     `"WHERE id > @msg_id AND id < @msg_id + 100"`
   *
   *   It is an error to execute an SQL query with unbound parameters.
   *
   *   Parameter values are specified using `params`, which is a JSON
   *   object whose keys are parameter names, and whose values are the
   *   corresponding parameter values.
   *
   *   This object should have the same structure as [Struct]{@link google.protobuf.Struct}
   * @param {Object.<string, Object>} [request.paramTypes]
   *   It is not always possible for Cloud Spanner to infer the right SQL type
   *   from a JSON value.  For example, values of type `BYTES` and values
   *   of type `STRING` both appear in params as JSON strings.
   *
   *   In these cases, `param_types` can be used to specify the exact
   *   SQL type for some or all of the SQL query parameters. See the
   *   definition of Type for more information
   *   about SQL types.
   * @param {string} [request.resumeToken]
   *   If this request is resuming a previously interrupted SQL query
   *   execution, `resume_token` should be copied from the last
   *   PartialResultSet yielded before the interruption. Doing this
   *   enables the new SQL query execution to resume where the last one left
   *   off. The rest of the request parameters must exactly match the
   *   request that yielded this token.
   * @param {number} [request.queryMode]
   *   Used to control the amount of debugging information returned in
   *   ResultSetStats. If partition_token is set, query_mode can only
   *   be set to QueryMode.NORMAL.
   *
   *   The number should be among the values of [QueryMode]{@link google.spanner.v1.QueryMode}
   * @param {string} [request.partitionToken]
   *   If present, results will be restricted to the specified partition
   *   previously created using PartitionQuery().  There must be an exact
   *   match for the values of fields common to this message and the
   *   PartitionQueryRequest message used to create this partition_token.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [ResultSet]{@link google.spanner.v1.ResultSet}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [ResultSet]{@link google.spanner.v1.ResultSet}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var sql = '';
   * var request = {
   *   session: formattedSession,
   *   sql: sql,
   * };
   * client.executeSql(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  executeSql(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.executeSql(request, options, callback);
  }

  /**
   * Like ExecuteSql, except returns the result
   * set as a stream. Unlike ExecuteSql, there
   * is no limit on the size of the returned result set. However, no
   * individual row in the result set can exceed 100 MiB, and no
   * column value can exceed 10 MiB.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session in which the SQL query should be performed.
   * @param {string} request.sql
   *   Required. The SQL query string.
   * @param {Object} [request.transaction]
   *   The transaction to use. If none is provided, the default is a
   *   temporary read-only transaction with strong concurrency.
   *
   *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
   * @param {Object} [request.params]
   *   The SQL query string can contain parameter placeholders. A parameter
   *   placeholder consists of `'@'` followed by the parameter
   *   name. Parameter names consist of any combination of letters,
   *   numbers, and underscores.
   *
   *   Parameters can appear anywhere that a literal value is expected.  The same
   *   parameter name can be used more than once, for example:
   *     `"WHERE id > @msg_id AND id < @msg_id + 100"`
   *
   *   It is an error to execute an SQL query with unbound parameters.
   *
   *   Parameter values are specified using `params`, which is a JSON
   *   object whose keys are parameter names, and whose values are the
   *   corresponding parameter values.
   *
   *   This object should have the same structure as [Struct]{@link google.protobuf.Struct}
   * @param {Object.<string, Object>} [request.paramTypes]
   *   It is not always possible for Cloud Spanner to infer the right SQL type
   *   from a JSON value.  For example, values of type `BYTES` and values
   *   of type `STRING` both appear in params as JSON strings.
   *
   *   In these cases, `param_types` can be used to specify the exact
   *   SQL type for some or all of the SQL query parameters. See the
   *   definition of Type for more information
   *   about SQL types.
   * @param {string} [request.resumeToken]
   *   If this request is resuming a previously interrupted SQL query
   *   execution, `resume_token` should be copied from the last
   *   PartialResultSet yielded before the interruption. Doing this
   *   enables the new SQL query execution to resume where the last one left
   *   off. The rest of the request parameters must exactly match the
   *   request that yielded this token.
   * @param {number} [request.queryMode]
   *   Used to control the amount of debugging information returned in
   *   ResultSetStats. If partition_token is set, query_mode can only
   *   be set to QueryMode.NORMAL.
   *
   *   The number should be among the values of [QueryMode]{@link google.spanner.v1.QueryMode}
   * @param {string} [request.partitionToken]
   *   If present, results will be restricted to the specified partition
   *   previously created using PartitionQuery().  There must be an exact
   *   match for the values of fields common to this message and the
   *   PartitionQueryRequest message used to create this partition_token.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits [PartialResultSet]{@link google.spanner.v1.PartialResultSet} on 'data' event.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var sql = '';
   * var request = {
   *   session: formattedSession,
   *   sql: sql,
   * };
   * client.executeStreamingSql(request).on('data', response => {
   *   // doThingsWith(response)
   * });
   */
  executeStreamingSql(request, options) {
    options = options || {};

    return this._innerApiCalls.executeStreamingSql(request, options);
  }

  /**
   * Reads rows from the database using key lookups and scans, as a
   * simple key/value style alternative to
   * ExecuteSql.  This method cannot be used to
   * return a result set larger than 10 MiB; if the read matches more
   * data than that, the read fails with a `FAILED_PRECONDITION`
   * error.
   *
   * Reads inside read-write transactions might return `ABORTED`. If
   * this occurs, the application should restart the transaction from
   * the beginning. See Transaction for more details.
   *
   * Larger result sets can be yielded in streaming fashion by calling
   * StreamingRead instead.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session in which the read should be performed.
   * @param {string} request.table
   *   Required. The name of the table in the database to be read.
   * @param {string[]} request.columns
   *   The columns of table to be returned for each row matching
   *   this request.
   * @param {Object} request.keySet
   *   Required. `key_set` identifies the rows to be yielded. `key_set` names the
   *   primary keys of the rows in table to be yielded, unless index
   *   is present. If index is present, then key_set instead names
   *   index keys in index.
   *
   *   If the partition_token field is empty, rows are yielded
   *   in table primary key order (if index is empty) or index key order
   *   (if index is non-empty).  If the partition_token field is not
   *   empty, rows will be yielded in an unspecified order.
   *
   *   It is not an error for the `key_set` to name rows that do not
   *   exist in the database. Read yields nothing for nonexistent rows.
   *
   *   This object should have the same structure as [KeySet]{@link google.spanner.v1.KeySet}
   * @param {Object} [request.transaction]
   *   The transaction to use. If none is provided, the default is a
   *   temporary read-only transaction with strong concurrency.
   *
   *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
   * @param {string} [request.index]
   *   If non-empty, the name of an index on table. This index is
   *   used instead of the table primary key when interpreting key_set
   *   and sorting result rows. See key_set for further information.
   * @param {number} [request.limit]
   *   If greater than zero, only the first `limit` rows are yielded. If `limit`
   *   is zero, the default is no limit. A limit cannot be specified if
   *   `partition_token` is set.
   * @param {string} [request.resumeToken]
   *   If this request is resuming a previously interrupted read,
   *   `resume_token` should be copied from the last
   *   PartialResultSet yielded before the interruption. Doing this
   *   enables the new read to resume where the last read left off. The
   *   rest of the request parameters must exactly match the request
   *   that yielded this token.
   * @param {string} [request.partitionToken]
   *   If present, results will be restricted to the specified partition
   *   previously created using PartitionRead().    There must be an exact
   *   match for the values of fields common to this message and the
   *   PartitionReadRequest message used to create this partition_token.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [ResultSet]{@link google.spanner.v1.ResultSet}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [ResultSet]{@link google.spanner.v1.ResultSet}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var table = '';
   * var columns = [];
   * var keySet = {};
   * var request = {
   *   session: formattedSession,
   *   table: table,
   *   columns: columns,
   *   keySet: keySet,
   * };
   * client.read(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  read(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.read(request, options, callback);
  }

  /**
   * Like Read, except returns the result set as a
   * stream. Unlike Read, there is no limit on the
   * size of the returned result set. However, no individual row in
   * the result set can exceed 100 MiB, and no column value can exceed
   * 10 MiB.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session in which the read should be performed.
   * @param {string} request.table
   *   Required. The name of the table in the database to be read.
   * @param {string[]} request.columns
   *   The columns of table to be returned for each row matching
   *   this request.
   * @param {Object} request.keySet
   *   Required. `key_set` identifies the rows to be yielded. `key_set` names the
   *   primary keys of the rows in table to be yielded, unless index
   *   is present. If index is present, then key_set instead names
   *   index keys in index.
   *
   *   If the partition_token field is empty, rows are yielded
   *   in table primary key order (if index is empty) or index key order
   *   (if index is non-empty).  If the partition_token field is not
   *   empty, rows will be yielded in an unspecified order.
   *
   *   It is not an error for the `key_set` to name rows that do not
   *   exist in the database. Read yields nothing for nonexistent rows.
   *
   *   This object should have the same structure as [KeySet]{@link google.spanner.v1.KeySet}
   * @param {Object} [request.transaction]
   *   The transaction to use. If none is provided, the default is a
   *   temporary read-only transaction with strong concurrency.
   *
   *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
   * @param {string} [request.index]
   *   If non-empty, the name of an index on table. This index is
   *   used instead of the table primary key when interpreting key_set
   *   and sorting result rows. See key_set for further information.
   * @param {number} [request.limit]
   *   If greater than zero, only the first `limit` rows are yielded. If `limit`
   *   is zero, the default is no limit. A limit cannot be specified if
   *   `partition_token` is set.
   * @param {string} [request.resumeToken]
   *   If this request is resuming a previously interrupted read,
   *   `resume_token` should be copied from the last
   *   PartialResultSet yielded before the interruption. Doing this
   *   enables the new read to resume where the last read left off. The
   *   rest of the request parameters must exactly match the request
   *   that yielded this token.
   * @param {string} [request.partitionToken]
   *   If present, results will be restricted to the specified partition
   *   previously created using PartitionRead().    There must be an exact
   *   match for the values of fields common to this message and the
   *   PartitionReadRequest message used to create this partition_token.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits [PartialResultSet]{@link google.spanner.v1.PartialResultSet} on 'data' event.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var table = '';
   * var columns = [];
   * var keySet = {};
   * var request = {
   *   session: formattedSession,
   *   table: table,
   *   columns: columns,
   *   keySet: keySet,
   * };
   * client.streamingRead(request).on('data', response => {
   *   // doThingsWith(response)
   * });
   */
  streamingRead(request, options) {
    options = options || {};

    return this._innerApiCalls.streamingRead(request, options);
  }

  /**
   * Begins a new transaction. This step can often be skipped:
   * Read, ExecuteSql and
   * Commit can begin a new transaction as a
   * side-effect.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session in which the transaction runs.
   * @param {Object} request.options
   *   Required. Options for the new transaction.
   *
   *   This object should have the same structure as [TransactionOptions]{@link google.spanner.v1.TransactionOptions}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Transaction]{@link google.spanner.v1.Transaction}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Transaction]{@link google.spanner.v1.Transaction}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var options = {};
   * var request = {
   *   session: formattedSession,
   *   options: options,
   * };
   * client.beginTransaction(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  beginTransaction(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.beginTransaction(request, options, callback);
  }

  /**
   * Commits a transaction. The request includes the mutations to be
   * applied to rows in the database.
   *
   * `Commit` might return an `ABORTED` error. This can occur at any time;
   * commonly, the cause is conflicts with concurrent
   * transactions. However, it can also happen for a variety of other
   * reasons. If `Commit` returns `ABORTED`, the caller should re-attempt
   * the transaction from the beginning, re-using the same session.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session in which the transaction to be committed is running.
   * @param {Object[]} request.mutations
   *   The mutations to be executed when this transaction commits. All
   *   mutations are applied atomically, in the order they appear in
   *   this list.
   *
   *   This object should have the same structure as [Mutation]{@link google.spanner.v1.Mutation}
   * @param {string} [request.transactionId]
   *   Commit a previously-started transaction.
   * @param {Object} [request.singleUseTransaction]
   *   Execute mutations in a temporary transaction. Note that unlike
   *   commit of a previously-started transaction, commit with a
   *   temporary transaction is non-idempotent. That is, if the
   *   `CommitRequest` is sent to Cloud Spanner more than once (for
   *   instance, due to retries in the application, or in the
   *   transport library), it is possible that the mutations are
   *   executed more than once. If this is undesirable, use
   *   BeginTransaction and
   *   Commit instead.
   *
   *   This object should have the same structure as [TransactionOptions]{@link google.spanner.v1.TransactionOptions}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [CommitResponse]{@link google.spanner.v1.CommitResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [CommitResponse]{@link google.spanner.v1.CommitResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var mutations = [];
   * var request = {
   *   session: formattedSession,
   *   mutations: mutations,
   * };
   * client.commit(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  commit(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.commit(request, options, callback);
  }

  /**
   * Rolls back a transaction, releasing any locks it holds. It is a good
   * idea to call this for any transaction that includes one or more
   * Read or ExecuteSql requests and
   * ultimately decides not to commit.
   *
   * `Rollback` returns `OK` if it successfully aborts the transaction, the
   * transaction was already aborted, or the transaction is not
   * found. `Rollback` never returns `ABORTED`.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session in which the transaction to roll back is running.
   * @param {string} request.transactionId
   *   Required. The transaction to roll back.
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
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var transactionId = '';
   * var request = {
   *   session: formattedSession,
   *   transactionId: transactionId,
   * };
   * client.rollback(request).catch(err => {
   *   console.error(err);
   * });
   */
  rollback(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.rollback(request, options, callback);
  }

  /**
   * Creates a set of partition tokens that can be used to execute a query
   * operation in parallel.  Each of the returned partition tokens can be used
   * by ExecuteStreamingSql to specify a subset
   * of the query result to read.  The same session and read-only transaction
   * must be used by the PartitionQueryRequest used to create the
   * partition tokens and the ExecuteSqlRequests that use the partition tokens.
   * Partition tokens become invalid when the session used to create them
   * is deleted or begins a new transaction.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session used to create the partitions.
   * @param {string} request.sql
   *   The query request to generate partitions for. The request will fail if
   *   the query is not root partitionable. The query plan of a root
   *   partitionable query has a single distributed union operator. A distributed
   *   union operator conceptually divides one or more tables into multiple
   *   splits, remotely evaluates a subquery independently on each split, and
   *   then unions all results.
   * @param {Object} [request.transaction]
   *   Read only snapshot transactions are supported, read/write and single use
   *   transactions are not.
   *
   *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
   * @param {Object} [request.params]
   *   The SQL query string can contain parameter placeholders. A parameter
   *   placeholder consists of `'@'` followed by the parameter
   *   name. Parameter names consist of any combination of letters,
   *   numbers, and underscores.
   *
   *   Parameters can appear anywhere that a literal value is expected.  The same
   *   parameter name can be used more than once, for example:
   *     `"WHERE id > @msg_id AND id < @msg_id + 100"`
   *
   *   It is an error to execute an SQL query with unbound parameters.
   *
   *   Parameter values are specified using `params`, which is a JSON
   *   object whose keys are parameter names, and whose values are the
   *   corresponding parameter values.
   *
   *   This object should have the same structure as [Struct]{@link google.protobuf.Struct}
   * @param {Object.<string, Object>} [request.paramTypes]
   *   It is not always possible for Cloud Spanner to infer the right SQL type
   *   from a JSON value.  For example, values of type `BYTES` and values
   *   of type `STRING` both appear in params as JSON strings.
   *
   *   In these cases, `param_types` can be used to specify the exact
   *   SQL type for some or all of the SQL query parameters. See the
   *   definition of Type for more information
   *   about SQL types.
   * @param {Object} [request.partitionOptions]
   *   Additional options that affect how many partitions are created.
   *
   *   This object should have the same structure as [PartitionOptions]{@link google.spanner.v1.PartitionOptions}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [PartitionResponse]{@link google.spanner.v1.PartitionResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [PartitionResponse]{@link google.spanner.v1.PartitionResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var sql = '';
   * var request = {
   *   session: formattedSession,
   *   sql: sql,
   * };
   * client.partitionQuery(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  partitionQuery(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.partitionQuery(request, options, callback);
  }

  /**
   * Creates a set of partition tokens that can be used to execute a read
   * operation in parallel.  Each of the returned partition tokens can be used
   * by StreamingRead to specify a subset of the read
   * result to read.  The same session and read-only transaction must be used by
   * the PartitionReadRequest used to create the partition tokens and the
   * ReadRequests that use the partition tokens.
   * Partition tokens become invalid when the session used to create them
   * is deleted or begins a new transaction.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.session
   *   Required. The session used to create the partitions.
   * @param {string} request.table
   *   Required. The name of the table in the database to be read.
   * @param {Object} request.keySet
   *   Required. `key_set` identifies the rows to be yielded. `key_set` names the
   *   primary keys of the rows in table to be yielded, unless index
   *   is present. If index is present, then key_set instead names
   *   index keys in index.
   *
   *   It is not an error for the `key_set` to name rows that do not
   *   exist in the database. Read yields nothing for nonexistent rows.
   *
   *   This object should have the same structure as [KeySet]{@link google.spanner.v1.KeySet}
   * @param {Object} [request.transaction]
   *   Read only snapshot transactions are supported, read/write and single use
   *   transactions are not.
   *
   *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
   * @param {string} [request.index]
   *   If non-empty, the name of an index on table. This index is
   *   used instead of the table primary key when interpreting key_set
   *   and sorting result rows. See key_set for further information.
   * @param {string[]} [request.columns]
   *   The columns of table to be returned for each row matching
   *   this request.
   * @param {Object} [request.partitionOptions]
   *   Additional options that affect how many partitions are created.
   *
   *   This object should have the same structure as [PartitionOptions]{@link google.spanner.v1.PartitionOptions}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [PartitionResponse]{@link google.spanner.v1.PartitionResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [PartitionResponse]{@link google.spanner.v1.PartitionResponse}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const {spanner} = require('@google-cloud/spanner');
   *
   * var client = new spanner.v1.SpannerClient({
   *   // optional auth parameters.
   * });
   *
   * var formattedSession = client.sessionPath('[PROJECT]', '[INSTANCE]', '[DATABASE]', '[SESSION]');
   * var table = '';
   * var keySet = {};
   * var request = {
   *   session: formattedSession,
   *   table: table,
   *   keySet: keySet,
   * };
   * client.partitionRead(request)
   *   .then(responses => {
   *     var response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  partitionRead(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.partitionRead(request, options, callback);
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
   * Return a fully-qualified session resource name string.
   *
   * @param {String} project
   * @param {String} instance
   * @param {String} database
   * @param {String} session
   * @returns {String}
   */
  sessionPath(project, instance, database, session) {
    return this._pathTemplates.sessionPathTemplate.render({
      project: project,
      instance: instance,
      database: database,
      session: session,
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
   * Parse the sessionName from a session resource.
   *
   * @param {String} sessionName
   *   A fully-qualified path representing a session resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromSessionName(sessionName) {
    return this._pathTemplates.sessionPathTemplate.match(sessionName).project;
  }

  /**
   * Parse the sessionName from a session resource.
   *
   * @param {String} sessionName
   *   A fully-qualified path representing a session resources.
   * @returns {String} - A string representing the instance.
   */
  matchInstanceFromSessionName(sessionName) {
    return this._pathTemplates.sessionPathTemplate.match(sessionName).instance;
  }

  /**
   * Parse the sessionName from a session resource.
   *
   * @param {String} sessionName
   *   A fully-qualified path representing a session resources.
   * @returns {String} - A string representing the database.
   */
  matchDatabaseFromSessionName(sessionName) {
    return this._pathTemplates.sessionPathTemplate.match(sessionName).database;
  }

  /**
   * Parse the sessionName from a session resource.
   *
   * @param {String} sessionName
   *   A fully-qualified path representing a session resources.
   * @returns {String} - A string representing the session.
   */
  matchSessionFromSessionName(sessionName) {
    return this._pathTemplates.sessionPathTemplate.match(sessionName).session;
  }
}

module.exports = SpannerClient;
