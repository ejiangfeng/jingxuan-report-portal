import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
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

export class SearchKeywordController {
  static querySearchKeywords = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, pageSize = 20 } = req.body
    const offset = (page - 1) * pageSize
    
    const sql = `SELECT id, keyword, label, type, route FROM tz_search_keyword ORDER BY id DESC LIMIT ? OFFSET ?`
    const data = await safeQuery(sql, [pageSize, offset])
    
    res.json({
      success: true,
      data: {
        items: data,
        total: data.length,
        page,
        pageSize
      }
    })
  })

  static exportSearchKeywords = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: { id: 'export_search_' + Date.now(), status: 'pending' },
      message: '导出任务已创建'
    })
  })
}
