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

'use strict';

async function createVenuesTable(instanceId, databaseId, projectId) {
  // [START spanner_create_table_with_datatypes]

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Imports the Google Cloud client library
  const {Spanner} = require('../../build/src');

  // creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  const databaseAdminClient = spanner.database_admin_api();

  const request = [
    `CREATE TABLE Venues (
        VenueId                INT64 NOT NULL,
        VenueName              STRING(100),
        VenueInfo              BYTES(MAX),
        Capacity               INT64,
        AvailableDates         ARRAY<DATE>,
        LastContactDate        Date,
        OutdoorVenue           BOOL,
        PopularityScore        FLOAT64,
        LastUpdateTime TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp=true)
      ) PRIMARY KEY (VenueId)`,
  ];

  // Creates a table in an existing database.
  const [operation] = await databaseAdminClient.updateDatabaseDdl({
    database: databaseAdminClient.databasePath(
      projectId,
      instanceId,
      databaseId
    ),
    statements: request,
  });

  console.log(`Waiting for operation on ${databaseId} to complete...`);

  await operation.promise();

  console.log(`Created table Venues in database ${databaseId}.`);
  // [END spanner_create_table_with_datatypes]
}

const {addNumericColumn} = require('./numeric-add-column');
const {addJsonColumn} = require('./json-add-column');

require('yargs')
  .demand(1)
  .command(
    'createVenuesTable <instanceName> <databaseName> <projectId>',
    'Creates sample "Venues" table containing example datatype columns in a Cloud Spanner database.',
    {},
    opts =>
      createVenuesTable(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    'addNumericColumn <instanceName> <databaseName> <projectId>',
    'Adds a "Revenue" column to sample "Venues" table in a Cloud Spanner database.',
    {},
    opts =>
      addNumericColumn(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    'addJsonColumn <instanceName> <databaseName> <projectId>',
    'Adds a "VenueDetails" column to sample "Venues" table in a Cloud Spanner database.',
    {},
    opts => addJsonColumn(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .example(
    'node $0 createVenuesTable "my-instance" "my-database" "my-project-id"'
  )
  .example(
    'node $0 addNumericColumn "my-instance" "my-database" "my-project-id"'
  )
  .example('node $0 addJsonColumn "my-instance" "my-database" "my-project-id"')
  .wrap(120)
  .recommendCommands()
  .epilogue('For more information, see https://cloud.google.com/spanner/docs')
  .strict()
  .help().argv;
