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

function main(parent) {
  // [START spanner_v1_generated_DatabaseAdmin_ListDatabaseOperations_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The instance of the database operations.
   *  Values are of the form `projects/<project>/instances/<instance>`.
   */
  // const parent = 'abc123'
  /**
   *  An expression that filters the list of returned operations.
   *  A filter expression consists of a field name, a
   *  comparison operator, and a value for filtering.
   *  The value must be a string, a number, or a boolean. The comparison operator
   *  must be one of: `<`, `>`, `<=`, `>=`, `!=`, `=`, or `:`.
   *  Colon `:` is the contains operator. Filter rules are not case sensitive.
   *  The following fields in the [Operation][google.longrunning.Operation]
   *  are eligible for filtering:
   *    * `name` - The name of the long-running operation
   *    * `done` - False if the operation is in progress, else true.
   *    * `metadata.@type` - the type of metadata. For example, the type string
   *       for [RestoreDatabaseMetadata][google.spanner.admin.database.v1.RestoreDatabaseMetadata] is
   *       `type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata`.
   *    * `metadata.<field_name>` - any field in metadata.value.
   *    * `error` - Error associated with the long-running operation.
   *    * `response.@type` - the type of response.
   *    * `response.<field_name>` - any field in response.value.
   *  You can combine multiple expressions by enclosing each expression in
   *  parentheses. By default, expressions are combined with AND logic. However,
   *  you can specify AND, OR, and NOT logic explicitly.
   *  Here are a few examples:
   *    * `done:true` - The operation is complete.
   *    * `(metadata.@type=type.googleapis.com/google.spanner.admin.database.v1.RestoreDatabaseMetadata) AND` \
   *      `(metadata.source_type:BACKUP) AND` \
   *      `(metadata.backup_info.backup:backup_howl) AND` \
   *      `(metadata.name:restored_howl) AND` \
   *      `(metadata.progress.start_time < \"2018-03-28T14:50:00Z\") AND` \
   *      `(error:*)` - Return operations where:
   *      * The operation's metadata type is [RestoreDatabaseMetadata][google.spanner.admin.database.v1.RestoreDatabaseMetadata].
   *      * The database is restored from a backup.
   *      * The backup name contains "backup_howl".
   *      * The restored database's name contains "restored_howl".
   *      * The operation started before 2018-03-28T14:50:00Z.
   *      * The operation resulted in an error.
   */
  // const filter = 'abc123'
  /**
   *  Number of operations to be returned in the response. If 0 or
   *  less, defaults to the server's maximum allowed page size.
   */
  // const pageSize = 1234
  /**
   *  If non-empty, `page_token` should contain a
   *  [next_page_token][google.spanner.admin.database.v1.ListDatabaseOperationsResponse.next_page_token]
   *  from a previous [ListDatabaseOperationsResponse][google.spanner.admin.database.v1.ListDatabaseOperationsResponse] to the
   *  same `parent` and with the same `filter`.
   */
  // const pageToken = 'abc123'

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function listDatabaseOperations() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = await databaseClient.listDatabaseOperationsAsync(request);
    for await (const response of iterable) {
        console.log(response);
    }
  }

  listDatabaseOperations();
  // [END spanner_v1_generated_DatabaseAdmin_ListDatabaseOperations_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
