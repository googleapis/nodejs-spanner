// Copyright 2024 Google LLC
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
//  title: Create a Database
//  usage: node createDatabase.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceID = 'my-instance',
  databaseID = 'my-database',
  projectID = 'my-project-id'
) {
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

  // creates a database
  async function createDatabase() {
    const createSingersTableStatement = `
            CREATE TABLE Singers (
            SingerId    INT64 NOT NULL,
            FirstName   STRING(1024),
            LastName    STRING(1024),
            SingerInfo  BYTES(MAX),
            FullName    STRING(2048) AS (ARRAY_TO_STRING([FirstName, LastName], " ")) STORED,
            ) PRIMARY KEY (SingerId)`;
    const createAlbumsTableStatement = `
            CREATE TABLE Albums (
            SingerId    INT64 NOT NULL,
            AlbumId     INT64 NOT NULL,
            AlbumTitle  STRING(MAX)
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
  createDatabase();
  // [END spanner_create_database]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
