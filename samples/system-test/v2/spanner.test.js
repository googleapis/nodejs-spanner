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
const {InstanceAdminClient} = require('@google-cloud/spanner/build/src/v1');
// const {InstanceAdminClient} = require('../../src')
const {assert} = require('chai');
const {describe, it, afterEach} = require('mocha');
const cp = require('child_process');

const execSync = cmd => cp.execSync(cmd, {encoding: 'utf-8'});
const instanceUsingAutogenCodeCmd = 'node v2/create-instance.js';
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

const spanner = new Spanner({
  projectId: PROJECT_ID,
});

const instanceAdminClient = new InstanceAdminClient({
  projectId: PROJECT_ID,
});

describe('AdminClients', () => {
  describe('instance', () => {
    afterEach(async () => {
      const sample_instance = spanner.instance(SAMPLE_INSTANCE_ID);
      await sample_instance.delete();
    });

    // create_instance_using_instance_admin_client
    it('should create an example instance using instance admin client', async () => {
      const output = execSync(
        `${instanceUsingAutogenCodeCmd} createInstanceUsingAdminClient "${SAMPLE_INSTANCE_ID}" ${PROJECT_ID}`
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
  });

  describe('leader options', () => {
    before(async () => {
      const [operation] = await instanceAdminClient.createInstance({
        instanceId: SAMPLE_INSTANCE_ID,
        instance: {
          config: instanceAdminClient.instanceConfigPath(
            PROJECT_ID,
            "nam6",
          ),
          displayName: 'Multi-region options test',
          nodeCount: 1,
        },
        parent: instanceAdminClient.projectPath(PROJECT_ID),
      });
      await operation.promise();
    });

    after(async () => {
      const instance = spanner.instance(SAMPLE_INSTANCE_ID);
      await instance.delete();
    });

    // create_instance_config
    it('should create an example custom instance config using autogen client', async () => {
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

    // update_instance_config
    it('should update an example custom instance config', async () => {
      const output = execSync(
        `node instance-config-update.js ${SAMPLE_INSTANCE_CONFIG_ID} ${PROJECT_ID}`
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
        `node instance-config-get-operations.js ${PROJECT_ID}`
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
      const output = execSync(`node list-instance-configs.js ${PROJECT_ID}`);
      assert.match(
        output,
        new RegExp(`Available instance configs for project ${PROJECT_ID}:`)
      );
      assert.include(output, 'Available leader options for instance config');
    });

    // get_instance_config
    // TODO: Enable when the feature has been released.
    it.skip('should get a specific instance config', async () => {
      const output = execSync(`node get-instance-config.js ${PROJECT_ID}`);
      assert.include(output, 'Available leader options for instance config');
    });

    // create_database_with_default_leader
    it('should create a database with a default leader', async () => {
      const output = execSync(
        `node database-create-with-default-leader.js "${SAMPLE_INSTANCE_ID}" "${DEFAULT_LEADER_DATABASE_ID}" "${DEFAULT_LEADER}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Waiting for creation of ${DEFAULT_LEADER_DATABASE_ID} to complete...`
        )
      );
      assert.match(
        output,
        new RegExp(
          `Created database ${DEFAULT_LEADER_DATABASE_ID} with default leader ${DEFAULT_LEADER}.`
        )
      );
    });

    // update_database_with_default_leader
    it('should update a database with a default leader', async () => {
      const output = execSync(
        `node database-update-default-leader.js "${SAMPLE_INSTANCE_ID}" "${DEFAULT_LEADER_DATABASE_ID}" "${DEFAULT_LEADER_2}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Waiting for updating of ${DEFAULT_LEADER_DATABASE_ID} to complete...`
        )
      );
      assert.match(
        output,
        new RegExp(
          `Updated database ${DEFAULT_LEADER_DATABASE_ID} with default leader ${DEFAULT_LEADER_2}.`
        )
      );
    });

    // get_default_leader
    it('should get the default leader option of a database', async () => {
      const output = execSync(
        `node database-get-default-leader.js "${SAMPLE_INSTANCE_ID}" "${DEFAULT_LEADER_DATABASE_ID}" ${PROJECT_ID}`
      );
      assert.include(
        output,
        `The default_leader for ${DEFAULT_LEADER_DATABASE_ID} is ${DEFAULT_LEADER_2}`
      );
    });

    // list_databases
    it('should list databases on the instance', async () => {
      const output = execSync(
        `node list-databases.js "${SAMPLE_INSTANCE_ID}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Databases for projects/${PROJECT_ID}/instances/${SAMPLE_INSTANCE_ID}:`
        )
      );
      assert.include(output, `(default leader = ${DEFAULT_LEADER_2}`);
    });

    // get_database_ddl
    it('should get the ddl of a database', async () => {
      const output = execSync(
        `node database-get-ddl.js "${SAMPLE_INSTANCE_ID}" "${DEFAULT_LEADER_DATABASE_ID}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Retrieved database DDL for projects/${PROJECT_ID}/instances/${SAMPLE_INSTANCE_ID}/databases/${DEFAULT_LEADER_DATABASE_ID}:`
        )
      );
      assert.include(output, 'CREATE TABLE Singers');
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
