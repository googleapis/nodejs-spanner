import {google as databaseAdmin} from '../proto/spanner_database_admin';
import {ServiceError, CallOptions} from 'grpc';

export type Schema =
  | string
  | string[]
  | databaseAdmin.spanner.admin.database.v1.IUpdateDatabaseDdlRequest;
export type ResourceCallback<Resource, Response = void> = Response extends void
  ? NormalCallback<Resource>
  : (
      err: ServiceError | null,
      resource?: Resource | null,
      response?: Response
    ) => void;

export type RequestCallback<T, R = void> = R extends void
  ? NormalCallback<T>
  : PagedCallback<T, R>;

export interface NormalCallback<TResponse> {
  (err: ServiceError | null, res?: TResponse | null): void;
}

export interface PagedCallback<Item, Response> {
  (
    err: ServiceError | null,
    results?: Item[] | null,
    nextQuery?: {} | null,
    response?: Response | null
  ): void;
}
export type PagedRequest<P> = P & {
  autoPaginate?: boolean;
  maxApiCalls?: number;
  gaxOptions?: CallOptions;
};

export type PagedResponse<Item, Response> =
  | [Item[]]
  | [Item[], {} | null, Response];
