/*!
 * Copyright 2016 Google Inc. All Rights Reserved.
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
import {Operation as GaxOperation} from 'google-gax';
import {google as instanceAdmin} from '../proto/spanner_instance_admin';

export type IOperation = instanceAdmin.longrunning.IOperation;
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
  labels: {[key: string]: string};
  createTime: GetTimestamp;
  approximateLastUseTime: GetTimestamp;
}
export interface GetTimestamp {
  nanos: number;
  seconds: number;
}
export interface ResourceCallback<Resource, Response> {
  (
    err: ServiceError | null,
    resource?: Resource | null,
    response?: Response | null
  ): void;
}
export type PagedResponse<Item, Response> =
  | [Item[]]
  | [Item[], {} | null, Response];

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
