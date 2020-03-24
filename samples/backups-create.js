/**
 * Copyright 2020 Google LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

async function createBackup(instanceId, databaseId, backupId, projectId) {
  // [START spanner_create_backup]
  // Imports the Google Cloud client library and precise date library
  const {Spanner} = require('@google-cloud/spanner');
  const {PreciseDate} = require('@google-cloud/precise-date');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const backupId = 'my-backup';

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const databasePath = database.formattedName_;
  // Expire backup 14 days in the future
  const expireTime = new PreciseDate(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const backup = instance.backup(backupId, databasePath, expireTime);

  // Creates a new backup of the database
  try {
    console.log(`Creating backup of database ${database.formattedName_}.`);
    const [, operation] = await backup.create();

    console.log(`Waiting for backup ${backup.formattedName_} to complete...`);
    await operation.promise();

    // Verify backup is ready
    const [backupInfo] = await backup.getMetadata();
    if (backupInfo.state === 'READY') {
      console.log(
          `Backup ${backupInfo.name} of size ` +
          `${backupInfo.sizeBytes} bytes was created at ` +
          `${new PreciseDate(backupInfo.createTime).toISOString()}`);
    } else {
      console.error('ERROR: Backup is not ready.');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    await database.close();
  }
  // [END spanner_create_backup]
}

module.exports.createBackup = createBackup;
