/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the `License`);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an `AS IS` BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const {Spanner} = require(`@google-cloud/spanner`);
const {assert} = require('chai');
const cp = require('child_process');

const execSync = cmd => cp.execSync(cmd, {encoding: 'utf-8'});

const batchCmd = `node batch.js`;
const crudCmd = `node crud.js`;
const schemaCmd = `node schema.js`;
const indexingCmd = `node indexing.js`;
const transactionCmd = `node transaction.js`;
const timestampCmd = `node timestamp.js`;
const structCmd = `node struct.js`;
const dmlCmd = `node dml.js`;
const datatypesCmd = `node datatypes.js`;
const backupsCmd = `node backups.js`;

const date = Date.now();
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const INSTANCE_ID = process.env.SPANNERTEST_INSTANCE || `test-instance-${date}`;
const INSTANCE_ALREADY_EXISTS = !!process.env.SPANNERTEST_INSTANCE;
const DATABASE_ID = `test-database-${date}`;
const RESTORE_DATABASE_ID = `test-database-${date}-r`;
const BACKUP_ID = `test-backup-${date}`;

const spanner = new Spanner({
  projectId: PROJECT_ID,
  apiEndpoint: process.env.API_ENDPOINT
});

describe('Spanner', () => {
  before(async () => {
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);

    if (!INSTANCE_ALREADY_EXISTS) {
      try {
        await instance.delete();
      } catch (err) {
        // Ignore error
      }
    }
    try {
      await database.delete();
    } catch (err) {
      // Ignore error
    }

    if (!INSTANCE_ALREADY_EXISTS) {
      const [, operation] = await instance.create({
        config: 'regional-us-central1',
        nodes: 1,
        labels: {
          'gcloud-sample-tests': 'true',
        },
      });

      await operation.promise();

      const [instances] = await spanner.getInstances({
        filter: 'labels.gcloud-sample-tests:true',
      });

      await Promise.all(
        instances.map(async instance => {
          const instanceName = instance.metadata.name;
          const res = await spanner.auth.request({
            url: `https://spanner.googleapis.com/v1/${instanceName}/operations`,
          });
          const operations = res.data.operations;
          await Promise.all(
            operations
              .filter(operation => {
                return operation.metadata['@type'].includes('CreateInstance');
              })
              .filter(operation => {
                const yesterday = new Date();
                yesterday.setHours(-24);
                const instanceCreated = new Date(operation.metadata.startTime);
                return instanceCreated < yesterday;
              })
              .map(() => instance.delete())
          );
        })
      );
    }
  });

  after(async () => {
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);
    await database.delete();

    if (!INSTANCE_ALREADY_EXISTS) {
      await instance.delete();
    }
  });

  /*
  // create_database
  it(`should create an example database`, async () => {
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
  it(`should insert rows into an example table`, async () => {
    const output = execSync(
      `${crudCmd} insert ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // delete_data
  it(`should delete and then insert rows in the example tables`, async () => {
    let output = execSync(
      `${crudCmd} delete ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Deleted data\./);
    output = execSync(
      `${crudCmd} insert ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // query_data
  it(`should query an example table and return matching rows`, async () => {
    const output = execSync(
      `${crudCmd} query ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/);
  });

  // read_data
  it(`should read an example table`, async () => {
    const output = execSync(
      `${crudCmd} read ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/);
  });

  // add_column
  it(`should add a column to a table`, async () => {
    const output = execSync(
      `${schemaCmd} addColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Waiting for operation to complete\.\.\./);
    assert.match(output, /Added the MarketingBudget column\./);
  });

  // update_data
  it(`should update existing rows in an example table`, async () => {
    const output = execSync(
      `${crudCmd} update ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Updated data\./);
  });

  // read_stale_data
  it(`should read stale data from an example table`, async () => {
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
  it(`should query an example table with an additional column and return matching rows`, async () => {
    const output = execSync(
      `${schemaCmd} queryNewColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, MarketingBudget: 100000/);
    assert.match(output, /SingerId: 2, AlbumId: 2, MarketingBudget: 500000/);
  });

  // create_index
  it(`should create an index in an example table`, async () => {
    const output = execSync(
      `${indexingCmd} createIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Waiting for operation to complete\.\.\./);
    assert.match(output, /Added the AlbumsByAlbumTitle index\./);
  });

  // create_storing_index
  it(`should create a storing index in an example table`, async () => {
    const output = execSync(
      `${indexingCmd} createStoringIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Waiting for operation to complete\.\.\./);
    assert.match(output, /Added the AlbumsByAlbumTitle2 index\./);
  });

  // query_data_with_index
  it(`should query an example table with an index and return matching rows`, async () => {
    const output = execSync(
      `${indexingCmd} queryIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
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

  it(`should respect query boundaries when querying an example table with an index`, async () => {
    const output = execSync(
      `${indexingCmd} queryIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID} -s Ardvark -e Zoo`
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
  it(`should read an example table with an index`, async () => {
    const output = execSync(
      `${indexingCmd} readIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /AlbumId: 1, AlbumTitle: Total Junk/);
  });

  // read_data_with_storing_index
  it(`should read an example table with a storing index`, async () => {
    const output = execSync(
      `${indexingCmd} readStoringIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /AlbumId: 1, AlbumTitle: Total Junk/);
  });

  // read_only_transaction
  it(`should read an example table using transactions`, async () => {
    const output = execSync(
      `${transactionCmd} readOnly ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/);
    assert.match(output, /Successfully executed read-only transaction\./);
  });

  // read_write_transaction
  it(`should read from and write to an example table using transactions`, async () => {
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

  // create_query_partitions
  it(`should create query partitions`, async () => {
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);
    const [transaction] = await database.createBatchTransaction();
    const identifier = JSON.stringify(transaction.identifier());

    const output = execSync(
      `${batchCmd} create-query-partitions ${INSTANCE_ID} ${DATABASE_ID} '${identifier}' ${PROJECT_ID}`
    );
    assert.match(output, /Successfully created \d query partitions\./);
    await transaction.close();
  });

  // execute_partition
  it(`should execute a partition`, async () => {
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);
    const [transaction] = await database.createBatchTransaction();
    const identifier = JSON.stringify(transaction.identifier());

    const query = `SELECT SingerId FROM Albums`;
    const [partitions] = await transaction.createQueryPartitions(query);
    const partition = JSON.stringify(partitions[0]);

    const output = execSync(
      `${batchCmd} execute-partition ${INSTANCE_ID} ${DATABASE_ID} '${identifier}' '${partition}' ${PROJECT_ID}`
    );
    assert.match(output, /Successfully received \d from executed partition\./);
    await transaction.close();
  });

  // add_timestamp_column
  it(`should add a timestamp column to a table`, async () => {
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
  it(`should update existing rows in an example table with commit timestamp column`, async () => {
    const output = execSync(
      `${timestampCmd} updateWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Updated data\./);
  });

  // query_data_with_timestamp_column
  it(`should query an example table with an additional timestamp column and return matching rows`, async () => {
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
  it(`should create an example table with a timestamp column`, async () => {
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
  it(`should insert rows into an example table with timestamp column`, async () => {
    const output = execSync(
      `${timestampCmd} insertWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // query_new_table_with_timestamp
  it(`should query an example table with a non-null timestamp column and return matching rows`, async () => {
    const output = execSync(
      `${timestampCmd} queryTableWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 1, VenueId: 4, EventDate:/);
    assert.match(output, /Revenue: 15000, LastUpdateTime:/);
  });

  // write_data_for_struct_queries
  it(`should insert rows into an example table for use with struct query examples`, async () => {
    const output = execSync(
      `${structCmd} writeDataForStructQueries ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data\./);
  });

  // query_with_struct_param
  it(`should query an example table with a STRUCT param`, async () => {
    const output = execSync(
      `${structCmd} queryDataWithStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 6/);
  });

  // query_with_array_of_struct_param
  it(`should query an example table with an array of STRUCT param`, async () => {
    const output = execSync(
      `${structCmd} queryWithArrayOfStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 8\nSingerId: 7\nSingerId: 6/);
  });

  // query_with_struct_field_param
  it(`should query an example table with a STRUCT field param`, async () => {
    const output = execSync(
      `${structCmd} queryStructField ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 6/);
  });

  // query_with_nested_struct_param
  it(`should query an example table with a nested STRUCT param`, async () => {
    const output = execSync(
      `${structCmd} queryNestedStructField ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /SingerId: 6, SongName: Imagination\nSingerId: 9, SongName: Imagination/
    );
  });

  // dml_standard_insert
  it(`should insert rows into an example table using a DML statement`, async () => {
    const output = execSync(
      `${dmlCmd} insertUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /Successfully inserted 1 record into the Singers table/
    );
  });

  // dml_standard_update
  it(`should update a row in an example table using a DML statement`, async () => {
    const output = execSync(
      `${dmlCmd} updateUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully updated 1 record/);
  });

  // dml_standard_delete
  it(`should delete a row from an example table using a DML statement`, async () => {
    const output = execSync(
      `${dmlCmd} deleteUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully deleted 1 record\./);
  });

  // dml_standard_update_with_timestamp
  it(`should update the timestamp of multiple records in an example table using a DML statement`, async () => {
    const output = execSync(
      `${dmlCmd} updateUsingDmlWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully updated 2 records/);
  });

  // dml_write_then_read
  it(`should insert a record in an example table using a DML statement and then query the record`, async () => {
    const output = execSync(
      `${dmlCmd} writeAndReadUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Timothy Campbell/);
  });

  // dml_structs
  it(`should update a record in an example table using a DML statement along with a struct value`, async () => {
    const output = execSync(
      `${dmlCmd} updateUsingDmlWithStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully updated 1 record/);
  });

  // dml_getting_started_insert
  it(`should insert multiple records into an example table using a DML statement`, async () => {
    const output = execSync(
      `${dmlCmd} writeUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /4 records inserted/);
  });

  // dml_query_with_parameter
  it(`should use a parameter query to query record that was inserted using a DML statement`, async () => {
    const output = execSync(
      `${dmlCmd} queryWithParameter ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /SingerId: 12, FirstName: Melissa, LastName: Garcia/);
  });

  // dml_getting_started_update
  it(`should transfer value from one record to another using DML statements within a transaction`, async () => {
    const output = execSync(
      `${dmlCmd} writeWithTransactionUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /Successfully executed read-write transaction using DML to transfer 200000 from Album 2 to Album 1/
    );
  });

  //  dml_partitioned_update
  it(`should update multiple records using a partitioned DML statement`, async () => {
    const output = execSync(
      `${dmlCmd} updateUsingPartitionedDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully updated 3 records/);
  });

  //  dml_partitioned_delete
  it(`should delete multiple records using a partitioned DML statement`, async () => {
    const output = execSync(
      `${dmlCmd} deleteUsingPartitionedDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Successfully deleted 5 records/);
  });

  //  dml_batch_update
  it(`should insert and update records using Batch DML`, async () => {
    const output = execSync(
      `${dmlCmd} updateUsingBatchDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /Successfully executed 2 SQL statements using Batch DML/
    );
  });

  // create_table_with_datatypes
  it(`should create Venues example table with supported datatype columns`, async () => {
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
  it(`should insert multiple records into Venues example table`, async () => {
    const output = execSync(
      `${datatypesCmd} insertData ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Inserted data./);
  });

  // query_with_array_parameter
  it(`should use an ARRAY query parameter to query record from the Venues example table`, async () => {
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
  it(`should use a BOOL query parameter to query record from the Venues example table`, async () => {
    const output = execSync(
      `${datatypesCmd} queryWithBool ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(
      output,
      /VenueId: 19, VenueName: Venue 19, OutdoorVenue: true/
    );
  });

  // query_with_bytes_parameter
  it(`should use a BYTES query parameter to query record from the Venues example table`, async () => {
    const output = execSync(
      `${datatypesCmd} queryWithBytes ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 4, VenueName: Venue 4/);
  });

  // query_with_date_parameter
  it(`should use a DATE query parameter to query record from the Venues example table`, async () => {
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
  it(`should use a FLOAT64 query parameter to query record from the Venues example table`, async () => {
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
  it(`should use a INT64 query parameter to query record from the Venues example table`, async () => {
    const output = execSync(
      `${datatypesCmd} queryWithInt ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 19, VenueName: Venue 19, Capacity: 6300/);
    assert.match(output, /VenueId: 42, VenueName: Venue 42, Capacity: 3000/);
  });

  // query_with_string_parameter
  it(`should use a STRING query parameter to query record from the Venues example table`, async () => {
    const output = execSync(
      `${datatypesCmd} queryWithString ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 42, VenueName: Venue 42/);
  });

  // query_with_timestamp_parameter
  it(`should use a TIMESTAMP query parameter to query record from the Venues example table`, async () => {
    const output = execSync(
      `${datatypesCmd} queryWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`
    );
    assert.match(output, /VenueId: 4, VenueName: Venue 4, LastUpdateTime:/);
    assert.match(output, /VenueId: 19, VenueName: Venue 19, LastUpdateTime:/);
    assert.match(output, /VenueId: 42, VenueName: Venue 42, LastUpdateTime:/);
  });

   */

  // create_database
  it(`should create an example database`, async () => {
    const output = execSync(
        `${backupsCmd} createDatabase "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`
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

  // create_backup
  it(`should create a backup of the database`, async () => {
    const output = execSync(
        `${backupsCmd} createBackup ${INSTANCE_ID} ${DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Backup created./);
  });

  // update_backup_expire_time
  it(`should update the expire time of a backup`, async () => {
    const output = execSync(
        `${backupsCmd} updateBackupExpireTime ${INSTANCE_ID} ${DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Expire time updated./);
  });

  // restore_backup
  it(`should restore database from a backup`, async () => {
    const output = execSync(
        `${backupsCmd} restoreBackup ${INSTANCE_ID} ${RESTORE_DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
    );
    assert.match(output, /Database restored from backup./);
  });

  // delete_backup
  it(`should delete a backup`, async () => {
      const output = execSync(
          `${backupsCmd} deleteBackup ${INSTANCE_ID} ${RESTORE_DATABASE_ID} ${BACKUP_ID} ${PROJECT_ID}`
      );
      assert.match(output, /Backup deleted./);
  });
});
