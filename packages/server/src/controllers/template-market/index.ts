import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import templateMarketService from '../../services/template-market'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

// 获取公开模板列表
const getPublicTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { category, type, search, page, limit, sortBy, sortOrder } = req.query
        const result = await templateMarketService.getPublicTemplates({
            category: category as string,
            type: type as string,
            search: search as string,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            sortBy: sortBy as 'useCount' | 'likeCount' | 'createdDate' | 'viewCount',
            sortOrder: sortOrder as 'ASC' | 'DESC'
        })
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

// 获取用户自己的模板
const getUserTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }
        const { category, search } = req.query
        const templates = await templateMarketService.getUserTemplates(userId, {
            category: category as string,
            search: search as string
        })
        return res.json(templates)
    } catch (error) {
        next(error)
    }
}

// 分享工作流为模板
const shareAsTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }
        const { chatflowId, name, description, category, tags, isPublic } = req.body
        if (!name) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '模板名称不能为空')
        }
        const template = await templateMarketService.shareAsTemplate({
            chatflowId,
            name,
            description,
            category,
            tags,
            isPublic,
            userId
        })
        return res.status(StatusCodes.CREATED).json(template)
    } catch (error) {
        next(error)
    }
}

// 使用模板
const useTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const userId = (req as any).user?.userId
        const result = await templateMarketService.useTemplate(id, userId)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

// 获取模板详情
const getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const userId = (req as any).user?.userId
        const template = await templateMarketService.getTemplateById(id, userId)
        return res.json(template)
    } catch (error) {
        next(error)
    }
}

// 收藏/取消收藏模板
const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }
        const { id } = req.params
        const result = await templateMarketService.toggleFavorite(id, userId)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

// 评分模板
const rateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }
        const { id } = req.params
        const { rating, comment } = req.body
        if (!rating || rating < 1 || rating > 5) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '评分必须在 1-5 之间')
        }
        const result = await templateMarketService.rateTemplate(id, userId, rating, comment)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

// 获取用户收藏的模板
const getUserFavorites = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }
        const templates = await templateMarketService.getUserFavorites(userId)
        return res.json(templates)
    } catch (error) {
        next(error)
    }
}

// 获取分类统计
const getCategoryStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await templateMarketService.getCategoryStats()
        return res.json(stats)
    } catch (error) {
        next(error)
    }
}

// 获取热门模板
const getPopularTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit } = req.query
        const templates = await templateMarketService.getPopularTemplates(limit ? parseInt(limit as string) : 10)
        return res.json(templates)
    } catch (error) {
        next(error)
    }
}

// 删除模板
const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }
        const { id } = req.params
        const result = await templateMarketService.deleteTemplate(id, userId)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

// 更新模板
const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }
        const { id } = req.params
        const updates = req.body
        const template = await templateMarketService.updateTemplate(id, userId, updates)
        return res.json(template)
    } catch (error) {
        next(error)
    }
}

// 获取分类列表
const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = Object.entries(templateMarketService.CATEGORY_NAMES).map(([key, name]) => ({
            id: key,
            name
        }))
        return res.json(categories)
    } catch (error) {
        next(error)
    }
}

export default {
    getPublicTemplates,
    getUserTemplates,
    shareAsTemplate,
    useTemplate,
    getTemplateById,
    toggleFavorite,
    rateTemplate,
    getUserFavorites,
    getCategoryStats,
    getPopularTemplates,
    deleteTemplate,
    updateTemplate,
    getCategories
}
