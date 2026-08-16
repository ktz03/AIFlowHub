import express from 'express'
import workflowGeneratorController from '../../controllers/workflow-generator'
import { optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// 从自然语言生成工作流
router.post('/', optionalAuth, workflowGeneratorController.generateWorkflow)

// 验证工作流
router.post('/validate', optionalAuth, workflowGeneratorController.validateWorkflow)

// 获取建议
router.get('/suggestions', workflowGeneratorController.getSuggestions)

export default router
