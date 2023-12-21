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
const INSTANCE_ID =
  process.env.SPANNERTEST_INSTANCE || `${PREFIX}-${CURRENT_TIME}`;
const DATABASE_ID = `test-database-${CURRENT_TIME}`;

const spanner = new Spanner({
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
