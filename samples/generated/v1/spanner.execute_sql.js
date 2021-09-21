// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

function main(session, sql) {
  // [START spanner_execute_sql_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The session in which the SQL query should be performed.
   */
  // const session = 'abc123'
  /**
   *  The transaction to use.
   *  For queries, if none is provided, the default is a temporary read-only
   *  transaction with strong concurrency.
   *  Standard DML statements require a read-write transaction. To protect
   *  against replays, single-use transactions are not supported.  The caller
   *  must either supply an existing transaction ID or begin a new transaction.
   *  Partitioned DML requires an existing Partitioned DML transaction ID.
   */
  // const transaction = ''
  /**
   *  Required. The SQL string.
   */
  // const sql = 'abc123'
  /**
   *  Parameter names and values that bind to placeholders in the SQL string.
   *  A parameter placeholder consists of the `@` character followed by the
   *  parameter name (for example, `@firstName`). Parameter names must conform
   *  to the naming requirements of identifiers as specified at
   *  https://cloud.google.com/spanner/docs/lexical#identifiers.
   *  Parameters can appear anywhere that a literal value is expected.  The same
   *  parameter name can be used more than once, for example:
   *  `"WHERE id > @msg_id AND id < @msg_id + 100"`
   *  It is an error to execute a SQL statement with unbound parameters.
   */
  // const params = ''
  /**
   *  It is not always possible for Cloud Spanner to infer the right SQL type
   *  from a JSON value.  For example, values of type `BYTES` and values
   *  of type `STRING` both appear in [params][google.spanner.v1.ExecuteSqlRequest.params] as JSON strings.
   *  In these cases, `param_types` can be used to specify the exact
   *  SQL type for some or all of the SQL statement parameters. See the
   *  definition of [Type][google.spanner.v1.Type] for more information
   *  about SQL types.
   */
  // const paramTypes = 1234
  /**
   *  If this request is resuming a previously interrupted SQL statement
   *  execution, `resume_token` should be copied from the last
   *  [PartialResultSet][google.spanner.v1.PartialResultSet] yielded before the interruption. Doing this
   *  enables the new SQL statement execution to resume where the last one left
   *  off. The rest of the request parameters must exactly match the
   *  request that yielded this token.
   */
  // const resumeToken = 'Buffer.from('string')'
  /**
   *  Used to control the amount of debugging information returned in
   *  [ResultSetStats][google.spanner.v1.ResultSetStats]. If [partition_token][google.spanner.v1.ExecuteSqlRequest.partition_token] is set, [query_mode][google.spanner.v1.ExecuteSqlRequest.query_mode] can only
   *  be set to [QueryMode.NORMAL][google.spanner.v1.ExecuteSqlRequest.QueryMode.NORMAL].
   */
  // const queryMode = ''
  /**
   *  If present, results will be restricted to the specified partition
   *  previously created using PartitionQuery().  There must be an exact
   *  match for the values of fields common to this message and the
   *  PartitionQueryRequest message used to create this partition_token.
   */
  // const partitionToken = 'Buffer.from('string')'
  /**
   *  A per-transaction sequence number used to identify this request. This field
   *  makes each request idempotent such that if the request is received multiple
   *  times, at most one will succeed.
   *  The sequence number must be monotonically increasing within the
   *  transaction. If a request arrives for the first time with an out-of-order
   *  sequence number, the transaction may be aborted. Replays of previously
   *  handled requests will yield the same response as the first execution.
   *  Required for DML statements. Ignored for queries.
   */
  // const seqno = 1234
  /**
   *  Query optimizer configuration to use for the given query.
   */
  // const queryOptions = ''
  /**
   *  Common options for this request.
   */
  // const requestOptions = ''

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function executeSql() {
    // Construct request
    const request = {
      session,
      sql,
    };

    // Run request
    const response = await spannerClient.executeSql(request);
    console.log(response);
  }

  executeSql();
  // [END spanner_execute_sql_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
