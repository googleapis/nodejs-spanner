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

// creates a database using Database Admin Client
async function createDatabase(instanceID, databaseID, projectID) {
  // [START spanner_create_database]

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  // creates a client
  const spanner = new Spanner({
    projectId: projectID,
  });

  const databaseAdminClient = spanner.getDatabaseAdminClient();

  const createSingersTableStatement = `
    CREATE TABLE Singers (
        SingerId   INT64 NOT NULL,
        FirstName  STRING(1024),
        LastName   STRING(1024),
        SingerInfo BYTES(MAX)
    ) PRIMARY KEY (SingerId)`;
  const createAlbumsTableStatement = `
    CREATE TABLE Albums (
        SingerId     INT64 NOT NULL,
        AlbumId      INT64 NOT NULL,
        AlbumTitle   STRING(MAX)
    ) PRIMARY KEY (SingerId, AlbumId),
        INTERLEAVE IN PARENT Singers ON DELETE CASCADE`;

  // Creates a new database
  try {
    const [operation] = await databaseAdminClient.createDatabase({
      createStatement: 'CREATE DATABASE `' + databaseID + '`',
      extraStatements: [
        createSingersTableStatement,
        createAlbumsTableStatement,
      ],
      parent: databaseAdminClient.instancePath(projectID, instanceID),
    });

    console.log(`Waiting for creation of ${databaseID} to complete...`);
    await operation.promise();

    console.log(`Created database ${databaseID} on instance ${instanceID}.`);
  } catch (err) {
    console.error('ERROR:', err);
  }

  // [END spanner_create_database]
}

async function addColumn(instanceId, databaseId, projectId) {
  // [START spanner_add_column]

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  // creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  const databaseAdminClient = spanner.getDatabaseAdminClient();

  // Creates a new index in the database
  try {
    const [operation] = await databaseAdminClient.updateDatabaseDdl({
      database: databaseAdminClient.databasePath(
        projectId,
        instanceId,
        databaseId
      ),
      statements: ['ALTER TABLE Albums ADD COLUMN MarketingBudget INT64'],
    });

    console.log('Waiting for operation to complete...');
    await operation.promise();

    console.log('Added the MarketingBudget column.');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the spanner client when finished.
    // The databaseAdminClient does not require explicit closure. The closure of the Spanner client will automatically encompass the closure of the databaseAdminClient.
    spanner.close();
  }

  // [END spanner_add_column]
}

const {
  createDatabaseWithVersionRetentionPeriod,
} = require('./database-create-with-version-retention-period');

const {
  createDatabaseWithEncryptionKey,
} = require('./database-create-with-encryption-key');

require('yargs')
  .demand(1)
  .command(
    'createDatabase <instanceName> <databaseName> <projectId>',
    'Creates an example database with two tables in a Cloud Spanner instance using Database Admin Client.',
    {},
    opts => createDatabase(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .example('node $0 createDatabase "my-instance" "my-database" "my-project-id"')
  .command(
    'addColumn <instanceName> <databaseName> <projectId>',
    'Adds an example MarketingBudget column to an example Cloud Spanner table.',
    {},
    opts => addColumn(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .example('node $0 addColumn "my-instance" "my-database" "my-project-id"')
  .command(
    'createDatabaseWithVersionRetentionPeriod <instanceName> <databaseId> <projectId>',
    'Creates a database with a version retention period.',
    {},
    opts =>
      createDatabaseWithVersionRetentionPeriod(
        opts.instanceName,
        opts.databaseId,
        opts.projectId
      )
  )
  .example(
    'node $0 createDatabaseWithVersionRetentionPeriod "my-instance" "my-database-id" "my-project-id"'
  )
  .command(
    'createDatabaseWithEncryptionKey <instanceName> <databaseName> <projectId> <keyName>',
    'Creates an example database using given encryption key in a Cloud Spanner instance.',
    {},
    opts =>
      createDatabaseWithEncryptionKey(
        opts.instanceName,
        opts.databaseName,
        opts.projectId,
        opts.keyName
      )
  )
  .example(
    'node $0 createDatabaseWithEncryptionKey "my-instance" "my-database" "my-project-id" "key-name"'
  )
  .wrap(120)
  .recommendCommands()
  .epilogue('For more information, see https://cloud.google.com/spanner/docs')
  .strict()
  .help().argv;
