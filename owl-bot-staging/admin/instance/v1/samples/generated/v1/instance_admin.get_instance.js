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

function main(name) {
  // [START instance_v1_generated_InstanceAdmin_GetInstance_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The name of the requested instance. Values are of the form
   *  `projects/<project>/instances/<instance>`.
   */
  // const name = 'abc123'
  /**
   *  If field_mask is present, specifies the subset of [Instance][google.spanner.admin.instance.v1.Instance] fields that
   *  should be returned.
   *  If absent, all [Instance][google.spanner.admin.instance.v1.Instance] fields are returned.
   */
  // const fieldMask = ''

  // Imports the Instance library
  const {InstanceAdminClient} = require('instance').v1;

  // Instantiates a client
  const instanceClient = new InstanceAdminClient();

  async function getInstance() {
    // Construct request
    const request = {
      name,
    };

    // Run request
    const response = await instanceClient.getInstance(request);
    console.log(response);
  }

  getInstance();
  // [END instance_v1_generated_InstanceAdmin_GetInstance_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
