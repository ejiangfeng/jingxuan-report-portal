"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = exports.sqlLoggerMiddleware = exports.rateLimitLogger = exports.requestLogger = void 0;
exports.logSqlQueryToRequest = logSqlQueryToRequest;
const logger_1 = require("../utils/logger");
// 请求日志中间件
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    // 记录请求开始
    req._startTime = startTime;
    // 存储原始的end方法
    const originalEnd = res.end;
    // 覆盖end方法来捕获响应信息
    res.end = function (chunk, encoding, callback) {
        // 恢复原始的end方法
        res.end = originalEnd;
        // 记录请求完成
        logRequest(req, res, startTime);
        // 调用原始的end方法
        return originalEnd.call(this, chunk, encoding, callback);
    };
    next();
};
exports.requestLogger = requestLogger;
// 记录请求详情
function logRequest(req, res, startTime) {
    const duration = Date.now() - startTime;
    // 排除某些路径（如健康检查）
    const excludedPaths = ['/health', '/favicon.ico', '/robots.txt'];
    if (excludedPaths.includes(req.path)) {
        return;
    }
    // 获取客户端信息
    const clientIP = getClientIP(req);
    const userAgent = req.get('user-agent') || '';
    const referer = req.get('referer') || '';
    // 获取用户标识（如果有的话）
    const userId = req.user?.id || req.user?.userId;
    // 构建日志数据
    const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        duration: `${duration}ms`,
        ip: clientIP,
        userAgent: userAgent.substring(0, 200), // 限制长度
        referer: referer.substring(0, 200), // 限制长度
        userId,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        params: Object.keys(req.params).length > 0 ? req.params : undefined,
        // 注意：一般不记录请求体，可能包含敏感信息
        contentType: req.get('content-type'),
        contentLength: req.get('content-length'),
        responseLength: res.get('content-length'),
        timestamp: new Date().toISOString()
    };
    // 根据状态码决定日志级别
    let logLevel;
    if (res.statusCode >= 500) {
        logLevel = 'error';
    }
    else if (res.statusCode >= 400) {
        logLevel = 'warn';
    }
    else {
        logLevel = 'info';
    }
    // 记录访问日志
    logger_1.accessLogger.log(logLevel, 'API访问', logData);
    // 使用简化的API请求日志方法
    (0, logger_1.logApiRequest)(req.method, req.originalUrl, res.statusCode, duration, userId, {
        ip: clientIP,
        userAgent: userAgent.substring(0, 100)
    });
    // 慢请求警告
    if (duration > 5000) {
        logger_1.logger.warn('请求处理时间过长', {
            duration: `${duration}ms`,
            method: req.method,
            url: req.originalUrl,
            ip: clientIP
        });
    }
}
// 获取客户端真实IP地址
function getClientIP(req) {
    // 优先级：X-Real-IP > X-Forwarded-For > 原始IP
    return (req.get('X-Real-IP') ||
        (req.get('X-Forwarded-For') || '').split(',')[0].trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        'unknown');
}
// 请求速率限制日志（独立中间件）
const rateLimitLogger = (req, res, next) => {
    const rateLimitError = req.rateLimit;
    if (rateLimitError) {
        logger_1.logger.warn('请求频率限制', {
            ip: getClientIP(req),
            method: req.method,
            url: req.originalUrl,
            limit: rateLimitError.limit,
            remaining: rateLimitError.remaining,
            resetTime: rateLimitError.resetTime,
            windowMs: rateLimitError.windowMs,
            timestamp: new Date().toISOString()
        });
    }
    next();
};
exports.rateLimitLogger = rateLimitLogger;
// SQL查询日志中间件
const sqlLoggerMiddleware = (req, res, next) => {
    // 这里我们依赖具体的SQL执行器来记录SQL日志
    // 这个中间件主要用于在请求上下文中添加SQL查询信息
    req.sqlQueries = [];
    // 存储原始的回调函数
    const originalWriteHead = res.writeHead;
    // 重写writeHead来记录SQL查询统计
    res.writeHead = function (statusCode, headers) {
        const sqlQueries = req.sqlQueries || [];
        if (sqlQueries.length > 0) {
            const totalDuration = sqlQueries.reduce((sum, q) => sum + q.duration, 0);
            const avgDuration = totalDuration / sqlQueries.length;
            const maxDuration = Math.max(...sqlQueries.map((q) => q.duration));
            // 记录SQL查询统计
            logger_1.logger.info('SQL查询统计', {
                requestId: req.id || 'unknown',
                method: req.method,
                url: req.originalUrl,
                totalQueries: sqlQueries.length,
                totalDuration: `${totalDuration}ms`,
                avgDuration: `${avgDuration.toFixed(2)}ms`,
                maxDuration: `${maxDuration}ms`,
                queries: sqlQueries.map((q) => ({
                    duration: q.duration,
                    success: q.success
                })),
                timestamp: new Date().toISOString()
            });
            // 慢SQL查询警告
            if (maxDuration > 1000) {
                logger_1.logger.warn('检测到慢SQL查询', {
                    requestId: req.id || 'unknown',
                    method: req.method,
                    url: req.originalUrl,
                    maxDuration: `${maxDuration}ms`,
                    slowQueries: sqlQueries.filter((q) => q.duration > 1000).length
                });
            }
        }
        return originalWriteHead.call(this, statusCode, headers);
    };
    next();
};
exports.sqlLoggerMiddleware = sqlLoggerMiddleware;
// 记录SQL查询（由SQL执行器调用）
function logSqlQueryToRequest(req, sql, params, duration, success) {
    if (!req)
        return;
    if (!req.sqlQueries) {
        req.sqlQueries = [];
    }
    // 截断长SQL
    const truncatedSql = sql.length > 200 ? sql.substring(0, 200) + '...' : sql(req).sqlQueries.push({
        sql: truncatedSql,
        paramCount: params?.length || 0,
        duration,
        success,
        timestamp: new Date().toISOString()
    });
    // 调用全局SQL日志记录器
    const { logSqlQuery } = require('../utils/logger');
    logSqlQuery(sql, params, duration, success, {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl
    });
}
// 性能监控中间件
const performanceMonitor = (req, res, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const originalEnd = res.end;
    res.end = function (chunk, encoding, callback) {
        res.end = originalEnd;
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();
        const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
        // 只在开发环境记录详细性能数据
        if (process.env.NODE_ENV !== 'production') {
            logger_1.logger.debug('请求性能监控', {
                method: req.method,
                url: req.originalUrl,
                duration: `${duration}ms`,
                memoryUsed: `${(memoryUsed / 1024 / 1024).toFixed(2)} MB`,
                memoryUsage: {
                    heapTotal: `${(endMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                    heapUsed: `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    external: `${(endMemory.external / 1024 / 1024).toFixed(2)} MB`,
                    rss: `${(endMemory.rss / 1024 / 1024).toFixed(2)} MB`
                },
                timestamp: new Date().toISOString()
            });
        }
        // 生产环境中只记录性能警告
        else if (duration > 3000 || memoryUsed > 100 * 1024 * 1024) {
            logger_1.logger.warn('性能警告', {
                method: req.method,
                url: req.originalUrl,
                duration: `${duration}ms`,
                memoryUsed: `${(memoryUsed / 1024 / 1024).toFixed(2)} MB`
            });
        }
        return originalEnd.call(this, chunk, encoding, callback);
    };
    next();
};
exports.performanceMonitor = performanceMonitor;
// 导出所有日志中间件
exports.default = {
    requestLogger: exports.requestLogger,
    rateLimitLogger: exports.rateLimitLogger,
    sqlLoggerMiddleware: exports.sqlLoggerMiddleware,
    performanceMonitor: exports.performanceMonitor,
    logSqlQueryToRequest
};
//# sourceMappingURL=requestLogger.js.map