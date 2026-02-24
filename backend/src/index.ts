import express, { type Application, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import { rateLimit } from 'express-rate-limit'

// 配置加载
dotenv.config()

// 导入配置
import { config } from './config'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

// 导入路由
import { orderRoutes } from './routes/order.routes'
import { exportRoutes } from './routes/export.routes'
import { healthRoutes } from './routes/health.routes'

// 初始化Express应用
const app: Application = express()
const port = config.app.port

// =========== 中间件配置 ===========
// 安全相关的中间件
app.use(helmet())
app.use(cors({
  origin: config.app.corsOrigin,
  credentials: true,
}))

// 请求大小限制
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 压缩响应
app.use(compression())

// 请求频率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: config.app.rateLimit || 100, // 每个IP最多100个请求
  message: '请求过于频繁，请稍后再试',
})
app.use('/api/', limiter)

// 请求日志
app.use(requestLogger)

// =========== 健康检查 ===========
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  })
})

// =========== 路由配置 ===========
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/exports', exportRoutes)
app.use('/api/v1/health', healthRoutes)

// =========== 根路径 ===========
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: '鲸选报表平台 API',
    version: '1.0.0',
    description: '订单查询和导出服务',
    endpoints: {
      orders: '/api/v1/orders',
      exports: '/api/v1/exports',
      health: '/api/v1/health',
    },
  })
})

// =========== 错误处理 ===========
app.use(errorHandler)

// =========== 404处理 ===========
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: '找不到请求的资源',
    path: req.originalUrl,
    method: req.method,
  })
})

// =========== 启动服务 ===========
const startServer = async () => {
  try {
    // 测试数据库连接
    // await testDatabaseConnection()
    
    app.listen(port, () => {
      logger.info(`🚀 服务器启动成功`)
      logger.info(`📊 环境: ${config.app.env}`)
      logger.info(`🌐 地址: http://localhost:${port}`)
      logger.info(`📁 API文档: http://localhost:${port}`)
      
      if (config.app.env === 'development') {
        logger.warn('⚠️  当前为开发环境，请注意安全配置')
      }
    })
  } catch (error) {
    logger.error('启动服务器失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...')
  process.exit(0)
})

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error)
  // 在实际应用中可能需要重启服务器
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', { reason, promise })
})

// 启动服务器
startServer()

export default app