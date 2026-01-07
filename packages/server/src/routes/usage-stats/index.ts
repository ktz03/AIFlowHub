import express from 'express'
import usageStatsController from '../../controllers/usage-stats'
import { authenticate, adminOnly } from '../../middlewares/auth.middleware'

const router = express.Router()

// 需要认证的路由
router.get('/overview', authenticate, usageStatsController.getOverview)
router.get('/trend', authenticate, usageStatsController.getTrend)
router.get('/model-distribution', authenticate, usageStatsController.getModelDistribution)
router.get('/provider-distribution', authenticate, usageStatsController.getProviderDistribution)
router.get('/logs', authenticate, usageStatsController.getLogs)
router.get('/export', authenticate, usageStatsController.exportData)
router.get('/pricing', authenticate, usageStatsController.getPricing)

// 管理员路由
router.get('/ranking', authenticate, adminOnly, usageStatsController.getUserRanking)
router.delete('/clear-all', authenticate, usageStatsController.clearAllLogs) // 普通用户删除自己的，管理员可删除所有

// 内部API（用于记录使用日志）
router.post('/log', usageStatsController.logUsage)

export default router
