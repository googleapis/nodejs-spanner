/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import {EventEmitter} from 'events';
import {CallOptions, GrpcClientOptions} from 'google-gax';
import {ClientReadableStream, ServiceError, StatusObject} from 'grpc';
import {common as protobuf} from 'protobufjs';

declare class DatabaseAdminClient {
  static servicePath: string;
  static port: number;
  static scopes: string[];

  constructor(opts: GrpcClientOptions);

  getProjectId(callback: DatabaseAdminClient.GetProjectIdCallback): void;

  listDatabases(request: DatabaseAdminClient.ListDatabasesRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<DatabaseAdminClient.ListDatabasesPaginated | DatabaseAdminClient.ListDatabasesUnpaginated>;
  listDatabases(request: DatabaseAdminClient.ListDatabasesRequest, callback: DatabaseAdminClient.ListDatabasesCallback): void;
  listDatabases(request: DatabaseAdminClient.ListDatabasesRequest, options: CallOptions, callback: DatabaseAdminClient.ListDatabasesCallback): void;

  listDatabasesStream(request: DatabaseAdminClient.ListDatabasesRequest, options?: CallOptions): ClientReadableStream<DatabaseAdminClient.Database>;

  createDatabase(request: DatabaseAdminClient.CreateDatabaseRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<[DatabaseAdminClient.Operation]>;
  createDatabase(request: DatabaseAdminClient.CreateDatabaseRequest, callback: DatabaseAdminClient.CreateDatabaseCallback): void;
  createDatabase(request: DatabaseAdminClient.CreateDatabaseRequest, options: CallOptions, callback: DatabaseAdminClient.CreateDatabaseCallback): void;

  getDatabase(request: DatabaseAdminClient.GetDatabaseRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<[DatabaseAdminClient.Database]>;
  getDatabase(request: DatabaseAdminClient.GetDatabaseRequest, callback: DatabaseAdminClient.GetDatabaseCallback): void;
  getDatabase(request: DatabaseAdminClient.GetDatabaseRequest, options: CallOptions, callback: DatabaseAdminClient.GetDatabaseCallback): void;

  updateDatabaseDdl(request: DatabaseAdminClient.UpdateDatabaseDdlRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<[DatabaseAdminClient.Operation, DatabaseAdminClient.GrpcOperation]>;
  updateDatabaseDdl(request: DatabaseAdminClient.UpdateDatabaseDdlRequest, callback: DatabaseAdminClient.UpdateDatabaseDdlCallback): void;
  updateDatabaseDdl(request: DatabaseAdminClient.UpdateDatabaseDdlRequest, options: CallOptions, callback: DatabaseAdminClient.UpdateDatabaseDdlCallback): void;

  dropDatabase(request: DatabaseAdminClient.DropDatabaseRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<protobuf.IEmpty>;
  dropDatabase(request: DatabaseAdminClient.DropDatabaseRequest, callback: DatabaseAdminClient.DropDatabaseCallback): void;
  dropDatabase(request: DatabaseAdminClient.DropDatabaseRequest, options: CallOptions, callback: DatabaseAdminClient.DropDatabaseCallback): void;

  getDatabaseDdl(request: DatabaseAdminClient.GetDatabaseDdlRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<[DatabaseAdminClient.GetDatabaseDdlResponse]>;
  getDatabaseDdl(request: DatabaseAdminClient.GetDatabaseDdlRequest, callback: DatabaseAdminClient.GetDatabaseDdlCallback): void;
  getDatabaseDdl(request: DatabaseAdminClient.GetDatabaseDdlRequest, options: CallOptions, callback: DatabaseAdminClient.GetDatabaseDdlCallback): void;

  setIamPolicy(request: DatabaseAdminClient.SetIamPolicyRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<[DatabaseAdminClient.Policy]>;
  setIamPolicy(request: DatabaseAdminClient.SetIamPolicyRequest, callback: DatabaseAdminClient.SetIamPolicyCallback): void;
  setIamPolicy(request: DatabaseAdminClient.SetIamPolicyRequest, options: CallOptions, callback: DatabaseAdminClient.SetIamPolicyCallback): void;

  getIamPolicy(request: DatabaseAdminClient.GetIamPolicyRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<[DatabaseAdminClient.Policy]>;
  getIamPolicy(request: DatabaseAdminClient.GetIamPolicyRequest, callback: DatabaseAdminClient.GetIamPolicyCallback): void;
  getIamPolicy(request: DatabaseAdminClient.GetIamPolicyRequest, options: CallOptions, callback: DatabaseAdminClient.GetIamPolicyCallback): void;

  testIamPermissions(request: DatabaseAdminClient.TestIamPermissionsRequest, options?: CallOptions): DatabaseAdminClient.CancelablePromise<[DatabaseAdminClient.TestIamPermissionsResponse]>;
  testIamPermissions(request: DatabaseAdminClient.TestIamPermissionsRequest, callback: DatabaseAdminClient.TestIamPermissionsCallback): void;
  testIamPermissions(request: DatabaseAdminClient.TestIamPermissionsRequest, options: CallOptions, callback: DatabaseAdminClient.TestIamPermissionsCallback): void;

  instancePath(project: string, instance: string): string;

  databasePath(project: string, instance: string, database: string): string;

  matchProjectFromInstanceName(instanceName: string): string;

  matchInstanceFromInstanceName(instanceName: string): string;

  matchProjectFromDatabaseName(databaseName: string): string;

  matchInstanceFromDatabaseName(databaseName: string): string;

  matchDatabaseFromDatabaseName(databaseName: string): string;
}

declare namespace DatabaseAdminClient {
  interface CancelablePromise<T> extends Promise<T> {
    cancel(): void;
  }

  interface GetProjectIdCallback {
    (error: null | Error, projectId: string): void;
  }

  const enum State {
    STATE_UNSPECIFIED,
    CREATING,
    READY
  }

  interface Database {
    name: string;
    state: State;
  }

  interface ListDatabasesRequest {
    parent: string;
    pageSize: number;
    pageToken: string;
  }

  interface ListDatabasesResponse {
    databases: Database[];
    nextPageToken?: string;
  }

  type ListDatabasesPaginated = [Database[]];
  type ListDatabasesUnpaginated = [Database[], null | ListDatabasesRequest, ListDatabasesResponse];

  interface ListDatabasesCallback {
    (error: null | ServiceError, databases: Database[], nextQuery?: ListDatabasesRequest, response?: ListDatabasesResponse): void;
  }

  interface CreateDatabaseRequest {
    parent: string;
    createStatement: string;
    extraStatements?: string[];
  }

  interface CreateDatabaseMetadata {
    database: string;
  }

  interface CreateDatabaseCallback {
    (error: null | ServiceError, operation: Operation): void;
  }

  interface GetDatabaseRequest {
    name: string;
  }

  interface GetDatabaseCallback {
    (error: null | ServiceError, database: Database): void;
  }

  interface UpdateDatabaseDdlRequest {
    database: string;
    statements: string[];
    operationId?: string;
  }



  interface UpdateDatabaseDdlMetadata {
    database: string;
    statements: string[];
    commitTimestamps: protobuf.ITimestamp[];
  }

  interface UpdateDatabaseDdlCallback {
    (error: null | ServiceError, operation: Operation, response: GrpcOperation): void;
  }

  interface DropDatabaseRequest {
    database: string;
  }

  interface DropDatabaseCallback {
    (error: null | ServiceError): void
  }

  interface GetDatabaseDdlRequest {
    database: string;
  }

  interface GetDatabaseDdlResponse {
    statements: string[];
  }

  interface GetDatabaseDdlCallback {
    (error: null | ServiceError, response: GetDatabaseDdlResponse): void;
  }

  interface Binding {
    role: string;
    members: string[];
  }

  interface Policy {
    version: number;
    bindings: Binding[];
    etag: string;
  }

  interface SetIamPolicyRequest {
    resource: string;
    policy: Policy;
  }

  interface SetIamPolicyCallback {
    (error: null | ServiceError, policy: Policy): void;
  }

  interface GetIamPolicyRequest {
    resource: string;
  }

  interface GetIamPolicyCallback {
    (error: null | ServiceError, policy: Policy): void;
  }

  interface TestIamPermissionsRequest {
    resource: string;
    permissions: string[];
  }

  interface TestIamPermissionsResponse {
    permissions: string[];
  }

  interface TestIamPermissionsCallback {
    (error: null | ServiceError, response: TestIamPermissionsResponse): void;
  }

  interface Operation extends EventEmitter {
    cancel(): Promise<void>;
    getOperation(): Promise<{}>;
    getOperation(callback: (err?: Error) => void): void;
    promise(): Promise<void>;
  }

  interface GrpcOperation {
    name: string;
    metadata: protobuf.IAny;
    done: boolean;
    error?: StatusObject;
    response?: protobuf.IAny;
  }
}
