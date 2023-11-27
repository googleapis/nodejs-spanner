/*!
 * Copyright 2023 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const closeInactiveTransactionsLongRunningTrue = [];
const closeInactiveTransactionsLongRunningFalse = [];
const closeInactiveTransactionsRecyclingTrue = [];
const closeInactiveTransactionsRecyclingFalse = [];
const transaction_times = [];

async function longRunningTransactions(
  instanceId,
  databaseId,
  projectId,
  closeInactiveTransactions,
  logging
) {
  const startTime = Date.now();
  // eslint-disable-next-line node/no-extraneous-require
  const {Spanner} = require('../build/src/index.js');
  const spanner = new Spanner({
    projectId,
  });

  const {
    _setLongRunningBackgroundTaskFrequency,
    _setLongRunningTransactionThreshold,
  } = require('../build/src/common');

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const sessionPoolOptions = {
    acquireTimeout: Infinity,
    concurrency: Infinity,
    fail: false,
    idlesAfter: 10,
    keepAlive: 30,
    labels: {},
    max: 100,
    maxIdle: 1,
    min: 25,
    incStep: 25,
    closeInactiveTransactions: closeInactiveTransactions,
    logging: logging,
    databaseRole: null,
  };
  const database = instance.database(databaseId, sessionPoolOptions);
  _setLongRunningTransactionThreshold(1000 * 2);
  _setLongRunningBackgroundTaskFrequency(1000 * 5);

  async function batchScript() {
    const [transaction] = await database.createBatchTransaction();

    const query = {
      sql: 'SELECT * FROM Singers',
    };

    const partitions = [];
    await transaction.createQueryPartitions(query);
    const promises = [];
    partitions.forEach(partition => {
      promises.push(transaction.execute(partition));
    });
    await Promise.all(promises).then(() => {
      transaction.close();
    });
    await new Promise(r => setTimeout(r, 1000 * 10));
    const operationTime = Date.now() - startTime;
    transaction_times.push(operationTime);
  }

  const promises = [];
  for (let i = 0; i < 150; i++) {
    promises.push(batchScript());
  }

  await Promise.all(promises)
    .then(() => {
      const operationTime = Date.now() - startTime;
      if (closeInactiveTransactions) {
        closeInactiveTransactionsLongRunningTrue.push(operationTime);
      } else {
        closeInactiveTransactionsLongRunningFalse.push(operationTime);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

async function recycledTransactions(
  instanceId,
  databaseId,
  projectId,
  closeInactiveTransactions,
  logging
) {
  const startTime = Date.now();
  // eslint-disable-next-line node/no-extraneous-require
  const {Spanner} = require('../build/src/index.js');
  const spanner = new Spanner({
    projectId,
  });

  const {
    _setLongRunningBackgroundTaskFrequency,
    _setLongRunningTransactionThreshold,
  } = require('../build/src/common');

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const sessionPoolOptions = {
    acquireTimeout: Infinity,
    concurrency: Infinity,
    fail: false,
    idlesAfter: 10,
    keepAlive: 30,
    labels: {},
    max: 2,
    maxIdle: 1,
    min: 2,
    incStep: 25,
    closeInactiveTransactions: closeInactiveTransactions,
    logging: logging,
    databaseRole: null,
  };
  const database = instance.database(databaseId, sessionPoolOptions);
  _setLongRunningTransactionThreshold(1000 * 2);
  _setLongRunningBackgroundTaskFrequency(1000);

  function runTransaction() {
    return new Promise((resolve, reject) => {
      database.getSnapshot(async (err, transaction) => {
        if (err) {
          console.error(err);
          reject(err); // Reject the promise in case of an error
          return;
        }

        transaction.run('SELECT 1', async () => {
          await new Promise(r => setTimeout(r, 1000 * 10));
          if (!closeInactiveTransactions) {
            transaction.end();
          }
          resolve(); // Resolve the promise when this transaction is complete
          const operationTime = Date.now() - startTime;
          transaction_times.push(operationTime);
        });
      });
    });
  }

  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(runTransaction());
  }

  await Promise.all(promises)
    .then(() => {
      const operationTime = Date.now() - startTime;
      if (closeInactiveTransactions) {
        closeInactiveTransactionsRecyclingTrue.push(operationTime);
      } else {
        closeInactiveTransactionsRecyclingFalse.push(operationTime);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function calculatePercentiles(latencies) {
  // Step 1: Sort the array
  const sortedLatencies = latencies.slice().sort((a, b) => a - b);

  // Step 2: Calculate p50 (50th percentile)
  const p50Index = Math.floor(0.5 * sortedLatencies.length);
  const p50Latency = sortedLatencies[p50Index];

  // Step 3: Calculate p90 (90th percentile)
  const p90Index = Math.floor(0.9 * sortedLatencies.length);
  const p90Latency = sortedLatencies[p90Index];

  return {
    p50: p50Latency,
    p90: p90Latency,
  };
}

async function runSequentially() {
  for (let i = 0; i < 25; i++) {
    // change function and options as per requirement
    await longRunningTransactions(
      'astha-testing',
      'abcd',
      'span-cloud-testing',
      false,
      false
    );
  }

  // After all runs are complete, print the contents of closeInactiveTransactionsLongRunningFalse
  console.log('Results:');
  closeInactiveTransactionsLongRunningFalse.forEach(val => {
    console.log(val);
  });
  closeInactiveTransactionsLongRunningTrue.forEach(val => {
    console.log(val);
  });
  closeInactiveTransactionsRecyclingFalse.forEach(val => {
    console.log(val);
  });
  closeInactiveTransactionsRecyclingTrue.forEach(val => {
    console.log(val);
  });
}

runSequentially()
  .then(() => {
    const percentiles = calculatePercentiles(transaction_times);
    console.log(`p50 Latency: ${percentiles.p50}`);
    console.log(`p90 Latency: ${percentiles.p90}`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
