import express from 'express'
import modelEvaluationController from '../../controllers/model-evaluation'
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// 获取预设评测场景（公开）
router.get('/scenarios', modelEvaluationController.getEvaluationScenarios)

// 获取可用工作流列表（可选认证）
router.get('/chatflows', optionalAuth, modelEvaluationController.getAvailableChatflows)

// 执行评测（需要认证）
router.post('/run', authenticate, modelEvaluationController.runEvaluation)

// 批量评测（需要认证）
router.post('/batch', authenticate, modelEvaluationController.runBatchEvaluation)

// 获取评测历史（需要认证）
router.get('/history', authenticate, modelEvaluationController.getEvaluationHistory)

// 获取评测详情（需要认证）
router.get('/:id', authenticate, modelEvaluationController.getEvaluationById)

// 删除评测记录（需要认证）
router.delete('/:id', authenticate, modelEvaluationController.deleteEvaluation)

export default router
