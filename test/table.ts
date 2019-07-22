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

import * as pfy from '@google-cloud/promisify';
import * as assert from 'assert';
import * as extend from 'extend';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import {split} from 'split-array-stream';
import {Transform, PassThrough} from 'stream';

import {TimestampBounds} from '../src/transaction';

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

class FakeTransaction {
  commit(callback) {
    callback(null, {});
  }
  createReadStream() {
    return new PassThrough({objectMode: true});
  }
  deleteRows(name, keys) {}
  end() {}
  insert(table, row) {}
  replace(table, row) {}
  upsert(table, row) {}
  update(table, row) {}
}

interface GetSnapshotCallback {
  (err: Error, snapshot?: null): void;
  (err: null, snapshot: FakeTransaction): void;
}

describe('Table', () => {
  const sandbox = sinon.createSandbox();

  // tslint:disable-next-line no-any variable-name
  let Table: any;
  // tslint:disable-next-line no-any variable-name
  let TableCached: any;
  let table;
  let transaction: FakeTransaction;

  const DATABASE = {
    runTransaction: callback => callback(null, transaction),
    getSnapshot: (options, callback) => callback(null, transaction),
  };

  const NAME = 'table-name';

  before(() => {
    Table = proxyquire('../src/table.js', {
      '@google-cloud/promisify': fakePfy,
    }).Table;
    TableCached = extend({}, Table);
  });

  beforeEach(() => {
    extend(Table, TableCached);
    table = new Table(DATABASE, NAME);
    transaction = new FakeTransaction();
  });

  afterEach(() => sandbox.restore());

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should localize database', () => {
      assert.strictEqual(table.database, DATABASE);
    });

    it('should localize name', () => {
      assert.strictEqual(table.name, NAME);
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
    let fakeReadStream: Transform;
    let getSnapshotStub: sinon.SinonStub<
      [TimestampBounds, GetSnapshotCallback],
      void
    >;

    const REQUEST = {keys: ['key']};

    beforeEach(() => {
      fakeReadStream = new PassThrough({objectMode: true});
      sandbox.stub(transaction, 'createReadStream').returns(fakeReadStream);
      getSnapshotStub = sandbox
        .stub(DATABASE, 'getSnapshot')
        .callsFake((_, callback) => callback(null, transaction));
    });

    it('should destroy the user stream if unable to get a snapshot', done => {
      const fakeError = new Error('err');

      getSnapshotStub.callsFake((options, callback) => callback(fakeError));

      table.createReadStream(REQUEST).on('error', err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should pass in timestamp bounds', () => {
      const fakeOptions = {};

      table.createReadStream(REQUEST, fakeOptions);

      const options = getSnapshotStub.lastCall.args[0];

      assert.strictEqual(options, fakeOptions);
    });

    it('should destroy the user stream and end the txn on error', done => {
      const endStub = sandbox.stub(transaction, 'end');
      const fakeError = new Error('err');

      table.createReadStream(REQUEST).on('error', err => {
        assert.strictEqual(err, fakeError);
        assert.strictEqual(endStub.callCount, 1);
        done();
      });

      fakeReadStream.destroy(fakeError);
    });

    it('should pipe data into the user stream', done => {
      const expectedData = [{}, {}, {}];
      const received: Array<{}> = [];

      table
        .createReadStream(REQUEST)
        .on('error', done)
        .on('data', data => received.push(data))
        .on('end', () => {
          assert.deepStrictEqual(received, expectedData);
          done();
        });

      expectedData.forEach(data => fakeReadStream.write(data));
      fakeReadStream.end();
    });

    it('should end the transaction on stream end', done => {
      sandbox.stub(transaction, 'end').callsFake(done);
      table.createReadStream(REQUEST).on('error', done);
      fakeReadStream.end();
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
    const KEYS = ['key'];

    it('should return an error if unable to get a txn', done => {
      const fakeError = new Error('err');

      sandbox
        .stub(DATABASE, 'runTransaction')
        .callsFake(callback => callback(fakeError));

      table.deleteRows(KEYS, err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should delete the rows via transaction', done => {
      const stub = sandbox
        .stub(transaction, 'deleteRows')
        .withArgs(table.name, KEYS);

      sandbox.stub(transaction, 'commit').callsFake(callback => callback());

      table.deleteRows(KEYS, err => {
        assert.ifError(err);
        assert.strictEqual(stub.callCount, 1);
        done();
      });
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
    const ROW = {};

    it('should return any runTransaction errors', done => {
      const fakeError = new Error('err');

      sandbox
        .stub(DATABASE, 'runTransaction')
        .callsFake(callback => callback(fakeError));

      table.insert(ROW, err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should insert via transaction', done => {
      const stub = sandbox
        .stub(transaction, 'insert')
        .withArgs(table.name, ROW);

      table.insert(ROW, err => {
        assert.ifError(err);
        assert.strictEqual(stub.callCount, 1);
        done();
      });
    });
  });

  describe('read', () => {
    it('should call and collect results from a stream', done => {
      const keyVals = [];

      const rows = [{}, {}];

      table.createReadStream = (keyVals_, options) => {
        assert.strictEqual(keyVals_, keyVals);
        assert.deepStrictEqual(options, {});

        const stream = new PassThrough({objectMode: true});

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

      table.createReadStream = (keyVals, options) => {
        assert.strictEqual(OPTIONS, options);

        const stream = new PassThrough({objectMode: true});

        setImmediate(() => {
          stream.end();
        });

        return stream;
      };

      table.read([], OPTIONS, done);
    });

    it('should execute callback with error', done => {
      const error = new Error('Error.');

      table.createReadStream = () => {
        const stream = new PassThrough({objectMode: true});
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
    const ROW = {};

    it('should return any runTransaction errors', done => {
      const fakeError = new Error('err');

      sandbox
        .stub(DATABASE, 'runTransaction')
        .callsFake(callback => callback(fakeError));

      table.replace(ROW, err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should replace via transaction', done => {
      const stub = sandbox
        .stub(transaction, 'replace')
        .withArgs(table.name, ROW);

      table.replace(ROW, err => {
        assert.ifError(err);
        assert.strictEqual(stub.callCount, 1);
        done();
      });
    });
  });

  describe('update', () => {
    const ROW = {};

    it('should return any runTransaction errors', done => {
      const fakeError = new Error('err');

      sandbox
        .stub(DATABASE, 'runTransaction')
        .callsFake(callback => callback(fakeError));

      table.update(ROW, err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should update via transaction', done => {
      const stub = sandbox
        .stub(transaction, 'update')
        .withArgs(table.name, ROW);

      table.update(ROW, err => {
        assert.ifError(err);
        assert.strictEqual(stub.callCount, 1);
        done();
      });
    });
  });

  describe('upsert', () => {
    const ROW = {};

    it('should return any runTransaction errors', done => {
      const fakeError = new Error('err');

      sandbox
        .stub(DATABASE, 'runTransaction')
        .callsFake(callback => callback(fakeError));

      table.upsert(ROW, err => {
        assert.strictEqual(err, fakeError);
        done();
      });
    });

    it('should upsert via transaction', done => {
      const stub = sandbox
        .stub(transaction, 'upsert')
        .withArgs(table.name, ROW);

      table.upsert(ROW, err => {
        assert.ifError(err);
        assert.strictEqual(stub.callCount, 1);
        done();
      });
    });
  });
});
