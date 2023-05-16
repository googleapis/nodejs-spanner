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
//  title: Add and drop new database role
//  usage: node add-and-drop-new-database-role.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START spanner_add_and_drop_database_role]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const projectId = 'my-project-id';
  // Imports the Google Cloud Spanner client library
  const {Spanner} = require('../build/src/index.js');

  // Instantiates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  async function addAndDropNewDatabaseRole() {
    // Gets a reference to a Cloud Spanner instance and database.
    const options = {
      acquireTimeout: Infinity,
      concurrency: Infinity,
      fail: false,
      idlesAfter: 10,
      keepAlive: 30,
      labels: {},
      max: 1,
      maxIdle: 1,
      min: 1,
      incStep: 1,
      closeInactiveTransactions: true,
      logging: true,
      databaseRole: null,
    };
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId, options);
    database.enableLogging();

    // Creates a new user defined role and grant permissions
    await database.getSnapshot(async (err, transaction) => {
      if (err) {
        console.error(err);
        return;
      }
      const queryOne = 'SELECT SingerId, FirstName FROM Singers';

      try {
        // Read #1, using SQL
        const [qOneRows] = await transaction.run(queryOne);

        qOneRows.forEach(row => {
          const json = row.toJSON();
          console.log(
            `SingerId: ${json.SingerId}, FirstName: ${json.FirstName}`
          );
        });
        await new Promise(r => setTimeout(r, 3000 * 60));

        //await transaction.run(queryOne);

        console.log('Successfully executed read-only transaction.');
      } catch (err) {
        console.error('ERROR:', err);
      } finally {
        transaction.end();
        // Close the database when finished.
        await database.close();
      }
    });
  }
  addAndDropNewDatabaseRole();
  // [END spanner_add_and_drop_database_role]
}

// process.on('unhandledRejection', err => {
//   console.error(err.message);
//   process.exitCode = 1;
// });
// main(...process.argv.slice(2));
main('astha-testing', 'abcdef', 'span-cloud-testing');
