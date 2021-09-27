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

function main(parent) {
  // [START spanner_v1_generated_InstanceAdmin_ListInstanceConfigs_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The name of the project for which a list of supported instance
   *  configurations is requested. Values are of the form
   *  `projects/<project>`.
   */
  // const parent = 'abc123'
  /**
   *  Number of instance configurations to be returned in the response. If 0 or
   *  less, defaults to the server's maximum allowed page size.
   */
  // const pageSize = 1234
  /**
   *  If non-empty, `page_token` should contain a
   *  [next_page_token][google.spanner.admin.instance.v1.ListInstanceConfigsResponse.next_page_token]
   *  from a previous [ListInstanceConfigsResponse][google.spanner.admin.instance.v1.ListInstanceConfigsResponse].
   */
  // const pageToken = 'abc123'

  // Imports the Instance library
  const {InstanceAdminClient} = require('instance').v1;

  // Instantiates a client
  const instanceClient = new InstanceAdminClient();

  async function listInstanceConfigs() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = await instanceClient.listInstanceConfigsAsync(request);
    for await (const response of iterable) {
      console.log(response);
    }
  }

  listInstanceConfigs();
  // [END spanner_v1_generated_InstanceAdmin_ListInstanceConfigs_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
