import { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'

export class ExportController {
  static getExportTasks = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: { items: [], total: 0 }
    })
  })

  static downloadExport = asyncHandler(async (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: '导出文件不存在或已过期'
    })
  })
}
