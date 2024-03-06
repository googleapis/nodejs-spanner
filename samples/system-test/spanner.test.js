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
const pLimit = require('p-limit');
const {describe, it, before, after, afterEach} = require('mocha');
const {KeyManagementServiceClient} = require('@google-cloud/kms');
const {assert} = require('chai');
const cp = require('child_process');

const execSync = cmd => cp.execSync(cmd, {encoding: 'utf-8'});
const instanceCmd = 'node instance.js';
const schemaCmd = 'node schema.js';
const backupsCmd = 'node backups.js';
const crudCmd = 'node crud.js';
const datatypesCmd = 'node datatypes.js';
const timestampCmd = 'node timestamp.js';
const createTableWithForeignKeyDeleteCascadeCommand =
  'node table-create-with-foreign-key-delete-cascade.js';
const alterTableWithForeignKeyDeleteCascadeCommand =
  'node table-alter-with-foreign-key-delete-cascade.js';
const dropForeignKeyConstraintDeleteCascaseCommand =
  'node table-drop-foreign-key-constraint-delete-cascade.js';

const CURRENT_TIME = Math.round(Date.now() / 1000).toString();
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const PREFIX = 'test-instance';
const SAMPLE_INSTANCE_ID = `${PREFIX}-my-sample-instance-${CURRENT_TIME}`;
const INSTANCE_ID =
  process.env.SPANNERTEST_INSTANCE || `${PREFIX}-${CURRENT_TIME}`;
const SAMPLE_INSTANCE_CONFIG_ID = `custom-my-sample-instance-config-${CURRENT_TIME}`;
const INSTANCE_ALREADY_EXISTS = !!process.env.SPANNERTEST_INSTANCE;
const BASE_INSTANCE_CONFIG_ID = 'regional-us-central1';
const DATABASE_ID = `test-database-${CURRENT_TIME}`;
const ENCRYPTED_DATABASE_ID = `test-database-${CURRENT_TIME}-enc`;
const DEFAULT_LEADER_DATABASE_ID = `test-database-${CURRENT_TIME}-dl`;
const VERSION_RETENTION_DATABASE_ID = `test-database-${CURRENT_TIME}-v`;
const SEQUENCE_DATABASE_ID = `test-seq-database-${CURRENT_TIME}-r`;
const PG_DATABASE_ID = `test-pg-database-${CURRENT_TIME}`;
const RESTORE_DATABASE_ID = `test-database-${CURRENT_TIME}-r`;
const ENCRYPTED_RESTORE_DATABASE_ID = `test-database-${CURRENT_TIME}-r-enc`;
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
describe('Autogenerated Admin Clients', () => {
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

    // create_instance
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
        `node instance-with-autoscaling-config.js "${SAMPLE_INSTANCE_ID}" ${PROJECT_ID}`
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
  });

  // check that base instance was created
  it('should have created an instance', async () => {
    const [exists] = await instance.exists();
    assert.strictEqual(
      exists,
      true,
      'The main instance was not created successfully!'
    );
  });

  // create_database
  it('should create an example database', async () => {
    const output = execSync(
      `${schemaCmd} createDatabase "${INSTANCE_ID}" "${DATABASE_ID}" "${PROJECT_ID}"`
    );
    assert.match(
      output,
      new RegExp(`Waiting for creation of ${DATABASE_ID} to complete...`)
    );
    assert.match(
      output,
      new RegExp(`Created database ${DATABASE_ID} on instance ${INSTANCE_ID}.`)
    );
  });

  // update_database
  it('should set database metadata', async () => {
    const output = execSync(
      `node database-update.js ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(
        `Waiting for update operation for ${DATABASE_ID} to complete...`
      )
    );
    assert.match(output, new RegExp(`Updated database ${DATABASE_ID}.`));
    // cleanup
    const [operation] = await instance
      .database(DATABASE_ID)
      .setMetadata({enableDropProtection: false});
    await operation.promise();
  });

  describe('encrypted database', () => {
    after(async () => {
      const instance = spanner.instance(INSTANCE_ID);
      const encrypted_database = instance.database(ENCRYPTED_DATABASE_ID);
      await encrypted_database.delete();
    });

    // create_database_with_encryption_key
    it('should create a database with an encryption key', async () => {
      const key = await getCryptoKey();

      const output = execSync(
        `${schemaCmd} createDatabaseWithEncryptionKey "${INSTANCE_ID}" "${ENCRYPTED_DATABASE_ID}" "${PROJECT_ID}" "${key.name}"`
      );
      assert.match(
        output,
        new RegExp(
          `Waiting for operation on ${ENCRYPTED_DATABASE_ID} to complete...`
        )
      );
      assert.match(
        output,
        new RegExp(
          `Created database ${ENCRYPTED_DATABASE_ID} on instance ${INSTANCE_ID}.`
        )
      );
      assert.match(
        output,
        new RegExp(`Database encrypted with key ${key.name}.`)
      );
    });
  });

  describe('postgreSQL', () => {
    before(async () => {
      const instance = spanner.instance(SAMPLE_INSTANCE_ID);
      const [, operation] = await instance.create({
        config: PG_LOCATION_ID,
        nodes: 1,
        displayName: 'PostgreSQL Test',
        labels: {
          ['cloud_spanner_samples']: 'true',
          created: Math.round(Date.now() / 1000).toString(), // current time
        },
      });
      await operation.promise();
    });

    after(async () => {
      const instance = spanner.instance(SAMPLE_INSTANCE_ID);
      await instance.delete();
    });

    // create_pg_database
    it('should create an example PostgreSQL database', async () => {
      const output = execSync(
        `node pg-database-create.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(`Waiting for operation on ${PG_DATABASE_ID} to complete...`)
      );
      assert.match(
        output,
        new RegExp(
          `Created database ${PG_DATABASE_ID} on instance ${SAMPLE_INSTANCE_ID} with dialect POSTGRESQL.`
        )
      );
    });

    // pg_interleaving
    it('should create an interleaved table hierarchy using PostgreSQL dialect', async () => {
      const output = execSync(
        `node pg-interleaving.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(`Waiting for operation on ${PG_DATABASE_ID} to complete...`)
      );
      assert.match(
        output,
        new RegExp(
          `Created an interleaved table hierarchy in database ${PG_DATABASE_ID} using PostgreSQL dialect.`
        )
      );
    });

    // pg_add_column
    it('should add a column to a table in the Spanner PostgreSQL database.', async () => {
      const output = execSync(
        `node pg-add-column.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          `Added MarketingBudget column to Albums table in database ${PG_DATABASE_ID}`
        )
      );
    });

    //pg_create_index
    it('should create an index in the Spanner PostgreSQL database.', async () => {
      const output = execSync(
        `node pg-index-create-storing.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(output, new RegExp('Added the AlbumsByAlbumTitle index.'));
    });

    // pg_numeric_data_type
    it('should create a table, insert and query pg numeric data', async () => {
      const output = execSync(
        `node pg-numeric-data-type.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(`Waiting for operation on ${PG_DATABASE_ID} to complete...`)
      );
      assert.match(
        output,
        new RegExp(`Added table venues to database ${PG_DATABASE_ID}.`)
      );
      assert.match(output, new RegExp('Inserted data.'));
      assert.match(output, new RegExp('VenueId: 4, Revenue: 97372.3863'));
      assert.match(output, new RegExp('VenueId: 19, Revenue: 7629'));
      assert.match(output, new RegExp('VenueId: 398, Revenue: 0.000000123'));
    });

    // pg_jsonb_add_column
    it('should add a jsonb column to a table', async () => {
      const output = execSync(
        `node pg-jsonb-add-column.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(`Waiting for operation on ${PG_DATABASE_ID} to complete...`)
      );
      assert.match(
        output,
        new RegExp(
          `Added jsonb column to table venues to database ${PG_DATABASE_ID}.`
        )
      );
    });

    // pg_create_sequence
    it('should create a sequence', async () => {
      const output = execSync(
        `node pg-sequence-create.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp('Created Seq sequence and Customers table')
      );
      assert.match(
        output,
        new RegExp('Number of customer records inserted is: 3')
      );
    });

    // pg_alter_sequence
    it('should alter a sequence', async () => {
      const output = execSync(
        `node pg-sequence-alter.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          'Altered Seq sequence to skip an inclusive range between 1000 and 5000000.'
        )
      );
      assert.match(
        output,
        new RegExp('Number of customer records inserted is: 3')
      );
    });

    // pg_drop_sequence
    it('should drop a sequence', async () => {
      const output = execSync(
        `node pg-sequence-drop.js ${SAMPLE_INSTANCE_ID} ${PG_DATABASE_ID} ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          'Altered Customers table to drop DEFAULT from CustomerId column and dropped the Seq sequence.'
        )
      );
    });
  });

  // insert_data
  it('should insert rows into an example table', async () => {
    const output = execSync(
      `${crudCmd} insert ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // add_column
  it('should add a column to a table', async () => {
    const output = execSync(
      `${schemaCmd} addColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Waiting for operation to complete\.\.\./);
    assert.match(output, /Added the MarketingBudget column\./);
  });

  // update_data
  it('should update existing rows in an example table', async () => {
    const output = execSync(
      `${crudCmd} update ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Updated data\./);
  });

  // query_data_with_new_column
  it('should query an example table with an additional column and return matching rows', async () => {
    const output = execSync(
      `${schemaCmd} queryNewColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, MarketingBudget: 100000/);
    assert.match(output, /SingerId: 2, AlbumId: 2, MarketingBudget: 500000/);
  });

  // create_index
  it('should create an index in an example table', async () => {
    const output = execSync(
      `node index-create ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Waiting for operation to complete\.\.\./);
    assert.match(output, /Added the AlbumsByAlbumTitle index\./);
  });

  // create_storing_index
  it('should create a storing index in an example table', async function () {
    this.retries(5);
    // Delay the start of the test, if this is a retry.
    await delay(this.test);

    const output = execSync(
      `node index-create-storing ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Waiting for operation to complete\.\.\./);
    assert.match(output, /Added the AlbumsByAlbumTitle2 index\./);
  });

  // add_timestamp_column
  it('should add a timestamp column to a table', async () => {
    const output = execSync(
      `${timestampCmd} addTimestampColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Waiting for operation to complete\.\.\./);
    assert.match(
      output,
      /Added LastUpdateTime as a commit timestamp column in Albums table\./
    );
  });

  // update_data_with_timestamp_column
  it('should update existing rows in an example table with commit timestamp column', async () => {
    const output = execSync(
      `${timestampCmd} updateWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Updated data\./);
  });

  // query_data_with_timestamp_column
  it('should query an example table with an additional timestamp column and return matching rows', async () => {
    const output = execSync(
      `${timestampCmd} queryWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /SingerId: 1, AlbumId: 1, MarketingBudget: 1000000, LastUpdateTime:/
    );
    assert.match(
      output,
      /SingerId: 2, AlbumId: 2, MarketingBudget: 750000, LastUpdateTime:/
    );
  });

  // create_table_with_timestamp_column
  it('should create an example table with a timestamp column', async () => {
    const output = execSync(
      `${timestampCmd} createTableWithTimestamp "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
    );

    assert.match(
      output,
      new RegExp(`Waiting for operation on ${DATABASE_ID} to complete...`)
    );
    assert.match(
      output,
      new RegExp(`Created table Performances in database ${DATABASE_ID}.`)
    );
  });

  // insert_data_with_timestamp
  it('should insert rows into an example table with timestamp column', async () => {
    const output = execSync(
      `${timestampCmd} insertWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // query_new_table_with_timestamp
  it('should query an example table with a non-null timestamp column and return matching rows', async () => {
    const output = execSync(
      `${timestampCmd} queryTableWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, VenueId: 4, EventDate:/);
    assert.match(output, /Revenue: 15000, LastUpdateTime:/);
  });

  // create_table_with_datatypes
  it('should create Venues example table with supported datatype columns', async () => {
    const output = execSync(
      `${datatypesCmd} createVenuesTable "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
    );

    assert.match(
      output,
      new RegExp(`Waiting for operation on ${DATABASE_ID} to complete...`)
    );
    assert.match(
      output,
      new RegExp(`Created table Venues in database ${DATABASE_ID}.`)
    );
  });

  // insert_datatypes_data
  it('should insert multiple records into Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} insertData ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data./);
  });

  // query_with_array_parameter
  it('should use an ARRAY query parameter to query record from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithArray ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /VenueId: 19, VenueName: Venue 19, AvailableDate: 2020-11-01/
    );
    assert.match(
      output,
      /VenueId: 42, VenueName: Venue 42, AvailableDate: 2020-10-01/
    );
  });

  // query_with_bool_parameter
  it('should use a BOOL query parameter to query record from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithBool ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /VenueId: 19, VenueName: Venue 19, OutdoorVenue: true/
    );
  });

  // query_with_bytes_parameter
  it('should use a BYTES query parameter to query record from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithBytes ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 4, VenueName: Venue 4/);
  });

  // query_with_date_parameter
  it('should use a DATE query parameter to query record from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithDate ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /VenueId: 4, VenueName: Venue 4, LastContactDate: 2018-09-02/
    );
    assert.match(
      output,
      /VenueId: 42, VenueName: Venue 42, LastContactDate: 2018-10-01/
    );
  });

  // query_with_float_parameter
  it('should use a FLOAT64 query parameter to query record from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithFloat ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /VenueId: 4, VenueName: Venue 4, PopularityScore: 0.8/
    );
    assert.match(
      output,
      /VenueId: 19, VenueName: Venue 19, PopularityScore: 0.9/
    );
  });

  // query_with_int_parameter
  it('should use a INT64 query parameter to query record from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithInt ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 19, VenueName: Venue 19, Capacity: 6300/);
    assert.match(output, /VenueId: 42, VenueName: Venue 42, Capacity: 3000/);
  });

  // query_with_string_parameter
  it('should use a STRING query parameter to query record from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithString ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 42, VenueName: Venue 42/);
  });

  // query_with_timestamp_parameter
  it('should use a TIMESTAMP query parameter to query record from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 4, VenueName: Venue 4, LastUpdateTime:/);
    assert.match(output, /VenueId: 19, VenueName: Venue 19, LastUpdateTime:/);
    assert.match(output, /VenueId: 42, VenueName: Venue 42, LastUpdateTime:/);
  });

  // add_numeric_column
  it('should add a Revenue column to Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} addNumericColumn "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
    );

    assert.include(
      output,
      `Waiting for operation on ${DATABASE_ID} to complete...`
    );
    assert.include(
      output,
      `Added Revenue column to Venues table in database ${DATABASE_ID}.`
    );
  });

  // update_data_with_numeric
  it('should update rows in Venues example table to add data in Revenue column', async () => {
    const output = execSync(
      `${datatypesCmd} updateWithNumericData ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Updated data./);
  });

  // query_with_numeric_parameter
  it('should use a NUMERIC query parameter to query records from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithNumericParameter ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 4, Revenue: 35000/);
  });

  // add_json_column
  it('should add a VenueDetails column to Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} addJsonColumn "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
    );

    assert.include(
      output,
      `Waiting for operation on ${DATABASE_ID} to complete...`
    );
    assert.include(
      output,
      `Added VenueDetails column to Venues table in database ${DATABASE_ID}.`
    );
  });

  // update_data_with_json
  it('should update rows in Venues example table to add data in VenueDetails column', async () => {
    const output = execSync(
      `${datatypesCmd} updateWithJsonData ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Updated data./);
  });

  // query_with_json_parameter
  it('should use a JSON query parameter to query records from the Venues example table', async () => {
    const output = execSync(
      `${datatypesCmd} queryWithJsonParameter ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 19, Details: {"open":true,"rating":9}/);
  });

  // add_and_drop_new_database_role
  it('should add and drop new database roles', async () => {
    const output = execSync(
      `node add-and-drop-new-database-role.js ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, new RegExp('Waiting for operation to complete...'));
    assert.match(
      output,
      new RegExp('Created roles child and parent and granted privileges')
    );
    assert.match(
      output,
      new RegExp('Revoked privileges and dropped role child')
    );
  });

  // get_database_roles
  it('should list database roles', async () => {
    const output = execSync(
      `node get-database-roles.js ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(
        `Role: projects/${PROJECT_ID}/instances/${INSTANCE_ID}/databases/${DATABASE_ID}/databaseRoles/public`
      )
    );
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
      `node backups-copy.js ${INSTANCE_ID} ${COPY_BACKUP_ID} ${sourceBackupPath} ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(`(.*)Backup copy(.*)${COPY_BACKUP_ID} of size(.*)`)
    );
  });

  // cancel_backup
  it('should cancel a backup of the database', async () => {
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
    assert.equal(count, 14);
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
      `${backupsCmd} deleteBackup ${INSTANCE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Backup deleted./);
  });

  // create_database_with_version_retention_period
  it('should create a database with a version retention period', async () => {
    const output = execSync(
      `${schemaCmd} createDatabaseWithVersionRetentionPeriod "${INSTANCE_ID}" "${VERSION_RETENTION_DATABASE_ID}" ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(
        `Waiting for operation on ${VERSION_RETENTION_DATABASE_ID} to complete...`
      )
    );
    assert.match(
      output,
      new RegExp(
        `Created database ${VERSION_RETENTION_DATABASE_ID} with version retention period.`
      )
    );
    assert.include(output, 'Version retention period: 1d');
    assert.include(output, 'Earliest version time:');
  });

  it('should create a table with foreign key delete cascade', async () => {
    const output = execSync(
      `${createTableWithForeignKeyDeleteCascadeCommand} "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(`Waiting for operation on ${DATABASE_ID} to complete...`)
    );
    assert.match(
      output,
      new RegExp(
        'Created Customers and ShoppingCarts table with FKShoppingCartsCustomerId'
      )
    );
  });

  it('should alter a table with foreign key delete cascade', async () => {
    const output = execSync(
      `${alterTableWithForeignKeyDeleteCascadeCommand} "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(`Waiting for operation on ${DATABASE_ID} to complete...`)
    );
    assert.match(
      output,
      new RegExp('Altered ShoppingCarts table with FKShoppingCartsCustomerName')
    );
  });

  it('should drop a foreign key constraint delete cascade', async () => {
    const output = execSync(
      `${dropForeignKeyConstraintDeleteCascaseCommand} "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(`Waiting for operation on ${DATABASE_ID} to complete...`)
    );
    assert.match(
      output,
      new RegExp(
        'Altered ShoppingCarts table to drop FKShoppingCartsCustomerName'
      )
    );
  });

  describe('sequence', () => {
    before(async () => {
      const instance = spanner.instance(INSTANCE_ID);
      const database = instance.database(SEQUENCE_DATABASE_ID);
      const [, operation_seq] = await database.create();
      await operation_seq.promise();
    });

    after(async () => {
      await spanner
        .instance(INSTANCE_ID)
        .database(SEQUENCE_DATABASE_ID)
        .delete();
    });

    // create_sequence
    it('should create a sequence', async () => {
      const output = execSync(
        `node sequence-create.js "${INSTANCE_ID}" "${SEQUENCE_DATABASE_ID}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp('Created Seq sequence and Customers table')
      );
      assert.match(
        output,
        new RegExp('Number of customer records inserted is: 3')
      );
    });

    // alter_sequence
    it('should alter a sequence', async () => {
      const output = execSync(
        `node sequence-alter.js "${INSTANCE_ID}" "${SEQUENCE_DATABASE_ID}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          'Altered Seq sequence to skip an inclusive range between 1000 and 5000000.'
        )
      );
      assert.match(
        output,
        new RegExp('Number of customer records inserted is: 3')
      );
    });

    // drop_sequence
    it('should drop a sequence', async () => {
      const output = execSync(
        `node sequence-drop.js "${INSTANCE_ID}" "${SEQUENCE_DATABASE_ID}" ${PROJECT_ID}`
      );
      assert.match(
        output,
        new RegExp(
          'Altered Customers table to drop DEFAULT from CustomerId column and dropped the Seq sequence.'
        )
      );
    });
  });

  describe('leader options', () => {
    before(async () => {
      const instance = spanner.instance(SAMPLE_INSTANCE_ID);
      const [, operation] = await instance.create({
        config: 'nam6',
        nodes: 1,
        displayName: 'Multi-region options test',
        labels: {
          ['cloud_spanner_samples']: 'true',
          created: Math.round(Date.now() / 1000).toString(), // current time
        },
      });
      await operation.promise();
    });

    after(async () => {
      const instance = spanner.instance(SAMPLE_INSTANCE_ID);
      await instance.delete();
    });

    // create_instance_config
    it('should create an example custom instance config', async () => {
      const output = execSync(
        `node instance-config-create.js ${SAMPLE_INSTANCE_CONFIG_ID} ${BASE_INSTANCE_CONFIG_ID} ${PROJECT_ID}`
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
});
