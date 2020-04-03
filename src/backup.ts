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

import {promisifyAll} from '@google-cloud/promisify';
import {google as databaseAdmin} from '../proto/spanner_database_admin';
import {Instance} from './instance';
import {IOperation, RequestCallback} from './common';
import {EnumKey, RequestConfig, TranslateEnumKeys} from '.';
import {Metadata, Operation as GaxOperation} from 'google-gax';
import * as extend from 'extend';
import {DateStruct, PreciseDate} from '@google-cloud/precise-date';
import {CallOptions, ServiceError, status} from 'grpc';

// Like LongRunningCallback<Backup> but with more specific type for operation parameter
export interface CreateBackupCallback {
  (
    err: ServiceError | null,
    resource?: Backup | null,
    // More specific type for CreateBackup operation
    operation?: CreateBackupGaxOperation | null,
    apiResponse?: IOperation
  ): void;
}

export interface CreateBackupGaxOperation extends GaxOperation {
  // Overridden with more specific type for CreateBackup operation
  metadata: Metadata &
    databaseAdmin.spanner.admin.database.v1.ICreateBackupMetadata;
}

export type CreateBackupResponse = [
  Backup,
  CreateBackupGaxOperation,
  databaseAdmin.longrunning.IOperation
];

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

type UpdateExpireTimeCallback = RequestCallback<Backup>;

type DeleteCallback = RequestCallback<void>;

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
  id_: string;
  formattedName_: string;
  instanceFormattedName_: string;
  request: <T, R = void>(
    config: RequestConfig,
    callback: RequestCallback<T, R>
  ) => void;
  constructor(
    instance: Instance,
    name: string,
    private databasePath?: string,
    private expireTime?: PreciseDate
  ) {
    this.request = instance.request;
    this.instanceFormattedName_ = instance.formattedName_;
    this.formattedName_ = Backup.formatName_(instance.formattedName_, name);
    this.id_ = this.formattedName_.split('/').pop() || '';
  }

  create(): Promise<CreateBackupResponse>;
  create(options?: CallOptions): Promise<CreateBackupResponse>;
  create(callback: CreateBackupCallback): void;
  create(options: CallOptions, callback: CreateBackupCallback): void;
  /**
   * Create a backup.
   *
   * @method Backup#create
   * @returns {Promise<CreateBackupResponse>} when resolved, the backup
   *     operation will have started, but will not have necessarily completed.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const database = spanner.database('my-database');
   * const oneDay = 1000 * 60 * 60 * 24;
   * const expiryTime = new PreciseDate(Date.now() + oneDay);
   * const backup = instance.backup(
   *   'my-backup',
   *   'projects/my-project/instances/my-instance/databases/my-database',
   *   expiryTime);
   * const [, backupOperation] = await backup.create();
   * // Await completion of the backup operation.
   * await backupOperation.promise();
   */
  create(
    optionsOrCallback?: CallOptions | CreateBackupCallback,
    cb?: CreateBackupCallback
  ): Promise<CreateBackupResponse> | void {
    if (!this.expireTime) {
      throw new Error('Expire time is required to create a backup.');
    }
    if (!this.databasePath) {
      throw new Error('Database path is required to create a backup.');
    }

    const callback =
      typeof optionsOrCallback === 'function'
        ? (optionsOrCallback as CreateBackupCallback)
        : cb;
    const gaxOpts =
      typeof optionsOrCallback === 'object'
        ? (optionsOrCallback as CallOptions)
        : {};
    const reqOpts: databaseAdmin.spanner.admin.database.v1.ICreateBackupRequest = extend(
      {
        parent: this.instanceFormattedName_,
        backupId: this.id_,
        backup: {
          database: this.databasePath,
          expireTime: this.expireTime.toStruct(),
          name: this.formattedName_,
        },
      }
    );
    return this.request<CreateBackupGaxOperation>(
      {
        client: 'DatabaseAdminClient',
        method: 'createBackup',
        reqOpts,
        gaxOpts,
      },
      (err, resp) => {
        if (err) {
          callback!(err, null, null);
          return;
        }
        callback!(null, this, resp, resp || undefined);
      }
    );
  }

  getMetadata(): Promise<GetMetadataResponse>;
  getMetadata(callback: GetMetadataCallback): void;
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
   * @returns {Promise<GetMetadataResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const database = spanner.database('my-database');
   * const backup = instance.backup('my-backup');
   * const [backupInfo] = await backup.getMetadata();
   * console.log(`${backupInfo.name}: size=${backupInfo.sizeBytes}`);
   */
  getMetadata(
    callback?: GetMetadataCallback
  ): void | Promise<GetMetadataResponse> {
    const reqOpts: databaseAdmin.spanner.admin.database.v1.IGetBackupRequest = {
      name: this.formattedName_,
    };
    return this.request<IBackupTranslatedEnum>(
      {
        client: 'DatabaseAdminClient',
        method: 'getBackup',
        reqOpts,
      },
      (err, response) => {
        callback!(err, response);
      }
    );
  }

  /**
   * Retrieves the state of the backup.
   *
   * The backup state indicates if the backup has completed.
   *
   * @see {@link #getMetadata}
   *
   * @method Backup#getState
   * @returns {Promise<EnumKey<typeof, databaseAdmin.spanner.admin.database.v1.Backup.State> | undefined>}
   *     when resolved, contains the current state of the backup if it exists, or
   *     undefined if the backup does not exist.
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
  > {
    try {
      const [backupInfo] = await this.getMetadata();
      return backupInfo.state || undefined;
    } catch (err) {
      if (err.code === status.NOT_FOUND) {
        return undefined;
      }
      // Some other error occurred, rethrow
      throw err;
    }
  }

  /**
   * Retrieves the expiry time of the backup.
   *
   * @see {@link #updateExpireTime}
   * @see {@link #getMetadata}
   *
   * @method Backup#getExpireTime
   * @returns {Promise<PreciseDate | undefined>}
   *     when resolved, contains the current expire time of the backup if it exists,
   *     or undefined if the backup does not exist.
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
    try {
      const [backupInfo] = await this.getMetadata();
      this.expireTime = new PreciseDate(backupInfo.expireTime as DateStruct);
      return this.expireTime;
    } catch (err) {
      if (err.code === status.NOT_FOUND) {
        return undefined;
      }
      // Some other error occurred, rethrow
      throw err;
    }
  }

  /**
   * Checks whether the backup exists.
   *
   * @see {@link #getMetadata}
   *
   * @method Backup#exists
   * @returns {Promise<boolean>} when resolved, contains true if the backup
   *     exists and false if it does not exist.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const database = spanner.database('my-database');
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
      if (err.code === status.NOT_FOUND) {
        return false;
      }
      // Some other error occurred, rethrow
      throw err;
    }
  }

  updateExpireTime(expireTime: PreciseDate): Promise<Backup>;
  updateExpireTime(
    expireTime: PreciseDate,
    callback: UpdateExpireTimeCallback
  ): void;
  /**
   * Sets the expiry time of a backup.
   *
   * @see {@link #getExpireTime}
   *
   * @method Backup#updateExpireTime
   * @returns {Promise<Backup>} when resolved, the backup's expire time will
   *     have been updated.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   * const oneDay = 1000 * 60 * 60 * 24;
   * const newExpireTime = new PreciseDate(Date.now() + oneDay);
   * await backup.updateExpireTime(newExpireTime);
   */
  updateExpireTime(
    expireTime: PreciseDate,
    callback?: UpdateExpireTimeCallback
  ): void | Promise<Backup> {
    const reqOpts: databaseAdmin.spanner.admin.database.v1.IUpdateBackupRequest = {
      backup: {
        name: this.formattedName_,
        expireTime: expireTime.toStruct(),
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
      },
      (err) => {
        if (err) {
          callback!(err, undefined);
          return;
        }
        this.expireTime = expireTime;
        callback!(null, this);
      }
    );
  }

  delete(): Promise<void>;
  delete(callback: DeleteCallback): void;
  /**
   * Deletes a backup.
   *
   * @method Backup#delete
   * @returns {Promise<void>} when resolved, the backup will have been deleted.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const backup = instance.backup('my-backup');
   * await backup.delete();
   */
  delete(callback?: DeleteCallback): void | Promise<void> {
    const reqOpts: databaseAdmin.spanner.admin.database.v1.IDeleteBackupRequest = {
      name: this.formattedName_,
    };
    return this.request<databaseAdmin.spanner.admin.database.v1.IBackup>(
      {
        client: 'DatabaseAdminClient',
        method: 'deleteBackup',
        reqOpts,
      },
      err => {
        callback!(err, null);
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

/**
 * Reference to the {@link Backup} class.
 * @name module:@google-cloud/spanner.Backup
 * @see Backup
 */
export {Backup};
