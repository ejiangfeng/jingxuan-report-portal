import { Router } from 'express'
import { ExportController } from '../controllers/ExportController'
const router = Router()
router.get('/', ExportController.getExportTasks)
router.get('/download/:taskId', ExportController.downloadExport)
export { router as exportRoutes }
