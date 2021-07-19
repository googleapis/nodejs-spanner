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
//  title: Gets the query statistics from the last hour for a specific tag
//  usage: node query-tag.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(instanceId, databaseId, projectId) {
  // [START spanner_query_tags]
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  async function queryTags() {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    // Get the statistics for queries that used a specific request tag.
    const [stats] = await database.run({
      sql: `SELECT REQUEST_TAG, AVG_LATENCY_SECONDS, AVG_CPU_SECONDS
            FROM SPANNER_SYS.QUERY_STATS_TOP_HOUR
            WHERE REQUEST_TAG = 'app=cart,env=dev,action=update'`,
      json: true,
    });
    console.log(
      "Query stats last hour for request tag 'app=cart,env=dev,action=update':"
    );
    stats.forEach(row => {
      console.log(
        `${row.REQUEST_TAG} ${row.AVG_LATENCY_SECONDS} ${row.AVG_CPU_SECONDS}`
      );
    });
    await database.close();
  }
  queryTags();
  // [END spanner_query_tags]
}
process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
