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

import * as assert from 'assert';
import * as grpc from 'grpc';
import {status} from 'grpc';
import {Database, Instance, SessionPool, Snapshot, Spanner} from '../src';
import * as mock from './mockserver/mockspanner';
import {MockError, SimulatedExecutionTime} from './mockserver/mockspanner';
import * as mockInstanceAdmin from './mockserver/mockinstanceadmin';
import {TEST_INSTANCE_NAME} from './mockserver/mockinstanceadmin';
import * as mockDatabaseAdmin from './mockserver/mockdatabaseadmin';
import * as sinon from 'sinon';
import {google} from '../protos/protos';
import {types} from '../src/session';
import {ExecuteSqlRequest, RunResponse} from '../src/transaction';
import {PartialResultStream, Row} from '../src/partial-result-stream';
import {
  SessionLeakError,
  SessionPoolExhaustedError,
  SessionPoolOptions,
} from '../src/session-pool';
import CreateInstanceMetadata = google.spanner.admin.instance.v1.CreateInstanceMetadata;
import {Json} from '../src/codec';

function numberToEnglishWord(num: number): string {
  switch (num) {
    case 1:
      return 'One';
    case 2:
      return 'Two';
    case 3:
      return 'Three';
    default:
      throw new Error(`Unknown or unsupported number: ${num}`);
  }
}

describe('Spanner with mock server', () => {
  let sandbox: sinon.SinonSandbox;
  const selectSql = 'SELECT NUM, NAME FROM NUMBERS';
  const invalidSql = 'SELECT * FROM FOO';
  const insertSql = `INSERT INTO NUMBER (NUM, NAME) VALUES (4, 'Four')`;
  const fooNotFoundErr = Object.assign(new Error('Table FOO not found'), {
    code: grpc.status.NOT_FOUND,
  });
  const server = new grpc.Server();
  const spannerMock = mock.createMockSpanner(server);
  mockInstanceAdmin.createMockInstanceAdmin(server);
  mockDatabaseAdmin.createMockDatabaseAdmin(server);
  let spanner: Spanner;
  let instance: Instance;
  let dbCounter = 1;

  function newTestDatabase(options?: SessionPoolOptions): Database {
    return instance.database(`database-${dbCounter++}`, options);
  }

  before(() => {
    sandbox = sinon.createSandbox();
    const port = server.bind(
      '0.0.0.0:0',
      grpc.ServerCredentials.createInsecure()
    );
    server.start();
    spannerMock.putStatementResult(
      selectSql,
      mock.StatementResult.resultSet(mock.createSimpleResultSet())
    );
    spannerMock.putStatementResult(
      invalidSql,
      mock.StatementResult.error(fooNotFoundErr)
    );
    spannerMock.putStatementResult(
      insertSql,
      mock.StatementResult.updateCount(1)
    );

    // TODO(loite): Enable when SPANNER_EMULATOR_HOST is supported.
    // Set environment variable for SPANNER_EMULATOR_HOST to the mock server.
    // process.env.SPANNER_EMULATOR_HOST = `localhost:${port}`;
    spanner = new Spanner({
      projectId: 'fake-project-id',
      servicePath: 'localhost',
      port,
      sslCreds: grpc.credentials.createInsecure(),
    });
    // Gets a reference to a Cloud Spanner instance and database
    instance = spanner.instance('instance');
  });

  after(() => {
    server.tryShutdown(() => {});
    delete process.env.SPANNER_EMULATOR_HOST;
    sandbox.restore();
  });

  describe('basics', () => {
    it('should return different database instances when the same database is requested twice with different session pool options', async () => {
      const dbWithDefaultOptions = newTestDatabase();
      const dbWithWriteSessions = instance.database(dbWithDefaultOptions.id!, {
        writes: 1.0,
      });
      assert.notStrictEqual(dbWithDefaultOptions, dbWithWriteSessions);
    });

    it('should execute query', async () => {
      // The query to execute
      const query = {
        sql: selectSql,
      };
      const database = newTestDatabase();
      try {
        const [rows] = await database.run(query);
        assert.strictEqual(rows.length, 3);
        let i = 0;
        (rows as Row[]).forEach(row => {
          i++;
          const [numCol, nameCol] = row;
          assert.strictEqual(numCol.name, 'NUM');
          assert.strictEqual(numCol.value.valueOf(), i);
          assert.strictEqual(nameCol.name, 'NAME');
          assert.strictEqual(nameCol.value.valueOf(), numberToEnglishWord(i));
        });
      } finally {
        await database.close();
      }
    });

    it('should return an array of json objects', async () => {
      const database = newTestDatabase();
      try {
        const [rows] = await database.run({sql: selectSql, json: true});
        assert.strictEqual(rows.length, 3);
        let i = 0;
        (rows as Json[]).forEach(row => {
          i++;
          assert.strictEqual(row.NUM, i);
          assert.strictEqual(row.NAME, numberToEnglishWord(i));
        });
      } finally {
        await database.close();
      }
    });

    it('should execute update', async () => {
      const update = {
        sql: insertSql,
      };
      const database = newTestDatabase();
      try {
        const updated = await executeSimpleUpdate(database, update);
        assert.deepStrictEqual(updated, [1]);
      } finally {
        await database.close();
      }
    });

    it('should execute queries in parallel', async () => {
      // The query to execute
      const query = {
        sql: selectSql,
      };
      const database = newTestDatabase();
      try {
        const pool = database.pool_ as SessionPool;
        const promises: Array<Promise<RunResponse>> = [];
        for (let i = 0; i < 10; i++) {
          promises.push(database.run(query));
        }
        await Promise.all(promises);
        assert.ok(
          pool.size >= 1 && pool.size <= 10,
          'Pool size should be between 1 and 10'
        );
      } finally {
        await database.close();
      }
    });

    it('should execute updates in parallel', async () => {
      spannerMock.freeze();
      const update = {
        sql: insertSql,
      };
      const database = newTestDatabase();
      try {
        const pool = database.pool_ as SessionPool;
        const promises: Array<Promise<number | number[]>> = [];
        for (let i = 0; i < 10; i++) {
          promises.push(executeSimpleUpdate(database, update));
        }
        spannerMock.unfreeze();
        await Promise.all(promises);
        assert.ok(
          pool.size >= 1 && pool.size <= 10,
          'Pool size should be between 1 and 10'
        );
      } finally {
        await database.close();
      }
    });

    it('should retry UNAVAILABLE from executeStreamingSql with a callback', done => {
      const database = newTestDatabase();
      const err = {
        message: 'Temporary unavailable',
        code: status.UNAVAILABLE,
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      database.run(selectSql, (err, rows) => {
        assert.ifError(err);
        assert.strictEqual(rows!.length, 3);
        database
          .close()
          // This will cause done to be called with an error and fail the test.
          .catch(done)
          .then(() => done());
      });
    });

    it('should not retry non-retryable error from executeStreamingSql with a callback', done => {
      const database = newTestDatabase();
      const err = {
        message: 'Non-retryable error',
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      database.run(selectSql, (err, _) => {
        assert.ok(err, 'Missing expected error');
        assert.strictEqual(err!.message, '2 UNKNOWN: Non-retryable error');
        database
          .close()
          .catch(done)
          .then(() => done());
      });
    });

    it('should emit non-retryable error to runStream', done => {
      const database = newTestDatabase();
      const err = {
        message: 'Test error',
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      const rows: Row[] = [];
      const stream = database.runStream(selectSql);
      stream
        .on('error', err => {
          assert.strictEqual(err.message, '2 UNKNOWN: Test error');
          database
            .close()
            .catch(done)
            .then(() => done());
        })
        .on('data', row => rows.push(row))
        .on('end', () => {
          if (rows.length) {
            assert.fail('Should not receive data');
          }
          assert.fail('Missing expected error');
          done();
        });
    });

    it('should retry UNAVAILABLE from executeStreamingSql', async () => {
      const database = newTestDatabase();
      const err = {
        message: 'Temporary unavailable',
        code: status.UNAVAILABLE,
        details: 'Transient error',
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      try {
        const [rows] = await database.run(selectSql);
        assert.strictEqual(rows.length, 3);
      } finally {
        await database.close();
      }
    });

    it('should not retry non-retryable errors from executeStreamingSql', async () => {
      const database = newTestDatabase();
      const err = {
        message: 'Test error',
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      try {
        await database.run(selectSql);
        assert.fail('missing expected error');
      } catch (e) {
        assert.strictEqual(e.message, '2 UNKNOWN: Test error');
      } finally {
        await database.close();
      }
    });

    describe('PartialResultStream', () => {
      const streamIndexes = [1, 2];
      streamIndexes.forEach(index => {
        it('should retry UNAVAILABLE during streaming', async () => {
          const database = newTestDatabase();
          const err = {
            message: 'Temporary unavailable',
            code: status.UNAVAILABLE,
            streamIndex: index,
          } as MockError;
          spannerMock.setExecutionTime(
            spannerMock.executeStreamingSql,
            SimulatedExecutionTime.ofError(err)
          );
          const [rows] = await database.run(selectSql);
          assert.strictEqual(rows.length, 3);
          await database.close();
        });

        it('should not retry non-retryable error during streaming', async () => {
          const database = newTestDatabase();
          const err = {
            message: 'Test error',
            streamIndex: index,
          } as MockError;
          spannerMock.setExecutionTime(
            spannerMock.executeStreamingSql,
            SimulatedExecutionTime.ofError(err)
          );
          try {
            await database.run(selectSql);
            assert.fail('missing expected error');
          } catch (e) {
            assert.strictEqual(e.message, '2 UNKNOWN: Test error');
          }
          await database.close();
        });

        it('should retry UNAVAILABLE during streaming with a callback', done => {
          const database = newTestDatabase();
          const err = {
            message: 'Temporary unavailable',
            code: status.UNAVAILABLE,
            streamIndex: index,
          } as MockError;
          spannerMock.setExecutionTime(
            spannerMock.executeStreamingSql,
            SimulatedExecutionTime.ofError(err)
          );
          database.run(selectSql, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows!.length, 3);
            database
              .close()
              .catch(done)
              .then(() => done());
          });
        });

        it('should not retry non-retryable error during streaming with a callback', done => {
          const database = newTestDatabase();
          const err = {
            message: 'Non-retryable error',
            streamIndex: index,
          } as MockError;
          spannerMock.setExecutionTime(
            spannerMock.executeStreamingSql,
            SimulatedExecutionTime.ofError(err)
          );
          database.run(selectSql, (err, _) => {
            assert.ok(err, 'Missing expected error');
            assert.strictEqual(err!.message, '2 UNKNOWN: Non-retryable error');
            database
              .close()
              .catch(done)
              .then(() => done());
          });
        });

        it('should emit non-retryable error during streaming to stream', done => {
          const database = newTestDatabase();
          const err = {
            message: 'Non-retryable error',
            streamIndex: index,
          } as MockError;
          spannerMock.setExecutionTime(
            spannerMock.executeStreamingSql,
            SimulatedExecutionTime.ofError(err)
          );
          const receivedRows: Row[] = [];
          database
            .runStream(selectSql)
            .on('error', err => {
              assert.strictEqual(err.message, '2 UNKNOWN: Non-retryable error');
              assert.strictEqual(receivedRows.length, index);
              database
                .close()
                .catch(done)
                .then(() => done());
            })
            // We will receive data for the partial result sets that are
            // returned before the error occurs.
            .on('data', row => receivedRows.push(row))
            .on('end', () => {
              assert.fail('Missing expected error');
              done();
            });
        });
      });
    });

    it('should retry UNAVAILABLE from executeStreamingSql with multiple errors during streaming', async () => {
      const database = newTestDatabase();
      const errors: MockError[] = [];
      for (const index of [0, 1, 1, 2, 2]) {
        errors.push({
          message: 'Temporary unavailable',
          code: status.UNAVAILABLE,
          streamIndex: index,
        } as MockError);
      }
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofErrors(errors)
      );
      const [rows] = await database.run(selectSql);
      assert.strictEqual(rows.length, 3);
      await database.close();
    });

    it('should retry UNAVAILABLE on update', done => {
      const database = newTestDatabase();
      const err = {
        message: 'Temporary unavailable',
        code: status.UNAVAILABLE,
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      database.runTransaction((err, tx) => {
        assert.ifError(err);
        tx!.runUpdate(insertSql, (err, updateCount) => {
          assert.ifError(err);
          assert.strictEqual(updateCount, 1);
          tx!.commit().then(() => {
            database
              .close()
              .catch(done)
              .then(() => done());
          });
        });
      });
    });

    it('should not retry non-retryable error on update', done => {
      const database = newTestDatabase();
      const err = {
        message: 'Permanent error',
        // We need to specify a non-retryable error code to prevent the entire
        // transaction to retry. Not specifying an error code, will result in
        // an error with code UNKNOWN, which again will retry the transaction.
        code: status.INVALID_ARGUMENT,
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      let attempts = 0;
      database.runTransaction((err, tx) => {
        assert.ifError(err);
        attempts++;
        tx!.runUpdate(insertSql, (err, _) => {
          assert.ok(err, 'Missing expected error');
          assert.strictEqual(err!.code, status.INVALID_ARGUMENT);
          // Only the update RPC should be retried and not the entire
          // transaction.
          assert.strictEqual(attempts, 1);
          tx!
            .commit()
            .then(() => {
              database
                .close()
                .catch(done)
                .then(() => done());
            })
            .catch(done);
        });
      });
    });
  });

  describe('session-pool', () => {
    it('should execute table mutations without leaking sessions', async () => {
      const database = newTestDatabase();
      try {
        await database.table('foo').upsert({id: 1, name: 'bar'});
      } finally {
        await database.close();
      }
    });

    it('should throw an error with a stacktrace when leaking a session', async () => {
      await testLeakSession();
    });

    async function testLeakSession() {
      // The query to execute
      const query = {
        sql: selectSql,
      };
      const db = newTestDatabase();
      let transaction: Snapshot;
      await db
        .getSnapshot({strong: true, returnReadTimestamp: true})
        .then(([tx]) => {
          transaction = tx;
          return tx.run(query);
        })
        .then(([rows]) => {
          // Assert that we get all results from the server.
          assert.strictEqual(rows.length, 3);
          // Note that we do not call transaction.end(). This will cause a session leak.
        })
        .catch(reason => {
          assert.fail(reason);
        });
      await db
        .close()
        .then(() => {
          assert.fail('Missing expected SessionLeakError');
        })
        .catch((reason: SessionLeakError) => {
          assert.strictEqual(reason.name, 'SessionLeakError', reason);
          assert.strictEqual(reason.messages.length, 1);
          assert.ok(reason.messages[0].indexOf('testLeakSession') > -1);
        });
    }

    it('should reuse sessions', async () => {
      const database = newTestDatabase();
      try {
        await verifyReadSessionReuse(database);
      } finally {
        await database.close();
      }
    });

    it('should reuse sessions when fail=true', async () => {
      const db = newTestDatabase({
        max: 10,
        concurrency: 5,
        writes: 0.1,
        fail: true,
      });
      try {
        await verifyReadSessionReuse(db);
      } finally {
        await db.close();
      }
    });

    async function verifyReadSessionReuse(database: Database) {
      // The query to execute
      const query = {
        sql: selectSql,
      };
      const pool = database.pool_ as SessionPool;
      let sessionId = '';
      for (let i = 0; i < 10; i++) {
        const [rows] = await database.run(query);
        assert.strictEqual(rows.length, 3);
        rows.forEach(() => {});
        assert.strictEqual(pool.size, 1);
        if (i > 0) {
          assert.strictEqual(pool._inventory[types.ReadOnly][0].id, sessionId);
        }
        sessionId = pool._inventory[types.ReadOnly][0].id;
      }
    }

    it('should throw SessionPoolExhaustedError with stacktraces when pool is exhausted', async () => {
      await testSessionPoolExhaustedError();
    });

    async function testSessionPoolExhaustedError() {
      const database = newTestDatabase({
        max: 1,
        fail: true,
      });
      try {
        const [tx1] = await database.getSnapshot();
        try {
          await database.getSnapshot();
          assert.fail('missing expected exception');
        } catch (e) {
          assert.strictEqual(e.name, SessionPoolExhaustedError.name);
          const exhausted = e as SessionPoolExhaustedError;
          assert.ok(exhausted.messages);
          assert.strictEqual(exhausted.messages.length, 1);
          assert.ok(
            exhausted.messages[0].indexOf('testSessionPoolExhaustedError') > -1
          );
        }
        tx1.end();
      } finally {
        await database.close();
      }
    }

    it('should reuse sessions after executing invalid sql', async () => {
      // The query to execute
      const query = {
        sql: invalidSql,
      };
      const database = newTestDatabase();
      try {
        const pool = database.pool_ as SessionPool;
        for (let i = 0; i < 10; i++) {
          try {
            const [rows] = await database.run(query);
            assert.fail(`missing expected exception, got ${rows.length} rows`);
          } catch (e) {
            assert.strictEqual(
              e.message,
              `${grpc.status.NOT_FOUND} NOT_FOUND: ${fooNotFoundErr.message}`
            );
          }
        }
        assert.strictEqual(pool.size, 1);
      } finally {
        await database.close();
      }
    });

    it('should reuse sessions after executing streaming sql', async () => {
      // The query to execute
      const query = {
        sql: selectSql,
      };
      const database = newTestDatabase();
      try {
        const pool = database.pool_ as SessionPool;
        for (let i = 0; i < 10; i++) {
          const rowCount = await getRowCountFromStreamingSql(database, query);
          assert.strictEqual(rowCount, 3);
        }
        assert.strictEqual(pool.size, 1);
      } finally {
        await database.close();
      }
    });

    it('should reuse sessions after executing an invalid streaming sql', async () => {
      // The query to execute
      const query = {
        sql: invalidSql,
      };
      const database = newTestDatabase();
      try {
        const pool = database.pool_ as SessionPool;
        for (let i = 0; i < 10; i++) {
          try {
            const rowCount = await getRowCountFromStreamingSql(database, query);
            assert.fail(`missing expected exception, got ${rowCount}`);
          } catch (e) {
            assert.strictEqual(
              e.message,
              `${grpc.status.NOT_FOUND} NOT_FOUND: ${fooNotFoundErr.message}`
            );
          }
        }
        assert.strictEqual(pool.size, 1);
      } finally {
        await database.close();
      }
    });

    it('should reuse write sessions', async () => {
      const database = newTestDatabase();
      try {
        await verifyWriteSessionReuse(database);
      } finally {
        await database.close();
      }
    });

    it('should reuse write sessions when fail=true', async () => {
      const db = newTestDatabase({
        max: 10,
        concurrency: 5,
        writes: 0.1,
        fail: true,
      });
      try {
        await verifyWriteSessionReuse(db);
      } finally {
        await db.close();
      }
    });

    async function verifyWriteSessionReuse(database: Database) {
      const update = {
        sql: insertSql,
      };
      const pool = database.pool_ as SessionPool;
      for (let i = 0; i < 10; i++) {
        await executeSimpleUpdate(database, update);
        // The pool should not contain more sessions than the number of transactions that we have executed.
        // The exact number depends on the time needed to prepare new transactions, as checking in a read/write
        // transaction to the pool will cause the session to be prepared with a read/write transaction before it is added
        // to the list of available sessions.
        assert.ok(pool.size <= i + 1);
      }
    }

    it('should fail on session pool exhaustion and fail=true', async () => {
      const database = newTestDatabase({
        max: 1,
        fail: true,
      });
      let tx1;
      try {
        try {
          [tx1] = await database.getSnapshot();
          await database.getSnapshot();
          assert.fail('missing expected exception');
        } catch (e) {
          assert.strictEqual(e.message, 'No resources available.');
        }
      } finally {
        if (tx1) {
          tx1.end();
        }
        await database.close();
      }
    });

    it('should pre-fill session pool', async () => {
      const database = newTestDatabase({
        writes: 0.2,
        min: 100,
        max: 200,
      });
      const pool = database.pool_ as SessionPool;
      const expectedWrites = pool.options.min! * pool.options.writes!;
      const expectedReads = pool.options.min! - expectedWrites;
      assert.strictEqual(pool.size, expectedReads + expectedWrites);
      // Wait until all sessions have been created and prepared.
      const started = new Date().getTime();
      while (
        (pool.reads < expectedReads || pool.writes < expectedWrites) &&
        new Date().getTime() - started < 1000
      ) {
        await sleep(1);
      }
      assert.strictEqual(pool.reads, expectedReads);
      assert.strictEqual(pool.writes, expectedWrites);
      await database.close();
    });

    it('should use pre-filled session pool', async () => {
      const database = newTestDatabase({
        writes: 0.2,
        min: 100,
        max: 200,
      });
      const pool = database.pool_ as SessionPool;
      const expectedWrites = pool.options.min! * pool.options.writes!;
      const expectedReads = pool.options.min! - expectedWrites;
      // Start executing a query. This query should use one of the sessions that
      // has been pre-filled into the pool.
      const [rows] = await database.run(selectSql);
      assert.strictEqual(rows.length, 3);
      // Wait until all sessions have been created and prepared.
      const started = new Date().getTime();
      while (
        (pool.reads < expectedReads || pool.writes < expectedWrites) &&
        new Date().getTime() - started < 1000
      ) {
        await sleep(1);
      }
      assert.strictEqual(pool.reads, expectedReads);
      assert.strictEqual(pool.writes, expectedWrites);
      assert.strictEqual(pool.size, expectedReads + expectedWrites);
      await database.close();
    });

    it('should create new session when numWaiters >= pending', async () => {
      const database = newTestDatabase({
        min: 1,
        max: 10,
      });
      const pool = database.pool_ as SessionPool;
      // Start executing a query. This query should use the one session that is
      // being pre-filled into the pool.
      const promise1 = database.run(selectSql);
      // Start executing another query. This query should initiate the creation
      // of a new session.
      const promise2 = database.run(selectSql);
      const rows = await Promise.all([promise1, promise2]);
      assert.strictEqual(pool.size, 2);
      assert.strictEqual(rows[0][0].length, 3);
      assert.strictEqual(rows[1][0].length, 3);
      await database.close();
    });

    it('should use pre-filled write sessions', async () => {
      const database = newTestDatabase({
        writes: 0.2,
        min: 100,
        max: 200,
      });
      const pool = database.pool_ as SessionPool;
      const expectedWrites = pool.options.min! * pool.options.writes!;
      const expectedReads = pool.options.min! - expectedWrites;
      // Execute an update.
      const [count] = await database.runTransactionAsync(
        (transaction): Promise<[number]> => {
          return transaction.runUpdate(insertSql).then(updateCount => {
            transaction.commit();
            return updateCount;
          });
        }
      );
      assert.strictEqual(count, 1);
      // Wait until all sessions have been created and prepared.
      const started = new Date().getTime();
      while (
        (pool._pending > 0 || pool._pendingPrepare > 0) &&
        new Date().getTime() - started < 1000
      ) {
        await sleep(1);
      }
      assert.strictEqual(pool.reads, expectedReads);
      assert.strictEqual(pool.writes, expectedWrites);
      assert.strictEqual(pool.size, expectedReads + expectedWrites);
      await database.close();
    });
  });

  describe('transaction', () => {
    it('should retry on aborted query', async () => {
      let attempts = 0;
      const database = newTestDatabase();
      const rowCount = await database.runTransactionAsync(
        (transaction): Promise<number> => {
          if (!attempts) {
            spannerMock.abortTransaction(transaction);
          }
          attempts++;
          return transaction.run(selectSql).then(([rows]) => {
            let count = 0;
            rows.forEach(() => count++);
            return transaction.commit().then(_ => count);
          });
        }
      );
      assert.strictEqual(rowCount, 3);
      assert.strictEqual(attempts, 2);
      await database.close();
    });

    it('should retry on aborted query with callback', done => {
      let attempts = 0;
      const database = newTestDatabase();
      let rowCount = 0;
      database.runTransaction((err, transaction) => {
        assert.ifError(err);
        if (!attempts) {
          spannerMock.abortTransaction(transaction!);
        }
        attempts++;
        transaction!.run(selectSql, (err, rows) => {
          assert.ifError(err);
          rows.forEach(() => rowCount++);
          assert.strictEqual(rowCount, 3);
          assert.strictEqual(attempts, 2);
          transaction!
            .commit()
            .catch(done)
            .then(() => {
              database
                .close()
                .catch(done)
                .then(() => done());
            });
        });
      });
    });

    it('should retry on aborted update statement', async () => {
      let attempts = 0;
      const database = newTestDatabase();
      const [updated] = await database.runTransactionAsync(
        (transaction): Promise<number[]> => {
          if (!attempts) {
            spannerMock.abortTransaction(transaction);
          }
          attempts++;
          return transaction
            .runUpdate(insertSql)
            .then(updateCount => transaction.commit().then(_ => updateCount));
        }
      );
      assert.strictEqual(updated, 1);
      assert.strictEqual(attempts, 2);
      await database.close();
    });

    it('should retry on aborted update statement with callback', done => {
      let attempts = 0;
      const database = newTestDatabase();
      database.runTransaction((err, transaction) => {
        assert.ifError(err);
        if (!attempts) {
          spannerMock.abortTransaction(transaction!);
        }
        attempts++;
        transaction!.runUpdate(insertSql, (err, rowCount) => {
          assert.ifError(err);
          transaction!.commit((err, _) => {
            assert.ifError(err);
            assert.strictEqual(rowCount, 1);
            assert.strictEqual(attempts, 2);
            database
              .close()
              .catch(done)
              .then(() => done());
          });
        });
      });
    });

    it('should retry on aborted commit', async () => {
      let attempts = 0;
      const database = newTestDatabase();
      const [updated] = await database.runTransactionAsync(
        (transaction): Promise<number[]> => {
          return transaction.runUpdate(insertSql).then(updateCount => {
            if (!attempts) {
              spannerMock.abortTransaction(transaction);
            }
            attempts++;
            return transaction.commit().then(_ => updateCount);
          });
        }
      );
      assert.strictEqual(updated, 1);
      assert.strictEqual(attempts, 2);
      await database.close();
    });

    it('should throw DeadlineError', async () => {
      let attempts = 0;
      const database = newTestDatabase();
      try {
        await database.runTransactionAsync(
          {timeout: 1},
          (transaction): Promise<number[]> => {
            attempts++;
            return transaction.runUpdate(insertSql).then(updateCount => {
              // Always abort the transaction.
              spannerMock.abortTransaction(transaction);
              return transaction.commit().then(_ => updateCount);
            });
          }
        );
        assert.fail('missing expected DEADLINE_EXCEEDED error');
      } catch (e) {
        assert.strictEqual(
          e.code,
          status.DEADLINE_EXCEEDED,
          `Got unexpected error ${e} with code ${e.code}`
        );
        // The transaction should be tried at least once before timing out.
        assert.ok(attempts >= 1);
      }
      await database.close();
    });
  });

  describe('instanceAdmin', () => {
    it('should list instance configurations', async () => {
      const [configs] = await spanner.getInstanceConfigs();
      assert.strictEqual(configs.length, 1);
    });

    it('should return all instance configs in a stream', done => {
      let count = 0;
      const stream = spanner.getInstanceConfigsStream();
      stream
        .on('error', err => {
          assert.fail(err);
          done(err);
        })
        .on('data', () => count++)
        .on('end', () => {
          assert.strictEqual(count, 1);
          done();
        });
    });

    it('should list all instances', async () => {
      const [instances] = await spanner.getInstances();
      assert.strictEqual(instances.length, 2);
    });

    it('should filter instances', async () => {
      const [instances] = await spanner.getInstances({
        filter: `name:${TEST_INSTANCE_NAME}`,
      });
      assert.strictEqual(instances.length, 1);
    });

    it('should cap results', async () => {
      const [instances] = await spanner.getInstances({
        maxResults: 1,
      });
      assert.strictEqual(instances.length, 1);
    });

    it('should maximize api calls', async () => {
      const [instances] = await spanner.getInstances({
        maxApiCalls: 1,
        pageSize: 1,
      });
      assert.strictEqual(instances.length, 1);
    });

    it('should list all instances with a callback', done => {
      spanner.getInstances((err, instances) => {
        assert.ifError(err);
        assert.strictEqual(instances!.length, 2);
        done();
      });
    });

    it('should create an instance', async () => {
      const [createdInstance] = await spanner
        .createInstance('new-instance', {
          config: 'test-instance-config',
          nodes: 10,
        })
        .then(data => {
          const operation = data[1];
          return operation.promise() as Promise<
            [Instance, CreateInstanceMetadata, object]
          >;
        })
        .then(response => {
          return response;
        });
      assert.strictEqual(
        createdInstance.name,
        `projects/${spanner.projectId}/instances/new-instance`
      );
      assert.strictEqual(createdInstance.nodeCount, 10);
    });

    it('should create an instance using a callback', done => {
      spanner.createInstance(
        'new-instance',
        {
          config: 'test-instance-config',
          nodes: 10,
        },
        (err, resource, operation, _) => {
          assert.ifError(err);
          assert.ok(resource, 'no instance returned');
          assert.strictEqual(
            resource.formattedName_,
            `projects/${spanner.projectId}/instances/new-instance`
          );
          assert.ok(operation, 'no operation returned');
          operation.on('error', assert.ifError).on('complete', instance => {
            // Instance created successfully.
            assert.strictEqual(
              instance.name,
              `projects/${spanner.projectId}/instances/new-instance`
            );
            assert.strictEqual(instance.nodeCount, 10);
            done();
          });
        }
      );
    });

    it('should update an instance', async () => {
      const instance = spanner.instance(mockInstanceAdmin.PROD_INSTANCE_NAME);
      const [updatedInstance] = await instance
        .setMetadata({
          nodeCount: 20,
          displayName: 'Production instance with 20 nodes',
        })
        .then(data => {
          return data[0].promise() as Promise<
            [google.spanner.admin.instance.v1.Instance]
          >;
        })
        .then(instance => {
          return instance;
        });
      assert.strictEqual(updatedInstance.nodeCount, 20);
    });

    it('should delete an instance', async () => {
      const instance = spanner.instance(mockInstanceAdmin.PROD_INSTANCE_NAME);
      const [res] = await instance.delete();
      assert.ok(res);
    });

    it('should list databases', async () => {
      const [databases] = await instance.getDatabases();
      assert.strictEqual(databases.length, 2);
    });

    it('should create a database', async () => {
      const [createdDatabase] = await instance
        .createDatabase('new-database')
        .then(data => {
          const operation = data[1];
          return operation.promise();
        })
        .then(database => {
          return database as [google.spanner.admin.database.v1.Database];
        });
      assert.strictEqual(
        createdDatabase.name,
        `${instance.formattedName_}/databases/new-database`
      );
    });
  });
});

function executeSimpleUpdate(
  database: Database,
  update: string | ExecuteSqlRequest
): Promise<number | [number]> {
  return database
    .runTransactionAsync<[number]>(
      (transaction): Promise<[number]> => {
        return transaction
          .runUpdate(update)
          .then(rowCount => {
            return rowCount;
          })
          .then(rowCount => {
            return transaction.commit().then(() => rowCount);
          })
          .then(rowCount => {
            return rowCount;
          })
          .catch(() => {
            transaction.rollback().then(() => {});
            return [-1];
          });
      }
    )
    .then(updated => {
      return updated;
    });
}

function getRowCountFromStreamingSql(
  database: Database,
  query: ExecuteSqlRequest
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let rows = 0;
    let errored = false;
    database
      .runStream(query)
      .on('error', err => {
        errored = true;
        return reject(err);
      })
      .on('data', () => rows++)
      .on('end', () => {
        if (!errored) {
          return resolve(rows);
        }
      });
  });
}

function sleep(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
