import {google as spTypes} from '../proto/spanner';
import {Operation as GaxOperation} from 'google-gax/build/src/longrunning';
import {ServiceError} from 'grpc';

//tslint:disable-next-line no-any
export type Any = any;
export type BasicResponse = [IOperation];
export type LongRunningOperationResponse = [GaxOperation, IOperation];
export type Schema = string|SchemaObject;
export type SchemaObject = IUpdateDatabaseDdlRequest;

export type ICommitResponse = spTypes.spanner.v1.ICommitResponse;
export type ICommitRequest = spTypes.spanner.v1.ICommitRequest;
export type IOperation = spTypes.longrunning.IOperation;
export type IReadOnly = spTypes.spanner.v1.TransactionOptions.IReadOnly;
export type ITransactionOptions = spTypes.spanner.v1.ITransactionOptions;
export type ITransaction = spTypes.spanner.v1.ITransaction;
export type ITimestamp = spTypes.protobuf.ITimestamp;
export type IMutation = spTypes.spanner.v1.IMutation;
export type IUpdateDatabaseDdlRequest = spTypes.spanner.admin.database.v1.IUpdateDatabaseDdlRequest;

export interface BasicCallback {
  (err: ServiceError|null, response?: IOperation|null): void;
}
export interface GenericCallback<T> {
  (err: ServiceError|null, response?: T|null): void;
}
export interface ErrorCallback {
  (error: null|ServiceError|Error): void;
}
export interface LongrunningOperationCallback {
  (err: Error|null, operation?: GaxOperation|null, apiResponse?: IOperation|null): void;
}

export interface CreateSessionOptions {
  name: string;
  labels: {[key: string]: string;};
  createTime: GetTimestamp;
  approximateLastUseTime: GetTimestamp;
}
export type GetTimestamp = {
  nanos: number; seconds: number;
}
export interface TransactionOptions {
  timeout?: number;
  readOnly?: boolean;
  exactStaleness?: number;
  readTimestamp?: Date;
  returnTimestamp?: boolean;
  strong?: boolean;
}
