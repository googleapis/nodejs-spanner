import {google as database_admin_client} from '../proto/spanner_database_admin';

export type Schema =
  | string
  | string[]
  | database_admin_client.spanner.admin.database.v1.IUpdateDatabaseDdlRequest;
// tslint:disable-next-line no-any
export type Any = any;
