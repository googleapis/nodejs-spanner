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

const {promisifyAll} = require('@google-cloud/promisify');
const common = require('@google-cloud/common-grpc');
const extend = require('extend');
const gax = require('google-gax');
const is = require('is');
const path = require('path');
const protobuf = require('protobufjs');
const through = require('through2');

const config = require('./v1/spanner_client_config.json').interfaces[
  'google.spanner.v1.Spanner'
];

const codec = require('./codec');
const PartialResultStream = require('./partial-result-stream');
const TransactionRequest = require('./transaction-request');

/**
 * The gRPC `UNKNOWN` error code.
 *
 * @private
 */
const UNKNOWN = 2;

/**
 * the gRPC `DEADLINE_EXCEEDED` error code.
 */
const DEADLINE_EXCEEDED = 4;

/**
 * The gRPC `ABORTED` error code.
 *
 * @private
 */
const ABORTED = 10;

/**
 * Metadata retry info key.
 *
 * @private
 */
const RETRY_INFO_KEY = 'google.rpc.retryinfo-bin';

/**
 * Default timeout for Transactions.
 *
 * @private
 */
const DEFAULT_TRANSACTION_TIMEOUT = config.methods.Commit.timeout_millis;

let protoFilesRoot = new gax.GoogleProtoFilesRoot();
protoFilesRoot = protobuf.loadSync(
  path.join(__dirname, '..', 'protos', 'google/rpc/error_details.proto'),
  protoFilesRoot
);

const RetryInfo = protoFilesRoot.lookup('google.rpc.RetryInfo');

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
 * const {Spanner} = require('@google-cloud/spanner');
 * const spanner = new Spanner();
 *
 * const instance = spanner.instance('my-instance');
 * const database = instance.database('my-database');
 *
 * database.runTransaction(function(err, transaction) {
 *   // The `transaction` object is ready for use.
 * });
 */
class Transaction extends TransactionRequest {
  constructor(session, options) {
    options = extend({}, options);
    super(options);
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

    this.attempts_ = 0;
    this.queuedMutations_ = [];
    this.runFn_ = null;
    this.beginTime_ = null;
    this.timeout_ = DEFAULT_TRANSACTION_TIMEOUT;
    this.ended_ = false;
    if (is.number(options.timeout)) {
      this.timeout_ = options.timeout;
      delete options.timeout;
    }
  }
  /**
   * Begin a new transaction.
   *
   * @private
   *
   * @see [BeginTransaction API Documentation](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.Spanner.BeginTransaction)
   *
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
   *     const apiResponse = data[0];
   *   });
   */
  begin(callback) {
    const self = this;
    let options;
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
    const reqOpts = {
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
        self.attempts_ += 1;
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
  }
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
   * @throws {Error} If transaction has already been ended.
   *
   * @param {CommitCallback} [callback] Callback function.
   * @returns {Promise<CommitPromiseResponse>}
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
  commit(callback) {
    const self = this;
    if (this.ended_) {
      throw new Error('Transaction has already been ended.');
    }
    const reqOpts = {
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
  }
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
   * const {Spanner} = require('@google-cloud/spanner');
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
  end(callback) {
    if (this.ended_) {
      throw new Error('Transaction has already been ended.');
    }
    this.ended_ = true;
    this.queuedMutations_ = [];
    this.runFn_ = null;
    this.attempts_ = 0;
    delete this.id;
    if (is.fn(callback)) {
      callback();
    }
  }
  /**
   * Queue a mutation until {@link Transaction#commit} is called.
   *
   * @private
   *
   * @param {object} mutation Mutation to send when transaction is committed.
   */
  queue_(mutation) {
    this.queuedMutations_.push(mutation);
  }
  /**
   * Make a regular gRPC request to Spanner.
   *
   * @private
   *
   * @param {object} config The request configuration.
   * @param {function} callback The callback function.
   */
  request(config, callback) {
    const self = this;
    config.reqOpts = extend(
      {
        session: this.session.formattedName_,
      },
      config.reqOpts
    );
    this.session.request(config, function(err, resp) {
      if (!self.runFn_ || !err || !self.isRetryableErrorCode_(err.code)) {
        callback(err, resp);
        return;
      }
      if (self.shouldRetry_(err)) {
        self.retry_(Transaction.getRetryDelay_(err, self.attempts_));
        return;
      }
      self.runFn_(Transaction.createDeadlineError_(err));
    });
  }
  /**
   * Make a streaming gRPC request to Spanner.
   *
   * @private
   *
   * @param {object} config The request configuration.
   * @returns {ReadableStream}
   */
  requestStream(config) {
    const self = this;
    config.reqOpts = extend(
      {
        session: this.session.formattedName_,
      },
      config.reqOpts
    );
    const requestStream = this.session.requestStream(config);
    if (!is.fn(self.runFn_)) {
      return requestStream;
    }
    const userStream = through.obj();
    requestStream.on('error', function(err) {
      if (!self.isRetryableErrorCode_(err.code)) {
        userStream.destroy(err);
        return;
      }
      userStream.destroy();
      if (self.shouldRetry_(err)) {
        self.retry_(Transaction.getRetryDelay_(err, self.attempts_));
        return;
      }
      self.runFn_(Transaction.createDeadlineError_(err));
    });
    return requestStream.pipe(userStream);
  }
  /**
   * Retry the transaction by running the original "runFn" after a pre-
   * determined delay.
   *
   * @private
   *
   * @param {number} delay Delay to wait before retrying transaction.
   */
  retry_(delay) {
    const self = this;
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
  }
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
   *   transaction.rollback(function(err) {
   *     if (!err) {
   *       // Transaction rolled back successfully.
   *     }
   *   });
   * });
   */
  rollback(callback) {
    const self = this;
    if (!this.id) {
      throw new Error('Transaction ID is unknown, nothing to rollback.');
    }
    const reqOpts = {
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
  }
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
   * const {Spanner} = require('@google-cloud/spanner');
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
  run(query, callback) {
    const rows = [];
    this.runStream(query)
      .on('error', callback)
      .on('data', function(row) {
        rows.push(row);
      })
      .on('end', function() {
        callback(null, rows);
      });
  }
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
   *
   * @param {string|object} query - A SQL query or
   *     [`ExecuteSqlRequest`](https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest)
   *     object.
   * @param {object} [query.params] A map of parameter name to values.
   * @param {object} [query.types] A map of parameter types.
   * @returns {ReadableStream}
   *
   * @example
   * const {Spanner} = require('@google-cloud/spanner');
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
  runStream(query) {
    const self = this;
    if (is.string(query)) {
      query = {
        sql: query,
      };
    }
    const reqOpts = extend(
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
  }
  /**
   * Determines whether or not this Transaction should be retried in the event
   * of a retryable error.
   *
   * @param {error} err - The request error.
   * @return {boolean}
   */
  shouldRetry_(err) {
    return (
      this.isRetryableErrorCode_(err.code) &&
      is.fn(this.runFn_) &&
      Date.now() - this.beginTime_ < this.timeout_
    );
  }
  /**
   * Specifies whether a specific error code can be retried.
   *
   * @param {number} errCode - the error code
   * @return {boolean}
   */
  isRetryableErrorCode_(errCode) {
    return errCode === ABORTED || errCode === UNKNOWN;
  }
  /**
   * In the event that a Transaction is aborted and the deadline has been
   * exceeded, we'll alter the error from aborted to deadline exceeded.
   *
   * @private
   *
   * @param {error} err The original error.
   * @return {object}
   */
  static createDeadlineError_(err) {
    const apiError = new common.util.ApiError({
      message: 'Deadline for Transaction exceeded.',
      code: DEADLINE_EXCEEDED,
      errors: [err],
    });

    return apiError;
  }
  /**
   * Extracts retry delay and formats into milliseconds.
   *
   * @private
   *
   * @param {error} err A request error.
   * @param {number} attempts Number of attempts made, used for generating
   *     backoff when retry info is absent.
   * @return {number}
   */
  static getRetryDelay_(err, attempts) {
    const retryInfo = err.metadata.get(RETRY_INFO_KEY);

    if (retryInfo && retryInfo.length) {
      const retryDelay = RetryInfo.decode(retryInfo[0]).retryDelay;
      const seconds = parseInt(retryDelay.seconds.toNumber(), 10) * 1000;
      const milliseconds = parseInt(retryDelay.nanos, 10) / 1e6;
      return seconds + milliseconds;
    }

    return Math.pow(2, attempts) * 1000 + Math.floor(Math.random() * 1000);
  }
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(Transaction);

/**
 * Reference to the {@link Transaction} class.
 * @name module:@google-cloud/spanner.Transaction
 * @see Transaction
 */
module.exports = Transaction;
