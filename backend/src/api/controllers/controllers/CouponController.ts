import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { sqlTemplateManager } from '../../core/sql'
import { connectionManager } from '../../core/database'
import { logger } from '../../utils/logger'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

export interface CouponQueryParams {
  receiveStartTime?: string
  receiveEndTime?: string
  useStartTime?: string
  useEndTime?: string
  couponIds?: string
  page?: number
  pageSize?: number
}

export class CouponController {
  
  static queryCoupons = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now()
    
    try {
      const queryParams: CouponQueryParams = {
        receiveStartTime: req.body.receiveStartTime,
        receiveEndTime: req.body.receiveEndTime,
        useStartTime: req.body.useStartTime,
        useEndTime: req.body.useEndTime,
        couponIds: req.body.couponIds,
        page: req.body.page || 1,
        pageSize: req.body.pageSize || 20
      }

      logger.info('优惠券查询请求', { params: queryParams })

      let records = []
      let total = 0

      const sqlProcessor = sqlTemplateManager.getProcessor()
      
      try {
        await sqlProcessor.loadTemplate('coupon-query')
      } catch (e) {
        logger.warn('SQL 模板加载失败', e)
      }

      const processedSQL = sqlProcessor.processCouponQuery(queryParams)

      const queryResult = await connectionManager.query(
        processedSQL.sql,
        processedSQL.params
      )

      if (!queryResult.success) {
        throw new Error(queryResult.error || '数据库查询失败')
      }

      records = queryResult.data || []
      total = records.length

      res.json({
        success: true,
        data: {
          items: records,
          total,
          page: queryParams.page || 1,
          pageSize: queryParams.pageSize || 20
        },
        executionTime: Date.now() - startTime
      })
    } catch (error) {
      logger.error('优惠券查询失败', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败'
      })
    }
  })

  static exportCoupons = asyncHandler(async (req: Request, res: Response) => {
    try {
      const params: CouponQueryParams = {
        receiveStartTime: req.body.receiveStartTime,
        receiveEndTime: req.body.receiveEndTime,
        useStartTime: req.body.useStartTime,
        useEndTime: req.body.useEndTime,
        couponIds: req.body.couponIds,
        page: 1,
        pageSize: 10000
      }

      logger.info('优惠券导出请求', { params })

      const taskId = `coupon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      ;(async () => {
        try {
          const sqlProcessor = sqlTemplateManager.getProcessor()
          try {
            await sqlProcessor.loadTemplate('coupon-query')
          } catch (e) {
            logger.warn('SQL 模板加载失败')
          }

          const processedSQL = sqlProcessor.processCouponQuery(params)
          const queryResult = await connectionManager.query(
            processedSQL.sql,
            processedSQL.params
          )

          if (!queryResult.success) {
            throw new Error(queryResult.error || '查询失败')
          }

          const records = queryResult.data || []

          const worksheet = XLSX.utils.json_to_sheet(records)
          const workbook = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(workbook, worksheet, '优惠券')

          const filename = `优惠券_${params.receiveStartTime || params.useStartTime}_${taskId.split('_')[2]}.xlsx`
          const filePath = path.join(__dirname, '../../exports', filename)

          const exportsDir = path.join(__dirname, '../../exports')
          if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true })
          }

          XLSX.writeFile(workbook, filePath)
          
          logger.info('优惠券导出完成', { taskId, recordCount: records.length })
        } catch (error) {
          logger.error('优惠券导出失败', { taskId, error })
        }
      })()

      res.status(202).json({
        success: true,
        data: { id: taskId, status: 'pending' },
        message: '导出任务已创建'
      })
    } catch (error) {
      logger.error('创建导出任务失败', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '创建导出任务失败'
      })
    }
  })
}
