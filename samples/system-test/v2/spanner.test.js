// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const {Spanner} = require('@google-cloud/spanner');
const {KeyManagementServiceClient} = require('@google-cloud/kms');
const {assert} = require('chai');
const {describe, it, before, after} = require('mocha');
const cp = require('child_process');
const pLimit = require('p-limit');

const execSync = cmd => cp.execSync(cmd, {encoding: 'utf-8'});
const backupsCmd = 'node v2/backups.js';

const CURRENT_TIME = Math.round(Date.now() / 1000).toString();
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const PREFIX = 'test-instance';
const INSTANCE_ID =
  process.env.SPANNERTEST_INSTANCE || `${PREFIX}-${CURRENT_TIME}`;
const SAMPLE_INSTANCE_ID = `${PREFIX}-my-sample-instance-${CURRENT_TIME}`;
const INSTANCE_ALREADY_EXISTS = !!process.env.SPANNERTEST_INSTANCE;
const DATABASE_ID = `test-database-${CURRENT_TIME}`;
const PG_DATABASE_ID = `test-pg-database-${CURRENT_TIME}`;
const RESTORE_DATABASE_ID = `test-database-${CURRENT_TIME}-r`;
const ENCRYPTED_RESTORE_DATABASE_ID = `test-database-${CURRENT_TIME}-r-enc`;
const BACKUP_ID = `test-backup-${CURRENT_TIME}`;
const COPY_BACKUP_ID = `test-copy-backup-${CURRENT_TIME}`;
const ENCRYPTED_BACKUP_ID = `test-backup-${CURRENT_TIME}-enc`;
const CANCELLED_BACKUP_ID = `test-backup-${CURRENT_TIME}-c`;
const LOCATION_ID = 'europe-west10';
const KEY_LOCATION_ID = 'europe-west10';
const KEY_RING_ID = 'test-key-ring-node';
const KEY_ID = 'test-key';

const spanner = new Spanner({
  projectId: PROJECT_ID,
});
const LABEL = 'node-sample-tests';
const GAX_OPTIONS = {
  retry: {
    retryCodes: [4, 8, 14],
    backoffSettings: {
      initialRetryDelayMillis: 1000,
      retryDelayMultiplier: 1.3,
      maxRetryDelayMillis: 32000,
      initialRpcTimeoutMillis: 60000,
      rpcTimeoutMultiplier: 1,
      maxRpcTimeoutMillis: 60000,
      totalTimeoutMillis: 600000,
    },
  },
};

const delay = async test => {
  const retries = test.currentRetry();
  // No retry on the first failure.
  if (retries === 0) return;
  // See: https://cloud.google.com/storage/docs/exponential-backoff
  const ms = Math.pow(2, retries) + Math.random() * 1000;
  return new Promise(done => {
    console.info(`retrying "${test.title}" in ${ms}ms`);
    setTimeout(done, ms);
  });
};

async function deleteStaleInstances() {
  let [instances] = await spanner.getInstances({
    filter: `(labels.${LABEL}:true) OR (labels.cloud_spanner_samples:true)`,
  });
  const old = new Date();
  old.setHours(old.getHours() - 4);

  instances = instances.filter(instance => {
    return (
      instance.metadata.labels['created'] &&
      new Date(parseInt(instance.metadata.labels['created']) * 1000) < old
    );
  });
  const limit = pLimit(5);
  await Promise.all(
    instances.map(instance =>
      limit(() => setTimeout(deleteInstance, delay, instance))
    )
  );
}

async function deleteInstance(instance) {
  const [backups] = await instance.getBackups();
  await Promise.all(backups.map(backup => backup.delete(GAX_OPTIONS)));
  return instance.delete(GAX_OPTIONS);
}

async function getCryptoKey() {
  const NOT_FOUND = 5;

  // Instantiates a client.
  const client = new KeyManagementServiceClient();

  // Build the parent key ring name.
  const keyRingName = client.keyRingPath(
    PROJECT_ID,
    KEY_LOCATION_ID,
    KEY_RING_ID
  );

  // Get key ring.
  try {
    await client.getKeyRing({name: keyRingName});
  } catch (err) {
    // Create key ring if it doesn't exist.
    if (err.code === NOT_FOUND) {
      // Build the parent location name.
      const locationName = client.locationPath(PROJECT_ID, KEY_LOCATION_ID);
      await client.createKeyRing({
        parent: locationName,
        keyRingId: KEY_RING_ID,
      });
    } else {
      throw err;
    }
  }

  // Get key.
  try {
    // Build the key name
    const keyName = client.cryptoKeyPath(
      PROJECT_ID,
      KEY_LOCATION_ID,
      KEY_RING_ID,
      KEY_ID
    );
    const [key] = await client.getCryptoKey({
      name: keyName,
    });
    return key;
  } catch (err) {
    // Create key if it doesn't exist.
    if (err.code === NOT_FOUND) {
      const [key] = await client.createCryptoKey({
        parent: keyRingName,
        cryptoKeyId: KEY_ID,
        cryptoKey: {
          purpose: 'ENCRYPT_DECRYPT',
          versionTemplate: {
            algorithm: 'GOOGLE_SYMMETRIC_ENCRYPTION',
          },
        },
      });
      return key;
    } else {
      throw err;
    }
  }
}

describe('AdminClient', () => {
  const instance = spanner.instance(INSTANCE_ID);

  before(async () => {
    await deleteStaleInstances();

    if (!INSTANCE_ALREADY_EXISTS) {
      const [, operation] = await instance.create({
        config: LOCATION_ID,
        nodes: 1,
        labels: {
          [LABEL]: 'true',
          created: CURRENT_TIME,
        },
        gaxOptions: GAX_OPTIONS,
      });
      return operation.promise();
    } else {
      console.log(
        `Not creating temp instance, using + ${instance.formattedName_}...`
      );
    }
  });

  after(async () => {
    const instance = spanner.instance(INSTANCE_ID);

    if (!INSTANCE_ALREADY_EXISTS) {
      // Make sure all backups are deleted before an instance can be deleted.
      await Promise.all([
        instance.backup(BACKUP_ID).delete(GAX_OPTIONS),
        instance.backup(ENCRYPTED_BACKUP_ID).delete(GAX_OPTIONS),
        instance.backup(COPY_BACKUP_ID).delete(GAX_OPTIONS),
        instance.backup(CANCELLED_BACKUP_ID).delete(GAX_OPTIONS),
      ]);
      await instance.delete(GAX_OPTIONS);
    } else {
      await Promise.all([
        instance.database(DATABASE_ID).delete(),
        instance.database(PG_DATABASE_ID).delete(),
        instance.database(RESTORE_DATABASE_ID).delete(),
        instance.database(ENCRYPTED_RESTORE_DATABASE_ID).delete(),
        instance.backup(BACKUP_ID).delete(GAX_OPTIONS),
        instance.backup(COPY_BACKUP_ID).delete(GAX_OPTIONS),
        instance.backup(ENCRYPTED_BACKUP_ID).delete(GAX_OPTIONS),
        instance.backup(CANCELLED_BACKUP_ID).delete(GAX_OPTIONS),
      ]);
    }
    await spanner.instance(SAMPLE_INSTANCE_ID).delete(GAX_OPTIONS);
  });

  // create_backup
  it('should create a backup of the database', async () => {
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);
    const query = {
      sql: 'SELECT CURRENT_TIMESTAMP() as Timestamp',
    };
    const [rows] = await database.run(query);
    const versionTime = rows[0].toJSON().Timestamp.toISOString();

    const output = execSync(
      `${backupsCmd} createBackup ${INSTANCE_ID} ${DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID} ${versionTime}`
    );
    assert.match(output, new RegExp(`Backup (.+)${BACKUP_ID} of size`));
  });

  // create_backup_with_encryption_key
  it('should create an encrypted backup of the database', async () => {
    const key = await getCryptoKey();

    const output = execSync(
      `${backupsCmd} createBackupWithEncryptionKey ${INSTANCE_ID} ${DATABASE_ID} ${ENCRYPTED_BACKUP_ID} ${PROJECT_ID} ${key.name}`
    );
    console.log(output);
    assert.match(
      output,
      new RegExp(`Backup (.+)${ENCRYPTED_BACKUP_ID} of size`)
    );
    assert.include(output, `using encryption key ${key.name}`);
  });

  // copy_backup
  it('should create a copy of a backup', async () => {
    const sourceBackupPath = `projects/${PROJECT_ID}/instances/${INSTANCE_ID}/backups/${BACKUP_ID}`;
    const output = execSync(
      `node v2/backups-copy.js ${INSTANCE_ID} ${COPY_BACKUP_ID} ${sourceBackupPath} ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(`(.*)Backup copy(.*)${COPY_BACKUP_ID} of size(.*)`)
    );
  });

  // cancel_backup
  it('should cancel a backup of the database using autogen', async () => {
    const output = execSync(
      `${backupsCmd} cancelBackup ${INSTANCE_ID} ${DATABASE_ID} ${CANCELLED_BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Backup cancelled./);
  });

  // get_backups
  it('should list backups in the instance', async () => {
    const output = execSync(
      `${backupsCmd} getBackups ${INSTANCE_ID} ${DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.include(output, 'All backups:');
    assert.include(output, 'Backups matching backup name:');
    assert.include(output, 'Backups expiring within 30 days:');
    assert.include(output, 'Backups matching database name:');
    assert.include(output, 'Backups filtered by size:');
    assert.include(output, 'Ready backups filtered by create time:');
    assert.include(output, 'Get backups paginated:');
    const count = (output.match(new RegExp(`${BACKUP_ID}`, 'g')) || []).length;
    assert.equal(count, 6);
  });

  // list_backup_operations
  it('should list backup operations in the instance', async () => {
    const output = execSync(
      `${backupsCmd} getBackupOperations ${INSTANCE_ID} ${DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Create Backup Operations:/);
    assert.match(
      output,
      new RegExp(
        `Backup (.+)${BACKUP_ID} on database (.+)${DATABASE_ID} is 100% complete.`
      )
    );
    assert.match(output, /Copy Backup Operations:/);
    assert.match(
      output,
      new RegExp(
        `Backup (.+)${COPY_BACKUP_ID} copied from source backup (.+)${BACKUP_ID} is 100% complete`
      )
    );
  });

  // update_backup_expire_time
  it('should update the expire time of a backup', async () => {
    const output = execSync(
      `${backupsCmd} updateBackup ${INSTANCE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Expire time updated./);
  });

  // list_backup_operations
  it('should list backups in the instance', async () => {
    const output = execSync(
      `${backupsCmd} getBackups ${INSTANCE_ID} ${DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.include(output, 'All backups:');
    assert.include(output, 'Backups matching backup name:');
    assert.include(output, 'Backups expiring within 30 days:');
    assert.include(output, 'Backups matching database name:');
    assert.include(output, 'Backups filtered by size:');
    assert.include(output, 'Ready backups filtered by create time:');
    assert.include(output, 'Get backups paginated:');
    const count = (output.match(new RegExp(`${BACKUP_ID}`, 'g')) || []).length;
    assert.equal(count, 6);
  });

  // restore_backup
  it('should restore database from a backup', async function () {
    // Restoring a backup can be a slow operation so the test may timeout and
    // we'll have to retry.
    this.retries(5);
    // Delay the start of the test, if this is a retry.
    await delay(this.test);

    const output = execSync(
      `${backupsCmd} restoreBackup ${INSTANCE_ID} ${RESTORE_DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Database restored from backup./);
    assert.match(
      output,
      new RegExp(
        `Database (.+) was restored to ${RESTORE_DATABASE_ID} from backup ` +
          `(.+)${BACKUP_ID} with version time (.+)`
      )
    );
  });

  // restore_backup_with_encryption_key
  it('should restore database from a backup using an encryption key', async function () {
    // Restoring a backup can be a slow operation so the test may timeout and
    // we'll have to retry.
    this.retries(5);
    // Delay the start of the test, if this is a retry.
    await delay(this.test);

    const key = await getCryptoKey();

    const output = execSync(
      `${backupsCmd} restoreBackupWithEncryptionKey ${INSTANCE_ID} ${ENCRYPTED_RESTORE_DATABASE_ID} ${ENCRYPTED_BACKUP_ID} ${PROJECT_ID} ${key.name}`
    );
    assert.match(output, /Database restored from backup./);
    assert.match(
      output,
      new RegExp(
        `Database (.+) was restored to ${ENCRYPTED_RESTORE_DATABASE_ID} from backup ` +
          `(.+)${ENCRYPTED_BACKUP_ID} using encryption key ${key.name}`
      )
    );
  });

  // list_database_operations
  it('should list database operations in the instance', async () => {
    const output = execSync(
      `${backupsCmd} getDatabaseOperations ${INSTANCE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Optimize Database Operations:/);
    assert.match(
      output,
      new RegExp(
        `Database (.+)${RESTORE_DATABASE_ID} restored from backup is (\\d+)% ` +
          'optimized'
      )
    );
  });

  // delete_backup
  it('should delete a backup', async () => {
    function sleep(timeMillis) {
      return new Promise(resolve => setTimeout(resolve, timeMillis));
    }

    // Wait for database to finish optimizing - cannot delete a backup if a database restored from it
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(RESTORE_DATABASE_ID);

    while ((await database.getState()) === 'READY_OPTIMIZING') {
      await sleep(1000);
    }

    const output = execSync(
      `${backupsCmd} deleteBackup ${INSTANCE_ID} ${RESTORE_DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Backup deleted./);
  });
});
