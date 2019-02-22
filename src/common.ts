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
export type SchemaObject = {statements: string[], operationId?: string};

//tslint:disable-next-line no-any
export type Any = any;
