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
//  title: Lists all databases on the selected instance
//  usage: node list-databases.js <INSTANCE_ID> <PROJECT_ID>

'use strict';

function main(instanceId, projectId) {
  // [START spanner_list_databases]
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance-id';

  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  // creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  const databaseAdminClient = spanner.getDatabaseAdminClient();

  async function listDatabases() {
    // Lists all databases on the instance.
    const [databases] = await databaseAdminClient.listDatabases({
      parent: databaseAdminClient.instancePath(projectId, instanceId),
    });
    console.log(`Databases for projects/${projectId}/instances/${instanceId}:`);
    databases.forEach(database => {
      const defaultLeader = database.defaultLeader
        ? `(default leader = ${database.defaultLeader})`
        : '';
      console.log(`\t${database.name} ${defaultLeader}`);
    });
  }
  listDatabases();
  // [END spanner_list_databases]
}
process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
