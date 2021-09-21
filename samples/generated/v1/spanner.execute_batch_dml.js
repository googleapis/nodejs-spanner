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

function main(session, transaction, statements, seqno) {
  // [START spanner_execute_batch_dml_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  /**
   *  Required. The session in which the DML statements should be performed.
   */
  // const session = 'abc123'
  /**
   *  Required. The transaction to use. Must be a read-write transaction.
   *  To protect against replays, single-use transactions are not supported. The
   *  caller must either supply an existing transaction ID or begin a new
   *  transaction.
   */
  // const transaction = ''
  /**
   *  Required. The list of statements to execute in this batch. Statements are executed
   *  serially, such that the effects of statement `i` are visible to statement
   *  `i+1`. Each statement must be a DML statement. Execution stops at the
   *  first failed statement; the remaining statements are not executed.
   *  Callers must provide at least one statement.
   */
  // const statements = 1234
  /**
   *  Required. A per-transaction sequence number used to identify this request. This field
   *  makes each request idempotent such that if the request is received multiple
   *  times, at most one will succeed.
   *  The sequence number must be monotonically increasing within the
   *  transaction. If a request arrives for the first time with an out-of-order
   *  sequence number, the transaction may be aborted. Replays of previously
   *  handled requests will yield the same response as the first execution.
   */
  // const seqno = 1234
  /**
   *  Common options for this request.
   */
  // const requestOptions = ''

  // Imports the Spanner library
  const {SpannerClient} = require('@google-cloud/spanner').v1;

  // Instantiates a client
  const spannerClient = new SpannerClient();

  async function executeBatchDml() {
    // Construct request
    const request = {
      session,
      transaction,
      statements,
      seqno,
    };

    // Run request
    const response = await spannerClient.executeBatchDml(request);
    console.log(response);
  }

  executeBatchDml();
  // [END spanner_execute_batch_dml_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
