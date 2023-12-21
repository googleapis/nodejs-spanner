/**
 * Copyright 2023 Google LLC
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
async function createDatabaseUsingAdminClient(
  instanceID,
  databaseID,
  projectID
) {
  const {DatabaseAdminClient} = require('@google-cloud/spanner/build/src/v1');

  // creates an database admin client
  const databaseAdminClient = new DatabaseAdminClient({
    projectID: projectID,
    instanceID: instanceID,
  });

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
}

require('yargs')
  .demand(1)
  .command(
    'createDatabaseUsingAdminClient <instanceName> <databaseName> <projectId>',
    'Creates an example database with two tables in a Cloud Spanner instance using Database Admin Client.',
    {},
    opts =>
      createDatabaseUsingAdminClient(
        opts.instanceName,
        opts.databaseName,
        opts.projectId
      )
  )
  .example(
    'node $0 createDatabaseUsingAdminClient "my-instance" "my-database" "my-project-id"'
  )
  .wrap(120)
  .recommendCommands()
  .epilogue('For more information, see https://cloud.google.com/spanner/docs')
  .strict()
  .help().argv;
