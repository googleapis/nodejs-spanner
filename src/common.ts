import {google as spanner_client} from '../proto/spanner';

export interface GaxOptions {
  [key: string]: spanner_client.protobuf.Value;
}

export type Schema = string | string[] | SchemaObject;
export interface SchemaObject {
  statements: string[];
  operationId?: string;
}

// tslint:disable-next-line no-any
export type Any = any;
