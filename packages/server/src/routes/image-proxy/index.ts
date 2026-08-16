import express from 'express'
import imageProxyController from '../../controllers/image-proxy'

const router = express.Router()

// GET /api/v1/image-proxy?url=https%3A%2F%2F...
router.get('/', imageProxyController.proxyImage)

export default router
