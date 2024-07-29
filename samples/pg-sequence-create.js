// Copyright 2023 Google LLC
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
//  title: Creates sequence in PostgreSQL database.
//  usage: node pg-sequence-create.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

async function main(instanceId, databaseId, projectId) {
  // [START spanner_postgresql_create_sequence]
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

  async function createSequence(instanceId, databaseId) {
    // Gets a reference to a Cloud Spanner Database Admin Client object
    const databaseAdminClient = spanner.getDatabaseAdminClient();

    const request = [
      'CREATE SEQUENCE Seq BIT_REVERSED_POSITIVE',
      "CREATE TABLE Customers (CustomerId BIGINT DEFAULT nextval('Seq'), CustomerName character varying(1024), PRIMARY KEY (CustomerId))",
    ];

    // Creates a new table with sequence
    try {
      const [operation] = await databaseAdminClient.updateDatabaseDdl({
        database: databaseAdminClient.databasePath(
          projectId,
          instanceId,
          databaseId
        ),
        statements: request,
      });

      console.log('Waiting for operation to complete...');
      await operation.promise();

      console.log(
        'Created Seq sequence and Customers table, where the key column CustomerId uses the sequence as a default value'
      );
    } catch (err) {
      console.error('ERROR:', err);
    }

    // Gets a reference to a Cloud Spanner instance and database
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    database.runTransaction(async (err, transaction) => {
      if (err) {
        console.error(err);
        return;
      }
      try {
        const [rows, stats] = await transaction.run({
          sql: "INSERT INTO Customers (CustomerName) VALUES ('Alice'), ('David'), ('Marc') RETURNING CustomerId",
        });

        rows.forEach(row => {
          console.log(
            `Inserted customer record with CustomerId: ${
              row.toJSON({wrapNumbers: true}).customerid.value
            }`
          );
        });

        const rowCount = Math.floor(stats[stats.rowCount]);
        console.log(`Number of customer records inserted is: ${rowCount}`);

        await transaction.commit();
      } catch (err) {
        console.error('ERROR:', err);
      } finally {
        // Close the spanner client when finished.
        // The databaseAdminClient does not require explicit closure. The closure of the Spanner client will automatically close the databaseAdminClient.
        spanner.close();
      }
    });
  }
  await createSequence(instanceId, databaseId);
  // [END spanner_postgresql_create_sequence]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
