/**
 * Copyright 2020 Google LLC
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

async function getDatabaseWithVersionRetentionPeriod(
  instanceId,
  databaseId,
  projectId
) {
  // [START spanner_get_database]
  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  // Get the database metadata.
  try {
    const [databaseInfo] = await database.getMetadata();

    console.log(
      'Version retention period: ' + databaseInfo.versionRetentionPeriod
    );
    console.log('Earliest version time: ' + databaseInfo.earliestVersionTime);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    database.close();
  }
  // [END spanner_get_database]
}

module.exports.getDatabaseWithVersionRetentionPeriod = getDatabaseWithVersionRetentionPeriod;
