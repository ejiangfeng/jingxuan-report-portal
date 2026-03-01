import dotenv from 'dotenv'

dotenv.config()

// 数据库类型枚举
export enum DatabaseType {
  OCEANBASE = 'oceanbase',
  DATAWORKS = 'dataworks',
  MYSQL = 'mysql',
}

// 应用配置
export interface AppConfig {
  env: string
  port: number
  corsOrigin: string
  rateLimit: number
  apiPrefix: string
}

// 数据库配置
export interface DatabaseConfig {
  type: DatabaseType
  host: string
  port: number
  username: string
  password: string
  database: string
  connectionLimit?: number
  queueLimit?: number
  connectTimeout?: number
}

// DataWorks配置
export interface DataWorksConfig {
  endpoint: string
  apiKey: string
  apiSecret: string
  projectId: string
}

// 导出配置
export interface ExportConfig {
  maxSize: number
  retentionDays: number
  storagePath: string
  batchSize: number
}

// 查询配置
export interface QueryConfig {
  timeoutMs: number
  maxRecordsPerPage: number
  defaultPageSize: number
}

// 完整配置
export interface Config {
  app: AppConfig
  database: DatabaseConfig
  dataworks?: DataWorksConfig
  export: ExportConfig
  query: QueryConfig
}

// 从环境变量加载配置
const getConfig = (): Config => {
  const env = process.env.NODE_ENV || 'development'
  const isProduction = env === 'production'

  return {
    app: {
      env,
      port: parseInt(process.env.PORT || '4000'),
      corsOrigin: process.env.CORS_ORIGIN || '*',
      rateLimit: parseInt(process.env.RATE_LIMIT || '100'),
      apiPrefix: '/api/v1',
    },
    database: {
      type: (process.env.DB_TYPE as DatabaseType) || DatabaseType.OCEANBASE,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jingxuan',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '1000'),
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000'),
    },
    dataworks: process.env.DATAWORKS_API_KEY
      ? {
          endpoint: process.env.DATAWORKS_ENDPOINT || '',
          apiKey: process.env.DATAWORKS_API_KEY,
          apiSecret: process.env.DATAWORKS_API_SECRET || '',
          projectId: process.env.DATAWORKS_PROJECT_ID || '',
        }
      : undefined,
    export: {
      maxSize: parseInt(process.env.EXPORT_MAX_SIZE || '50000'),
      retentionDays: parseInt(process.env.EXPORT_RETENTION_DAYS || '1'),
      storagePath: process.env.EXPORT_STORAGE_PATH || './exports',
      batchSize: parseInt(process.env.EXPORT_BATCH_SIZE || '1000'),
    },
    query: {
      timeoutMs: parseInt(process.env.QUERY_TIMEOUT_MS || '30000'),
      maxRecordsPerPage: parseInt(process.env.MAX_RECORDS_PER_PAGE || '500'),
      defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '50'),
    },
  }
}

// 配置导出
export const config = getConfig()

// 验证配置
export const validateConfig = (): string[] => {
  const errors: string[] = []

  // 验证应用配置
  if (!config.app.port || config.app.port < 1 || config.app.port > 65535) {
    errors.push('应用端口配置无效')
  }

  // 验证数据库配置
  if (!config.database.host) {
    errors.push('数据库主机地址不能为空')
  }
  if (!config.database.username || !config.database.password) {
    errors.push('数据库用户名和密码不能为空')
  }

  // 验证导出配置
  if (config.export.maxSize <= 0) {
    errors.push('导出最大数量必须大于0')
  }
  if (config.export.retentionDays < 0) {
    errors.push('导出文件保留天数不能为负数')
  }

  // 验证查询配置
  if (config.query.timeoutMs <= 0) {
    errors.push('查询超时时间必须大于0')
  }
  if (config.query.defaultPageSize <= 0) {
    errors.push('默认分页大小必须大于0')
  }

  return errors
}

// 打印配置信息（去除密码）
export const getSafeConfig = () => {
  const safeConfig = { ...config }
  if (safeConfig.database) {
    safeConfig.database = { ...safeConfig.database }
    safeConfig.database.password = '[HIDDEN]'
  }
  if (safeConfig.dataworks) {
    safeConfig.dataworks = { ...safeConfig.dataworks }
    safeConfig.dataworks.apiSecret = '[HIDDEN]'
  }
  return safeConfig
}

// 检查是否启用DataWorks
export const isDataWorksEnabled = () => !!config.dataworks?.apiKey

// 获取数据库连接字符串（用于日志记录）
export const getDatabaseConnectionString = () => {
  const { database } = config
  return `${database.type}://${database.username}@${database.host}:${database.port}/${database.database}`
}