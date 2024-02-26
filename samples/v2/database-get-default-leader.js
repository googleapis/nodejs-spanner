/**
 * Copyright 2024 Google LLC
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
//  title: Gets the default leader option of an existing database
//  usage: node database-get-default-leader.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(instanceId, databaseId, projectId) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance-id';
  // const databaseId = 'my-database-id';

  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  // creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  const databaseAdminClient = spanner.get_database_admin_client();

  async function getDefaultLeader() {
    // Get the default leader option for the database.
    const [metadata] = await databaseAdminClient.getDatabase({
      name: databaseAdminClient.databasePath(projectId, instanceId, databaseId),
    });
    if (metadata.defaultLeader !== '') {
      console.log(
        `The default leader for ${databaseId} is ${metadata.defaultLeader}`
      );
    } else {
      console.log(
        `Database ${databaseId} does not have a value for option 'default_leader'`
      );
    }
  }
  getDefaultLeader();
}
process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
