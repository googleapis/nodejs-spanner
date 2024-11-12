/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
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

import {EventEmitter} from 'events';
import PQueue from 'p-queue';
import {Database} from './database';
import {Session} from './session';
import {Transaction} from './transaction';
import {
  isDatabaseNotFoundError,
  isInstanceNotFoundError,
  isCreateSessionPermissionError,
  isDefaultCredentialsNotSetError,
  isProjectIdNotSetInEnvironmentError,
} from './session-pool';

interface MuxSession {
  multiplexedSession: Session | null;
}

/**
 * @callback GetSessionCallback
 * @param {?Error} error Request error, if any.
 * @param {Session} session The read-write session.
 * @param {Transaction} transaction The transaction object.
 */
export interface GetSessionCallback {
  (
    err: Error | null,
    session?: Session | null,
    transaction?: Transaction | null
  ): void;
}

/**
 * Interface for implementing multiplexed session logic, it should extend the
 * {@link https://nodejs.org/api/events.html|EventEmitter} class
 *
 * @interface MultiplexedSessionInterface
 * @extends external:{@link https://nodejs.org/api/events.html|EventEmitter}
 *
 * @constructs MultiplexedSessionInterface
 * @param {Database} database The database to create a multiplexed session for.
 */
export interface MultiplexedSessionInterface {
  /**
   * When called creates a multiplexed session.
   *
   * @name MultiplexedSessionInterface#createSession
   */
  createSession(): void;

  /**
   * When called returns a multiplexed session.
   *
   * @name MultiplexedSessionInterface#getSession
   * @param {GetSessionCallback} callback The callback function.
   */
  getSession(callback: GetSessionCallback): void;
}

/**
 * Multiplexed session configuration options.
 *
 * @typedef {object} MultiplexedSessionOptions
 * @property {number} [refreshRate=7] How often to check for expiration of multiplexed session, in
 *     days. Must not be greater than 7 days.
 */

export interface MultiplexedSessionOptions {
  refreshRate?: number;
  databaseRole?: string | null;
}

const DEFAULTS: MultiplexedSessionOptions = {
  refreshRate: 7,
  databaseRole: null,
};

/**
 * Class used to manage connections to Spanner using multiplexed session.
 *
 * **You don't need to use this class directly, connections will be handled for
 * you.**
 *
 * @class
 * @extends {EventEmitter}
 */
export class MultiplexedSession
  extends EventEmitter
  implements MultiplexedSessionInterface
{
  database: Database;
  options: MultiplexedSessionOptions;
  _acquires: PQueue;
  _muxSession!: MuxSession;
  _pingHandle!: NodeJS.Timer;
  _refreshHandle!: NodeJS.Timer;
  constructor(
    database: Database,
    multiplexedSessionOptions?: MultiplexedSessionOptions
  ) {
    super();
    this.database = database;
    this.options = Object.assign({}, DEFAULTS, multiplexedSessionOptions);
    this.options.databaseRole = this.options.databaseRole
      ? this.options.databaseRole
      : database.databaseRole;
    this._muxSession = {
      multiplexedSession: null,
    };
    this._acquires = new PQueue({
      concurrency: 1,
    });
  }

  /**
   * Creates a new multiplexed session and manages its maintenance.
   *
   * This method initiates the session creation process by calling the `_createSession` method, which returns a Promise.
   */
  createSession(): void {
    this._createSession()
      .then(() => {
        this._maintain();
      })
      .catch(err => {
        if (
          isDatabaseNotFoundError(err) ||
          isInstanceNotFoundError(err) ||
          isCreateSessionPermissionError(err) ||
          isDefaultCredentialsNotSetError(err) ||
          isProjectIdNotSetInEnvironmentError(err)
        ) {
          return;
        }
        this.emit('error', err);
      });
  }

  /**
   * Creates a new multiplexed session.
   *
   * This method sends a request to the database to create a new session with multiplexing enabled.
   * The response from the database would be an array, the first value of the array will be containing the multiplexed session.
   *
   * @returns {Promise<void>} A Promise that resolves when the session has been successfully created and assigned, an event
   * `mux-session-available` will be emitted to signal that the session is ready.
   *
   * @private
   */
  async _createSession(): Promise<void> {
    try {
      const [createSessionResponse] = await this.database.createSession({
        multiplexed: true,
      });
      this._muxSession.multiplexedSession = createSessionResponse;
      this.emit('mux-session-available');
    } catch (e) {
      this.emit('error', e);
    }
  }

  /**
   * Maintains the multiplexed session by periodically refreshing it.
   *
   * This method sets up a periodic refresh interval for maintaining the session. The interval duration
   * is determined by the @param refreshRate option, which is provided in minutes.
   * The default value is 7 days.
   *
   * @returns {void} This method does not return any value.
   *
   * @throws {Error} If the `refreshRate` option is not defined, this method could throw an error.
   */
  _maintain(): void {
    const refreshRate = this.options.refreshRate! * 24 * 60 * 60000;
    this._refreshHandle = setInterval(() => this._refresh(), refreshRate);
    this._refreshHandle.unref();
  }

  /**
   * Creates a transaction for a session.
   *
   * @private
   *
   * @param {Session} session The session object.
   * @param {object} options The transaction options.
   */
  _prepareTransaction(session: Session | null): void {
    const transaction = session!.transaction(
      (session!.parent as Database).queryOptions_
    );
    session!.txn = transaction;
  }

  /**
   * Refreshes the session by checking its expiration time and recreating the session if expired.
   * Every 7th day a new Multiplexed Session will get created. However, a Multiplexed Session will
   * be alive for 30 days in the backend.
   *
   * @returns {Promise<void>} A Promise that resolves once the refresh process is completed.
   *                          If the session is expired, a new session will be created.
   *
   * @throws {Error} If there is an issue with retrieving the session metadata or calculating the expiration time.
   */
  async _refresh(): Promise<void> {
    const metadata = await this._muxSession.multiplexedSession?.getMetadata();
    const createTime =
      parseInt(metadata![0].createTime.seconds) * 1000 +
      metadata![0].createTime.nanos / 1000000;

    // Calculate expiration time (7 days after session creation)
    const expireTime = createTime + 7 * 24 * 60 * 60 * 1000;

    // If the current time exceeds the expiration time, create a new session
    if (Date.now() > expireTime) {
      this.createSession();
    }
  }

  /**
   * Retrieves a session asynchronously and invokes a callback with the session details.
   *
   * @param {GetSessionCallback} callback - The callback to be invoked once the session is acquired or an error occurs.
   *
   * @returns {void} This method does not return any value, as it operates asynchronously and relies on the callback.
   *
   * @throws {Error} If the `_acquire()` method fails, an error will be logged, but not thrown explicitly.
   */
  getSession(callback: GetSessionCallback): void {
    this._acquire().then(
      session => callback(null, session, session?.txn),
      callback
    );
  }

  /**
   * Acquires a session asynchronously, with retry logic, and prepares the transaction for the session.
   *
   * Once a session is successfully acquired, it returns the session object (which may be `null` if unsuccessful).
   *
   * @returns {Promise<Session | null>}
   * A Promise that resolves with the acquired session (or `null` if no session is available after retries).
   *
   */
  async _acquire(): Promise<Session | null> {
    const getSession = async (): Promise<Session | null> => {
      const session = await this._getSession();

      if (session) {
        return session;
      }

      return getSession();
    };

    const session = await this._acquires.add(getSession);
    this._prepareTransaction(session);
    return session;
  }

  /**
   * Retrieves the current multiplexed session.
   *
   * Returns the current multiplexed session associated with this instance.
   *
   * @returns {Session | null} The current multiplexed session if available, or `null` if no session is present.
   */
  _multiplexedSession(): Session | null {
    return this._muxSession.multiplexedSession;
  }

  /**
   * Attempts to get a session, waiting for it to become available if necessary.
   *
   * Waits for the `mux-session-available` event to be emitted if the multiplexed session is not yet available.
   * The method listens for these events, and once `mux-session-available` is emitted, it resolves and returns
   * the session.
   *
   * @returns {Promise<Session | null>} A promise that resolves with the current multiplexed session if available,
   * or `null` if the session is not available.
   *
   * @private
   */
  async _getSession(): Promise<Session | null> {
    // Check if the multiplexed session is already available
    if (this._muxSession.multiplexedSession !== null) {
      return this._multiplexedSession();
    }

    // Define event and promises to wait for the session to become available or for an error
    const availableEvent = 'mux-session-available';
    let removeListener: Function;
    const promise = new Promise(resolve => {
      this.once(availableEvent, resolve);
      removeListener = this.removeListener.bind(this, availableEvent, resolve);
    });

    try {
      await promise;
    } finally {
      removeListener!();
    }
    // Return the multiplexed session after it becomes available
    return this._multiplexedSession();
  }
}
