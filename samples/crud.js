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

async function updateData(instanceId, databaseId, projectId) {
  // [START spanner_update_data]
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
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  // Update a row in the Albums table
  // Note: Cloud Spanner interprets Node.js numbers as FLOAT64s, so they
  // must be converted to strings before being inserted as INT64s
  const albumsTable = database.table('Albums');

  try {
    await albumsTable.update([
      {SingerId: '1', AlbumId: '1', MarketingBudget: '100000'},
      {SingerId: '2', AlbumId: '2', MarketingBudget: '500000'},
    ]);
    console.log('Updated data.');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    database.close();
  }
  // [END spanner_update_data]
}

async function insertData(instanceId, databaseId, projectId) {
  // [START spanner_insert_data]
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
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  // Instantiate Spanner table objects
  const singersTable = database.table('Singers');
  const albumsTable = database.table('Albums');

  // Inserts rows into the Singers table
  // Note: Cloud Spanner interprets Node.js numbers as FLOAT64s, so
  // they must be converted to strings before being inserted as INT64s
  try {
    await singersTable.insert([
      {SingerId: '1', FirstName: 'Marc', LastName: 'Richards'},
      {SingerId: '2', FirstName: 'Catalina', LastName: 'Smith'},
      {SingerId: '3', FirstName: 'Alice', LastName: 'Trentor'},
      {SingerId: '4', FirstName: 'Lea', LastName: 'Martin'},
      {SingerId: '5', FirstName: 'David', LastName: 'Lomond'},
    ]);

    await albumsTable.insert([
      {SingerId: '1', AlbumId: '1', AlbumTitle: 'Total Junk'},
      {SingerId: '1', AlbumId: '2', AlbumTitle: 'Go, Go, Go'},
      {SingerId: '2', AlbumId: '1', AlbumTitle: 'Green'},
      {SingerId: '2', AlbumId: '2', AlbumTitle: 'Forever Hold your Peace'},
      {SingerId: '2', AlbumId: '3', AlbumTitle: 'Terrified'},
    ]);

    console.log('Inserted data.');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    database.close();
  }
  // [END spanner_insert_data]
}

async function deleteData(instanceId, databaseId, projectId) {
  // [START spanner_delete_data]
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
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  // Instantiate Spanner table object
  const singersTable = database.table('Singers');

  // Deletes rows from the Singers table and the Albums table,
  // because Albums table is defined with ON DELETE CASCADE.
  try {
    const keys = [1, 2, 3, 4, 5];
    await singersTable.deleteRows(keys);
    console.log('Deleted data.');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    database.close();
  }
  // [END spanner_delete_data]
}

async function queryData(instanceId, databaseId, projectId) {
  // [START spanner_query_data]
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
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const query = {
    sql: 'SELECT SingerId, AlbumId, AlbumTitle FROM Albums',
  };

  // Queries rows from the Albums table
  try {
    const [rows] = await database.run(query);

    rows.forEach(row => {
      const json = row.toJSON();
      console.log(
        `SingerId: ${json.SingerId}, AlbumId: ${json.AlbumId}, AlbumTitle: ${
          json.AlbumTitle
        }`
      );
    });
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    database.close();
  }
  // [END spanner_query_data]
}

async function readData(instanceId, databaseId, projectId) {
  // [START spanner_read_data]
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
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  // Reads rows from the Albums table
  const albumsTable = database.table('Albums');

  const query = {
    columns: ['SingerId', 'AlbumId', 'AlbumTitle'],
    keySet: {
      all: true,
    },
  };

  try {
    const [rows] = await albumsTable.read(query);

    rows.forEach(row => {
      const json = row.toJSON();
      console.log(
        `SingerId: ${json.SingerId}, AlbumId: ${json.AlbumId}, AlbumTitle: ${
          json.AlbumTitle
        }`
      );
    });
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    database.close();
  }
  // [END spanner_read_data]
}

async function readStaleData(instanceId, databaseId, projectId) {
  // [START spanner_read_stale_data]
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
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  // Reads rows from the Albums table
  const albumsTable = database.table('Albums');

  const query = {
    columns: ['SingerId', 'AlbumId', 'AlbumTitle', 'MarketingBudget'],
    keySet: {
      all: true,
    },
  };

  const options = {
    // Guarantees that all writes committed more than 15 seconds ago are visible
    exactStaleness: 15,
  };

  try {
    const [rows] = await albumsTable.read(query, options);

    rows.forEach(row => {
      const json = row.toJSON();
      const id = json.SingerId;
      const album = json.AlbumId;
      const title = json.AlbumTitle;
      const budget = json.MarketingBudget ? json.MarketingBudget : '';
      console.log(
        `SingerId: ${id}, AlbumId: ${album}, AlbumTitle: ${title}, MarketingBudget: ${budget}`
      );
    });
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    database.close();
  }
  // [END spanner_read_stale_data]
}

require(`yargs`)
  .demand(1)
  .command(
    `update <instanceName> <databaseName> <projectId>`,
    `Modifies existing rows of data in an example Cloud Spanner table.`,
    {},
    opts => updateData(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `query <instanceName> <databaseName> <projectId>`,
    `Executes a read-only SQL query against an example Cloud Spanner table.`,
    {},
    opts => queryData(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `insert <instanceName> <databaseName> <projectId>`,
    `Inserts new rows of data into an example Cloud Spanner table.`,
    {},
    opts => insertData(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `delete <instanceName> <databaseName> <projectId>`,
    `Deletes rows from an example Cloud Spanner table.`,
    {},
    opts => deleteData(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `read <instanceName> <databaseName> <projectId>`,
    `Reads data in an example Cloud Spanner table.`,
    {},
    opts => readData(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `read-stale <instanceName> <databaseName> <projectId>`,
    `Reads stale data in an example Cloud Spanner table.`,
    {},
    opts => readStaleData(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .example(`node $0 update "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 query "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 insert "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 delete "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 read "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 read-stale "my-instance" "my-database" "my-project-id"`)
  .wrap(120)
  .recommendCommands()
  .epilogue(`For more information, see https://cloud.google.com/spanner/docs`)
  .strict()
  .help().argv;
