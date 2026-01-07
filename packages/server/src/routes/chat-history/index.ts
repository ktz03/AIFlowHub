import express from 'express'
import chatHistoryController from '../../controllers/chat-history'
import { authenticate } from '../../middlewares/auth.middleware'

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

// 获取会话列表
router.get('/sessions', chatHistoryController.getSessions)

// 获取统计信息
router.get('/stats', chatHistoryController.getStats)

// 搜索消息
router.get('/search', chatHistoryController.searchMessages)

// 获取会话消息
router.get('/sessions/:sessionId/messages', chatHistoryController.getSessionMessages)

// 更新会话标题
router.put('/sessions/:sessionId/title', chatHistoryController.updateSessionTitle)

// 导出会话
router.get('/sessions/:sessionId/export', chatHistoryController.exportSession)

// 删除单个会话
router.delete('/sessions/:sessionId', chatHistoryController.deleteSession)

// 批量删除会话
router.post('/sessions/batch-delete', chatHistoryController.deleteSessions)

export default router
