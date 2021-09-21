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
  // [START database_list_databases_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The instance whose databases should be listed.
   *  Values are of the form `projects/<project>/instances/<instance>`.
   */
  // const parent = 'abc123'
  /**
   *  Number of databases to be returned in the response. If 0 or less,
   *  defaults to the server's maximum allowed page size.
   */
  // const pageSize = 1234
  /**
   *  If non-empty, `page_token` should contain a
   *  [next_page_token][google.spanner.admin.database.v1.ListDatabasesResponse.next_page_token] from a
   *  previous [ListDatabasesResponse][google.spanner.admin.database.v1.ListDatabasesResponse].
   */
  // const pageToken = 'abc123'

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function listDatabases() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = await databaseClient.listDatabasesAsync(request);
    for await (const response of iterable) {
      console.log(response);
    }
  }

  listDatabases();
  // [END database_list_databases_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
