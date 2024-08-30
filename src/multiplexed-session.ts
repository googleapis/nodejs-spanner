import {google} from '../protos/protos';
import {Database} from './database';
import {Session} from './session';
import {Transaction} from './transaction';

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

export interface MultiplexedSessionInterface {
  createMultiplexedSession(): Promise<void>;
  getMultiplexedSession(callback: GetSessionCallback): void;
}

export interface MultiplexedSessionOptions {
  keepAlive?: number;
  refreshRate?: number;
  databaseRole?: string | null;
  idlesAfter?: number;
  createTime?: google.protobuf.ITimestamp | null;
}

const MULTIPLEXEDSESSIONDEFAULTS: MultiplexedSessionOptions = {
  keepAlive: 30,
  refreshRate: 10,
  databaseRole: null,
  idlesAfter: 10,
};

export class MultiplexedSession {
  database: Database;
  multiplexedSessionOptions: MultiplexedSessionOptions;
  _multiplexedInventory!: MultiplexedSessionInventory;
  _multiplexedSessionLock: Promise<void> | null;
  _pingHandle!: NodeJS.Timer;
  _refreshHandle!: NodeJS.Timer;
  constructor(
    database: Database,
    multiplexedSessionOptions?: MultiplexedSessionOptions
  ) {
    this.database = database;
    this.multiplexedSessionOptions = Object.assign(
      {},
      MULTIPLEXEDSESSIONDEFAULTS,
      multiplexedSessionOptions
    );
    this._multiplexedInventory = {
      multiplexedSession: null,
    };
    this._multiplexedSessionLock = null;
  }

  /*New
   **/
  async createMultiplexedSession(): Promise<void> {
    // this._startHouseKeeping();
    await this._createMultiplexedSessions();
    this._startRefreshingSession();
  }

  _startHouseKeeping(): void {
    const pingRate = this.multiplexedSessionOptions.keepAlive! * 60000;
    this._pingHandle = setInterval(
      () => this._pingMultiplexedSession(),
      pingRate
    );
    this._pingHandle.unref();
  }

  _startRefreshingSession(): void {
    const refreshRate = this.multiplexedSessionOptions.refreshRate! * 60000;
    this._refreshHandle = setInterval(
      () => this._refreshMultiplexedSession(),
      refreshRate
    );
    this._refreshHandle.unref();
  }

  async _refreshMultiplexedSession(): Promise<void> {
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
            this.createMultiplexedSession();
          }
        } else {
          console.warn('Invalid timestamp values.');
        }
      }
    });
  }

  /**
   * Makes a keep alive request to all the idle sessions.
   *
   * @private
   *
   * @returns {Promise}
   */
  async _pingMultiplexedSession(): Promise<void> {
    this.getMultiplexedSession(async (err, session) => {
      await this._ping(session!);
    });
    await this.createMultiplexedSession();
  }

  /**
   * Pings an individual session.
   *
   * @private
   *
   * @param {Session} session The session to ping.
   * @returns {Promise}
   */
  async _ping(session: Session): Promise<void> {
    await session.keepAlive();
  }

  /**
   * Retrieve a multiplexed session.
   *
   * @param {GetSessionCallback} callback The callback function.
   */
  getMultiplexedSession(callback: GetSessionCallback): void {
    this._acquireMultiplexedSession().then(session =>
      callback(null, session, session?.txn)
    );
  }

  async _acquireMultiplexedSession(): Promise<Session | null> {
    const session = await this._getMultiplexedSession();
    return session;
  }

  _borrowMultiplexedSession(multiplexedSession: Session): void {
    this._multiplexedInventory.multiplexedSession = multiplexedSession;
  }

  _borrowFromMultiplexed(): Session | null {
    return this._multiplexedInventory.multiplexedSession;
  }

  _borrowAvailableMultiplexedSession(): Session | null {
    return this._borrowFromMultiplexed();
  }

  async _createMultiplexedSessions(): Promise<void> {
    if (this._multiplexedSessionLock) {
      await this._multiplexedSessionLock;
      return;
    }
    this._multiplexedSessionLock = new Promise(resolve => {
      this.database.createMultiplexedSession({}).then(createSessionResponse => {
        this._multiplexedInventory.multiplexedSession = createSessionResponse[0];
        resolve();
      });
    });
    await this._multiplexedSessionLock;
    this._multiplexedSessionLock = null;
  }

  _hasMultiplexedSessionUsableFor(): boolean {
    return this._multiplexedInventory.multiplexedSession !== null;
  }

  async _getMultiplexedSession(): Promise<Session | null> {
    if (this._hasMultiplexedSessionUsableFor()) {
      return this._borrowAvailableMultiplexedSession();
    }
    await this._createMultiplexedSessions();
    return this._borrowAvailableMultiplexedSession();
  }
}
