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

'use strict';

import * as assert from 'assert';
import * as async from 'async';
import concat = require('concat-stream');
import * as crypto from 'crypto';
import * as extend from 'extend';
import * as is from 'is';
import * as uuid from 'uuid';

const {Spanner} = require('../src');

const PREFIX = 'gcloud-tests-';
const RUN_ID = uuid
  .v1()
  .split('-')
  .shift(); // get a short uuid
const LABEL = `gcloud-tests-${RUN_ID}`;
const spanner = new Spanner({projectId: process.env.GCLOUD_PROJECT});

const CURRENT_TIME = Math.round(Date.now() / 1000).toString();

describe('Spanner', () => {
  const instance = spanner.instance(generateName('instance'));

  const INSTANCE_CONFIG = {
    config: 'regional-us-central1',
    nodes: 1,
    labels: {
      [LABEL]: 'true',
      created: CURRENT_TIME,
    },
  };

  before(done => {
    async.series(
      [
        deleteTestResources,
        (next) => {
          instance.create(INSTANCE_CONFIG, execAfterOperationComplete(next));
        },
      ],
      done
    );
  });

  after(deleteTestResources);

  describe('types', () => {
    const database = instance.database(generateName('database'));
    const table = database.table('TypeCheck');

    function insert(insertData, callback) {
      const id = generateName('id');

      insertData.Key = id;

      table.insert(insertData, (err, insertResp) => {
        if (err) {
          callback(err);
          return;
        }

        database.run(
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
      database.create(
        {
          schema: `
            CREATE TABLE TypeCheck (
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
        },
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

          database.run(
            {
              sql: `SELECT * FROM \`${table.name}\` WHERE Key = @a OR KEY = @b`,
              params: {
                a: data[0].Key,
                b: data[1].Key,
              },
            },
            (err, rows) => {
              assert.ifError(err);

              const row1 = rows[0].toJSON();
              assert.deepStrictEqual(row1.IntValue, data[0].IntValue);
              assert.deepStrictEqual(row1.BoolValue, data[0].BoolValue);

              const row2 = rows[1].toJSON();
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

        database.run(query, (err, rows) => {
          assert.ifError(err);

          const symbols = Object.getOwnPropertySymbols(rows[0][0].value[0]);
          assert.strictEqual(symbols.length, 1);
          assert.strictEqual(rows[0][0].value[0][symbols[0]], 'struct');

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
            JSON.stringify(rows[0][0].value[0][0]),
            JSON.stringify(expected[0].value[0][0])
          );
          assert.deepStrictEqual(
            JSON.stringify(rows[0][0].value[0][1]),
            JSON.stringify(expected[0].value[0][1])
          );

          done();
        });
      });

      it('should correctly decode structs', done => {
        const query =
          'SELECT 1 as id, ARRAY(select as struct 2 as id, "hello" as name)';

        database.run(query, (err, rows) => {
          assert.ifError(err);

          const symbols = Object.getOwnPropertySymbols(rows[0][1].value[0]);
          assert.strictEqual(symbols.length, 1);
          assert.strictEqual(rows[0][1].value[0][symbols[0]], 'struct');

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
            JSON.stringify(rows[0][0]),
            JSON.stringify(expected[0])
          );
          assert.deepStrictEqual(
            JSON.stringify(rows[0][1].value[0][0]),
            JSON.stringify(expected[1].value[0][0])
          );
          assert.deepStrictEqual(
            JSON.stringify(rows[0][1].value[0][1]),
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
          const intValue = row.toJSON({wrapNumbers: true}).IntValue.value;
          assert.strictEqual(intValue, value);
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

          const expected = values.map(Spanner.int);
          assert.deepStrictEqual(row.toJSON().IntArray, expected);
          done();
        });
      });
    });

    describe('float64s', () => {
      it('should write float64 values', done => {
        insert({FloatValue: Spanner.float(8.2)}, (err, row) => {
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

          const expected = values.map(Spanner.float);
          assert.deepStrictEqual(row.toJSON().FloatArray, expected);
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
        const date = new Date();

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
        const values = [new Date(), new Date('3-3-1933')];

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

          const returnedValues = row.toJSON().DateArray.map(Spanner.date);
          assert.deepStrictEqual(returnedValues, values);

          done();
        });
      });
    });

    describe('commit timestamp', () => {
      it('should accept the commit timestamp placeholder', done => {
        const data = {CommitTimestamp: Spanner.COMMIT_TIMESTAMP};

        insert(data, (err, row, commitResponse) => {
          assert.ifError(err);

          const timestampFromCommit = fromProtoToDate(
            commitResponse.commitTimestamp
          );
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
        assert.strictEqual(metadata.name, instance.formattedName_);
        done();
      });
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
        instance.getMetadata(done);
      });
    });

    it('should list the instances', done => {
      spanner.getInstances((err, instances) => {
        assert.ifError(err);
        assert(instances.length > 0);
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

    it('should update the metadata', done => {
      const newData = {
        displayName: 'new-display-name',
      };

      instance.setMetadata(
        newData,
        execAfterOperationComplete(err => {
          assert.ifError(err);

          instance.getMetadata((err, metadata) => {
            assert.ifError(err);
            assert.strictEqual(metadata.displayName, newData.displayName);
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
        assert(instanceConfigs.length > 0);
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
    const database = instance.database(generateName('database'));

    before(done => {
      database.create(execAfterOperationComplete(done));
    });

    after(done => {
      database.close(err => {
        if (err) {
          return done(err);
        }

        database.delete(done);
      });
    });

    it('should auto create a database', done => {
      const database = instance.database(generateName('database'));

      database.get({autoCreate: true}, err => {
        assert.ifError(err);
        database.getMetadata(done);
      });
    });

    it('should have created the database', done => {
      database.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual(metadata.name, database.formattedName_);
        assert.strictEqual(metadata.state, 'READY');
        done();
      });
    });

    it('should list the databases from an instance', done => {
      instance.getDatabases((err, databases) => {
        assert.ifError(err);
        assert(databases.length > 0);
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
      database.exists((err, exists) => {
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
        CREATE TABLE Singers (
          SingerId INT64 NOT NULL,
          FirstName STRING(1024),
          LastName STRING(1024),
          SingerInfo BYTES(MAX),
        ) PRIMARY KEY(SingerId)`;

      database.updateSchema(
        [createTableStatement],
        execAfterOperationComplete(err => {
          assert.ifError(err);

          function replaceNewLinesAndSpacing(str) {
            return str.replace(/\n\s*/g, '').replace(/\s+/g, ' ');
          }

          database.getSchema((err, statements) => {
            assert.ifError(err);
            assert.strictEqual(
              replaceNewLinesAndSpacing(statements[0]),
              replaceNewLinesAndSpacing(createTableStatement)
            );
            done();
          });
        })
      );
    });
  });

  describe('Sessions', () => {
    const database = instance.database(generateName('database'));
    const session = database.session();

    before(done => {
      async.series(
        [
          (next) => {
            database.create(
              {
                schema: `
                  CREATE TABLE Singers (
                    SingerId STRING(1024) NOT NULL,
                    Name STRING(1024),
                  ) PRIMARY KEY(SingerId)`,
              },
              execAfterOperationComplete(next)
            );
          },
          (next) => {
            session.create(next);
          },
        ],
        done
      );
    });

    after(done => {
      session.delete(done);
    });

    it('should have created the session', done => {
      session.getMetadata((err, metadata) => {
        assert.ifError(err);
        assert.strictEqual(session.formattedName_, metadata.name);
        done();
      });
    });

    it('should get a session by name', done => {
      const shortName = session.formattedName_.split('/').pop();
      const sessionByShortName = database.session(shortName);

      sessionByShortName.getMetadata((err, metadataByName) => {
        assert.ifError(err);
        session.getMetadata((err, metadata) => {
          assert.ifError(err);
          assert.strictEqual(metadataByName.name, metadata.name);
          done();
        });
      });
    });

    it('should keep the session alive', done => {
      session.keepAlive(done);
    });
  });

  describe('Tables', () => {
    const database = instance.database(generateName('database'));
    const table = database.table('Singers');

    before(() => {
      return database
        .create()
        .then(onPromiseOperationComplete)
        .then(() => {
          return table.create(`
            CREATE TABLE Singers (
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
            ) PRIMARY KEY(SingerId)`);
        })
        .then(onPromiseOperationComplete);
    });

    after(() => {
      return table
        .delete()
        .then(onPromiseOperationComplete)
        .then(() => {
          return database.delete();
        });
    });

    it('should throw an error for non-existant tables', done => {
      const table = database.table(generateName('nope'));

      table.insert(
        {
          SingerId: generateName('id'),
        },
        err => {
          assert.strictEqual(err.code, 5);
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
          assert.strictEqual(err.code, 5);
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
              // tslint:disable-next-line no-any
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

          // tslint:disable-next-line no-any
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
            // tslint:disable-next-line no-any
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

            // tslint:disable-next-line no-any
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

      const table = database.table('SingersComposite');

      const keys = [[id1, name1], [id2, name2]];

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

          return table.deleteRows(keys);
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
      const id1 = generateName('id');
      const name1 = generateName('name');

      const id2 = generateName('id');
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

          database.run('SELECT * FROM Singers', (err, rows) => {
            assert.ifError(err);

            // We just want the two most recent ones.
            rows.splice(0, rows.length - 2);

            rows = rows.map(x => x.toJSON());

            assert.strictEqual(rows[0].SingerId, id1);
            assert.strictEqual(rows[0].Name, name1);

            assert.strictEqual(rows[1].SingerId, id2);
            assert.strictEqual(rows[1].Name, name2);

            done();
          });
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

              const row = rows[0].toJSON();

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

              const row = rows[0].toJSON();

              assert.strictEqual(row.SingerId, updatedRow.SingerId);
              assert.strictEqual(row.Name, updatedRow.Name);

              done();
            }
          );
        });
      });
    });

    describe('insert & query', () => {
      const DATE = new Date('1969-08-20');

      const ID = generateName('id');
      const NAME = generateName('name');
      const FLOAT = 8.2;
      const INT = 2;
      const INFO = Buffer.from(generateName('info'));
      const CREATED = new Date();
      const DOB = Spanner.date(DATE);
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
      EXPECTED_ROW.DOB = DATE;
      EXPECTED_ROW.Float = FLOAT;
      EXPECTED_ROW.Int = INT;
      EXPECTED_ROW.PhoneNumbers = [
        Spanner.int(PHONE_NUMBERS[0]),
        Spanner.int(PHONE_NUMBERS[1]),
      ];

      before(() => {
        return table.insert(INSERT_ROW);
      });

      it('should query in callback mode', done => {
        const options = {
          readOnly: true,
          strong: true,
        };

        database.run(
          {
            sql: 'SELECT * FROM Singers WHERE SingerId=@id',
            params: {id: ID},
          },
          options,
          (err, rows) => {
            assert.ifError(err);
            assert.deepStrictEqual(rows.shift().toJSON(), EXPECTED_ROW);
            done();
          }
        );
      });

      it('should query in promise mode', done => {
        const options = {
          readOnly: true,
          strong: true,
        };

        database
          .run(
            {
              sql: 'SELECT * FROM Singers WHERE SingerId=@id',
              params: {id: ID},
            },
            options
          )
          .then(data => {
            const rows = data[0];
            assert.deepStrictEqual(rows.shift().toJSON(), EXPECTED_ROW);
            done();
          })
          .catch(done);
      });

      it('should query in stream mode', done => {
        const options = {
          readOnly: true,
          strong: true,
        };
        let row;

        const stream = database
          .runStream(
            {
              sql: 'SELECT * FROM Singers WHERE SingerId=@id',
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
        database.run('SELECT 1', done);
      });

      it('should fail invalid queries', done => {
        database.run('SELECT Apples AND Oranges', err => {
          assert.strictEqual(err.code, 3);
          done();
        });
      });

      it('should query an array of structs', done => {
        const query = `
          SELECT ARRAY(SELECT AS STRUCT C1, C2
            FROM (SELECT 'a' AS C1, 1 AS C2 UNION ALL SELECT 'b' AS C1, 2 AS C2)
            ORDER BY C1 ASC)`;

        database.run(query, (err, rows) => {
          assert.ifError(err);

          const values = rows[0][0].value;
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

        database.run(query, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows[0][0].value.length, 0);
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });
        });

        describe('timestamp', () => {
          it('should bind the value', done => {
            const timestamp = new Date();

            const query = {
              sql: 'SELECT @v',
              params: {
                v: timestamp,
              },
            };

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = [new Date(), new Date('3-3-1999'), null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', done => {
            const values = [];

            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', done => {
            const values = [
              Spanner.date(),
              Spanner.date(new Date('3-3-1999')),
              null,
            ];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, (err, rows) => {
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

            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
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

            database.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0].toJSON();
              assert.strictEqual(row.userf, 'bob');

              done();
            });
          });

          it('should bind null structs', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0];
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

            database.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0].toJSON();
              assert.strictEqual(row.nestedf, 'bob');

              done();
            });
          });

          it('should bind null nested structs', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0].toJSON();
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should bind structs with null fields', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);

              const row = rows[0].toJSON();
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);

              rows = rows.map(row => row.toJSON());

              assert.strictEqual(rows.length, 2);
              assert.strictEqual(rows[0].threadid, 12);
              assert.strictEqual(rows[1].threadid, 13);

              done();
            });
          });

          it('should allow an array of structs with null fields', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows.length, 0);

              done();
            });
          });

          it('should allow a null array of structs', done => {
            const query = {
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

            database.run(query, (err, rows) => {
              assert.ifError(err);
              assert.strictEqual(rows.length, 0);
              done();
            });
          });
        });
      });

      describe('large reads', () => {
        const table = database.table('LargeReads');

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
              CREATE TABLE LargeReads (
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

              const row = rows[0].toJSON();

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

          database.run(query, (err, rows) => {
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
                assert.deepStrictEqual(rows[0].toJSON(), ROW);
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
              assert.deepStrictEqual(rows[0].toJSON(), ROW);
              done();
            }
          );
        });
      });
    });

    describe('read', () => {
      const table = database.table('ReadTestTable');

      const ALL_COLUMNS = ['Key', 'StringValue'];

      before(() => {
        return table
          .create(
            `
            CREATE TABLE ReadTestTable (
              Key STRING(MAX) NOT NULL,
              StringValue STRING(MAX)
            ) PRIMARY KEY (Key)`
          )
          .then(onPromiseOperationComplete)
          .then(() => {
            return database.updateSchema(`
              CREATE INDEX ReadByValue ON ReadTestTable(StringValue)`);
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
          table.read(test.query, (err, rows) => {
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
            // tslint:disable-next-line no-any
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

          table.read(query, (err, rows) => {
            test.assertions(err, rows);
            done();
          });
        });
      });

      it('should read over invalid database fails', done => {
        const database = instance.database(generateName('invalid'));
        const table = database.table('ReadTestTable');

        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
        };

        table.read(query, err => {
          assert.strictEqual(err.code, 5);
          done();
        });
      });

      it('should read over invalid table fails', done => {
        const table = database.table('ReadTestTablezzz');

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

      it('should fail if deadline exceeds', done => {
        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
          gaxOptions: {
            timeout: 1,
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
    const database = instance.database(generateName('database'));
    const table = database.table('Singers');

    before(done => {
      async.series(
        [
          (next) => {
            database.create(
              {
                schema: `
                  CREATE TABLE Singers (
                    SingerId STRING(1024) NOT NULL,
                    Name STRING(1024),
                  ) PRIMARY KEY(SingerId)`,
              },
              execAfterOperationComplete(next)
            );
          },
        ],
        done
      );
    });

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

          database.run('SELECT * FROM Singers', (err, rows) => {
            assert.ifError(err);
            assert.deepStrictEqual(rows.pop().toJSON(), {
              SingerId: id,
              Name: name,
            });
            done();
          });
        }
      );
    });

    it('should insert and query multiple rows', done => {
      const id1 = generateName('id');
      const name1 = generateName('name');

      const id2 = generateName('id');
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

          database.run('SELECT * FROM Singers', (err, rows) => {
            assert.ifError(err);

            // We just want the two most recent ones.
            rows.splice(0, rows.length - 2);

            rows = rows.map(x => x.toJSON());

            assert.deepStrictEqual(rows, [
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
          });
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

          // tslint:disable-next-line no-any
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

              rows = rows.map(x => x.toJSON());

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
    const database = instance.database(generateName('database'));
    const table = database.table('TxnTable');

    // tslint:disable-next-line no-any
    const records: any[] = [];

    before(() => {
      return database
        .create()
        .then(onPromiseOperationComplete)
        .then(() => {
          return table.create(`
            CREATE TABLE TxnTable (
              Key STRING(MAX) NOT NULL,
              StringValue STRING(MAX),
              NumberValue INT64
            ) PRIMARY KEY (Key)`);
        })
        .then(onPromiseOperationComplete)
        .then(() => {
          // tslint:disable-next-line no-any
          const data: any[] = [];

          for (let i = 0; i < 5; i++) {
            data.push({
              Key: 'k' + i,
              StringValue: 'v' + i,
            });
          }

          return data.reduce((promise, entry) => {
            return promise.then(() => {
              const record = extend(
                {
                  timestamp: new Date(),
                },
                entry
              );

              records.push(record);

              return table.insert(entry).then(wait.bind(null, 1000));
            });
          }, Promise.resolve());
        });
    });

    describe('read only', () => {
      it('should run a read only transaction', done => {
        const options = {
          readOnly: true,
          strong: true,
        };

        database.runTransaction(options, (err, transaction) => {
          assert.ifError(err);

          transaction.run('SELECT * FROM TxnTable', (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            transaction.end(done);
          });
        });
      });

      it('should read keys from a table', done => {
        const options = {
          readOnly: true,
        };

        database.runTransaction(options, (err, transaction) => {
          assert.ifError(err);

          const query = {
            ranges: [
              {
                startClosed: 'k0',
                endClosed: 'k4',
              },
            ],
            columns: ['Key'],
          };

          transaction.read(table.name, query, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            transaction.end(done);
          });
        });
      });

      it('should accept a read timestamp', done => {
        const options = {
          readOnly: true,
          readTimestamp: records[1].timestamp,
        };

        database.runTransaction(options, (err, transaction) => {
          assert.ifError(err);

          transaction.run('SELECT * FROM TxnTable', (err, rows) => {
            assert.ifError(err);

            assert.strictEqual(rows.length, 1);

            const row = rows[0].toJSON();

            assert.strictEqual(row.Key, records[0].Key);
            assert.strictEqual(row.StringValue, records[0].StringValue);

            transaction.end(done);
          });
        });
      });

      it('should accept a min timestamp', done => {
        const query = 'SELECT * FROM TxnTable';

        const options = {
          minReadTimestamp: new Date(),
        };

        // minTimestamp can only be used in single use transactions
        // so we can't use database.runTransaction here
        database.run(query, options, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows.length, records.length);
          done();
        });
      });

      it('should accept an exact staleness', done => {
        const options = {
          readOnly: true,
          exactStaleness: Math.ceil((Date.now() - records[2].timestamp) / 1000),
        };

        database.runTransaction(options, (err, transaction) => {
          assert.ifError(err);

          transaction.run('SELECT * FROM TxnTable', (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, 2);

            rows = rows.map(x => x.toJSON());

            assert.strictEqual(rows[0].Key, 'k0');
            assert.strictEqual(rows[0].StringValue, 'v0');
            assert.strictEqual(rows[1].Key, 'k1');
            assert.strictEqual(rows[1].StringValue, 'v1');

            transaction.end(done);
          });
        });
      });

      it('should accept a max staleness', done => {
        const query = 'SELECT * FROM TxnTable';

        const options = {
          maxStaleness: 1,
        };

        // minTimestamp can only be used in single use transactions
        // so we can't use database.runTransaction here
        database.run(query, options, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows.length, records.length);
          done();
        });
      });

      it('should do a strong read with concurrent updates', done => {
        const options = {
          readOnly: true,
          strong: true,
        };

        database.runTransaction(options, (err, transaction) => {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction.run(query, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            table.update(
              {
                Key: 'k4',
                StringValue: 'v44',
              },
              err => {
                assert.ifError(err);

                transaction.run(query, (err, rows_) => {
                  assert.ifError(err);

                  const row = rows_.pop().toJSON();
                  assert.strictEqual(row.StringValue, 'v4');

                  transaction.end(done);
                });
              }
            );
          });
        });
      });

      it('should do an exact read with concurrent updates', done => {
        const options = {
          readOnly: true,
          readTimestamp: records[records.length - 1].timestamp,
        };

        database.runTransaction(options, (err, transaction) => {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction.run(query, (err, rows) => {
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

                transaction.run(query, (err, rows_) => {
                  assert.ifError(err);

                  rows_ = extend(true, {}, rows_);

                  assert.deepStrictEqual(rows_, originalRows);

                  transaction.end(done);
                });
              }
            );
          });
        });
      });

      it('should read with staleness & concurrent updates', done => {
        const options = {
          readOnly: true,
          exactStaleness: Math.ceil((Date.now() - records[1].timestamp) / 1000),
        };

        database.runTransaction(options, (err, transaction) => {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction.run(query, (err, rows) => {
            assert.ifError(err);
            assert.strictEqual(rows.length, 1);

            table.update(
              {
                Key: 'k4',
                StringValue: 'overridden value',
              },
              err => {
                assert.ifError(err);

                transaction.run(query, (err, rows) => {
                  assert.ifError(err);
                  assert.strictEqual(rows.length, 1);

                  transaction.end(done);
                });
              }
            );
          });
        });
      });
    });

    describe('dml', () => {
      before(done => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction.runUpdate(
            {
              sql: 'INSERT INTO TxnTable (Key, StringValue) VALUES(@key, @str)',
              params: {
                key: 'k999',
                str: 'abc',
              },
            },
            err => {
              assert.ifError(err);
              transaction.commit(done);
            }
          );
        });
      });

      it('should return rowCount from runUpdate', done => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction.runUpdate(
            {
              sql:
                'UPDATE TxnTable t SET t.StringValue = @str WHERE t.Key = @key',
              params: {
                key: 'k999',
                str: 'abcd',
              },
            },
            (err, rowCount) => {
              assert.ifError(err);
              assert.strictEqual(rowCount, 1);
              transaction.rollback(done);
            }
          );
        });
      });

      it('should return rowCount from run', done => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction.run(
            {
              sql:
                'UPDATE TxnTable t SET t.StringValue = @str WHERE t.Key = @key',
              params: {
                key: 'k999',
                str: 'abcd',
              },
            },
            (err, row, stats) => {
              assert.ifError(err);

              const rowCount = Math.floor(stats[stats.rowCount]);
              assert.strictEqual(rowCount, 1);

              transaction.rollback(done);
            }
          );
        });
      });

      it('should exec multiple dml statements on the same txn', done => {
        const key = 'k1000';
        const str = 'abcd';
        const num = 11;

        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction
            .runUpdate({
              sql:
                'INSERT INTO TxnTable (Key, StringValue) VALUES (@key, @str)',
              params: {key, str},
            })
            .then(data => {
              const rowCount = data[0];
              assert.strictEqual(rowCount, 1);

              return transaction.runUpdate({
                sql:
                  'UPDATE TxnTable t SET t.NumberValue = @num WHERE t.KEY = @key',
                params: {key, num},
              });
            })
            .then(data => {
              const rowCount = data[0];
              assert.strictEqual(rowCount, 1);

              return transaction.run({
                sql: 'SELECT * FROM TxnTable WHERE Key = @key',
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

              return transaction.rollback();
            })
            .then(() => done(), done);
        });
      });

      it('should show dml changes in query results', done => {
        const key = 'k999';
        const str = 'abcd';

        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction
            .runUpdate({
              sql:
                'UPDATE TxnTable t SET t.StringValue = @str WHERE t.Key = @key',
              params: {key, str},
            })
            .then(() => {
              return transaction.run({
                sql: 'SELECT * FROM TxnTable WHERE Key = @key',
                params: {key},
              });
            })
            .then(data => {
              const rows = data[0].map(row => row.toJSON());

              assert.strictEqual(rows.length, 1);
              assert.strictEqual(rows[0].StringValue, str);
            })
            .then(() => transaction.rollback(done), done);
        });
      });

      it('should rollback a dml statement', done => {
        const key = 'k999';
        const str = 'abcd';

        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction
            .runUpdate({
              sql:
                'UPDATE TxnTable t SET t.StringValue = @str WHERE t.Key = @key',
              params: {key, str},
            })
            .then(() => transaction.rollback())
            .then(() => {
              return database.run({
                sql: 'SELECT * FROM TxnTable WHERE Key = @key',
                params: {key},
              });
            })
            .then(data => {
              const rows = data[0].map(row => row.toJSON());
              assert.notStrictEqual(rows[0].StringValue, str);
              done();
            })
            .catch(done);
        });
      });

      it('should handle using both dml and insert methods', (done) => {
        const str = 'dml+mutation';

        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction
            .runUpdate({
              sql:
                'INSERT INTO TxnTable (Key, StringValue) VALUES (@key, @str)',
              params: {
                key: 'k1001',
                str,
              },
            })
            .then(() => {
              transaction.insert('TxnTable', {
                Key: 'k1002',
                StringValue: str,
              });

              return transaction.commit();
            })
            .then(() => {
              return database.run({
                sql: 'SELECT * FROM TxnTable WHERE StringValue = @str',
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
      it('should execute a simple pdml statement', done => {
        database.runPartitionedUpdate(
          {
            sql:
              'UPDATE TxnTable t SET t.StringValue = @str WHERE t.Key = @key',
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

      it.skip('should execute a long running pdml statement', () => {
        const count = 10000;

        const tableData = new Array(count)
          .fill(0)
          .map((_, i) => {
            return {Key: `longpdml${i}`, StringValue: 'a'};
          });

        const str = new Array(1000)
          .fill('b')
          .join('\n');

        return database
          .runTransactionAsync(transaction => {
            transaction.insert('TxnTable', tableData);
            return transaction.commit();
          })
          .then(() => {
            return database.runPartitionedUpdate({
              sql: `UPDATE TxnTable t SET t.StringValue = @str WHERE t.StringValue = 'a'`,
              params: {str},
            });
          })
          .then(([rowCount]) => {
            assert.strictEqual(rowCount, count);

            return database.run({
              sql: `SELECT Key FROM TxnTable WHERE StringValue = @str`,
              params: {str},
            });
          })
          .then(([rows]) => {
            assert.strictEqual(rows.length, count);
          });
      });
    });

    describe('read/write', () => {
      it('should throw an error for mismatched columns', done => {
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
            `Row at index 0 does not contain the correct number of columns.`,
            `Missing columns: ${JSON.stringify(['NumberValue'])}`,
          ].join('\n\n');
          let caughtErrorMessage;
          try {
            transaction.insert(table.name, rows);
          } catch (e) {
            caughtErrorMessage = e.message;
          }
          assert.strictEqual(caughtErrorMessage, expectedErrorMessage);
          transaction.end(done);
        });
      });

      it('should commit a transaction', done => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction.insert(table.name, {
            Key: 'k5',
            StringValue: 'v5',
          });

          transaction.commit(done);
        });
      });

      it('should rollback a transaction', done => {
        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction.run('SELECT * FROM TxnTable', err => {
            assert.ifError(err);
            transaction.rollback(done);
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

        it('should handle concurrent transactions with read', done => {
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

                transaction.update(table.name, {
                  Key: defaultRowValues.Key,
                  NumberValue: value + 1,
                });

                transaction.commit(callback);
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

        it('should handle concurrent transactions with query', done => {
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

                transaction.update(table.name, {
                  Key: defaultRowValues.Key,
                  NumberValue: value + 1,
                });

                transaction.commit(callback);
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

      it('should retry an aborted txn when reading fails', done => {
        const key = 'k888';
        const query = `SELECT * FROM ${table.name} WHERE Key = '${key}'`;

        let attempts = 0;

        const expectedRow = {
          Key: key,
          NumberValue: null,
          StringValue: 'abc',
        };

        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction.run(query, err => {
            assert.ifError(err);

            const action = attempts++ === 0 ? runOtherTransaction : wrap;

            action(err => {
              assert.ifError(err);

              transaction.run(query, (err, rows) => {
                assert.ifError(err);

                transaction.insert(table.name, {
                  Key: generateName('key'),
                  StringValue: generateName('val'),
                });

                transaction.commit(err => {
                  assert.ifError(err);

                  const lastRow = rows.pop().toJSON();

                  assert.deepStrictEqual(lastRow, expectedRow);
                  assert.strictEqual(attempts, 2);

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

            transaction.run(query, err => {
              if (err) {
                callback(err);
                return;
              }

              transaction.insert(table.name, expectedRow);
              transaction.commit(callback);
            });
          });
        }

        function wrap(callback) {
          setImmediate(callback);
        }
      });

      it('should retry an aborted txn when commit fails', done => {
        const key = 'k9999';
        const query = `SELECT * FROM ${table.name} WHERE Key = '${key}'`;
        let attempts = 0;

        const expectedRow = {
          Key: key,
          NumberValue: null,
          StringValue: 'abc',
        };

        database.runTransaction((err, transaction) => {
          assert.ifError(err);

          transaction.run(query, (err, rows) => {
            assert.ifError(err);

            transaction.insert(table.name, {
              Key: generateName('key'),
              StringValue: generateName('val'),
            });

            if (attempts++ === 0) {
              runOtherTransaction(err => {
                assert.ifError(err);
                transaction.commit(done); // should not execute callback
              });
              return;
            }

            transaction.commit(err => {
              assert.ifError(err);

              const lastRow = rows.pop().toJSON();

              assert.deepStrictEqual(lastRow, expectedRow);
              assert.strictEqual(attempts, 2);

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

            transaction.run(query, err => {
              if (err) {
                callback(err);
                return;
              }

              transaction.insert(table.name, expectedRow);
              transaction.commit(callback);
            });
          });
        }
      });

      it('should return a deadline error instead of aborted', done => {
        const options = {
          timeout: 10,
        };

        const query = `SELECT * FROM ${table.name}`;
        let attempts = 0;

        database.runTransaction(options, (err, transaction) => {
          if (attempts++ === 1) {
            assert.strictEqual(err.code, 4);
            assert(
              err.message.startsWith(
                'Deadline for Transaction exceeded. - 10 ABORTED'
              )
            );

            done();
            return;
          }

          assert.ifError(err);

          transaction.run(query, err => {
            assert.ifError(err);

            transaction.insert(table.name, {
              Key: generateName('key'),
            });

            runOtherTransaction(err => {
              assert.ifError(err);

              transaction.commit(() => {
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

            transaction.run(query, err => {
              if (err) {
                callback(err);
                return;
              }

              transaction.insert(table.name, {
                Key: generateName('key'),
              });

              transaction.commit(callback);
            });
          });
        }
      });
    });
  });
});

function generateName(resourceType) {
  return (
    PREFIX +
    resourceType +
    '-' +
    uuid
      .v1()
      .split('-')
      .shift()
  );
}

function onPromiseOperationComplete(data) {
  const operation = data[data.length - 2];
  return operation.promise();
}

function execAfterOperationComplete(callback) {
  // tslint:disable-next-line only-arrow-functions
  return function(err) {
    // arguments = [..., op, apiResponse]
    const operation = arguments[arguments.length - 2];
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

function deleteTestInstances(done) {
  spanner.getInstances(
    {
      filter: `labels.${LABEL}:true`,
    },
    (err, instances) => {
      if (err) {
        done(err);
        return;
      }

      async.eachLimit(
        instances,
        5,
        (instance, callback) => {
          setTimeout(() => {
            // tslint:disable-next-line no-any
            (instance as any).delete(callback);
          }, 500); // Delay allows the instance and its databases to fully clear.
        },
        done
      );
    }
  );
}

function deleteTestResources(callback) {
  async.series([deleteTestInstances], callback);
}

function wait(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

function fromProtoToDate(obj) {
  const milliseconds = Math.floor(obj.nanos) / 1e6;
  return new Date(Math.floor(obj.seconds) * 1000 + milliseconds);
}
