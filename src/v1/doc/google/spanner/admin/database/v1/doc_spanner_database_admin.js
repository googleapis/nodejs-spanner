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

// Note: this file is purely for documentation. Any contents are not expected
// to be loaded as the JS file.

/**
 * @property {number} sourceType
 *   The type of the restore source.
 *
 *   The number should be among the values of [RestoreSourceType]{@link google.spanner.admin.database.v1.RestoreSourceType}
 *
 * @property {Object} backupInfo
 *   Information about the backup used to restore the database. The backup
 *   may no longer exist.
 *
 *   This object should have the same structure as [BackupInfo]{@link google.spanner.admin.database.v1.BackupInfo}
 *
 * @typedef RestoreInfo
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.RestoreInfo definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const RestoreInfo = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A Cloud Spanner database.
 *
 * @property {string} name
 *   Required. The name of the database. Values are of the form
 *   `projects/<project>/instances/<instance>/databases/<database>`,
 *   where `<database>` is as specified in the `CREATE DATABASE`
 *   statement. This name can be passed to other API methods to
 *   identify the database.
 *
 * @property {number} state
 *   Output only. The current database state.
 *
 *   The number should be among the values of [State]{@link google.spanner.admin.database.v1.State}
 *
 * @property {Object} createTime
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} restoreInfo
 *   This object should have the same structure as [RestoreInfo]{@link google.spanner.admin.database.v1.RestoreInfo}
 *
 * @typedef Database
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.Database definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const Database = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * Indicates the current state of the database.
   *
   * @enum {number}
   * @memberof google.spanner.admin.database.v1
   */
  State: {

    /**
     * Not specified.
     */
    STATE_UNSPECIFIED: 0,

    /**
     * The database is still being created. Operations on the database may fail
     * with `FAILED_PRECONDITION` in this state.
     */
    CREATING: 1,

    /**
     * The database is fully created and ready for use.
     */
    READY: 2,
    READY_OPTIMIZING: 3
  }
};

/**
 * The request for ListDatabases.
 *
 * @property {string} parent
 *   Required. The instance whose databases should be listed.
 *   Values are of the form `projects/<project>/instances/<instance>`.
 *
 * @property {number} pageSize
 *   Number of databases to be returned in the response. If 0 or less,
 *   defaults to the server's maximum allowed page size.
 *
 * @property {string} pageToken
 *   If non-empty, `page_token` should contain a
 *   next_page_token from a
 *   previous ListDatabasesResponse.
 *
 * @typedef ListDatabasesRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.ListDatabasesRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const ListDatabasesRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for ListDatabases.
 *
 * @property {Object[]} databases
 *   Databases that matched the request.
 *
 *   This object should have the same structure as [Database]{@link google.spanner.admin.database.v1.Database}
 *
 * @property {string} nextPageToken
 *   `next_page_token` can be sent in a subsequent
 *   ListDatabases call to fetch more
 *   of the matching databases.
 *
 * @typedef ListDatabasesResponse
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.ListDatabasesResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const ListDatabasesResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for CreateDatabase.
 *
 * @property {string} parent
 *   Required. The name of the instance that will serve the new database.
 *   Values are of the form `projects/<project>/instances/<instance>`.
 *
 * @property {string} createStatement
 *   Required. A `CREATE DATABASE` statement, which specifies the ID of the
 *   new database.  The database ID must conform to the regular expression
 *   `[a-z][a-z0-9_\-]*[a-z0-9]` and be between 2 and 30 characters in length.
 *   If the database ID is a reserved word or if it contains a hyphen, the
 *   database ID must be enclosed in backticks (`` ` ``).
 *
 * @property {string[]} extraStatements
 *   An optional list of DDL statements to run inside the newly created
 *   database. Statements can create tables, indexes, etc. These
 *   statements execute atomically with the creation of the database:
 *   if there is an error in any statement, the database is not created.
 *
 * @typedef CreateDatabaseRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.CreateDatabaseRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const CreateDatabaseRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Metadata type for the operation returned by
 * CreateDatabase.
 *
 * @property {string} database
 *   The database being created.
 *
 * @typedef CreateDatabaseMetadata
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.CreateDatabaseMetadata definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const CreateDatabaseMetadata = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for GetDatabase.
 *
 * @property {string} name
 *   Required. The name of the requested database. Values are of the form
 *   `projects/<project>/instances/<instance>/databases/<database>`.
 *
 * @typedef GetDatabaseRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.GetDatabaseRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const GetDatabaseRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Enqueues the given DDL statements to be applied, in order but not
 * necessarily all at once, to the database schema at some point (or
 * points) in the future. The server checks that the statements
 * are executable (syntactically valid, name tables that exist, etc.)
 * before enqueueing them, but they may still fail upon
 * later execution (e.g., if a statement from another batch of
 * statements is applied first and it conflicts in some way, or if
 * there is some data-related problem like a `NULL` value in a column to
 * which `NOT NULL` would be added). If a statement fails, all
 * subsequent statements in the batch are automatically cancelled.
 *
 * Each batch of statements is assigned a name which can be used with
 * the Operations API to monitor
 * progress. See the
 * operation_id field for more
 * details.
 *
 * @property {string} database
 *   Required. The database to update.
 *
 * @property {string[]} statements
 *   DDL statements to be applied to the database.
 *
 * @property {string} operationId
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
 *
 * @typedef UpdateDatabaseDdlRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.UpdateDatabaseDdlRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const UpdateDatabaseDdlRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Metadata type for the operation returned by
 * UpdateDatabaseDdl.
 *
 * @property {string} database
 *   The database being modified.
 *
 * @property {string[]} statements
 *   For an update this list contains all the statements. For an
 *   individual statement, this list contains only that statement.
 *
 * @property {Object[]} commitTimestamps
 *   Reports the commit timestamps of all statements that have
 *   succeeded so far, where `commit_timestamps[i]` is the commit
 *   timestamp for the statement `statements[i]`.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef UpdateDatabaseDdlMetadata
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const UpdateDatabaseDdlMetadata = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for DropDatabase.
 *
 * @property {string} database
 *   Required. The database to be dropped.
 *
 * @typedef DropDatabaseRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.DropDatabaseRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const DropDatabaseRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for GetDatabaseDdl.
 *
 * @property {string} database
 *   Required. The database whose schema we wish to get.
 *
 * @typedef GetDatabaseDdlRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.GetDatabaseDdlRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const GetDatabaseDdlRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for GetDatabaseDdl.
 *
 * @property {string[]} statements
 *   A list of formatted DDL statements defining the schema of the database
 *   specified in the request.
 *
 * @typedef GetDatabaseDdlResponse
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.GetDatabaseDdlResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const GetDatabaseDdlResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * @property {string} parent
 *   Required. The instance of the database operations.
 *   Values are of the form `projects/<project>/instances/<instance>`.
 *
 * @property {string} filter
 *   A filter expression that filters what operations are returned in the
 *   response.
 *
 *   The response returns a list of
 *   long-running operations whose names are
 *   prefixed by a database name within the specified instance. The long-running
 *   operation metadata field type
 *   `metadata.type_url` describes the type of the metadata.
 *
 *   The filter expression must specify the field name, a comparison operator,
 *   and the value that you want to use for filtering. The value must be a
 *   string, a number, or a boolean. The comparison operator must be
 *   <, >, <=, >=, !=, =, or :. Colon ‘:’ represents a HAS operator which is
 *   roughly synonymous with equality. Filter rules are case insensitive.
 *
 *   The long-running operation fields eligible for filtering are:
 *     * `name` --> The name of the long-running operation
 *     * `done` --> False if the operation is in progress, else true.
 *     * `metadata.type_url` (using filter string `metadata.@type`) and fields
 *        in `metadata.value` (using filter string `metadata.<field_name>`,
 *        where <field_name> is a field in metadata.value) are eligible for
 *        filtering.
 *     * `error` --> Error associated with the long-running operation.
 *     * `response.type_url` (using filter string `response.@type`) and fields
 *        in `response.value` (using filter string `response.<field_name>`,
 *        where <field_name> is a field in response.value) are eligible for
 *        filtering.
 *
 *   To filter on multiple expressions, provide each separate expression within
 *   parentheses. By default, each expression is an AND expression. However,
 *   you can include AND, OR, and NOT expressions explicitly.
 *
 *   Some examples of using filters are:
 *
 *     * `done:true` --> The operation is complete.
 *     * `(metadata.@type:type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata)
 *        AND (metadata.source_type:BACKUP)
 *        AND (metadata.backup_info.backup:backup_howl)
 *        AND (metadata.name:restored_howl)
 *        AND (metadata.progress.start_time < \"2018-03-28T14:50:00Z\")
 *        AND (error:*)`
 *            --> Return RestoreDatabase operations from backups whose name
 *                contains "backup_howl", where the created database name
 *                contains the string "restored_howl", the start_time of the
 *                restore operation is before 2018-03-28T14:50:00Z,
 *                and the operation returned an error.
 *
 * @property {number} pageSize
 *   Number of operations to be returned in the response. If 0 or
 *   less, defaults to the server's maximum allowed page size.
 *
 * @property {string} pageToken
 *   If non-empty, `page_token` should contain a
 *   next_page_token
 *   from a previous ListDatabaseOperationsResponse to the
 *   same `parent` and with the same `filter`.
 *
 * @typedef ListDatabaseOperationsRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.ListDatabaseOperationsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const ListDatabaseOperationsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * @property {Object[]} operations
 *   The list of matching
 *   long-running operations whose names are
 *   prefixed by a database name. The long-running operation
 *   metadata field type
 *   `metadata.type_url` describes the type of the metadata.
 *
 *   This object should have the same structure as [Operation]{@link google.longrunning.Operation}
 *
 * @property {string} nextPageToken
 *   `next_page_token` can be sent in a subsequent
 *   ListDatabaseOperations
 *   call to fetch more of the matching metadata.
 *
 * @typedef ListDatabaseOperationsResponse
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.ListDatabaseOperationsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const ListDatabaseOperationsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * @property {string} parent
 *   Required. The name of the instance in which to create the
 *   restored database. This instance must be in the same project and
 *   have the same instance configuration as the instance containing
 *   the source backup. Values are of the form
 *   `projects/<project>/instances/<instance>.
 *
 * @property {string} databaseId
 *   Required. The id of the database to create and restore to. This
 *   database must not already exist. The `database_id` appended to
 *   `parent` forms the full database name of the form
 *   `projects/<project>/instances/<instance>/databases/<database_id>`.
 *
 * @property {string} backup
 *   Name of the backup from which to restore.  Values are of the form
 *   `projects/<project>/instances/<instance>/backups/<backup>`.
 *
 * @typedef RestoreDatabaseRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.RestoreDatabaseRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const RestoreDatabaseRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * @property {string} name
 *   Name of the database being created and restored to.
 *
 * @property {number} sourceType
 *   The type of the restore source.
 *
 *   The number should be among the values of [RestoreSourceType]{@link google.spanner.admin.database.v1.RestoreSourceType}
 *
 * @property {Object} backupInfo
 *   This object should have the same structure as [BackupInfo]{@link google.spanner.admin.database.v1.BackupInfo}
 *
 * @property {Object} progress
 *   The progress of the
 *   RestoreDatabase
 *   operation.
 *
 *   This object should have the same structure as [OperationProgress]{@link google.spanner.admin.database.v1.OperationProgress}
 *
 * @property {Object} cancelTime
 *   The time at which this operation was cancelled. If set, this operation is
 *   in the process of undoing itself (which is guaranteed to succeed) and
 *   cannot be cancelled again.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {string} optimizeDatabaseOperationName
 *   If exists, the name of the long-running operation that will be used to
 *   track the post-restore optimization process to optimize the performance of
 *   the restored database, and remove the dependency on the restore source.
 *   The name is of the form
 *   `projects/<project>/instances/<instance>/databases/<database>/operations/<operation>
 *   where the <database> is the name of database being created and restored to.
 *   The metadata type of the  long-running operation is
 *   OptimizeRestoreDatabaseMetadata. This long-running operation will be
 *   automatically created by the system after the RestoreDatabase long-running
 *   operation completes successfully. This operation will not be created if the
 *   restore was not successful.
 *
 * @typedef RestoreDatabaseMetadata
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.RestoreDatabaseMetadata definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/spanner_database_admin.proto}
 */
const RestoreDatabaseMetadata = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * @enum {number}
 * @memberof google.spanner.admin.database.v1
 */
const RestoreSourceType = {

  /**
   * No restore associated.
   */
  TYPE_UNSPECIFIED: 0,

  /**
   * A backup was used as the source of the restore.
   */
  BACKUP: 1
};