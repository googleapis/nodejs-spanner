/**
 * Copyright 2024 Google LLC
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

async function deleteBackup(instanceId, databaseId, backupId, projectId) {
  // [START spanner_delete_backup]

  // Imports the Google Cloud client library
  const {DatabaseAdminClient} = require('@google-cloud/spanner/build/src/v1');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const backupId = 'my-backup';

  // creates a client
  const databaseAdminClient = new DatabaseAdminClient({
    projectID: projectId,
    instanceID: instanceId,
  });

  try {
    // Delete the backup
    console.log(`Deleting backup ${backupId}.`);
    await databaseAdminClient.deleteBackup({
      name: databaseAdminClient.backupPath(projectId, instanceId, backupId),
    });
    console.log('Backup deleted.');
  } catch (err) {
    console.log('ERROR: Backup is not deleted');
  } finally {
    databaseAdminClient.close();
  }
  // [END spanner_delete_backup]
}

module.exports.deleteBackup = deleteBackup;
