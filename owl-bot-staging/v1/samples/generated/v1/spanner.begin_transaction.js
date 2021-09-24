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

function main(session, options) {
  // [START spanner_v1_generated_Spanner_BeginTransaction_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The session in which the transaction runs.
   */
  // const session = 'abc123'
  /**
   *  Required. Options for the new transaction.
   */
  // const options = ''
  /**
   *  Common options for this request.
   *  Priority is ignored for this request. Setting the priority in this
   *  request_options struct will not do anything. To set the priority for a
   *  transaction, set it on the reads and writes that are part of this
   *  transaction instead.
   */
  // const requestOptions = ''

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function beginTransaction() {
    // Construct request
    const request = {
      session,
      options,
    };

    // Run request
    const response = await spannerClient.beginTransaction(request);
    console.log(response);
  }

  beginTransaction();
  // [END spanner_v1_generated_Spanner_BeginTransaction_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
