/*!
 * Copyright 2016 Google Inc. All Rights Reserved.
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

import {DateStruct, PreciseDate} from '@google-cloud/precise-date';
import * as assert from 'assert';
import {describe, it, before, after, beforeEach} from 'mocha';
import pLimit from 'p-limit';
import concat = require('concat-stream');
import * as crypto from 'crypto';
import * as extend from 'extend';
import * as is from 'is';
import * as uuid from 'uuid';
import {Backup, Database, Spanner, Instance} from '../src';
import {Key} from '../src/table';
import {
  ReadRequest,
  ExecuteSqlRequest,
  TimestampBounds,
} from '../src/transaction';
import {Row} from '../src/partial-result-stream';
import {GetDatabaseConfig} from '../src/database';
import {grpc, CallOptions} from 'google-gax';
import {google} from '../protos/protos';
import CreateDatabaseMetadata = google.spanner.admin.database.v1.CreateDatabaseMetadata;
import CreateBackupMetadata = google.spanner.admin.database.v1.CreateBackupMetadata;

const PREFIX = 'gcloud-tests-';
const RUN_ID = shortUUID();
const LABEL = `node-spanner-systests-${RUN_ID}`;
const spanner = new Spanner({
  projectId: process.env.GCLOUD_PROJECT,
  apiEndpoint: process.env.API_ENDPOINT,
});
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

const CURRENT_TIME = Math.round(Date.now() / 1000).toString();

describe('Spanner', () => {
  const envInstanceName = process.env.SPANNERTEST_INSTANCE;
  // True if a new instance has been created for this test run, false if reusing an existing instance
  const generateInstanceForTest = !envInstanceName;
  const instance = envInstanceName
    ? spanner.instance(envInstanceName)
    : spanner.instance(generateName('instance'));

  const INSTANCE_CONFIG = {
    config: 'regional-us-central1',
    nodes: 1,
    labels: {
      [LABEL]: 'true',
      created: CURRENT_TIME,
    },
  };
  const IS_EMULATOR_ENABLED =
    typeof process.env.SPANNER_EMULATOR_HOST !== 'undefined';
  const RESOURCES_TO_CLEAN: Array<Instance | Backup | Database> = [];
  const DATABASE = instance.database(generateName('database'), {incStep: 1});
  const TABLE_NAME = 'Singers';

  before(async () => {
    await deleteOldTestInstances();
    if (generateInstanceForTest) {
      const [, operation] = await instance.create(INSTANCE_CONFIG);
      await operation.promise();
      RESOURCES_TO_CLEAN.push(instance);
    } else {
      console.log(
        `Not creating temp instance, using + ${instance.formattedName_}...`
      );
    }
    const [, operation] = await DATABASE.create({
      schema: `
          CREATE TABLE ${TABLE_NAME} (
            SingerId STRING(1024) NOT NULL,
            Name STRING(1024),
          ) PRIMARY KEY(SingerId)`,
    });
    await operation.promise();
    RESOURCES_TO_CLEAN.push(DATABASE);
  });

  after(async () => {
    if (generateInstanceForTest) {
      // Deleting all backups before an instance can be deleted.
      await Promise.all(
        RESOURCES_TO_CLEAN.filter(
          resource => resource instanceof Backup
        ).map(backup => backup.delete(GAX_OPTIONS))
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
  });

  describe('types', () => {
    const TABLE_NAME = 'TypeCheck';
    const table = DATABASE.table(TABLE_NAME);

    function insert(insertData, callback) {
      const id = generateName('id');

      insertData.Key = id;

      table.insert(insertData, (err, insertResp) => {
        if (err) {
          callback(err);
          return;
        }

        DATABASE.run(
          {
            sql: 'SELECT * FROM `' + table.name + '` WHERE Key = @id',
            params: {
              id,
            },
          },
          (err, rows, readResp) => {
            if (err) {
              callback(err);
              return;
            }

            callback(null, rows.shift(), insertResp, readResp);
          }
        );
      });
    }

    before(done => {
      DATABASE.updateSchema(
        `
            CREATE TABLE ${TABLE_NAME} (
              Key STRING(MAX) NOT NULL,
              BytesValue BYTES(MAX),
              BoolValue BOOL,
              DateValue DATE,
              FloatValue FLOAT64,
              IntValue INT64,
              StringValue STRING(MAX),
              TimestampValue TIMESTAMP,
              BytesArray ARRAY<BYTES(MAX)>,
              BoolArray ARRAY<BOOL>,
              DateArray ARRAY<DATE>,
              FloatArray ARRAY<FLOAT64>,
              IntArray ARRAY<INT64>,
              StringArray ARRAY<STRING(MAX)>,
              TimestampArray ARRAY<TIMESTAMP>,
              CommitTimestamp TIMESTAMP OPTIONS (allow_commit_timestamp=true)
            ) PRIMARY KEY (Key)
          `,
        execAfterOperationComplete(done)
      );
    });

    describe('uneven rows', () => {
      it('should allow differently-ordered rows', done => {
        const data = [
          {
            Key: generateName('id'),
            BoolValue: true,
            IntValue: 10,
          },
          {
            Key: generateName('id'),
            IntValue: 10,
            BoolValue: true,
          },
        ];

        table.insert(data, err => {
          assert.ifError(err);

          DATABASE.run(
            {
              sql: `SELECT * FROM \`${table.name}\` WHERE Key = @a OR KEY = @b`,
              params: {
                a: data[0].Key,
                b: data[1].Key,
              },
            },
            (err, rows) => {
              assert.ifError(err);

              const row1 = rows![0].toJSON();
              assert.deepStrictEqual(row1.IntValue, data[0].IntValue);
              assert.deepStrictEqual(row1.BoolValue, data[0].BoolValue);

              const row2 = rows![1].toJSON();
              assert.deepStrictEqual(row2.IntValue, data[1].IntValue);
              assert.deepStrictEqual(row2.BoolValue, data[1].BoolValue);

              done();
            }
          );
        });
      });
    });

    describe('structs', () => {
      it('should correctly decode structs', done => {
        const query = 'SELECT ARRAY(SELECT as struct 1, "hello")';

        DATABASE.run(query, (err, rows) => {
          assert.ifError(err);

          const expected = [
            {
              name: '',
              value: [
                [
                  {
                    name: '',
                    value: {
                      value: '1',
                    },
                  },
                  {
                    name: '',
                    value: 'hello',
                  },
                ],
              ],
            },
          ];

          assert.deepStrictEqual(
            JSON.stringify(rows![0][0].value[0][0]),
            JSON.stringify(expected[0].value[0][0])
          );
          assert.deepStrictEqual(
            JSON.stringify(rows![0][0].value[0][1]),
            JSON.stringify(expected[0].value[0][1])
          );

          done();
        });
      });

      it('should correctly decode structs', done => {
        const query =
          'SELECT 1 as id, ARRAY(select as struct 2 as id, "hello" as name)';

        DATABASE.run(query, (err, rows) => {
          assert.ifError(err);

          const expected = [
            {
              name: 'id',
              value: {
                value: '1',
              },
            },
            {
              name: '',
              value: [
                [
                  {
                    name: 'id',
                    value: {
                      value: '2',
                    },
                  },
                  {
                    name: 'name',
                    value: 'hello',
                  },
                ],
              ],
            },
          ];

          assert.deepStrictEqual(
            JSON.stringify(rows![0][0]),
            JSON.stringify(expected[0])
          );
          assert.deepStrictEqual(
            JSON.stringify(rows![0][1].value[0][0]),
            JSON.stringify(expected[1].value[0][0])
          );
          assert.deepStrictEqual(
            JSON.stringify(rows![0][1].value[0][1]),
            JSON.stringify(expected[1].value[0][1])
          );

          done();
        });
      });
    });

    describe('booleans', () => {
      it('should write boolean values', done => {
        insert({BoolValue: true}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().BoolValue, true);
          done();
        });
      });

      it('should write null boolean values', done => {
        insert({BoolValue: null}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().BoolValue, null);
          done();
        });
      });

      it('should write empty boolean array values', done => {
        insert({BoolArray: []}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BoolArray, []);
          done();
        });
      });

      it('should write null boolean array values', done => {
        insert({BoolArray: [null]}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BoolArray, [null]);
          done();
        });
      });

      it('should write boolean array values', done => {
        insert({BoolArray: [true, false]}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BoolArray, [true, false]);
          done();
        });
      });
    });

    describe('int64s', () => {
      it('should write int64 values', done => {
        insert({IntValue: Spanner.int(1234)}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntValue, 1234);
          done();
        });
      });

      it('should write null int64 values', done => {
        insert({IntValue: null}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().IntValue, null);
          done();
        });
      });

      it('should throw for of bounds integers', done => {
        const value = '9223372036854775807';

        insert({IntValue: value}, (err, row) => {
          assert.ifError(err);

          assert.throws(() => {
            row.toJSON();
          }, new RegExp('Serializing column "IntValue" encountered an error'));

          done();
        });
      });

      it('should optionally wrap out of bounds integers', done => {
        const value = '9223372036854775807';

        insert({IntValue: value}, (err, row) => {
          assert.ifError(err);
          const expected = Spanner.int(value);
          const actual = row.toJSON({wrapNumbers: true}).IntValue;
          assert.deepStrictEqual(actual, expected);
          done();
        });
      });

      it('should write empty in64 array values', done => {
        insert({IntArray: []}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntArray, []);
          done();
        });
      });

      it('should write null int64 array values', done => {
        insert({IntArray: [null]}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntArray, [null]);
          done();
        });
      });

      it('should write int64 array values', done => {
        const values = [1, 2, 3];

        insert({IntArray: values}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntArray, values);
          done();
        });
      });
    });

    describe('float64s', () => {
      it('should write float64 values', done => {
        insert({FloatValue: 8.2}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatValue, 8.2);
          done();
        });
      });

      it('should write null float64 values', done => {
        insert({FloatValue: null}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().FloatValue, null);
          done();
        });
      });

      it('should accept a Float object with an Int-like value', done => {
        insert({FloatValue: Spanner.float(8)}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatValue, 8);
          done();
        });
      });

      it('should handle Infinity', done => {
        insert({FloatValue: Infinity}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatValue, Infinity);
          done();
        });
      });

      it('should handle -Infinity', done => {
        insert({FloatValue: -Infinity}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatValue, -Infinity);
          done();
        });
      });

      it('should handle NaN', done => {
        insert({FloatValue: NaN}, (err, row) => {
          assert.ifError(err);
          assert(isNaN(row.toJSON().FloatValue));
          done();
        });
      });

      it('should write empty float64 array values', done => {
        insert({FloatArray: []}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatArray, []);
          done();
        });
      });

      it('should write null float64 array values', done => {
        insert({FloatArray: [null]}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatArray, [null]);
          done();
        });
      });

      it('should write float64 array values', done => {
        const values = [1.2, 2.3, 3.4];

        insert({FloatArray: values}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatArray, values);
          done();
        });
      });
    });

    describe('strings', () => {
      it('should write string values', done => {
        insert({StringValue: 'abc'}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().StringValue, 'abc');
          done();
        });
      });

      it('should write null string values', done => {
        insert({StringValue: null}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().StringValue, null);
          done();
        });
      });

      it('should write empty string array values', done => {
        insert({StringArray: []}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().StringArray, []);
          done();
        });
      });

      it('should write null string array values', done => {
        insert({StringArray: [null]}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().StringArray, [null]);
          done();
        });
      });

      it('should write string array values', done => {
        insert({StringArray: ['abc', 'def']}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().StringArray, ['abc', 'def']);
          done();
        });
      });
    });

    describe('bytes', () => {
      it('should write bytes values', done => {
        insert({BytesValue: Buffer.from('abc')}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesValue, Buffer.from('abc'));
          done();
        });
      });

      it('should write null bytes values', done => {
        insert({BytesValue: null}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().BytesValue, null);
          done();
        });
      });

      it('should write empty bytes array values', done => {
        insert({BytesArray: []}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesArray, []);
          done();
        });
      });

      it('should write null bytes array values', done => {
        insert({BytesArray: [null]}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesArray, [null]);
          done();
        });
      });

      it('should write bytes array values', done => {
        const values = [Buffer.from('a'), Buffer.from('b')];

        insert({BytesArray: values}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesArray, values);
          done();
        });
      });
    });

    describe('timestamps', () => {
      it('should write timestamp values', done => {
        const date = Spanner.timestamp();

        insert({TimestampValue: date}, (err, row) => {
          assert.ifError(err);
          const time = row.toJSON().TimestampValue.getTime();
          assert.strictEqual(time, date.getTime());
          done();
        });
      });

      it('should write null timestamp values', done => {
        insert({TimestampValue: null}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().TimestampValue, null);
          done();
        });
      });

      it('should write empty timestamp array values', done => {
        insert({TimestampArray: []}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().TimestampArray, []);
          done();
        });
      });

      it('should write null timestamp array values', done => {
        insert({TimestampArray: [null]}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().TimestampArray, [null]);
          done();
        });
      });

      it('should write timestamp array values', done => {
        const values = [Spanner.timestamp(), Spanner.timestamp('3-3-1933')];

        insert({TimestampArray: values}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().TimestampArray, values);
          done();
        });
      });
    });

    describe('dates', () => {
      it('should write date values', done => {
        const date = Spanner.date();

        insert({DateValue: date}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(Spanner.date(row.toJSON().DateValue), date);
          done();
        });
      });

      it('should write null date values', done => {
        insert({DateValue: null}, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().DateValue, null);
          done();
        });
      });

      it('should write empty date array values', done => {
        insert({DateArray: []}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().DateArray, []);
          done();
        });
      });

      it('should write null date array values', done => {
        insert({DateArray: [null]}, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().DateArray, [null]);
          done();
        });
      });

      it('should write date array values', done => {
        const values = [Spanner.date(), Spanner.date('3-3-1933')];

        insert({DateArray: values}, (err, row) => {
          assert.ifError(err);
          const {DateArray} = row.toJSON();
          assert.deepStrictEqual(DateArray, values);
          done();
        });
      });
    });

    describe('commit timestamp', () => {
      it('should accept the commit timestamp placeholder', done => {
        const data = {CommitTimestamp: Spanner.COMMIT_TIMESTAMP};

        insert(data, (err, row, {commitTimestamp}) => {
          assert.ifError(err);

          const timestampFromCommit = Spanner.timestamp(commitTimestamp);
          const timestampFromRead = row.toJSON().CommitTimestamp;

          assert.deepStrictEqual(timestampFromCommit, timestampFromRead);
          done();
        });
      });
    });

    it('should throw an error for incorrect value types', done => {
      table.insert({BoolValue: 'abc'}, err => {
        assert(err);
        done();
      });
    });
  });

  describe('Instances', () => {
    it('should have created the instance', done => {
      instance.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual(metadata!.name, instance.formattedName_);
        done();
      });
    });

    it('should respect the FieldMask', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const fieldNames = ['name', 'displayName'];

      const [metadata] = await instance.getMetadata({fieldNames});
      assert.deepStrictEqual(metadata['endpointUris'], []);
      assert.deepStrictEqual(metadata['labels'], {});
      assert.strictEqual(metadata.name, instance.formattedName_);
      assert.ok(!metadata['config']);
      assert.ok(metadata['displayName']);
      assert.strictEqual(metadata['nodeCount'], 0);
      assert.strictEqual(metadata['state'], 'STATE_UNSPECIFIED');
    });

    it('should auto create an instance', done => {
      const instance = spanner.instance(generateName('instance'));

      const config = extend(
        {
          autoCreate: true,
        },
        INSTANCE_CONFIG
      );

      instance.get(config, err => {
        assert.ifError(err);
        RESOURCES_TO_CLEAN.push(instance);
        instance.getMetadata(done);
      });
    });

    it('should list the instances', done => {
      spanner.getInstances((err, instances) => {
        assert.ifError(err);
        assert(instances!.length > 0);
        done();
      });
    });

    it('should list the instances in promise mode', done => {
      spanner
        .getInstances()
        .then(data => {
          const instances = data[0];
          assert(instances.length > 0);
          done();
        })
        .catch(done);
    });

    it('should list the instances in stream mode', done => {
      spanner
        .getInstancesStream()
        .on('error', done)
        .pipe(
          concat(instances => {
            assert(instances.length > 0);
            done();
          })
        );
    });

    it('should update the metadata', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const newData = {
        displayName: 'new-display-name-' + shortUUID(),
      };

      instance.setMetadata(
        newData,
        execAfterOperationComplete(err => {
          assert.ifError(err);

          instance.getMetadata((err, metadata) => {
            assert.ifError(err);
            assert.strictEqual(metadata!.displayName, newData.displayName);
            done();
          });
        })
      );
    });

    it('should return true for instances that exist', done => {
      instance.exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, true);
        done();
      });
    });

    it('should return false for instances that do not exist', done => {
      spanner.instance('bad-instance').exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, false);
        done();
      });
    });
  });

  describe('instanceConfigs', () => {
    it('should list the available instanceConfigs', done => {
      spanner.getInstanceConfigs((err, instanceConfigs) => {
        assert.ifError(err);
        assert(instanceConfigs!.length > 0);
        done();
      });
    });

    it('should list the instanceConfigs in promise mode', done => {
      spanner
        .getInstanceConfigs()
        .then(data => {
          const instanceConfigs = data[0];
          assert(instanceConfigs.length > 0);
          done();
        })
        .catch(done);
    });

    it('should list the instanceConfigs in stream mode', done => {
      spanner
        .getInstanceConfigsStream()
        .on('error', done)
        .pipe(
          concat(instanceConfigs => {
            assert(instanceConfigs.length > 0);
            done();
          })
        );
    });
  });

  describe('Databases', () => {
    const TABLE_NAME = 'SingersTest';
    it('should auto create a database', done => {
      const database = instance.database(generateName('database'));

      database.get({autoCreate: true} as GetDatabaseConfig, err => {
        assert.ifError(err);
        RESOURCES_TO_CLEAN.push(database);
        database.getMetadata(done);
      });
    });

    it('should have created the database', done => {
      DATABASE.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual(metadata!.name, DATABASE.formattedName_);
        assert.strictEqual(metadata!.state, 'READY');
        done();
      });
    });

    it('should list the databases from an instance', done => {
      instance.getDatabases((err, databases) => {
        assert.ifError(err);
        assert(databases!.length > 0);
        done();
      });
    });

    it('should list the databases in promise mode', done => {
      instance
        .getDatabases()
        .then(data => {
          const databases = data[0];
          assert(databases.length > 0);
          done();
        })
        .catch(done);
    });

    it('should list the databases in stream mode', done => {
      instance
        .getDatabasesStream()
        .on('error', done)
        .pipe(
          concat(databases => {
            assert(databases.length > 0);
            done();
          })
        );
    });

    it('should return true for databases that exist', done => {
      DATABASE.exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, true);
        done();
      });
    });

    it('should return false for databases that do not exist', done => {
      instance.database('bad-database').exists((err, exists) => {
        assert.ifError(err);
        assert.strictEqual(exists, false);
        done();
      });
    });

    it('should create a table', done => {
      const createTableStatement = `
        CREATE TABLE ${TABLE_NAME} (
          SingerId INT64 NOT NULL,
          FirstName STRING(1024),
          LastName STRING(1024),
          SingerInfo BYTES(MAX),
        ) PRIMARY KEY(SingerId)`;

      DATABASE.updateSchema(
        [createTableStatement],
        execAfterOperationComplete(err => {
          assert.ifError(err);

          function replaceNewLinesAndSpacing(str) {
            return str.replace(/\n\s*/g, '').replace(/\s+/g, ' ');
          }

          DATABASE.getSchema((err, statements) => {
            assert.ifError(err);
            assert.ok(
              statements!.some(
                s =>
                  replaceNewLinesAndSpacing(s) ===
                  replaceNewLinesAndSpacing(createTableStatement)
              )
            );
            done();
          });
        })
      );
    });

    it('should list database operations on an instance', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      // Look up the database full name from the metadata to expand any {{projectId}} tokens.
      const [databaseMetadata] = await DATABASE.getMetadata();
      const databaseFullName = databaseMetadata.name;

      // List operations and ensure operation for creation of test database exists.
      const [databaseCreateOperations] = await instance.getDatabaseOperations({
        filter: `(metadata.@type:type.googleapis.com/google.spanner.admin.database.v1.CreateDatabaseMetadata) AND
                 (metadata.database:${DATABASE.formattedName_})`,
      });

      // Validate operation and its metadata.
      assert.strictEqual(databaseCreateOperations.length, 1);
      const databaseCreateOperation = databaseCreateOperations[0];
      assert.strictEqual(
        databaseCreateOperation.metadata!.type_url,
        'type.googleapis.com/google.spanner.admin.database.v1.CreateDatabaseMetadata'
      );
      const createMeta = CreateDatabaseMetadata.decode(
        databaseCreateOperation.metadata!.value! as Uint8Array
      );
      assert.strictEqual(createMeta.database, databaseFullName);
    });

    it('should list database operations on a database', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      // Look up the database full name from the metadata to expand any {{projectId}} tokens.
      const [databaseMetadata] = await DATABASE.getMetadata();
      const databaseFullName = databaseMetadata.name;

      // List operations.
      const [databaseOperations] = await DATABASE.getOperations();

      // Validate operation has at least the create operation for the database.
      assert.ok(databaseOperations.length > 0);
      const databaseCreateOperation = databaseOperations.find(
        op =>
          op.metadata!.type_url ===
          'type.googleapis.com/google.spanner.admin.database.v1.CreateDatabaseMetadata'
      );
      const createMeta = CreateDatabaseMetadata.decode(
        databaseCreateOperation!.metadata!.value! as Uint8Array
      );
      assert.strictEqual(createMeta.database, databaseFullName);
    });
  });

  describe('Backups', () => {
    let database1: Database;
    let database2: Database;
    let restoreDatabase: Database;

    let backup1: Backup;
    let backup2: Backup;

    const backup1Name = generateName('backup');
    const backup2Name = generateName('backup');
    const backupExpiryDate = futureDateByHours(12);
    const backupExpiryPreciseDate = Spanner.timestamp(backupExpiryDate);

    before(async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      database1 = DATABASE;

      await database1.table(TABLE_NAME).insert({
        SingerId: generateName('id'),
        Name: generateName('name'),
      });

      // Create a second database since only one pending backup can be created
      // per database.
      database2 = instance.database(generateName('database'));
      const [, database2CreateOperation] = await database2.create({
        schema: `
        CREATE TABLE Albums (
          AlbumId STRING(1024) NOT NULL,
          AlbumTitle STRING(1024) NOT NULL,
          ) PRIMARY KEY(AlbumId)`,
        gaxOptions: GAX_OPTIONS,
      });
      await database2CreateOperation.promise();
      RESOURCES_TO_CLEAN.push(database2);

      // Initialize a database instance to restore to.
      restoreDatabase = instance.database(generateName('database'));

      // Create backups.
      backup1 = instance.backup(backup1Name);
      backup2 = instance.backup(backup2Name);
      const [, backup1Operation] = await backup1.create({
        databasePath: database1.formattedName_,
        expireTime: backupExpiryDate,
        gaxOptions: GAX_OPTIONS,
      });
      const [, backup2Operation] = await backup2.create({
        databasePath: database2.formattedName_,
        expireTime: backupExpiryDate,
        gaxOptions: GAX_OPTIONS,
      });

      assert.strictEqual(
        backup1Operation.metadata!.name,
        `${instance.formattedName_}/backups/${backup1Name}`
      );
      assert.strictEqual(
        backup1Operation.metadata!.database,
        database1.formattedName_
      );

      assert.strictEqual(
        backup2Operation.metadata!.name,
        `${instance.formattedName_}/backups/${backup2Name}`
      );
      assert.strictEqual(
        backup2Operation.metadata!.database,
        database2.formattedName_
      );

      // Wait for backups to finish.
      await backup1Operation.promise();
      await backup2Operation.promise();
      RESOURCES_TO_CLEAN.push(...[backup1, backup2]);
    });

    function futureDateByHours(futureHours: number): number {
      return Date.now() + 1000 * 60 * 60 * futureHours;
    }

    it('should have completed a backup', async () => {
      // Validate backup has completed.
      const [backupInfo] = await backup1.getMetadata();
      assert.strictEqual(backupInfo.state, 'READY');
      assert.strictEqual(
        backupInfo.name,
        `${instance.formattedName_}/backups/${backup1Name}`
      );
      assert.strictEqual(backupInfo.database, database1.formattedName_);
      assert.ok(backupInfo.createTime);
      assert.deepStrictEqual(
        Number(backupInfo.expireTime!.seconds),
        backupExpiryPreciseDate.toStruct().seconds
      );
      assert.ok(backupInfo.sizeBytes! > 0);

      // Validate additional metadata functions on backup.
      const backupState = await backup1.getState();
      assert.strictEqual(backupState, 'READY');
      const expireTime = await backup1.getExpireTime();
      assert.deepStrictEqual(
        expireTime!.getFullTime(),
        backupExpiryPreciseDate.getFullTime()
      );
      const exists = await backup1.exists();
      assert.strictEqual(exists, true);
    });

    it('should return error for backup expiration time in the past', async () => {
      // Create backup.
      const backupName = generateName('backup');
      const backupExpiryDate = futureDateByHours(-12);
      const backup = instance.backup(backupName);
      try {
        await backup.create({
          databasePath: database1.formattedName_,
          expireTime: backupExpiryDate,
        });
        assert.fail(
          'Backup should have failed for expiration time in the past'
        );
      } catch (err) {
        // Expect to get invalid argument error indicating the expiry date
        assert.strictEqual(err.code, grpc.status.INVALID_ARGUMENT);
      }
    });

    it('should return false for a backup that does not exist', async () => {
      // This backup won't exist, we're just generating the name without creating the backup itself.
      const backupName = generateName('backup');
      const backup = instance.backup(backupName);

      const exists = await backup.exists();
      assert.strictEqual(exists, false);
    });

    it('should list backups', async () => {
      const [backups] = await instance.getBackups();
      assert.ok(backups.length > 0);
      assert.ok(
        backups.find(backup => backup.formattedName_ === backup1.formattedName_)
      );
    });

    it('should list backups with pagination', async () => {
      const [page1, , resp1] = await instance.getBackups({
        pageSize: 1,
        gaxOptions: {autoPaginate: false},
      });
      const [page2] = await instance.getBackups({
        pageSize: 1,
        pageToken: resp1!.nextPageToken!,
        gaxOptions: {autoPaginate: false},
      });
      const [page3] = await instance.getBackups({
        pageSize: 2,
        gaxOptions: {autoPaginate: false},
      });
      assert.strictEqual(page1.length, 1);
      assert.strictEqual(page2.length, 1);
      assert.strictEqual(page3.length, 2);
      assert.notStrictEqual(page2[0].formattedName_, page1[0].formattedName_);
      assert.ok(
        page3.find(backup => backup.formattedName_ === backup1.formattedName_)
      );
      assert.ok(
        page3.find(backup => backup.formattedName_ === backup2.formattedName_)
      );
    });

    it('should restore a backup', async () => {
      // Perform restore to a different database.
      const [, restoreOperation] = await restoreDatabase.restore(
        backup1.formattedName_
      );

      // Wait for restore to complete.
      await restoreOperation.promise();
      RESOURCES_TO_CLEAN.push(restoreDatabase);

      const [databaseMetadata] = await restoreDatabase.getMetadata();
      assert.ok(
        databaseMetadata.state === 'READY' ||
          databaseMetadata.state === 'READY_OPTIMIZING'
      );

      // Validate restore state of database directly.
      const restoreState = await restoreDatabase.getState();
      assert.ok(
        restoreState === 'READY' || restoreState === 'READY_OPTIMIZING'
      );

      // Validate new database has restored data.
      const [rows] = await restoreDatabase
        .table(TABLE_NAME)
        .read({columns: ['SingerId', 'Name']});
      const results = rows.map(row => row.toJSON);
      assert.strictEqual(results.length, 1);

      // Validate restore info of database.
      const restoreInfo = await restoreDatabase.getRestoreInfo();
      assert.strictEqual(
        restoreInfo!.backupInfo!.backup,
        backup1.formattedName_
      );
      const [originalDatabaseMetadata] = await database1.getMetadata();
      assert.strictEqual(
        restoreInfo!.backupInfo!.sourceDatabase,
        originalDatabaseMetadata.name
      );
      assert.strictEqual(restoreInfo!.sourceType, 'BACKUP');

      // Check that restore operation ends up in the operations list.
      const [restoreOperations] = await restoreDatabase.getOperations({
        filter: 'metadata.@type:RestoreDatabaseMetadata',
      });
      assert.strictEqual(restoreOperations.length, 1);
    });

    it('should not be able to restore to an existing database', async () => {
      // Perform restore to the same database - should fail.
      try {
        await database1.restore(backup1.formattedName_);
        assert.fail('Should not have restored backup over existing database');
      } catch (err) {
        // Expect to get error indicating database already exists.
        assert.strictEqual(err.code, grpc.status.ALREADY_EXISTS);
      }
    });

    it('should update backup expiry', async () => {
      // Update backup expiry date.
      const updatedBackupExpiryDate = futureDateByHours(24);
      await backup1.updateExpireTime(updatedBackupExpiryDate);

      // Read metadata, verify expiry date was updated.
      const [updatedMetadata] = await backup1.getMetadata();
      const expiryDateFromMetadataAfterUpdate = new PreciseDate(
        updatedMetadata.expireTime as DateStruct
      );

      assert.deepStrictEqual(
        expiryDateFromMetadataAfterUpdate,
        Spanner.timestamp(updatedBackupExpiryDate)
      );
    });

    it('should not update backup expiry to the past', async () => {
      // Attempt to update expiry date to the past.
      const expiryDateInPast = futureDateByHours(-24);
      try {
        await backup1.updateExpireTime(expiryDateInPast);
        assert.fail(
          'Backup should have failed for expiration time in the past'
        );
      } catch (err) {
        // Expect to get invalid argument error indicating the expiry date.
        assert.strictEqual(err.code, grpc.status.INVALID_ARGUMENT);
      }
    });

    it('should delete backup', async () => {
      // Delete backup.
      await backup2.delete();

      // Verify backup is gone by querying metadata.
      // Expect backup not to be found.
      try {
        const [deletedMetadata] = await backup2.getMetadata();
        assert.fail('Backup was not deleted: ' + deletedMetadata.name);
      } catch (err) {
        assert.strictEqual(err.code, grpc.status.NOT_FOUND);
      }
    });

    it('should list backup operations', async () => {
      // List operations and ensure operation for current backup exists.
      // Without a filter.
      const [operationsWithoutFilter] = await instance.getBackupOperations();
      const operationForCurrentBackup = operationsWithoutFilter.find(
        operation =>
          operation.name && operation.name.includes(backup1.formattedName_)
      );
      assert.ok(operationForCurrentBackup);
      assert.strictEqual(
        operationForCurrentBackup!.metadata!.type_url,
        'type.googleapis.com/google.spanner.admin.database.v1.CreateBackupMetadata'
      );

      // With a filter.
      const [operationsWithFilter] = await instance.getBackupOperations({
        filter: `(metadata.@type:CreateBackupMetadata AND
                    metadata.name:${backup1.formattedName_})`,
      });
      const operationForCurrentBackupWithFilter = operationsWithFilter[0];
      assert.ok(operationForCurrentBackupWithFilter);
      assert.strictEqual(
        operationForCurrentBackupWithFilter!.metadata!.type_url,
        'type.googleapis.com/google.spanner.admin.database.v1.CreateBackupMetadata'
      );
      const operationForCurrentBackupWithFilterMetadata = CreateBackupMetadata.decode(
        operationForCurrentBackupWithFilter!.metadata!.value! as Uint8Array
      );
      assert.strictEqual(
        operationForCurrentBackupWithFilterMetadata.database,
        database1.formattedName_
      );
    });
  });

  describe('Sessions', () => {
    const session = DATABASE.session();

    before(async () => {
      await session.create();
    });

    after(done => {
      session.delete(done);
    });

    it('should have created the session', done => {
      session.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual(session.formattedName_, metadata!.name);
        done();
      });
    });

    it('should get a session by name', done => {
      const shortName = session.formattedName_!.split('/').pop();
      const sessionByShortName = DATABASE.session(shortName);

      sessionByShortName.getMetadata((err, metadataByName) => {
        assert.ifError(err);
        session.getMetadata((err, metadata) => {
          assert.ifError(err);
          assert.strictEqual(metadataByName!.name, metadata!.name);
          done();
        });
      });
    });

    it('should keep the session alive', done => {
      session.keepAlive(done);
    });

    it('should batch create sessions', async () => {
      const count = 5;
      const [sessions] = await DATABASE.batchCreateSessions({count});

      assert.strictEqual(sessions.length, count);

      await Promise.all(sessions.map(session => session.delete()));
    });
  });

  describe('Tables', () => {
    const TABLE_NAME = 'SingersTables';
    const table = DATABASE.table(TABLE_NAME);

    before(() => {
      return table
        .create(
          `
            CREATE TABLE ${TABLE_NAME} (
              SingerId STRING(1024) NOT NULL,
              Name STRING(1024),
              Float FLOAT64,
              Int INT64,
              Info BYTES(MAX),
              Created TIMESTAMP,
              DOB DATE,
              Accents ARRAY<STRING(1024)>,
              PhoneNumbers ARRAY<INT64>,
              HasGear BOOL,
            ) PRIMARY KEY(SingerId)`,
          GAX_OPTIONS
        )
        .then(onPromiseOperationComplete);
    });

    it('should throw an error for non-existant tables', done => {
      const table = DATABASE.table(generateName('nope'));

      table.insert(
        {
          SingerId: generateName('id'),
        },
        err => {
          assert.strictEqual(err!.code, 5);
          done();
        }
      );
    });

    it('should throw an error for non-existant columns', done => {
      table.insert(
        {
          SingerId: generateName('id'),
          Nope: 'abc',
        },
        err => {
          assert.strictEqual(err!.code, 5);
          done();
        }
      );
    });

    it('should read rows as a stream', done => {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        err => {
          assert.ifError(err);

          let rows: Array<{}> = [];

          table
            .createReadStream({
              keys: [id],
              columns: ['SingerId', 'name'],
            })
            .on('error', done)
            .on('data', row => {
              rows.push(row);
            })
            .on('end', () => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rows = rows.map(x => (x as any).toJSON());

              assert.deepStrictEqual(rows, [
                {
                  SingerId: id,
                  Name: name,
                },
              ]);

              done();
            });
        }
      );
    });

    it('should automatically convert to JSON', done => {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        err => {
          assert.ifError(err);

          const rows: Array<{}> = [];

          table
            .createReadStream({
              keys: [id],
              columns: ['SingerId', 'name'],
              json: true,
            })
            .on('error', done)
            .on('data', row => rows.push(row))
            .on('end', () => {
              assert.deepStrictEqual(rows, [
                {
                  SingerId: id,
                  Name: name,
                },
              ]);

              done();
            });
        }
      );
    });

    it('should automatically convert to JSON with options', done => {
      const id = generateName('id');

      table.insert(
        {
          SingerId: id,
          Int: 8,
        },
        err => {
          assert.ifError(err);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rows: any[] = [];

          table
            .createReadStream({
              keys: [id],
              columns: ['SingerId', 'Int'],
              json: true,
              jsonOptions: {wrapNumbers: true},
            })
            .on('error', done)
            .on('data', row => {
              rows.push(row);
            })
            .on('end', () => {
              assert.strictEqual(rows[0].Int.value, '8');
              done();
            });
        }
      );
    });

    it('should insert and delete a row', done => {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        err => {
          assert.ifError(err);

          table.deleteRows([id], err => {
            assert.ifError(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows: any[] = [];

            table
              .createReadStream({
                keys: [id],
                columns: ['SingerId'],
              })
              .on('error', done)
              .on('data', row => {
                rows.push(row);
              })
              .on('end', () => {
                assert.strictEqual(rows.length, 0);
                done();
              });
          });
        }
      );
    });

    it('should insert and delete multiple rows', done => {
      const id = generateName('id');
      const id2 = generateName('id2');

      const name = generateName('name');

      table.insert(
        [
          {
            SingerId: id,
            Name: name,
          },
          {
            SingerId: id2,
            Name: name,
          },
        ],
        err => {
          assert.ifError(err);

          table.deleteRows([id, id2], err => {
            assert.ifError(err);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows: any[] = [];

            table
              .createReadStream({
                keys: [id, id2],
                columns: ['SingerId'],
              })
              .on('error', done)
              .on('data', row => {
                rows.push(row);
              })
              .on('end', () => {
                assert.strictEqual(rows.length, 0);
                done();
              });
          });
        }
      );
    });

    it('should insert and delete multiple composite key rows', () => {
      const id1 = 1;
      const name1 = generateName('name1');

      const id2 = 2;
      const name2 = generateName('name2');

      const table = DATABASE.table('SingersComposite');

      const keys = ([
        [id1, name1],
        [id2, name2],
      ] as {}) as string[];

      return table
        .create(
          `
          CREATE TABLE SingersComposite (
            SingerId INT64 NOT NULL,
            Name STRING(1024),
          ) PRIMARY KEY(SingerId, Name)
          `
        )
        .then(onPromiseOperationComplete)
        .then(() => {
          return table.insert([
            {
              SingerId: id1,
              Name: name1,
            },
            {
              SingerId: id2,
              Name: name2,
            },
          ]);
        })
        .then(() => {
          return table.read({
            keys,
            columns: ['SingerId', 'Name'],
          });
        })
        .then(data => {
          const rows = data[0];

          assert.strictEqual(rows.length, 2);

          return table.deleteRows(keys as Key[]);
        })
        .then(() => {
          return table.read({
            keys,
            columns: ['SingerId', 'Name'],
          });
        })
        .then(data => {
          const rows = data[0];
          assert.strictEqual(rows.length, 0);
        });
    });

    it('should insert and query multiple rows', done => {
      const id1 = generateName('id1');
      const name1 = generateName('name');

      const id2 = generateName('id2');
      const name2 = generateName('name');

      table.insert(
        [
          {
            SingerId: id1,
            Name: name1,
          },
          {
            SingerId: id2,
            Name: name2,
          },
        ],
        err => {
          assert.ifError(err);

          DATABASE.run(
            `SELECT * FROM ${TABLE_NAME} ORDER BY SingerId`,
            (err, rows) => {
              assert.ifError(err);

              // We just want the two most recent ones.
              rows!.splice(0, rows!.length - 2);

              const rowJson = rows!.map(x => x.toJSON());

              assert.strictEqual(rowJson[0].SingerId, id1);
              assert.strictEqual(rowJson[0].Name, name1);

              assert.strictEqual(rowJson[1].SingerId, id2);
              assert.strictEqual(rowJson[1].Name, name2);

              done();
            }
          );
        }
      );
    });

    it('should insert then replace a row', done => {
      const originalRow = {
        SingerId: generateName('id'),
        Name: generateName('name'),
      };

      const replacedRow = {
        SingerId: originalRow.SingerId,
      };

      table.insert(originalRow, err => {
        assert.ifError(err);

        table.replace(replacedRow, err => {
          assert.ifError(err);

          table.read(
            {
              keys: [originalRow.SingerId],
              columns: Object.keys(originalRow),
            },
            (err, rows) => {
              assert.ifError(err);

              const row = rows![0].toJSON();

              assert.strictEqual(row.SingerId, replacedRow.SingerId);
              assert.strictEqual(row.Name, null);

              done();
            }
          );
        });
      });
    });

    it('should insert then update a row', done => {
      const originalRow = {
        SingerId: generateName('id'),
        Name: generateName('name'),
      };

      const updatedRow = {
        SingerId: originalRow.SingerId,
        Name: generateName('name'),
      };

      table.insert(originalRow, err => {
        assert.ifError(err);

        table.update(updatedRow, err => {
          assert.ifError(err);

          table.read(
            {
              keys: [originalRow.SingerId],
              columns: Object.keys(originalRow),
            },
            (err, rows) => {
              assert.ifError(err);

              const row = rows![0].toJSON();

              assert.strictEqual(row.SingerId, updatedRow.SingerId);
              assert.strictEqual(row.Name, updatedRow.Name);

              done();
            }
          );
        });
      });
    });

    describe('insert & query', () => {
      const ID = generateName('id');
      const NAME = generateName('name');
      const FLOAT = 8.2;
      const INT = 2;
      const INFO = Buffer.from(generateName('info'));
      const CREATED = Spanner.timestamp();
      const DOB = Spanner.date('1969-08-20');
      const ACCENTS = ['jamaican'];
      const PHONE_NUMBERS = [123123123, 234234234];
      const HAS_GEAR = true;

      const INSERT_ROW = {
        SingerId: ID,
        Name: NAME,
        Float: FLOAT,
        Int: INT,
        Info: INFO,
        Created: CREATED,
        DOB,
        Accents: ACCENTS,
        PhoneNumbers: PHONE_NUMBERS,
        HasGear: HAS_GEAR,
      };

      const EXPECTED_ROW = extend(true, {}, INSERT_ROW);

      before(() => {
        return table.insert(INSERT_ROW);
      });

      it('should query in callback mode', done => {
        const options = {
          strong: true,
        };

        DATABASE.run(
          {
            sql: `SELECT * FROM ${TABLE_NAME} WHERE SingerId=@id`,
            params: {id: ID},
          },
          options,
          (err, rows) => {
            assert.ifError(err);
            assert.deepStrictEqual(rows!.shift()!.toJSON(), EXPECTED_ROW);
            done();
          }
        );
      });

      it('should query in promise mode', done => {
        const options = {
          strong: true,
        };

        DATABASE.run(
          {
            sql: `SELECT * FROM ${TABLE_NAME} WHERE SingerId=@id`,
            params: {id: ID},
          },
          options
        )
          .then(data => {
            const rows = (data[0] as {}) as Row[];
            assert.deepStrictEqual(rows!.shift()!.toJSON(), EXPECTED_ROW);
            done();
          })
          .catch(done);
      });

      it('should query in stream mode', done => {
        const options = {
          strong: true,
        };
        let row;

        const stream = DATABASE.runStream(
          {
            sql: `SELECT * FROM ${TABLE_NAME} WHERE SingerId=@id`,
            params: {id: ID},
          },
          options
        )
          .on('error', done)
          .once('data', row_ => {
            row = row_;
            stream.end();
          })
          .on('end', () => {
            assert.deepStrictEqual(row.toJSON(), EXPECTED_ROW);
            done();
          });
      });

      it('should allow "SELECT 1" queries', done => {
        DATABASE.run('SELECT 1', done);
      });

      it('should fail invalid queries', done => {
        DATABASE.run('SELECT Apples AND Oranges', err => {
          assert.strictEqual(err!.code, 3);
          done();
        });
      });

      it('should query an array of structs', done => {
        const query = `
          SELECT ARRAY(SELECT AS STRUCT C1, C2
            FROM (SELECT 'a' AS C1, 1 AS C2 UNION ALL SELECT 'b' AS C1, 2 AS C2)
            ORDER BY C1 ASC)`;

        DATABASE.run(query, (err, rows) => {
          assert.ifError(err);

          const values = rows![0][0].value;
          assert.strictEqual(values.length, 2);

          assert.strictEqual(values[0][0].value, 'a');
          assert.deepStrictEqual(
            JSON.stringify(values[0][1].value),
            JSON.stringify({value: '1'})
          );

          assert.strictEqual(values[1][0].value, 'b');
          assert.deepStrictEqual(
            JSON.stringify(values[1][1].value),
            JSON.stringify({value: '2'})
          );

          done();
        });
      });

      it('should query an empty array of structs', done => {
        const query = `
          SELECT ARRAY(SELECT AS STRUCT * FROM (SELECT 'a', 1) WHERE 0 = 1)`;

        DATABASE.run(query, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows![0][0].value.length, 0);
          done();
        });
      });

      describe('params', () => {
        describe('boolean', () => {
          it('should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: true,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, true);
              done();
            });
          });

          it('should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'bool',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = [false, true, false];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'bool',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'bool',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, null);
              done();
            });
          });
        });

        describe('int64', () => {
          it('should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 1234,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, '1234');
              done();
            });
          });

          it('should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'int64',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = [1, 2, 3, null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const expected = values.map(val => {
                return is.number(val) ? {value: String(val)} : val;
              });

              assert.strictEqual(
                JSON.stringify(rows[0][0].value),
                JSON.stringify(expected)
              );
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'int64',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'int64',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, null);
              done();
            });
          });
        });

        describe('float64', () => {
          it('should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 2.2,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, 2.2);
              done();
            });
          });

          it('should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'float64',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = [null, 1.1, 2.3, 3.5, null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const expected = values.map(val => {
                return is.number(val) ? {value: val} : val;
              });

              assert.strictEqual(
                JSON.stringify(rows[0][0].value),
                JSON.stringify(expected)
              );
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'float64',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'float64',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, null);
              done();
            });
          });

          it('should bind Infinity', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: Infinity,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, 'Infinity');
              done();
            });
          });

          it('should bind -Infinity', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: -Infinity,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, '-Infinity');
              done();
            });
          });

          it('should bind NaN', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: NaN,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, 'NaN');
              done();
            });
          });

          it('should bind an array of Infinity and NaN', done => {
            const values = [Infinity, -Infinity, NaN];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const expected = values.map(val => {
                return is.number(val) ? {value: val + ''} : val;
              });

              assert.strictEqual(
                JSON.stringify(rows[0][0].value),
                JSON.stringify(expected)
              );
              done();
            });
          });
        });

        describe('string', () => {
          it('should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 'abc',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, 'abc');
              done();
            });
          });

          it('should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'string',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = ['a', 'b', 'c', null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'string',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'string',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, null);
              done();
            });
          });
        });

        describe('bytes', () => {
          it('should bind the value', done => {
            const buffer = Buffer.from('abc');

            const query = {
              sql: 'SELECT @v',
              params: {
                v: buffer,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, buffer);
              done();
            });
          });

          it('should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'bytes',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = [Buffer.from('a'), Buffer.from('b'), null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'bytes',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'bytes',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, null);
              done();
            });
          });
        });

        describe('timestamp', () => {
          it('should bind the value', done => {
            const timestamp = Spanner.timestamp();

            const query = {
              sql: 'SELECT @v',
              params: {
                v: timestamp,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, timestamp);
              done();
            });
          });

          it('should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'timestamp',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = [
              Spanner.timestamp(),
              Spanner.timestamp('3-3-1999'),
              null,
            ];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'timestamp',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'timestamp',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, null);
              done();
            });
          });
        });

        describe('date', () => {
          it('should bind the value', done => {
            const date = Spanner.date();

            const query = {
              sql: 'SELECT @v',
              params: {
                v: date,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const returnedDate = Spanner.date(rows[0][0].value);
              assert.deepStrictEqual(returnedDate, date);

              done();
            });
          });

          it('should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'date',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = [Spanner.date(), Spanner.date('3-3-1999'), null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const returnedValues = rows[0][0].value.map(val => {
                return is.null(val) ? val : Spanner.date(val);
              });

              assert.deepStrictEqual(returnedValues, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'date',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: {
                  type: 'array',
                  child: 'date',
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0][0].value, null);
              done();
            });
          });
        });

        describe('structs', () => {
          it('should bind a simple struct', done => {
            const query = {
              sql: 'SELECT @structParam.userf, @p4',
              params: {
                structParam: Spanner.struct({
                  userf: 'bob',
                  threadf: Spanner.int(1),
                }),
                p4: Spanner.int(10),
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0].toJSON();
              assert.strictEqual(row.userf, 'bob');

              done();
            });
          });

          it('should bind null structs', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @structParam.userf is NULL',
              params: {
                structParam: null,
              },
              types: {
                structParam: {
                  type: 'struct',
                  fields: [
                    {
                      name: 'userf',
                      type: 'string',
                    },
                    {
                      name: 'threadf',
                      type: 'int64',
                    },
                  ],
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows![0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should bind nested structs', done => {
            const query = {
              sql: 'SELECT @structParam.structf.nestedf',
              params: {
                structParam: Spanner.struct({
                  structf: Spanner.struct({
                    nestedf: 'bob',
                  }),
                }),
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0].toJSON();
              assert.strictEqual(row.nestedf, 'bob');

              done();
            });
          });

          it('should bind null nested structs', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @structParam.structf.nestedf',
              params: {
                structParam: null,
              },
              types: {
                structParam: {
                  type: 'struct',
                  fields: [
                    {
                      name: 'structf',
                      type: 'struct',
                      fields: [
                        {
                          name: 'nestedf',
                          type: 'string',
                        },
                      ],
                    },
                  ],
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows![0].toJSON();
              assert.strictEqual(row.nestedf, null);

              done();
            });
          });

          it('should bind empty structs', done => {
            const query = {
              sql: 'SELECT @structParam IS NULL',
              params: {
                structParam: Spanner.struct(),
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, false);

              done();
            });
          });

          it('should bind null structs with no fields', done => {
            const query = {
              sql: 'SELECT @structParam IS NULL',
              params: {
                structParam: null,
              },
              types: {
                structParam: 'struct',
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should bind structs with null fields', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT @structParam.f1',
              params: {
                structParam: Spanner.struct({
                  f1: null,
                }),
              },
              types: {
                structParam: {
                  type: 'struct',
                  fields: [
                    {
                      name: 'f1',
                      type: 'int64',
                    },
                  ],
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows![0].toJSON();
              assert.strictEqual(row.f1, null);

              done();
            });
          });

          it('should bind structs with duplicate fields', done => {
            const query = {
              sql: 'SELECT @structParam=STRUCT<f1 INT64, f1 INT64>(10, 11)',
              params: {
                structParam: Spanner.struct([
                  {
                    name: 'f1',
                    value: Spanner.int(10),
                  },
                  {
                    name: 'f1',
                    value: Spanner.int(11),
                  },
                ]),
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should bind structs with missing field names', done => {
            const query = {
              sql: 'SELECT @structParam=STRUCT<INT64>(5)',
              params: {
                structParam: Spanner.struct([{value: Spanner.int(5)}]),
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should allow equality checks', done => {
            const query = {
              sql:
                'SELECT @structParam=STRUCT<threadf INT64, userf STRING>(1, "bob")',
              params: {
                structParam: Spanner.struct({
                  threadf: Spanner.int(1),
                  userf: 'bob',
                }),
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should allow nullness checks', done => {
            const query = {
              sql: 'SELECT @structParam IS NULL',
              params: {
                structParam: Spanner.struct({
                  userf: 'bob',
                  threadf: Spanner.int(1),
                }),
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, false);

              done();
            });
          });

          it('should allow an array of non-null structs', done => {
            const query = {
              sql: 'SELECT a.threadid FROM UNNEST(@arraysf) a',
              params: {
                arraysf: [
                  Spanner.struct({
                    threadid: Spanner.int(12),
                  }),
                  Spanner.struct({
                    threadid: Spanner.int(13),
                  }),
                ],
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);

              rows = rows.map(row => row.toJSON());

              assert.strictEqual(rows.length, 2);
              assert.strictEqual(rows[0].threadid, 12);
              assert.strictEqual(rows[1].threadid, 13);

              done();
            });
          });

          it('should allow an array of structs with null fields', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT a.threadid FROM UNNEST(@structParam.arraysf) a',
              params: {
                structParam: Spanner.struct({
                  intf: Spanner.int(10),
                  arraysf: null,
                }),
              },
              types: {
                structParam: {
                  type: 'struct',
                  fields: [
                    {
                      name: 'intf',
                      type: 'int64',
                    },
                    {
                      name: 'arraysf',
                      type: 'array',
                      child: {
                        type: 'struct',
                        fields: [
                          {
                            name: 'threadid',
                            type: 'int64',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows!.length, 0);

              done();
            });
          });

          it('should allow a null array of structs', done => {
            const query: ExecuteSqlRequest = {
              sql: 'SELECT a.threadid FROM UNNEST(@structParamArray) a',
              params: {
                structParamArray: null,
              },
              types: {
                structParamArray: {
                  type: 'array',
                  child: {
                    type: 'struct',
                    fields: [
                      {
                        name: 'threadid',
                        type: 'int64',
                      },
                    ],
                  },
                },
              },
            };

            DATABASE.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows!.length, 0);
              done();
            });
          });
        });
      });

      describe('large reads', () => {
        const TABLE_NAME = 'LargeReads';
        const table = DATABASE.table(TABLE_NAME);

        const expectedRow = {
          Key: generateName('key'),
          StringValue: string(),
          StringArray: [string(), string(), string(), string()],
          BytesValue: bytes(),
          BytesArray: [bytes(), bytes(), bytes(), bytes()],
        };

        function string() {
          const offset = Math.floor(Math.random() * 500);

          return new Array(25000 + offset)
            .fill('The quick brown fox jumps over the lazy dog.')
            .join('\n');
        }

        function bytes() {
          const offset = Math.floor(Math.random() * 2048);

          return crypto.randomBytes(1024 * 1024 + offset);
        }

        function base64ToBuffer(bytes) {
          return Buffer.from(bytes, 'base64');
        }

        before(() => {
          return table
            .create(
              `
              CREATE TABLE ${TABLE_NAME} (
                Key STRING(MAX) NOT NULL,
                StringValue STRING(MAX),
                StringArray ARRAY<STRING(MAX)>,
                BytesValue BYTES(MAX),
                BytesArray ARRAY<BYTES(MAX)>
              ) PRIMARY KEY (Key)`
            )
            .then(onPromiseOperationComplete)
            .then(() => {
              return table.insert(expectedRow);
            });
        });

        it('should read large datasets', done => {
          table.read(
            {
              keys: [expectedRow.Key],
              columns: [
                'Key',
                'StringValue',
                'StringArray',
                'BytesValue',
                'BytesArray',
              ],
            },
            (err, rows) => {
              assert.ifError(err);

              const row = rows![0].toJSON();

              assert.strictEqual(row.Key, expectedRow.Key);
              assert.strictEqual(row.StringValue, expectedRow.StringValue);
              assert.deepStrictEqual(row.StringArray, expectedRow.StringArray);

              row.BytesValue = base64ToBuffer(row.BytesValue);
              row.BytesArray = row.BytesArray.map(base64ToBuffer);

              assert.deepStrictEqual(row.BytesValue, expectedRow.BytesValue);
              assert.deepStrictEqual(row.BytesArray, expectedRow.BytesArray);

              done();
            }
          );
        });

        it('should query large datasets', done => {
          const query = {
            sql: 'SELECT * FROM ' + table.name + ' WHERE Key = @key',
            params: {
              key: expectedRow.Key,
            },
          };

          DATABASE.run(query, (err, rows) => {
            assert.ifError(err);

            const row = rows[0].toJSON();

            assert.strictEqual(row.Key, expectedRow.Key);
            assert.strictEqual(row.StringValue, expectedRow.StringValue);
            assert.deepStrictEqual(row.StringArray, expectedRow.StringArray);

            row.BytesValue = base64ToBuffer(row.BytesValue);
            row.BytesArray = row.BytesArray.map(base64ToBuffer);

            assert.deepStrictEqual(row.BytesValue, expectedRow.BytesValue);
            assert.deepStrictEqual(row.BytesArray, expectedRow.BytesArray);

            done();
          });
        });
      });
    });

    describe('upsert', () => {
      const ROW = {
        SingerId: generateName('id'),
        Name: generateName('name'),
      };

      it('should update a row', done => {
        const row = {
          SingerId: ROW.SingerId,
          Name: generateName('name'),
        };

        table.insert(row, err => {
          assert.ifError(err);

          table.upsert(ROW, err => {
            assert.ifError(err);

            table.read(
              {
                keys: [ROW.SingerId],
                columns: Object.keys(ROW),
              },
              (err, rows) => {
                assert.ifError(err);
                assert.deepStrictEqual(rows![0].toJSON(), ROW);
                done();
              }
            );
          });
        });
      });

      it('should insert a row', done => {
        table.upsert(ROW, err => {
          assert.ifError(err);

          table.read(
            {
              keys: [ROW.SingerId],
              columns: Object.keys(ROW),
            },
            (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows![0].toJSON(), ROW);
              done();
            }
          );
        });
      });
    });

    describe('read', () => {
      const TABLE_NAME = 'ReadTestTable';
      const table = DATABASE.table('ReadTestTable');

      const ALL_COLUMNS = ['Key', 'StringValue'];

      before(() => {
        return table
          .create(
            `
            CREATE TABLE ${TABLE_NAME} (
              Key STRING(MAX) NOT NULL,
              StringValue STRING(MAX)
            ) PRIMARY KEY (Key)`
          )
          .then(onPromiseOperationComplete)
          .then(() => {
            return DATABASE.updateSchema(`
              CREATE INDEX ReadByValue ON ${TABLE_NAME}(StringValue)`);
          })
          .then(onPromiseOperationComplete)
          .then(() => {
            const data: Array<{}> = [];

            for (let i = 0; i < 15; ++i) {
              data.push({
                Key: 'k' + i,
                StringValue: 'v' + i,
              });
            }

            return table.insert(data);
          });
      });

      // all of these tests require testing with and without an index,
      // to cut back on duplication, the core sections of the tests have been
      // turned into configurations
      [
        {
          test: 'should perform an empty read',
          query: {
            ranges: [
              {
                startClosed: 'k99',
                endOpen: 'z',
              },
            ],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 0);
          },
        },
        {
          test: 'should read a single key',
          query: {
            keys: ['k1'],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 1);

            const row = rows[0].toJSON();

            assert.strictEqual(row.Key, 'k1');
            assert.strictEqual(row.StringValue, 'v1');
          },
        },
        {
          test: 'should read a non-existant single key',
          query: {
            keys: ['k999'],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 0);
          },
        },
        {
          test: 'should read using partial keys',
          query: {
            ranges: [
              {
                startClosed: 'k7',
                endClosed: null,
              },
            ],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);

            assert.strictEqual(rows.length, 3);

            rows = rows.map(row => {
              return row.toJSON();
            });

            assert.strictEqual(rows[0].Key, 'k7');
            assert.strictEqual(rows[1].Key, 'k8');
            assert.strictEqual(rows[2].Key, 'k9');
          },
        },
        {
          test: 'should read using an open-open range',
          query: {
            ranges: [
              {
                startOpen: 'k3',
                endOpen: 'k5',
              },
            ],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 1);

            const row = rows[0].toJSON();

            assert.strictEqual(row.Key, 'k4');
          },
        },
        {
          test: 'should read using an open-closed range',
          query: {
            ranges: [
              {
                startOpen: 'k3',
                endClosed: 'k5',
              },
            ],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 2);

            rows = rows.map(row => {
              return row.toJSON();
            });

            assert.strictEqual(rows[0].Key, 'k4');
            assert.strictEqual(rows[1].Key, 'k5');
          },
        },
        {
          test: 'should read using a closed-closed range',
          query: {
            ranges: [
              {
                startClosed: 'k3',
                endClosed: 'k5',
              },
            ],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 3);

            rows = rows.map(row => {
              return row.toJSON();
            });

            assert.strictEqual(rows[0].Key, 'k3');
            assert.strictEqual(rows[1].Key, 'k4');
            assert.strictEqual(rows[2].Key, 'k5');
          },
        },
        {
          test: 'should read using a closed-open range',
          query: {
            ranges: [
              {
                startClosed: 'k3',
                endOpen: 'k5',
              },
            ],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 2);

            rows = rows.map(row => {
              return row.toJSON();
            });

            assert.strictEqual(rows[0].Key, 'k3');
            assert.strictEqual(rows[1].Key, 'k4');
          },
        },
        {
          test: 'should accept a limit',
          query: {
            ranges: [
              {
                startClosed: 'k3',
                endClosed: 'k7',
              },
            ],
            columns: ALL_COLUMNS,
            limit: 2,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 2);
          },
        },
        {
          test: 'should ignore limits of 0',
          query: {
            ranges: [
              {
                startClosed: 'k3',
                endClosed: 'k7',
              },
            ],
            columns: ALL_COLUMNS,
            limit: 0,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 5);
          },
        },
        {
          test: 'should read using point keys',
          query: {
            keys: ['k3', 'k5', 'k7'],
            columns: ALL_COLUMNS,
          },
          assertions(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 3);

            rows = rows.map(row => {
              return row.toJSON();
            });

            assert.strictEqual(rows[0].Key, 'k3');
            assert.strictEqual(rows[1].Key, 'k5');
            assert.strictEqual(rows[2].Key, 'k7');
          },
        },
      ].forEach(test => {
        // test normally
        it(test.test, done => {
          table.read(test.query as ReadRequest, (err, rows) => {
            test.assertions(err, rows);
            done();
          });
        });

        // test using an index
        it(test.test + ' with an index', done => {
          const query = extend(
            {
              index: 'ReadByValue',
            },
            test.query
          );

          if (query.keys) {
            query.keys = query.keys.map(key => {
              return key.replace('k', 'v');
            });
          }

          if (query.ranges) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            query.ranges = (query as any).ranges.map(range_ => {
              const range = extend({}, range_);
              Object.keys(range).forEach(bound => {
                if (range[bound]) {
                  range[bound] = range[bound].replace('k', 'v');
                }
              });
              return range;
            });
          }

          table.read(query as ReadRequest, (err, rows) => {
            test.assertions(err, rows);
            done();
          });
        });
      });

      it('should read over invalid database fails', done => {
        const database = instance.database(generateName('invalid'));
        const table = database.table(TABLE_NAME);

        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
        };

        table.read(query, err => {
          assert.strictEqual(err.code, 5);
          database.close().then(() => done());
        });
      });

      it('should read over invalid table fails', done => {
        const table = DATABASE.table('ReadTestTablezzz');

        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
        };

        table.read(query, err => {
          assert.strictEqual(err.code, 5);
          done();
        });
      });

      it('should read over invalid column fails', done => {
        const query = {
          keys: ['k1'],
          columns: ['ohnoes'],
        };

        table.read(query, err => {
          assert.strictEqual(err.code, 5);
          done();
        });
      });

      it('should fail if deadline exceeds', function (done) {
        // This test case somehow causes the emulator to return a RESOURCE_EXHAUSTED
        // error for this or following gRPC calls.
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
          gaxOptions: {
            timeout: 0.1,
          },
        };

        table.read(query, err => {
          assert.strictEqual(err.code, 4);
          done();
        });
      });
    });
  });

  describe('SessionPool', () => {
    const table = DATABASE.table(TABLE_NAME);

    it('should insert and query a row', done => {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        err => {
          assert.ifError(err);

          DATABASE.run(`SELECT * FROM ${TABLE_NAME}`, (err, rows) => {
            assert.ifError(err);
            assert.ok(
              rows!.some(
                r =>
                  JSON.stringify(r.toJSON()) ===
                  JSON.stringify({SingerId: id, Name: name})
              )
            );
            done();
          });
        }
      );
    });

    it('should insert and query multiple rows', done => {
      const id1 = generateName('id1');
      const name1 = generateName('name');

      const id2 = generateName('id2');
      const name2 = generateName('name');

      table.insert(
        [
          {
            SingerId: id1,
            Name: name1,
          },
          {
            SingerId: id2,
            Name: name2,
          },
        ],
        err => {
          assert.ifError(err);

          DATABASE.run(
            `SELECT * FROM ${TABLE_NAME} ORDER BY SingerId`,
            (err, rows) => {
              assert.ifError(err);

              // We just want the two most recent ones.
              rows!.splice(0, rows!.length - 2);

              const rowJson = rows!.map(x => x.toJSON());

              assert.deepStrictEqual(rowJson, [
                {
                  SingerId: id1,
                  Name: name1,
                },
                {
                  SingerId: id2,
                  Name: name2,
                },
              ]);

              done();
            }
          );
        }
      );
    });

    it('should read rows as a stream', done => {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        err => {
          assert.ifError(err);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let rows: any[] = [];

          table
            .createReadStream({
              keys: [id],
              columns: ['SingerId', 'name'],
            })
            .on('error', done)
            .on('data', row => {
              rows.push(row);
            })
            .on('end', () => {
              rows = rows.map(x => x.toJSON());

              assert.deepStrictEqual(rows, [
                {
                  SingerId: id,
                  Name: name,
                },
              ]);

              done();
            });
        }
      );
    });

    it('should read rows', done => {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        err => {
          assert.ifError(err);

          table.read(
            {
              keys: [id],
              columns: ['SingerId', 'Name'],
            },
            (err, rows) => {
              assert.ifError(err);

              rows = rows!.map(x => x.toJSON());

              assert.deepStrictEqual(rows, [
                {
                  SingerId: id,
                  Name: name,
                },
              ]);

              done();
            }
          );
        }
      );
    });
  });

  describe('Transactions', () => {
    const TABLE_NAME = 'TxnTable';
    const table = DATABASE.table(TABLE_NAME);

    const schema = `
      CREATE TABLE ${TABLE_NAME} (
        Key STRING(MAX) NOT NULL,
        StringValue STRING(MAX),
        NumberValue INT64
      ) PRIMARY KEY (Key)
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: any[] = [];

    before(async () => {
      await onPromiseOperationComplete(await table.create(schema));

      for (let i = 0; i < 5; i++) {
        const entry = {Key: `k${i}`, StringValue: `v${i}`};

        const [{commitTimestamp}] = await table.insert(entry);
        const record = Object.assign(entry, {
          commitTimestamp,
          localTimestamp: Date.now(),
        });

        records.push(record);
        await wait(1000);
      }
    });

    describe('snapshots', () => {
      it('should run a read only transaction', done => {
        const options = {
          strong: true,
        };

        DATABASE.getSnapshot(options, (err, transaction) => {
          assert.ifError(err);

          transaction!.run(`SELECT * FROM ${TABLE_NAME}`, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            transaction!.end();
            done();
          });
        });
      });

      it('should read keys from a table', done => {
        DATABASE.getSnapshot((err, transaction) => {
          assert.ifError(err);

          const query = ({
            ranges: [
              {
                startClosed: 'k0',
                endClosed: 'k4',
              },
            ],
            columns: ['Key'],
          } as {}) as ReadRequest;

          transaction!.read(table.name, query, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows!.length, records.length);

            transaction!.end();
            done();
          });
        });
      });

      it('should accept a read timestamp', done => {
        const options = {
          readTimestamp: records[0].commitTimestamp,
        };

        DATABASE.getSnapshot(options, (err, transaction) => {
          assert.ifError(err);

          transaction!.run(`SELECT * FROM ${TABLE_NAME}`, (err, rows) => {
            assert.ifError(err);

            assert.strictEqual(rows.length, 1);

            const row = rows[0].toJSON();

            assert.strictEqual(row.Key, records[0].Key);
            assert.strictEqual(row.StringValue, records[0].StringValue);

            transaction!.end();
            done();
          });
        });
      });

      it('should accept a min timestamp', done => {
        const query = 'SELECT * FROM ' + TABLE_NAME;

        const options = {
          minReadTimestamp: new PreciseDate(),
        } as TimestampBounds;

        // minTimestamp can only be used in single use transactions
        // so we can't use database.getSnapshot here
        DATABASE.run(query, options, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows!.length, records.length);
          done();
        });
      });

      it('should accept an exact staleness', done => {
        const options = {
          exactStaleness: Date.now() - records[1].localTimestamp,
        };

        DATABASE.getSnapshot(options, (err, transaction) => {
          assert.ifError(err);

          transaction!.run(
            'SELECT * FROM ' + TABLE_NAME + ' ORDER BY Key',
            (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows.length, 2);

              const rowJson = rows.map(x => x.toJSON());

              assert.strictEqual(rowJson[0].Key, 'k0');
              assert.strictEqual(rowJson[0].StringValue, 'v0');
              assert.strictEqual(rowJson[1].Key, 'k1');
              assert.strictEqual(rowJson[1].StringValue, 'v1');

              transaction!.end();
              done();
            }
          );
        });
      });

      it('should accept a max staleness', done => {
        const query = 'SELECT * FROM TxnTable';

        const options = {
          maxStaleness: 1,
        };

        // maxStaleness can only be used in single use transactions
        // so we can't use database.getSnapshot here
        DATABASE.run(query, options, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows!.length, records.length);
          done();
        });
      });

      it('should do a strong read with concurrent updates', done => {
        const options = {
          strong: true,
        };

        DATABASE.getSnapshot(options, (err, transaction) => {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction!.run(query, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            table.update(
              {
                Key: 'k4',
                StringValue: 'v44',
              },
              err => {
                assert.ifError(err);

                transaction!.run(query, (err, rows_) => {
                  assert.ifError(err);

                  const row = rows_!.pop()!.toJSON();
                  assert.strictEqual(row.StringValue, 'v4');

                  transaction!.end();
                  done();
                });
              }
            );
          });
        });
      });

      it('should do an exact read with concurrent updates', done => {
        const options = {
          readTimestamp: records[records.length - 1].commitTimestamp,
        };

        DATABASE.getSnapshot(options, (err, transaction) => {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction!.run(query, (err, rows) => {
            assert.ifError(err);

            const originalRows = extend(true, {}, rows);

            // Make arbitrary update.
            table.update(
              {
                Key: rows[0].toJSON().Key,
                StringValue: 'overridden value',
              },
              err => {
                assert.ifError(err);

                transaction!.run(query, (err, rows_) => {
                  assert.ifError(err);

                  rows_ = extend(true, {}, rows_);

                  assert.deepStrictEqual(rows_, originalRows);

                  transaction!.end();
                  done();
                });
              }
            );
          });
        });
      });

      it('should read with staleness & concurrent updates', done => {
        const options = {
          exactStaleness: Date.now() - records[0].localTimestamp,
        };

        DATABASE.getSnapshot(options, (err, transaction) => {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction!.run(query, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, 1);

            table.update(
              {
                Key: 'k4',
                StringValue: 'overridden value',
              },
              err => {
                assert.ifError(err);

                transaction!.run(query, (err, rows) => {
                  assert.ifError(err);
                  assert.strictEqual(rows.length, 1);

                  transaction!.end();
                  done();
                });
              }
            );
          });
        });
      });
    });

    describe('dml', () => {
      before(done => {
        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.runUpdate(
            {
              sql:
                'INSERT INTO ' +
                TABLE_NAME +
                ' (Key, StringValue) VALUES(@key, @str)',
              params: {
                key: 'k999',
                str: 'abc',
              },
            },
            err => {
              assert.ifError(err);
              transaction!.commit(done);
            }
          );
        });
      });

      it('should return rowCount from runUpdate', done => {
        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.runUpdate(
            {
              sql:
                'UPDATE ' +
                TABLE_NAME +
                ' t SET t.StringValue = @str WHERE t.Key = @key',
              params: {
                key: 'k999',
                str: 'abcd',
              },
            },
            (err, rowCount) => {
              assert.ifError(err);
              assert.strictEqual(rowCount, 1);
              transaction!.rollback(done);
            }
          );
        });
      });

      it('should return rowCount from run', done => {
        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.run(
            {
              sql:
                'UPDATE ' +
                TABLE_NAME +
                ' t SET t.StringValue = @str WHERE t.Key = @key',
              params: {
                key: 'k999',
                str: 'abcd',
              },
            },
            (err, row, stats) => {
              assert.ifError(err);

              const rowCount = Math.floor(stats[stats.rowCount!] as number);
              assert.strictEqual(rowCount, 1);

              transaction!.rollback(done);
            }
          );
        });
      });

      it('should exec multiple dml statements on the same txn', done => {
        const key = 'k1000';
        const str = 'abcd';
        const num = 11;

        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!
            .runUpdate({
              sql:
                'INSERT INTO ' +
                TABLE_NAME +
                ' (Key, StringValue) VALUES (@key, @str)',
              params: {key, str},
            })
            .then(data => {
              const rowCount = data[0];
              assert.strictEqual(rowCount, 1);

              return transaction!.runUpdate({
                sql:
                  'UPDATE ' +
                  TABLE_NAME +
                  ' t SET t.NumberValue = @num WHERE t.KEY = @key',
                params: {key, num},
              });
            })
            .then(data => {
              const rowCount = data[0];
              assert.strictEqual(rowCount, 1);

              return transaction!.run({
                sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE Key = @key',
                params: {key},
              });
            })
            .then(data => {
              const rows = data[0].map(row => row.toJSON());

              assert.strictEqual(rows.length, 1);
              assert.deepStrictEqual(rows[0], {
                Key: key,
                StringValue: str,
                NumberValue: num,
              });

              return transaction!.rollback();
            })
            .then(() => done(), done);
        });
      });

      it('should show dml changes in query results', done => {
        const key = 'k999';
        const str = 'abcd';

        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!
            .runUpdate({
              sql:
                'UPDATE ' +
                TABLE_NAME +
                ' t SET t.StringValue = @str WHERE t.Key = @key',
              params: {key, str},
            })
            .then(() => {
              return transaction!.run({
                sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE Key = @key',
                params: {key},
              });
            })
            .then(data => {
              const rows = data[0].map(row => row.toJSON());

              assert.strictEqual(rows.length, 1);
              assert.strictEqual(rows[0].StringValue, str);
            })
            .then(() => transaction!.rollback(done), done);
        });
      });

      it('should rollback a dml statement', done => {
        const key = 'k999';
        const str = 'abcd';

        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!
            .runUpdate({
              sql:
                'UPDATE ' +
                TABLE_NAME +
                ' t SET t.StringValue = @str WHERE t.Key = @key',
              params: {key, str},
            })
            .then(() => transaction!.rollback())
            .then(() => {
              return DATABASE.run({
                sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE Key = @key',
                params: {key},
              });
            })
            .then(data => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rows = data[0].map(row => (row as any).toJSON());
              assert.notStrictEqual(rows[0].StringValue, str);
              done();
            })
            .catch(done);
        });
      });

      it('should handle using both dml and insert methods', done => {
        const str = 'dml+mutation';

        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!
            .runUpdate({
              sql:
                'INSERT INTO ' +
                TABLE_NAME +
                ' (Key, StringValue) VALUES (@key, @str)',
              params: {
                key: 'k1001',
                str,
              },
            })
            .then(() => {
              transaction!.insert('TxnTable', {
                Key: 'k1002',
                StringValue: str,
              });

              return transaction!.commit();
            })
            .then(() => {
              return DATABASE.run({
                sql:
                  'SELECT * FROM ' + TABLE_NAME + ' WHERE StringValue = @str',
                params: {str},
              });
            })
            .then(data => {
              const rows = data[0];

              assert.strictEqual(rows.length, 2);
              done();
            })
            .catch(done);
        });
      });
    });

    describe('pdml', () => {
      before(function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
      });

      it('should execute a simple pdml statement', done => {
        DATABASE.runPartitionedUpdate(
          {
            sql:
              'UPDATE ' +
              TABLE_NAME +
              ' t SET t.StringValue = @str WHERE t.Key = @key',
            params: {
              key: 'k1',
              str: 'abcde',
            },
          },
          (err, rowCount) => {
            assert.ifError(err);
            assert.strictEqual(rowCount, 1);
            done();
          }
        );
      });

      // tslint:disable-next-line ban
      it.skip('should execute a long running pdml statement', () => {
        const count = 10000;

        const tableData = new Array(count).fill(0).map((_, i) => {
          return {Key: `longpdml${i}`, StringValue: 'a'};
        });

        const str = new Array(1000).fill('b').join('\n');

        return DATABASE.runTransactionAsync(transaction => {
          transaction.insert('TxnTable', tableData);
          return transaction.commit();
        })
          .then(() => {
            return DATABASE.runPartitionedUpdate({
              sql:
                "UPDATE ' + TABLE_NAME + ' t SET t.StringValue = @str WHERE t.StringValue = 'a'",
              params: {str},
            });
          })
          .then(([rowCount]) => {
            assert.strictEqual(rowCount, count);

            return DATABASE.run({
              sql:
                'SELECT Key FROM ' + TABLE_NAME + ' WHERE StringValue = @str',
              params: {str},
            });
          })
          .then(([rows]) => {
            assert.strictEqual(rows.length, count);
          });
      });
    });

    describe('batch dml', () => {
      const key = 'k1234';
      const str = 'abcd';
      const num = 11;

      const insert = {
        sql:
          'INSERT INTO ' +
          TABLE_NAME +
          ' (Key, StringValue) VALUES (@key, @str)',
        params: {key, str},
      };

      const update = {
        sql:
          'UPDATE ' +
          TABLE_NAME +
          ' t SET t.NumberValue = @num WHERE t.KEY = @key',
        params: {key, num},
      };

      // this should fail since we're not binding params
      const borked = {
        sql:
          'UPDATE ' +
          TABLE_NAME +
          ' t SET t.NumberValue = @num WHERE t.KEY = @key',
      };

      it('should execute a single statement', async () => {
        const rowCounts = await DATABASE.runTransactionAsync(async txn => {
          const [rowCounts] = await txn.batchUpdate([insert]);
          await txn.rollback();
          return rowCounts;
        });

        assert.deepStrictEqual(rowCounts, [1]);
      });

      it('should return an error when no statements are supplied', async () => {
        const err = await DATABASE.runTransactionAsync(async txn => {
          let err;

          try {
            await txn.batchUpdate((null as unknown) as []);
          } catch (e) {
            err = e;
          }

          txn.end();
          return err;
        });

        assert.strictEqual(
          err.message,
          'batchUpdate requires at least 1 DML statement.'
        );
        assert.strictEqual(err.code, 3);
      });

      it('should run multiple statements that depend on each other', async () => {
        const rowCounts = await DATABASE.runTransactionAsync(async txn => {
          const [rowCounts] = await txn.batchUpdate([insert, update]);
          await txn.rollback();
          return rowCounts;
        });

        assert.deepStrictEqual(rowCounts, [1, 1]);
      });

      it('should run after a runUpdate call', async () => {
        const rowCounts = await DATABASE.runTransactionAsync(async txn => {
          await txn.runUpdate(insert);
          const [rowCounts] = await txn.batchUpdate([update]);
          await txn.rollback();
          return rowCounts;
        });

        assert.deepStrictEqual(rowCounts, [1]);
      });

      it('should run before a runUpdate call', async () => {
        const rowCounts = await DATABASE.runTransactionAsync(async txn => {
          const [rowCounts] = await txn.batchUpdate([insert]);
          await txn.runUpdate(update);
          await txn.rollback();
          return rowCounts;
        });

        assert.deepStrictEqual(rowCounts, [1]);
      });

      it('should stop executing statements if an error occurs', async () => {
        const err = await DATABASE.runTransactionAsync(async txn => {
          let err;

          try {
            await txn.batchUpdate([insert, borked, update]);
          } catch (e) {
            // Re-throw if the transaction was aborted to trigger a retry.
            if (e.code === grpc.status.ABORTED) {
              throw e;
            }
            err = e;
          }

          await txn.rollback();
          return err;
        });

        assert.strictEqual(err.code, grpc.status.INVALID_ARGUMENT);
        assert.deepStrictEqual(err.rowCounts, [1]);
      });

      it('should ignore any additional statement errors', async () => {
        const err = await DATABASE.runTransactionAsync(async txn => {
          let err;

          try {
            await txn.batchUpdate([insert, borked, borked]);
          } catch (e) {
            err = e;
          }

          await txn.rollback();
          return err;
        });

        assert.strictEqual(err.code, 3);
        assert.deepStrictEqual(err.rowCounts, [1]);
      });
    });

    describe('read/write', () => {
      it('should throw an error for mismatched columns', done => {
        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          const rows = [
            {
              Key: 'k1',
              StringValue: 'hi',
            },
            {
              Key: 'k2',
              NumberValue: 4,
            },
          ];

          const expectedErrorMessage = [
            'Row at index 0 does not contain the correct number of columns.',
            `Missing columns: ${JSON.stringify(['NumberValue'])}`,
          ].join('\n\n');
          let caughtErrorMessage;
          try {
            transaction!.insert(table.name, rows);
          } catch (e) {
            caughtErrorMessage = e.message;
          }
          assert.strictEqual(caughtErrorMessage, expectedErrorMessage);

          transaction!.end();
          done();
        });
      });

      it('should commit a transaction', done => {
        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.insert(table.name, {
            Key: 'k5',
            StringValue: 'v5',
          });

          transaction!.commit(done);
        });
      });

      it('should rollback a transaction', done => {
        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.run('SELECT * FROM TxnTable', err => {
            assert.ifError(err);
            transaction!.rollback(done);
          });
        });
      });

      describe('concurrent transactions', () => {
        const defaultRowValues = {
          Key: 'k0',
          NumberValue: 0,
        };

        beforeEach(() => {
          return table.update(defaultRowValues);
        });

        it('should handle concurrent transactions with read', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          DATABASE.runTransaction((err, transaction) => {
            assert.ifError(err);

            incrementValue(err => {
              assert.ifError(err);

              getValue(transaction, (err, value) => {
                assert.ifError(err);
                assert.strictEqual(value, defaultRowValues.NumberValue + 1);
                done();
              });
            });
          });

          function incrementValue(callback) {
            DATABASE.runTransaction((err, transaction) => {
              assert.ifError(err);

              getValue(transaction, (err, value) => {
                if (err) {
                  callback(err);
                  return;
                }

                transaction!.update(table.name, {
                  Key: defaultRowValues.Key,
                  NumberValue: value + 1,
                });

                transaction!.commit(callback);
              });
            });
          }

          function getValue(txn, callback) {
            txn.read(
              table.name,
              {
                keys: [defaultRowValues.Key],
                columns: ['NumberValue'],
              },
              (err, rows) => {
                if (err) {
                  callback(err);
                  return;
                }

                const row = rows[0].toJSON();
                callback(null, row.NumberValue);
              }
            );
          }
        });

        it('should handle concurrent transactions with query', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          DATABASE.runTransaction((err, transaction) => {
            assert.ifError(err);

            incrementValue(err => {
              assert.ifError(err);

              getValue(transaction, (err, value) => {
                assert.ifError(err);
                assert.strictEqual(value, defaultRowValues.NumberValue + 1);
                done();
              });
            });
          });

          function incrementValue(callback) {
            DATABASE.runTransaction((err, transaction) => {
              assert.ifError(err);

              getValue(transaction, (err, value) => {
                if (err) {
                  callback(err);
                  return;
                }

                transaction!.update(table.name, {
                  Key: defaultRowValues.Key,
                  NumberValue: value + 1,
                });

                transaction!.commit(callback);
              });
            });
          }

          function getValue(txn, callback) {
            txn.run(
              {
                sql: 'SELECT * FROM ' + table.name + ' WHERE Key = @key',
                params: {
                  key: defaultRowValues.Key,
                },
              },
              (err, rows) => {
                if (err) {
                  callback(err);
                  return;
                }

                const row = rows[0].toJSON();
                callback(null, row.NumberValue);
              }
            );
          }
        });
      });

      it('should retry an aborted txn when reading fails', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k888';
        const query = `SELECT * FROM ${table.name} WHERE Key = '${key}'`;

        let attempts = 0;

        const expectedRow = {
          Key: key,
          NumberValue: null,
          StringValue: 'abc',
        };

        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.run(query, err => {
            assert.ifError(err);

            const action = attempts++ === 0 ? runOtherTransaction : wrap;

            action(err => {
              assert.ifError(err);

              transaction!.run(query, (err, rows) => {
                assert.ifError(err);

                transaction!.insert(table.name, {
                  Key: generateName('key'),
                  StringValue: generateName('val'),
                });

                transaction!.commit(err => {
                  assert.ifError(err);

                  const lastRow = rows!.pop()!.toJSON();

                  assert.deepStrictEqual(lastRow, expectedRow);
                  // The transaction should have been tried at least twice, but
                  // there could be more attempts, as the backend could abort
                  // any subsequent retry attempts as well.
                  assert.ok(attempts >= 2);

                  done();
                });
              });
            });
          });
        });

        function runOtherTransaction(callback) {
          DATABASE.runTransaction((err, transaction) => {
            if (err) {
              callback(err);
              return;
            }

            transaction!.run(query, err => {
              if (err) {
                callback(err);
                return;
              }

              transaction!.insert(table.name, expectedRow);
              transaction!.commit(callback);
            });
          });
        }

        function wrap(callback) {
          setImmediate(callback);
        }
      });

      it('should retry an aborted txn when commit fails', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k9999';
        const query = `SELECT * FROM ${table.name} WHERE Key = '${key}'`;
        let attempts = 0;

        const expectedRow = {
          Key: key,
          NumberValue: null,
          StringValue: 'abc',
        };

        DATABASE.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.run(query, (err, rows) => {
            assert.ifError(err);

            transaction!.insert(table.name, {
              Key: generateName('key'),
              StringValue: generateName('val'),
            });

            if (attempts++ === 0) {
              runOtherTransaction(err => {
                assert.ifError(err);
                transaction!.commit(done); // should not execute callback
              });
              return;
            }

            transaction!.commit(err => {
              assert.ifError(err);

              const lastRow = rows!.pop()!.toJSON();

              assert.deepStrictEqual(lastRow, expectedRow);
              // The transaction should have been tried at least twice, but
              // there could be more attempts, as the backend could abort any
              // subsequent retry attempts as well.
              assert.ok(attempts >= 2);

              done();
            });
          });
        });

        function runOtherTransaction(callback) {
          DATABASE.runTransaction((err, transaction) => {
            if (err) {
              callback(err);
              return;
            }

            transaction!.run(query, err => {
              if (err) {
                callback(err);
                return;
              }

              transaction!.insert(table.name, expectedRow);
              transaction!.commit(callback);
            });
          });
        }
      });

      it('should return a deadline error instead of aborted', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }

        const options = {
          timeout: 10,
        };

        const query = `SELECT * FROM ${table.name}`;
        let attempts = 0;

        DATABASE.runTransaction(options, (err, transaction) => {
          if (attempts++ === 1) {
            assert.strictEqual(err!.code, 4);
            assert(
              err!.message.startsWith('Deadline for Transaction exceeded.')
            );

            done();
            return;
          }

          assert.ifError(err);

          transaction!.run(query, err => {
            assert.ifError(err);

            transaction!.insert(table.name, {
              Key: generateName('key'),
            });

            runOtherTransaction(err => {
              assert.ifError(err);

              transaction!.commit(() => {
                done(new Error('Should not have been called.'));
              });
            });
          });
        });

        function runOtherTransaction(callback) {
          DATABASE.runTransaction((err, transaction) => {
            if (err) {
              callback(err);
              return;
            }

            transaction!.run(query, err => {
              if (err) {
                callback(err);
                return;
              }

              transaction!.insert(table.name, {
                Key: generateName('key'),
              });

              transaction!.commit(callback);
            });
          });
        }
      });
    });
  });
});

function shortUUID() {
  return uuid.v4().split('-').shift();
}

function generateName(resourceType) {
  return PREFIX + resourceType + '-' + shortUUID();
}

function onPromiseOperationComplete(data) {
  const operation = data[data.length - 2];
  return operation.promise();
}

function execAfterOperationComplete(callback) {
  // tslint:disable-next-line only-arrow-functions
  return function (err) {
    // arguments = [..., op, apiResponse]
    // eslint-disable-next-line prefer-rest-params
    const operation = arguments[arguments.length - 2];
    // eslint-disable-next-line prefer-rest-params
    const apiResponse = arguments[arguments.length - 1];

    if (err) {
      callback(err, apiResponse);
      return;
    }

    operation.on('error', callback).on('complete', metadata => {
      callback(null, metadata);
    });
  };
}

async function deleteOldTestInstances() {
  const [instances] = await spanner.getInstances();
  const currentTimestampSeconds = Math.round(Date.now() / 1000);
  // Leave only instances that contain PREFIX in their name
  // and where created more that an hour ago.
  function isDayOld(timestampCreated: number) {
    return (currentTimestampSeconds - timestampCreated) / (60 * 60 * 24) > 1;
  }
  const toDelete = instances.filter(
    instance =>
      instance.id.includes(PREFIX) &&
      isDayOld(Number(instance.metadata!.labels!.created))
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
  await Promise.all(backups.map(backup => backup.delete()));
  return instance.delete();
}

function wait(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}
