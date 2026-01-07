import express from 'express'
import authController from '../../controllers/auth'
import { authenticate, adminOnly, selfOrAdmin } from '../../middlewares/auth.middleware'

const router = express.Router()

// 公开路由（无需认证）
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh-token', authController.refreshToken)

// 需要认证的路由
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.getCurrentUser)
router.put('/me', authenticate, authController.updateCurrentUser)
router.put('/change-password', authenticate, authController.changePassword)

// 管理员路由
router.get('/users', authenticate, adminOnly, authController.getAllUsers)
router.get('/users/:id', authenticate, adminOnly, authController.getUserById)
router.put('/users/:id/role', authenticate, adminOnly, authController.updateUserRole)
router.put('/users/:id/status', authenticate, adminOnly, authController.updateUserStatus)
router.put('/users/:id/quota', authenticate, adminOnly, authController.updateUserQuota)
router.delete('/users/:id', authenticate, adminOnly, authController.deleteUser)

export default router
