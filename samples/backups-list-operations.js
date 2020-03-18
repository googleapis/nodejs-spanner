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

async function listBackupOperations(instanceId, databaseId, projectId) {
  // [START spanner_list_backup_operations]
  // Imports the Google Cloud client library
  const {Spanner} = require('@google-cloud/spanner');
  const {google} = require('../protos/protos');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const databaseId = 'my-database';
  // const instanceId = 'my-instance';

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance
  const instance = spanner.instance(instanceId);

  // List backup operations
  try {
    const [backupOperations] = await instance.listBackupOperations({
      filter: `(metadata.database:${databaseId}) AND (metadata.@type:type.googleapis.com/google.spanner.admin.database.v1.CreateBackupMetadata)`,
    });
    console.log('Backup Operations:');
    backupOperations.forEach(backupOperation => {
      console.log(
        backupOperation.name +
          (backupOperation.done
            ? ' (completed)'
            : ` (in progress - ${
                google.spanner.admin.database.v1.CreateBackupMetadata.decode(
                  backupOperation.metadata.value
                ).progress.progressPercent
              }%)`)
      );
    });
  } catch (err) {
    console.error('ERROR:', err);
  }
  // [END spanner_list_backup_operations]
}

module.exports.listBackupOperations = listBackupOperations;
