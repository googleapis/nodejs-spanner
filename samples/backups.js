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
    // Optional - allow Spanner API endpoint to be configured with environment variable
    apiEndpoint: process.env.API_ENDPOINT,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const databasePath = database.formattedName_;
  const expireTime =  new PreciseDate(Date.now() + 1000 * 60 * 60 * 24); // one day in the future
  const backup = instance.backup(backupId, databasePath, expireTime);

  // Creates a new backup of the database
  try {
    console.log(`Creating backup of database ${database.formattedName_}.`);
    const [operation] = await backup.create();

    console.log(`Waiting for backup ${backup.formattedName_} to complete...`);
    await operation.promise();

    console.log('Backup created.');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    await database.close();
  }
  // [END spanner_create_backup]
}

async function updateBackupExpireTime(instanceId, databaseId, backupId, projectId) {
  // [START spanner_update_backup_expire_time]
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

  // Creates a new backup of the database
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

async function restoreBackup(instanceId, databaseId, backupId, projectId) {
  // [START spanner_restore_backup]
  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

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

  // Restore the database
  console.log(`Restoring database ${database.formattedName_} from backup ${backupId}.`);
  const [restoreOperation] = await database.restore(`projects/${projectId}/instances/${instanceId}/backups/${backupId}`);

  // Wait for restore to complete
  console.log(`Waiting for database restore to complete...`);
  await restoreOperation.promise();

  console.log(`Database restored from backup.`);
  // [END spanner_restore_backup]
}

async function deleteBackup(instanceId, databaseId, backupId, projectId) {
    // [START spanner_delete_backup]
    // Imports the Google Cloud client library
    const {Spanner} = require('@google-cloud/spanner');

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

    // Find backup to delete
    const [backups] = await instance.listBackups({filter:`name:${backupId}`});
    if (backups.length < 1) {
        console.error(`Backup ${backupId} not found.`);
        return;
    }
    const backup = backups[0];

    // Delete the backup
    console.log(`Deleting backup ${backupId}.`);
    await backup.deleteBackup();
    console.log(`Backup deleted.`);

    // [END spanner_delete_backup]
}

require(`yargs`)
  .demand(1)
  .command(
    `createBackup <instanceName> <databaseName> <backupName> <projectId>`,
    `Creates a backup of a Cloud Spanner database.`,
    {},
    opts => createBackup(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
  )
  .command(
    `updateBackupExpireTime <instanceName> <databaseName> <backupName> <projectId>`,
    `Updates the expire time of a backup.`,
    {},
    opts => updateBackupExpireTime(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
  )
  .command(
    `restoreBackup <instanceName> <databaseName> <backupName> <projectId>`,
    `Restores a Cloud Spanner database from a backup.`,
    {},
    opts => restoreBackup(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
  )
  .command(
    `deleteBackup <instanceName> <databaseName> <backupName> <projectId>`,
    `Deletes a backup.`,
    {},
    opts => deleteBackup(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
    )
  .example(`node $0 createBackup "my-instance" "my-database" "my-backup" "my-project-id"`)
  .wrap(120)
  .recommendCommands()
  .epilogue(`For more information, see https://cloud.google.com/spanner/docs`)
  .strict()
  .help().argv;
