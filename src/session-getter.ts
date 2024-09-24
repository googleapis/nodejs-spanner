import { EventEmitter } from "events-intercept";
import { Database, Session, Transaction } from ".";
import { MultiplexedSession, MultiplexedSessionInterface, MultiplexedSessionOptions } from "./multiplexed-session";
import { SessionPool, SessionPoolInterface, SessionPoolOptions } from "./session-pool";
import { MultiplexedSessionConstructor, SessionPoolConstructor } from "./database";

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

export interface GetSessionInterface {
    getSession(callback: GetSessionCallback): void;
}

export class GetSession extends EventEmitter implements GetSessionInterface {
    database: Database;
    multiplexedSession_?: MultiplexedSessionInterface;
    pool_: SessionPoolInterface;
    constructor(
        database: Database,
        poolOptions?: SessionPoolConstructor | SessionPoolOptions,
        multiplexedSessionOptions?: MultiplexedSessionOptions | MultiplexedSessionConstructor
    ) {
        super();
        this.database = database;
        this.pool_ =
        typeof poolOptions === 'function'
            ? new (poolOptions as SessionPoolConstructor)(this.database, null)
            : new SessionPool(this.database, poolOptions);
        this.multiplexedSession_ =
        typeof multiplexedSessionOptions === 'function'
            ? new (multiplexedSessionOptions as MultiplexedSessionConstructor)(this.database)
            : new MultiplexedSession(this.database, multiplexedSessionOptions);
    }
    getSession(callback: GetSessionCallback): void{
        if(process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS==='true') {
            this.multiplexedSession_?.getSession((err, session) => {
                console.log("err: ", err);
                err ? callback(err, null) : callback(null, session);
            })
        } else {
            this.pool_?.getSession((err, session) => {
                console.log("err: ", err);
                err ? callback(err, null) : callback(null, session);
            })
        }
    }
}