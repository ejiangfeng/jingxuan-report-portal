import { Router } from 'express'
import { InvitationController } from '../controllers/InvitationController'
import { asyncHandler } from '../../middleware/errorHandler'

const router = Router()

router.post('/query', asyncHandler(InvitationController.queryInvitations))
router.post('/export', asyncHandler(InvitationController.exportInvitations))

export { router as invitationRoutes }
