"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PenetrationController = void 0;
const tslib_1 = require("tslib");
const errorHandler_1 = require("../../middleware/errorHandler");
const sql_1 = require("../../core/sql");
const database_1 = require("../../core/database");
const logger_1 = require("../../utils/logger");
const XLSX = tslib_1.__importStar(require("xlsx"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
class PenetrationController {
    static queryPenetration = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const startTime = Date.now();
        try {
            const queryParams = {
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                stationCodes: req.body.stationCodes,
                barCode: req.body.barCode,
                partyCode: req.body.partyCode,
                page: req.body.page || 1,
                pageSize: req.body.pageSize || 20
            };
            logger_1.logger.info('商品渗透率查询请求', { params: queryParams });
            let records = [];
            let total = 0;
            const sqlProcessor = sql_1.sqlTemplateManager.getProcessor();
            try {
                await sqlProcessor.loadTemplate('penetration-query');
            }
            catch (e) {
                logger_1.logger.warn('SQL 模板加载失败', e);
            }
            const processedSQL = sqlProcessor.processPenetrationQuery(queryParams);
            const queryResult = await database_1.connectionManager.query(processedSQL.sql, processedSQL.params);
            if (!queryResult.success) {
                throw new Error(queryResult.error || '数据库查询失败');
            }
            records = queryResult.data || [];
            total = records.length;
            res.json({
                success: true,
                data: {
                    items: records,
                    total,
                    page: queryParams.page || 1,
                    pageSize: queryParams.pageSize || 20
                },
                executionTime: Date.now() - startTime
            });
        }
        catch (error) {
            logger_1.logger.error('商品渗透率查询失败', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '查询失败'
            });
        }
    });
    static exportPenetration = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        try {
            const params = {
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                stationCodes: req.body.stationCodes,
                barCode: req.body.barCode,
                partyCode: req.body.partyCode,
                page: 1,
                pageSize: 10000
            };
            logger_1.logger.info('商品渗透率导出请求', { params });
            const taskId = `penetration_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            (async () => {
                try {
                    const sqlProcessor = sql_1.sqlTemplateManager.getProcessor();
                    try {
                        await sqlProcessor.loadTemplate('penetration-query');
                    }
                    catch (e) {
                        logger_1.logger.warn('SQL 模板加载失败');
                    }
                    const processedSQL = sqlProcessor.processPenetrationQuery(params);
                    const queryResult = await database_1.connectionManager.query(processedSQL.sql, processedSQL.params);
                    if (!queryResult.success) {
                        throw new Error(queryResult.error || '查询失败');
                    }
                    const records = queryResult.data || [];
                    const worksheet = XLSX.utils.json_to_sheet(records);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, '商品渗透率');
                    const filename = `商品渗透率_${params.startTime}_${params.endTime}_${taskId.split('_')[2]}.xlsx`;
                    const filePath = path_1.default.join(__dirname, '../../exports', filename);
                    const exportsDir = path_1.default.join(__dirname, '../../exports');
                    if (!fs_1.default.existsSync(exportsDir)) {
                        fs_1.default.mkdirSync(exportsDir, { recursive: true });
                    }
                    XLSX.writeFile(workbook, filePath);
                    logger_1.logger.info('商品渗透率导出完成', { taskId, recordCount: records.length });
                }
                catch (error) {
                    logger_1.logger.error('商品渗透率导出失败', { taskId, error });
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
exports.PenetrationController = PenetrationController;
//# sourceMappingURL=PenetrationController.js.map