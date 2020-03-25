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

async function listBackups(instanceId, databaseId, backupId, projectId) {
  // [START spanner_list_backups]
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

  try {
    // List all backups
    const [allBackups] = await instance.getBackups();
    console.log('All backups:');
    allBackups.forEach(backup => {
      console.log(backup.backupId);
    });

    // List backups filtered by backup name
    const [backupsByName] = await instance.getBackups({
      filter: `Name:${backupId}`,
    });
    console.log('Backups matching backup name:');
    backupsByName.forEach(backup => {
      console.log(backup.backupId);
    });

    // List backups expiring within 30 days
    const expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 30);
    const [backupsByExpiry] = await instance.getBackups({
      filter: `expire_time < "${expireTime.toISOString()}"`,
    });
    console.log('Backups expiring within 30 days:');
    backupsByExpiry.forEach(backup => {
      console.log(backup.backupId);
    });

    // List backups filtered by database name
    const [backupsByDbName] = await instance.getBackups({
      filter: `Database:${databaseId}`,
    });
    console.log('Backups matching database name:');
    backupsByDbName.forEach(backup => {
      console.log(backup.backupId);
    });

    // List backups filtered by backup size
    const [backupsBySize] = await instance.getBackups({
      filter: 'size_bytes > 100',
    });
    console.log('Backups filtered by size:');
    backupsBySize.forEach(backup => {
      console.log(backup.backupId);
    });

    // List backups that are ready that were created after a certain time
    const createTime = new Date();
    createTime.setDate(createTime.getDate() - 1);
    const [backupsByCreateTime] = await instance.getBackups({
      filter: `(state:READY) AND (create_time >= "${createTime.toISOString()}")`,
    });
    console.log('Ready backups filtered by create time:');
    backupsByCreateTime.forEach(backup => {
      console.log(backup.backupId);
    });

    // List backups using pagination
    let pageToken = undefined;
    console.log('List backups paginated:');
    do {
      const [backups, , response] = await instance.getBackups({
        autoPaginate: false,
        pageSize: 3,
        pageToken,
      });
      backups.forEach(backup => {
        console.log(backup.backupId);
      });
      pageToken = response.nextPageToken;
    } while (pageToken);
  } catch (err) {
    console.error('ERROR:', err);
  }
  // [END spanner_list_backups]
}

module.exports.listBackups = listBackups;
