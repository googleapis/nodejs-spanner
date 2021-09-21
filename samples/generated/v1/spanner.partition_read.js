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

function main(session, table, keySet) {
  // [START spanner_partition_read_sample]
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
   *  Required. The name of the table in the database to be read.
   */
  // const table = 'abc123'
  /**
   *  If non-empty, the name of an index on [table][google.spanner.v1.PartitionReadRequest.table]. This index is
   *  used instead of the table primary key when interpreting [key_set][google.spanner.v1.PartitionReadRequest.key_set]
   *  and sorting result rows. See [key_set][google.spanner.v1.PartitionReadRequest.key_set] for further information.
   */
  // const index = 'abc123'
  /**
   *  The columns of [table][google.spanner.v1.PartitionReadRequest.table] to be returned for each row matching
   *  this request.
   */
  // const columns = 'abc123'
  /**
   *  Required. `key_set` identifies the rows to be yielded. `key_set` names the
   *  primary keys of the rows in [table][google.spanner.v1.PartitionReadRequest.table] to be yielded, unless [index][google.spanner.v1.PartitionReadRequest.index]
   *  is present. If [index][google.spanner.v1.PartitionReadRequest.index] is present, then [key_set][google.spanner.v1.PartitionReadRequest.key_set] instead names
   *  index keys in [index][google.spanner.v1.PartitionReadRequest.index].
   *  It is not an error for the `key_set` to name rows that do not
   *  exist in the database. Read yields nothing for nonexistent rows.
   */
  // const keySet = ''
  /**
   *  Additional options that affect how many partitions are created.
   */
  // const partitionOptions = ''

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function partitionRead() {
    // Construct request
    const request = {
      session,
      table,
      keySet,
    };

    // Run request
    const response = await spannerClient.partitionRead(request);
    console.log(response);
  }

  partitionRead();
  // [END spanner_partition_read_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
