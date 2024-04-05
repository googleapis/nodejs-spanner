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
//  title: Calls a server side function on a Spanner PostgreSQL database.
//  usage: node insert-query-with-get-transaction.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

async function main(instanceId, databaseId, projectId) {
  // [START spanner_read_query_with_get_transaction]
  // Imports the Google Cloud client library.
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

  async function readTransaction() {
    // Gets a reference to a Cloud Spanner instance and database
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const options = {
      optimisticLock: true,
    };

    const promise = await database.getTransaction(options).then();
    const transaction = promise[0];

    try {
      await transaction.run('SELECT * FROM Singers').then(results => {
        const rows = results[0].map(row => row.toJSON());
        console.log(rows);
      });
    } catch (err) {
      console.error('ERROR:', err);
    }

    await transaction.commit();

    transaction.end();
  }
  readTransaction();
  // [END spanner_read_query_with_get_transaction]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
