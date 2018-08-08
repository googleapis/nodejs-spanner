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

const assert = require('assert');
const async = require('async');
const concat = require('concat-stream');
const crypto = require('crypto');
const extend = require('extend');
const is = require('is');
const uuid = require('uuid');

const Spanner = require('../');

const PREFIX = 'gcloud-tests-';
const spanner = new Spanner({projectId: process.env.GCLOUD_PROJECT});

describe('Spanner', function() {
  const instance = spanner.instance(generateName('instance'));

  const INSTANCE_CONFIG = {
    config: 'regional-us-central1',
    nodes: 1,
    labels: {
      'gcloud-tests': 'true',
    },
  };

  before(function(done) {
    async.series(
      [
        deleteTestResources,

        function(next) {
          instance.create(INSTANCE_CONFIG, execAfterOperationComplete(next));
        },
      ],
      done
    );
  });

  after(deleteTestResources);

  describe('types', function() {
    const database = instance.database(generateName('database'));
    const table = database.table('TypeCheck');

    function insert(insertData, callback) {
      const id = generateName('id');

      insertData.Key = id;

      table.insert(insertData, function(err, insertResp) {
        if (err) {
          callback(err);
          return;
        }

        database.run(
          {
            sql: 'SELECT * FROM `' + table.name + '` WHERE Key = @id',
            params: {
              id: id,
            },
          },
          function(err, rows, readResp) {
            if (err) {
              callback(err);
              return;
            }

            callback(null, rows.shift(), insertResp, readResp);
          }
        );
      });
    }

    before(function(done) {
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

    describe('uneven rows', function() {
      it('should allow differently-ordered rows', function(done) {
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

        table.insert(data, function(err) {
          assert.ifError(err);

          database.run(
            {
              sql: `SELECT * FROM \`${table.name}\` WHERE Key = @a OR KEY = @b`,
              params: {
                a: data[0].Key,
                b: data[1].Key,
              },
            },
            function(err, rows) {
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

    describe('structs', function() {
      it('should correctly decode structs', function(done) {
        const query = 'SELECT ARRAY(SELECT as struct 1, "hello")';

        database.run(query, function(err, rows) {
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

      it('should correctly decode structs', function(done) {
        const query =
          'SELECT 1 as id, ARRAY(select as struct 2 as id, "hello" as name)';

        database.run(query, function(err, rows) {
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

    describe('booleans', function() {
      it('should write boolean values', function(done) {
        insert({BoolValue: true}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().BoolValue, true);
          done();
        });
      });

      it('should write null boolean values', function(done) {
        insert({BoolValue: null}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().BoolValue, null);
          done();
        });
      });

      it('should write empty boolean array values', function(done) {
        insert({BoolArray: []}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BoolArray, []);
          done();
        });
      });

      it('should write null boolean array values', function(done) {
        insert({BoolArray: [null]}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BoolArray, [null]);
          done();
        });
      });

      it('should write boolean array values', function(done) {
        insert({BoolArray: [true, false]}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BoolArray, [true, false]);
          done();
        });
      });
    });

    describe('int64s', function() {
      it('should write int64 values', function(done) {
        insert({IntValue: Spanner.int(1234)}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntValue, 1234);
          done();
        });
      });

      it('should write null int64 values', function(done) {
        insert({IntValue: null}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().IntValue, null);
          done();
        });
      });

      it('should throw for of bounds integers', function(done) {
        const value = '9223372036854775807';

        insert({IntValue: value}, function(err, row) {
          assert.ifError(err);

          assert.throws(function() {
            row.toJSON();
          }, new RegExp('Serializing column "IntValue" encountered an error'));

          done();
        });
      });

      it('should optionally wrap out of bounds integers', function(done) {
        const value = '9223372036854775807';

        insert({IntValue: value}, function(err, row) {
          assert.ifError(err);
          const intValue = row.toJSON({wrapNumbers: true}).IntValue.value;
          assert.strictEqual(intValue, value);
          done();
        });
      });

      it('should write empty in64 array values', function(done) {
        insert({IntArray: []}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntArray, []);
          done();
        });
      });

      it('should write null int64 array values', function(done) {
        insert({IntArray: [null]}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().IntArray, [null]);
          done();
        });
      });

      it('should write int64 array values', function(done) {
        const values = [1, 2, 3];

        insert({IntArray: values}, function(err, row) {
          assert.ifError(err);

          const expected = values.map(Spanner.int);
          assert.deepStrictEqual(row.toJSON().IntArray, expected);
          done();
        });
      });
    });

    describe('float64s', function() {
      it('should write float64 values', function(done) {
        insert({FloatValue: Spanner.float(8.2)}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatValue, 8.2);
          done();
        });
      });

      it('should write null float64 values', function(done) {
        insert({FloatValue: null}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().FloatValue, null);
          done();
        });
      });

      it('should accept a Float object with an Int-like value', function(done) {
        insert({FloatValue: Spanner.float(8)}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatValue, 8);
          done();
        });
      });

      it('should handle Infinity', function(done) {
        insert({FloatValue: Infinity}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatValue, Infinity);
          done();
        });
      });

      it('should handle -Infinity', function(done) {
        insert({FloatValue: -Infinity}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatValue, -Infinity);
          done();
        });
      });

      it('should handle NaN', function(done) {
        insert({FloatValue: NaN}, function(err, row) {
          assert.ifError(err);
          assert(isNaN(row.toJSON().FloatValue));
          done();
        });
      });

      it('should write empty float64 array values', function(done) {
        insert({FloatArray: []}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatArray, []);
          done();
        });
      });

      it('should write null float64 array values', function(done) {
        insert({FloatArray: [null]}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().FloatArray, [null]);
          done();
        });
      });

      it('should write float64 array values', function(done) {
        const values = [1.2, 2.3, 3.4];

        insert({FloatArray: values}, function(err, row) {
          assert.ifError(err);

          const expected = values.map(Spanner.float);
          assert.deepStrictEqual(row.toJSON().FloatArray, expected);
          done();
        });
      });
    });

    describe('strings', function() {
      it('should write string values', function(done) {
        insert({StringValue: 'abc'}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().StringValue, 'abc');
          done();
        });
      });

      it('should write null string values', function(done) {
        insert({StringValue: null}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().StringValue, null);
          done();
        });
      });

      it('should write empty string array values', function(done) {
        insert({StringArray: []}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().StringArray, []);
          done();
        });
      });

      it('should write null string array values', function(done) {
        insert({StringArray: [null]}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().StringArray, [null]);
          done();
        });
      });

      it('should write string array values', function(done) {
        insert({StringArray: ['abc', 'def']}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().StringArray, ['abc', 'def']);
          done();
        });
      });
    });

    describe('bytes', function() {
      it('should write bytes values', function(done) {
        insert({BytesValue: Buffer.from('abc')}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesValue, Buffer.from('abc'));
          done();
        });
      });

      it('should write null bytes values', function(done) {
        insert({BytesValue: null}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().BytesValue, null);
          done();
        });
      });

      it('should write empty bytes array values', function(done) {
        insert({BytesArray: []}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesArray, []);
          done();
        });
      });

      it('should write null bytes array values', function(done) {
        insert({BytesArray: [null]}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesArray, [null]);
          done();
        });
      });

      it('should write bytes array values', function(done) {
        const values = [Buffer.from('a'), Buffer.from('b')];

        insert({BytesArray: values}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().BytesArray, values);
          done();
        });
      });
    });

    describe('timestamps', function() {
      it('should write timestamp values', function(done) {
        const date = new Date();

        insert({TimestampValue: date}, function(err, row) {
          assert.ifError(err);
          const time = row.toJSON().TimestampValue.getTime();
          assert.strictEqual(time, date.getTime());
          done();
        });
      });

      it('should write null timestamp values', function(done) {
        insert({TimestampValue: null}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().TimestampValue, null);
          done();
        });
      });

      it('should write empty timestamp array values', function(done) {
        insert({TimestampArray: []}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().TimestampArray, []);
          done();
        });
      });

      it('should write null timestamp array values', function(done) {
        insert({TimestampArray: [null]}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().TimestampArray, [null]);
          done();
        });
      });

      it('should write timestamp array values', function(done) {
        const values = [new Date(), new Date('3-3-1933')];

        insert({TimestampArray: values}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().TimestampArray, values);
          done();
        });
      });
    });

    describe('dates', function() {
      it('should write date values', function(done) {
        const date = Spanner.date();

        insert({DateValue: date}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(Spanner.date(row.toJSON().DateValue), date);
          done();
        });
      });

      it('should write null date values', function(done) {
        insert({DateValue: null}, function(err, row) {
          assert.ifError(err);
          assert.strictEqual(row.toJSON().DateValue, null);
          done();
        });
      });

      it('should write empty date array values', function(done) {
        insert({DateArray: []}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().DateArray, []);
          done();
        });
      });

      it('should write null date array values', function(done) {
        insert({DateArray: [null]}, function(err, row) {
          assert.ifError(err);
          assert.deepStrictEqual(row.toJSON().DateArray, [null]);
          done();
        });
      });

      it('should write date array values', function(done) {
        const values = [Spanner.date(), Spanner.date('3-3-1933')];

        insert({DateArray: values}, function(err, row) {
          assert.ifError(err);

          const returnedValues = row.toJSON().DateArray.map(Spanner.date);
          assert.deepStrictEqual(returnedValues, values);

          done();
        });
      });
    });

    describe('commit timestamp', function() {
      it('should accept the commit timestamp placeholder', function(done) {
        const data = {CommitTimestamp: Spanner.COMMIT_TIMESTAMP};

        insert(data, function(err, row, commitResponse) {
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

    it('should throw an error for incorrect value types', function(done) {
      table.insert({BoolValue: 'abc'}, function(err) {
        assert(err);
        done();
      });
    });
  });

  describe('Instances', function() {
    it('should have created the instance', function(done) {
      instance.getMetadata(function(err, metadata) {
        assert.ifError(err);
        assert.strictEqual(metadata.name, instance.formattedName_);
        done();
      });
    });

    it('should auto create an instance', function(done) {
      const instance = spanner.instance(generateName('instance'));

      const config = extend(
        {
          autoCreate: true,
        },
        INSTANCE_CONFIG
      );

      instance.get(config, function(err) {
        assert.ifError(err);
        instance.getMetadata(done);
      });
    });

    it('should list the instances', function(done) {
      spanner.getInstances(function(err, instances) {
        assert.ifError(err);
        assert(instances.length > 0);
        done();
      });
    });

    it('should list the instances in promise mode', function(done) {
      spanner
        .getInstances()
        .then(function(data) {
          const instances = data[0];
          assert(instances.length > 0);
          done();
        })
        .catch(done);
    });

    it('should list the instances in stream mode', function(done) {
      spanner
        .getInstancesStream()
        .on('error', done)
        .pipe(
          concat(function(instances) {
            assert(instances.length > 0);
            done();
          })
        );
    });

    it('should update the metadata', function(done) {
      const newData = {
        displayName: 'new-display-name',
      };

      instance.setMetadata(
        newData,
        execAfterOperationComplete(function(err) {
          assert.ifError(err);

          instance.getMetadata(function(err, metadata) {
            assert.ifError(err);
            assert.strictEqual(metadata.displayName, newData.displayName);
            done();
          });
        })
      );
    });
  });

  describe('instanceConfigs', function() {
    it('should list the available instanceConfigs', function(done) {
      spanner.getInstanceConfigs(function(err, instanceConfigs) {
        assert.ifError(err);
        assert(instanceConfigs.length > 0);
        done();
      });
    });

    it('should list the instanceConfigs in promise mode', function(done) {
      spanner
        .getInstanceConfigs()
        .then(function(data) {
          const instanceConfigs = data[0];
          assert(instanceConfigs.length > 0);
          done();
        })
        .catch(done);
    });

    it('should list the instanceConfigs in stream mode', function(done) {
      spanner
        .getInstanceConfigsStream()
        .on('error', done)
        .pipe(
          concat(function(instanceConfigs) {
            assert(instanceConfigs.length > 0);
            done();
          })
        );
    });
  });

  describe('Databases', function() {
    const database = instance.database(generateName('database'));

    before(function(done) {
      database.create(execAfterOperationComplete(done));
    });

    after(function(done) {
      database.close(function(err) {
        if (err) {
          return done(err);
        }

        database.delete(done);
      });
    });

    it('should auto create a database', function(done) {
      const database = instance.database(generateName('database'));

      database.get({autoCreate: true}, function(err) {
        assert.ifError(err);
        database.getMetadata(done);
      });
    });

    it('should have created the database', function(done) {
      database.getMetadata(function(err, metadata) {
        assert.ifError(err);
        assert.strictEqual(metadata.name, database.formattedName_);
        assert.strictEqual(metadata.state, 'READY');
        done();
      });
    });

    it('should list the databases from an instance', function(done) {
      instance.getDatabases(function(err, databases) {
        assert.ifError(err);
        assert(databases.length > 0);
        done();
      });
    });

    it('should list the databases in promise mode', function(done) {
      instance
        .getDatabases()
        .then(function(data) {
          const databases = data[0];
          assert(databases.length > 0);
          done();
        })
        .catch(done);
    });

    it('should list the databases in stream mode', function(done) {
      instance
        .getDatabasesStream()
        .on('error', done)
        .pipe(
          concat(function(databases) {
            assert(databases.length > 0);
            done();
          })
        );
    });

    it('should create a table', function(done) {
      const createTableStatement = `
        CREATE TABLE Singers (
          SingerId INT64 NOT NULL,
          FirstName STRING(1024),
          LastName STRING(1024),
          SingerInfo BYTES(MAX),
        ) PRIMARY KEY(SingerId)`;

      database.updateSchema(
        [createTableStatement],
        execAfterOperationComplete(function(err) {
          assert.ifError(err);

          function replaceNewLinesAndSpacing(str) {
            return str.replace(/\n\s*/g, '').replace(/\s+/g, ' ');
          }

          database.getSchema(function(err, statements) {
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

  describe('Sessions', function() {
    const database = instance.database(generateName('database'));
    const session = database.session();

    before(function(done) {
      async.series(
        [
          function(next) {
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
          function(next) {
            session.create(next);
          },
        ],
        done
      );
    });

    after(function(done) {
      session.delete(done);
    });

    it('should have created the session', function(done) {
      session.getMetadata(function(err, metadata) {
        assert.ifError(err);
        assert.strictEqual(session.formattedName_, metadata.name);
        done();
      });
    });

    it('should get a session by name', function(done) {
      const shortName = session.formattedName_.split('/').pop();
      const sessionByShortName = database.session(shortName);

      sessionByShortName.getMetadata(function(err, metadataByName) {
        assert.ifError(err);
        session.getMetadata(function(err, metadata) {
          assert.ifError(err);
          assert.strictEqual(metadataByName.name, metadata.name);
          done();
        });
      });
    });

    it('should keep the session alive', function(done) {
      session.keepAlive(done);
    });
  });

  describe('Tables', function() {
    const database = instance.database(generateName('database'));
    const table = database.table('Singers');

    before(function() {
      return database
        .create()
        .then(onPromiseOperationComplete)
        .then(function() {
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

    after(function() {
      return table
        .delete()
        .then(onPromiseOperationComplete)
        .then(function() {
          return database.delete();
        });
    });

    it('should throw an error for non-existant tables', function(done) {
      const table = database.table(generateName('nope'));

      table.insert(
        {
          SingerId: generateName('id'),
        },
        function(err) {
          assert.strictEqual(err.code, 5);
          done();
        }
      );
    });

    it('should throw an error for non-existant columns', function(done) {
      table.insert(
        {
          SingerId: generateName('id'),
          Nope: 'abc',
        },
        function(err) {
          assert.strictEqual(err.code, 5);
          done();
        }
      );
    });

    it('should read rows as a stream', function(done) {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        function(err) {
          assert.ifError(err);

          let rows = [];

          table
            .createReadStream({
              keys: [id],
              columns: ['SingerId', 'name'],
            })
            .on('error', done)
            .on('data', function(row) {
              rows.push(row);
            })
            .on('end', function() {
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

    it('should automatically convert to JSON', function(done) {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        function(err) {
          assert.ifError(err);

          const rows = [];

          table
            .createReadStream({
              keys: [id],
              columns: ['SingerId', 'name'],
              json: true,
            })
            .on('error', done)
            .on('data', function(row) {
              rows.push(row);
            })
            .on('end', function() {
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

    it('should automatically convert to JSON with options', function(done) {
      const id = generateName('id');

      table.insert(
        {
          SingerId: id,
          Int: 8,
        },
        function(err) {
          assert.ifError(err);

          const rows = [];

          table
            .createReadStream({
              keys: [id],
              columns: ['SingerId', 'Int'],
              json: true,
              jsonOptions: {wrapNumbers: true},
            })
            .on('error', done)
            .on('data', function(row) {
              rows.push(row);
            })
            .on('end', function() {
              assert.strictEqual(rows[0].Int.value, '8');
              done();
            });
        }
      );
    });

    it('should insert and delete a row', function(done) {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        function(err) {
          assert.ifError(err);

          table.deleteRows([id], function(err) {
            assert.ifError(err);

            const rows = [];

            table
              .createReadStream({
                keys: [id],
                columns: ['SingerId'],
              })
              .on('error', done)
              .on('data', function(row) {
                rows.push(row);
              })
              .on('end', function() {
                assert.strictEqual(rows.length, 0);
                done();
              });
          });
        }
      );
    });

    it('should insert and delete multiple rows', function(done) {
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
        function(err) {
          assert.ifError(err);

          table.deleteRows([id, id2], function(err) {
            assert.ifError(err);

            const rows = [];

            table
              .createReadStream({
                keys: [id, id2],
                columns: ['SingerId'],
              })
              .on('error', done)
              .on('data', function(row) {
                rows.push(row);
              })
              .on('end', function() {
                assert.strictEqual(rows.length, 0);
                done();
              });
          });
        }
      );
    });

    it('should insert and delete multiple composite key rows', function() {
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
        .then(function() {
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
        .then(function() {
          return table.read({
            keys: keys,
            columns: ['SingerId', 'Name'],
          });
        })
        .then(function(data) {
          const rows = data[0];

          assert.strictEqual(rows.length, 2);

          return table.deleteRows(keys);
        })
        .then(function() {
          return table.read({
            keys: keys,
            columns: ['SingerId', 'Name'],
          });
        })
        .then(function(data) {
          const rows = data[0];
          assert.strictEqual(rows.length, 0);
        });
    });

    it('should insert and query multiple rows', function(done) {
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
        function(err) {
          assert.ifError(err);

          database.run('SELECT * FROM Singers', function(err, rows) {
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

    it('should insert then replace a row', function(done) {
      const originalRow = {
        SingerId: generateName('id'),
        Name: generateName('name'),
      };

      const replacedRow = {
        SingerId: originalRow.SingerId,
      };

      table.insert(originalRow, function(err) {
        assert.ifError(err);

        table.replace(replacedRow, function(err) {
          assert.ifError(err);

          table.read(
            {
              keys: [originalRow.SingerId],
              columns: Object.keys(originalRow),
            },
            function(err, rows) {
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

    it('should insert then update a row', function(done) {
      const originalRow = {
        SingerId: generateName('id'),
        Name: generateName('name'),
      };

      const updatedRow = {
        SingerId: originalRow.SingerId,
        Name: generateName('name'),
      };

      table.insert(originalRow, function(err) {
        assert.ifError(err);

        table.update(updatedRow, function(err) {
          assert.ifError(err);

          table.read(
            {
              keys: [originalRow.SingerId],
              columns: Object.keys(originalRow),
            },
            function(err, rows) {
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

    describe('insert & query', function() {
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
        DOB: DOB,
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

      before(function() {
        return table.insert(INSERT_ROW);
      });

      it('should query in callback mode', function(done) {
        database.run('SELECT * FROM Singers', function(err, rows) {
          assert.ifError(err);
          assert.deepStrictEqual(rows.shift().toJSON(), EXPECTED_ROW);
          done();
        });
      });

      it('should query in promise mode', function(done) {
        database
          .run('SELECT * FROM Singers')
          .then(function(data) {
            const rows = data[0];
            assert.deepStrictEqual(rows.shift().toJSON(), EXPECTED_ROW);
            done();
          })
          .catch(done);
      });

      it('should query in stream mode', function(done) {
        let row;

        database
          .runStream('SELECT * FROM Singers')
          .on('error', done)
          .once('data', function(row_) {
            row = row_;
            this.end();
          })
          .on('end', function() {
            assert.deepStrictEqual(row.toJSON(), EXPECTED_ROW);
            done();
          });
      });

      it('should allow "SELECT 1" queries', function(done) {
        database.run('SELECT 1', done);
      });

      it('should fail invalid queries', function(done) {
        database.run('SELECT Apples AND Oranges', function(err) {
          assert.strictEqual(err.code, 3);
          done();
        });
      });

      it('should query an array of structs', function(done) {
        const query = `
          SELECT ARRAY(SELECT AS STRUCT C1, C2
            FROM (SELECT 'a' AS C1, 1 AS C2 UNION ALL SELECT 'b' AS C1, 2 AS C2)
            ORDER BY C1 ASC)`;

        database.run(query, function(err, rows) {
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

      it('should query an empty array of structs', function(done) {
        const query = `
          SELECT ARRAY(SELECT AS STRUCT * FROM (SELECT 'a', 1) WHERE 0 = 1)`;

        database.run(query, function(err, rows) {
          assert.ifError(err);
          assert.strictEqual(rows[0][0].value.length, 0);
          done();
        });
      });

      describe('params', function() {
        describe('boolean', function() {
          it('should bind the value', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: true,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, true);
              done();
            });
          });

          it('should allow for null values', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'bool',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', function(done) {
            const values = [false, true, false];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });
        });

        describe('int64', function() {
          it('should bind the value', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 1234,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, '1234');
              done();
            });
          });

          it('should allow for null values', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'int64',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', function(done) {
            const values = [1, 2, 3, null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const expected = values.map(function(val) {
                return is.number(val) ? {value: String(val)} : val;
              });

              assert.strictEqual(
                JSON.stringify(rows[0][0].value),
                JSON.stringify(expected)
              );
              done();
            });
          });

          it('should bind empty arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });
        });

        describe('float64', function() {
          it('should bind the value', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 2.2,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, 2.2);
              done();
            });
          });

          it('should allow for null values', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'float64',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', function(done) {
            const values = [null, 1.1, 2.3, 3.5, null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const expected = values.map(function(val) {
                return is.number(val) ? {value: val} : val;
              });

              assert.strictEqual(
                JSON.stringify(rows[0][0].value),
                JSON.stringify(expected)
              );
              done();
            });
          });

          it('should bind empty arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind Infinity', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: Infinity,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, 'Infinity');
              done();
            });
          });

          it('should bind -Infinity', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: -Infinity,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, '-Infinity');
              done();
            });
          });

          it('should bind NaN', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: NaN,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value.value, 'NaN');
              done();
            });
          });

          it('should bind an array of Infinity and NaN', function(done) {
            const values = [Infinity, -Infinity, NaN];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const expected = values.map(function(val) {
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

        describe('string', function() {
          it('should bind the value', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: 'abc',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, 'abc');
              done();
            });
          });

          it('should allow for null values', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'string',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', function(done) {
            const values = ['a', 'b', 'c', null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });
        });

        describe('bytes', function() {
          it('should bind the value', function(done) {
            const buffer = Buffer.from('abc');

            const query = {
              sql: 'SELECT @v',
              params: {
                v: buffer,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, buffer);
              done();
            });
          });

          it('should allow for null values', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'bytes',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', function(done) {
            const values = [Buffer.from('a'), Buffer.from('b'), null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });
        });

        describe('timestamp', function() {
          it('should bind the value', function(done) {
            const timestamp = new Date();

            const query = {
              sql: 'SELECT @v',
              params: {
                v: timestamp,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, timestamp);
              done();
            });
          });

          it('should allow for null values', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'timestamp',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', function(done) {
            const values = [new Date(), new Date('3-3-1999'), null];

            const query = {
              sql: 'SELECT @v',
              params: {
                v: values,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind empty arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });
        });

        describe('date', function() {
          it('should bind the value', function(done) {
            const date = Spanner.date();

            const query = {
              sql: 'SELECT @v',
              params: {
                v: date,
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const returnedDate = Spanner.date(rows[0][0].value);
              assert.deepStrictEqual(returnedDate, date);

              done();
            });
          });

          it('should allow for null values', function(done) {
            const query = {
              sql: 'SELECT @v',
              params: {
                v: null,
              },
              types: {
                v: 'date',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows[0][0].value, null);
              done();
            });
          });

          it('should bind arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const returnedValues = rows[0][0].value.map(function(val) {
                return is.nil(val) ? val : Spanner.date(val);
              });

              assert.deepStrictEqual(returnedValues, values);
              done();
            });
          });

          it('should bind empty arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, values);
              done();
            });
          });

          it('should bind null arrays', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0][0].value, null);
              done();
            });
          });
        });

        describe('structs', function() {
          it('should bind a simple struct', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0].toJSON();
              assert.strictEqual(row.userf, 'bob');

              done();
            });
          });

          it('should bind null structs', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should bind nested structs', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0].toJSON();
              assert.strictEqual(row.nestedf, 'bob');

              done();
            });
          });

          it('should bind null nested structs', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0].toJSON();
              assert.strictEqual(row.nestedf, null);

              done();
            });
          });

          it('should bind empty structs', function(done) {
            const query = {
              sql: 'SELECT @structParam IS NULL',
              params: {
                structParam: Spanner.struct(),
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, false);

              done();
            });
          });

          it('should bind null structs with no fields', function(done) {
            const query = {
              sql: 'SELECT @structParam IS NULL',
              params: {
                structParam: null,
              },
              types: {
                structParam: 'struct',
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should bind structs with null fields', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0].toJSON();
              assert.strictEqual(row.f1, null);

              done();
            });
          });

          it('should bind structs with duplicate fields', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should bind structs with missing field names', function(done) {
            const query = {
              sql: 'SELECT @structParam=STRUCT<INT64>(5)',
              params: {
                structParam: Spanner.struct([{value: Spanner.int(5)}]),
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should allow equality checks', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, true);

              done();
            });
          });

          it('should allow nullness checks', function(done) {
            const query = {
              sql: 'SELECT @structParam IS NULL',
              params: {
                structParam: Spanner.struct({
                  userf: 'bob',
                  threadf: Spanner.int(1),
                }),
              },
            };

            database.run(query, function(err, rows) {
              assert.ifError(err);

              const row = rows[0];
              assert.strictEqual(row[0].value, false);

              done();
            });
          });

          it('should allow an array of non-null structs', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);

              rows = rows.map(row => row.toJSON());

              assert.strictEqual(rows.length, 2);
              assert.strictEqual(rows[0].threadid, 12);
              assert.strictEqual(rows[1].threadid, 13);

              done();
            });
          });

          it('should allow an array of structs with null fields', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows.length, 0);

              done();
            });
          });

          it('should allow a null array of structs', function(done) {
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

            database.run(query, function(err, rows) {
              assert.ifError(err);
              assert.strictEqual(rows.length, 0);
              done();
            });
          });
        });
      });

      describe('large reads', function() {
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

          return Array(25000 + offset)
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

        before(function() {
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
            .then(function() {
              return table.insert(expectedRow);
            });
        });

        it('should read large datasets', function(done) {
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
            function(err, rows) {
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

        it('should query large datasets', function(done) {
          const query = {
            sql: 'SELECT * FROM ' + table.name + ' WHERE Key = @key',
            params: {
              key: expectedRow.Key,
            },
          };

          database.run(query, function(err, rows) {
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

    describe('upsert', function() {
      const ROW = {
        SingerId: generateName('id'),
        Name: generateName('name'),
      };

      it('should update a row', function(done) {
        const row = {
          SingerId: ROW.SingerId,
          Name: generateName('name'),
        };

        table.insert(row, function(err) {
          assert.ifError(err);

          table.upsert(ROW, function(err) {
            assert.ifError(err);

            table.read(
              {
                keys: [ROW.SingerId],
                columns: Object.keys(ROW),
              },
              function(err, rows) {
                assert.ifError(err);
                assert.deepStrictEqual(rows[0].toJSON(), ROW);
                done();
              }
            );
          });
        });
      });

      it('should insert a row', function(done) {
        table.upsert(ROW, function(err) {
          assert.ifError(err);

          table.read(
            {
              keys: [ROW.SingerId],
              columns: Object.keys(ROW),
            },
            function(err, rows) {
              assert.ifError(err);
              assert.deepStrictEqual(rows[0].toJSON(), ROW);
              done();
            }
          );
        });
      });
    });

    describe('read', function() {
      const table = database.table('ReadTestTable');

      const ALL_COLUMNS = ['Key', 'StringValue'];

      before(function() {
        return table
          .create(
            `
            CREATE TABLE ReadTestTable (
              Key STRING(MAX) NOT NULL,
              StringValue STRING(MAX)
            ) PRIMARY KEY (Key)`
          )
          .then(onPromiseOperationComplete)
          .then(function() {
            return database.updateSchema(`
              CREATE INDEX ReadByValue ON ReadTestTable(StringValue)`);
          })
          .then(onPromiseOperationComplete)
          .then(function() {
            const data = [];

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
          assertions: function(err, rows) {
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
          assertions: function(err, rows) {
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
          assertions: function(err, rows) {
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
          assertions: function(err, rows) {
            assert.ifError(err);

            assert.strictEqual(rows.length, 3);

            rows = rows.map(function(row) {
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
          assertions: function(err, rows) {
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
          assertions: function(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 2);

            rows = rows.map(function(row) {
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
          assertions: function(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 3);

            rows = rows.map(function(row) {
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
          assertions: function(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 2);

            rows = rows.map(function(row) {
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
          assertions: function(err, rows) {
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
          assertions: function(err, rows) {
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
          assertions: function(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 3);

            rows = rows.map(function(row) {
              return row.toJSON();
            });

            assert.strictEqual(rows[0].Key, 'k3');
            assert.strictEqual(rows[1].Key, 'k5');
            assert.strictEqual(rows[2].Key, 'k7');
          },
        },
      ].forEach(function(test) {
        // test normally
        it(test.test, function(done) {
          table.read(test.query, function(err, rows) {
            test.assertions(err, rows);
            done();
          });
        });

        // test using an index
        it(test.test + ' with an index', function(done) {
          const query = extend(
            {
              index: 'ReadByValue',
            },
            test.query
          );

          if (query.keys) {
            query.keys = query.keys.map(function(key) {
              return key.replace('k', 'v');
            });
          }

          if (query.ranges) {
            query.ranges = query.ranges.map(function(range_) {
              const range = extend({}, range_);

              Object.keys(range).forEach(function(bound) {
                if (range[bound]) {
                  range[bound] = range[bound].replace('k', 'v');
                }
              });

              return range;
            });
          }

          table.read(query, function(err, rows) {
            test.assertions(err, rows);
            done();
          });
        });
      });

      it('should read over invalid database fails', function(done) {
        const database = instance.database(generateName('invalid'));
        const table = database.table('ReadTestTable');

        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
        };

        table.read(query, function(err) {
          assert.strictEqual(err.code, 5);
          done();
        });
      });

      it('should read over invalid table fails', function(done) {
        const table = database.table('ReadTestTablezzz');

        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
        };

        table.read(query, function(err) {
          assert.strictEqual(err.code, 5);
          done();
        });
      });

      it('should read over invalid column fails', function(done) {
        const query = {
          keys: ['k1'],
          columns: ['ohnoes'],
        };

        table.read(query, function(err) {
          assert.strictEqual(err.code, 5);
          done();
        });
      });

      it('should fail if deadline exceeds', function(done) {
        const query = {
          keys: ['k1'],
          columns: ALL_COLUMNS,
          gaxOptions: {
            timeout: 10,
          },
        };

        table.read(query, function(err) {
          assert.strictEqual(err.code, 4);
          done();
        });
      });
    });
  });

  describe('SessionPool', function() {
    const database = instance.database(generateName('database'));
    const table = database.table('Singers');

    before(function(done) {
      async.series(
        [
          function(next) {
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

    it('should insert and query a row', function(done) {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        function(err) {
          assert.ifError(err);

          database.run('SELECT * FROM Singers', function(err, rows) {
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

    it('should insert and query multiple rows', function(done) {
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
        function(err) {
          assert.ifError(err);

          database.run('SELECT * FROM Singers', function(err, rows) {
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

    it('should read rows as a stream', function(done) {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        function(err) {
          assert.ifError(err);

          let rows = [];

          table
            .createReadStream({
              keys: [id],
              columns: ['SingerId', 'name'],
            })
            .on('error', done)
            .on('data', function(row) {
              rows.push(row);
            })
            .on('end', function() {
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

    it('should read rows', function(done) {
      const id = generateName('id');
      const name = generateName('name');

      table.insert(
        {
          SingerId: id,
          Name: name,
        },
        function(err) {
          assert.ifError(err);

          table.read(
            {
              keys: [id],
              columns: ['SingerId', 'Name'],
            },
            function(err, rows) {
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

  describe('Transactions', function() {
    const database = instance.database(generateName('database'));
    const table = database.table('TxnTable');

    const records = [];

    before(function() {
      return database
        .create()
        .then(onPromiseOperationComplete)
        .then(function() {
          return table.create(`
            CREATE TABLE TxnTable (
              Key STRING(MAX) NOT NULL,
              StringValue STRING(MAX),
              NumberValue INT64
            ) PRIMARY KEY (Key)`);
        })
        .then(onPromiseOperationComplete)
        .then(function() {
          const data = [];

          for (let i = 0; i < 5; i++) {
            data.push({
              Key: 'k' + i,
              StringValue: 'v' + i,
            });
          }

          return data.reduce(function(promise, entry) {
            return promise.then(function() {
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

    describe('read only', function() {
      it('should run a read only transaction', function(done) {
        const options = {
          readOnly: true,
          strong: true,
        };

        database.runTransaction(options, function(err, transaction) {
          assert.ifError(err);

          transaction.run('SELECT * FROM TxnTable', function(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            transaction.end(done);
          });
        });
      });

      it('should read keys from a table', function(done) {
        const options = {
          readOnly: true,
        };

        database.runTransaction(options, function(err, transaction) {
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

          transaction.read(table.name, query, function(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            transaction.end(done);
          });
        });
      });

      it('should accept a read timestamp', function(done) {
        const options = {
          readOnly: true,
          readTimestamp: records[1].timestamp,
        };

        database.runTransaction(options, function(err, transaction) {
          assert.ifError(err);

          transaction.run('SELECT * FROM TxnTable', function(err, rows) {
            assert.ifError(err);

            assert.strictEqual(rows.length, 1);

            const row = rows[0].toJSON();

            assert.strictEqual(row.Key, records[0].Key);
            assert.strictEqual(row.StringValue, records[0].StringValue);

            transaction.end(done);
          });
        });
      });

      it('should accept a min timestamp', function(done) {
        const query = 'SELECT * FROM TxnTable';

        const options = {
          minReadTimestamp: new Date(),
        };

        // minTimestamp can only be used in single use transactions
        // so we can't use database.runTransaction here
        database.run(query, options, function(err, rows) {
          assert.ifError(err);
          assert.strictEqual(rows.length, records.length);
          done();
        });
      });

      it('should accept an exact staleness', function(done) {
        const options = {
          readOnly: true,
          exactStaleness: Math.ceil((Date.now() - records[2].timestamp) / 1000),
        };

        database.runTransaction(options, function(err, transaction) {
          assert.ifError(err);

          transaction.run('SELECT * FROM TxnTable', function(err, rows) {
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

      it('should accept a max staleness', function(done) {
        const query = 'SELECT * FROM TxnTable';

        const options = {
          maxStaleness: 1,
        };

        // minTimestamp can only be used in single use transactions
        // so we can't use database.runTransaction here
        database.run(query, options, function(err, rows) {
          assert.ifError(err);
          assert.strictEqual(rows.length, records.length);
          done();
        });
      });

      it('should do a strong read with concurrent updates', function(done) {
        const options = {
          readOnly: true,
          strong: true,
        };

        database.runTransaction(options, function(err, transaction) {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction.run(query, function(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, records.length);

            table.update(
              {
                Key: 'k4',
                StringValue: 'v44',
              },
              function(err) {
                assert.ifError(err);

                transaction.run(query, function(err, rows_) {
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

      it('should do an exact read with concurrent updates', function(done) {
        const options = {
          readOnly: true,
          readTimestamp: records[records.length - 1].timestamp,
        };

        database.runTransaction(options, function(err, transaction) {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction.run(query, function(err, rows) {
            assert.ifError(err);

            const originalRows = extend(true, {}, rows);

            // Make arbitrary update.
            table.update(
              {
                Key: rows[0].toJSON().Key,
                StringValue: 'overridden value',
              },
              function(err) {
                assert.ifError(err);

                transaction.run(query, function(err, rows_) {
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

      it('should read with staleness & concurrent updates', function(done) {
        const options = {
          readOnly: true,
          exactStaleness: Math.ceil((Date.now() - records[1].timestamp) / 1000),
        };

        database.runTransaction(options, function(err, transaction) {
          assert.ifError(err);

          const query = 'SELECT * FROM TxnTable';

          transaction.run(query, function(err, rows) {
            assert.ifError(err);
            assert.strictEqual(rows.length, 1);

            table.update(
              {
                Key: 'k4',
                StringValue: 'overridden value',
              },
              function(err) {
                assert.ifError(err);

                transaction.run(query, function(err, rows) {
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

    describe('read/write', function() {
      it('should throw an error for mismatched columns', function(done) {
        database.runTransaction(function(err, transaction) {
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

          assert.throws(function() {
            transaction.insert(table.name, rows);
          }, /Error: Row at index 0 does not contain the correct number of columns\.\\n\\nMissing columns: \["NumberValue"\]/);

          transaction.end(done);
        });
      });

      it('should commit a transaction', function(done) {
        database.runTransaction(function(err, transaction) {
          assert.ifError(err);

          transaction.insert(table.name, {
            Key: 'k5',
            StringValue: 'v5',
          });

          transaction.commit(done);
        });
      });

      it('should rollback a transaction', function(done) {
        database.runTransaction(function(err, transaction) {
          assert.ifError(err);

          transaction.run('SELECT * FROM TxnTable', function(err) {
            assert.ifError(err);
            transaction.rollback(done);
          });
        });
      });

      describe('concurrent transactions', function() {
        const defaultRowValues = {
          Key: 'k0',
          NumberValue: 0,
        };

        beforeEach(function() {
          return table.update(defaultRowValues);
        });

        it('should handle concurrent transactions with read', function(done) {
          database.runTransaction(function(err, transaction) {
            assert.ifError(err);

            incrementValue(function(err) {
              assert.ifError(err);

              getValue(transaction, function(err, value) {
                assert.ifError(err);
                assert.strictEqual(value, defaultRowValues.NumberValue + 1);
                done();
              });
            });
          });

          function incrementValue(callback) {
            database.runTransaction(function(err, transaction) {
              assert.ifError(err);

              getValue(transaction, function(err, value) {
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
              function(err, rows) {
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

        it('should handle concurrent transactions with query', function(done) {
          database.runTransaction(function(err, transaction) {
            assert.ifError(err);

            incrementValue(function(err) {
              assert.ifError(err);

              getValue(transaction, function(err, value) {
                assert.ifError(err);
                assert.strictEqual(value, defaultRowValues.NumberValue + 1);
                done();
              });
            });
          });

          function incrementValue(callback) {
            database.runTransaction(function(err, transaction) {
              assert.ifError(err);

              getValue(transaction, function(err, value) {
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
              function(err, rows) {
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

      it('should retry an aborted txn when reading fails', function(done) {
        const query = `SELECT * FROM ${table.name}`;
        let attempts = 0;

        const expectedRow = {
          Key: 'k888',
          NumberValue: null,
          StringValue: 'abc',
        };

        database.runTransaction(function(err, transaction) {
          assert.ifError(err);

          transaction.run(query, function(err) {
            assert.ifError(err);

            const action = attempts++ === 0 ? runOtherTransaction : wrap;

            action(function(err) {
              assert.ifError(err);

              transaction.run(query, function(err, rows) {
                assert.ifError(err);

                transaction.insert(table.name, {
                  Key: generateName('key'),
                  StringValue: generateName('val'),
                });

                transaction.commit(function(err) {
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
          database.runTransaction(function(err, transaction) {
            if (err) {
              callback(err);
              return;
            }

            transaction.run(query, function(err) {
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

      it('should retry an aborted txn when commit fails', function(done) {
        const query = `SELECT * FROM ${table.name}`;
        let attempts = 0;

        const expectedRow = {
          Key: 'k999',
          NumberValue: null,
          StringValue: 'abc',
        };

        database.runTransaction(function(err, transaction) {
          assert.ifError(err);

          transaction.run(query, function(err, rows) {
            assert.ifError(err);

            transaction.insert(table.name, {
              Key: generateName('key'),
              StringValue: generateName('val'),
            });

            if (attempts++ === 0) {
              runOtherTransaction(function(err) {
                assert.ifError(err);
                transaction.commit(done); // should not execute callback
              });
              return;
            }

            transaction.commit(function(err) {
              assert.ifError(err);

              const lastRow = rows.pop().toJSON();

              assert.deepStrictEqual(lastRow, expectedRow);
              assert.strictEqual(attempts, 2);

              done();
            });
          });
        });

        function runOtherTransaction(callback) {
          database.runTransaction(function(err, transaction) {
            if (err) {
              callback(err);
              return;
            }

            transaction.run(query, function(err) {
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

      it('should return a deadline error instead of aborted', function(done) {
        const options = {
          timeout: 10,
        };

        const query = `SELECT * FROM ${table.name}`;
        let attempts = 0;

        database.runTransaction(options, function(err, transaction) {
          if (attempts++ === 1) {
            assert.strictEqual(err.code, 4);
            assert.strictEqual(
              err.message,
              'Deadline for Transaction exceeded.'
            );

            done();
            return;
          }

          assert.ifError(err);

          transaction.run(query, function(err) {
            assert.ifError(err);

            transaction.insert(table.name, {
              Key: generateName('key'),
            });

            runOtherTransaction(function(err) {
              assert.ifError(err);

              transaction.commit(function() {
                done(new Error('Should not have been called.'));
              });
            });
          });
        });

        function runOtherTransaction(callback) {
          database.runTransaction(function(err, transaction) {
            if (err) {
              callback(err);
              return;
            }

            transaction.run(query, function(err) {
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
  return function(err) {
    // arguments = [..., op, apiResponse]
    const operation = arguments[arguments.length - 2];
    const apiResponse = arguments[arguments.length - 1];

    if (err) {
      callback(err, apiResponse);
      return;
    }

    operation.on('error', callback).on('complete', function(metadata) {
      callback(null, metadata);
    });
  };
}

function deleteTestInstances(callback) {
  spanner.getInstances(
    {
      filter: 'labels.gcloud-tests:true',
    },
    function(err, instances) {
      if (err) {
        callback(err);
        return;
      }

      async.eachLimit(
        instances,
        5,
        function(instance, callback) {
          setTimeout(function() {
            instance.delete(callback);
          }, 500); // Delay allows the instance and its databases to fully clear.
        },
        callback
      );
    }
  );
}

function deleteTestResources(callback) {
  async.series([deleteTestInstances], callback);
}

function wait(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

function fromProtoToDate(obj) {
  const milliseconds = parseInt(obj.nanos, 10) / 1e6;
  return new Date(parseInt(obj.seconds, 10) * 1000 + milliseconds);
}
