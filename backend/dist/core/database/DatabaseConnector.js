"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManager = exports.ConnectionManager = exports.DatabaseConnectorFactory = exports.BaseDatabaseConnector = void 0;
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
// 数据库连接器抽象类
class BaseDatabaseConnector {
    connected = false;
    config;
    constructor(config) {
        this.config = config;
    }
    async testConnection() {
        try {
            await this.connect();
            // 执行简单的健康检查查询
            const result = await this.query('SELECT 1 as connection_test');
            this.connected = result.success;
            return result.success;
        }
        catch (error) {
            logger_1.logger.error('数据库连接测试失败:', error);
            this.connected = false;
            return false;
        }
    }
    getConnectionInfo() {
        return `数据库类型: ${this.config.type}, 状态: ${this.connected ? '已连接' : '未连接'}`;
    }
    isConnected() {
        return this.connected;
    }
    handleQueryError(error, sql) {
        logger_1.logger.error('数据库查询错误:', {
            sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
            error: error.message,
            code: error.code
        });
        return {
            success: false,
            error: error.message || '数据库查询失败',
            queryTime: 0
        };
    }
    logQuery(sql, params, duration, success) {
        const logData = {
            sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
            paramCount: params?.length || 0,
            duration: `${duration}ms`,
            success,
            timestamp: new Date().toISOString()
        };
        if (success) {
            logger_1.logger.debug('数据库查询成功', logData);
        }
        else {
            logger_1.logger.error('数据库查询失败', logData);
        }
    }
}
exports.BaseDatabaseConnector = BaseDatabaseConnector;
// 数据库连接工厂
class DatabaseConnectorFactory {
    static async createConnector(dbType = config_1.DatabaseType.OCEANBASE) {
        switch (dbType) {
            case config_1.DatabaseType.OCEANBASE:
                const { OceanBaseClient } = await Promise.resolve().then(() => __importStar(require('./OceanBaseClient')));
                return new OceanBaseClient(config_1.config.database);
            case config_1.DatabaseType.DATAWORKS:
                if (!config_1.config.dataworks) {
                    throw new Error('DataWorks配置未找到');
                }
                const { DataWorksClient } = await Promise.resolve().then(() => __importStar(require('./DataWorksClient')));
                return new DataWorksClient(config_1.config.dataworks);
            default:
                throw new Error(`不支持的数据库类型: ${dbType}`);
        }
    }
    static async createAllConnectors() {
        const connectors = new Map();
        try {
            // 总是创建OceanBase连接器
            const oceanbaseConnector = await this.createConnector(config_1.DatabaseType.OCEANBASE);
            connectors.set(config_1.DatabaseType.OCEANBASE, oceanbaseConnector);
            // 如果配置了DataWorks，也创建连接器
            if (config_1.config.dataworks?.apiKey) {
                try {
                    const dataworksConnector = await this.createConnector(config_1.DatabaseType.DATAWORKS);
                    connectors.set(config_1.DatabaseType.DATAWORKS, dataworksConnector);
                }
                catch (error) {
                    logger_1.logger.warn('DataWorks连接器创建失败，但仍可使用OceanBase', error);
                }
            }
            return connectors;
        }
        catch (error) {
            logger_1.logger.error('创建数据库连接器失败:', error);
            throw error;
        }
    }
}
exports.DatabaseConnectorFactory = DatabaseConnectorFactory;
// 连接管理器（支持连接池和故障转移）
class ConnectionManager {
    connectors = new Map();
    primaryType = config_1.DatabaseType.OCEANBASE;
    async initialize() {
        logger_1.logger.info('初始化数据库连接管理器...');
        try {
            this.connectors = await DatabaseConnectorFactory.createAllConnectors();
            // 测试连接
            const results = await Promise.allSettled(Array.from(this.connectors.entries()).map(async ([type, connector]) => {
                const connected = await connector.testConnection();
                return { type, connected, connector };
            }));
            // 记录连接状态
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { type, connected } = result.value;
                    logger_1.logger.info(`${type} 连接状态: ${connected ? '成功' : '失败'}`);
                }
            });
            // 选择主数据库（优先使用OceanBase）
            const availableConnectors = results
                .filter((r) => r.status === 'fulfilled')
                .filter(r => r.value.connected)
                .map(r => r.value.type);
            if (availableConnectors.length === 0) {
                throw new Error('没有可用的数据库连接');
            }
            this.primaryType = availableConnectors.includes(config_1.DatabaseType.OCEANBASE)
                ? config_1.DatabaseType.OCEANBASE
                : availableConnectors[0];
            logger_1.logger.info(`主数据库设置为: ${this.primaryType}`);
        }
        catch (error) {
            logger_1.logger.error('数据库连接管理器初始化失败:', error);
            throw error;
        }
    }
    getConnector(type) {
        const connectorType = type || this.primaryType;
        const connector = this.connectors.get(connectorType);
        if (!connector) {
            throw new Error(`数据库连接器未找到: ${connectorType}`);
        }
        return connector;
    }
    async query(sql, params, retryCount = 0) {
        const maxRetries = 2;
        try {
            const connector = this.getConnector();
            return await connector.query(sql, params);
        }
        catch (error) {
            logger_1.logger.error('主数据库查询失败，尝试故障转移:', error);
            if (retryCount >= maxRetries) {
                throw error;
            }
            // 尝试其他可用的数据库
            for (const [type, connector] of this.connectors.entries()) {
                if (type === this.primaryType)
                    continue;
                try {
                    logger_1.logger.info(`尝试使用备用数据库: ${type}`);
                    const result = await connector.query(sql, params);
                    return {
                        ...result,
                        warning: `使用备用数据源: ${type}，可能存在延迟`
                    };
                }
                catch (fallbackError) {
                    logger_1.logger.error(`备用数据库 ${type} 查询失败:`, fallbackError);
                }
            }
            // 如果所有备用都失败，重新尝试主数据库（指数退避）
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.query(sql, params, retryCount + 1);
        }
    }
    async testAllConnections() {
        const results = new Map();
        for (const [type, connector] of this.connectors.entries()) {
            try {
                const connected = await connector.testConnection();
                results.set(type, connected);
            }
            catch (error) {
                logger_1.logger.error(`测试${type}连接失败:`, error);
                results.set(type, false);
            }
        }
        return results;
    }
    async closeAll() {
        const closePromises = Array.from(this.connectors.values()).map(connector => connector.disconnect().catch(error => logger_1.logger.error('关闭数据库连接失败:', error)));
        await Promise.allSettled(closePromises);
        this.connectors.clear();
        logger_1.logger.info('所有数据库连接已关闭');
    }
    getAvailableConnectors() {
        return Array.from(this.connectors.keys());
    }
    getPrimaryType() {
        return this.primaryType;
    }
}
exports.ConnectionManager = ConnectionManager;
// 导出单例连接管理器
exports.connectionManager = new ConnectionManager();
//# sourceMappingURL=DatabaseConnector.js.map