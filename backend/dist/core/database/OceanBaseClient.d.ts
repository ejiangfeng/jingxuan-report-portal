import { PoolConnection } from 'mysql2/promise';
import { BaseDatabaseConnector, IDatabaseConnector } from './DatabaseConnector';
import { QueryResult } from '../../types';
import { DatabaseConfig } from '../../config';
export declare class OceanBaseClient extends BaseDatabaseConnector implements IDatabaseConnector {
    private pool;
    private poolConfig;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<QueryResult>;
    testConnection(): Promise<boolean>;
    getConnectionInfo(): string;
    getPoolStats(): Promise<{
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        waitingRequests: number;
    }>;
    executeTransaction<T>(operations: (connection: PoolConnection) => Promise<T>): Promise<T>;
    bulkInsert(table: string, data: Record<string, any>[]): Promise<QueryResult>;
    private ensureConnected;
    private testPoolConnection;
    private reconnect;
    private getSSLConfig;
    explainQuery(sql: string, params?: any[]): Promise<any[]>;
    getTableInfo(tableName: string): Promise<any[]>;
    healthCheck(): Promise<{
        connected: boolean;
        poolStats: any;
        testQueryTime: number;
        error?: string;
    }>;
}
//# sourceMappingURL=OceanBaseClient.d.ts.map