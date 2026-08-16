import express from 'express'
import credentialsController from '../../controllers/credentials'
import { optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// CREATE - 需要认证以关联用户
router.post('/', optionalAuth, credentialsController.createCredential)

// READ - 可选认证，用于过滤用户数据
router.get('/', optionalAuth, credentialsController.getAllCredentials)
router.get(['/', '/:id'], optionalAuth, credentialsController.getCredentialById)

// UPDATE - 可选认证，用于权限检查
router.put(['/', '/:id'], optionalAuth, credentialsController.updateCredential)

// DELETE - 可选认证，用于权限检查
router.delete(['/', '/:id'], optionalAuth, credentialsController.deleteCredentials)

export default router
