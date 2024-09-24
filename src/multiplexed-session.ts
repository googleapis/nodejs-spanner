import {EventEmitter} from 'events';
import * as is from 'is';
import PQueue from 'p-queue';
import { GoogleError } from 'google-gax';
import {google} from '../protos/protos';
import {Database} from './database';
import {Session} from './session';
import {Transaction} from './transaction';
import {NormalCallback} from './common';

interface MultiplexedSessionInventory {
  multiplexedSession: Session | null;
}

export interface GetSessionCallback {
  (
    err: Error | null,
    session?: Session | null,
    transaction?: Transaction | null
  ): void;
}

/**
 * enum to capture errors that can appear from multiple places
 */
const enum errors {
  Closed = 'Database is closed.',
  Unimplemented = 'No resources available.',
}

export interface MultiplexedSessionInterface {
  createSession(): void;
  getSession(callback: GetSessionCallback): void;
}

export interface MultiplexedSessionOptions {
  refreshRate?: number;
  concurrency?: number;
  databaseRole?: string | null;
}

const DEFAULTS: MultiplexedSessionOptions = {
  refreshRate: 10,
  concurrency: Infinity,
  databaseRole: null,
};

export class MultiplexedSession extends EventEmitter implements MultiplexedSessionInterface {
  database: Database;
  multiplexedSessionOptions: MultiplexedSessionOptions;
  multiplexedSessionPromise: Promise<Session> | undefined;
  _acquires: PQueue;
  _multiplexedInventory!: MultiplexedSessionInventory;
  _pingHandle!: NodeJS.Timer;
  _refreshHandle!: NodeJS.Timer;
  constructor(
    database: Database,
    multiplexedSessionOptions?: MultiplexedSessionOptions
  ) {
    super();
    this.database = database;
    this.multiplexedSessionOptions = Object.assign(
      {},
      DEFAULTS,
      multiplexedSessionOptions
    );
    this._multiplexedInventory = {
      multiplexedSession: null,
    };
    this.multiplexedSessionPromise = undefined;
    this._acquires = new PQueue({
      concurrency: 1,
    });
  }

  createSession(): void {
    this._createSession().then(()=>{
      this._maintain();
      this.emit('session-available');
    }).catch(err => {
      this.emit('error', err);
    });
  }

  _maintain(): void {
    const refreshRate = this.multiplexedSessionOptions.refreshRate! * 60000;
    this._refreshHandle = setInterval(() => this._refresh(), refreshRate);
    this._refreshHandle.unref();
  }

  _prepareTransaction(session: Session | null): void {
    const transaction = session!.transaction(
      (session!.parent as Database).queryOptions_
    );
    session!.txn = transaction;
  }

  async _refresh(): Promise<void> {
    this._multiplexedInventory.multiplexedSession?.getMetadata((err, resp) => {
      if (err) {
        console.error('Error fetching metadata:', err);
        return;
      }

      if (resp?.createTime) {
        const seconds = Number(resp.createTime.seconds) ?? 0;
        const nanos = resp.createTime.nanos ?? 0;
        if (typeof seconds === 'number' && typeof nanos === 'number') {
          const timestampMs = seconds * 1000 + nanos / 1000000;
          const createdDate = new Date(timestampMs);
          const currentDate = new Date(Date.now());
          const differenceInMs = Math.abs(
            currentDate.getTime() - createdDate.getTime()
          );
          const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);
          if (differenceInDays >= 7) {
            this.createSession();
          }
        } else {
          console.warn('Invalid timestamp values.');
        }
      }
    });
  }

  /**
   * Retrieve a multiplexed session.
   *
   * @param {GetSessionCallback} callback The callback function.
   */
  getSession(callback: GetSessionCallback): void {
    this._acquire().then(
      session => callback(null, session, session?.txn),
      callback
    );
  }

  async _acquire(): Promise<Session | null> {

    const getSession = async (): Promise<Session | null> => {

      const session = await this._getSession();

      if(session) {
        return session;
      }

      return getSession();
    };

    const session = await this._acquires.add(getSession);
    this._prepareTransaction(session);
    return session;
  }

  _multiplexedSession(): Session | null{
    return this._multiplexedInventory.multiplexedSession;
  }

  async _createSession(): Promise<void> {
    try {
      const createSessionResponse = await this.database.createSession({multiplexed: true});
      this._multiplexedInventory.multiplexedSession = createSessionResponse[0];
    } catch(err) {
      this.emit('createError', err);
      throw err;
    }
    // this.database.createSession({multiplexed: true}).then(createSessionResponse => {
    //   this._multiplexedInventory.multiplexedSession = createSessionResponse[0];
    // });
  }

  async _getSession(): Promise<Session | null> {
    if (this._multiplexedInventory.multiplexedSession !== null) {
      return this._multiplexedSession();
    }
    const availableEvent = 'session-available';
    let removeOnceCloseListener: Function;
    let removeListener: Function;
    const promises = [
      new Promise((_, reject) => {
        const onceCloseListener = () => reject(new GoogleError(errors.Closed));
        this.once('close', onceCloseListener);
        removeOnceCloseListener = this.removeListener.bind(
          this,
          'close',
          onceCloseListener
        );
      }),
      new Promise(resolve => {
        this.once(availableEvent, resolve);
        removeListener = this.removeListener.bind(
          this,
          availableEvent,
          resolve
        );
      }),
    ];

    let removeErrorListener: Function;
    promises.push(
      new Promise((_, reject) => {
        this.once('createError', reject);
        removeErrorListener = this.removeListener.bind(
          this,
          'createError',
          reject
        );
      })
    );

    try {
      const res = await Promise.race(promises);
      console.log("the response is: ", res);
    } catch(err) {
      console.log("try is catching error");
    } finally {
      removeOnceCloseListener!();
      removeListener!();
      removeErrorListener!();
    }

    return this._multiplexedSession();
  }
}
