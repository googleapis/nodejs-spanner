/**
 * Copyright 2019 Google LLC
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

async function updateBackupExpireTime(instanceId, databaseId, backupId, projectId) {
  // [START spanner_update_backup]
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
    // Optional - allow Spanner API endpoint to be configured with environment variable
    apiEndpoint: process.env.API_ENDPOINT,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const newExpireTime =  new PreciseDate(Date.now() + 1000 * 60 * 60 * 24 * 2); // two days in the future

  const [backups] = await instance.listBackups({filter:`name:${backupId}`});
  if (backups.length < 1) {
    console.error(`Backup ${backupId} not found.`);
    return;
  }
  const backup = backups[0];

  // Read backup metadata and update expiry time
  try {
    const currentExpireTime = await backup.getExpireTime();
    console.log(`Backup ${backupId} current expire time: ${currentExpireTime.toISOString()}`);
    console.log(`Updating expire time to ${currentExpireTime.toISOString()}`);
    await backup.updateExpireTime(newExpireTime);
    console.log('Expire time updated.');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    await database.close();
  }
  // [END spanner_update_backup_expire_time]
}

module.exports.updateBackupExpireTime = updateBackupExpireTime;
