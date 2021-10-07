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

function main(parent, backupId, sourceBackup, expireTime) {
  // [START database_copy_backup_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The name of the destination instance that will contain the backup copy.
   *  Values are of the form: `projects/<project>/instances/<instance>`.
   */
  // const parent = 'abc123'
  /**
   *  Required. The id of the backup copy.
   *  The `backup_id` appended to `parent` forms the full backup_uri of the form
   *  `projects/<project>/instances/<instance>/backups/<backup>`.
   */
  // const backupId = 'abc123'
  /**
   *  Required. The source backup to be copied.
   *  The source backup needs to be in READY state for it to be copied.
   *  Once CopyBackup is in progress, the source backup cannot be deleted or
   *  cleaned up on expiration until CopyBackup is finished.
   *  Values are of the form:
   *  `projects/<project>/instances/<instance>/backups/<backup>`.
   */
  // const sourceBackup = 'abc123'
  /**
   *  Required. The expiration time of the backup in microsecond granularity.
   *  The expiration time must be at least 6 hours and at most 366 days
   *  from the `create_time` of the source backup. Once the `expire_time` has
   *  passed, the backup is eligible to be automatically deleted by Cloud Spanner
   *  to free the resources used by the backup.
   */
  // const expireTime = ''
  /**
   *  Optional. The encryption configuration used to encrypt the backup. If this field is
   *  not specified, the backup will use the same
   *  encryption configuration as the source backup by default, namely
   *  [encryption_type][google.spanner.admin.database.v1.CopyBackupEncryptionConfig.encryption_type] =
   *  `USE_CONFIG_DEFAULT_OR_BACKUP_ENCRYPTION`.
   */
  // const encryptionConfig = ''

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function copyBackup() {
    // Construct request
    const request = {
      parent,
      backupId,
      sourceBackup,
      expireTime,
    };

    // Run request
    const [operation] = await databaseClient.copyBackup(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  copyBackup();
  // [END database_copy_backup_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
