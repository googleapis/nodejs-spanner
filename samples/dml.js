/**
 * Copyright 2018, Google, Inc.
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

function insertUsingDml(instanceId, databaseId, projectId) {
  // [START spanner_dml_standard_insert]
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

  database.runTransaction((err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    transaction
      .runUpdate({
        sql:
          'INSERT Singers (SingerId, FirstName, LastName) VALUES (10, @firstName, @lastName)',
        params: {
          firstName: 'Virginia',
          lastName: 'Watson',
        },
      })
      .then(rowCount => {
        console.log(
          `Successfully inserted ${rowCount} record into the Singers table.`
        );
        return transaction.commit();
      })
      .catch(err => {
        console.error('ERROR:', err);
      })
      .then(() => {
        // Close the database when finished.
        return database.close();
      });
  });
  // [END spanner_dml_standard_insert]
}

function updateUsingDml(instanceId, databaseId, projectId) {
  // [START spanner_dml_standard_update]
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

  database.runTransaction((err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    transaction
      .runUpdate({
        sql: `UPDATE Albums SET MarketingBudget = MarketingBudget * 2
          WHERE SingerId = 1 and AlbumId = 1`,
      })
      .then(rowCount => {
        console.log(`Successfully updated ${rowCount} record.`);
        return transaction.commit();
      })
      .catch(err => {
        console.error('ERROR:', err);
      })
      .then(() => {
        // Close the database when finished.
        return database.close();
      });
  });
  // [END spanner_dml_standard_update]
}

function deleteUsingDml(instanceId, databaseId, projectId) {
  // [START spanner_dml_standard_delete]
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

  database.runTransaction((err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    transaction
      .runUpdate({
        sql: `DELETE Singers WHERE FirstName = 'Alice'`,
      })
      .then(rowCount => {
        console.log(`Successfully deleted ${rowCount} record.`);
        return transaction.commit();
      })
      .catch(err => {
        console.error('ERROR:', err);
      })
      .then(() => {
        // Close the database when finished.
        return database.close();
      });
  });
  // [END spanner_dml_standard_delete]
}

function updateUsingDmlWithTimestamp(instanceId, databaseId, projectId) {
  // [START spanner_dml_standard_update_with_timestamp]
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

  database.runTransaction((err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    transaction
      .runUpdate({
        sql: `UPDATE Albums
          SET LastUpdateTime = PENDING_COMMIT_TIMESTAMP()
          WHERE SingerId = 1`,
      })
      .then(rowCount => {
        console.log(`Successfully updated ${rowCount} records.`);
        return transaction.commit();
      })
      .catch(err => {
        console.error('ERROR:', err);
      })
      .then(() => {
        // Close the database when finished.
        return database.close();
      });
  });
  // [END spanner_dml_standard_update_with_timestamp]
}

function writeAndReadUsingDml(instanceId, databaseId, projectId) {
  // [START spanner_dml_write_then_read]
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

  database.runTransaction((err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    transaction
      .runUpdate({
        sql: `INSERT Singers (SingerId, FirstName, LastName)
          VALUES (11, 'Timothy', 'Campbell')`,
      })
      // Queries rows from the Singers table
      .run(`SELECT FirstName, LastName FROM Singers`)
      .then(results => {
        const rows = results[0];
        rows.forEach(row => {
          const json = row.toJSON();
          console.log(`${json.FirstName} ${json.LastName}`);
        });
        return transaction.commit();
      })
      .catch(err => {
        console.error('ERROR:', err);
      })
      .then(() => {
        // Close the database when finished.
        return database.close();
      });
  });
  // [END spanner_dml_write_then_read]
}

function updateUsingDmlWithStruct(instanceId, databaseId, projectId) {
  // [START spanner_dml_structs]
  const nameStruct = Spanner.struct({
    FirstName: 'Timothy',
    LastName: 'Campbell',
  });
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

  database.runTransaction((err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    transaction
      .runUpdate({
        sql: `UPDATE Singers SET LastName = 'Grant'
        WHERE STRUCT<FirstName STRING, LastName STRING>(FirstName, LastName) = @name`,
        params: {
          name: nameStruct,
        },
      })
      .then(rowCount => {
        console.log(`Successfully updated ${rowCount} record.`);
        return transaction.commit();
      })
      .catch(err => {
        console.error('ERROR:', err);
      })
      .then(() => {
        // Close the database when finished.
        return database.close();
      });
  });
  // [END spanner_dml_structs]
}

function writeUsingDml(instanceId, databaseId, projectId) {
  // [START spanner_dml_getting_started_insert]
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

  database.runTransaction((err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    transaction
      .runUpdate({
        sql: `INSERT Singers (SingerId, FirstName, LastName) VALUES
        (12, 'Melissa', 'Garcia'),
        (13, 'Russell', 'Morales'),
        (14, 'Jacqueline', 'Long'),
        (15, 'Dylan', 'Shaw')`,
      })
      .then(rowCount => {
        console.log(`${rowCount} records inserted.`);
        return transaction.commit();
      })
      .catch(err => {
        console.error('ERROR:', err);
      })
      .then(() => {
        // Close the database when finished.
        return database.close();
      });
  });

  // [END spanner_dml_getting_started_insert]
}

function writeWithTransactionUsingDml(instanceId, databaseId, projectId) {
  // [START spanner_dml_getting_started_update]
  // This sample transfers 200,000 from the MarketingBudget field
  // of the first Album to the second Album. Make sure to run the
  // addColumn and updateData samples first (in that order).

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

  const transferAmount = 200000;
  const minimumAmountToTransfer = 300000;

  database.runTransaction((err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    let firstBudget, secondBudget;
    const queryOne = `SELECT MarketingBudget FROM Albums
      WHERE SingerId = 1 AND AlbumId = 1`;

    const queryTwo = `SELECT MarketingBudget FROM Albums
    WHERE SingerId = 2 AND AlbumId = 2`;

    Promise.all([
      // Reads the first album's budget
      transaction.run(queryOne).then(results => {
        // Gets first album's budget
        const rows = results[0].map(row => row.toJSON());
        firstBudget = rows[0].MarketingBudget;
        console.log(`The first album's marketing budget: ${firstBudget}`);

        // Makes sure the first album's budget is sufficient
        if (firstBudget < minimumAmountToTransfer) {
          throw new Error(
            `The first album's budget (${firstBudget}) is less than the minimum required amount to transfer.`
          );
        }
      }),

      // Reads the second album's budget
      transaction.run(queryTwo).then(results => {
        // Gets second album's budget
        const rows = results[0].map(row => row.toJSON());
        secondBudget = rows[0].MarketingBudget;
        console.log(`The second album's marketing budget: ${secondBudget}`);
      }),
    ])
      .then(() => {
        // Transfer the budgets between the albums
        console.log(firstBudget, secondBudget);
        secondBudget += transferAmount;
        firstBudget -= transferAmount;

        console.log(firstBudget, secondBudget);

        // Update the database
        // Note: Cloud Spanner interprets Node.js numbers as FLOAT64s, so they
        // must be converted (back) to strings before being inserted as INT64s.

        transaction.runUpdate({
          sql: `UPDATE Albums SET MarketingBudget = @Budget
            WHERE SingerId = 1 and AlbumId = 1`,
          params: {
            Budget: firstBudget.toString(),
          },
        });
        transaction.runUpdate({
          sql: `UPDATE Albums SET MarketingBudget = @Budget
            WHERE SingerId = 2 and AlbumId = 2`,
          params: {
            Budget: secondBudget.toString(),
          },
        });
      })
      .then(() => {
        // Commits the transaction and send the changes to the database
        return transaction.commit();
      })
      .then(() => {
        console.log(
          `Successfully executed read-write transaction using DML
          to transfer ${transferAmount} from Album 1 to Album 2.`
        );
      })
      .catch(err => {
        console.error('ERROR:', err);
      })
      .then(() => {
        // Close the database when finished.
        return database.close();
      });
  });
  // [END spanner_dml_getting_started_update]
}

function updateUsingPartitionedDml(instanceId, databaseId, projectId) {
  // [START spanner_dml_partitioned_update]
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

  database
    .runPartitionedUpdate({
      sql: `UPDATE Albums SET MarketingBudget = 100000 WHERE SingerId > 1`,
    })
    .then(rowCount => {
      console.log(`Successfully updated ${rowCount} records.`);
    })
    .catch(err => {
      console.error('ERROR:', err);
    })
    .then(() => {
      // Close the database when finished.
      return database.close();
    });
  // [END spanner_dml_partitioned_update]
}

function deleteUsingPartitionedDml(instanceId, databaseId, projectId) {
  // [START spanner_dml_partitioned_delete]
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

  database
    .runPartitionedUpdate({
      sql: `DELETE Singers WHERE SingerId > 10`,
    })
    .then(rowCount => {
      console.log(`Successfully deleted ${rowCount} records.`);
    })
    .catch(err => {
      console.error('ERROR:', err);
    })
    .then(() => {
      // Close the database when finished.
      return database.close();
    });

  // [END spanner_dml_partitioned_delete]
}

require(`yargs`)
  .demand(1)
  .command(
    `insertUsingDml <instanceName> <databaseName> <projectId>`,
    `Inserts one record using DML into an example Cloud Spanner table.`,
    {},
    opts => insertUsingDml(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `updateUsingDml <instanceName> <databaseName> <projectId>`,
    `Updates one record using DML.`,
    {},
    opts => updateUsingDml(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `deleteUsingDml <instanceName> <databaseName> <projectId>`,
    `Deletes one record using DML.`,
    {},
    opts => deleteUsingDml(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `updateUsingDmlWithTimestamp <instanceName> <databaseName> <projectId>`,
    `Updates records with timestamp using DML.`,
    {},
    opts =>
      updateUsingDmlWithTimestamp(
        opts.instanceName,
        opts.databaseName,
        opts.projectId
      )
  )
  .command(
    `writeAndReadUsingDml <instanceName> <databaseName> <projectId>`,
    `Inserts and reads one record using DML.`,
    {},
    opts =>
      writeAndReadUsingDml(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `updateUsingDmlWithStruct <instanceName> <databaseName> <projectId>`,
    `Updates one record using DML and a struct value.`,
    {},
    opts =>
      updateUsingDmlWithStruct(
        opts.instanceName,
        opts.databaseName,
        opts.projectId
      )
  )
  .command(
    `writeUsingDml <instanceName> <databaseName> <projectId>`,
    `Inserts multiple records using DML.`,
    {},
    opts => writeUsingDml(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .command(
    `writeWithTransactionUsingDml <instanceName> <databaseName> <projectId>`,
    `Execute a read-write transaction using DML.`,
    {},
    opts =>
      writeWithTransactionUsingDml(
        opts.instanceName,
        opts.databaseName,
        opts.projectId
      )
  )
  .command(
    `updateUsingPartitionedDml <instanceName> <databaseName> <projectId>`,
    `Updates multiple records using DML.`,
    {},
    opts =>
      updateUsingPartitionedDml(
        opts.instanceName,
        opts.databaseName,
        opts.projectId
      )
  )
  .command(
    `deleteUsingPartitionedDml <instanceName> <databaseName> <projectId>`,
    `Deletes multilple records using DML.`,
    {},
    opts =>
      deleteUsingPartitionedDml(
        opts.instanceName,
        opts.databaseName,
        opts.projectId
      )
  )
  .example(`node $0 insertUsingDml "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 updateUsingDml "my-instance" "my-database" "my-project-id"`)
  .example(`node $0 deleteUsingDml "my-instance" "my-database" "my-project-id"`)
  .example(
    `node $0 updateUsingDmlWithTimestamp "my-instance" "my-database" "my-project-id"`
  )
  .example(
    `node $0 writeAndReadUsingDml "my-instance" "my-database" "my-project-id"`
  )
  .example(
    `node $0 updateUsingDmlWithStruct "my-instance" "my-database" "my-project-id"`
  )
  .example(`node $0 writeUsingDml "my-instance" "my-database" "my-project-id"`)
  .example(
    `node $0 writeWithTransactionUsingDml "my-instance" "my-database" "my-project-id"`
  )
  .example(
    `node $0 updateUsingPartitionedDml "my-instance" "my-database" "my-project-id"`
  )
  .example(
    `node $0 deleteUsingPartitionedDml "my-instance" "my-database" "my-project-id"`
  )
  .wrap(120)
  .recommendCommands()
  .epilogue(`For more information, see https://cloud.google.com/spanner/docs`)
  .strict()
  .help().argv;
