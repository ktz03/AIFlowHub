import express from 'express'
import internalPredictionsController from '../../controllers/internal-predictions'
import { optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// CREATE - 使用可选认证中间件，以便记录用户使用统计
router.post(['/', '/:id'], optionalAuth, internalPredictionsController.createInternalPrediction)

export default router
