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
import {Database} from './database';
import {Session} from './session';
import {GetSessionCallback} from './session-pool';
import {
  ObservabilityOptions,
  getActiveOrNoopSpan,
  setSpanError,
  startTrace,
} from './instrument';

export const MUX_SESSION_AVAILABLE = 'mux-session-available';
export const MUX_SESSION_CREATE_ERROR = 'mux-session-create-error';

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
  // frequency to create new mux session
  refreshRate: number;
  _multiplexedSession: Session | null;
  _refreshHandle!: NodeJS.Timer;
  _observabilityOptions?: ObservabilityOptions;
  constructor(database: Database) {
    super();
    this.database = database;
    // default frequency is 7 days
    this.refreshRate = 7;
    this._multiplexedSession = null;
    this._observabilityOptions = database._observabilityOptions;
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
   * In case of error, an error will get emitted along with the error event.
   *
   * @private
   */
  async _createSession(): Promise<void> {
    const traceConfig = {
      opts: this._observabilityOptions,
      dbName: this.database.formattedName_,
    };
    return startTrace(
      'MultiplexedSession.createSession',
      traceConfig,
      async span => {
        span.addEvent('Requesting a multiplexed session');
        try {
          const [createSessionResponse] = await this.database.createSession({
            multiplexed: true,
          });
          this._multiplexedSession = createSessionResponse;
          span.addEvent(
            `Created multiplexed session ${this._multiplexedSession.id}`
          );
          this.emit(MUX_SESSION_AVAILABLE);
        } catch (e) {
          setSpanError(span, e as Error);
          this.emit(MUX_SESSION_CREATE_ERROR, e);
          throw e;
        } finally {
          span.end();
        }
      }
    );
  }

  /**
   * Maintains the multiplexed session by periodically refreshing it.
   *
   * This method sets up a periodic refresh interval for maintaining the session. The interval duration
   * is determined by the @param refreshRate option, which is provided in days.
   * The default value is 7 days.
   *
   * @throws {Error} If the multiplexed session creation fails in `_createSession`, the error is caught
   * and ignored. This is because the currently active multiplexed session has a 30-day expiry, providing
   * the maintainer with four opportunities (one every 7 days) to refresh the active session.
   *
   * @returns {void} This method does not return any value.
   *
   */
  _maintain(): void {
    const refreshRate = this.refreshRate! * 24 * 60 * 60000;
    this._refreshHandle = setInterval(async () => {
      try {
        await this._createSession();
      } catch (err) {
        return;
      }
    }, refreshRate);
    this._refreshHandle.unref();
  }

  /**
   * Retrieves a session asynchronously and invokes a callback with the session details.
   *
   * @param {GetSessionCallback} callback - The callback to be invoked once the session is acquired or an error occurs.
   *
   * @returns {void} This method does not return any value, as it operates asynchronously and relies on the callback.
   *
   */
  getSession(callback: GetSessionCallback): void {
    this._acquire().then(
      session => callback(null, session, session?.txn),
      callback
    );
  }

  /**
   * Acquires a session asynchronously, and prepares the transaction for the session.
   *
   * Once a session is successfully acquired, it returns the session object (which may be `null` if unsuccessful).
   *
   * @returns {Promise<Session | null>}
   * A Promise that resolves with the acquired session (or `null` if no session is available after retries).
   *
   */
  async _acquire(): Promise<Session | null> {
    const session = await this._getSession();
    // Prepare a transaction for a session
    session!.txn = session!.transaction(
      (session!.parent as Database).queryOptions_
    );
    return session;
  }

  /**
   * Attempts to get a session, waiting for it to become available if necessary.
   *
   * Waits for the `MUX_SESSION_AVAILABLE` event or for the `MUX_SESSION_CREATE_ERROR`
   * to be emitted if the multiplexed session is not yet available. The method listens
   * for these events, and once `mux-session-available` is emitted, it resolves and returns
   * the session.
   *
   * In case of an error, the promise will get rejected and the error will get bubble up to the parent method.
   *
   * @returns {Promise<Session | null>} A promise that resolves with the current multiplexed session if available,
   * or `null` if the session is not available.
   *
   * @private
   *
   */
  async _getSession(): Promise<Session | null> {
    const span = getActiveOrNoopSpan();
    // Check if the multiplexed session is already available
    if (this._multiplexedSession !== null) {
      span.addEvent('Cache hit: has usable multiplexed session');
      return this._multiplexedSession;
    }

    // Define event and promises to wait for the session to become available or for the error
    span.addEvent('Waiting for a multiplexed session to become available');
    let removeAvailableListener: Function;
    let removeErrorListener: Function;
    const promises = [
      new Promise((_, reject) => {
        this.once(MUX_SESSION_CREATE_ERROR, reject);
        removeErrorListener = this.removeListener.bind(
          this,
          MUX_SESSION_CREATE_ERROR,
          reject
        );
      }),
      new Promise(resolve => {
        this.once(MUX_SESSION_AVAILABLE, resolve);
        removeAvailableListener = this.removeListener.bind(
          this,
          MUX_SESSION_AVAILABLE,
          resolve
        );
      }),
    ];

    try {
      await Promise.race(promises);
    } finally {
      removeAvailableListener!();
      removeErrorListener!();
    }
    // Return the multiplexed session after it becomes available
    return this._multiplexedSession;
  }
}
