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

function main(instance, fieldMask) {
  // [START instance_update_instance_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The instance to update, which must always include the instance
   *  name.  Otherwise, only fields mentioned in [field_mask][google.spanner.admin.instance.v1.UpdateInstanceRequest.field_mask] need be included.
   */
  // const instance = ''
  /**
   *  Required. A mask specifying which fields in [Instance][google.spanner.admin.instance.v1.Instance] should be updated.
   *  The field mask must always be specified; this prevents any future fields in
   *  [Instance][google.spanner.admin.instance.v1.Instance] from being erased accidentally by clients that do not know
   *  about them.
   */
  // const fieldMask = ''

  // Imports the Instance library
  const {InstanceAdminClient} = require('instance').v1;

  // Instantiates a client
  const instanceClient = new InstanceAdminClient();

  async function updateInstance() {
    // Construct request
    const request = {
      instance,
      fieldMask,
    };

    // Run request
    const [operation] = await instanceClient.updateInstance(request);
    const [response] = await operation.promise();
    console.log(response);
  }

  updateInstance();
  // [END instance_update_instance_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
