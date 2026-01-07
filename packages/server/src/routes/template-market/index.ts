import express from 'express'
import templateMarketController from '../../controllers/template-market'
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware'

const router = express.Router()

// 公开接口（可选认证，用于获取收藏状态）
router.get('/public', optionalAuth, templateMarketController.getPublicTemplates)
router.get('/popular', templateMarketController.getPopularTemplates)
router.get('/categories', templateMarketController.getCategories)
router.get('/categories/stats', templateMarketController.getCategoryStats)
router.get('/:id', optionalAuth, templateMarketController.getTemplateById)

// 需要认证的接口
router.get('/user/templates', authenticate, templateMarketController.getUserTemplates)
router.get('/user/favorites', authenticate, templateMarketController.getUserFavorites)
router.post('/share', authenticate, templateMarketController.shareAsTemplate)
router.post('/:id/use', optionalAuth, templateMarketController.useTemplate)
router.post('/:id/favorite', authenticate, templateMarketController.toggleFavorite)
router.post('/:id/rate', authenticate, templateMarketController.rateTemplate)
router.put('/:id', authenticate, templateMarketController.updateTemplate)
router.delete('/:id', authenticate, templateMarketController.deleteTemplate)

export default router
