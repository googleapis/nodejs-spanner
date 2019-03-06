import {google as database_admin_client} from '../proto/spanner_database_admin';
import {google as spanner_client} from '../proto/spanner';
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
  labels: {[key: string]: string;};
  createTime: GetTimestamp;
  approximateLastUseTime: GetTimestamp;
}
export type GetTimestamp = {
  nanos: number; seconds: number;
};

export type Schema = string | SchemaObject;
export type SchemaObject = ProtoIUpdateDatabaseDdlRequest;

export interface RequestCallback<T> {
  (err: ServiceError|null, response?: T|null): void;
}

//tslint:disable-next-line no-any
export type Any = any;

export type ProtoIUpdateDatabaseDdlRequest = database_admin_client.spanner.admin.database.v1.IUpdateDatabaseDdlRequest;
export type ProtoITransactionOptions = spanner_client.spanner.v1.ITransactionOptions;
export type ProtoITransaction = spanner_client.spanner.v1.ITransaction;
export type ProtoTransaction = spanner_client.spanner.v1.Transaction;
export type ProtoITimestamp = spanner_client.protobuf.ITimestamp;
export type ProtoIReadOnly = spanner_client.spanner.v1.TransactionOptions.IReadOnly;
export type ProtoICommitResponse = spanner_client.spanner.v1.ICommitResponse;
export type ProtoIMutation = spanner_client.spanner.v1.IMutation;
export type ProtoLongrunningIOperation = database_admin_client.longrunning.IOperation;