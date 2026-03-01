import { Router } from 'express'
import { SearchKeywordController } from '../controllers/SearchKeywordController'
import { asyncHandler } from '../../middleware/errorHandler'

const router = Router()

router.post('/query', asyncHandler(SearchKeywordController.querySearchKeywords))
router.post('/export', asyncHandler(SearchKeywordController.exportSearchKeywords))

export { router as searchKeywordRoutes }
