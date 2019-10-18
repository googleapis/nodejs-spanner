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
import * as r from 'teeny-request';
import { google as databaseAdmin } from '../proto/spanner_database_admin';
import { Instance, } from './instance';
import { RequestCallback, ResourceCallback, } from './common';
import { RequestConfig, Table } from '.';
import { Operation as GaxOperation } from 'google-gax';
import * as extend from 'extend';

export type CreateBackupCallback = ResourceCallback<
  GaxOperation,
  databaseAdmin.longrunning.IOperation
>;

export type CreateBackupResponse = [
  GaxOperation,
  databaseAdmin.longrunning.IOperation
];

class Backup {

  request: <T, R = void>(
    config: RequestConfig,
    callback: RequestCallback<T, R>
  ) => void;


  constructor(
    private instance: Instance,
    private backupId: string,
    private databasePath: string,
    expireTime: Date
  ) {
    this.request = instance.request;
  }

  create(): Promise<CreateBackupResponse>;
  create(callback: CreateBackupCallback): void;

  create(
    callback?: CreateBackupCallback
  ): Promise<CreateBackupResponse> | void {

    /*
    const reqOpts: databaseAdmin.spanner.admin.database.v1.ICreateBackupRequest = {
      parent: this.databasePath,
      backupId: this.backupId,
    };
    */

    const reqOpts: databaseAdmin.spanner.admin.database.v1.ICreateBackupRequest = extend(
      {
        parent: this.databasePath,
        backupId: this.backupId,
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
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Backup, {
  exclude: [
  ],
});

/**
 * Reference to the {@link Backup} class.
 * @name module:@google-cloud/spanner.Backup
 * @see Backup
 */
export {Backup};
