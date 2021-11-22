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
  // [START spanner_v1_generated_Spanner_CreateSession_async]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The database in which the new session is created.
   */
  // const database = 'abc123'
  /**
   *  The session to create.
   */
  // const session = ''

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function createSession() {
    // Construct request
    const request = {
      database,
    };

    // Run request
    const response = await spannerClient.createSession(request);
    console.log(response);
  }

  createSession();
  // [END spanner_v1_generated_Spanner_CreateSession_async]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
