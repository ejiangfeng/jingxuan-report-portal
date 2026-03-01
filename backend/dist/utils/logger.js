"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbLogger = exports.accessLogger = exports.sqlLogger = exports.logger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
exports.logError = logError;
exports.logInfo = logInfo;
exports.logDebug = logDebug;
exports.logWarning = logWarning;
exports.structuredLog = structuredLog;
exports.logPerformance = logPerformance;
exports.logApiRequest = logApiRequest;
exports.logSqlQuery = logSqlQuery;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const path_1 = tslib_1.__importDefault(require("path"));
const config_1 = require("../config");
// 创建日志目录
const logDir = path_1.default.join(__dirname, '../../logs');
// 定义日志级别
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// 自定义日志格式
const customFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
        // 添加应用标识
        app: 'jingxuan-report',
        env: config_1.config.app.env,
        pid: process.pid
    });
}));
// 控制台格式（用于开发环境）
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length > 0
        ? ` ${JSON.stringify(cleanMeta(meta))}`
        : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
}));
// 清理敏感信息的元数据
function cleanMeta(meta) {
    const sensitiveFields = [
        'password',
        'secret',
        'token',
        'key',
        'authorization',
        'Authorization'
    ];
    const cleaned = { ...meta };
    for (const field of sensitiveFields) {
        if (cleaned[field]) {
            cleaned[field] = '[HIDDEN]';
        }
    }
    return cleaned;
}
// 创建Winston日志记录器
exports.logger = winston_1.default.createLogger({
    level: config_1.config.app.env === 'production' ? 'info' : 'debug',
    format: customFormat,
    defaultMeta: { service: 'report-platform' },
    transports: [
        // 错误日志文件
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 综合日志文件
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // SQL查询日志文件
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'sql.log'),
            level: 'debug',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            // 过滤只记录SQL相关的日志
            filter: (info) => {
                return info.sql || info.sqlQuery || info.query || info.category === 'sql';
            }
        }),
        // 访问日志文件
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'access.log'),
            level: 'info',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            filter: (info) => {
                return info.category === 'access' || info.url || info.method;
            }
        }),
    ],
});
// 开发环境添加控制台输出
if (config_1.config.app.env !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
// 如果是生产环境，同时添加控制台输出（用于Docker日志）
else {
    exports.logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple(),
    }));
}
// 创建子记录器
function createLogger(module) {
    return exports.logger.child({ module });
}
// SQL查询专用记录器
exports.sqlLogger = createLogger('sql');
// 访问日志专用记录器
exports.accessLogger = createLogger('access');
// 数据库连接记录器
exports.dbLogger = createLogger('database');
// 导出便捷方法
function logError(message, error, context) {
    exports.logger.error(message, {
        error: error?.message || error,
        stack: error?.stack,
        ...context
    });
}
function logInfo(message, context) {
    exports.logger.info(message, context);
}
function logDebug(message, context) {
    exports.logger.debug(message, context);
}
function logWarning(message, context) {
    exports.logger.warn(message, context);
}
// 结构化日志方法
function structuredLog(level, message, data = {}) {
    const logData = {
        ...data,
        service: 'report-platform',
        timestamp: new Date().toISOString(),
        level,
        message
    };
    switch (level) {
        case LogLevel.ERROR:
            exports.logger.error(message, logData);
            break;
        case LogLevel.WARN:
            exports.logger.warn(message, logData);
            break;
        case LogLevel.INFO:
            exports.logger.info(message, logData);
            break;
        case LogLevel.DEBUG:
            exports.logger.debug(message, logData);
            break;
        default:
            exports.logger.info(message, logData);
    }
}
// 性能监控日志
function logPerformance(operation, duration, context) {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    structuredLog(level, '性能监控', {
        operation,
        duration_ms: duration,
        ...context
    });
}
// API请求日志
function logApiRequest(method, url, statusCode, duration, userId, context) {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    structuredLog(level, 'API请求', {
        method,
        url,
        status: statusCode,
        duration_ms: duration,
        userId,
        ...context
    });
}
// SQL查询日志
function logSqlQuery(sql, params, duration, success, context) {
    const level = !success ? LogLevel.ERROR : duration > 500 ? LogLevel.WARN : LogLevel.DEBUG;
    // 截断长SQL用于日志
    const truncatedSql = sql.length > 500 ? sql.substring(0, 500) + '...' : sql;
    structuredLog(level, 'SQL查询', {
        sql: truncatedSql,
        paramCount: params.length,
        duration_ms: duration,
        success,
        ...context
    });
}
// 导出默认记录器
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map