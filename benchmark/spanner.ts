/*!
 * Copyright 2020 Google LLC. All Rights Reserved.
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

import {grpc} from 'google-gax';
import {Database, Instance, SessionPool, Snapshot, Spanner} from '../src';
import * as mock from '../test/mockserver/mockspanner';
import {SimulatedExecutionTime} from '../test/mockserver/mockspanner';
import * as mockInstanceAdmin from '../test/mockserver/mockinstanceadmin';
import * as mockDatabaseAdmin from '../test/mockserver/mockdatabaseadmin';
import {google} from '../protos/protos';
import {SessionPoolOptions} from '../src/session-pool';
import protobuf = google.spanner.v1;
import * as yargs from 'yargs';

const server = new grpc.Server();
const selectSql = 'SELECT 1';
const updateSql = 'UPDATE FOO SET BAR=1 WHERE BAZ=2';
let port: number;
let spanner: Spanner;
let instance: Instance;
let dbCounter = 1;

/**
 * This file contains four standardized benchmark tests for Spanner using an
 * in-memory mock Spanner server. The simulated network latency and execution
 * times have been selected to be realistic, but at the same time also equal
 * and repeatable to different platforms for easy comparison.
 *
 * The four benchmarks are:
 * 1. burstRead: Execute a burst of read-only operations using single-use
 *    transactions. This is intended to benchmark the ability of the session
 *    pool to quickly create and hand out new sessions on demand.
 * 2. burstWrite: Execute a burst of read/write transactions containing one
 *    update statement. This is intended to benchmark the ability of the session
 *    pool to quickly create and hand out new write-prepared sessions on demand.
 * 3. burstReadAndWrite: Execute a burst of read and write operations in
 *    parallel. This is intended to benchmark the ability of the session pool
 *    to quickly create and hand out both read and write-prepared sessions in
 *    parallel on demand.
 * 4. steadyIncrease: Execute a stream of read operations that all hold on to
 *    the session for a while. This will force the session pool to grow
 *    step-by-step up to the max number of sessions in the pool. This is
 *    intended to benchmark the ability of the session pool to efficiently
 *    increase the number of sessions in the pool, but not necessarily in
 *    parallel.
 */
yargs
  .demand(1)
  .command('burstRead', 'Benchmarks a burst of read operations', {}, () =>
    runBurstRead().then(() => console.log('Benchmark finished'))
  )
  .example('node $0 burstRead')
  .command('burstWrite', 'Benchmarks a burst of write operations', {}, () =>
    runBurstWrite().then(() => console.log('Benchmark finished'))
  )
  .example('node $0 burstWrite')
  .command(
    'burstReadAndWrite',
    'Benchmarks a burst of read and write operations',
    {},
    () => runBurstReadAndWrite().then(() => console.log('Benchmark finished'))
  )
  .example('node $0 burstReadAndWrite')
  .command(
    'steadyIncrease',
    'Benchmarks getting max sessions sequentially',
    {},
    () => runSteadyIncrease().then(() => console.log('Benchmark finished'))
  )
  .example('node $0 steadyIncrease')
  .wrap(120)
  .recommendCommands()
  .strict()
  .help().argv;

async function runBurstRead() {
  await setup();
  await burstRead();
  shutdown();
}

async function runBurstWrite() {
  await setup();
  await burstWrite();
  shutdown();
}

async function runBurstReadAndWrite() {
  await setup();
  await burstReadAndWrite();
  shutdown();
}

async function runSteadyIncrease() {
  await setup();
  await steadyIncrease();
  shutdown();
}

function newTestDatabase(options?: SessionPoolOptions): Database {
  return instance.database(`database-${dbCounter++}`, options);
}

/**
 * Sets up the mocked benchmark server with standardized execution times and
 * network latency. Results for both a simple SELECT and a simple UPDATE
 * statement are mocked on the server.
 */
async function setup() {
  const NETWORK_LATENCY_TIME = 10;
  const BATCH_CREATE_SESSIONS_MIN_TIME = 10;
  const BATCH_CREATE_SESSIONS_RND_TIME = 10;
  const BEGIN_TRANSACTION_MIN_TIME = 1;
  const BEGIN_TRANSACTION_RND_TIME = 1;
  const COMMIT_TRANSACTION_MIN_TIME = 5;
  const COMMIT_TRANSACTION_RND_TIME = 5;
  const ROLLBACK_TRANSACTION_MIN_TIME = 1;
  const ROLLBACK_TRANSACTION_RND_TIME = 1;
  const EXECUTE_STREAMING_SQL_MIN_TIME = 10;
  const EXECUTE_STREAMING_SQL_RND_TIME = 10;
  const EXECUTE_SQL_MIN_TIME = 10;
  const EXECUTE_SQL_RND_TIME = 10;

  const spannerMock = mock.createMockSpanner(server);
  mockInstanceAdmin.createMockInstanceAdmin(server);
  mockDatabaseAdmin.createMockDatabaseAdmin(server);

  port = await new Promise((resolve, reject) => {
    server.bindAsync(
      '0.0.0.0:0',
      grpc.ServerCredentials.createInsecure(),
      (err, assignedPort) => {
        if (err) {
          reject(err);
        } else {
          resolve(assignedPort);
        }
      }
    );
  });
  server.start();

  spannerMock.setExecutionTime(
    spannerMock.batchCreateSessions,
    SimulatedExecutionTime.ofMinAndRandomExecTime(
      NETWORK_LATENCY_TIME + BATCH_CREATE_SESSIONS_MIN_TIME,
      BATCH_CREATE_SESSIONS_RND_TIME
    )
  );
  spannerMock.setExecutionTime(
    spannerMock.beginTransaction,
    SimulatedExecutionTime.ofMinAndRandomExecTime(
      NETWORK_LATENCY_TIME + BEGIN_TRANSACTION_MIN_TIME,
      BEGIN_TRANSACTION_RND_TIME
    )
  );
  spannerMock.setExecutionTime(
    spannerMock.commit,
    SimulatedExecutionTime.ofMinAndRandomExecTime(
      NETWORK_LATENCY_TIME + COMMIT_TRANSACTION_MIN_TIME,
      COMMIT_TRANSACTION_RND_TIME
    )
  );
  spannerMock.setExecutionTime(
    spannerMock.rollback,
    SimulatedExecutionTime.ofMinAndRandomExecTime(
      NETWORK_LATENCY_TIME + ROLLBACK_TRANSACTION_MIN_TIME,
      ROLLBACK_TRANSACTION_RND_TIME
    )
  );
  spannerMock.setExecutionTime(
    spannerMock.executeStreamingSql,
    SimulatedExecutionTime.ofMinAndRandomExecTime(
      NETWORK_LATENCY_TIME + EXECUTE_STREAMING_SQL_MIN_TIME,
      EXECUTE_STREAMING_SQL_RND_TIME
    )
  );
  spannerMock.setExecutionTime(
    spannerMock.executeSql,
    SimulatedExecutionTime.ofMinAndRandomExecTime(
      NETWORK_LATENCY_TIME + EXECUTE_SQL_MIN_TIME,
      EXECUTE_SQL_RND_TIME
    )
  );
  spannerMock.putStatementResult(
    selectSql,
    mock.StatementResult.resultSet(createSelect1ResultSet())
  );
  spannerMock.putStatementResult(
    updateSql,
    mock.StatementResult.updateCount(1)
  );

  spanner = new Spanner({
    projectId: 'fake-project-id',
    servicePath: 'localhost',
    port,
    sslCreds: grpc.credentials.createInsecure(),
  });
  // Gets a reference to a Cloud Spanner instance and database
  instance = spanner.instance('instance');
}

/**
 * Shutdown the benchmark server.
 */
function shutdown() {
  server.tryShutdown(() => {});
  console.log('Server closed');
}

/**
 * Executes the burstRead benchmark.
 */
async function burstRead() {
  console.log('Starting burstRead');
  const HOLD_SESSION_TIME = 100;
  const RND_WAIT_TIME_BETWEEN_REQUESTS = 10;
  const NUM_BURST_READ = 3200;
  // Value 'undefined' is used to warm up the compiler.
  for (const incStep of [undefined, 1, 10, 20, 25, 30, 40, 50, 100]) {
    const database = newTestDatabase({
      min: 100,
      max: 400,
      incStep: incStep,
    });
    const pool = database.pool_ as SessionPool;
    try {
      if (incStep) {
        console.time(`burstRead incStep ${incStep}`);
      }
      const promises = queueReadOperations(
        database,
        NUM_BURST_READ,
        RND_WAIT_TIME_BETWEEN_REQUESTS,
        HOLD_SESSION_TIME
      );
      await Promise.all(promises);
      if (incStep) {
        console.timeEnd(`burstRead incStep ${incStep}`);
        console.log(`Current session pool size: ${pool.size}`);
      }
    } finally {
      await database.close();
    }
  }
}

/**
 * Executes the burstWrite benchmark.
 */
async function burstWrite() {
  console.log('Starting burstWrite');
  const RND_WAIT_TIME_BETWEEN_REQUESTS = 10;
  const NUM_BURST_WRITE = 3200;
  // Value 'undefined' is used to warm up the compiler.
  for (const incStep of [undefined, 1, 10, 20, 25, 30, 40, 50, 100]) {
    const database = newTestDatabase({
      min: 100,
      max: 400,
      incStep: incStep,
    });
    const pool = database.pool_ as SessionPool;
    try {
      if (incStep) {
        console.time(`burstWrite incStep ${incStep}`);
      }
      const promises = queueWriteOperations(
        database,
        NUM_BURST_WRITE,
        RND_WAIT_TIME_BETWEEN_REQUESTS
      );
      await Promise.all(promises);
      if (incStep) {
        console.timeEnd(`burstWrite incStep ${incStep}`);
        console.log(`Current session pool size: ${pool.size}`);
        console.log(`Current num write sessions: ${pool.writes}`);
      }
    } finally {
      await database.close();
    }
  }
}

/**
 * Executes the burstReadAndWrite benchmark.
 */
async function burstReadAndWrite() {
  console.log('Starting burstReadAndWrite');
  const HOLD_SESSION_TIME = 100;
  const RND_WAIT_TIME_BETWEEN_REQUESTS = 10;
  const NUM_BURST_READ = 1600;
  const NUM_BURST_WRITE = 1600;
  // Value 'undefined' is used to warm up the compiler.
  for (const incStep of [undefined, 1, 10, 20, 25, 30, 40, 50, 100]) {
    const database = newTestDatabase({
      min: 100,
      max: 400,
      incStep: incStep,
    });
    const pool = database.pool_ as SessionPool;
    try {
      if (incStep) {
        console.time(`burstReadAndWrite incStep ${incStep}`);
      }
      const readPromises = queueReadOperations(
        database,
        NUM_BURST_READ,
        RND_WAIT_TIME_BETWEEN_REQUESTS,
        HOLD_SESSION_TIME
      );
      const writePromises = queueWriteOperations(
        database,
        NUM_BURST_WRITE,
        RND_WAIT_TIME_BETWEEN_REQUESTS
      );
      await Promise.all(readPromises.concat(writePromises));
      if (incStep) {
        console.timeEnd(`burstReadAndWrite incStep ${incStep}`);
        console.log(`Current session pool size: ${pool.size}`);
        console.log(`Current num write sessions: ${pool.writes}`);
      }
    } finally {
      await database.close();
    }
  }
}

/**
 * Executes the steadyIncrease benchmark.
 */
async function steadyIncrease() {
  console.log('Starting steadyIncrease');
  // Value 'undefined' is used to warm up the compiler.
  for (const incStep of [undefined, 1, 10, 20, 25, 30, 40, 50, 100]) {
    const database = newTestDatabase({
      min: 100,
      max: 400,
      incStep: incStep,
    });
    const pool = database.pool_ as SessionPool;
    const snapshots: Snapshot[] = [];
    try {
      if (incStep) {
        console.time(`steadyIncrease incStep ${incStep}`);
      }
      for (let i = 0; i < pool.options.max!; i++) {
        const [snapshot] = await database.getSnapshot();
        snapshots.unshift(snapshot);
      }
      for (const snapshot of snapshots) {
        snapshot.end();
      }
      if (incStep) {
        console.timeEnd(`steadyIncrease incStep ${incStep}`);
        console.log(`Current session pool size: ${pool.size}`);
      }
    } finally {
      await database.close();
    }
  }
}

/**
 * Generates and submits read operations in parallel to the mock benchmark
 * server.
 * @param database The database to submit the queries to
 * @param numRequests The number of read requests to submit.
 * @param waitBetweenRequests The time to wait between each read request. This
 *                            time will be used as the upper bound to get a
 *                            randomized value for each request to simulate
 *                            requests that come in at random intervals.
 * @param holdSessionTime The time that the transaction should hold on to the
 *                        session. This simulates the application performing
 *                        calculations or other operations on the data that have
 *                        been returned by Spanner. The time is used as an upper
 *                        bound to get a randomized value for each request.
 */
function queueReadOperations(
  database: Database,
  numRequests: number,
  waitBetweenRequests: number,
  holdSessionTime: number
): Promise<void>[] {
  const promises: Promise<void>[] = [];
  for (let run = 0; run < numRequests; run++) {
    promises.unshift(
      new Promise<void>(resolve => {
        setTimeout(async () => {
          let p: Promise<void>;
          database
            .runStream(selectSql)
            .on('data', async () => {
              p = new Promise<void>(r => {
                setTimeout(() => {
                  r();
                }, Math.random() * holdSessionTime);
              });
            })
            .on('end', async () => {
              await p;
              resolve();
            });
        }, Math.random() * waitBetweenRequests);
      })
    );
  }
  return promises;
}

/**
 * Generates and submits write operations in parallel to the mock benchmark
 * server.
 * @param database The database to submit the updates to
 * @param numRequests The number of write requests to submit.
 * @param waitBetweenRequests The time to wait between each write request. This
 *                            time will be used as the upper bound to get a
 *                            randomized value for each request to simulate
 *                            requests that come in at random intervals.
 */
function queueWriteOperations(
  database: Database,
  numRequests: number,
  waitBetweenRequests: number
): Promise<void>[] {
  const promises: Promise<void>[] = [];
  for (let run = 0; run < numRequests; run++) {
    promises.unshift(
      new Promise<void>(resolve => {
        setTimeout(() => {
          database.runTransaction((err, tx) => {
            tx!
              .runUpdate(updateSql)
              .then(() => tx!.commit().then(() => resolve()));
          });
        }, Math.random() * waitBetweenRequests);
      })
    );
  }
  return promises;
}

/** Creates a simple result set for SELECT 1. */
function createSelect1ResultSet(): protobuf.ResultSet {
  const fields = [
    protobuf.StructType.Field.create({
      name: 'NUM',
      type: protobuf.Type.create({code: protobuf.TypeCode.INT64}),
    }),
  ];
  const metadata = new protobuf.ResultSetMetadata({
    rowType: new protobuf.StructType({
      fields,
    }),
  });
  return protobuf.ResultSet.create({
    metadata,
    rows: [{values: [{stringValue: '1'}]}],
  });
}
