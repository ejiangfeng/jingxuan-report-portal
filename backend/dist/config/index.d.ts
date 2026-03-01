export declare enum DatabaseType {
    OCEANBASE = "oceanbase",
    DATAWORKS = "dataworks",
    MYSQL = "mysql"
}
export interface AppConfig {
    env: string;
    port: number;
    corsOrigin: string;
    rateLimit: number;
    apiPrefix: string;
}
export interface DatabaseConfig {
    type: DatabaseType;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    connectionLimit?: number;
    queueLimit?: number;
    connectTimeout?: number;
}
export interface DataWorksConfig {
    endpoint: string;
    apiKey: string;
    apiSecret: string;
    projectId: string;
}
export interface ExportConfig {
    maxSize: number;
    retentionDays: number;
    storagePath: string;
    batchSize: number;
}
export interface QueryConfig {
    timeoutMs: number;
    maxRecordsPerPage: number;
    defaultPageSize: number;
}
export interface Config {
    app: AppConfig;
    database: DatabaseConfig;
    dataworks?: DataWorksConfig;
    export: ExportConfig;
    query: QueryConfig;
}
export declare const config: Config;
export declare const validateConfig: () => string[];
export declare const getSafeConfig: () => {
    app: AppConfig;
    database: DatabaseConfig;
    dataworks?: DataWorksConfig;
    export: ExportConfig;
    query: QueryConfig;
};
export declare const isDataWorksEnabled: () => boolean;
export declare const getDatabaseConnectionString: () => string;
//# sourceMappingURL=index.d.ts.map