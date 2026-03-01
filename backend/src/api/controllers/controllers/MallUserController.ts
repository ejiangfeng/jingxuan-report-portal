import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { sqlTemplateManager } from '../../core/sql'
import { connectionManager } from '../../core/database'
import { logger } from '../../utils/logger'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

export interface MallUserQueryParams {
  date: string
  mobile?: string
  page?: number
  pageSize?: number
}

export class MallUserController {
  
  static queryMallUsers = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now()
    
    try {
      const queryParams: MallUserQueryParams = {
        date: req.body.date,
        mobile: req.body.mobile,
        page: req.body.page || 1,
        pageSize: req.body.pageSize || 20
      }

      logger.info('商城用户查询请求', { params: queryParams })

      const sqlProcessor = sqlTemplateManager.getProcessor()
      
      try {
        await sqlProcessor.loadTemplate('mall-user-query')
      } catch (e) {
        logger.warn('SQL 模板加载失败', e)
      }

      const processedSQL = sqlProcessor.processMallUserQuery(queryParams)
      const queryResult = await connectionManager.query(
        processedSQL.sql,
        processedSQL.params
      )

      if (!queryResult.success) {
        throw new Error(queryResult.error || '数据库查询失败')
      }

      res.json({
        success: true,
        data: {
          items: queryResult.data || [],
          total: queryResult.data?.length || 0,
          page: queryParams.page || 1,
          pageSize: queryParams.pageSize || 20
        },
        executionTime: Date.now() - startTime
      })
    } catch (error) {
      logger.error('商城用户查询失败', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败'
      })
    }
  })

  static exportMallUsers = asyncHandler(async (req: Request, res: Response) => {
    try {
      const params: MallUserQueryParams = {
        date: req.body.date,
        mobile: req.body.mobile,
        page: 1,
        pageSize: 10000
      }

      logger.info('商城用户导出请求', { params })

      const taskId = `mall-user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      ;(async () => {
        try {
          const sqlProcessor = sqlTemplateManager.getProcessor()
          const processedSQL = sqlProcessor.processMallUserQuery(params)
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
          XLSX.utils.book_append_sheet(workbook, worksheet, '商城用户')

          const filename = `商城用户_${params.date}_${taskId.split('_')[2]}.xlsx`
          const filePath = path.join(__dirname, '../../exports', filename)

          const exportsDir = path.join(__dirname, '../../exports')
          if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true })
          }

          XLSX.writeFile(workbook, filePath)
          logger.info('商城用户导出完成', { taskId, recordCount: records.length })
        } catch (error) {
          logger.error('商城用户导出失败', { taskId, error })
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
