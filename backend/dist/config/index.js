"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConnectionString = exports.isDataWorksEnabled = exports.getSafeConfig = exports.validateConfig = exports.config = exports.DatabaseType = void 0;
const tslib_1 = require("tslib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
// 数据库类型枚举
var DatabaseType;
(function (DatabaseType) {
    DatabaseType["OCEANBASE"] = "oceanbase";
    DatabaseType["DATAWORKS"] = "dataworks";
    DatabaseType["MYSQL"] = "mysql";
})(DatabaseType || (exports.DatabaseType = DatabaseType = {}));
// 从环境变量加载配置
const getConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';
    return {
        app: {
            env,
            port: parseInt(process.env.PORT || '4000'),
            corsOrigin: process.env.CORS_ORIGIN || '*',
            rateLimit: parseInt(process.env.RATE_LIMIT || '100'),
            apiPrefix: '/api/v1',
        },
        database: {
            type: process.env.DB_TYPE || DatabaseType.OCEANBASE,
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            username: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'jingxuan',
            connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
            queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '1000'),
            connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000'),
        },
        dataworks: process.env.DATAWORKS_API_KEY
            ? {
                endpoint: process.env.DATAWORKS_ENDPOINT || '',
                apiKey: process.env.DATAWORKS_API_KEY,
                apiSecret: process.env.DATAWORKS_API_SECRET || '',
                projectId: process.env.DATAWORKS_PROJECT_ID || '',
            }
            : undefined,
        export: {
            maxSize: parseInt(process.env.EXPORT_MAX_SIZE || '50000'),
            retentionDays: parseInt(process.env.EXPORT_RETENTION_DAYS || '1'),
            storagePath: process.env.EXPORT_STORAGE_PATH || './exports',
            batchSize: parseInt(process.env.EXPORT_BATCH_SIZE || '1000'),
        },
        query: {
            timeoutMs: parseInt(process.env.QUERY_TIMEOUT_MS || '30000'),
            maxRecordsPerPage: parseInt(process.env.MAX_RECORDS_PER_PAGE || '500'),
            defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '50'),
        },
    };
};
// 配置导出
exports.config = getConfig();
// 验证配置
const validateConfig = () => {
    const errors = [];
    // 验证应用配置
    if (!exports.config.app.port || exports.config.app.port < 1 || exports.config.app.port > 65535) {
        errors.push('应用端口配置无效');
    }
    // 验证数据库配置
    if (!exports.config.database.host) {
        errors.push('数据库主机地址不能为空');
    }
    if (!exports.config.database.username || !exports.config.database.password) {
        errors.push('数据库用户名和密码不能为空');
    }
    // 验证导出配置
    if (exports.config.export.maxSize <= 0) {
        errors.push('导出最大数量必须大于0');
    }
    if (exports.config.export.retentionDays < 0) {
        errors.push('导出文件保留天数不能为负数');
    }
    // 验证查询配置
    if (exports.config.query.timeoutMs <= 0) {
        errors.push('查询超时时间必须大于0');
    }
    if (exports.config.query.defaultPageSize <= 0) {
        errors.push('默认分页大小必须大于0');
    }
    return errors;
};
exports.validateConfig = validateConfig;
// 打印配置信息（去除密码）
const getSafeConfig = () => {
    const safeConfig = { ...exports.config };
    if (safeConfig.database) {
        safeConfig.database = { ...safeConfig.database };
        safeConfig.database.password = '[HIDDEN]';
    }
    if (safeConfig.dataworks) {
        safeConfig.dataworks = { ...safeConfig.dataworks };
        safeConfig.dataworks.apiSecret = '[HIDDEN]';
    }
    return safeConfig;
};
exports.getSafeConfig = getSafeConfig;
// 检查是否启用DataWorks
const isDataWorksEnabled = () => !!exports.config.dataworks?.apiKey;
exports.isDataWorksEnabled = isDataWorksEnabled;
// 获取数据库连接字符串（用于日志记录）
const getDatabaseConnectionString = () => {
    const { database } = exports.config;
    return `${database.type}://${database.username}@${database.host}:${database.port}/${database.database}`;
};
exports.getDatabaseConnectionString = getDatabaseConnectionString;
//# sourceMappingURL=index.js.map