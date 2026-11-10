import express from 'express'
import apikeyController from '../../controllers/apikey'
import { optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// CREATE - 需要认证以关联用户
router.post('/', optionalAuth, apikeyController.createApiKey)
router.post('/import', optionalAuth, apikeyController.importKeys)

// READ - 可选认证，用于过滤用户数据
router.get('/', optionalAuth, apikeyController.getAllApiKeys)

// UPDATE - 可选认证，用于权限检查
router.put(['/', '/:id'], optionalAuth, apikeyController.updateApiKey)

// DELETE - 可选认证，用于权限检查
router.delete(['/', '/:id'], optionalAuth, apikeyController.deleteApiKey)

export default router
