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

function main(parent, instanceId, instance) {
  // [START spanner_v1_generated_InstanceAdmin_CreateInstance_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The name of the project in which to create the instance. Values
   *  are of the form `projects/<project>`.
   */
  // const parent = 'abc123'
  /**
   *  Required. The ID of the instance to create.  Valid identifiers are of the
   *  form `[a-z][-a-z0-9]*[a-z0-9]` and must be between 2 and 64 characters in
   *  length.
   */
  // const instanceId = 'abc123'
  /**
   *  Required. The instance to create.  The name may be omitted, but if
   *  specified must be `<parent>/instances/<instance_id>`.
   */
  // const instance = ''

  // Imports the Instance library
  const {InstanceAdminClient} = require('instance').v1;

  // Instantiates a client
  const instanceClient = new InstanceAdminClient();

  async function createInstance() {
    // Construct request
    const request = {
      parent,
      instanceId,
      instance,
    };

    // Run request
    const [operation] = await instanceClient.createInstance(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  createInstance();
  // [END spanner_v1_generated_InstanceAdmin_CreateInstance_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
