/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
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

import * as assert from 'assert';
import {describe, it, before, after} from 'mocha';
import pLimit = require('p-limit');
import * as uuid from 'uuid';
import {Backup, Database, Spanner, Instance, InstanceConfig} from '../src';
import {grpc, CallOptions} from 'google-gax';
const PREFIX = 'gcloud-tests-';
const spanner = new Spanner({
  projectId: process.env.GCLOUD_PROJECT,
  apiEndpoint: process.env.API_ENDPOINT,
});
const instanceAdminClient = spanner.get_instance_admin_client();
const databaseAdminClient = spanner.get_database_admin_client();
const GAX_OPTIONS: CallOptions = {
  retry: {
    retryCodes: [
      grpc.status.RESOURCE_EXHAUSTED,
      grpc.status.DEADLINE_EXCEEDED,
      grpc.status.UNAVAILABLE,
    ],
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

describe('Admin Client', () => {
  const envInstanceName = process.env.SPANNERTEST_INSTANCE;
  // True if a new instance has been created for this test run, false if reusing an existing instance
  const generateInstanceForTest = !envInstanceName;
  const instance = envInstanceName ? envInstanceName : generateName('instance');

  const IS_EMULATOR_ENABLED =
    typeof process.env.SPANNER_EMULATOR_HOST !== 'undefined';
  const RESOURCES_TO_CLEAN: Array<Instance | Backup | Database> = [];
  const INSTANCE_CONFIGS_TO_CLEAN: Array<InstanceConfig> = [];
  const DATABASE = generateName('database');
  const TABLE_NAME = 'Singers';

  before(async () => {
    await deleteOldTestInstances();
    if (generateInstanceForTest) {
      const [operation] = await instanceAdminClient.createInstance({
        parent: instanceAdminClient.projectPath(process.env.GCLOUD_PROJECT),
        instanceId: instance,
        instance: {
          config: instanceAdminClient.instanceConfigPath(
            process.env.GCLOUD_PROJECT,
            'regional-us-central1'
          ),
          nodeCount: 1,
          displayName: 'Display name for the test instance.',
          labels: {
            cloud_spanner_samples: 'true',
            created: Math.round(Date.now() / 1000).toString(), // current time
          },
        },
      });
      await operation.promise();
      RESOURCES_TO_CLEAN.push(operation);
    } else {
      console.log(
        `Not creating temp instance, using + ${instanceAdminClient.instancePath(
          process.env.GCLOUD_PROJECT,
          envInstanceName
        )}...`
      );
    }
    const [operation] = await databaseAdminClient.createDatabase({
      createStatement: 'CREATE DATABASE `' + DATABASE + '`',
      extraStatements: [
        `CREATE TABLE ${TABLE_NAME} (
          SingerId STRING(1024) NOT NULL,
          Name STRING(1024),
        ) PRIMARY KEY(SingerId)`,
      ],
      parent: databaseAdminClient.instancePath(
        process.env.GCLOUD_PROJECT,
        instance
      ),
    });
    await operation.promise();
  });

  after(async () => {
    try {
      if (generateInstanceForTest) {
        // Sleep for 30 seconds before cleanup, just in case
        await new Promise(resolve => setTimeout(resolve, 30000));
        // Deleting all backups before an instance can be deleted.
        await Promise.all(
          RESOURCES_TO_CLEAN.filter(resource => resource instanceof Backup).map(
            backup => backup.delete(GAX_OPTIONS)
          )
        );
        /**
         * Deleting instances created during this test.
         * All databasess will automatically be deleted with instance.
         * @see {@link https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.DeleteInstance}
         */
        await Promise.all(
          RESOURCES_TO_CLEAN.filter(
            resource => resource instanceof Instance
          ).map(instance => instance.delete(GAX_OPTIONS))
        );
      } else {
        /**
         * Limit the number of concurrent 'Administrative requests per minute'
         * Not to exceed quota
         * @see {@link https://cloud.google.com/spanner/quotas#administrative_limits}
         */
        const limit = pLimit(5);
        await Promise.all(
          RESOURCES_TO_CLEAN.map(resource =>
            limit(() => resource.delete(GAX_OPTIONS))
          )
        );
      }
    } catch (err) {
      console.error('Cleanup failed:', err);
    }
    /**
     * Deleting instance configs created during this test.
     * @see {@link https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.DeleteInstanceConfig}
     */
    await Promise.all(
      INSTANCE_CONFIGS_TO_CLEAN.map(instanceConfig =>
        instanceConfig.delete({gaxOpts: GAX_OPTIONS})
      )
    );
  });

  describe('Instances', () => {
    it('should have created the instance', async () => {
      const [metadata] = await instanceAdminClient.getInstance({
        name: instanceAdminClient.instancePath(
          process.env.GCLOUD_PROJECT,
          envInstanceName
        ),
      });
      assert.strictEqual(
        metadata!.name,
        instanceAdminClient.instancePath(
          process.env.GCLOUD_PROJECT,
          envInstanceName
        )
      );
    });

    it('should list the instances', async () => {
      const [operation] = await instanceAdminClient.listInstances({
        parent: instanceAdminClient.projectPath(process.env.GCLOUD_PROJECT),
      });
      assert(operation!.length > 0);
    });
  });

  describe('Databases', () => {
    async function createDatabase(database, dialect) {
      const [metadata] = await databaseAdminClient.getDatabase({
        name: databaseAdminClient.databasePath(
          process.env.GCLOUD_PROJECT,
          envInstanceName,
          database
        ),
      });
      assert.strictEqual(
        metadata!.name,
        databaseAdminClient.databasePath(
          process.env.GCLOUD_PROJECT,
          envInstanceName,
          database
        )
      );
      assert.strictEqual(metadata!.state, 'READY');
      if (IS_EMULATOR_ENABLED) {
        assert.strictEqual(
          metadata!.databaseDialect,
          'DATABASE_DIALECT_UNSPECIFIED'
        );
      } else {
        assert.strictEqual(metadata!.databaseDialect, dialect);
      }
    }

    it('GOOGLE_STANDARD_SQL should have created the database', async function () {
      createDatabase(DATABASE, 'GOOGLE_STANDARD_SQL');
    });
  });
});

function shortUUID() {
  return uuid.v4().split('-').shift();
}

function generateName(resourceType) {
  return PREFIX + resourceType + '-' + shortUUID();
}

async function deleteOldTestInstances() {
  const [instances] = await spanner.getInstances();
  const currentTimestampSeconds = Math.round(Date.now() / 1000);
  // Leave only instances that contain PREFIX in their name
  // and where created more that an hour ago.
  function isOld(timestampCreated: number) {
    return currentTimestampSeconds - timestampCreated >= 60 * 60 * 4;
  }
  const toDelete = instances.filter(
    instance =>
      instance.id.includes(PREFIX) &&
      isOld(Number(instance.metadata!.labels!.created))
  );

  return deleteInstanceArray(toDelete);
}

function deleteInstanceArray(instanceArray) {
  /**
   * Delay to allow instance and its databases to fully clear.
   * Refer to "Soon afterwards"
   *  @see {@link https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.admin.instance.v1#google.spanner.admin.instance.v1.InstanceAdmin.DeleteInstance}
   */
  const delay = 500;
  const limit = pLimit(5);
  return Promise.all(
    instanceArray.map(instance =>
      limit(() => setTimeout(deleteInstance, delay, instance))
    )
  );
}
async function deleteInstance(instance: Instance) {
  const [backups] = await instance.getBackups();
  await Promise.all(backups.map(backup => backup.delete(GAX_OPTIONS)));
  return instance.delete(GAX_OPTIONS);
}
