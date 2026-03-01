import { Router } from 'express'
import { FreightActivityController } from '../controllers/FreightActivityController'
import { asyncHandler } from '../../middleware/errorHandler'

const router = Router()

router.post('/query', asyncHandler(FreightActivityController.queryFreightActivities))
router.post('/export', asyncHandler(FreightActivityController.exportFreightActivities))

export { router as freightActivityRoutes }
