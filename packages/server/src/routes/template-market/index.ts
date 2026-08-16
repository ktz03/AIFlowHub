import express from 'express'
import templateMarketController from '../../controllers/template-market'
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// 根路径 - 返回公开模板列表（与 /public 相同）
router.get('/', optionalAuth, templateMarketController.getPublicTemplates)

// 公开接口（可选认证，用于获取收藏状态）
router.get('/public', optionalAuth, templateMarketController.getPublicTemplates)
router.get('/popular', templateMarketController.getPopularTemplates)
router.get('/categories', templateMarketController.getCategories)
router.get('/categories/stats', templateMarketController.getCategoryStats)

// 需要认证的接口 - 放在 /:id 之前避免被通配符匹配
router.get('/user/templates', authenticate, templateMarketController.getUserTemplates)
router.get('/user/favorites', authenticate, templateMarketController.getUserFavorites)
router.post('/share', authenticate, templateMarketController.shareAsTemplate)

// 通配符路由放在最后
router.get('/:id', optionalAuth, templateMarketController.getTemplateById)
router.post('/:id/use', optionalAuth, templateMarketController.useTemplate)
router.post('/:id/favorite', authenticate, templateMarketController.toggleFavorite)
router.post('/:id/rate', authenticate, templateMarketController.rateTemplate)
router.put('/:id', authenticate, templateMarketController.updateTemplate)
router.delete('/:id', authenticate, templateMarketController.deleteTemplate)

export default router
