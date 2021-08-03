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
//  title: Gets the default leader option of an existing database
//  usage: node database-get-default-leader.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(instanceId, databaseId, projectId) {
  // [START spanner_query_information_schema_database_options]
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance-id';
  // const databaseId = 'my-database-id';

  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });
  // Gets a reference to a Cloud Spanner instance and a database.
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  async function getDatabaseDdl() {
    // Get the default leader option for the database.
    const [rows] = await database.run({
      sql: `
        SELECT s.OPTION_NAME, s.OPTION_VALUE
        FROM INFORMATION_SCHEMA.DATABASE_OPTIONS s
        WHERE s.OPTION_NAME = 'default_leader'`,
      json: true,
    });
    if (rows.length > 0) {
      const option = rows[0];
      console.log(
        `The ${option.OPTION_NAME} for ${databaseId} is ${option.OPTION_VALUE}`
      );
    } else {
      console.log(
        `Database ${databaseId} does not have a value for option 'default_leader'`
      );
    }
  }
  getDatabaseDdl();
  // [END spanner_query_information_schema_database_options]
}
process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
