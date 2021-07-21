/**
 * Copyright 2021 Google LLC
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

// sample-metadata:
//  title: Executes a read/write transaction with transaction and query tags
//  usage: node transaction-tag.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(instanceId, databaseId, projectId) {
  // [START spanner_set_transaction_and_request_tags]
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  async function transactionTag() {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    // Run a transaction with a transaction tag that will automatically be
    // included with each request in the transaction.
    try {
      const updateCount = await database.runTransactionAsync(
        {requestOptions: {transactionTag: 'app=cart,env=dev'}},
        async tx => {
          const [rows] = await tx.run({
            sql: "SELECT VenueId FROM Venues WHERE VenueName='Venue 4' LIMIT 1",
            requestOptions: {requestTag: 'app=cart,env=dev,action=list'},
            json: true,
          });
          let updateCount = 0;
          if (rows.length) {
            const id = rows[0].VenueId;
            updateCount = await tx.runUpdate({
              sql: "UPDATE Venues SET VenueName='New Venue 4' WHERE VenueId=@id",
              params: {id},
              types: {id: {type: 'int64'}},
            });
          }
          await tx.commit();
          return Promise.resolve(updateCount);
        }
      );
      console.log(`Updated ${updateCount} venue(s)`);
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      await database.close();
    }
  }
  transactionTag();
  // [END spanner_set_transaction_and_request_tags]
}
process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
