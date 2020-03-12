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

// Note: this file is purely for documentation. Any contents are not expected
// to be loaded as the JS file.

/**
 * A backup of a Cloud Spanner database.
 *
 * @property {string} database
 *   Required for the CreateBackup operation.
 *   Name of the database from which this backup was
 *   created. This needs to be in the same instance as the backup.
 *   Values are of the form
 *   `projects/<project>/instances/<instance>/databases/<database>`.
 *
 * @property {Object} expireTime
 *   Required for the CreateBackup
 *   operation. The expiration time of the backup, with microseconds
 *   granularity that must be at least 6 hours and at most 366 days
 *   from the time the CreateBackup request is processed. Once the `expire_time`
 *   has passed, the backup is eligible to be automatically deleted by Cloud
 *   Spanner to free the resources used by the backup.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {string} name
 *   Output only for the CreateBackup operation.
 *   Required for the UpdateBackup operation.
 *
 *   A globally unique identifier for the backup which cannot be
 *   changed. Values are of the form
 *   `projects/<project>/instances/<instance>/backups/[a-z][a-z0-9_\-]*[a-z0-9]`
 *   The final segment of the name must be between 2 and 60 characters
 *   in length.
 *
 *   The backup is stored in the location(s) specified in the instance
 *   configuration of the instance containing the backup, identified
 *   by the prefix of the backup name of the form
 *   `projects/<project>/instances/<instance>`.
 *
 * @property {Object} createTime
 *   Output only. The backup will contain an externally consistent
 *   copy of the database at the timestamp specified by
 *   `create_time`. `create_time` is approximately the time the
 *   CreateBackup request is received.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {number} sizeBytes
 *   Output only. Size of the backup in bytes.
 *
 * @property {number} state
 *   Output only. The current state of the backup.
 *
 *   The number should be among the values of [State]{@link google.spanner.admin.database.v1.State}
 *
 * @property {string[]} referencingDatabases
 *   Output only. The names of the restored databases that reference the backup.
 *   The database names are of
 *   the form `projects/<project>/instances/<instance>/databases/<database>`.
 *   Referencing databases may exist in different instances. The existence of
 *   any referencing database prevents the backup from being deleted. When a
 *   restored database from the backup enters the `READY` state, the reference
 *   to the backup is removed.
 *
 * @typedef Backup
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.Backup definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const Backup = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * Indicates the current state of the backup.
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
     * The pending backup is still being created. Operations on the
     * backup may fail with `FAILED_PRECONDITION` in this state.
     */
    CREATING: 1,

    /**
     * The backup is complete and ready for use.
     */
    READY: 2
  }
};

/**
 * The request for CreateBackup.
 *
 * @property {string} parent
 *   Required. The name of the instance in which the backup will be
 *   created. This must be the same instance that contains the database the
 *   backup will be created from. The backup will be stored in the
 *   location(s) specified in the instance configuration of this
 *   instance. Values are of the form
 *   `projects/<project>/instances/<instance>`.
 *
 * @property {string} backupId
 *   Required. The id of the backup to be created. The `backup_id` appended to
 *   `parent` forms the full backup name of the form
 *   `projects/<project>/instances/<instance>/backups/<backup_id>`.
 *
 * @property {Object} backup
 *   Required. The backup to create.
 *
 *   This object should have the same structure as [Backup]{@link google.spanner.admin.database.v1.Backup}
 *
 * @typedef CreateBackupRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.CreateBackupRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const CreateBackupRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Metadata type for the operation returned by
 * CreateBackup.
 *
 * @property {string} name
 *   The name of the backup being created.
 *
 * @property {string} database
 *   The name of the database the backup is created from.
 *
 * @property {Object} progress
 *   The progress of the
 *   CreateBackup operation.
 *
 *   This object should have the same structure as [OperationProgress]{@link google.spanner.admin.database.v1.OperationProgress}
 *
 * @property {Object} cancelTime
 *   The time at which cancellation of this operation was received.
 *   Operations.CancelOperation
 *   starts asynchronous cancellation on a long-running operation. The server
 *   makes a best effort to cancel the operation, but success is not guaranteed.
 *   Clients can use
 *   Operations.GetOperation or
 *   other methods to check whether the cancellation succeeded or whether the
 *   operation completed despite cancellation. On successful cancellation,
 *   the operation is not deleted; instead, it becomes an operation with
 *   an Operation.error value with a google.rpc.Status.code of 1,
 *   corresponding to `Code.CANCELLED`.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef CreateBackupMetadata
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.CreateBackupMetadata definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const CreateBackupMetadata = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for UpdateBackup.
 *
 * @property {Object} backup
 *   Required. The backup to update. `backup.name`, and the fields to be updated
 *   as specified by `update_mask` are required. Other fields are ignored.
 *   Update is only supported for the following fields:
 *    * `backup.expire_time`.
 *
 *   This object should have the same structure as [Backup]{@link google.spanner.admin.database.v1.Backup}
 *
 * @property {Object} updateMask
 *   Required. A mask specifying which fields (e.g. `expire_time`) in the
 *   Backup resource should be updated. This mask is relative to the Backup
 *   resource, not to the request message. The field mask must always be
 *   specified; this prevents any future fields from being erased accidentally
 *   by clients that do not know about them.
 *
 *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
 *
 * @typedef UpdateBackupRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.UpdateBackupRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const UpdateBackupRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for GetBackup.
 *
 * @property {string} name
 *   Required. Name of the backup.
 *   Values are of the form
 *   `projects/<project>/instances/<instance>/backups/<backup>`.
 *
 * @typedef GetBackupRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.GetBackupRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const GetBackupRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for DeleteBackup.
 *
 * @property {string} name
 *   Required. Name of the backup to delete.
 *   Values are of the form
 *   `projects/<project>/instances/<instance>/backups/<backup>`.
 *
 * @typedef DeleteBackupRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.DeleteBackupRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const DeleteBackupRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for ListBackups.
 *
 * @property {string} parent
 *   Required. The instance to list backups from.  Values are of the
 *   form `projects/<project>/instances/<instance>`.
 *
 * @property {string} filter
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
 *
 * @property {number} pageSize
 *   Number of backups to be returned in the response. If 0 or
 *   less, defaults to the server's maximum allowed page size.
 *
 * @property {string} pageToken
 *   If non-empty, `page_token` should contain a
 *   next_page_token from a
 *   previous ListBackupsResponse to the same `parent` and with the same
 *   `filter`.
 *
 * @typedef ListBackupsRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.ListBackupsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const ListBackupsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for ListBackups.
 *
 * @property {Object[]} backups
 *   The list of matching backups. Backups returned are ordered by `create_time`
 *   in descending order, starting from the most recent `create_time`.
 *
 *   This object should have the same structure as [Backup]{@link google.spanner.admin.database.v1.Backup}
 *
 * @property {string} nextPageToken
 *   `next_page_token` can be sent in a subsequent
 *   ListBackups call to fetch more
 *   of the matching backups.
 *
 * @typedef ListBackupsResponse
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.ListBackupsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const ListBackupsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for
 * ListBackupOperations.
 *
 * @property {string} parent
 *   Required. The instance of the backup operations. Values are of
 *   the form `projects/<project>/instances/<instance>`.
 *
 * @property {string} filter
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
 *
 * @property {number} pageSize
 *   Number of operations to be returned in the response. If 0 or
 *   less, defaults to the server's maximum allowed page size.
 *
 * @property {string} pageToken
 *   If non-empty, `page_token` should contain a
 *   next_page_token
 *   from a previous ListBackupOperationsResponse to the
 *   same `parent` and with the same `filter`.
 *
 * @typedef ListBackupOperationsRequest
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.ListBackupOperationsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const ListBackupOperationsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for
 * ListBackupOperations.
 *
 * @property {Object[]} operations
 *   The list of matching backup long-running
 *   operations. Each operation's name will be
 *   prefixed by the backup's name and the operation's
 *   metadata will be of type
 *   CreateBackupMetadata. Operations returned include those that are
 *   pending or have completed/failed/canceled within the last 7 days.
 *   Operations returned are ordered by
 *   `operation.metadata.value.progress.start_time` in descending order starting
 *   from the most recently started operation.
 *
 *   This object should have the same structure as [Operation]{@link google.longrunning.Operation}
 *
 * @property {string} nextPageToken
 *   `next_page_token` can be sent in a subsequent
 *   ListBackupOperations
 *   call to fetch more of the matching metadata.
 *
 * @typedef ListBackupOperationsResponse
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.ListBackupOperationsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const ListBackupOperationsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Information about a backup.
 *
 * @property {string} backup
 *   Name of the backup.
 *
 * @property {Object} createTime
 *   The backup contains an externally consistent copy of `source_database` at
 *   the timestamp specified by `create_time`.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {string} sourceDatabase
 *   Name of the database the backup was created from.
 *
 * @typedef BackupInfo
 * @memberof google.spanner.admin.database.v1
 * @see [google.spanner.admin.database.v1.BackupInfo definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/database/v1/backup.proto}
 */
const BackupInfo = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};