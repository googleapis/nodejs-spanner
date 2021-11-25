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

// sample-metadata:
//  title: Read data using an existing index.
//  usage: node spannerCopyBackup <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  backupId = 'my-backup',
  sourceBackupId = 'my-source-backup',
  projectId = 'my-project-id'
) {
  // [START spanner_copy_backup]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const backupId = 'my-backup',
  // sourceBackupId = 'my-source-backup',
  // const projectId = 'my-project-id';

  // Imports the Google Cloud Spanner client library
  const {Spanner} = require('@google-cloud/spanner');
  const {PreciseDate} = require('@google-cloud/precise-date');

  // Instantiates a client
  const spanner = new Spanner({
     projectId: projectId,
     apiEndpoint: 'staging-wrenchworks.sandbox.googleapis.com'
   });

  async function spannerCopyBackup() {
    // Gets a reference to a Cloud Spanner instance, database and backup
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);
    const sourceBackup = instance.backup(sourceBackupId);

    // Expire source and copy backup 14 days in the future
    const expireTime = Spanner.timestamp(Date.now() + 1000 * 60 * 60 * 24 * 14).toStruct();

    // Copy the backup of the database
    try { 
      console.log(`Creating copy of the source backup ${sourceBackup.formattedName_}.`);
      const [, operation] = await instance.copyBackup(sourceBackup.formattedName_, backupId, {
        expireTime: expireTime,
      });

      console.log(`Waiting for backup copy${instance.backup(backupId)} to complete...`);
      await operation.promise();

      // Verify the copy backup is ready
      const copyBackup = instance.backup(backupId)
      const [copyBackupInfo] = await copyBackup.getMetadata();
      if (copyBackupInfo.state === 'READY') {
        console.log(
          `Backup copy ${copyBackupInfo.name} of size ` +
            `${copyBackupInfo.sizeBytes} bytes was created at ` +
            `${new PreciseDate(copyBackupInfo.createTime).toISOString()}`
        );
      } else {
        console.error('ERROR: Copy of backup is not ready.');
      }
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      // Close the database when finished.
      await database.close();
    }
  }
  spannerCopyBackup();
  // [END spanner_copy_backup]
}
process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));