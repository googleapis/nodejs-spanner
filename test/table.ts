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
import * as extend from 'extend';
import * as proxyquire from 'proxyquire';
import {split} from 'split-array-stream';
import * as through from 'through2';
import {util} from '@google-cloud/common-grpc';
import * as pfy from '@google-cloud/promisify';

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll(klass, options) {
    if (klass.name !== 'Table') {
      return;
    }
    promisified = true;
    assert.deepStrictEqual(options.exclude, ['delete', 'drop']);
  },
});

function FakeTransactionRequest() {}

describe('Table', () => {
  // tslint:disable-next-line no-any variable-name
  let Table: any;
  // tslint:disable-next-line no-any variable-name
  let TableCached: any;
  let table;

  const DATABASE = {
    api: {},
    makePooledRequest_() {
      return util.noop;
    },
    makePooledStreamingRequest_() {
      return util.noop;
    },
  };

  const NAME = 'table-name';

  before(() => {
    Table = proxyquire('../src/table.js', {
      '@google-cloud/promisify': fakePfy,
      './transaction-request.js': {TransactionRequest: FakeTransactionRequest},
    }).Table;
    TableCached = extend({}, Table);
  });

  beforeEach(() => {
    extend(Table, TableCached);
    table = new Table(DATABASE, NAME);
  });

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should localize API', () => {
      assert.strictEqual(table.api, DATABASE.api);
    });

    it('should localize database', () => {
      assert.strictEqual(table.database, DATABASE);
    });

    it('should localize name', () => {
      assert.strictEqual(table.name, NAME);
    });

    it('should localize request from pool', () => {
      assert.strictEqual(table.request(), util.noop);
    });

    it('should localize requestStream from pool', () => {
      assert.strictEqual(table.requestStream(), util.noop);
    });

    it('should inherit from TransactionRequest', () => {
      assert(table instanceof FakeTransactionRequest);
    });
  });

  describe('create', () => {
    it('should create a table from the database', done => {
      const schema = 'schema';

      table.database = {
        createTable(schema_, callback) {
          assert.strictEqual(schema_, schema);
          callback(); // done()
        },
      };

      table.create(schema, done);
    });
  });

  describe('createReadStream', () => {
    it('should call and return parent method', () => {
      const query = 'SELECT * from Everything';

      const parentMethodReturnValue = {};

      FakeTransactionRequest.prototype = {
        createReadStream(name, query_) {
          assert.strictEqual(this, table);
          assert.strictEqual(name, table.name);
          assert.deepStrictEqual(query_, {
            keys: query,
          });
          return parentMethodReturnValue;
        },
      };

      const readStream = table.createReadStream(query);
      assert.strictEqual(readStream, parentMethodReturnValue);
    });

    it('should accept an array of keys', done => {
      const QUERY = ['a', 'b'];

      FakeTransactionRequest.prototype = {
        createReadStream(name, query) {
          assert.strictEqual(query.keys, QUERY);
          done();
        },
      };

      table.createReadStream(QUERY);
    });

    it('should support timestamp options', done => {
      const QUERY = 'SELECT * from Everything';
      const OPTIONS = {};
      const FORMATTED_OPTIONS = {};

      const formatTimestampOptions =
        (FakeTransactionRequest as any).formatTimestampOptions;

      (FakeTransactionRequest as any).formatTimestampOptions_ = function(options) {
        assert.strictEqual(options, OPTIONS);
        return FORMATTED_OPTIONS;
      };

      FakeTransactionRequest.prototype = {
        createReadStream(name, query) {
          (FakeTransactionRequest as any).formatTimestampOptions_ = formatTimestampOptions;

          assert.strictEqual(
            query.transaction.singleUse.readOnly,
            FORMATTED_OPTIONS
          );

          setImmediate(done);
          return {};
        },
      };

      table.createReadStream(QUERY, OPTIONS);
    });
  });

  describe('delete', () => {
    it('should throw an error if any arguments are provided', () => {
      const expectedErr = /Unexpected argument, please see Table#deleteRows to delete rows\./;

      assert.throws(() => table.delete([]), expectedErr);
    });

    it('should update the schema on the database', () => {
      const updateSchemaReturnValue = {};

      function callback() {}

      table.database = {
        updateSchema: (schema, callback_) => {
          assert.strictEqual(schema, 'DROP TABLE `' + table.name + '`');
          assert.strictEqual(callback_, callback);
          return updateSchemaReturnValue;
        },
      };

      const returnValue = table.delete(callback);
      assert.strictEqual(returnValue, updateSchemaReturnValue);
    });
  });

  describe('deleteRows', () => {
    it('should call and return parent method', () => {
      const keys = [];

      function callback() {}

      const parentMethodReturnValue = {};

      FakeTransactionRequest.prototype = {
        deleteRows(name, keys_, callback_) {
          assert.strictEqual(this, table);
          assert.strictEqual(name, table.name);
          assert.strictEqual(keys_, keys);
          assert.strictEqual(callback_, callback);
          return parentMethodReturnValue;
        },
      };

      const returnValue = table.deleteRows(keys, callback);
      assert.strictEqual(returnValue, parentMethodReturnValue);
    });
  });

  describe('drop', () => {
    it('should call through to Table#delete', done => {
      const returnVal = Promise.resolve();

      table.delete = callback => {
        setImmediate(callback); // the done fn
        return returnVal;
      };

      const promise = table.drop(done);

      assert.strictEqual(promise, returnVal);
    });
  });

  describe('insert', () => {
    it('should call and return mutate_ method', () => {
      const mutateReturnValue = {};

      const keyVals = [];

      function callback() {}

      table.mutate_ = (method, name, keyVals_, callback_) => {
        assert.strictEqual(method, 'insert');
        assert.strictEqual(name, table.name);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(callback_, callback);
        return mutateReturnValue;
      };

      const returnValue = table.insert(keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('read', () => {
    it('should call and collect results from a stream', done => {
      const keyVals = [];

      const rows = [{}, {}];

      table.createReadStream = function(keyVals_, options) {
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(options, null);

        const stream = through.obj();

        setImmediate(() => {
          split(rows, stream).then(() => {
            stream.end();
          });
        });

        return stream;
      };

      table.read(keyVals, (err, rows_) => {
        assert.ifError(err);
        assert.deepStrictEqual(rows_, rows);
        done();
      });
    });

    it('should accept an options object', done => {
      const OPTIONS = {};

      table.createReadStream = function(keyVals, options) {
        assert.strictEqual(OPTIONS, options);

        const stream = through.obj();

        setImmediate(() => {
          stream.end();
        });

        return stream;
      };

      table.read([], OPTIONS, done);
    });

    it('should execute callback with error', done => {
      const error = new Error('Error.');

      table.createReadStream = function() {
        const stream = through.obj();

        setImmediate(() => {
          stream.destroy(error);
        });

        return stream;
      };

      table.read([], err => {
        assert.strictEqual(err, error);
        done();
      });
    });
  });

  describe('replace', () => {
    it('should call and return mutate_ method', () => {
      const mutateReturnValue = {};

      const keyVals = [];

      function callback() {}

      table.mutate_ = function(method, name, keyVals_, callback_) {
        assert.strictEqual(method, 'replace');
        assert.strictEqual(name, table.name);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(callback_, callback);
        return mutateReturnValue;
      };

      const returnValue = table.replace(keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('update', () => {
    it('should call and return mutate_ method', () => {
      const mutateReturnValue = {};

      const keyVals = [];

      function callback() {}

      table.mutate_ = function(method, name, keyVals_, callback_) {
        assert.strictEqual(method, 'update');
        assert.strictEqual(name, table.name);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(callback_, callback);
        return mutateReturnValue;
      };

      const returnValue = table.update(keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });

  describe('upsert', () => {
    it('should call and return mutate_ method', () => {
      const mutateReturnValue = {};

      const keyVals = [];

      function callback() {}

      table.mutate_ = function(method, name, keyVals_, callback_) {
        assert.strictEqual(method, 'insertOrUpdate');
        assert.strictEqual(name, table.name);
        assert.strictEqual(keyVals_, keyVals);
        assert.strictEqual(callback_, callback);
        return mutateReturnValue;
      };

      const returnValue = table.upsert(keyVals, callback);
      assert.strictEqual(returnValue, mutateReturnValue);
    });
  });
});
