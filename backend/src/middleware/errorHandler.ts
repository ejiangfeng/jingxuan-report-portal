import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

// 自定义错误类型
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// 客户端错误（4xx）
export class ClientError extends AppError {
  constructor(message: string = '客户端错误', statusCode: number = 400) {
    super(message, statusCode)
  }
}

// 认证错误
export class AuthenticationError extends ClientError {
  constructor(message: string = '认证失败') {
    super(message, 401)
  }
}

// 授权错误
export class AuthorizationError extends ClientError {
  constructor(message: string = '权限不足') {
    super(message, 403)
  }
}

// 资源不存在错误
export class NotFoundError extends ClientError {
  constructor(message: string = '资源不存在') {
    super(message, 404)
  }
}

// 验证错误
export class ValidationError extends ClientError {
  constructor(message: string = '参数验证失败') {
    super(message, 422)
  }
}

// 服务器错误（5xx）
export class ServerError extends AppError {
  constructor(message: string = '服务器内部错误') {
    super(message, 500)
  }
}

// 数据库错误
export class DatabaseError extends ServerError {
  constructor(message: string = '数据库操作失败') {
    super(message)
  }
}

// 外部API错误
export class ExternalApiError extends ServerError {
  constructor(message: string = '外部API调用失败') {
    super(message)
  }
}

// 全局错误处理中间件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 默认错误响应
  let statusCode = 500
  let message = '服务器内部错误'
  let errorData: any = {}

  // 处理应用错误
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
    errorData = {
      isOperational: error.isOperational,
      ...(error as any).details
    }
  }

  // 处理数据库错误
  else if (error.name === 'SequelizeError' || error.name === 'MongoError') {
    statusCode = 500
    message = '数据库操作失败'
    errorData = {
      errorType: 'DATABASE_ERROR'
    }
  }

  // 处理验证错误（Joi、class-validator等）
  else if (error.name === 'ValidationError' || Array.isArray((error as any).errors)) {
    statusCode = 422
    message = '参数验证失败'
    errorData = {
      errors: (error as any).errors || [error.message],
      errorType: 'VALIDATION_ERROR'
    }
  }

  // 处理JSON解析错误
  else if (error instanceof SyntaxError && (error as any).status === 400 && 'body' in error) {
    statusCode = 400
    message = 'JSON解析失败'
    errorData = {
      errorType: 'JSON_PARSE_ERROR'
    }
  }

  // 处理类型转换错误
  else if (error.name === 'CastError') {
    statusCode = 400
    message = '类型转换失败'
    errorData = {
      errorType: 'TYPE_CAST_ERROR'
    }
  }

  // 根据不同环境记录错误
  if (process.env.NODE_ENV === 'production') {
    // 生产环境：记录操作错误，但不暴露堆栈
    if (statusCode >= 500) {
      logger.error(`服务器错误 [${statusCode}]: ${message}`, {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: (req as any).user?.id,
        ...errorData
      })
    } else if (statusCode >= 400) {
      logger.warn(`客户端错误 [${statusCode}]: ${message}`, {
        error: error.message,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: (req as any).user?.id,
        ...errorData
      })
    }
  } else {
    // 开发环境：记录详细错误信息
    logger.error(`错误 [${statusCode}]: ${message}`, {
      error: error.message,
      stack: error.stack,
      name: error.name,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      body: req.body,
      query: req.query,
      params: req.params,
      userId: (req as any).user?.id,
      ...errorData
    })
  }

  // 构建错误响应
  const errorResponse: any = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  }

  // 在开发环境中添加堆栈信息
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    errorResponse.error = error.message
    errorResponse.stack = error.stack
  }

  // 添加验证错误详情
  if (errorData.errors) {
    errorResponse.errors = errorData.errors
  }

  // 发送响应
  res.status(statusCode).json(errorResponse)
}

// 处理404错误
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new NotFoundError(`无法找到 ${req.method} ${req.originalUrl}`)
  
  res.status(404).json({
    success: false,
    message: error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  })
}

// 异步错误包装器（避免在每个异步路由中都需要try-catch）
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// 验证错误处理器
export const validationErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'ValidationError' || Array.isArray(error.errors)) {
    const validationError = new ValidationError('参数验证失败')
    
    // 提取验证错误详情
    const errors = error.errors
      ? error.errors.map((err: any) => ({
          field: err.field || err.path,
          message: err.message
        }))
      : [{ field: 'unknown', message: error.message }]
    
    res.status(422).json({
      success: false,
      message: validationError.message,
      errors,
      timestamp: new Date().toISOString()
    })
  } else {
    next(error)
  }
}

// 数据库错误处理器
export const databaseErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'SequelizeError' || error.name === 'MongoError' || error.code?.startsWith('ER_')) {
    const databaseError = new DatabaseError()
    
    logger.error('数据库错误处理:', {
      error: error.message,
      code: error.code,
      sql: error.sql,
      url: req.originalUrl,
      method: req.method
    })
    
    // 生产环境中隐藏数据库错误详情
    const message = process.env.NODE_ENV === 'production'
      ? databaseError.message
      : error.message
    
    res.status(500).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { 
        detail: error.message,
        code: error.code
      })
    })
  } else {
    next(error)
  }
}

// 外部API错误处理器
export const externalApiErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.isAxiosError || error.response?.status) {
    const apiError = new ExternalApiError('外部服务调用失败')
    
    logger.error('外部API错误:', {
      error: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      originalUrl: req.originalUrl,
      originalMethod: req.method
    })
    
    res.status(500).json({
      success: false,
      message: apiError.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && {
        detail: error.message,
        externalUrl: error.config?.url,
        externalStatus: error.response?.status
      })
    })
  } else {
    next(error)
  }
}

// 安全检查中间件（防止信息泄露）
export const securityErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // 防止堆栈信息泄露
  if (error.stack && process.env.NODE_ENV === 'production') {
    // 在生产环境中，我们不应该暴露堆栈信息
    error.stack = undefined
  }
  
  next(error)
}

// 错误处理链
export const errorHandlingChain = [
  validationErrorHandler,
  databaseErrorHandler,
  externalApiErrorHandler,
  securityErrorHandler,
  errorHandler
]