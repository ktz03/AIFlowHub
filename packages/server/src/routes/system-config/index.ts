import express from 'express'
import systemConfigController from '../../controllers/system-config'
import { authenticate, adminOnly } from '../../middlewares/auth.middleware'

const router = express.Router()

// 所有系统配置路由都需要管理员权限
router.use(authenticate, adminOnly)

// 获取所有系统配置
router.get('/', systemConfigController.getAllConfigs)

// 获取单个配置
router.get('/:key', systemConfigController.getConfig)

// 设置配置
router.post('/', systemConfigController.setConfig)

// 删除配置
router.delete('/:key', systemConfigController.removeConfig)

// 工作流生成器专用配置
router.post('/workflow-generator/api-key', systemConfigController.setWorkflowGeneratorApiKey)
router.get('/workflow-generator/status', systemConfigController.checkWorkflowGeneratorConfig)

export default router
