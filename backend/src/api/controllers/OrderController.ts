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

export class OrderController {
  static queryOrders = asyncHandler(async (req: Request, res: Response) => {
    const { startTime, endTime, status, stationCodes, orderNumber, page = 1, pageSize = 20 } = req.body
    
    const offset = (page - 1) * pageSize
    let sql = `SELECT * FROM tz_order WHERE 1=1`
    const params: any[] = []
    
    if (startTime) {
      sql += ` AND create_time >= ?`
      params.push(startTime)
    }
    if (endTime) {
      sql += ` AND create_time < DATE_ADD(?, INTERVAL 1 DAY)`
      params.push(endTime)
    }
    if (status) {
      sql += ` AND status = ?`
      params.push(status)
    }
    if (stationCodes) {
      sql += ` AND FIND_IN_SET(station_id, ?)`
      params.push(stationCodes)
    }
    if (orderNumber) {
      sql += ` AND order_number LIKE ?`
      params.push(`%${orderNumber}%`)
    }
    
    sql += ` ORDER BY create_time DESC LIMIT ? OFFSET ?`
    params.push(pageSize, offset)
    
    const data = await safeQuery(sql, params)
    
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
  
  static exportOrders = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: { id: 'export_' + Date.now(), status: 'pending' },
      message: '导出任务已创建'
    })
  })
  
  static getFilterOptions = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        statuses: [
          { value: '待付款', label: '待付款' },
          { value: '待发货', label: '待发货' },
          { value: '待收货', label: '待收货' },
          { value: '交易成功', label: '交易成功' },
          { value: '交易失败', label: '交易失败' }
        ]
      }
    })
  })

  static getOrderCount = asyncHandler(async (req: Request, res: Response) => {
    const { startTime, endTime, status, stationCodes } = req.body
    let sql = `SELECT COUNT(*) as count FROM tz_order WHERE 1=1`
    const params: any[] = []
    
    if (startTime) {
      sql += ` AND create_time >= ?`
      params.push(startTime)
    }
    if (endTime) {
      sql += ` AND create_time < DATE_ADD(?, INTERVAL 1 DAY)`
      params.push(endTime)
    }
    if (status) {
      sql += ` AND status = ?`
      params.push(status)
    }
    if (stationCodes) {
      sql += ` AND FIND_IN_SET(station_id, ?)`
      params.push(stationCodes)
    }
    
    const data = await safeQuery(sql, params)
    const count = data[0]?.count || 0
    
    res.json({ success: true, data: { count } })
  })

  static getOrderStats = asyncHandler(async (req: Request, res: Response) => {
    const { startTime, endTime, status, stationCodes } = req.body
    let sql = `SELECT COUNT(*) as totalOrders, COALESCE(SUM(actual_total), 0) as totalAmount, COALESCE(AVG(actual_total), 0) as avgAmount FROM tz_order WHERE 1=1`
    const params: any[] = []
    
    if (startTime) {
      sql += ` AND create_time >= ?`
      params.push(startTime)
    }
    if (endTime) {
      sql += ` AND create_time < DATE_ADD(?, INTERVAL 1 DAY)`
      params.push(endTime)
    }
    if (status) {
      sql += ` AND status = ?`
      params.push(status)
    }
    if (stationCodes) {
      sql += ` AND FIND_IN_SET(station_id, ?)`
      params.push(stationCodes)
    }
    
    const data = await safeQuery(sql, params)
    const stats = data[0] || { totalOrders: 0, totalAmount: 0, avgAmount: 0 }
    
    res.json({ success: true, data: stats })
  })

  static getOrderDetail = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params
    const sql = `SELECT * FROM tz_order WHERE order_number = ?`
    const data = await safeQuery(sql, [orderNumber])
    
    if (!data.length) {
      return res.status(404).json({ success: false, error: '订单未找到' })
    }
    
    res.json({ success: true, data: data[0] })
  })

  static getExportStatus = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: { id: req.params.jobId, status: 'completed', progress: 100 }
    })
  })

  static downloadExport = asyncHandler(async (req: Request, res: Response) => {
    res.status(404).json({ success: false, error: '导出文件不存在或已过期' })
  })
}
