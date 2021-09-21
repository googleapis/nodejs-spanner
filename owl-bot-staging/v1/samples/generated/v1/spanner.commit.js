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

function main(session) {
  // [START spanner_commit_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The session in which the transaction to be committed is running.
   */
  // const session = 'abc123'
  /**
   *  Commit a previously-started transaction.
   */
  // const transactionId = 'Buffer.from('string')'
  /**
   *  Execute mutations in a temporary transaction. Note that unlike
   *  commit of a previously-started transaction, commit with a
   *  temporary transaction is non-idempotent. That is, if the
   *  `CommitRequest` is sent to Cloud Spanner more than once (for
   *  instance, due to retries in the application, or in the
   *  transport library), it is possible that the mutations are
   *  executed more than once. If this is undesirable, use
   *  [BeginTransaction][google.spanner.v1.Spanner.BeginTransaction] and
   *  [Commit][google.spanner.v1.Spanner.Commit] instead.
   */
  // const singleUseTransaction = ''
  /**
   *  The mutations to be executed when this transaction commits. All
   *  mutations are applied atomically, in the order they appear in
   *  this list.
   */
  // const mutations = 1234
  /**
   *  If `true`, then statistics related to the transaction will be included in
   *  the [CommitResponse][google.spanner.v1.CommitResponse.commit_stats]. Default value is
   *  `false`.
   */
  // const returnCommitStats = true
  /**
   *  Common options for this request.
   */
  // const requestOptions = ''

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function commit() {
    // Construct request
    const request = {
      session,
    };

    // Run request
    const response = await spannerClient.commit(request);
    console.log(response);
  }

  commit();
  // [END spanner_commit_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
