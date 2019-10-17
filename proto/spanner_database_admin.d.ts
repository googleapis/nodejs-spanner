import * as $protobuf from "protobufjs";
/** Namespace google. */
export namespace google {

    /** Namespace spanner. */
    namespace spanner {

        /** Namespace admin. */
        namespace admin {

          /** Namespace database. */
          namespace database {

            /** Namespace v1. */
            namespace v1 {

              /** Represents a DatabaseAdmin */
              class DatabaseAdmin extends $protobuf.rpc.Service {

                /**
                 * Constructs a new DatabaseAdmin service.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 */
                constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

                /**
                 * Creates new DatabaseAdmin service using the specified rpc implementation.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 * @returns RPC service. Useful where requests and/or responses are streamed.
                 */
                public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): DatabaseAdmin;

                /**
                 * Calls ListDatabases.
                 * @param request ListDatabasesRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and ListDatabasesResponse
                 */
                public listDatabases(request: google.spanner.admin.database.v1.IListDatabasesRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.ListDatabasesCallback): void;

                /**
                 * Calls ListDatabases.
                 * @param request ListDatabasesRequest message or plain object
                 * @returns Promise
                 */
                public listDatabases(request: google.spanner.admin.database.v1.IListDatabasesRequest): Promise<google.spanner.admin.database.v1.ListDatabasesResponse>;

                /**
                 * Calls CreateDatabase.
                 * @param request CreateDatabaseRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Operation
                 */
                public createDatabase(request: google.spanner.admin.database.v1.ICreateDatabaseRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.CreateDatabaseCallback): void;

                /**
                 * Calls CreateDatabase.
                 * @param request CreateDatabaseRequest message or plain object
                 * @returns Promise
                 */
                public createDatabase(request: google.spanner.admin.database.v1.ICreateDatabaseRequest): Promise<google.longrunning.Operation>;

                /**
                 * Calls GetDatabase.
                 * @param request GetDatabaseRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Database
                 */
                public getDatabase(request: google.spanner.admin.database.v1.IGetDatabaseRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.GetDatabaseCallback): void;

                /**
                 * Calls GetDatabase.
                 * @param request GetDatabaseRequest message or plain object
                 * @returns Promise
                 */
                public getDatabase(request: google.spanner.admin.database.v1.IGetDatabaseRequest): Promise<google.spanner.admin.database.v1.Database>;

                /**
                 * Calls UpdateDatabaseDdl.
                 * @param request UpdateDatabaseDdlRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Operation
                 */
                public updateDatabaseDdl(request: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdlCallback): void;

                /**
                 * Calls UpdateDatabaseDdl.
                 * @param request UpdateDatabaseDdlRequest message or plain object
                 * @returns Promise
                 */
                public updateDatabaseDdl(request: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest): Promise<google.longrunning.Operation>;

                /**
                 * Calls DropDatabase.
                 * @param request DropDatabaseRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Empty
                 */
                public dropDatabase(request: google.spanner.admin.database.v1.IDropDatabaseRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.DropDatabaseCallback): void;

                /**
                 * Calls DropDatabase.
                 * @param request DropDatabaseRequest message or plain object
                 * @returns Promise
                 */
                public dropDatabase(request: google.spanner.admin.database.v1.IDropDatabaseRequest): Promise<google.protobuf.Empty>;

                /**
                 * Calls GetDatabaseDdl.
                 * @param request GetDatabaseDdlRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and GetDatabaseDdlResponse
                 */
                public getDatabaseDdl(request: google.spanner.admin.database.v1.IGetDatabaseDdlRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.GetDatabaseDdlCallback): void;

                /**
                 * Calls GetDatabaseDdl.
                 * @param request GetDatabaseDdlRequest message or plain object
                 * @returns Promise
                 */
                public getDatabaseDdl(request: google.spanner.admin.database.v1.IGetDatabaseDdlRequest): Promise<google.spanner.admin.database.v1.GetDatabaseDdlResponse>;

                /**
                 * Calls SetIamPolicy.
                 * @param request SetIamPolicyRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Policy
                 */
                public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.SetIamPolicyCallback): void;

                /**
                 * Calls SetIamPolicy.
                 * @param request SetIamPolicyRequest message or plain object
                 * @returns Promise
                 */
                public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                /**
                 * Calls GetIamPolicy.
                 * @param request GetIamPolicyRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Policy
                 */
                public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.GetIamPolicyCallback): void;

                /**
                 * Calls GetIamPolicy.
                 * @param request GetIamPolicyRequest message or plain object
                 * @returns Promise
                 */
                public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                /**
                 * Calls TestIamPermissions.
                 * @param request TestIamPermissionsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and TestIamPermissionsResponse
                 */
                public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.TestIamPermissionsCallback): void;

                /**
                 * Calls TestIamPermissions.
                 * @param request TestIamPermissionsRequest message or plain object
                 * @returns Promise
                 */
                public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest): Promise<google.iam.v1.TestIamPermissionsResponse>;

                /**
                 * Calls CreateBackup.
                 * @param request CreateBackupRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Operation
                 */
                public createBackup(request: google.spanner.admin.database.v1.ICreateBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.CreateBackupCallback): void;

                /**
                 * Calls CreateBackup.
                 * @param request CreateBackupRequest message or plain object
                 * @returns Promise
                 */
                public createBackup(request: google.spanner.admin.database.v1.ICreateBackupRequest): Promise<google.longrunning.Operation>;

                /**
                 * Calls GetBackup.
                 * @param request GetBackupRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Backup
                 */
                public getBackup(request: google.spanner.admin.database.v1.IGetBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.GetBackupCallback): void;

                /**
                 * Calls GetBackup.
                 * @param request GetBackupRequest message or plain object
                 * @returns Promise
                 */
                public getBackup(request: google.spanner.admin.database.v1.IGetBackupRequest): Promise<google.spanner.admin.database.v1.Backup>;

                /**
                 * Calls UpdateBackup.
                 * @param request UpdateBackupRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Backup
                 */
                public updateBackup(request: google.spanner.admin.database.v1.IUpdateBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.UpdateBackupCallback): void;

                /**
                 * Calls UpdateBackup.
                 * @param request UpdateBackupRequest message or plain object
                 * @returns Promise
                 */
                public updateBackup(request: google.spanner.admin.database.v1.IUpdateBackupRequest): Promise<google.spanner.admin.database.v1.Backup>;

                /**
                 * Calls DeleteBackup.
                 * @param request DeleteBackupRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Empty
                 */
                public deleteBackup(request: google.spanner.admin.database.v1.IDeleteBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.DeleteBackupCallback): void;

                /**
                 * Calls DeleteBackup.
                 * @param request DeleteBackupRequest message or plain object
                 * @returns Promise
                 */
                public deleteBackup(request: google.spanner.admin.database.v1.IDeleteBackupRequest): Promise<google.protobuf.Empty>;

                /**
                 * Calls ListBackups.
                 * @param request ListBackupsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and ListBackupsResponse
                 */
                public listBackups(request: google.spanner.admin.database.v1.IListBackupsRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.ListBackupsCallback): void;

                /**
                 * Calls ListBackups.
                 * @param request ListBackupsRequest message or plain object
                 * @returns Promise
                 */
                public listBackups(request: google.spanner.admin.database.v1.IListBackupsRequest): Promise<google.spanner.admin.database.v1.ListBackupsResponse>;

                /**
                 * Calls RestoreDatabase.
                 * @param request RestoreDatabaseRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Operation
                 */
                public restoreDatabase(request: google.spanner.admin.database.v1.IRestoreDatabaseRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.RestoreDatabaseCallback): void;

                /**
                 * Calls RestoreDatabase.
                 * @param request RestoreDatabaseRequest message or plain object
                 * @returns Promise
                 */
                public restoreDatabase(request: google.spanner.admin.database.v1.IRestoreDatabaseRequest): Promise<google.longrunning.Operation>;

                /**
                 * Calls ListDatabaseOperations.
                 * @param request ListDatabaseOperationsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and ListDatabaseOperationsResponse
                 */
                public listDatabaseOperations(request: google.spanner.admin.database.v1.IListDatabaseOperationsRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.ListDatabaseOperationsCallback): void;

                /**
                 * Calls ListDatabaseOperations.
                 * @param request ListDatabaseOperationsRequest message or plain object
                 * @returns Promise
                 */
                public listDatabaseOperations(request: google.spanner.admin.database.v1.IListDatabaseOperationsRequest): Promise<google.spanner.admin.database.v1.ListDatabaseOperationsResponse>;

                /**
                 * Calls ListBackupOperations.
                 * @param request ListBackupOperationsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and ListBackupOperationsResponse
                 */
                public listBackupOperations(request: google.spanner.admin.database.v1.IListBackupOperationsRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.ListBackupOperationsCallback): void;

                /**
                 * Calls ListBackupOperations.
                 * @param request ListBackupOperationsRequest message or plain object
                 * @returns Promise
                 */
                public listBackupOperations(request: google.spanner.admin.database.v1.IListBackupOperationsRequest): Promise<google.spanner.admin.database.v1.ListBackupOperationsResponse>;
              }

              namespace DatabaseAdmin {

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#listDatabases}.
                 * @param error Error, if any
                 * @param [response] ListDatabasesResponse
                 */
                type ListDatabasesCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.ListDatabasesResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#createDatabase}.
                 * @param error Error, if any
                 * @param [response] Operation
                 */
                type CreateDatabaseCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#getDatabase}.
                 * @param error Error, if any
                 * @param [response] Database
                 */
                type GetDatabaseCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.Database) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#updateDatabaseDdl}.
                 * @param error Error, if any
                 * @param [response] Operation
                 */
                type UpdateDatabaseDdlCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#dropDatabase}.
                 * @param error Error, if any
                 * @param [response] Empty
                 */
                type DropDatabaseCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#getDatabaseDdl}.
                 * @param error Error, if any
                 * @param [response] GetDatabaseDdlResponse
                 */
                type GetDatabaseDdlCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.GetDatabaseDdlResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#setIamPolicy}.
                 * @param error Error, if any
                 * @param [response] Policy
                 */
                type SetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#getIamPolicy}.
                 * @param error Error, if any
                 * @param [response] Policy
                 */
                type GetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#testIamPermissions}.
                 * @param error Error, if any
                 * @param [response] TestIamPermissionsResponse
                 */
                type TestIamPermissionsCallback = (error: (Error|null), response?: google.iam.v1.TestIamPermissionsResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#createBackup}.
                 * @param error Error, if any
                 * @param [response] Operation
                 */
                type CreateBackupCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#getBackup}.
                 * @param error Error, if any
                 * @param [response] Backup
                 */
                type GetBackupCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.Backup) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#updateBackup}.
                 * @param error Error, if any
                 * @param [response] Backup
                 */
                type UpdateBackupCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.Backup) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#deleteBackup}.
                 * @param error Error, if any
                 * @param [response] Empty
                 */
                type DeleteBackupCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#listBackups}.
                 * @param error Error, if any
                 * @param [response] ListBackupsResponse
                 */
                type ListBackupsCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.ListBackupsResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#restoreDatabase}.
                 * @param error Error, if any
                 * @param [response] Operation
                 */
                type RestoreDatabaseCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#listDatabaseOperations}.
                 * @param error Error, if any
                 * @param [response] ListDatabaseOperationsResponse
                 */
                type ListDatabaseOperationsCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.ListDatabaseOperationsResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#listBackupOperations}.
                 * @param error Error, if any
                 * @param [response] ListBackupOperationsResponse
                 */
                type ListBackupOperationsCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.ListBackupOperationsResponse) => void;
              }

              /** Properties of a RestoreInfo. */
              interface IRestoreInfo {

                /** RestoreInfo sourceType */
                sourceType?: (google.spanner.admin.database.v1.RestoreSourceType|null);

                /** RestoreInfo backupInfo */
                backupInfo?: (google.spanner.admin.database.v1.IBackupInfo|null);
              }

              /** Represents a RestoreInfo. */
              class RestoreInfo implements IRestoreInfo {

                /**
                 * Constructs a new RestoreInfo.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IRestoreInfo);

                /** RestoreInfo sourceType. */
                public sourceType: google.spanner.admin.database.v1.RestoreSourceType;

                /** RestoreInfo backupInfo. */
                public backupInfo?: (google.spanner.admin.database.v1.IBackupInfo|null);

                /** RestoreInfo sourceInfo. */
                public sourceInfo?: "backupInfo";

                /**
                 * Creates a new RestoreInfo instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns RestoreInfo instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IRestoreInfo): google.spanner.admin.database.v1.RestoreInfo;

                /**
                 * Encodes the specified RestoreInfo message. Does not implicitly {@link google.spanner.admin.database.v1.RestoreInfo.verify|verify} messages.
                 * @param message RestoreInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IRestoreInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified RestoreInfo message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.RestoreInfo.verify|verify} messages.
                 * @param message RestoreInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IRestoreInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a RestoreInfo message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns RestoreInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.RestoreInfo;

                /**
                 * Decodes a RestoreInfo message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns RestoreInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.RestoreInfo;

                /**
                 * Verifies a RestoreInfo message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a RestoreInfo message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns RestoreInfo
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.RestoreInfo;

                /**
                 * Creates a plain object from a RestoreInfo message. Also converts values to other types if specified.
                 * @param message RestoreInfo
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.RestoreInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this RestoreInfo to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a Database. */
              interface IDatabase {

                /** Database name */
                name?: (string|null);

                /** Database state */
                state?: (google.spanner.admin.database.v1.Database.State|null);

                /** Database createTime */
                createTime?: (google.protobuf.ITimestamp|null);

                /** Database restoreInfo */
                restoreInfo?: (google.spanner.admin.database.v1.IRestoreInfo|null);
              }

              /** Represents a Database. */
              class Database implements IDatabase {

                /**
                 * Constructs a new Database.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IDatabase);

                /** Database name. */
                public name: string;

                /** Database state. */
                public state: google.spanner.admin.database.v1.Database.State;

                /** Database createTime. */
                public createTime?: (google.protobuf.ITimestamp|null);

                /** Database restoreInfo. */
                public restoreInfo?: (google.spanner.admin.database.v1.IRestoreInfo|null);

                /**
                 * Creates a new Database instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Database instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IDatabase): google.spanner.admin.database.v1.Database;

                /**
                 * Encodes the specified Database message. Does not implicitly {@link google.spanner.admin.database.v1.Database.verify|verify} messages.
                 * @param message Database message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IDatabase, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Database message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.Database.verify|verify} messages.
                 * @param message Database message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IDatabase, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Database message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Database
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.Database;

                /**
                 * Decodes a Database message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Database
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.Database;

                /**
                 * Verifies a Database message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Database message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Database
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.Database;

                /**
                 * Creates a plain object from a Database message. Also converts values to other types if specified.
                 * @param message Database
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.Database, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Database to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              namespace Database {

                /** State enum. */
                enum State {
                  STATE_UNSPECIFIED = 0,
                  CREATING = 1,
                  READY = 2,
                  READY_OPTIMIZING = 3
                }
              }

              /** Properties of a ListDatabasesRequest. */
              interface IListDatabasesRequest {

                /** ListDatabasesRequest parent */
                parent?: (string|null);

                /** ListDatabasesRequest pageSize */
                pageSize?: (number|null);

                /** ListDatabasesRequest pageToken */
                pageToken?: (string|null);
              }

              /** Represents a ListDatabasesRequest. */
              class ListDatabasesRequest implements IListDatabasesRequest {

                /**
                 * Constructs a new ListDatabasesRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IListDatabasesRequest);

                /** ListDatabasesRequest parent. */
                public parent: string;

                /** ListDatabasesRequest pageSize. */
                public pageSize: number;

                /** ListDatabasesRequest pageToken. */
                public pageToken: string;

                /**
                 * Creates a new ListDatabasesRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListDatabasesRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IListDatabasesRequest): google.spanner.admin.database.v1.ListDatabasesRequest;

                /**
                 * Encodes the specified ListDatabasesRequest message. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabasesRequest.verify|verify} messages.
                 * @param message ListDatabasesRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IListDatabasesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListDatabasesRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabasesRequest.verify|verify} messages.
                 * @param message ListDatabasesRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IListDatabasesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListDatabasesRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListDatabasesRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListDatabasesRequest;

                /**
                 * Decodes a ListDatabasesRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListDatabasesRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListDatabasesRequest;

                /**
                 * Verifies a ListDatabasesRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListDatabasesRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListDatabasesRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListDatabasesRequest;

                /**
                 * Creates a plain object from a ListDatabasesRequest message. Also converts values to other types if specified.
                 * @param message ListDatabasesRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.ListDatabasesRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListDatabasesRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a ListDatabasesResponse. */
              interface IListDatabasesResponse {

                /** ListDatabasesResponse databases */
                databases?: (google.spanner.admin.database.v1.IDatabase[]|null);

                /** ListDatabasesResponse nextPageToken */
                nextPageToken?: (string|null);
              }

              /** Represents a ListDatabasesResponse. */
              class ListDatabasesResponse implements IListDatabasesResponse {

                /**
                 * Constructs a new ListDatabasesResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IListDatabasesResponse);

                /** ListDatabasesResponse databases. */
                public databases: google.spanner.admin.database.v1.IDatabase[];

                /** ListDatabasesResponse nextPageToken. */
                public nextPageToken: string;

                /**
                 * Creates a new ListDatabasesResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListDatabasesResponse instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IListDatabasesResponse): google.spanner.admin.database.v1.ListDatabasesResponse;

                /**
                 * Encodes the specified ListDatabasesResponse message. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabasesResponse.verify|verify} messages.
                 * @param message ListDatabasesResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IListDatabasesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListDatabasesResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabasesResponse.verify|verify} messages.
                 * @param message ListDatabasesResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IListDatabasesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListDatabasesResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListDatabasesResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListDatabasesResponse;

                /**
                 * Decodes a ListDatabasesResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListDatabasesResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListDatabasesResponse;

                /**
                 * Verifies a ListDatabasesResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListDatabasesResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListDatabasesResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListDatabasesResponse;

                /**
                 * Creates a plain object from a ListDatabasesResponse message. Also converts values to other types if specified.
                 * @param message ListDatabasesResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.ListDatabasesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListDatabasesResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a CreateDatabaseRequest. */
              interface ICreateDatabaseRequest {

                /** CreateDatabaseRequest parent */
                parent?: (string|null);

                /** CreateDatabaseRequest createStatement */
                createStatement?: (string|null);

                /** CreateDatabaseRequest extraStatements */
                extraStatements?: (string[]|null);
              }

              /** Represents a CreateDatabaseRequest. */
              class CreateDatabaseRequest implements ICreateDatabaseRequest {

                /**
                 * Constructs a new CreateDatabaseRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.ICreateDatabaseRequest);

                /** CreateDatabaseRequest parent. */
                public parent: string;

                /** CreateDatabaseRequest createStatement. */
                public createStatement: string;

                /** CreateDatabaseRequest extraStatements. */
                public extraStatements: string[];

                /**
                 * Creates a new CreateDatabaseRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns CreateDatabaseRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.ICreateDatabaseRequest): google.spanner.admin.database.v1.CreateDatabaseRequest;

                /**
                 * Encodes the specified CreateDatabaseRequest message. Does not implicitly {@link google.spanner.admin.database.v1.CreateDatabaseRequest.verify|verify} messages.
                 * @param message CreateDatabaseRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.ICreateDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified CreateDatabaseRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateDatabaseRequest.verify|verify} messages.
                 * @param message CreateDatabaseRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a CreateDatabaseRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns CreateDatabaseRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateDatabaseRequest;

                /**
                 * Decodes a CreateDatabaseRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns CreateDatabaseRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateDatabaseRequest;

                /**
                 * Verifies a CreateDatabaseRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a CreateDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns CreateDatabaseRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateDatabaseRequest;

                /**
                 * Creates a plain object from a CreateDatabaseRequest message. Also converts values to other types if specified.
                 * @param message CreateDatabaseRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.CreateDatabaseRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this CreateDatabaseRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a CreateDatabaseMetadata. */
              interface ICreateDatabaseMetadata {

                /** CreateDatabaseMetadata database */
                database?: (string|null);
              }

              /** Represents a CreateDatabaseMetadata. */
              class CreateDatabaseMetadata implements ICreateDatabaseMetadata {

                /**
                 * Constructs a new CreateDatabaseMetadata.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.ICreateDatabaseMetadata);

                /** CreateDatabaseMetadata database. */
                public database: string;

                /**
                 * Creates a new CreateDatabaseMetadata instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns CreateDatabaseMetadata instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.ICreateDatabaseMetadata): google.spanner.admin.database.v1.CreateDatabaseMetadata;

                /**
                 * Encodes the specified CreateDatabaseMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.CreateDatabaseMetadata.verify|verify} messages.
                 * @param message CreateDatabaseMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.ICreateDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified CreateDatabaseMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateDatabaseMetadata.verify|verify} messages.
                 * @param message CreateDatabaseMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a CreateDatabaseMetadata message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns CreateDatabaseMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateDatabaseMetadata;

                /**
                 * Decodes a CreateDatabaseMetadata message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns CreateDatabaseMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateDatabaseMetadata;

                /**
                 * Verifies a CreateDatabaseMetadata message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a CreateDatabaseMetadata message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns CreateDatabaseMetadata
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateDatabaseMetadata;

                /**
                 * Creates a plain object from a CreateDatabaseMetadata message. Also converts values to other types if specified.
                 * @param message CreateDatabaseMetadata
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.CreateDatabaseMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this CreateDatabaseMetadata to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a GetDatabaseRequest. */
              interface IGetDatabaseRequest {

                /** GetDatabaseRequest name */
                name?: (string|null);
              }

              /** Represents a GetDatabaseRequest. */
              class GetDatabaseRequest implements IGetDatabaseRequest {

                /**
                 * Constructs a new GetDatabaseRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IGetDatabaseRequest);

                /** GetDatabaseRequest name. */
                public name: string;

                /**
                 * Creates a new GetDatabaseRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns GetDatabaseRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IGetDatabaseRequest): google.spanner.admin.database.v1.GetDatabaseRequest;

                /**
                 * Encodes the specified GetDatabaseRequest message. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseRequest.verify|verify} messages.
                 * @param message GetDatabaseRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IGetDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GetDatabaseRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseRequest.verify|verify} messages.
                 * @param message GetDatabaseRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IGetDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GetDatabaseRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GetDatabaseRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.GetDatabaseRequest;

                /**
                 * Decodes a GetDatabaseRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GetDatabaseRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.GetDatabaseRequest;

                /**
                 * Verifies a GetDatabaseRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a GetDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns GetDatabaseRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.GetDatabaseRequest;

                /**
                 * Creates a plain object from a GetDatabaseRequest message. Also converts values to other types if specified.
                 * @param message GetDatabaseRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.GetDatabaseRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GetDatabaseRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of an UpdateDatabaseDdlRequest. */
              interface IUpdateDatabaseDdlRequest {

                /** UpdateDatabaseDdlRequest database */
                database?: (string|null);

                /** UpdateDatabaseDdlRequest statements */
                statements?: (string[]|null);

                /** UpdateDatabaseDdlRequest operationId */
                operationId?: (string|null);
              }

              /** Represents an UpdateDatabaseDdlRequest. */
              class UpdateDatabaseDdlRequest implements IUpdateDatabaseDdlRequest {

                /**
                 * Constructs a new UpdateDatabaseDdlRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest);

                /** UpdateDatabaseDdlRequest database. */
                public database: string;

                /** UpdateDatabaseDdlRequest statements. */
                public statements: string[];

                /** UpdateDatabaseDdlRequest operationId. */
                public operationId: string;

                /**
                 * Creates a new UpdateDatabaseDdlRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns UpdateDatabaseDdlRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest): google.spanner.admin.database.v1.UpdateDatabaseDdlRequest;

                /**
                 * Encodes the specified UpdateDatabaseDdlRequest message. Does not implicitly {@link google.spanner.admin.database.v1.UpdateDatabaseDdlRequest.verify|verify} messages.
                 * @param message UpdateDatabaseDdlRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified UpdateDatabaseDdlRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.UpdateDatabaseDdlRequest.verify|verify} messages.
                 * @param message UpdateDatabaseDdlRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an UpdateDatabaseDdlRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns UpdateDatabaseDdlRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.UpdateDatabaseDdlRequest;

                /**
                 * Decodes an UpdateDatabaseDdlRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns UpdateDatabaseDdlRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.UpdateDatabaseDdlRequest;

                /**
                 * Verifies an UpdateDatabaseDdlRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an UpdateDatabaseDdlRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns UpdateDatabaseDdlRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.UpdateDatabaseDdlRequest;

                /**
                 * Creates a plain object from an UpdateDatabaseDdlRequest message. Also converts values to other types if specified.
                 * @param message UpdateDatabaseDdlRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.UpdateDatabaseDdlRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this UpdateDatabaseDdlRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of an UpdateDatabaseDdlMetadata. */
              interface IUpdateDatabaseDdlMetadata {

                /** UpdateDatabaseDdlMetadata database */
                database?: (string|null);

                /** UpdateDatabaseDdlMetadata statements */
                statements?: (string[]|null);

                /** UpdateDatabaseDdlMetadata commitTimestamps */
                commitTimestamps?: (google.protobuf.ITimestamp[]|null);
              }

              /** Represents an UpdateDatabaseDdlMetadata. */
              class UpdateDatabaseDdlMetadata implements IUpdateDatabaseDdlMetadata {

                /**
                 * Constructs a new UpdateDatabaseDdlMetadata.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IUpdateDatabaseDdlMetadata);

                /** UpdateDatabaseDdlMetadata database. */
                public database: string;

                /** UpdateDatabaseDdlMetadata statements. */
                public statements: string[];

                /** UpdateDatabaseDdlMetadata commitTimestamps. */
                public commitTimestamps: google.protobuf.ITimestamp[];

                /**
                 * Creates a new UpdateDatabaseDdlMetadata instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns UpdateDatabaseDdlMetadata instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IUpdateDatabaseDdlMetadata): google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata;

                /**
                 * Encodes the specified UpdateDatabaseDdlMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata.verify|verify} messages.
                 * @param message UpdateDatabaseDdlMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IUpdateDatabaseDdlMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified UpdateDatabaseDdlMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata.verify|verify} messages.
                 * @param message UpdateDatabaseDdlMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IUpdateDatabaseDdlMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an UpdateDatabaseDdlMetadata message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns UpdateDatabaseDdlMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata;

                /**
                 * Decodes an UpdateDatabaseDdlMetadata message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns UpdateDatabaseDdlMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata;

                /**
                 * Verifies an UpdateDatabaseDdlMetadata message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an UpdateDatabaseDdlMetadata message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns UpdateDatabaseDdlMetadata
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata;

                /**
                 * Creates a plain object from an UpdateDatabaseDdlMetadata message. Also converts values to other types if specified.
                 * @param message UpdateDatabaseDdlMetadata
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this UpdateDatabaseDdlMetadata to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a DropDatabaseRequest. */
              interface IDropDatabaseRequest {

                /** DropDatabaseRequest database */
                database?: (string|null);
              }

              /** Represents a DropDatabaseRequest. */
              class DropDatabaseRequest implements IDropDatabaseRequest {

                /**
                 * Constructs a new DropDatabaseRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IDropDatabaseRequest);

                /** DropDatabaseRequest database. */
                public database: string;

                /**
                 * Creates a new DropDatabaseRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns DropDatabaseRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IDropDatabaseRequest): google.spanner.admin.database.v1.DropDatabaseRequest;

                /**
                 * Encodes the specified DropDatabaseRequest message. Does not implicitly {@link google.spanner.admin.database.v1.DropDatabaseRequest.verify|verify} messages.
                 * @param message DropDatabaseRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IDropDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified DropDatabaseRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.DropDatabaseRequest.verify|verify} messages.
                 * @param message DropDatabaseRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IDropDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a DropDatabaseRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns DropDatabaseRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.DropDatabaseRequest;

                /**
                 * Decodes a DropDatabaseRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns DropDatabaseRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.DropDatabaseRequest;

                /**
                 * Verifies a DropDatabaseRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a DropDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns DropDatabaseRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.DropDatabaseRequest;

                /**
                 * Creates a plain object from a DropDatabaseRequest message. Also converts values to other types if specified.
                 * @param message DropDatabaseRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.DropDatabaseRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this DropDatabaseRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a GetDatabaseDdlRequest. */
              interface IGetDatabaseDdlRequest {

                /** GetDatabaseDdlRequest database */
                database?: (string|null);
              }

              /** Represents a GetDatabaseDdlRequest. */
              class GetDatabaseDdlRequest implements IGetDatabaseDdlRequest {

                /**
                 * Constructs a new GetDatabaseDdlRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IGetDatabaseDdlRequest);

                /** GetDatabaseDdlRequest database. */
                public database: string;

                /**
                 * Creates a new GetDatabaseDdlRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns GetDatabaseDdlRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IGetDatabaseDdlRequest): google.spanner.admin.database.v1.GetDatabaseDdlRequest;

                /**
                 * Encodes the specified GetDatabaseDdlRequest message. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseDdlRequest.verify|verify} messages.
                 * @param message GetDatabaseDdlRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IGetDatabaseDdlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GetDatabaseDdlRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseDdlRequest.verify|verify} messages.
                 * @param message GetDatabaseDdlRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IGetDatabaseDdlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GetDatabaseDdlRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GetDatabaseDdlRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.GetDatabaseDdlRequest;

                /**
                 * Decodes a GetDatabaseDdlRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GetDatabaseDdlRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.GetDatabaseDdlRequest;

                /**
                 * Verifies a GetDatabaseDdlRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a GetDatabaseDdlRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns GetDatabaseDdlRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.GetDatabaseDdlRequest;

                /**
                 * Creates a plain object from a GetDatabaseDdlRequest message. Also converts values to other types if specified.
                 * @param message GetDatabaseDdlRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.GetDatabaseDdlRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GetDatabaseDdlRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a GetDatabaseDdlResponse. */
              interface IGetDatabaseDdlResponse {

                /** GetDatabaseDdlResponse statements */
                statements?: (string[]|null);
              }

              /** Represents a GetDatabaseDdlResponse. */
              class GetDatabaseDdlResponse implements IGetDatabaseDdlResponse {

                /**
                 * Constructs a new GetDatabaseDdlResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IGetDatabaseDdlResponse);

                /** GetDatabaseDdlResponse statements. */
                public statements: string[];

                /**
                 * Creates a new GetDatabaseDdlResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns GetDatabaseDdlResponse instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IGetDatabaseDdlResponse): google.spanner.admin.database.v1.GetDatabaseDdlResponse;

                /**
                 * Encodes the specified GetDatabaseDdlResponse message. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseDdlResponse.verify|verify} messages.
                 * @param message GetDatabaseDdlResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IGetDatabaseDdlResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GetDatabaseDdlResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseDdlResponse.verify|verify} messages.
                 * @param message GetDatabaseDdlResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IGetDatabaseDdlResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GetDatabaseDdlResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GetDatabaseDdlResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.GetDatabaseDdlResponse;

                /**
                 * Decodes a GetDatabaseDdlResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GetDatabaseDdlResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.GetDatabaseDdlResponse;

                /**
                 * Verifies a GetDatabaseDdlResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a GetDatabaseDdlResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns GetDatabaseDdlResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.GetDatabaseDdlResponse;

                /**
                 * Creates a plain object from a GetDatabaseDdlResponse message. Also converts values to other types if specified.
                 * @param message GetDatabaseDdlResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.GetDatabaseDdlResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GetDatabaseDdlResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a ListDatabaseOperationsRequest. */
              interface IListDatabaseOperationsRequest {

                /** ListDatabaseOperationsRequest parent */
                parent?: (string|null);

                /** ListDatabaseOperationsRequest filter */
                filter?: (string|null);

                /** ListDatabaseOperationsRequest pageSize */
                pageSize?: (number|null);

                /** ListDatabaseOperationsRequest pageToken */
                pageToken?: (string|null);
              }

              /** Represents a ListDatabaseOperationsRequest. */
              class ListDatabaseOperationsRequest implements IListDatabaseOperationsRequest {

                /**
                 * Constructs a new ListDatabaseOperationsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IListDatabaseOperationsRequest);

                /** ListDatabaseOperationsRequest parent. */
                public parent: string;

                /** ListDatabaseOperationsRequest filter. */
                public filter: string;

                /** ListDatabaseOperationsRequest pageSize. */
                public pageSize: number;

                /** ListDatabaseOperationsRequest pageToken. */
                public pageToken: string;

                /**
                 * Creates a new ListDatabaseOperationsRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListDatabaseOperationsRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IListDatabaseOperationsRequest): google.spanner.admin.database.v1.ListDatabaseOperationsRequest;

                /**
                 * Encodes the specified ListDatabaseOperationsRequest message. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabaseOperationsRequest.verify|verify} messages.
                 * @param message ListDatabaseOperationsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IListDatabaseOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListDatabaseOperationsRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabaseOperationsRequest.verify|verify} messages.
                 * @param message ListDatabaseOperationsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IListDatabaseOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListDatabaseOperationsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListDatabaseOperationsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListDatabaseOperationsRequest;

                /**
                 * Decodes a ListDatabaseOperationsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListDatabaseOperationsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListDatabaseOperationsRequest;

                /**
                 * Verifies a ListDatabaseOperationsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListDatabaseOperationsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListDatabaseOperationsRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListDatabaseOperationsRequest;

                /**
                 * Creates a plain object from a ListDatabaseOperationsRequest message. Also converts values to other types if specified.
                 * @param message ListDatabaseOperationsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.ListDatabaseOperationsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListDatabaseOperationsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a ListDatabaseOperationsResponse. */
              interface IListDatabaseOperationsResponse {

                /** ListDatabaseOperationsResponse operations */
                operations?: (google.longrunning.IOperation[]|null);

                /** ListDatabaseOperationsResponse nextPageToken */
                nextPageToken?: (string|null);
              }

              /** Represents a ListDatabaseOperationsResponse. */
              class ListDatabaseOperationsResponse implements IListDatabaseOperationsResponse {

                /**
                 * Constructs a new ListDatabaseOperationsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IListDatabaseOperationsResponse);

                /** ListDatabaseOperationsResponse operations. */
                public operations: google.longrunning.IOperation[];

                /** ListDatabaseOperationsResponse nextPageToken. */
                public nextPageToken: string;

                /**
                 * Creates a new ListDatabaseOperationsResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListDatabaseOperationsResponse instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IListDatabaseOperationsResponse): google.spanner.admin.database.v1.ListDatabaseOperationsResponse;

                /**
                 * Encodes the specified ListDatabaseOperationsResponse message. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabaseOperationsResponse.verify|verify} messages.
                 * @param message ListDatabaseOperationsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IListDatabaseOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListDatabaseOperationsResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabaseOperationsResponse.verify|verify} messages.
                 * @param message ListDatabaseOperationsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IListDatabaseOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListDatabaseOperationsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListDatabaseOperationsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListDatabaseOperationsResponse;

                /**
                 * Decodes a ListDatabaseOperationsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListDatabaseOperationsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListDatabaseOperationsResponse;

                /**
                 * Verifies a ListDatabaseOperationsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListDatabaseOperationsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListDatabaseOperationsResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListDatabaseOperationsResponse;

                /**
                 * Creates a plain object from a ListDatabaseOperationsResponse message. Also converts values to other types if specified.
                 * @param message ListDatabaseOperationsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.ListDatabaseOperationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListDatabaseOperationsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a RestoreDatabaseRequest. */
              interface IRestoreDatabaseRequest {

                /** RestoreDatabaseRequest parent */
                parent?: (string|null);

                /** RestoreDatabaseRequest databaseId */
                databaseId?: (string|null);

                /** RestoreDatabaseRequest backup */
                backup?: (string|null);
              }

              /** Represents a RestoreDatabaseRequest. */
              class RestoreDatabaseRequest implements IRestoreDatabaseRequest {

                /**
                 * Constructs a new RestoreDatabaseRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IRestoreDatabaseRequest);

                /** RestoreDatabaseRequest parent. */
                public parent: string;

                /** RestoreDatabaseRequest databaseId. */
                public databaseId: string;

                /** RestoreDatabaseRequest backup. */
                public backup: string;

                /** RestoreDatabaseRequest source. */
                public source?: "backup";

                /**
                 * Creates a new RestoreDatabaseRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns RestoreDatabaseRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IRestoreDatabaseRequest): google.spanner.admin.database.v1.RestoreDatabaseRequest;

                /**
                 * Encodes the specified RestoreDatabaseRequest message. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseRequest.verify|verify} messages.
                 * @param message RestoreDatabaseRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IRestoreDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified RestoreDatabaseRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseRequest.verify|verify} messages.
                 * @param message RestoreDatabaseRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IRestoreDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a RestoreDatabaseRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns RestoreDatabaseRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.RestoreDatabaseRequest;

                /**
                 * Decodes a RestoreDatabaseRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns RestoreDatabaseRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.RestoreDatabaseRequest;

                /**
                 * Verifies a RestoreDatabaseRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a RestoreDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns RestoreDatabaseRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.RestoreDatabaseRequest;

                /**
                 * Creates a plain object from a RestoreDatabaseRequest message. Also converts values to other types if specified.
                 * @param message RestoreDatabaseRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.RestoreDatabaseRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this RestoreDatabaseRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a RestoreDatabaseMetadata. */
              interface IRestoreDatabaseMetadata {

                /** RestoreDatabaseMetadata name */
                name?: (string|null);

                /** RestoreDatabaseMetadata sourceType */
                sourceType?: (google.spanner.admin.database.v1.RestoreSourceType|null);

                /** RestoreDatabaseMetadata backupInfo */
                backupInfo?: (google.spanner.admin.database.v1.IBackupInfo|null);

                /** RestoreDatabaseMetadata progress */
                progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                /** RestoreDatabaseMetadata cancelTime */
                cancelTime?: (google.protobuf.ITimestamp|null);

                /** RestoreDatabaseMetadata optimizeDatabaseOperationName */
                optimizeDatabaseOperationName?: (string|null);
              }

              /** Represents a RestoreDatabaseMetadata. */
              class RestoreDatabaseMetadata implements IRestoreDatabaseMetadata {

                /**
                 * Constructs a new RestoreDatabaseMetadata.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IRestoreDatabaseMetadata);

                /** RestoreDatabaseMetadata name. */
                public name: string;

                /** RestoreDatabaseMetadata sourceType. */
                public sourceType: google.spanner.admin.database.v1.RestoreSourceType;

                /** RestoreDatabaseMetadata backupInfo. */
                public backupInfo?: (google.spanner.admin.database.v1.IBackupInfo|null);

                /** RestoreDatabaseMetadata progress. */
                public progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                /** RestoreDatabaseMetadata cancelTime. */
                public cancelTime?: (google.protobuf.ITimestamp|null);

                /** RestoreDatabaseMetadata optimizeDatabaseOperationName. */
                public optimizeDatabaseOperationName: string;

                /** RestoreDatabaseMetadata sourceInfo. */
                public sourceInfo?: "backupInfo";

                /**
                 * Creates a new RestoreDatabaseMetadata instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns RestoreDatabaseMetadata instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IRestoreDatabaseMetadata): google.spanner.admin.database.v1.RestoreDatabaseMetadata;

                /**
                 * Encodes the specified RestoreDatabaseMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseMetadata.verify|verify} messages.
                 * @param message RestoreDatabaseMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IRestoreDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified RestoreDatabaseMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseMetadata.verify|verify} messages.
                 * @param message RestoreDatabaseMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IRestoreDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a RestoreDatabaseMetadata message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns RestoreDatabaseMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.RestoreDatabaseMetadata;

                /**
                 * Decodes a RestoreDatabaseMetadata message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns RestoreDatabaseMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.RestoreDatabaseMetadata;

                /**
                 * Verifies a RestoreDatabaseMetadata message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a RestoreDatabaseMetadata message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns RestoreDatabaseMetadata
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.RestoreDatabaseMetadata;

                /**
                 * Creates a plain object from a RestoreDatabaseMetadata message. Also converts values to other types if specified.
                 * @param message RestoreDatabaseMetadata
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.RestoreDatabaseMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this RestoreDatabaseMetadata to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** RestoreSourceType enum. */
              enum RestoreSourceType {
                TYPE_UNSPECIFIED = 0,
                BACKUP = 1
              }

              /** Properties of a Backup. */
              interface IBackup {

                /** Backup name */
                name?: (string|null);

                /** Backup database */
                database?: (string|null);

                /** Backup expireTime */
                expireTime?: (google.protobuf.ITimestamp|null);

                /** Backup createTime */
                createTime?: (google.protobuf.ITimestamp|null);

                /** Backup sizeBytes */
                sizeBytes?: (number|Long|null);

                /** Backup state */
                state?: (google.spanner.admin.database.v1.Backup.State|null);

                /** Backup referencingDatabases */
                referencingDatabases?: (string[]|null);
              }

              /** Represents a Backup. */
              class Backup implements IBackup {

                /**
                 * Constructs a new Backup.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IBackup);

                /** Backup name. */
                public name: string;

                /** Backup database. */
                public database: string;

                /** Backup expireTime. */
                public expireTime?: (google.protobuf.ITimestamp|null);

                /** Backup createTime. */
                public createTime?: (google.protobuf.ITimestamp|null);

                /** Backup sizeBytes. */
                public sizeBytes: (number|Long);

                /** Backup state. */
                public state: google.spanner.admin.database.v1.Backup.State;

                /** Backup referencingDatabases. */
                public referencingDatabases: string[];

                /**
                 * Creates a new Backup instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Backup instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IBackup): google.spanner.admin.database.v1.Backup;

                /**
                 * Encodes the specified Backup message. Does not implicitly {@link google.spanner.admin.database.v1.Backup.verify|verify} messages.
                 * @param message Backup message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IBackup, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Backup message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.Backup.verify|verify} messages.
                 * @param message Backup message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IBackup, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Backup message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Backup
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.Backup;

                /**
                 * Decodes a Backup message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Backup
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.Backup;

                /**
                 * Verifies a Backup message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Backup message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Backup
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.Backup;

                /**
                 * Creates a plain object from a Backup message. Also converts values to other types if specified.
                 * @param message Backup
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.Backup, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Backup to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              namespace Backup {

                /** State enum. */
                enum State {
                  STATE_UNSPECIFIED = 0,
                  CREATING = 1,
                  READY = 2
                }
              }

              /** Properties of a CreateBackupRequest. */
              interface ICreateBackupRequest {

                /** CreateBackupRequest parent */
                parent?: (string|null);

                /** CreateBackupRequest backupId */
                backupId?: (string|null);

                /** CreateBackupRequest backup */
                backup?: (google.spanner.admin.database.v1.IBackup|null);
              }

              /** Represents a CreateBackupRequest. */
              class CreateBackupRequest implements ICreateBackupRequest {

                /**
                 * Constructs a new CreateBackupRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.ICreateBackupRequest);

                /** CreateBackupRequest parent. */
                public parent: string;

                /** CreateBackupRequest backupId. */
                public backupId: string;

                /** CreateBackupRequest backup. */
                public backup?: (google.spanner.admin.database.v1.IBackup|null);

                /**
                 * Creates a new CreateBackupRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns CreateBackupRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.ICreateBackupRequest): google.spanner.admin.database.v1.CreateBackupRequest;

                /**
                 * Encodes the specified CreateBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupRequest.verify|verify} messages.
                 * @param message CreateBackupRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.ICreateBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified CreateBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupRequest.verify|verify} messages.
                 * @param message CreateBackupRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a CreateBackupRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns CreateBackupRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateBackupRequest;

                /**
                 * Decodes a CreateBackupRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns CreateBackupRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateBackupRequest;

                /**
                 * Verifies a CreateBackupRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a CreateBackupRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns CreateBackupRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateBackupRequest;

                /**
                 * Creates a plain object from a CreateBackupRequest message. Also converts values to other types if specified.
                 * @param message CreateBackupRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.CreateBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this CreateBackupRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a CreateBackupMetadata. */
              interface ICreateBackupMetadata {

                /** CreateBackupMetadata name */
                name?: (string|null);

                /** CreateBackupMetadata database */
                database?: (string|null);

                /** CreateBackupMetadata progress */
                progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                /** CreateBackupMetadata cancelTime */
                cancelTime?: (google.protobuf.ITimestamp|null);
              }

              /** Represents a CreateBackupMetadata. */
              class CreateBackupMetadata implements ICreateBackupMetadata {

                /**
                 * Constructs a new CreateBackupMetadata.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.ICreateBackupMetadata);

                /** CreateBackupMetadata name. */
                public name: string;

                /** CreateBackupMetadata database. */
                public database: string;

                /** CreateBackupMetadata progress. */
                public progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                /** CreateBackupMetadata cancelTime. */
                public cancelTime?: (google.protobuf.ITimestamp|null);

                /**
                 * Creates a new CreateBackupMetadata instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns CreateBackupMetadata instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.ICreateBackupMetadata): google.spanner.admin.database.v1.CreateBackupMetadata;

                /**
                 * Encodes the specified CreateBackupMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupMetadata.verify|verify} messages.
                 * @param message CreateBackupMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.ICreateBackupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified CreateBackupMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupMetadata.verify|verify} messages.
                 * @param message CreateBackupMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateBackupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a CreateBackupMetadata message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns CreateBackupMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateBackupMetadata;

                /**
                 * Decodes a CreateBackupMetadata message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns CreateBackupMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateBackupMetadata;

                /**
                 * Verifies a CreateBackupMetadata message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a CreateBackupMetadata message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns CreateBackupMetadata
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateBackupMetadata;

                /**
                 * Creates a plain object from a CreateBackupMetadata message. Also converts values to other types if specified.
                 * @param message CreateBackupMetadata
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.CreateBackupMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this CreateBackupMetadata to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of an UpdateBackupRequest. */
              interface IUpdateBackupRequest {

                /** UpdateBackupRequest backup */
                backup?: (google.spanner.admin.database.v1.IBackup|null);

                /** UpdateBackupRequest updateMask */
                updateMask?: (google.protobuf.IFieldMask|null);
              }

              /** Represents an UpdateBackupRequest. */
              class UpdateBackupRequest implements IUpdateBackupRequest {

                /**
                 * Constructs a new UpdateBackupRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IUpdateBackupRequest);

                /** UpdateBackupRequest backup. */
                public backup?: (google.spanner.admin.database.v1.IBackup|null);

                /** UpdateBackupRequest updateMask. */
                public updateMask?: (google.protobuf.IFieldMask|null);

                /**
                 * Creates a new UpdateBackupRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns UpdateBackupRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IUpdateBackupRequest): google.spanner.admin.database.v1.UpdateBackupRequest;

                /**
                 * Encodes the specified UpdateBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.UpdateBackupRequest.verify|verify} messages.
                 * @param message UpdateBackupRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IUpdateBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified UpdateBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.UpdateBackupRequest.verify|verify} messages.
                 * @param message UpdateBackupRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IUpdateBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an UpdateBackupRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns UpdateBackupRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.UpdateBackupRequest;

                /**
                 * Decodes an UpdateBackupRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns UpdateBackupRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.UpdateBackupRequest;

                /**
                 * Verifies an UpdateBackupRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an UpdateBackupRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns UpdateBackupRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.UpdateBackupRequest;

                /**
                 * Creates a plain object from an UpdateBackupRequest message. Also converts values to other types if specified.
                 * @param message UpdateBackupRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.UpdateBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this UpdateBackupRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a GetBackupRequest. */
              interface IGetBackupRequest {

                /** GetBackupRequest name */
                name?: (string|null);
              }

              /** Represents a GetBackupRequest. */
              class GetBackupRequest implements IGetBackupRequest {

                /**
                 * Constructs a new GetBackupRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IGetBackupRequest);

                /** GetBackupRequest name. */
                public name: string;

                /**
                 * Creates a new GetBackupRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns GetBackupRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IGetBackupRequest): google.spanner.admin.database.v1.GetBackupRequest;

                /**
                 * Encodes the specified GetBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.GetBackupRequest.verify|verify} messages.
                 * @param message GetBackupRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IGetBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GetBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.GetBackupRequest.verify|verify} messages.
                 * @param message GetBackupRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IGetBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GetBackupRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GetBackupRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.GetBackupRequest;

                /**
                 * Decodes a GetBackupRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GetBackupRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.GetBackupRequest;

                /**
                 * Verifies a GetBackupRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a GetBackupRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns GetBackupRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.GetBackupRequest;

                /**
                 * Creates a plain object from a GetBackupRequest message. Also converts values to other types if specified.
                 * @param message GetBackupRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.GetBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GetBackupRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a DeleteBackupRequest. */
              interface IDeleteBackupRequest {

                /** DeleteBackupRequest name */
                name?: (string|null);
              }

              /** Represents a DeleteBackupRequest. */
              class DeleteBackupRequest implements IDeleteBackupRequest {

                /**
                 * Constructs a new DeleteBackupRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IDeleteBackupRequest);

                /** DeleteBackupRequest name. */
                public name: string;

                /**
                 * Creates a new DeleteBackupRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns DeleteBackupRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IDeleteBackupRequest): google.spanner.admin.database.v1.DeleteBackupRequest;

                /**
                 * Encodes the specified DeleteBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.DeleteBackupRequest.verify|verify} messages.
                 * @param message DeleteBackupRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IDeleteBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified DeleteBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.DeleteBackupRequest.verify|verify} messages.
                 * @param message DeleteBackupRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IDeleteBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a DeleteBackupRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns DeleteBackupRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.DeleteBackupRequest;

                /**
                 * Decodes a DeleteBackupRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns DeleteBackupRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.DeleteBackupRequest;

                /**
                 * Verifies a DeleteBackupRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a DeleteBackupRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns DeleteBackupRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.DeleteBackupRequest;

                /**
                 * Creates a plain object from a DeleteBackupRequest message. Also converts values to other types if specified.
                 * @param message DeleteBackupRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.DeleteBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this DeleteBackupRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a ListBackupsRequest. */
              interface IListBackupsRequest {

                /** ListBackupsRequest parent */
                parent?: (string|null);

                /** ListBackupsRequest filter */
                filter?: (string|null);

                /** ListBackupsRequest pageSize */
                pageSize?: (number|null);

                /** ListBackupsRequest pageToken */
                pageToken?: (string|null);
              }

              /** Represents a ListBackupsRequest. */
              class ListBackupsRequest implements IListBackupsRequest {

                /**
                 * Constructs a new ListBackupsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IListBackupsRequest);

                /** ListBackupsRequest parent. */
                public parent: string;

                /** ListBackupsRequest filter. */
                public filter: string;

                /** ListBackupsRequest pageSize. */
                public pageSize: number;

                /** ListBackupsRequest pageToken. */
                public pageToken: string;

                /**
                 * Creates a new ListBackupsRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListBackupsRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IListBackupsRequest): google.spanner.admin.database.v1.ListBackupsRequest;

                /**
                 * Encodes the specified ListBackupsRequest message. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupsRequest.verify|verify} messages.
                 * @param message ListBackupsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IListBackupsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListBackupsRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupsRequest.verify|verify} messages.
                 * @param message ListBackupsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IListBackupsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListBackupsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListBackupsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListBackupsRequest;

                /**
                 * Decodes a ListBackupsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListBackupsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListBackupsRequest;

                /**
                 * Verifies a ListBackupsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListBackupsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListBackupsRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListBackupsRequest;

                /**
                 * Creates a plain object from a ListBackupsRequest message. Also converts values to other types if specified.
                 * @param message ListBackupsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.ListBackupsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListBackupsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a ListBackupsResponse. */
              interface IListBackupsResponse {

                /** ListBackupsResponse backups */
                backups?: (google.spanner.admin.database.v1.IBackup[]|null);

                /** ListBackupsResponse nextPageToken */
                nextPageToken?: (string|null);
              }

              /** Represents a ListBackupsResponse. */
              class ListBackupsResponse implements IListBackupsResponse {

                /**
                 * Constructs a new ListBackupsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IListBackupsResponse);

                /** ListBackupsResponse backups. */
                public backups: google.spanner.admin.database.v1.IBackup[];

                /** ListBackupsResponse nextPageToken. */
                public nextPageToken: string;

                /**
                 * Creates a new ListBackupsResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListBackupsResponse instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IListBackupsResponse): google.spanner.admin.database.v1.ListBackupsResponse;

                /**
                 * Encodes the specified ListBackupsResponse message. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupsResponse.verify|verify} messages.
                 * @param message ListBackupsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IListBackupsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListBackupsResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupsResponse.verify|verify} messages.
                 * @param message ListBackupsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IListBackupsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListBackupsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListBackupsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListBackupsResponse;

                /**
                 * Decodes a ListBackupsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListBackupsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListBackupsResponse;

                /**
                 * Verifies a ListBackupsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListBackupsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListBackupsResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListBackupsResponse;

                /**
                 * Creates a plain object from a ListBackupsResponse message. Also converts values to other types if specified.
                 * @param message ListBackupsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.ListBackupsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListBackupsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a ListBackupOperationsRequest. */
              interface IListBackupOperationsRequest {

                /** ListBackupOperationsRequest parent */
                parent?: (string|null);

                /** ListBackupOperationsRequest filter */
                filter?: (string|null);

                /** ListBackupOperationsRequest pageSize */
                pageSize?: (number|null);

                /** ListBackupOperationsRequest pageToken */
                pageToken?: (string|null);
              }

              /** Represents a ListBackupOperationsRequest. */
              class ListBackupOperationsRequest implements IListBackupOperationsRequest {

                /**
                 * Constructs a new ListBackupOperationsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IListBackupOperationsRequest);

                /** ListBackupOperationsRequest parent. */
                public parent: string;

                /** ListBackupOperationsRequest filter. */
                public filter: string;

                /** ListBackupOperationsRequest pageSize. */
                public pageSize: number;

                /** ListBackupOperationsRequest pageToken. */
                public pageToken: string;

                /**
                 * Creates a new ListBackupOperationsRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListBackupOperationsRequest instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IListBackupOperationsRequest): google.spanner.admin.database.v1.ListBackupOperationsRequest;

                /**
                 * Encodes the specified ListBackupOperationsRequest message. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupOperationsRequest.verify|verify} messages.
                 * @param message ListBackupOperationsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IListBackupOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListBackupOperationsRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupOperationsRequest.verify|verify} messages.
                 * @param message ListBackupOperationsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IListBackupOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListBackupOperationsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListBackupOperationsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListBackupOperationsRequest;

                /**
                 * Decodes a ListBackupOperationsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListBackupOperationsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListBackupOperationsRequest;

                /**
                 * Verifies a ListBackupOperationsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListBackupOperationsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListBackupOperationsRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListBackupOperationsRequest;

                /**
                 * Creates a plain object from a ListBackupOperationsRequest message. Also converts values to other types if specified.
                 * @param message ListBackupOperationsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.ListBackupOperationsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListBackupOperationsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a ListBackupOperationsResponse. */
              interface IListBackupOperationsResponse {

                /** ListBackupOperationsResponse operations */
                operations?: (google.longrunning.IOperation[]|null);

                /** ListBackupOperationsResponse nextPageToken */
                nextPageToken?: (string|null);
              }

              /** Represents a ListBackupOperationsResponse. */
              class ListBackupOperationsResponse implements IListBackupOperationsResponse {

                /**
                 * Constructs a new ListBackupOperationsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IListBackupOperationsResponse);

                /** ListBackupOperationsResponse operations. */
                public operations: google.longrunning.IOperation[];

                /** ListBackupOperationsResponse nextPageToken. */
                public nextPageToken: string;

                /**
                 * Creates a new ListBackupOperationsResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListBackupOperationsResponse instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IListBackupOperationsResponse): google.spanner.admin.database.v1.ListBackupOperationsResponse;

                /**
                 * Encodes the specified ListBackupOperationsResponse message. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupOperationsResponse.verify|verify} messages.
                 * @param message ListBackupOperationsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IListBackupOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListBackupOperationsResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupOperationsResponse.verify|verify} messages.
                 * @param message ListBackupOperationsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IListBackupOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListBackupOperationsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListBackupOperationsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListBackupOperationsResponse;

                /**
                 * Decodes a ListBackupOperationsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListBackupOperationsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListBackupOperationsResponse;

                /**
                 * Verifies a ListBackupOperationsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListBackupOperationsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListBackupOperationsResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListBackupOperationsResponse;

                /**
                 * Creates a plain object from a ListBackupOperationsResponse message. Also converts values to other types if specified.
                 * @param message ListBackupOperationsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.ListBackupOperationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListBackupOperationsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of a BackupInfo. */
              interface IBackupInfo {

                /** BackupInfo backup */
                backup?: (string|null);

                /** BackupInfo createTime */
                createTime?: (google.protobuf.ITimestamp|null);

                /** BackupInfo sourceDatabase */
                sourceDatabase?: (string|null);
              }

              /** Represents a BackupInfo. */
              class BackupInfo implements IBackupInfo {

                /**
                 * Constructs a new BackupInfo.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IBackupInfo);

                /** BackupInfo backup. */
                public backup: string;

                /** BackupInfo createTime. */
                public createTime?: (google.protobuf.ITimestamp|null);

                /** BackupInfo sourceDatabase. */
                public sourceDatabase: string;

                /**
                 * Creates a new BackupInfo instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BackupInfo instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IBackupInfo): google.spanner.admin.database.v1.BackupInfo;

                /**
                 * Encodes the specified BackupInfo message. Does not implicitly {@link google.spanner.admin.database.v1.BackupInfo.verify|verify} messages.
                 * @param message BackupInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IBackupInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified BackupInfo message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.BackupInfo.verify|verify} messages.
                 * @param message BackupInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IBackupInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BackupInfo message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns BackupInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.BackupInfo;

                /**
                 * Decodes a BackupInfo message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns BackupInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.BackupInfo;

                /**
                 * Verifies a BackupInfo message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a BackupInfo message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns BackupInfo
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.BackupInfo;

                /**
                 * Creates a plain object from a BackupInfo message. Also converts values to other types if specified.
                 * @param message BackupInfo
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.BackupInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this BackupInfo to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }

              /** Properties of an OperationProgress. */
              interface IOperationProgress {

                /** OperationProgress progressPercent */
                progressPercent?: (number|null);

                /** OperationProgress startTime */
                startTime?: (google.protobuf.ITimestamp|null);

                /** OperationProgress endTime */
                endTime?: (google.protobuf.ITimestamp|null);
              }

              /** Represents an OperationProgress. */
              class OperationProgress implements IOperationProgress {

                /**
                 * Constructs a new OperationProgress.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.admin.database.v1.IOperationProgress);

                /** OperationProgress progressPercent. */
                public progressPercent: number;

                /** OperationProgress startTime. */
                public startTime?: (google.protobuf.ITimestamp|null);

                /** OperationProgress endTime. */
                public endTime?: (google.protobuf.ITimestamp|null);

                /**
                 * Creates a new OperationProgress instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns OperationProgress instance
                 */
                public static create(properties?: google.spanner.admin.database.v1.IOperationProgress): google.spanner.admin.database.v1.OperationProgress;

                /**
                 * Encodes the specified OperationProgress message. Does not implicitly {@link google.spanner.admin.database.v1.OperationProgress.verify|verify} messages.
                 * @param message OperationProgress message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.admin.database.v1.IOperationProgress, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified OperationProgress message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.OperationProgress.verify|verify} messages.
                 * @param message OperationProgress message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.admin.database.v1.IOperationProgress, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an OperationProgress message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns OperationProgress
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.OperationProgress;

                /**
                 * Decodes an OperationProgress message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns OperationProgress
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.OperationProgress;

                /**
                 * Verifies an OperationProgress message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an OperationProgress message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns OperationProgress
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.OperationProgress;

                /**
                 * Creates a plain object from an OperationProgress message. Also converts values to other types if specified.
                 * @param message OperationProgress
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.admin.database.v1.OperationProgress, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this OperationProgress to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
              }
            }
          }
        }
    }

    /** Namespace api. */
    namespace api {

        /** Properties of a Http. */
        interface IHttp {

            /** Http rules */
            rules?: (google.api.IHttpRule[]|null);

            /** Http fullyDecodeReservedExpansion */
            fullyDecodeReservedExpansion?: (boolean|null);
        }

        /** Represents a Http. */
        class Http implements IHttp {

            /**
             * Constructs a new Http.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.IHttp);

            /** Http rules. */
            public rules: google.api.IHttpRule[];

            /** Http fullyDecodeReservedExpansion. */
            public fullyDecodeReservedExpansion: boolean;

            /**
             * Creates a new Http instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Http instance
             */
            public static create(properties?: google.api.IHttp): google.api.Http;

            /**
             * Encodes the specified Http message. Does not implicitly {@link google.api.Http.verify|verify} messages.
             * @param message Http message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.IHttp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Http message, length delimited. Does not implicitly {@link google.api.Http.verify|verify} messages.
             * @param message Http message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.IHttp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Http message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Http
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.Http;

            /**
             * Decodes a Http message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Http
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.Http;

            /**
             * Verifies a Http message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Http message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Http
             */
            public static fromObject(object: { [k: string]: any }): google.api.Http;

            /**
             * Creates a plain object from a Http message. Also converts values to other types if specified.
             * @param message Http
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.Http, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Http to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a HttpRule. */
        interface IHttpRule {

            /** HttpRule selector */
            selector?: (string|null);

            /** HttpRule get */
            get?: (string|null);

            /** HttpRule put */
            put?: (string|null);

            /** HttpRule post */
            post?: (string|null);

            /** HttpRule delete */
            "delete"?: (string|null);

            /** HttpRule patch */
            patch?: (string|null);

            /** HttpRule custom */
            custom?: (google.api.ICustomHttpPattern|null);

            /** HttpRule body */
            body?: (string|null);

            /** HttpRule responseBody */
            responseBody?: (string|null);

            /** HttpRule additionalBindings */
            additionalBindings?: (google.api.IHttpRule[]|null);
        }

        /** Represents a HttpRule. */
        class HttpRule implements IHttpRule {

            /**
             * Constructs a new HttpRule.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.IHttpRule);

            /** HttpRule selector. */
            public selector: string;

            /** HttpRule get. */
            public get: string;

            /** HttpRule put. */
            public put: string;

            /** HttpRule post. */
            public post: string;

            /** HttpRule delete. */
            public delete: string;

            /** HttpRule patch. */
            public patch: string;

            /** HttpRule custom. */
            public custom?: (google.api.ICustomHttpPattern|null);

            /** HttpRule body. */
            public body: string;

            /** HttpRule responseBody. */
            public responseBody: string;

            /** HttpRule additionalBindings. */
            public additionalBindings: google.api.IHttpRule[];

            /** HttpRule pattern. */
            public pattern?: ("get"|"put"|"post"|"delete"|"patch"|"custom");

            /**
             * Creates a new HttpRule instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HttpRule instance
             */
            public static create(properties?: google.api.IHttpRule): google.api.HttpRule;

            /**
             * Encodes the specified HttpRule message. Does not implicitly {@link google.api.HttpRule.verify|verify} messages.
             * @param message HttpRule message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.IHttpRule, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HttpRule message, length delimited. Does not implicitly {@link google.api.HttpRule.verify|verify} messages.
             * @param message HttpRule message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.IHttpRule, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HttpRule message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HttpRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.HttpRule;

            /**
             * Decodes a HttpRule message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HttpRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.HttpRule;

            /**
             * Verifies a HttpRule message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HttpRule message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HttpRule
             */
            public static fromObject(object: { [k: string]: any }): google.api.HttpRule;

            /**
             * Creates a plain object from a HttpRule message. Also converts values to other types if specified.
             * @param message HttpRule
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.HttpRule, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HttpRule to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a CustomHttpPattern. */
        interface ICustomHttpPattern {

            /** CustomHttpPattern kind */
            kind?: (string|null);

            /** CustomHttpPattern path */
            path?: (string|null);
        }

        /** Represents a CustomHttpPattern. */
        class CustomHttpPattern implements ICustomHttpPattern {

            /**
             * Constructs a new CustomHttpPattern.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.ICustomHttpPattern);

            /** CustomHttpPattern kind. */
            public kind: string;

            /** CustomHttpPattern path. */
            public path: string;

            /**
             * Creates a new CustomHttpPattern instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CustomHttpPattern instance
             */
            public static create(properties?: google.api.ICustomHttpPattern): google.api.CustomHttpPattern;

            /**
             * Encodes the specified CustomHttpPattern message. Does not implicitly {@link google.api.CustomHttpPattern.verify|verify} messages.
             * @param message CustomHttpPattern message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.ICustomHttpPattern, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CustomHttpPattern message, length delimited. Does not implicitly {@link google.api.CustomHttpPattern.verify|verify} messages.
             * @param message CustomHttpPattern message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.ICustomHttpPattern, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CustomHttpPattern message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CustomHttpPattern
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.CustomHttpPattern;

            /**
             * Decodes a CustomHttpPattern message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CustomHttpPattern
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.CustomHttpPattern;

            /**
             * Verifies a CustomHttpPattern message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CustomHttpPattern message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CustomHttpPattern
             */
            public static fromObject(object: { [k: string]: any }): google.api.CustomHttpPattern;

            /**
             * Creates a plain object from a CustomHttpPattern message. Also converts values to other types if specified.
             * @param message CustomHttpPattern
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.CustomHttpPattern, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CustomHttpPattern to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace protobuf. */
    namespace protobuf {

      /** Properties of a Duration. */
      interface IDuration {

        /** Duration seconds */
        seconds?: (number|Long|null);

        /** Duration nanos */
        nanos?: (number|null);
      }

      /** Represents a Duration. */
      class Duration implements IDuration {

        /**
         * Constructs a new Duration.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IDuration);

        /** Duration seconds. */
        public seconds: (number|Long);

        /** Duration nanos. */
        public nanos: number;

        /**
         * Creates a new Duration instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Duration instance
         */
        public static create(properties?: google.protobuf.IDuration): google.protobuf.Duration;

        /**
         * Encodes the specified Duration message. Does not implicitly {@link google.protobuf.Duration.verify|verify} messages.
         * @param message Duration message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IDuration, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Duration message, length delimited. Does not implicitly {@link google.protobuf.Duration.verify|verify} messages.
         * @param message Duration message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IDuration, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Duration message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Duration
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Duration;

        /**
         * Decodes a Duration message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Duration
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Duration;

        /**
         * Verifies a Duration message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Duration message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Duration
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.Duration;

        /**
         * Creates a plain object from a Duration message. Also converts values to other types if specified.
         * @param message Duration
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.Duration, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Duration to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a FileDescriptorSet. */
      interface IFileDescriptorSet {

        /** FileDescriptorSet file */
        file?: (google.protobuf.IFileDescriptorProto[]|null);
      }

      /** Represents a FileDescriptorSet. */
      class FileDescriptorSet implements IFileDescriptorSet {

        /**
         * Constructs a new FileDescriptorSet.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IFileDescriptorSet);

        /** FileDescriptorSet file. */
        public file: google.protobuf.IFileDescriptorProto[];

        /**
         * Creates a new FileDescriptorSet instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FileDescriptorSet instance
         */
        public static create(properties?: google.protobuf.IFileDescriptorSet): google.protobuf.FileDescriptorSet;

        /**
         * Encodes the specified FileDescriptorSet message. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
         * @param message FileDescriptorSet message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IFileDescriptorSet, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FileDescriptorSet message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
         * @param message FileDescriptorSet message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IFileDescriptorSet, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FileDescriptorSet message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FileDescriptorSet
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileDescriptorSet;

        /**
         * Decodes a FileDescriptorSet message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FileDescriptorSet
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileDescriptorSet;

        /**
         * Verifies a FileDescriptorSet message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FileDescriptorSet message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FileDescriptorSet
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.FileDescriptorSet;

        /**
         * Creates a plain object from a FileDescriptorSet message. Also converts values to other types if specified.
         * @param message FileDescriptorSet
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.FileDescriptorSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FileDescriptorSet to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a FileDescriptorProto. */
      interface IFileDescriptorProto {

        /** FileDescriptorProto name */
        name?: (string|null);

        /** FileDescriptorProto package */
        "package"?: (string|null);

        /** FileDescriptorProto dependency */
        dependency?: (string[]|null);

        /** FileDescriptorProto publicDependency */
        publicDependency?: (number[]|null);

        /** FileDescriptorProto weakDependency */
        weakDependency?: (number[]|null);

        /** FileDescriptorProto messageType */
        messageType?: (google.protobuf.IDescriptorProto[]|null);

        /** FileDescriptorProto enumType */
        enumType?: (google.protobuf.IEnumDescriptorProto[]|null);

        /** FileDescriptorProto service */
        service?: (google.protobuf.IServiceDescriptorProto[]|null);

        /** FileDescriptorProto extension */
        extension?: (google.protobuf.IFieldDescriptorProto[]|null);

        /** FileDescriptorProto options */
        options?: (google.protobuf.IFileOptions|null);

        /** FileDescriptorProto sourceCodeInfo */
        sourceCodeInfo?: (google.protobuf.ISourceCodeInfo|null);

        /** FileDescriptorProto syntax */
        syntax?: (string|null);
      }

      /** Represents a FileDescriptorProto. */
      class FileDescriptorProto implements IFileDescriptorProto {

        /**
         * Constructs a new FileDescriptorProto.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IFileDescriptorProto);

        /** FileDescriptorProto name. */
        public name: string;

        /** FileDescriptorProto package. */
        public package: string;

        /** FileDescriptorProto dependency. */
        public dependency: string[];

        /** FileDescriptorProto publicDependency. */
        public publicDependency: number[];

        /** FileDescriptorProto weakDependency. */
        public weakDependency: number[];

        /** FileDescriptorProto messageType. */
        public messageType: google.protobuf.IDescriptorProto[];

        /** FileDescriptorProto enumType. */
        public enumType: google.protobuf.IEnumDescriptorProto[];

        /** FileDescriptorProto service. */
        public service: google.protobuf.IServiceDescriptorProto[];

        /** FileDescriptorProto extension. */
        public extension: google.protobuf.IFieldDescriptorProto[];

        /** FileDescriptorProto options. */
        public options?: (google.protobuf.IFileOptions|null);

        /** FileDescriptorProto sourceCodeInfo. */
        public sourceCodeInfo?: (google.protobuf.ISourceCodeInfo|null);

        /** FileDescriptorProto syntax. */
        public syntax: string;

        /**
         * Creates a new FileDescriptorProto instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FileDescriptorProto instance
         */
        public static create(properties?: google.protobuf.IFileDescriptorProto): google.protobuf.FileDescriptorProto;

        /**
         * Encodes the specified FileDescriptorProto message. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
         * @param message FileDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IFileDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FileDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
         * @param message FileDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IFileDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FileDescriptorProto message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FileDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileDescriptorProto;

        /**
         * Decodes a FileDescriptorProto message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FileDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileDescriptorProto;

        /**
         * Verifies a FileDescriptorProto message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FileDescriptorProto message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FileDescriptorProto
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.FileDescriptorProto;

        /**
         * Creates a plain object from a FileDescriptorProto message. Also converts values to other types if specified.
         * @param message FileDescriptorProto
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.FileDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FileDescriptorProto to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a DescriptorProto. */
      interface IDescriptorProto {

        /** DescriptorProto name */
        name?: (string|null);

        /** DescriptorProto field */
        field?: (google.protobuf.IFieldDescriptorProto[]|null);

        /** DescriptorProto extension */
        extension?: (google.protobuf.IFieldDescriptorProto[]|null);

        /** DescriptorProto nestedType */
        nestedType?: (google.protobuf.IDescriptorProto[]|null);

        /** DescriptorProto enumType */
        enumType?: (google.protobuf.IEnumDescriptorProto[]|null);

        /** DescriptorProto extensionRange */
        extensionRange?: (google.protobuf.DescriptorProto.IExtensionRange[]|null);

        /** DescriptorProto oneofDecl */
        oneofDecl?: (google.protobuf.IOneofDescriptorProto[]|null);

        /** DescriptorProto options */
        options?: (google.protobuf.IMessageOptions|null);

        /** DescriptorProto reservedRange */
        reservedRange?: (google.protobuf.DescriptorProto.IReservedRange[]|null);

        /** DescriptorProto reservedName */
        reservedName?: (string[]|null);
      }

      /** Represents a DescriptorProto. */
      class DescriptorProto implements IDescriptorProto {

        /**
         * Constructs a new DescriptorProto.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IDescriptorProto);

        /** DescriptorProto name. */
        public name: string;

        /** DescriptorProto field. */
        public field: google.protobuf.IFieldDescriptorProto[];

        /** DescriptorProto extension. */
        public extension: google.protobuf.IFieldDescriptorProto[];

        /** DescriptorProto nestedType. */
        public nestedType: google.protobuf.IDescriptorProto[];

        /** DescriptorProto enumType. */
        public enumType: google.protobuf.IEnumDescriptorProto[];

        /** DescriptorProto extensionRange. */
        public extensionRange: google.protobuf.DescriptorProto.IExtensionRange[];

        /** DescriptorProto oneofDecl. */
        public oneofDecl: google.protobuf.IOneofDescriptorProto[];

        /** DescriptorProto options. */
        public options?: (google.protobuf.IMessageOptions|null);

        /** DescriptorProto reservedRange. */
        public reservedRange: google.protobuf.DescriptorProto.IReservedRange[];

        /** DescriptorProto reservedName. */
        public reservedName: string[];

        /**
         * Creates a new DescriptorProto instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DescriptorProto instance
         */
        public static create(properties?: google.protobuf.IDescriptorProto): google.protobuf.DescriptorProto;

        /**
         * Encodes the specified DescriptorProto message. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
         * @param message DescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
         * @param message DescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DescriptorProto message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto;

        /**
         * Decodes a DescriptorProto message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto;

        /**
         * Verifies a DescriptorProto message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DescriptorProto message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DescriptorProto
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto;

        /**
         * Creates a plain object from a DescriptorProto message. Also converts values to other types if specified.
         * @param message DescriptorProto
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.DescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DescriptorProto to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace DescriptorProto {

        /** Properties of an ExtensionRange. */
        interface IExtensionRange {

          /** ExtensionRange start */
          start?: (number|null);

          /** ExtensionRange end */
          end?: (number|null);

          /** ExtensionRange options */
          options?: (google.protobuf.IExtensionRangeOptions|null);
        }

        /** Represents an ExtensionRange. */
        class ExtensionRange implements IExtensionRange {

          /**
           * Constructs a new ExtensionRange.
           * @param [properties] Properties to set
           */
          constructor(properties?: google.protobuf.DescriptorProto.IExtensionRange);

          /** ExtensionRange start. */
          public start: number;

          /** ExtensionRange end. */
          public end: number;

          /** ExtensionRange options. */
          public options?: (google.protobuf.IExtensionRangeOptions|null);

          /**
           * Creates a new ExtensionRange instance using the specified properties.
           * @param [properties] Properties to set
           * @returns ExtensionRange instance
           */
          public static create(properties?: google.protobuf.DescriptorProto.IExtensionRange): google.protobuf.DescriptorProto.ExtensionRange;

          /**
           * Encodes the specified ExtensionRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
           * @param message ExtensionRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(message: google.protobuf.DescriptorProto.IExtensionRange, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Encodes the specified ExtensionRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
           * @param message ExtensionRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(message: google.protobuf.DescriptorProto.IExtensionRange, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Decodes an ExtensionRange message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns ExtensionRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto.ExtensionRange;

          /**
           * Decodes an ExtensionRange message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns ExtensionRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto.ExtensionRange;

          /**
           * Verifies an ExtensionRange message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): (string|null);

          /**
           * Creates an ExtensionRange message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns ExtensionRange
           */
          public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto.ExtensionRange;

          /**
           * Creates a plain object from an ExtensionRange message. Also converts values to other types if specified.
           * @param message ExtensionRange
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(message: google.protobuf.DescriptorProto.ExtensionRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

          /**
           * Converts this ExtensionRange to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };
        }

        /** Properties of a ReservedRange. */
        interface IReservedRange {

          /** ReservedRange start */
          start?: (number|null);

          /** ReservedRange end */
          end?: (number|null);
        }

        /** Represents a ReservedRange. */
        class ReservedRange implements IReservedRange {

          /**
           * Constructs a new ReservedRange.
           * @param [properties] Properties to set
           */
          constructor(properties?: google.protobuf.DescriptorProto.IReservedRange);

          /** ReservedRange start. */
          public start: number;

          /** ReservedRange end. */
          public end: number;

          /**
           * Creates a new ReservedRange instance using the specified properties.
           * @param [properties] Properties to set
           * @returns ReservedRange instance
           */
          public static create(properties?: google.protobuf.DescriptorProto.IReservedRange): google.protobuf.DescriptorProto.ReservedRange;

          /**
           * Encodes the specified ReservedRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
           * @param message ReservedRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(message: google.protobuf.DescriptorProto.IReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Encodes the specified ReservedRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
           * @param message ReservedRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(message: google.protobuf.DescriptorProto.IReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Decodes a ReservedRange message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns ReservedRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto.ReservedRange;

          /**
           * Decodes a ReservedRange message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns ReservedRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto.ReservedRange;

          /**
           * Verifies a ReservedRange message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): (string|null);

          /**
           * Creates a ReservedRange message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns ReservedRange
           */
          public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto.ReservedRange;

          /**
           * Creates a plain object from a ReservedRange message. Also converts values to other types if specified.
           * @param message ReservedRange
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(message: google.protobuf.DescriptorProto.ReservedRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

          /**
           * Converts this ReservedRange to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };
        }
      }

      /** Properties of an ExtensionRangeOptions. */
      interface IExtensionRangeOptions {

        /** ExtensionRangeOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
      }

      /** Represents an ExtensionRangeOptions. */
      class ExtensionRangeOptions implements IExtensionRangeOptions {

        /**
         * Constructs a new ExtensionRangeOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IExtensionRangeOptions);

        /** ExtensionRangeOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new ExtensionRangeOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ExtensionRangeOptions instance
         */
        public static create(properties?: google.protobuf.IExtensionRangeOptions): google.protobuf.ExtensionRangeOptions;

        /**
         * Encodes the specified ExtensionRangeOptions message. Does not implicitly {@link google.protobuf.ExtensionRangeOptions.verify|verify} messages.
         * @param message ExtensionRangeOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IExtensionRangeOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ExtensionRangeOptions message, length delimited. Does not implicitly {@link google.protobuf.ExtensionRangeOptions.verify|verify} messages.
         * @param message ExtensionRangeOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IExtensionRangeOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ExtensionRangeOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ExtensionRangeOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ExtensionRangeOptions;

        /**
         * Decodes an ExtensionRangeOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ExtensionRangeOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ExtensionRangeOptions;

        /**
         * Verifies an ExtensionRangeOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ExtensionRangeOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ExtensionRangeOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.ExtensionRangeOptions;

        /**
         * Creates a plain object from an ExtensionRangeOptions message. Also converts values to other types if specified.
         * @param message ExtensionRangeOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.ExtensionRangeOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ExtensionRangeOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a FieldDescriptorProto. */
      interface IFieldDescriptorProto {

        /** FieldDescriptorProto name */
        name?: (string|null);

        /** FieldDescriptorProto number */
        number?: (number|null);

        /** FieldDescriptorProto label */
        label?: (google.protobuf.FieldDescriptorProto.Label|null);

        /** FieldDescriptorProto type */
        type?: (google.protobuf.FieldDescriptorProto.Type|null);

        /** FieldDescriptorProto typeName */
        typeName?: (string|null);

        /** FieldDescriptorProto extendee */
        extendee?: (string|null);

        /** FieldDescriptorProto defaultValue */
        defaultValue?: (string|null);

        /** FieldDescriptorProto oneofIndex */
        oneofIndex?: (number|null);

        /** FieldDescriptorProto jsonName */
        jsonName?: (string|null);

        /** FieldDescriptorProto options */
        options?: (google.protobuf.IFieldOptions|null);
      }

      /** Represents a FieldDescriptorProto. */
      class FieldDescriptorProto implements IFieldDescriptorProto {

        /**
         * Constructs a new FieldDescriptorProto.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IFieldDescriptorProto);

        /** FieldDescriptorProto name. */
        public name: string;

        /** FieldDescriptorProto number. */
        public number: number;

        /** FieldDescriptorProto label. */
        public label: google.protobuf.FieldDescriptorProto.Label;

        /** FieldDescriptorProto type. */
        public type: google.protobuf.FieldDescriptorProto.Type;

        /** FieldDescriptorProto typeName. */
        public typeName: string;

        /** FieldDescriptorProto extendee. */
        public extendee: string;

        /** FieldDescriptorProto defaultValue. */
        public defaultValue: string;

        /** FieldDescriptorProto oneofIndex. */
        public oneofIndex: number;

        /** FieldDescriptorProto jsonName. */
        public jsonName: string;

        /** FieldDescriptorProto options. */
        public options?: (google.protobuf.IFieldOptions|null);

        /**
         * Creates a new FieldDescriptorProto instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FieldDescriptorProto instance
         */
        public static create(properties?: google.protobuf.IFieldDescriptorProto): google.protobuf.FieldDescriptorProto;

        /**
         * Encodes the specified FieldDescriptorProto message. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
         * @param message FieldDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IFieldDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FieldDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
         * @param message FieldDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IFieldDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FieldDescriptorProto message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FieldDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldDescriptorProto;

        /**
         * Decodes a FieldDescriptorProto message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FieldDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldDescriptorProto;

        /**
         * Verifies a FieldDescriptorProto message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FieldDescriptorProto message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FieldDescriptorProto
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.FieldDescriptorProto;

        /**
         * Creates a plain object from a FieldDescriptorProto message. Also converts values to other types if specified.
         * @param message FieldDescriptorProto
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.FieldDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FieldDescriptorProto to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace FieldDescriptorProto {

        /** Type enum. */
        enum Type {
          TYPE_DOUBLE = 1,
          TYPE_FLOAT = 2,
          TYPE_INT64 = 3,
          TYPE_UINT64 = 4,
          TYPE_INT32 = 5,
          TYPE_FIXED64 = 6,
          TYPE_FIXED32 = 7,
          TYPE_BOOL = 8,
          TYPE_STRING = 9,
          TYPE_GROUP = 10,
          TYPE_MESSAGE = 11,
          TYPE_BYTES = 12,
          TYPE_UINT32 = 13,
          TYPE_ENUM = 14,
          TYPE_SFIXED32 = 15,
          TYPE_SFIXED64 = 16,
          TYPE_SINT32 = 17,
          TYPE_SINT64 = 18
        }

        /** Label enum. */
        enum Label {
          LABEL_OPTIONAL = 1,
          LABEL_REQUIRED = 2,
          LABEL_REPEATED = 3
        }
      }

      /** Properties of an OneofDescriptorProto. */
      interface IOneofDescriptorProto {

        /** OneofDescriptorProto name */
        name?: (string|null);

        /** OneofDescriptorProto options */
        options?: (google.protobuf.IOneofOptions|null);
      }

      /** Represents an OneofDescriptorProto. */
      class OneofDescriptorProto implements IOneofDescriptorProto {

        /**
         * Constructs a new OneofDescriptorProto.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IOneofDescriptorProto);

        /** OneofDescriptorProto name. */
        public name: string;

        /** OneofDescriptorProto options. */
        public options?: (google.protobuf.IOneofOptions|null);

        /**
         * Creates a new OneofDescriptorProto instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OneofDescriptorProto instance
         */
        public static create(properties?: google.protobuf.IOneofDescriptorProto): google.protobuf.OneofDescriptorProto;

        /**
         * Encodes the specified OneofDescriptorProto message. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
         * @param message OneofDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IOneofDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OneofDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
         * @param message OneofDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IOneofDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OneofDescriptorProto message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OneofDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.OneofDescriptorProto;

        /**
         * Decodes an OneofDescriptorProto message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OneofDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.OneofDescriptorProto;

        /**
         * Verifies an OneofDescriptorProto message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OneofDescriptorProto message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OneofDescriptorProto
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.OneofDescriptorProto;

        /**
         * Creates a plain object from an OneofDescriptorProto message. Also converts values to other types if specified.
         * @param message OneofDescriptorProto
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.OneofDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OneofDescriptorProto to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of an EnumDescriptorProto. */
      interface IEnumDescriptorProto {

        /** EnumDescriptorProto name */
        name?: (string|null);

        /** EnumDescriptorProto value */
        value?: (google.protobuf.IEnumValueDescriptorProto[]|null);

        /** EnumDescriptorProto options */
        options?: (google.protobuf.IEnumOptions|null);

        /** EnumDescriptorProto reservedRange */
        reservedRange?: (google.protobuf.EnumDescriptorProto.IEnumReservedRange[]|null);

        /** EnumDescriptorProto reservedName */
        reservedName?: (string[]|null);
      }

      /** Represents an EnumDescriptorProto. */
      class EnumDescriptorProto implements IEnumDescriptorProto {

        /**
         * Constructs a new EnumDescriptorProto.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IEnumDescriptorProto);

        /** EnumDescriptorProto name. */
        public name: string;

        /** EnumDescriptorProto value. */
        public value: google.protobuf.IEnumValueDescriptorProto[];

        /** EnumDescriptorProto options. */
        public options?: (google.protobuf.IEnumOptions|null);

        /** EnumDescriptorProto reservedRange. */
        public reservedRange: google.protobuf.EnumDescriptorProto.IEnumReservedRange[];

        /** EnumDescriptorProto reservedName. */
        public reservedName: string[];

        /**
         * Creates a new EnumDescriptorProto instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnumDescriptorProto instance
         */
        public static create(properties?: google.protobuf.IEnumDescriptorProto): google.protobuf.EnumDescriptorProto;

        /**
         * Encodes the specified EnumDescriptorProto message. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
         * @param message EnumDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IEnumDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnumDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
         * @param message EnumDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IEnumDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnumDescriptorProto message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnumDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumDescriptorProto;

        /**
         * Decodes an EnumDescriptorProto message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnumDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumDescriptorProto;

        /**
         * Verifies an EnumDescriptorProto message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnumDescriptorProto message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnumDescriptorProto
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.EnumDescriptorProto;

        /**
         * Creates a plain object from an EnumDescriptorProto message. Also converts values to other types if specified.
         * @param message EnumDescriptorProto
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.EnumDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnumDescriptorProto to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace EnumDescriptorProto {

        /** Properties of an EnumReservedRange. */
        interface IEnumReservedRange {

          /** EnumReservedRange start */
          start?: (number|null);

          /** EnumReservedRange end */
          end?: (number|null);
        }

        /** Represents an EnumReservedRange. */
        class EnumReservedRange implements IEnumReservedRange {

          /**
           * Constructs a new EnumReservedRange.
           * @param [properties] Properties to set
           */
          constructor(properties?: google.protobuf.EnumDescriptorProto.IEnumReservedRange);

          /** EnumReservedRange start. */
          public start: number;

          /** EnumReservedRange end. */
          public end: number;

          /**
           * Creates a new EnumReservedRange instance using the specified properties.
           * @param [properties] Properties to set
           * @returns EnumReservedRange instance
           */
          public static create(properties?: google.protobuf.EnumDescriptorProto.IEnumReservedRange): google.protobuf.EnumDescriptorProto.EnumReservedRange;

          /**
           * Encodes the specified EnumReservedRange message. Does not implicitly {@link google.protobuf.EnumDescriptorProto.EnumReservedRange.verify|verify} messages.
           * @param message EnumReservedRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(message: google.protobuf.EnumDescriptorProto.IEnumReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Encodes the specified EnumReservedRange message, length delimited. Does not implicitly {@link google.protobuf.EnumDescriptorProto.EnumReservedRange.verify|verify} messages.
           * @param message EnumReservedRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(message: google.protobuf.EnumDescriptorProto.IEnumReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Decodes an EnumReservedRange message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns EnumReservedRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumDescriptorProto.EnumReservedRange;

          /**
           * Decodes an EnumReservedRange message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns EnumReservedRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumDescriptorProto.EnumReservedRange;

          /**
           * Verifies an EnumReservedRange message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): (string|null);

          /**
           * Creates an EnumReservedRange message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns EnumReservedRange
           */
          public static fromObject(object: { [k: string]: any }): google.protobuf.EnumDescriptorProto.EnumReservedRange;

          /**
           * Creates a plain object from an EnumReservedRange message. Also converts values to other types if specified.
           * @param message EnumReservedRange
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(message: google.protobuf.EnumDescriptorProto.EnumReservedRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

          /**
           * Converts this EnumReservedRange to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };
        }
      }

      /** Properties of an EnumValueDescriptorProto. */
      interface IEnumValueDescriptorProto {

        /** EnumValueDescriptorProto name */
        name?: (string|null);

        /** EnumValueDescriptorProto number */
        number?: (number|null);

        /** EnumValueDescriptorProto options */
        options?: (google.protobuf.IEnumValueOptions|null);
      }

      /** Represents an EnumValueDescriptorProto. */
      class EnumValueDescriptorProto implements IEnumValueDescriptorProto {

        /**
         * Constructs a new EnumValueDescriptorProto.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IEnumValueDescriptorProto);

        /** EnumValueDescriptorProto name. */
        public name: string;

        /** EnumValueDescriptorProto number. */
        public number: number;

        /** EnumValueDescriptorProto options. */
        public options?: (google.protobuf.IEnumValueOptions|null);

        /**
         * Creates a new EnumValueDescriptorProto instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnumValueDescriptorProto instance
         */
        public static create(properties?: google.protobuf.IEnumValueDescriptorProto): google.protobuf.EnumValueDescriptorProto;

        /**
         * Encodes the specified EnumValueDescriptorProto message. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
         * @param message EnumValueDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IEnumValueDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnumValueDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
         * @param message EnumValueDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IEnumValueDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnumValueDescriptorProto message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnumValueDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumValueDescriptorProto;

        /**
         * Decodes an EnumValueDescriptorProto message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnumValueDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumValueDescriptorProto;

        /**
         * Verifies an EnumValueDescriptorProto message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnumValueDescriptorProto message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnumValueDescriptorProto
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.EnumValueDescriptorProto;

        /**
         * Creates a plain object from an EnumValueDescriptorProto message. Also converts values to other types if specified.
         * @param message EnumValueDescriptorProto
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.EnumValueDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnumValueDescriptorProto to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a ServiceDescriptorProto. */
      interface IServiceDescriptorProto {

        /** ServiceDescriptorProto name */
        name?: (string|null);

        /** ServiceDescriptorProto method */
        method?: (google.protobuf.IMethodDescriptorProto[]|null);

        /** ServiceDescriptorProto options */
        options?: (google.protobuf.IServiceOptions|null);
      }

      /** Represents a ServiceDescriptorProto. */
      class ServiceDescriptorProto implements IServiceDescriptorProto {

        /**
         * Constructs a new ServiceDescriptorProto.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IServiceDescriptorProto);

        /** ServiceDescriptorProto name. */
        public name: string;

        /** ServiceDescriptorProto method. */
        public method: google.protobuf.IMethodDescriptorProto[];

        /** ServiceDescriptorProto options. */
        public options?: (google.protobuf.IServiceOptions|null);

        /**
         * Creates a new ServiceDescriptorProto instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ServiceDescriptorProto instance
         */
        public static create(properties?: google.protobuf.IServiceDescriptorProto): google.protobuf.ServiceDescriptorProto;

        /**
         * Encodes the specified ServiceDescriptorProto message. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
         * @param message ServiceDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IServiceDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ServiceDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
         * @param message ServiceDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IServiceDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ServiceDescriptorProto message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ServiceDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ServiceDescriptorProto;

        /**
         * Decodes a ServiceDescriptorProto message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ServiceDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ServiceDescriptorProto;

        /**
         * Verifies a ServiceDescriptorProto message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ServiceDescriptorProto message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ServiceDescriptorProto
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.ServiceDescriptorProto;

        /**
         * Creates a plain object from a ServiceDescriptorProto message. Also converts values to other types if specified.
         * @param message ServiceDescriptorProto
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.ServiceDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ServiceDescriptorProto to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a MethodDescriptorProto. */
      interface IMethodDescriptorProto {

        /** MethodDescriptorProto name */
        name?: (string|null);

        /** MethodDescriptorProto inputType */
        inputType?: (string|null);

        /** MethodDescriptorProto outputType */
        outputType?: (string|null);

        /** MethodDescriptorProto options */
        options?: (google.protobuf.IMethodOptions|null);

        /** MethodDescriptorProto clientStreaming */
        clientStreaming?: (boolean|null);

        /** MethodDescriptorProto serverStreaming */
        serverStreaming?: (boolean|null);
      }

      /** Represents a MethodDescriptorProto. */
      class MethodDescriptorProto implements IMethodDescriptorProto {

        /**
         * Constructs a new MethodDescriptorProto.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IMethodDescriptorProto);

        /** MethodDescriptorProto name. */
        public name: string;

        /** MethodDescriptorProto inputType. */
        public inputType: string;

        /** MethodDescriptorProto outputType. */
        public outputType: string;

        /** MethodDescriptorProto options. */
        public options?: (google.protobuf.IMethodOptions|null);

        /** MethodDescriptorProto clientStreaming. */
        public clientStreaming: boolean;

        /** MethodDescriptorProto serverStreaming. */
        public serverStreaming: boolean;

        /**
         * Creates a new MethodDescriptorProto instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MethodDescriptorProto instance
         */
        public static create(properties?: google.protobuf.IMethodDescriptorProto): google.protobuf.MethodDescriptorProto;

        /**
         * Encodes the specified MethodDescriptorProto message. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
         * @param message MethodDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IMethodDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MethodDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
         * @param message MethodDescriptorProto message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IMethodDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MethodDescriptorProto message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MethodDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MethodDescriptorProto;

        /**
         * Decodes a MethodDescriptorProto message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MethodDescriptorProto
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MethodDescriptorProto;

        /**
         * Verifies a MethodDescriptorProto message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MethodDescriptorProto message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MethodDescriptorProto
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.MethodDescriptorProto;

        /**
         * Creates a plain object from a MethodDescriptorProto message. Also converts values to other types if specified.
         * @param message MethodDescriptorProto
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.MethodDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MethodDescriptorProto to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a FileOptions. */
      interface IFileOptions {

        /** FileOptions javaPackage */
        javaPackage?: (string|null);

        /** FileOptions javaOuterClassname */
        javaOuterClassname?: (string|null);

        /** FileOptions javaMultipleFiles */
        javaMultipleFiles?: (boolean|null);

        /** FileOptions javaGenerateEqualsAndHash */
        javaGenerateEqualsAndHash?: (boolean|null);

        /** FileOptions javaStringCheckUtf8 */
        javaStringCheckUtf8?: (boolean|null);

        /** FileOptions optimizeFor */
        optimizeFor?: (google.protobuf.FileOptions.OptimizeMode|null);

        /** FileOptions goPackage */
        goPackage?: (string|null);

        /** FileOptions ccGenericServices */
        ccGenericServices?: (boolean|null);

        /** FileOptions javaGenericServices */
        javaGenericServices?: (boolean|null);

        /** FileOptions pyGenericServices */
        pyGenericServices?: (boolean|null);

        /** FileOptions phpGenericServices */
        phpGenericServices?: (boolean|null);

        /** FileOptions deprecated */
        deprecated?: (boolean|null);

        /** FileOptions ccEnableArenas */
        ccEnableArenas?: (boolean|null);

        /** FileOptions objcClassPrefix */
        objcClassPrefix?: (string|null);

        /** FileOptions csharpNamespace */
        csharpNamespace?: (string|null);

        /** FileOptions swiftPrefix */
        swiftPrefix?: (string|null);

        /** FileOptions phpClassPrefix */
        phpClassPrefix?: (string|null);

        /** FileOptions phpNamespace */
        phpNamespace?: (string|null);

        /** FileOptions phpMetadataNamespace */
        phpMetadataNamespace?: (string|null);

        /** FileOptions rubyPackage */
        rubyPackage?: (string|null);

        /** FileOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
      }

      /** Represents a FileOptions. */
      class FileOptions implements IFileOptions {

        /**
         * Constructs a new FileOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IFileOptions);

        /** FileOptions javaPackage. */
        public javaPackage: string;

        /** FileOptions javaOuterClassname. */
        public javaOuterClassname: string;

        /** FileOptions javaMultipleFiles. */
        public javaMultipleFiles: boolean;

        /** FileOptions javaGenerateEqualsAndHash. */
        public javaGenerateEqualsAndHash: boolean;

        /** FileOptions javaStringCheckUtf8. */
        public javaStringCheckUtf8: boolean;

        /** FileOptions optimizeFor. */
        public optimizeFor: google.protobuf.FileOptions.OptimizeMode;

        /** FileOptions goPackage. */
        public goPackage: string;

        /** FileOptions ccGenericServices. */
        public ccGenericServices: boolean;

        /** FileOptions javaGenericServices. */
        public javaGenericServices: boolean;

        /** FileOptions pyGenericServices. */
        public pyGenericServices: boolean;

        /** FileOptions phpGenericServices. */
        public phpGenericServices: boolean;

        /** FileOptions deprecated. */
        public deprecated: boolean;

        /** FileOptions ccEnableArenas. */
        public ccEnableArenas: boolean;

        /** FileOptions objcClassPrefix. */
        public objcClassPrefix: string;

        /** FileOptions csharpNamespace. */
        public csharpNamespace: string;

        /** FileOptions swiftPrefix. */
        public swiftPrefix: string;

        /** FileOptions phpClassPrefix. */
        public phpClassPrefix: string;

        /** FileOptions phpNamespace. */
        public phpNamespace: string;

        /** FileOptions phpMetadataNamespace. */
        public phpMetadataNamespace: string;

        /** FileOptions rubyPackage. */
        public rubyPackage: string;

        /** FileOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new FileOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FileOptions instance
         */
        public static create(properties?: google.protobuf.IFileOptions): google.protobuf.FileOptions;

        /**
         * Encodes the specified FileOptions message. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
         * @param message FileOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IFileOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FileOptions message, length delimited. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
         * @param message FileOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IFileOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FileOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FileOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileOptions;

        /**
         * Decodes a FileOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FileOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileOptions;

        /**
         * Verifies a FileOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FileOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FileOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.FileOptions;

        /**
         * Creates a plain object from a FileOptions message. Also converts values to other types if specified.
         * @param message FileOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.FileOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FileOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace FileOptions {

        /** OptimizeMode enum. */
        enum OptimizeMode {
          SPEED = 1,
          CODE_SIZE = 2,
          LITE_RUNTIME = 3
        }
      }

      /** Properties of a MessageOptions. */
      interface IMessageOptions {

        /** MessageOptions messageSetWireFormat */
        messageSetWireFormat?: (boolean|null);

        /** MessageOptions noStandardDescriptorAccessor */
        noStandardDescriptorAccessor?: (boolean|null);

        /** MessageOptions deprecated */
        deprecated?: (boolean|null);

        /** MessageOptions mapEntry */
        mapEntry?: (boolean|null);

        /** MessageOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
      }

      /** Represents a MessageOptions. */
      class MessageOptions implements IMessageOptions {

        /**
         * Constructs a new MessageOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IMessageOptions);

        /** MessageOptions messageSetWireFormat. */
        public messageSetWireFormat: boolean;

        /** MessageOptions noStandardDescriptorAccessor. */
        public noStandardDescriptorAccessor: boolean;

        /** MessageOptions deprecated. */
        public deprecated: boolean;

        /** MessageOptions mapEntry. */
        public mapEntry: boolean;

        /** MessageOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new MessageOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageOptions instance
         */
        public static create(properties?: google.protobuf.IMessageOptions): google.protobuf.MessageOptions;

        /**
         * Encodes the specified MessageOptions message. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
         * @param message MessageOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IMessageOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageOptions message, length delimited. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
         * @param message MessageOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IMessageOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MessageOptions;

        /**
         * Decodes a MessageOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MessageOptions;

        /**
         * Verifies a MessageOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.MessageOptions;

        /**
         * Creates a plain object from a MessageOptions message. Also converts values to other types if specified.
         * @param message MessageOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.MessageOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a FieldOptions. */
      interface IFieldOptions {

        /** FieldOptions ctype */
        ctype?: (google.protobuf.FieldOptions.CType|null);

        /** FieldOptions packed */
        packed?: (boolean|null);

        /** FieldOptions jstype */
        jstype?: (google.protobuf.FieldOptions.JSType|null);

        /** FieldOptions lazy */
        lazy?: (boolean|null);

        /** FieldOptions deprecated */
        deprecated?: (boolean|null);

        /** FieldOptions weak */
        weak?: (boolean|null);

        /** FieldOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
      }

      /** Represents a FieldOptions. */
      class FieldOptions implements IFieldOptions {

        /**
         * Constructs a new FieldOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IFieldOptions);

        /** FieldOptions ctype. */
        public ctype: google.protobuf.FieldOptions.CType;

        /** FieldOptions packed. */
        public packed: boolean;

        /** FieldOptions jstype. */
        public jstype: google.protobuf.FieldOptions.JSType;

        /** FieldOptions lazy. */
        public lazy: boolean;

        /** FieldOptions deprecated. */
        public deprecated: boolean;

        /** FieldOptions weak. */
        public weak: boolean;

        /** FieldOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new FieldOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FieldOptions instance
         */
        public static create(properties?: google.protobuf.IFieldOptions): google.protobuf.FieldOptions;

        /**
         * Encodes the specified FieldOptions message. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
         * @param message FieldOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IFieldOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FieldOptions message, length delimited. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
         * @param message FieldOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IFieldOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FieldOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FieldOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldOptions;

        /**
         * Decodes a FieldOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FieldOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldOptions;

        /**
         * Verifies a FieldOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FieldOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FieldOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.FieldOptions;

        /**
         * Creates a plain object from a FieldOptions message. Also converts values to other types if specified.
         * @param message FieldOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.FieldOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FieldOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace FieldOptions {

        /** CType enum. */
        enum CType {
          STRING = 0,
          CORD = 1,
          STRING_PIECE = 2
        }

        /** JSType enum. */
        enum JSType {
          JS_NORMAL = 0,
          JS_STRING = 1,
          JS_NUMBER = 2
        }
      }

      /** Properties of an OneofOptions. */
      interface IOneofOptions {

        /** OneofOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
      }

      /** Represents an OneofOptions. */
      class OneofOptions implements IOneofOptions {

        /**
         * Constructs a new OneofOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IOneofOptions);

        /** OneofOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new OneofOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OneofOptions instance
         */
        public static create(properties?: google.protobuf.IOneofOptions): google.protobuf.OneofOptions;

        /**
         * Encodes the specified OneofOptions message. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
         * @param message OneofOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IOneofOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OneofOptions message, length delimited. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
         * @param message OneofOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IOneofOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OneofOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OneofOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.OneofOptions;

        /**
         * Decodes an OneofOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OneofOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.OneofOptions;

        /**
         * Verifies an OneofOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OneofOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OneofOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.OneofOptions;

        /**
         * Creates a plain object from an OneofOptions message. Also converts values to other types if specified.
         * @param message OneofOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.OneofOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OneofOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of an EnumOptions. */
      interface IEnumOptions {

        /** EnumOptions allowAlias */
        allowAlias?: (boolean|null);

        /** EnumOptions deprecated */
        deprecated?: (boolean|null);

        /** EnumOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
      }

      /** Represents an EnumOptions. */
      class EnumOptions implements IEnumOptions {

        /**
         * Constructs a new EnumOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IEnumOptions);

        /** EnumOptions allowAlias. */
        public allowAlias: boolean;

        /** EnumOptions deprecated. */
        public deprecated: boolean;

        /** EnumOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new EnumOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnumOptions instance
         */
        public static create(properties?: google.protobuf.IEnumOptions): google.protobuf.EnumOptions;

        /**
         * Encodes the specified EnumOptions message. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
         * @param message EnumOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IEnumOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnumOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
         * @param message EnumOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IEnumOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnumOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnumOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumOptions;

        /**
         * Decodes an EnumOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnumOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumOptions;

        /**
         * Verifies an EnumOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnumOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnumOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.EnumOptions;

        /**
         * Creates a plain object from an EnumOptions message. Also converts values to other types if specified.
         * @param message EnumOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.EnumOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnumOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of an EnumValueOptions. */
      interface IEnumValueOptions {

        /** EnumValueOptions deprecated */
        deprecated?: (boolean|null);

        /** EnumValueOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
      }

      /** Represents an EnumValueOptions. */
      class EnumValueOptions implements IEnumValueOptions {

        /**
         * Constructs a new EnumValueOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IEnumValueOptions);

        /** EnumValueOptions deprecated. */
        public deprecated: boolean;

        /** EnumValueOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new EnumValueOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnumValueOptions instance
         */
        public static create(properties?: google.protobuf.IEnumValueOptions): google.protobuf.EnumValueOptions;

        /**
         * Encodes the specified EnumValueOptions message. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
         * @param message EnumValueOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IEnumValueOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnumValueOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
         * @param message EnumValueOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IEnumValueOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnumValueOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnumValueOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumValueOptions;

        /**
         * Decodes an EnumValueOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnumValueOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumValueOptions;

        /**
         * Verifies an EnumValueOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnumValueOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnumValueOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.EnumValueOptions;

        /**
         * Creates a plain object from an EnumValueOptions message. Also converts values to other types if specified.
         * @param message EnumValueOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.EnumValueOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnumValueOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a ServiceOptions. */
      interface IServiceOptions {

        /** ServiceOptions deprecated */
        deprecated?: (boolean|null);

        /** ServiceOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

        /** ServiceOptions .google.api.defaultHost */
        ".google.api.defaultHost"?: (string|null);

        /** ServiceOptions .google.api.oauthScopes */
        ".google.api.oauthScopes"?: (string|null);
      }

      /** Represents a ServiceOptions. */
      class ServiceOptions implements IServiceOptions {

        /**
         * Constructs a new ServiceOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IServiceOptions);

        /** ServiceOptions deprecated. */
        public deprecated: boolean;

        /** ServiceOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new ServiceOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ServiceOptions instance
         */
        public static create(properties?: google.protobuf.IServiceOptions): google.protobuf.ServiceOptions;

        /**
         * Encodes the specified ServiceOptions message. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
         * @param message ServiceOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IServiceOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ServiceOptions message, length delimited. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
         * @param message ServiceOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IServiceOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ServiceOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ServiceOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ServiceOptions;

        /**
         * Decodes a ServiceOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ServiceOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ServiceOptions;

        /**
         * Verifies a ServiceOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ServiceOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ServiceOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.ServiceOptions;

        /**
         * Creates a plain object from a ServiceOptions message. Also converts values to other types if specified.
         * @param message ServiceOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.ServiceOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ServiceOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a MethodOptions. */
      interface IMethodOptions {

        /** MethodOptions deprecated */
        deprecated?: (boolean|null);

        /** MethodOptions idempotencyLevel */
        idempotencyLevel?: (google.protobuf.MethodOptions.IdempotencyLevel|null);

        /** MethodOptions uninterpretedOption */
        uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

        /** MethodOptions .google.api.http */
        ".google.api.http"?: (google.api.IHttpRule|null);

        /** MethodOptions .google.api.methodSignature */
        ".google.api.methodSignature"?: (string[]|null);

        /** MethodOptions .google.longrunning.operationInfo */
        ".google.longrunning.operationInfo"?: (google.longrunning.IOperationInfo|null);
      }

      /** Represents a MethodOptions. */
      class MethodOptions implements IMethodOptions {

        /**
         * Constructs a new MethodOptions.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IMethodOptions);

        /** MethodOptions deprecated. */
        public deprecated: boolean;

        /** MethodOptions idempotencyLevel. */
        public idempotencyLevel: google.protobuf.MethodOptions.IdempotencyLevel;

        /** MethodOptions uninterpretedOption. */
        public uninterpretedOption: google.protobuf.IUninterpretedOption[];

        /**
         * Creates a new MethodOptions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MethodOptions instance
         */
        public static create(properties?: google.protobuf.IMethodOptions): google.protobuf.MethodOptions;

        /**
         * Encodes the specified MethodOptions message. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
         * @param message MethodOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IMethodOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MethodOptions message, length delimited. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
         * @param message MethodOptions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IMethodOptions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MethodOptions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MethodOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MethodOptions;

        /**
         * Decodes a MethodOptions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MethodOptions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MethodOptions;

        /**
         * Verifies a MethodOptions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MethodOptions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MethodOptions
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.MethodOptions;

        /**
         * Creates a plain object from a MethodOptions message. Also converts values to other types if specified.
         * @param message MethodOptions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.MethodOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MethodOptions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace MethodOptions {

        /** IdempotencyLevel enum. */
        enum IdempotencyLevel {
          IDEMPOTENCY_UNKNOWN = 0,
          NO_SIDE_EFFECTS = 1,
          IDEMPOTENT = 2
        }
      }

      /** Properties of an UninterpretedOption. */
      interface IUninterpretedOption {

        /** UninterpretedOption name */
        name?: (google.protobuf.UninterpretedOption.INamePart[]|null);

        /** UninterpretedOption identifierValue */
        identifierValue?: (string|null);

        /** UninterpretedOption positiveIntValue */
        positiveIntValue?: (number|Long|null);

        /** UninterpretedOption negativeIntValue */
        negativeIntValue?: (number|Long|null);

        /** UninterpretedOption doubleValue */
        doubleValue?: (number|null);

        /** UninterpretedOption stringValue */
        stringValue?: (Uint8Array|null);

        /** UninterpretedOption aggregateValue */
        aggregateValue?: (string|null);
      }

      /** Represents an UninterpretedOption. */
      class UninterpretedOption implements IUninterpretedOption {

        /**
         * Constructs a new UninterpretedOption.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IUninterpretedOption);

        /** UninterpretedOption name. */
        public name: google.protobuf.UninterpretedOption.INamePart[];

        /** UninterpretedOption identifierValue. */
        public identifierValue: string;

        /** UninterpretedOption positiveIntValue. */
        public positiveIntValue: (number|Long);

        /** UninterpretedOption negativeIntValue. */
        public negativeIntValue: (number|Long);

        /** UninterpretedOption doubleValue. */
        public doubleValue: number;

        /** UninterpretedOption stringValue. */
        public stringValue: Uint8Array;

        /** UninterpretedOption aggregateValue. */
        public aggregateValue: string;

        /**
         * Creates a new UninterpretedOption instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UninterpretedOption instance
         */
        public static create(properties?: google.protobuf.IUninterpretedOption): google.protobuf.UninterpretedOption;

        /**
         * Encodes the specified UninterpretedOption message. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
         * @param message UninterpretedOption message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IUninterpretedOption, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UninterpretedOption message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
         * @param message UninterpretedOption message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IUninterpretedOption, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UninterpretedOption message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UninterpretedOption
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.UninterpretedOption;

        /**
         * Decodes an UninterpretedOption message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UninterpretedOption
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.UninterpretedOption;

        /**
         * Verifies an UninterpretedOption message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an UninterpretedOption message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UninterpretedOption
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.UninterpretedOption;

        /**
         * Creates a plain object from an UninterpretedOption message. Also converts values to other types if specified.
         * @param message UninterpretedOption
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.UninterpretedOption, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UninterpretedOption to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace UninterpretedOption {

        /** Properties of a NamePart. */
        interface INamePart {

          /** NamePart namePart */
          namePart: string;

          /** NamePart isExtension */
          isExtension: boolean;
        }

        /** Represents a NamePart. */
        class NamePart implements INamePart {

          /**
           * Constructs a new NamePart.
           * @param [properties] Properties to set
           */
          constructor(properties?: google.protobuf.UninterpretedOption.INamePart);

          /** NamePart namePart. */
          public namePart: string;

          /** NamePart isExtension. */
          public isExtension: boolean;

          /**
           * Creates a new NamePart instance using the specified properties.
           * @param [properties] Properties to set
           * @returns NamePart instance
           */
          public static create(properties?: google.protobuf.UninterpretedOption.INamePart): google.protobuf.UninterpretedOption.NamePart;

          /**
           * Encodes the specified NamePart message. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
           * @param message NamePart message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(message: google.protobuf.UninterpretedOption.INamePart, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Encodes the specified NamePart message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
           * @param message NamePart message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(message: google.protobuf.UninterpretedOption.INamePart, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Decodes a NamePart message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns NamePart
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.UninterpretedOption.NamePart;

          /**
           * Decodes a NamePart message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns NamePart
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.UninterpretedOption.NamePart;

          /**
           * Verifies a NamePart message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): (string|null);

          /**
           * Creates a NamePart message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns NamePart
           */
          public static fromObject(object: { [k: string]: any }): google.protobuf.UninterpretedOption.NamePart;

          /**
           * Creates a plain object from a NamePart message. Also converts values to other types if specified.
           * @param message NamePart
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(message: google.protobuf.UninterpretedOption.NamePart, options?: $protobuf.IConversionOptions): { [k: string]: any };

          /**
           * Converts this NamePart to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };
        }
      }

      /** Properties of a SourceCodeInfo. */
      interface ISourceCodeInfo {

        /** SourceCodeInfo location */
        location?: (google.protobuf.SourceCodeInfo.ILocation[]|null);
      }

      /** Represents a SourceCodeInfo. */
      class SourceCodeInfo implements ISourceCodeInfo {

        /**
         * Constructs a new SourceCodeInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.ISourceCodeInfo);

        /** SourceCodeInfo location. */
        public location: google.protobuf.SourceCodeInfo.ILocation[];

        /**
         * Creates a new SourceCodeInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SourceCodeInfo instance
         */
        public static create(properties?: google.protobuf.ISourceCodeInfo): google.protobuf.SourceCodeInfo;

        /**
         * Encodes the specified SourceCodeInfo message. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
         * @param message SourceCodeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.ISourceCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SourceCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
         * @param message SourceCodeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.ISourceCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SourceCodeInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SourceCodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.SourceCodeInfo;

        /**
         * Decodes a SourceCodeInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SourceCodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.SourceCodeInfo;

        /**
         * Verifies a SourceCodeInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SourceCodeInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SourceCodeInfo
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.SourceCodeInfo;

        /**
         * Creates a plain object from a SourceCodeInfo message. Also converts values to other types if specified.
         * @param message SourceCodeInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.SourceCodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SourceCodeInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace SourceCodeInfo {

        /** Properties of a Location. */
        interface ILocation {

          /** Location path */
          path?: (number[]|null);

          /** Location span */
          span?: (number[]|null);

          /** Location leadingComments */
          leadingComments?: (string|null);

          /** Location trailingComments */
          trailingComments?: (string|null);

          /** Location leadingDetachedComments */
          leadingDetachedComments?: (string[]|null);
        }

        /** Represents a Location. */
        class Location implements ILocation {

          /**
           * Constructs a new Location.
           * @param [properties] Properties to set
           */
          constructor(properties?: google.protobuf.SourceCodeInfo.ILocation);

          /** Location path. */
          public path: number[];

          /** Location span. */
          public span: number[];

          /** Location leadingComments. */
          public leadingComments: string;

          /** Location trailingComments. */
          public trailingComments: string;

          /** Location leadingDetachedComments. */
          public leadingDetachedComments: string[];

          /**
           * Creates a new Location instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Location instance
           */
          public static create(properties?: google.protobuf.SourceCodeInfo.ILocation): google.protobuf.SourceCodeInfo.Location;

          /**
           * Encodes the specified Location message. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
           * @param message Location message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(message: google.protobuf.SourceCodeInfo.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Encodes the specified Location message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
           * @param message Location message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(message: google.protobuf.SourceCodeInfo.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Decodes a Location message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Location
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.SourceCodeInfo.Location;

          /**
           * Decodes a Location message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Location
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.SourceCodeInfo.Location;

          /**
           * Verifies a Location message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): (string|null);

          /**
           * Creates a Location message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Location
           */
          public static fromObject(object: { [k: string]: any }): google.protobuf.SourceCodeInfo.Location;

          /**
           * Creates a plain object from a Location message. Also converts values to other types if specified.
           * @param message Location
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(message: google.protobuf.SourceCodeInfo.Location, options?: $protobuf.IConversionOptions): { [k: string]: any };

          /**
           * Converts this Location to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };
        }
      }

      /** Properties of a GeneratedCodeInfo. */
      interface IGeneratedCodeInfo {

        /** GeneratedCodeInfo annotation */
        annotation?: (google.protobuf.GeneratedCodeInfo.IAnnotation[]|null);
      }

      /** Represents a GeneratedCodeInfo. */
      class GeneratedCodeInfo implements IGeneratedCodeInfo {

        /**
         * Constructs a new GeneratedCodeInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IGeneratedCodeInfo);

        /** GeneratedCodeInfo annotation. */
        public annotation: google.protobuf.GeneratedCodeInfo.IAnnotation[];

        /**
         * Creates a new GeneratedCodeInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GeneratedCodeInfo instance
         */
        public static create(properties?: google.protobuf.IGeneratedCodeInfo): google.protobuf.GeneratedCodeInfo;

        /**
         * Encodes the specified GeneratedCodeInfo message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
         * @param message GeneratedCodeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IGeneratedCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GeneratedCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
         * @param message GeneratedCodeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IGeneratedCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GeneratedCodeInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GeneratedCodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.GeneratedCodeInfo;

        /**
         * Decodes a GeneratedCodeInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GeneratedCodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.GeneratedCodeInfo;

        /**
         * Verifies a GeneratedCodeInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GeneratedCodeInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GeneratedCodeInfo
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.GeneratedCodeInfo;

        /**
         * Creates a plain object from a GeneratedCodeInfo message. Also converts values to other types if specified.
         * @param message GeneratedCodeInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.GeneratedCodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GeneratedCodeInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      namespace GeneratedCodeInfo {

        /** Properties of an Annotation. */
        interface IAnnotation {

          /** Annotation path */
          path?: (number[]|null);

          /** Annotation sourceFile */
          sourceFile?: (string|null);

          /** Annotation begin */
          begin?: (number|null);

          /** Annotation end */
          end?: (number|null);
        }

        /** Represents an Annotation. */
        class Annotation implements IAnnotation {

          /**
           * Constructs a new Annotation.
           * @param [properties] Properties to set
           */
          constructor(properties?: google.protobuf.GeneratedCodeInfo.IAnnotation);

          /** Annotation path. */
          public path: number[];

          /** Annotation sourceFile. */
          public sourceFile: string;

          /** Annotation begin. */
          public begin: number;

          /** Annotation end. */
          public end: number;

          /**
           * Creates a new Annotation instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Annotation instance
           */
          public static create(properties?: google.protobuf.GeneratedCodeInfo.IAnnotation): google.protobuf.GeneratedCodeInfo.Annotation;

          /**
           * Encodes the specified Annotation message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
           * @param message Annotation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(message: google.protobuf.GeneratedCodeInfo.IAnnotation, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Encodes the specified Annotation message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
           * @param message Annotation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(message: google.protobuf.GeneratedCodeInfo.IAnnotation, writer?: $protobuf.Writer): $protobuf.Writer;

          /**
           * Decodes an Annotation message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Annotation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.GeneratedCodeInfo.Annotation;

          /**
           * Decodes an Annotation message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Annotation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.GeneratedCodeInfo.Annotation;

          /**
           * Verifies an Annotation message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): (string|null);

          /**
           * Creates an Annotation message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Annotation
           */
          public static fromObject(object: { [k: string]: any }): google.protobuf.GeneratedCodeInfo.Annotation;

          /**
           * Creates a plain object from an Annotation message. Also converts values to other types if specified.
           * @param message Annotation
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(message: google.protobuf.GeneratedCodeInfo.Annotation, options?: $protobuf.IConversionOptions): { [k: string]: any };

          /**
           * Converts this Annotation to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };
        }
      }

      /** Properties of an Any. */
      interface IAny {

        /** Any type_url */
        type_url?: (string|null);

        /** Any value */
        value?: (Uint8Array|null);
      }

      /** Represents an Any. */
      class Any implements IAny {

        /**
         * Constructs a new Any.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IAny);

        /** Any type_url. */
        public type_url: string;

        /** Any value. */
        public value: Uint8Array;

        /**
         * Creates a new Any instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Any instance
         */
        public static create(properties?: google.protobuf.IAny): google.protobuf.Any;

        /**
         * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
         * @param message Any message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
         * @param message Any message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Any message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Any
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Any;

        /**
         * Decodes an Any message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Any
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Any;

        /**
         * Verifies an Any message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Any message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Any
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.Any;

        /**
         * Creates a plain object from an Any message. Also converts values to other types if specified.
         * @param message Any
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.Any, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Any to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of an Empty. */
      interface IEmpty {
      }

      /** Represents an Empty. */
      class Empty implements IEmpty {

        /**
         * Constructs a new Empty.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IEmpty);

        /**
         * Creates a new Empty instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Empty instance
         */
        public static create(properties?: google.protobuf.IEmpty): google.protobuf.Empty;

        /**
         * Encodes the specified Empty message. Does not implicitly {@link google.protobuf.Empty.verify|verify} messages.
         * @param message Empty message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IEmpty, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Empty message, length delimited. Does not implicitly {@link google.protobuf.Empty.verify|verify} messages.
         * @param message Empty message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IEmpty, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Empty message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Empty
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Empty;

        /**
         * Decodes an Empty message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Empty
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Empty;

        /**
         * Verifies an Empty message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Empty message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Empty
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.Empty;

        /**
         * Creates a plain object from an Empty message. Also converts values to other types if specified.
         * @param message Empty
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.Empty, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Empty to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a Timestamp. */
      interface ITimestamp {

        /** Timestamp seconds */
        seconds?: (number|Long|null);

        /** Timestamp nanos */
        nanos?: (number|null);
      }

      /** Represents a Timestamp. */
      class Timestamp implements ITimestamp {

        /**
         * Constructs a new Timestamp.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.ITimestamp);

        /** Timestamp seconds. */
        public seconds: (number|Long);

        /** Timestamp nanos. */
        public nanos: number;

        /**
         * Creates a new Timestamp instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Timestamp instance
         */
        public static create(properties?: google.protobuf.ITimestamp): google.protobuf.Timestamp;

        /**
         * Encodes the specified Timestamp message. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
         * @param message Timestamp message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
         * @param message Timestamp message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Timestamp message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Timestamp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Timestamp;

        /**
         * Decodes a Timestamp message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Timestamp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Timestamp;

        /**
         * Verifies a Timestamp message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Timestamp
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.Timestamp;

        /**
         * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
         * @param message Timestamp
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.Timestamp, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Timestamp to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a FieldMask. */
      interface IFieldMask {

        /** FieldMask paths */
        paths?: (string[]|null);
      }

      /** Represents a FieldMask. */
      class FieldMask implements IFieldMask {

        /**
         * Constructs a new FieldMask.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IFieldMask);

        /** FieldMask paths. */
        public paths: string[];

        /**
         * Creates a new FieldMask instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FieldMask instance
         */
        public static create(properties?: google.protobuf.IFieldMask): google.protobuf.FieldMask;

        /**
         * Encodes the specified FieldMask message. Does not implicitly {@link google.protobuf.FieldMask.verify|verify} messages.
         * @param message FieldMask message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IFieldMask, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FieldMask message, length delimited. Does not implicitly {@link google.protobuf.FieldMask.verify|verify} messages.
         * @param message FieldMask message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IFieldMask, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FieldMask message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FieldMask
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldMask;

        /**
         * Decodes a FieldMask message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FieldMask
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldMask;

        /**
         * Verifies a FieldMask message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FieldMask message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FieldMask
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.FieldMask;

        /**
         * Creates a plain object from a FieldMask message. Also converts values to other types if specified.
         * @param message FieldMask
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.FieldMask, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FieldMask to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a Struct. */
      interface IStruct {

        /** Struct fields */
        fields?: ({ [k: string]: google.protobuf.IValue }|null);
      }

      /** Represents a Struct. */
      class Struct implements IStruct {

        /**
         * Constructs a new Struct.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IStruct);

        /** Struct fields. */
        public fields: { [k: string]: google.protobuf.IValue };

        /**
         * Creates a new Struct instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Struct instance
         */
        public static create(properties?: google.protobuf.IStruct): google.protobuf.Struct;

        /**
         * Encodes the specified Struct message. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
         * @param message Struct message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Struct message, length delimited. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
         * @param message Struct message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Struct message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Struct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Struct;

        /**
         * Decodes a Struct message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Struct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Struct;

        /**
         * Verifies a Struct message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Struct message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Struct
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.Struct;

        /**
         * Creates a plain object from a Struct message. Also converts values to other types if specified.
         * @param message Struct
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.Struct, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Struct to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a Value. */
      interface IValue {

        /** Value nullValue */
        nullValue?: (google.protobuf.NullValue|null);

        /** Value numberValue */
        numberValue?: (number|null);

        /** Value stringValue */
        stringValue?: (string|null);

        /** Value boolValue */
        boolValue?: (boolean|null);

        /** Value structValue */
        structValue?: (google.protobuf.IStruct|null);

        /** Value listValue */
        listValue?: (google.protobuf.IListValue|null);
      }

      /** Represents a Value. */
      class Value implements IValue {

        /**
         * Constructs a new Value.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IValue);

        /** Value nullValue. */
        public nullValue: google.protobuf.NullValue;

        /** Value numberValue. */
        public numberValue: number;

        /** Value stringValue. */
        public stringValue: string;

        /** Value boolValue. */
        public boolValue: boolean;

        /** Value structValue. */
        public structValue?: (google.protobuf.IStruct|null);

        /** Value listValue. */
        public listValue?: (google.protobuf.IListValue|null);

        /** Value kind. */
        public kind?: ("nullValue"|"numberValue"|"stringValue"|"boolValue"|"structValue"|"listValue");

        /**
         * Creates a new Value instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Value instance
         */
        public static create(properties?: google.protobuf.IValue): google.protobuf.Value;

        /**
         * Encodes the specified Value message. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
         * @param message Value message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Value message, length delimited. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
         * @param message Value message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Value message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Value
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Value;

        /**
         * Decodes a Value message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Value
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Value;

        /**
         * Verifies a Value message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Value message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Value
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.Value;

        /**
         * Creates a plain object from a Value message. Also converts values to other types if specified.
         * @param message Value
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.Value, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Value to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** NullValue enum. */
      enum NullValue {
        NULL_VALUE = 0
      }

      /** Properties of a ListValue. */
      interface IListValue {

        /** ListValue values */
        values?: (google.protobuf.IValue[]|null);
      }

      /** Represents a ListValue. */
      class ListValue implements IListValue {

        /**
         * Constructs a new ListValue.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.protobuf.IListValue);

        /** ListValue values. */
        public values: google.protobuf.IValue[];

        /**
         * Creates a new ListValue instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ListValue instance
         */
        public static create(properties?: google.protobuf.IListValue): google.protobuf.ListValue;

        /**
         * Encodes the specified ListValue message. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
         * @param message ListValue message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ListValue message, length delimited. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
         * @param message ListValue message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ListValue message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ListValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ListValue;

        /**
         * Decodes a ListValue message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ListValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ListValue;

        /**
         * Verifies a ListValue message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ListValue message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ListValue
         */
        public static fromObject(object: { [k: string]: any }): google.protobuf.ListValue;

        /**
         * Creates a plain object from a ListValue message. Also converts values to other types if specified.
         * @param message ListValue
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.protobuf.ListValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ListValue to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }
    }

    /** Namespace iam. */
    namespace iam {

        /** Namespace v1. */
        namespace v1 {

            /** Represents a IAMPolicy */
            class IAMPolicy extends $protobuf.rpc.Service {

                /**
                 * Constructs a new IAMPolicy service.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 */
                constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

                /**
                 * Creates new IAMPolicy service using the specified rpc implementation.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 * @returns RPC service. Useful where requests and/or responses are streamed.
                 */
                public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): IAMPolicy;

                /**
                 * Calls SetIamPolicy.
                 * @param request SetIamPolicyRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Policy
                 */
                public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest, callback: google.iam.v1.IAMPolicy.SetIamPolicyCallback): void;

                /**
                 * Calls SetIamPolicy.
                 * @param request SetIamPolicyRequest message or plain object
                 * @returns Promise
                 */
                public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                /**
                 * Calls GetIamPolicy.
                 * @param request GetIamPolicyRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Policy
                 */
                public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest, callback: google.iam.v1.IAMPolicy.GetIamPolicyCallback): void;

                /**
                 * Calls GetIamPolicy.
                 * @param request GetIamPolicyRequest message or plain object
                 * @returns Promise
                 */
                public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                /**
                 * Calls TestIamPermissions.
                 * @param request TestIamPermissionsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and TestIamPermissionsResponse
                 */
                public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest, callback: google.iam.v1.IAMPolicy.TestIamPermissionsCallback): void;

                /**
                 * Calls TestIamPermissions.
                 * @param request TestIamPermissionsRequest message or plain object
                 * @returns Promise
                 */
                public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest): Promise<google.iam.v1.TestIamPermissionsResponse>;
            }

            namespace IAMPolicy {

                /**
                 * Callback as used by {@link google.iam.v1.IAMPolicy#setIamPolicy}.
                 * @param error Error, if any
                 * @param [response] Policy
                 */
                type SetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                /**
                 * Callback as used by {@link google.iam.v1.IAMPolicy#getIamPolicy}.
                 * @param error Error, if any
                 * @param [response] Policy
                 */
                type GetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                /**
                 * Callback as used by {@link google.iam.v1.IAMPolicy#testIamPermissions}.
                 * @param error Error, if any
                 * @param [response] TestIamPermissionsResponse
                 */
                type TestIamPermissionsCallback = (error: (Error|null), response?: google.iam.v1.TestIamPermissionsResponse) => void;
            }

            /** Properties of a SetIamPolicyRequest. */
            interface ISetIamPolicyRequest {

                /** SetIamPolicyRequest resource */
                resource?: (string|null);

                /** SetIamPolicyRequest policy */
                policy?: (google.iam.v1.IPolicy|null);
            }

            /** Represents a SetIamPolicyRequest. */
            class SetIamPolicyRequest implements ISetIamPolicyRequest {

                /**
                 * Constructs a new SetIamPolicyRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.ISetIamPolicyRequest);

                /** SetIamPolicyRequest resource. */
                public resource: string;

                /** SetIamPolicyRequest policy. */
                public policy?: (google.iam.v1.IPolicy|null);

                /**
                 * Creates a new SetIamPolicyRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns SetIamPolicyRequest instance
                 */
                public static create(properties?: google.iam.v1.ISetIamPolicyRequest): google.iam.v1.SetIamPolicyRequest;

                /**
                 * Encodes the specified SetIamPolicyRequest message. Does not implicitly {@link google.iam.v1.SetIamPolicyRequest.verify|verify} messages.
                 * @param message SetIamPolicyRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.ISetIamPolicyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified SetIamPolicyRequest message, length delimited. Does not implicitly {@link google.iam.v1.SetIamPolicyRequest.verify|verify} messages.
                 * @param message SetIamPolicyRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.ISetIamPolicyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a SetIamPolicyRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns SetIamPolicyRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.SetIamPolicyRequest;

                /**
                 * Decodes a SetIamPolicyRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns SetIamPolicyRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.SetIamPolicyRequest;

                /**
                 * Verifies a SetIamPolicyRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a SetIamPolicyRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns SetIamPolicyRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.SetIamPolicyRequest;

                /**
                 * Creates a plain object from a SetIamPolicyRequest message. Also converts values to other types if specified.
                 * @param message SetIamPolicyRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.SetIamPolicyRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this SetIamPolicyRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a GetIamPolicyRequest. */
            interface IGetIamPolicyRequest {

                /** GetIamPolicyRequest resource */
                resource?: (string|null);
            }

            /** Represents a GetIamPolicyRequest. */
            class GetIamPolicyRequest implements IGetIamPolicyRequest {

                /**
                 * Constructs a new GetIamPolicyRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IGetIamPolicyRequest);

                /** GetIamPolicyRequest resource. */
                public resource: string;

                /**
                 * Creates a new GetIamPolicyRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns GetIamPolicyRequest instance
                 */
                public static create(properties?: google.iam.v1.IGetIamPolicyRequest): google.iam.v1.GetIamPolicyRequest;

                /**
                 * Encodes the specified GetIamPolicyRequest message. Does not implicitly {@link google.iam.v1.GetIamPolicyRequest.verify|verify} messages.
                 * @param message GetIamPolicyRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IGetIamPolicyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GetIamPolicyRequest message, length delimited. Does not implicitly {@link google.iam.v1.GetIamPolicyRequest.verify|verify} messages.
                 * @param message GetIamPolicyRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IGetIamPolicyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GetIamPolicyRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GetIamPolicyRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.GetIamPolicyRequest;

                /**
                 * Decodes a GetIamPolicyRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GetIamPolicyRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.GetIamPolicyRequest;

                /**
                 * Verifies a GetIamPolicyRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a GetIamPolicyRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns GetIamPolicyRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.GetIamPolicyRequest;

                /**
                 * Creates a plain object from a GetIamPolicyRequest message. Also converts values to other types if specified.
                 * @param message GetIamPolicyRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.GetIamPolicyRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GetIamPolicyRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TestIamPermissionsRequest. */
            interface ITestIamPermissionsRequest {

                /** TestIamPermissionsRequest resource */
                resource?: (string|null);

                /** TestIamPermissionsRequest permissions */
                permissions?: (string[]|null);
            }

            /** Represents a TestIamPermissionsRequest. */
            class TestIamPermissionsRequest implements ITestIamPermissionsRequest {

                /**
                 * Constructs a new TestIamPermissionsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.ITestIamPermissionsRequest);

                /** TestIamPermissionsRequest resource. */
                public resource: string;

                /** TestIamPermissionsRequest permissions. */
                public permissions: string[];

                /**
                 * Creates a new TestIamPermissionsRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TestIamPermissionsRequest instance
                 */
                public static create(properties?: google.iam.v1.ITestIamPermissionsRequest): google.iam.v1.TestIamPermissionsRequest;

                /**
                 * Encodes the specified TestIamPermissionsRequest message. Does not implicitly {@link google.iam.v1.TestIamPermissionsRequest.verify|verify} messages.
                 * @param message TestIamPermissionsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.ITestIamPermissionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TestIamPermissionsRequest message, length delimited. Does not implicitly {@link google.iam.v1.TestIamPermissionsRequest.verify|verify} messages.
                 * @param message TestIamPermissionsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.ITestIamPermissionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TestIamPermissionsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TestIamPermissionsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.TestIamPermissionsRequest;

                /**
                 * Decodes a TestIamPermissionsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TestIamPermissionsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.TestIamPermissionsRequest;

                /**
                 * Verifies a TestIamPermissionsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TestIamPermissionsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TestIamPermissionsRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.TestIamPermissionsRequest;

                /**
                 * Creates a plain object from a TestIamPermissionsRequest message. Also converts values to other types if specified.
                 * @param message TestIamPermissionsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.TestIamPermissionsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TestIamPermissionsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TestIamPermissionsResponse. */
            interface ITestIamPermissionsResponse {

                /** TestIamPermissionsResponse permissions */
                permissions?: (string[]|null);
            }

            /** Represents a TestIamPermissionsResponse. */
            class TestIamPermissionsResponse implements ITestIamPermissionsResponse {

                /**
                 * Constructs a new TestIamPermissionsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.ITestIamPermissionsResponse);

                /** TestIamPermissionsResponse permissions. */
                public permissions: string[];

                /**
                 * Creates a new TestIamPermissionsResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TestIamPermissionsResponse instance
                 */
                public static create(properties?: google.iam.v1.ITestIamPermissionsResponse): google.iam.v1.TestIamPermissionsResponse;

                /**
                 * Encodes the specified TestIamPermissionsResponse message. Does not implicitly {@link google.iam.v1.TestIamPermissionsResponse.verify|verify} messages.
                 * @param message TestIamPermissionsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.ITestIamPermissionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TestIamPermissionsResponse message, length delimited. Does not implicitly {@link google.iam.v1.TestIamPermissionsResponse.verify|verify} messages.
                 * @param message TestIamPermissionsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.ITestIamPermissionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TestIamPermissionsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TestIamPermissionsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.TestIamPermissionsResponse;

                /**
                 * Decodes a TestIamPermissionsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TestIamPermissionsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.TestIamPermissionsResponse;

                /**
                 * Verifies a TestIamPermissionsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TestIamPermissionsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TestIamPermissionsResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.TestIamPermissionsResponse;

                /**
                 * Creates a plain object from a TestIamPermissionsResponse message. Also converts values to other types if specified.
                 * @param message TestIamPermissionsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.TestIamPermissionsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TestIamPermissionsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Policy. */
            interface IPolicy {

                /** Policy version */
                version?: (number|null);

                /** Policy bindings */
                bindings?: (google.iam.v1.IBinding[]|null);

                /** Policy etag */
                etag?: (Uint8Array|null);
            }

            /** Represents a Policy. */
            class Policy implements IPolicy {

                /**
                 * Constructs a new Policy.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IPolicy);

                /** Policy version. */
                public version: number;

                /** Policy bindings. */
                public bindings: google.iam.v1.IBinding[];

                /** Policy etag. */
                public etag: Uint8Array;

                /**
                 * Creates a new Policy instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Policy instance
                 */
                public static create(properties?: google.iam.v1.IPolicy): google.iam.v1.Policy;

                /**
                 * Encodes the specified Policy message. Does not implicitly {@link google.iam.v1.Policy.verify|verify} messages.
                 * @param message Policy message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IPolicy, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Policy message, length delimited. Does not implicitly {@link google.iam.v1.Policy.verify|verify} messages.
                 * @param message Policy message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IPolicy, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Policy message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Policy
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.Policy;

                /**
                 * Decodes a Policy message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Policy
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.Policy;

                /**
                 * Verifies a Policy message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Policy message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Policy
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.Policy;

                /**
                 * Creates a plain object from a Policy message. Also converts values to other types if specified.
                 * @param message Policy
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.Policy, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Policy to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Binding. */
            interface IBinding {

                /** Binding role */
                role?: (string|null);

                /** Binding members */
                members?: (string[]|null);
            }

            /** Represents a Binding. */
            class Binding implements IBinding {

                /**
                 * Constructs a new Binding.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IBinding);

                /** Binding role. */
                public role: string;

                /** Binding members. */
                public members: string[];

                /**
                 * Creates a new Binding instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Binding instance
                 */
                public static create(properties?: google.iam.v1.IBinding): google.iam.v1.Binding;

                /**
                 * Encodes the specified Binding message. Does not implicitly {@link google.iam.v1.Binding.verify|verify} messages.
                 * @param message Binding message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IBinding, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Binding message, length delimited. Does not implicitly {@link google.iam.v1.Binding.verify|verify} messages.
                 * @param message Binding message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IBinding, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Binding message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Binding
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.Binding;

                /**
                 * Decodes a Binding message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Binding
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.Binding;

                /**
                 * Verifies a Binding message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Binding message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Binding
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.Binding;

                /**
                 * Creates a plain object from a Binding message. Also converts values to other types if specified.
                 * @param message Binding
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.Binding, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Binding to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a PolicyDelta. */
            interface IPolicyDelta {

                /** PolicyDelta bindingDeltas */
                bindingDeltas?: (google.iam.v1.IBindingDelta[]|null);
            }

            /** Represents a PolicyDelta. */
            class PolicyDelta implements IPolicyDelta {

                /**
                 * Constructs a new PolicyDelta.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IPolicyDelta);

                /** PolicyDelta bindingDeltas. */
                public bindingDeltas: google.iam.v1.IBindingDelta[];

                /**
                 * Creates a new PolicyDelta instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns PolicyDelta instance
                 */
                public static create(properties?: google.iam.v1.IPolicyDelta): google.iam.v1.PolicyDelta;

                /**
                 * Encodes the specified PolicyDelta message. Does not implicitly {@link google.iam.v1.PolicyDelta.verify|verify} messages.
                 * @param message PolicyDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IPolicyDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified PolicyDelta message, length delimited. Does not implicitly {@link google.iam.v1.PolicyDelta.verify|verify} messages.
                 * @param message PolicyDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IPolicyDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a PolicyDelta message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns PolicyDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.PolicyDelta;

                /**
                 * Decodes a PolicyDelta message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns PolicyDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.PolicyDelta;

                /**
                 * Verifies a PolicyDelta message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a PolicyDelta message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns PolicyDelta
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.PolicyDelta;

                /**
                 * Creates a plain object from a PolicyDelta message. Also converts values to other types if specified.
                 * @param message PolicyDelta
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.PolicyDelta, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this PolicyDelta to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a BindingDelta. */
            interface IBindingDelta {

                /** BindingDelta action */
                action?: (google.iam.v1.BindingDelta.Action|null);

                /** BindingDelta role */
                role?: (string|null);

                /** BindingDelta member */
                member?: (string|null);
            }

            /** Represents a BindingDelta. */
            class BindingDelta implements IBindingDelta {

                /**
                 * Constructs a new BindingDelta.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IBindingDelta);

                /** BindingDelta action. */
                public action: google.iam.v1.BindingDelta.Action;

                /** BindingDelta role. */
                public role: string;

                /** BindingDelta member. */
                public member: string;

                /**
                 * Creates a new BindingDelta instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BindingDelta instance
                 */
                public static create(properties?: google.iam.v1.IBindingDelta): google.iam.v1.BindingDelta;

                /**
                 * Encodes the specified BindingDelta message. Does not implicitly {@link google.iam.v1.BindingDelta.verify|verify} messages.
                 * @param message BindingDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IBindingDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified BindingDelta message, length delimited. Does not implicitly {@link google.iam.v1.BindingDelta.verify|verify} messages.
                 * @param message BindingDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IBindingDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BindingDelta message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns BindingDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.BindingDelta;

                /**
                 * Decodes a BindingDelta message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns BindingDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.BindingDelta;

                /**
                 * Verifies a BindingDelta message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a BindingDelta message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns BindingDelta
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.BindingDelta;

                /**
                 * Creates a plain object from a BindingDelta message. Also converts values to other types if specified.
                 * @param message BindingDelta
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.BindingDelta, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this BindingDelta to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace BindingDelta {

                /** Action enum. */
                enum Action {
                    ACTION_UNSPECIFIED = 0,
                    ADD = 1,
                    REMOVE = 2
                }
            }
        }
    }

    /** Namespace longrunning. */
    namespace longrunning {

      /** Represents an Operations */
      class Operations extends $protobuf.rpc.Service {

        /**
         * Constructs a new Operations service.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         */
        constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

        /**
         * Creates new Operations service using the specified rpc implementation.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         * @returns RPC service. Useful where requests and/or responses are streamed.
         */
        public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): Operations;

        /**
         * Calls ListOperations.
         * @param request ListOperationsRequest message or plain object
         * @param callback Node-style callback called with the error, if any, and ListOperationsResponse
         */
        public listOperations(request: google.longrunning.IListOperationsRequest, callback: google.longrunning.Operations.ListOperationsCallback): void;

        /**
         * Calls ListOperations.
         * @param request ListOperationsRequest message or plain object
         * @returns Promise
         */
        public listOperations(request: google.longrunning.IListOperationsRequest): Promise<google.longrunning.ListOperationsResponse>;

        /**
         * Calls GetOperation.
         * @param request GetOperationRequest message or plain object
         * @param callback Node-style callback called with the error, if any, and Operation
         */
        public getOperation(request: google.longrunning.IGetOperationRequest, callback: google.longrunning.Operations.GetOperationCallback): void;

        /**
         * Calls GetOperation.
         * @param request GetOperationRequest message or plain object
         * @returns Promise
         */
        public getOperation(request: google.longrunning.IGetOperationRequest): Promise<google.longrunning.Operation>;

        /**
         * Calls DeleteOperation.
         * @param request DeleteOperationRequest message or plain object
         * @param callback Node-style callback called with the error, if any, and Empty
         */
        public deleteOperation(request: google.longrunning.IDeleteOperationRequest, callback: google.longrunning.Operations.DeleteOperationCallback): void;

        /**
         * Calls DeleteOperation.
         * @param request DeleteOperationRequest message or plain object
         * @returns Promise
         */
        public deleteOperation(request: google.longrunning.IDeleteOperationRequest): Promise<google.protobuf.Empty>;

        /**
         * Calls CancelOperation.
         * @param request CancelOperationRequest message or plain object
         * @param callback Node-style callback called with the error, if any, and Empty
         */
        public cancelOperation(request: google.longrunning.ICancelOperationRequest, callback: google.longrunning.Operations.CancelOperationCallback): void;

        /**
         * Calls CancelOperation.
         * @param request CancelOperationRequest message or plain object
         * @returns Promise
         */
        public cancelOperation(request: google.longrunning.ICancelOperationRequest): Promise<google.protobuf.Empty>;

        /**
         * Calls WaitOperation.
         * @param request WaitOperationRequest message or plain object
         * @param callback Node-style callback called with the error, if any, and Operation
         */
        public waitOperation(request: google.longrunning.IWaitOperationRequest, callback: google.longrunning.Operations.WaitOperationCallback): void;

        /**
         * Calls WaitOperation.
         * @param request WaitOperationRequest message or plain object
         * @returns Promise
         */
        public waitOperation(request: google.longrunning.IWaitOperationRequest): Promise<google.longrunning.Operation>;
      }

      namespace Operations {

        /**
         * Callback as used by {@link google.longrunning.Operations#listOperations}.
         * @param error Error, if any
         * @param [response] ListOperationsResponse
         */
        type ListOperationsCallback = (error: (Error|null), response?: google.longrunning.ListOperationsResponse) => void;

        /**
         * Callback as used by {@link google.longrunning.Operations#getOperation}.
         * @param error Error, if any
         * @param [response] Operation
         */
        type GetOperationCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

        /**
         * Callback as used by {@link google.longrunning.Operations#deleteOperation}.
         * @param error Error, if any
         * @param [response] Empty
         */
        type DeleteOperationCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

        /**
         * Callback as used by {@link google.longrunning.Operations#cancelOperation}.
         * @param error Error, if any
         * @param [response] Empty
         */
        type CancelOperationCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

        /**
         * Callback as used by {@link google.longrunning.Operations#waitOperation}.
         * @param error Error, if any
         * @param [response] Operation
         */
        type WaitOperationCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;
      }

      /** Properties of an Operation. */
      interface IOperation {

        /** Operation name */
        name?: (string|null);

        /** Operation metadata */
        metadata?: (google.protobuf.IAny|null);

        /** Operation done */
        done?: (boolean|null);

        /** Operation error */
        error?: (google.rpc.IStatus|null);

        /** Operation response */
        response?: (google.protobuf.IAny|null);
      }

      /** Represents an Operation. */
      class Operation implements IOperation {

        /**
         * Constructs a new Operation.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.longrunning.IOperation);

        /** Operation name. */
        public name: string;

        /** Operation metadata. */
        public metadata?: (google.protobuf.IAny|null);

        /** Operation done. */
        public done: boolean;

        /** Operation error. */
        public error?: (google.rpc.IStatus|null);

        /** Operation response. */
        public response?: (google.protobuf.IAny|null);

        /** Operation result. */
        public result?: ("error"|"response");

        /**
         * Creates a new Operation instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Operation instance
         */
        public static create(properties?: google.longrunning.IOperation): google.longrunning.Operation;

        /**
         * Encodes the specified Operation message. Does not implicitly {@link google.longrunning.Operation.verify|verify} messages.
         * @param message Operation message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.longrunning.IOperation, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Operation message, length delimited. Does not implicitly {@link google.longrunning.Operation.verify|verify} messages.
         * @param message Operation message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.longrunning.IOperation, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Operation message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.Operation;

        /**
         * Decodes an Operation message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.Operation;

        /**
         * Verifies an Operation message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Operation message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Operation
         */
        public static fromObject(object: { [k: string]: any }): google.longrunning.Operation;

        /**
         * Creates a plain object from an Operation message. Also converts values to other types if specified.
         * @param message Operation
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.longrunning.Operation, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Operation to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a GetOperationRequest. */
      interface IGetOperationRequest {

        /** GetOperationRequest name */
        name?: (string|null);
      }

      /** Represents a GetOperationRequest. */
      class GetOperationRequest implements IGetOperationRequest {

        /**
         * Constructs a new GetOperationRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.longrunning.IGetOperationRequest);

        /** GetOperationRequest name. */
        public name: string;

        /**
         * Creates a new GetOperationRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetOperationRequest instance
         */
        public static create(properties?: google.longrunning.IGetOperationRequest): google.longrunning.GetOperationRequest;

        /**
         * Encodes the specified GetOperationRequest message. Does not implicitly {@link google.longrunning.GetOperationRequest.verify|verify} messages.
         * @param message GetOperationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.longrunning.IGetOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetOperationRequest message, length delimited. Does not implicitly {@link google.longrunning.GetOperationRequest.verify|verify} messages.
         * @param message GetOperationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.longrunning.IGetOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetOperationRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetOperationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.GetOperationRequest;

        /**
         * Decodes a GetOperationRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetOperationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.GetOperationRequest;

        /**
         * Verifies a GetOperationRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetOperationRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetOperationRequest
         */
        public static fromObject(object: { [k: string]: any }): google.longrunning.GetOperationRequest;

        /**
         * Creates a plain object from a GetOperationRequest message. Also converts values to other types if specified.
         * @param message GetOperationRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.longrunning.GetOperationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetOperationRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a ListOperationsRequest. */
      interface IListOperationsRequest {

        /** ListOperationsRequest name */
        name?: (string|null);

        /** ListOperationsRequest filter */
        filter?: (string|null);

        /** ListOperationsRequest pageSize */
        pageSize?: (number|null);

        /** ListOperationsRequest pageToken */
        pageToken?: (string|null);
      }

      /** Represents a ListOperationsRequest. */
      class ListOperationsRequest implements IListOperationsRequest {

        /**
         * Constructs a new ListOperationsRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.longrunning.IListOperationsRequest);

        /** ListOperationsRequest name. */
        public name: string;

        /** ListOperationsRequest filter. */
        public filter: string;

        /** ListOperationsRequest pageSize. */
        public pageSize: number;

        /** ListOperationsRequest pageToken. */
        public pageToken: string;

        /**
         * Creates a new ListOperationsRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ListOperationsRequest instance
         */
        public static create(properties?: google.longrunning.IListOperationsRequest): google.longrunning.ListOperationsRequest;

        /**
         * Encodes the specified ListOperationsRequest message. Does not implicitly {@link google.longrunning.ListOperationsRequest.verify|verify} messages.
         * @param message ListOperationsRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.longrunning.IListOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ListOperationsRequest message, length delimited. Does not implicitly {@link google.longrunning.ListOperationsRequest.verify|verify} messages.
         * @param message ListOperationsRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.longrunning.IListOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ListOperationsRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ListOperationsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.ListOperationsRequest;

        /**
         * Decodes a ListOperationsRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ListOperationsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.ListOperationsRequest;

        /**
         * Verifies a ListOperationsRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ListOperationsRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ListOperationsRequest
         */
        public static fromObject(object: { [k: string]: any }): google.longrunning.ListOperationsRequest;

        /**
         * Creates a plain object from a ListOperationsRequest message. Also converts values to other types if specified.
         * @param message ListOperationsRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.longrunning.ListOperationsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ListOperationsRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a ListOperationsResponse. */
      interface IListOperationsResponse {

        /** ListOperationsResponse operations */
        operations?: (google.longrunning.IOperation[]|null);

        /** ListOperationsResponse nextPageToken */
        nextPageToken?: (string|null);
      }

      /** Represents a ListOperationsResponse. */
      class ListOperationsResponse implements IListOperationsResponse {

        /**
         * Constructs a new ListOperationsResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.longrunning.IListOperationsResponse);

        /** ListOperationsResponse operations. */
        public operations: google.longrunning.IOperation[];

        /** ListOperationsResponse nextPageToken. */
        public nextPageToken: string;

        /**
         * Creates a new ListOperationsResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ListOperationsResponse instance
         */
        public static create(properties?: google.longrunning.IListOperationsResponse): google.longrunning.ListOperationsResponse;

        /**
         * Encodes the specified ListOperationsResponse message. Does not implicitly {@link google.longrunning.ListOperationsResponse.verify|verify} messages.
         * @param message ListOperationsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.longrunning.IListOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ListOperationsResponse message, length delimited. Does not implicitly {@link google.longrunning.ListOperationsResponse.verify|verify} messages.
         * @param message ListOperationsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.longrunning.IListOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ListOperationsResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ListOperationsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.ListOperationsResponse;

        /**
         * Decodes a ListOperationsResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ListOperationsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.ListOperationsResponse;

        /**
         * Verifies a ListOperationsResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ListOperationsResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ListOperationsResponse
         */
        public static fromObject(object: { [k: string]: any }): google.longrunning.ListOperationsResponse;

        /**
         * Creates a plain object from a ListOperationsResponse message. Also converts values to other types if specified.
         * @param message ListOperationsResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.longrunning.ListOperationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ListOperationsResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a CancelOperationRequest. */
      interface ICancelOperationRequest {

        /** CancelOperationRequest name */
        name?: (string|null);
      }

      /** Represents a CancelOperationRequest. */
      class CancelOperationRequest implements ICancelOperationRequest {

        /**
         * Constructs a new CancelOperationRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.longrunning.ICancelOperationRequest);

        /** CancelOperationRequest name. */
        public name: string;

        /**
         * Creates a new CancelOperationRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CancelOperationRequest instance
         */
        public static create(properties?: google.longrunning.ICancelOperationRequest): google.longrunning.CancelOperationRequest;

        /**
         * Encodes the specified CancelOperationRequest message. Does not implicitly {@link google.longrunning.CancelOperationRequest.verify|verify} messages.
         * @param message CancelOperationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.longrunning.ICancelOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CancelOperationRequest message, length delimited. Does not implicitly {@link google.longrunning.CancelOperationRequest.verify|verify} messages.
         * @param message CancelOperationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.longrunning.ICancelOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CancelOperationRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CancelOperationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.CancelOperationRequest;

        /**
         * Decodes a CancelOperationRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CancelOperationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.CancelOperationRequest;

        /**
         * Verifies a CancelOperationRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CancelOperationRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CancelOperationRequest
         */
        public static fromObject(object: { [k: string]: any }): google.longrunning.CancelOperationRequest;

        /**
         * Creates a plain object from a CancelOperationRequest message. Also converts values to other types if specified.
         * @param message CancelOperationRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.longrunning.CancelOperationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CancelOperationRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a DeleteOperationRequest. */
      interface IDeleteOperationRequest {

        /** DeleteOperationRequest name */
        name?: (string|null);
      }

      /** Represents a DeleteOperationRequest. */
      class DeleteOperationRequest implements IDeleteOperationRequest {

        /**
         * Constructs a new DeleteOperationRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.longrunning.IDeleteOperationRequest);

        /** DeleteOperationRequest name. */
        public name: string;

        /**
         * Creates a new DeleteOperationRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DeleteOperationRequest instance
         */
        public static create(properties?: google.longrunning.IDeleteOperationRequest): google.longrunning.DeleteOperationRequest;

        /**
         * Encodes the specified DeleteOperationRequest message. Does not implicitly {@link google.longrunning.DeleteOperationRequest.verify|verify} messages.
         * @param message DeleteOperationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.longrunning.IDeleteOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DeleteOperationRequest message, length delimited. Does not implicitly {@link google.longrunning.DeleteOperationRequest.verify|verify} messages.
         * @param message DeleteOperationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.longrunning.IDeleteOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DeleteOperationRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DeleteOperationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.DeleteOperationRequest;

        /**
         * Decodes a DeleteOperationRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DeleteOperationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.DeleteOperationRequest;

        /**
         * Verifies a DeleteOperationRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DeleteOperationRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DeleteOperationRequest
         */
        public static fromObject(object: { [k: string]: any }): google.longrunning.DeleteOperationRequest;

        /**
         * Creates a plain object from a DeleteOperationRequest message. Also converts values to other types if specified.
         * @param message DeleteOperationRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.longrunning.DeleteOperationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DeleteOperationRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of a WaitOperationRequest. */
      interface IWaitOperationRequest {

        /** WaitOperationRequest name */
        name?: (string|null);

        /** WaitOperationRequest timeout */
        timeout?: (google.protobuf.IDuration|null);
      }

      /** Represents a WaitOperationRequest. */
      class WaitOperationRequest implements IWaitOperationRequest {

        /**
         * Constructs a new WaitOperationRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.longrunning.IWaitOperationRequest);

        /** WaitOperationRequest name. */
        public name: string;

        /** WaitOperationRequest timeout. */
        public timeout?: (google.protobuf.IDuration|null);

        /**
         * Creates a new WaitOperationRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WaitOperationRequest instance
         */
        public static create(properties?: google.longrunning.IWaitOperationRequest): google.longrunning.WaitOperationRequest;

        /**
         * Encodes the specified WaitOperationRequest message. Does not implicitly {@link google.longrunning.WaitOperationRequest.verify|verify} messages.
         * @param message WaitOperationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.longrunning.IWaitOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WaitOperationRequest message, length delimited. Does not implicitly {@link google.longrunning.WaitOperationRequest.verify|verify} messages.
         * @param message WaitOperationRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.longrunning.IWaitOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WaitOperationRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WaitOperationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.WaitOperationRequest;

        /**
         * Decodes a WaitOperationRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WaitOperationRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.WaitOperationRequest;

        /**
         * Verifies a WaitOperationRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WaitOperationRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WaitOperationRequest
         */
        public static fromObject(object: { [k: string]: any }): google.longrunning.WaitOperationRequest;

        /**
         * Creates a plain object from a WaitOperationRequest message. Also converts values to other types if specified.
         * @param message WaitOperationRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.longrunning.WaitOperationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WaitOperationRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }

      /** Properties of an OperationInfo. */
      interface IOperationInfo {

        /** OperationInfo responseType */
        responseType?: (string|null);

        /** OperationInfo metadataType */
        metadataType?: (string|null);
      }

      /** Represents an OperationInfo. */
      class OperationInfo implements IOperationInfo {

        /**
         * Constructs a new OperationInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: google.longrunning.IOperationInfo);

        /** OperationInfo responseType. */
        public responseType: string;

        /** OperationInfo metadataType. */
        public metadataType: string;

        /**
         * Creates a new OperationInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OperationInfo instance
         */
        public static create(properties?: google.longrunning.IOperationInfo): google.longrunning.OperationInfo;

        /**
         * Encodes the specified OperationInfo message. Does not implicitly {@link google.longrunning.OperationInfo.verify|verify} messages.
         * @param message OperationInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: google.longrunning.IOperationInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OperationInfo message, length delimited. Does not implicitly {@link google.longrunning.OperationInfo.verify|verify} messages.
         * @param message OperationInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: google.longrunning.IOperationInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OperationInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OperationInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.OperationInfo;

        /**
         * Decodes an OperationInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OperationInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.OperationInfo;

        /**
         * Verifies an OperationInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OperationInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OperationInfo
         */
        public static fromObject(object: { [k: string]: any }): google.longrunning.OperationInfo;

        /**
         * Creates a plain object from an OperationInfo message. Also converts values to other types if specified.
         * @param message OperationInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: google.longrunning.OperationInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OperationInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
      }
    }

    /** Namespace rpc. */
    namespace rpc {

        /** Properties of a Status. */
        interface IStatus {

            /** Status code */
            code?: (number|null);

            /** Status message */
            message?: (string|null);

            /** Status details */
            details?: (google.protobuf.IAny[]|null);
        }

        /** Represents a Status. */
        class Status implements IStatus {

            /**
             * Constructs a new Status.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IStatus);

            /** Status code. */
            public code: number;

            /** Status message. */
            public message: string;

            /** Status details. */
            public details: google.protobuf.IAny[];

            /**
             * Creates a new Status instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Status instance
             */
            public static create(properties?: google.rpc.IStatus): google.rpc.Status;

            /**
             * Encodes the specified Status message. Does not implicitly {@link google.rpc.Status.verify|verify} messages.
             * @param message Status message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IStatus, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Status message, length delimited. Does not implicitly {@link google.rpc.Status.verify|verify} messages.
             * @param message Status message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IStatus, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Status message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Status
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.Status;

            /**
             * Decodes a Status message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Status
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.Status;

            /**
             * Verifies a Status message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Status message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Status
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.Status;

            /**
             * Creates a plain object from a Status message. Also converts values to other types if specified.
             * @param message Status
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.Status, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Status to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}
