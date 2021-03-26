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

import {Done, describe, before, after, beforeEach, it} from 'mocha';
import * as assert from 'assert';
import {grpc, Status} from 'google-gax';
import {Database, Instance, SessionPool, Snapshot, Spanner} from '../src';
import * as mock from './mockserver/mockspanner';
import {
  MockError,
  MockSpanner,
  NUM_ROWS_LARGE_RESULT_SET,
  SimulatedExecutionTime,
} from './mockserver/mockspanner';
import * as mockInstanceAdmin from './mockserver/mockinstanceadmin';
import {TEST_INSTANCE_NAME} from './mockserver/mockinstanceadmin';
import * as mockDatabaseAdmin from './mockserver/mockdatabaseadmin';
import * as sinon from 'sinon';
import {google} from '../protos/protos';
import {types} from '../src/session';
import {ExecuteSqlRequest, RunResponse} from '../src/transaction';
import {Row} from '../src/partial-result-stream';
import {GetDatabaseOperationsOptions} from '../src/instance';
import {
  isSessionNotFoundError,
  SessionLeakError,
  SessionPoolExhaustedError,
  SessionPoolOptions,
} from '../src/session-pool';
import {Json} from '../src/codec';
import CreateInstanceMetadata = google.spanner.admin.instance.v1.CreateInstanceMetadata;
import QueryOptions = google.spanner.v1.ExecuteSqlRequest.QueryOptions;
import v1 = google.spanner.v1;
import IQueryOptions = google.spanner.v1.ExecuteSqlRequest.IQueryOptions;
import ResultSetStats = google.spanner.v1.ResultSetStats;
import * as stream from 'stream';
import * as util from 'util';
import RequestOptions = google.spanner.v1.RequestOptions;

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
  const select1 = 'SELECT 1';
  const invalidSql = 'SELECT * FROM FOO';
  const insertSql = "INSERT INTO NUMBER (NUM, NAME) VALUES (4, 'Four')";
  const updateSql = "UPDATE NUMBER SET NAME='Unknown' WHERE NUM IN (5, 6)";
  const fooNotFoundErr = Object.assign(new Error('Table FOO not found'), {
    code: grpc.status.NOT_FOUND,
  });
  const server = new grpc.Server();
  const spannerMock = mock.createMockSpanner(server);
  mockInstanceAdmin.createMockInstanceAdmin(server);
  mockDatabaseAdmin.createMockDatabaseAdmin(server);
  let port: number;
  let spanner: Spanner;
  let instance: Instance;
  let dbCounter = 1;

  function newTestDatabase(options?: SessionPoolOptions): Database {
    return instance.database(`database-${dbCounter++}`, options);
  }

  before(async () => {
    sandbox = sinon.createSandbox();
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
    spannerMock.putStatementResult(
      selectSql,
      mock.StatementResult.resultSet(mock.createSimpleResultSet())
    );
    spannerMock.putStatementResult(
      select1,
      mock.StatementResult.resultSet(mock.createSelect1ResultSet())
    );
    spannerMock.putStatementResult(
      invalidSql,
      mock.StatementResult.error(fooNotFoundErr)
    );
    spannerMock.putStatementResult(
      insertSql,
      mock.StatementResult.updateCount(1)
    );
    spannerMock.putStatementResult(
      updateSql,
      mock.StatementResult.updateCount(2)
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

  beforeEach(() => {
    spannerMock.resetRequests();
    spannerMock.removeExecutionTimes();
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

    it('should execute query with requestOptions', async () => {
      const priority = RequestOptions.Priority.PRIORITY_HIGH;
      const database = newTestDatabase();
      try {
        const [rows] = await database.run({
          sql: selectSql,
          requestOptions: {priority: priority},
        });
        assert.strictEqual(rows.length, 3);
      } finally {
        await database.close();
      }
      const request = spannerMock.getRequests().find(val => {
        return (val as v1.ExecuteSqlRequest).sql;
      }) as v1.ExecuteSqlRequest;
      assert.ok(request, 'no ExecuteSqlRequest found');
      assert.ok(
        request.requestOptions,
        'no requestOptions found on ExecuteSqlRequest'
      );
      assert.strictEqual(request.requestOptions!.priority, 'PRIORITY_HIGH');
    });

    it('should execute batchUpdate with requestOptions', async () => {
      const database = newTestDatabase();
      await database.runTransactionAsync(tx => {
        return tx!.batchUpdate([insertSql, insertSql], {
          requestOptions: {priority: RequestOptions.Priority.PRIORITY_MEDIUM},
        });
      });
      await database.close();
      const request = spannerMock.getRequests().find(val => {
        return (val as v1.ExecuteBatchDmlRequest).statements;
      }) as v1.ExecuteBatchDmlRequest;
      assert.ok(request, 'no ExecuteBatchDmlRequest found');
      assert.ok(
        request.requestOptions,
        'no requestOptions found on ExecuteBatchDmlRequest'
      );
      assert.strictEqual(request.requestOptions!.priority, 'PRIORITY_MEDIUM');
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

    it('should receive metadata', async () => {
      // The query to execute
      const query = {
        sql: selectSql,
      };
      const database = newTestDatabase();
      try {
        const [rows, , metadata] = await database.run(query);
        assert.strictEqual(rows.length, 3);
        assert.ok(metadata);
        assert.strictEqual(metadata.rowType!.fields!.length, 2);
        assert.strictEqual(metadata.rowType!.fields![0].name, 'NUM');
        assert.strictEqual(metadata.rowType!.fields![1].name, 'NAME');
      } finally {
        await database.close();
      }
    });

    it('should return result without column name in JSON', async () => {
      // The query to execute
      const query = {
        sql: select1,
        json: true,
        jsonOptions: {includeNameless: true},
      } as ExecuteSqlRequest;
      const database = newTestDatabase();
      try {
        const [rows, , metadata] = await database.run(query);
        assert.strictEqual(rows.length, 1);
        assert.ok(metadata);
        assert.strictEqual(metadata.rowType!.fields!.length, 1);
        assert.strictEqual(metadata.rowType!.fields![0].name, '');
        assert.strictEqual(rows[0]['_0'], 1);
      } finally {
        await database.close();
      }
    });

    it('should pause on slow writer', async () => {
      const largeSelect = 'select * from large_table';
      spannerMock.putStatementResult(
        largeSelect,
        mock.StatementResult.resultSet(mock.createLargeResultSet())
      );
      const database = newTestDatabase();
      let rowCount = 0;
      let paused = false;
      try {
        const rs = database.runStream({
          sql: largeSelect,
        });
        const pipeline = util.promisify(stream.pipeline);
        const simulateSlowFlushInterval = Math.floor(
          NUM_ROWS_LARGE_RESULT_SET / 10
        );

        await pipeline(
          rs,
          // Create an artificially slow transformer to simulate network latency.
          new stream.Transform({
            highWaterMark: 1,
            objectMode: true,
            transform(chunk, encoding, callback) {
              rowCount++;
              if (rowCount % simulateSlowFlushInterval === 0) {
                // Simulate a slow flush.
                setTimeout(() => {
                  paused = paused || rs.isPaused();
                  callback(undefined, chunk);
                }, 50);
              } else {
                callback(undefined, chunk);
              }
            },
          }),
          new stream.Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
              callback();
            },
          })
        );
        assert.strictEqual(rowCount, NUM_ROWS_LARGE_RESULT_SET);
        assert.ok(paused, 'stream should have been paused');
      } finally {
        await database.close();
      }
    });

    it('should fail on slow writer when maxResumeRetries has been exceeded', async () => {
      const largeSelect = 'select * from large_table';
      spannerMock.putStatementResult(
        largeSelect,
        mock.StatementResult.resultSet(mock.createLargeResultSet())
      );
      const database = newTestDatabase();
      try {
        const rs = database.runStream({
          sql: largeSelect,
          maxResumeRetries: 1,
        });
        const pipeline = util.promisify(stream.pipeline);

        await pipeline(
          rs,
          // Create an artificially slow transformer to simulate network latency.
          new stream.Transform({
            highWaterMark: 1,
            objectMode: true,
            transform(chunk, encoding, callback) {
              // Simulate a slow flush.
              setTimeout(() => {
                callback(undefined, chunk);
              }, 50);
            },
          }),
          new stream.Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
              callback();
            },
          })
        );
        assert.fail('missing expected error');
      } catch (err) {
        assert.strictEqual(
          err.message,
          'Stream is still not ready to receive data after 1 attempts to resume.'
        );
      } finally {
        await database.close();
      }
    });

    it('should return statistics', async () => {
      const database = newTestDatabase();
      try {
        const [rows, stats] = await database.run({
          sql: selectSql,
          queryMode: google.spanner.v1.ExecuteSqlRequest.QueryMode.PROFILE,
        });
        assert.strictEqual(rows.length, 3);
        assert.ok(stats);
        assert.ok(stats.queryPlan);
      } finally {
        await database.close();
      }
    });

    it('should return statistics from snapshot', async () => {
      const database = newTestDatabase();
      try {
        const [snapshot] = await database.getSnapshot();
        const [rows, stats] = await snapshot.run({
          sql: selectSql,
          queryMode: google.spanner.v1.ExecuteSqlRequest.QueryMode.PROFILE,
        });
        assert.strictEqual(rows.length, 3);
        assert.ok(stats);
        assert.ok(stats.queryPlan);
        snapshot.end();
      } finally {
        await database.close();
      }
    });

    it('should emit query statistics', done => {
      const database = newTestDatabase();
      let rowCount = 0;
      let stats: ResultSetStats;
      database
        .runStream({
          sql: selectSql,
          queryMode: google.spanner.v1.ExecuteSqlRequest.QueryMode.PROFILE,
        })
        .on('data', () => rowCount++)
        .on('stats', _stats => (stats = _stats))
        .on('end', () => {
          assert.strictEqual(rowCount, 3);
          assert.ok(stats);
          assert.ok(stats.queryPlan);
          database.close().then(() => done());
        });
    });

    it('should emit query statistics from snapshot', done => {
      const database = newTestDatabase();
      let rowCount = 0;
      let stats: ResultSetStats;
      database.getSnapshot().then(response => {
        const [snapshot] = response;
        snapshot
          .runStream({
            sql: selectSql,
            queryMode: google.spanner.v1.ExecuteSqlRequest.QueryMode.PROFILE,
          })
          .on('data', () => rowCount++)
          .on('stats', _stats => (stats = _stats))
          .on('end', () => {
            assert.strictEqual(rowCount, 3);
            assert.ok(stats);
            assert.ok(stats.queryPlan);
            snapshot.end();
            database.close().then(() => done());
          });
      });
    });

    it('should call callback with statistics', done => {
      const database = newTestDatabase();
      database.run(
        {
          sql: selectSql,
          queryMode: google.spanner.v1.ExecuteSqlRequest.QueryMode.PROFILE,
        },
        (err, rows, stats) => {
          assert.ifError(err);
          assert.strictEqual(rows.length, 3);
          assert.ok(stats);
          assert.ok(stats.queryPlan);
          database.close().then(() => done());
        }
      );
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
      const database = newTestDatabase({incStep: 1, min: 0});
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
      const database = newTestDatabase({incStep: 1, min: 0});
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
        code: grpc.status.UNAVAILABLE,
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

    it('should not retry non-retryable error from executeStreamingSql with a callback', done => {
      const database = newTestDatabase();
      const err = {
        message: 'Non-retryable error',
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      database.run(selectSql, err => {
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
        });
    });

    it('should retry UNAVAILABLE from executeStreamingSql', async () => {
      const database = newTestDatabase();
      const err = {
        message: 'Temporary unavailable',
        code: grpc.status.UNAVAILABLE,
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

    it('should handle missing parameters in query', async () => {
      const sql =
        'SELECT * FROM tableId WHERE namedParameter = @namedParameter';
      const database = newTestDatabase();
      const q = {
        json: true,
        params: {namedParameter: undefined},
        sql,
      };
      spannerMock.putStatementResult(
        sql,
        mock.StatementResult.resultSet(mock.createSimpleResultSet())
      );
      try {
        await database.run(q);
        assert.fail('missing expected exception');
      } catch (err) {
        assert.ok(
          err.message.includes('Value of type undefined not recognized.')
        );
      } finally {
        await database.close();
      }
    });

    it('should handle missing parameters in query stream', done => {
      const sql =
        'SELECT * FROM tableId WHERE namedParameter = @namedParameter';
      const database = newTestDatabase();
      const q = {
        json: true,
        params: {namedParameter: undefined},
        sql,
      };
      spannerMock.putStatementResult(
        sql,
        mock.StatementResult.resultSet(mock.createSimpleResultSet())
      );
      const prs = database.runStream(q);
      setImmediate(() => {
        prs
          .on('data', () => {})
          .on('error', () => {
            // The stream should end with an error, so the test should succeed.
            done();
          })
          .on('end', () => {
            database.close().then(() => {
              done(assert.fail('missing error'));
            });
          });
      });
    });

    it('should handle missing parameters in update', async () => {
      const sql =
        "UPDATE tableId SET namedParameter='Foo' WHERE namedParameter = @namedParameter";
      const database = newTestDatabase();
      const q = {
        json: true,
        params: {namedParameter: undefined},
        sql,
      };
      await database.runTransactionAsync(async tx => {
        try {
          await tx.runUpdate(q);
          assert.fail('missing expected exception');
        } catch (err) {
          assert.ok(
            err.message.includes('Value of type undefined not recognized.')
          );
        }
      });
      await database.close();
    });

    describe('PartialResultStream', () => {
      const streamIndexes = [1, 2];
      streamIndexes.forEach(index => {
        it('should retry UNAVAILABLE during streaming', async () => {
          const database = newTestDatabase();
          const err = {
            message: 'Temporary unavailable',
            code: grpc.status.UNAVAILABLE,
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
            code: grpc.status.UNAVAILABLE,
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
          database.run(selectSql, err => {
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
            .on('data', row => {
              receivedRows.push(row);
            })
            .on('end', () => {
              assert.fail('Missing expected error');
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
          code: grpc.status.UNAVAILABLE,
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
        code: grpc.status.UNAVAILABLE,
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
        code: grpc.status.INVALID_ARGUMENT,
      } as MockError;
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError(err)
      );
      let attempts = 0;
      database.runTransaction((err, tx) => {
        assert.ifError(err);
        attempts++;
        tx!.runUpdate(insertSql, err => {
          assert.ok(err, 'Missing expected error');
          assert.strictEqual(err!.code, grpc.status.INVALID_ARGUMENT);
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

  describe('queryOptions', () => {
    /** Common verify method for QueryOptions tests. */
    function verifyQueryOptions(optimizerVersion: string) {
      const request = spannerMock.getRequests().find(val => {
        return (val as v1.ExecuteSqlRequest).sql;
      }) as v1.ExecuteSqlRequest;
      assert.ok(request, 'no ExecuteSqlRequest found');
      assert.ok(
        request.queryOptions,
        'no queryOptions found on ExecuteSqlRequest'
      );
      assert.strictEqual(
        request.queryOptions!.optimizerVersion,
        optimizerVersion
      );
    }

    describe('on request', () => {
      it('database.run', async () => {
        const query = {
          sql: selectSql,
          queryOptions: QueryOptions.create({
            optimizerVersion: '100',
          }),
        } as ExecuteSqlRequest;
        const database = newTestDatabase();
        try {
          await database.run(query);
          verifyQueryOptions('100');
        } finally {
          await database.close();
        }
      });

      it('snapshot.run', async () => {
        const query = {
          sql: selectSql,
          queryOptions: QueryOptions.create({
            optimizerVersion: '100',
          }),
        } as ExecuteSqlRequest;
        const database = newTestDatabase();
        try {
          const [snapshot] = await database.getSnapshot();
          await snapshot.run(query);
          verifyQueryOptions('100');
          await snapshot.end();
        } finally {
          await database.close();
        }
      });

      it('transaction.run', done => {
        const query = {
          sql: selectSql,
          queryOptions: QueryOptions.create({
            optimizerVersion: '100',
          }),
        } as ExecuteSqlRequest;
        const database = newTestDatabase();
        database.runTransaction(async (err, transaction) => {
          assert.ifError(err);
          await transaction!.run(query);
          verifyQueryOptions('100');
          await transaction!.commit();
          await database.close();
          done();
        });
      });

      it('async transaction.run', async () => {
        const query = {
          sql: selectSql,
          queryOptions: QueryOptions.create({
            optimizerVersion: '100',
          }),
        } as ExecuteSqlRequest;
        const database = newTestDatabase();
        try {
          await database.runTransactionAsync(async transaction => {
            await transaction.run(query);
            verifyQueryOptions('100');
            await transaction.commit();
          });
        } finally {
          await database.close();
        }
      });
    });

    describe('with environment variable', () => {
      const OPTIMIZER_VERSION = '20';
      let spannerWithEnvVar: Spanner;
      let instanceWithEnvVar: Instance;

      function newTestDatabase(
        options?: SessionPoolOptions,
        queryOptions?: IQueryOptions
      ): Database {
        return instanceWithEnvVar.database(
          `database-${dbCounter++}`,
          options,
          queryOptions
        );
      }

      before(() => {
        process.env.SPANNER_OPTIMIZER_VERSION = OPTIMIZER_VERSION;
        spannerWithEnvVar = new Spanner({
          projectId: 'fake-project-id',
          servicePath: 'localhost',
          port,
          sslCreds: grpc.credentials.createInsecure(),
        });
        // Gets a reference to a Cloud Spanner instance and database
        instanceWithEnvVar = spannerWithEnvVar.instance('instance');
      });

      after(() => {
        delete process.env.SPANNER_OPTIMIZER_VERSION;
      });

      it('database.run', async () => {
        const database = newTestDatabase();
        try {
          await database.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
        } finally {
          await database.close();
        }
      });

      it('database.run with database-with-query-options', async () => {
        // The options that are given in the database options will not be used
        // as they are overridden by the environment variable.
        const database = newTestDatabase(undefined, {
          optimizerVersion: 'version-in-db-opts',
        });
        try {
          await database.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
        } finally {
          await database.close();
        }
      });

      it('database.run with query-options', async () => {
        const database = newTestDatabase();
        try {
          await database.run({
            sql: selectSql,
            queryOptions: {
              optimizerVersion: 'version-on-query',
            },
          });
          verifyQueryOptions('version-on-query');
        } finally {
          await database.close();
        }
      });

      it('snapshot.run', async () => {
        const database = newTestDatabase();
        try {
          const [snapshot] = await database.getSnapshot();
          await snapshot.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
          await snapshot.end();
        } finally {
          await database.close();
        }
      });

      it('snapshot.run with query-options', async () => {
        const database = newTestDatabase();
        try {
          const [snapshot] = await database.getSnapshot();
          await snapshot.run({
            sql: selectSql,
            queryOptions: {
              optimizerVersion: 'version-on-query',
            },
          });
          verifyQueryOptions('version-on-query');
          await snapshot.end();
        } finally {
          await database.close();
        }
      });

      it('snapshot.run with database-with-query-options', async () => {
        const database = newTestDatabase(undefined, {
          optimizerVersion: 'version-in-db-opts',
        });
        try {
          const [snapshot] = await database.getSnapshot();
          await snapshot.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
          await snapshot.end();
        } finally {
          await database.close();
        }
      });

      it('transaction.run', done => {
        const database = newTestDatabase();
        database.runTransaction(async (err, transaction) => {
          assert.ifError(err);
          await transaction!.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
          await transaction!.commit();
          await database.close();
          done();
        });
      });

      it('transaction.run with query-options', done => {
        const database = newTestDatabase();
        database.runTransaction(async (err, transaction) => {
          assert.ifError(err);
          await transaction!.run({
            sql: selectSql,
            queryOptions: {
              optimizerVersion: 'version-on-query',
            },
          });
          verifyQueryOptions('version-on-query');
          await transaction!.commit();
          await database.close();
          done();
        });
      });

      it('transaction.run with database-with-query-options', done => {
        const database = newTestDatabase(undefined, {
          optimizerVersion: 'version-in-db-opts',
        });
        database.runTransaction(async (err, transaction) => {
          assert.ifError(err);
          await transaction!.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
          await transaction!.commit();
          await database.close();
          done();
        });
      });

      it('async transaction.run', async () => {
        const database = newTestDatabase();
        try {
          await database.runTransactionAsync(async transaction => {
            await transaction.run(selectSql);
            verifyQueryOptions(OPTIMIZER_VERSION);
            await transaction.commit();
          });
        } finally {
          await database.close();
        }
      });

      it('async transaction.run with query-options', async () => {
        const database = newTestDatabase();
        try {
          await database.runTransactionAsync(async transaction => {
            await transaction.run({
              sql: selectSql,
              queryOptions: {
                optimizerVersion: 'version-on-query',
              },
            });
            verifyQueryOptions('version-on-query');
            await transaction.commit();
          });
        } finally {
          await database.close();
        }
      });

      it('async transaction.run with database-with-query-options', async () => {
        const database = newTestDatabase(undefined, {
          optimizerVersion: 'version-in-db-opts',
        });
        try {
          await database.runTransactionAsync(async transaction => {
            await transaction.run(selectSql);
            verifyQueryOptions(OPTIMIZER_VERSION);
            await transaction.commit();
          });
        } finally {
          await database.close();
        }
      });
    });

    describe('on database options', () => {
      const OPTIMIZER_VERSION = '40';

      // Request a database with default query options.
      function newTestDatabase(options?: SessionPoolOptions): Database {
        return instance.database(`database-${dbCounter++}`, options, {
          optimizerVersion: OPTIMIZER_VERSION,
        } as IQueryOptions);
      }

      it('database.run', async () => {
        const database = newTestDatabase();
        try {
          await database.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
        } finally {
          await database.close();
        }
      });

      it('snapshot.run', async () => {
        const database = newTestDatabase();
        try {
          const [snapshot] = await database.getSnapshot();
          await snapshot.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
          await snapshot.end();
        } finally {
          await database.close();
        }
      });

      it('transaction.run', done => {
        const database = newTestDatabase();
        database.runTransaction(async (err, transaction) => {
          assert.ifError(err);
          await transaction!.run(selectSql);
          verifyQueryOptions(OPTIMIZER_VERSION);
          await transaction!.commit();
          await database.close();
          done();
        });
      });

      it('async transaction.run', async () => {
        const database = newTestDatabase();
        try {
          await database.runTransactionAsync(async transaction => {
            await transaction.run(selectSql);
            verifyQueryOptions(OPTIMIZER_VERSION);
            await transaction.commit();
          });
        } finally {
          await database.close();
        }
      });
    });
  });

  describe('session-not-found', () => {
    it('should retry "Session not found" errors on Database.run()', done => {
      const db = newTestDatabase({
        incStep: 1,
        min: 0,
      });
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError({
          code: grpc.status.NOT_FOUND,
          message: 'Session not found',
        } as MockError)
      );
      db.run(selectSql, (err, rows) => {
        if (err) {
          assert.fail(err);
        }
        assert.strictEqual(rows!.length, 3);
        db.getSessions((err, results) => {
          if (err) {
            assert.fail(err);
          }
          // The mock server should have exactly 2 sessions. The first one was
          // removed from the session pool because of the simulated
          // 'Session not found' error. The second one was created by the retry.
          // As we only simulate the 'Session not found' error, the first
          // session is still present on the mock server.
          assert.strictEqual(results!.length, 2);
          if (results!.length !== 2) {
            done();
          }
          db.close()
            .catch(err => assert.fail(err))
            .then(() => done());
        });
      });
    });

    it('should retry "Session not found" errors for Database.runStream()', () => {
      const db = newTestDatabase();
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError({
          code: grpc.status.NOT_FOUND,
          message: 'Session not found',
        } as MockError)
      );
      let rowCount = 0;
      db.runStream(selectSql)
        .on('data', () => rowCount++)
        .on('error', err => {
          assert.fail(err);
        })
        .on('end', () => {
          assert.strictEqual(rowCount, 3);
        });
    });

    it('should retry multiple "Session not found" errors on Database.run()', done => {
      const db = newTestDatabase();
      for (let i = 0; i < 10; i++) {
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
      }
      db.run(selectSql, (err, rows) => {
        if (err) {
          assert.fail(err);
        }
        assert.strictEqual(rows!.length, 3);
        done();
      });
    });

    it('should not retry "Session not found" errors halfway a stream', done => {
      const db = newTestDatabase();
      spannerMock.setExecutionTime(
        spannerMock.executeStreamingSql,
        SimulatedExecutionTime.ofError({
          code: grpc.status.NOT_FOUND,
          message: 'Session not found',
          streamIndex: 1,
        } as MockError)
      );
      db.run(selectSql, err => {
        if (err) {
          assert.ok(isSessionNotFoundError(err));
          done();
          return;
        }
        assert.fail('Missing expected "Session not found" error');
      });
    });

    it('should retry "Session not found" errors for Database.getSnapshot() with callbacks', done => {
      const db = newTestDatabase();
      const sessionNotFound = {
        code: grpc.status.NOT_FOUND,
        message: 'Session not found',
      } as MockError;
      // The beginTransaction call will fail 3 times with 'Session not found'
      // before succeeding.
      spannerMock.setExecutionTime(
        spannerMock.beginTransaction,
        SimulatedExecutionTime.ofErrors([
          sessionNotFound,
          sessionNotFound,
          sessionNotFound,
        ])
      );
      db.getSnapshot((err, snapshot) => {
        assert.ifError(err);
        snapshot!.run(selectSql, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows.length, 3);
          snapshot!.end();
          db.close(done);
        });
      });
    });

    it('should retry "Session not found" errors on BeginTransaction during Database.runTransaction()', done => {
      // Create a session pool with 1 read-only session.
      const db = newTestDatabase({min: 1, incStep: 1, writes: 0.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one read-only session has been created.
      pool.once('available', () => {
        spannerMock.setExecutionTime(
          spannerMock.beginTransaction,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        runTransactionWithExpectedSessionRetry(db, done);
      });
    });

    it('should retry "Session not found" errors for a query on a write-session on Database.runTransaction()', done => {
      const db = newTestDatabase({min: 1, incStep: 1, writes: 1.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one session with a transaction has been created.
      pool.once('available', () => {
        assert.strictEqual(pool.writes, 1);
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        runTransactionWithExpectedSessionRetry(db, done);
      });
    });

    function runTransactionWithExpectedSessionRetry(db: Database, done: Done) {
      db.runTransaction((err, transaction) => {
        assert.ifError(err);
        transaction!.run(selectSql, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows.length, 3);
          // Verify that the server has two sessions: The first one was marked
          // as 'not found' by the client because of the mocked error, and a
          // second one that was created as a result of the retry.
          db.getSessions((err, sessions) => {
            assert.ifError(err);
            assert.strictEqual(sessions!.length, 2);
            transaction!.commit(err => {
              assert.ifError(err);
              db.close(done);
            });
          });
        });
      });
    }

    it('should retry "Session not found" errors for Commit on a write-session on Database.runTransaction()', done => {
      const db = newTestDatabase({min: 1, incStep: 1, writes: 1.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one session with a transaction has been created.
      pool.once('available', () => {
        assert.strictEqual(pool.writes, 1);
        spannerMock.setExecutionTime(
          spannerMock.commit,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        db.runTransaction((err, transaction) => {
          assert.ifError(err);
          transaction!.insert('FOO', {Id: 1, Name: 'foo'});
          transaction!.commit(err => {
            assert.ifError(err);
            db.getSessions((err, sessions) => {
              assert.ifError(err);
              assert.strictEqual(sessions!.length, 2);
              db.close(done);
            });
          });
        });
      });
    });

    it('should retry "Session not found" errors for Database.getSnapshot()', done => {
      const db = newTestDatabase();
      spannerMock.setExecutionTime(
        spannerMock.beginTransaction,
        SimulatedExecutionTime.ofError({
          code: grpc.status.NOT_FOUND,
          message: 'Session not found',
        } as MockError)
      );
      db.getSnapshot()
        .then(response => {
          const [snapshot] = response;
          snapshot
            .run(selectSql)
            .then(response => {
              const [rows] = response;
              assert.strictEqual(rows.length, 3);
              snapshot.end();
              db.close(done);
            })
            .catch(done);
        })
        .catch(done);
    });

    it('should retry "Session not found" errors for runUpdate on a write-session on Database.runTransaction()', done => {
      const db = newTestDatabase({min: 1, incStep: 1, writes: 1.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one session with a transaction has been created.
      pool.once('available', () => {
        assert.strictEqual(pool.writes, 1);
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        db.runTransaction((err, transaction) => {
          assert.ifError(err);
          transaction!.runUpdate(insertSql, (err, updateCount) => {
            assert.ifError(err);
            assert.strictEqual(updateCount, 1);
            transaction!.commit(err => {
              assert.ifError(err);
              db.getSessions((err, sessions) => {
                assert.ifError(err);
                assert.strictEqual(sessions!.length, 2);
                db.close(done);
              });
            });
          });
        });
      });
    });

    it('should retry "Session not found" errors for executeBatchDml on a write-session on Database.runTransaction()', done => {
      const db = newTestDatabase({min: 1, incStep: 1, writes: 1.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one session with a transaction has been created.
      pool.once('available', () => {
        assert.strictEqual(pool.writes, 1);
        spannerMock.setExecutionTime(
          spannerMock.executeBatchDml,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        db.runTransaction((err, transaction) => {
          assert.ifError(err);
          transaction!.batchUpdate(
            [insertSql, insertSql],
            (err, updateCounts) => {
              assert.ifError(err);
              assert.deepStrictEqual(updateCounts, [1, 1]);
              transaction!.commit(err => {
                assert.ifError(err);
                db.getSessions((err, sessions) => {
                  assert.ifError(err);
                  assert.strictEqual(sessions!.length, 2);
                  db.close(done);
                });
              });
            }
          );
        });
      });
    });

    it('should retry "Session not found" errors on BeginTransaction during Database.runTransactionAsync()', done => {
      // Create a session pool with 1 read-only session.
      const db = newTestDatabase({min: 1, incStep: 1, writes: 0.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one read-only session has been created.
      pool.once('available', async () => {
        spannerMock.setExecutionTime(
          spannerMock.beginTransaction,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        runAsyncTransactionWithExpectedSessionRetry(db).then(done).catch(done);
      });
    });

    it('should retry "Session not found" errors for a query on a write-session on Database.runTransactionAsync()', done => {
      const db = newTestDatabase({min: 1, incStep: 1, writes: 1.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one session with a transaction has been created.
      pool.once('available', () => {
        assert.strictEqual(pool.writes, 1);
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        runAsyncTransactionWithExpectedSessionRetry(db).then(done).catch(done);
      });
    });

    async function runAsyncTransactionWithExpectedSessionRetry(db: Database) {
      try {
        await db.runTransactionAsync(
          async (transaction): Promise<void> => {
            try {
              const [rows] = await transaction.run(selectSql);
              assert.strictEqual(rows.length, 3);
              const [sessions] = await db.getSessions();
              assert.strictEqual(sessions!.length, 2);
              await transaction.commit();
              return Promise.resolve();
            } catch (e) {
              return Promise.reject(e);
            }
          }
        );
        await db.close();
      } catch (e) {
        assert.fail(e);
      }
    }

    it('should retry "Session not found" errors for Commit on a write-session on Database.runTransactionAsync()', done => {
      const db = newTestDatabase({min: 1, incStep: 1, writes: 1.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one session with a transaction has been created.
      pool.once('available', async () => {
        assert.strictEqual(pool.writes, 1);
        spannerMock.setExecutionTime(
          spannerMock.commit,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        try {
          await db
            .runTransactionAsync(
              async (transaction): Promise<void> => {
                transaction.insert('FOO', {Id: 1, Name: 'foo'});
                await transaction.commit();
                const [sessions] = await db.getSessions();
                assert.strictEqual(sessions!.length, 2);
              }
            )
            .catch(assert.ifError);
          await db.close();
        } catch (e) {
          done(e);
          return;
        }
        done();
      });
    });

    it('should retry "Session not found" errors for runUpdate on a write-session on Database.runTransactionAsync()', done => {
      const db = newTestDatabase({min: 1, incStep: 1, writes: 1.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one session with a transaction has been created.
      pool.once('available', async () => {
        assert.strictEqual(pool.writes, 1);
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        try {
          await db
            .runTransactionAsync(
              async (transaction): Promise<void> => {
                const [updateCount] = await transaction.runUpdate(insertSql);
                assert.strictEqual(updateCount, 1);
                await transaction.commit();
                const [sessions] = await db.getSessions();
                assert.strictEqual(sessions!.length, 2);
              }
            )
            .catch(assert.ifError);
          await db.close();
        } catch (e) {
          done(e);
          return;
        }
        done();
      });
    });

    it('should retry "Session not found" errors for executeBatchDml on a write-session on Database.runTransactionAsync()', done => {
      const db = newTestDatabase({min: 1, incStep: 1, writes: 1.0});
      const pool = db.pool_ as SessionPool;
      // Wait until one session with a transaction has been created.
      pool.once('available', async () => {
        assert.strictEqual(pool.writes, 1);
        spannerMock.setExecutionTime(
          spannerMock.executeBatchDml,
          SimulatedExecutionTime.ofError({
            code: grpc.status.NOT_FOUND,
            message: 'Session not found',
          } as MockError)
        );
        try {
          await db
            .runTransactionAsync(
              async (transaction): Promise<void> => {
                const [updateCounts] = await transaction.batchUpdate([
                  insertSql,
                  insertSql,
                ]);
                assert.deepStrictEqual(updateCounts, [1, 1]);
                await transaction.commit();
                const [sessions] = await db.getSessions();
                assert.strictEqual(sessions!.length, 2);
              }
            )
            .catch(assert.ifError);
          await db.close();
        } catch (e) {
          done(e);
          return;
        }
        done();
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
      await db
        .getSnapshot({strong: true, returnReadTimestamp: true})
        .then(([tx]) => {
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
      const database = newTestDatabase({incStep: 1, min: 0});
      try {
        await verifyReadSessionReuse(database);
      } finally {
        await database.close();
      }
    });

    it('should reuse sessions when fail=true', async () => {
      const db = newTestDatabase({
        min: 0,
        max: 10,
        incStep: 1,
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
        incStep: 1,
        min: 0,
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
      const database = newTestDatabase({incStep: 1, min: 0});
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
      const database = newTestDatabase({incStep: 1, min: 0});
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
      const database = newTestDatabase({incStep: 1, min: 0});
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
      const database = newTestDatabase({incStep: 1, min: 0});
      try {
        await verifyWriteSessionReuse(database);
      } finally {
        await database.close();
      }
    });

    it('should reuse write sessions when fail=true', async () => {
      const db = newTestDatabase({
        min: 0,
        max: 10,
        incStep: 1,
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

    it('should re-use write session as read-session', async () => {
      const database = newTestDatabase({incStep: 1, max: 1});
      const pool = database.pool_ as SessionPool;
      try {
        // Execute a simple read/write transaction to create 1 write session.
        const w = executeSimpleUpdate(database, updateSql);
        const r = database.run(selectSql);
        await Promise.all([w, r]);
        assert.strictEqual(pool.size, 1);
        assert.strictEqual(pool.writes, 0);
        assert.strictEqual(pool.reads, 1);
      } finally {
        await database.close();
      }
    });

    it('should fail on session pool exhaustion and fail=true', async () => {
      const database = newTestDatabase({
        max: 1,
        incStep: 1,
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

    it('should not create unnecessary write-prepared sessions', async () => {
      const query = {
        sql: selectSql,
      };
      const update = {
        sql: insertSql,
      };
      const database = newTestDatabase({
        writes: 0.2,
        min: 100,
      });
      const pool = database.pool_ as SessionPool;
      try {
        // First execute three consecutive read/write transactions.
        const promises: Array<Promise<RunResponse | number | [number]>> = [];
        for (let i = 0; i < 3; i++) {
          promises.push(executeSimpleUpdate(database, update));
          const ms = Math.floor(Math.random() * 5) + 1;
          await sleep(ms);
        }
        let maxWriteSessions = 0;
        for (let i = 0; i < 1000; i++) {
          if (Math.random() < 0.8) {
            promises.push(database.run(query));
          } else {
            promises.push(executeSimpleUpdate(database, update));
          }
          maxWriteSessions = Math.max(maxWriteSessions, pool.writes);
          const ms = Math.floor(Math.random() * 5) + 1;
          await sleep(ms);
        }
        await Promise.all(promises);
      } finally {
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
        (pool._inventory[types.ReadOnly].length < expectedReads ||
          pool._inventory[types.ReadWrite].length < expectedWrites) &&
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
        (pool._inventory[types.ReadOnly].length < expectedReads ||
          pool._inventory[types.ReadWrite].length < expectedWrites) &&
        new Date().getTime() - started < 1000
      ) {
        await sleep(1);
      }
      assert.strictEqual(pool.size, expectedReads + expectedWrites);
      assert.strictEqual(
        pool._inventory[types.ReadWrite].length,
        expectedWrites
      );
      assert.strictEqual(pool._inventory[types.ReadOnly].length, expectedReads);
      await database.close();
    });

    it('should propagate database not found errors', async () => {
      spannerMock.setExecutionTime(
        spannerMock.batchCreateSessions,
        // Two errors; one for the initial _fill of the session pool, and one
        // for the query.
        SimulatedExecutionTime.ofErrors([
          {
            code: Status.NOT_FOUND,
            message: 'Database not found',
          },
          {
            code: Status.NOT_FOUND,
            message: 'Database not found',
          },
        ] as MockError[])
      );
      const database = newTestDatabase();
      try {
        await database.run(selectSql);
        assert.fail('missing expected error');
      } catch (err) {
        assert.strictEqual(err.code, Status.NOT_FOUND);
      } finally {
        await database.close();
      }
    });

    it('should not propagate instance and database not found errors for SessionPoolOptions.min > 0', async () => {
      for (const msg of ['Instance not found', 'Database not found']) {
        spannerMock.setExecutionTime(
          spannerMock.batchCreateSessions,
          SimulatedExecutionTime.ofErrors([
            {
              code: Status.NOT_FOUND,
              message: msg,
            },
          ] as MockError[])
        );
        try {
          const database = newTestDatabase({
            incStep: 1,
            min: 25,
            max: 400,
          });
          const response = await database.create();
          assert.ok(response);
          const [rows] = await database.run(selectSql);
          assert.strictEqual(rows.length, 3);
          // Make sure the pool of the newly created database is filled.
          const pool = database.pool_ as SessionPool;
          assert.strictEqual(pool.size, 25);
          await database.close();
        } catch (err) {
          assert.fail(err);
        }
      }
    });

    it('should propagate permission denied errors on initialization', async () => {
      spannerMock.setExecutionTime(
        spannerMock.batchCreateSessions,
        SimulatedExecutionTime.ofErrors([
          {
            code: Status.PERMISSION_DENIED,
            message: 'Needs permission',
          },
          {
            code: Status.PERMISSION_DENIED,
            message: 'Needs permission',
          },
        ] as MockError[])
      );
      const database = newTestDatabase().on('error', err => {
        assert.strictEqual(err.code, Status.PERMISSION_DENIED);
      });
      try {
        await database.run(selectSql);
        assert.fail('missing expected error');
      } catch (err) {
        assert.strictEqual(err.code, Status.PERMISSION_DENIED);
      } finally {
        await database.close();
      }
    });

    it('should create new session when numWaiters >= pending', async () => {
      const database = newTestDatabase({
        min: 1,
        max: 10,
        incStep: 1,
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

    it('should respect options.incStep', async () => {
      const database = newTestDatabase({
        min: 100,
        max: 400,
        incStep: 25,
      });
      const pool = database.pool_ as SessionPool;
      assert.strictEqual(pool.size, pool.options.min);
      // Request options.min + 1 sessions.
      const snapshots: Snapshot[] = [];
      for (let i = 0; i < pool.options.min! + 1; i++) {
        const [snapshot] = await database.getSnapshot();
        snapshots.unshift(snapshot);
      }
      // The pool should create a batch of sessions.
      assert.strictEqual(pool.size, pool.options.min! + pool.options.incStep!);
      for (const s of snapshots) {
        s.end();
      }
      await database.close();
    });

    it('should respect options.max', async () => {
      const database = newTestDatabase({
        min: 0,
        max: 3,
        incStep: 2,
      });
      const pool = database.pool_ as SessionPool;
      const [tx1] = await database.getSnapshot();
      assert.strictEqual(pool.size, pool.options.incStep);
      const [tx2] = await database.getSnapshot();
      const [tx3] = await database.getSnapshot();
      assert.strictEqual(pool.size, pool.options.max);
      tx1.end();
      tx2.end();
      tx3.end();
      await database.close();
    });

    it('should respect options.max when a write session is requested', async () => {
      const database = newTestDatabase({
        min: 0,
        max: 3,
        incStep: 2,
      });
      const pool = database.pool_ as SessionPool;
      const [tx1] = await database.getSnapshot();
      const [tx2] = await database.getSnapshot();
      assert.strictEqual(pool.size, pool.options.incStep);
      await database.runTransactionAsync(async tx => {
        if (!tx) {
          assert.fail('Transaction failed');
        }
        await tx.runUpdate(updateSql);
        await tx.commit();
      });
      assert.strictEqual(pool.size, pool.options.max);
      tx1.end();
      tx2.end();
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
            return transaction.commit().then(() => count);
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
            .then(updateCount => transaction.commit().then(() => updateCount));
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
          transaction!.commit(err => {
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

    it('should retry on aborted batch DML statement', async () => {
      let attempts = 0;
      const database = newTestDatabase();
      spannerMock.setExecutionTime(
        spannerMock.executeBatchDml,
        SimulatedExecutionTime.ofError({
          code: grpc.status.ABORTED,
          message: 'Transaction aborted',
          metadata: MockSpanner.createMinimalRetryDelayMetadata(),
          streamIndex: 1,
        } as MockError)
      );
      const response = await database.runTransactionAsync(transaction => {
        attempts++;
        return transaction
          .batchUpdate([insertSql, updateSql])
          .then(response => transaction.commit().then(() => response));
      });
      const updateCounts = response[0];
      assert.deepStrictEqual(updateCounts, [1, 2]);
      assert.strictEqual(attempts, 2);
      await database.close();
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
            return transaction.commit().then(() => updateCount);
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
              return transaction.commit().then(() => updateCount);
            });
          }
        );
        assert.fail('missing expected DEADLINE_EXCEEDED error');
      } catch (e) {
        assert.strictEqual(
          e.code,
          grpc.status.DEADLINE_EXCEEDED,
          `Got unexpected error ${e} with code ${e.code}`
        );
        // The transaction should be tried at least once before timing out.
        assert.ok(attempts >= 1);
      }
      await database.close();
    });

    describe('batch-readonly-transaction', () => {
      it('should use session from pool', async () => {
        const database = newTestDatabase({min: 0, incStep: 1});
        const pool = database.pool_ as SessionPool;
        assert.strictEqual(pool.size, 0);
        const [transaction] = await database.createBatchTransaction();
        assert.strictEqual(pool.size, 1);
        assert.strictEqual(pool.available, 0);
        transaction.close();
        await database.close();
      });

      it('failing to close transaction should cause session leak error', async () => {
        const database = newTestDatabase();
        await database.createBatchTransaction();
        try {
          await database.close();
          assert.fail('missing expected session leak error');
        } catch (err) {
          assert.ok(err instanceof SessionLeakError);
        }
      });
    });

    describe('pdml', () => {
      it('should retry on aborted error', async () => {
        const database = newTestDatabase();
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          SimulatedExecutionTime.ofError({
            code: grpc.status.ABORTED,
            message: 'Transaction aborted',
            metadata: MockSpanner.createMinimalRetryDelayMetadata(),
            streamIndex: 1,
          } as MockError)
        );
        const [updateCount] = await database.runPartitionedUpdate(updateSql);
        assert.strictEqual(updateCount, 2);
        await database.close();
      });

      it('should retry on specific internal error', async () => {
        const database = newTestDatabase();
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          SimulatedExecutionTime.ofError({
            code: grpc.status.INTERNAL,
            message: 'Received unexpected EOS on DATA frame from server',
            streamIndex: 1,
          } as MockError)
        );
        const [updateCount] = await database.runPartitionedUpdate(updateSql);
        assert.strictEqual(updateCount, 2);
        await database.close();
      });

      it('should fail on generic internal error', async () => {
        const database = newTestDatabase();
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          SimulatedExecutionTime.ofError({
            code: grpc.status.INTERNAL,
            message: 'Generic internal error',
            streamIndex: 1,
          } as MockError)
        );
        try {
          await database.runPartitionedUpdate(updateSql);
          assert.fail('missing expected INTERNAL error');
        } catch (err) {
          assert.strictEqual(err.code, grpc.status.INTERNAL);
          assert.ok(err.message.includes('Generic internal error'));
        } finally {
          await database.close();
        }
      });
    });
  });

  describe('table', () => {
    it('should use requestOptions for mutations', async () => {
      const database = newTestDatabase();
      await database
        .table('foo')
        .upsert(
          {id: 1, name: 'bar'},
          {requestOptions: {priority: RequestOptions.Priority.PRIORITY_MEDIUM}}
        );

      const request = spannerMock.getRequests().find(val => {
        return (val as v1.CommitRequest).mutations;
      }) as v1.CommitRequest;
      assert.ok(request, 'no CommitRequest found');
      assert.ok(
        request.requestOptions,
        'no requestOptions found on CommitRequest'
      );
      assert.strictEqual(request.requestOptions!.priority, 'PRIORITY_MEDIUM');

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
        gaxOptions: {maxResults: 1},
      });
      assert.strictEqual(instances.length, 1);
    });

    it('should maximize api calls', async () => {
      const [instances] = await spanner.getInstances({
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

    it('should create an instance with a display name', async () => {
      const [createdInstance] = await spanner
        .createInstance('new-instance', {
          config: 'test-instance-config',
          nodes: 10,
          displayName: 'some new instance',
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
      assert.strictEqual(createdInstance.displayName, 'some new instance');
    });

    it('should create an instance using a callback', done => {
      spanner.createInstance(
        'new-instance',
        {
          config: 'test-instance-config',
          nodes: 10,
        },
        (err, resource, operation) => {
          assert.ifError(err);
          assert.ok(resource, 'no instance returned');
          assert.strictEqual(
            resource!.formattedName_,
            `projects/${spanner.projectId}/instances/new-instance`
          );
          assert.ok(operation, 'no operation returned');
          operation!.on('error', assert.ifError).on('complete', instance => {
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
      // Assert that listing the databases does not cause a session pool to be
      // initialized for the databases.
      for (const db of databases) {
        assert.strictEqual((db.pool_ as SessionPool).size, 0);
      }
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

    it('should list database operations', async () => {
      const dbSpecificFilter =
        'name:projects/p/instances/i/databases/test-database';
      const dbSpecificQuery: GetDatabaseOperationsOptions = {
        filter: dbSpecificFilter,
      };
      const [operations1] = await instance.getDatabaseOperations(
        dbSpecificQuery
      );

      const database = instance.database('test-database');
      const [operations2] = await database.getOperations();
      assert.strictEqual(operations1.length, 2);
      assert.strictEqual(operations2.length, 2);
      assert.deepStrictEqual(operations1, operations2);
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
