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
//  title: Copies a source backup
//  usage: node spannerCopyBackup <INSTANCE_ID> <COPY_BACKUP_ID> <SOURCE_BACKUP_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START spanner_directed_read]
  // Imports the Google Cloud Spanner client library
  const {
    Spanner,
    DirectedReadOptions,
  } = require('@google-cloud/spanner');

  // Only one of excludeReplicas or includeReplicas can be set
  // Each accepts a list of replicaSelections which contains location and type
  //   * `location` - The location must be one of the regions within the
  //      multi-region configuration of your database.
  //   * `type` - The type of the replica
  // Some examples of using replicaSelectors are:
  //   * `location:us-east1` --> The "us-east1" replica(s) of any available type
  //                             will be used to process the request.
  //   * `type:READ_ONLY`    --> The "READ_ONLY" type replica(s) in nearest
  //.                            available location will be used to process the
  //                             request.
  //   * `location:us-east1 type:READ_ONLY` --> The "READ_ONLY" type replica(s)
  //                          in location "us-east1" will be used to process
  //                          the request.
  //  includeReplicas also contains an option for autoFailover which when set
  //  Spanner will not route requests to a replica outside the
  //  includeReplicas list when all the specified replicas are unavailable
  //  or unhealthy. The default value is `false`
  // const directedReadOptionsForClient = DirectedReadOptions({
  //   excludeReplicas: {
  //     replicaSelections: [
  //       {
  //         location: 'us-east4',
  //       },
  //     ],
  //   },
  // });
  //console.log(directedReadOptionsForClient);

  // Instantiates a client with directedReadOptions
  const spanner = new Spanner({
    projectId: projectId,
    apiEndpoint: 'staging-wrenchworks.sandbox.googleapis.com',
    // directedReadOptions: directedReadOptionsForClient,
  });
  console.log(spanner.directedReadOptions);

  async function spannerDirectedReads() {
    // Gets a reference to a Cloud Spanner instance and backup
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);
    const metadata = await database.getMetadata();
    console.log(metadata);
    // const directedReadOptionsForRequest = new DirectedReadOptions({
    //   includeReplicas: {
    //     replicaSelections: [
    //       {
    //         type: TransactionType.READ_ONLY,
    //       },
    //     ],
    //     autoFailover: true,
    //   },
    // });
    //
    // //
    // await database.getSnapshot(async (err, transaction) => {
    //   if (err) {
    //     console.error(err);
    //     return;
    //   }
    //   try {
    //     // Read rows while passing directedReadOptions directly to the query
    //     const [rows] = await transaction.run({
    //       sql: 'SELECT SingerId, AlbumId, AlbumTitle FROM Albums',
    //       directedReadOptions: directedReadOptionsForRequest,
    //     });
    //     rows.forEach(row => {
    //       const json = row.toJSON();
    //       console.log(
    //         `SingerId: ${json.SingerId}, AlbumId: ${json.AlbumId}, AlbumTitle: ${json.AlbumTitle}`
    //       );
    //     });
    //     console.log(
    //       'Successfully executed read-only transaction with directedReadOptions'
    //     );
    //   } catch (err) {
    //     console.error('ERROR:', err);
    //   } finally {
    //     transaction.end();
    //     // Close the database when finished.
    //     await database.close();
    //   }
    // });
  }
  spannerDirectedReads();
  // [END spanner_directed_read]
}
// process.on('unhandledRejection', err => {
//   console.error(err.message);
//   process.exitCode = 1;
// });
// main(...process.argv.slice(2));
main('surbhi-testing', 'test-db', 'span-cloud-testing')