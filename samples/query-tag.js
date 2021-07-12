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

'use strict';

async function main(instanceId, databaseId, projectId) {
  // [START spanner_query_tags]
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
  // [END spanner_query_tags]
}
main(...process.argv.slice(2)).then(() =>
  console.log('Finished executing query-tag sample')
);
