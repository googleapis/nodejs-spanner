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

var common = require('@google-cloud/common');
var extend = require('extend');
var gax = require('google-gax');
var is = require('is');
var path = require('path');
var through = require('through2');
var util = require('util');

var config = require('./v1/spanner_client_config.json').interfaces[
  'google.spanner.v1.Spanner'
];

var codec = require('./codec.js');
var PartialResultStream = require('./partial-result-stream.js');
var TransactionRequest = require('./transaction-request.js');

/**
 * The gRPC `ABORTED` error code.
 *
 * @private
 */
var ABORTED = 10;

/**
 * Metadata retry info key.
 *
 * @private
 */
var RETRY_INFO_KEY = 'google.rpc.retryinfo-bin';

/**
 * Default timeout for Transactions.
 *
 * @private
 */
var DEFAULT_TRANSACTION_TIMEOUT = config.methods.Commit.timeout_millis;

var services = gax.grpc().load(
  {
    root: path.resolve(__dirname, '../protos'),
    file: 'google/rpc/error_details.proto',
  },
  'proto',
  {
    binaryAsBase64: true,
    convertFieldsToCamelCase: true,
  }
);

var RetryInfo = services.google.rpc.RetryInfo;

/**
 * Read/write transaction options.
 *
 * @typedef {object} TransactionOptions
 * @property {number} [timeout=3600000] Specify a timeout (in milliseconds) for
 *     the transaction. The transaction will be ran in its entirety, however if
 *     an abort error is returned the transaction will be retried if the timeout
 *     has not been met.
 * @property {boolean} [readOnly=false] Specifies if the transaction is
 *     read-only.
 * @property {number} [exactStaleness] Executes all reads at the timestamp
 *     that is `exactStaleness` old. This is only applicable for read-only
 *     transactions.
 * @property {date} [readTimestamp] Execute all reads at the given timestamp.
 *     This is only applicable for read-only transactions.
 * @property {boolean} [returnTimestamp] If `true`, returns the read timestamp.
 * @property {boolean} [strong] Read at the timestamp where all previously
 *     committed transactions are visible. This is only applicable for read-only
 *     transactions.
 */
/**
 * Use a Transaction object to read and write against your Cloud Spanner
 * database.
 *
 * **This object is created and returned from {@link Database#runTransaction}.**
 *
 * @class
 * @extends TransactionRequest
 *
 * @param {Session} session The parent Session object.
 * @param {TransactionOptions} [options] [Transaction options](https://cloud.google.com/spanner/docs/timestamp-bounds).
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 *
 * database.runTransaction(function(err, transaction) {
 *   // The `transaction` object is ready for use.
 * });
 */
function Transaction(session, options) {
  /**
   * @name Transaction#session
   * @type {Session}
   */
  this.session = session;

  /**
   * @name Transaction#transaction
   * @type {boolean}
   * @default true
   * @private
   */
  this.transaction = true;

  options = extend({}, options);

  this.queuedMutations_ = [];
  this.runFn_ = null;

  this.beginTime_ = null;
  this.timeout_ = DEFAULT_TRANSACTION_TIMEOUT;
  this.ended_ = false;

  if (is.number(options.timeout)) {
    this.timeout_ = options.timeout;
    delete options.timeout;
  }

  TransactionRequest.call(this, options);
}

util.inherits(Transaction, TransactionRequest);

/**
 * In the event that a Transaction is aborted and the deadline has been
 * exceeded, we'll alter the error from aborted to deadline exceeded.
 *
 * @private
 *
 * @param {error} err The original error.
 * @return {object}
 */
Transaction.createDeadlineError_ = function(err) {
  return extend({}, err, {
    code: 4,
    message: 'Deadline for Transaction exceeded.',
  });
};

/**
 * Extracts retry delay and formats into milliseconds.
 *
 * @private
 *
 * @param {error} error A request error.
 * @return {number}
 */
Transaction.getRetryDelay_ = function(err) {
  var retryInfo = err.metadata.get(RETRY_INFO_KEY)[0];
  var retryDelay = RetryInfo.decode(retryInfo).retryDelay;

  var seconds = parseInt(retryDelay.seconds.toNumber(), 10) * 1000;
  var milliseconds = parseInt(retryDelay.nanos, 10) / 1e6;

  return seconds + milliseconds;
};

/**
 * Begin a new transaction.
 *
 * @private
 *
 * @see [BeginTransaction API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.BeginTransaction)
 *
 * @param {object=} options Timestamp bound options.
 * @param {function} callback The callback function.
 * @param {?error} callback.err An error returned while making this request.
 * @param {object} callback.apiResponse The full API response.
 *
 * @example
 * transaction.begin(function(err) {
 *   if (!err) {
 *     // Transaction began successfully.
 *   }
 * });
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * transaction.begin()
 *   .then(function(data) {
 *     var apiResponse = data[0];
 *   });
 */
Transaction.prototype.begin = function(callback) {
  var self = this;
  var options;

  if (!this.readOnly) {
    options = {
      readWrite: {},
    };
  } else {
    options = {
      readOnly: extend(
        {
          returnReadTimestamp: true,
        },
        this.options
      ),
    };
  }

  var reqOpts = {
    options: options,
  };

  this.request(
    {
      client: 'SpannerClient',
      method: 'beginTransaction',
      reqOpts: reqOpts,
    },
    function(err, resp) {
      if (err) {
        callback(err);
        return;
      }

      self.ended_ = false;
      self.id = resp.id;
      self.metadata = resp;

      if (resp.readTimestamp) {
        self.readTimestamp = TransactionRequest.fromProtoTimestamp_(
          resp.readTimestamp
        );
      }

      callback(null, resp);
    }
  );
};

/**
 * Commit the transaction.
 *
 * Wrapper around {@link v1.SpannerClient#commit}.
 *
 * @see {@link v1.SpannerClient#commit}
 * @see [Commit API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.Commit)
 *
 * @throws {Error} If transaction has already been ended.
 *
 * @param {BasicCallback} [callback] Callback function.
 * @returns {Promise<BasicResponse>}
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
 *   // Queue a mutation (note that there is no callback passed to `insert`).
 *   transaction.insert('Singers', {
 *     SingerId: 'Id3b',
 *     Name: 'Joe West'
 *   });
 *
 *   // Commit the transaction.
 *   transaction.commit(function(err) {
 *     if (!err) {
 *       // Mutations were committed successfully.
 *     }
 *   });
 * });
 */
Transaction.prototype.commit = function(callback) {
  var self = this;

  if (this.ended_) {
    throw new Error('Transaction has already been ended.');
  }

  var reqOpts = {
    mutations: this.queuedMutations_,
  };

  if (this.id) {
    reqOpts.transactionId = this.id;
  } else {
    reqOpts.singleUseTransaction = {
      readWrite: {},
    };
  }

  this.request(
    {
      client: 'SpannerClient',
      method: 'commit',
      reqOpts: reqOpts,
    },
    function(err, resp) {
      if (!err) {
        self.end();
      }

      callback(err, resp);
    }
  );
};

/**
 * Let the client know you're done with a particular transaction. This should
 * only be called for read-only transactions.
 *
 * @throws {Error} If transaction has already been ended.
 *
 * @param {function} callback Optional callback function to be called after
 *     transaction has ended.
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 *
 * const options = {
 *   readOnly: true
 * };
 *
 * database.runTransaction(options, function(err, transaction) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   transaction.run('SELECT * FROM Singers', function(err, rows) {
 *     if (err) {
 *       // Error handling omitted.
 *     }
 *
 *     // End the transaction. Note that no callback is provided.
 *     transaction.end();
 *   });
 * });
 */
Transaction.prototype.end = function(callback) {
  if (this.ended_) {
    throw new Error('Transaction has already been ended.');
  }

  this.ended_ = true;
  this.queuedMutations_ = [];
  this.runFn_ = null;

  delete this.id;

  if (is.fn(callback)) {
    callback();
  }
};

/**
 * Queue a mutation until {@link Transaction#commit} is called.
 *
 * @private
 */
Transaction.prototype.queue_ = function(mutation) {
  this.queuedMutations_.push(mutation);
};

/**
 * Make a regular gRPC request to Spanner.
 *
 * @private
 *
 * @param {object} config The request configuration.
 * @param {function} callback The callback function.
 */
Transaction.prototype.request = function(config, callback) {
  var self = this;

  config.reqOpts = extend(
    {
      session: this.session.formattedName_,
    },
    config.reqOpts
  );

  this.session.request(config, function(err, resp) {
    if (!self.runFn_ || !err || err.code !== ABORTED) {
      callback(err, resp);
      return;
    }

    if (self.shouldRetry_(err)) {
      self.retry_(Transaction.getRetryDelay_(err));
      return;
    }

    self.runFn_(Transaction.createDeadlineError_(err));
  });
};

/**
 * Make a streaming gRPC request to Spanner.
 *
 * @private
 *
 * @param {object} config The request configuration.
 * @returns {ReadableStream}
 */
Transaction.prototype.requestStream = function(config) {
  var self = this;

  config.reqOpts = extend(
    {
      session: this.session.formattedName_,
    },
    config.reqOpts
  );

  var requestStream = this.session.requestStream(config);

  if (!is.fn(self.runFn_)) {
    return requestStream;
  }

  var userStream = through.obj();

  requestStream.on('error', function(err) {
    if (err.code !== ABORTED) {
      userStream.destroy(err);
      return;
    }

    userStream.destroy();

    if (self.shouldRetry_(err)) {
      self.retry_(Transaction.getRetryDelay_(err));
      return;
    }

    self.runFn_(Transaction.createDeadlineError_(err));
  });

  return requestStream.pipe(userStream);
};

/**
 * Retry the transaction by running the original "runFn" after a pre-
 * determined delay.
 *
 * @private
 */
Transaction.prototype.retry_ = function(delay) {
  var self = this;

  this.begin(function(err) {
    if (err) {
      self.runFn_(err);
      return;
    }

    self.queuedMutations_ = [];

    setTimeout(function() {
      self.runFn_(null, self);
    }, delay);
  });
};

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
 *   transaction.rollback(function(err) {
 *     if (!err) {
 *       // Transaction rolled back successfully.
 *     }
 *   });
 * });
 */
Transaction.prototype.rollback = function(callback) {
  var self = this;

  if (!this.id) {
    throw new Error('Transaction ID is unknown, nothing to rollback.');
  }

  var reqOpts = {
    transactionId: this.id,
  };

  this.request(
    {
      client: 'SpannerClient',
      method: 'rollback',
      reqOpts: reqOpts,
    },
    function(err, resp) {
      if (!err) {
        self.end();
      }

      callback(err, resp);
    }
  );
};

/**
 * Execute a SQL statement on this database inside of a transaction.
 *
 * **Performance Considerations:**
 *
 * This method wraps the streaming method,
 * {@link Transaction#run} for your convenience. All rows will
 * be stored in memory before being released to your callback. If you intend on
 * receiving a lot of results from your query, consider using the streaming
 * method, so you can free each result from memory after consuming it.
 *
 * Wrapper around {@link v1.SpannerClient#executeStreamingSql}.
 *
 * @see {@link v1.SpannerClient#executeStreamingSql}
 * @see [ExecuteStreamingSql API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.ExecuteStreamingSql)
 * @see [ExecuteSqlRequest API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
 *
 * @param {string|object} query A SQL query or
 *     [`ExecuteSqlRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
 *     object.
 * @param {object} [query.params] A map of parameter name to values.
 * @param {object} [query.types] A map of parameter types.
 * @param {RunCallback} [callback] Callback function.
 * @returns {Promise<RunResponse>}
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 *
 * const query = 'SELECT * FROM Singers';
 *
 * database.runTransaction(function(err, transaction) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   transaction.run(query, function(err, rows) {
 *     if (err) {
 *       // Error handling omitted.
 *     }
 *
 *     // rows = [
 *     //   {
 *     //     SingerId: '1',
 *     //     Name: 'Eddie Wilson'
 *     //   }
 *     // ]
 *   });
 * });
 *
 * //-
 * // The SQL query string can contain parameter placeholders. A parameter
 * // placeholder consists of '@' followed by the parameter name.
 * //-
 * database.runTransaction(function(err, transaction) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   const query = {
 *     sql: 'SELECT * FROM Singers WHERE name = @name',
 *     params: {
 *       name: 'Eddie Wilson'
 *     }
 *   };
 *
 *   transaction.run(query, function(err, rows) {});
 * });
 *
 * //-
 * // If you need to enforce a specific param type, a types map can be provided.
 * // This is typically useful if your param value can be null.
 * //-
 * database.runTransaction(function(err, transaction) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   const query = {
 *     sql: 'SELECT * FROM Singers WHERE name = @name AND id = @id',
 *     params: {
 *       id: spanner.int(8),
 *       name: null
 *     },
 *     types: {
 *       id: 'int64',
 *       name: 'string'
 *     }
 *   };
 *
 *   transaction.run(query, function(err, rows) {});
 * });
 */
Transaction.prototype.run = function(query, callback) {
  var rows = [];

  this.runStream(query)
    .on('error', callback)
    .on('data', function(row) {
      rows.push(row);
    })
    .on('end', function() {
      callback(null, rows);
    });
};

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
 * @param {string|object} query - A SQL query or
 *     [`ExecuteSqlRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
 *     object.
 * @param {object} [query.params] A map of parameter name to values.
 * @param {object} [query.types] A map of parameter types.
 * @returns {ReadableStream}
 *
 * @example
 * const Spanner = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 *
 * const query = 'SELECT * FROM Singers';
 *
 * database.runTransaction(function(err, transaction) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   transaction.runStream(query)
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
 * // The SQL query string can contain parameter placeholders. A parameter
 * // placeholder consists of '@' followed by the parameter name.
 * //-
 * database.runTransaction(function(err, transaction) {
 *   if (err) {
 *     // Error handling omitted.
 *   }
 *
 *   const query = {
 *     sql: 'SELECT * FROM Singers WHERE name = @name',
 *     params: {
 *       name: 'Eddie Wilson'
 *     }
 *   };
 *
 *   transaction.runStream(query)
 *     .on('error', function(err) {})
 *     .on('data', function(row) {})
 *     .on('end', function() {});
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
 *   transaction.runStream(query)
 *     .on('data', function(row) {
 *       this.end();
 *     })
 *     .on('end', function() {});
 * });
 */
Transaction.prototype.runStream = function(query) {
  var self = this;

  if (is.string(query)) {
    query = {
      sql: query,
    };
  }

  var reqOpts = extend(
    {
      transaction: {},
    },
    codec.encodeQuery(query)
  );

  if (this.id) {
    reqOpts.transaction.id = this.id;
  } else {
    reqOpts.transaction.singleUse = {
      readOnly: this.options || {},
    };
  }

  function makeRequest(resumeToken) {
    return self.requestStream({
      client: 'SpannerClient',
      method: 'executeStreamingSql',
      reqOpts: extend({}, reqOpts, {resumeToken: resumeToken}),
    });
  }

  return new PartialResultStream(makeRequest);
};

/**
 * Determines whether or not this Transaction should be retried in the event
 * of an ABORTED error.
 *
 * @param {error} err - The request error.
 * @return {boolean}
 */
Transaction.prototype.shouldRetry_ = function(err) {
  return (
    err.code === ABORTED &&
    is.fn(this.runFn_) &&
    Date.now() - this.beginTime_ < this.timeout_ &&
    err.metadata.get(RETRY_INFO_KEY).length > 0
  );
};

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
common.util.promisifyAll(Transaction);

/**
 * Reference to the {@link Transaction} class.
 * @name module:@google-cloud/spanner.Transaction
 * @see Transaction
 */
module.exports = Transaction;
