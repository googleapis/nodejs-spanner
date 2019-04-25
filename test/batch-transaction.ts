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
import * as sinon from 'sinon';

import {Session} from '../src';
import * as bt from '../src/batch-transaction';
import {PartialResultStream} from '../src/partial-result-stream';

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

class FakeTimestamp {
  calledWith_: IArguments;
  constructor() {
    this.calledWith_ = arguments;
  }
}

// tslint:disable-next-line no-any
const fakeCodec: any = {
  encode: util.noop,
  Timestamp: FakeTimestamp,
  Int() {},
  Float() {},
  SpannerDate() {},
  convertProtoTimestampToDate() {}
};

class FakeTransaction {
  calledWith_: IArguments;
  session;
  constructor(session) {
    this.calledWith_ = arguments;
    this.session = session;
  }
  static encodeKeySet(query: object): object {
    return {};
  }
  static encodeParams(request: object): object {
    return {};
  }
  run() {}
  read() {}
}

describe('BatchTransaction', () => {
  const sandbox = sinon.createSandbox();

  // tslint:disable-next-line variable-name
  let BatchTransaction: typeof bt.BatchTransaction;
  let batchTransaction: bt.BatchTransaction;

  // tslint:disable-next-line no-any
  const SESSION: any = {};

  before(() => {
    BatchTransaction =
        proxyquire('../src/batch-transaction.js', {
          '@google-cloud/precise-date': {PreciseDate: FakeTimestamp},
          '@google-cloud/promisify': fakePfy,
          './codec.js': {codec: fakeCodec},
          './transaction.js': {Snapshot: FakeTransaction},
        }).BatchTransaction;
  });

  beforeEach(() => {
    batchTransaction = new BatchTransaction(SESSION);
  });

  afterEach(() => sandbox.restore());

  describe('instantiation', () => {
    it('should promisify all the things', () => {
      assert(promisified);
    });

    it('should extend the Snapshot class', () => {
      const batchTransaction = new BatchTransaction(SESSION);
      assert(batchTransaction instanceof FakeTransaction);
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
      params: {},
      types: {},
    };

    it('should make the correct request', () => {
      const fakeParams = {
        params: {a: 'b'},
        paramTypes: {a: 'string'},
      };

      const expectedQuery = Object.assign({sql: QUERY.sql}, fakeParams);
      const stub = sandbox.stub(batchTransaction, 'createPartitions_');

      sandbox.stub(FakeTransaction, 'encodeParams')
          .withArgs(QUERY)
          .returns(fakeParams);

      batchTransaction.createQueryPartitions(QUERY, assert.ifError);

      const {client, method, reqOpts, gaxOpts} = stub.lastCall.args[0];
      assert.strictEqual(client, 'SpannerClient');
      assert.strictEqual(method, 'partitionQuery');
      assert.deepStrictEqual(reqOpts, expectedQuery);
      assert.strictEqual(gaxOpts, GAX_OPTS);
    });

    it('should accept query as string', () => {
      const query = 'SELECT * FROM Singers';

      const expectedQuery = Object.assign({}, {sql: query});
      const stub = sandbox.stub(batchTransaction, 'createPartitions_');

      sandbox.stub(FakeTransaction, 'encodeParams')
          .withArgs({sql: query})
          .returns({sql: query});

      batchTransaction.createQueryPartitions(query, assert.ifError);

      const {client, method, reqOpts, gaxOpts} = stub.lastCall.args[0];
      assert.strictEqual(client, 'SpannerClient');
      assert.strictEqual(method, 'partitionQuery');
      assert.deepStrictEqual(reqOpts, expectedQuery);
      assert.strictEqual(gaxOpts, undefined);
    });
  });

  describe('createPartitions_', () => {
    const REQUEST = sandbox.stub();
    const SESSION = {
      formattedName_: 'abcdef',
      request: REQUEST,
    };
    const ID = 'ghijkl';
    const TIMESTAMP = {seconds: 0, nanos: 0};

    const PARTITIONS = [{partitionToken: 'a'}, {partitionToken: 'b'}];
    const RESPONSE = {partitions: PARTITIONS};

    const QUERY = {a: 'b'};
    const CONFIG = {reqOpts: QUERY};

    beforeEach(() => {
      batchTransaction.session = SESSION as {} as Session;
      batchTransaction.id = ID;

      REQUEST.callsFake((_, callback) => callback(null, RESPONSE));
    });

    it('should insert the session and transaction ids', () => {
      batchTransaction.createPartitions_(CONFIG, assert.ifError);

      const {reqOpts} = REQUEST.lastCall.args[0];
      assert.strictEqual(reqOpts.a, 'b');
      assert.strictEqual(reqOpts.session, SESSION.formattedName_);
      assert.deepStrictEqual(reqOpts.transaction, {id: ID});
    });

    it('should return any request errors', done => {
      const error = new Error('err');
      const response = {};

      REQUEST.callsFake((_, callback) => callback(error, response));

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

      REQUEST.callsFake((_, callback) => callback(null, response));

      batchTransaction.createPartitions_(CONFIG, (err, parts, resp) => {
        assert.strictEqual(resp, response);
        assert.strictEqual(batchTransaction.id, ID);
        assert.strictEqual(batchTransaction.readTimestampProto, TIMESTAMP);

        const timestamp =
            batchTransaction.readTimestamp as unknown as FakeTimestamp;
        assert(timestamp instanceof FakeTimestamp);
        assert.strictEqual(timestamp.calledWith_[0], TIMESTAMP);

        done();
      });
    });
  });

  describe('createReadPartitions', () => {
    const GAX_OPTS = {};
    const QUERY = {
      table: 'abc',
      keys: ['a', 'b'],
      ranges: [{}, {}],
      gaxOptions: GAX_OPTS,
    };

    it('should make the correct request', () => {
      const fakeKeySet = {};
      const expectedQuery = {
        table: QUERY.table,
        keySet: fakeKeySet,
      };

      const stub = sandbox.stub(batchTransaction, 'createPartitions_');

      sandbox.stub(FakeTransaction, 'encodeKeySet')
          .withArgs(QUERY)
          .returns(fakeKeySet);

      batchTransaction.createReadPartitions(QUERY, assert.ifError);

      const {client, method, reqOpts, gaxOpts} = stub.lastCall.args[0];
      assert.strictEqual(client, 'SpannerClient');
      assert.strictEqual(method, 'partitionRead');
      assert.deepStrictEqual(reqOpts, expectedQuery);
      assert.strictEqual(gaxOpts, GAX_OPTS);
    });
  });

  describe('execute', () => {
    it('should make read requests for read partitions', () => {
      const partition = {table: 'abc'};
      const stub = sandbox.stub(batchTransaction, 'read');

      batchTransaction.execute(partition, assert.ifError);

      const [table, options] = stub.lastCall.args;
      assert.strictEqual(table, partition.table);
      assert.strictEqual(options, partition);
    });

    it('should make query requests for non-read partitions', () => {
      const partition = {sql: 'SELECT * FROM Singers'};
      const stub = sandbox.stub(batchTransaction, 'run');

      batchTransaction.execute(partition, assert.ifError);

      const query = stub.lastCall.args[0];
      assert.strictEqual(query, partition);
    });
  });

  describe('executeStream', () => {
    const STREAM = {} as PartialResultStream;

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
      batchTransaction.readTimestampProto = TIMESTAMP;
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
