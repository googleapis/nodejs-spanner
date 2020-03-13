/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import {CallOptions, GrpcClientOptions} from 'google-gax';
import {ClientReadableStream, ServiceError} from 'grpc';
import {common as protobuf} from 'protobufjs';
import {google} from '../../protos/protos';

declare class SpannerClient {
  static servicePath: string;
  static port: number;
  static scopes: string[];

  constructor(opts: GrpcClientOptions);

  getProjectId(callback: SpannerClient.GetProjectIdCallback): void;

  createSession(request: SpannerClient.CreateSessionRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.Session]>;
  createSession(request: SpannerClient.CreateSessionRequest, callback: SpannerClient.CreateSessionCallback): void;
  createSession(request: SpannerClient.CreateSessionRequest, options: CallOptions, callback: SpannerClient.CreateSessionCallback): void;

  getSession(request: SpannerClient.GetSessionRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.Session]>;
  getSession(request: SpannerClient.GetSessionRequest, callback: SpannerClient.GetSessionCallback): void;
  getSession(request: SpannerClient.GetSessionRequest, options: CallOptions, callback: SpannerClient.GetSessionCallback): void;

  listSessions(request: SpannerClient.ListSessionsRequest, options?: CallOptions): SpannerClient.CancelablePromise<SpannerClient.ListSessionsPaginated | SpannerClient.ListSessionsUnpaginated>;
  listSessions(request: SpannerClient.ListSessionsRequest, callback: SpannerClient.ListSessionsCallback): void;
  listSessions(request: SpannerClient.ListSessionsRequest, options: CallOptions, callback: SpannerClient.ListSessionsCallback): void;

  listSessionsStream(request: SpannerClient.ListSessionsRequest, options?: CallOptions): ClientReadableStream<SpannerClient.Session>;

  deleteSession(request: SpannerClient.DeleteSessionRequest, options?: CallOptions): SpannerClient.CancelablePromise<protobuf.IEmpty>;
  deleteSession(request: SpannerClient.DeleteSessionRequest, callback: SpannerClient.DeleteSessionCallback): void;
  deleteSession(request: SpannerClient.DeleteSessionRequest, options: CallOptions, callback: SpannerClient.DeleteSessionCallback): void;

  executeBatchDml(request: SpannerClient.ExecuteBatchDmlRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.ExecuteBatchDmlResponse]>;
  executeBatchDml(request: SpannerClient.ExecuteBatchDmlRequest, callback: SpannerClient.ExecuteBatchDmlCallback): void;
  executeBatchDml(request: SpannerClient.ExecuteBatchDmlRequest, options: CallOptions, callback: SpannerClient.ExecuteBatchDmlCallback): void;

  executeSql(request: SpannerClient.ExecuteSqlRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.ResultSet]>;
  executeSql(request: SpannerClient.ExecuteSqlRequest, callback: SpannerClient.ExecuteSqlCallback): void;
  executeSql(request: SpannerClient.ExecuteSqlRequest, options: CallOptions, callback: SpannerClient.ExecuteSqlCallback): void;

  executeStreamingSql(request: SpannerClient.ExecuteSqlRequest, options?: CallOptions): ClientReadableStream<SpannerClient.PartialResultSet>;

  read(request: SpannerClient.ReadRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.ResultSet]>;
  read(request: SpannerClient.ReadRequest, callback: SpannerClient.ReadCallback): void;
  read(request: SpannerClient.ReadRequest, options: CallOptions, callback: SpannerClient.ReadCallback): void;

  streamingRead(request: SpannerClient.ReadRequest, options?: CallOptions): ClientReadableStream<SpannerClient.PartialResultSet>;

  beginTransaction(request: SpannerClient.BeginTransactionRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.Transaction]>;
  beginTransaction(request: SpannerClient.BeginTransactionRequest, callback: SpannerClient.BeginTransactionCallback): void;
  beginTransaction(request: SpannerClient.BeginTransactionRequest, options: CallOptions, callback: SpannerClient.BeginTransactionCallback): void;

  commit(request: SpannerClient.CommitRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.CommitResponse]>;
  commit(request: SpannerClient.CommitRequest, callback: SpannerClient.CommitCallback): void;
  commit(request: SpannerClient.CommitRequest, options: CallOptions, callback: SpannerClient.CommitCallback): void;

  rollback(request: SpannerClient.RollbackRequest, options?: CallOptions): SpannerClient.CancelablePromise<protobuf.IEmpty>;
  rollback(request: SpannerClient.RollbackRequest, callback: SpannerClient.RollbackCallback): void;
  rollback(request: SpannerClient.RollbackRequest, options: CallOptions, callback: SpannerClient.RollbackCallback): void;

  paritionQuery(request: SpannerClient.PartitionQueryRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.PartitionResponse]>;
  paritionQuery(request: SpannerClient.PartitionQueryRequest, callback: SpannerClient.PartitionQueryCallback): void;
  paritionQuery(request: SpannerClient.PartitionQueryRequest, options: CallOptions, callback: SpannerClient.PartitionQueryCallback): void;

  partitionRead(request: SpannerClient.PartitionReadRequest, options?: CallOptions): SpannerClient.CancelablePromise<[SpannerClient.PartitionResponse]>;
  partitionRead(request: SpannerClient.PartitionReadRequest, callback: SpannerClient.PartitionQueryCallback): void;
  partitionRead(request: SpannerClient.PartitionReadRequest, options: CallOptions, callback: SpannerClient.PartitionQueryCallback): void;

  databasePath(project: string, instance: string, database: string): string;

  sessionPath(project: string, instance: string, database: string, session: string): string;

  matchProjectFromDatabaseName(databaseName: string): string;

  matchInstanceFromDatabaseName(databaseName: string): string;

  matchDatabaseFromDatabaseName(databaseName: string): string;

  matchProjectFromSessionName(sessionName: string): string;

  matchInstanceFromSessionName(sessionName: string): string;

  matchDatabaseFromSessionName(sessionName: string): string;

  matchSessionFromSessionName(sessionName: string): string;
}

declare namespace SpannerClient {
  import Status = google.rpc.Status;

  interface CancelablePromise<T> extends Promise<T> {
    cancel(): void;
  }

  interface GetProjectIdCallback {
    (error: null | Error, projectId: string): void;
  }

  interface CreateSessionRequest {
    database: string;
    session?: Session;
  }

  interface Session {
    name: string,
    labels: Array<[string, string]>,
    createTime?: protobuf.ITimestamp,
    approximateLastUseTime?: protobuf.ITimestamp,
  }

  interface CreateSessionCallback {
    (error: null | ServiceError, session: Session): void;
  }

  interface GetSessionRequest {
    name: string;
  }

  interface GetSessionCallback {
    (error: null | ServiceError, session: Session): void;
  }

  interface ListSessionsRequest {
    database: string;
    pageSize: number;
    pageToken: string;
    filter: string;
  }

  interface ListSessionsResponse {
    sessions: Session[];
    nextPageToken: string;
  }

  type ListSessionsPaginated = [Session[]];
  type ListSessionsUnpaginated = [Session[], null | ListSessionsRequest, ListSessionsResponse];

  interface ListSessionsCallback {
    (error: null | ServiceError, sessions: Session[], nextQuery?: ListSessionsRequest, response?: ListSessionsResponse): void;
  }

  interface DeleteSessionRequest {
    name: string;
  }

  interface DeleteSessionCallback {
    (error: null | ServiceError): void;
  }

  interface Statement {
    sql: string;
    params?: protobuf.IStruct;
    paramTypes?: {[field: string]: Type};
  }

  interface ExecuteBatchDmlRequest {
    session: string;
    transaction: TransactionSelector;
    statements: Statement[];
    seqno: number;
  }

  interface ExecuteBatchDmlResponse {
    resultSets: ResultSet[];
    status: Status;
  }

  interface ExecuteBatchDmlCallback {
    (error: null | ServiceError, response: ExecuteBatchDmlResponse): void;
  }

  const enum QueryMode {
    NORMAL,
    PLAN,
    PROFILE
  }

  interface ExecuteSqlRequest {
    session: string;
    transaction?: TransactionSelector;
    sql: string;
    params?: protobuf.IStruct;
    paramTypes?: {[field: string]: Type};
    resumeToken?: Uint8Array | string;
    queryMode?: QueryMode;
    partitionToken?: Uint8Array | string;
    seqno?: number;
    queryOptions?: google.spanner.v1.ExecuteSqlRequest.IQueryOptions;
  }

  interface ExecuteSqlCallback {
    (error: null | ServiceError, results: ResultSet): void;
  }

  interface PartitionOptions {
    partitionSizeBytes: number;
    maxPartitions: number;
  }

  interface PartitionQueryRequest {
    session: string;
    transaction?: TransactionSelector;
    sql: string;
    params?: protobuf.IStruct;
    paramTypes: Array<[string, Type]>;
    partitionOptions?: PartitionOptions;
  }

  interface PartitionReadRequest {
    session: string;
    transaction?: TransactionSelector;
    table: string;
    index: string;
    columns: string[];
    keySet?: KeySet;
    partitionOptions?: PartitionOptions;
  }

  interface Partition {
    partitionToken: Uint8Array | string;
  }

  interface PartitionResponse {
    partitions: Partition[];
    transaction?: Transaction;
  }

  interface PartitionQueryCallback {
    (error: null | ServiceError, response: PartitionResponse): void;
  }

  interface ReadRequest {
    session: string;
    transaction?: TransactionSelector;
    table: string;
    index?: string;
    columns?: string[];
    keySet: KeySet;
    limit?: number;
    resumeToken?: Uint8Array | string;
    partitionToken?: Uint8Array | string;
  }

  interface ReadCallback {
    (error: null | ServiceError, results: ResultSet): void;
  }

  interface BeginTransactionRequest {
    session: string;
    options?: TransactionOptions;
  }

  interface BeginTransactionCallback {
    (error: null | ServiceError, transaction: Transaction): void;
  }

  interface CommitRequest {
    session: string;
    transactionId?: Uint8Array | string;
    singleUseTransaction?: TransactionOptions;
    mutations: Mutation[];
  }

  interface CommitResponse {
    commitTimestamp?: protobuf.ITimestamp;
  }

  interface CommitCallback {
    (error: null | ServiceError, response?: CommitResponse): void;
  }

  interface RollbackRequest {
    session: string;
    transactionId: Uint8Array | string;
  }

  interface RollbackCallback {
    (error: null | ServiceError): void;
  }

  interface KeyRange {
    startClosed?: protobuf.IListValue;
    startOpen?: protobuf.IListValue;
    endClosed?: protobuf.IListValue;
    endOpen?: protobuf.IListValue;
  }

  interface KeySet {
    keys?: protobuf.IListValue[];
    ranges?: KeyRange[];
    all?: boolean;
  }

  interface Write {
    table: string;
    columns: string[];
    values: protobuf.IListValue[];
  }

  interface Delete {
    table: string;
    keySet?: KeySet;
  }

  interface Mutation {
    insert?: Write;
    update?: Write;
    insertOrUpdate?: Write;
    replace?: Write;
    delete?: Delete;
  }

  interface ResultSet {
    metadata?: ResultSetMetadata;
    rows: protobuf.IListValue[];
    stats?: ResultSetStats;
  }

  interface PartialResultSet {
    metadata?: ResultSetMetadata;
    values: protobuf.IValue[];
    chunkedValue: boolean;
    resumeToken: Uint8Array | string;
    stats?: ResultSetStats;
  }

  interface ResultSetMetadata {
    rowType?: StructType;
    transaction?: Transaction;
  }

  interface ResultSetStats {
    queryPlan?: QueryPlan;
    queryStats?: protobuf.IStruct;
    rowCount: string;
    rowCountExact?: number;
    rowCountLowerBound?: number;
  }

  enum Kind {
    KIND_UNSPECIFIED,
    RELATIONAL,
    SCALAR
  }

  interface ChildLink {
    childIndex: number;
    type: string;
    variable: string;
  }

  interface ShortRepresentation {
    description: string;
    subqueries: Array<[string, number]>
  }

  interface PlanNode {
    index: number;
    kind: Kind;
    displayName: string;
    childLinks: ChildLink[];
    shortRepresentation?: ShortRepresentation;
    metadata?: protobuf.IStruct;
    executionStats?: protobuf.IStruct;
  }

  interface QueryPlan {
    planNodes: PlanNode[];
  }

  interface ReadOnly {
    strong?: boolean;
    minReadTimestamp?: protobuf.ITimestamp;
    maxStaleness?: protobuf.IDuration;
    readTimestamp?: protobuf.ITimestamp;
    exactStaleness?: protobuf.IDuration;
    returnReadTimestamp?: boolean;
  }

  interface ReadWrite {}

  interface PartitionedDml {}

  interface TransactionOptions {
    readWrite?: ReadWrite;
    partitionedDml?: PartitionedDml;
    readOnly?: ReadOnly;
  }

  interface Transaction {
    id: Uint8Array | string;
    readTimestamp?: protobuf.ITimestamp;
  }

  interface TransactionSelector {
    singleUse?: TransactionOptions;
    id?: Uint8Array | string;
    begin?: TransactionOptions;
  }

  const enum TypeCode {
    TYPE_CODE_UNSPECIFIED = 'TYPE_CODE_UNSPECIFIED',
    BOOL = 'BOOL',
    INT64 = 'INT64',
    FLOAT64 = 'FLOAT64',
    TIMESTAMP = 'TIMESTAMP',
    DATE = 'DATE',
    STRING = 'STRING',
    BYTES = 'BYTES',
    ARRAY = 'ARRAY',
    STRUCT = 'STRUCT'
  }

  interface Type {
    code: TypeCode;
    arrayElementType?: Type;
    structType?: StructType;
  }

  interface Field {
    name: string;
    type?: Type;
  }

  interface StructType {
    fields: Field[];
  }
}
