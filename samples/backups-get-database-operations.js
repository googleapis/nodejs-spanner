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

async function getDatabaseOperations(instanceId, projectId) {
  // [START spanner_list_database_operations]
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

  // Gets a reference to a Cloud Spanner instance
  const instance = spanner.instance(instanceId);

  // List database operations
  try {
    const [databaseOperations] = await instance.getDatabaseOperations();
    console.log('Database Operations:');
    databaseOperations.forEach(databaseOperation => {
      console.log(
        databaseOperation.name +
          (databaseOperation.done ? ' (completed)' : ' (in progress)')
      );
    });
  } catch (err) {
    console.error('ERROR:', err);
  }
  // [END spanner_list_database_operations]
}

module.exports.getDatabaseOperations = getDatabaseOperations;
