/**
 * Copyright 2019 Google LLC
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

'use strict';

const {createBackup} = require('./backups-create');
const {updateBackupExpireTime} = require('./backups-update');
const {restoreBackup} = require('./backups-restore');
const {deleteBackup} = require('./backups-delete');

require(`yargs`)
  .demand(1)
  .command(
    `createBackup <instanceName> <databaseName> <backupName> <projectId>`,
    `Creates a backup of a Cloud Spanner database.`,
    {},
    opts => createBackup(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
  )
  .command(
    `updateBackupExpireTime <instanceName> <databaseName> <backupName> <projectId>`,
    `Updates the expire time of a backup.`,
    {},
    opts => updateBackupExpireTime(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
  )
  .command(
    `restoreBackup <instanceName> <databaseName> <backupName> <projectId>`,
    `Restores a Cloud Spanner database from a backup.`,
    {},
    opts => restoreBackup(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
  )
  .command(
    `deleteBackup <instanceName> <databaseName> <backupName> <projectId>`,
    `Deletes a backup.`,
    {},
    opts => deleteBackup(opts.instanceName, opts.databaseName, opts.backupName, opts.projectId)
    )
  .example(`node $0 createBackup "my-instance" "my-database" "my-backup" "my-project-id"`)
  .wrap(120)
  .recommendCommands()
  .epilogue(`For more information, see https://cloud.google.com/spanner/docs`)
  .strict()
  .help().argv;
