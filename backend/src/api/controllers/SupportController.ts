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

export interface SupportQueryParams {
  startTime: string
  endTime: string
  activityId?: string
  page?: number
  pageSize?: number
}

export class SupportController {
  
  static querySupportActivities = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now()
    
    const queryParams: SupportQueryParams = {
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      activityId: req.body.activityId,
      page: req.body.page || 1,
      pageSize: req.body.pageSize || 20
    }

    logger.info('助力活动查询请求', { params: queryParams })

    let records: any[] = []

    try {
      const sqlProcessor = sqlTemplateManager.getProcessor()
      
      try {
        await sqlProcessor.loadTemplate('support-activity-query')
      } catch (e) {
        logger.warn('SQL 模板加载失败')
      }

      const processedSQL = sqlProcessor.processSupportQuery(queryParams)
      records = await safeQuery(processedSQL.sql, processedSQL.params)
    } catch (error) {
      logger.warn('助力活动查询失败，返回空数据', { error: error instanceof Error ? error.message : error })
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

  static exportSupportActivities = asyncHandler(async (req: Request, res: Response) => {
    const taskId = `support_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    
    res.status(202).json({
      success: true,
      data: { id: taskId, status: 'pending' },
      message: '导出任务已创建'
    })
  })
}
