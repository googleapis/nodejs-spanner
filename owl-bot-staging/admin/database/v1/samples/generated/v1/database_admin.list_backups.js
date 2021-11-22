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
  // [START spanner_v1_generated_DatabaseAdmin_ListBackups_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The instance to list backups from.  Values are of the
   *  form `projects/<project>/instances/<instance>`.
   */
  // const parent = 'abc123'
  /**
   *  An expression that filters the list of returned backups.
   *  A filter expression consists of a field name, a comparison operator, and a
   *  value for filtering.
   *  The value must be a string, a number, or a boolean. The comparison operator
   *  must be one of: `<`, `>`, `<=`, `>=`, `!=`, `=`, or `:`.
   *  Colon `:` is the contains operator. Filter rules are not case sensitive.
   *  The following fields in the [Backup][google.spanner.admin.database.v1.Backup] are eligible for filtering:
   *    * `name`
   *    * `database`
   *    * `state`
   *    * `create_time`  (and values are of the format YYYY-MM-DDTHH:MM:SSZ)
   *    * `expire_time`  (and values are of the format YYYY-MM-DDTHH:MM:SSZ)
   *    * `version_time` (and values are of the format YYYY-MM-DDTHH:MM:SSZ)
   *    * `size_bytes`
   *  You can combine multiple expressions by enclosing each expression in
   *  parentheses. By default, expressions are combined with AND logic, but
   *  you can specify AND, OR, and NOT logic explicitly.
   *  Here are a few examples:
   *    * `name:Howl` - The backup's name contains the string "howl".
   *    * `database:prod`
   *           - The database's name contains the string "prod".
   *    * `state:CREATING` - The backup is pending creation.
   *    * `state:READY` - The backup is fully created and ready for use.
   *    * `(name:howl) AND (create_time < \"2018-03-28T14:50:00Z\")`
   *           - The backup name contains the string "howl" and `create_time`
   *               of the backup is before 2018-03-28T14:50:00Z.
   *    * `expire_time < \"2018-03-28T14:50:00Z\"`
   *           - The backup `expire_time` is before 2018-03-28T14:50:00Z.
   *    * `size_bytes > 10000000000` - The backup's size is greater than 10GB
   */
  // const filter = 'abc123'
  /**
   *  Number of backups to be returned in the response. If 0 or
   *  less, defaults to the server's maximum allowed page size.
   */
  // const pageSize = 1234
  /**
   *  If non-empty, `page_token` should contain a
   *  [next_page_token][google.spanner.admin.database.v1.ListBackupsResponse.next_page_token] from a
   *  previous [ListBackupsResponse][google.spanner.admin.database.v1.ListBackupsResponse] to the same `parent` and with the same
   *  `filter`.
   */
  // const pageToken = 'abc123'

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function listBackups() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = await databaseClient.listBackupsAsync(request);
    for await (const response of iterable) {
        console.log(response);
    }
  }

  listBackups();
  // [END spanner_v1_generated_DatabaseAdmin_ListBackups_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
