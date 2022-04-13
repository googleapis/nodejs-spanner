/*!
 * Copyright 2022 Google Inc. All Rights Reserved.
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

import {ServiceObjectConfig} from '@google-cloud/common';
const common = require('./common-grpc/service-object');

import {google as instanceAdmin} from '../protos/protos';
import {Operation as GaxOperation} from 'google-gax/build/src/longRunningCalls/longrunning';
import snakeCase = require('lodash.snakecase');
import {
  CLOUD_RESOURCE_HEADER,
  LongRunningCallback,
  RequestCallback,
  ResourceCallback,
  NormalCallback,
} from './common';
import {
  CreateInstanceConfigRequest,
  GetInstanceConfigCallback,
  GetInstanceConfigOptions,
  GetInstanceConfigResponse,
  RequestConfig,
  Spanner,
} from './index';
import {promisifyAll} from '@google-cloud/promisify';
import {CallOptions, GoogleError, grpc} from 'google-gax';
import extend = require('extend');

export type IOperation = instanceAdmin.longrunning.IOperation;

export type CreateInstanceConfigCallback = LongRunningCallback<InstanceConfig>;
export type SetInstanceConfigMetadataCallback = ResourceCallback<
  GaxOperation,
  IOperation
>;
export type DeleteInstanceConfigCallback =
  NormalCallback<instanceAdmin.protobuf.IEmpty>;
export type ExistsInstanceConfigCallback = NormalCallback<boolean>;

export type CreateInstanceConfigResponse = [
  InstanceConfig,
  GaxOperation,
  IOperation
];
export type SetInstanceConfigMetadataResponse = [GaxOperation, IOperation];
export type DeleteInstanceConfigResponse = [instanceAdmin.protobuf.IEmpty];
export type ExistsInstanceConfigResponse = boolean;

export type IInstanceConfig =
  instanceAdmin.spanner.admin.instance.v1.IInstanceConfig;

interface InstanceConfigRequest {
  (
    config: RequestConfig,
    callback: ResourceCallback<GaxOperation, IOperation>
  ): void;
  <T>(config: RequestConfig, callback: RequestCallback<T>): void;
  <T, R>(config: RequestConfig, callback: RequestCallback<T, R>): void;
}

class InstanceConfig extends common.GrpcServiceObject {
  formattedName_: string;
  request: InstanceConfigRequest;
  metadata?: IInstanceConfig;
  resourceHeader_: {[k: string]: string};

  constructor(spanner: Spanner, name: string) {
    const formattedName_ = InstanceConfig.formatName_(spanner.projectId, name);
    const methods = {
      create: true,
    };
    super({
      parent: spanner,
      id: name,
      methods,
      createMethod(
        _: {},
        options: CreateInstanceConfigRequest,
        callback: CreateInstanceConfigCallback
      ): void {
        spanner.createInstanceConfig(formattedName_, options, callback);
      },
    } as {} as ServiceObjectConfig);
    this.formattedName_ = formattedName_;
    this.request = spanner.request.bind(spanner);
    this.resourceHeader_ = {
      [CLOUD_RESOURCE_HEADER]: this.formattedName_,
    };
  }

  get(options?: GetInstanceConfigOptions): Promise<GetInstanceConfigResponse>;
  get(callback: GetInstanceConfigCallback): void;
  get(
    options: GetInstanceConfigOptions,
    callback: GetInstanceConfigCallback
  ): void;
  get(
    optionsOrCallback?: GetInstanceConfigOptions | GetInstanceConfigCallback,
    cb?: GetInstanceConfigCallback
  ): void | Promise<GetInstanceConfigResponse> {
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;
    const options =
      typeof optionsOrCallback === 'object'
        ? optionsOrCallback
        : ({} as GetInstanceConfigOptions);
    this.parent.getInstanceConfig(this.id, options, callback);
  }

  setMetadata(
    metadata: IInstanceConfig,
    gaxOptions?: CallOptions
  ): Promise<SetInstanceConfigMetadataResponse>;
  setMetadata(
    metadata: IInstanceConfig,
    callback: SetInstanceConfigMetadataCallback
  ): void;
  setMetadata(
    metadata: IInstanceConfig,
    gaxOptions: CallOptions,
    callback: SetInstanceConfigMetadataCallback
  ): void;
  setMetadata(
    metadata: IInstanceConfig,
    optionsOrCallback?: CallOptions | SetInstanceConfigMetadataCallback,
    cb?: SetInstanceConfigMetadataCallback
  ): void | Promise<SetInstanceConfigMetadataResponse> {
    const gaxOpts =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    const reqOpts = {
      instanceConfig: extend(
        {
          name: this.formattedName_,
        },
        metadata
      ),
      updateMask: {
        paths: Object.keys(metadata).map(snakeCase),
      },
    };
    return this.request(
      {
        client: 'InstanceAdminClient',
        method: 'updateInstanceConfig',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      callback!
    );
  }

  delete(gaxOptions?: CallOptions): Promise<DeleteInstanceConfigResponse>;
  delete(callback: DeleteInstanceConfigCallback): void;
  delete(gaxOptions: CallOptions, callback: DeleteInstanceConfigCallback): void;
  delete(
    optionsOrCallback?: CallOptions | DeleteInstanceConfigCallback,
    cb?: DeleteInstanceConfigCallback
  ): void | Promise<DeleteInstanceConfigResponse> {
    const gaxOpts =
      typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
    const callback =
      typeof optionsOrCallback === 'function' ? optionsOrCallback : cb!;

    const reqOpts = {
      name: this.formattedName_,
    };
    this.request<instanceAdmin.protobuf.IEmpty>(
      {
        client: 'InstanceAdminClient',
        method: 'deleteInstanceConfig',
        reqOpts,
        gaxOpts,
        headers: this.resourceHeader_,
      },
      (err, resp) => {
        if (!err) {
          this.parent.instance_configs_.delete(this.id);
        }
        callback!(err, resp!);
      }
    );
  }

  exists(): Promise<ExistsInstanceConfigResponse>;
  exists(callback: ExistsInstanceConfigCallback): void;
  async exists(): Promise<ExistsInstanceConfigResponse> {
    try {
      // Attempt to read metadata to determine whether instance config exists
      await this.get();
      // Found, therefore it exists
      return true;
    } catch (err) {
      if (err.code === grpc.status.NOT_FOUND) {
        return false;
      }
      // Some other error occurred, rethrow
      throw err;
    }
  }

  static formatName_(projectId: string, name: string) {
    if (name.indexOf('/') > -1) {
      return name;
    }
    const instanceConfigName = name.split('/').pop();
    return 'projects/' + projectId + '/instanceConfigs/' + instanceConfigName;
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(InstanceConfig, {
  exclude: ['exists'],
});

/**
 * Reference to the {@link InstanceConfig} class.
 * @name module:@google-cloud/spanner.InstanceConfig
 * @see InstanceConfig
 */
export {InstanceConfig};
