import { Router } from 'express'
import { ExportController } from '../controllers/ExportController'
import { asyncHandler } from '../../middleware/errorHandler'

const router = Router()

router.get('/', asyncHandler(ExportController.getExportTasks))
router.get('/download/:taskId', asyncHandler(ExportController.downloadExport))

export { router as exportRoutes }
