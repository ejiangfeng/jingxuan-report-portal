import { config, DatabaseType } from '../../config'
import { logger } from '../../utils/logger'
import { QueryResult } from '../../types'

// 数据库连接器的抽象接口
export interface IDatabaseConnector {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query(sql: string, params?: any[]): Promise<QueryResult>
  testConnection(): Promise<boolean>
  getConnectionInfo(): string
}

// 数据库连接器抽象类
export abstract class BaseDatabaseConnector implements IDatabaseConnector {
  protected connected = false
  protected config: any

  constructor(config: any) {
    this.config = config
  }

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract query(sql: string, params?: any[]): Promise<QueryResult>
  
  async testConnection(): Promise<boolean> {
    try {
      await this.connect()
      // 执行简单的健康检查查询
      const result = await this.query('SELECT 1 as connection_test')
      this.connected = result.success
      return result.success
    } catch (error) {
      logger.error('数据库连接测试失败:', error)
      this.connected = false
      return false
    }
  }

  getConnectionInfo(): string {
    return `数据库类型: ${this.config.type}, 状态: ${this.connected ? '已连接' : '未连接'}`
  }

  isConnected(): boolean {
    return this.connected
  }

  protected handleQueryError(error: any, sql: string): QueryResult {
    logger.error('数据库查询错误:', {
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      error: error.message,
      code: error.code
    })

    return {
      success: false,
      error: error.message || '数据库查询失败',
      queryTime: 0
    }
  }

  protected logQuery(sql: string, params: any[], duration: number, success: boolean): void {
    const logData = {
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      paramCount: params?.length || 0,
      duration: `${duration}ms`,
      success,
      timestamp: new Date().toISOString()
    }

    if (success) {
      logger.debug('数据库查询成功', logData)
    } else {
      logger.error('数据库查询失败', logData)
    }
  }
}

// 数据库连接工厂
export class DatabaseConnectorFactory {
  static async createConnector(dbType: DatabaseType = DatabaseType.OCEANBASE): Promise<IDatabaseConnector> {
    switch (dbType) {
      case DatabaseType.OCEANBASE:
        const { OceanBaseClient } = await import('./OceanBaseClient')
        return new OceanBaseClient(config.database)
      case DatabaseType.DATAWORKS:
        if (!config.dataworks) {
          throw new Error('DataWorks配置未找到')
        }
        const { DataWorksClient } = await import('./DataWorksClient')
        return new DataWorksClient(config.dataworks)
      default:
        throw new Error(`不支持的数据库类型: ${dbType}`)
    }
  }

  static async createAllConnectors(): Promise<Map<DatabaseType, IDatabaseConnector>> {
    const connectors = new Map<DatabaseType, IDatabaseConnector>()
    
    try {
      // 总是创建OceanBase连接器
      const oceanbaseConnector = await this.createConnector(DatabaseType.OCEANBASE)
      connectors.set(DatabaseType.OCEANBASE, oceanbaseConnector)
      
      // 如果配置了DataWorks，也创建连接器
      if (config.dataworks?.apiKey) {
        try {
          const dataworksConnector = await this.createConnector(DatabaseType.DATAWORKS)
          connectors.set(DatabaseType.DATAWORKS, dataworksConnector)
        } catch (error) {
          logger.warn('DataWorks连接器创建失败，但仍可使用OceanBase', error)
        }
      }
      
      return connectors
    } catch (error) {
      logger.error('创建数据库连接器失败:', error)
      throw error
    }
  }
}

// 连接管理器（支持连接池和故障转移）
export class ConnectionManager {
  private connectors: Map<DatabaseType, IDatabaseConnector> = new Map()
  private primaryType: DatabaseType = DatabaseType.OCEANBASE
  
  async initialize(): Promise<void> {
    logger.info('初始化数据库连接管理器...')
    
    try {
      this.connectors = await DatabaseConnectorFactory.createAllConnectors()
      
      // 测试连接
      const results = await Promise.allSettled(
        Array.from(this.connectors.entries()).map(async ([type, connector]) => {
          const connected = await connector.testConnection()
          return { type, connected, connector }
        })
      )
      
      // 记录连接状态
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { type, connected } = result.value
          logger.info(`${type} 连接状态: ${connected ? '成功' : '失败'}`)
        }
      })
      
      // 选择主数据库（优先使用OceanBase）
      const availableConnectors = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .filter(r => r.value.connected)
        .map(r => r.value.type)
      
      if (availableConnectors.length === 0) {
        throw new Error('没有可用的数据库连接')
      }
      
      this.primaryType = availableConnectors.includes(DatabaseType.OCEANBASE) 
        ? DatabaseType.OCEANBASE 
        : availableConnectors[0]
      
      logger.info(`主数据库设置为: ${this.primaryType}`)
      
    } catch (error) {
      logger.error('数据库连接管理器初始化失败:', error)
      throw error
    }
  }

  getConnector(type?: DatabaseType): IDatabaseConnector {
    const connectorType = type || this.primaryType
    const connector = this.connectors.get(connectorType)
    
    if (!connector) {
      throw new Error(`数据库连接器未找到: ${connectorType}`)
    }
    
    return connector
  }

  async query(sql: string, params?: any[], retryCount = 0): Promise<QueryResult> {
    const maxRetries = 2
    
    try {
      const connector = this.getConnector()
      return await connector.query(sql, params)
      
    } catch (error) {
      logger.error('主数据库查询失败，尝试故障转移:', error)
      
      if (retryCount >= maxRetries) {
        throw error
      }
      
      // 尝试其他可用的数据库
      for (const [type, connector] of this.connectors.entries()) {
        if (type === this.primaryType) continue
        
        try {
          logger.info(`尝试使用备用数据库: ${type}`)
          const result = await connector.query(sql, params)
          return {
            ...result,
            warning: `使用备用数据源: ${type}，可能存在延迟`
          }
        } catch (fallbackError) {
          logger.error(`备用数据库 ${type} 查询失败:`, fallbackError)
        }
      }
      
      // 如果所有备用都失败，重新尝试主数据库（指数退避）
      const delay = Math.pow(2, retryCount) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      return this.query(sql, params, retryCount + 1)
    }
  }

  async testAllConnections(): Promise<Map<DatabaseType, boolean>> {
    const results = new Map<DatabaseType, boolean>()
    
    for (const [type, connector] of this.connectors.entries()) {
      try {
        const connected = await connector.testConnection()
        results.set(type, connected)
      } catch (error) {
        logger.error(`测试${type}连接失败:`, error)
        results.set(type, false)
      }
    }
    
    return results
  }

  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.connectors.values()).map(connector => 
      connector.disconnect().catch(error => 
        logger.error('关闭数据库连接失败:', error)
      )
    )
    
    await Promise.allSettled(closePromises)
    this.connectors.clear()
    logger.info('所有数据库连接已关闭')
  }

  getAvailableConnectors(): DatabaseType[] {
    return Array.from(this.connectors.keys())
  }

  getPrimaryType(): DatabaseType {
    return this.primaryType
  }
}

// 导出单例连接管理器
export const connectionManager = new ConnectionManager()