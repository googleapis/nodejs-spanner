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
import {DatabaseAdminClient as d} from '../src/v1';

export type CreateBackupCallback = ResourceCallback<
  GaxOperation,
  databaseAdmin.longrunning.IOperation
>;

export interface CreateBackupGaxOperation extends GaxOperation {
  // Overridden with more specific type for CreateBackup operation
  metadata: (Metadata & databaseAdmin.spanner.admin.database.v1.ICreateBackupMetadata) | null; //TODO can metadata actually be null for CreateBackup?
}

export type CreateBackupResponse = [
  CreateBackupGaxOperation,
  databaseAdmin.longrunning.IOperation
];

type GetBackupInfoResponse = [databaseAdmin.spanner.admin.database.v1.IBackup];
type GetBackupInfoCallback = RequestCallback<
  databaseAdmin.spanner.admin.database.v1.IBackup
>;

type UpdateExpireTimeCallback = RequestCallback<
  Backup
>;

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
    return this.request<databaseAdmin.spanner.admin.database.v1.IBackup>(
      {
        client: 'DatabaseAdminClient',
        method: 'getBackup',
        reqOpts,
      },
      (err, response) => {
        // Fix enum type which incorrectly has the enum name as string instead of number key
        // TODO investigate this
        if (response && typeof response.state === 'string') {
          console.debug('Need to fix up this state: ' + response.state);
          const fixedState = Backup.fixBackupState(response.state);
          console.debug('The fixed state is: ' + fixedState);
          if (fixedState !== null && fixedState !== undefined) {
            response.state = fixedState as unknown as databaseAdmin.spanner.admin.database.v1.Backup.State;
          }
          // does not work since databaseAdmin.spanner.admin.database.v1.Backup.State object not resolvable at runtime
          // enum table object might not be generated due to declare or some other generator magic?
          // response.state = Backup.enumKeyToValue(databaseAdmin.spanner.admin.database.v1.Backup.State, response.state);
        }
        callback!(err, response);
      }
    );
  }

  /**
   * Workaround for the backend returning enum values as string keys instead of index values which violates
   * typescript definition.  Maps any values that are string keys back into their numeric form.
   *
   * @param state the backup state to fix.
   */
  private static fixBackupState(state: keyof typeof d.State): d.State {
    switch (state) {
      case 'STATE_UNSPECIFIED':
        return d.State.STATE_UNSPECIFIED;
      case 'CREATING':
        return d.State.CREATING;
      case 'READY':
        return d.State.READY;
    }
  }

  // Would have been nice to do this but backup state enum object is not resolvable at runtime...
  /*
  private static enumKeyToValue<E extends {[index: string]: unknown}>(enumType: E, key: keyof typeof enumType): E[keyof typeof enumType] {
    return enumType[key];
  }
  */

  async getState(): Promise<databaseAdmin.spanner.admin.database.v1.Backup.State | undefined> {
    const [backupInfo] = await this.getBackupInfo();
    const state = backupInfo.state;
    return state === null || state === undefined ? undefined : state;
  }

  updateExpireTime(expireTime: PreciseDate): Promise<Backup>;
  updateExpireTime(expireTime: PreciseDate, callback: UpdateExpireTimeCallback): void;
  updateExpireTime(
    expireTime: PreciseDate,
    callback?: UpdateExpireTimeCallback
  ): void | Promise<Backup> {

    this.expireTime = expireTime;

    const reqOpts: databaseAdmin.spanner.admin.database.v1.IUpdateBackupRequest = {
      backup: {
        name: this.formattedName_,
        expireTime: expireTime.toStruct()
      },
      updateMask: {
        paths: ['expire_time']
      }
    };
    return this.request<databaseAdmin.spanner.admin.database.v1.IBackup>(
      {
        client: 'DatabaseAdminClient',
        method: 'updateBackup',
        reqOpts,
      },
      (err) => {
        callback!(err, this);
      }
    );
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
