import {google as databaseAdmin} from '../proto/spanner_database_admin';
import * as r from 'request';

export type Schema =
  | string
  | string[]
  | databaseAdmin.spanner.admin.database.v1.IUpdateDatabaseDdlRequest;
export type BasicResponse = [r.Response];
