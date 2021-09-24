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
  // [START instance_v1_generated_InstanceAdmin_ListInstances_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The name of the project for which a list of instances is
   *  requested. Values are of the form `projects/<project>`.
   */
  // const parent = 'abc123'
  /**
   *  Number of instances to be returned in the response. If 0 or less, defaults
   *  to the server's maximum allowed page size.
   */
  // const pageSize = 1234
  /**
   *  If non-empty, `page_token` should contain a
   *  [next_page_token][google.spanner.admin.instance.v1.ListInstancesResponse.next_page_token] from a
   *  previous [ListInstancesResponse][google.spanner.admin.instance.v1.ListInstancesResponse].
   */
  // const pageToken = 'abc123'
  /**
   *  An expression for filtering the results of the request. Filter rules are
   *  case insensitive. The fields eligible for filtering are:
   *    * `name`
   *    * `display_name`
   *    * `labels.key` where key is the name of a label
   *  Some examples of using filters are:
   *    * `name:*` --> The instance has a name.
   *    * `name:Howl` --> The instance's name contains the string "howl".
   *    * `name:HOWL` --> Equivalent to above.
   *    * `NAME:howl` --> Equivalent to above.
   *    * `labels.env:*` --> The instance has the label "env".
   *    * `labels.env:dev` --> The instance has the label "env" and the value of
   *                         the label contains the string "dev".
   *    * `name:howl labels.env:dev` --> The instance's name contains "howl" and
   *                                   it has the label "env" with its value
   *                                   containing "dev".
   */
  // const filter = 'abc123'

  // Imports the Instance library
  const {InstanceAdminClient} = require('instance').v1;

  // Instantiates a client
  const instanceClient = new InstanceAdminClient();

  async function listInstances() {
    // Construct request
    const request = {
      parent,
    };

    // Run request
    const iterable = await instanceClient.listInstancesAsync(request);
    for await (const response of iterable) {
      console.log(response);
    }
  }

  listInstances();
  // [END instance_v1_generated_InstanceAdmin_ListInstances_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
