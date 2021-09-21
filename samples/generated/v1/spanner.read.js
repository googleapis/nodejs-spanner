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

function main(session, table, columns, keySet) {
  // [START spanner_read_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The session in which the read should be performed.
   */
  // const session = 'abc123'
  /**
   *  The transaction to use. If none is provided, the default is a
   *  temporary read-only transaction with strong concurrency.
   */
  // const transaction = ''
  /**
   *  Required. The name of the table in the database to be read.
   */
  // const table = 'abc123'
  /**
   *  If non-empty, the name of an index on [table][google.spanner.v1.ReadRequest.table]. This index is
   *  used instead of the table primary key when interpreting [key_set][google.spanner.v1.ReadRequest.key_set]
   *  and sorting result rows. See [key_set][google.spanner.v1.ReadRequest.key_set] for further information.
   */
  // const index = 'abc123'
  /**
   *  Required. The columns of [table][google.spanner.v1.ReadRequest.table] to be returned for each row matching
   *  this request.
   */
  // const columns = 'abc123'
  /**
   *  Required. `key_set` identifies the rows to be yielded. `key_set` names the
   *  primary keys of the rows in [table][google.spanner.v1.ReadRequest.table] to be yielded, unless [index][google.spanner.v1.ReadRequest.index]
   *  is present. If [index][google.spanner.v1.ReadRequest.index] is present, then [key_set][google.spanner.v1.ReadRequest.key_set] instead names
   *  index keys in [index][google.spanner.v1.ReadRequest.index].
   *  If the [partition_token][google.spanner.v1.ReadRequest.partition_token] field is empty, rows are yielded
   *  in table primary key order (if [index][google.spanner.v1.ReadRequest.index] is empty) or index key order
   *  (if [index][google.spanner.v1.ReadRequest.index] is non-empty).  If the [partition_token][google.spanner.v1.ReadRequest.partition_token] field is not
   *  empty, rows will be yielded in an unspecified order.
   *  It is not an error for the `key_set` to name rows that do not
   *  exist in the database. Read yields nothing for nonexistent rows.
   */
  // const keySet = ''
  /**
   *  If greater than zero, only the first `limit` rows are yielded. If `limit`
   *  is zero, the default is no limit. A limit cannot be specified if
   *  `partition_token` is set.
   */
  // const limit = 1234
  /**
   *  If this request is resuming a previously interrupted read,
   *  `resume_token` should be copied from the last
   *  [PartialResultSet][google.spanner.v1.PartialResultSet] yielded before the interruption. Doing this
   *  enables the new read to resume where the last read left off. The
   *  rest of the request parameters must exactly match the request
   *  that yielded this token.
   */
  // const resumeToken = 'Buffer.from('string')'
  /**
   *  If present, results will be restricted to the specified partition
   *  previously created using PartitionRead().    There must be an exact
   *  match for the values of fields common to this message and the
   *  PartitionReadRequest message used to create this partition_token.
   */
  // const partitionToken = 'Buffer.from('string')'
  /**
   *  Common options for this request.
   */
  // const requestOptions = ''

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function read() {
    // Construct request
    const request = {
      session,
      table,
      columns,
      keySet,
    };

    // Run request
    const response = await spannerClient.read(request);
    console.log(response);
  }

  read();
  // [END spanner_read_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
