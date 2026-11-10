import express from 'express'
import chatflowsController from '../../controllers/chatflows'
import { optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// CREATE - 需要认证以关联用户
router.post('/', optionalAuth, chatflowsController.saveChatflow)
router.post('/importchatflows', optionalAuth, chatflowsController.importChatflows)

// READ - 可选认证，用于过滤用户数据
router.get('/', optionalAuth, chatflowsController.getAllChatflows)
router.get('/orphaned', optionalAuth, chatflowsController.getOrphanedChatflows) // 管理员获取无主 chatflows
router.get(['/', '/:id'], optionalAuth, chatflowsController.getChatflowById)
router.get(['/apikey/', '/apikey/:apikey'], chatflowsController.getChatflowByApiKey)

// UPDATE - 可选认证，用于权限检查
router.put(['/', '/:id'], optionalAuth, chatflowsController.updateChatflow)

// 管理员专用 - 分配 chatflow 所有者
router.post('/:id/assign-owner', optionalAuth, chatflowsController.assignChatflowOwner)
router.post('/batch-assign-owner', optionalAuth, chatflowsController.batchAssignChatflowOwner)

// DELETE - 可选认证，用于权限检查
router.delete(['/', '/:id'], optionalAuth, chatflowsController.deleteChatflow)

export default router
