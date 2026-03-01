import { Router } from 'express'
import { PenetrationController } from '../controllers/PenetrationController'
import { asyncHandler } from '../../middleware/errorHandler'

const router = Router()

router.post('/query', asyncHandler(PenetrationController.queryPenetration))
router.post('/export', asyncHandler(PenetrationController.exportPenetration))

export { router as penetrationRoutes }
