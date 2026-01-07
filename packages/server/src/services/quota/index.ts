import { StatusCodes } from 'http-status-codes'
import { User } from '../../database/entities/User'
import { UsageLog } from '../../database/entities/UsageLog'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'

interface QuotaInfo {
    userId: string
    username: string
    quotaLimit: number
    quotaUsed: number
    quotaRemaining: number
    usagePercentage: number
    warningThreshold: number
    isWarning: boolean
    isExhausted: boolean
}

interface QuotaCheckResult {
    allowed: boolean
    reason?: string
    quotaInfo: QuotaInfo
}

// 获取用户配额信息
const getQuotaInfo = async (userId: string): Promise<QuotaInfo> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)

        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }

        const quotaRemaining = Math.max(0, user.quotaLimit - user.quotaUsed)
        const usagePercentage = user.quotaLimit > 0 ? (user.quotaUsed / user.quotaLimit) * 100 : 0
        const warningThreshold = (user as any).quotaWarningThreshold || 80

        return {
            userId: user.id,
            username: user.username,
            quotaLimit: user.quotaLimit,
            quotaUsed: user.quotaUsed,
            quotaRemaining,
            usagePercentage: Number(usagePercentage.toFixed(2)),
            warningThreshold,
            isWarning: usagePercentage >= warningThreshold,
            isExhausted: quotaRemaining <= 0
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: quotaService.getQuotaInfo - ${getErrorMessage(error)}`)
    }
}

// 检查配额是否充足
const checkQuota = async (userId: string, requiredTokens: number = 0): Promise<QuotaCheckResult> => {
    try {
        const quotaInfo = await getQuotaInfo(userId)

        if (quotaInfo.isExhausted) {
            return {
                allowed: false,
                reason: '配额已用尽，请联系管理员增加配额',
                quotaInfo
            }
        }

        if (requiredTokens > 0 && quotaInfo.quotaRemaining < requiredTokens) {
            return {
                allowed: false,
                reason: `配额不足，需要 ${requiredTokens} tokens，剩余 ${quotaInfo.quotaRemaining} tokens`,
                quotaInfo
            }
        }

        return {
            allowed: true,
            quotaInfo
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: quotaService.checkQuota - ${getErrorMessage(error)}`)
    }
}

// 消费配额
const consumeQuota = async (userId: string, tokens: number): Promise<QuotaInfo> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)

        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }

        // 更新已使用配额
        user.quotaUsed = (user.quotaUsed || 0) + tokens
        await userRepository.save(user)

        // 检查是否需要发送预警
        const quotaInfo = await getQuotaInfo(userId)
        if (quotaInfo.isWarning && !(user as any).quotaWarningNotified) {
            // 标记已发送预警（实际发送邮件的逻辑可以在这里添加）
            await userRepository.update(userId, { quotaWarningNotified: true } as any)
        }

        return quotaInfo
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: quotaService.consumeQuota - ${getErrorMessage(error)}`)
    }
}

// 设置用户配额（管理员）
const setUserQuota = async (userId: string, quotaLimit: number): Promise<QuotaInfo> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)

        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }

        user.quotaLimit = quotaLimit
        // 如果新配额大于已使用，重置预警状态
        if (quotaLimit > user.quotaUsed) {
            ;(user as any).quotaWarningNotified = false
        }
        await userRepository.save(user)

        return getQuotaInfo(userId)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: quotaService.setUserQuota - ${getErrorMessage(error)}`)
    }
}

// 重置用户配额使用量（管理员）
const resetUserQuota = async (userId: string): Promise<QuotaInfo> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)

        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }

        user.quotaUsed = 0
        user.quotaResetAt = new Date()
        ;(user as any).quotaWarningNotified = false
        await userRepository.save(user)

        return getQuotaInfo(userId)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: quotaService.resetUserQuota - ${getErrorMessage(error)}`)
    }
}

// 增加用户配额（管理员充值）
const addUserQuota = async (userId: string, amount: number): Promise<QuotaInfo> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)

        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }

        user.quotaLimit = (user.quotaLimit || 0) + amount
        // 重置预警状态
        ;(user as any).quotaWarningNotified = false
        await userRepository.save(user)

        return getQuotaInfo(userId)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: quotaService.addUserQuota - ${getErrorMessage(error)}`)
    }
}

// 设置预警阈值
const setWarningThreshold = async (userId: string, threshold: number): Promise<QuotaInfo> => {
    try {
        if (threshold < 0 || threshold > 100) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '预警阈值必须在 0-100 之间')
        }

        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)

        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }

        ;(user as any).quotaWarningThreshold = threshold
        await userRepository.save(user)

        return getQuotaInfo(userId)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: quotaService.setWarningThreshold - ${getErrorMessage(error)}`
        )
    }
}

// 获取所有用户配额概览（管理员）
const getAllUsersQuota = async (): Promise<QuotaInfo[]> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)

        const users = await userRepository.find()

        return users.map((user) => {
            const quotaRemaining = Math.max(0, user.quotaLimit - user.quotaUsed)
            const usagePercentage = user.quotaLimit > 0 ? (user.quotaUsed / user.quotaLimit) * 100 : 0
            const warningThreshold = (user as any).quotaWarningThreshold || 80

            return {
                userId: user.id,
                username: user.username,
                quotaLimit: user.quotaLimit,
                quotaUsed: user.quotaUsed,
                quotaRemaining,
                usagePercentage: Number(usagePercentage.toFixed(2)),
                warningThreshold,
                isWarning: usagePercentage >= warningThreshold,
                isExhausted: quotaRemaining <= 0
            }
        })
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: quotaService.getAllUsersQuota - ${getErrorMessage(error)}`
        )
    }
}

// 同步用户配额使用量（从UsageLog汇总）
const syncUserQuota = async (userId: string): Promise<QuotaInfo> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }

        // 从UsageLog汇总该用户的总token使用量
        const result = await usageLogRepository
            .createQueryBuilder('usage_log')
            .select('SUM(usage_log.totalTokens)', 'totalTokens')
            .where('usage_log.userId = :userId', { userId })
            .getRawOne()

        const totalTokensFromLogs = parseInt(result?.totalTokens || '0', 10)

        // 更新用户的quotaUsed
        user.quotaUsed = totalTokensFromLogs
        await userRepository.save(user)

        return getQuotaInfo(userId)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: quotaService.syncUserQuota - ${getErrorMessage(error)}`)
    }
}

// 同步所有用户配额使用量（管理员）
const syncAllUsersQuota = async (): Promise<{ synced: number; results: QuotaInfo[] }> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const usageLogRepository = appServer.AppDataSource.getRepository(UsageLog)

        const users = await userRepository.find()
        const results: QuotaInfo[] = []

        for (const user of users) {
            // 从UsageLog汇总该用户的总token使用量
            const result = await usageLogRepository
                .createQueryBuilder('usage_log')
                .select('SUM(usage_log.totalTokens)', 'totalTokens')
                .where('usage_log.userId = :userId', { userId: user.id })
                .getRawOne()

            const totalTokensFromLogs = parseInt(result?.totalTokens || '0', 10)

            // 更新用户的quotaUsed
            user.quotaUsed = totalTokensFromLogs
            await userRepository.save(user)

            const quotaRemaining = Math.max(0, user.quotaLimit - user.quotaUsed)
            const usagePercentage = user.quotaLimit > 0 ? (user.quotaUsed / user.quotaLimit) * 100 : 0
            const warningThreshold = (user as any).quotaWarningThreshold || 80

            results.push({
                userId: user.id,
                username: user.username,
                quotaLimit: user.quotaLimit,
                quotaUsed: user.quotaUsed,
                quotaRemaining,
                usagePercentage: Number(usagePercentage.toFixed(2)),
                warningThreshold,
                isWarning: usagePercentage >= warningThreshold,
                isExhausted: quotaRemaining <= 0
            })
        }

        return { synced: users.length, results }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: quotaService.syncAllUsersQuota - ${getErrorMessage(error)}`
        )
    }
}

export default {
    getQuotaInfo,
    checkQuota,
    consumeQuota,
    setUserQuota,
    resetUserQuota,
    addUserQuota,
    setWarningThreshold,
    getAllUsersQuota,
    syncUserQuota,
    syncAllUsersQuota
}
