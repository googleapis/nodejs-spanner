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

function main(parent, createStatement) {
  // [START database_create_database_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The name of the instance that will serve the new database.
   *  Values are of the form `projects/<project>/instances/<instance>`.
   */
  // const parent = 'abc123'
  /**
   *  Required. A `CREATE DATABASE` statement, which specifies the ID of the
   *  new database.  The database ID must conform to the regular expression
   *  `[a-z][a-z0-9_\-]*[a-z0-9]` and be between 2 and 30 characters in length.
   *  If the database ID is a reserved word or if it contains a hyphen, the
   *  database ID must be enclosed in backticks (`` ` ``).
   */
  // const createStatement = 'abc123'
  /**
   *  Optional. A list of DDL statements to run inside the newly created
   *  database. Statements can create tables, indexes, etc. These
   *  statements execute atomically with the creation of the database:
   *  if there is an error in any statement, the database is not created.
   */
  // const extraStatements = 'abc123'
  /**
   *  Optional. The encryption configuration for the database. If this field is not
   *  specified, Cloud Spanner will encrypt/decrypt all data at rest using
   *  Google default encryption.
   */
  // const encryptionConfig = ''

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function createDatabase() {
    // Construct request
    const request = {
      parent,
      createStatement,
    };

    // Run request
    const [operation] = await databaseClient.createDatabase(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  createDatabase();
  // [END database_create_database_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
