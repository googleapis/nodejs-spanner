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

const path = require(`path`);
const request = require(`request`);
const {Spanner} = require(`@google-cloud/spanner`);
const assert = require('assert');
const tools = require(`@google-cloud/nodejs-repo-tools`);

const batchCmd = `node batch.js`;
const crudCmd = `node crud.js`;
const schemaCmd = `node schema.js`;
const indexingCmd = `node indexing.js`;
const transactionCmd = `node transaction.js`;
const timestampCmd = `node timestamp.js`;
const structCmd = `node struct.js`;
const dmlCmd = `node dml.js`;

const cwd = path.join(__dirname, `..`);

const date = Date.now();
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const INSTANCE_ID = `test-instance-${date}`;
const DATABASE_ID = `test-database-${date}`;

const spanner = new Spanner({
  projectId: PROJECT_ID,
});

describe('Spanner', () => {
  before(async () => {
    tools.checkCredentials();
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);
    try {
      await instance.delete();
    } catch (err) {
      // Ignore error
    }
    try {
      await database.delete();
    } catch (err) {
      // Ignore error
    }

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
        const {operations} = await getOperations(instance.metadata.name);

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
            .map(instance.delete)
        );
      })
    );
  });

  after(async () => {
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);

    await database.delete();
    await instance.delete();
  });

  // create_database
  it(`should create an example database`, async () => {
    const results = await tools.runAsyncWithIO(
      `${schemaCmd} createDatabase "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(`Waiting for operation on ${DATABASE_ID} to complete...`).test(
        output
      ),
      true
    );
    assert.strictEqual(
      new RegExp(
        `Created database ${DATABASE_ID} on instance ${INSTANCE_ID}.`
      ).test(output),
      true
    );
  });

  // insert_data
  it(`should insert rows into an example table`, async () => {
    const results = await tools.runAsyncWithIO(
      `${crudCmd} insert ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/Inserted data\./).test(output), true);
  });

  // query_data
  it(`should query an example table and return matching rows`, async () => {
    const results = await tools.runAsyncWithIO(
      `${crudCmd} query ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/).test(
        output
      ),
      true
    );
  });

  // read_data
  it(`should read an example table`, async () => {
    const results = await tools.runAsyncWithIO(
      `${crudCmd} read ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/).test(
        output
      ),
      true
    );
  });

  // add_column
  it(`should add a column to a table`, async () => {
    const results = await tools.runAsyncWithIO(
      `${schemaCmd} addColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Waiting for operation to complete\.\.\./).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(/Added the MarketingBudget column\./).test(output),
      true
    );
  });

  // update_data
  it(`should update existing rows in an example table`, async () => {
    const results = await tools.runAsyncWithIO(
      `${crudCmd} update ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/Updated data\./).test(output), true);
  });

  // read_stale_data
  it(`should read stale data from an example table`, async () => {
    // read-stale-data reads data that is exactly 15 seconds old.  So, make sure
    // 15 seconds have elapsed since the update_data test.
    await new Promise(r => setTimeout(r, 16000));
    const results = await tools.runAsyncWithIO(
      `${crudCmd} read-stale ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(
        /SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk, MarketingBudget: 100000/
      ).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(
        /SingerId: 2, AlbumId: 2, AlbumTitle: Forever Hold your Peace, MarketingBudget: 500000/
      ).test(output),
      true
    );
  });

  // query_data_with_new_column
  it(`should query an example table with an additional column and return matching rows`, async () => {
    const results = await tools.runAsyncWithIO(
      `${schemaCmd} queryNewColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/SingerId: 1, AlbumId: 1, MarketingBudget: 100000/).test(
        output
      ),
      true
    );
    assert.strictEqual(
      new RegExp(/SingerId: 2, AlbumId: 2, MarketingBudget: 500000/).test(
        output
      ),
      true
    );
  });

  // create_index
  it(`should create an index in an example table`, async () => {
    const results = await tools.runAsyncWithIO(
      `${indexingCmd} createIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Waiting for operation to complete\.\.\./).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(/Added the AlbumsByAlbumTitle index\./).test(output),
      true
    );
  });

  // create_storing_index
  it(`should create a storing index in an example table`, async () => {
    const results = await tools.runAsyncWithIO(
      `${indexingCmd} createStoringIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Waiting for operation to complete\.\.\./).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(/Added the AlbumsByAlbumTitle2 index\./).test(output),
      true
    );
  });

  // query_data_with_index
  it(`should query an example table with an index and return matching rows`, async () => {
    const results = await tools.runAsyncWithIO(
      `${indexingCmd} queryIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/AlbumId: 2, AlbumTitle: Go, Go, Go, MarketingBudget:/).test(
        output
      ),
      true
    );
    assert.deepStrictEqual(
      output.includes(`AlbumId: 1, AlbumTitle: Total Junk, MarketingBudget:`),
      false
    );
  });

  it(`should respect query boundaries when querying an example table with an index`, async () => {
    const results = await tools.runAsyncWithIO(
      `${indexingCmd} queryIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID} -s Ardvark -e Zoo`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/AlbumId: 1, AlbumTitle: Total Junk, MarketingBudget:/).test(
        output
      ),
      true
    );
    assert.strictEqual(
      new RegExp(/AlbumId: 2, AlbumTitle: Go, Go, Go, MarketingBudget:/).test(
        output
      ),
      true
    );
  });

  // read_data_with_index
  it(`should read an example table with an index`, async () => {
    const results = await tools.runAsyncWithIO(
      `${indexingCmd} readIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/AlbumId: 1, AlbumTitle: Total Junk/).test(output),
      true
    );
  });

  // read_data_with_storing_index
  it(`should read an example table with a storing index`, async () => {
    const results = await tools.runAsyncWithIO(
      `${indexingCmd} readStoringIndex ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/AlbumId: 1, AlbumTitle: Total Junk/).test(output),
      true
    );
  });

  // read_only_transaction
  it(`should read an example table using transactions`, async () => {
    const results = await tools.runAsyncWithIO(
      `${transactionCmd} readOnly ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/SingerId: 1, AlbumId: 1, AlbumTitle: Total Junk/).test(
        output
      ),
      true
    );
    assert.strictEqual(
      new RegExp(/Successfully executed read-only transaction\./).test(output),
      true
    );
  });

  // read_write_transaction
  it(`should read from and write to an example table using transactions`, async () => {
    let results = await tools.runAsyncWithIO(
      `${transactionCmd} readWrite ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    let output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/The first album's marketing budget: 100000/).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(/The second album's marketing budget: 500000/).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(
        /Successfully executed read-write transaction to transfer 200000 from Album 2 to Album 1./
      ).test(output),
      true
    );
    results = await tools.runAsyncWithIO(
      `${schemaCmd} queryNewColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );

    output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/SingerId: 1, AlbumId: 1, MarketingBudget: 300000/).test(
        output
      ),
      true
    );
    assert.strictEqual(
      new RegExp(/SingerId: 2, AlbumId: 2, MarketingBudget: 300000/).test(
        output
      ),
      true
    );
  });

  // create_query_partitions
  it(`should create query partitions`, async () => {
    const instance = spanner.instance(INSTANCE_ID);
    const database = instance.database(DATABASE_ID);
    const [transaction] = await database.createBatchTransaction();
    const identifier = JSON.stringify(transaction.identifier());

    const results = await tools.runAsyncWithIO(
      `${batchCmd} create-query-partitions ${INSTANCE_ID} ${DATABASE_ID} '${identifier}' ${PROJECT_ID}`,
      cwd
    );

    const output = results.stdout + results.stderr;

    assert.strictEqual(
      new RegExp(/Successfully created \d query partitions\./).test(output),
      true
    );

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

    const results = await tools.runAsyncWithIO(
      `${batchCmd} execute-partition ${INSTANCE_ID} ${DATABASE_ID} '${identifier}' '${partition}' ${PROJECT_ID}`,
      cwd
    );

    const output = results.stdout + results.stderr;

    assert.strictEqual(
      new RegExp(/Successfully received \d from executed partition\./).test(
        output
      ),
      true
    );

    await transaction.close();
  });

  // add_timestamp_column
  it(`should add a timestamp column to a table`, async () => {
    const results = await tools.runAsyncWithIO(
      `${timestampCmd} addTimestampColumn ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Waiting for operation to complete\.\.\./).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(
        /Added LastUpdateTime as a commit timestamp column in Albums table\./
      ).test(output),
      true
    );
  });

  // update_data_with_timestamp_column
  it(`should update existing rows in an example table with commit timestamp column`, async () => {
    const results = await tools.runAsyncWithIO(
      `${timestampCmd} updateWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/Updated data\./).test(output), true);
  });

  // query_data_with_timestamp_column
  it(`should query an example table with an additional timestamp column and return matching rows`, async () => {
    const results = await tools.runAsyncWithIO(
      `${timestampCmd} queryWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(
        /SingerId: 1, AlbumId: 1, MarketingBudget: 1000000, LastUpdateTime:/
      ).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(
        /SingerId: 2, AlbumId: 2, MarketingBudget: 750000, LastUpdateTime:/
      ).test(output),
      true
    );
  });

  // create_table_with_timestamp_column
  it(`should create an example table with a timestamp column`, async () => {
    const results = await tools.runAsyncWithIO(
      `${timestampCmd} createTableWithTimestamp "${INSTANCE_ID}" "${DATABASE_ID}" ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(`Waiting for operation on ${DATABASE_ID} to complete...`).test(
        output
      ),
      true
    );
    assert.strictEqual(
      new RegExp(`Created table Performances in database ${DATABASE_ID}.`).test(
        output
      ),
      true
    );
  });

  // insert_data_with_timestamp
  it(`should insert rows into an example table with timestamp column`, async () => {
    const results = await tools.runAsyncWithIO(
      `${timestampCmd} insertWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/Inserted data\./).test(output), true);
  });

  // query_new_table_with_timestamp
  it(`should query an example table with a non-null timestamp column and return matching rows`, async () => {
    const results = await tools.runAsyncWithIO(
      `${timestampCmd} queryTableWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/SingerId: 1, VenueId: 4, EventDate:/).test(output),
      true
    );
    assert.strictEqual(
      new RegExp(/Revenue: 15000, LastUpdateTime:/).test(output),
      true
    );
  });

  // write_data_for_struct_queries
  it(`should insert rows into an example table for use with struct query examples`, async () => {
    const results = await tools.runAsyncWithIO(
      `${structCmd} writeDataForStructQueries ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/Inserted data\./).test(output), true);
  });

  // query_with_struct_param
  it(`should query an example table with a STRUCT param`, async () => {
    const results = await tools.runAsyncWithIO(
      `${structCmd} queryDataWithStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/SingerId: 6/).test(output), true);
  });

  // query_with_array_of_struct_param
  it(`should query an example table with an array of STRUCT param`, async () => {
    const results = await tools.runAsyncWithIO(
      `${structCmd} queryWithArrayOfStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/SingerId: 6\nSingerId: 7/).test(output),
      true
    );
  });

  // query_with_struct_field_param
  it(`should query an example table with a STRUCT field param`, async () => {
    const results = await tools.runAsyncWithIO(
      `${structCmd} queryStructField ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/SingerId: 6/).test(output), true);
  });

  // query_with_nested_struct_param
  it(`should query an example table with a nested STRUCT param`, async () => {
    const results = await tools.runAsyncWithIO(
      `${structCmd} queryNestedStructField ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(
        /SingerId: 6, SongName: Imagination\nSingerId: 9, SongName: Imagination/
      ).test(output),
      true
    );
  });

  // dml_standard_insert
  it(`should insert rows into an example table using a DML statement`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} insertUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Successfully inserted 1 record into the Singers table/).test(
        output
      ),
      true
    );
  });

  // dml_standard_update
  it(`should update a row in an example table using a DML statement`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} updateUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Successfully updated 1 record/).test(output),
      true
    );
  });

  // dml_standard_delete
  it(`should delete a row from an example table using a DML statement`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} deleteUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Successfully deleted 1 record\./).test(output),
      true
    );
  });

  // dml_standard_update_with_timestamp
  it(`should update the timestamp of multiple records in an example table using a DML statement`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} updateUsingDmlWithTimestamp ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Successfully updated 2 records/).test(output),
      true
    );
  });

  // dml_write_then_read
  it(`should insert a record in an example table using a DML statement and then query the record`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} writeAndReadUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/Timothy Campbell/).test(output), true);
  });

  // dml_structs
  it(`should update a record in an example table using a DML statement along with a struct value`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} updateUsingDmlWithStruct ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Successfully updated 1 record/).test(output),
      true
    );
  });

  // dml_getting_started_insert
  it(`should insert multiple records into an example table using a DML statement`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} writeUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(new RegExp(/4 records inserted/).test(output), true);
  });

  // dml_getting_started_update
  it(`should transfer value from one record to another using DML statements within a transaction`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} writeWithTransactionUsingDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(
        /Successfully executed read-write transaction using DML to transfer 200000 from Album 1 to Album 2/
      ).test(output),
      true
    );
  });

  //  dml_partitioned_update
  it(`should update multiple records using a partitioned DML statement`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} updateUsingPartitionedDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Successfully updated 3 records/).test(output),
      true
    );
  });

  //  dml_partitioned_delete
  it(`should delete multiple records using a partitioned DML statement`, async () => {
    const results = await tools.runAsyncWithIO(
      `${dmlCmd} deleteUsingPartitionedDml ${INSTANCE_ID} ${DATABASE_ID} ${PROJECT_ID}`,
      cwd
    );
    const output = results.stdout + results.stderr;
    assert.strictEqual(
      new RegExp(/Successfully deleted 5 records/).test(output),
      true
    );
  });
});

function apiRequest(reqOpts) {
  return new Promise((resolve, reject) => {
    spanner.auth
      .authorizeRequest(reqOpts)
      .then(reqOpts => {
        request(reqOpts, (err, response) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(JSON.parse(response.body));
        });
      })
      .catch(reject);
  });
}

function getOperations(instanceName) {
  return apiRequest({
    uri: `https://spanner.googleapis.com/v1/${instanceName}/operations`,
  });
}
