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

// sample-metadata:
//  title: Creates a user-managed instance configuration.
//  usage: node instance-config-create <INSTANCE_CONFIG_ID> <BASE_INSTANCE_CONFIG_ID> <PROJECT_ID>

'use strict';

async function main(
    instanceId = 'my-instance',
    databaseId = 'my-database',
  ) {
    const {Spanner} = require('../build/src');
    const spanner = new Spanner();
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);
    // await database.exists();
    const table = database.table('albums');
    // table.delete((err, op) => {
    //     if (err) {
    //         console.log(err);
    //     }
    //     console.log("inside callback");
    // });
    // const [operation] = await table.delete();
    // await operation.promise();
    table.delete().then(() => {
        console.log("table deleted from the database.");
    }).catch(err => {
        console.log("err: ", err);
    });
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));