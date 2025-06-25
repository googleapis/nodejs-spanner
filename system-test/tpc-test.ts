// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {after, describe, it} from 'mocha';
import {Spanner} from '../src';
import * as assert from 'assert';

// INSTRUCTIONS FOR RUNNING TEST:
// 1. Change describe.skip to describe.only below.
// 2. Reassign process.env.GOOGLE_APPLICATION_CREDENTIALS to local key file.
// 3. Reassign UNIVERSE_DOMAIN_CONSTANT to the universe domain to test.
// 4. Run `npm run system-test`.

describe.skip('Universe domain tests', () => {
  // These tests are only designed to pass when using the service account
  // credentials for the universe domain environment so we skip them in the CI pipeline.
  //
  // To see successful tests, uncomment the following line:
  process.env.GOOGLE_APPLICATION_CREDENTIALS = 'path to your credential file';
  const UNIVERSE_DOMAIN_CONSTANT = 'my-universe-domain';

  const projectId = 'tpc-project-id';

  async function runTest(spanner: Spanner, instanceId, databaseId) {
    try {
      const instance = spanner.instance(instanceId);
      const database = instance.database(databaseId);
      const tableName = 'VenueDetails';
      const table = database.table(tableName);

      const schema = `CREATE TABLE ${tableName} (
                VenueId                INT64 NOT NULL,
                VenueName              STRING(100),
                Capacity               INT64,
            ) PRIMARY KEY (VenueId)`;

      console.log(`Creating table ${table.name}`);
      const [, operation] = await table.create(schema);

      await operation.promise();

      console.log(`${table.name} create successfully.`);

      const venuesTable = database.table(tableName);
      await venuesTable.insert([
        {VenueId: 1, VenueName: 'Marc', Capacity: 100},
        {VenueId: 2, VenueName: 'Marc', Capacity: 200},
        {VenueId: 3, VenueName: 'Marc', Capacity: 300},
        {VenueId: 4, VenueName: 'Marc', Capacity: 400},
      ]);
      console.log(`Inserted data into the table ${table.name}`);

      const query = {
        columns: ['VenueId', 'VenueName', 'Capacity'],
        keySet: {
          all: true,
        },
      };

      console.log(`Reading rows in the table ${table.name}`);

      const [rows] = await venuesTable.read(query);

      rows.forEach(row => {
        const json = row.toJSON();
        console.log(
          `VenueId: ${json.VenueId}, VenueName: ${json.VenueName}, Capacity: ${json.Capacity}`,
        );
      });

      console.log(`deleting table ${table.name}`);
      await table.delete();
    } catch (e) {
      assert.ifError(e);
    }
  }

  describe('set universe with spanner client option', () => {
    it('should set universeDomain option', async () => {
      const universeDomain = UNIVERSE_DOMAIN_CONSTANT;
      const options = {
        projectId,
        universeDomain,
      };
      const spanner = new Spanner(options);
      const instanceId = 'test-instance';
      const databaseId = 'test-database';

      try {
        await runTest(spanner, instanceId, databaseId);
      } catch (e) {
        assert.ifError(e);
      }
    });

    it('should set universe_domain option', async () => {
      const universe_domain = UNIVERSE_DOMAIN_CONSTANT;
      const options = {
        projectId,
        universe_domain,
      };
      const spanner = new Spanner(options);
      const instanceId = 'test-instance';
      const databaseId = 'test-database';

      try {
        await runTest(spanner, instanceId, databaseId);
      } catch (e) {
        assert.ifError(e);
      }
    });
  });

  describe('set universe with GOOGLE_CLOUD_UNIVERSE_DOMAIN env', () => {
    it('Should set GOOGLE_CLOUD_UNIVERSE_DOMAIN environment variable', async () => {
      process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN = UNIVERSE_DOMAIN_CONSTANT;
      const spanner = new Spanner({projectId});
      const instanceId = 'test-instance';
      const databaseId = 'test-database';
      try {
        await runTest(spanner, instanceId, databaseId);
      } catch (e) {
        assert.ifError(e);
      }
      delete process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN;
    });
  });
});
