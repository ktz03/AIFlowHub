import express from 'express'
import variablesController from '../../controllers/variables'
import { optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// CREATE - 需要认证以关联用户
router.post('/', optionalAuth, variablesController.createVariable)

// READ - 可选认证，用于过滤用户数据
router.get('/', optionalAuth, variablesController.getAllVariables)

// UPDATE - 可选认证，用于权限检查
router.put(['/', '/:id'], optionalAuth, variablesController.updateVariable)

// DELETE - 可选认证，用于权限检查
router.delete(['/', '/:id'], optionalAuth, variablesController.deleteVariable)

export default router
