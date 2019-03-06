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
 * The request for CreateSession.
 *
 * @property {string} database
 *   Required. The database in which the new session is created.
 *
 * @property {Object} session
 *   The session to create.
 *
 *   This object should have the same structure as [Session]{@link google.spanner.v1.Session}
 *
 * @typedef CreateSessionRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.CreateSessionRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const CreateSessionRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * A session in the Cloud Spanner API.
 *
 * @property {string} name
 *   The name of the session. This is always system-assigned; values provided
 *   when creating a session are ignored.
 *
 * @property {Object.<string, string>} labels
 *   The labels for the session.
 *
 *    * Label keys must be between 1 and 63 characters long and must conform to
 *      the following regular expression: `\[a-z]([-a-z0-9]*[a-z0-9])?`.
 *    * Label values must be between 0 and 63 characters long and must conform
 *      to the regular expression `(\[a-z]([-a-z0-9]*[a-z0-9])?)?`.
 *    * No more than 64 labels can be associated with a given session.
 *
 *   See https://goo.gl/xmQnxf for more information on and examples of labels.
 *
 * @property {Object} createTime
 *   Output only. The timestamp when the session is created.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} approximateLastUseTime
 *   Output only. The approximate timestamp when the session is last used. It is
 *   typically earlier than the actual last use time.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef Session
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.Session definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const Session = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for GetSession.
 *
 * @property {string} name
 *   Required. The name of the session to retrieve.
 *
 * @typedef GetSessionRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.GetSessionRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const GetSessionRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for ListSessions.
 *
 * @property {string} database
 *   Required. The database in which to list sessions.
 *
 * @property {number} pageSize
 *   Number of sessions to be returned in the response. If 0 or less, defaults
 *   to the server's maximum allowed page size.
 *
 * @property {string} pageToken
 *   If non-empty, `page_token` should contain a
 *   next_page_token
 *   from a previous
 *   ListSessionsResponse.
 *
 * @property {string} filter
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
 *
 * @typedef ListSessionsRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.ListSessionsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const ListSessionsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for ListSessions.
 *
 * @property {Object[]} sessions
 *   The list of requested sessions.
 *
 *   This object should have the same structure as [Session]{@link google.spanner.v1.Session}
 *
 * @property {string} nextPageToken
 *   `next_page_token` can be sent in a subsequent
 *   ListSessions call to fetch more
 *   of the matching sessions.
 *
 * @typedef ListSessionsResponse
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.ListSessionsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const ListSessionsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for DeleteSession.
 *
 * @property {string} name
 *   Required. The name of the session to delete.
 *
 * @typedef DeleteSessionRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.DeleteSessionRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const DeleteSessionRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for ExecuteSql and
 * ExecuteStreamingSql.
 *
 * @property {string} session
 *   Required. The session in which the SQL query should be performed.
 *
 * @property {Object} transaction
 *   The transaction to use. If none is provided, the default is a
 *   temporary read-only transaction with strong concurrency.
 *
 *   The transaction to use.
 *
 *   For queries, if none is provided, the default is a temporary read-only
 *   transaction with strong concurrency.
 *
 *   Standard DML statements require a ReadWrite transaction. Single-use
 *   transactions are not supported (to avoid replay).  The caller must
 *   either supply an existing transaction ID or begin a new transaction.
 *
 *   Partitioned DML requires an existing PartitionedDml transaction ID.
 *
 *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
 *
 * @property {string} sql
 *   Required. The SQL string.
 *
 * @property {Object} params
 *   The SQL string can contain parameter placeholders. A parameter
 *   placeholder consists of `'@'` followed by the parameter
 *   name. Parameter names consist of any combination of letters,
 *   numbers, and underscores.
 *
 *   Parameters can appear anywhere that a literal value is expected.  The same
 *   parameter name can be used more than once, for example:
 *     `"WHERE id > @msg_id AND id < @msg_id + 100"`
 *
 *   It is an error to execute an SQL statement with unbound parameters.
 *
 *   Parameter values are specified using `params`, which is a JSON
 *   object whose keys are parameter names, and whose values are the
 *   corresponding parameter values.
 *
 *   This object should have the same structure as [Struct]{@link google.protobuf.Struct}
 *
 * @property {Object.<string, Object>} paramTypes
 *   It is not always possible for Cloud Spanner to infer the right SQL type
 *   from a JSON value.  For example, values of type `BYTES` and values
 *   of type `STRING` both appear in
 *   params as JSON strings.
 *
 *   In these cases, `param_types` can be used to specify the exact
 *   SQL type for some or all of the SQL statement parameters. See the
 *   definition of Type for more information
 *   about SQL types.
 *
 * @property {string} resumeToken
 *   If this request is resuming a previously interrupted SQL statement
 *   execution, `resume_token` should be copied from the last
 *   PartialResultSet yielded before the
 *   interruption. Doing this enables the new SQL statement execution to resume
 *   where the last one left off. The rest of the request parameters must
 *   exactly match the request that yielded this token.
 *
 * @property {number} queryMode
 *   Used to control the amount of debugging information returned in
 *   ResultSetStats. If
 *   partition_token is
 *   set, query_mode can only
 *   be set to
 *   QueryMode.NORMAL.
 *
 *   The number should be among the values of [QueryMode]{@link google.spanner.v1.QueryMode}
 *
 * @property {string} partitionToken
 *   If present, results will be restricted to the specified partition
 *   previously created using PartitionQuery().  There must be an exact
 *   match for the values of fields common to this message and the
 *   PartitionQueryRequest message used to create this partition_token.
 *
 * @property {number} seqno
 *   A per-transaction sequence number used to identify this request. This
 *   makes each request idempotent such that if the request is received multiple
 *   times, at most one will succeed.
 *
 *   The sequence number must be monotonically increasing within the
 *   transaction. If a request arrives for the first time with an out-of-order
 *   sequence number, the transaction may be aborted. Replays of previously
 *   handled requests will yield the same response as the first execution.
 *
 *   Required for DML statements. Ignored for queries.
 *
 * @typedef ExecuteSqlRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.ExecuteSqlRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const ExecuteSqlRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * Mode in which the statement must be processed.
   *
   * @enum {number}
   * @memberof google.spanner.v1
   */
  QueryMode: {

    /**
     * The default mode. Only the statement results are returned.
     */
    NORMAL: 0,

    /**
     * This mode returns only the query plan, without any results or
     * execution statistics information.
     */
    PLAN: 1,

    /**
     * This mode returns both the query plan and the execution statistics along
     * with the results.
     */
    PROFILE: 2
  }
};

/**
 * The request for ExecuteBatchDml
 *
 * @property {string} session
 *   Required. The session in which the DML statements should be performed.
 *
 * @property {Object} transaction
 *   The transaction to use. A ReadWrite transaction is required. Single-use
 *   transactions are not supported (to avoid replay).  The caller must either
 *   supply an existing transaction ID or begin a new transaction.
 *
 *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
 *
 * @property {Object[]} statements
 *   The list of statements to execute in this batch. Statements are executed
 *   serially, such that the effects of statement i are visible to statement
 *   i+1. Each statement must be a DML statement. Execution will stop at the
 *   first failed statement; the remaining statements will not run.
 *
 *   REQUIRES: statements_size() > 0.
 *
 *   This object should have the same structure as [Statement]{@link google.spanner.v1.Statement}
 *
 * @property {number} seqno
 *   A per-transaction sequence number used to identify this request. This is
 *   used in the same space as the seqno in
 *   ExecuteSqlRequest. See more details
 *   in ExecuteSqlRequest.
 *
 * @typedef ExecuteBatchDmlRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.ExecuteBatchDmlRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const ExecuteBatchDmlRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * A single DML statement.
   *
   * @property {string} sql
   *   Required. The DML string.
   *
   * @property {Object} params
   *   The DML string can contain parameter placeholders. A parameter
   *   placeholder consists of `'@'` followed by the parameter
   *   name. Parameter names consist of any combination of letters,
   *   numbers, and underscores.
   *
   *   Parameters can appear anywhere that a literal value is expected.  The
   *   same parameter name can be used more than once, for example:
   *     `"WHERE id > @msg_id AND id < @msg_id + 100"`
   *
   *   It is an error to execute an SQL statement with unbound parameters.
   *
   *   Parameter values are specified using `params`, which is a JSON
   *   object whose keys are parameter names, and whose values are the
   *   corresponding parameter values.
   *
   *   This object should have the same structure as [Struct]{@link google.protobuf.Struct}
   *
   * @property {Object.<string, Object>} paramTypes
   *   It is not always possible for Cloud Spanner to infer the right SQL type
   *   from a JSON value.  For example, values of type `BYTES` and values
   *   of type `STRING` both appear in params as JSON strings.
   *
   *   In these cases, `param_types` can be used to specify the exact
   *   SQL type for some or all of the SQL statement parameters. See the
   *   definition of Type for more information
   *   about SQL types.
   *
   * @typedef Statement
   * @memberof google.spanner.v1
   * @see [google.spanner.v1.ExecuteBatchDmlRequest.Statement definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
   */
  Statement: {
    // This is for documentation. Actual contents will be loaded by gRPC.
  }
};

/**
 * The response for ExecuteBatchDml. Contains a list
 * of ResultSet, one for each DML statement that has successfully executed.
 * If a statement fails, the error is returned as part of the response payload.
 * Clients can determine whether all DML statements have run successfully, or if
 * a statement failed, using one of the following approaches:
 *
 *   1. Check if 'status' field is OkStatus.
 *   2. Check if result_sets_size() equals the number of statements in
 *      ExecuteBatchDmlRequest.
 *
 * Example 1: A request with 5 DML statements, all executed successfully.
 * Result: A response with 5 ResultSets, one for each statement in the same
 * order, and an OK status.
 *
 * Example 2: A request with 5 DML statements. The 3rd statement has a syntax
 * error.
 * Result: A response with 2 ResultSets, for the first 2 statements that
 * run successfully, and a syntax error (INVALID_ARGUMENT) status. From
 * result_set_size() client can determine that the 3rd statement has failed.
 *
 * @property {Object[]} resultSets
 *   ResultSets, one for each statement in the request that ran successfully, in
 *   the same order as the statements in the request. Each ResultSet will
 *   not contain any rows. The ResultSetStats in each ResultSet will
 *   contain the number of rows modified by the statement.
 *
 *   Only the first ResultSet in the response contains a valid
 *   ResultSetMetadata.
 *
 *   This object should have the same structure as [ResultSet]{@link google.spanner.v1.ResultSet}
 *
 * @property {Object} status
 *   If all DML statements are executed successfully, status will be OK.
 *   Otherwise, the error status of the first failed statement.
 *
 *   This object should have the same structure as [Status]{@link google.rpc.Status}
 *
 * @typedef ExecuteBatchDmlResponse
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.ExecuteBatchDmlResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const ExecuteBatchDmlResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Options for a PartitionQueryRequest and
 * PartitionReadRequest.
 *
 * @property {number} partitionSizeBytes
 *   **Note:** This hint is currently ignored by PartitionQuery and
 *   PartitionRead requests.
 *
 *   The desired data size for each partition generated.  The default for this
 *   option is currently 1 GiB.  This is only a hint. The actual size of each
 *   partition may be smaller or larger than this size request.
 *
 * @property {number} maxPartitions
 *   **Note:** This hint is currently ignored by PartitionQuery and
 *   PartitionRead requests.
 *
 *   The desired maximum number of partitions to return.  For example, this may
 *   be set to the number of workers available.  The default for this option
 *   is currently 10,000. The maximum value is currently 200,000.  This is only
 *   a hint.  The actual number of partitions returned may be smaller or larger
 *   than this maximum count request.
 *
 * @typedef PartitionOptions
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.PartitionOptions definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const PartitionOptions = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for PartitionQuery
 *
 * @property {string} session
 *   Required. The session used to create the partitions.
 *
 * @property {Object} transaction
 *   Read only snapshot transactions are supported, read/write and single use
 *   transactions are not.
 *
 *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
 *
 * @property {string} sql
 *   The query request to generate partitions for. The request will fail if
 *   the query is not root partitionable. The query plan of a root
 *   partitionable query has a single distributed union operator. A distributed
 *   union operator conceptually divides one or more tables into multiple
 *   splits, remotely evaluates a subquery independently on each split, and
 *   then unions all results.
 *
 *   This must not contain DML commands, such as INSERT, UPDATE, or
 *   DELETE. Use
 *   ExecuteStreamingSql with a
 *   PartitionedDml transaction for large, partition-friendly DML operations.
 *
 * @property {Object} params
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
 *
 * @property {Object.<string, Object>} paramTypes
 *   It is not always possible for Cloud Spanner to infer the right SQL type
 *   from a JSON value.  For example, values of type `BYTES` and values
 *   of type `STRING` both appear in
 *   params as JSON strings.
 *
 *   In these cases, `param_types` can be used to specify the exact
 *   SQL type for some or all of the SQL query parameters. See the
 *   definition of Type for more information
 *   about SQL types.
 *
 * @property {Object} partitionOptions
 *   Additional options that affect how many partitions are created.
 *
 *   This object should have the same structure as [PartitionOptions]{@link google.spanner.v1.PartitionOptions}
 *
 * @typedef PartitionQueryRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.PartitionQueryRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const PartitionQueryRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for PartitionRead
 *
 * @property {string} session
 *   Required. The session used to create the partitions.
 *
 * @property {Object} transaction
 *   Read only snapshot transactions are supported, read/write and single use
 *   transactions are not.
 *
 *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
 *
 * @property {string} table
 *   Required. The name of the table in the database to be read.
 *
 * @property {string} index
 *   If non-empty, the name of an index on
 *   table. This index is used
 *   instead of the table primary key when interpreting
 *   key_set and sorting
 *   result rows. See key_set
 *   for further information.
 *
 * @property {string[]} columns
 *   The columns of table to be
 *   returned for each row matching this request.
 *
 * @property {Object} keySet
 *   Required. `key_set` identifies the rows to be yielded. `key_set` names the
 *   primary keys of the rows in
 *   table to be yielded, unless
 *   index is present. If
 *   index is present, then
 *   key_set instead names
 *   index keys in index.
 *
 *   It is not an error for the `key_set` to name rows that do not
 *   exist in the database. Read yields nothing for nonexistent rows.
 *
 *   This object should have the same structure as [KeySet]{@link google.spanner.v1.KeySet}
 *
 * @property {Object} partitionOptions
 *   Additional options that affect how many partitions are created.
 *
 *   This object should have the same structure as [PartitionOptions]{@link google.spanner.v1.PartitionOptions}
 *
 * @typedef PartitionReadRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.PartitionReadRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const PartitionReadRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Information returned for each partition returned in a
 * PartitionResponse.
 *
 * @property {string} partitionToken
 *   This token can be passed to Read, StreamingRead, ExecuteSql, or
 *   ExecuteStreamingSql requests to restrict the results to those identified by
 *   this partition token.
 *
 * @typedef Partition
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.Partition definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const Partition = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for PartitionQuery
 * or PartitionRead
 *
 * @property {Object[]} partitions
 *   Partitions created by this request.
 *
 *   This object should have the same structure as [Partition]{@link google.spanner.v1.Partition}
 *
 * @property {Object} transaction
 *   Transaction created by this request.
 *
 *   This object should have the same structure as [Transaction]{@link google.spanner.v1.Transaction}
 *
 * @typedef PartitionResponse
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.PartitionResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const PartitionResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for Read and
 * StreamingRead.
 *
 * @property {string} session
 *   Required. The session in which the read should be performed.
 *
 * @property {Object} transaction
 *   The transaction to use. If none is provided, the default is a
 *   temporary read-only transaction with strong concurrency.
 *
 *   This object should have the same structure as [TransactionSelector]{@link google.spanner.v1.TransactionSelector}
 *
 * @property {string} table
 *   Required. The name of the table in the database to be read.
 *
 * @property {string} index
 *   If non-empty, the name of an index on
 *   table. This index is used instead of
 *   the table primary key when interpreting
 *   key_set and sorting result rows.
 *   See key_set for further
 *   information.
 *
 * @property {string[]} columns
 *   The columns of table to be returned
 *   for each row matching this request.
 *
 * @property {Object} keySet
 *   Required. `key_set` identifies the rows to be yielded. `key_set` names the
 *   primary keys of the rows in table to
 *   be yielded, unless index is present.
 *   If index is present, then
 *   key_set instead names index keys
 *   in index.
 *
 *   If the partition_token
 *   field is empty, rows are yielded in table primary key order (if
 *   index is empty) or index key order
 *   (if index is non-empty).  If the
 *   partition_token field is
 *   not empty, rows will be yielded in an unspecified order.
 *
 *   It is not an error for the `key_set` to name rows that do not
 *   exist in the database. Read yields nothing for nonexistent rows.
 *
 *   This object should have the same structure as [KeySet]{@link google.spanner.v1.KeySet}
 *
 * @property {number} limit
 *   If greater than zero, only the first `limit` rows are yielded. If `limit`
 *   is zero, the default is no limit. A limit cannot be specified if
 *   `partition_token` is set.
 *
 * @property {string} resumeToken
 *   If this request is resuming a previously interrupted read,
 *   `resume_token` should be copied from the last
 *   PartialResultSet yielded before the
 *   interruption. Doing this enables the new read to resume where the last read
 *   left off. The rest of the request parameters must exactly match the request
 *   that yielded this token.
 *
 * @property {string} partitionToken
 *   If present, results will be restricted to the specified partition
 *   previously created using PartitionRead().    There must be an exact
 *   match for the values of fields common to this message and the
 *   PartitionReadRequest message used to create this partition_token.
 *
 * @typedef ReadRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.ReadRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const ReadRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for
 * BeginTransaction.
 *
 * @property {string} session
 *   Required. The session in which the transaction runs.
 *
 * @property {Object} options
 *   Required. Options for the new transaction.
 *
 *   This object should have the same structure as [TransactionOptions]{@link google.spanner.v1.TransactionOptions}
 *
 * @typedef BeginTransactionRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.BeginTransactionRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const BeginTransactionRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for Commit.
 *
 * @property {string} session
 *   Required. The session in which the transaction to be committed is running.
 *
 * @property {string} transactionId
 *   Commit a previously-started transaction.
 *
 * @property {Object} singleUseTransaction
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
 *
 * @property {Object[]} mutations
 *   The mutations to be executed when this transaction commits. All
 *   mutations are applied atomically, in the order they appear in
 *   this list.
 *
 *   This object should have the same structure as [Mutation]{@link google.spanner.v1.Mutation}
 *
 * @typedef CommitRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.CommitRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const CommitRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for Commit.
 *
 * @property {Object} commitTimestamp
 *   The Cloud Spanner timestamp at which the transaction committed.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef CommitResponse
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.CommitResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const CommitResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for Rollback.
 *
 * @property {string} session
 *   Required. The session in which the transaction to roll back is running.
 *
 * @property {string} transactionId
 *   Required. The transaction to roll back.
 *
 * @typedef RollbackRequest
 * @memberof google.spanner.v1
 * @see [google.spanner.v1.RollbackRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/v1/spanner.proto}
 */
const RollbackRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};