"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataWorksClient = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const crypto_1 = require("crypto");
const DatabaseConnector_1 = require("./DatabaseConnector");
const logger_1 = require("../../utils/logger");
class DataWorksClient extends DatabaseConnector_1.BaseDatabaseConnector {
    axiosInstance;
    projectId;
    endpoint;
    accessKeyId;
    accessKeySecret;
    constructor(config) {
        super({
            ...config,
            type: 'dataworks'
        });
        this.projectId = config.projectId;
        this.endpoint = config.endpoint.replace(/\/+$/, '');
        this.accessKeyId = config.apiKey;
        this.accessKeySecret = config.apiSecret;
        // 创建Axios实例
        this.axiosInstance = axios_1.default.create({
            baseURL: this.endpoint,
            timeout: 300000, // 5分钟超时（DataWorks大型查询可能需要较长时间）
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        // 添加请求拦截器进行签名
        this.axiosInstance.interceptors.request.use((config) => {
            return this.signRequest(config);
        }, (error) => {
            logger_1.logger.error('DataWorks请求配置错误:', error);
            return Promise.reject(error);
        });
        // 添加响应拦截器处理错误
        this.axiosInstance.interceptors.response.use((response) => response, (error) => {
            logger_1.logger.error('DataWorks响应错误:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    async connect() {
        // DataWorks是通过API调用的，没有传统意义上的"连接"
        // 这里我们测试API是否可以正常访问
        try {
            logger_1.logger.info('正在测试DataWorks API连接...', {
                endpoint: this.endpoint,
                projectId: this.projectId
            });
            // 测试一个简单的查询
            const testResult = await this.testAPIConnection();
            if (testResult) {
                this.connected = true;
                logger_1.logger.info('DataWorks API连接测试成功');
            }
            else {
                throw new Error('DataWorks API连接测试失败');
            }
        }
        catch (error) {
            logger_1.logger.error('DataWorks API连接失败:', error);
            this.connected = false;
            throw new Error(`DataWorks连接失败: ${error.message}`);
        }
    }
    async disconnect() {
        // DataWorks不需要显式断开连接
        this.connected = false;
        logger_1.logger.info('DataWorks客户端已断开');
    }
    async query(sql, params) {
        const startTime = Date.now();
        let taskId = null;
        try {
            await this.ensureConnected();
            // 1. 提交SQL执行任务
            const executeResult = await this.executeSQL(sql);
            taskId = executeResult.TaskId;
            if (!taskId) {
                throw new Error('未获取到TaskId');
            }
            logger_1.logger.info('DataWorks SQL任务已提交', { taskId, sql: sql.substring(0, 100) });
            // 2. 轮询获取结果
            const result = await this.pollTaskResult(taskId);
            const duration = Date.now() - startTime;
            // 记录查询统计
            this.logQuery(sql, params || [], duration, true);
            // 构建响应
            return {
                success: true,
                data: result.Data || [],
                queryTime: duration,
                affectedRows: result.Data?.length || 0
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logQuery(sql, params || [], duration, false);
            return this.handleQueryError(error, sql);
        }
    }
    async testConnection() {
        try {
            await this.connect();
            const result = await this.testAPIConnection();
            return result;
        }
        catch (error) {
            logger_1.logger.error('DataWorks连接测试失败:', error);
            return false;
        }
    }
    getConnectionInfo() {
        const status = this.connected ? '已连接' : '未连接';
        return `DataWorks: ${this.endpoint}/${this.projectId}, 状态: ${status}`;
    }
    // 批量查询（DataWorks可能限制单次查询数据量）
    async queryBatch(queries) {
        const results = [];
        for (const query of queries) {
            try {
                const result = await this.query(query.sql, query.params);
                results.push(result);
            }
            catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    queryTime: 0
                });
            }
        }
        return results;
    }
    // 私有方法: 执行SQL并返回TaskId
    async executeSQL(sql) {
        try {
            const requestData = {
                ProjectId: this.projectId,
                SqlContent: sql,
                ScriptType: 'MYSQL_SQL', // 假设我们查询的是MySQL兼容的数据源
            };
            const response = await this.axiosInstance.post(`/api/v2/projects/${this.projectId}/tasks/execute`, requestData);
            if (response.data.Data?.TaskId) {
                return {
                    TaskId: response.data.Data.TaskId
                };
            }
            else {
                throw new Error(`获取TaskId失败: ${response.data.Data?.Message}`);
            }
        }
        catch (error) {
            logger_1.logger.error('执行DataWorks SQL失败:', {
                sql: sql.substring(0, 200),
                error: error.message,
                response: error.response?.data
            });
            throw new Error(`DataWorks SQL执行失败: ${error.message}`);
        }
    }
    // 私有方法: 轮询任务结果
    async pollTaskResult(taskId, maxAttempts = 60) {
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                const result = await this.getTaskResult(taskId);
                switch (result.Status) {
                    case 'SUCCESS':
                        logger_1.logger.info('DataWorks任务执行成功', { taskId, attempts });
                        return result;
                    case 'FAILED':
                        throw new Error(`DataWorks任务执行失败: ${result.ErrorMessage}`);
                    case 'RUNNING':
                    case 'SUSPENDED':
                        // 任务还在运行，等待后重试
                        attempts++;
                        await this.delay(2000); // 2秒轮询间隔
                        logger_1.logger.debug('轮询DataWorks任务状态', { taskId, status: result.Status, attempts });
                        continue;
                    default:
                        attempts++;
                        await this.delay(2000);
                        continue;
                }
            }
            catch (error) {
                // 如果是404错误，可能是任务还没准备好
                if (error.response?.status === 404) {
                    attempts++;
                    await this.delay(2000);
                    continue;
                }
                throw error;
            }
        }
        throw new Error(`DataWorks任务轮询超时: ${taskId}, 最大尝试次数: ${maxAttempts}`);
    }
    // 私有方法: 获取任务结果
    async getTaskResult(taskId) {
        const requestData = {
            TaskId: taskId,
            PageNumber: 1,
            PageSize: 1000 // 每页大小，根据需求调整
        };
        const response = await this.axiosInstance.post(`/api/v2/projects/${this.projectId}/tasks/result`, requestData);
        return response.data.Data;
    }
    // 私有方法: 请求签名
    signRequest(config) {
        const timestamp = Date.now();
        // 构建签名字符串
        const canonicalString = this.buildCanonicalString(config, timestamp);
        // 计算签名
        const signature = (0, crypto_1.createHmac)('sha256', this.accessKeySecret)
            .update(canonicalString)
            .digest('base64');
        // 添加认证头
        config.headers = {
            ...config.headers,
            'x-acs-date': timestamp.toString(),
            'x-acs-signature-method': 'HMAC-SHA256',
            'x-acs-signature-version': '1.0',
            'x-acs-signature-nonce': this.generateNonce(),
            'x-acs-signature': signature
        };
        return config;
    }
    // 私有方法: 创建签名字符串
    buildCanonicalString(config, timestamp) {
        const method = config.method?.toUpperCase() || 'GET';
        const path = config.url || '';
        const queryString = this.buildQueryString(config.params);
        let canonicalString = `${method}\n${path}\n`;
        if (queryString) {
            canonicalString += `${queryString}\n`;
        }
        // 添加时间戳和非对称密钥
        canonicalString += `${timestamp}\n`;
        canonicalString += `${this.accessKeyId}\n`;
        // 如果有请求体，添加到签名中
        if (config.data) {
            const bodyString = typeof config.data === 'string'
                ? config.data
                : JSON.stringify(config.data);
            canonicalString += `${bodyString}\n`;
        }
        return canonicalString;
    }
    // 私有方法: 构建查询字符串
    buildQueryString(params) {
        if (!params)
            return '';
        const sortedKeys = Object.keys(params).sort();
        const queryParts = sortedKeys.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
        return queryParts.join('&');
    }
    // 私有方法: 生成随机nonce
    generateNonce() {
        return Math.random().toString(36).substring(2) + Date.now();
    }
    // 私有方法: 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // 私有方法: 确保已连接
    async ensureConnected() {
        if (!this.connected) {
            await this.connect();
        }
    }
    // 私有方法: 测试API连接
    async testAPIConnection() {
        try {
            // 执行一个简单的测试查询
            const testSQL = 'SELECT 1 as connection_test';
            const result = await this.executeSQL(testSQL);
            if (result.TaskId) {
                logger_1.logger.debug('DataWorks连接测试成功，TaskId:', result.TaskId);
                // 不需要等待结果，有TaskId就说明API能正常工作
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('DataWorks API测试失败:', error);
            return false;
        }
    }
    // 统计和监控方法
    async getApiStats() {
        return {
            connected: this.connected,
            endpoint: this.endpoint,
            projectId: this.projectId,
            lastTestTime: new Date()
        };
    }
    // 处理大查询的方法（可能需要分页）
    async queryWithPagination(sql, pageNumber = 1, pageSize = 1000) {
        // DataWorks可能有自己的分页机制，这里需要根据实际情况调整
        // 目前先直接返回查询结果
        const result = await this.query(sql);
        if (!result.success) {
            throw new Error(result.error || '查询失败');
        }
        const data = result.data || [];
        const totalCount = data.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        // 内存分页（如果DataWorks不支持服务器端分页）
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pagedData = data.slice(startIndex, endIndex);
        return {
            data: pagedData,
            totalCount,
            pageNumber,
            pageSize,
            totalPages
        };
    }
}
exports.DataWorksClient = DataWorksClient;
//# sourceMappingURL=DataWorksClient.js.map