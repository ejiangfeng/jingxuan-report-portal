"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OceanBaseClient = void 0;
const tslib_1 = require("tslib");
const promise_1 = tslib_1.__importDefault(require("mysql2/promise"));
const DatabaseConnector_1 = require("./DatabaseConnector");
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
class OceanBaseClient extends DatabaseConnector_1.BaseDatabaseConnector {
    pool = null;
    poolConfig;
    constructor(config) {
        super({
            ...config,
            type: config_1.DatabaseType.OCEANBASE
        });
        // OceanBase特定的连接池配置
        this.poolConfig = {
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
            // 连接池配置
            connectionLimit: config.connectionLimit || 10,
            queueLimit: config.queueLimit || 1000,
            waitForConnections: true,
            connectTimeout: config.connectTimeout || 30000,
            // 连接保持活跃
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            // 字符集配置
            charset: 'utf8mb4',
            timezone: '+08:00',
            // 支持OceanBase特性
            supportBigNumbers: true,
            bigNumberStrings: true,
            typeCast: true,
            dateStrings: true,
            // 连接验证
            ssl: this.getSSLConfig(),
            // 调试选项
            debug: process.env.NODE_ENV === 'development',
        };
    }
    async connect() {
        if (this.pool) {
            logger_1.logger.debug('OceanBase连接池已存在');
            return;
        }
        try {
            logger_1.logger.info('正在连接OceanBase数据库...', {
                host: this.config.host,
                port: this.config.port,
                database: this.config.database,
                user: this.config.username
            });
            this.pool = promise_1.default.createPool(this.poolConfig);
            // 测试连接
            await this.testPoolConnection();
            this.connected = true;
            logger_1.logger.info('OceanBase数据库连接成功');
        }
        catch (error) {
            logger_1.logger.error('OceanBase数据库连接失败:', error);
            this.connected = false;
            throw new Error(`OceanBase连接失败: ${error.message}`);
        }
    }
    async disconnect() {
        if (this.pool) {
            try {
                logger_1.logger.info('正在关闭OceanBase连接池...');
                await this.pool.end();
                this.pool = null;
                this.connected = false;
                logger_1.logger.info('OceanBase连接池已关闭');
            }
            catch (error) {
                logger_1.logger.error('关闭OceanBase连接池失败:', error);
                throw error;
            }
        }
    }
    async query(sql, params) {
        const startTime = Date.now();
        try {
            await this.ensureConnected();
            let connection = null;
            try {
                connection = await this.pool.getConnection();
                // 设置查询超时
                await connection.query('SET SESSION wait_timeout = 30');
                const [rows, fields] = await connection.query(sql, params || []);
                const duration = Date.now() - startTime;
                // 记录慢查询
                if (duration > 1000) {
                    logger_1.logger.warn('慢查询警告', {
                        sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
                        duration: `${duration}ms`,
                        paramCount: params?.length || 0
                    });
                }
                // 构建成功响应
                const result = {
                    success: true,
                    data: rows,
                    queryTime: duration,
                    affectedRows: rows.affectedRows
                };
                this.logQuery(sql, params || [], duration, true);
                return result;
            }
            finally {
                if (connection) {
                    connection.release();
                }
            }
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // 处理特定错误
            if (error.code === 'ER_LOCK_DEADLOCK') {
                logger_1.logger.warn('检测到死锁，稍后重试...');
                // 指数退避重试
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.query(sql, params);
            }
            if (error.code === 'ER_SERVER_SHUTDOWN') {
                logger_1.logger.error('数据库服务器关闭，重新连接...');
                await this.reconnect();
                return this.query(sql, params);
            }
            this.logQuery(sql, params || [], duration, false);
            return this.handleQueryError(error, sql);
        }
    }
    async testConnection() {
        try {
            await this.connect();
            const result = await this.query('SELECT 1 as connected');
            return result.success;
        }
        catch (error) {
            logger_1.logger.error('OceanBase连接测试失败:', error);
            return false;
        }
    }
    getConnectionInfo() {
        if (!this.pool) {
            return 'OceanBase: 未连接';
        }
        const poolInfo = this.pool;
        return `OceanBase: ${this.config.host}:${this.config.port}/${this.config.database}, 连接池: ${poolInfo._allConnections?.length || 0}`;
    }
    // 获取连接池统计信息
    async getPoolStats() {
        if (!this.pool) {
            return {
                totalConnections: 0,
                activeConnections: 0,
                idleConnections: 0,
                waitingRequests: 0
            };
        }
        // mysql2/promise 没有直接获取统计信息的API
        // 这里使用私有属性（注意：这可能在不同版本中变化）
        const poolStats = this.pool.pool || {};
        return {
            totalConnections: poolStats._allConnections?.length || 0,
            activeConnections: poolStats._acquiringConnections?.length || 0,
            idleConnections: poolStats._freeConnections?.length || 0,
            waitingRequests: poolStats._connectionQueue?.length || 0
        };
    }
    // 执行事务
    async executeTransaction(operations) {
        await this.ensureConnected();
        let connection = null;
        try {
            connection = await this.pool.getConnection();
            await connection.beginTransaction();
            const result = await operations(connection);
            await connection.commit();
            return result;
        }
        catch (error) {
            if (connection) {
                await connection.rollback();
            }
            throw error;
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }
    // 批量插入
    async bulkInsert(table, data) {
        if (!data || data.length === 0) {
            return {
                success: true,
                data: [],
                queryTime: 0,
                affectedRows: 0
            };
        }
        const columns = Object.keys(data[0]);
        const placeholders = data.map(() => `(${columns.map(() => '?').join(',')})`);
        const values = data.flatMap(row => columns.map(col => row[col]));
        const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders.join(',')}`;
        return this.query(sql, values);
    }
    // 私有方法
    async ensureConnected() {
        if (!this.pool || !this.connected) {
            await this.connect();
        }
    }
    async testPoolConnection() {
        if (!this.pool) {
            throw new Error('连接池未初始化');
        }
        const connection = await this.pool.getConnection();
        try {
            const [result] = await connection.query('SELECT @@version as version');
            logger_1.logger.info('OceanBase版本:', result[0]?.version);
        }
        finally {
            connection.release();
        }
    }
    async reconnect() {
        logger_1.logger.info('重新连接OceanBase数据库...');
        await this.disconnect();
        await this.connect();
    }
    getSSLConfig() {
        // 根据环境决定是否使用SSL
        const useSSL = process.env.DB_USE_SSL === 'true';
        if (!useSSL) {
            return undefined;
        }
        return {
            rejectUnauthorized: process.env.SSL_REJECT_UNAUTHORIZED !== 'false',
            ca: process.env.DB_SSL_CA,
            cert: process.env.DB_SSL_CERT,
            key: process.env.DB_SSL_KEY
        };
    }
    // 查询优化方法
    async explainQuery(sql, params) {
        const explainSql = `EXPLAIN ${sql}`;
        const result = await this.query(explainSql, params);
        return result.data || [];
    }
    // 获取表信息
    async getTableInfo(tableName) {
        const sql = `
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;
        const result = await this.query(sql, [this.config.database, tableName]);
        return result.data || [];
    }
    // 健康检查
    async healthCheck() {
        const startTime = Date.now();
        try {
            const [connected, poolStats] = await Promise.all([
                this.testConnection(),
                this.getPoolStats()
            ]);
            const testQueryTime = Date.now() - startTime;
            return {
                connected,
                poolStats,
                testQueryTime
            };
        }
        catch (error) {
            return {
                connected: false,
                poolStats: {},
                testQueryTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
}
exports.OceanBaseClient = OceanBaseClient;
//# sourceMappingURL=OceanBaseClient.js.map