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

function main(parent, backupId, backup) {
  // [START spanner_v1_generated_DatabaseAdmin_CreateBackup_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The name of the instance in which the backup will be
   *  created. This must be the same instance that contains the database the
   *  backup will be created from. The backup will be stored in the
   *  location(s) specified in the instance configuration of this
   *  instance. Values are of the form
   *  `projects/<project>/instances/<instance>`.
   */
  // const parent = 'abc123'
  /**
   *  Required. The id of the backup to be created. The `backup_id` appended to
   *  `parent` forms the full backup name of the form
   *  `projects/<project>/instances/<instance>/backups/<backup_id>`.
   */
  // const backupId = 'abc123'
  /**
   *  Required. The backup to create.
   */
  // const backup = ''
  /**
   *  Optional. The encryption configuration used to encrypt the backup. If this field is
   *  not specified, the backup will use the same
   *  encryption configuration as the database by default, namely
   *  [encryption_type][google.spanner.admin.database.v1.CreateBackupEncryptionConfig.encryption_type] =
   *  `USE_DATABASE_ENCRYPTION`.
   */
  // const encryptionConfig = ''

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function createBackup() {
    // Construct request
    const request = {
      parent,
      backupId,
      backup,
    };

    // Run request
    const [operation] = await databaseClient.createBackup(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  createBackup();
  // [END spanner_v1_generated_DatabaseAdmin_CreateBackup_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
