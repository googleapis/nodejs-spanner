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

import {google} from '../../protos/protos';
import {grpc} from 'google-gax';
import * as protoLoader from '@grpc/proto-loader';
import {Transaction} from '../../src';
import protobuf = google.spanner.v1;
import Timestamp = google.protobuf.Timestamp;
import RetryInfo = google.rpc.RetryInfo;
import ExecuteBatchDmlResponse = google.spanner.v1.ExecuteBatchDmlResponse;
import ResultSet = google.spanner.v1.ResultSet;
import Status = google.rpc.Status;
import Any = google.protobuf.Any;
import QueryMode = google.spanner.v1.ExecuteSqlRequest.QueryMode;

const PROTO_PATH = 'spanner.proto';
const IMPORT_PATH = __dirname + '/../../../protos';
const PROTO_DIR = __dirname + '/../../../protos/google/spanner/v1';

/**
 * Load the Spanner service proto.
 */
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [IMPORT_PATH, PROTO_DIR],
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const spannerProtoDescriptor = protoDescriptor['google']['spanner']['v1'];
const RETRY_INFO_BIN = 'google.rpc.retryinfo-bin';
const RETRY_INFO_TYPE = 'type.googleapis.com/google.rpc.retryinfo';

/**
 * The type of result for an SQL statement that the mock server should return.
 */
enum StatementResultType {
  ERROR,
  RESULT_SET,
  UPDATE_COUNT,
}

/**
 * StatementResult contains the result for an SQL statement on the mock server.
 */
export class StatementResult {
  private readonly _type: StatementResultType;
  get type(): StatementResultType {
    return this._type;
  }
  private readonly _error: Error | null;
  get error(): Error {
    if (this._error) {
      return this._error;
    }
    throw new Error('The StatementResult does not contain an Error');
  }
  private readonly _resultSet: protobuf.ResultSet | null;
  get resultSet(): protobuf.ResultSet {
    if (this._resultSet) {
      return this._resultSet;
    }
    throw new Error('The StatementResult does not contain a ResultSet');
  }
  private readonly _updateCount: number | null;
  get updateCount(): number {
    if (this._updateCount) {
      return this._updateCount;
    }
    throw new Error('The StatementResult does not contain an UpdateCount');
  }

  private constructor(
    type: StatementResultType,
    error: Error | null,
    resultSet: protobuf.ResultSet | null,
    updateCount: number | null
  ) {
    this._type = type;
    this._error = error;
    this._resultSet = resultSet;
    this._updateCount = updateCount;
  }

  /**
   * Create a StatementResult that will return an error.
   * @param error The error to return for the statement.
   */
  static error(error: Error): StatementResult {
    return new StatementResult(StatementResultType.ERROR, error, null, null);
  }

  /**
   * Create a StatementResult that will return a ResultSet or a stream of PartialResultSets.
   * @param resultSet The result set to return.
   */
  static resultSet(resultSet: protobuf.ResultSet): StatementResult {
    return new StatementResult(
      StatementResultType.RESULT_SET,
      null,
      resultSet,
      null
    );
  }

  /**
   * Create a StatementResult that will return an update count.
   * @param updateCount The row count to return.
   */
  static updateCount(updateCount: number): StatementResult {
    return new StatementResult(
      StatementResultType.UPDATE_COUNT,
      null,
      null,
      updateCount
    );
  }
}

export interface MockError extends grpc.ServiceError {
  streamIndex?: number;
}

export class SimulatedExecutionTime {
  private readonly _minimumExecutionTime?: number;
  get minimumExecutionTime(): number | undefined {
    return this._minimumExecutionTime;
  }
  private readonly _randomExecutionTime?: number;
  get randomExecutionTime(): number | undefined {
    return this._randomExecutionTime;
  }
  private readonly _errors?: grpc.ServiceError[];
  get errors(): MockError[] | undefined {
    return this._errors;
  }
  // Keep error after execution. The error will continue to be returned until
  // it is cleared.
  private readonly _keepError?: boolean;

  private constructor(input: {
    minimumExecutionTime?: number;
    randomExecutionTime?: number;
    errors?: grpc.ServiceError[];
    keepError?: boolean;
  }) {
    this._minimumExecutionTime = input.minimumExecutionTime;
    this._randomExecutionTime = input.randomExecutionTime;
    this._errors = input.errors;
    this._keepError = input.keepError;
  }

  static ofError(error: MockError): SimulatedExecutionTime {
    return new SimulatedExecutionTime({errors: [error]});
  }

  static ofErrors(errors: MockError[]): SimulatedExecutionTime {
    return new SimulatedExecutionTime({errors});
  }

  static ofMinAndRandomExecTime(minExecTime: number, randomExecTime: number) {
    return new SimulatedExecutionTime({
      minimumExecutionTime: minExecTime,
      randomExecutionTime: randomExecTime,
    });
  }

  async simulateExecutionTime() {
    if (!(this.randomExecutionTime || this.minimumExecutionTime)) {
      return;
    }
    const rnd = this.randomExecutionTime
      ? Math.random() * this.randomExecutionTime
      : 0;
    const total =
      (this.minimumExecutionTime ? this.minimumExecutionTime : 0) + rnd;
    await MockSpanner.sleep(total);
  }
}

export function createUnimplementedError(msg: string): grpc.ServiceError {
  const error = new Error(msg);
  return Object.assign(error, {
    code: grpc.status.UNIMPLEMENTED,
  }) as grpc.ServiceError;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Request {}

/**
 * MockSpanner is a mocked in-mem Spanner server that manages sessions and transactions automatically. Results for SQL statements must be registered on the server using the MockSpanner.putStatementResult function.
 */
export class MockSpanner {
  private requests: Request[] = [];
  private frozen = 0;
  private sessionCounter = 0;
  private sessions: Map<string, protobuf.Session> = new Map<
    string,
    protobuf.Session
  >();
  private transactionCounters: Map<string, number> = new Map<string, number>();
  private transactions: Map<string, protobuf.Transaction> = new Map<
    string,
    protobuf.Transaction
  >();
  private transactionOptions: Map<
    string,
    protobuf.ITransactionOptions | null | undefined
  > = new Map<string, protobuf.ITransactionOptions | null | undefined>();
  private abortedTransactions: Set<string> = new Set<string>();
  private statementResults: Map<string, StatementResult> = new Map<
    string,
    StatementResult
  >();
  private executionTimes: Map<string, SimulatedExecutionTime> = new Map<
    string,
    SimulatedExecutionTime
  >();

  private constructor() {
    this.putStatementResult = this.putStatementResult.bind(this);
    this.batchCreateSessions = this.batchCreateSessions.bind(this);
    this.createSession = this.createSession.bind(this);
    this.deleteSession = this.deleteSession.bind(this);
    this.getSession = this.getSession.bind(this);
    this.listSessions = this.listSessions.bind(this);

    this.beginTransaction = this.beginTransaction.bind(this);
    this.commit = this.commit.bind(this);
    this.rollback = this.rollback.bind(this);

    this.executeBatchDml = this.executeBatchDml.bind(this);
    this.executeStreamingSql = this.executeStreamingSql.bind(this);
  }

  /**
   * Creates a MockSpanner instance.
   */
  static create(): MockSpanner {
    return new MockSpanner();
  }

  resetRequests(): void {
    this.requests = [];
  }

  /**
   * @return the requests that have been received by this mock server.
   */
  getRequests(): Request[] {
    return this.requests;
  }

  /**
   * Registers a result for an SQL statement on the server.
   * @param sql The SQL statement that should return the result.
   * @param result The result to return.
   */
  putStatementResult(sql: string, result: StatementResult) {
    this.statementResults.set(sql, result);
  }

  removeExecutionTime(fn: Function) {
    this.executionTimes.delete(fn.name);
  }

  setExecutionTime(fn: Function, time: SimulatedExecutionTime) {
    this.executionTimes.set(fn.name, time);
  }

  abortTransaction(transaction: Transaction): void {
    const formattedId = `${transaction.session.formattedName_}/transactions/${transaction.id}`;
    if (this.transactions.has(formattedId)) {
      this.transactions.delete(formattedId);
      this.transactionOptions.delete(formattedId);
      this.abortedTransactions.add(formattedId);
    } else {
      throw new Error(`Transaction ${formattedId} does not exist`);
    }
  }

  freeze() {
    this.frozen++;
  }

  unfreeze() {
    if (this.frozen === 0) {
      throw new Error('This mock server is already unfrozen');
    }
    this.frozen--;
  }

  /**
   * Creates a new session for the given database and adds it to the map of sessions of this server.
   * @param database The database to create the session for.
   */
  private newSession(database: string): protobuf.Session {
    const id = this.sessionCounter++;
    const name = `${database}/sessions/${id}`;
    const session = protobuf.Session.create({name, createTime: now()});
    this.sessions.set(name, session);
    return session;
  }

  private static createSessionNotFoundError(name: string): grpc.ServiceError {
    const error = new Error(`Session not found: ${name}`);
    return Object.assign(error, {
      code: grpc.status.NOT_FOUND,
    }) as grpc.ServiceError;
  }

  private static createTransactionNotFoundError(
    name: string
  ): grpc.ServiceError {
    const error = new Error(`Transaction not found: ${name}`);
    return Object.assign(error, {
      code: grpc.status.NOT_FOUND,
    }) as grpc.ServiceError;
  }

  private static createTransactionAbortedError(
    name: string
  ): grpc.ServiceError {
    const error = Object.assign(new Error(`Transaction aborted: ${name}`), {
      code: grpc.status.ABORTED,
    });
    return Object.assign(error, {
      metadata: this.createMinimalRetryDelayMetadata(),
    }) as grpc.ServiceError;
  }

  static createMinimalRetryDelayMetadata(): grpc.Metadata {
    const metadata = new grpc.Metadata();
    const retry = RetryInfo.encode({
      retryDelay: {
        seconds: 0,
        nanos: 1,
      },
    });
    metadata.add(RETRY_INFO_BIN, Buffer.from(retry.finish()));
    return metadata;
  }

  static sleep(ms): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async simulateExecutionTime(functionName: string): Promise<void> {
    while (this.frozen > 0) {
      await MockSpanner.sleep(10);
    }
    const execTime = this.executionTimes.get(functionName);
    if (execTime) {
      await execTime.simulateExecutionTime();
    }
    if (
      execTime &&
      execTime.errors &&
      execTime.errors.length &&
      !execTime.errors[0].streamIndex
    ) {
      throw execTime.errors.shift();
    }
    return Promise.resolve();
  }

  private shiftStreamError(
    functionName: string,
    index: number
  ): MockError | undefined {
    const execTime = this.executionTimes.get(functionName);
    if (execTime) {
      if (
        execTime.errors &&
        execTime.errors.length &&
        execTime.errors[0].streamIndex === index
      ) {
        return execTime.errors.shift();
      }
    }
    return undefined;
  }

  batchCreateSessions(
    call: grpc.ServerUnaryCall<
      protobuf.BatchCreateSessionsRequest,
      protobuf.BatchCreateSessionsResponse
    >,
    callback: protobuf.Spanner.BatchCreateSessionsCallback
  ) {
    this.requests.push(call.request!);
    this.simulateExecutionTime(this.batchCreateSessions.name)
      .then(() => {
        const sessions = new Array<protobuf.Session>();
        for (let i = 0; i < call.request!.sessionCount; i++) {
          sessions.push(this.newSession(call.request!.database));
        }
        callback(
          null,
          protobuf.BatchCreateSessionsResponse.create({session: sessions})
        );
      })
      .catch(err => {
        callback(err);
      });
  }

  createSession(
    call: grpc.ServerUnaryCall<protobuf.CreateSessionRequest, protobuf.Session>,
    callback: protobuf.Spanner.CreateSessionCallback
  ) {
    this.requests.push(call.request!);
    this.simulateExecutionTime(this.createSession.name).then(() => {
      callback(null, this.newSession(call.request!.database));
    });
  }

  getSession(
    call: grpc.ServerUnaryCall<protobuf.GetSessionRequest, protobuf.Session>,
    callback: protobuf.Spanner.GetSessionCallback
  ) {
    this.requests.push(call.request!);
    this.simulateExecutionTime(this.getSession.name).then(() => {
      const session = this.sessions[call.request!.name];
      if (session) {
        callback(null, session);
      } else {
        callback(MockSpanner.createSessionNotFoundError(call.request!.name));
      }
    });
  }

  listSessions(
    call: grpc.ServerUnaryCall<
      protobuf.ListSessionsRequest,
      protobuf.ListSessionsResponse
    >,
    callback: protobuf.Spanner.ListSessionsCallback
  ) {
    this.requests.push(call.request!);
    this.simulateExecutionTime(this.listSessions.name).then(() => {
      callback(
        null,
        protobuf.ListSessionsResponse.create({
          sessions: Array.from(this.sessions.values()).filter(session => {
            return session.name.startsWith(call.request!.database);
          }),
        })
      );
    });
  }

  deleteSession(
    call: grpc.ServerUnaryCall<
      protobuf.DeleteSessionRequest,
      google.protobuf.Empty
    >,
    callback: protobuf.Spanner.DeleteSessionCallback
  ) {
    this.requests.push(call.request!);
    if (this.sessions.delete(call.request!.name)) {
      callback(null, google.protobuf.Empty.create());
    } else {
      callback(MockSpanner.createSessionNotFoundError(call.request!.name));
    }
  }

  executeSql(
    call: grpc.ServerUnaryCall<protobuf.ExecuteSqlRequest, {}>,
    callback: protobuf.Spanner.ExecuteSqlCallback
  ) {
    this.requests.push(call.request!);
    callback(createUnimplementedError('ExecuteSql is not yet implemented'));
  }

  activeStreams = 0;

  executeStreamingSql(
    call: grpc.ServerWritableStream<
      protobuf.ExecuteSqlRequest,
      protobuf.PartialResultSet
    >
  ) {
    this.activeStreams++;
    // console.log(`Active streams: ${this.activeStreams}`);
    this.requests.push(call.request!);
    this.simulateExecutionTime(this.executeStreamingSql.name)
      .then(() => {
        if (call.request!.transaction && call.request!.transaction.id) {
          const fullTransactionId = `${call.request!.session}/transactions/${
            call.request!.transaction.id
          }`;
          if (this.abortedTransactions.has(fullTransactionId)) {
            call.emit(
              'error',
              MockSpanner.createTransactionAbortedError(`${fullTransactionId}`)
            );
            call.end();
            return;
          }
        }
        const res = this.statementResults.get(call.request!.sql);
        if (res) {
          let partialResultSets;
          let resumeIndex;
          switch (res.type) {
            case StatementResultType.RESULT_SET:
              partialResultSets = MockSpanner.toPartialResultSets(
                res.resultSet,
                call.request!.queryMode
              );
              // Resume on the next index after the last one seen by the client.
              resumeIndex =
                call.request!.resumeToken.length === 0
                  ? 0
                  : Number.parseInt(call.request!.resumeToken.toString(), 10) +
                    1;
              for (
                let index = resumeIndex;
                index < partialResultSets.length;
                index++
              ) {
                const streamErr = this.shiftStreamError(
                  this.executeStreamingSql.name,
                  index
                );
                if (streamErr) {
                  call.emit('error', streamErr);
                  break;
                }
                call.write(partialResultSets[index]);
              }
              break;
            case StatementResultType.UPDATE_COUNT:
              call.write(MockSpanner.toPartialResultSet(res.updateCount));
              break;
            case StatementResultType.ERROR:
              call.emit('error', res.error);
              break;
            default:
              call.emit(
                'error',
                new Error(`Unknown StatementResult type: ${res.type}`)
              );
          }
        } else {
          call.emit(
            'error',
            new Error(`There is no result registered for ${call.request!.sql}`)
          );
        }
        this.activeStreams--;
        call.end();
      })
      .catch(err => {
        call.emit('error', err);
        call.end();
      });
  }

  /**
   * Splits a ResultSet into one PartialResultSet per row. This ensure that we can also test returning multiple partial results sets from a streaming method.
   * @param resultSet The ResultSet to split.
   * @param queryMode The query mode that was used to execute the query.
   */
  private static toPartialResultSets(
    resultSet: protobuf.ResultSet,
    queryMode:
      | google.spanner.v1.ExecuteSqlRequest.QueryMode
      | keyof typeof google.spanner.v1.ExecuteSqlRequest.QueryMode
  ): protobuf.PartialResultSet[] {
    const res: protobuf.PartialResultSet[] = [];
    let first = true;
    for (let i = 0; i < resultSet.rows.length; i++) {
      const token = i.toString().padStart(8, '0');
      const partial = protobuf.PartialResultSet.create({
        resumeToken: Buffer.from(token),
        values: resultSet.rows[i].values,
      });
      if (first) {
        partial.metadata = resultSet.metadata;
        first = false;
      }
      res.push(partial);
    }
    if (queryMode === QueryMode.PROFILE || queryMode === 'PROFILE') {
      // Include an empty query plan and statistics.
      res[res.length - 1].stats = {
        queryStats: {fields: {}},
        queryPlan: {planNodes: []},
      };
    }
    return res;
  }

  private static toPartialResultSet(
    rowCount: number
  ): protobuf.PartialResultSet {
    const stats = {
      rowCountExact: rowCount,
      rowCount: 'rowCountExact',
    };
    return protobuf.PartialResultSet.create({
      stats,
    });
  }

  private static toResultSet(rowCount: number): protobuf.ResultSet {
    const stats = {
      rowCountExact: rowCount,
      rowCount: 'rowCountExact',
    };
    return protobuf.ResultSet.create({
      stats,
    });
  }

  executeBatchDml(
    call: grpc.ServerUnaryCall<
      protobuf.ExecuteBatchDmlRequest,
      protobuf.ExecuteBatchDmlResponse
    >,
    callback: protobuf.Spanner.ExecuteBatchDmlCallback
  ) {
    this.simulateExecutionTime(this.executeBatchDml.name)
      .then(() => {
        if (call.request!.transaction && call.request!.transaction.id) {
          const fullTransactionId = `${call.request!.session}/transactions/${
            call.request!.transaction.id
          }`;
          if (this.abortedTransactions.has(fullTransactionId)) {
            callback(
              MockSpanner.createTransactionAbortedError(`${fullTransactionId}`)
            );
            return;
          }
        }
        const results: ResultSet[] = [];
        let statementStatus = Status.create({code: grpc.status.OK});
        for (
          let i = 0;
          i < call.request!.statements.length &&
          statementStatus.code === grpc.status.OK;
          i++
        ) {
          const streamErr = this.shiftStreamError(this.executeBatchDml.name, i);
          if (streamErr) {
            statementStatus = Status.create({
              code: streamErr.code,
              message: streamErr.message,
            });
            if (streamErr.metadata && streamErr.metadata.get(RETRY_INFO_BIN)) {
              const retryInfo = streamErr.metadata.get(RETRY_INFO_BIN)[0];
              statementStatus.details = [
                Any.create({
                  type_url: RETRY_INFO_TYPE,
                  value: retryInfo,
                }),
              ];
            }
            continue;
          }
          const statement = call.request!.statements[i];
          const res = this.statementResults.get(statement.sql!);
          if (res) {
            switch (res.type) {
              case StatementResultType.RESULT_SET:
                callback(new Error('Wrong result type for batch DML'));
                break;
              case StatementResultType.UPDATE_COUNT:
                results.push(MockSpanner.toResultSet(res.updateCount));
                break;
              case StatementResultType.ERROR:
                if ((res.error as grpc.ServiceError).code) {
                  const serviceError = res.error as grpc.ServiceError;
                  statementStatus = {
                    code: serviceError.code,
                    message: serviceError.message,
                  } as Status;
                } else {
                  statementStatus = {
                    code: grpc.status.INTERNAL,
                    message: res.error.message,
                  } as Status;
                }
                break;
              default:
                callback(
                  new Error(`Unknown StatementResult type: ${res.type}`)
                );
            }
          } else {
            callback(
              new Error(`There is no result registered for ${statement.sql}`)
            );
          }
        }
        callback(
          null,
          ExecuteBatchDmlResponse.create({
            resultSets: results,
            status: statementStatus,
          })
        );
      })
      .catch(err => {
        callback(err);
      });
  }

  read(
    call: grpc.ServerUnaryCall<protobuf.ReadRequest, {}>,
    callback: protobuf.Spanner.ReadCallback
  ) {
    this.requests.push(call.request!);
    callback(createUnimplementedError('Read is not yet implemented'));
  }

  streamingRead(call: grpc.ServerWritableStream<protobuf.ReadRequest, {}>) {
    this.requests.push(call.request!);
    call.emit(
      'error',
      createUnimplementedError('StreamingRead is not yet implemented')
    );
    call.end();
  }

  beginTransaction(
    call: grpc.ServerUnaryCall<
      protobuf.BeginTransactionRequest,
      protobuf.Transaction
    >,
    callback: protobuf.Spanner.BeginTransactionCallback
  ) {
    this.requests.push(call.request!);
    this.simulateExecutionTime(this.beginTransaction.name)
      .then(() => {
        const session = this.sessions.get(call.request!.session);
        if (session) {
          let counter = this.transactionCounters.get(session.name);
          if (!counter) {
            counter = 0;
          }
          const id = ++counter;
          this.transactionCounters.set(session.name, counter);
          const transactionId = id.toString().padStart(12, '0');
          const fullTransactionId =
            session.name + '/transactions/' + transactionId;
          const readTimestamp =
            call.request!.options && call.request!.options.readOnly
              ? now()
              : undefined;
          const transaction = protobuf.Transaction.create({
            id: Buffer.from(transactionId),
            readTimestamp,
          });
          this.transactions.set(fullTransactionId, transaction);
          this.transactionOptions.set(fullTransactionId, call.request!.options);
          callback(null, transaction);
        } else {
          callback(
            MockSpanner.createSessionNotFoundError(call.request!.session)
          );
        }
      })
      .catch(err => {
        callback(err);
      });
  }

  commit(
    call: grpc.ServerUnaryCall<protobuf.CommitRequest, protobuf.CommitResponse>,
    callback: protobuf.Spanner.CommitCallback
  ) {
    this.simulateExecutionTime(this.commit.name)
      .then(() => {
        if (call.request!.transactionId) {
          const fullTransactionId = `${call.request!.session}/transactions/${
            call.request!.transactionId
          }`;
          if (this.abortedTransactions.has(fullTransactionId)) {
            callback(
              MockSpanner.createTransactionAbortedError(`${fullTransactionId}`)
            );
            return;
          }
        }
        const session = this.sessions.get(call.request!.session);
        if (session) {
          const buffer = Buffer.from(call.request!.transactionId as string);
          const transactionId = buffer.toString();
          const fullTransactionId =
            session.name + '/transactions/' + transactionId;
          const transaction = this.transactions.get(fullTransactionId);
          if (transaction) {
            this.transactions.delete(fullTransactionId);
            this.transactionOptions.delete(fullTransactionId);
            callback(
              null,
              protobuf.CommitResponse.create({
                commitTimestamp: now(),
              })
            );
          } else {
            callback(
              MockSpanner.createTransactionNotFoundError(fullTransactionId)
            );
          }
        } else {
          callback(
            MockSpanner.createSessionNotFoundError(call.request!.session)
          );
        }
      })
      .catch(err => {
        callback(err);
      });
  }

  rollback(
    call: grpc.ServerUnaryCall<protobuf.RollbackRequest, google.protobuf.Empty>,
    callback: protobuf.Spanner.RollbackCallback
  ) {
    this.requests.push(call.request!);
    const session = this.sessions.get(call.request!.session);
    if (session) {
      const buffer = Buffer.from(call.request!.transactionId as string);
      const transactionId = buffer.toString();
      const fullTransactionId = session.name + '/transactions/' + transactionId;
      const transaction = this.transactions.get(fullTransactionId);
      if (transaction) {
        this.transactions.delete(fullTransactionId);
        this.transactionOptions.delete(fullTransactionId);
        callback(null, google.protobuf.Empty.create());
      } else {
        callback(MockSpanner.createTransactionNotFoundError(fullTransactionId));
      }
    } else {
      callback(MockSpanner.createSessionNotFoundError(call.request!.session));
    }
  }

  partitionQuery(
    call: grpc.ServerUnaryCall<protobuf.PartitionQueryRequest, {}>,
    callback: protobuf.Spanner.PartitionQueryCallback
  ) {
    this.requests.push(call.request!);
    callback(createUnimplementedError('PartitionQuery is not yet implemented'));
  }

  partitionRead(
    call: grpc.ServerUnaryCall<protobuf.PartitionReadRequest, {}>,
    callback: protobuf.Spanner.PartitionReadCallback
  ) {
    this.requests.push(call.request!);
    callback(createUnimplementedError('PartitionQuery is not yet implemented'));
  }
}

/**
 * Creates and adds a MockSpanner instance to the given server. The MockSpanner instance does not contain any mocked results.
 */
export function createMockSpanner(server: grpc.Server): MockSpanner {
  const mock = MockSpanner.create();
  server.addService(spannerProtoDescriptor.Spanner.service, {
    batchCreateSessions: mock.batchCreateSessions,
    createSession: mock.createSession,
    getSession: mock.getSession,
    listSessions: mock.listSessions,
    deleteSession: mock.deleteSession,
    executeSql: mock.executeSql,
    executeStreamingSql: mock.executeStreamingSql,
    executeBatchDml: mock.executeBatchDml,
    read: mock.read,
    streamingRead: mock.streamingRead,
    beginTransaction: mock.beginTransaction,
    commit: mock.commit,
    rollback: mock.rollback,
    partitionQuery: mock.partitionQuery,
    partitionRead: mock.partitionRead,
  });
  return mock;
}

/**
 * Creates a simple result set containing the following data:
 *
 * |-----------------------------|
 * | NUM (INT64) | NAME (STRING) |
 * |-----------------------------|
 * |           1 | 'One'         |
 * |           2 | 'Two'         |
 * |           3 | 'Three'       |
 * -------------------------------
 *
 * This ResultSet can be used to easily mock queries on a mock Spanner server.
 */
export function createSimpleResultSet(): protobuf.ResultSet {
  const fields = [
    protobuf.StructType.Field.create({
      name: 'NUM',
      type: protobuf.Type.create({code: protobuf.TypeCode.INT64}),
    }),
    protobuf.StructType.Field.create({
      name: 'NAME',
      type: protobuf.Type.create({code: protobuf.TypeCode.STRING}),
    }),
  ];
  const metadata = new protobuf.ResultSetMetadata({
    rowType: new protobuf.StructType({
      fields,
    }),
  });
  return protobuf.ResultSet.create({
    metadata,
    rows: [
      {values: [{stringValue: '1'}, {stringValue: 'One'}]},
      {values: [{stringValue: '2'}, {stringValue: 'Two'}]},
      {values: [{stringValue: '3'}, {stringValue: 'Three'}]},
    ],
  });
}

/**
 * Returns a protobuf Timestamp containing the current local system time.
 */
export function now(): Timestamp {
  const now = Date.now();
  return Timestamp.create({seconds: now / 1000, nanos: (now % 1000) * 1e6});
}
