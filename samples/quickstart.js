/**
 * Copyright 2016, Google, Inc.
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

// [START spanner_quickstart]
async function quickstart(projectId) {
  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  // Your Google Cloud Platform project ID
  projectId = projectId || process.env.GCLOUD_PROJECT;

  // Creates a client
  const spanner = new Spanner({projectId});

  // Your Cloud Spanner instance ID
  const instanceId = 'my-instance';

  // Your Cloud Spanner database ID
  const databaseId = 'my-database';

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  // The query to execute
  const query = {
    sql: 'SELECT 1',
  };

  // Execute a simple SQL statement
  const [rows] = await database.run(query);
  rows.forEach(row => console.log(row));
}
// [END spanner_quickstart]

const args = process.argv.slice(2);
quickstart(...args).catch(console.error);
