// Copyright 2022 Google LLC
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
//  title: Allows fine-grained (table/column level) access controls to Cloud Spanner.
//  usage: node fine-grained-access-control.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START fine_grained_access_control]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const projectId = 'my-project-id';
  // Imports the Google Cloud Spanner client library
  const {Spanner} = require('@google-cloud/spanner');

  // Instantiates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  async function fineGrainedAccessControl() {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    // Creates a new user defined role
    try {
      const request = ['CREATE ROLE parent'];
      const [operation] = await database.updateSchema(request);

      console.log('Waiting for operation to complete...');
      await operation.promise();

      console.log('New Role Created');
    } catch (err) {
      console.error('ERROR:', err);
    }

    // Grants SELECT permission to the newly created role
    try {
      const request = ['GRANT SELECT ON TABLE Singers TO ROLE parent'];
      const [operation] = await database.updateSchema(request);

      console.log('Waiting for operation to complete...');
      await operation.promise();

      console.log('Access Granted');
    } catch (err) {
      console.error('ERROR:', err);
    }

    // Creating new Database with creator role set and using that
    const options = {
      creatorRole: 'parent',
    };

    const dbNewRole = instance.database(databaseId, options);
    try {
      const query = {
        sql: 'SELECT SingerId, FirstName, LastName FROM Singers',
      };
      const [rows] = await dbNewRole.run(query);

      for (const row of rows) {
        const json = row.toJSON();

        console.log(
          `SingerId: ${json.SingerId}, FirstName: ${json.FirstName}, LastName: ${json.LastName}`
        );
      }
    } catch (err) {
      console.error('ERROR:', err);
    }

    // Revokes all privileges as they must be revoked before dropping a role
    try {
      const request = ['REVOKE SELECT ON TABLE Singers FROM ROLE parent'];
      const [operation] = await database.updateSchema(request);

      console.log('Waiting for operation to complete...');
      await operation.promise();

      console.log('Access Revoked');
    } catch (err) {
      console.error('ERROR:', err);
    }

    // Dropping a user role
    try {
      const request = ['DROP ROLE parent'];
      const [operation] = await database.updateSchema(request);

      console.log('Waiting for operation to complete...');
      await operation.promise();

      console.log('Dropped Role');
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      // Close the database when finished.
      await database.close();
      await dbNewRole.close();
    }
  }
  fineGrainedAccessControl();
  // [END fine_grained_access_control]
}

// process.on('unhandledRejection', err => {
//   console.error(err.message);
//   process.exitCode = 1;
// });
// main(...process.argv.slice(2));
main('astha-testing', 'abcd', 'span-cloud-testing');
