/**
 * Copyright 2017, Google, Inc.
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

function createDatabase(instanceId, databaseId, projectId) {
  // [START spanner_create_database]
  // Imports the Google Cloud client library
  const Spanner = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
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
  instance
    .createDatabase(databaseId, request)
    .then(results => {
      const database = results[0];
      const operation = results[1];

      console.log(`Waiting for operation on ${database.id} to complete...`);
      return operation.promise();
    })
    .then(() => {
      console.log(`Created database ${databaseId} on instance ${instanceId}.`);
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
  // [END spanner_create_database]
}

function addColumn(instanceId, databaseId, projectId) {
  // [START spanner_add_column]
  // Imports the Google Cloud client library
  const Spanner = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const request = ['ALTER TABLE Albums ADD COLUMN MarketingBudget INT64'];

  // Creates a new index in the database
  database
    .updateSchema(request)
    .then(results => {
      const operation = results[0];

      console.log('Waiting for operation to complete...');
      return operation.promise();
    })
    .then(() => {
      console.log('Added the MarketingBudget column.');
    })
    .catch(err => {
      console.error('ERROR:', err);
    })
    .then(() => {
      // Close the database when finished.
      return database.close();
    });
  // [END spanner_add_column]
}

function queryDataWithNewColumn(instanceId, databaseId, projectId) {
  // [START spanner_query_data_with_new_column]
  // This sample uses the `MarketingBudget` column. You can add the column
  // by running the `add_column` sample or by running this DDL statement against
  // your database:
  //    ALTER TABLE Albums ADD COLUMN MarketingBudget INT64

  // Imports the Google Cloud client library
  const Spanner = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const query = {
    sql: `SELECT SingerId, AlbumId, MarketingBudget FROM Albums`,
  };

  // Queries rows from the Albums table
  database
    .run(query)
    .then(results => {
      const rows = results[0];

      rows.forEach(row => {
        const json = row.toJSON();

        console.log(
          `SingerId: ${json.SingerId}, AlbumId: ${
            json.AlbumId
          }, MarketingBudget: ${
            json.MarketingBudget ? json.MarketingBudget : null
          }`
        );
      });
    })
    .catch(err => {
      console.error('ERROR:', err);
    })
    .then(() => {
      // Close the database when finished.
      return database.close();
    });
  // [END spanner_query_data_with_new_column]
}

require(`yargs`)
  .demand(1)
  .command(
    `createDatabase <instanceName> <databaseName> <projectId>`,
    `Creates an example database with two tables in a Cloud Spanner instance.`,
    {},
    opts => createDatabase(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `addColumn <instanceName> <databaseName> <projectId>`,
    `Adds an example MarketingBudget column to an example Cloud Spanner table.`,
    {},
    opts => addColumn(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `queryNewColumn <instanceName> <databaseName> <projectId>`,
    `Executes a read-only SQL query against an example Cloud Spanner table with an additional column (MarketingBudget) added by addColumn.`,
    {},
    opts =>
      queryDataWithNewColumn(
        opts.instanceName,
        opts.databaseName,
        opts.projectId
      )
  )
  .example(`node $0 createDatabase "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 addColumn "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 queryNewColumn "my-instance" "my-database" "my-project-id"`)
  .wrap(120)
  .recommendCommands()
  .epilogue(`For more information, see https://cloud.google.com/spanner/docs`)
  .strict()
  .help().argv;
