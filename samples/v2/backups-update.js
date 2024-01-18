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

'use strict';

async function updateBackup(instanceId, backupId, projectId) {
  // [START spanner_update_backup]

  // Imports the Google Cloud client library and precise date library
  const {Spanner} = require('@google-cloud/spanner');
  const {DatabaseAdminClient} = require('@google-cloud/spanner/build/src/v1');
  const {PreciseDate} = require('@google-cloud/precise-date');
  const {protos} = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const backupId = 'my-backup';

  // creates an database admin client
  const databaseAdminClient = new DatabaseAdminClient({
    projectID: projectId,
    instanceID: instanceId,
  });

  // Read backup metadata and update expiry time
  try {
    const [metadata] = await databaseAdminClient.getBackup({
      name: databaseAdminClient.backupPath(projectId, instanceId, backupId),
    });

    const currentExpireTime = metadata.expireTime;
    const maxExpireTime = metadata.maxExpireTime;
    const wantExpireTime = new PreciseDate(currentExpireTime);
    wantExpireTime.setDate(wantExpireTime.getDate() + 1);

    // New expire time should be less than the max expire time
    const min = (currentExpireTime, maxExpireTime) =>
      currentExpireTime < maxExpireTime ? currentExpireTime : maxExpireTime;
    const newExpireTime = new PreciseDate(min(wantExpireTime, maxExpireTime));
    console.log(
      `Backup ${backupId} current expire time: ${Spanner.timestamp(
        currentExpireTime
      ).toISOString()}`
    );
    console.log(
      `Updating expire time to ${Spanner.timestamp(
        newExpireTime
      ).toISOString()}`
    );

    await databaseAdminClient.updateBackup({
      backup: {
        name: databaseAdminClient.backupPath(projectId, instanceId, backupId),
        expireTime: Spanner.timestamp(newExpireTime).toStruct(),
      },
      updateMask: (protos.google.protobuf.FieldMask = {
        paths: ['expire_time'],
      }),
    });
    console.log('Expire time updated.');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    //close the client
    databaseAdminClient.close();
  }
  // [END spanner_update_backup]
}

module.exports.updateBackup = updateBackup;
