import { BaseDatabaseConnector, IDatabaseConnector } from './DatabaseConnector';
import { QueryResult } from '../../types';
import { DataWorksConfig } from '../../config';
export declare class DataWorksClient extends BaseDatabaseConnector implements IDatabaseConnector {
    private axiosInstance;
    private projectId;
    private endpoint;
    private accessKeyId;
    private accessKeySecret;
    constructor(config: DataWorksConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<QueryResult>;
    testConnection(): Promise<boolean>;
    getConnectionInfo(): string;
    queryBatch(queries: {
        sql: string;
        params?: any[];
    }[]): Promise<QueryResult[]>;
    private executeSQL;
    private pollTaskResult;
    private getTaskResult;
    private signRequest;
    private buildCanonicalString;
    private buildQueryString;
    private generateNonce;
    private delay;
    private ensureConnected;
    private testAPIConnection;
    getApiStats(): Promise<{
        connected: boolean;
        endpoint: string;
        projectId: string;
        lastTestTime?: Date;
        errorCount?: number;
    }>;
    queryWithPagination(sql: string, pageNumber?: number, pageSize?: number): Promise<{
        data: any[];
        totalCount: number;
        pageNumber: number;
        pageSize: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=DataWorksClient.d.ts.map