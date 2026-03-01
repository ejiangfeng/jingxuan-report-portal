import { Router } from 'express'
import { CouponController } from '../controllers/CouponController'
import { asyncHandler } from '../../middleware/errorHandler'

const router = Router()

router.post('/query', asyncHandler(CouponController.queryCoupons))
router.post('/export', asyncHandler(CouponController.exportCoupons))

export { router as couponRoutes }
