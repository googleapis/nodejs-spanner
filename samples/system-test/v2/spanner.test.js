// Copyright 2023 Google LLC
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
const {InstanceAdminClient} = require('@google-cloud/spanner/build/src/v1');
const pLimit = require('p-limit');
const {describe, it, before, after, afterEach} = require('mocha');
const {assert} = require('chai');
const cp = require('child_process');

const execSync = cmd => cp.execSync(cmd, {encoding: 'utf-8'});
const instanceCmd = 'node v2/instance.js';
const databaseUsingAutogenCodeCmd = 'node v2/create-database.js';

const CURRENT_TIME = Math.round(Date.now() / 1000).toString();
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const PREFIX = 'test-instance';
const SAMPLE_INSTANCE_ID = `${PREFIX}-my-sample-instance-${CURRENT_TIME}`;
const SAMPLE_INSTANCE_CONFIG_ID = `custom-my-sample-instance-config-${CURRENT_TIME}`;
const BASE_INSTANCE_CONFIG_ID = 'regional-us-west2';
const INSTANCE_ID =
  process.env.SPANNERTEST_INSTANCE || `${PREFIX}-${CURRENT_TIME}`;
const DATABASE_ID = `test-database-${CURRENT_TIME}`;
const INSTANCE_ALREADY_EXISTS = !!process.env.SPANNERTEST_INSTANCE;
const PG_DATABASE_ID = `test-pg-database-${CURRENT_TIME}`;
const RESTORE_DATABASE_ID = `test-database-${CURRENT_TIME}-r`;
const ENCRYPTED_RESTORE_DATABASE_ID = `test-database-${CURRENT_TIME}-r-enc`;
const VERSION_RETENTION_DATABASE_ID = `test-database-${CURRENT_TIME}-v`;
const ENCRYPTED_DATABASE_ID = `test-database-${CURRENT_TIME}-enc`;
const DEFAULT_LEADER_DATABASE_ID = `test-database-${CURRENT_TIME}-dl`;
const SEQUENCE_DATABASE_ID = `test-seq-database-${CURRENT_TIME}-r`;
const BACKUP_ID = `test-backup-${CURRENT_TIME}`;
const COPY_BACKUP_ID = `test-copy-backup-${CURRENT_TIME}`;
const ENCRYPTED_BACKUP_ID = `test-backup-${CURRENT_TIME}-enc`;
const CANCELLED_BACKUP_ID = `test-backup-${CURRENT_TIME}-c`;
const LOCATION_ID = 'regional-us-central1';
const PG_LOCATION_ID = 'regional-us-west2';
const KEY_LOCATION_ID = 'us-central1';
const KEY_RING_ID = 'test-key-ring-node';
const KEY_ID = 'test-key';
const DEFAULT_LEADER = 'us-central1';
const DEFAULT_LEADER_2 = 'us-east1';

const spanner = new Spanner({
  projectId: PROJECT_ID,
});

const instanceAdminClient = new InstanceAdminClient({
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

describe('AdminClients', () => {
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
  describe('instance', () => {
    afterEach(async () => {
      const sample_instance = spanner.instance(SAMPLE_INSTANCE_ID);
      await sample_instance.delete();
    });

    // create_instance_using_instance_admin_client
    it('should create an example instance', async () => {
      const output = execSync(
        `${instanceCmd} createInstance "${SAMPLE_INSTANCE_ID}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Waiting for operation on ${SAMPLE_INSTANCE_ID} to complete...`
        )
      );
      assert.match(
        output,
        new RegExp(`Created instance ${SAMPLE_INSTANCE_ID}.`)
      );
    });

    // create_instance_with_processing_units
    it('should create an example instance with processing units', async () => {
      const output = execSync(
        `${instanceCmd} createInstanceWithProcessingUnits "${SAMPLE_INSTANCE_ID}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Waiting for operation on ${SAMPLE_INSTANCE_ID} to complete...`
        )
      );
      assert.match(
        output,
        new RegExp(`Created instance ${SAMPLE_INSTANCE_ID}.`)
      );
      assert.match(
        output,
        new RegExp(`Instance ${SAMPLE_INSTANCE_ID} has 500 processing units.`)
      );
    });

    // create_instance_with_autoscaling_config
    it('should create an example instance with autoscaling config', async () => {
      const output = execSync(
        `${instanceCmd} createInstanceWithAutoscalingConfig "${SAMPLE_INSTANCE_ID}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Waiting for operation on ${SAMPLE_INSTANCE_ID} to complete...`
        )
      );
      assert.match(
        output,
        new RegExp(`Created instance ${SAMPLE_INSTANCE_ID}.`)
      );
      assert.match(
        output,
        new RegExp(
          `Autoscaling configurations of ${SAMPLE_INSTANCE_ID} are:  ` +
            '\n' +
            'Min nodes: 1 ' +
            'nodes.' +
            '\n' +
            'Max nodes: 2' +
            ' nodes.' +
            '\n' +
            'High priority cpu utilization percent: 65.' +
            '\n' +
            'Storage utilization percent: 95.'
        )
      );
    });

    // create_instance_config
    it('should create an example custom instance config', async () => {
      const output = execSync(
        `node v2/instance-config-create.js ${SAMPLE_INSTANCE_CONFIG_ID} ${BASE_INSTANCE_CONFIG_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Waiting for create operation for ${SAMPLE_INSTANCE_CONFIG_ID} to complete...`
        )
      );
      assert.match(
        output,
        new RegExp(`Created instance config ${SAMPLE_INSTANCE_CONFIG_ID}.`)
      );
    });
  });

  describe('leader options', () => {
    before(async () => {
      const [baseInstanceConfig] = await instanceAdminClient.getInstanceConfig({
        name: instanceAdminClient.instanceConfigPath(
          PROJECT_ID,
          BASE_INSTANCE_CONFIG_ID
        ),
      });
      const [operation] = await instanceAdminClient.createInstanceConfig({
        instanceConfigId: SAMPLE_INSTANCE_CONFIG_ID,
        instanceConfig: {
          name: instanceAdminClient.instanceConfigPath(
            PROJECT_ID,
            SAMPLE_INSTANCE_CONFIG_ID
          ),
          baseConfig: instanceAdminClient.instanceConfigPath(
            PROJECT_ID,
            BASE_INSTANCE_CONFIG_ID
          ),
          displayName: SAMPLE_INSTANCE_CONFIG_ID,
          replicas: baseInstanceConfig.replicas,
          optionalReplicas: baseInstanceConfig.optionalReplicas,
        },
        parent: instanceAdminClient.projectPath(PROJECT_ID),
      });
      await operation.promise();
    });

    after(async () => {
      const [operation] = await instanceAdminClient.deleteInstanceConfig({
        name: instanceAdminClient.instanceConfigPath(
          PROJECT_ID,
          SAMPLE_INSTANCE_CONFIG_ID
        ),
      });
    });

    // update_instance_config
    it('should update an example custom instance config', async () => {
      const output = execSync(
        `node v2/instance-config-update.js ${SAMPLE_INSTANCE_CONFIG_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Waiting for update operation for ${SAMPLE_INSTANCE_CONFIG_ID} to complete...`
        )
      );
      assert.match(
        output,
        new RegExp(`Updated instance config ${SAMPLE_INSTANCE_CONFIG_ID}.`)
      );
    });

    // delete_instance_config
    it('should delete an example custom instance config', async () => {
      const output = execSync(
        `node instance-config-delete.js ${SAMPLE_INSTANCE_CONFIG_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(`Deleting ${SAMPLE_INSTANCE_CONFIG_ID}...`)
      );
      assert.match(
        output,
        new RegExp(`Deleted instance config ${SAMPLE_INSTANCE_CONFIG_ID}.`)
      );
    });

    // list_instance_config_operations
    it('should list all instance config operations', async () => {
      const output = execSync(
        `node v2/instance-config-get-operations.js ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Getting list of instance config operations on project ${PROJECT_ID}...\n`
        )
      );
      assert.match(
        output,
        new RegExp(
          `Available instance config operations for project ${PROJECT_ID}:`
        )
      );
      assert.include(output, 'Instance config operation for');
      assert.include(
        output,
        'type.googleapis.com/google.spanner.admin.instance.v1.CreateInstanceConfigMetadata'
      );
    });

    // list_instance_configs
    it('should list available instance configs', async () => {
      const output = execSync(`node v2/list-instance-configs.js ${PROJECT_ID}`);
      assert.match(
        output,
        new RegExp(`Available instance configs for project ${PROJECT_ID}:`)
      );
      assert.include(output, 'Available leader options for instance config');
    });

    // get_instance_config
    // TODO: Enable when the feature has been released.
    it.skip('should get a specific instance config', async () => {
      const output = execSync(`node v2/get-instance-config.js ${PROJECT_ID}`);
      assert.include(output, 'Available leader options for instance config');
    });
  });

  describe('database', () => {
    // create_database_using_database_admin_client
    it('should create an example database using database admin client', async () => {
      const output = execSync(
        `${databaseUsingAutogenCodeCmd} createDatabaseUsingAdminClient "${INSTANCE_ID}" "${DATABASE_ID}" "${PROJECT_ID}"`
      );
      assert.match(
        output,
        new RegExp(`Waiting for creation of ${DATABASE_ID} to complete...`)
      );
      assert.match(
        output,
        new RegExp(
          `Created database ${DATABASE_ID} on instance ${INSTANCE_ID}.`
        )
      );
    });
  });
});
