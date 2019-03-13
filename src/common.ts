import {google as dbAdminClient} from '../proto/spanner_database_admin';
import {google as spClient} from '../proto/spanner';
import {status, Metadata, ServiceError} from 'grpc';

export interface TransactionOptions {
  readOnly?: boolean;
  timeout?: number;
  exactStaleness?: number;
  readTimestamp?: Date;
  returnTimestamp?: boolean;
  strong?: boolean;
}
export interface RowCountsServiceError {
  rowCounts?: number[] | ((rowCounts: Any, arg1: never[]) => Any);
  code?: status;
  metadata?: Metadata;
  details?: string;
}
export interface CreateSessionOptions {
  name: string;
  labels: {[key: string]: string;};
  createTime: GetTimestamp;
  approximateLastUseTime: GetTimestamp;
}
export type GetTimestamp = {
  nanos: number; seconds: number;
};

export type Schema = string | SchemaObject;
export type SchemaObject = IUpdateDatabaseDdlRequest;

export interface RequestCallback<T> {
  (err: ServiceError|null, response?: T|null): void;
}

//tslint:disable-next-line no-any
export type Any = any;

export type IUpdateDatabaseDdlRequest = dbAdminClient.spanner.admin.database.v1.IUpdateDatabaseDdlRequest;
export type ITransactionOptions = spClient.spanner.v1.ITransactionOptions;
export type ITransaction = spClient.spanner.v1.ITransaction;
export type GeneratedTransaction = spClient.spanner.v1.Transaction;
export type ITimestamp = spClient.protobuf.ITimestamp;
export type IReadOnly = spClient.spanner.v1.TransactionOptions.IReadOnly;
export type ICommitResponse = spClient.spanner.v1.ICommitResponse;
export type IMutation = spClient.spanner.v1.IMutation;
export type LongrunningIOperation = dbAdminClient.longrunning.IOperation;