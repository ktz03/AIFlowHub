import { StatusCodes } from 'http-status-codes'
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm'
import { UsageLog, UsageStatus } from '../../database/entities/UsageLog'
import { User } from '../../database/entities/User'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'

// 模型定价配置 (每1000 tokens的价格，单位：美元)
// 支持缓存定价：input 为缓存未命中价格，cacheRead 为缓存命中价格
// 注：缓存命中价格通常为未命中价格的 10%-50%，具体取决于模型提供商
const MODEL_PRICING: Record<string, { input: number; output: number; cacheRead?: number }> = {
    // OpenAI - 支持 Prompt Caching (缓存命中价格为未命中的 50%)
    'gpt-4': { input: 0.03, output: 0.06, cacheRead: 0.015 },
    'gpt-4-turbo': { input: 0.01, output: 0.03, cacheRead: 0.005 },
    'gpt-4o': { input: 0.005, output: 0.015, cacheRead: 0.0025 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006, cacheRead: 0.000075 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, cacheRead: 0.00025 },

    // Claude - 支持 Prompt Caching (缓存命中价格为未命中的 10%)
    'claude-3-opus': { input: 0.015, output: 0.075, cacheRead: 0.0015 },
    'claude-3-sonnet': { input: 0.003, output: 0.015, cacheRead: 0.0003 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125, cacheRead: 0.000025 },

    // 国产模型 (人民币转美元，汇率约7.2)
    // 阿里通义千问 - 支持缓存 (缓存命中价格为未命中的 10%)
    'qwen-turbo': { input: 0.0003, output: 0.0006, cacheRead: 0.00003 },
    'qwen-plus': { input: 0.0006, output: 0.0012, cacheRead: 0.00006 },
    'qwen-max': { input: 0.0028, output: 0.0083, cacheRead: 0.00028 },

    // 百度文心 - 暂不支持缓存
    'ernie-bot': { input: 0.0017, output: 0.0017 },
    'ernie-bot-4': { input: 0.017, output: 0.017 },

    // 智谱 GLM - 支持缓存 (缓存命中价格为未命中的 10%)
    'glm-4': { input: 0.014, output: 0.014, cacheRead: 0.0014 },
    'glm-3-turbo': { input: 0.0007, output: 0.0007, cacheRead: 0.00007 },

    // 讯飞星火 - 暂不支持缓存
    'spark-v3': { input: 0.005, output: 0.005 },

    // DeepSeek - 支持缓存 (2025年1月更新)
    // 输入（缓存未命中）: ¥2/百万tokens = $0.0002857/千tokens
    // 输入（缓存命中）: ¥0.2/百万tokens = $0.00002857/千tokens (10%)
    // 输出: ¥3/百万tokens = $0.0004286/千tokens
    // 换算基于 1 USD = 7 CNY
    'deepseek-chat': { input: 0.0002857, output: 0.0004286, cacheRead: 0.00002857 },
    'deepseek-coder': { input: 0.0002857, output: 0.0004286, cacheRead: 0.00002857 },
    'deepseek-reasoner': { input: 0.0002857, output: 0.0004286, cacheRead: 0.00002857 },

    // 本地模型
    ollama: { input: 0, output: 0 }
}

interface UsageLogInput {
    userId: string
    chatflowId?: string
    provider: string
    model: string
    inputTokens: number
    outputTokens: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
    latencyMs?: number
    status?: UsageStatus
    errorMessage?: string
}

interface UsageOverview {
    totalCalls: number
    totalTokens: number
    totalCost: number
    avgLatency: number
    successRate: number
}

interface UsageTrend {
    date: string
    calls: number
    tokens: number
    cost: number
}

interface ModelDistribution {
    model: string
    provider: string
    calls: number
    tokens: number
    cost: number
    percentage: number
}

interface ProviderDistribution {
    provider: string
    calls: number
    tokens: number
    cost: number
    percentage: number
}

// 估算token数量 (简单估算：英文约4字符/token，中文约2字符/token)
const estimateTokens = (text: string): number => {
    if (!text) return 0
    // 检测中文字符比例
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const totalChars = text.length
    const chineseRatio = chineseChars / totalChars

    // 混合计算：中文按2字符/token，英文按4字符/token
    const chineseTokens = chineseChars / 2
    const englishTokens = (totalChars - chineseChars) / 4

    return Math.ceil(chineseTokens + englishTokens)
}

// 从模型名称推断提供商
const inferProvider = (modelName: string): string => {
    const lowerModel = modelName.toLowerCase()
    if (lowerModel.includes('gpt') || lowerModel.includes('openai')) return 'openai'
    if (lowerModel.includes('claude')) return 'anthropic'
    if (lowerModel.includes('qwen') || lowerModel.includes('tongyi')) return 'alibaba'
    if (lowerModel.includes('ernie') || lowerModel.includes('wenxin')) return 'baidu'
    if (lowerModel.includes('glm') || lowerModel.includes('chatglm')) return 'zhipu'
    if (lowerModel.includes('spark')) return 'xunfei'
    if (lowerModel.includes('deepseek')) return 'deepseek'
    if (lowerModel.includes('llama')) return 'meta'
    if (lowerModel.includes('gemini')) return 'google'
    if (lowerModel.includes('mistral')) return 'mistral'
    return 'unknown'
}

// 计算成本（支持缓存定价）
const calculateCost = (model: string, inputTokens: number, outputTokens: number, cacheReadTokens?: number): number => {
    const pricing = MODEL_PRICING[model.toLowerCase()] || MODEL_PRICING['gpt-3.5-turbo']

    // 计算缓存未命中的输入成本
    const inputCost = (inputTokens / 1000) * pricing.input

    // 计算缓存命中的输入成本（如果有）
    const cacheReadCost = cacheReadTokens && pricing.cacheRead ? (cacheReadTokens / 1000) * pricing.cacheRead : 0

    // 计算输出成本
    const outputCost = (outputTokens / 1000) * pricing.output

    return Number((inputCost + cacheReadCost + outputCost).toFixed(6))
}

// 记录使用日志
const logUsage = async (input: UsageLogInput): Promise<UsageLog> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)
        const userRepository = appServer.AppDataSource.getRepository(User)

        // 计算成本（支持缓存定价）
        const cost = calculateCost(input.model, input.inputTokens, input.outputTokens, input.cacheReadTokens)
        const totalTokens = input.inputTokens + input.outputTokens + (input.cacheReadTokens || 0)

        const usageLog = usageLogRepository.create({
            userId: input.userId,
            chatflowId: input.chatflowId,
            provider: input.provider,
            model: input.model,
            inputTokens: input.inputTokens,
            outputTokens: input.outputTokens,
            totalTokens,
            cost,
            latencyMs: input.latencyMs,
            status: input.status || UsageStatus.SUCCESS,
            errorMessage: input.errorMessage
        })

        await usageLogRepository.save(usageLog)

        // 更新用户配额使用量
        const user = await userRepository.findOne({ where: { id: input.userId } })
        if (user) {
            user.quotaUsed = (user.quotaUsed || 0) + totalTokens
            await userRepository.save(user)
        }

        return usageLog
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: usageStatsService.logUsage - ${getErrorMessage(error)}`)
    }
}

// 获取使用概览
const getUsageOverview = async (
    userId?: string,
    startDate?: string,
    endDate?: string,
    isAdmin: boolean = false
): Promise<UsageOverview> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const whereConditions: any = {}
        if (userId) whereConditions.userId = userId
        // 普通用户只能看到未删除的记录，管理员可以看到所有
        if (!isAdmin) whereConditions.deletedByUser = false
        if (startDate && endDate) {
            // 确保 endDate 包含整天 (设置为当天的 23:59:59)
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            whereConditions.createdAt = Between(new Date(startDate), endDateTime)
        } else if (startDate) {
            whereConditions.createdAt = MoreThanOrEqual(new Date(startDate))
        } else if (endDate) {
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            whereConditions.createdAt = LessThanOrEqual(endDateTime)
        }

        const logs = await usageLogRepository.find({ where: whereConditions })

        const totalCalls = logs.length
        const totalTokens = logs.reduce((sum, log) => sum + log.totalTokens, 0)
        const totalCost = logs.reduce((sum, log) => sum + Number(log.cost), 0)
        const successLogs = logs.filter((log) => log.status === UsageStatus.SUCCESS)
        const avgLatency = successLogs.length > 0 ? successLogs.reduce((sum, log) => sum + (log.latencyMs || 0), 0) / successLogs.length : 0
        const successRate = totalCalls > 0 ? (successLogs.length / totalCalls) * 100 : 100

        return {
            totalCalls,
            totalTokens,
            totalCost: Number(totalCost.toFixed(4)),
            avgLatency: Math.round(avgLatency),
            successRate: Number(successRate.toFixed(2))
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: usageStatsService.getUsageOverview - ${getErrorMessage(error)}`
        )
    }
}

// 获取使用趋势
const getUsageTrend = async (
    userId?: string,
    startDate?: string,
    endDate?: string,
    granularity: 'day' | 'week' | 'month' = 'day',
    isAdmin: boolean = false
): Promise<UsageTrend[]> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const whereConditions: any = {}
        if (userId) whereConditions.userId = userId
        if (!isAdmin) whereConditions.deletedByUser = false

        // 默认最近30天
        const end = endDate ? new Date(endDate) : new Date()
        end.setHours(23, 59, 59, 999) // 确保包含整天
        const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
        whereConditions.createdAt = Between(start, end)

        const logs = await usageLogRepository.find({
            where: whereConditions,
            order: { createdAt: 'ASC' }
        })

        // 按日期分组
        const trendMap = new Map<string, { calls: number; tokens: number; cost: number }>()

        logs.forEach((log) => {
            let dateKey: string
            const date = new Date(log.createdAt)

            if (granularity === 'day') {
                dateKey = date.toISOString().split('T')[0]
            } else if (granularity === 'week') {
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - date.getDay())
                dateKey = weekStart.toISOString().split('T')[0]
            } else {
                dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            }

            const existing = trendMap.get(dateKey) || { calls: 0, tokens: 0, cost: 0 }
            trendMap.set(dateKey, {
                calls: existing.calls + 1,
                tokens: existing.tokens + log.totalTokens,
                cost: existing.cost + Number(log.cost)
            })
        })

        return Array.from(trendMap.entries()).map(([date, data]) => ({
            date,
            calls: data.calls,
            tokens: data.tokens,
            cost: Number(data.cost.toFixed(4))
        }))
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: usageStatsService.getUsageTrend - ${getErrorMessage(error)}`
        )
    }
}

// 获取模型分布
const getModelDistribution = async (
    userId?: string,
    startDate?: string,
    endDate?: string,
    isAdmin: boolean = false
): Promise<ModelDistribution[]> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const whereConditions: any = {}
        if (userId) whereConditions.userId = userId
        if (!isAdmin) whereConditions.deletedByUser = false
        if (startDate && endDate) {
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            whereConditions.createdAt = Between(new Date(startDate), endDateTime)
        }

        const logs = await usageLogRepository.find({ where: whereConditions })

        const modelMap = new Map<string, { provider: string; calls: number; tokens: number; cost: number }>()
        let totalCalls = 0

        logs.forEach((log) => {
            const key = log.model
            const existing = modelMap.get(key) || { provider: log.provider, calls: 0, tokens: 0, cost: 0 }
            modelMap.set(key, {
                provider: log.provider,
                calls: existing.calls + 1,
                tokens: existing.tokens + log.totalTokens,
                cost: existing.cost + Number(log.cost)
            })
            totalCalls++
        })

        return Array.from(modelMap.entries())
            .map(([model, data]) => ({
                model,
                provider: data.provider,
                calls: data.calls,
                tokens: data.tokens,
                cost: Number(data.cost.toFixed(4)),
                percentage: totalCalls > 0 ? Number(((data.calls / totalCalls) * 100).toFixed(2)) : 0
            }))
            .sort((a, b) => b.calls - a.calls)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: usageStatsService.getModelDistribution - ${getErrorMessage(error)}`
        )
    }
}

// 获取提供商分布
const getProviderDistribution = async (
    userId?: string,
    startDate?: string,
    endDate?: string,
    isAdmin: boolean = false
): Promise<ProviderDistribution[]> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const whereConditions: any = {}
        if (userId) whereConditions.userId = userId
        if (!isAdmin) whereConditions.deletedByUser = false
        if (startDate && endDate) {
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            whereConditions.createdAt = Between(new Date(startDate), endDateTime)
        }

        const logs = await usageLogRepository.find({ where: whereConditions })

        const providerMap = new Map<string, { calls: number; tokens: number; cost: number }>()
        let totalCalls = 0

        logs.forEach((log) => {
            const existing = providerMap.get(log.provider) || { calls: 0, tokens: 0, cost: 0 }
            providerMap.set(log.provider, {
                calls: existing.calls + 1,
                tokens: existing.tokens + log.totalTokens,
                cost: existing.cost + Number(log.cost)
            })
            totalCalls++
        })

        return Array.from(providerMap.entries())
            .map(([provider, data]) => ({
                provider,
                calls: data.calls,
                tokens: data.tokens,
                cost: Number(data.cost.toFixed(4)),
                percentage: totalCalls > 0 ? Number(((data.calls / totalCalls) * 100).toFixed(2)) : 0
            }))
            .sort((a, b) => b.calls - a.calls)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: usageStatsService.getProviderDistribution - ${getErrorMessage(error)}`
        )
    }
}

// 获取使用日志列表
const getUsageLogs = async (
    userId?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 20,
    isAdmin: boolean = false
): Promise<{ logs: UsageLog[]; total: number; page: number; totalPages: number }> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const whereConditions: any = {}
        if (userId) whereConditions.userId = userId
        if (!isAdmin) whereConditions.deletedByUser = false
        if (startDate && endDate) {
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            whereConditions.createdAt = Between(new Date(startDate), endDateTime)
        }

        const [logs, total] = await usageLogRepository.findAndCount({
            where: whereConditions,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        })

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: usageStatsService.getUsageLogs - ${getErrorMessage(error)}`
        )
    }
}

// 获取用户排行榜
const getUserRanking = async (
    startDate?: string,
    endDate?: string,
    limit: number = 10
): Promise<Array<{ userId: string; username: string; totalCalls: number; totalTokens: number; totalCost: number }>> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)
        const userRepository = appServer.AppDataSource.getRepository(User)

        const whereConditions: any = {}
        if (startDate && endDate) {
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            whereConditions.createdAt = Between(new Date(startDate), endDateTime)
        }

        const logs = await usageLogRepository.find({ where: whereConditions })

        const userMap = new Map<string, { calls: number; tokens: number; cost: number }>()
        logs.forEach((log) => {
            const existing = userMap.get(log.userId) || { calls: 0, tokens: 0, cost: 0 }
            userMap.set(log.userId, {
                calls: existing.calls + 1,
                tokens: existing.tokens + log.totalTokens,
                cost: existing.cost + Number(log.cost)
            })
        })

        const rankings = Array.from(userMap.entries())
            .map(([userId, data]) => ({
                userId,
                totalCalls: data.calls,
                totalTokens: data.tokens,
                totalCost: Number(data.cost.toFixed(4))
            }))
            .sort((a, b) => b.totalTokens - a.totalTokens)
            .slice(0, limit)

        // 获取用户名
        const result = await Promise.all(
            rankings.map(async (ranking) => {
                const user = await userRepository.findOne({ where: { id: ranking.userId } })
                return {
                    ...ranking,
                    username: user?.username || '未知用户'
                }
            })
        )

        return result
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: usageStatsService.getUserRanking - ${getErrorMessage(error)}`
        )
    }
}

// 清除使用日志（用户软删除，管理员硬删除）
const clearAllLogs = async (userId?: string, isAdmin: boolean = false): Promise<{ deletedCount: number }> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const whereConditions: any = {}
        if (userId) {
            whereConditions.userId = userId
        }

        // 先获取数量
        const count = await usageLogRepository.count({ where: whereConditions })

        if (isAdmin && !userId) {
            // 管理员删除所有记录（硬删除）
            await usageLogRepository.clear()
        } else if (isAdmin && userId) {
            // 管理员删除指定用户记录（硬删除）
            await usageLogRepository.delete({ userId })
        } else if (userId) {
            // 普通用户删除自己的记录（软删除）
            await usageLogRepository.update({ userId }, { deletedByUser: true })
        }

        return { deletedCount: count }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: usageStatsService.clearAllLogs - ${getErrorMessage(error)}`
        )
    }
}

// 导出使用数据为CSV
const exportUsageData = async (userId?: string, startDate?: string, endDate?: string): Promise<string> => {
    try {
        const appServer = getRunningExpressApp()
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const whereConditions: any = {}
        if (userId) whereConditions.userId = userId
        if (startDate && endDate) {
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            whereConditions.createdAt = Between(new Date(startDate), endDateTime)
        }

        const logs = await usageLogRepository.find({
            where: whereConditions,
            order: { createdAt: 'DESC' }
        })

        // 生成CSV
        const headers = ['时间', '提供商', '模型', '输入Token', '输出Token', '总Token', '成本(USD)', '延迟(ms)', '状态']
        const rows = logs.map((log) => [
            new Date(log.createdAt).toLocaleString('zh-CN'),
            log.provider,
            log.model,
            log.inputTokens,
            log.outputTokens,
            log.totalTokens,
            log.cost,
            log.latencyMs || '',
            log.status
        ])

        const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
        return csv
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: usageStatsService.exportUsageData - ${getErrorMessage(error)}`
        )
    }
}

export default {
    calculateCost,
    logUsage,
    getUsageOverview,
    getUsageTrend,
    getModelDistribution,
    getProviderDistribution,
    getUsageLogs,
    getUserRanking,
    exportUsageData,
    clearAllLogs,
    estimateTokens,
    inferProvider,
    MODEL_PRICING
}
