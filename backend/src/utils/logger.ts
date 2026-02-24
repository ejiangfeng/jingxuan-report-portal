import winston from 'winston'
import path from 'path'
import { config } from '../config'

// 创建日志目录
const logDir = path.join(__dirname, '../../logs')

// 定义日志级别
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      // 添加应用标识
      app: 'jingxuan-report',
      env: config.app.env,
      pid: process.pid
    })
  })
)

// 控制台格式（用于开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length > 0 
        ? ` ${JSON.stringify(cleanMeta(meta))}` 
        : ''
      return `${timestamp} [${level}]: ${message}${metaString}`
    }
  )
)

// 清理敏感信息的元数据
function cleanMeta(meta: any): any {
  const sensitiveFields = [
    'password',
    'secret',
    'token',
    'key',
    'authorization',
    'Authorization'
  ]
  
  const cleaned = { ...meta }
  
  for (const field of sensitiveFields) {
    if (cleaned[field]) {
      cleaned[field] = '[HIDDEN]'
    }
  }
  
  return cleaned
}

// 创建Winston日志记录器
export const logger = winston.createLogger({
  level: config.app.env === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'report-platform' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // 综合日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // SQL查询日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'sql.log'),
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      // 过滤只记录SQL相关的日志
      filter: (info) => {
        return info.sql || info.sqlQuery || info.query || info.category === 'sql'
      }
    }),
    
    // 访问日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      filter: (info) => {
        return info.category === 'access' || info.url || info.method
      }
    }),
  ],
})

// 开发环境添加控制台输出
if (config.app.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  )
}

// 如果是生产环境，同时添加控制台输出（用于Docker日志）
else {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  )
}

// 创建子记录器
export function createLogger(module: string) {
  return logger.child({ module })
}

// SQL查询专用记录器
export const sqlLogger = createLogger('sql')

// 访问日志专用记录器
export const accessLogger = createLogger('access')

// 数据库连接记录器
export const dbLogger = createLogger('database')

// 导出便捷方法
export function logError(message: string, error?: any, context?: any) {
  logger.error(message, { 
    error: error?.message || error,
    stack: error?.stack,
    ...context 
  })
}

export function logInfo(message: string, context?: any) {
  logger.info(message, context)
}

export function logDebug(message: string, context?: any) {
  logger.debug(message, context)
}

export function logWarning(message: string, context?: any) {
  logger.warn(message, context)
}

// 结构化日志方法
export function structuredLog(
  level: LogLevel,
  message: string,
  data: Record<string, any> = {}
) {
  const logData = {
    ...data,
    service: 'report-platform',
    timestamp: new Date().toISOString(),
    level,
    message
  }

  switch (level) {
    case LogLevel.ERROR:
      logger.error(message, logData)
      break
    case LogLevel.WARN:
      logger.warn(message, logData)
      break
    case LogLevel.INFO:
      logger.info(message, logData)
      break
    case LogLevel.DEBUG:
      logger.debug(message, logData)
      break
    default:
      logger.info(message, logData)
  }
}

// 性能监控日志
export function logPerformance(
  operation: string,
  duration: number,
  context?: Record<string, any>
) {
  const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG
  
  structuredLog(level, '性能监控', {
    operation,
    duration_ms: duration,
    ...context
  })
}

// API请求日志
export function logApiRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string,
  context?: Record<string, any>
) {
  const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
  
  structuredLog(level, 'API请求', {
    method,
    url,
    status: statusCode,
    duration_ms: duration,
    userId,
    ...context
  })
}

// SQL查询日志
export function logSqlQuery(
  sql: string,
  params: any[],
  duration: number,
  success: boolean,
  context?: Record<string, any>
) {
  const level = !success ? LogLevel.ERROR : duration > 500 ? LogLevel.WARN : LogLevel.DEBUG
  
  // 截断长SQL用于日志
  const truncatedSql = sql.length > 500 ? sql.substring(0, 500) + '...' : sql
  
  structuredLog(level, 'SQL查询', {
    sql: truncatedSql,
    paramCount: params.length,
    duration_ms: duration,
    success,
    ...context
  })
}

// 导出默认记录器
export default logger