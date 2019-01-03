/*!
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import {util} from '@google-cloud/common-grpc';
import * as pfy from '@google-cloud/promisify';
import * as assert from 'assert';
import * as extend from 'extend';
import * as proxyquire from 'proxyquire';

import {Session} from '../src';
import * as bt from '../src/batch-transaction';

function getFake(obj: {}) {
  return obj as {
    calledWith_: IArguments;
  };
}

let promisified = false;
const fakePfy = extend({}, pfy, {
  promisifyAll(klass, options) {
    if (klass.name !== 'BatchTransaction') {
      return;
    }
    assert.deepStrictEqual(options.exclude, ['identifier']);
    promisified = true;
  },
});

// tslint:disable-next-line no-any
const fakeCodec: any = {
  encode: util.noop,
  Int() {},
  Float() {},
  SpannerDate() {},
};

class FakeTransaction {
  calledWith_: IArguments;
  session;
  constructor(session) {
    this.calledWith_ = arguments;
    this.session = session;
  }
}

describe('BatchTransaction', () => {
  // tslint:disable-next-line variable-name
  let BatchTransaction: typeof bt.BatchTransaction;
  let batchTransaction: bt.BatchTransaction;

  // tslint:disable-next-line no-any
  const SESSION: any = {};

  before(() => {
    BatchTransaction = proxyquire('../src/batch-transaction.js', {
                         '@google-cloud/promisify': fakePfy,
                         './codec.js': {codec: fakeCodec},
                         './transaction.js': {Transaction: FakeTransaction},
                       }).BatchTransaction;
  });

  beforeEach(() => {
    batchTransaction = new BatchTransaction(SESSION);
  });

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should extend the Transaction class', () => {
      const batchTransaction = new BatchTransaction(SESSION);
      assert(batchTransaction instanceof FakeTransaction);
      assert.strictEqual(getFake(batchTransaction).calledWith_[0], SESSION);
      assert.deepStrictEqual(
          getFake(batchTransaction).calledWith_[1], {readOnly: true});
    });
  });

  describe('close', () => {
    it('should delete the session', done => {
      SESSION.delete = (callback) => {
        callback();  // the done fn
      };

      batchTransaction.close(done);
    });
  });

  describe('createQueryPartitions', () => {
    const GAX_OPTS = {a: 'b'};
    const QUERY = {
      sql: 'SELECT * FROM Singers',
      gaxOptions: GAX_OPTS,
    };

    it('should make the correct request', done => {
      fakeCodec.encodeQuery = (query) => {
        assert.deepStrictEqual(query, {sql: QUERY.sql});
        return QUERY;
      };

      batchTransaction.createPartitions_ = (config, callback) => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'partitionQuery');
        assert.strictEqual(config.reqOpts, QUERY);
        callback();  // the done fn
      };

      batchTransaction.createQueryPartitions(QUERY.sql, done);
    });
  });

  describe('createPartitions_', () => {
    const SESSION = {formattedName_: 'abcdef'};
    const ID = 'ghijkl';
    const TIMESTAMP = {seconds: 0, nanos: 0};

    const PARTITIONS = [{partitionToken: 'a'}, {partitionToken: 'b'}];
    const RESPONSE = {partitions: PARTITIONS};

    const QUERY = {a: 'b'};
    const CONFIG = {reqOpts: QUERY};

    beforeEach(() => {
      batchTransaction.session = SESSION as {} as Session;
      batchTransaction.id = ID;

      batchTransaction.request = (config, callback) => {
        callback(null, RESPONSE);
      };
    });

    it('should insert the session and transaction ids', done => {
      batchTransaction.request = (config) => {
        assert.strictEqual(config.reqOpts.a, 'b');
        assert.strictEqual(config.reqOpts.session, SESSION.formattedName_);
        assert.deepStrictEqual(config.reqOpts.transaction, {id: ID});
        done();
      };

      batchTransaction.createPartitions_(CONFIG, assert.ifError);
    });

    it('should return any request errors', done => {
      const error = new Error('err');
      const response = {};

      batchTransaction.request = (config, callback) => {
        callback(error, response);
      };

      batchTransaction.createPartitions_(CONFIG, (err, parts, resp) => {
        assert.strictEqual(err, error);
        assert.strictEqual(parts, null);
        assert.strictEqual(resp, response);
        done();
      });
    });

    it('should return the prepared partition configs', done => {
      const expectedQuery = {
        a: 'b',
        session: SESSION.formattedName_,
        transaction: {id: ID},
      };

      batchTransaction.createPartitions_(CONFIG, (err, parts) => {
        assert.ifError(err);

        parts.forEach((partition, i) => {
          const expectedPartition = extend({}, expectedQuery, PARTITIONS[i]);
          assert.deepStrictEqual(partition, expectedPartition);
        });

        done();
      });
    });

    it('should update the transaction with returned metadata', done => {
      const response = extend({}, RESPONSE, {
        transaction: {
          id: ID,
          readTimestamp: TIMESTAMP,
        },
      });

      batchTransaction.request = (config, callback) => {
        callback(null, response);
      };

      batchTransaction.createPartitions_(CONFIG, (err, parts, resp) => {
        assert.strictEqual(resp, response);
        assert.strictEqual(batchTransaction.id, ID);
        assert.strictEqual(batchTransaction.readTimestamp, TIMESTAMP);
        done();
      });
    });
  });

  describe('createReadPartitions', () => {
    const GAX_OPTS = {};
    const QUERY = {table: 'abc', gaxOptions: GAX_OPTS};

    it('should make the correct request', done => {
      const query = {};

      fakeCodec.encodeRead = (options) => {
        assert.strictEqual(options, query);
        return QUERY;
      };

      batchTransaction.createPartitions_ = (config, callback) => {
        assert.strictEqual(config.client, 'SpannerClient');
        assert.strictEqual(config.method, 'partitionRead');
        assert.strictEqual(config.reqOpts, QUERY);
        callback();  // the done fn
      };

      batchTransaction.createReadPartitions(query, done);
    });
  });

  describe('execute', () => {
    it('should make read requests for read partitions', done => {
      const partition = {table: 'abc'};

      batchTransaction.read = (table, options, callback) => {
        assert.strictEqual(table, partition.table);
        assert.strictEqual(options, partition);
        callback();  // the done fn
      };

      batchTransaction.execute(partition, done);
    });

    it('should make query requests for non-read partitions', done => {
      const partition = {sql: 'SELECT * FROM Singers'};

      batchTransaction.run = (query, callback) => {
        assert.strictEqual(query, partition);
        callback();  // the done fn
      };

      batchTransaction.execute(partition, done);
    });
  });

  describe('executeStream', () => {
    const STREAM = {};

    it('should make read streams for read partitions', () => {
      const partition = {table: 'abc'};

      batchTransaction.createReadStream = (table, options) => {
        assert.strictEqual(table, partition.table);
        assert.strictEqual(options, partition);
        return STREAM;
      };

      const stream = batchTransaction.executeStream(partition);

      assert.strictEqual(stream, STREAM);
    });

    it('should make query streams for query partitions', () => {
      const partition = {sql: 'SELECT * FROM Singers'};

      batchTransaction.runStream = (query) => {
        assert.strictEqual(query, partition);
        return STREAM;
      };

      const stream = batchTransaction.executeStream(partition);

      assert.strictEqual(stream, STREAM);
    });
  });

  describe('identifier', () => {
    const ID = Buffer.from('abc');
    const SESSION = {id: 'def'};
    const TIMESTAMP = {seconds: 0, nanos: 0};

    beforeEach(() => {
      batchTransaction.id = ID;
      batchTransaction.session = SESSION as Session;
      batchTransaction.readTimestamp = TIMESTAMP;
    });

    it('should create a transaction identifier', () => {
      const expectedId = ID.toString('base64');
      const identifier = batchTransaction.identifier();

      assert.strictEqual(identifier.transaction, expectedId);
      assert.strictEqual(identifier.session, SESSION.id);
      assert.strictEqual(identifier.timestamp, TIMESTAMP);
    });
  });
});
