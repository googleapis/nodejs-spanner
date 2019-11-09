/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import {PreciseDate} from '@google-cloud/precise-date';
import * as assert from 'assert';
import {EventEmitter} from 'events';
import {common as p} from 'protobufjs';
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';

import {codec} from '../src/codec';
import {SpannerClient as s} from '../src/v1';

describe('Transaction', () => {
  const sandbox = sinon.createSandbox();

  const REQUEST = sandbox.stub();
  const REQUEST_STREAM = sandbox.stub();
  const SESSION_NAME = 'session-123';

  const SESSION = {
    formattedName_: SESSION_NAME,
    request: REQUEST,
    requestStream: REQUEST_STREAM,
  };

  const PARTIAL_RESULT_STREAM = sandbox.stub();
  const PROMISIFY_ALL = sandbox.stub();

  // tslint:disable-next-line no-any variable-name
  let Snapshot;
  // tslint:disable-next-line no-any variable-name
  let Dml;
  // tslint:disable-next-line no-any variable-name
  let Transaction;
  // tslint:disable-next-line no-any variable-name
  let PartitionedDml;

  before(() => {
    const txns = proxyquire('../src/transaction', {
      '@google-cloud/promisify': {promisifyAll: PROMISIFY_ALL},
      './codec': {codec},
      './partial-result-stream': {partialResultStream: PARTIAL_RESULT_STREAM},
    });

    Snapshot = txns.Snapshot;
    Dml = txns.Dml;
    Transaction = txns.Transaction;
    PartitionedDml = txns.PartitionedDml;
  });

  afterEach(() => sandbox.restore());

  describe('Snapshot', () => {
    const OPTIONS = {a: 'b', c: 'd'};

    let snapshot;

    beforeEach(() => {
      sandbox.stub(Snapshot, 'encodeTimestampBounds').returns(OPTIONS);
      snapshot = new Snapshot(SESSION);
    });

    describe('initialization', () => {
      it('should promisify all the things', () => {
        const expectedOptions = sinon.match({
          exclude: ['end'],
        });

        const stub = PROMISIFY_ALL.withArgs(Snapshot, expectedOptions);

        assert.strictEqual(stub.callCount, 1);
      });

      it('should extend EventEmitter', () => {
        assert(snapshot instanceof EventEmitter);
      });

      it('should default `ended` to false', () => {
        assert.strictEqual(snapshot.ended, false);
      });

      it('should localize the session', () => {
        assert.strictEqual(snapshot.session, SESSION);
      });

      it('should localize `Session#request`', () => {
        snapshot.request();
        assert.strictEqual(REQUEST.callCount, 1);
      });

      it('should localize `Session#requestStream`', () => {
        snapshot.requestStream();
        assert.strictEqual(REQUEST_STREAM.callCount, 1);
      });
    });

    describe('begin', () => {
      const BEGIN_RESPONSE = {
        id: Buffer.from('transaction-id-123'),
      };

      it('should send the correct request', () => {
        snapshot.begin();

        const {client, method, reqOpts} = REQUEST.lastCall.args[0];

        assert.strictEqual(client, 'SpannerClient');
        assert.strictEqual(method, 'beginTransaction');
        assert.strictEqual(reqOpts.session, SESSION_NAME);
      });

      it('should send the formatted options', () => {
        const fakeOptions = {a: 'b'};
        const fakeEncodedOptions = {c: 'd'};
        const expectedOptions = {readOnly: fakeEncodedOptions};

        Snapshot.encodeTimestampBounds
          .withArgs(fakeOptions)
          .returns(fakeEncodedOptions);

        new Snapshot(SESSION, fakeOptions).begin();

        const {reqOpts} = REQUEST.lastCall.args[0];

        assert.deepStrictEqual(reqOpts.options, expectedOptions);
      });

      it('should return any request errors', done => {
        const fakeError = new Error('err');

        REQUEST.callsFake((_, callback) => callback(fakeError));

        snapshot.begin(err => {
          assert.strictEqual(err, fakeError);
          done();
        });
      });

      it('should localize `id`', done => {
        REQUEST.callsFake((_, callback) => callback(null, BEGIN_RESPONSE));

        snapshot.begin(err => {
          assert.ifError(err);
          assert.strictEqual(snapshot.id, BEGIN_RESPONSE.id);
          done();
        });
      });

      it('should localize the response as `metadata`', done => {
        REQUEST.callsFake((_, callback) => callback(null, BEGIN_RESPONSE));

        snapshot.begin(err => {
          assert.ifError(err);
          assert.strictEqual(snapshot.metadata, BEGIN_RESPONSE);
          done();
        });
      });

      it('should localize `readTimestamp` if present', done => {
        const expectedTimestamp = new PreciseDate(0);
        const readTimestamp = {seconds: 0, nanos: 0};
        const response = Object.assign({readTimestamp}, BEGIN_RESPONSE);

        REQUEST.callsFake((_, callback) => callback(null, response));

        snapshot.begin(err => {
          assert.ifError(err);
          assert.deepStrictEqual(snapshot.readTimestamp, expectedTimestamp);
          assert.strictEqual(snapshot.readTimestampProto, readTimestamp);
          done();
        });
      });

      it('should return the response', done => {
        REQUEST.callsFake((_, callback) => callback(null, BEGIN_RESPONSE));

        snapshot.begin((err, resp) => {
          assert.ifError(err);
          assert.strictEqual(resp, BEGIN_RESPONSE);
          done();
        });
      });
    });

    describe('createReadStream', () => {
      const TABLE = 'my-table-123';

      beforeEach(() => {
        PARTIAL_RESULT_STREAM.callsFake(makeRequest => makeRequest());
      });

      it('should send the correct request', () => {
        snapshot.createReadStream(TABLE);

        const {client, method} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(client, 'SpannerClient');
        assert.strictEqual(method, 'streamingRead');
      });

      it('should use the transaction id if present', () => {
        const id = 'transaction-id-123';
        const expectedTransaction = {id};

        snapshot.id = id;
        snapshot.createReadStream(TABLE);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.deepStrictEqual(reqOpts.transaction, expectedTransaction);
      });

      it('should configure `singleUse` if id is absent', () => {
        const expectedTransaction = {
          singleUse: {readOnly: OPTIONS},
        };

        snapshot.createReadStream(TABLE);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.deepStrictEqual(reqOpts.transaction, expectedTransaction);
      });

      it('should send the correct `reqOpts`', () => {
        const id = 'transaction-id-123';
        const fakeKeySet = {all: true};

        const fakeRequest = {
          keys: ['a', 'b', 'c'],
          ranges: [{}, {}],
          columns: ['name'],
        };

        const expectedRequest = {
          session: SESSION_NAME,
          transaction: {id},
          table: TABLE,
          keySet: fakeKeySet,
          resumeToken: undefined,
          columns: ['name'],
        };

        sandbox
          .stub(Snapshot, 'encodeKeySet')
          .withArgs(fakeRequest)
          .returns(fakeKeySet);

        snapshot.id = id;
        snapshot.createReadStream(TABLE, fakeRequest);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.deepStrictEqual(reqOpts, expectedRequest);
      });

      it('should pass along `gaxOpts`', () => {
        const fakeOptions = {};

        snapshot.createReadStream(TABLE, {gaxOptions: fakeOptions});

        const {gaxOpts, reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(gaxOpts, fakeOptions);
        assert.strictEqual(reqOpts.gaxOptions, undefined);
      });

      it('should pass a stream to `PartialResultStream`', () => {
        const fakeStream = new EventEmitter();

        REQUEST_STREAM.returns(fakeStream);
        snapshot.createReadStream(TABLE);

        const makeRequest = PARTIAL_RESULT_STREAM.lastCall.args[0];
        const stream = makeRequest();

        assert.strictEqual(stream, fakeStream);
      });

      it('should update the `resumeToken` for subsequent requests', () => {
        const fakeToken = 'fake-token-123';

        PARTIAL_RESULT_STREAM.callsFake(makeRequest => makeRequest(fakeToken));
        snapshot.createReadStream(TABLE);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(reqOpts.resumeToken, fakeToken);
      });

      it('should return a `PartialResultStream`', () => {
        const fakeStream = new EventEmitter();

        PARTIAL_RESULT_STREAM.returns(fakeStream);

        const stream = snapshot.createReadStream(TABLE);

        assert.strictEqual(stream, fakeStream);
      });

      it('should pass along json options', () => {
        const fakeOptions = {
          json: true,
          jsonOptions: {a: 'b'},
        };

        snapshot.createReadStream(TABLE, fakeOptions);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(reqOpts.json, undefined);
        assert.strictEqual(reqOpts.jsonOptions, undefined);

        const options = PARTIAL_RESULT_STREAM.lastCall.args[1];

        assert.deepStrictEqual(options, fakeOptions);
      });
    });

    describe('end', () => {
      it('should set `ended` to true', () => {
        snapshot.end();

        assert.strictEqual(snapshot.ended, true);
      });

      it('should emit an "end" event', done => {
        snapshot.on('end', done);
        snapshot.end();
      });

      it('should noop if already ended', done => {
        snapshot.on('end', done);
        snapshot.end();
        snapshot.end();
      });
    });

    describe('read', () => {
      const TABLE = 'my-table-123';

      let fakeStream;
      let stub;

      beforeEach(() => {
        fakeStream = new EventEmitter();
        stub = sandbox.stub(snapshot, 'createReadStream').returns(fakeStream);
      });

      it('should call through to `createReadStream`', () => {
        const fakeRequest = {};

        snapshot.read(TABLE, fakeRequest, () => {});

        const [table, request] = stub.lastCall.args;

        assert.strictEqual(table, TABLE);
        assert.strictEqual(request, fakeRequest);
      });

      it('should return any request errors', done => {
        const fakeError = new Error('err');

        snapshot.read(TABLE, {}, err => {
          assert.strictEqual(err, fakeError);
          done();
        });

        fakeStream.emit('error', fakeError);
      });

      it('should concatenate rows and return them on "end" event', done => {
        const fakeRows = [{a: 'b'}, {c: 'd'}, {e: 'f'}];

        snapshot.read(TABLE, {}, (err, rows) => {
          assert.ifError(err);
          assert.deepStrictEqual(rows, fakeRows);
          done();
        });

        fakeRows.forEach(row => fakeStream.emit('data', row));
        fakeStream.emit('end');
      });

      it('should optionally accept a request object', done => {
        snapshot.read(TABLE, done);
        fakeStream.emit('end');
      });
    });

    describe('run', () => {
      const QUERY = 'SELET * FROM `MyTable`';

      let fakeStream;
      let stub;

      beforeEach(() => {
        fakeStream = new EventEmitter();
        stub = sandbox.stub(snapshot, 'runStream').returns(fakeStream);
      });

      it('should call through to `runStream`', () => {
        snapshot.run(QUERY, () => {});

        const query = stub.lastCall.args[0];

        assert.strictEqual(query, QUERY);
      });

      it('should return any request errors', done => {
        const fakeError = new Error('err');

        snapshot.run(QUERY, err => {
          assert.strictEqual(err, fakeError);
          done();
        });

        fakeStream.emit('error', fakeError);
      });

      it('should concatenate rows and return them on "end" event', done => {
        const fakeRows = [{a: 'b'}, {c: 'd'}, {e: 'f'}];

        snapshot.run(QUERY, (err, rows) => {
          assert.ifError(err);
          assert.deepStrictEqual(rows, fakeRows);
          done();
        });

        fakeRows.forEach(row => fakeStream.emit('data', row));
        fakeStream.emit('end');
      });

      it('should pass back `stats` if available', done => {
        const fakeStats = {};

        snapshot.run(QUERY, (err, rows, stats) => {
          assert.ifError(err);
          assert.strictEqual(stats, fakeStats);
          done();
        });

        fakeStream.emit('stats', fakeStats);
        fakeStream.emit('end');
      });
    });

    describe('runStream', () => {
      const QUERY = {
        sql: 'SELECT * FROM `MyTable`',
      };

      beforeEach(() => {
        PARTIAL_RESULT_STREAM.callsFake(makeRequest => makeRequest());
      });

      it('should send the correct request', () => {
        snapshot.runStream(QUERY);

        const {client, method} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(client, 'SpannerClient');
        assert.strictEqual(method, 'executeStreamingSql');
      });

      it('should use the transaction id if present', () => {
        const id = 'transaction-id-123';
        const expectedTransaction = {id};

        snapshot.id = id;
        snapshot.runStream(QUERY);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.deepStrictEqual(reqOpts.transaction, expectedTransaction);
      });

      it('should configure `singleUse` if id is absent', () => {
        const expectedTransaction = {
          singleUse: {readOnly: OPTIONS},
        };

        snapshot.runStream(QUERY);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.deepStrictEqual(reqOpts.transaction, expectedTransaction);
      });

      it('should send the correct `reqOpts`', () => {
        const id = 'transaction-id-123';
        const fakeParams = {b: 'a'};
        const fakeParamTypes = {b: 'number'};

        const fakeQuery = Object.assign({}, QUERY, {
          params: {a: 'b'},
          types: {a: 'string'},
          seqno: 1,
        });

        const expectedRequest = {
          session: SESSION_NAME,
          transaction: {id},
          sql: QUERY.sql,
          params: fakeParams,
          paramTypes: fakeParamTypes,
          seqno: 1,
          resumeToken: undefined,
        };

        sandbox
          .stub(Snapshot, 'encodeParams')
          .withArgs(fakeQuery)
          .returns({
            params: fakeParams,
            paramTypes: fakeParamTypes,
          });

        snapshot.id = id;
        snapshot.runStream(fakeQuery);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.deepStrictEqual(reqOpts, expectedRequest);
      });

      it('should accept just a sql string', () => {
        snapshot.runStream(QUERY.sql);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(reqOpts.sql, QUERY.sql);
      });

      it('should pass along `gaxOpts`', () => {
        const fakeQuery = Object.assign({gaxOptions: {}}, QUERY);

        snapshot.runStream(fakeQuery);

        const {gaxOpts, reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(reqOpts.gaxOptions, undefined);
        assert.strictEqual(gaxOpts, fakeQuery.gaxOptions);
      });

      it('should update the `seqno` for each call', () => {
        snapshot.runStream(QUERY);
        const call1 = REQUEST_STREAM.lastCall.args[0];

        snapshot.runStream(QUERY);
        const call2 = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(call1.reqOpts.seqno, 1);
        assert.strictEqual(call2.reqOpts.seqno, 2);
      });

      it('should pass a stream to `PartialResultStream`', () => {
        const fakeStream = new EventEmitter();

        REQUEST_STREAM.returns(fakeStream);
        snapshot.runStream(QUERY);

        const makeRequest = PARTIAL_RESULT_STREAM.lastCall.args[0];
        const stream = makeRequest();

        assert.strictEqual(stream, fakeStream);
      });

      it('should return a `PartialResultStream`', () => {
        const fakeStream = new EventEmitter();

        PARTIAL_RESULT_STREAM.returns(fakeStream);

        const stream = snapshot.runStream(QUERY);

        assert.strictEqual(stream, fakeStream);
      });

      it('should update the `resumeToken` for subsequent requests', () => {
        const fakeToken = 'fake-token-123';

        snapshot.runStream(QUERY);

        const makeRequest = PARTIAL_RESULT_STREAM.lastCall.args[0];

        makeRequest(fakeToken);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(reqOpts.resumeToken, fakeToken);
      });

      it('should pass along json options', () => {
        const expectedOptions = {
          json: true,
          jsonOptions: {a: 'b'},
        };

        const fakeQuery = Object.assign({}, QUERY, expectedOptions);

        snapshot.runStream(fakeQuery);

        const {reqOpts} = REQUEST_STREAM.lastCall.args[0];

        assert.strictEqual(reqOpts.json, undefined);
        assert.strictEqual(reqOpts.jsonOptions, undefined);

        const options = PARTIAL_RESULT_STREAM.lastCall.args[1];

        assert.deepStrictEqual(options, expectedOptions);
      });
    });

    describe('encodeKeySet', () => {
      function toListValue(thing): p.IListValue {
        return {
          values: [{stringValue: thing}],
        };
      }

      it('should encode an array of `keys`', () => {
        const fakeKeys = ['a', 'b', 'c'];
        const encodedKeys = fakeKeys.map(toListValue);

        const stub = sandbox.stub(codec, 'convertToListValue');

        fakeKeys.forEach((key, i) => {
          stub.withArgs(key).returns(encodedKeys[i]);
        });

        const expectedKeySet = {keys: encodedKeys};
        const keySet = Snapshot.encodeKeySet({keys: fakeKeys});

        assert.deepStrictEqual(keySet, expectedKeySet);
      });

      it('should encode an array of `ranges`', () => {
        const fakeRanges = [
          {startClosed: 'a', endOpen: 'b'},
          {startOpen: 'c', endClosed: 'd'},
        ];

        const encodedRanges = [
          {startClosed: toListValue('a'), endOpen: toListValue('b')},
          {startOpen: toListValue('c'), endClosed: toListValue('d')},
        ];

        sandbox.stub(codec, 'convertToListValue').callsFake(toListValue);

        const expectedKeySet = {ranges: encodedRanges};
        const keySet = Snapshot.encodeKeySet({ranges: fakeRanges});

        assert.deepStrictEqual(keySet, expectedKeySet);
      });

      it('should return all keys by default', () => {
        const keySet = Snapshot.encodeKeySet({});

        assert.deepStrictEqual(keySet, {all: true});
      });

      it('should preserve passed in keySet', () => {
        const fakeKeySet = {all: false};
        const keySet = Snapshot.encodeKeySet({keySet: fakeKeySet});

        assert.deepStrictEqual(keySet, fakeKeySet);
      });
    });

    describe('encodeTimestampBounds', () => {
      const PROTO_TIMESTAMP = {
        nanos: 123123,
        seconds: 453452234,
      };

      beforeEach(() => {
        Snapshot.encodeTimestampBounds.restore();
      });

      it('should accept `strong` user value', () => {
        const options = Snapshot.encodeTimestampBounds({strong: false});

        assert.strictEqual(options.strong, false);
      });

      it('should default `returnReadTimestamp` to true', () => {
        const options = Snapshot.encodeTimestampBounds({});

        assert.strictEqual(options.returnReadTimestamp, true);
      });

      it('should accept `returnReadTimestamp` user value', () => {
        const options = Snapshot.encodeTimestampBounds({
          returnReadTimestamp: false,
        });

        assert.strictEqual(options.returnReadTimestamp, false);
      });

      it('should convert `minReadTimestamp` Date to proto', () => {
        const fakeTimestamp = new PreciseDate();

        sandbox.stub(fakeTimestamp, 'toStruct').returns(PROTO_TIMESTAMP);

        const options = Snapshot.encodeTimestampBounds({
          minReadTimestamp: fakeTimestamp,
        });

        assert.strictEqual(options.minReadTimestamp, PROTO_TIMESTAMP);
      });

      it('should convert `readTimestamp` Date to proto', () => {
        const fakeTimestamp = new PreciseDate();

        sandbox.stub(fakeTimestamp, 'toStruct').returns(PROTO_TIMESTAMP);

        const options = Snapshot.encodeTimestampBounds({
          readTimestamp: fakeTimestamp,
        });

        assert.strictEqual(options.readTimestamp, PROTO_TIMESTAMP);
      });

      it('should convert `maxStaleness` ms to proto', () => {
        const fakeTimestamp = Date.now();

        sandbox
          .stub(codec, 'convertMsToProtoTimestamp')
          .withArgs(fakeTimestamp)
          .returns(PROTO_TIMESTAMP);

        const options = Snapshot.encodeTimestampBounds({
          maxStaleness: fakeTimestamp,
        });

        assert.strictEqual(options.maxStaleness, PROTO_TIMESTAMP);
      });

      it('should convert `exactStaleness` ms to proto', () => {
        const fakeTimestamp = Date.now();

        sandbox
          .stub(codec, 'convertMsToProtoTimestamp')
          .withArgs(fakeTimestamp)
          .returns(PROTO_TIMESTAMP);

        const options = Snapshot.encodeTimestampBounds({
          exactStaleness: fakeTimestamp,
        });

        assert.strictEqual(options.exactStaleness, PROTO_TIMESTAMP);
      });

      it('should accept proto timestamp', () => {
        const fakeOptions = {
          exactStaleness: {
            seconds: 23423424,
            nanos: 23234234,
          },
          returnReadTimestamp: false,
        };

        const options = Snapshot.encodeTimestampBounds(fakeOptions);

        assert.deepStrictEqual(options, fakeOptions);
        assert.notStrictEqual(options, fakeOptions);
      });
    });

    describe('encodeParams', () => {
      it('should encode param values', () => {
        const fakeParams = {a: 'foo', b: 3};
        const encodedParams = {
          a: {stringValue: 'bar'},
          b: {numberValue: 4},
        };

        const stub = sandbox.stub(codec, 'encode');

        stub.withArgs(fakeParams.a).returns(encodedParams.a);
        stub.withArgs(fakeParams.b).returns(encodedParams.b);

        const expectedParams = {fields: encodedParams};
        const {params} = Snapshot.encodeParams({params: fakeParams});

        assert.deepStrictEqual(params, expectedParams);
      });

      it('should encode param types', () => {
        const fakeTypes = {a: 'string', b: 'number'};
        const expectedTypes = {
          a: {code: s.TypeCode.STRING},
          b: {code: s.TypeCode.INT64},
        };

        const stub = sandbox.stub(codec, 'createTypeObject');

        stub.withArgs(fakeTypes.a).returns(expectedTypes.a);
        stub.withArgs(fakeTypes.b).returns(expectedTypes.b);

        const {paramTypes} = Snapshot.encodeParams({types: fakeTypes});

        assert.deepStrictEqual(paramTypes, expectedTypes);
      });

      it('should guess missing param types', () => {
        const fakeParams = {a: 'foo', b: 3};
        const fakeTypes = {b: 'number'};
        const fakeMissingType = {type: 'string'};
        const expectedType = {code: s.TypeCode.STRING};

        sandbox
          .stub(codec, 'getType')
          .withArgs(fakeParams.a)
          .returns(fakeMissingType);

        sandbox
          .stub(codec, 'createTypeObject')
          .withArgs(fakeMissingType)
          .returns(expectedType);

        const {paramTypes} = Snapshot.encodeParams({
          params: fakeParams,
          types: fakeTypes,
        });

        assert.strictEqual(paramTypes.a, expectedType);
      });
    });
  });

  describe('Dml', () => {
    let dml;

    beforeEach(() => {
      dml = new Dml(SESSION);
    });

    describe('initialization', () => {
      it('should promisify all the things', () => {
        const stub = PROMISIFY_ALL.withArgs(Dml);

        assert.strictEqual(stub.callCount, 1);
      });

      it('should inherit from Snapshot', () => {
        assert(dml instanceof Snapshot);
      });
    });

    describe('runUpdate', () => {
      const SQL = 'SELECT * FROM `MyTable`';

      it('should call through to `run`', () => {
        const fakeQuery = {sql: SQL};

        const stub = sandbox.stub(dml, 'run').withArgs(fakeQuery);

        dml.runUpdate(fakeQuery);

        assert.strictEqual(stub.callCount, 1);
      });

      it('should accept a sql string', () => {
        const expectedQuery = {sql: SQL};

        const stub = sandbox
          .stub(dml, 'run')
          .withArgs(sinon.match(expectedQuery));

        dml.runUpdate(SQL);

        assert.strictEqual(stub.callCount, 1);
      });

      it('should return any request errors', () => {
        const fakeError = new Error('err');
        const stub = sandbox.stub(dml, 'run');
        const callback = sandbox.stub().withArgs(fakeError, 0);

        dml.runUpdate(SQL, callback);

        const runCallback = stub.lastCall.args[1];
        runCallback(fakeError);

        assert.strictEqual(callback.callCount, 1);
      });

      it('should return 0 for `rowCount`', () => {
        const stub = sandbox.stub(dml, 'run');
        const callback = sandbox.stub().withArgs(null, 0);

        dml.runUpdate(SQL, callback);

        const runCallback = stub.lastCall.args[1];
        runCallback(null);

        assert.strictEqual(callback.callCount, 1);
        assert.strictEqual(callback.args[0][1], 0);
      });

      it('should return the `rowCountExact`', () => {
        const fakeRowCount = 5.5;
        const fakeStats = {
          rowCount: 'rowCountExact',
          rowCountExact: fakeRowCount,
        };

        const stub = sandbox.stub(dml, 'run');
        const callback = sandbox.stub().withArgs(null, fakeRowCount);

        dml.runUpdate(SQL, callback);

        const runCallback = stub.lastCall.args[1];
        runCallback(null, undefined, fakeStats);

        assert.strictEqual(callback.callCount, 1);
        assert.strictEqual(callback.args[0][1], Math.floor(fakeRowCount));
      });
    });
  });

  describe('Transaction', () => {
    let transaction;

    beforeEach(() => {
      transaction = new Transaction(SESSION);
    });

    describe('initialization', () => {
      it('should promisify all the things', () => {
        const expectedOptions = sinon.match({
          exclude: ['deleteRows', 'insert', 'replace', 'update', 'upsert'],
        });

        const stub = PROMISIFY_ALL.withArgs(Transaction, expectedOptions);

        assert.strictEqual(stub.callCount, 1);
      });

      it('should inherit from Dml', () => {
        assert(transaction instanceof Dml);
      });
    });

    describe('batchUpdate', () => {
      const STRING_STATEMENTS = [
        `INSERT INTO Table (Key, Str) VALUES('a', 'b')`,
        `UPDATE Table t SET t.Str = 'c' WHERE t.Key = 'a'`,
      ];

      const OBJ_STATEMENTS = [
        {
          sql: 'INSERT INTO TxnTable (Key, StringValue) VALUES(@key, @str)',
          params: {
            key: 'k999',
            str: 'abc',
          },
        },
        {
          sql: 'UPDATE TxnTable t SET t.StringValue = @str WHERE t.Key = @key',
          params: {
            key: 'k999',
            str: 'abcd',
          },
        },
      ];

      const FORMATTED_STATEMENTS = [
        {
          sql: OBJ_STATEMENTS[0].sql,
          params: {
            fields: {
              key: {stringValue: OBJ_STATEMENTS[0].params.key},
              str: {stringValue: OBJ_STATEMENTS[0].params.str},
            },
          },
          paramTypes: {
            key: {code: 'STRING'},
            str: {code: 'STRING'},
          },
        },
        {
          sql: OBJ_STATEMENTS[1].sql,
          params: {
            fields: {
              key: {stringValue: OBJ_STATEMENTS[1].params.key},
              str: {stringValue: OBJ_STATEMENTS[1].params.str},
            },
          },
          paramTypes: {
            key: {code: 'STRING'},
            str: {code: 'STRING'},
          },
        },
      ];

      it('should return an error if statements are missing', done => {
        transaction.batchUpdate(null, err => {
          assert.strictEqual(
            err.message,
            'batchUpdate requires at least 1 DML statement.'
          );
          assert.strictEqual(err.code, 3);
          assert.deepStrictEqual(err.rowCounts, []);
          done();
        });
      });

      it('should return an error if statements are empty', done => {
        transaction.batchUpdate([], err => {
          assert.strictEqual(
            err.message,
            'batchUpdate requires at least 1 DML statement.'
          );
          assert.strictEqual(err.code, 3);
          assert.deepStrictEqual(err.rowCounts, []);
          done();
        });
      });

      it('should make the correct request', () => {
        const stub = sandbox.stub(transaction, 'request');
        const fakeId = 'transaction-id-123';

        transaction.id = fakeId;
        transaction.batchUpdate(STRING_STATEMENTS, assert.ifError);

        const {client, method, reqOpts} = stub.lastCall.args[0];

        assert.strictEqual(client, 'SpannerClient');
        assert.strictEqual(method, 'executeBatchDml');
        assert.strictEqual(reqOpts.session, SESSION_NAME);
        assert.deepStrictEqual(reqOpts.transaction, {id: fakeId});
        assert.strictEqual(reqOpts.seqno, 1);
      });

      it('should encode sql string statements', () => {
        const stub = sandbox.stub(transaction, 'request');
        const expectedStatements = STRING_STATEMENTS.map(sql => ({sql}));

        transaction.batchUpdate(STRING_STATEMENTS, assert.ifError);

        const {reqOpts} = stub.lastCall.args[0];
        assert.deepStrictEqual(reqOpts.statements, expectedStatements);
      });

      it('should encode DML object statements', () => {
        const stub = sandbox.stub(transaction, 'request');
        transaction.batchUpdate(OBJ_STATEMENTS, assert.ifError);

        const {reqOpts} = stub.lastCall.args[0];
        assert.deepStrictEqual(reqOpts.statements, FORMATTED_STATEMENTS);
      });

      it('should wrap and return any request errors', done => {
        const stub = sandbox.stub(transaction, 'request');
        const fakeError = new Error('err');
        const fakeResponse = {};

        transaction.batchUpdate(
          OBJ_STATEMENTS,
          (err, rowCounts, apiResponse) => {
            assert.strictEqual(err, fakeError);
            assert.deepStrictEqual(err.rowCounts, []);
            assert.deepStrictEqual(rowCounts, []);
            assert.strictEqual(apiResponse, fakeResponse);
            done();
          }
        );

        const requestCallback = stub.lastCall.args[1];
        setImmediate(requestCallback, fakeError, fakeResponse);
      });

      it('should return a list of row counts upon success', done => {
        const stub = sandbox.stub(transaction, 'request');
        const expectedRowCounts = [5, 7];
        const fakeResponse = {
          resultSets: [
            {stats: {rowCount: 'a', a: '5'}},
            {stats: {rowCount: 'b', b: '7'}},
          ],
        };

        transaction.batchUpdate(
          OBJ_STATEMENTS,
          (err, rowCounts, apiResponse) => {
            assert.ifError(err);
            assert.deepStrictEqual(rowCounts, expectedRowCounts);
            assert.strictEqual(apiResponse, fakeResponse);
            done();
          }
        );

        const requestCallback = stub.lastCall.args[1];
        setImmediate(requestCallback, null, fakeResponse);
      });

      it('should return list of 0s for row counts when stats or rowCount value is empty', done => {
        const stub = sandbox.stub(transaction, 'request');
        const expectedRowCounts = [0, 0];
        const fakeResponse = {
          resultSets: [{stats: {rowCount: 'a'}}, {stats: undefined}],
        };

        transaction.batchUpdate(
          OBJ_STATEMENTS,
          (err, rowCounts, apiResponse) => {
            assert.ifError(err);
            assert.deepStrictEqual(rowCounts, expectedRowCounts);
            assert.strictEqual(apiResponse, fakeResponse);
            done();
          }
        );

        const requestCallback = stub.lastCall.args[1];
        setImmediate(requestCallback, null, fakeResponse);
      });

      it('should return both error and row counts for partial failures', done => {
        const stub = sandbox.stub(transaction, 'request');
        const expectedRowCounts = [6, 8];
        const fakeResponse = {
          resultSets: [
            {stats: {rowCount: 'a', a: '6'}},
            {stats: {rowCount: 'b', b: '8'}},
          ],
          status: {code: 3, details: 'Err'},
        };

        transaction.batchUpdate(
          OBJ_STATEMENTS,
          (err, rowCounts, apiResponse) => {
            assert(err instanceof Error);
            assert.strictEqual(err.code, fakeResponse.status.code);
            assert.strictEqual(err.message, fakeResponse.status.details);
            assert.deepStrictEqual(err.rowCounts, expectedRowCounts);
            assert.deepStrictEqual(rowCounts, expectedRowCounts);
            assert.deepStrictEqual(apiResponse, fakeResponse);
            done();
          }
        );

        const requestCallback = stub.lastCall.args[1];
        setImmediate(requestCallback, null, fakeResponse);
      });
    });

    describe('begin', () => {
      it('should send the correct options', () => {
        const stub = sandbox.stub(transaction, 'request');

        transaction.begin();

        const expectedOptions = {readWrite: {}};
        const {reqOpts} = stub.lastCall.args[0];

        assert.deepStrictEqual(reqOpts.options, expectedOptions);
      });
    });

    describe('commit', () => {
      it('should make the correct request', () => {
        const stub = sandbox.stub(transaction, 'request');

        transaction.commit();

        const {client, method, reqOpts} = stub.lastCall.args[0];

        assert.strictEqual(client, 'SpannerClient');
        assert.strictEqual(method, 'commit');
        assert.strictEqual(reqOpts.session, SESSION_NAME);
        assert.deepStrictEqual(reqOpts.mutations, []);
      });

      it('should use the transaction `id` when set', () => {
        const id = 'transaction-id-123';
        const stub = sandbox.stub(transaction, 'request');

        transaction.id = id;
        transaction.commit();

        const {reqOpts} = stub.lastCall.args[0];

        assert.strictEqual(reqOpts.transactionId, id);
      });

      it('should set `singleUseTransaction` when `id` is not set', () => {
        const expectedOptions = {readWrite: {}};
        const stub = sandbox.stub(transaction, 'request');

        transaction.commit();

        const {reqOpts} = stub.lastCall.args[0];

        assert.deepStrictEqual(reqOpts.singleUseTransaction, expectedOptions);
      });

      it('should call `end` once complete', () => {
        const endStub = sandbox.stub(transaction, 'end');
        const requestStub = sandbox.stub(transaction, 'request');

        transaction.commit(() => {});

        const requestCallback = requestStub.lastCall.args[1];
        requestCallback();

        assert.strictEqual(endStub.callCount, 1);
      });

      it('should set the `commitTimestamp` if in response', () => {
        const requestStub = sandbox.stub(transaction, 'request');

        const expectedTimestamp = new PreciseDate(0);
        const fakeTimestamp = {seconds: 0, nanos: 0};

        transaction.commit(() => {});

        const requestCallback = requestStub.lastCall.args[1];
        requestCallback(null, {commitTimestamp: fakeTimestamp});

        assert.deepStrictEqual(transaction.commitTimestamp, expectedTimestamp);
        assert.strictEqual(transaction.commitTimestampProto, fakeTimestamp);
      });

      it('should return any errors and the response', () => {
        const requestStub = sandbox.stub(transaction, 'request');

        const fakeError = new Error('err');
        const fakeResponse = {};
        const callback = sandbox.stub().withArgs(fakeError, fakeResponse);

        transaction.commit(callback);

        const requestCallback = requestStub.lastCall.args[1];
        requestCallback(fakeError, fakeResponse);

        assert.strictEqual(callback.callCount, 1);
      });
    });

    describe('deleteRows', () => {
      it('should queue a "delete" mutation', () => {
        const fakeTable = 'my-table-123';
        const fakeKeys = ['a', 'b'];

        const expectedKeySet = {
          keys: fakeKeys.map(key => {
            return {
              values: [{stringValue: key}],
            };
          }),
        };

        const stub = sandbox.stub(transaction, 'request');

        transaction.deleteRows(fakeTable, fakeKeys);
        transaction.commit();

        const {reqOpts} = stub.lastCall.args[0];
        const {table, keySet} = reqOpts.mutations[0].delete;

        assert.strictEqual(table, fakeTable);
        assert.deepStrictEqual(keySet, expectedKeySet);
      });
    });

    describe('insert', () => {
      it('should queue an "insert" mutation', () => {
        const fakeTable = 'my-table-123';
        const fakeKeyVals = {
          name: 'Joe West',
          id: 'Id3b',
        };

        const expectedColumns = Object.keys(fakeKeyVals).sort();
        const expectedValues = [
          {
            values: expectedColumns.map(column => {
              return {stringValue: fakeKeyVals[column]};
            }),
          },
        ];

        const stub = sandbox.stub(transaction, 'request');

        transaction.insert(fakeTable, fakeKeyVals);
        transaction.commit();

        const {reqOpts} = stub.lastCall.args[0];
        const {table, columns, values} = reqOpts.mutations[0].insert;

        assert.strictEqual(table, fakeTable);
        assert.deepStrictEqual(columns, expectedColumns);
        assert.deepStrictEqual(values, expectedValues);
      });
    });

    describe('replace', () => {
      it('should queue a "replace" mutation', () => {
        const fakeTable = 'my-table-123';
        const fakeKeyVals = {
          name: 'Joe West',
          id: 'Id3b',
        };

        const expectedColumns = Object.keys(fakeKeyVals).sort();
        const expectedValues = [
          {
            values: expectedColumns.map(column => {
              return {stringValue: fakeKeyVals[column]};
            }),
          },
        ];

        const stub = sandbox.stub(transaction, 'request');

        transaction.replace(fakeTable, fakeKeyVals);
        transaction.commit();

        const {reqOpts} = stub.lastCall.args[0];
        const {table, columns, values} = reqOpts.mutations[0].replace;

        assert.strictEqual(table, fakeTable);
        assert.deepStrictEqual(columns, expectedColumns);
        assert.deepStrictEqual(values, expectedValues);
      });
    });

    describe('rollback', () => {
      const ID = 'transaction-id-123';

      beforeEach(() => {
        transaction.id = ID;
      });

      it('should return an error if the `id` is not set', done => {
        const expectedError = new Error(
          'Transaction ID is unknown, nothing to rollback.'
        );

        delete transaction.id;

        transaction.rollback(err => {
          assert.deepStrictEqual(err, expectedError);
          done();
        });
      });

      it('should make the correct request', () => {
        const stub = sandbox.stub(transaction, 'request');
        const expectedReqOpts = {
          session: SESSION_NAME,
          transactionId: ID,
        };

        transaction.rollback();

        const {client, method, reqOpts} = stub.lastCall.args[0];

        assert.strictEqual(client, 'SpannerClient');
        assert.strictEqual(method, 'rollback');
        assert.deepStrictEqual(reqOpts, expectedReqOpts);
      });

      it('should call through to `end`', () => {
        const endStub = sandbox.stub(transaction, 'end');
        const requestStub = sandbox.stub(transaction, 'request');

        transaction.rollback(() => {});

        const requestCallback = requestStub.lastCall.args[1];
        requestCallback(null);

        assert.strictEqual(endStub.callCount, 1);
      });

      it('should return any request errors', () => {
        const fakeError = new Error('err');
        const callback = sandbox.stub().withArgs(fakeError);
        const requestStub = sandbox.stub(transaction, 'request');

        transaction.rollback(callback);

        const requestCallback = requestStub.lastCall.args[1];
        requestCallback(fakeError);

        assert.strictEqual(callback.callCount, 1);
      });
    });

    describe('update', () => {
      it('should queue an "update" mutation', () => {
        const fakeTable = 'my-table-123';
        const fakeKeyVals = {
          name: 'Joe West',
          id: 'Id3b',
        };

        const expectedColumns = Object.keys(fakeKeyVals).sort();
        const expectedValues = [
          {
            values: expectedColumns.map(column => {
              return {stringValue: fakeKeyVals[column]};
            }),
          },
        ];

        const stub = sandbox.stub(transaction, 'request');

        transaction.update(fakeTable, fakeKeyVals);
        transaction.commit();

        const {reqOpts} = stub.lastCall.args[0];
        const {table, columns, values} = reqOpts.mutations[0].update;

        assert.strictEqual(table, fakeTable);
        assert.deepStrictEqual(columns, expectedColumns);
        assert.deepStrictEqual(values, expectedValues);
      });
    });

    describe('upsert', () => {
      it('should queue an "insertOrUpdate" mutation', () => {
        const fakeTable = 'my-table-123';
        const fakeKeyVals = {
          name: 'Joe West',
          id: 'Id3b',
        };

        const expectedColumns = Object.keys(fakeKeyVals).sort();
        const expectedValues = [
          {
            values: expectedColumns.map(column => {
              return {stringValue: fakeKeyVals[column]};
            }),
          },
        ];

        const stub = sandbox.stub(transaction, 'request');

        transaction.upsert(fakeTable, fakeKeyVals);
        transaction.commit();

        const {reqOpts} = stub.lastCall.args[0];
        const {table, columns, values} = reqOpts.mutations[0].insertOrUpdate;

        assert.strictEqual(table, fakeTable);
        assert.deepStrictEqual(columns, expectedColumns);
        assert.deepStrictEqual(values, expectedValues);
      });
    });

    describe('mutations', () => {
      it('should accept an array of rows', () => {
        const stub = sandbox.stub(transaction, 'request');

        const fakeTable = 'my-table-123';
        const rows = [
          {name: 'dave', id: '1'},
          {name: 'stephen', id: '2'},
        ];

        const expectedColumns = Object.keys(rows[0]).sort();
        const expectedValues = rows.map(row => {
          return {
            values: expectedColumns.map(column => {
              return {stringValue: row[column]};
            }),
          };
        });

        transaction.insert(fakeTable, rows);
        transaction.commit();

        const {reqOpts} = stub.lastCall.args[0];
        const {columns, values} = reqOpts.mutations[0].insert;

        assert.deepStrictEqual(columns, expectedColumns);
        assert.deepStrictEqual(values, expectedValues);
      });

      it('should throw an error if missing columns', () => {
        const table = 'my-table-123';
        const rows = [{name: 'dave', id: '1'}, {name: 'stephen'}];

        const errorRegExp = /Row at index 1 does not contain the correct number of columns\.\n\nMissing columns\: \[\"id\"\]/;

        assert.throws(() => transaction.insert(table, rows), errorRegExp);
      });
    });

    describe('getUniqueKeys', () => {
      it('should create a list of unique keys', () => {
        const rows = [
          {name: 'dave', id: '1'},
          {name: 'stephen', age: 102},
          {big: 'monies', no: 'whammies', id: '2'},
        ];

        const expectedKeys = ['age', 'big', 'id', 'name', 'no'];
        const keys = Transaction.getUniqueKeys(rows);

        assert.deepStrictEqual(keys, expectedKeys);
      });
    });
  });

  describe('PartitionedDml', () => {
    let pdml;

    beforeEach(() => {
      pdml = new PartitionedDml(SESSION);
    });

    describe('initialization', () => {
      it('should promisify all the things', () => {
        const stub = PROMISIFY_ALL.withArgs(PartitionedDml);

        assert.strictEqual(stub.callCount, 1);
      });

      it('should inherit from Dml', () => {
        assert(pdml instanceof Dml);
      });
    });

    describe('begin', () => {
      it('should send the correct options', () => {
        const stub = sandbox.stub(pdml, 'request');

        pdml.begin();

        const expectedOptions = {partitionedDml: {}};
        const {reqOpts} = stub.lastCall.args[0];

        assert.deepStrictEqual(reqOpts.options, expectedOptions);
      });
    });

    describe('runUpdate', () => {
      const SQL = 'SELECT * FROM `MyTable`';

      it('should call through to `super.runUpdate`', () => {
        const stub = sandbox.stub(Dml.prototype, 'runUpdate');

        pdml.runUpdate(SQL);

        const query = stub.lastCall.args[0];

        assert.strictEqual(query, SQL);
      });

      it('should end the transaction after a request', () => {
        const endStub = sandbox.stub(pdml, 'end');
        const superStub = sandbox.stub(Dml.prototype, 'runUpdate');

        pdml.runUpdate(SQL, () => {});

        const superCallback = superStub.lastCall.args[1];
        superCallback();

        assert.strictEqual(endStub.callCount, 1);
      });

      it('should return any errors and the row count', () => {
        const fakeErr = new Error('err');
        const fakeRowCount = 5;

        const superStub = sandbox.stub(Dml.prototype, 'runUpdate');
        const callback = sandbox.stub().withArgs(fakeErr, fakeRowCount);

        pdml.runUpdate(SQL, callback);

        const superCallback = superStub.lastCall.args[1];
        superCallback(fakeErr, fakeRowCount);

        assert.strictEqual(callback.callCount, 1);
      });
    });
  });
});
