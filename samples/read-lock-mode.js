// Copyright 2026 Google LLC
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
//  title: Performs a read-write transaction with read lock mode option
//  usage: node read-lock-mode.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id',
) {
  // [START spanner_read_lock_mode]
  // Imports the Google Cloud Spanner client library
  const {Spanner, protos} = require('@google-cloud/spanner');
  // The read lock mode specified at the client-level will be applied
  // to all RW transactions.
  const readLockModeOptionsForClient = {
    defaultTransactionOptions: {
      readLockMode:
        protos.google.spanner.v1.TransactionOptions.ReadWrite.ReadLockMode
          .OPTIMISTIC,
    },
  };

  // Instantiates a client with defaultTransactionOptions
  const spanner = new Spanner({
    projectId: projectId,
    defaultTransactionOptions: readLockModeOptionsForClient,
  });

  function runTransactionWithReadLockMode() {
    // Gets a reference to a Cloud Spanner instance and database
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);
    // The read lock mode specified at the request-level takes precedence over
    // the read lock mode configured at the client-level.
    const readLockModeOptionsForTransaction = {
      readLockMode:
        protos.google.spanner.v1.TransactionOptions.ReadWrite.ReadLockMode
          .PESSIMISTIC,
    };

    database.runTransaction(
      readLockModeOptionsForTransaction,
      async (err, transaction) => {
        if (err) {
          console.error(err);
          return;
        }
        try {
          const query =
            'SELECT AlbumTitle FROM Albums WHERE SingerId = 2 AND AlbumId = 1';
          const results = await transaction.run(query);
          // Gets first album's title
          const rows = results[0].map(row => row.toJSON());
          const albumTitle = rows[0].AlbumTitle;
          console.log(`previous album title ${albumTitle}`);

          const update =
            "UPDATE Albums SET AlbumTitle = 'New Album Title' WHERE SingerId = 2 AND AlbumId = 1";
          const [rowCount] = await transaction.runUpdate(update);
          console.log(
            `Successfully updated ${rowCount} record in Albums table.`,
          );
          await transaction.commit();
          console.log(
            'Successfully executed read-write transaction with readLockMode option.',
          );
        } catch (err) {
          console.error('ERROR:', err);
        } finally {
          transaction.end();
          // Close the database when finished.
          await database.close();
        }
      },
    );
  }
  runTransactionWithReadLockMode();
  // [END spanner_read_lock_mode]
}
process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
