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

function main(database) {
  // [START spanner_v1_generated_Spanner_ListSessions_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The database in which to list sessions.
   */
  // const database = 'abc123'
  /**
   *  Number of sessions to be returned in the response. If 0 or less, defaults
   *  to the server's maximum allowed page size.
   */
  // const pageSize = 1234
  /**
   *  If non-empty, `page_token` should contain a
   *  [next_page_token][google.spanner.v1.ListSessionsResponse.next_page_token] from a previous
   *  [ListSessionsResponse][google.spanner.v1.ListSessionsResponse].
   */
  // const pageToken = 'abc123'
  /**
   *  An expression for filtering the results of the request. Filter rules are
   *  case insensitive. The fields eligible for filtering are:
   *    * `labels.key` where key is the name of a label
   *  Some examples of using filters are:
   *    * `labels.env:*` --> The session has the label "env".
   *    * `labels.env:dev` --> The session has the label "env" and the value of
   *                         the label contains the string "dev".
   */
  // const filter = 'abc123'

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function listSessions() {
    // Construct request
    const request = {
      database,
    };

    // Run request
    const iterable = await spannerClient.listSessionsAsync(request);
    for await (const response of iterable) {
        console.log(response);
    }
  }

  listSessions();
  // [END spanner_v1_generated_Spanner_ListSessions_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
