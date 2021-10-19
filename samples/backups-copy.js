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

 async function copyBackup(
   instanceId,
   databaseId,
   backupId,
   sourceBackupId,
   projectId,
   versionTime
 ) {
   // [START spanner_copy_backup]
   // Imports the Google Cloud client library and precise date library
   const {Spanner} = require('@google-cloud/spanner');
   const {PreciseDate} = require('@google-cloud/precise-date');
 
   /**
    * TODO(developer): Uncomment the following lines before running the sample.
    */
   // const projectId = 'my-project-id';
   // const instanceId = 'my-instance';
   // const databaseId = 'my-database';
   // const backupId = 'my-backup';
   // const sourceBackupId= 'my-source-backup'
 
   // Creates a client
   const spanner = new Spanner({
    projectId: projectId,
  });
 
   // Gets a reference to a Cloud Spanner instance and database
   const instance = spanner.instance(instanceId);
   const database = instance.database(databaseId);
   // Expire source and copy backup 14 days in the future
   const expireTime = Date.now() + 1000 * 60 * 60 * 24 * 14;
 
   // Creates a new backup of the database
   const sourceBackup = instance.backup(sourceBackupId);

   // Copy a new backup of the database
   const copyBackup = instance.copy_backup(backupId, sourceBackup.formattedName_);
   try {
    console.log(`Creating copy of the source backup ${sourceBackup.formattedName_}.`);
    // Create a backup of the state of the database at the current time.
    const [, operation] = await copyBackup.create({
      expireTime: expireTime,
    });

    console.log(`Waiting for copy backup ${copyBackup.formattedName_} to complete...`);
    await operation.promise();

    // Verify backup is ready
    const [copyBackupInfo] = await copyBackup.getMetadata();
    if (copyBackupInfo.state === 'READY') {
      console.log(
        `Copy backup ${copyBackupInfo.name} of size ` +
          `${copyBackupInfo.sizeBytes} bytes was created at ` +
          `${new PreciseDate(copyBackupInfo.createTime).toISOString()}`
      );
    } else {
      console.error('ERROR: Copy backup is not ready.');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    await database.close();
  }
   // [END spanner_copy_backup]
 }
 
 module.exports.copyBackup = copyBackup;
 