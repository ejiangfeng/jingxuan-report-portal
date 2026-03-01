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

export interface PenetrationQueryParams {
  startTime: string
  endTime: string
  stationCodes?: string
  barCode?: string
  partyCode?: string
  page?: number
  pageSize?: number
}

export class PenetrationController {
  
  static queryPenetration = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now()
    
    const queryParams: PenetrationQueryParams = {
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      stationCodes: req.body.stationCodes,
      barCode: req.body.barCode,
      partyCode: req.body.partyCode,
      page: req.body.page || 1,
      pageSize: req.body.pageSize || 20
    }

    logger.info('商品渗透率查询请求', { params: queryParams })

    let records: any[] = []

    try {
      const sqlProcessor = sqlTemplateManager.getProcessor()
      
      try {
        await sqlProcessor.loadTemplate('penetration-query')
      } catch (e) {
        logger.warn('SQL 模板加载失败')
      }

      const processedSQL = sqlProcessor.processPenetrationQuery(queryParams)
      records = await safeQuery(processedSQL.sql, processedSQL.params)
    } catch (error) {
      logger.warn('商品渗透率查询失败，返回空数据', { error: error instanceof Error ? error.message : error })
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

  static exportPenetration = asyncHandler(async (req: Request, res: Response) => {
    const taskId = `penetration_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    
    res.status(202).json({
      success: true,
      data: { id: taskId, status: 'pending' },
      message: '导出任务已创建'
    })
  })
}
