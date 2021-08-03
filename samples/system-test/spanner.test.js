// Copyright 2017 Google LLC
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
const {describe, it, before, after, afterEach} = require('mocha');
const cp = require('child_process');
const pLimit = require('p-limit');

const execSync = cmd => cp.execSync(cmd, {encoding: 'utf-8'});

const batchCmd = 'node batch.js';
const crudCmd = 'node crud.js';
const schemaCmd = 'node schema.js';
const queryOptionsCmd = 'node queryoptions.js';
const rpcPriorityCommand = 'node rpc-priority.js';
const transactionCmd = 'node transaction.js';
const transactionTagCommand = 'node transaction-tag.js';
const requestTagCommand = 'node request-tag.js';
const timestampCmd = 'node timestamp.js';
const structCmd = 'node struct.js';
const dmlCmd = 'node dml.js';
const datatypesCmd = 'node datatypes.js';
const backupsCmd = 'node backups.js';
const instanceCmd = 'node instance.js';

const CURRENT_TIME = Math.round(Date.now() / 1000).toString();
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const PREFIX = 'test-instance';
const INSTANCE_ID =
  process.env.SPANNERTEST_INSTANCE || `${PREFIX}-${CURRENT_TIME}`;
const SAMPLE_INSTANCE_ID = `${PREFIX}-my-sample-instance-${CURRENT_TIME}`;
const INSTANCE_ALREADY_EXISTS = !!process.env.SPANNERTEST_INSTANCE;
const DATABASE_ID = `test-database-${CURRENT_TIME}`;
const RESTORE_DATABASE_ID = `test-database-${CURRENT_TIME}-r`;
const ENCRYPTED_RESTORE_DATABASE_ID = `test-database-${CURRENT_TIME}-r-enc`;
const VERSION_RETENTION_DATABASE_ID = `test-database-${CURRENT_TIME}-v`;
const ENCRYPTED_DATABASE_ID = `test-database-${CURRENT_TIME}-enc`;
const BACKUP_ID = `test-backup-${CURRENT_TIME}`;
const ENCRYPTED_BACKUP_ID = `test-backup-${CURRENT_TIME}-enc`;
const CANCELLED_BACKUP_ID = `test-backup-${CURRENT_TIME}-c`;
const LOCATION_ID = 'regional-us-central1';
const KEY_LOCATION_ID = 'us-central1';
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

describe('Spanner', () => {
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
        instance.backup(CANCELLED_BACKUP_ID).delete(GAX_OPTIONS),
      ]);
      await instance.delete(GAX_OPTIONS);
    } else {
      await Promise.all([
        instance.database(DATABASE_ID).delete(),
        instance.database(RESTORE_DATABASE_ID).delete(),
        instance.database(ENCRYPTED_RESTORE_DATABASE_ID).delete(),
        instance.backup(BACKUP_ID).delete(GAX_OPTIONS),
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
      `${schemaCmd} createDatabase "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
    );
    assert.match(
      output,
      new RegExp(`Waiting for operation on ${DATABASE_ID} to complete...`)
    );
    assert.match(
      output,
      new RegExp(`Created database ${DATABASE_ID} on instance ${INSTANCE_ID}.`)
    );
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
        `${schemaCmd} createDatabaseWithEncryptionKey "${INSTANCE_ID}" "${ENCRYPTED_DATABASE_ID}" ${PROJECT_ID} "${key.name}"`
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

  describe('quickstart', () => {
    // Running the quickstart test in here since there's already a spanner
    // instance and database set up at this point.
    it('should query a table', async () => {
      const output = execSync(
        `node quickstart ${PROJECT_ID} ${INSTANCE_ID} ${DATABASE_ID}`
      );
      assert.match(output, /Query: \d+ found./);
    });
  });

  // insert_data
  it('should insert rows into an example table', async () => {
    const output = execSync(
      `${crudCmd} insert ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // delete_data
  it('should delete and then insert rows in the example tables', async () => {
    let output = execSync(
      `${crudCmd} delete ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.include(output, 'Deleted individual rows in Albums.');
    assert.include(output, '2 records deleted from Singers.');
    assert.include(output, '3 records deleted from Singers.');
    output = execSync(
      `${crudCmd} insert ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // query_data
  it('should query an example table and return matching rows', async () => {
    const output = execSync(
      `${crudCmd} query ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/);
  });

  // read_data
  it('should read an example table', async () => {
    const output = execSync(
      `${crudCmd} read ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/);
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

  // read_stale_data
  it('should read stale data from an example table', async () => {
    // read-stale-data reads data that is exactly 15 seconds old.  So, make sure
    // 15 seconds have elapsed since the update_data test.
    await new Promise(r => setTimeout(r, 16000));
    const output = execSync(
      `${crudCmd} read-stale ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk, MarketingBudget: 100000/
    );
    assert.match(
      output,
      /SingerId: 2, AlbumId: 2, AlbumTitle: Forever Hold your Peace, MarketingBudget: 500000/
    );
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

  // query_data_with_index
  it('should query an example table with an index and return matching rows', async () => {
    const output = execSync(
      `node index-query-data ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /AlbumId: 2, AlbumTitle: Go, Go, Go, MarketingBudget:/
    );
    assert.notMatch(
      output,
      /AlbumId: 1, AlbumTitle: Total Junk, MarketingBudget:/
    );
  });

  it('should respect query boundaries when querying an example table with an index', async () => {
    const output = execSync(
      `node index-query-data ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID} "Ardvark" "Zoo"`
    );
    assert.match(
      output,
      /AlbumId: 1, AlbumTitle: Total Junk, MarketingBudget:/
    );
    assert.match(
      output,
      /AlbumId: 2, AlbumTitle: Go, Go, Go, MarketingBudget:/
    );
  });

  // read_data_with_index
  it('should read an example table with an index', async () => {
    const output = execSync(
      `node index-read-data ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /AlbumId: 1, AlbumTitle: Total Junk/);
  });

  // read_data_with_storing_index
  it('should read an example table with a storing index', async () => {
    const output = execSync(
      `node index-read-data-with-storing ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /AlbumId: 1, AlbumTitle: Total Junk/);
  });

  // spanner_create_client_with_query_options
  it('should use query options from a database reference', async () => {
    const output = execSync(
      `${queryOptionsCmd} databaseWithQueryOptions ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /AlbumId: 2, AlbumTitle: Forever Hold your Peace, MarketingBudget:/
    );
  });

  // spanner_query_with_query_options
  it('should use query options on request', async () => {
    const output = execSync(
      `${queryOptionsCmd} queryWithQueryOptions ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /AlbumId: 2, AlbumTitle: Forever Hold your Peace, MarketingBudget:/
    );
  });

  // query with RPC priority
  it('should use RPC priority from request options', async () => {
    const output = execSync(
      `${rpcPriorityCommand} ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /AlbumId: 2, AlbumTitle: Forever Hold your Peace, MarketingBudget:/
    );
  });

  // read_only_transaction
  it('should read an example table using transactions', async () => {
    const output = execSync(
      `${transactionCmd} readOnly ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/);
    assert.match(output, /Successfully executed read-only transaction\./);
  });

  // read_write_transaction
  it('should read from and write to an example table using transactions', async () => {
    let output = execSync(
      `${transactionCmd} readWrite ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /The first album's marketing budget: 100000/);
    assert.match(output, /The second album's marketing budget: 500000/);
    assert.match(
      output,
      /Successfully executed read-write transaction to transfer 200000 from Album 2 to Album 1./
    );
    output = execSync(
      `${schemaCmd} queryNewColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, MarketingBudget: 300000/);
    assert.match(output, /SingerId: 2, AlbumId: 2, MarketingBudget: 300000/);
  });

  // query with request tag
  it('should execute a query with a request tag', async () => {
    const output = execSync(
        `${requestTagCommand} ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/);
  });

  // read_write_transaction with transaction tag
  it('should execute a read/write transaction with a transaction tag', async () => {
    const output = execSync(
      `${transactionTagCommand} ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Capacity of .+ updated to/);
  });

  // batch_client
  it('should create and execute query partitions', async () => {
    const output = execSync(
      `${batchCmd} create-and-execute-query-partitions ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully created \d query partitions\./);
    assert.match(output, /Successfully received \d from executed partitions\./);
  });

  // execute_partition
  it('should execute a partition', async () => {
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);
    const [transaction] = await database.createBatchTransaction();
    const identifier = JSON.stringify(transaction.identifier());

    const query = 'SELECT SingerId FROM Albums';
    const [partitions] = await transaction.createQueryPartitions(query);
    const partition = JSON.stringify(partitions[0]);

    const output = execSync(
      `${batchCmd} execute-partition ${INSTANCE_ID} ${DATABASE_ID} '${identifier}' '${partition}' ${PROJECT_ID}`
    );
    assert.match(output, /Successfully received \d from executed partition\./);
    await transaction.close();
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

  // write_data_for_struct_queries
  it('should insert rows into an example table for use with struct query examples', async () => {
    const output = execSync(
      `${structCmd} writeDataForStructQueries ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // query_with_struct_param
  it('should query an example table with a STRUCT param', async () => {
    const output = execSync(
      `${structCmd} queryDataWithStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 6/);
  });

  // query_with_array_of_struct_param
  it('should query an example table with an array of STRUCT param', async () => {
    const output = execSync(
      `${structCmd} queryWithArrayOfStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 6\nSingerId: 7\nSingerId: 8/);
  });

  // query_with_struct_field_param
  it('should query an example table with a STRUCT field param', async () => {
    const output = execSync(
      `${structCmd} queryStructField ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 6/);
  });

  // query_with_nested_struct_param
  it('should query an example table with a nested STRUCT param', async () => {
    const output = execSync(
      `${structCmd} queryNestedStructField ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /SingerId: 6, SongName: Imagination\nSingerId: 9, SongName: Imagination/
    );
  });

  // dml_standard_insert
  it('should insert rows into an example table using a DML statement', async () => {
    const output = execSync(
      `${dmlCmd} insertUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /Successfully inserted 1 record into the Singers table/
    );
  });

  // dml_standard_update
  it('should update a row in an example table using a DML statement', async () => {
    const output = execSync(
      `${dmlCmd} updateUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully updated 1 record/);
  });

  // dml_standard_delete
  it('should delete a row from an example table using a DML statement', async () => {
    const output = execSync(
      `${dmlCmd} deleteUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully deleted 1 record\./);
  });

  // dml_standard_update_with_timestamp
  it('should update the timestamp of multiple records in an example table using a DML statement', async () => {
    const output = execSync(
      `${dmlCmd} updateUsingDmlWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully updated 2 records/);
  });

  // dml_write_then_read
  it('should insert a record in an example table using a DML statement and then query the record', async () => {
    const output = execSync(
      `${dmlCmd} writeAndReadUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Timothy Campbell/);
  });

  // dml_structs
  it('should update a record in an example table using a DML statement along with a struct value', async () => {
    const output = execSync(
      `${dmlCmd} updateUsingDmlWithStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully updated 1 record/);
  });

  // dml_getting_started_insert
  it('should insert multiple records into an example table using a DML statement', async () => {
    const output = execSync(
      `${dmlCmd} writeUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /4 records inserted/);
  });

  // dml_query_with_parameter
  it('should use a parameter query to query record that was inserted using a DML statement', async () => {
    const output = execSync(
      `${dmlCmd} queryWithParameter ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 12, FirstName: Melissa, LastName: Garcia/);
  });

  // dml_getting_started_update
  it('should transfer value from one record to another using DML statements within a transaction', async () => {
    const output = execSync(
      `${dmlCmd} writeWithTransactionUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /Successfully executed read-write transaction using DML to transfer 200000 from Album 2 to Album 1/
    );
  });

  //  dml_partitioned_update
  it('should update multiple records using a partitioned DML statement', async () => {
    const output = execSync(
      `${dmlCmd} updateUsingPartitionedDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully updated 3 records/);
  });

  //  dml_partitioned_delete
  it('should delete multiple records using a partitioned DML statement', async () => {
    const output = execSync(
      `${dmlCmd} deleteUsingPartitionedDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully deleted 5 records/);
  });

  //  dml_batch_update
  it('should insert and update records using Batch DML', async () => {
    const output = execSync(
      `${dmlCmd} updateUsingBatchDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /Successfully executed 2 SQL statements using Batch DML/
    );
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
      `${backupsCmd} getBackupOperations ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Create Backup Operations:/);
    assert.match(
      output,
      new RegExp(`Backup (.+)${BACKUP_ID} (.+) is 100% complete`)
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
      `${backupsCmd} deleteBackup ${INSTANCE_ID} ${RESTORE_DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Backup deleted./);
  });

  // custom_timeout_and_retry
  it('should insert with custom timeout and retry settings', async () => {
    const output = execSync(
      `${dmlCmd} insertWithCustomTimeoutAndRetrySettings ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /record inserted./);
  });

  // get_commit_stats
  it('should update rows in Albums example table and return CommitStats', async () => {
    const output = execSync(
      `${crudCmd} getCommitStats ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, new RegExp('Updated data with (\\d+) mutations'));
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
});
