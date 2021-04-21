// Copyright 2021 Google LLC
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

async function main(instanceId, databaseId, projectId) {
  // Imports the Google Cloud client library.
  const {Spanner, protos} = require('@google-cloud/spanner');
  const Priority = protos.google.spanner.v1.RequestOptions.Priority;

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

  async function queryWithRpcPriority(instanceId, databaseId) {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const sql = `SELECT AlbumId, AlbumTitle, MarketingBudget
          FROM Albums
          ORDER BY AlbumTitle`;

    try {
      // Execute a query with low priority. Note that the default for all
      // requests is PRIORITY_HIGH, and that this option can only be used to
      // reduce the priority of a request.
      const [rows] = await database.run({
        sql,
        requestOptions: {
          priority: Priority.PRIORITY_LOW,
        },
        json: true,
      });

      rows.forEach(row => {
        console.log(
          `AlbumId: ${row.AlbumId}, AlbumTitle: ${row.AlbumTitle}, MarketingBudget: ${row.MarketingBudget}`
        );
      });
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      // Close the database when finished.
      await database.close();
    }
  }
  await queryWithRpcPriority(instanceId, databaseId);
}
main(...process.argv.slice(2)).then(() =>
  console.log('Finished executing sample')
);
