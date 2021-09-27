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
  // [START spanner_v1_generated_Spanner_PartitionQuery_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The session used to create the partitions.
   */
  // const session = 'abc123'
  /**
   *  Read only snapshot transactions are supported, read/write and single use
   *  transactions are not.
   */
  // const transaction = ''
  /**
   *  Required. The query request to generate partitions for. The request will fail if
   *  the query is not root partitionable. The query plan of a root
   *  partitionable query has a single distributed union operator. A distributed
   *  union operator conceptually divides one or more tables into multiple
   *  splits, remotely evaluates a subquery independently on each split, and
   *  then unions all results.
   *  This must not contain DML commands, such as INSERT, UPDATE, or
   *  DELETE. Use [ExecuteStreamingSql][google.spanner.v1.Spanner.ExecuteStreamingSql] with a
   *  PartitionedDml transaction for large, partition-friendly DML operations.
   */
  // const sql = 'abc123'
  /**
   *  Parameter names and values that bind to placeholders in the SQL string.
   *  A parameter placeholder consists of the `@` character followed by the
   *  parameter name (for example, `@firstName`). Parameter names can contain
   *  letters, numbers, and underscores.
   *  Parameters can appear anywhere that a literal value is expected.  The same
   *  parameter name can be used more than once, for example:
   *  `"WHERE id > @msg_id AND id < @msg_id + 100"`
   *  It is an error to execute a SQL statement with unbound parameters.
   */
  // const params = ''
  /**
   *  It is not always possible for Cloud Spanner to infer the right SQL type
   *  from a JSON value.  For example, values of type `BYTES` and values
   *  of type `STRING` both appear in [params][google.spanner.v1.PartitionQueryRequest.params] as JSON strings.
   *  In these cases, `param_types` can be used to specify the exact
   *  SQL type for some or all of the SQL query parameters. See the
   *  definition of [Type][google.spanner.v1.Type] for more information
   *  about SQL types.
   */
  // const paramTypes = 1234
  /**
   *  Additional options that affect how many partitions are created.
   */
  // const partitionOptions = ''

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function partitionQuery() {
    // Construct request
    const request = {
      session,
      sql,
    };

    // Run request
    const response = await spannerClient.partitionQuery(request);
    console.log(response);
  }

  partitionQuery();
  // [END spanner_v1_generated_Spanner_PartitionQuery_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
