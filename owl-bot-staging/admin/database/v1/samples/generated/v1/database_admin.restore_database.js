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

function main(parent, databaseId) {
  // [START spanner_v1_generated_DatabaseAdmin_RestoreDatabase_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The name of the instance in which to create the
   *  restored database. This instance must be in the same project and
   *  have the same instance configuration as the instance containing
   *  the source backup. Values are of the form
   *  `projects/<project>/instances/<instance>`.
   */
  // const parent = 'abc123'
  /**
   *  Required. The id of the database to create and restore to. This
   *  database must not already exist. The `database_id` appended to
   *  `parent` forms the full database name of the form
   *  `projects/<project>/instances/<instance>/databases/<database_id>`.
   */
  // const databaseId = 'abc123'
  /**
   *  Name of the backup from which to restore.  Values are of the form
   *  `projects/<project>/instances/<instance>/backups/<backup>`.
   */
  // const backup = 'abc123'
  /**
   *  Optional. An encryption configuration describing the encryption type and key
   *  resources in Cloud KMS used to encrypt/decrypt the database to restore to.
   *  If this field is not specified, the restored database will use
   *  the same encryption configuration as the backup by default, namely
   *  [encryption_type][google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.encryption_type] =
   *  `USE_CONFIG_DEFAULT_OR_BACKUP_ENCRYPTION`.
   */
  // const encryptionConfig = ''

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function restoreDatabase() {
    // Construct request
    const request = {
      parent,
      databaseId,
    };

    // Run request
    const [operation] = await databaseClient.restoreDatabase(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  restoreDatabase();
  // [END spanner_v1_generated_DatabaseAdmin_RestoreDatabase_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
