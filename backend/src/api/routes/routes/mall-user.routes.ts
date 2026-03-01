import { Router } from 'express'
import { MallUserController } from '../controllers/MallUserController'
import { asyncHandler } from '../../middleware/errorHandler'

const router = Router()

router.post('/query', asyncHandler(MallUserController.queryMallUsers))
router.post('/export', asyncHandler(MallUserController.exportMallUsers))

export { router as mallUserRoutes }
