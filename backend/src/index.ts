import express, { type Application } from 'express'
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
import { orderRoutes } from './api/routes/order.routes'
import { exportRoutes } from './api/routes/export.routes'
import { healthRoutes } from './routes/health.routes'
import { searchKeywordRoutes } from './api/routes/search.routes'
import { supportRoutes } from './api/routes/support.routes'
import { penetrationRoutes } from './api/routes/penetration.routes'
import { couponRoutes } from './api/routes/coupon.routes'
import { invitationRoutes } from './api/routes/invitation.routes'
import { mallUserRoutes } from './api/routes/mall-user.routes'
import { freightActivityRoutes } from './api/routes/freight-activity.routes'
import { connectionManager } from './core/database'

// 初始化 Express 应用
const app: Application = express()
const port = config.app.port

// =========== 中间件配置 ===========
app.use(helmet())
app.use(cors({
  origin: config.app.corsOrigin,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())

// 请求频率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.app.rateLimit || 100,
  message: '请求过于频繁，请稍后再试',
})
app.use('/api/', limiter)
app.use(requestLogger)

// =========== 健康检查 ===========
app.get('/health', (_req, res) => {
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
app.use('/api/v1/reports/search-keyword', searchKeywordRoutes)
app.use('/api/v1/reports/support', supportRoutes)
app.use('/api/v1/reports/penetration', penetrationRoutes)
app.use('/api/v1/reports/coupon', couponRoutes)
app.use('/api/v1/reports/invitation', invitationRoutes)
app.use('/api/v1/reports/mall-user', mallUserRoutes)
app.use('/api/v1/reports/freight-activity', freightActivityRoutes)

// =========== 根路径 ===========
app.get('/', (_req, res) => {
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

// =========== 404 处理 ===========
app.use('*', (_req, res) => {
  res.status(404).json({
    error: '找不到请求的资源',
    path: _req.originalUrl,
    method: _req.method,
  })
})

// =========== 启动服务 ===========
const startServer = async () => {
  try {
    // 初始化数据库连接
    logger.info('正在初始化数据库连接...')
    await connectionManager.initialize()
    logger.info('✅ 数据库连接初始化完成')
    
    app.listen(port, () => {
      logger.info(`🚀 服务器启动成功`)
      logger.info(`📊 环境：${config.app.env}`)
      logger.info(`🌐 地址：http://localhost:${port}`)
      
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

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', { reason, promise })
})

startServer()

export default app
