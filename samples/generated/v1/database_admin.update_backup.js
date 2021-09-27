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

function main(backup, updateMask) {
  // [START spanner_v1_generated_DatabaseAdmin_UpdateBackup_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The backup to update. `backup.name`, and the fields to be updated
   *  as specified by `update_mask` are required. Other fields are ignored.
   *  Update is only supported for the following fields:
   *   * `backup.expire_time`.
   */
  // const backup = ''
  /**
   *  Required. A mask specifying which fields (e.g. `expire_time`) in the
   *  Backup resource should be updated. This mask is relative to the Backup
   *  resource, not to the request message. The field mask must always be
   *  specified; this prevents any future fields from being erased accidentally
   *  by clients that do not know about them.
   */
  // const updateMask = ''

  // Imports the Database library
  const {DatabaseAdminClient} = require('database').v1;

  // Instantiates a client
  const databaseClient = new DatabaseAdminClient();

  async function updateBackup() {
    // Construct request
    const request = {
      backup,
      updateMask,
    };

    // Run request
    const response = await databaseClient.updateBackup(request);
    console.log(response);
  }

  updateBackup();
  // [END spanner_v1_generated_DatabaseAdmin_UpdateBackup_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
