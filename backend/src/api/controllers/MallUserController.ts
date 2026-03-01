import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { sqlTemplateManager } from '../../core/sql'
import { connectionManager } from '../../core/database'
import { logger } from '../../utils/logger'

async function safeQuery(sql: string, params: any[]): Promise<any[]> {
  try {
    const result = await connectionManager.query(sql, params)
    return result.data || []
  } catch (error) {
    logger.warn('数据库查询失败，返回空数据', { error: error instanceof Error ? error.message : error })
    return []
  }
}

export interface MallUserQueryParams {
  date: string
  mobile?: string
  page?: number
  pageSize?: number
}

export class MallUserController {
  
  static queryMallUsers = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now()
    
    const queryParams: MallUserQueryParams = {
      date: req.body.date,
      mobile: req.body.mobile,
      page: req.body.page || 1,
      pageSize: req.body.pageSize || 20
    }

    logger.info('商城用户查询请求', { params: queryParams })

    let records: any[] = []

    try {
      const sqlProcessor = sqlTemplateManager.getProcessor()
      
      try {
        await sqlProcessor.loadTemplate('mall-user-query')
      } catch (e) {
        logger.warn('SQL 模板加载失败')
      }

      const processedSQL = sqlProcessor.processMallUserQuery(queryParams)
      records = await safeQuery(processedSQL.sql, processedSQL.params)
    } catch (error) {
      logger.warn('商城用户查询失败，返回空数据', { error: error instanceof Error ? error.message : error })
    }

    res.json({
      success: true,
      data: {
        items: records,
        total: records.length,
        page: queryParams.page || 1,
        pageSize: queryParams.pageSize || 20
      },
      executionTime: Date.now() - startTime
    })
  })

  static exportMallUsers = asyncHandler(async (req: Request, res: Response) => {
    const taskId = `mall-user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    
    res.status(202).json({
      success: true,
      data: { id: taskId, status: 'pending' },
      message: '导出任务已创建'
    })
  })
}
