/**
 * Copyright 2019, Google, Inc.
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

// TODO sample-backup: creates database using the custom endpoint, remove this once everything is using the same
//   endpoint and use the schema.js one instead
async function createDatabase(instanceId, databaseId, projectId) {
  // [START spanner_create_database]
  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Creates a client
  const spanner = new Spanner({
        projectId: projectId,
        apiEndpoint: 'staging-wrenchworks.sandbox.googleapis.com'
      });

  // Gets a reference to a Cloud Spanner instance
  const instance = spanner.instance(instanceId);

  // Note: Cloud Spanner interprets Node.js numbers as FLOAT64s, so they
  // must be converted to strings before being inserted as INT64s
  const request = {
    schema: [
      `CREATE TABLE Singers (
        SingerId    INT64 NOT NULL,
        FirstName   STRING(1024),
        LastName    STRING(1024),
        SingerInfo  BYTES(MAX)
      ) PRIMARY KEY (SingerId)`,
      `CREATE TABLE Albums (
        SingerId    INT64 NOT NULL,
        AlbumId     INT64 NOT NULL,
        AlbumTitle  STRING(MAX)
      ) PRIMARY KEY (SingerId, AlbumId),
      INTERLEAVE IN PARENT Singers ON DELETE CASCADE`,
    ],
  };

  // Creates a database
  const [database, operation] = await instance.createDatabase(
      databaseId,
      request
  );

  console.log(`Waiting for operation on ${database.id} to complete...`);
  await operation.promise();

  console.log(`Created database ${databaseId} on instance ${instanceId}.`);
  // [END spanner_create_database]
}

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
    apiEndpoint: 'staging-wrenchworks.sandbox.googleapis.com' //TODO temp-testing
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

async function restoreBackup(instanceId, databaseId, backupId, projectId) {
  // [START spanner_restore_backup]
  // Imports the Google Cloud client library and precise date library
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
        apiEndpoint: 'staging-wrenchworks.sandbox.googleapis.com' //TODO temp-testing
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

require(`yargs`)
  .demand(1)
  // TODO sample-backup: remove once there is no more custom endpoint and schema.js's version of this can be used
  .command(
    `createDatabase <instanceName> <databaseName> <projectId>`,
    `Creates an example database with two tables in a Cloud Spanner instance.`,
    {},
    opts => createDatabase(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `createBackup <instanceName> <databaseName> <backupName> <projectId>`,
    `Creates a backup of a Cloud Spanner database.`,
    {},
    opts => createBackup(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
  )
  .command(
    `restoreBackup <instanceName> <databaseName> <backupName> <projectId>`,
    `Restores a Cloud Spanner database from a backup.`,
    {},
    opts => restoreBackup(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
  )
  .example(`node $0 createBackup "my-instance" "my-database" "my-backup" "my-project-id"`)
  .wrap(120)
  .recommendCommands()
  .epilogue(`For more information, see https://cloud.google.com/spanner/docs`)
  .strict()
  .help().argv;
