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

import {promisifyAll} from '@google-cloud/promisify';
import * as arrify from 'arrify';
import {EventEmitter} from 'events';
import {CallOptions} from 'google-gax';
import {ServiceError} from 'grpc';
import * as is from 'is';
import {common as p} from 'protobufjs';
import {Readable} from 'stream';

import {google as spanner_client} from '../proto/spanner';

import {codec, Json, JSONOptions, Type, Value} from './codec';
import {PartialResultStream, partialResultStream, ResumeToken, Row} from './partial-result-stream';
import {Session} from './session';
import {Key} from './table';
import {SpannerClient as s} from './v1';

export type Rows = Array<Row|Json>;

export interface TimestampBounds {
  strong?: boolean;
  minReadTimestamp?: Date|p.ITimestamp;
  maxStaleness?: number|p.IDuration;
  readTimestamp?: Date|p.ITimestamp;
  exactStaleness?: number|p.IDuration;
  returnReadTimestamp?: boolean;
}

export interface RequestOptions {
  json?: boolean;
  jsonOptions?: JSONOptions;
  gaxOptions?: CallOptions;
}

export interface ExecuteSqlRequest extends RequestOptions {
  sql: string;
  params?: {[param: string]: string};
  types?: {[param: string]: string};
  resumeToken?: ResumeToken;
  queryMode?: s.QueryMode;
  partitionToken?: Uint8Array|string;
  seqno?: number;
}

export interface KeyRange {
  startClosed?: Value[];
  startOpen?: Value[];
  endClosed?: Value[];
  endOpen?: Value[];
}

export interface ReadRequest extends RequestOptions {
  keySet?: s.KeySet;
  keys?: string[];
  ranges?: KeyRange[];
  index?: string;
  columns?: string[];
  limit?: number;
  resumeToken?: ResumeToken;
  partitionToken?: Uint8Array|string;
}

export type BeginPromise = Promise<[s.Transaction]>;
export type CommitPromise = Promise<[spanner_client.spanner.v1.CommitResponse]>;
export type ReadPromise = Promise<[Rows]>;
export type RunPromise = Promise<[Rows, s.ResultSetStats]>;
export type RunUpdatePromise = Promise<[number]>;

export interface ReadCallback {
  (err: null|ServiceError, rows: Rows): void;
}

export interface RunCallback {
  (err: null|ServiceError, rows: Rows, stats: s.ResultSetStats): void;
}

export interface RunUpdateCallback {
  (err: null|ServiceError, rowCount: number): void;
}

export interface CommitRequest {
  session: string;
  transactionId?: Uint8Array|string|null;
  singleUseTransaction?: spanner_client.spanner.v1.ITransactionOptions;
  mutations: spanner_client.spanner.v1.IMutation[];
}

export interface TransactionSelector {
  singleUse?: spanner_client.spanner.v1.ITransactionOptions;
  id?: Uint8Array|string|null;
  begin?: spanner_client.spanner.v1.ITransactionOptions|null;
}

/**
 * @typedef {object} TimestampBounds
 * @property {boolean} [strong=true] Read at a timestamp where all previously
 *     committed transactions are visible.
 * @property {Date|google.protobuf.Timestamp} [minReadTimestamp] Executes all
 *     reads at a `timestamp >= minReadTimestamp`.
 * @property {number|google.protobuf.Timestamp} [maxStaleness] Read data at a
 *     `timestamp >= NOW - maxStaleness` (milliseconds).
 * @property {Date|google.protobuf.Timestamp} [readTimestamp] Executes all
 *     reads at the given timestamp.
 * @property {number|google.protobuf.Timestamp} [exactStaleness] Executes all
 *     reads at a timestamp that is `exactStaleness` (milliseconds) old.
 * @property {boolean} [returnReadTimestamp=true] When true,
 *     {@link Snapshot#readTimestamp} will be populated after
 *     {@link Snapshot#begin} is called.
 */
/**
 * This transaction type provides guaranteed consistency across several reads,
 * but does not allow writes. Snapshot read-only transactions can be configured
 * to read at timestamps in the past.
 *
 * When finished with the Snapshot, you should call {@link Snapshot#end} to
 * release the underlying {@link Session}. Failure to do can result in a
 * Session leak.
 *
 * **This object is created and returned from {@link Database#getSnapshot}.**
 *
 * @class
 * @hideconstructor
 *
 * @see [Timestamp Bounds API Documentation](https://cloud.google.com/spanner/docs/timestamp-bounds)
 *
 * @example
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 *
 * const timestampBounds = {
 *   strong: true
 * };
 *
 * database.getSnapshot(timestampBounds, (err, transaction) => {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   // should be called when finished with the snapshot
 *   transaction.end();
 * });
 */
export class Snapshot extends EventEmitter {
  protected _options!: spanner_client.spanner.v1.ITransactionOptions;
  id?: string|Uint8Array;
  ended: boolean;
  metadata?: spanner_client.spanner.v1.ITransaction;
  readTimestamp?: Date;
  readTimestampProto?: spanner_client.protobuf.ITimestamp;
  request: (config: {}, callback: Function) => void;
  requestStream: (config: {}) => Readable;
  session: Session;

  /**
   * The transaction ID.
   *
   * @name Snapshot#id
   * @type {?(string|Buffer)}
   */
  /**
   * Whether or not the transaction has been ended. If true, no further requests
   * should be made and the transaction should be discarded.
   *
   * @name Snapshot#ended
   * @type {boolean}
   */
  /**
   * The raw transaction response object. Will be populated after
   * {@link Snapshot#begin} has been called.
   *
   * @name Snapshot#metadata
   * @type {?TransactionResponse}
   */
  /**
   * **Snapshot only**
   * The timestamp at which all reads will be performed.
   *
   * @name Snapshot#readTimestamp
   * @type {?Date}
   */
  /**
   * **Snapshot only**
   * The protobuf version of {@link Snapshot#readTimestamp}. This is useful if
   * you require microsecond precision.
   *
   * @name Snapshot#readTimestampProto
   * @type {?google.protobuf.Timestamp}
   */
  /**
   * @constructor
   *
   * @param {Session} session The parent Session object.
   * @param {TimestampBounds} [options] Snapshot timestamp bounds.
   */
  constructor(session: Session, options?: TimestampBounds) {
    super();

    this.ended = false;
    this.session = session;
    this.request = session.request.bind(session);
    this.requestStream = session.requestStream.bind(session);

    const readOnly = Snapshot.encodeTimestampBounds(options || {});
    this._options = {readOnly};
  }

  begin(): BeginPromise;
  begin(callback: spanner_client.spanner.v1.Spanner.BeginTransactionCallback): void;
  /**
   * @typedef {object} TransactionResponse
   * @property {string|Buffer} id The transaction ID.
   * @property {?google.protobuf.Timestamp} readTimestamp For snapshot read-only
   *     transactions, the read timestamp chosen for the transaction.
   */
  /**
   * @typedef {array} TransactionBeginResponse
   * @property {TransactionResponse} 0 The raw transaction object.
   */
  /**
   * @callback TransactionBeginCallback
   * @param {?Error} err Request error, if any.
   * @param {TransactionResponse} apiResponse The raw transaction object.
   */
  /**
   * Begin a new transaction. Typically you shouldn't need to call this unless
   * manually creating transactions via {@link Session} objects.
   *
   * @see [BeginTransaction API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.BeginTransaction)
   *
   * @param {TransactionBeginCallback} [callback] Callback function.
   * @returns {Promise<TransactionBeginResponse>}
   *
   * @example
   * transaction.begin(function(err) {
   *   if (!err) {
   *     // transaction began successfully.
   *   }
   * });
   *
   * @example <caption>If the callback is omitted, we'll return a Promise
   * </caption>
   * transaction.begin()
   *   .then(function(data) {
   *     const apiResponse = data[0];
   *   });
   */
  begin(callback?: spanner_client.spanner.v1.Spanner.BeginTransactionCallback): void|BeginPromise {
    const session = this.session.formattedName_!;
    const options: spanner_client.spanner.v1.ITransactionOptions = this._options;
    const reqOpts: spanner_client.spanner.v1.IBeginTransactionRequest = {session, options};

    this.request(
        {
          client: 'SpannerClient',
          method: 'beginTransaction',
          reqOpts,
        },
      (err: null | ServiceError, resp: spanner_client.spanner.v1.Transaction) => {
          if (err) {
            callback!(err, resp);
            return;
          }

          const {id, readTimestamp} = resp;

          this.id = id;
          this.metadata = resp;

          if (readTimestamp) {
            this.readTimestampProto = readTimestamp;
            this.readTimestamp =
                codec.convertProtoTimestampToDate(readTimestamp);
          }

          callback!(null, resp);
        });
  }

  /**
   * A KeyRange represents a range of rows in a table or index.
   *
   * A range has a start key and an end key. These keys can be open or closed,
   * indicating if the range includes rows with that key.
   *
   * Keys are represented by an array of strings where the nth value in the list
   * corresponds to the nth component of the table or index primary key.
   *
   * @typedef {object} KeyRange
   * @property {string[]} [startClosed] If the start is closed, then the range
   *     includes all rows whose first key columns exactly match.
   * @property {string[]} [startOpen] If the start is open, then the range
   *     excludes rows whose first key columns exactly match.
   * @property {string[]} [endClosed] If the end is closed, then the range
   *     includes all rows whose first key columns exactly match.
   * @property {string[]} [endOpen] If the end is open, then the range excludes
   *     rows whose first key columns exactly match.
   */
  /**
   * Read request options. This includes all standard ReadRequest options as
   * well as several convenience properties.
   *
   * @see [StreamingRead API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.StreamingRead)
   * @see [ReadRequest API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest)
   *
   * @typedef {object} ReadRequest
   * @property {string[]} [keys] The primary keys of the rows in this table to be
   *     yielded. If using a composite key, provide an array within this array.
   *     See the example below.
   * @property {KeyRange[]} [ranges] An alternative to the keys property, this can
   *       be used to define a range of keys to be yielded.
   * @property {boolean} [json=false] Receive the rows as serialized objects. This
   *     is the equivalent of calling `toJSON()` on each row.
   * @property {JSONOptions} [jsonOptions] Configuration options for the
   *     serialized objects.
   */
  /**
   * Create a readable object stream to receive rows from the database using key
   * lookups and scans.
   *
   * Wrapper around {@link v1.SpannerClient#streamingRead}.
   *
   * @see {@link v1.SpannerClient#streamingRead}
   * @see [StreamingRead API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.StreamingRead)
   * @see [ReadRequest API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest)
   *
   * @fires PartialResultStream#response
   * @fires PartialResultStream#stats
   *
   * @param {string} table The table to read from.
   * @param {ReadRequest} query Configuration object. See official
   *     [`ReadRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest).
   *     API documentation.
   * @returns {ReadableStream} A readable stream that emits rows.
   *
   * @example
   * transaction.createReadStream('Singers', {
   *     keys: ['1'],
   *     columns: ['SingerId', 'name']
   *   })
   *   .on('error', function(err) {})
   *   .on('data', function(row) {
   *     // row = [
   *     //   {
   *     //     name: 'SingerId',
   *     //     value: '1'
   *     //   },
   *     //   {
   *     //     name: 'Name',
   *     //     value: 'Eddie Wilson'
   *     //   }
   *     // ]
   *   })
   *   .on('end', function() {
   *     // All results retrieved.
   *   });
   *
   * @example <caption>Provide an array for `query.keys` to read with a
   * composite key.</caption>
   * const query = {
   *   keys: [
   *     [
   *       'Id1',
   *       'Name1'
   *     ],
   *     [
   *       'Id2',
   *       'Name2'
   *     ]
   *   ],
   *   // ...
   * };
   *
   * @example <caption>Rows are returned as an array of object arrays. Each
   * object has a `name` and `value` property. To get a serialized object, call
   * `toJSON()`.</caption>
   * transaction.createReadStream('Singers', {
   *     keys: ['1'],
   *     columns: ['SingerId', 'name']
   *   })
   *   .on('error', function(err) {})
   *   .on('data', function(row) {
   *     // row.toJSON() = {
   *     //   SingerId: '1',
   *     //   Name: 'Eddie Wilson'
   *     // }
   *   })
   *   .on('end', function() {
   *     // All results retrieved.
   *   });
   *
   * @example <caption>Alternatively, set `query.json` to `true`, and this step
   * will be performed automatically.</caption>
   * transaction.createReadStream('Singers', {
   *     keys: ['1'],
   *     columns: ['SingerId', 'name'],
   *     json: true,
   *   })
   *   .on('error', function(err) {})
   *   .on('data', function(row) {
   *     // row = {
   *     //   SingerId: '1',
   *     //   Name: 'Eddie Wilson'
   *     // }
   *   })
   *   .on('end', function() {
   *     // All results retrieved.
   *   });
   *
   * @example <caption>If you anticipate many results, you can end a stream
   * early to prevent unnecessary processing and API requests.</caption>
   * transaction.createReadStream('Singers', {
   *     keys: ['1'],
   *     columns: ['SingerId', 'name']
   *   })
   *   .on('data', function(row) {
   *     this.end();
   *   });
   */
  createReadStream(table: string, request = {} as ReadRequest):
      PartialResultStream {
    const {gaxOptions, json, jsonOptions} = request;
    const keySet = Snapshot.encodeKeySet(request);
    const transaction: TransactionSelector = {};

    if (this.id) {
      transaction.id = this.id;
    } else {
      transaction.singleUse = this._options;
    }

    request = Object.assign({}, request);

    delete request.gaxOptions;
    delete request.json;
    delete request.jsonOptions;
    delete request.keys;
    delete request.ranges;

    const reqOpts: ReadRequest = Object.assign(request, {
      session: this.session.formattedName_!,
      transaction,
      table,
      keySet,
    });

    const makeRequest = (resumeToken?: ResumeToken): Readable => {
      return this.requestStream({
        client: 'SpannerClient',
        method: 'streamingRead',
        reqOpts: Object.assign({}, reqOpts, {resumeToken}),
        gaxOpts: gaxOptions,
      });
    };

    return partialResultStream(makeRequest, {json, jsonOptions});
  }

  /**
   * Let the client know you're done with a particular transaction. This should
   * mainly be called for {@link Snapshot} objects, however in certain cases
   * you may want to call them for {@link Transaction} objects as well.
   *
   * @example <caption>Calling `end` on a read only snapshot</caption>
   * database.getSnapshot((err, transaction) => {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   transaction.run('SELECT * FROM Singers', (err, rows) => {
   *     if (err) {
   *       // Error handling omitted.
   *     }
   *
   *     // End the snapshot.
   *     transaction.end();
   *   });
   * });
   *
   * @example <caption>Calling `end` on a read/write transaction</caption>
   * database.runTransaction((err, transaction) => {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   const query = 'UPDATE Account SET Balance = 1000 WHERE Key = 1';
   *
   *   transaction.runUpdate(query, err => {
   *     if (err) {
   *       // In the event of an error here there would be nothing to rollback,
   * so
   *       // instead of continuing, we might want to just discard the
   * transaction. transaction.end(); return;
   *     }
   *
   *     transaction.commit(err => {});
   *   });
   * });
   */
  end(): void {
    if (this.ended) {
      return;
    }

    this.ended = true;
    process.nextTick(() => this.emit('end'));
  }

  read(table: string, request: ReadRequest): ReadPromise;
  read(table: string, callback: ReadCallback): void;
  read(table: string, request: ReadRequest, callback: ReadCallback): void;
  /**
   * @typedef {array} TransactionReadResponse
   * @property {array[]} 0 Rows are returned as an array of object arrays. Each
   *     object has a `name` and `value` property. To get a serialized object,
   *     call `toJSON()`. Optionally, provide an options object to `toJSON()`
   *     specifying `wrapNumbers: true` to protect large integer values outside
   * of the range of JavaScript Number. If set, FLOAT64 values will be returned
   *     as {@link Spanner.Float} objects and INT64 values as {@link
   * Spanner.Int}.
   */
  /**
   * @callback TransactionReadCallback
   * @param {?Error} err Request error, if any.
   * @param {array[]} rows Rows are returned as an array of object arrays. Each
   *     object has a `name` and `value` property. To get a serialized object,
   *     call `toJSON()`. Optionally, provide an options object to `toJSON()`
   *     specifying `wrapNumbers: true` to protect large integer values outside
   * of the range of JavaScript Number. If set, FLOAT64 values will be returned
   *     as {@link Spanner.Float} objects and INT64 values as {@link
   * Spanner.Int}.
   */
  /**
   * Performs a read request against the specified Table.
   *
   * Wrapper around {@link v1.SpannerClient#read}.
   *
   * @see {@link v1.SpannerClient#read}
   *
   * @param {string} table The table to read from.
   * @param {ReadRequest} query Configuration object. See official
   *     [`ReadRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest).
   *     API documentation.
   * @param {TransactionRequestReadCallback} [callback] Callback function.
   * @returns {Promise<TransactionRequestReadResponse>}
   *
   * @example
   * const query = {
   *   keys: ['1'],
   *   columns: ['SingerId', 'name']
   * };
   *
   * transaction.read('Singers', query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   const firstRow = rows[0];
   *
   *   // firstRow = [
   *   //   {
   *   //     name: 'SingerId',
   *   //     value: '1'
   *   //   },
   *   //   {
   *   //     name: 'Name',
   *   //     value: 'Eddie Wilson'
   *   //   }
   *   // ]
   * });
   *
   * @example <caption>Provide an array for `query.keys` to read with a
   * composite key.</caption>
   * const query = {
   *   keys: [
   *     [
   *       'Id1',
   *       'Name1'
   *     ],
   *     [
   *       'Id2',
   *       'Name2'
   *     ]
   *   ],
   *   // ...
   * };
   *
   * @example <caption>Rows are returned as an array of object arrays. Each
   * object has a `name` and `value` property. To get a serialized object, call
   * `toJSON()`.</caption>
   * transaction.read('Singers', query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   const firstRow = rows[0];
   *
   *   // firstRow.toJSON() = {
   *   //   SingerId: '1',
   *   //   Name: 'Eddie Wilson'
   *   // }
   * });
   *
   * @example <caption>Alternatively, set `query.json` to `true`, and this step
   * will be performed automatically.</caption>
   * query.json = true;
   *
   * transaction.read('Singers', query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   const firstRow = rows[0];
   *
   *   // firstRow = {
   *   //   SingerId: '1',
   *   //   Name: 'Eddie Wilson'
   *   // }
   * });
   */
  read(
      table: string, requestOrCallback: ReadRequest|ReadCallback,
      cb?: ReadCallback): void|ReadPromise {
    const rows: Rows = [];

    let request: ReadRequest;
    let callback: ReadCallback;

    if (is.fn(requestOrCallback)) {
      request = {} as RequestOptions;
      callback = requestOrCallback as ReadCallback;
    } else {
      request = requestOrCallback as RequestOptions;
      callback = cb as ReadCallback;
    }

    this.createReadStream(table, request)
        .on('error', callback!)
        .on('data', row => rows.push(row))
        .on('end', () => callback!(null, rows));
  }

  run(query: string|ExecuteSqlRequest): RunPromise;
  run(query: string|ExecuteSqlRequest, callback: RunCallback): void;
  /**
   * Execute a SQL statement on this database inside of a transaction.
   *
   * **Performance Considerations:**
   *
   * This method wraps the streaming method,
   * {@link Snapshot#run} for your convenience. All rows will
   * be stored in memory before being released to your callback. If you intend
   * on receiving a lot of results from your query, consider using the streaming
   * method, so you can free each result from memory after consuming it.
   *
   * Wrapper around {@link v1.SpannerClient#executeStreamingSql}.
   *
   * @see {@link v1.SpannerClient#executeStreamingSql}
   * @see [ExecuteStreamingSql API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ExecuteStreamingSql)
   * @see [ExecuteSqlRequest API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
   *
   * @param {string|ExecuteSqlRequest} query A SQL query or
   *     {@link ExecuteSqlRequest} object.
   * @param {RunCallback} [callback] Callback function.
   * @returns {Promise<RunResponse>}
   *
   * @example
   * transaction.run(query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // rows = [
   *   //   {
   *   //     SingerId: '1',
   *   //     Name: 'Eddie Wilson'
   *   //   }
   *   // ]
   * });
   *
   * @example <caption>The SQL query string can contain parameter placeholders.
   * A parameter placeholder consists of '@' followed by the parameter name.
   * </caption>
   * const query = {
   *   sql: 'SELECT * FROM Singers WHERE name = @name',
   *   params: {
   *     name: 'Eddie Wilson'
   *   }
   * };
   *
   * transaction.run(query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   * });
   *
   * @example <caption>If you need to enforce a specific param type, a types map
   * can be provided. This is typically useful if your param value can be null.
   * </caption>
   * const query = {
   *   sql: 'SELECT * FROM Singers WHERE name = @name AND id = @id',
   *   params: {
   *     id: spanner.int(8),
   *     name: null
   *   },
   *   types: {
   *     id: 'int64',
   *     name: 'string'
   *   }
   * };
   *
   * transaction.run(query, function(err, rows) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   * });
   */
  run(query: string|ExecuteSqlRequest,
      callback?: RunCallback): void|RunPromise {
    const rows: Rows = [];
    let stats;

    this.runStream(query)
        .on('error', callback!)
        .on('data', row => rows.push(row))
        .on('stats', _stats => stats = _stats)
        .on('end', () => callback!(null, rows, stats));
  }

  /**
   * ExecuteSql request options. This includes all standard ExecuteSqlRequest
   * options as well as several convenience properties.
   *
   * @see [Query Syntax](https://cloud.google.com/spanner/docs/query-syntax)
   * @see [ExecuteSql API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ExecuteSql)
   *
   * @typedef {object} ExecuteSqlRequest
   * @property {string} sql The SQL string.
   * @property {Object.<string, *>} [params] A map of parameter names to values.
   * @property {Object.<string, (string|ParamType)>} [types] A map of parameter
   *     names to types. If omitted the client will attempt to guess for all
   *     non-null values.
   * @property {boolean} [json=false] Receive the rows as serialized objects. This
   *     is the equivalent of calling `toJSON()` on each row.
   * @property {JSONOptions} [jsonOptions] Configuration options for the
   *     serialized objects.
   */
  /**
   * Create a readable object stream to receive resulting rows from a SQL
   * statement.
   *
   * Wrapper around {@link v1.SpannerClient#executeStreamingSql}.
   *
   * @see {@link v1.SpannerClient#executeStreamingSql}
   * @see [ExecuteStreamingSql API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ExecuteStreamingSql)
   * @see [ExecuteSqlRequest API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
   *
   * @fires PartialResultStream#response
   * @fires PartialResultStream#stats
   *
   * @param {string|ExecuteSqlRequest} query A SQL query or
   *     {@link ExecuteSqlRequest} object.
   * @returns {ReadableStream}
   *
   * @example
   * const query = 'SELECT * FROM Singers';
   *
   * transaction.runStream(query)
   *   .on('error', function(err) {})
   *   .on('data', function(row) {
   *     // row = {
   *     //   SingerId: '1',
   *     //   Name: 'Eddie Wilson'
   *     // }
   *   })
   *   .on('end', function() {
   *     // All results retrieved.
   *   });
   *
   * @example <caption>The SQL query string can contain parameter placeholders.
   * A parameter placeholder consists of '@' followed by the parameter name.
   * </caption>
   * const query = {
   *   sql: 'SELECT * FROM Singers WHERE name = @name',
   *   params: {
   *     name: 'Eddie Wilson'
   *   }
   * };
   *
   * transaction.runStream(query)
   *   .on('error', function(err) {})
   *   .on('data', function(row) {})
   *   .on('end', function() {});
   *
   * @example <caption>If you anticipate many results, you can end a stream
   * early to prevent unnecessary processing and API requests.</caption>
   * transaction.runStream(query)
   *   .on('data', function(row) {
   *     this.end();
   *   });
   */
  runStream(query: string|ExecuteSqlRequest): PartialResultStream {
    if (is.string(query)) {
      query = {sql: query} as ExecuteSqlRequest;
    }

    query = Object.assign({}, query) as ExecuteSqlRequest;

    const {gaxOptions, json, jsonOptions} = query;
    const {params, paramTypes} = Snapshot.encodeParams(query);
    const transaction: TransactionSelector = {};

    if (this.id) {
      transaction.id = this.id;
    } else {
      transaction.singleUse = this._options;
    }

    delete query.gaxOptions;
    delete query.json;
    delete query.jsonOptions;
    delete query.types;

    const reqOpts: ExecuteSqlRequest = Object.assign(query, {
      session: this.session.formattedName_!,
      transaction,
      params,
      paramTypes,
    });

    const makeRequest = (resumeToken?: ResumeToken): Readable => {
      return this.requestStream({
        client: 'SpannerClient',
        method: 'executeStreamingSql',
        reqOpts: Object.assign({}, reqOpts, {resumeToken}),
        gaxOpts: gaxOptions,
      });
    };

    return partialResultStream(makeRequest, {json, jsonOptions});
  }

  /**
   * Transforms convenience options `keys` and `ranges` into a KeySet object.
   *
   * @private
   * @static
   *
   * @param {ReadRequest} request The read request.
   * @returns {object}
   */
  static encodeKeySet(request: ReadRequest): s.KeySet {
    const keySet: s.KeySet = request.keySet || {};

    if (request.keys) {
      keySet.keys = arrify(request.keys).map(codec.convertToListValue);
    }

    if (request.ranges) {
      keySet.ranges = arrify(request.ranges).map(range => {
        const encodedRange: s.KeyRange = {};

        Object.keys(range).forEach(bound => {
          encodedRange[bound] = codec.convertToListValue(range[bound]);
        });

        return encodedRange;
      });
    }

    if (is.empty(keySet)) {
      keySet.all = true;
    }

    return keySet;
  }

  /**
   * Formats timestamp options into proto format.
   *
   * @private
   * @static
   *
   * @param {TimestampBounds} options The user supplied options.
   * @returns {object}
   */
  static encodeTimestampBounds(options: TimestampBounds): spanner_client.spanner.v1.TransactionOptions.IReadOnly {
    const {returnReadTimestamp = true} = options;
    const readOnly: spanner_client.spanner.v1.TransactionOptions.IReadOnly = {};

    if (is.date(options.minReadTimestamp)) {
      const timestamp = (options.minReadTimestamp as Date).getTime();
      readOnly.minReadTimestamp = codec.convertMsToProtoTimestamp(timestamp);
    }

    if (is.date(options.readTimestamp)) {
      const timestamp = (options.readTimestamp as Date).getTime();
      readOnly.readTimestamp = codec.convertMsToProtoTimestamp(timestamp);
    }

    if (is.number(options.maxStaleness)) {
      readOnly.maxStaleness =
          codec.convertMsToProtoTimestamp(options.maxStaleness as number);
    }

    if (is.number(options.exactStaleness)) {
      readOnly.exactStaleness =
          codec.convertMsToProtoTimestamp(options.exactStaleness as number);
    }

    // if we didn't detect a convenience format, we'll just assume that maybe
    // they passed in a protobuf timestamp.
    if (is.empty(readOnly)) {
      Object.assign(readOnly, options);
    }

    readOnly.returnReadTimestamp = returnReadTimestamp;
    return readOnly;
  }

  /**
   * Encodes convenience options `param` and `types` into the proto formatted.
   *
   * @private
   * @static
   *
   * @param {ExecuteSqlRequest} request The sql request.
   * @returns {object}
   */
  static encodeParams(request: ExecuteSqlRequest) {
    const typeMap: {[field: string]: string|Type} = request.types || {};

    const params: p.IStruct = {};
    const paramTypes: {[field: string]: s.Type} = {};

    if (request.params) {
      const fields = {};

      Object.keys(request.params).forEach(param => {
        const value = request.params![param];

        if (!typeMap[param]) {
          typeMap[param] = codec.getType(value);
        }
        fields[param] = codec.encode(value);
      });

      params.fields = fields;
    }

    if (!is.empty(typeMap)) {
      Object.keys(typeMap).forEach(param => {
        const type = typeMap[param];
        paramTypes[param] = codec.createTypeObject(type);
      });
    }

    return {params, paramTypes};
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Snapshot, {
  exclude: ['end'],
});

/**
 * Dml class should never be used directly. Instead it should be extended upon
 * if a class requires DML capabilities.
 *
 * @private
 * @class
 */
export class Dml extends Snapshot {
  protected _seqno = 1;

  runUpdate(query: string|ExecuteSqlRequest): RunUpdatePromise;
  runUpdate(query: string|ExecuteSqlRequest, callback: RunUpdateCallback): void;
  /**
   * @typedef {array} RunUpdateResponse
   * @property {number} 0 Affected row count.
   */
  /**
   * @callback RunUpdateCallback
   * @param {?Error} err Request error, if any.
   * @param {number} rowCount Affected row count.
   */
  /**
   * Execute a DML statements and get the affected row count.
   *
   * @private
   *
   * @see {@link Transaction#run}
   *
   * @param {string|object} query A DML statement or
   *     [`ExecuteSqlRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
   *     object.
   * @param {object} [query.params] A map of parameter name to values.
   * @param {object} [query.types] A map of parameter types.
   * @param {RunUpdateCallback} [callback] Callback function.
   * @returns {Promise<RunUpdateResponse>}
   */
  runUpdate(query: string|ExecuteSqlRequest, callback?: RunUpdateCallback):
      void|RunUpdatePromise {
    if (is.string(query)) {
      query = {sql: query} as ExecuteSqlRequest;
    }

    const seqno = this._seqno++;
    const reqOpts = Object.assign({seqno}, query);

    this.run(
        reqOpts,
        (err: null|ServiceError, rows: Rows, stats: s.ResultSetStats) => {
          let rowCount = 0;

          if (stats && stats.rowCount) {
            rowCount = Math.floor(stats[stats.rowCount]);
          }

          callback!(err, rowCount);
        });
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Dml);

/**
 * This type of transaction is the only way to write data into Cloud Spanner.
 * These transactions rely on pessimistic locking and, if necessary, two-phase
 * commit. Locking read-write transactions may abort, requiring the application
 * to retry.
 *
 * Calling either {@link Transaction#commit} or {@link Transaction#rollback}
 * signals that the transaction is finished and no further requests will be
 * made. If for some reason you decide not to call one of the aformentioned
 * methods, you should call {@link Transaction#end} to release the underlying
 * {@link Session}.
 *
 * Running a transaction via {@link Database#runTransaction} or
 * {@link Database#runTransactionAsync} will automatically re-run the
 * transaction on `ABORTED` errors.
 *
 * {@link Database#getTransaction} will return a plain {@link Transaction}
 * object, requiring the user to retry manually.
 *
 * @class
 * @extends Snapshot
 *
 * @param {Session} session The parent Session object.
 *
 * @example
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 *
 * database.runTransaction(function(err, transaction) {
 *   // The `transaction` object is ready for use.
 * });
 *
 * @example <caption>To manually control retrying the transaction, use the
 * `getTransaction` method.</caption>
 * database.getTransaction(function(err, transaction) {
 *   // The `transaction` object is ready for use.
 * });
 */
export class Transaction extends Dml {
  commitTimestamp?: Date;
  commitTimestampProto?: spanner_client.protobuf.ITimestamp;
  private _queuedMutations: s.Mutation[];

  /**
   * Timestamp at which the transaction was committed. Will be populated once
   * {@link Transaction#commit} is called.
   *
   * @name Transaction#commitTimestamp
   * @type {?Date}
   */
  /**
   * The protobuf version of {@link Transaction#commitTimestamp}. This is useful
   * if you require microsecond precision.
   *
   * @name Transaction#commitTimestampProto
   * @type {?google.protobuf.Timestamp}
   */
  /**
   * Execute a DML statements and get the affected row count.
   *
   * @name Transaction#runUpdate
   *
   * @see {@link Transaction#run}
   *
   * @param {string|object} query A DML statement or
   *     [`ExecuteSqlRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
   *     object.
   * @param {object} [query.params] A map of parameter name to values.
   * @param {object} [query.types] A map of parameter types.
   * @param {RunUpdateCallback} [callback] Callback function.
   * @returns {Promise<RunUpdateResponse>}
   *
   * @example
   * const query = 'UPDATE Account SET Balance = 1000 WHERE Key = 1';
   *
   * transaction.runUpdate(query, (err, rowCount) => {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   * });
   */
  constructor(session: Session, options = {} as s.ReadWrite) {
    super(session);

    this._queuedMutations = [];
    this._options = {readWrite: options};
  }

  commit(): CommitPromise;
  commit(callback: spanner_client.spanner.v1.Spanner.CommitCallback): void;
  /**
   * @typedef {object} CommitResponse
   * @property {google.protobuf.Timestamp} commitTimestamp The transaction
   *     commit timestamp.
   */
  /**
   * @typedef {array} CommitPromiseResponse
   * @property {CommitResponse} 0 The commit response.
   */
  /**
   * @callback CommitCallback
   * @param {?Error} error Request error, if any.
   * @param {CommitResponse} apiResponse The full API response.
   */
  /**
   * Commit the transaction.
   *
   * Wrapper around {@link v1.SpannerClient#commit}.
   *
   * @see {@link v1.SpannerClient#commit}
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {CommitCallback} [callback] Callback function.
   * @returns {Promise<CommitPromiseResponse>}
   *
   * @example
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Queue a mutation (note that there is no callback passed to `insert`).
   *   transaction.insert('Singers', {
   *     SingerId: 'Id3b',
   *     Name: 'Joe West'
   *   });
   *
   *   // Commit the transaction.
   *   transaction.commit(function(err, apiResponse) {
   *     if (!err) {
   *       // Get the commit timestamp on successful commits.
   *       const {commitTimestamp} = apiResponse;
   *     }
   *   });
   * });
   */
  commit(callback?: spanner_client.spanner.v1.Spanner.CommitCallback): void | CommitPromise {
    const mutations = this._queuedMutations;
    const session = this.session.formattedName_!;
    const reqOpts: CommitRequest = {mutations, session};

    if (this.id) {
      reqOpts.transactionId = this.id;
    } else {
      reqOpts.singleUseTransaction = this._options;
    }

    this.request(
        {
          client: 'SpannerClient',
          method: 'commit',
          reqOpts,
        },
        (err: null|Error, resp: spanner_client.spanner.v1.CommitResponse) => {
          this.end();

          if (resp && resp.commitTimestamp) {
            this.commitTimestampProto = resp.commitTimestamp;
            this.commitTimestamp =
                codec.convertProtoTimestampToDate(resp.commitTimestamp);
          }

          callback!(err, resp);
        });
  }

  /**
   * Delete rows from a table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The name of the table.
   * @param {array} keys The keys for the rows to delete. If using a
   *     composite key, provide an array within this array. See the example
   * below.
   *
   * @example
   * const keys = ['Id1', 'Id2', 'Id3'];
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Queue this mutation until later calling `commit`.
   *   // Note that a callback is not passed to `deleteRows`.
   *   transaction.deleteRows('Singers', keys);
   *
   *   // Commit the transaction.
   *   transaction.commit(function(err) {
   *     if (!err) {
   *       // The rows were deleted successfully.
   *     }
   *   });
   * });
   *
   * @example <caption>Provide an array for `keys` to delete rows with a
   * composite key.</caption>
   * const keys = [
   *   [
   *     'Id1',
   *     'Name1'
   *   ],
   *   [
   *     'Id2',
   *     'Name2'
   *   ]
   * ];
   */
  deleteRows(table: string, keys: Key[]): void {
    const keySet: s.KeySet = {keys: arrify(keys).map(codec.convertToListValue)};
    const mutation: s.Mutation = {delete: {table, keySet}};

    this._queuedMutations.push(mutation);
  }

  /**
   * Insert rows of data into this table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The name of the table.
   * @param {object|object[]} rows A map of names to values of data to insert
   *     into this table.
   *
   * @example
   * const row = {
   *   SingerId: 'Id3',
   *   Name: 'Eddie Wilson'
   * };
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Queue this mutation until later calling `commit`.
   *   // Note that a callback is not passed to `insert`.
   *   transaction.insert('Singers', row);
   *
   *   // Commit the transaction.
   *   transaction.commit(function(err) {
   *     if (!err) {
   *       // The row was inserted successfully.
   *     }
   *   });
   * });
   *
   * @example <caption>Multiple rows can be inserted at once.</caption>
   * const row2 = {
   *   SingerId: 'Id3b',
   *   Name: 'Joe West'
   * };
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Queue multiple mutations until later calling `commit`.
   *   // Note that a callback is not passed to `insert`.
   *   transaction.insert('Singers', [
   *     row,
   *     row2
   *   ]);
   *
   *   // Commit the transaction.
   *   transaction.commit(function(err) {
   *     if (!err) {
   *       // The rows were inserted successfully.
   *     }
   *   });
   * });
   */
  insert(table: string, rows: object|object[]): void {
    this._mutate('insert', table, rows);
  }

  /**
   * Replace rows of data within a table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The table to read from.
   * @param {object|object[]} rows A map of names to values of data to insert
   *     into this table.
   *
   * @example
   * const row = {
   *   SingerId: 'Id3',
   *   Name: 'Joe West'
   * };
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Queue this mutation until later calling `commit`.
   *   // Note that a callback is not passed to `replace`.
   *   transaction.replace('Singers', row);
   *
   *   // Commit the transaction.
   *   transaction.commit(function(err) {
   *     if (!err) {
   *       // The row was replaced successfully.
   *     }
   *   });
   * });
   */
  replace(table: string, rows: object|object[]): void {
    this._mutate('replace', table, rows);
  }

  rollback(): Promise<void>;
  rollback(callback: s.RollbackCallback): void;
  /**
   * Roll back a transaction, releasing any locks it holds. It is a good idea to
   * call this for any transaction that includes one or more queries that you
   * decide not to commit.
   *
   * Wrapper around {@link v1.SpannerClient#rollback}.
   *
   * @see {@link v1.SpannerClient#rollback}
   * @see [Rollback API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Rollback)
   *
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
   *
   * @example
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   transaction.rollback(function(err) {
   *     if (!err) {
   *       // Transaction rolled back successfully.
   *     }
   *   });
   * });
   */
  rollback(callback?: s.RollbackCallback): void|Promise<void> {
    if (!this.id) {
      callback!(new Error('Transaction ID is unknown, nothing to rollback.'));
      return;
    }

    const session = this.session.formattedName_!;
    const transactionId = this.id;
    const reqOpts: s.RollbackRequest = {session, transactionId};

    this.request(
        {
          client: 'SpannerClient',
          method: 'rollback',
          reqOpts,
        },
        (err: null|ServiceError) => {
          this.end();
          callback!(err);
        });
  }

  /**
   * Update rows of data within a table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The table to read from.
   * @param {object|object[]} rows A map of names to values of data to insert
   *     into this table.
   *
   * @example
   * const row = {
   *   SingerId: 'Id3',
   *   Name: 'Joe West'
   * };
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Queue this mutation until later calling `commit`.
   *   // Note that a callback is not passed to `update`.
   *   transaction.update('Singers', row);
   *
   *   // Commit the transaction.
   *   transaction.commit(function(err) {
   *     if (!err) {
   *       // The row was updated successfully.
   *     }
   *   });
   * });
   */
  update(table: string, rows: object|object[]): void {
    this._mutate('update', table, rows);
  }

  /**
   * Insert or update rows of data within a table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The table to read from.
   * @param {object|object[]} rows A map of names to values of data to insert
   *     into this table.
   *
   * @example
   * const row = {
   *   SingerId: 'Id3',
   *   Name: 'Joe West'
   * };
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Queue this mutation until later calling `commit`.
   *   // Note that a callback is not passed to `upsert`.
   *   transaction.upsert('Singers', row);
   *
   *   // Commit the transaction.
   *   transaction.commit(function(err) {
   *     if (!err) {
   *       // The row was updated or inserted successfully.
   *     }
   *   });
   * });
   */
  upsert(table: string, rows: object|object[]): void {
    this._mutate('insertOrUpdate', table, rows);
  }

  /**
   * Formats the mutations.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @private
   *
   * @param {string} method CRUD method (insert, update, etc.).
   * @param {string} table Table to perform mutations in.
   * @param {object} rows Hash of key value pairs.
   */
  private _mutate(method: string, table: string, keyVals: object|object[]):
      void {
    const rows: object[] = arrify(keyVals);
    const columns = Transaction.getUniqueKeys(rows);

    const values = rows.map((row, index) => {
      const keys = Object.keys(row);
      const missingColumns = columns.filter(column => !keys.includes(column));

      if (missingColumns.length > 0) {
        throw new Error([
          `Row at index ${
              index} does not contain the correct number of columns.`,
          `Missing columns: ${JSON.stringify(missingColumns)}`,
        ].join('\n\n'));
      }

      const values = columns.map(column => row[column]);
      return codec.convertToListValue(values);
    });

    const mutation: s.Mutation = {
      [method]: {table, columns, values},
    };

    this._queuedMutations.push(mutation);
  }

  /**
   * Takes a list of rows and returns all unique column names.
   *
   * @private
   *
   * @param {object[]} rows The rows.
   * @returns {string[]}
   */
  static getUniqueKeys(rows: object[]): string[] {
    const allKeys: string[] = [];
    rows.forEach(row => allKeys.push(...Object.keys(row)));
    const unique = new Set(allKeys);
    return Array.from(unique).sort();
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Transaction, {
  exclude: [
    'deleteRows',
    'insert',
    'replace',
    'update',
    'upsert',
  ]
});

/**
 * This type of transaction is used to execute a single Partitioned DML
 * statement. Partitioned DML partitions the key space and runs the DML
 * statement over each partition in parallel using separate, internal
 * transactions that commit independently.
 *
 * Chances are you'll never need to create a partitioned dml transaction
 * directly, instead you'll want to use {@link Database#runPartitionedUpdate}.
 *
 * @class
 * @extends Snapshot
 *
 * @see Database#runPartitionedUpdate
 */
export class PartitionedDml extends Dml {
  constructor(session: Session, options = {} as s.PartitionedDml) {
    super(session);
    this._options = {partitionedDml: options};
  }

  runUpdate(query: string|ExecuteSqlRequest): RunUpdatePromise;
  runUpdate(query: string|ExecuteSqlRequest, callback: RunUpdateCallback): void;
  /**
   * Execute a DML statements and get the affected row count. Unlike
   * {@link Transaction#runUpdate} after using this method you should
   * immediately discard this transaction, internally it will invoke
   * {@link PartitionedDml#end}.
   *
   * @see Database#runPartitionedUpdate
   *
   * @param {string|object} query A DML statement or
   *     [`ExecuteSqlRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
   *     object.
   * @param {object} [query.params] A map of parameter name to values.
   * @param {object} [query.types] A map of parameter types.
   * @param {RunUpdateCallback} [callback] Callback function.
   * @returns {Promise<RunUpdateResponse>}
   *
   * @example
   * transaction.runUpdate(query, (err, rowRount) => {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   * });
   */
  runUpdate(query: string|ExecuteSqlRequest, callback?: RunUpdateCallback):
      void|RunUpdatePromise {
    super.runUpdate(query, (err, count) => {
      this.end();
      callback!(err, count);
    });
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(PartitionedDml);
