import { google as dbAdminClient } from '../proto/spanner_database_admin';
import { google as spannerClient } from '../proto/spanner';
import { ServiceError } from 'grpc';

export interface TransactionOptions {
  readOnly?: boolean;
  timeout?: number;
  exactStaleness?: number;
  readTimestamp?: Date;
  returnTimestamp?: boolean;
  strong?: boolean;
}
export interface CreateSessionOptions {
  name: string;
  labels: { [key: string]: string; };
  createTime: GetTimestamp;
  approximateLastUseTime: GetTimestamp;
}
export type GetTimestamp = {
  nanos: number; seconds: number;
};

export type Schema = string | SchemaObject;
export type SchemaObject = ProtoIUpdateDatabaseDdlRequest;

export interface RequestCallback<T> {
  (err: ServiceError | null, response?: T | null): void;
}

//tslint:disable-next-line no-any
export type Any = any;

export type ProtoIUpdateDatabaseDdlRequest = dbAdminClient.spanner.admin.database.v1.IUpdateDatabaseDdlRequest;
export type ProtoITransactionOptions = spannerClient.spanner.v1.ITransactionOptions;
export type ProtoITransaction = spannerClient.spanner.v1.ITransaction;
export type ProtoTransaction = spannerClient.spanner.v1.Transaction;
export type ProtoITimestamp = spannerClient.protobuf.ITimestamp;
export type ProtoIReadOnly = spannerClient.spanner.v1.TransactionOptions.IReadOnly;
export type ProtoICommitResponse = spannerClient.spanner.v1.ICommitResponse;
export type ProtoIMutation = spannerClient.spanner.v1.IMutation;
export type ProtoLongrunningIOperation = dbAdminClient.longrunning.IOperation;
export type ProtoEmpty = spannerClient.protobuf.Empty;
export type ProtoIStruct = spannerClient.protobuf.IStruct;
export type ProtoQueryMode = spannerClient.spanner.v1.ExecuteSqlRequest.QueryMode;
export type ProtoIListValue = spannerClient.protobuf.IListValue;
export type ProtoIValue = spannerClient.protobuf.IValue;
export type ProtoType = spannerClient.spanner.v1.Type;
export type ProtoTimestamp = spannerClient.protobuf.Timestamp;
export type ProtoDuration = spannerClient.protobuf.Duration;
export type ProtoBeginTransactionCallback = spannerClient.spanner.v1.Spanner.BeginTransactionCallback;
export type ProtoResultSetStats = spannerClient.spanner.v1.ResultSetStats;
export type ProtoIKeySet = spannerClient.spanner.v1.IKeySet;
export type ProtoReadWrite = spannerClient.spanner.v1.TransactionOptions.ReadWrite;
export type ProtoKeyRange = spannerClient.spanner.v1.KeyRange;
export type ProtoCommitResponse = spannerClient.spanner.v1.CommitResponse;
export type ProtoPartitionedDml = spannerClient.spanner.v1.TransactionOptions.PartitionedDml;
export type ProtoIKeyRange = spannerClient.spanner.v1.IKeyRange;
export type ProtoListValue = spannerClient.protobuf.ListValue;
