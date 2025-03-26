// Copyright 2025 Google LLC
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
//  title: Performs a read-write transaction with isolation level option
//  usage: node snapshot-isolation.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START spanner_isolation_level]
  // Imports the Google Cloud Spanner client library
  const {Spanner, protos} = require('@google-cloud/spanner');
  const snapshotIsolationOptionsForClient = {
    defaultTransactionOptions: {
      isolationLevel:
        protos.google.spanner.v1.TransactionOptions.IsolationLevel.SERIALIZABLE,
    },
  };

  // Instantiates a client with defaultTransactionOptions
  const spanner = new Spanner({
    projectId: projectId,
    defaultTransactionOptions: snapshotIsolationOptionsForClient,
  });

  function spannerSnapshotIsolation() {
    // Gets a reference to a Cloud Spanner instance and database
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);
    // The isolation level specified at the request level takes precedence over the isolation level configured at the client level.
    const snapshotIsolationOptionsForRequest = {
      isolationLevel:
        protos.google.spanner.v1.TransactionOptions.IsolationLevel
          .REPEATABLE_READ,
    };

    database.getTransaction(
      snapshotIsolationOptionsForRequest,
      async (err, transaction) => {
        if (err) {
          console.error(err);
          return;
        }
        try {
          const [rowCount] = await transaction.runUpdate({
            sql: 'INSERT Singers (SingerId, FirstName, LastName) VALUES (1, @firstName, @lastName)',
            params: {
              firstName: 'Marc',
              lastName: 'Richards',
            },
          });

          console.log(
            `Successfully inserted ${rowCount} record into the Singers table.`
          );
          await transaction.commit();
          console.log(
            'Successfully executed read-write transaction with isolationLevel option.'
          );
        } catch (err) {
          console.error('ERROR:', err);
        } finally {
          transaction.end();
          // Close the database when finished.
          await database.close();
        }
      }
    );
  }
  spannerSnapshotIsolation();
  // [END spanner_isolation_level]
}
process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
