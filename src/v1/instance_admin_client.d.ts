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
import {ClientReadableStream, ServiceError} from 'grpc';
import {common as protobuf} from 'protobufjs';

declare class InstanceAdminClient {
  static servicePath: string;
  static port: number;
  static scopes: string[];

  constructor(opts: GrpcClientOptions);

  getProjectId(callback: InstanceAdminClient.GetProjectIdCallback): void;

  listInstanceConfigs(request: InstanceAdminClient.ListInstanceConfigsRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<InstanceAdminClient.ListInstanceConfigsPaginated | InstanceAdminClient.ListInstanceConfigsUnpaginated>;
  listInstanceConfigs(request: InstanceAdminClient.ListInstanceConfigsRequest, callback: InstanceAdminClient.ListInstanceConfigsCallback): void;
  listInstanceConfigs(request: InstanceAdminClient.ListInstanceConfigsRequest, options: CallOptions, callback: InstanceAdminClient.ListInstanceConfigsCallback): void;

  listInstanceConfigsStream(request: InstanceAdminClient.ListInstanceConfigsRequest, options?: CallOptions): ClientReadableStream<InstanceAdminClient.InstanceConfig>

  getInstanceConfig(request: InstanceAdminClient.GetInstanceConfigRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<[InstanceAdminClient.InstanceConfig]>;
  getInstanceConfig(request: InstanceAdminClient.GetInstanceConfigRequest, callback: InstanceAdminClient.GetInstanceConfigCallback): void;
  getInstanceConfig(request: InstanceAdminClient.GetInstanceConfigRequest, options: CallOptions, callback: InstanceAdminClient.GetInstanceConfigCallback): void;

  listInstance(request: InstanceAdminClient.ListInstancesRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<InstanceAdminClient.ListInstancesPaginated | InstanceAdminClient.ListInstancesUnpaginated>;
  listInstance(request: InstanceAdminClient.ListInstancesRequest, callback: InstanceAdminClient.ListInstancesCallback): void;
  listInstance(request: InstanceAdminClient.ListInstancesRequest, options: CallOptions, callback: InstanceAdminClient.ListInstancesCallback): void;

  listInstanceStream(request: InstanceAdminClient.ListInstancesRequest, options?: CallOptions): ClientReadableStream<InstanceAdminClient.Instance>;

  getInstance(request: InstanceAdminClient.GetInstanceRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<[InstanceAdminClient.Instance]>;
  getInstance(request: InstanceAdminClient.GetInstanceRequest, callback: InstanceAdminClient.GetInstanceCallback): void;
  getInstance(request: InstanceAdminClient.GetInstanceRequest, options: CallOptions, callback: InstanceAdminClient.GetInstanceCallback): void;

  createInstance(request: InstanceAdminClient.CreateInstanceRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<[InstanceAdminClient.Operation]>;
  createInstance(request: InstanceAdminClient.CreateInstanceRequest, callback: InstanceAdminClient.CreateInstanceCallback): void;
  createInstance(request: InstanceAdminClient.CreateInstanceRequest, options: CallOptions, callback: InstanceAdminClient.CreateInstanceCallback): void;

  updateInstance(request: InstanceAdminClient.UpdateInstanceRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<[InstanceAdminClient.Operation]>;
  updateInstance(request: InstanceAdminClient.UpdateInstanceRequest, callback: InstanceAdminClient.UpdateInstanceCallback): void;
  updateInstance(request: InstanceAdminClient.UpdateInstanceRequest, options: CallOptions, callback: InstanceAdminClient.UpdateInstanceCallback): void;

  deleteInstance(request: InstanceAdminClient.DeleteInstanceRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<protobuf.IEmpty>;
  deleteInstance(request: InstanceAdminClient.DeleteInstanceRequest, callback: InstanceAdminClient.DeleteInstanceCallback): void;
  deleteInstance(request: InstanceAdminClient.DeleteInstanceRequest, options: CallOptions, callback: InstanceAdminClient.DeleteInstanceCallback): void;

  setIamPolicy(request: InstanceAdminClient.SetIamPolicyRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<[InstanceAdminClient.Policy]>;
  setIamPolicy(request: InstanceAdminClient.SetIamPolicyRequest, callback: InstanceAdminClient.SetIamPolicyCallback): void;
  setIamPolicy(request: InstanceAdminClient.SetIamPolicyRequest, options: CallOptions, callback: InstanceAdminClient.SetIamPolicyCallback): void;

  getIamPolicy(request: InstanceAdminClient.GetIamPolicyRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<[InstanceAdminClient.Policy]>;
  getIamPolicy(request: InstanceAdminClient.GetIamPolicyRequest, callback: InstanceAdminClient.GetIamPolicyCallback): void;
  getIamPolicy(request: InstanceAdminClient.GetIamPolicyRequest, options: CallOptions, callback: InstanceAdminClient.GetIamPolicyCallback): void;

  testIamPermissions(request: InstanceAdminClient.TestIamPermissionsRequest, options?: CallOptions): InstanceAdminClient.CancelablePromise<[InstanceAdminClient.TestIamPermissionsResponse]>;
  testIamPermissions(request: InstanceAdminClient.TestIamPermissionsRequest, callback: InstanceAdminClient.TestIamPermissionsCallback): void;
  testIamPermissions(request: InstanceAdminClient.TestIamPermissionsRequest, options: CallOptions, callback: InstanceAdminClient.TestIamPermissionsCallback): void;

  projectPath(project: string): string;

  instanceConfigPath(project: string, instanceConfig: string): string;

  instancePath(project: string, instance: string): string;

  matchProjectFromProjectName(projectName: string): string;

  matchProjectFromInstanceConfigName(instanceConfigName: string): string;

  matchInstanceConfigFromInstanceConfigName(instanceConfigName: string): string;

  matchProjectFromInstanceName(instanceName: string): string;

  matchInstanceFromInstanceName(instanceName: string): string;
}

declare namespace InstanceAdminClient {
  interface CancelablePromise<T> extends Promise<T> {
    cancel(): void;
  }

  interface GetProjectIdCallback {
    (error: null | Error, projectId: string): void;
  }

  interface InstanceConfig {
    name: string;
    displayName: string
  }

  interface ListInstanceConfigsRequest {
    parent: string;
    pageSize?: number;
    pageToken?: string;
  }

  interface ListInstanceConfigsResponse {
    instanceConfigs: InstanceConfig[];
    nextPageToken?: string;
  }

  type ListInstanceConfigsPaginated = [InstanceConfig[]];
  type ListInstanceConfigsUnpaginated = [InstanceConfig[], null | ListInstanceConfigsRequest, ListInstanceConfigsResponse];

  interface ListInstanceConfigsCallback {
    (error: null | ServiceError, instanceConfigs: InstanceConfig[], nextQuery?: ListInstanceConfigsRequest, response?: ListInstanceConfigsResponse): void;
  }

  interface GetInstanceConfigRequest {
    name: string;
  }

  interface GetInstanceConfigCallback {
    (error: null | ServiceError, instanceConfig: InstanceConfig): void;
  }

  enum State {
    STATE_UNSPECIFIED,
    CREATING,
    READY
  }

  interface Instance {
    name: string;
    config: string;
    displayName: string;
    nodeCount: number;
    state: State;
    labels: Array<[string, string]>;
  }

  interface ListInstancesRequest {
    parent: string;
    pageSize?: number;
    pageToken?: string;
    filter?: string;
  }

  interface ListInstancesResponse {
    instances: Instance[];
    nextPageToken: string;
  }

  type ListInstancesPaginated = [Instance[]];
  type ListInstancesUnpaginated = [Instance[], null | ListInstancesRequest, ListInstancesResponse];

  interface ListInstancesCallback {
    (error: null | ServiceError, instances: Instance[], nextQuery?: ListInstancesRequest, response?: ListInstancesResponse): void;
  }

  interface GetInstanceRequest {
    name: string;
  }

  interface GetInstanceCallback {
    (error: null | ServiceError, instance: Instance): void;
  }

  interface CreateInstanceRequest {
    parent: string;
    instanceId: string;
    instance: Instance;
  }

  interface CreateInstanceMetadata {
    instance: Instance;
    startTime: protobuf.ITimestamp;
    cancelTime: protobuf.ITimestamp;
    endTime: protobuf.ITimestamp;
  }

  interface CreateInstanceCallback {
    (error: null | ServiceError, operation: Operation): void;
  }

  interface UpdateInstanceRequest {
    instance: Instance;
    fieldMask: {
      paths: string[];
    };
  }

  interface UpdateInstanceMetadata {
    instance: Instance;
    startTime: protobuf.ITimestamp;
    cancelTime: protobuf.ITimestamp;
    endTime: protobuf.ITimestamp;
  }

  interface UpdateInstanceCallback {
    (error: null | ServiceError, operation: Operation): void;
  }

  interface DeleteInstanceRequest {
    name: string;
  }

  interface DeleteInstanceCallback {
    (error: null | ServiceError): void;
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
    cancel(): Promise<void>
    getOperation(): Promise<{}>
    getOperation(callback: (err?: Error) => void): void;
    promise(): Promise<void>
  }
}
