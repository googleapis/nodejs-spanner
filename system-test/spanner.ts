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
import pLimit = require('p-limit');
import concat = require('concat-stream');
import * as crypto from 'crypto';
import * as extend from 'extend';
import * as is from 'is';
import * as uuid from 'uuid';
import {
  Backup,
  Database,
  Spanner,
  Instance,
  InstanceConfig,
  Session,
} from '../src';
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
import CreateInstanceConfigMetadata = google.spanner.admin.instance.v1.CreateInstanceConfigMetadata;

const SKIP_BACKUPS = process.env.SKIP_BACKUPS;
const IAM_MEMBER = process.env.IAM_MEMBER;
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
    config: 'regional-us-west2',
    nodes: 1,
    labels: {
      [LABEL]: 'true',
      created: CURRENT_TIME,
    },
    gaxOptions: GAX_OPTIONS,
  };

  const IS_EMULATOR_ENABLED =
    typeof process.env.SPANNER_EMULATOR_HOST !== 'undefined';
  const RESOURCES_TO_CLEAN: Array<Instance | Backup | Database> = [];
  const INSTANCE_CONFIGS_TO_CLEAN: Array<InstanceConfig> = [];
  const DATABASE = instance.database(generateName('database'), {incStep: 1});
  const TABLE_NAME = 'Singers';
  const PG_DATABASE = instance.database(generateName('pg-db'), {incStep: 1});

  // Custom instance configs start with 'custom-'
  const instanceConfig = spanner.instanceConfig(
    'custom-' + generateName('instance-config')
  );

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
    const [, googleSqlOperation] = await DATABASE.create({
      schema: `
          CREATE TABLE ${TABLE_NAME} (
            SingerId STRING(1024) NOT NULL,
            Name STRING(1024),
          ) PRIMARY KEY(SingerId)`,
      gaxOptions: GAX_OPTIONS,
    });
    await googleSqlOperation.promise();
    RESOURCES_TO_CLEAN.push(DATABASE);

    if (!IS_EMULATOR_ENABLED) {
      const [pg_database, postgreSqlOperation] = await PG_DATABASE.create({
        databaseDialect: Spanner.POSTGRESQL,
        gaxOptions: GAX_OPTIONS,
      });
      await postgreSqlOperation.promise();
      const schema = [
        `
       CREATE TABLE ${TABLE_NAME} (
         SingerId VARCHAR(1024) NOT NULL,
         Name VARCHAR(1024),
         PRIMARY KEY (SingerId)
       );`,
      ];
      const [postgreSqlOperationUpdateDDL] = await pg_database.updateSchema(
        schema
      );
      await postgreSqlOperationUpdateDDL.promise();
      RESOURCES_TO_CLEAN.push(PG_DATABASE);

      // Create a user-managed instance config from a base instance config.
      const [baseInstanceConfig] = await spanner.getInstanceConfig(
        INSTANCE_CONFIG.config
      );
      const customInstanceConfigRequest = {
        replicas: baseInstanceConfig.replicas!.concat(
          baseInstanceConfig!.optionalReplicas![0]
        ),
        baseConfig: baseInstanceConfig.name,
        gaxOptions: GAX_OPTIONS,
      };
      const [, operation] = await instanceConfig.create(
        customInstanceConfigRequest
      );
      await operation.promise();
      INSTANCE_CONFIGS_TO_CLEAN.push(instanceConfig);
    }
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

  describe('types', () => {
    const TABLE_NAME = 'TypeCheck';
    const googleSqlTable = DATABASE.table(TABLE_NAME);
    const postgreSqlTable = PG_DATABASE.table(TABLE_NAME);

    function insert(insertData, dialect, callback) {
      const id = generateName('id');

      insertData.Key = id;

      let table = googleSqlTable;
      let query: ExecuteSqlRequest = {
        sql: 'SELECT * FROM `' + table.name + '` WHERE Key = @id',
        params: {
          id,
        },
      };
      let database = DATABASE;
      if (dialect === Spanner.POSTGRESQL) {
        table = postgreSqlTable;
        query = {
          sql: 'SELECT * FROM ' + table.name + ' WHERE "Key" = $1',
          params: {
            p1: id,
          },
        };
        database = PG_DATABASE;
      }
      table.insert(insertData, (err, insertResp) => {
        if (err) {
          callback(err);
          return;
        }

        database.run(query, (err, rows, readResp) => {
          if (err) {
            callback(err);
            return;
          }

          callback(null, rows.shift(), insertResp, readResp);
        });
      });
    }

    before(async () => {
      if (IS_EMULATOR_ENABLED) {
        const [googleSqlOperationUpdateDDL] = await DATABASE.updateSchema(
          `
              CREATE TABLE ${TABLE_NAME}
              (
                Key             STRING( MAX) NOT NULL,
                BytesValue      BYTES( MAX),
                BoolValue       BOOL,
                DateValue       DATE,
                FloatValue      FLOAT64,
                IntValue        INT64,
                NumericValue    NUMERIC,
                StringValue     STRING( MAX),
                TimestampValue  TIMESTAMP,
                BytesArray      ARRAY<BYTES(MAX)>,
                BoolArray       ARRAY<BOOL>,
                DateArray       ARRAY< DATE >,
                FloatArray      ARRAY<FLOAT64>,
                IntArray        ARRAY<INT64>,
                NumericArray    ARRAY< NUMERIC >,
                StringArray     ARRAY<STRING(MAX)>,
                TimestampArray  ARRAY< TIMESTAMP >,
                CommitTimestamp TIMESTAMP OPTIONS (allow_commit_timestamp= true)
              ) PRIMARY KEY (Key)
            `
        );
        await googleSqlOperationUpdateDDL.promise();
      } else {
        const [googleSqlOperationUpdateDDL] = await DATABASE.updateSchema(
          `
              CREATE TABLE ${TABLE_NAME}
              (
                Key             STRING( MAX) NOT NULL,
                BytesValue      BYTES( MAX),
                BoolValue       BOOL,
                DateValue       DATE,
                FloatValue      FLOAT64,
                JsonValue       JSON,
                IntValue        INT64,
                NumericValue    NUMERIC,
                StringValue     STRING( MAX),
                TimestampValue  TIMESTAMP,
                BytesArray      ARRAY<BYTES(MAX)>,
                BoolArray       ARRAY<BOOL>,
                DateArray       ARRAY< DATE >,
                FloatArray      ARRAY<FLOAT64>,
                JsonArray       ARRAY<JSON>,
                IntArray        ARRAY<INT64>,
                NumericArray    ARRAY< NUMERIC >,
                StringArray     ARRAY<STRING(MAX)>,
                TimestampArray  ARRAY< TIMESTAMP >,
                CommitTimestamp TIMESTAMP OPTIONS (allow_commit_timestamp= true)
              ) PRIMARY KEY (Key)
            `
        );
        await googleSqlOperationUpdateDDL.promise();
        const [postgreSqlOperationUpdateDDL] = await PG_DATABASE.updateSchema(
          `
                CREATE TABLE ${TABLE_NAME}
                (
                  "Key"             VARCHAR NOT NULL PRIMARY KEY,
                  "BytesValue"      BYTEA,
                  "BoolValue"       BOOL,
                  "FloatValue"      DOUBLE PRECISION,
                  "IntValue"        BIGINT,
                  "NumericValue"    NUMERIC,
                  "StringValue"     VARCHAR,
                  "TimestampValue"  TIMESTAMPTZ,
                  "DateValue"       DATE,
                  "CommitTimestamp" SPANNER.COMMIT_TIMESTAMP,
                  "JsonbValue"      JSONB
                );
            `
        );
        await postgreSqlOperationUpdateDDL.promise();
      }
    });

    describe('uneven rows', () => {
      const differentlyOrderedRows = (done, dialect) => {
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

        let table = googleSqlTable;
        let database = DATABASE;
        let query: ExecuteSqlRequest = {
          sql: `SELECT * FROM \`${table.name}\` WHERE Key = @a OR KEY = @b`,
          params: {
            a: data[0].Key,
            b: data[1].Key,
          },
        };
        if (dialect === Spanner.POSTGRESQL) {
          table = postgreSqlTable;
          database = PG_DATABASE;
          query = {
            sql: `SELECT * FROM ${table.name} WHERE "Key" = $1 OR "Key" = $2`,
            params: {
              p1: data[0].Key,
              p2: data[1].Key,
            },
          };
        }

        table.insert(data, err => {
          assert.ifError(err);

          database.run(query, (err, rows) => {
            assert.ifError(err);

            const row1 = rows![0].toJSON();
            assert.deepStrictEqual(row1.IntValue, data[0].IntValue);
            assert.deepStrictEqual(row1.BoolValue, data[0].BoolValue);

            const row2 = rows![1].toJSON();
            assert.deepStrictEqual(row2.IntValue, data[1].IntValue);
            assert.deepStrictEqual(row2.BoolValue, data[1].BoolValue);

            done();
          });
        });
      };

      it('GOOGLE_STANDARD_SQL should allow differently-ordered rows', done => {
        differentlyOrderedRows(done, Spanner.GOOGLE_STANDARD_SQL);
      });

      it('POSTGRESQL should allow differently-ordered rows}', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        differentlyOrderedRows(done, Spanner.POSTGRESQL);
      });
    });

    describe('structs', () => {
      it('GOOGLE_STANDARD_SQL should correctly decode structs', done => {
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

      it('GOOGLE_STANDARD_SQL should correctly decode structs', done => {
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
      const booleanInsert = (done, dialect, value) => {
        insert({BoolValue: value}, dialect, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().BoolValue, value);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write boolean values', done => {
        booleanInsert(done, Spanner.GOOGLE_STANDARD_SQL, true);
      });

      it('POSTGRESQL should write boolean values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        booleanInsert(done, Spanner.POSTGRESQL, true);
      });

      it('GOOGLE_STANDARD_SQL should write null boolean values', done => {
        booleanInsert(done, Spanner.GOOGLE_STANDARD_SQL, null);
      });

      it('POSTGRESQL should write null boolean values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        booleanInsert(done, Spanner.POSTGRESQL, null);
      });

      it('GOOGLE_STANDARD_SQL should write empty boolean array values', done => {
        insert({BoolArray: []}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BoolArray, []);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write null boolean array values', done => {
        insert({BoolArray: [null]}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BoolArray, [null]);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write boolean array values', done => {
        insert(
          {BoolArray: [true, false]},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().BoolArray, [true, false]);
            done();
          }
        );
      });
    });

    describe('int64s', () => {
      const int64Insert = (done, dialect, value) => {
        insert({IntValue: value}, dialect, (err, row) => {
          assert.ifError(err);
          if (value) {
            value = value.valueOf();
          }
          assert.deepStrictEqual(row.toJSON().IntValue, value);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write int64 values', done => {
        int64Insert(done, Spanner.GOOGLE_STANDARD_SQL, Spanner.int(1234));
      });

      it('POSTGRESQL should write int64 values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        int64Insert(done, Spanner.POSTGRESQL, Spanner.int(1234));
      });

      it('GOOGLE_STANDARD_SQL should write null int64 values', done => {
        int64Insert(done, Spanner.GOOGLE_STANDARD_SQL, null);
      });

      it('POSTGRESQL should write null int64 values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        int64Insert(done, Spanner.POSTGRESQL, null);
      });

      const int64OutOfBounds = (done, dialect) => {
        const value = '9223372036854775807';

        insert({IntValue: value}, dialect, (err, row) => {
          assert.ifError(err);

          assert.throws(() => {
            row.toJSON();
          }, new RegExp('Serializing column "IntValue" encountered an error'));

          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should throw for of bounds integers', done => {
        int64OutOfBounds(done, Spanner.GOOGLE_STANDARD_SQL);
      });

      it('POSTGRESQL should throw for of bounds integers', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        int64OutOfBounds(done, Spanner.POSTGRESQL);
      });

      const int64WrapOutOfBounds = (done, dialect) => {
        const value = '9223372036854775807';

        insert({IntValue: value}, dialect, (err, row) => {
          assert.ifError(err);
          const expected = Spanner.int(value);
          const actual = row.toJSON({wrapNumbers: true}).IntValue;
          assert.deepStrictEqual(actual, expected);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should optionally wrap out of bounds integers', done => {
        int64WrapOutOfBounds(done, Spanner.GOOGLE_STANDARD_SQL);
      });

      it('POSTGRESQL should optionally wrap out of bounds integers', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        int64WrapOutOfBounds(done, Spanner.POSTGRESQL);
      });

      it('GOOGLE_STANDARD_SQL should write empty in64 array values', done => {
        insert({IntArray: []}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntArray, []);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write null int64 array values', done => {
        insert({IntArray: [null]}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntArray, [null]);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write int64 array values', done => {
        const values = [1, 2, 3];

        insert({IntArray: values}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntArray, values);
          done();
        });
      });
    });

    describe('float64s', () => {
      const float64Insert = (done, dialect, value) => {
        insert({FloatValue: value}, dialect, (err, row) => {
          assert.ifError(err);
          if (typeof value === 'object' && value !== null) {
            value = value.value;
          }
          assert.deepStrictEqual(row.toJSON().FloatValue, value);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write float64 values', done => {
        float64Insert(done, Spanner.GOOGLE_STANDARD_SQL, 8.2);
      });

      it('POSTGRESQL should write float64 values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        float64Insert(done, Spanner.POSTGRESQL, 8.2);
      });

      it('GOOGLE_STANDARD_SQL should write null float64 values', done => {
        float64Insert(done, Spanner.GOOGLE_STANDARD_SQL, null);
      });

      it('POSTGRESQL should write null float64 values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        float64Insert(done, Spanner.POSTGRESQL, null);
      });

      it('GOOGLE_STANDARD_SQL should accept a Float object with an Int-like value', done => {
        float64Insert(done, Spanner.GOOGLE_STANDARD_SQL, Spanner.float(8));
      });

      it('POSTGRESQL should accept a Float object with an Int-like value', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        float64Insert(done, Spanner.POSTGRESQL, Spanner.float(8));
      });

      it('GOOGLE_STANDARD_SQL should handle Infinity', done => {
        float64Insert(done, Spanner.GOOGLE_STANDARD_SQL, Infinity);
      });

      it('POSTGRESQL should handle Infinity', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        float64Insert(done, Spanner.POSTGRESQL, Infinity);
      });

      it('GOOGLE_STANDARD_SQL should handle -Infinity', done => {
        float64Insert(done, Spanner.GOOGLE_STANDARD_SQL, -Infinity);
      });

      it('POSTGRESQL should handle -Infinity', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        float64Insert(done, Spanner.POSTGRESQL, -Infinity);
      });

      it('GOOGLE_STANDARD_SQL should handle NaN', done => {
        float64Insert(done, Spanner.GOOGLE_STANDARD_SQL, NaN);
      });

      it('POSTGRESQL should handle NaN', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        float64Insert(done, Spanner.POSTGRESQL, NaN);
      });

      it('GOOGLE_STANDARD_SQL should write empty float64 array values', done => {
        insert({FloatArray: []}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatArray, []);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write null float64 array values', done => {
        insert(
          {FloatArray: [null]},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().FloatArray, [null]);
            done();
          }
        );
      });

      it('GOOGLE_STANDARD_SQL should write float64 array values', done => {
        const values = [1.2, 2.3, 3.4];

        insert(
          {FloatArray: values},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().FloatArray, values);
            done();
          }
        );
      });
    });

    describe('numerics', () => {
      const numericInsert = (done, dialect, value) => {
        insert({NumericValue: value}, dialect, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().NumericValue, value);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write numeric values', done => {
        numericInsert(
          done,
          Spanner.GOOGLE_STANDARD_SQL,
          Spanner.numeric('3.141592653')
        );
      });

      it('POSTGRESQL should write numeric values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        numericInsert(
          done,
          Spanner.POSTGRESQL,
          Spanner.pgNumeric('3.141592653')
        );
      });

      it('GOOGLE_STANDARD_SQL should write null numeric values', done => {
        numericInsert(done, Spanner.GOOGLE_STANDARD_SQL, null);
      });

      it('POSTGRESQL should write null numeric values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        numericInsert(done, Spanner.POSTGRESQL, null);
      });

      it('POSTGRESQL should bind NaN', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        numericInsert(done, Spanner.POSTGRESQL, Spanner.pgNumeric('NaN'));
      });

      const numericInsertOutOfBounds = (done, dialect, value) => {
        insert({NumericValue: value}, dialect, err => {
          assert.strictEqual(err.code, grpc.status.FAILED_PRECONDITION);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should throw for out of bounds values', done => {
        numericInsertOutOfBounds(
          done,
          Spanner.GOOGLE_STANDARD_SQL,
          Spanner.numeric('3.1415926535')
        );
      });

      it('POSTGRESQL should throw for out of bounds values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        numericInsertOutOfBounds(
          done,
          Spanner.POSTGRESQL,
          Spanner.pgNumeric('1e131072')
        );
      });

      it('GOOGLE_STANDARD_SQL should write empty numeric array values', done => {
        insert({NumericArray: []}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().NumericArray, []);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write null numeric array values', done => {
        insert(
          {NumericArray: [null]},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().NumericArray, [null]);
            done();
          }
        );
      });

      it('GOOGLE_STANDARD_SQL should write numeric array values', done => {
        const values = [
          Spanner.numeric('-99999999999999999999999999999.999999999'),
          Spanner.numeric('3.141592653'),
          Spanner.numeric('99999999999999999999999999999.999999999'),
        ];

        insert(
          {NumericArray: values},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().NumericArray, values);
            done();
          }
        );
      });
    });

    describe('strings', () => {
      const stringInsert = (done, dialect, value) => {
        insert({StringValue: value}, dialect, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().StringValue, value);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write string values', done => {
        stringInsert(done, Spanner.GOOGLE_STANDARD_SQL, 'abc');
      });

      it('POSTGRESQL should write string values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        stringInsert(done, Spanner.POSTGRESQL, 'abc');
      });

      it('GOOGLE_STANDARD_SQL should write null string values', done => {
        stringInsert(done, Spanner.GOOGLE_STANDARD_SQL, null);
      });

      it('POSTGRESQL should write null string values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        stringInsert(done, Spanner.POSTGRESQL, null);
      });

      it('GOOGLE_STANDARD_SQL should write empty string array values', done => {
        insert({StringArray: []}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().StringArray, []);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write null string array values', done => {
        insert(
          {StringArray: [null]},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().StringArray, [null]);
            done();
          }
        );
      });

      it('GOOGLE_STANDARD_SQL should write string array values', done => {
        insert(
          {StringArray: ['abc', 'def']},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().StringArray, ['abc', 'def']);
            done();
          }
        );
      });
    });

    describe('bytes', () => {
      const bytesInsert = (done, dialect, value) => {
        insert({BytesValue: value}, dialect, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesValue, value);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write bytes values', done => {
        bytesInsert(done, Spanner.GOOGLE_STANDARD_SQL, Buffer.from('abc'));
      });

      it('POSTGRESQL should write bytes values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        bytesInsert(done, Spanner.POSTGRESQL, Buffer.from('abc'));
      });

      it('GOOGLE_STANDARD_SQL should write null bytes values', done => {
        bytesInsert(done, Spanner.GOOGLE_STANDARD_SQL, null);
      });

      it('POSTGRESQL should write null bytes values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        bytesInsert(done, Spanner.POSTGRESQL, null);
      });

      it('GOOGLE_STANDARD_SQL should write empty bytes array values', done => {
        insert({BytesArray: []}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesArray, []);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write null bytes array values', done => {
        insert(
          {BytesArray: [null]},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().BytesArray, [null]);
            done();
          }
        );
      });

      it('GOOGLE_STANDARD_SQL should write bytes array values', done => {
        const values = [Buffer.from('a'), Buffer.from('b')];

        insert(
          {BytesArray: values},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().BytesArray, values);
            done();
          }
        );
      });
    });

    describe('jsons', () => {
      before(async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
      });

      it('GOOGLE_STANDARD_SQL should write json values', done => {
        insert(
          {JsonValue: {key1: 'value1', key2: 'value2'}},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().JsonValue, {
              key1: 'value1',
              key2: 'value2',
            });
            done();
          }
        );
      });

      it('GOOGLE_STANDARD_SQL should write null json values', done => {
        insert({JsonValue: null}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().JsonValue, null);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write empty json array values', done => {
        insert({JsonArray: []}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().JsonArray, []);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write null json array values', done => {
        insert({JsonArray: [null]}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().JsonArray, [null]);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write json array values', done => {
        insert(
          {JsonArray: [{key1: 'value1'}, {key2: 'value2'}]},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().JsonArray, [
              {key1: 'value1'},
              {key2: 'value2'},
            ]);
            done();
          }
        );
      });
    });

    describe('timestamps', () => {
      const timestampInsert = (done, dialect) => {
        const date = Spanner.timestamp();

        insert({TimestampValue: date}, dialect, (err, row) => {
          assert.ifError(err);
          const time = row.toJSON().TimestampValue.getTime();
          assert.strictEqual(time, date.getTime());
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write timestamp values', done => {
        timestampInsert(done, Spanner.GOOGLE_STANDARD_SQL);
      });

      it('POSTGRESQL should write timestamp values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        timestampInsert(done, Spanner.POSTGRESQL);
      });

      const timestampInsertNull = (done, dialect) => {
        insert({TimestampValue: null}, dialect, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().TimestampValue, null);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write null timestamp values', done => {
        timestampInsertNull(done, Spanner.GOOGLE_STANDARD_SQL);
      });

      it('POSTGRESQL should write null timestamp values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        timestampInsertNull(done, Spanner.POSTGRESQL);
      });

      it('GOOGLE_STANDARD_SQL should write empty timestamp array values', done => {
        insert(
          {TimestampArray: []},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().TimestampArray, []);
            done();
          }
        );
      });

      it('GOOGLE_STANDARD_SQL should write null timestamp array values', done => {
        insert(
          {TimestampArray: [null]},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().TimestampArray, [null]);
            done();
          }
        );
      });

      it('GOOGLE_STANDARD_SQL should write timestamp array values', done => {
        const values = [Spanner.timestamp(), Spanner.timestamp('3-3-1933')];

        insert(
          {TimestampArray: values},
          Spanner.GOOGLE_STANDARD_SQL,
          (err, row) => {
            assert.ifError(err);
            assert.deepStrictEqual(row.toJSON().TimestampArray, values);
            done();
          }
        );
      });
    });

    describe('dates', () => {
      const dateInsert = (done, dialect) => {
        insert({DateValue: Spanner.date()}, dialect, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(
            Spanner.date(row.toJSON().DateValue),
            Spanner.date()
          );
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write date values', done => {
        dateInsert(done, Spanner.GOOGLE_STANDARD_SQL);
      });

      it('POSTGRESQL should write date values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        dateInsert(done, Spanner.POSTGRESQL);
      });

      const dateInsertNull = (done, dialect) => {
        insert({DateValue: null}, dialect, (err, row) => {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().DateValue, null);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should write null date values', done => {
        dateInsertNull(done, Spanner.GOOGLE_STANDARD_SQL);
      });

      it('POSTGRESQL should write null date values', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        dateInsertNull(done, Spanner.POSTGRESQL);
      });

      it('GOOGLE_STANDARD_SQL should write empty date array values', done => {
        insert({DateArray: []}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().DateArray, []);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write null date array values', done => {
        insert({DateArray: [null]}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().DateArray, [null]);
          done();
        });
      });

      it('GOOGLE_STANDARD_SQL should write date array values', done => {
        const values = [Spanner.date(), Spanner.date('3-3-1933')];

        insert({DateArray: values}, Spanner.GOOGLE_STANDARD_SQL, (err, row) => {
          assert.ifError(err);
          const {DateArray} = row.toJSON();
          assert.deepStrictEqual(DateArray, values);
          done();
        });
      });
    });

    describe('jsonb', () => {
      before(async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
      });

      const jsonbInsert = (done, dialect, value) => {
        insert({JsonbValue: value}, dialect, (err, row) => {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().JsonbValue, value);
          done();
        });
      };

      it('POSTGRESQL should write jsonb values', done => {
        jsonbInsert(
          done,
          Spanner.POSTGRESQL,
          Spanner.pgJsonb({
            key1: 'value1',
            key2: 'value2',
          })
        );
      });

      it('POSTGRESQL should write null jsonb values', done => {
        jsonbInsert(done, Spanner.POSTGRESQL, null);
      });
    });

    describe('commit timestamp', () => {
      const commitTimestamp = (done, dialect) => {
        const data = {CommitTimestamp: Spanner.COMMIT_TIMESTAMP};

        insert(data, dialect, (err, row, {commitTimestamp}) => {
          assert.ifError(err);

          const timestampFromCommit = Spanner.timestamp(commitTimestamp);
          const timestampFromRead = row.toJSON().CommitTimestamp;

          assert.deepStrictEqual(timestampFromCommit, timestampFromRead);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should accept the commit timestamp placeholder', done => {
        commitTimestamp(done, Spanner.GOOGLE_STANDARD_SQL);
      });

      it('POSTGRESQL should accept the commit timestamp placeholder', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        commitTimestamp(done, Spanner.POSTGRESQL);
      });
    });

    const incorrectValueType = (done, table) => {
      table.insert({BoolValue: 'abc'}, err => {
        assert(err);
        done();
      });
    };

    it('GOOGLE_STANDARD_SQL should throw an error for incorrect value types', done => {
      incorrectValueType(done, googleSqlTable);
    });

    it('POSTGRESQL should throw an error for incorrect value types', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      incorrectValueType(done, postgreSqlTable);
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
    it('should have created the instance config', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      instanceConfig.get((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual(metadata!.name, instanceConfig.formattedName_);
        done();
      });
    });

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

    it("should get an instanceConfig's metadata using getInstanceConfig", function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      spanner.getInstanceConfig('nam6', (err, instanceConfig) => {
        assert.ifError(err);
        assert(instanceConfig!.displayName);
        done();
      });
    });

    it("should get an instanceConfig's metadata in promise mode using getInstanceConfig", function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      spanner
        .getInstanceConfig('nam6')
        .then(data => {
          const instanceConfig = data[0];
          assert(instanceConfig.displayName);
          done();
        })
        .catch(done);
    });

    it("should get an instanceConfig's metadata using get", function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      spanner
        .instanceConfig('nam6')
        .get()
        .then(data => {
          const instanceConfig = data[0];
          assert(instanceConfig.displayName);
          done();
        })
        .catch(done);
    });

    it("should list an instanceConfig's operations without filter", async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }

      const [operationsWithoutFilter] =
        await spanner.getInstanceConfigOperations();
      const operationForCurrentInstanceConfig = operationsWithoutFilter!.find(
        operation =>
          operation.name &&
          operation.name.includes(instanceConfig.formattedName_)
      );
      assert.ok(operationForCurrentInstanceConfig);
      assert.strictEqual(
        operationForCurrentInstanceConfig!.metadata!.type_url,
        'type.googleapis.com/google.spanner.admin.instance.v1.CreateInstanceConfigMetadata'
      );
    });

    it("should list an instanceConfig's operations with filter", async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }

      const [operationsWithFilter] = await spanner.getInstanceConfigOperations({
        filter: `(metadata.@type:type.googleapis.com/google.spanner.admin.instance.v1.CreateInstanceConfigMetadata) AND
                    (name:${instanceConfig.formattedName_})`,
      });
      const operationForCurrentInstanceConfigWithFilter =
        operationsWithFilter[0];
      assert.ok(operationForCurrentInstanceConfigWithFilter);
      const operationForCurrentInstanceConfigWithFilterMetadata =
        CreateInstanceConfigMetadata.decode(
          operationForCurrentInstanceConfigWithFilter!.metadata!
            .value! as Uint8Array
        );
      assert.strictEqual(
        operationForCurrentInstanceConfigWithFilterMetadata.instanceConfig!
          .name,
        `${instanceConfig.formattedName_}`
      );
    });

    it('should update the instance config metadata', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const newData = {
        instanceConfig: {
          displayName: 'new-display-name-' + shortUUID(),
        },
      };

      instanceConfig.setMetadata(
        newData,
        execAfterOperationComplete(err => {
          assert.ifError(err);

          instanceConfig.get((err, metadata) => {
            assert.ifError(err);
            assert.strictEqual(
              metadata!.displayName,
              newData.instanceConfig.displayName
            );
            done();
          });
        })
      );
    });

    it('should return true for instance config that exist', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const doesExist = await instanceConfig.exists();
      assert.strictEqual(doesExist, true);
    });

    it('should return false for instance configs that do not exist', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const doesExist = await spanner
        .instanceConfig('bad-instance-config')
        .exists();
      assert.strictEqual(doesExist, false);
    });
  });

  describe('Databases', () => {
    const TABLE_NAME = 'SingersTest';
    const autoCreateDatabase = (done, databaseId) => {
      const database = instance.database(generateName(databaseId));

      database.get({autoCreate: true} as GetDatabaseConfig, err => {
        assert.ifError(err);
        RESOURCES_TO_CLEAN.push(database);
        database.getMetadata(done);
      });
    };

    it('GOOGLE_STANDARD_SQL should auto create a database', done => {
      autoCreateDatabase(done, 'database');
    });

    it('POSTGRESQL should auto create a database', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      autoCreateDatabase(done, 'pg-db');
    });

    const createDatabase = (done, database, dialect) => {
      database.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual(metadata!.name, database.formattedName_);
        assert.strictEqual(metadata!.state, 'READY');
        if (IS_EMULATOR_ENABLED) {
          assert.strictEqual(
            metadata!.databaseDialect,
            'DATABASE_DIALECT_UNSPECIFIED'
          );
        } else {
          assert.strictEqual(metadata!.databaseDialect, dialect);
        }
        done();
      });
    };

    it('GOOGLE_STANDARD_SQL should have created the database', done => {
      createDatabase(done, DATABASE, 'GOOGLE_STANDARD_SQL');
    });

    it('POSTGRESQL should have created the database', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      createDatabase(done, PG_DATABASE, 'POSTGRESQL');
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

    const createTable = (done, database, dialect, createTableStatement) => {
      database.updateSchema(
        [createTableStatement],
        execAfterOperationComplete(err => {
          assert.ifError(err);

          function replaceNewLinesAndSpacing(str, dialect) {
            const schema = str.replace(/\n\s*/g, '').replace(/\s+/g, ' ');
            if (dialect === Spanner.GOOGLE_STANDARD_SQL) {
              return schema;
            } else {
              return schema.toLowerCase();
            }
          }

          database.getSchema((err, statements) => {
            assert.ifError(err);
            assert.ok(
              statements!.some(
                s =>
                  replaceNewLinesAndSpacing(s, dialect) ===
                  replaceNewLinesAndSpacing(createTableStatement, dialect)
              )
            );
            done();
          });
        })
      );
    };

    it('GOOGLE_STANDARD_SQL should create a table', done => {
      const createTableStatement = `
        CREATE TABLE ${TABLE_NAME} (
          SingerId INT64 NOT NULL,
          FirstName STRING(1024),
          LastName STRING(1024),
          SingerInfo BYTES(MAX),
        ) PRIMARY KEY(SingerId)`;
      createTable(
        done,
        DATABASE,
        Spanner.GOOGLE_STANDARD_SQL,
        createTableStatement
      );
    });

    it('POSTGRESQL should create a table', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const createTableStatement = `
        CREATE TABLE ${TABLE_NAME} (
          SingerId BIGINT NOT NULL,
          FirstName CHARACTER VARYING,
          LastName CHARACTER VARYING,
          SingerInfo BYTEA,
          PRIMARY KEY(SingerId)
        )`;
      createTable(done, PG_DATABASE, Spanner.POSTGRESQL, createTableStatement);
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

    const listDatabaseOperation = async function (database) {
      // Look up the database full name from the metadata to expand any {{projectId}} tokens.
      const [databaseMetadata] = await database.getMetadata();
      const databaseFullName = databaseMetadata.name;

      // List operations.
      const [databaseOperations] = await database.getOperations();

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
    };

    it('GOOGLE_STANDARD_SQL should list database operations on a database', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      await listDatabaseOperation(DATABASE);
    });

    it('POSTGRESQL should list database operations on a database', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      await listDatabaseOperation(PG_DATABASE);
    });

    describe('FineGrainedAccessControl', () => {
      const createUserDefinedDatabaseRole = (done, database, query) => {
        database.updateSchema(
          [query],
          execAfterOperationComplete(err => {
            assert.ifError(err);
            database.getSchema((err, statements) => {
              assert.ifError(err);
              assert.ok(statements.includes(query));
              done();
            });
          })
        );
      };

      it('GOOGLE_STANDARD_SQL should create a user defined role', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        createUserDefinedDatabaseRole(done, DATABASE, 'CREATE ROLE parent');
      });

      const grantAccessToRole = (
        done,
        database,
        createRoleQuery,
        grantAccessQuery
      ) => {
        database.updateSchema(
          [createRoleQuery],
          execAfterOperationComplete(err => {
            assert.ifError(err);
            database.getSchema((err, statements) => {
              assert.ifError(err);
              assert.ok(statements.includes(createRoleQuery));
              database.updateSchema(
                [grantAccessQuery],
                execAfterOperationComplete(err => {
                  assert.ifError(err);
                  database.getSchema((err, statements) => {
                    assert.ifError(err);
                    assert.ok(statements.includes(grantAccessQuery));
                    done();
                  });
                })
              );
            });
          })
        );
      };

      it('GOOGLE_STANDARD_SQL should grant access to a user defined role', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        grantAccessToRole(
          done,
          DATABASE,
          'CREATE ROLE child',
          'GRANT SELECT ON TABLE Singers TO ROLE child'
        );
      });

      const userDefinedDatabaseRoleRevoked = (
        done,
        database,
        createRoleQuery,
        grantPermissionQuery,
        revokePermissionQuery
      ) => {
        database.updateSchema(
          [createRoleQuery],
          execAfterOperationComplete(err => {
            assert.ifError(err);
            database.getSchema((err, statements) => {
              assert.ifError(err);
              assert.ok(statements.includes(createRoleQuery));
              database.updateSchema(
                [grantPermissionQuery],
                execAfterOperationComplete(err => {
                  assert.ifError(err);
                  database.getSchema((err, statements) => {
                    assert.ifError(err);
                    assert.ok(statements.includes(grantPermissionQuery));
                    database.updateSchema(
                      [revokePermissionQuery],
                      execAfterOperationComplete(err => {
                        assert.ifError(err);
                        database.getSchema((err, statements) => {
                          assert.ifError(err);
                          assert.ok(!statements.includes(grantPermissionQuery));
                          done();
                        });
                      })
                    );
                  });
                })
              );
            });
          })
        );
      };

      it('GOOGLE_STANDARD_SQL should revoke permissions of a user defined role', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        userDefinedDatabaseRoleRevoked(
          done,
          DATABASE,
          'CREATE ROLE orphan',
          'GRANT SELECT ON TABLE Singers TO ROLE orphan',
          'REVOKE SELECT ON TABLE Singers FROM ROLE orphan'
        );
      });

      const userDefinedDatabaseRoleDropped = (
        done,
        database,
        createRoleQuery,
        dropRoleQuery
      ) => {
        database.updateSchema(
          [createRoleQuery],
          execAfterOperationComplete(err => {
            assert.ifError(err);
            database.getSchema((err, statements) => {
              assert.ifError(err);
              assert.ok(statements.includes(createRoleQuery));
              database.updateSchema(
                [dropRoleQuery],
                execAfterOperationComplete(err => {
                  assert.ifError(err);
                  database.getSchema((err, statements) => {
                    assert.ifError(err);
                    assert.ok(!statements.includes(createRoleQuery));
                    done();
                  });
                })
              );
            });
          })
        );
      };

      it('GOOGLE_STANDARD_SQL should drop the user defined role', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        userDefinedDatabaseRoleDropped(
          done,
          DATABASE,
          'CREATE ROLE new_parent',
          'DROP ROLE new_parent'
        );
      });

      const grantAccessSuccess = (done, database) => {
        const id = 7;
        database.updateSchema(
          [
            'CREATE ROLE read_access',
            'GRANT SELECT ON TABLE Singers TO ROLE read_access',
          ],
          execAfterOperationComplete(async err => {
            assert.ifError(err);
            const table = database.table('Singers');
            table.insert(
              {
                SingerId: id,
              },
              err => {
                assert.ifError(err);
                const dbReadRole = instance.database(database.formattedName_, {
                  databaseRole: 'read_access',
                });
                const query = {
                  sql: 'SELECT SingerId, Name FROM Singers',
                };
                dbReadRole.run(query, (err, rows) => {
                  assert.ifError(err);
                  assert.ok(rows.length > 0);
                  table.deleteRows([id]);
                  done();
                });
              }
            );
          })
        );
      };

      it('GOOGLE_STANDARD_SQL should run query with access granted', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        grantAccessSuccess(done, DATABASE);
      });

      const grantAccessFailure = (done, database) => {
        const id = 8;
        database.updateSchema(
          [
            'CREATE ROLE write_access',
            'GRANT INSERT ON TABLE Singers TO ROLE write_access',
          ],
          execAfterOperationComplete(async err => {
            assert.ifError(err);
            const table = database.table('Singers');
            table.insert(
              {
                SingerId: id,
              },
              err => {
                assert.ifError(err);
                const dbReadRole = instance.database(database.formattedName_, {
                  databaseRole: 'write_access',
                });
                const query = {
                  sql: 'SELECT SingerId, Name FROM Singers',
                };
                dbReadRole.run(query, err => {
                  assert(err);
                  table.deleteRows([id]);
                  done();
                });
              }
            );
          })
        );
      };

      it('GOOGLE_STANDARD_SQL should fail run query due to no access granted', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        grantAccessFailure(done, DATABASE);
      });

      const listDatabaseRoles = async database => {
        const [updateRole] = await database.updateSchema([
          'CREATE ROLE new_parent',
        ]);
        await updateRole.promise();

        const [databaseRoles] = await database.getDatabaseRoles();
        assert.ok(databaseRoles.length > 0);
        assert.ok(
          databaseRoles.find(
            role =>
              role.name ===
              database.formattedName_ + '/databaseRoles/new_parent'
          )
        );
      };

      it('GOOGLE_STANDARD_SQL should list database roles', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await listDatabaseRoles(DATABASE);
      });

      const getIamPolicy = (done, database) => {
        database.getIamPolicy((err, policy) => {
          assert.ifError(err);
          assert.strictEqual(policy!.version, 0);
          assert.deepStrictEqual(policy!.bindings, []);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should get IAM Policy', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        getIamPolicy(done, DATABASE);
      });

      it('POSTGRESQL should should get IAM Policy', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        getIamPolicy(done, PG_DATABASE);
      });

      const setIamPolicy = async database => {
        const newBinding = {
          role: 'roles/spanner.fineGrainedAccessUser',
          members: [`user:${IAM_MEMBER}`],
          condition: {
            title: 'new condition',
            expression: 'resource.name.endsWith("/databaseRoles/parent")',
          },
        };
        const policy = {
          bindings: [newBinding],
          version: 3,
        };
        await database.setIamPolicy({policy: policy}, (err, policy) => {
          assert.ifError(err);
          assert.strictEqual(policy.version, 3);
          assert.deepStrictEqual(policy.bindings, newBinding);
        });
      };

      it('GOOGLE_STANDARD_SQL should get IAM Policy', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await setIamPolicy(DATABASE);
      });

      it('POSTGRESQL should should get IAM Policy', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await setIamPolicy(PG_DATABASE);
      });
    });
  });

  describe('Backups', () => {
    const SKIP_POSTGRESQL_BACKUP_TESTS = true;

    let googleSqlDatabase1: Database;
    let googleSqlDatabase2: Database;
    let googleSqlRestoreDatabase: Database;

    let postgreSqlDatabase1: Database;
    let postgreSqlDatabase2: Database;
    let postgreSqlRestoreDatabase: Database;

    let googleSqlBackup1: Backup;
    let googleSqlBackup2: Backup;

    let postgreSqlBackup1: Backup;
    let postgreSqlBackup2: Backup;

    const googleSqlBackup1Name = generateName('backup');
    const googleSqlBackup2Name = generateName('backup');

    const postgreSqlBackup1Name = generateName('pg-backup');
    const postgreSqlBackup2Name = generateName('pg-backup');

    const backupExpiryDate = futureDateByHours(12);
    const backupExpiryPreciseDate = Spanner.timestamp(backupExpiryDate);

    before(async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      if (SKIP_BACKUPS === 'true') {
        this.skip();
      }
      googleSqlDatabase1 = DATABASE;
      postgreSqlDatabase1 = PG_DATABASE;

      await googleSqlDatabase1.table(TABLE_NAME).insert({
        SingerId: generateName('id'),
        Name: generateName('name'),
      });

      await postgreSqlDatabase1.table(TABLE_NAME).insert({
        SingerId: generateName('id'),
        Name: generateName('name'),
      });

      // Create a second database since only one pending backup can be created
      // per database.
      googleSqlDatabase2 = instance.database(generateName('database'));
      const [, googleSqlDatabase2CreateOperation] =
        await googleSqlDatabase2.create({
          schema: `
        CREATE TABLE Albums (
          AlbumId STRING(1024) NOT NULL,
          AlbumTitle STRING(1024) NOT NULL,
          ) PRIMARY KEY(AlbumId)`,
          gaxOptions: GAX_OPTIONS,
        });
      await googleSqlDatabase2CreateOperation.promise();
      RESOURCES_TO_CLEAN.push(googleSqlDatabase2);

      if (!SKIP_POSTGRESQL_BACKUP_TESTS) {
        postgreSqlDatabase2 = instance.database(generateName('pg-db'));
        const [, postgreSqlDatabase2CreateOperation] =
          await postgreSqlDatabase2.create({
            databaseDialect: Spanner.POSTGRESQL,
            gaxOptions: GAX_OPTIONS,
          });
        await postgreSqlDatabase2CreateOperation.promise();

        const schema = [
          `CREATE TABLE Albums (
            AlbumId VARCHAR NOT NULL PRIMARY KEY,
            AlbumTitle VARCHAR NOT NULL
        );`,
        ];
        const [postgreSqlDatabase2UpdateOperation] =
          await postgreSqlDatabase2.updateSchema(schema);
        await postgreSqlDatabase2UpdateOperation.promise();
        RESOURCES_TO_CLEAN.push(postgreSqlDatabase2);
      }
      // Initialize a database instance to restore to.
      googleSqlRestoreDatabase = instance.database(generateName('database'));
      postgreSqlRestoreDatabase = instance.database(generateName('pg-db'));

      // Create backups.
      googleSqlBackup1 = instance.backup(googleSqlBackup1Name);
      googleSqlBackup2 = instance.backup(googleSqlBackup2Name);
      const [, googleSqlBackup1Operation] = await googleSqlBackup1.create({
        databasePath: googleSqlDatabase1.formattedName_,
        expireTime: backupExpiryDate,
        gaxOptions: GAX_OPTIONS,
      });
      const [, googleSqlBackup2Operation] = await googleSqlBackup2.create({
        databasePath: googleSqlDatabase2.formattedName_,
        expireTime: backupExpiryDate,
        gaxOptions: GAX_OPTIONS,
      });

      if ('database' in googleSqlBackup1Operation.metadata) {
        assert.strictEqual(
          googleSqlBackup1Operation.metadata!.name,
          `${instance.formattedName_}/backups/${googleSqlBackup1Name}`
        );
      }

      if ('database' in googleSqlBackup1Operation.metadata) {
        assert.strictEqual(
          googleSqlBackup1Operation.metadata!.database,
          googleSqlDatabase1.formattedName_
        );
      }

      if ('database' in googleSqlBackup2Operation.metadata) {
        assert.strictEqual(
          googleSqlBackup2Operation.metadata!.name,
          `${instance.formattedName_}/backups/${googleSqlBackup2Name}`
        );
      }
      if ('database' in googleSqlBackup2Operation.metadata) {
        assert.strictEqual(
          googleSqlBackup2Operation.metadata!.database,
          googleSqlDatabase2.formattedName_
        );
      }

      // Wait for backups to finish.
      await googleSqlBackup1Operation.promise();
      await googleSqlBackup2Operation.promise();
      RESOURCES_TO_CLEAN.push(...[googleSqlBackup1, googleSqlBackup2]);

      if (!SKIP_POSTGRESQL_BACKUP_TESTS) {
        postgreSqlBackup1 = instance.backup(postgreSqlBackup1Name);
        postgreSqlBackup2 = instance.backup(postgreSqlBackup2Name);
        const [, postgreSqlBackup1Operation] = await postgreSqlBackup1.create({
          databasePath: postgreSqlDatabase1.formattedName_,
          expireTime: backupExpiryDate,
          gaxOptions: GAX_OPTIONS,
        });
        const [, postgreSqlBackup2Operation] = await postgreSqlBackup2.create({
          databasePath: postgreSqlDatabase2.formattedName_,
          expireTime: backupExpiryDate,
          gaxOptions: GAX_OPTIONS,
        });

        if ('database' in postgreSqlBackup1Operation.metadata) {
          assert.strictEqual(
            postgreSqlBackup1Operation.metadata!.name,
            `${instance.formattedName_}/backups/${postgreSqlBackup1Name}`
          );
        }
        if ('database' in postgreSqlBackup1Operation.metadata) {
          assert.strictEqual(
            postgreSqlBackup1Operation.metadata!.database,
            postgreSqlDatabase1.formattedName_
          );
        }
        if ('database' in postgreSqlBackup2Operation.metadata) {
          assert.strictEqual(
            postgreSqlBackup2Operation.metadata!.name,
            `${instance.formattedName_}/backups/${postgreSqlBackup2Name}`
          );
        }
        if ('database' in postgreSqlBackup2Operation.metadata) {
          assert.strictEqual(
            postgreSqlBackup2Operation.metadata!.database,
            postgreSqlDatabase2.formattedName_
          );
        }

        // Wait for backups to finish.
        await postgreSqlBackup1Operation.promise();
        await postgreSqlBackup2Operation.promise();

        RESOURCES_TO_CLEAN.push(...[postgreSqlBackup1, postgreSqlBackup2]);
      }
    });

    function futureDateByHours(futureHours: number): number {
      return Date.now() + 1000 * 60 * 60 * futureHours;
    }

    const completedBackup = async (backup1, backup1Name, database1) => {
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
    };

    it('GOOGLE_STANDARD_SQL should have completed a backup', async () => {
      await completedBackup(
        googleSqlBackup1,
        googleSqlBackup1Name,
        googleSqlDatabase1
      );
    });

    it.skip('POSTGRESQL should have completed a backup', async () => {
      await completedBackup(
        postgreSqlBackup1,
        postgreSqlBackup1Name,
        postgreSqlDatabase1
      );
    });

    const pastBackupExpirationTimeError = async database1 => {
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
        assert.strictEqual(
          (err as grpc.ServiceError).code,
          grpc.status.INVALID_ARGUMENT
        );
      }
    };

    it('GOOGLE_STANDARD_SQL should return error for backup expiration time in the past', async () => {
      await pastBackupExpirationTimeError(googleSqlDatabase1);
    });

    it.skip('POSTGRESQL should return error for backup expiration time in the past', async () => {
      await pastBackupExpirationTimeError(postgreSqlDatabase1);
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
        backups.find(
          backup => backup.formattedName_ === googleSqlBackup1.formattedName_
        )
      );
      if (!IS_EMULATOR_ENABLED && !SKIP_POSTGRESQL_BACKUP_TESTS) {
        assert.ok(
          backups.find(
            backup => backup.formattedName_ === postgreSqlBackup1.formattedName_
          )
        );
      }
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

      let page3size = 2;
      if (!IS_EMULATOR_ENABLED && !SKIP_POSTGRESQL_BACKUP_TESTS) {
        page3size = 4;
      }
      const [page3] = await instance.getBackups({
        pageSize: page3size,
        gaxOptions: {autoPaginate: false},
      });
      assert.strictEqual(page1.length, 1);
      assert.strictEqual(page2.length, 1);
      assert.strictEqual(page3.length, page3size);
      assert.notStrictEqual(page2[0].formattedName_, page1[0].formattedName_);
      assert.ok(
        page3.find(
          backup => backup.formattedName_ === googleSqlBackup1.formattedName_
        )
      );
      assert.ok(
        page3.find(
          backup => backup.formattedName_ === googleSqlBackup2.formattedName_
        )
      );
      if (!IS_EMULATOR_ENABLED && !SKIP_POSTGRESQL_BACKUP_TESTS) {
        assert.ok(
          page3.find(
            backup => backup.formattedName_ === postgreSqlBackup1.formattedName_
          )
        );
        assert.ok(
          page3.find(
            backup => backup.formattedName_ === postgreSqlBackup2.formattedName_
          )
        );
      }
    });

    const restoreBackup = async (restoreDatabase, backup1, database1) => {
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
    };

    it('GOOGLE_STANDARD_SQL should restore a backup', async () => {
      await restoreBackup(
        googleSqlRestoreDatabase,
        googleSqlBackup1,
        googleSqlDatabase1
      );
    });

    it.skip('POSTGRESQL should restore a backup', async () => {
      await restoreBackup(
        postgreSqlRestoreDatabase,
        postgreSqlBackup1,
        postgreSqlDatabase1
      );
    });

    const restoreExistingDatabaseFail = async (database1, backup1) => {
      // Perform restore to the same database - should fail.
      try {
        await database1.restore(backup1.formattedName_);
        assert.fail('Should not have restored backup over existing database');
      } catch (err) {
        // Expect to get error indicating database already exists.
        assert.strictEqual(
          (err as grpc.ServiceError).code,
          grpc.status.ALREADY_EXISTS
        );
      }
    };

    it('GOOGLE_STANDARD_SQL should not be able to restore to an existing database', async () => {
      await restoreExistingDatabaseFail(
        googleSqlRestoreDatabase,
        googleSqlBackup1
      );
    });

    it.skip('POSTGRESQL should not be able to restore to an existing database', async () => {
      await restoreExistingDatabaseFail(
        postgreSqlRestoreDatabase,
        postgreSqlBackup1
      );
    });

    const updateBackupExpiry = async backup1 => {
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
    };

    it('GOOGLE_STANDARD_SQL should update backup expiry', async () => {
      await updateBackupExpiry(googleSqlBackup1);
    });

    it.skip('POSTGRESQL should update backup expiry', async () => {
      await updateBackupExpiry(postgreSqlBackup1);
    });

    const pastBackupUpdateExpiryDateFail = async backup1 => {
      // Attempt to update expiry date to the past.
      const expiryDateInPast = futureDateByHours(-24);
      try {
        await backup1.updateExpireTime(expiryDateInPast);
        assert.fail(
          'Backup should have failed for expiration time in the past'
        );
      } catch (err) {
        // Expect to get invalid argument error indicating the expiry date.
        assert.strictEqual(
          (err as grpc.ServiceError).code,
          grpc.status.INVALID_ARGUMENT
        );
      }
    };

    it('GOOGLE_STANDARD_SQL should not update backup expiry to the past', async () => {
      await pastBackupUpdateExpiryDateFail(googleSqlBackup1);
    });

    it.skip('POSTGRESQL should not update backup expiry to the past', async () => {
      await pastBackupUpdateExpiryDateFail(postgreSqlBackup1);
    });

    const deleteBackup = async backup2 => {
      // Delete backup.
      await backup2.delete();

      // Verify backup is gone by querying metadata.
      // Expect backup not to be found.
      try {
        const [deletedMetadata] = await backup2.getMetadata();
        assert.fail('Backup was not deleted: ' + deletedMetadata.name);
      } catch (err) {
        assert.strictEqual(
          (err as grpc.ServiceError).code,
          grpc.status.NOT_FOUND
        );
      }
    };

    it('GOOGLE_STANDARD_SQL should delete backup', async () => {
      await deleteBackup(googleSqlBackup2);
    });

    it.skip('POSTGRESQL should delete backup', async () => {
      await deleteBackup(postgreSqlBackup2);
    });

    const listBackupOperations = async (backup1, database1) => {
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
      const operationForCurrentBackupWithFilterMetadata =
        CreateBackupMetadata.decode(
          operationForCurrentBackupWithFilter!.metadata!.value! as Uint8Array
        );
      assert.strictEqual(
        operationForCurrentBackupWithFilterMetadata.database,
        database1.formattedName_
      );
    };

    it('GOOGLE_STANDARD_SQL should delete backup', async () => {
      await listBackupOperations(googleSqlBackup1, googleSqlDatabase1);
    });

    it.skip('POSTGRESQL should delete backup', async () => {
      await listBackupOperations(postgreSqlBackup1, postgreSqlDatabase1);
    });
  });

  describe('Sessions', () => {
    const session = DATABASE.session();

    const dbNewRole = instance.database(DATABASE.formattedName_, {
      databaseRole: 'parent_role',
    });

    const sessionWithDatabaseRole = dbNewRole.session();
    let sessionWithRole: Session;
    let sessionWithOverridingRole: Session;

    before(async () => {
      await session.create();
      if (!IS_EMULATOR_ENABLED) {
        const [operation] = await DATABASE.updateSchema([
          'CREATE ROLE parent_role',
          'CREATE ROLE child_role',
          'CREATE ROLE orphan_role',
        ]);
        await operation.promise();
        await sessionWithDatabaseRole.create();
        [sessionWithRole] = await DATABASE.createSession({
          databaseRole: 'child_role',
        });
        [sessionWithOverridingRole] = await dbNewRole.createSession({
          databaseRole: 'orphan_role',
        });
      }
    });

    after(async () => {
      await session.delete();
      if (!IS_EMULATOR_ENABLED) {
        await sessionWithDatabaseRole.delete();
        await sessionWithRole.delete();
      }
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

    it('should have created the session with database database role', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      sessionWithDatabaseRole.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual('parent_role', metadata!.databaseRole);
        done();
      });
    });

    it('should have created the session with database role', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      sessionWithRole.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual('child_role', metadata!.databaseRole);
        done();
      });
    });

    it('should have created the session by overriding database database role', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      sessionWithOverridingRole.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual('orphan_role', metadata!.databaseRole);
        done();
      });
    });

    it('should batch create sessions with database role', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const count = 5;
      const [sessions] = await dbNewRole.batchCreateSessions({count});

      assert.strictEqual(sessions.length, count);
      sessions.forEach(session =>
        session.getMetadata((err, metadata) => {
          assert.ifError(err);
          assert.strictEqual('parent_role', metadata?.databaseRole);
        })
      );
      await Promise.all(sessions.map(session => session.delete()));
    });

    it('should batch create sessions with database role', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const count = 5;
      const [sessions] = await DATABASE.batchCreateSessions({
        count,
        databaseRole: 'child_role',
      });

      assert.strictEqual(sessions.length, count);
      sessions.forEach(session =>
        session.getMetadata((err, metadata) => {
          assert.ifError(err);
          assert.strictEqual('child_role', metadata?.databaseRole);
        })
      );
      await Promise.all(sessions.map(session => session.delete()));
    });

    it('should batch create sessions with database role by overriding database database role', async function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const count = 5;
      const [sessions] = await dbNewRole.batchCreateSessions({
        count,
        databaseRole: 'orphan_role',
      });

      assert.strictEqual(sessions.length, count);
      sessions.forEach(session =>
        session.getMetadata((err, metadata) => {
          assert.ifError(err);
          assert.strictEqual('orphan_role', metadata?.databaseRole);
        })
      );
      await Promise.all(sessions.map(session => session.delete()));
    });
  });

  describe('Tables', () => {
    const TABLE_NAME = 'SingersTables';
    const googleSqlTable = DATABASE.table(TABLE_NAME);
    const postgreSqlTable = PG_DATABASE.table(TABLE_NAME);

    before(async () => {
      const googleSqlCreateTable = await googleSqlTable.create(
        `CREATE TABLE ${TABLE_NAME}
                (
                  SingerId     STRING(1024) NOT NULL,
                  Name         STRING(1024),
                  Float        FLOAT64,
                  Int          INT64,
                  Info         BYTES( MAX),
                  Created      TIMESTAMP,
                  DOB          DATE,
                  Accents      ARRAY<STRING(1024)>,
                  PhoneNumbers ARRAY<INT64>,
                  HasGear      BOOL,
                ) PRIMARY KEY(SingerId)`,
        GAX_OPTIONS
      );
      await onPromiseOperationComplete(googleSqlCreateTable);

      if (!IS_EMULATOR_ENABLED) {
        const postgreSqlCreateTable = await postgreSqlTable.create(
          `CREATE TABLE ${TABLE_NAME}
              (
                "SingerId" VARCHAR(1024) NOT NULL PRIMARY KEY,
                "Name"     VARCHAR(1024),
                "Float"    DOUBLE PRECISION,
                "Int"      BIGINT,
                "Info"     BYTEA,
                "Created"  TIMESTAMPTZ,
                "HasGear"  BOOL
              )`,
          GAX_OPTIONS
        );
        await onPromiseOperationComplete(postgreSqlCreateTable);
      }
    });

    const nonExistentTable = (done, database) => {
      const table = database.table(generateName('nope'));

      table.insert(
        {
          SingerId: generateName('id'),
        },
        err => {
          assert.strictEqual(err!.code, 5);
          done();
        }
      );
    };

    it('GOOGLE_STANDARD_SQL should throw an error for non-existent tables', done => {
      nonExistentTable(done, DATABASE);
    });

    it('POSTGRESQL should throw an error for non-existent tables', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      nonExistentTable(done, PG_DATABASE);
    });

    const nonExistentColumn = (done, table) => {
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
    };

    it('GOOGLE_STANDARD_SQL should throw an error for non-existent columns', done => {
      nonExistentColumn(done, googleSqlTable);
    });

    it('POSTGRESQL should throw an error for non-existent columns', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      nonExistentColumn(done, postgreSqlTable);
    });

    const readRowsStream = (done, table) => {
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
              columns: ['SingerId', 'Name'],
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
    };

    it('GOOGLE_STANDARD_SQL should read rows as a stream', done => {
      readRowsStream(done, googleSqlTable);
    });

    it('POSTGRESQL should read rows as a stream', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      readRowsStream(done, postgreSqlTable);
    });

    const automaticallyConvertToJson = (done, table) => {
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
    };

    it('GOOGLE_STANDARD_SQL should automatically convert to JSON', done => {
      automaticallyConvertToJson(done, googleSqlTable);
    });

    it('POSTGRESQL should automatically convert to JSON', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      automaticallyConvertToJson(done, postgreSqlTable);
    });

    const automaticallyConvertToJsonWithOptions = (done, table) => {
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
    };

    it('GOOGLE_STANDARD_SQL should automatically convert to JSON with options', done => {
      automaticallyConvertToJsonWithOptions(done, googleSqlTable);
    });

    it('POSTGRESQL should automatically convert to JSON with options', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      automaticallyConvertToJsonWithOptions(done, postgreSqlTable);
    });

    const insertAndDeleteSingleRow = (done, table) => {
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
    };

    it('GOOGLE_STANDARD_SQL should insert and delete a row', done => {
      insertAndDeleteSingleRow(done, googleSqlTable);
    });

    it('POSTGRESQL should insert and delete a row', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      insertAndDeleteSingleRow(done, postgreSqlTable);
    });

    const insertAndDeleteMultipleRows = (done, table) => {
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
    };

    it('GOOGLE_STANDARD_SQL should insert and delete multiple rows', done => {
      insertAndDeleteMultipleRows(done, googleSqlTable);
    });

    it('POSTGRESQL should insert and delete multiple rows', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      insertAndDeleteMultipleRows(done, postgreSqlTable);
    });

    const insertAndDeleteMultipleCompositeKeyRows = (
      database,
      createTableStatement
    ) => {
      const id1 = 1;
      const name1 = generateName('name1');

      const id2 = 2;
      const name2 = generateName('name2');

      const table = database.table('SingersComposite');

      const keys = [
        [id1, name1],
        [id2, name2],
      ] as {} as string[];

      return table
        .create(createTableStatement)
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
    };

    it('GOOGLE_STANDARD_SQL should insert and delete composite key rows', () => {
      const createTableStatement = `
          CREATE TABLE SingersComposite (
            SingerId INT64 NOT NULL,
            Name STRING(1024),
          ) PRIMARY KEY(SingerId, Name)
          `;
      insertAndDeleteMultipleCompositeKeyRows(DATABASE, createTableStatement);
    });

    it('POSTGRESQL should insert and delete multiple composite key rows', function () {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      const createTableStatement = `
          CREATE TABLE SingersComposite (
            "SingerId" BIGINT NOT NULL,
            "Name" VARCHAR(1024),
            PRIMARY KEY("SingerId", "Name")
          )`;
      insertAndDeleteMultipleCompositeKeyRows(
        PG_DATABASE,
        createTableStatement
      );
    });

    const insertAndQueryMultipleRows = (done, database, table, query) => {
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

          database.run(query, (err, rows) => {
            assert.ifError(err);

            // We just want the two most recent ones.
            rows!.splice(0, rows!.length - 2);

            const rowJson = rows!.map(x => x.toJSON());

            assert.strictEqual(rowJson[0].SingerId, id1);
            assert.strictEqual(rowJson[0].Name, name1);

            assert.strictEqual(rowJson[1].SingerId, id2);
            assert.strictEqual(rowJson[1].Name, name2);

            done();
          });
        }
      );
    };

    it('GOOGLE_STANDARD_SQL should insert and query multiple rows', done => {
      insertAndQueryMultipleRows(
        done,
        DATABASE,
        googleSqlTable,
        `SELECT * FROM ${TABLE_NAME} ORDER BY SingerId`
      );
    });

    it('POSTGRESQL should should insert and query multiple rows', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      insertAndQueryMultipleRows(
        done,
        PG_DATABASE,
        postgreSqlTable,
        `SELECT * FROM ${TABLE_NAME} ORDER BY "SingerId"`
      );
    });

    const insertThenReplaceRow = (done, table) => {
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
    };

    it('GOOGLE_STANDARD_SQL should insert then replace a row', done => {
      insertThenReplaceRow(done, googleSqlTable);
    });

    it('POSTGRESQL should insert then replace a row', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      insertThenReplaceRow(done, postgreSqlTable);
    });

    const insertThenUpdateRow = (done, table) => {
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
    };

    it('GOOGLE_STANDARD_SQL should insert then replace a row', done => {
      insertThenUpdateRow(done, googleSqlTable);
    });

    it('POSTGRESQL should insert then replace a row', function (done) {
      if (IS_EMULATOR_ENABLED) {
        this.skip();
      }
      insertThenUpdateRow(done, postgreSqlTable);
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

      const GOOGLE_SQL_INSERT_ROW = {
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

      const POSTGRESQL_INSERT_ROW = {
        SingerId: ID,
        Name: NAME,
        Float: FLOAT,
        Int: INT,
        Info: INFO,
        Created: CREATED,
        HasGear: HAS_GEAR,
      };

      const GOOGLE_SQL_EXPECTED_ROW = extend(true, {}, GOOGLE_SQL_INSERT_ROW);
      const POSTGRESQL_EXPECTED_ROW = extend(true, {}, POSTGRESQL_INSERT_ROW);

      before(() => {
        return googleSqlTable.insert(GOOGLE_SQL_INSERT_ROW).then(() => {
          postgreSqlTable.insert(POSTGRESQL_INSERT_ROW);
        });
      });

      const queryCallbackMode = (done, database, query, EXPECTED_ROW) => {
        const options = {
          strong: true,
        };

        database.run(query, options, (err, rows) => {
          assert.ifError(err);
          assert.deepStrictEqual(rows!.shift()!.toJSON(), EXPECTED_ROW);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should query in callback mode', done => {
        const query = {
          sql: `SELECT * FROM ${TABLE_NAME} WHERE SingerId=@id`,
          params: {id: ID},
        };
        queryCallbackMode(done, DATABASE, query, GOOGLE_SQL_EXPECTED_ROW);
      });

      it('POSTGRESQL should query in callback mode', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const query = {
          sql: `SELECT * FROM ${TABLE_NAME} WHERE "SingerId"=$1`,
          params: {p1: ID},
        };
        queryCallbackMode(done, PG_DATABASE, query, POSTGRESQL_EXPECTED_ROW);
      });

      const queryPromiseMode = (done, database, query, EXPECTED_ROW) => {
        const options = {
          strong: true,
        };

        database
          .run(query, options)
          .then(data => {
            const rows = data[0] as {} as Row[];
            assert.deepStrictEqual(rows!.shift()!.toJSON(), EXPECTED_ROW);
            done();
          })
          .catch(done);
      };

      it('GOOGLE_STANDARD_SQL should query in promise mode', done => {
        const query = {
          sql: `SELECT * FROM ${TABLE_NAME} WHERE SingerId=@id`,
          params: {id: ID},
        };
        queryPromiseMode(done, DATABASE, query, GOOGLE_SQL_EXPECTED_ROW);
      });

      it('POSTGRESQL should query in promise mode', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const query = {
          sql: `SELECT * FROM ${TABLE_NAME} WHERE "SingerId"=$1`,
          params: {p1: ID},
        };
        queryPromiseMode(done, PG_DATABASE, query, POSTGRESQL_EXPECTED_ROW);
      });

      const queryStreamMode = (done, database, query, EXPECTED_ROW) => {
        const options = {
          strong: true,
        };
        let row;

        const stream = database
          .runStream(query, options)
          .on('error', done)
          .once('data', row_ => {
            row = row_;
            stream.end();
          })
          .on('end', () => {
            assert.deepStrictEqual(row.toJSON(), EXPECTED_ROW);
            done();
          });
      };

      it('GOOGLE_STANDARD_SQL should query in stream mode', done => {
        const query = {
          sql: `SELECT * FROM ${TABLE_NAME} WHERE SingerId=@id`,
          params: {id: ID},
        };
        queryStreamMode(done, DATABASE, query, GOOGLE_SQL_EXPECTED_ROW);
      });

      it('POSTGRESQL should query in stream mode', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const query = {
          sql: `SELECT * FROM ${TABLE_NAME} WHERE "SingerId"=$1`,
          params: {p1: ID},
        };
        queryStreamMode(done, PG_DATABASE, query, POSTGRESQL_EXPECTED_ROW);
      });

      it('GOOGLE_STANDARD_SQL should allow "SELECT 1" queries', done => {
        DATABASE.run('SELECT 1', done);
      });

      it('POSTGRESQL should allow "SELECT 1" queries', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        PG_DATABASE.run('SELECT 1', done);
      });

      it('GOOGLE_STANDARD_SQL should return metadata', async () => {
        const [rows, , metadata] = await DATABASE.run({
          sql: `SELECT * FROM ${TABLE_NAME} WHERE SingerId=@id`,
          params: {id: ID},
        });
        assert.strictEqual(rows.length, 1);
        assert.deepStrictEqual(rows[0].toJSON(), GOOGLE_SQL_EXPECTED_ROW);
        assert.ok(metadata);
        assert.strictEqual(metadata.rowType!.fields!.length, 10);
        assert.strictEqual(metadata.rowType!.fields![0].name, 'SingerId');
        assert.strictEqual(metadata.rowType!.fields![1].name, 'Name');
        assert.strictEqual(metadata.rowType!.fields![2].name, 'Float');
        assert.strictEqual(metadata.rowType!.fields![3].name, 'Int');
        assert.strictEqual(metadata.rowType!.fields![4].name, 'Info');
        assert.strictEqual(metadata.rowType!.fields![5].name, 'Created');
        assert.strictEqual(metadata.rowType!.fields![6].name, 'DOB');
        assert.strictEqual(metadata.rowType!.fields![7].name, 'Accents');
        assert.strictEqual(metadata.rowType!.fields![8].name, 'PhoneNumbers');
        assert.strictEqual(metadata.rowType!.fields![9].name, 'HasGear');
      });

      it('POSTGRESQL should return metadata', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const [rows, , metadata] = await PG_DATABASE.run({
          sql: `SELECT * FROM ${TABLE_NAME} WHERE "SingerId"=$1`,
          params: {p1: ID},
        });
        assert.strictEqual(rows.length, 1);
        assert.deepStrictEqual(rows[0].toJSON(), POSTGRESQL_EXPECTED_ROW);
        assert.ok(metadata);
        assert.strictEqual(metadata.rowType!.fields!.length, 7);
        assert.strictEqual(metadata.rowType!.fields![0].name, 'SingerId');
        assert.strictEqual(metadata.rowType!.fields![1].name, 'Name');
        assert.strictEqual(metadata.rowType!.fields![2].name, 'Float');
        assert.strictEqual(metadata.rowType!.fields![3].name, 'Int');
        assert.strictEqual(metadata.rowType!.fields![4].name, 'Info');
        assert.strictEqual(metadata.rowType!.fields![5].name, 'Created');
        assert.strictEqual(metadata.rowType!.fields![6].name, 'HasGear');
      });

      const invalidQueries = (done, database) => {
        database.run('SELECT Apples AND Oranges', err => {
          assert.strictEqual(err!.code, 3);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should allow "SELECT 1" queries', done => {
        invalidQueries(done, DATABASE);
      });

      it('POSTGRESQL should allow "SELECT 1" queries', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        invalidQueries(done, PG_DATABASE);
      });

      it('GOOGLE_STANDARD_SQL should query an array of structs', done => {
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

      it('GOOGLE_STANDARD_SQL should query an empty array of structs', done => {
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
          const booleanQuery = (done, database, query, value) => {
            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, value);
              done();
            });
          };

          it('GOOGLE_STANDARD_SQL should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: true,
              },
            };
            booleanQuery(done, DATABASE, query, true);
          });

          it('POSTGRESQL should bind the value', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: true,
              },
            };
            booleanQuery(done, PG_DATABASE, query, true);
          });

          it('GOOGLE_STANDARD_SQL should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'bool',
              },
            };
            booleanQuery(done, DATABASE, query, null);
          });

          it('POSTGRESQL should allow for null values', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: null,
              },
              types: {
                p1: 'bool',
              },
            };
            booleanQuery(done, PG_DATABASE, query, null);
          });

          it('GOOGLE_STANDARD_SQL should bind arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind empty arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null arrays', done => {
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
          const int64Query = (done, database, query, value) => {
            database.run(query, (err, rows) => {
              assert.ifError(err);
              let queriedValue = rows[0][0].value;
              if (rows[0][0].value) {
                queriedValue = rows[0][0].value.value;
              }
              assert.strictEqual(queriedValue, value);
              done();
            });
          };

          it('GOOGLE_STANDARD_SQL should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 1234,
              },
            };
            int64Query(done, DATABASE, query, '1234');
          });

          it('POSTGRESQL should bind the value', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: 1234,
              },
            };
            int64Query(done, PG_DATABASE, query, '1234');
          });

          it('GOOGLE_STANDARD_SQL should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'int64',
              },
            };
            int64Query(done, DATABASE, query, null);
          });

          it('POSTGRESQL should allow for null values', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: null,
              },
              types: {
                p1: 'int64',
              },
            };
            int64Query(done, PG_DATABASE, query, null);
          });

          it('GOOGLE_STANDARD_SQL should bind arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind empty arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null arrays', done => {
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
          const float64Query = (done, database, query, value) => {
            database.run(query, (err, rows) => {
              assert.ifError(err);
              let queriedValue = rows[0][0].value;
              if (rows[0][0].value) {
                queriedValue = rows[0][0].value.value;
              }
              assert.strictEqual(queriedValue, value);
              done();
            });
          };

          it('GOOGLE_STANDARD_SQL should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 2.2,
              },
            };
            float64Query(done, DATABASE, query, 2.2);
          });

          it('POSTGRESQL should bind the value', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: 2.2,
              },
            };
            float64Query(done, PG_DATABASE, query, 2.2);
          });

          it('GOOGLE_STANDARD_SQL should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'float64',
              },
            };
            float64Query(done, DATABASE, query, null);
          });

          it('POSTGRESQL should allow for null values', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: null,
              },
              types: {
                p1: 'float64',
              },
            };
            float64Query(done, PG_DATABASE, query, null);
          });

          it('GOOGLE_STANDARD_SQL should bind arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind empty arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind Infinity', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: Infinity,
              },
            };
            float64Query(done, DATABASE, query, 'Infinity');
          });

          it('POSTGRESQL should bind Infinity', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: Infinity,
              },
            };
            float64Query(done, PG_DATABASE, query, 'Infinity');
          });

          it('GOOGLE_STANDARD_SQL should bind -Infinity', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: -Infinity,
              },
            };
            float64Query(done, DATABASE, query, '-Infinity');
          });

          it('POSTGRESQL should bind -Infinity', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: -Infinity,
              },
            };
            float64Query(done, PG_DATABASE, query, '-Infinity');
          });

          it('GOOGLE_STANDARD_SQL should bind NaN', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: NaN,
              },
            };
            float64Query(done, DATABASE, query, 'NaN');
          });

          it('POSTGRESQL should bind NaN', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: NaN,
              },
            };
            float64Query(done, PG_DATABASE, query, 'NaN');
          });

          it('GOOGLE_STANDARD_SQL should bind an array of Infinity and NaN', done => {
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
          const stringQuery = (done, database, query, value) => {
            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, value);
              done();
            });
          };

          it('GOOGLE_STANDARD_SQL should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 'abc',
              },
            };
            stringQuery(done, DATABASE, query, 'abc');
          });

          it('POSTGRESQL should bind the value', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: 'abc',
              },
            };
            stringQuery(done, PG_DATABASE, query, 'abc');
          });

          it('GOOGLE_STANDARD_SQL should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'string',
              },
            };
            stringQuery(done, DATABASE, query, null);
          });

          it('POSTGRESQL should allow for null values', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: null,
              },
              types: {
                p1: 'string',
              },
            };
            stringQuery(done, PG_DATABASE, query, null);
          });

          it('GOOGLE_STANDARD_SQL should bind arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind empty arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null arrays', done => {
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
          const bytesQuery = (done, database, query, value) => {
            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, value);
              done();
            });
          };

          it('GOOGLE_STANDARD_SQL should bind the value', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: Buffer.from('abc'),
              },
            };
            bytesQuery(done, DATABASE, query, Buffer.from('abc'));
          });

          it('POSTGRESQL should bind the value', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: Buffer.from('abc'),
              },
            };
            bytesQuery(done, PG_DATABASE, query, Buffer.from('abc'));
          });

          it('GOOGLE_STANDARD_SQL should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'bytes',
              },
            };
            bytesQuery(done, DATABASE, query, null);
          });

          it('POSTGRESQL should allow for null values', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: null,
              },
              types: {
                p1: 'bytes',
              },
            };
            bytesQuery(done, PG_DATABASE, query, null);
          });

          it('GOOGLE_STANDARD_SQL should bind arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind empty arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null arrays', done => {
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
          const timestampQuery = (done, database, query, value) => {
            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, value);
              done();
            });
          };

          it('GOOGLE_STANDARD_SQL should bind the value', done => {
            const timestamp = Spanner.timestamp();
            const query = {
              sql: 'SELECT @v',
              params: {
                v: timestamp,
              },
            };
            timestampQuery(done, DATABASE, query, timestamp);
          });

          it('POSTGRESQL should bind the value', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const timestamp = Spanner.timestamp();
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: timestamp,
              },
            };
            timestampQuery(done, PG_DATABASE, query, timestamp);
          });

          it('GOOGLE_STANDARD_SQL should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'timestamp',
              },
            };
            timestampQuery(done, DATABASE, query, null);
          });

          it('POSTGRESQL should allow for null values', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: null,
              },
              types: {
                p1: 'timestamp',
              },
            };
            timestampQuery(done, PG_DATABASE, query, null);
          });

          it('GOOGLE_STANDARD_SQL should bind arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind empty arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null arrays', done => {
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
          const dateQuery = (done, database, query, value) => {
            database.run(query, (err, rows) => {
              assert.ifError(err);

              let returnedDate = Spanner.date(rows[0][0].value);
              if (value === null) {
                returnedDate = rows[0][0].value;
              }
              assert.deepStrictEqual(returnedDate, value);
              done();
            });
          };

          it('GOOGLE_STANDARD_SQL should bind the value', done => {
            const date = Spanner.date();
            const query = {
              sql: 'SELECT @v',
              params: {
                v: date,
              },
            };
            dateQuery(done, DATABASE, query, date);
          });

          it('POSTGRESQL should bind the value', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const date = Spanner.date();
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: date,
              },
            };
            dateQuery(done, PG_DATABASE, query, date);
          });

          it('GOOGLE_STANDARD_SQL should allow for null values', done => {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'date',
              },
            };
            dateQuery(done, DATABASE, query, null);
          });

          it('POSTGRESQL should allow for null values', function (done) {
            if (IS_EMULATOR_ENABLED) {
              this.skip();
            }
            const query = {
              sql: 'SELECT $1',
              params: {
                p1: null,
              },
              types: {
                p1: 'date',
              },
            };
            dateQuery(done, PG_DATABASE, query, null);
          });

          it('GOOGLE_STANDARD_SQL should bind arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind empty arrays', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null arrays', done => {
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
          it('GOOGLE_STANDARD_SQL should bind a simple struct', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null structs', done => {
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

          it('GOOGLE_STANDARD_SQL should bind nested structs', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null nested structs', done => {
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

          it('GOOGLE_STANDARD_SQL should bind empty structs', done => {
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

          it('GOOGLE_STANDARD_SQL should bind null structs with no fields', done => {
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

          it('GOOGLE_STANDARD_SQL should bind structs with null fields', done => {
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

          it('GOOGLE_STANDARD_SQL should bind structs with duplicate fields', done => {
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

          it('GOOGLE_STANDARD_SQL should bind structs with missing field names', done => {
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

          it('GOOGLE_STANDARD_SQL should allow equality checks', done => {
            const query = {
              sql: 'SELECT @structParam=STRUCT<threadf INT64, userf STRING>(1, "bob")',
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

          it('GOOGLE_STANDARD_SQL should allow nullness checks', done => {
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

          it('GOOGLE_STANDARD_SQL should allow an array of non-null structs', done => {
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

          it('GOOGLE_STANDARD_SQL should allow an array of structs with null fields', done => {
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

          it('GOOGLE_STANDARD_SQL should allow a null array of structs', done => {
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
        const googleSqlTable = DATABASE.table(TABLE_NAME);
        const postgreSqlTable = PG_DATABASE.table(TABLE_NAME);

        const googleSqlExpectedRow = {
          Key: generateName('key'),
          StringValue: string(),
          StringArray: [string(), string(), string(), string()],
          BytesValue: bytes(),
          BytesArray: [bytes(), bytes(), bytes(), bytes()],
        };

        const postgreSqlExpectedRow = {
          Key: generateName('key'),
          StringValue: string(),
          BytesValue: bytes(),
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

        before(async () => {
          const googleSqlCreateTable = await googleSqlTable.create(
            `
              CREATE TABLE ${TABLE_NAME} (
                                           Key STRING(MAX) NOT NULL,
                                           StringValue STRING(MAX),
                                           StringArray ARRAY<STRING(MAX)>,
                                           BytesValue BYTES(MAX),
                                           BytesArray ARRAY<BYTES(MAX)>
              ) PRIMARY KEY (Key)`,
            GAX_OPTIONS
          );
          await onPromiseOperationComplete(googleSqlCreateTable);
          await googleSqlTable.insert(googleSqlExpectedRow);

          if (!IS_EMULATOR_ENABLED) {
            const postgreSqlCreateTable = await postgreSqlTable.create(
              `CREATE TABLE ${TABLE_NAME} (
                                            "Key" VARCHAR NOT NULL PRIMARY KEY,
                                            "StringValue" VARCHAR,
                                            "BytesValue" BYTEA
               )`,
              GAX_OPTIONS
            );
            await onPromiseOperationComplete(postgreSqlCreateTable);
            await postgreSqlTable.insert(postgreSqlExpectedRow);
          }
        });

        it('GOOGLE_STANDARD_SQL should read large datasets', done => {
          googleSqlTable.read(
            {
              keys: [googleSqlExpectedRow.Key],
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

              assert.strictEqual(row.Key, googleSqlExpectedRow.Key);
              assert.strictEqual(
                row.StringValue,
                googleSqlExpectedRow.StringValue
              );
              assert.deepStrictEqual(
                row.StringArray,
                googleSqlExpectedRow.StringArray
              );

              row.BytesValue = base64ToBuffer(row.BytesValue);
              row.BytesArray = row.BytesArray.map(base64ToBuffer);

              assert.deepStrictEqual(
                row.BytesValue,
                googleSqlExpectedRow.BytesValue
              );
              assert.deepStrictEqual(
                row.BytesArray,
                googleSqlExpectedRow.BytesArray
              );

              done();
            }
          );
        });

        it('POSTGRESQL should read large datasets', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          postgreSqlTable.read(
            {
              keys: [postgreSqlExpectedRow.Key],
              columns: ['Key', 'StringValue', 'BytesValue'],
            },
            (err, rows) => {
              assert.ifError(err);

              const row = rows![0].toJSON();

              assert.strictEqual(row.Key, postgreSqlExpectedRow.Key);
              assert.strictEqual(
                row.StringValue,
                postgreSqlExpectedRow.StringValue
              );

              row.BytesValue = base64ToBuffer(row.BytesValue);
              assert.deepStrictEqual(
                row.BytesValue,
                postgreSqlExpectedRow.BytesValue
              );

              done();
            }
          );
        });

        it('GOOGLE_STANDARD_SQL should query large datasets', done => {
          const query = {
            sql: 'SELECT * FROM ' + googleSqlTable.name + ' WHERE Key = @key',
            params: {
              key: googleSqlExpectedRow.Key,
            },
          };

          DATABASE.run(query, (err, rows) => {
            assert.ifError(err);

            const row = rows[0].toJSON();

            assert.strictEqual(row.Key, googleSqlExpectedRow.Key);
            assert.strictEqual(
              row.StringValue,
              googleSqlExpectedRow.StringValue
            );
            assert.deepStrictEqual(
              row.StringArray,
              googleSqlExpectedRow.StringArray
            );

            row.BytesValue = base64ToBuffer(row.BytesValue);
            row.BytesArray = row.BytesArray.map(base64ToBuffer);

            assert.deepStrictEqual(
              row.BytesValue,
              googleSqlExpectedRow.BytesValue
            );
            assert.deepStrictEqual(
              row.BytesArray,
              googleSqlExpectedRow.BytesArray
            );

            done();
          });
        });

        it('POSTGRESQL should query large datasets', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          const query = {
            sql: 'SELECT * FROM ' + postgreSqlTable.name + ' WHERE "Key" = $1',
            params: {
              p1: postgreSqlExpectedRow.Key,
            },
          };

          PG_DATABASE.run(query, (err, rows) => {
            assert.ifError(err);

            const row = rows[0].toJSON();

            assert.strictEqual(row.Key, postgreSqlExpectedRow.Key);
            assert.strictEqual(
              row.StringValue,
              postgreSqlExpectedRow.StringValue
            );

            row.BytesValue = base64ToBuffer(row.BytesValue);
            assert.deepStrictEqual(
              row.BytesValue,
              postgreSqlExpectedRow.BytesValue
            );

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

      const updateRow = (done, table) => {
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
      };

      it('GOOGLE_STANDARD_SQL should update a row', done => {
        updateRow(done, googleSqlTable);
      });

      it('POSTGRESQL should update a row', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        updateRow(done, postgreSqlTable);
      });

      const insertRow = (done, table) => {
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
      };

      it('GOOGLE_STANDARD_SQL should update a row', done => {
        insertRow(done, googleSqlTable);
      });

      it('POSTGRESQL should update a row', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        insertRow(done, postgreSqlTable);
      });
    });

    describe('read', () => {
      const TABLE_NAME = 'ReadTestTable';
      const googleSqlTable = DATABASE.table(TABLE_NAME);
      const postgreSqlTable = PG_DATABASE.table(TABLE_NAME);

      const ALL_COLUMNS = ['Key', 'StringValue'];

      before(async () => {
        const googleSqlCreateTable = await googleSqlTable.create(
          `
            CREATE TABLE ${TABLE_NAME} (
              Key STRING(MAX) NOT NULL,
              StringValue STRING(MAX)
            ) PRIMARY KEY (Key)`,
          GAX_OPTIONS
        );
        await onPromiseOperationComplete(googleSqlCreateTable);
        const googleSqlCreateIndex = await DATABASE.updateSchema(`
              CREATE INDEX ReadByValue ON ${TABLE_NAME}(StringValue)`);
        await onPromiseOperationComplete(googleSqlCreateIndex);

        const data: Array<{}> = [];

        for (let i = 0; i < 15; ++i) {
          data.push({
            Key: 'k' + i,
            StringValue: 'v' + i,
          });
        }
        await googleSqlTable.insert(data);

        if (!IS_EMULATOR_ENABLED) {
          const postgreSqlCreateTable = await postgreSqlTable.create(
            `
                CREATE TABLE ${TABLE_NAME} (
                    "Key" VARCHAR NOT NULL PRIMARY KEY, 
                    "StringValue" VARCHAR
                )`,
            GAX_OPTIONS
          );
          await onPromiseOperationComplete(postgreSqlCreateTable);
          const postgreSqlCreateIndex = await PG_DATABASE.updateSchema(`
              CREATE INDEX ReadByValue ON ${TABLE_NAME}("StringValue")`);
          await onPromiseOperationComplete(postgreSqlCreateIndex);
          await postgreSqlTable.insert(data);
        }
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
        it(`GOOGLE_STANDARD_SQL ${test.test}`, done => {
          googleSqlTable.read(test.query as ReadRequest, (err, rows) => {
            test.assertions(err, rows);
            done();
          });
        });

        it(`POSTGRESQL ${test.test}`, function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          postgreSqlTable.read(test.query as ReadRequest, (err, rows) => {
            test.assertions(err, rows);
            done();
          });
        });

        // test using an index
        const readUsingIndex = (done, test, table) => {
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
        };

        it(`GOOGLE_STANDARD_SQL ${test.test}` + ' with an index', done => {
          readUsingIndex(done, test, googleSqlTable);
        });

        it(`POSTGRESQL ${test.test}` + ' with an index', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          readUsingIndex(done, test, postgreSqlTable);
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

      const readInvalidTable = (done, database) => {
        const table = database.table('ReadTestTablezzz');

        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
        };

        table.read(query, err => {
          assert.strictEqual(err.code, 5);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should read over invalid table fails', done => {
        readInvalidTable(done, DATABASE);
      });

      it('POSTGRESQL should read over invalid table fails', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        readInvalidTable(done, PG_DATABASE);
      });

      const readInvalidColumn = (done, table) => {
        const query = {
          keys: ['k1'],
          columns: ['ohnoes'],
        };

        table.read(query, err => {
          assert.strictEqual(err.code, 5);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should read over invalid column fails', done => {
        readInvalidColumn(done, googleSqlTable);
      });

      it('POSTGRESQL should read over invalid column fails', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        readInvalidColumn(done, postgreSqlTable);
      });

      const failDeadlineExceed = (done, table) => {
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
      };

      it('GOOGLE_STANDARD_SQL should fail if deadline exceeds', function (done) {
        // This test case somehow causes the emulator to return a RESOURCE_EXHAUSTED
        // error for this or following gRPC calls.
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        failDeadlineExceed(done, googleSqlTable);
      });

      it('POSTGRESQL should fail if deadline exceeds', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        failDeadlineExceed(done, postgreSqlTable);
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
    const googleSqlTable = DATABASE.table(TABLE_NAME);
    const postgreSqlTable = PG_DATABASE.table(TABLE_NAME);

    const googleSqlSchema = `
      CREATE TABLE ${TABLE_NAME} (
        Key STRING(MAX) NOT NULL,
        StringValue STRING(MAX),
        NumberValue INT64
      ) PRIMARY KEY (Key)
    `;
    const postgreSqlSchema = `
      CREATE TABLE ${TABLE_NAME} (
        "Key" VARCHAR NOT NULL PRIMARY KEY,
        "StringValue" VARCHAR ,
        "NumberValue" BIGINT
      )`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleSqlRecords = [];
    const postgreSqlRecords = [];

    before(async () => {
      const insertRecords = async function (table, records) {
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
      };
      await onPromiseOperationComplete(
        await googleSqlTable.create(googleSqlSchema, GAX_OPTIONS)
      );
      await insertRecords(googleSqlTable, googleSqlRecords);

      if (!IS_EMULATOR_ENABLED) {
        await onPromiseOperationComplete(
          await postgreSqlTable.create(postgreSqlSchema, GAX_OPTIONS)
        );
        await insertRecords(postgreSqlTable, postgreSqlRecords);
      }
    });

    describe('snapshots', () => {
      const readOnlyTransaction = (done, database, records) => {
        const options = {
          strong: true,
        };

        database.getSnapshot(options, (err, transaction) => {
          assert.ifError(err);

          transaction!.run(`SELECT * FROM ${TABLE_NAME}`, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            transaction!.end();
            done();
          });
        });
      };

      it('GOOGLE_STANDARD_SQL should run a read only transaction', done => {
        readOnlyTransaction(done, DATABASE, googleSqlRecords);
      });

      it('POSTGRESQL should run a read only transaction', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        readOnlyTransaction(done, PG_DATABASE, postgreSqlRecords);
      });

      const readKeysFromTable = (done, database, table, records) => {
        database.getSnapshot((err, transaction) => {
          assert.ifError(err);

          const query = {
            ranges: [
              {
                startClosed: 'k0',
                endClosed: 'k4',
              },
            ],
            columns: ['Key'],
          } as {} as ReadRequest;

          transaction!.read(table.name, query, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows!.length, records.length);

            transaction!.end();
            done();
          });
        });
      };

      it('GOOGLE_STANDARD_SQL should read keys from a table', done => {
        readKeysFromTable(done, DATABASE, googleSqlTable, googleSqlRecords);
      });

      it('POSTGRESQL should read keys from a table', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        readKeysFromTable(
          done,
          PG_DATABASE,
          postgreSqlTable,
          postgreSqlRecords
        );
      });

      const acceptReadTimestamp = (done, database, records) => {
        const options = {
          readTimestamp: records[0].commitTimestamp,
        };

        database.getSnapshot(options, (err, transaction) => {
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
      };

      it('GOOGLE_STANDARD_SQL should accept a read timestamp', done => {
        acceptReadTimestamp(done, DATABASE, googleSqlRecords);
      });

      it('POSTGRESQL should accept a read timestamp', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        acceptReadTimestamp(done, PG_DATABASE, postgreSqlRecords);
      });

      const acceptMinTimestamp = (done, database, records) => {
        const query = 'SELECT * FROM ' + TABLE_NAME;

        const options = {
          minReadTimestamp: new PreciseDate(),
        } as TimestampBounds;

        // minTimestamp can only be used in single use transactions
        // so we can't use database.getSnapshot here
        database.run(query, options, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows!.length, records.length);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should accept a min timestamp', done => {
        acceptMinTimestamp(done, DATABASE, googleSqlRecords);
      });

      it('POSTGRESQL should accept a min timestamp', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        acceptMinTimestamp(done, PG_DATABASE, postgreSqlRecords);
      });

      const acceptExactStaleness = (done, database, records, query) => {
        const options = {
          exactStaleness: Date.now() - records[1].localTimestamp,
        };

        database.getSnapshot(options, (err, transaction) => {
          assert.ifError(err);

          transaction!.run(query, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, 2);

            const rowJson = rows.map(x => x.toJSON());

            assert.strictEqual(rowJson[0].Key, 'k0');
            assert.strictEqual(rowJson[0].StringValue, 'v0');
            assert.strictEqual(rowJson[1].Key, 'k1');
            assert.strictEqual(rowJson[1].StringValue, 'v1');

            transaction!.end();
            done();
          });
        });
      };

      it('GOOGLE_STANDARD_SQL should accept an exact staleness', done => {
        acceptExactStaleness(
          done,
          DATABASE,
          googleSqlRecords,
          `SELECT * FROM ${TABLE_NAME} ORDER BY Key`
        );
      });

      it('POSTGRESQL should accept an exact staleness', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        acceptExactStaleness(
          done,
          PG_DATABASE,
          postgreSqlRecords,
          `SELECT * FROM ${TABLE_NAME} ORDER BY "Key"`
        );
      });

      const acceptMaxStaleness = (done, database, records) => {
        const query = 'SELECT * FROM TxnTable';

        const options = {
          maxStaleness: 1,
        };

        // maxStaleness can only be used in single use transactions
        // so we can't use database.getSnapshot here
        database.run(query, options, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows!.length, records.length);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should accept a max staleness', done => {
        acceptMaxStaleness(done, DATABASE, googleSqlRecords);
      });

      it('POSTGRESQL should accept a max staleness', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        acceptMaxStaleness(done, PG_DATABASE, postgreSqlRecords);
      });

      const strongReadWithConcurrentUpdates = (
        done,
        database,
        table,
        records
      ) => {
        const options = {
          strong: true,
        };

        database.getSnapshot(options, (err, transaction) => {
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
      };

      it('GOOGLE_STANDARD_SQL should do a strong read with concurrent updates', done => {
        strongReadWithConcurrentUpdates(
          done,
          DATABASE,
          googleSqlTable,
          googleSqlRecords
        );
      });

      it('POSTGRESQL should do a strong read with concurrent updates', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        strongReadWithConcurrentUpdates(
          done,
          PG_DATABASE,
          postgreSqlTable,
          postgreSqlRecords
        );
      });

      const exactReadWithConcurrentUpdates = (
        done,
        database,
        table,
        records
      ) => {
        const options = {
          readTimestamp: records[records.length - 1].commitTimestamp,
        };

        database.getSnapshot(options, (err, transaction) => {
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
      };

      it('GOOGLE_STANDARD_SQL should do a strong read with concurrent updates', done => {
        exactReadWithConcurrentUpdates(
          done,
          DATABASE,
          googleSqlTable,
          googleSqlRecords
        );
      });

      it('POSTGRESQL should do a strong read with concurrent updates', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        exactReadWithConcurrentUpdates(
          done,
          PG_DATABASE,
          postgreSqlTable,
          postgreSqlRecords
        );
      });

      const readWithStalenessAndConcurrentUpdates = (
        done,
        database,
        table,
        records
      ) => {
        const options = {
          exactStaleness: Date.now() - records[0].localTimestamp,
        };

        database.getSnapshot(options, (err, transaction) => {
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
      };

      it('GOOGLE_STANDARD_SQL should read with staleness & concurrent updates', done => {
        readWithStalenessAndConcurrentUpdates(
          done,
          DATABASE,
          googleSqlTable,
          googleSqlRecords
        );
      });

      it('POSTGRESQL should read with staleness & concurrent updates', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        readWithStalenessAndConcurrentUpdates(
          done,
          PG_DATABASE,
          postgreSqlTable,
          postgreSqlRecords
        );
      });
    });

    describe('dml', () => {
      before(done => {
        const postgresUpdateDmlDatabase = () => {
          PG_DATABASE.runTransaction((err, transaction) => {
            assert.ifError(err);

            transaction!.runUpdate(
              {
                sql:
                  'INSERT INTO ' +
                  TABLE_NAME +
                  ' ("Key", "StringValue") VALUES($1, $2)',
                params: {
                  p1: 'k999',
                  p2: 'abc',
                },
              },
              err => {
                assert.ifError(err);
                transaction!.commit(done);
              }
            );
          });
        };
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
              if (!IS_EMULATOR_ENABLED) {
                transaction!.commit(postgresUpdateDmlDatabase);
              } else {
                transaction!.commit(done);
              }
            }
          );
        });
      });

      const rowCountRunUpdate = (done, database, query) => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.runUpdate(query, (err, rowCount) => {
            assert.ifError(err);
            assert.strictEqual(rowCount, 1);
            transaction!.rollback(done);
          });
        });
      };
      it('GOOGLE_STANDARD_SQL should return rowCount from runUpdate', done => {
        const query = {
          sql:
            'UPDATE ' +
            TABLE_NAME +
            ' t SET t.StringValue = @str WHERE t.Key = @key',
          params: {
            key: 'k999',
            str: 'abcd',
          },
        };
        rowCountRunUpdate(done, DATABASE, query);
      });

      it('POSTGRESQL should return rowCount from runUpdate', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const query = {
          sql:
            'UPDATE ' + TABLE_NAME + ' SET "StringValue" = $1 WHERE "Key" = $2',
          params: {
            p1: 'abcd',
            p2: 'k999',
          },
        };
        rowCountRunUpdate(done, PG_DATABASE, query);
      });

      const rowCountRun = (done, database, query) => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.run(query, (err, row, stats) => {
            assert.ifError(err);

            const rowCount = Math.floor(stats[stats.rowCount!] as number);
            assert.strictEqual(rowCount, 1);

            transaction!.rollback(done);
          });
        });
      };
      it('GOOGLE_STANDARD_SQL should return rowCount from run', done => {
        const query = {
          sql:
            'UPDATE ' +
            TABLE_NAME +
            ' t SET t.StringValue = @str WHERE t.Key = @key',
          params: {
            key: 'k999',
            str: 'abcd',
          },
        };
        rowCountRun(done, DATABASE, query);
      });

      it('POSTGRESQL should return rowCount from run', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const query = {
          sql:
            'UPDATE ' + TABLE_NAME + ' SET "StringValue" = $1 WHERE "Key" = $2',
          params: {
            p1: 'abcd',
            p2: 'k999',
          },
        };
        rowCountRun(done, PG_DATABASE, query);
      });

      const multipleDmlOnTxn = (
        done,
        database,
        insertQuery,
        updateQuery,
        selectQuery
      ) => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!
            .runUpdate(insertQuery)
            .then(data => {
              const rowCount = data[0];
              assert.strictEqual(rowCount, 1);

              return transaction!.runUpdate(updateQuery);
            })
            .then(data => {
              const rowCount = data[0];
              assert.strictEqual(rowCount, 1);

              return transaction!.run(selectQuery);
            })
            .then(data => {
              const rows = data[0].map(row => row.toJSON());

              assert.strictEqual(rows.length, 1);
              assert.deepStrictEqual(rows[0], {
                Key: 'k1000',
                StringValue: 'abcd',
                NumberValue: 11,
              });

              return transaction!.rollback();
            })
            .then(() => done(), done);
        });
      };

      it('GOOGLE_STANDARD_SQL should exec multiple dml statements on the same txn', done => {
        const key = 'k1000';
        const str = 'abcd';
        const num = 11;
        const insertQuery = {
          sql:
            'INSERT INTO ' +
            TABLE_NAME +
            ' (Key, StringValue) VALUES (@key, @str)',
          params: {key, str},
        };
        const updateQuery = {
          sql:
            'UPDATE ' +
            TABLE_NAME +
            ' t SET t.NumberValue = @num WHERE t.KEY = @key',
          params: {key, num},
        };
        const selectQuery = {
          sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE Key = @key',
          params: {key},
        };
        multipleDmlOnTxn(done, DATABASE, insertQuery, updateQuery, selectQuery);
      });

      it('POSTGRESQL should exec multiple dml statements on the same txn', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k1000';
        const str = 'abcd';
        const num = 11;
        const insertQuery = {
          sql:
            'INSERT INTO ' +
            TABLE_NAME +
            ' ("Key", "StringValue") VALUES ($1, $2)',
          params: {p1: key, p2: str},
        };
        const updateQuery = {
          sql:
            'UPDATE ' + TABLE_NAME + ' SET "NumberValue" = $1 WHERE "Key" = $2',
          params: {p1: num, p2: key},
        };
        const selectQuery = {
          sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE "Key" = $1',
          params: {p1: key},
        };
        multipleDmlOnTxn(
          done,
          PG_DATABASE,
          insertQuery,
          updateQuery,
          selectQuery
        );
      });

      const dmlChangesInQueryResults = (
        done,
        database,
        updateQuery,
        selectQuery
      ) => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!
            .runUpdate(updateQuery)
            .then(() => {
              return transaction!.run(selectQuery);
            })
            .then(data => {
              const rows = data[0].map(row => row.toJSON());

              assert.strictEqual(rows.length, 1);
              assert.strictEqual(rows[0].StringValue, 'abcd');
            })
            .then(() => transaction!.rollback(done), done);
        });
      };

      it('GOOGLE_STANDARD_SQL should show dml changes in query results', done => {
        const key = 'k999';
        const str = 'abcd';
        const updateQuery = {
          sql:
            'UPDATE ' +
            TABLE_NAME +
            ' t SET t.StringValue = @str WHERE t.Key = @key',
          params: {key, str},
        };
        const selectQuery = {
          sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE Key = @key',
          params: {key},
        };
        dmlChangesInQueryResults(done, DATABASE, updateQuery, selectQuery);
      });

      it('POSTGRESQL should show dml changes in query results', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k999';
        const str = 'abcd';
        const updateQuery = {
          sql:
            'UPDATE ' + TABLE_NAME + ' SET "StringValue" = $1 WHERE "Key" = $2',
          params: {p1: str, p2: key},
        };
        const selectQuery = {
          sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE "Key" = $1',
          params: {p1: key},
        };
        dmlChangesInQueryResults(done, PG_DATABASE, updateQuery, selectQuery);
      });

      const rollbackDmlStatement = (
        done,
        database,
        updateQuery,
        selectQuery
      ) => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!
            .runUpdate(updateQuery)
            .then(() => transaction!.rollback())
            .then(() => {
              return database.run(selectQuery);
            })
            .then(data => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rows = data[0].map(row => (row as any).toJSON());
              assert.notStrictEqual(rows[0].StringValue, 'abcd');
              done();
            })
            .catch(done);
        });
      };

      it('GOOGLE_STANDARD_SQL should rollback a dml statement', done => {
        const key = 'k999';
        const str = 'abcd';
        const updateQuery = {
          sql:
            'UPDATE ' +
            TABLE_NAME +
            ' t SET t.StringValue = @str WHERE t.Key = @key',
          params: {key, str},
        };
        const selectQuery = {
          sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE Key = @key',
          params: {key},
        };
        rollbackDmlStatement(done, DATABASE, updateQuery, selectQuery);
      });

      it('POSTGRESQL should rollback a dml statement', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k999';
        const str = 'abcd';
        const updateQuery = {
          sql:
            'UPDATE ' + TABLE_NAME + ' SET "StringValue" = $1 WHERE "Key" = $2',
          params: {p1: str, p2: key},
        };
        const selectQuery = {
          sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE "Key" = $1',
          params: {p1: key},
        };
        rollbackDmlStatement(done, PG_DATABASE, updateQuery, selectQuery);
      });

      const handleDmlAndInsert = (done, database, insertQuery, selectQuery) => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!
            .runUpdate(insertQuery)
            .then(() => {
              transaction!.insert('TxnTable', {
                Key: 'k1002',
                StringValue: 'dml+mutation',
              });

              return transaction!.commit();
            })
            .then(() => {
              return database.run(selectQuery);
            })
            .then(data => {
              const rows = data[0];

              assert.strictEqual(rows.length, 2);
              done();
            })
            .catch(done);
        });
      };

      it('GOOGLE_STANDARD_SQL should handle using both dml and insert methods', done => {
        const str = 'dml+mutation';
        const insertQuery = {
          sql:
            'INSERT INTO ' +
            TABLE_NAME +
            ' (Key, StringValue) VALUES (@key, @str)',
          params: {
            key: 'k1001',
            str,
          },
        };
        const selectQuery = {
          sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE StringValue = @str',
          params: {str},
        };
        handleDmlAndInsert(done, DATABASE, insertQuery, selectQuery);
      });

      it('POSTGRESQL should handle using both dml and insert methods', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const str = 'dml+mutation';
        const insertQuery = {
          sql:
            'INSERT INTO ' +
            TABLE_NAME +
            ' ("Key", "StringValue") VALUES ($1, $2)',
          params: {
            p1: 'k1001',
            p2: str,
          },
        };
        const selectQuery = {
          sql: 'SELECT * FROM ' + TABLE_NAME + ' WHERE "StringValue" = $1',
          params: {p1: str},
        };
        handleDmlAndInsert(done, PG_DATABASE, insertQuery, selectQuery);
      });
    });

    describe('pdml', () => {
      const simplePdml = (done, database, query) => {
        database.runPartitionedUpdate(query, (err, rowCount) => {
          assert.ifError(err);
          assert.strictEqual(rowCount, 1);
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should execute a simple pdml statement', done => {
        const query = {
          sql:
            'UPDATE ' +
            TABLE_NAME +
            ' t SET t.StringValue = @str WHERE t.Key = @key',
          params: {
            key: 'k1',
            str: 'abcde',
          },
        };
        simplePdml(done, DATABASE, query);
      });

      it('POSTGRESQL should execute a simple pdml statement', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const query = {
          sql:
            'UPDATE ' + TABLE_NAME + ' SET "StringValue" = $1 WHERE "Key" = $2',
          params: {
            p1: 'abcde',
            p2: 'k1',
          },
        };
        simplePdml(done, PG_DATABASE, query);
      });

      const longRunningPdml = async function (
        database,
        updateQuery,
        selectQuery
      ) {
        const count = 10000;

        const tableData = new Array(count).fill(0).map((_, i) => {
          return {Key: `longpdml${i}`, StringValue: 'a'};
        });

        return database
          .runTransactionAsync(transaction => {
            transaction.insert('TxnTable', tableData);
            return transaction.commit();
          })
          .then(() => {
            return database.runPartitionedUpdate(updateQuery);
          })
          .then(([rowCount]) => {
            assert.strictEqual(rowCount, count);

            return database.run(selectQuery).then(([rows]) => {
              assert.strictEqual(rows.length, count);
            });
          });
      };

      it('GOOGLE_STANDARD_SQL should execute a long running pdml statement', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const str = new Array(1000).fill('b').join('\n');
        const updateQuery = {
          sql:
            'UPDATE ' +
            TABLE_NAME +
            " t SET t.StringValue = @str WHERE t.StringValue = 'a'",
          params: {str},
        };
        const selectQuery = {
          sql: 'SELECT Key FROM ' + TABLE_NAME + ' WHERE StringValue = @str',
          params: {str},
        };
        await longRunningPdml(DATABASE, updateQuery, selectQuery);
      });

      it('POSTGRESQL should execute a long running pdml statement', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const str = new Array(1000).fill('b').join('\n');
        const updateQuery = {
          sql:
            'UPDATE ' +
            TABLE_NAME +
            ' SET "StringValue" = $1 WHERE "StringValue" = \'a\'',
          params: {p1: str},
        };
        const selectQuery = {
          sql: 'SELECT "Key" FROM ' + TABLE_NAME + ' WHERE "StringValue" = $1',
          params: {p1: str},
        };
        await longRunningPdml(PG_DATABASE, updateQuery, selectQuery);
      });
    });

    describe('batch dml', () => {
      const key = 'k1234';
      const str = 'abcd';
      const num = 11;

      const googleSqlInsert = {
        sql:
          'INSERT INTO ' +
          TABLE_NAME +
          ' (Key, StringValue) VALUES (@key, @str)',
        params: {key, str},
      };

      const postgreSqlInsert = {
        sql:
          'INSERT INTO ' +
          TABLE_NAME +
          ' ("Key", "StringValue") VALUES ($1, $2)',
        params: {p1: key, p2: str},
      };

      const googleSqlUpdate = {
        sql:
          'UPDATE ' +
          TABLE_NAME +
          ' t SET t.NumberValue = @num WHERE t.KEY = @key',
        params: {key, num},
      };

      const posgreSqlUpdate = {
        sql:
          'UPDATE ' + TABLE_NAME + ' SET "NumberValue" = $1 WHERE "Key" = $2',
        params: {p1: num, p2: key},
      };

      // this should fail since we're not binding params
      const googleSqlBorked = {
        sql:
          'UPDATE ' +
          TABLE_NAME +
          ' t SET t.NumberValue = @num WHERE t.KEY = @key',
      };

      const postgreSqlBorked = {
        sql:
          'UPDATE ' + TABLE_NAME + ' SET "NumberValue" = $1 WHERE "Key" = $2',
      };

      const executeSingleStatement = async (database, insert) => {
        const rowCounts = await database.runTransactionAsync(async txn => {
          const [rowCounts] = await txn.batchUpdate([insert]);
          await txn.rollback();
          return rowCounts;
        });

        assert.deepStrictEqual(rowCounts, [1]);
      };

      it('GOOGLE_STANDARD_SQL should execute a single statement', async () => {
        await executeSingleStatement(DATABASE, googleSqlInsert);
      });

      it('POSTGRESQL should execute a single statement', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await executeSingleStatement(PG_DATABASE, postgreSqlInsert);
      });

      const noStatementError = async database => {
        const err = await database.runTransactionAsync(async txn => {
          let err;

          try {
            await txn.batchUpdate(null as unknown as []);
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
      };

      it('GOOGLE_STANDARD_SQL should return an error when no statements are supplied', async () => {
        await noStatementError(DATABASE);
      });

      it('POSTGRESQL should return an error when no statements are supplied', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await noStatementError(PG_DATABASE);
      });

      const multipleDependingStatements = async (database, insert, update) => {
        const rowCounts = await database.runTransactionAsync(async txn => {
          const [rowCounts] = await txn.batchUpdate([insert, update]);
          await txn.rollback();
          return rowCounts;
        });

        assert.deepStrictEqual(rowCounts, [1, 1]);
      };

      it('GOOGLE_STANDARD_SQL should run multiple statements that depend on each other', async () => {
        await multipleDependingStatements(
          DATABASE,
          googleSqlInsert,
          googleSqlUpdate
        );
      });

      it('POSTGRESQL should run multiple statements that depend on each other', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await multipleDependingStatements(
          PG_DATABASE,
          postgreSqlInsert,
          posgreSqlUpdate
        );
      });

      const runAfterRunUpdate = async (database, insert, update) => {
        const rowCounts = await database.runTransactionAsync(async txn => {
          await txn.runUpdate(insert);
          const [rowCounts] = await txn.batchUpdate([update]);
          await txn.rollback();
          return rowCounts;
        });

        assert.deepStrictEqual(rowCounts, [1]);
      };

      it('GOOGLE_STANDARD_SQL should run after a runUpdate call', async () => {
        await runAfterRunUpdate(DATABASE, googleSqlInsert, googleSqlUpdate);
      });

      it('POSTGRESQL should run after a runUpdate call', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await runAfterRunUpdate(PG_DATABASE, postgreSqlInsert, posgreSqlUpdate);
      });

      const runBeforeRunUpdate = async (database, insert, update) => {
        const rowCounts = await database.runTransactionAsync(async txn => {
          const [rowCounts] = await txn.batchUpdate([insert]);
          await txn.runUpdate(update);
          await txn.rollback();
          return rowCounts;
        });

        assert.deepStrictEqual(rowCounts, [1]);
      };

      it('GOOGLE_STANDARD_SQL should run before a runUpdate call', async () => {
        await runBeforeRunUpdate(DATABASE, googleSqlInsert, googleSqlUpdate);
      });

      it('POSTGRESQL should run before a runUpdate call', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await runBeforeRunUpdate(
          PG_DATABASE,
          postgreSqlInsert,
          posgreSqlUpdate
        );
      });

      const stopExecutingStatementsIfError = async (
        database,
        insert,
        borked,
        update
      ) => {
        const err = await database.runTransactionAsync(async txn => {
          let err;

          try {
            await txn.batchUpdate([insert, borked, update]);
          } catch (e) {
            // Re-throw if the transaction was aborted to trigger a retry.
            if ((err as grpc.ServiceError)?.code === grpc.status.ABORTED) {
              throw e;
            }
            err = e;
          }

          await txn.rollback();
          return err;
        });

        assert.strictEqual(err.code, grpc.status.INVALID_ARGUMENT);
        assert.deepStrictEqual(err.rowCounts, [1]);
      };

      it('GOOGLE_STANDARD_SQL should stop executing statements if an error occurs', async () => {
        await stopExecutingStatementsIfError(
          DATABASE,
          googleSqlInsert,
          googleSqlBorked,
          googleSqlUpdate
        );
      });

      it('POSTGRESQL should stop executing statements if an error occurs', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await stopExecutingStatementsIfError(
          PG_DATABASE,
          postgreSqlInsert,
          postgreSqlBorked,
          posgreSqlUpdate
        );
      });

      const ignoreAdditionalStatementErrors = async (
        database,
        insert,
        borked
      ) => {
        const err = await database.runTransactionAsync(async txn => {
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
      };

      it('GOOGLE_STANDARD_SQL should ignore any additional statement errors', async () => {
        await ignoreAdditionalStatementErrors(
          DATABASE,
          googleSqlInsert,
          googleSqlBorked
        );
      });

      it('POSTGRESQL should ignore any additional statement errors', async function () {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        await ignoreAdditionalStatementErrors(
          PG_DATABASE,
          postgreSqlInsert,
          postgreSqlBorked
        );
      });
    });

    describe('read/write', () => {
      const mismatchedColumnError = (done, database, table) => {
        database.runTransaction((err, transaction) => {
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
            caughtErrorMessage = (e as grpc.ServiceError).message;
          }
          assert.strictEqual(caughtErrorMessage, expectedErrorMessage);

          transaction!.end();
          done();
        });
      };

      it('GOOGLE_STANDARD_SQL should throw an error for mismatched columns', done => {
        mismatchedColumnError(done, DATABASE, googleSqlTable);
      });

      it('POSTGRESQL should throw an error for mismatched columns', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        mismatchedColumnError(done, PG_DATABASE, postgreSqlTable);
      });

      const commitTransaction = (done, database, table) => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.insert(table.name, {
            Key: 'k5',
            StringValue: 'v5',
          });

          transaction!.commit(done);
        });
      };

      it('GOOGLE_STANDARD_SQL should commit a transaction', done => {
        commitTransaction(done, DATABASE, googleSqlTable);
      });

      it('POSTGRESQL should commit a transaction', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        commitTransaction(done, PG_DATABASE, postgreSqlTable);
      });

      const rollbackTransaction = (done, database) => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction!.run('SELECT * FROM TxnTable', err => {
            assert.ifError(err);
            transaction!.rollback(done);
          });
        });
      };

      it('GOOGLE_STANDARD_SQL should rollback a transaction', done => {
        rollbackTransaction(done, DATABASE);
      });

      it('POSTGRESQL should rollback a transaction', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        rollbackTransaction(done, PG_DATABASE);
      });

      describe('concurrent transactions', () => {
        const defaultRowValues = {
          Key: 'k0',
          NumberValue: 0,
        };

        beforeEach(async () => {
          await googleSqlTable.update(defaultRowValues);
          if (!IS_EMULATOR_ENABLED) {
            await postgreSqlTable.update(defaultRowValues);
          }
        });

        const readConcurrentTransaction = (done, database, table) => {
          database.runTransaction((err, transaction) => {
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
            database.runTransaction((err, transaction) => {
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
        };

        it('GOOGLE_STANDARD_SQL should handle concurrent transactions with read', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          readConcurrentTransaction(done, DATABASE, googleSqlTable);
        });

        it('POSTGRESQL should handle concurrent transactions with read', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          readConcurrentTransaction(done, PG_DATABASE, postgreSqlTable);
        });

        const queryConcurrentTransaction = (done, database, table, query) => {
          database.runTransaction((err, transaction) => {
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
            database.runTransaction((err, transaction) => {
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
            txn.run(query, (err, rows) => {
              if (err) {
                callback(err);
                return;
              }

              const row = rows[0].toJSON();
              callback(null, row.NumberValue);
            });
          }
        };

        it('GOOGLE_STANDARD_SQL should handle concurrent transactions with query', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          const query = {
            sql: 'SELECT * FROM ' + googleSqlTable.name + ' WHERE Key = @key',
            params: {
              key: defaultRowValues.Key,
            },
          };
          queryConcurrentTransaction(done, DATABASE, googleSqlTable, query);
        });

        it('POSTGRESQL should handle concurrent transactions with query', function (done) {
          if (IS_EMULATOR_ENABLED) {
            this.skip();
          }
          const query = {
            sql: 'SELECT * FROM ' + postgreSqlTable.name + ' WHERE "Key" = $1',
            params: {
              p1: defaultRowValues.Key,
            },
          };
          queryConcurrentTransaction(done, PG_DATABASE, postgreSqlTable, query);
        });
      });

      const retryAbortedTxnWhenReadingFails = (
        done,
        database,
        table,
        query
      ) => {
        const key = 'k888';
        let attempts = 0;
        const expectedRow = {
          Key: key,
          NumberValue: null,
          StringValue: 'abc',
        };

        database.runTransaction((err, transaction) => {
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
          database.runTransaction((err, transaction) => {
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
      };

      it('GOOGLE_STANDARD_SQL should retry an aborted txn when reading fails', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k888';
        const query = `SELECT * FROM ${googleSqlTable.name} WHERE Key = '${key}'`;
        retryAbortedTxnWhenReadingFails(done, DATABASE, googleSqlTable, query);
      });

      it('POSTGRESQL should retry an aborted txn when reading fails', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k888';
        const query = {
          sql: `SELECT * FROM ${postgreSqlTable.name} WHERE "Key" = $1`,
          params: {
            p1: key,
          },
        };
        retryAbortedTxnWhenReadingFails(
          done,
          PG_DATABASE,
          postgreSqlTable,
          query
        );
      });

      const retryAbortedTxnWhenCommitFails = (done, database, table, query) => {
        const key = 'k9999';
        let attempts = 0;

        const expectedRow = {
          Key: key,
          NumberValue: null,
          StringValue: 'abc',
        };

        database.runTransaction((err, transaction) => {
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
          database.runTransaction((err, transaction) => {
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
      };

      it('GOOGLE_STANDARD_SQL should retry an aborted txn when commit fails', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k9999';
        const query = `SELECT * FROM ${googleSqlTable.name} WHERE Key = '${key}'`;
        retryAbortedTxnWhenCommitFails(done, DATABASE, googleSqlTable, query);
      });

      it('POSTGRESQL should retry an aborted txn when commit fails', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        const key = 'k9999';
        const query = {
          sql: `SELECT * FROM ${postgreSqlTable.name} WHERE "Key" = $1`,
          params: {
            p1: key,
          },
        };
        retryAbortedTxnWhenCommitFails(
          done,
          PG_DATABASE,
          postgreSqlTable,
          query
        );
      });

      const deadlineErrorInsteadOfAbort = (done, database, table) => {
        const options = {
          timeout: 10,
        };

        const query = `SELECT * FROM ${table.name}`;
        let attempts = 0;

        database.runTransaction(options, (err, transaction) => {
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
          database.runTransaction((err, transaction) => {
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
      };

      it('GOOGLE_STANDARD_SQL should return a deadline error instead of aborted', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        deadlineErrorInsteadOfAbort(done, DATABASE, googleSqlTable);
      });

      it('POSTGRESQL should return a deadline error instead of aborted', function (done) {
        if (IS_EMULATOR_ENABLED) {
          this.skip();
        }
        deadlineErrorInsteadOfAbort(done, PG_DATABASE, postgreSqlTable);
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
  const length =
    data[data.length - 1] === undefined ? data.length - 1 : data.length;
  const operation = data[length - 2];
  return operation.promise();
}

function execAfterOperationComplete(callback) {
  // tslint:disable-next-line only-arrow-functions
  return function (err) {
    // arguments = [..., op, apiResponse], unless the response is Empty.
    // arguments = [op, apiResponse, undefined] if the response is Empty.
    const length =
      // eslint-disable-next-line prefer-rest-params
      arguments[arguments.length - 1] === undefined
        ? arguments.length - 1
        : arguments.length;
    // eslint-disable-next-line prefer-rest-params
    const operation = arguments[length - 2];
    // eslint-disable-next-line prefer-rest-params
    const apiResponse = arguments[length - 1];

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

function wait(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}
