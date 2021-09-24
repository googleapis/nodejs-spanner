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

function main(database, statements) {
  // [START database_v1_generated_DatabaseAdmin_UpdateDatabaseDdl_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The database to update.
   */
  // const database = 'abc123'
  /**
   *  Required. DDL statements to be applied to the database.
   */
  // const statements = 'abc123'
  /**
   *  If empty, the new update request is assigned an
   *  automatically-generated operation ID. Otherwise, `operation_id`
   *  is used to construct the name of the resulting
   *  [Operation][google.longrunning.Operation].
   *  Specifying an explicit operation ID simplifies determining
   *  whether the statements were executed in the event that the
   *  [UpdateDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdl] call is replayed,
   *  or the return value is otherwise lost: the [database][google.spanner.admin.database.v1.UpdateDatabaseDdlRequest.database] and
   *  `operation_id` fields can be combined to form the
   *  [name][google.longrunning.Operation.name] of the resulting
   *  [longrunning.Operation][google.longrunning.Operation]: `<database>/operations/<operation_id>`.
   *  `operation_id` should be unique within the database, and must be
   *  a valid identifier: `[a-z][a-z0-9_]*`. Note that
   *  automatically-generated operation IDs always begin with an
   *  underscore. If the named operation already exists,
   *  [UpdateDatabaseDdl][google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdl] returns
   *  `ALREADY_EXISTS`.
   */
  // const operationId = 'abc123'

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function updateDatabaseDdl() {
    // Construct request
    const request = {
      database,
      statements,
    };

    // Run request
    const [operation] = await databaseClient.updateDatabaseDdl(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  updateDatabaseDdl();
  // [END database_v1_generated_DatabaseAdmin_UpdateDatabaseDdl_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
