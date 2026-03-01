"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MallUserController = void 0;
const tslib_1 = require("tslib");
const errorHandler_1 = require("../../middleware/errorHandler");
const sql_1 = require("../../core/sql");
const database_1 = require("../../core/database");
const logger_1 = require("../../utils/logger");
const XLSX = tslib_1.__importStar(require("xlsx"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
class MallUserController {
    static queryMallUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const startTime = Date.now();
        try {
            const queryParams = {
                date: req.body.date,
                mobile: req.body.mobile,
                page: req.body.page || 1,
                pageSize: req.body.pageSize || 20
            };
            logger_1.logger.info('商城用户查询请求', { params: queryParams });
            const sqlProcessor = sql_1.sqlTemplateManager.getProcessor();
            try {
                await sqlProcessor.loadTemplate('mall-user-query');
            }
            catch (e) {
                logger_1.logger.warn('SQL 模板加载失败', e);
            }
            const processedSQL = sqlProcessor.processMallUserQuery(queryParams);
            const queryResult = await database_1.connectionManager.query(processedSQL.sql, processedSQL.params);
            if (!queryResult.success) {
                throw new Error(queryResult.error || '数据库查询失败');
            }
            res.json({
                success: true,
                data: {
                    items: queryResult.data || [],
                    total: queryResult.data?.length || 0,
                    page: queryParams.page || 1,
                    pageSize: queryParams.pageSize || 20
                },
                executionTime: Date.now() - startTime
            });
        }
        catch (error) {
            logger_1.logger.error('商城用户查询失败', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '查询失败'
            });
        }
    });
    static exportMallUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        try {
            const params = {
                date: req.body.date,
                mobile: req.body.mobile,
                page: 1,
                pageSize: 10000
            };
            logger_1.logger.info('商城用户导出请求', { params });
            const taskId = `mall-user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            (async () => {
                try {
                    const sqlProcessor = sql_1.sqlTemplateManager.getProcessor();
                    const processedSQL = sqlProcessor.processMallUserQuery(params);
                    const queryResult = await database_1.connectionManager.query(processedSQL.sql, processedSQL.params);
                    if (!queryResult.success) {
                        throw new Error(queryResult.error || '查询失败');
                    }
                    const records = queryResult.data || [];
                    const worksheet = XLSX.utils.json_to_sheet(records);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, '商城用户');
                    const filename = `商城用户_${params.date}_${taskId.split('_')[2]}.xlsx`;
                    const filePath = path_1.default.join(__dirname, '../../exports', filename);
                    const exportsDir = path_1.default.join(__dirname, '../../exports');
                    if (!fs_1.default.existsSync(exportsDir)) {
                        fs_1.default.mkdirSync(exportsDir, { recursive: true });
                    }
                    XLSX.writeFile(workbook, filePath);
                    logger_1.logger.info('商城用户导出完成', { taskId, recordCount: records.length });
                }
                catch (error) {
                    logger_1.logger.error('商城用户导出失败', { taskId, error });
                }
            })();
            res.status(202).json({
                success: true,
                data: { id: taskId, status: 'pending' },
                message: '导出任务已创建'
            });
        }
        catch (error) {
            logger_1.logger.error('创建导出任务失败', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '创建导出任务失败'
            });
        }
    });
}
exports.MallUserController = MallUserController;
//# sourceMappingURL=MallUserController.js.map