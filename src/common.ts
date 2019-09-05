/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
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
import {google as databaseAdmin} from '../proto/spanner_database_admin';
import {ServiceError, CallOptions} from 'grpc';

export type Schema =
  | string
  | string[]
  | databaseAdmin.spanner.admin.database.v1.IUpdateDatabaseDdlRequest;
export interface ResourceCallback<Resource, Response> {
  (
    err: ServiceError | null,
    resource?: Resource | null,
    response?: Response
  ): void;
}

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
