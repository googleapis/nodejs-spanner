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
import * as extend from 'extend';
import * as is from 'is';

import {codec} from './codec';
import {partialResultStream} from './partial-result-stream';

/**
 * Handle logic for Table/Transaction API operations.
 *
 * **Abstract class extended by {@link Transaction} and {@link Table}.**
 *
 * @class
 * @abstract
 *
 * @param {object} [options] Timestamp options.
 */
class TransactionRequest {
  readOnly: boolean;
  partitioned: boolean;
  options;
  transaction;
  id;
  database;
  constructor(options?) {
    this.readOnly = false;
    this.partitioned = false;

    if (options && !is.empty(options)) {
      options = extend({}, options);

      this.readOnly = !!options.readOnly;
      delete options.readOnly;

      this.partitioned = !!options.partitioned;
      delete options.partitioned;

      this.options = TransactionRequest.formatTimestampOptions_(options);
    }
  }


  /**
   * Read stream request config.
   *
   * @typedef {object} ReadStreamRequestOptions
   * @property {string[]} columns The columns of the table to be returned for each
   *     row matching this query.
   * @property {array} keys The primary keys of the rows in this table to be
   *     yielded. If using a composite key, provide an array within this array.
   *     See the example below.
   * @property {string} [index] The name of an index on the table.
   * @property {number} [limit] The number of rows to yield.
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
   *
   * @param {string} table The table to read from.
   * @param {ReadStreamRequestOptions} query Configuration object. See
   *     [`ReadRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest).
   * @returns {ReadableStream} A readable stream that emits rows.
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   transaction.createReadStream('Singers', {
   *       keys: ['1'],
   *       columns: ['SingerId', 'name']
   *     })
   *     .on('error', function(err) {})
   *     .on('data', function(row) {
   *       // row = [
   *       //   {
   *       //     name: 'SingerId',
   *       //     value: '1'
   *       //   },
   *       //   {
   *       //     name: 'Name',
   *       //     value: 'Eddie Wilson'
   *       //   }
   *       // ]
   *     })
   *     .on('end', function() {
   *       // All results retrieved.
   *     });
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
   * //-
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   transaction.createReadStream('Singers', {
   *       keys: ['1'],
   *       columns: ['SingerId', 'name']
   *     })
   *     .on('error', function(err) {})
   *     .on('data', function(row) {
   *       // row.toJSON() = {
   *       //   SingerId: '1',
   *       //   Name: 'Eddie Wilson'
   *       // }
   *     })
   *     .on('end', function() {
   *       // All results retrieved.
   *     });
   * });
   *
   * //-
   * // Alternatively, set `query.json` to `true`, and this step will be
   * performed
   * // automatically.
   * //-
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   transaction.createReadStream('Singers', {
   *       keys: ['1'],
   *       columns: ['SingerId', 'name'],
   *       json: true,
   *     })
   *     .on('error', function(err) {})
   *     .on('data', function(row) {
   *       // row = {
   *       //   SingerId: '1',
   *       //   Name: 'Eddie Wilson'
   *       // }
   *     })
   *     .on('end', function() {
   *       // All results retrieved.
   *     });
   * });
   *
   * //-
   * // If you anticipate many results, you can end a stream early to prevent
   * // unnecessary processing and API requests.
   * //-
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   transaction.createReadStream('Singers', {
   *       keys: ['1'],
   *       columns: ['SingerId', 'name']
   *     })
   *     .on('data', function(row) {
   *       this.end();
   *     });
   * });
   */
  createReadStream(table, query) {
    const reqOpts = codec.encodeRead(query);
    reqOpts.table = table;
    delete reqOpts.json;
    delete reqOpts.jsonOptions;
    if (this.transaction && this.id) {
      reqOpts.transaction = {
        id: this.id,
      };
    }
    const gaxOptions = query.gaxOptions;
    if (gaxOptions) {
      delete reqOpts.gaxOptions;
    }
    const makeRequest = resumeToken => {
      return this.requestStream({
        client: 'SpannerClient',
        method: 'streamingRead',
        reqOpts: extend(reqOpts, {resumeToken}),
        gaxOpts: gaxOptions,
      });
    };
    return partialResultStream(makeRequest, {
      json: query.json,
      jsonOptions: query.jsonOptions,
    });
  }

  /**
   * This probably should be implemented as an abstract method,
   * but it doesn't appear to be implemented in the Table class
   * which extends it.
   * @param mutation
   */
  queue_(mutation) {
    throw new Error('Not implemented');
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
   * @param {function} [callback] Callback function, should only be supplied for
   *     single use transactions.
   * @returns {Promise}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
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
   */
  deleteRows(table, keys, callback) {
    if (!this.transaction) {
      this.database.runTransaction((err, transaction) => {
        if (err) {
          callback(err);
          return;
        }
        transaction.deleteRows(table, keys);
        transaction.commit(callback);
      });
      return;
    }
    const mutation = {};
    mutation['delete'] = {
      table,
      keySet: {
        keys: arrify(keys).map(key => {
          return {
            values: arrify(key).map(codec.encode),
          };
        }),
      },
    };
    this.queue_(mutation);
  }
  /**
   * Insert rows of data into this table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The name of the table.
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {function} [callback] Callback function, should only be supplied for
   *     single use transactions.
   * @returns {Promise}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
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
   * //-
   * // Multiple rows can be inserted at once.
   * //-
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
  insert(table, keyVals, callback) {
    return this.mutate_('insert', table, keyVals, callback);
  }
  /**
   * Read request config.
   *
   * @typedef {object} ReadRequestOptions
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
   */
  /**
   * @typedef {array} TransactionRequestReadResponse
   * @property {array[]} 0 Rows are returned as an array of object arrays. Each
   *     object has a `name` and `value` property. To get a serialized object,
   *     call `toJSON()`. Optionally, provide an options object to `toJSON()`
   *     specifying `wrapNumbers: true` to protect large integer values outside
   * of the range of JavaScript Number. If set, FLOAT64 values will be returned
   *     as {@link Spanner.Float} objects and INT64 values as @{link
   * Spanner.Int}.
   */
  /**
   * @callback TransactionRequestReadCallback
   * @param {?Error} err Request error, if any.
   * @param {array[]} rows Rows are returned as an array of object arrays. Each
   *     object has a `name` and `value` property. To get a serialized object,
   *     call `toJSON()`. Optionally, provide an options object to `toJSON()`
   *     specifying `wrapNumbers: true` to protect large integer values outside
   * of the range of JavaScript Number. If set, FLOAT64 values will be returned
   *     as {@link Spanner.Float} objects and INT64 values as @{link
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
   * @param {ReadRequestOptions} query Configuration object, describing what to
   *     read from the table.
   * @param {TransactionRequestReadCallback} [callback] Callback function.
   * @returns {Promise<TransactionRequestReadResponse>}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
   * const query = {
   *   keys: ['1'],
   *   columns: ['SingerId', 'name']
   * };
   *
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   transaction.read('Singers', query, function(err, rows) {
   *     if (err) {
   *       // Error handling omitted.
   *     }
   *
   *     const firstRow = rows[0];
   *
   *     // firstRow = [
   *     //   {
   *     //     name: 'SingerId',
   *     //     value: '1'
   *     //   },
   *     //   {
   *     //     name: 'Name',
   *     //     value: 'Eddie Wilson'
   *     //   }
   *     // ]
   *
   *     // End the transaction. Note that no callback is provided.
   *     transaction.end();
   *   });
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
   * //-
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   transaction.read('Singers', query, function(err, rows) {
   *     if (err) {
   *       // Error handling omitted.
   *     }
   *
   *     const firstRow = rows[0];
   *
   *     // firstRow.toJSON() = {
   *     //   SingerId: '1',
   *     //   Name: 'Eddie Wilson'
   *     // }
   *
   *     // End the transaction. Note that no callback is provided.
   *     transaction.end();
   *   });
   * });
   *
   * //-
   * // Alternatively, set `query.json` to `true`, and this step will be
   * performed
   * // automatically.
   * //-
   * database.runTransaction(function(err, transaction) {
   *   if (err) {
   *     // Error handling omitted.
   *   }
   *
   *   query.json = true;
   *
   *   transaction.read('Singers', query, function(err, rows) {
   *     if (err) {
   *       // Error handling omitted.
   *     }
   *
   *     const firstRow = rows[0];
   *
   *     // firstRow = {
   *     //   SingerId: '1',
   *     //   Name: 'Eddie Wilson'
   *     // }
   *
   *     // End the transaction. Note that no callback is provided.
   *     transaction.end();
   *   });
   * });
   */
  read(table, query, callback) {
    const rows: Array<{}> = [];
    this.createReadStream(table, query)
        .on('error', callback)
        .on('data',
            row => {
              rows.push(row);
            })
        .on('end', () => {
          callback(null, rows);
        });
  }
  /**
   * Replace rows of data within a table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The table to read from.
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {function} [callback] Callback function, should only be supplied for
   *     single use transactions.
   * @returns {Promise}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
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
  replace(table, keyVals, callback) {
    return this.mutate_('replace', table, keyVals, callback);
  }
  /**
   * Abstract method, should be overridden in child class.
   *
   * @abstract
   * @private
   */
  request(config, callback) {
    throw new Error('Not Implemented');
  }

  /**
   * Abstract method, should be overridden in child class.
   *
   * @abstract
   * @private
   */
  requestStream(options) {}
  /**
   * Update rows of data within a table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The table to read from.
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {function} [callback] Callback function, should only be supplied for
   *     single use transactions.
   * @returns {Promise}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
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
  update(table, keyVals, callback) {
    return this.mutate_('update', table, keyVals, callback);
  }
  /**
   * Insert or update rows of data within a table.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @param {string} table The table to read from.
   * @param {object|object[]} keyVals A map of names to values of data to insert
   *     into this table.
   * @param {function} [callback] Callback function, should only be supplied for
   *     single use transactions.
   * @returns {Promise}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
   * const spanner = new Spanner();
   *
   * const instance = spanner.instance('my-instance');
   * const database = instance.database('my-database');
   *
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
  upsert(table, keyVals, callback) {
    return this.mutate_('insertOrUpdate', table, keyVals, callback);
  }
  /**
   * Processes the mutations. If a queue is detected it will not make a commit,
   * otherwise it will send mutations in the form of
   * {@link Transaction#commit}.
   *
   * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
   *
   * @private
   *
   * @param {string} method CRUD method (insert, update, etc.).
   * @param {string} table Table to perform mutations in.
   * @param {object} keyVals Hash of key value pairs.
   * @param {function} callback The callback function.
   * @returns {Promise}
   */
  mutate_(method, table, keyVals, callback) {
    if (!this.transaction) {
      this.database.runTransaction((err, transaction) => {
        if (err) {
          callback(err);
          return;
        }
        transaction.mutate_(method, table, keyVals);
        transaction.commit(callback);
      });
      return;
    }
    keyVals = arrify(keyVals);
    const columns = [...new Set([].concat(...keyVals.map(Object.keys)))].sort();
    const values = keyVals.map((keyVal, index) => {
      const keys = Object.keys(keyVal);
      const missingColumns =
          columns.filter(column => keys.indexOf(column) === -1);
      if (missingColumns.length > 0) {
        throw new Error([
          `Row at index ${
              index} does not contain the correct number of columns.`,
          `Missing columns: ${JSON.stringify(missingColumns)}`,
        ].join('\n\n'));
      }
      return {
        values: columns.map(column => {
          const value = keyVal[column];
          return codec.encode(value);
        }),
      };
    });
    const mutation = {
      [method]: {table, columns, values},
    };
    this.queue_(mutation);
  }
  /**
   * Formats timestamp options into proto format.
   *
   * @private
   *
   * @param {object} options The user supplied options.
   * @returns {object}
   */
  static formatTimestampOptions_(options) {
    const formatted = extend({}, options);
    if (options.minReadTimestamp) {
      formatted.minReadTimestamp = toProtoTimestamp(options.minReadTimestamp);
    }
    if (options.readTimestamp) {
      formatted.readTimestamp = toProtoTimestamp(options.readTimestamp);
    }
    if (is.number(options.maxStaleness)) {
      formatted.maxStaleness = {
        seconds: options.maxStaleness,
        nanos: 0,
      };
    }
    if (is.number(options.exactStaleness)) {
      formatted.exactStaleness = {
        seconds: options.exactStaleness,
        nanos: 0,
      };
    }
    return formatted;
    function toProtoTimestamp(date) {
      const seconds = date.getTime() / 1000;
      return {
        seconds: Math.floor(seconds),
        nanos: date.getMilliseconds() * 1e6,
      };
    }
  }
  /**
   * Formats a protobuf Timestamp into a Date object.
   *
   * @private
   *
   * @param {object} value The protobuf timestamp.
   * @returns {date}
   */
  static fromProtoTimestamp_(value) {
    const milliseconds = Math.floor(value.nanos) / 1e6;
    return new Date(Math.floor(value.seconds) * 1000 + milliseconds);
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(TransactionRequest, {
  exclude: ['deleteRows', 'insert', 'replace', 'update', 'upsert'],
});

/**
 * Reference to the {@link TransactionRequest} class.
 * @name module:@google-cloud/spanner.TransactionRequest
 * @see TransactionRequest
 */
export {TransactionRequest};
