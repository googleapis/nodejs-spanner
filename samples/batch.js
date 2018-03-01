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

function createBatchTransaction(instanceId, databaseId, projectId) {
  // [START create_batch_transaction]
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

  database
    .createBatchTransaction()
    .then(data => {
      const transaction = data[0];

      console.log(`Created batch transaction for ${databaseId}`);

      // Close the transaction when finished.
      return transaction.close();
    })
    .then(
      () => {
        console.log(`Closed batch transaction`);
      },
      err => {
        console.error('ERROR:', err);
      }
    );
  // [END create_batch_transaction]
}

function createQueryPartitions(instanceId, databaseId, identifier, projectId) {
  // [START create_query_partitions]
  // Imports the Google Cloud client library
  const Spanner = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const identifier = {};

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const transaction = database.batchTransaction(identifier);

  const query = 'SELECT * FROM Singers';

  transaction
    .createQueryPartitions(query)
    .then(data => {
      const partitions = data[0];
      console.log(
        `Successfully created ${partitions.length} query partitions.`
      );
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
  // [END create_query_partitions]
}

function createReadPartitions(instanceId, databaseId, identifier, projectId) {
  // [START create_read_partitions]
  // Imports the Google Cloud client library
  const Spanner = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const identifier = {};

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const transaction = database.batchTransaction(identifier);

  const options = {
    table: 'Singers',
    keys: ['1'],
    columns: ['SingerId'],
  };

  transaction
    .createReadPartitions(options)
    .then(data => {
      const partitions = data[0];
      console.log(`Successfully created ${partitions.length} read partitions.`);
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
  // [END create_read_partitions]
}

function executePartition(
  instanceId,
  databaseId,
  identifier,
  partition,
  projectId
) {
  // [START execute_partition]
  // Imports the Google Cloud client library
  const Spanner = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const identifier = {};
  // const partition = {};

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const transaction = database.batchTransaction(identifier);

  transaction
    .execute(partition)
    .then(data => {
      const rows = data[0];
      console.log(
        `Successfully received ${rows.length} from executed partition.`
      );
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
  // [END execute_partition]
}

require(`yargs`)
  .demand(1)
  .command(
    `create-batch-transaction <instanceName> <databaseName> <projectId>`,
    'Creates a batch transaction for an example Cloud Spanner database.',
    {},
    opts =>
      createBatchTransaction(
        opts.instanceName,
        opts.databaseName,
        opts.projectId
      )
  )
  .command(
    `create-query-partitions <instanceName> <databaseName> <identifier> <projectId>`,
    'Creates query partitions.',
    {},
    opts =>
      createQueryPartitions(
        opts.instanceName,
        opts.databaseName,
        JSON.parse(opts.identifier),
        opts.projectId
      )
  )
  .command(
    `create-read-partitions <instanceName> <databaseName> <identifier> <projectId>`,
    'Creates read partitions.',
    {},
    opts =>
      createReadPartitions(
        opts.instanceName,
        opts.databaseName,
        JSON.parse(opts.identifier),
        opts.projectId
      )
  )
  .command(
    `execute-partition <instanceName> <databaseName> <identifier> <partition> <projectId>`,
    'Executes a partition.',
    {},
    opts =>
      executePartition(
        opts.instanceName,
        opts.databaseName,
        JSON.parse(opts.identifier),
        JSON.parse(opts.partition),
        opts.projectId
      )
  )
  .example(
    `node $0 create-batch-transaction "my-instance" "my-database" "{}" "my-project-id"`
  )
  .example(
    `node $0 create-query-partitions "my-instance" "my-database" "{}" "my-project-id"`
  )
  .example(
    `node $0 create-read-partitions "my-instance" "my-database" "{}" "my-project-id"`
  )
  .example(
    `node $0 execute-partition "my-instance" "my-database" "{}" "{}" "my-project-id"`
  )
  .wrap(120)
  .recommendCommands()
  .epilogue(`For more information, see https://cloud.google.com/spanner/docs`)
  .strict()
  .help().argv;
