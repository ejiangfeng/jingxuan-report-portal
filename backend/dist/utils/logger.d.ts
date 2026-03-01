import winston from 'winston';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
export declare const logger: winston.Logger;
export declare function createLogger(module: string): winston.Logger;
export declare const sqlLogger: winston.Logger;
export declare const accessLogger: winston.Logger;
export declare const dbLogger: winston.Logger;
export declare function logError(message: string, error?: any, context?: any): void;
export declare function logInfo(message: string, context?: any): void;
export declare function logDebug(message: string, context?: any): void;
export declare function logWarning(message: string, context?: any): void;
export declare function structuredLog(level: LogLevel, message: string, data?: Record<string, any>): void;
export declare function logPerformance(operation: string, duration: number, context?: Record<string, any>): void;
export declare function logApiRequest(method: string, url: string, statusCode: number, duration: number, userId?: string, context?: Record<string, any>): void;
export declare function logSqlQuery(sql: string, params: any[], duration: number, success: boolean, context?: Record<string, any>): void;
export default logger;
//# sourceMappingURL=logger.d.ts.map