import express from 'express'
import quotaController from '../../controllers/quota'
import { authenticate, adminOnly } from '../../middlewares/auth.middleware'

const router = express.Router()

// 用户路由
router.get('/my', authenticate, quotaController.getMyQuota)
router.get('/check', authenticate, quotaController.checkQuota)
router.put('/warning-threshold', authenticate, quotaController.setWarningThreshold)
router.post('/sync', authenticate, quotaController.syncMyQuota)

// 管理员路由
router.get('/all', authenticate, adminOnly, quotaController.getAllUsersQuota)
router.get('/user/:userId', authenticate, adminOnly, quotaController.getUserQuota)
router.put('/user/:userId', authenticate, adminOnly, quotaController.setUserQuota)
router.post('/user/:userId/reset', authenticate, adminOnly, quotaController.resetUserQuota)
router.post('/user/:userId/add', authenticate, adminOnly, quotaController.addUserQuota)
router.post('/user/:userId/sync', authenticate, adminOnly, quotaController.syncUserQuota)
router.post('/sync-all', authenticate, adminOnly, quotaController.syncAllUsersQuota)

export default router
