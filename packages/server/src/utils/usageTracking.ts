import { getRunningExpressApp } from './getRunningExpressApp'
import { UsageLog, UsageStatus } from '../database/entities/UsageLog'
import { User } from '../database/entities/User'
import logger from './logger'

// Token估算常量
const TOKENS_PER_WORD = 1.3
const TOKENS_PER_CHINESE_CHAR = 0.5

// 模型定价配置 (每1000 tokens的价格，单位：美元)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    // OpenAI
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    // Claude
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    // 国产模型
    'qwen-turbo': { input: 0.0003, output: 0.0006 },
    'qwen-plus': { input: 0.0006, output: 0.0012 },
    'qwen-max': { input: 0.0028, output: 0.0083 },
    'deepseek-chat': { input: 0.00014, output: 0.00028 },
    'glm-4': { input: 0.014, output: 0.014 },
    'glm-3-turbo': { input: 0.0007, output: 0.0007 },
    // 默认
    default: { input: 0.001, output: 0.002 }
}

/**
 * 估算文本的token数量
 */
export const estimateTokens = (text: string): number => {
    if (!text) return 0
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const words = text.split(/\s+/).filter(Boolean).length
    const chineseTokens = chineseChars * TOKENS_PER_CHINESE_CHAR
    const englishTokens = Math.max(0, words - chineseChars) * TOKENS_PER_WORD
    return Math.ceil(chineseTokens + englishTokens) || 1
}

/**
 * 从模型名称推断提供商
 */
export const inferProvider = (modelName: string): string => {
    const lowerModel = (modelName || '').toLowerCase()
    if (lowerModel.includes('gpt') || lowerModel.includes('openai')) return 'openai'
    if (lowerModel.includes('claude')) return 'anthropic'
    if (lowerModel.includes('qwen')) return 'alibaba'
    if (lowerModel.includes('deepseek')) return 'deepseek'
    if (lowerModel.includes('glm') || lowerModel.includes('chatglm')) return 'zhipu'
    if (lowerModel.includes('gemini')) return 'google'
    if (lowerModel.includes('llama')) return 'meta'
    if (lowerModel.includes('mistral')) return 'mistral'
    return 'unknown'
}

/**
 * 计算成本
 */
export const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
    const lowerModel = (model || '').toLowerCase()
    let pricing = MODEL_PRICING['default']

    for (const [key, value] of Object.entries(MODEL_PRICING)) {
        if (lowerModel.includes(key)) {
            pricing = value
            break
        }
    }

    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    return Number((inputCost + outputCost).toFixed(6))
}

interface UsageTrackingParams {
    userId?: string
    chatflowId: string
    question: string
    answer: string
    modelName?: string
    latencyMs: number
    status: 'success' | 'failed'
    errorMessage?: string
}

/**
 * 记录使用统计
 * 在chatflow执行完成后调用
 */
export const trackUsage = async (params: UsageTrackingParams): Promise<void> => {
    logger.info(`[UsageTracking] trackUsage called with userId: ${params.userId}, chatflowId: ${params.chatflowId}`)

    // 如果没有userId，跳过记录
    if (!params.userId) {
        logger.info(`[UsageTracking] Skipping - no userId provided`)
        return
    }

    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)
        const userRepository = appServer.AppDataSource.getRepository(User)

        // 估算token数量
        const inputTokens = estimateTokens(params.question)
        const outputTokens = estimateTokens(params.answer)
        const totalTokens = inputTokens + outputTokens

        // 推断模型和提供商
        const model = params.modelName || 'unknown'
        const provider = inferProvider(model)

        // 计算成本
        const cost = calculateCost(model, inputTokens, outputTokens)

        // 创建使用日志
        const usageLog = usageLogRepository.create({
            userId: params.userId,
            chatflowId: params.chatflowId,
            provider,
            model,
            inputTokens,
            outputTokens,
            totalTokens,
            cost,
            latencyMs: params.latencyMs,
            status: params.status === 'success' ? UsageStatus.SUCCESS : UsageStatus.FAILED,
            errorMessage: params.errorMessage
        })

        await usageLogRepository.save(usageLog)
        logger.info(`[UsageTracking] Successfully saved usage log for user ${params.userId}, model: ${model}, tokens: ${totalTokens}`)

        // 更新用户配额使用量
        const user = await userRepository.findOne({ where: { id: params.userId } })
        if (user) {
            const oldQuotaUsed = user.quotaUsed || 0
            user.quotaUsed = oldQuotaUsed + totalTokens
            await userRepository.save(user)
            logger.info(`[UsageTracking] Updated user ${params.userId} quotaUsed: ${oldQuotaUsed} -> ${user.quotaUsed}`)
        } else {
            logger.warn(`[UsageTracking] User ${params.userId} not found, cannot update quotaUsed`)
        }

        logger.debug(`[UsageTracking] Logged usage for user ${params.userId}: ${inputTokens} input, ${outputTokens} output tokens`)
    } catch (error) {
        // 静默失败，不影响主流程
        logger.warn(`[UsageTracking] Failed to log usage: ${error}`)
    }
}

/**
 * 从flowData中提取模型名称
 */
export const extractModelFromFlowData = (flowData: string): string | undefined => {
    try {
        const data = JSON.parse(flowData)
        const nodes = data.nodes || []

        // 查找Chat Model节点
        for (const node of nodes) {
            if (node.data?.category === 'Chat Models' || node.data?.name?.toLowerCase().includes('chat')) {
                // 尝试从不同位置获取模型名称
                const modelName =
                    node.data?.inputs?.modelName ||
                    node.data?.inputs?.model ||
                    node.data?.inputs?.['modelName'] ||
                    node.data?.instance?.modelName
                if (modelName) return modelName
            }
        }

        return undefined
    } catch {
        return undefined
    }
}

export default {
    trackUsage,
    estimateTokens,
    inferProvider,
    calculateCost,
    extractModelFromFlowData
}
