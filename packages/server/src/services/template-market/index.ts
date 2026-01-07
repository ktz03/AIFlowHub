import { StatusCodes } from 'http-status-codes'
import { CustomTemplate } from '../../database/entities/CustomTemplate'
import { TemplateFavorite } from '../../database/entities/TemplateFavorite'
import { TemplateRating } from '../../database/entities/TemplateRating'
import { User } from '../../database/entities/User'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'
import chatflowsService from '../chatflows'
import { loadOfficialTemplates } from '../../templates'

// 模板分类常量
export const TEMPLATE_CATEGORIES = {
    CHATBOT: 'chatbot', // 智能客服/聊天机器人
    RAG: 'rag', // RAG/知识库问答
    AGENT: 'agent', // AI Agent
    AUTOMATION: 'automation', // 自动化工作流
    DATA_ANALYSIS: 'data-analysis', // 数据分析
    CONTENT: 'content', // 内容生成
    TRANSLATION: 'translation', // 翻译
    CODE: 'code', // 代码助手
    EDUCATION: 'education', // 教育培训
    OTHER: 'other' // 其他
}

// 模板分类中文名称
export const CATEGORY_NAMES: Record<string, string> = {
    [TEMPLATE_CATEGORIES.CHATBOT]: '智能客服',
    [TEMPLATE_CATEGORIES.RAG]: '知识库问答',
    [TEMPLATE_CATEGORIES.AGENT]: 'AI Agent',
    [TEMPLATE_CATEGORIES.AUTOMATION]: '自动化工作流',
    [TEMPLATE_CATEGORIES.DATA_ANALYSIS]: '数据分析',
    [TEMPLATE_CATEGORIES.CONTENT]: '内容生成',
    [TEMPLATE_CATEGORIES.TRANSLATION]: '翻译助手',
    [TEMPLATE_CATEGORIES.CODE]: '代码助手',
    [TEMPLATE_CATEGORIES.EDUCATION]: '教育培训',
    [TEMPLATE_CATEGORIES.OTHER]: '其他'
}

interface TemplateQueryParams {
    category?: string
    type?: string
    search?: string
    isPublic?: boolean
    userId?: string
    page?: number
    limit?: number
    sortBy?: 'useCount' | 'likeCount' | 'createdDate' | 'viewCount'
    sortOrder?: 'ASC' | 'DESC'
}

interface ShareTemplateParams {
    chatflowId?: string
    name: string
    description?: string
    category?: string
    tags?: string[]
    isPublic?: boolean
    userId: string
}

// 获取公开模板列表（包含官方模板和用户分享的模板）
const getPublicTemplates = async (params: TemplateQueryParams) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)

        // 1. 加载官方模板
        let officialTemplates = loadOfficialTemplates()

        // 对官方模板应用筛选
        if (params.category) {
            officialTemplates = officialTemplates.filter((t) => t.category === params.category)
        }
        if (params.type) {
            officialTemplates = officialTemplates.filter((t) => t.type === params.type)
        }
        if (params.search) {
            const searchLower = params.search.toLowerCase()
            officialTemplates = officialTemplates.filter(
                (t) =>
                    t.name.toLowerCase().includes(searchLower) ||
                    t.description.toLowerCase().includes(searchLower) ||
                    t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
            )
        }

        // 转换官方模板格式
        const processedOfficialTemplates = officialTemplates.map((t) => ({
            ...t,
            isOfficial: true,
            flowData: typeof t.flowData === 'string' ? t.flowData : JSON.stringify(t.flowData)
        }))

        // 2. 查询用户分享的公开模板
        const queryBuilder = templateRepo.createQueryBuilder('template').where('template.isPublic = :isPublic', { isPublic: true })

        if (params.category) {
            queryBuilder.andWhere('template.category = :category', { category: params.category })
        }
        if (params.type) {
            queryBuilder.andWhere('template.type = :type', { type: params.type })
        }
        if (params.search) {
            queryBuilder.andWhere('(template.name LIKE :search OR template.description LIKE :search OR template.tags LIKE :search)', {
                search: `%${params.search}%`
            })
        }

        const sortBy = params.sortBy || 'useCount'
        const sortOrder = params.sortOrder || 'DESC'
        queryBuilder.orderBy(`template.${sortBy}`, sortOrder)

        const userTemplates = await queryBuilder.getMany()

        // 处理用户模板数据
        const processedUserTemplates = userTemplates.map((template) => ({
            ...template,
            tags: template.tags ? JSON.parse(template.tags) : [],
            usecases: template.usecases ? JSON.parse(template.usecases) : [],
            isOfficial: false
        }))

        // 3. 合并模板（官方模板优先显示）
        const allTemplates = [...processedOfficialTemplates, ...processedUserTemplates]
        const total = allTemplates.length

        // 分页
        const page = params.page || 1
        const limit = params.limit || 20
        const startIndex = (page - 1) * limit
        const paginatedTemplates = allTemplates.slice(startIndex, startIndex + limit)

        return {
            templates: paginatedTemplates,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.getPublicTemplates - ${getErrorMessage(error)}`
        )
    }
}

// 获取用户自己的模板
const getUserTemplates = async (userId: string, params: TemplateQueryParams) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)

        const queryBuilder = templateRepo.createQueryBuilder('template').where('template.userId = :userId', { userId })

        // 分类筛选
        if (params.category) {
            queryBuilder.andWhere('template.category = :category', { category: params.category })
        }

        // 搜索
        if (params.search) {
            queryBuilder.andWhere('(template.name LIKE :search OR template.description LIKE :search)', { search: `%${params.search}%` })
        }

        // 排序
        queryBuilder.orderBy('template.createdDate', 'DESC')

        const templates = await queryBuilder.getMany()

        return templates.map((template) => ({
            ...template,
            tags: template.tags ? JSON.parse(template.tags) : [],
            usecases: template.usecases ? JSON.parse(template.usecases) : []
        }))
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.getUserTemplates - ${getErrorMessage(error)}`
        )
    }
}

// 分享工作流为模板
const shareAsTemplate = async (params: ShareTemplateParams) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)
        const userRepo = appServer.AppDataSource.getRepository(User)

        // 获取用户信息
        const user = await userRepo.findOne({ where: { id: params.userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }

        let flowDataStr = ''
        let derivedFramework = 'Langchain'
        let templateType = 'Chatflow'

        if (params.chatflowId) {
            const chatflow = await chatflowsService.getChatflowById(params.chatflowId)
            if (!chatflow) {
                throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '工作流不存在')
            }

            const flowData = JSON.parse(chatflow.flowData)
            const { framework, exportJson } = _generateExportFlowData(flowData)
            flowDataStr = JSON.stringify(exportJson)
            derivedFramework = framework
            templateType = chatflow.type || 'Chatflow'
        }

        const template = templateRepo.create({
            name: params.name,
            description: params.description || '',
            flowData: flowDataStr,
            category: params.category || TEMPLATE_CATEGORIES.OTHER,
            tags: params.tags ? JSON.stringify(params.tags) : '[]',
            isPublic: params.isPublic ?? false,
            userId: params.userId,
            author: user.username,
            framework: derivedFramework,
            type: templateType,
            useCount: 0,
            likeCount: 0,
            viewCount: 0,
            version: '1.0.0'
        })

        const savedTemplate = await templateRepo.save(template)

        return {
            ...savedTemplate,
            tags: savedTemplate.tags ? JSON.parse(savedTemplate.tags) : []
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.shareAsTemplate - ${getErrorMessage(error)}`
        )
    }
}

// 使用模板（复制到自己的工作流）
const useTemplate = async (templateId: string, userId?: string) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)

        const template = await templateRepo.findOne({ where: { id: templateId } })
        if (!template) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '模板不存在')
        }

        // 增加使用次数
        template.useCount = (template.useCount || 0) + 1
        await templateRepo.save(template)

        return {
            flowData: template.flowData,
            name: template.name,
            type: template.type
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.useTemplate - ${getErrorMessage(error)}`
        )
    }
}

// 获取模板详情
const getTemplateById = async (templateId: string, userId?: string) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)
        const favoriteRepo = appServer.AppDataSource.getRepository(TemplateFavorite)
        const ratingRepo = appServer.AppDataSource.getRepository(TemplateRating)

        const template = await templateRepo.findOne({ where: { id: templateId } })
        if (!template) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '模板不存在')
        }

        // 增加浏览次数
        template.viewCount = (template.viewCount || 0) + 1
        await templateRepo.save(template)

        // 检查用户是否收藏
        let isFavorited = false
        if (userId) {
            const favorite = await favoriteRepo.findOne({
                where: { userId, templateId }
            })
            isFavorited = !!favorite
        }

        // 获取平均评分
        const ratingResult = await ratingRepo
            .createQueryBuilder('rating')
            .select('AVG(rating.rating)', 'avgRating')
            .addSelect('COUNT(*)', 'ratingCount')
            .where('rating.templateId = :templateId', { templateId })
            .getRawOne()

        return {
            ...template,
            tags: template.tags ? JSON.parse(template.tags) : [],
            usecases: template.usecases ? JSON.parse(template.usecases) : [],
            isFavorited,
            avgRating: parseFloat(ratingResult?.avgRating || '0').toFixed(1),
            ratingCount: parseInt(ratingResult?.ratingCount || '0')
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.getTemplateById - ${getErrorMessage(error)}`
        )
    }
}

// 收藏/取消收藏模板
const toggleFavorite = async (templateId: string, userId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)
        const favoriteRepo = appServer.AppDataSource.getRepository(TemplateFavorite)

        const template = await templateRepo.findOne({ where: { id: templateId } })
        if (!template) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '模板不存在')
        }

        const existingFavorite = await favoriteRepo.findOne({
            where: { userId, templateId }
        })

        if (existingFavorite) {
            // 取消收藏
            await favoriteRepo.delete({ id: existingFavorite.id })
            template.likeCount = Math.max(0, (template.likeCount || 0) - 1)
            await templateRepo.save(template)
            return { favorited: false, likeCount: template.likeCount }
        } else {
            // 添加收藏
            const favorite = favoriteRepo.create({ userId, templateId })
            await favoriteRepo.save(favorite)
            template.likeCount = (template.likeCount || 0) + 1
            await templateRepo.save(template)
            return { favorited: true, likeCount: template.likeCount }
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.toggleFavorite - ${getErrorMessage(error)}`
        )
    }
}

// 评分模板
const rateTemplate = async (templateId: string, userId: string, rating: number, comment?: string) => {
    try {
        if (rating < 1 || rating > 5) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '评分必须在 1-5 之间')
        }

        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)
        const ratingRepo = appServer.AppDataSource.getRepository(TemplateRating)

        const template = await templateRepo.findOne({ where: { id: templateId } })
        if (!template) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '模板不存在')
        }

        // 查找现有评分
        let existingRating = await ratingRepo.findOne({
            where: { userId, templateId }
        })

        if (existingRating) {
            // 更新评分
            existingRating.rating = rating
            existingRating.comment = comment
            await ratingRepo.save(existingRating)
        } else {
            // 创建新评分
            const newRating = ratingRepo.create({
                userId,
                templateId,
                rating,
                comment
            })
            await ratingRepo.save(newRating)
        }

        // 获取新的平均评分
        const ratingResult = await ratingRepo
            .createQueryBuilder('rating')
            .select('AVG(rating.rating)', 'avgRating')
            .addSelect('COUNT(*)', 'ratingCount')
            .where('rating.templateId = :templateId', { templateId })
            .getRawOne()

        return {
            avgRating: parseFloat(ratingResult?.avgRating || '0').toFixed(1),
            ratingCount: parseInt(ratingResult?.ratingCount || '0')
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.rateTemplate - ${getErrorMessage(error)}`
        )
    }
}

// 获取用户收藏的模板
const getUserFavorites = async (userId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const favoriteRepo = appServer.AppDataSource.getRepository(TemplateFavorite)
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)

        const favorites = await favoriteRepo.find({ where: { userId } })
        const templateIds = favorites.map((f) => f.templateId)

        if (templateIds.length === 0) {
            return []
        }

        const templates = await templateRepo
            .createQueryBuilder('template')
            .where('template.id IN (:...ids)', { ids: templateIds })
            .getMany()

        return templates.map((template) => ({
            ...template,
            tags: template.tags ? JSON.parse(template.tags) : [],
            usecases: template.usecases ? JSON.parse(template.usecases) : [],
            isFavorited: true
        }))
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.getUserFavorites - ${getErrorMessage(error)}`
        )
    }
}

// 获取分类统计
const getCategoryStats = async () => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)

        const stats = await templateRepo
            .createQueryBuilder('template')
            .select('template.category', 'category')
            .addSelect('COUNT(*)', 'count')
            .where('template.isPublic = :isPublic', { isPublic: true })
            .groupBy('template.category')
            .getRawMany()

        return stats.map((stat) => ({
            category: stat.category || TEMPLATE_CATEGORIES.OTHER,
            categoryName: CATEGORY_NAMES[stat.category] || '其他',
            count: parseInt(stat.count)
        }))
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.getCategoryStats - ${getErrorMessage(error)}`
        )
    }
}

// 获取热门模板
const getPopularTemplates = async (limit: number = 10) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)

        const templates = await templateRepo
            .createQueryBuilder('template')
            .where('template.isPublic = :isPublic', { isPublic: true })
            .orderBy('template.useCount', 'DESC')
            .addOrderBy('template.likeCount', 'DESC')
            .take(limit)
            .getMany()

        return templates.map((template) => ({
            ...template,
            tags: template.tags ? JSON.parse(template.tags) : [],
            usecases: template.usecases ? JSON.parse(template.usecases) : []
        }))
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.getPopularTemplates - ${getErrorMessage(error)}`
        )
    }
}

// 删除模板
const deleteTemplate = async (templateId: string, userId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)

        const template = await templateRepo.findOne({ where: { id: templateId } })
        if (!template) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '模板不存在')
        }

        // 检查权限
        if (template.userId !== userId) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, '无权删除此模板')
        }

        await templateRepo.delete({ id: templateId })
        return { success: true }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.deleteTemplate - ${getErrorMessage(error)}`
        )
    }
}

// 更新模板
const updateTemplate = async (templateId: string, userId: string, updates: Partial<CustomTemplate>) => {
    try {
        const appServer = getRunningExpressApp()
        const templateRepo = appServer.AppDataSource.getRepository(CustomTemplate)

        const template = await templateRepo.findOne({ where: { id: templateId } })
        if (!template) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '模板不存在')
        }

        // 检查权限
        if (template.userId !== userId) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, '无权修改此模板')
        }

        // 更新允许的字段
        if (updates.name) template.name = updates.name
        if (updates.description !== undefined) template.description = updates.description
        if (updates.category) template.category = updates.category
        if (updates.tags) template.tags = JSON.stringify(updates.tags)
        if (updates.isPublic !== undefined) template.isPublic = updates.isPublic

        const savedTemplate = await templateRepo.save(template)

        return {
            ...savedTemplate,
            tags: savedTemplate.tags ? JSON.parse(savedTemplate.tags) : []
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: templateMarketService.updateTemplate - ${getErrorMessage(error)}`
        )
    }
}

// 辅助函数：生成导出数据
const _generateExportFlowData = (flowData: any) => {
    const nodes = flowData.nodes
    const edges = flowData.edges

    let framework = 'Langchain'
    for (let i = 0; i < nodes.length; i += 1) {
        nodes[i].selected = false
        const node = nodes[i]

        const newNodeData = {
            id: node.data.id,
            label: node.data.label,
            version: node.data.version,
            name: node.data.name,
            type: node.data.type,
            baseClasses: node.data.baseClasses,
            tags: node.data.tags,
            category: node.data.category,
            description: node.data.description,
            inputParams: node.data.inputParams,
            inputAnchors: node.data.inputAnchors,
            inputs: {},
            outputAnchors: node.data.outputAnchors,
            outputs: node.data.outputs,
            selected: false
        }

        if (node.data.tags && node.data.tags.length) {
            if (node.data.tags.includes('LlamaIndex')) {
                framework = 'LlamaIndex'
            }
        }

        // 移除敏感信息
        if (node.data.inputs && Object.keys(node.data.inputs).length) {
            const nodeDataInputs: any = {}
            for (const input in node.data.inputs) {
                const inputParam = node.data.inputParams.find((inp: any) => inp.name === input)
                if (inputParam && inputParam.type === 'password') continue
                if (inputParam && inputParam.type === 'file') continue
                if (inputParam && inputParam.type === 'folder') continue
                nodeDataInputs[input] = node.data.inputs[input]
            }
            newNodeData.inputs = nodeDataInputs
        }

        nodes[i].data = newNodeData
    }

    const exportJson = { nodes, edges }
    return { exportJson, framework }
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
    TEMPLATE_CATEGORIES,
    CATEGORY_NAMES
}
