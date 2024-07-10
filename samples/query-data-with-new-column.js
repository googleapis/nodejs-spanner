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

// sample-metadata:
//  title: Query data with new column from the database table
//  usage: node query-data-with-new-column.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START spanner_query_data_with_new_column]
  // This sample uses the `MarketingBudget` column. You can add the column
  // by running the `add_column` sample or by running this DDL statement against
  // your database:
  //    ALTER TABLE Albums ADD COLUMN MarketingBudget INT64

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

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  async function queryDataWithNewColumn() {
    const query = {
      sql: 'SELECT SingerId, AlbumId, MarketingBudget FROM Albums',
    };
    console.log('line 55: ', query);

    // Queries rows from the Albums table
    try {
      const [rows] = await database.run(query);
      console.log('line 60: ', rows);

      rows.forEach(async row => {
        const json = row.toJSON();

        console.log(
          `SingerId: ${json.SingerId}, AlbumId: ${
            json.AlbumId
          }, MarketingBudget: ${
            json.MarketingBudget ? json.MarketingBudget : null
          }`
        );
      });
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      // Close the database when finished.
      database.close();
    }
  }
  queryDataWithNewColumn();
  // [END spanner_query_data_with_new_column]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
