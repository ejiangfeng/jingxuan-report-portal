import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { sqlTemplateManager } from '../../core/sql'
import { connectionManager } from '../../core/database'
import { logger } from '../../utils/logger'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

export interface InvitationQueryParams {
  startTime: string
  endTime: string
  page?: number
  pageSize?: number
}

export class InvitationController {
  
  static queryInvitations = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now()
    
    try {
      const queryParams: InvitationQueryParams = {
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        page: req.body.page || 1,
        pageSize: req.body.pageSize || 20
      }

      logger.info('社群拉新查询请求', { params: queryParams })

      const sqlProcessor = sqlTemplateManager.getProcessor()
      
      try {
        await sqlProcessor.loadTemplate('invitation-query')
      } catch (e) {
        logger.warn('SQL 模板加载失败', e)
      }

      const processedSQL = sqlProcessor.processInvitationQuery(queryParams)
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
      logger.error('社群拉新查询失败', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败'
      })
    }
  })

  static exportInvitations = asyncHandler(async (req: Request, res: Response) => {
    try {
      const params: InvitationQueryParams = {
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        page: 1,
        pageSize: 10000
      }

      logger.info('社群拉新导出请求', { params })

      const taskId = `invitation_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      ;(async () => {
        try {
          const sqlProcessor = sqlTemplateManager.getProcessor()
          const processedSQL = sqlProcessor.processInvitationQuery(params)
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
          XLSX.utils.book_append_sheet(workbook, worksheet, '社群拉新')

          const filename = `社群拉新_${params.startTime}_${taskId.split('_')[2]}.xlsx`
          const filePath = path.join(__dirname, '../../exports', filename)

          const exportsDir = path.join(__dirname, '../../exports')
          if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true })
          }

          XLSX.writeFile(workbook, filePath)
          logger.info('社群拉新导出完成', { taskId, recordCount: records.length })
        } catch (error) {
          logger.error('社群拉新导出失败', { taskId, error })
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
