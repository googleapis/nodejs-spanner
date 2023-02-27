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

import * as path from 'path';
import {google} from '../../protos/protos';
import {grpc, ServiceError} from 'google-gax';
import * as protoLoader from '@grpc/proto-loader';
// eslint-disable-next-line node/no-extraneous-import
import {Metadata} from '@grpc/grpc-js';
import {Transaction} from '../../src';
import protobuf = google.spanner.v1;
import Timestamp = google.protobuf.Timestamp;
import RetryInfo = google.rpc.RetryInfo;
import ExecuteBatchDmlResponse = google.spanner.v1.ExecuteBatchDmlResponse;
import ResultSet = google.spanner.v1.ResultSet;
import Status = google.rpc.Status;
import Any = google.protobuf.Any;
import QueryMode = google.spanner.v1.ExecuteSqlRequest.QueryMode;
import NullValue = google.protobuf.NullValue;

const PROTO_PATH = 'spanner.proto';
const IMPORT_PATH = __dirname + '/../../../protos';
const PROTO_DIR = __dirname + '/../../../protos/google/spanner/v1';
const GAX_PROTO_DIR = path.join(
  path.dirname(require.resolve('google-gax')),
  '..',
  'protos'
);

/**
 * Load the Spanner service proto.
 */
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [IMPORT_PATH, PROTO_DIR, GAX_PROTO_DIR],
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
  private readonly _resultSet:
    | protobuf.ResultSet
    | protobuf.PartialResultSet[]
    | null;
  get resultSet(): protobuf.ResultSet | protobuf.PartialResultSet[] {
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
    resultSet: protobuf.ResultSet | protobuf.PartialResultSet[] | null,
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
  static resultSet(
    resultSet: protobuf.ResultSet | protobuf.PartialResultSet[]
  ): StatementResult {
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
   * @param error The status error to return.
   */
  static updateCount(updateCount: number, error?: Error): StatementResult {
    return new StatementResult(
      StatementResultType.UPDATE_COUNT,
      error || null,
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
  private metadata: Metadata[] = [];
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

    this.read = this.read.bind(this);
    this.streamingRead = this.streamingRead.bind(this);
  }

  /**
   * Creates a MockSpanner instance.
   */
  static create(): MockSpanner {
    return new MockSpanner();
  }

  resetRequests(): void {
    this.requests = [];
    this.metadata = [];
  }

  /**
   * @return the requests that have been received by this mock server.
   */
  getRequests(): Request[] {
    return this.requests;
  }

  /**
   * @return the metadata that have been received by this mock server.
   */
  getMetadata(): Metadata[] {
    return this.metadata;
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

  removeExecutionTimes() {
    this.executionTimes.clear();
  }

  abortTransaction(transaction: Transaction): void {
    const formattedId = `${transaction.session.formattedName_}/transactions/${transaction.id}`;
    if (this.transactions.has(formattedId) || !transaction.id) {
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

  private pushRequest(request: Request, metadata: Metadata): void {
    this.requests.push(request);
    this.metadata.push(metadata);
  }

  batchCreateSessions(
    call: grpc.ServerUnaryCall<
      protobuf.BatchCreateSessionsRequest,
      protobuf.BatchCreateSessionsResponse
    >,
    callback: protobuf.Spanner.BatchCreateSessionsCallback
  ) {
    this.pushRequest(call.request!, call.metadata);
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
    this.pushRequest(call.request!, call.metadata);
    this.simulateExecutionTime(this.createSession.name).then(() => {
      callback(null, this.newSession(call.request!.database));
    });
  }

  getSession(
    call: grpc.ServerUnaryCall<protobuf.GetSessionRequest, protobuf.Session>,
    callback: protobuf.Spanner.GetSessionCallback
  ) {
    this.pushRequest(call.request!, call.metadata);
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
    this.pushRequest(call.request!, call.metadata);
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
    this.pushRequest(call.request!, call.metadata);
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
    this.pushRequest(call.request!, call.metadata);
    callback(createUnimplementedError('ExecuteSql is not yet implemented'));
  }

  executeStreamingSql(
    call: grpc.ServerWritableStream<
      protobuf.ExecuteSqlRequest,
      protobuf.PartialResultSet
    >
  ) {
    this.pushRequest(call.request!, call.metadata);
    this.simulateExecutionTime(this.executeStreamingSql.name)
      .then(() => {
        if (call.request!.transaction) {
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
          if (call.request!.transaction?.begin) {
            const txn = this._updateTransaction(
              call.request!.session,
              call.request!.transaction.begin
            );
            if (txn instanceof Error) {
              call.emit('error', txn);
              call.end();
              return;
            }
            if (res.type === StatementResultType.RESULT_SET) {
              (res.resultSet as protobuf.ResultSet).metadata!.transaction = txn;
            }
          }
          let partialResultSets;
          let resumeIndex;
          let streamErr;
          switch (res.type) {
            case StatementResultType.RESULT_SET:
              if (Array.isArray(res.resultSet)) {
                partialResultSets = res.resultSet;
              } else {
                partialResultSets = MockSpanner.toPartialResultSets(
                  res.resultSet,
                  call.request!.queryMode
                );
              }
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
              call.write(
                MockSpanner.emptyPartialResultSet(
                  Buffer.from('1'.padStart(8, '0'))
                )
              );
              streamErr = this.shiftStreamError(
                this.executeStreamingSql.name,
                1
              );
              if (streamErr) {
                call.emit('error', streamErr);
                break;
              }
              call.write(MockSpanner.toPartialResultSet(res.updateCount));
              break;
            case StatementResultType.ERROR:
              call.sendMetadata(new Metadata());
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
        call.end();
      })
      .catch(err => {
        call.sendMetadata(new Metadata());
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
      | keyof typeof google.spanner.v1.ExecuteSqlRequest.QueryMode,
    rowsPerPartialResultSet = 1
  ): protobuf.PartialResultSet[] {
    const res: protobuf.PartialResultSet[] = [];
    let first = true;
    for (let i = 0; i < resultSet.rows.length; i += rowsPerPartialResultSet) {
      const token = i.toString().padStart(8, '0');
      const partial = protobuf.PartialResultSet.create({
        resumeToken: Buffer.from(token),
        values: [],
      });
      for (
        let row = i;
        row < Math.min(i + rowsPerPartialResultSet, resultSet.rows.length);
        row++
      ) {
        partial.values.push(...resultSet.rows[row].values!);
      }
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

  private static emptyPartialResultSet(
    resumeToken: Uint8Array
  ): protobuf.PartialResultSet {
    return protobuf.PartialResultSet.create({
      resumeToken,
    });
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
    this.pushRequest(call.request!, call.metadata);
    this.simulateExecutionTime(this.executeBatchDml.name)
      .then(() => {
        if (call.request!.transaction) {
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
              case StatementResultType.UPDATE_COUNT: {
                const resultSet = MockSpanner.toResultSet(res.updateCount);
                if (call.request!.transaction!.begin && i === 0) {
                  const transaction = this._updateTransaction(
                    call.request!.session,
                    call.request?.transaction!.begin
                  );
                  if (transaction instanceof Error) {
                    callback(transaction);
                    break;
                  }
                  resultSet.metadata = protobuf.ResultSetMetadata.create({
                    transaction,
                  });
                }
                results.push(resultSet);
                break;
              }
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
    this.pushRequest(call.request!, call.metadata);
    callback(createUnimplementedError('Read is not yet implemented'));
  }

  streamingRead(call: grpc.ServerWritableStream<protobuf.ReadRequest, {}>) {
    this.pushRequest(call.request!, call.metadata);
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
    this.pushRequest(call.request!, call.metadata);
    this.simulateExecutionTime(this.beginTransaction.name)
      .then(() => {
        const res = this._updateTransaction(
          call.request!.session,
          call.request!.options
        );
        if (res instanceof Error) {
          callback(res);
        } else {
          callback(null, res);
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
    this.pushRequest(call.request!, call.metadata);
    this.simulateExecutionTime(this.commit.name)
      .then(() => {
        const fullTransactionId = `${call.request!.session}/transactions/${
          call.request!.transactionId
        }`;
        if (this.abortedTransactions.has(fullTransactionId)) {
          callback(
            MockSpanner.createTransactionAbortedError(`${fullTransactionId}`)
          );
          return;
        }
        const session = this.sessions.get(call.request!.session);
        if (session) {
          if (call.request!.transactionId) {
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
          } else if (call.request!.singleUseTransaction) {
            callback(
              null,
              protobuf.CommitResponse.create({
                commitTimestamp: now(),
              })
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
    this.pushRequest(call.request!, call.metadata);
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
    this.pushRequest(call.request!, call.metadata);
    callback(createUnimplementedError('PartitionQuery is not yet implemented'));
  }

  partitionRead(
    call: grpc.ServerUnaryCall<protobuf.PartitionReadRequest, {}>,
    callback: protobuf.Spanner.PartitionReadCallback
  ) {
    this.pushRequest(call.request!, call.metadata);
    callback(createUnimplementedError('PartitionQuery is not yet implemented'));
  }

  private _updateTransaction(
    sessionName: string,
    options: google.spanner.v1.ITransactionOptions | null | undefined
  ): google.spanner.v1.Transaction | ServiceError {
    const session = this.sessions.get(sessionName);
    if (!session) {
      return MockSpanner.createSessionNotFoundError(sessionName);
    }
    let counter = this.transactionCounters.get(session.name);
    if (!counter) {
      counter = 0;
    }
    const id = ++counter;
    this.transactionCounters.set(session.name, counter);
    const transactionId = id.toString().padStart(12, '0');
    const fullTransactionId = session.name + '/transactions/' + transactionId;
    const readTimestamp = options && options.readOnly ? now() : undefined;
    const transaction = protobuf.Transaction.create({
      id: Buffer.from(transactionId),
      readTimestamp,
    });
    this.transactions.set(fullTransactionId, transaction);
    this.transactionOptions.set(fullTransactionId, options);
    return transaction;
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

export const NUM_ROWS_LARGE_RESULT_SET = 100;

export function createLargeResultSet(): protobuf.ResultSet {
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
  const rows: google.protobuf.IListValue[] = [];
  for (let num = 1; num <= NUM_ROWS_LARGE_RESULT_SET; num++) {
    rows.push({
      values: [
        {stringValue: `${num}`},
        {stringValue: generateRandomString(100)},
      ],
    });
  }
  return protobuf.ResultSet.create({
    metadata,
    rows,
  });
}

export function createSelect1ResultSet(): protobuf.ResultSet {
  const fields = [
    protobuf.StructType.Field.create({
      name: '',
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

export function createResultSetWithAllDataTypes(): protobuf.ResultSet {
  const fields = [
    protobuf.StructType.Field.create({
      name: 'COLBOOL',
      type: protobuf.Type.create({code: protobuf.TypeCode.BOOL}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLINT64',
      type: protobuf.Type.create({code: protobuf.TypeCode.INT64}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLFLOAT64',
      type: protobuf.Type.create({code: protobuf.TypeCode.FLOAT64}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLNUMERIC',
      type: protobuf.Type.create({code: protobuf.TypeCode.NUMERIC}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLSTRING',
      type: protobuf.Type.create({code: protobuf.TypeCode.STRING}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLBYTES',
      type: protobuf.Type.create({code: protobuf.TypeCode.BYTES}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLJSON',
      type: protobuf.Type.create({code: protobuf.TypeCode.JSON}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLDATE',
      type: protobuf.Type.create({code: protobuf.TypeCode.DATE}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLTIMESTAMP',
      type: protobuf.Type.create({code: protobuf.TypeCode.TIMESTAMP}),
    }),
    protobuf.StructType.Field.create({
      name: 'COLBOOLARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({code: protobuf.TypeCode.BOOL}),
      }),
    }),
    protobuf.StructType.Field.create({
      name: 'COLINT64ARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({code: protobuf.TypeCode.INT64}),
      }),
    }),
    protobuf.StructType.Field.create({
      name: 'COLFLOAT64ARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({
          code: protobuf.TypeCode.FLOAT64,
        }),
      }),
    }),
    protobuf.StructType.Field.create({
      name: 'COLNUMERICARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({
          code: protobuf.TypeCode.NUMERIC,
        }),
      }),
    }),
    protobuf.StructType.Field.create({
      name: 'COLSTRINGARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({
          code: protobuf.TypeCode.STRING,
        }),
      }),
    }),
    protobuf.StructType.Field.create({
      name: 'COLBYTESARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({code: protobuf.TypeCode.BYTES}),
      }),
    }),
    protobuf.StructType.Field.create({
      name: 'COLJSONARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({code: protobuf.TypeCode.JSON}),
      }),
    }),
    protobuf.StructType.Field.create({
      name: 'COLDATEARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({code: protobuf.TypeCode.DATE}),
      }),
    }),
    protobuf.StructType.Field.create({
      name: 'COLTIMESTAMPARRAY',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({
          code: protobuf.TypeCode.TIMESTAMP,
        }),
      }),
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
      {
        values: [
          {boolValue: true},
          {stringValue: '1'},
          {numberValue: 3.14},
          {stringValue: '6.626'},
          {stringValue: 'One'},
          {stringValue: Buffer.from('test').toString('base64')},
          {stringValue: '{"result":true, "count":42}'},
          {stringValue: '2021-05-11'},
          {stringValue: '2021-05-11T16:46:04.872Z'},
          {
            listValue: {
              values: [
                {boolValue: true},
                {boolValue: false},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '1'},
                {stringValue: '100'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {numberValue: 3.14},
                {numberValue: 100.9},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '6.626'},
                {stringValue: '100'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: 'One'},
                {stringValue: 'test'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: Buffer.from('test1').toString('base64')},
                {stringValue: Buffer.from('test2').toString('base64')},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '{"result":true, "count":42}'},
                {stringValue: '{}'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '2021-05-12'},
                {stringValue: '2000-02-29'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '2021-05-12T08:38:19.8474Z'},
                {stringValue: '2000-02-29T07:00:00Z'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
        ],
      },
      {
        values: [
          {boolValue: false},
          {stringValue: '2'},
          {numberValue: 3.14},
          {stringValue: '6.626'},
          {stringValue: 'Two'},
          {stringValue: Buffer.from('test').toString('base64')},
          {stringValue: '{"result":true, "count":42}'},
          {stringValue: '2021-05-11'},
          {stringValue: '2021-05-11T16:46:04.872Z'},
          {
            listValue: {
              values: [
                {boolValue: true},
                {boolValue: false},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '2'},
                {stringValue: '200'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {numberValue: 3.14},
                {numberValue: 100.9},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '6.626'},
                {stringValue: '100'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: 'Two'},
                {stringValue: 'test'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: Buffer.from('test1').toString('base64')},
                {stringValue: Buffer.from('test2').toString('base64')},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '{"result":true, "count":42}'},
                {stringValue: '{}'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '2021-05-12'},
                {stringValue: '2000-02-29'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
          {
            listValue: {
              values: [
                {stringValue: '2021-05-12T08:38:19.8474Z'},
                {stringValue: '2000-02-29T07:00:00Z'},
                {nullValue: NullValue.NULL_VALUE},
              ],
            },
          },
        ],
      },
      {
        values: [
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
          {nullValue: NullValue.NULL_VALUE},
        ],
      },
    ],
  });
}

export function createResultSetWithStringArray(): protobuf.ResultSet {
  const fields = [
    protobuf.StructType.Field.create({
      name: 'string1',
      type: protobuf.Type.create({code: protobuf.TypeCode.STRING}),
    }),
    protobuf.StructType.Field.create({
      name: 'string2',
      type: protobuf.Type.create({code: protobuf.TypeCode.STRING}),
    }),
    protobuf.StructType.Field.create({
      name: 'bool1',
      type: protobuf.Type.create({code: protobuf.TypeCode.BOOL}),
    }),
    protobuf.StructType.Field.create({
      name: 'stringArray',
      type: protobuf.Type.create({
        code: protobuf.TypeCode.ARRAY,
        arrayElementType: protobuf.Type.create({
          code: protobuf.TypeCode.STRING,
        }),
      }),
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
      {
        values: [
          {stringValue: 'test1_1'},
          {stringValue: 'test2_1'},
          {boolValue: true},
          {
            listValue: {
              values: [{stringValue: 'One'}, {stringValue: 'test 1'}],
            },
          },
        ],
      },
      {
        values: [
          {stringValue: 'test1_2'},
          {stringValue: 'test2_2'},
          {boolValue: true},
          {
            listValue: {
              values: [{stringValue: 'Two'}, {stringValue: 'test 2'}],
            },
          },
        ],
      },
      {
        values: [
          {stringValue: 'test1_3'},
          {stringValue: 'test2_3'},
          {boolValue: true},
          {
            listValue: {
              values: [{stringValue: 'Three'}, {stringValue: 'test 3'}],
            },
          },
        ],
      },
    ],
  });
}

function generateRandomString(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Returns a protobuf Timestamp containing the current local system time.
 */
export function now(): Timestamp {
  const now = Date.now();
  return Timestamp.create({seconds: now / 1000, nanos: (now % 1000) * 1e6});
}
