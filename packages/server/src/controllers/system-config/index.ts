import { Request, Response, NextFunction } from 'express'
import { getSystemConfig, setSystemConfig, deleteSystemConfig, getAllSystemConfigs, SYSTEM_CONFIG_KEYS } from '../../services/system-config'

/**
 * 获取所有系统配置（仅管理员）
 */
const getAllConfigs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 检查是否是管理员
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: '只有管理员可以访问系统配置' })
        }

        const configs = await getAllSystemConfigs()
        return res.json(configs)
    } catch (error) {
        next(error)
    }
}

/**
 * 获取单个系统配置（仅管理员）
 */
const getConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 检查是否是管理员
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: '只有管理员可以访问系统配置' })
        }

        const { key } = req.params
        const value = await getSystemConfig(key)

        if (value === null) {
            return res.status(404).json({ message: '配置不存在' })
        }

        return res.json({ key, value })
    } catch (error) {
        next(error)
    }
}

/**
 * 设置系统配置（仅管理员）
 */
const setConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 检查是否是管理员
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: '只有管理员可以设置系统配置' })
        }

        const { key, value, description, isEncrypted } = req.body

        if (!key || !value) {
            return res.status(400).json({ message: '缺少必要参数: key 和 value' })
        }

        await setSystemConfig(key, value, description, isEncrypted || false)

        return res.json({ message: '配置已保存', key })
    } catch (error) {
        next(error)
    }
}

/**
 * 删除系统配置（仅管理员）
 */
const removeConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 检查是否是管理员
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: '只有管理员可以删除系统配置' })
        }

        const { key } = req.params

        await deleteSystemConfig(key)

        return res.json({ message: '配置已删除', key })
    } catch (error) {
        next(error)
    }
}

/**
 * 设置工作流生成器 API Key（仅管理员）
 */
const setWorkflowGeneratorApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('[SystemConfig Controller] 收到保存 API Key 请求')
        console.log('[SystemConfig Controller] 用户角色:', req.user?.role)
        console.log('[SystemConfig Controller] 请求体:', {
            hasApiKey: !!req.body.apiKey,
            model: req.body.model,
            provider: req.body.provider
        })

        // 检查是否是管理员
        if (req.user?.role !== 'admin') {
            console.log('[SystemConfig Controller] 权限不足')
            return res.status(403).json({ message: '只有管理员可以设置工作流生成器 API Key' })
        }

        const { apiKey, model, provider } = req.body

        if (!apiKey) {
            console.log('[SystemConfig Controller] 缺少 API Key')
            return res.status(400).json({ message: '缺少 API Key' })
        }

        console.log('[SystemConfig Controller] 开始保存 API Key...')

        // 保存 API Key（加密）
        await setSystemConfig(
            SYSTEM_CONFIG_KEYS.WORKFLOW_GENERATOR_API_KEY,
            apiKey,
            '工作流生成器专用 API Key，仅用于生成工作流',
            true, // 加密存储
            provider || 'deepseek'
        )

        console.log('[SystemConfig Controller] API Key 保存成功')

        // 保存模型配置（可选）
        if (model) {
            console.log('[SystemConfig Controller] 保存模型配置:', model)
            await setSystemConfig(SYSTEM_CONFIG_KEYS.WORKFLOW_GENERATOR_MODEL, model, '工作流生成器使用的模型', false)
        }

        console.log('[SystemConfig Controller] 所有配置保存完成')
        return res.json({ message: '工作流生成器配置已保存' })
    } catch (error) {
        console.error('[SystemConfig Controller] 保存失败:', error)
        next(error)
    }
}

/**
 * 检查工作流生成器配置状态（仅管理员）
 */
const checkWorkflowGeneratorConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 检查是否是管理员
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: '只有管理员可以查看配置状态' })
        }

        const apiKey = await getSystemConfig(SYSTEM_CONFIG_KEYS.WORKFLOW_GENERATOR_API_KEY)
        const model = await getSystemConfig(SYSTEM_CONFIG_KEYS.WORKFLOW_GENERATOR_MODEL)

        // 获取提供商信息
        const { getWorkflowGeneratorProvider } = require('../../services/system-config')
        const provider = await getWorkflowGeneratorProvider()

        return res.json({
            hasApiKey: !!apiKey,
            model: model || 'deepseek-chat',
            provider: provider || 'deepseek',
            isConfigured: !!apiKey
        })
    } catch (error) {
        next(error)
    }
}

export default {
    getAllConfigs,
    getConfig,
    setConfig,
    removeConfig,
    setWorkflowGeneratorApiKey,
    checkWorkflowGeneratorConfig
}
