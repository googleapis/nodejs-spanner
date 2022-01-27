// Copyright 2022 Google LLC
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
//  title: Adds a table with PostgreSQL Numeric column.
//  usage: node addPgNumericTable <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START spanner_add_pg_numeric_table]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const projectId = 'my-project-id';

  // Imports the Google Cloud Spanner client library
  const {Spanner} = require('@google-cloud/spanner');

  // Instantiates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  async function addPgNumericTable() {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const request = [
      `CREATE TABLE Venues 
        (VenueId  bigint NOT NULL PRIMARY KEY,
        Name      varchar(1024) NOT NULL,
        Revenues  numeric
        );`,
    ];

    // Updates schema by adding a new table.
    const [operation] = await database.updateSchema(request);

    console.log(`Waiting for operation on ${databaseId} to complete...`);

    await operation.promise();

    console.log(`Added table Revenues to database ${databaseId}.`);
  }
  addPgNumericTable();
  // [END spanner_add_pg_numeric_table]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
