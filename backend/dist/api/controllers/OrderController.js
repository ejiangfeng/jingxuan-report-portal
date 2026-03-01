"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const errorHandler_1 = require("../../middleware/errorHandler");
const sql_1 = require("../../core/sql");
const database_1 = require("../../core/database");
const logger_1 = require("../../utils/logger");
const types_1 = require("../../types");
// 订单查询控制器
class OrderController {
    // 查询订单列表（新接口，支持两种参数格式）
    static queryOrders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const startTime = Date.now();
        try {
            const body = req.body;
            let queryParams;
            // 1. 判断请求体格式，兼容新旧接口
            if (body.startTime && body.endTime) {
                // 新接口格式
                queryParams = {
                    startTime: body.startTime,
                    endTime: body.endTime,
                    stationCodes: body.stationCodes,
                    mobile: body.mobile,
                    status: body.status,
                    page: body.page,
                    pageSize: body.pageSize
                };
            }
            else if (body.filters?.dateRange) {
                // 旧接口格式（向后兼容）
                queryParams = {
                    startTime: body.filters.dateRange.start,
                    endTime: body.filters.dateRange.end,
                    stationCodes: body.filters.storeIds,
                    mobile: body.filters.mobile,
                    status: body.filters.statuses,
                    page: body.pagination?.page,
                    pageSize: body.pagination?.pageSize
                };
            }
            else {
                throw new Error('请求参数格式错误');
            }
            logger_1.logger.info('订单查询请求', {
                format: body.startTime ? 'new' : 'legacy',
                params: this.sanitizeOrderQueryParams(queryParams),
                userId: req.user?.id
            });
            let records = [];
            let total = 0;
            let dbDuration = 0;
            // 使用真实数据库查询
            // 2. 使用 SQL 处理器处理查询
            const sqlProcessor = sql_1.sqlTemplateManager.getSQLProcessor();
            const processedSQL = sqlProcessor.processOrderQuery(queryParams);
            logger_1.logger.debug('SQL 处理完成', {
                sql: processedSQL.sql.substring(0, 200) + (processedSQL.sql.length > 200 ? '...' : ''),
                paramCount: processedSQL.params.length,
                hasPagination: processedSQL.hasPagination
            });
            // 3. 执行查询
            const dbStartTime = Date.now();
            const queryResult = await database_1.connectionManager.query(processedSQL.sql, processedSQL.params);
            dbDuration = Date.now() - dbStartTime;
            if (!queryResult.success) {
                logger_1.logger.error('数据库查询失败', {
                    error: queryResult.error,
                    sql: processedSQL.sql.substring(0, 200),
                    paramCount: processedSQL.params.length
                });
                throw new Error(queryResult.error || '数据库查询失败');
            }
            // 4. 处理查询结果
            const processedResult = sqlProcessor.processQueryResults(queryResult.data);
            records = processedResult.records;
            // 5. 获取总数（执行 COUNT 查询）
            try {
                const countSQL = sqlProcessor.processCountingSQL(queryParams);
                const countResult = await database_1.connectionManager.query(countSQL.sql, countSQL.params);
                if (countResult.success && countResult.data?.[0]) {
                    total = countResult.data[0].total || 0;
                }
            }
            catch (countError) {
                logger_1.logger.warn('获取总数查询失败，使用分页数据估算', {
                    error: countError.message
                });
            }
            // 4. 处理查询结果
            const processedResult = sqlProcessor.processQueryResults(queryResult.data);
            records = processedResult.records;
            // 5. 获取总数（执行COUNT查询）
            try {
                const countSQL = sqlProcessor.processCountingSQL(queryParams);
                const countResult = await database_1.connectionManager.query(countSQL.sql, countSQL.params);
                if (countResult.success && countResult.data?.[0]) {
                    total = countResult.data[0].total || 0;
                }
            }
            catch (countError) {
                logger_1.logger.warn('获取总数查询失败，使用分页数据估算', {
                    error: countError.message
                });
            }
        }
        // 计算分页信息
        finally {
        }
        // 计算分页信息
        const page = queryParams.page || 1;
        const pageSize = queryParams.pageSize || 20;
        const totalPages = Math.ceil(total / pageSize);
        // 7. 构建响应
        const duration = Date.now() - startTime;
        const response = {
            success: true,
            data: {
                items: records,
                total,
                page,
                pageSize,
                totalPages
            },
            timestamp: new Date().toISOString(),
            queryConditions: queryParams,
            executionTime: duration
        };
        // 8. 记录查询性能
        logger_1.logger.info('订单查询完成', {
            duration: `${duration}ms`,
            dbDuration: `${dbDuration}ms`,
            recordCount: total,
            page,
            pageSize,
            totalPages,
            executionTime: duration
        });
        // 9. 添加性能警告（如果需要）
        if (dbDuration > 5000) {
            response.warning = `查询处理时间较长: ${dbDuration}ms`;
        }
        res.status(200).json(response);
    });
    catch(error) {
        logger_1.logger.error('订单查询失败', {
            error: error.message,
            stack: error.stack,
            requestBody: this.sanitizeRequestBody(req.body),
            userId: req.user?.id,
            duration: `${Date.now() - startTime}ms`
        });
        throw error;
    }
}
exports.OrderController = OrderController;
getOrderCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = req.body;
    const templateName = 'order-reconciliation';
    try {
        // 处理SQL模板
        const { sql: originalSql, params } = await sql_1.sqlTemplateManager.processQuery(templateName, { ...queryParams, pagination: undefined } // 不需要分页
        );
        // 修改SQL为COUNT查询
        const countSql = this.convertToCountQuery(originalSql);
        // 执行COUNT查询
        const result = await database_1.connectionManager.query(countSql, params);
        if (!result.success) {
            throw new Error(result.error || '数量查询失败');
        }
        const count = result.data?.[0]?.total || 0;
        const response = {
            success: true,
            data: { count },
            timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('获取订单数量失败', {
            error: error.message,
            templateName,
            filters: this.sanitizeFilters(queryParams.filters)
        });
        throw error;
    }
});
exportOrders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const exportParams = req.body;
    const maxExportSize = 50000; // 最大导出条数
    try {
        // 1. 检查导出数据量
        const countResult = await this.getOrderCountFromRequest(exportParams);
        const count = countResult.data?.count || 0;
        if (count > maxExportSize) {
            throw new Error(`导出数据量(${count})超过限制(${maxExportSize})，请缩小查询范围`);
        }
        // 2. 创建导出任务
        const jobId = this.generateJobId();
        const exportJob = {
            id: jobId,
            status: 'pending',
            params: exportParams,
            created_at: new Date(),
            download_url: `/api/v1/exports/download/${jobId}`
        };
        // 3. 根据数据量决定导出策略
        let exportResponse;
        if (count <= 1000) {
            // 小数据量：即时处理并返回
            exportResponse = await this.handleSmallExport(exportParams, exportJob);
        }
        else {
            // 大数据量：创建异步任务
            exportJob.status = 'processing';
            exportResponse = this.handleLargeExport(exportJob);
            // 后台异步处理（实际应用中应该使用任务队列）
            this.processExportAsync(exportJob).catch(error => {
                logger_1.logger.error('异步导出处理失败', { jobId, error: error.message });
            });
        }
        res.status(202).json(exportResponse);
    }
    catch (error) {
        logger_1.logger.error('导出订单失败', {
            error: error.message,
            exportParams: this.sanitizeExportParams(exportParams),
            userId: req.user?.id
        });
        throw error;
    }
});
getExportStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    // 这里应该从数据库或缓存中获取任务状态
    // 临时实现：假设所有任务都是成功的
    const exportJob = {
        id: jobId,
        status: 'completed',
        params: {},
        created_at: new Date(Date.now() - 60000), // 1分钟前
        completed_at: new Date(),
        download_url: `/api/v1/exports/download/sample_export.xlsx`
    };
    const response = {
        success: true,
        data: exportJob,
        timestamp: new Date().toISOString()
    };
    res.status(200).json(response);
});
downloadExport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    // 这里应该从文件系统中读取实际的文件
    // 临时实现：返回一个示例响应
    const fileName = `订单导出_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-File-Name', fileName);
    res.setHeader('X-Export-Job-ID', jobId);
    // 模拟文件下载
    res.status(200).json({
        success: true,
        message: '文件下载开始...（请将此处改为实际的文件流传输）',
        fileName
    });
});
sanitizeFilters(filters, any);
any;
{
    if (!filters)
        return {};
    const sanitized = { ...filters };
    // 清理手机号
    if (sanitized.mobile) {
        sanitized.mobile = '***隐藏***';
    }
    // 清理其他可能的敏感信息
    if (sanitized.customerInfo) {
        sanitized.customerInfo = '***隐藏***';
    }
    return sanitized;
}
sanitizeOrderQueryParams(params, types_1.OrderQueryParams);
types_1.OrderQueryParams;
{
    if (!params)
        return {};
    const sanitized = { ...params };
    // 清理手机号
    if (sanitized.mobile) {
        sanitized.mobile = '***隐藏***';
    }
    return sanitized;
}
sanitizeRequestBody(body, any);
any;
{
    const sanitized = { ...body };
    // 检查请求体格式，分别处理
    if (sanitized.mobile) {
        sanitized.mobile = '***隐藏***';
    }
    if (sanitized.filters) {
        sanitized.filters = this.sanitizeFilters(sanitized.filters);
    }
    return sanitized;
}
sanitizeExportParams(params, types_1.ExportParams);
any;
{
    return {
        ...params,
        filters: this.sanitizeFilters(params?.filters)
    };
}
convertToCountQuery(originalSql, string);
string;
{
    // 移除分页部分
    let sql = originalSql.replace(/LIMIT\s+\d+\s+OFFSET\s+\d+/gi, '');
    // 找到SELECT和FROM之间的部分，替换为COUNT(*)
    const selectIndex = sql.toUpperCase().indexOf('SELECT');
    const fromIndex = sql.toUpperCase().indexOf('FROM', selectIndex);
    if (selectIndex !== -1 && fromIndex !== -1) {
        // 保留SELECT到FROM之间的内容，替换为 COUNT(*) as total
        const beforeSelect = sql.substring(0, selectIndex);
        const afterFrom = sql.substring(fromIndex);
        sql = `${beforeSelect}SELECT COUNT(*) as total ${afterFrom}`;
    }
    // 移除ORDER BY
    sql = sql.replace(/ORDER BY.*$/gi, '');
    // 移除GROUP BY（COUNT查询通常不需要GROUP BY）
    const groupByIndex = sql.toUpperCase().indexOf('GROUP BY');
    if (groupByIndex !== -1) {
        sql = sql.substring(0, groupByIndex);
    }
    return sql.trim();
}
async;
getOrderCountFromRequest(params, types_1.ExportParams);
Promise < types_1.ApiResponse < { count: number } >> {
    const: templateName = 'order-reconciliation',
    try: {
        // 处理SQL模板
        const: { sql: originalSql, params: sqlParams } = await sql_1.sqlTemplateManager.processQuery(templateName, { ...params, pagination: undefined })
        // 转换为COUNT查询
        ,
        // 转换为COUNT查询
        const: countSql = this.convertToCountQuery(originalSql)
        // 执行查询
        ,
        // 执行查询
        const: result = await database_1.connectionManager.query(countSql, sqlParams),
        if(, result) { }, : .success
    }
};
{
    throw new Error(result.error || '数量查询失败');
}
const count = result.data?.[0]?.total || 0;
return {
    success: true,
    data: { count },
    timestamp: new Date().toISOString()
};
try { }
catch (error) {
    logger_1.logger.error('从请求获取订单数量失败', {
        error: error.message,
        params: this.sanitizeExportParams(params)
    });
    return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
    };
}
generateJobId();
string;
{
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `export_${timestamp}_${random}`;
}
async;
handleSmallExport(exportParams, types_1.ExportParams, exportJob, types_1.ExportJob);
Promise < types_1.ApiResponse > {
    const: startTime = Date.now(),
    try: {
        // 实际应用中应该生成真实的Excel文件
        // 这里只返回模拟数据
        const: duration = Date.now() - startTime,
        exportJob, : .status = 'completed',
        exportJob, : .completed_at = new Date(),
        logger: logger_1.logger, : .info('小数据量导出完成', {
            jobId: exportJob.id,
            duration: `${duration}ms`,
            recordCount: 1000 // 模拟值
        }),
        return: {
            success: true,
            data: exportJob,
            message: '导出完成，可立即下载',
            timestamp: new Date().toISOString()
        }
    }, catch(error) {
        logger_1.logger.error('小数据量导出失败', {
            jobId: exportJob.id,
            error: error.message
        });
        exportJob.status = 'failed';
        exportJob.error = error.message;
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};
handleLargeExport(exportJob, types_1.ExportJob);
types_1.ApiResponse;
{
    return {
        success: true,
        data: exportJob,
        message: '数据量较大，正在后台处理中，请稍后在导出历史中查看',
        timestamp: new Date().toISOString()
    };
}
async;
processExportAsync(exportJob, types_1.ExportJob);
Promise < void  > {
    logger: logger_1.logger, : .info('开始异步导出处理', { jobId: exportJob.id })
    // 模拟处理延迟
    ,
    // 模拟处理延迟
    await, new: Promise(resolve => setTimeout(resolve, 5000)),
    exportJob, : .status = 'completed',
    exportJob, : .completed_at = new Date(),
    logger: logger_1.logger, : .info('异步导出处理完成', { jobId: exportJob.id })
};
getOrderStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = req.body;
    try {
        // 这里可以添加各种统计查询逻辑
        // 例如：按时间统计、按门店统计、按渠道统计等
        const stats = {
            totalOrders: 0,
            totalAmount: 0,
            avgAmount: 0,
            successRate: 0,
            topStores: [],
            distributionByChannel: {},
            distributionByStatus: {},
            // ... 更多统计信息
        };
        const response = {
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('获取订单统计失败', {
            error: error.message,
            filters: this.sanitizeFilters(queryParams.filters)
        });
        throw error;
    }
});
getOrderDetail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { orderNumber } = req.params;
    try {
        // 构建查询单笔订单的SQL
        const sql = `
        SELECT * FROM tz_order 
        WHERE order_number = ?
        LIMIT 1
      `;
        const result = await database_1.connectionManager.query(sql, [orderNumber]);
        if (!result.success || !result.data?.length) {
            throw new Error('订单未找到');
        }
        const orderDetail = result.data[0];
        const response = {
            success: true,
            data: orderDetail,
            timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('获取订单详情失败', {
            orderNumber,
            error: error.message
        });
        throw error;
    }
});
getFilterOptions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        // 使用真实数据库查询（简化版）
        // TODO: 从数据库查询所有唯一的门店、状态等
        const storedStores = [
            { id: '1101', name: '北京朝阳门店', outCode: '1101' },
            { id: '2001', name: '上海浦东门店', outCode: '2001' },
            { id: '3101', name: '深圳南山门店', outCode: '3101' },
            { id: '3301', name: '杭州西湖门店', outCode: '3301' },
            { id: '4401', name: '广州天河门店', outCode: '4401' }
        ];
        const options = {
            // 门店列表
            stores: storedStores,
            // 订单状态选项（使用枚举）
            statuses: Object.entries(types_1.OrderStatus).map(([value, label]) => ({
                value,
                label
            })),
            // 订单类型选项
            types: Object.entries(types_1.OrderType).map(([value, label]) => ({
                value,
                label
            })),
            // 来源渠道选项
            channels: Object.entries(types_1.OrderSourceChannel).map(([value, label]) => ({
                value,
                label
            })),
            // 配送方式选项
            deliveryMethods: Object.entries(types_1.DeliveryType).map(([value, label]) => ({
                value,
                label
            })),
            // 支付方式选项（简化的）
            paymentMethods: [
                { value: 'wx', label: '微信支付' },
                { value: 'alipay', label: '支付宝支付' },
                { value: 'bank', label: '银行卡支付' },
                { value: 'points', label: '积分支付' }
            ],
            // 快速日期范围选项
            quickDateRanges: [
                { value: 'today', label: '今天', days: 0 },
                { value: 'yesterday', label: '昨天', days: 1 },
                { value: 'last7days', label: '近7天', days: 7 },
                { value: 'last30days', label: '近30天', days: 30 },
                { value: 'thismonth', label: '本月', days: 'month' },
                { value: 'lastmonth', label: '上月', days: 'last-month' }
            ]
        };
        const response = {
            success: true,
            data: options,
            timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('获取筛选选项失败', { error: error.message });
        throw error;
    }
});
//# sourceMappingURL=OrderController.js.map