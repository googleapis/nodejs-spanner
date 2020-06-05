/**
 * Copyright 2020 Google LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {promisifyAll, callbackifyAll} from '@google-cloud/promisify';
import {Instance} from './instance';
import {
  IOperation,
  LongRunningCallback,
  RequestCallback,
  ResourceCallback,
  NormalCallback,
} from './common';
import {EnumKey, Spanner, RequestConfig, TranslateEnumKeys} from '.';
import {
  grpc,
  CallOptions,
  Metadata,
  Operation as GaxOperation,
} from 'google-gax';
import {DateStruct, PreciseDate} from '@google-cloud/precise-date';
import {google as databaseAdmin} from '../protos/protos';
import {common as p} from 'protobufjs';

export type CreateBackupCallback = LongRunningCallback<Backup>;

export interface CreateBackupGaxOperation extends GaxOperation {
  // Overridden with more specific type for CreateBackup operation
  metadata: Metadata &
    databaseAdmin.spanner.admin.database.v1.ICreateBackupMetadata;
}

export type CreateBackupResponse = [
  Backup,
  CreateBackupGaxOperation,
  IOperation
];

export interface CreateBackupOptions {
  databasePath: string;
  expireTime: string | number | p.ITimestamp | PreciseDate;
  gaxOptions?: CallOptions;
}

/**
 * IBackup structure with backup state enum translated to string form.
 */
type IBackupTranslatedEnum = TranslateEnumKeys<
  databaseAdmin.spanner.admin.database.v1.IBackup,
  'state',
  typeof databaseAdmin.spanner.admin.database.v1.Backup.State
>;

export type GetMetadataResponse = [IBackupTranslatedEnum];
type GetMetadataCallback = RequestCallback<IBackupTranslatedEnum>;

type UpdateExpireTimeCallback = RequestCallback<
  databaseAdmin.spanner.admin.database.v1.IBackup
>;

type DeleteCallback = RequestCallback<databaseAdmin.protobuf.IEmpty>;

interface BackupRequest {
  (
    config: RequestConfig,
    callback: ResourceCallback<GaxOperation, IOperation>
  ): void;
  <T>(config: RequestConfig, callback: RequestCallback<T>): void;
}
export type GetStateCallback = NormalCallback<
  EnumKey<typeof databaseAdmin.spanner.admin.database.v1.Backup.State>
>;
export type GetExpireTimeCallback = NormalCallback<PreciseDate>;
export type ExistsCallback = NormalCallback<boolean>;
/**
 * The {@link Backup} class represents a Cloud Spanner backup.
 *
 * Create a `Backup` object to interact with or create a Cloud Spanner backup.
 *
 * @class
 *
 * @example
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 * const instance = spanner.instance('my-instance');
 * const backup = instance.backup('my-backup');
 */
class Backup {
  id: string;
  formattedName_: string;
  instanceFormattedName_: string;
  request: BackupRequest;
  constructor(instance: Instance, name: string) {
    this.request = instance.request;
    this.instanceFormattedName_ = instance.formattedName_;
    this.formattedName_ = Backup.formatName_(instance.formattedName_, name);
    this.id = this.formattedName_.split('/').pop() || '';
  }

  create(options: CreateBackupOptions): Promise<CreateBackupResponse>;
  create(options: CreateBackupOptions, callback: CreateBackupCallback): void;
  /**
   * @typedef {object} CreateBackupOptions
   * @property {string} databasePath The database path.
   * @property {string|number|google.protobuf.Timestamp|external:PreciseDate}
   *     expireTime The expire time of the backup.
   * @property {CallOptions} [gaxOptions] The request configuration options
   *     outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   */
  /**
   * @typedef {array} CreateBackupResponse
   * @property {Backup} 0 The new {@link Backup}.
   * @property {Operation} 1 An {@link Operation} object that can be used to check
   *     the status of the request.
   * @property {object} 2 The full API response.
   */
  /**
   * @callback CreateBackupCallback
   * @param {?Error} err Request error, if any.
   * @param {Backup} backup The new {@link Backup}.
   * @param {Operation} operation An {@link Operation} object that can be used to
   *     check the status of the request.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Create a backup.
   *
   * @method Backup#create
   * @param {CreateBackupOptions} options Parameters for creating a backup.
   * @param {CallOptions} [options.gaxOptions] The request configuration
   *     options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {CreateBackupCallback} [callback] Callback function.
   * @returns {Promise<CreateBackupResponse>} When resolved, the backup
   *     operation will have started, but will not have necessarily completed.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const oneDay = 1000 * 60 * 60 * 24;
   * const expireTime = Date.now() + oneDay;
   * const backup = instance.backup('my-backup');
   * const [, backupOperation] = await backup.create({
   *   databasePath: 'projects/my-project/instances/my-instance/databases/my-database',
   *   expireTime: expireTime,
   * });
   * // Await completion of the backup operation.
   * await backupOperation.promise();
   */
  create(
    options: CreateBackupOptions,
    callback?: CreateBackupCallback
  ): Promise<CreateBackupResponse> | void {
    const gaxOpts = options.gaxOptions;
    const reqOpts: databaseAdmin.spanner.admin.database.v1.ICreateBackupRequest = {
      parent: this.instanceFormattedName_,
      backupId: this.id,
      backup: {
        database: options.databasePath,
        expireTime: Spanner.timestamp(options.expireTime).toStruct(),
        name: this.formattedName_,
      },
    };
    return this.request(
      {
        client: 'DatabaseAdminClient',
        method: 'createBackup',
        reqOpts,
        gaxOpts,
      },
      (err, operation, resp) => {
        if (err) {
          callback!(err, null, null, resp);
          return;
        }
        callback!(null, this, operation, resp);
      }
    );
  }

  getMetadata(gaxOptions?: CallOptions): Promise<GetMetadataResponse>;
  getMetadata(callback: GetMetadataCallback): void;
  getMetadata(gaxOptions: CallOptions, callback: GetMetadataCallback): void;
  /**
   * @typedef {array} GetMetadataResponse
   * @property {object} 0 The {@link Backup} metadata.
   * @property {object} 1 The full API response.
   */
  /**
   * @callback GetMetadataCallback
   * @param {?Error} err Request error, if any.
   * @param {object} metadata The {@link Backup} metadata.
   * @param {object} apiResponse The full API response.
   */
  /**
   * Retrieves backup's metadata.
   *
   * @see {@link #getState}
   * @see {@link #getExpireTime}
   *
   * @method Backup#getMetadata
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {GetMetadataCallback} [callback] Callback function.
   * @returns {Promise<GetMetadataResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   * const [backupInfo] = await backup.getMetadata();
   * console.log(`${backupInfo.name}: size=${backupInfo.sizeBytes}`);
   */
  getMetadata(
    gaxOptionsOrCallback?: CallOptions | GetMetadataCallback,
    cb?: GetMetadataCallback
  ): void | Promise<GetMetadataResponse> {
    const callback =
      typeof gaxOptionsOrCallback === 'function'
        ? (gaxOptionsOrCallback as GetMetadataCallback)
        : cb;
    const gaxOpts =
      typeof gaxOptionsOrCallback === 'object'
        ? (gaxOptionsOrCallback as CallOptions)
        : {};
    const reqOpts: databaseAdmin.spanner.admin.database.v1.IGetBackupRequest = {
      name: this.formattedName_,
    };
    return this.request<IBackupTranslatedEnum>(
      {
        client: 'DatabaseAdminClient',
        method: 'getBackup',
        reqOpts,
        gaxOpts,
      },
      (err, response) => {
        callback!(err, response);
      }
    );
  }

  getState(): Promise<
    | EnumKey<typeof databaseAdmin.spanner.admin.database.v1.Backup.State>
    | undefined
    | null
  >;
  getState(callback: GetStateCallback): void;
  /**
   * Retrieves the state of the backup.
   *
   * The backup state indicates if the backup has completed.
   *
   * @see {@link #getMetadata}
   *
   * @method Backup#getState
   * @param {GetStateCallback} [callback] Callback function.
   * @returns {Promise<EnumKey<typeof, databaseAdmin.spanner.admin.database.v1.Backup.State> | undefined>}
   *     When resolved, contains the current state of the backup if it exists.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   * const state = await backup.getState();
   * const backupCompleted = (state === 'READY');
   */
  async getState(): Promise<
    | EnumKey<typeof databaseAdmin.spanner.admin.database.v1.Backup.State>
    | undefined
    | null
  > {
    const [backupInfo] = await this.getMetadata();
    return backupInfo.state;
  }

  getExpireTime(): Promise<PreciseDate | undefined>;
  getExpireTime(callback: GetExpireTimeCallback): void;
  /**
   * Retrieves the expiry time of the backup.
   *
   * @see {@link #updateExpireTime}
   * @see {@link #getMetadata}
   *
   * @method Backup#getExpireTime
   * @returns {Promise<external:PreciseDate>} When resolved, contains the
   *     current expire time of the backup if it exists.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   * const expireTime = await backup.getExpireTime();
   * console.log(`Backup expires on ${expireTime.toISOString()}`);
   */
  async getExpireTime(): Promise<PreciseDate | undefined> {
    const [backupInfo] = await this.getMetadata();
    return new PreciseDate(backupInfo.expireTime as DateStruct);
  }

  exists(): Promise<boolean>;
  exists(callback: ExistsCallback): void;
  /**
   * Checks whether the backup exists.
   *
   * @see {@link #getMetadata}
   *
   * @method Backup#exists
   * @returns {Promise<boolean>} When resolved, contains true if the backup
   *     exists and false if it does not exist.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   * const alreadyExists = await backup.exists();
   * console.log(`Does backup exist? ${alreadyExists}`);
   */
  async exists(): Promise<boolean> {
    try {
      // Attempt to read metadata to determine whether backup exists
      await this.getMetadata();
      // Found therefore it exists
      return true;
    } catch (err) {
      if (err.code === grpc.status.NOT_FOUND) {
        return false;
      }
      // Some other error occurred, rethrow
      throw err;
    }
  }

  updateExpireTime(
    expireTime: string | number | p.ITimestamp | PreciseDate
  ): Promise<databaseAdmin.spanner.admin.database.v1.IBackup>;
  updateExpireTime(
    expireTime: string | number | p.ITimestamp | PreciseDate,
    gaxOptions?: CallOptions
  ): Promise<databaseAdmin.spanner.admin.database.v1.IBackup>;
  updateExpireTime(
    expireTime: string | number | p.ITimestamp | PreciseDate,
    callback: UpdateExpireTimeCallback
  ): void;
  updateExpireTime(
    expireTime: string | number | p.ITimestamp | PreciseDate,
    gaxOptions: CallOptions,
    callback: UpdateExpireTimeCallback
  ): void;
  /**
   * @callback UpdateExpireTimeCallback
   * @param {?Error} err Request error, if any.
   * @param {google.spanner.admin.database.v1.IBackup} backup The updated
   *     backup.
   */
  /**
   * Sets the expiry time of a backup.
   *
   * @see {@link #getExpireTime}
   *
   * @method Backup#updateExpireTime
   * @param {string|number|google.protobuf.Timestamp|external:PreciseDate}
   *     expireTime The expiry time to update with.
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {UpdateExpireTimeCallback} [callback] Callback function.
   * @returns {Promise<google.spanner.admin.database.v1.IBackup>} When resolved,
   *     the backup's expire time will have been updated.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   * const oneDay = 1000 * 60 * 60 * 24;
   * const newExpireTime = Spanner.timestamp(Date.now() + oneDay);
   * await backup.updateExpireTime(newExpireTime);
   */
  updateExpireTime(
    expireTime: string | number | p.ITimestamp | PreciseDate,
    gaxOptionsOrCallback?: CallOptions | UpdateExpireTimeCallback,
    cb?: UpdateExpireTimeCallback
  ): void | Promise<databaseAdmin.spanner.admin.database.v1.IBackup> {
    const callback =
      typeof gaxOptionsOrCallback === 'function'
        ? (gaxOptionsOrCallback as UpdateExpireTimeCallback)
        : cb;
    const gaxOpts =
      typeof gaxOptionsOrCallback === 'object'
        ? (gaxOptionsOrCallback as CallOptions)
        : {};
    const reqOpts: databaseAdmin.spanner.admin.database.v1.IUpdateBackupRequest = {
      backup: {
        name: this.formattedName_,
        expireTime: Spanner.timestamp(expireTime).toStruct(),
      },
      updateMask: {
        paths: ['expire_time'],
      },
    };
    return this.request<databaseAdmin.spanner.admin.database.v1.IBackup>(
      {
        client: 'DatabaseAdminClient',
        method: 'updateBackup',
        reqOpts,
        gaxOpts,
      },
      (err, response) => {
        callback!(err, response);
      }
    );
  }

  delete(gaxOptions?: CallOptions): Promise<databaseAdmin.protobuf.IEmpty>;
  delete(callback: DeleteCallback): void;
  delete(gaxOptions: CallOptions, callback: DeleteCallback): void;
  /**
   * Deletes a backup.
   *
   * @method Backup#delete
   * @param {object} [gaxOptions] Request configuration options, outlined here:
   *     https://googleapis.github.io/gax-nodejs/classes/CallSettings.html.
   * @param {DeleteBackupCallback} [callback] Callback function.
   * @returns {Promise<void>} When resolved, the backup will have been deleted.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   * await backup.delete();
   */
  delete(
    gaxOptionsOrCallback?: CallOptions | DeleteCallback,
    cb?: DeleteCallback
  ): void | Promise<databaseAdmin.protobuf.IEmpty> {
    const callback =
      typeof gaxOptionsOrCallback === 'function'
        ? (gaxOptionsOrCallback as DeleteCallback)
        : cb;
    const gaxOpts =
      typeof gaxOptionsOrCallback === 'object'
        ? (gaxOptionsOrCallback as CallOptions)
        : {};
    const reqOpts: databaseAdmin.spanner.admin.database.v1.IDeleteBackupRequest = {
      name: this.formattedName_,
    };
    return this.request<databaseAdmin.spanner.admin.database.v1.IBackup>(
      {
        client: 'DatabaseAdminClient',
        method: 'deleteBackup',
        reqOpts,
        gaxOpts,
      },
      err => {
        callback!(err);
      }
    );
  }

  /**
   * Format the backup name to include the instance name.
   *
   * @private
   *
   * @param {string} instanceName The formatted instance name.
   * @param {string} name The table name.
   * @returns {string}
   *
   * @example
   * Backup.formatName_(
   *   'projects/grape-spaceship-123/instances/my-instance',
   *   'my-backup'
   * );
   * // 'projects/grape-spaceship-123/instances/my-instance/backups/my-backup'
   */
  static formatName_(instanceName: string, name: string) {
    if (name.indexOf('/') > -1) {
      return name;
    }
    const backupName = name.split('/').pop();
    return instanceName + '/backups/' + backupName;
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Backup, {
  exclude: ['getState', 'getExpireTime', 'exists'],
});

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
callbackifyAll(Backup, {
  exclude: ['create', 'getMetadata', 'updateExpireTime', 'delete'],
});

/**
 * Reference to the {@link Backup} class.
 * @name module:@google-cloud/spanner.Backup
 * @see Backup
 */
export {Backup};
