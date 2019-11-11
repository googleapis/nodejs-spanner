/*!
 * Copyright 2019 Google Inc. All Rights Reserved.
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

import { promisifyAll } from '@google-cloud/promisify';
import { google as databaseAdmin } from '../proto/spanner_database_admin';
import { Instance, } from './instance';
import { RequestCallback, ResourceCallback, } from './common';
import { RequestConfig } from '.';
import { Metadata, Operation as GaxOperation } from 'google-gax';
import * as extend from 'extend';
import { PreciseDate } from '@google-cloud/precise-date';

export type CreateBackupCallback = ResourceCallback<
  GaxOperation,
  databaseAdmin.longrunning.IOperation
>;

export interface CreateBackupGaxOperation extends GaxOperation {
  // Overridden with more specific type for CreateBackup operation
  metadata: Metadata & databaseAdmin.spanner.admin.database.v1.ICreateBackupMetadata;
}

export type CreateBackupResponse = [
  CreateBackupGaxOperation,
  databaseAdmin.longrunning.IOperation
];

/**
 * IBackup structure with backup state enum translated to string form.
 */
type IBackupTranslatedEnum = TranslateEnumKeys<databaseAdmin.spanner.admin.database.v1.IBackup, 'state', typeof databaseAdmin.spanner.admin.database.v1.Backup.State>;

type GetBackupInfoResponse = [IBackupTranslatedEnum];
type GetBackupInfoCallback = RequestCallback<
  IBackupTranslatedEnum
>;

/**
 * Translates enum values to string keys.
 *
 * @param E enum type.
 */
type EnumKey<E extends {[index: string]: unknown}> = keyof E;

/**
 * Translates an enum property of an object from enum value to enum key, leaving all other properties as-is.
 *
 * @param T type containing properties to translate.
 * @param U name of the enum property.
 * @param E enum type to translate.
 */
type TranslateEnumKeys<T, U, E extends {[index: string]: unknown}> = {
  [P in keyof T]: P extends U ? EnumKey<E> | null | undefined : T[P]
};

/**
 * The {@link Backup} class represents a Cloud Spanner
 * backup.
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

  request: <T, R = void>(
    config: RequestConfig,
    callback: RequestCallback<T, R>
  ) => void;

  formattedName_: string;

  constructor(
    private instance: Instance,
    private backupId: string,
    private databasePath: string,
    private expireTime: PreciseDate
  ) {
    this.request = instance.request;
    this.formattedName_ = this.instance.formattedName_ + '/backups/' + this.backupId;
  }

  /**
   * Create a backup.
   *
   * @method Backup#create
   * @returns {Promise<CreateBackupResponse>} when resolved, the backup operation will have started, but will not
   * have necessarily completed.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   * const instance = spanner.instance('my-instance');
   * const database = spanner.database('my-database');
   * const backupExpiryDate = new PreciseDate(Date.now() + 1000 * 60 * 60 * 24)
   * const backup = instance.backup('my-backup', database.formattedName_, backupExpiryDate);
   * const [backupOperation] = await backup.create();
   * // To wait until the backup has completed, await completion of the backup operation as well
   * await backupOperation.promise();
   */
  create(): Promise<CreateBackupResponse>;
  create(callback: CreateBackupCallback): void;

  create(
    callback?: CreateBackupCallback
  ): Promise<CreateBackupResponse> | void {

    const reqOpts: databaseAdmin.spanner.admin.database.v1.ICreateBackupRequest = extend(
      {
        parent: this.instance.formattedName_,
        backupId: this.backupId,
        backup: {
          database: this.databasePath,
          expireTime: this.expireTime.toStruct(),
          name: this.formattedName_
        }
      }
    );
    return this.request(
      {
        client: 'DatabaseAdminClient',
        method: 'createBackup',
        reqOpts,
      },
      callback!
    );
  }

  getBackupInfo(): Promise<GetBackupInfoResponse>;
  getBackupInfo(callback: GetBackupInfoCallback): void;
  getBackupInfo(
    callback?: GetBackupInfoCallback
  ): void | Promise<GetBackupInfoResponse> {
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

  async getState(): Promise<EnumKey<typeof databaseAdmin.spanner.admin.database.v1.Backup.State> | undefined> {
    const [backupInfo] = await this.getBackupInfo();
    const state = backupInfo.state;
    return state === null || state === undefined ? undefined : state;
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Backup, {
  exclude: [
    'getState'
  ],
});

/**
 * Reference to the {@link Backup} class.
 * @name module:@google-cloud/spanner.Backup
 * @see Backup
 */
export {Backup};
