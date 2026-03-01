import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { sqlTemplateManager } from '../../core/sql'
import { connectionManager } from '../../core/database'
import { logger } from '../../utils/logger'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

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
    
    try {
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

      let records = []
      let total = 0

      const sqlProcessor = sqlTemplateManager.getProcessor()
      
      try {
        await sqlProcessor.loadTemplate('penetration-query')
      } catch (e) {
        logger.warn('SQL 模板加载失败', e)
      }

      const processedSQL = sqlProcessor.processPenetrationQuery(queryParams)

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
      logger.error('商品渗透率查询失败', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败'
      })
    }
  })

  static exportPenetration = asyncHandler(async (req: Request, res: Response) => {
    try {
      const params: PenetrationQueryParams = {
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        stationCodes: req.body.stationCodes,
        barCode: req.body.barCode,
        partyCode: req.body.partyCode,
        page: 1,
        pageSize: 10000
      }

      logger.info('商品渗透率导出请求', { params })

      const taskId = `penetration_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      ;(async () => {
        try {
          const sqlProcessor = sqlTemplateManager.getProcessor()
          try {
            await sqlProcessor.loadTemplate('penetration-query')
          } catch (e) {
            logger.warn('SQL 模板加载失败')
          }

          const processedSQL = sqlProcessor.processPenetrationQuery(params)
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
          XLSX.utils.book_append_sheet(workbook, worksheet, '商品渗透率')

          const filename = `商品渗透率_${params.startTime}_${params.endTime}_${taskId.split('_')[2]}.xlsx`
          const filePath = path.join(__dirname, '../../exports', filename)

          const exportsDir = path.join(__dirname, '../../exports')
          if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true })
          }

          XLSX.writeFile(workbook, filePath)
          
          logger.info('商品渗透率导出完成', { taskId, recordCount: records.length })
        } catch (error) {
          logger.error('商品渗透率导出失败', { taskId, error })
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
