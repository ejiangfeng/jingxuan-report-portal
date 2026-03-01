"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlTemplateManager = exports.SQLTemplateManager = void 0;
const tslib_1 = require("tslib");
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const path_1 = tslib_1.__importDefault(require("path"));
const logger_1 = require("../../utils/logger");
const SQLProcessor_1 = require("./SQLProcessor");
// SQL模板管理器类
class SQLTemplateManager {
    templatesPath;
    templates = new Map();
    processor;
    constructor(templatesPath) {
        this.templatesPath = templatesPath;
        this.processor = new SQLProcessor_1.SQLProcessor(templatesPath);
    }
    // 初始化模板管理器
    async initialize() {
        try {
            logger_1.logger.info('正在初始化SQL模板管理器...', { path: this.templatesPath });
            // 确保模板目录存在
            await this.ensureTemplateDirectory();
            // 加载所有模板
            await this.loadAllTemplates();
            logger_1.logger.info('SQL模板管理器初始化完成', {
                templateCount: this.templates.size,
                loadedTemplates: Array.from(this.templates.keys())
            });
        }
        catch (error) {
            logger_1.logger.error('SQL模板管理器初始化失败:', error);
            throw new Error(`SQL模板管理器初始化失败: ${error.message}`);
        }
    }
    // 获取模板配置
    async getTemplate(templateName) {
        const template = this.templates.get(templateName);
        if (!template) {
            // 尝试动态加载
            try {
                const loadedTemplate = await this.processor.loadTemplate(templateName);
                this.templates.set(templateName, loadedTemplate);
                return loadedTemplate;
            }
            catch (error) {
                throw new Error(`SQL模板未找到: ${templateName}`);
            }
        }
        return template;
    }
    // 获取所有模板
    getAllTemplates() {
        return Array.from(this.templates.values());
    }
    // 获取模板名称列表
    getTemplateNames() {
        return Array.from(this.templates.keys());
    }
    // 验证模板是否存在
    hasTemplate(templateName) {
        return this.templates.has(templateName);
    }
    // 重新加载模板
    async reloadTemplate(templateName) {
        logger_1.logger.info('重新加载SQL模板:', { templateName });
        try {
            const template = await this.processor.loadTemplate(templateName);
            this.templates.set(templateName, template);
            logger_1.logger.info('SQL模板重新加载成功:', { templateName });
            return template;
        }
        catch (error) {
            logger_1.logger.error('重新加载SQL模板失败:', { templateName, error });
            throw error;
        }
    }
    // 重新加载所有模板
    async reloadAllTemplates() {
        logger_1.logger.info('重新加载所有SQL模板...');
        try {
            await this.loadAllTemplates();
            logger_1.logger.info('所有SQL模板重新加载完成', {
                templateCount: this.templates.size
            });
        }
        catch (error) {
            logger_1.logger.error('重新加载所有SQL模板失败:', error);
            throw error;
        }
    }
    // 处理查询
    async processQuery(templateName, queryParams) {
        try {
            // 获取模板
            const template = await this.getTemplate(templateName);
            // 验证查询参数
            this.validateQueryParams(queryParams, template);
            // 处理查询
            const result = this.processor.processQuery(templateName, queryParams);
            // 验证SQL安全性
            const safetyCheck = this.processor.validateSQLSafety(result.sql);
            if (!safetyCheck.valid) {
                throw new Error(`SQL安全性验证失败: ${safetyCheck.errors.join(', ')}`);
            }
            return {
                sql: result.sql,
                params: result.params,
                template
            };
        }
        catch (error) {
            logger_1.logger.error('处理SQL查询失败:', {
                templateName,
                error: error.message,
                queryParams: this.sanitizeQueryParams(queryParams)
            });
            throw error;
        }
    }
    // 获取SQL处理器
    getProcessor() {
        return this.processor;
    }
    // 清理查询参数（用于日志记录）
    sanitizeQueryParams(params) {
        if (!params)
            return params;
        const sanitized = { ...params };
        // 清理敏感信息（如密码）
        if (sanitized.filters) {
            if (sanitized.filters.mobile) {
                sanitized.filters.mobile = '***隐藏***';
            }
        }
        return sanitized;
    }
    // 验证查询参数
    validateQueryParams(params, template) {
        const errors = [];
        if (!params.filters) {
            errors.push('缺少筛选参数');
        }
        else {
            const { filters } = params;
            // 验证必填字段
            if (!filters.dateRange || !filters.dateRange.start || !filters.dateRange.end) {
                errors.push('必须提供时间范围');
            }
            // 验证时间范围格式
            if (filters.dateRange.start && filters.dateRange.end) {
                const start = new Date(filters.dateRange.start);
                const end = new Date(filters.dateRange.end);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    errors.push('时间范围格式无效');
                }
                if (start > end) {
                    errors.push('开始时间不能晚于结束时间');
                }
                // 限制查询时间范围（最长31天）
                const maxDays = 31;
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > maxDays) {
                    errors.push(`时间范围不能超过${maxDays}天，当前: ${diffDays}天`);
                }
            }
            // 验证手机号格式
            if (filters.mobile && filters.mobile.trim()) {
                const mobileRegex = /^1[3-9]\d{9}$/;
                if (!mobileRegex.test(filters.mobile.trim())) {
                    errors.push('手机号格式无效');
                }
            }
            // 验证门店ID格式
            if (filters.storeIds && filters.storeIds.trim()) {
                const storeIds = filters.storeIds.split(',').map(id => id.trim());
                const invalidIds = storeIds.filter(id => !/^\d+$/.test(id));
                if (invalidIds.length > 0) {
                    errors.push(`门店ID格式无效: ${invalidIds.join(', ')}`);
                }
            }
            // 验证订单状态
            if (filters.statuses && Array.isArray(filters.statuses)) {
                const validStatuses = [1, 2, 3, 4, 5, 6, 7, 10, 15, 50, 60];
                const invalidStatuses = filters.statuses.filter((status) => !validStatuses.includes(status));
                if (invalidStatuses.length > 0) {
                    errors.push(`无效的订单状态: ${invalidStatuses.join(', ')}`);
                }
            }
        }
        // 验证分页参数
        if (params.pagination) {
            const { page, pageSize } = params.pagination;
            if (page < 1) {
                errors.push('页码必须大于0');
            }
            if (pageSize < 1 || pageSize > 1000) {
                errors.push('每页数量必须在1-1000之间');
            }
        }
        if (errors.length > 0) {
            throw new Error(`查询参数验证失败: ${errors.join(', ')}`);
        }
    }
    // 确保模板目录存在
    async ensureTemplateDirectory() {
        try {
            await promises_1.default.access(this.templatesPath);
        }
        catch (error) {
            logger_1.logger.info('创建SQL模板目录:', { path: this.templatesPath });
            await promises_1.default.mkdir(this.templatesPath, { recursive: true });
        }
    }
    // 加载所有模板
    async loadAllTemplates() {
        try {
            const files = await promises_1.default.readdir(this.templatesPath);
            const sqlFiles = files.filter(file => file.endsWith('.sql'));
            logger_1.logger.debug('发现SQL模板文件:', { files: sqlFiles });
            // 并行加载所有模板
            const loadPromises = sqlFiles.map(async (file) => {
                const templateName = file.replace('.sql', '');
                try {
                    const template = await this.processor.loadTemplate(templateName);
                    this.templates.set(templateName, template);
                    logger_1.logger.debug('SQL模板加载成功:', { templateName });
                }
                catch (error) {
                    logger_1.logger.error('SQL模板加载失败:', { templateName, error: error.message });
                }
            });
            await Promise.all(loadPromises);
        }
        catch (error) {
            logger_1.logger.error('读取SQL模板目录失败:', error);
            throw error;
        }
    }
    // 获取模板统计信息
    getStats() {
        return {
            totalTemplates: this.templates.size,
            templateNames: Array.from(this.templates.keys()),
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) // MB
        };
    }
    // 导出模板配置（用于调试）
    exportTemplateConfig(templateName) {
        const template = this.templates.get(templateName);
        if (!template) {
            return null;
        }
        return {
            name: template.name,
            description: template.description,
            parameters: template.parameters,
            hasPagination: template.hasPagination,
            sqlPreview: template.sql.substring(0, 500) + (template.sql.length > 500 ? '...' : '')
        };
    }
    // 健康检查
    async healthCheck() {
        try {
            await this.reloadAllTemplates();
            return {
                healthy: true,
                templateCount: this.templates.size
            };
        }
        catch (error) {
            return {
                healthy: false,
                templateCount: this.templates.size,
                error: error.message
            };
        }
    }
}
exports.SQLTemplateManager = SQLTemplateManager;
// 导出单例模板管理器
exports.sqlTemplateManager = new SQLTemplateManager(path_1.default.join(__dirname, '../../../sql-templates'));
//# sourceMappingURL=SQLTemplateManager.js.map