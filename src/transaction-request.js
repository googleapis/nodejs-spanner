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

var arrify = require('arrify');
var common = require('@google-cloud/common');
var extend = require('extend');
var flatten = require('lodash.flatten');
var is = require('is');
var uniq = require('array-uniq');

var codec = require('./codec.js');
var PartialResultStream = require('./partial-result-stream.js');

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
function TransactionRequest(options) {
  this.readOnly = false;

  if (options && !is.empty(options)) {
    options = extend({}, options);

    this.readOnly = !!options.readOnly;
    delete options.readOnly;

    this.options = TransactionRequest.formatTimestampOptions_(options);
  }
}

/**
 * Formats timestamp options into proto format.
 *
 * @private
 *
 * @param {object} options The user supplied options.
 * @return {object}
 */
TransactionRequest.formatTimestampOptions_ = function(options) {
  var formatted = extend({}, options);

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
    var seconds = date.getTime() / 1000;

    return {
      seconds: Math.floor(seconds),
      nanos: date.getMilliseconds() * 1e6,
    };
  }
};

/**
 * Formats a protobuf Timestamp into a Date object.
 *
 * @private
 *
 * @param {object} value The protobuf timestamp.
 * @return {date}
 */
TransactionRequest.fromProtoTimestamp_ = function(value) {
  var milliseconds = parseInt(value.nanos, 10) / 1e6;
  return new Date(parseInt(value.seconds, 10) * 1000 + milliseconds);
};

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
 * @param {string} table The table to read from.
 * @param {ReadStreamRequestOptions} query Configuration object. See
 *     [`ReadRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ReadRequest).
 * @returns {ReadableStream} A readable stream that emits rows.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
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
TransactionRequest.prototype.createReadStream = function(table, query) {
  var self = this;

  if (is.array(query) || is.string(query)) {
    query = {
      keys: query,
    };
  }

  var reqOpts = extend(
    {
      table: table,
    },
    query
  );

  if (this.transaction && this.id) {
    reqOpts.transaction = {
      id: this.id,
    };
  }

  if (query.keys || query.ranges) {
    reqOpts.keySet = {};
  }

  if (query.keys) {
    reqOpts.keySet.keys = arrify(query.keys).map(function(key) {
      return {
        values: arrify(key).map(codec.encode),
      };
    });
    delete reqOpts.keys;
  }

  if (query.ranges) {
    reqOpts.keySet.ranges = arrify(query.ranges).map(function(rawRange) {
      var range = extend({}, rawRange);

      for (var bound in range) {
        range[bound] = {
          values: arrify(range[bound]).map(codec.encode),
        };
      }

      return range;
    });
    delete reqOpts.ranges;
  }

  var gaxOptions = query.gaxOptions;

  if (gaxOptions) {
    delete reqOpts.gaxOptions;
  }

  function makeRequest(resumeToken) {
    return self.requestStream({
      client: 'SpannerClient',
      method: 'streamingRead',
      reqOpts: extend(reqOpts, {resumeToken: resumeToken}),
      gaxOpts: gaxOptions,
    });
  }

  return new PartialResultStream(makeRequest);
};

/**
 * Delete rows from a table.
 *
 * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
 *
 * @param {string} table The name of the table.
 * @param {array} keys The keys for the rows to delete. If using a
 *     composite key, provide an array within this array. See the example below.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
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
TransactionRequest.prototype.deleteRows = function(table, keys, callback) {
  var mutation = {};

  mutation['delete'] = {
    table: table,
    keySet: {
      keys: arrify(keys).map(function(key) {
        return {
          values: arrify(key).map(codec.encode),
        };
      }),
    },
  };

  if (this.transaction) {
    this.queue_(mutation);
    return;
  }

  var reqOpts = {
    singleUseTransaction: {
      readWrite: {},
    },
    mutations: [mutation],
  };

  return this.request(
    {
      client: 'SpannerClient',
      method: 'commit',
      reqOpts: reqOpts,
    },
    callback
  );
};

/**
 * Insert rows of data into this table.
 *
 * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
 *
 * @param {string} table The name of the table.
 * @param {object|object[]} keyVals A map of names to values of data to insert
 *     into this table.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
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
TransactionRequest.prototype.insert = function(table, keyVals, callback) {
  return this.mutate_('insert', table, keyVals, callback);
};

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
 */
/**
 * @typedef {array} TransactionRequestReadResponse
 * @property {array[]} 0 Rows are returned as an array of object arrays. Each
 *     object has a `name` and `value` property. To get a serialized object,
 *     call `toJSON()`.
 */
/**
 * @callback TransactionRequestReadCallback
 * @param {?Error} err Request error, if any.
 * @param {array[]} rows Rows are returned as an array of object arrays. Each
 *     object has a `name` and `value` property. To get a serialized object,
 *     call `toJSON()`.
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
 * const Spanner = require('@google-cloud/spanner');
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
 *     const row1 = rows[0];
 *
 *     // row1 = [
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
 *     const row1 = rows[0];
 *
 *     // row1.toJSON() = {
 *     //   SingerId: '1',
 *     //   Name: 'Eddie Wilson'
 *     // }
 *
 *     // End the transaction. Note that no callback is provided.
 *     transaction.end();
 *   });
 * });
 */
TransactionRequest.prototype.read = function(table, keyVals, callback) {
  var rows = [];

  this.createReadStream(table, keyVals)
    .on('error', callback)
    .on('data', function(row) {
      rows.push(row);
    })
    .on('end', function() {
      callback(null, rows);
    });
};

/**
 * Replace rows of data within a table.
 *
 * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
 *
 * @param {string} table The table to read from.
 * @param {object|object[]} keyVals A map of names to values of data to insert
 *     into this table.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
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
TransactionRequest.prototype.replace = function(table, keyVals, callback) {
  return this.mutate_('replace', table, keyVals, callback);
};

/**
 * Abstract method, should be overridden in child class.
 *
 * @abstract
 * @private
 */
TransactionRequest.prototype.request = function() {};

/**
 * Abstract method, should be overridden in child class.
 *
 * @abstract
 * @private
 */
TransactionRequest.prototype.requestStream = function() {};

/**
 * Update rows of data within a table.
 *
 * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
 *
 * @param {string} table The table to read from.
 * @param {object|object[]} keyVals A map of names to values of data to insert
 *     into this table.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
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
TransactionRequest.prototype.update = function(table, keyVals, callback) {
  return this.mutate_('update', table, keyVals, callback);
};

/**
 * Insert or update rows of data within a table.
 *
 * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
 *
 * @param {string} table The table to read from.
 * @param {object|object[]} keyVals A map of names to values of data to insert
 *     into this table.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
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
TransactionRequest.prototype.upsert = function(table, keyVals, callback) {
  return this.mutate_('insertOrUpdate', table, keyVals, callback);
};

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
 * @param {function} cb The callback function.
 */
TransactionRequest.prototype.mutate_ = function(method, table, keyVals, cb) {
  keyVals = arrify(keyVals);

  var columns = uniq(flatten(keyVals.map(Object.keys))).sort();

  var values = keyVals.map(function(keyVal, index) {
    var keys = Object.keys(keyVal);

    var missingColumns = columns.filter(column => keys.indexOf(column) === -1);

    if (missingColumns.length > 0) {
      throw new Error(
        [
          `Row at index ${index} does not contain the correct number of columns.`,
          `Missing columns: ${JSON.stringify(missingColumns)}`,
        ].join('\n\n')
      );
    }

    return {
      values: columns.map(function(column) {
        var value = keyVal[column];
        return codec.encode(value);
      }),
    };
  });

  var mutation = {
    [method]: {table, columns, values},
  };

  if (this.transaction) {
    this.queue_(mutation);
    return;
  }

  var reqOpts = {
    singleUseTransaction: {
      readWrite: {},
    },
    mutations: [mutation],
  };

  return this.request(
    {
      client: 'SpannerClient',
      method: 'commit',
      reqOpts: reqOpts,
    },
    cb
  );
};

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
common.util.promisifyAll(TransactionRequest);

/**
 * Reference to the {@link TransactionRequest} class.
 * @name module:@google-cloud/spanner.TransactionRequest
 * @see TransactionRequest
 */
module.exports = TransactionRequest;
