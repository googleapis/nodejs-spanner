/*!
 * Copyright 2019 Google Inc. All Rights Reserved.
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

import {promisify} from '@google-cloud/promisify';
import {Metadata, ServiceError, status} from 'grpc';
import {join} from 'path';
import {Root} from 'protobufjs';
import * as through from 'through2';

import {Session} from './session';
import {Transaction} from './transaction';

const jsonProtos = require('../protos/protos.json');
const RETRY_INFO = 'google.rpc.retryinfo-bin';

const RETRYABLE: status[] = [status.ABORTED, status.UNKNOWN];

// tslint:disable-next-line variable-name
const RetryInfo = Root.fromJSON(jsonProtos).lookup('google.rpc.RetryInfo');

/**
 * @typedef {object} RunTransactionOptions
 * @property {number} [timeout] The maximum amount of time (in ms) that a
 *     {@link Transaction} should be ran for.
 */
export interface RunTransactionOptions {
  timeout?: number;
}

/**
 * A function to execute in the context of a transaction.
 * @callback RunTransactionCallback
 * @param {?Error} err An error returned while making this request.
 * @param {Transaction} transaction The transaction object. The transaction has
 *     already been created, and is ready to be queried and committed against.
 */
export interface RunTransactionCallback {
  (err: ServiceError | null, transaction?: Transaction | null): void;
}

/**
 * A function to execute in the context of a transaction.
 * @callback AsyncRunTransactionCallback
 * @param {Transaction} transaction The transaction object. The transaction has
 *     already been created, and is ready to be queried and committed against.
 */
export interface AsyncRunTransactionCallback<T> {
  (transaction: Transaction): Promise<T>;
}

interface ErrorCallback {
  (err: ServiceError): void;
}

/**
 * Error class used to signal a Transaction timeout.
 *
 * @private
 * @class
 *
 * @param {Error} [err] The last known retryable Error.
 */
export class DeadlineError extends Error implements ServiceError {
  code: status;
  errors: ServiceError[];
  constructor(error?: ServiceError) {
    super('Deadline for Transaction exceeded.');

    this.code = status.DEADLINE_EXCEEDED;
    this.errors = [];

    if (error) {
      this.errors.push(error);
    }
  }
}

/**
 * Base class for running/retrying Transactions.
 *
 * @private
 * @class
 * @abstract
 *
 * @param {Database} database The Database to pull Sessions/Transactions from.
 * @param {RunTransactionOptions} [options] The runner options.
 */
export abstract class Runner<T> {
  abstract runFn: Function;
  attempts: number;
  session: Session;
  transaction?: Transaction;
  options: RunTransactionOptions;
  constructor(
    session: Session,
    transaction: Transaction,
    options?: RunTransactionOptions
  ) {
    this.attempts = 0;
    this.session = session;
    this.transaction = transaction;

    const defaults = {timeout: 3600000};

    this.options = Object.assign(defaults, options);
  }
  /**
   * Runs the user function against the provided transaction. Resolving the
   * returned Promise upon completion/error.
   *
   * @private
   *
   * @param {Transaction} transaction The transaction to run against.
   * @returns {Promise}
   */
  protected abstract _run(transaction: Transaction): Promise<T>;
  /**
   * Attempts to retrieve the retry delay from the supplied error. If absent it
   * will create one based on the number of attempts made thus far.
   *
   * @private
   *
   * @param {Error} err The service error.
   * @returns {number} Delay in milliseconds.
   */
  getNextDelay(err: ServiceError): number {
    const retryInfo = err.metadata && err.metadata.get(RETRY_INFO);

    if (retryInfo && retryInfo.length) {
      // tslint:disable-next-line no-any
      const {retryDelay} = (RetryInfo as any).decode(retryInfo[0]);
      let {seconds} = retryDelay;

      if (typeof seconds !== 'number') {
        seconds = seconds.toNumber();
      }

      const secondsInMs = Math.floor(seconds) * 1000;
      const nanosInMs = Math.floor(retryDelay.nanos) / 1e6;

      return secondsInMs + nanosInMs;
    }

    return Math.pow(2, this.attempts) * 1000 + Math.floor(Math.random() * 1000);
  }
  /**
   * Retrieves a transaction to run against.
   *
   * @private
   *
   * @returns Promise<Transaction>
   */
  async getTransaction(): Promise<Transaction> {
    if (this.transaction) {
      const transaction = this.transaction;
      delete this.transaction;
      return transaction;
    }

    const transaction = this.session.transaction();
    await transaction.begin();
    return transaction;
  }
  /**
   * This function is responsible for getting transactions, running them and
   * handling any errors, retrying if necessary.
   *
   * @private
   *
   * @returns {Promise}
   */
  async run(): Promise<T> {
    const start = Date.now();
    const timeout = this.options.timeout!;

    let lastError: ServiceError;

    while (Date.now() - start < timeout) {
      const transaction = await this.getTransaction();

      try {
        return await this._run(transaction);
      } catch (e) {
        lastError = e;
      }

      if (!RETRYABLE.includes(lastError.code!)) {
        throw lastError;
      }

      this.attempts += 1;

      const delay = this.getNextDelay(lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new DeadlineError(lastError!);
  }
}

/**
 * This class handles transactions expecting to be ran in callback mode.
 *
 * @private
 * @class
 *
 * @param {Database} database The database to pull sessions/transactions from.
 * @param {RunTransactionCallback} runFn The user supplied run function.
 * @param {RunTransactionOptions} [options] Runner options.
 */
export class TransactionRunner extends Runner<void> {
  runFn: RunTransactionCallback;
  constructor(
    session: Session,
    transaction: Transaction,
    runFn: RunTransactionCallback,
    options?: RunTransactionOptions
  ) {
    super(session, transaction, options);
    this.runFn = runFn;
  }
  /**
   * Because the user has decided to use callback mode, we want to try and
   * intercept any ABORTED or UNKNOWN errors and stop the current function
   * execution.
   *
   * @private
   *
   * @param {Transaction} transaction The transaction to intercept errors for.
   * @param {Function} reject Function to call when a retryable error is found.
   */
  private _interceptErrors(
    transaction: Transaction,
    reject: ErrorCallback
  ): void {
    const request = transaction.request;

    transaction.request = promisify((config: object, callback: Function) => {
      request(config, (err: null | ServiceError, resp: object) => {
        if (!err || !RETRYABLE.includes(err.code!)) {
          callback(err, resp);
          return;
        }

        reject(err);
      });
    });

    const requestStream = transaction.requestStream;

    transaction.requestStream = (config: object) => {
      const proxyStream = through.obj();
      const stream = requestStream(config);

      stream
        .on('error', (err: ServiceError) => {
          if (!RETRYABLE.includes(err.code!)) {
            proxyStream.destroy(err);
            return;
          }

          stream.unpipe(proxyStream);
          reject(err);
        })
        .pipe(proxyStream);

      return proxyStream as typeof stream;
    };
  }
  /**
   * Creates a Promise that should resolve when the provided transaction has
   * been committed or rolled back. Rejects if a retryable error occurs.
   *
   * @private
   *
   * @param {Transaction}
   * @returns {Promise}
   */
  protected _run(transaction: Transaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.once('end', resolve);
      this._interceptErrors(transaction, reject);
      this.runFn(null, transaction);
    });
  }
}

/**
 * This class handles transactions expecting to be ran in promise mode.
 *
 * @private
 * @class
 *
 * @param {Database} database The database to pull sessions/transactions from.
 * @param {AsyncRunTransactionCallback} runFn The user supplied run function.
 * @param {RunTransactionOptions} [options] Runner options.
 */
export class AsyncTransactionRunner<T> extends Runner<T> {
  runFn: AsyncRunTransactionCallback<T>;
  constructor(
    session: Session,
    transaction: Transaction,
    runFn: AsyncRunTransactionCallback<T>,
    options?: RunTransactionOptions
  ) {
    super(session, transaction, options);
    this.runFn = runFn;
  }
  /**
   * Since this is promise mode all we need to do is return the user function.
   *
   * @private
   *
   * @param {Transaction} transaction The transaction to be ran against.
   * @returns {Promise}
   */
  protected _run(transaction: Transaction): Promise<T> {
    return this.runFn(transaction);
  }
}
