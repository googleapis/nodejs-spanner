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
const common = require('@google-cloud/common-grpc');
import * as extend from 'extend';
import * as gax from 'google-gax';
import * as is from 'is';
import * as path from 'path';
import * as protobuf from 'protobufjs';
import * as through from 'through2';
import {codec} from './codec';
import {partialResultStream} from './partial-result-stream';
import {TransactionRequest} from './transaction-request';
import {Metadata} from '@google-cloud/common';
import {Session} from './session';

const config = require('./v1/spanner_client_config.json')
                   .interfaces['google.spanner.v1.Spanner'];

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

const root = new gax.GoogleProtoFilesRoot();
const protoFilesRoot = protobuf.loadSync(
    path.join(__dirname, '..', 'protos', 'google/rpc/error_details.proto'),
    root);

// tslint:disable-next-line variable-name
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
  session: Session;
  seqno: number;
  attempts_: number;
  queuedMutations_: Array<{}>;
  runFn_: Function|null;
  beginTime_: number|null;
  timeout_: number;
  ended_: boolean;
  metadata: Metadata;
  readTimestamp?: {};

  /**
   * The gRPC `UNKNOWN` error code.
   *
   * @private
   */
  static UNKNOWN = 2;

  /**
   * the gRPC `DEADLINE_EXCEEDED` error code.
   */
  static DEADLINE_EXCEEDED = 4;

  /**
   * The gRPC `ABORTED` error code.
   *
   * @private
   */
  static ABORTED = 10;

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
    /**
     * @name Transaction#seqno
     * @type {number}
     * @default 1
     */
    this.seqno = 1;
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
    let options;

    if (this.partitioned) {
      options = {
        partitionedDml: {},
      };
    } else if (!this.readOnly) {
      options = {
        readWrite: {},
      };
    } else {
      options = {
        readOnly: extend(
            {
              returnReadTimestamp: true,
            },
            this.options),
      };
    }
    const reqOpts = {
      options,
    };
    this.request(
        {
          client: 'SpannerClient',
          method: 'beginTransaction',
          reqOpts,
        },
        (err, resp) => {
          if (err) {
            callback(err);
            return;
          }
          this.attempts_ += 1;
          this.ended_ = false;
          this.id = resp.id;
          this.metadata = resp;
          if (resp.readTimestamp) {
            this.readTimestamp =
                TransactionRequest.fromProtoTimestamp_(resp.readTimestamp);
          }
          callback(null, resp);
        });
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
    if (this.ended_) {
      callback(new Error('Transaction has already been ended.'));
      return;
    }
    // tslint:disable-next-line no-any
    const reqOpts: any = {
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
          reqOpts,
        },
        (err, resp) => {
          if (err) {
            callback(err, resp);
            return;
          }

          this.end(() => callback(null, resp));
        });
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
  end(callback?) {
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
    config.reqOpts = extend(
        {
          session: this.session.formattedName_,
        },
        config.reqOpts);
    this.session.request(config, (err, resp) => {
      if (!this.runFn_ || !err || !this.isRetryableErrorCode_(err.code)) {
        callback(err, resp);
        return;
      }
      if (this.shouldRetry_(err)) {
        this.retry_(Transaction.getRetryDelay_(err, this.attempts_));
        return;
      }
      this.runFn_(Transaction.createDeadlineError_(err));
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
    config.reqOpts = extend(
        {
          session: this.session.formattedName_,
        },
        config.reqOpts);
    const requestStream = this.session.requestStream(config);
    if (!is.fn(this.runFn_)) {
      return requestStream;
    }
    const userStream = through.obj();
    requestStream.on('error', err => {
      if (!this.isRetryableErrorCode_(err.code)) {
        userStream.destroy(err);
        return;
      }
      userStream.destroy();
      if (this.shouldRetry_(err)) {
        this.retry_(Transaction.getRetryDelay_(err, this.attempts_));
        return;
      }
      this.runFn_!(Transaction.createDeadlineError_(err));
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
    this.begin(err => {
      if (err) {
        this.runFn_!(err);
        return;
      }
      this.queuedMutations_ = [];
      setTimeout(() => {
        this.runFn_!(null, this);
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
    if (!this.id) {
      callback(new Error('Transaction ID is unknown, nothing to rollback.'));
      return;
    }
    const reqOpts = {
      transactionId: this.id,
    };
    this.request(
        {
          client: 'SpannerClient',
          method: 'rollback',
          reqOpts,
        },
        (err, resp) => {
          if (err) {
            callback(err, resp);
            return;
          }

          this.end(() => callback(null, resp));
        });
  }
  /**
   * Execute a SQL statement on this database inside of a transaction.
   *
   * **Performance Considerations:**
   *
   * This method wraps the streaming method,
   * {@link Transaction#run} for your convenience. All rows will
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
   * // If you need to enforce a specific param type, a types map can be
   * provided.
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
    const rows: Array<{}> = [];
    let stats;

    this.runStream(query)
        .on('error', callback)
        .on('data',
            row => {
              rows.push(row);
            })
        .on('stats',
            s => {
              stats = s;
            })
        .on('end', () => {
          callback(null, rows, stats);
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
    if (is.string(query)) {
      query = {
        sql: query,
      };
    }
    const reqOpts = extend(
        {
          transaction: {},
        },
        codec.encodeQuery(query));
    if (this.id) {
      reqOpts.transaction.id = this.id;
    } else {
      reqOpts.transaction.singleUse = {
        readOnly: this.options || {},
      };
    }
    const makeRequest = resumeToken => {
      return this.requestStream({
        client: 'SpannerClient',
        method: 'executeStreamingSql',
        reqOpts: extend({}, reqOpts, {resumeToken}),
      });
    };
    return partialResultStream(makeRequest);
  }
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
  runUpdate(query, callback) {
    if (is.string(query)) {
      query = {
        sql: query,
      };
    }

    query = extend({seqno: this.seqno++}, query);

    this.run(query, (err, rows, stats) => {
      let rowCount;

      if (stats && stats.rowCount) {
        rowCount = Math.floor(stats[stats.rowCount]);
      }

      callback(err, rowCount);
    });
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
        this.isRetryableErrorCode_(err.code) && is.fn(this.runFn_) &&
        Date.now() - this.beginTime_! < this.timeout_);
  }
  /**
   * Specifies whether a specific error code can be retried.
   *
   * @param {number} errCode - the error code
   * @return {boolean}
   */
  isRetryableErrorCode_(errCode) {
    return errCode === Transaction.ABORTED || errCode === Transaction.UNKNOWN;
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
      code: Transaction.DEADLINE_EXCEEDED,
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
      // tslint:disable-next-line no-any
      const retryDelay = (RetryInfo as any).decode(retryInfo[0]).retryDelay;
      const seconds = Math.floor(retryDelay.seconds.toNumber()) * 1000;
      const milliseconds = Math.floor(retryDelay.nanos) / 1e6;
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
export {Transaction};
