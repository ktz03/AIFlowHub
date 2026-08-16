import express from 'express'
import toolsController from '../../controllers/tools'
import { optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// CREATE - 需要认证以关联用户
router.post('/', optionalAuth, toolsController.createTool)

// READ - 可选认证，用于过滤用户数据
router.get('/', optionalAuth, toolsController.getAllTools)
router.get(['/', '/:id'], optionalAuth, toolsController.getToolById)

// UPDATE - 可选认证，用于权限检查
router.put(['/', '/:id'], optionalAuth, toolsController.updateTool)

// DELETE - 可选认证，用于权限检查
router.delete(['/', '/:id'], optionalAuth, toolsController.deleteTool)

export default router
