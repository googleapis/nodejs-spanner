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

import {promisifyAll} from '@google-cloud/promisify';
import * as is from 'is';
import {ServiceError} from 'grpc';
import * as through from 'through2';

import {ReadRequest, Json} from './codec';
import {Database} from './database';
import {DatabaseAdminClient as d, SpannerClient as s} from './v1';
import {PartialResultStream, Row} from './partial-result-stream';
import {TransactionOptions} from './transaction';

type Key = string|string[];
type KeyVals = Json|Json[];
type Schema = string|string[]|{statements: string[], operationId?: string};

type CommitPromise = Promise<[s.CommitResponse]>;
type CreateTablePromise = Promise<[Table, d.Operation, d.GrpcOperation]>;
type DropTablePromise = Promise<[d.Operation, d.GrpcOperation]>;
type ReadPromise = Promise<[Array<Row|Json>]>;

interface CreateTableCallback {
  (err: null|ServiceError, table: Table, operation: d.Operation,
   apiResponse: d.GrpcOperation): void;
}

interface DropTableCallback {
  (err: null|ServiceError, operation: d.Operation,
   apiResponse: d.GrpcOperation): void;
}

interface ReadCallback {
  (err: null|ServiceError, rows: Array<Row|Json>): void;
}

/**
 * Create a Table object to interact with a table in a Cloud Spanner
 * database.
 *
 * @class
 *
 * @param {Database} database {@link Database} instance.
 * @param {string} name Name of the table.
 *
 * @example
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 * const table = database.table('my-table');
 */
class Table {
  database: Database;
  name: string;
  constructor(database: Database, name: string) {
    /**
     * The {@link Database} instance of this {@link Table} instance.
     * @name Table#database
     * @type {Database}
     */
    this.database = database;
    /**
     * The name of this table.
     * @name Table#name
     * @type {string}
     */
    this.name = name;
  }
  /**
   * Create a table.
   *
   * @param {string} schema See {@link Database#createTable}.
   * @param {CreateTableCallback} [callback] Callback function.
   * @returns {Promise<CreateTableResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * const schema =
   *   'CREATE TABLE Singers (' +
   *   '  SingerId INT64 NOT NULL,' +
   *   '  FirstName STRING(1024),' +
   *   '  LastName STRING(1024),' +
   *   '  SingerInfo BYTES(MAX),' +
   *   ') PRIMARY KEY(SingerId)';
   *
   * table.create(schema, function(err, table, operation, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   operation
   *     .on('error', function(err) {})
   *     .on('complete', function() {
   *       // Table created successfully.
   *     });
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.create(schema)
   *   .then(function(data) {
   *     const table = data[0];
   *     const operation = data[1];
   *
   *     return operation.promise();
   *   })
   *   .then(function() {
   *     // Table created successfully.
   *   });
   */
  create(schema: Schema): CreateTablePromise;
  create(schema: Schema, callback: CreateTableCallback): void;
  create(schema: Schema, callback?: CreateTableCallback): CreateTablePromise|
      void {
    this.database.createTable(schema, callback!);
  }
  /**
   * Create a readable object stream to receive rows from the database using key
   * lookups and scans.
   *
   * @see [StreamingRead API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.StreamingRead)
   * @see [ReadRequest API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest)
   *
   * @param {ReadRequest} query Configuration object. See
   *     [`ReadRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest).
   * @param {TransactionOptions} [options] [Transaction options](https://cloud.google.com/spanner/docs/timestamp-bounds).
   * @returns {ReadableStream}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * table.createReadStream({
   *     keys: ['1'],
   *     columns: ['SingerId', 'name']
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
   * //-
   * // Provide an array for `query.keys` to read with a composite key.
   * //-
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
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * table.createReadStream({
   *     keys: ['1'],
   *     columns: ['SingerId', 'name']
   *   })
   *   .on('data', function(row) {
   *     this.end();
   *   });
   */
  createReadStream(request: ReadRequest, options?: TransactionOptions):
      PartialResultStream {
    const proxyStream = through.obj();

    this.database.runTransaction(options, (err, transaction) => {
      if (err) {
        proxyStream.destroy(err);
        return;
      }

      transaction.createReadStream(this.name, request)
          .on('error',
              err => {
                proxyStream.destroy(err);
                transaction.end();
              })
          .on('end', () => transaction.end())
          .pipe(proxyStream);
    });

    return proxyStream as PartialResultStream;
  }
  /**
   * Delete the table. Not to be confused with {@link Table#deleteRows}.
   *
   * Wrapper around {@link Database#updateSchema}.
   *
   * @see {@link Database#updateSchema}
   *
   * @throws {TypeError} If any arguments are passed in.
   * @param {LongRunningOperationCallback} [callback] Callback function.
   * @returns {Promise<LongRunningOperationResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * table.delete(function(err, operation, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   operation
   *     .on('error', function(err) {})
   *     .on('complete', function() {
   *       // Table deleted successfully.
   *     });
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.delete()
   *   .then(function(data) {
   *     const operation = data[0];
   *     return operation.promise();
   *   })
   *   .then(function() {
   *     // Table deleted successfully.
   *   });
   */
  delete(): DropTablePromise;
  delete(callback: DropTableCallback): void;
  delete(callback?: DropTableCallback): DropTablePromise|void {
    if (callback && !is.fn(callback)) {
      throw new TypeError(
          'Unexpected argument, please see Table#deleteRows to delete rows.');
    }

    return this.database.updateSchema(
        'DROP TABLE `' + this.name + '`', callback!);
  }
  /**
   * Delete rows from this table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {array} keys The keys for the rows to delete. If using a
   *     composite key, provide an array within this array. See the example
   * below.
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * const keys = ['Id1', 'Id2', 'Id3'];
   *
   * table.deleteRows(keys, function(err, apiResponse) {});
   *
   * //-
   * // Provide an array for `keys` to delete rows with a composite key.
   * //-
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
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.deleteRows(keys)
   *   .then(function(data) {
   *     const apiResponse = data[0];
   *   });
   */
  deleteRows(keys: Key[]): CommitPromise;
  deleteRows(keys: Key[], callback: s.CommitCallback): void;
  deleteRows(keys: Key[], callback?: s.CommitCallback): CommitPromise|void {
    this.database.runTransaction(null, (err, transaction) => {
      if (err) {
        callback!(err);
        return;
      }

      transaction.deleteRows(this.name, keys);
      transaction.commit(callback!);
    });
  }
  /**
   * Drop the table.
   *
   * @see {@link Table#delete}
   * @see {@link Database#updateSchema}
   *
   * @param {LongRunningOperationCallback} [callback] Callback function.
   * @returns {Promise<LongRunningOperationResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * table.drop(function(err, operation, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   operation
   *     .on('error', function(err) {})
   *     .on('complete', function() {
   *       // Table dropped successfully.
   *     });
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.drop()
   *   .then(function(data) {
   *     const operation = data[0];
   *     return operation.promise();
   *   })
   *   .then(function() {
   *     // Table dropped successfully.
   *   });
   */
  drop(): DropTablePromise;
  drop(callback: DropTableCallback): void;
  drop(callback?: DropTableCallback): DropTablePromise|void {
    return this.delete(callback!);
  }
  /**
   * Insert rows of data into this table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * const row = {
   *   SingerId: 'Id3',
   *   Name: 'Eddie Wilson'
   * };
   *
   * table.insert(row, function(err, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Rows inserted successfully.
   * });
   *
   * //-
   * // Multiple rows can be inserted at once.
   * //-
   * const row2 = {
   *   SingerId: 'Id3b',
   *   Name: 'Joe West'
   * };
   *
   * table.insert([
   *   row,
   *   row2
   * ], function(err, apiResponse) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.insert(row)
   *   .then(function(data) {
   *     const apiResponse = data[0];
   *   });
   *
   * @example <caption>include:samples/crud.js</caption>
   * region_tag:spanner_insert_data
   * Full example:
   */
  insert(keyVals: KeyVals): CommitPromise;
  insert(keyVals: KeyVals, callback: s.CommitCallback): void;
  insert(keyVals: KeyVals, callback?: s.CommitCallback): CommitPromise|void {
    this._mutate('insert', keyVals, callback!);
  }
  /**
   * Configuration object, describing what to read from the table.
   *
   * @typedef {object} TableReadRequestOptions
   * @property {string[]} columns The columns of the table to be returned for each
   *     row matching this query.
   * @property {array} keys The primary keys of the rows in this table to be
   *     yielded. If using a composite key, provide an array within this array.
   *     See the example below.
   * @property {string} [index] The name of an index on the table.
   * @property {boolean} [json=false] Receive the rows as serialized objects. This
   *     is the equivalent of calling `toJSON()` on each row.
   * @property {object} [jsonOptions] Configuration options for the serialized
   *     objects.
   * @property {boolean} [jsonOptions.wrapNumbers=false] Protect large integer
   *     values outside of the range of JavaScript Number.
   * @property {object} [keySet] Defines a collection of keys and/or key ranges to
   *     read.
   * @property {number} [limit] The number of rows to yield.
   */
  /**
   * @typedef {array} TableReadResponse
   * @property {array[]} 1 Rows are returned as an array of object arrays. Each
   *     object has a `name` and `value` property. To get a serialized object,
   *     call `toJSON()`. Optionally, provide an options object to `toJSON()`
   *     specifying `wrapNumbers: true` to protect large integer values outside
   * of the range of JavaScript Number. If set, FLOAT64 values will be returned
   *     as {@link Spanner.Float} objects and INT64 values as {@link
   * Spanner.Int}.
   */
  /**
   * @callback TableReadCallback
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
   * Receive rows from the database using key lookups and scans.
   *
   * **Performance Considerations:**
   *
   * This method wraps the streaming method,
   * {@link Table#createReadStream} for your convenience. All rows will
   * be stored in memory before being released to your callback. If you intend
   * on receiving a lot of results from your query, consider using the streaming
   * method, so you can free each result from memory after consuming it.
   *
   * @param {ReadRequest} query Configuration object, describing
   *     what to read from the table.
   * @param {TransactionOptions} options [Transaction options](https://cloud.google.com/spanner/docs/timestamp-bounds).
   * @param {TableReadCallback} [callback] Callback function.
   * @returns {Promise<TableReadResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * const query = {
   *   keys: ['1'],
   *   columns: ['SingerId', 'name']
   * };
   *
   * table.read(query, function(err, rows) {
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
   * //-
   * // Provide an array for `query.keys` to read with a composite key.
   * //-
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
   * //-
   * // Rows are returned as an array of object arrays. Each object has a `name`
   * // and `value` property. To get a serialized object, call `toJSON()`.
   * //
   * // Alternatively, set `query.json` to `true`, and this step will be
   * performed
   * // automatically.
   * //-
   * table.read(query, function(err, rows) {
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
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.read(query)
   *   .then(function(data) {
   *     const rows = data[0];
   *   });
   *
   * @example <caption>include:samples/crud.js</caption>
   * region_tag:spanner_read_data
   * Full example:
   *
   * @example <caption>include:samples/crud.js</caption>
   * region_tag:spanner_read_stale_data
   * Reading stale data:
   *
   * @example <caption>include:samples/indexing.js</caption>
   * region_tag:spanner_read_data_with_index
   * Reading data using an index:
   *
   * @example <caption>include:samples/indexing.js</caption>
   * region_tag:spanner_read_data_with_storing_index
   * Reading data using a storing index:
   */
  read(request: ReadRequest, options?: TransactionOptions): ReadPromise;
  read(request: ReadRequest, callback: ReadCallback): void;
  read(
      request: ReadRequest, options: TransactionOptions,
      callback: ReadCallback): void;
  read(
      request: ReadRequest, options?: TransactionOptions|ReadCallback,
      callback?: ReadCallback): ReadPromise|void {
    const rows: Array<Row|Json> = [];

    if (is.fn(options)) {
      callback = options as ReadCallback;
      options = {} as TransactionOptions;
    }

    this.createReadStream(request, options as TransactionOptions)
        .on('error', callback!)
        .on('data', (row: Row|Json) => rows.push(row))
        .on('end', () => callback!(null, rows));
  }
  /**
   * Replace rows of data within this table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * const row = {
   *   SingerId: 'Id3',
   *   Name: 'Joe West'
   * };
   *
   * table.replace(row, function(err, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Row replaced successfully.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.replace(row)
   *   .then(function(data) {
   *     const apiResponse = data[0];
   *   });
   */
  replace(keyVals: KeyVals): CommitPromise;
  replace(keyVals: KeyVals, callback: s.CommitCallback): void;
  replace(keyVals: KeyVals, callback?: s.CommitCallback): CommitPromise|void {
    this._mutate('replace', keyVals, callback!);
  }
  /**
   * Update rows of data within this table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * const row = {
   *   SingerId: 'Id3',
   *   Name: 'Joe West'
   * };
   *
   * table.update(row, function(err, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Row updated successfully.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.update(row)
   *   .then(function(data) {
   *     const apiResponse = data[0];
   *   });
   *
   * @example <caption>include:samples/crud.js</caption>
   * region_tag:spanner_update_data
   * Full example:
   */
  update(keyVals: KeyVals): CommitPromise;
  update(keyVals: KeyVals, callback: s.CommitCallback): void;
  update(keyVals: KeyVals, callback?: s.CommitCallback): CommitPromise|void {
    this._mutate('update', keyVals, callback!);
  }
  /**
   * Insert or update rows of data within this table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {BasicCallback} [callback] Callback function.
   * @returns {Promise<BasicResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   * const table = database.table('Singers');
   *
   * const row = {
   *   SingerId: 'Id3',
   *   Name: 'Joe West'
   * };
   *
   * table.update(row, function(err, apiResponse) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   // Row inserted or updated successfully.
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * table.update(row)
   *   .then(function(data) {
   *     const apiResponse = data[0];
   *   });
   */
  upsert(keyVals: KeyVals): CommitPromise;
  upsert(keyVals: KeyVals, callback: s.CommitCallback): void;
  upsert(keyVals: KeyVals, callback?: s.CommitCallback): CommitPromise|void {
    this._mutate('upsert', keyVals, callback!);
  }
  /**
   * Creates a new transaction and applies the desired mutation via
   * {@link Transaction#commit}.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @private
   *
   * @param {string} method CRUD method (insert, update, etc.).
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {function} callback The callback function.
   */
  private _mutate(method: string, keyVals: KeyVals, callback: s.CommitCallback):
      void {
    this.database.runTransaction(null, (err, transaction) => {
      if (err) {
        callback(err);
        return;
      }

      transaction[method](this.name, keyVals);
      transaction.commit(callback);
    });
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Table, {
  exclude: ['delete', 'drop'],
});

/**
 * Reference to the {@link Table} class.
 * @name module:@google-cloud/spanner.Table
 * @see Table
 */
export {Table};
