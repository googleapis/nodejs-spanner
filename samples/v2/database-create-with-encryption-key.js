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

'use strict';

async function createDatabaseWithEncryptionKey(
  instanceId,
  databaseId,
  projectId,
  keyName
) {

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const keyName =
  //   'projects/my-project-id/my-region/keyRings/my-key-ring/cryptoKeys/my-key';
  // projects/span-cloud-testing/locations/asia1/keyRings/shugups/cryptoKeys/backup

  // Imports the database admin client
  const {DatabaseAdminClient} = require('@google-cloud/spanner/build/src/v1');
  const {protos} = require('@google-cloud/spanner');

  // creates an database admin client
  const databaseAdminClient = new DatabaseAdminClient({
    projectId: projectId,
    instanceId: instanceId,
    });

  // Creates a database
  const [operation] = await databaseAdminClient.createDatabase({
    createStatement: 'CREATE DATABASE `' + databaseId + '`',
    parent: databaseAdminClient.instancePath(projectId, instanceId),
    encryptionConfig: protos.google.spanner.admin.database.v1.EncryptionConfig = {
      kmsKeyName: keyName,
    },
  });


  console.log(`Waiting for operation on ${databaseId} to complete...`);
  await operation.promise();

  console.log(`Created database ${databaseId} on instance ${instanceId}.`);

  // Get encryption key
  const [metadata] = await databaseAdminClient.getDatabase({
    name: databaseAdminClient.databasePath(projectId, instanceId, databaseId),
  });

  console.log(
    `Database encrypted with key ${metadata.encryptionConfig.kmsKeyName}.`
  );
}

module.exports.createDatabaseWithEncryptionKey =
  createDatabaseWithEncryptionKey;
