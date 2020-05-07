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

import {ServiceError} from 'grpc';
import {Operation as GaxOperation, CallOptions} from 'google-gax';
import {google as instanceAdmin} from '../protos/protos';
import {google as databaseAdmin} from '../protos/protos';

export type IOperation = instanceAdmin.longrunning.IOperation;

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
export type PagedResponse<Item, Response> = [Item[], {} | null, Response];

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

export interface LongRunningCallback<Resource> {
  (
    err: ServiceError | null,
    resource?: Resource | null,
    operation?: GaxOperation | null,
    apiResponse?: IOperation
  ): void;
}

export interface PagedOptions {
  pageSize?: number;
  pageToken?: string;
  gaxOptions?: CallOptions;
}

export interface PagedOptionsWithFilter extends PagedOptions {
  filter?: string;
}
