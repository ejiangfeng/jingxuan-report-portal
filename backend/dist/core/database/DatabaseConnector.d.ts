import { DatabaseType } from '../../config';
import { QueryResult } from '../../types';
export interface IDatabaseConnector {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<QueryResult>;
    testConnection(): Promise<boolean>;
    getConnectionInfo(): string;
}
export declare abstract class BaseDatabaseConnector implements IDatabaseConnector {
    protected connected: boolean;
    protected config: any;
    constructor(config: any);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract query(sql: string, params?: any[]): Promise<QueryResult>;
    testConnection(): Promise<boolean>;
    getConnectionInfo(): string;
    isConnected(): boolean;
    protected handleQueryError(error: any, sql: string): QueryResult;
    protected logQuery(sql: string, params: any[], duration: number, success: boolean): void;
}
export declare class DatabaseConnectorFactory {
    static createConnector(dbType?: DatabaseType): Promise<IDatabaseConnector>;
    static createAllConnectors(): Promise<Map<DatabaseType, IDatabaseConnector>>;
}
export declare class ConnectionManager {
    private connectors;
    private primaryType;
    initialize(): Promise<void>;
    getConnector(type?: DatabaseType): IDatabaseConnector;
    query(sql: string, params?: any[], retryCount?: number): Promise<QueryResult>;
    testAllConnections(): Promise<Map<DatabaseType, boolean>>;
    closeAll(): Promise<void>;
    getAvailableConnectors(): DatabaseType[];
    getPrimaryType(): DatabaseType;
}
export declare const connectionManager: ConnectionManager;
//# sourceMappingURL=DatabaseConnector.d.ts.map