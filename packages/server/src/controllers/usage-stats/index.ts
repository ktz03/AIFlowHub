import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import usageStatsService from '../../services/usage-stats'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

// 获取使用概览
const getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query
        const isAdmin = req.user?.role === 'admin'
        // 管理员可以查看所有用户（不传userId），普通用户只能查看自己
        let userId: string | undefined
        if (isAdmin) {
            userId = req.query.userId as string | undefined // 管理员可以指定用户，不指定则查看所有
        } else {
            userId = req.user?.userId // 普通用户只能查看自己
        }

        console.log(`[UsageStats] getOverview - userId: ${userId}, role: ${req.user?.role}`)

        const overview = await usageStatsService.getUsageOverview(userId, startDate as string, endDate as string, isAdmin)

        return res.status(StatusCodes.OK).json({
            success: true,
            data: overview
        })
    } catch (error) {
        next(error)
    }
}

// 获取使用趋势
const getTrend = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, granularity } = req.query
        const isAdmin = req.user?.role === 'admin'
        let userId: string | undefined
        if (isAdmin) {
            userId = req.query.userId as string | undefined
        } else {
            userId = req.user?.userId
        }

        const trend = await usageStatsService.getUsageTrend(
            userId,
            startDate as string,
            endDate as string,
            (granularity as 'day' | 'week' | 'month') || 'day',
            isAdmin
        )

        return res.status(StatusCodes.OK).json({
            success: true,
            data: trend
        })
    } catch (error) {
        next(error)
    }
}

// 获取模型分布
const getModelDistribution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query
        const isAdmin = req.user?.role === 'admin'
        let userId: string | undefined
        if (isAdmin) {
            userId = req.query.userId as string | undefined
        } else {
            userId = req.user?.userId
        }

        const distribution = await usageStatsService.getModelDistribution(userId, startDate as string, endDate as string, isAdmin)

        return res.status(StatusCodes.OK).json({
            success: true,
            data: distribution
        })
    } catch (error) {
        next(error)
    }
}

// 获取提供商分布
const getProviderDistribution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query
        const isAdmin = req.user?.role === 'admin'
        let userId: string | undefined
        if (isAdmin) {
            userId = req.query.userId as string | undefined
        } else {
            userId = req.user?.userId
        }

        const distribution = await usageStatsService.getProviderDistribution(userId, startDate as string, endDate as string, isAdmin)

        return res.status(StatusCodes.OK).json({
            success: true,
            data: distribution
        })
    } catch (error) {
        next(error)
    }
}

// 获取使用日志列表
const getLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, page, limit } = req.query
        const isAdmin = req.user?.role === 'admin'
        let userId: string | undefined
        if (isAdmin) {
            userId = req.query.userId as string | undefined
        } else {
            userId = req.user?.userId
        }

        const result = await usageStatsService.getUsageLogs(
            userId,
            startDate as string,
            endDate as string,
            parseInt(page as string) || 1,
            parseInt(limit as string) || 20,
            isAdmin
        )

        return res.status(StatusCodes.OK).json({
            success: true,
            data: result
        })
    } catch (error) {
        next(error)
    }
}

// 获取用户排行榜（仅管理员）
const getUserRanking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, limit } = req.query

        const ranking = await usageStatsService.getUserRanking(startDate as string, endDate as string, parseInt(limit as string) || 10)

        return res.status(StatusCodes.OK).json({
            success: true,
            data: ranking
        })
    } catch (error) {
        next(error)
    }
}

// 导出使用数据
const exportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query
        const userId = req.user?.role === 'admin' ? (req.query.userId as string) : req.user?.userId

        const csv = await usageStatsService.exportUsageData(userId, startDate as string, endDate as string)

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', `attachment; filename=usage-report-${new Date().toISOString().split('T')[0]}.csv`)
        // 添加BOM以支持Excel正确显示中文
        return res.status(StatusCodes.OK).send('\ufeff' + csv)
    } catch (error) {
        next(error)
    }
}

// 记录使用日志（内部API）
const logUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, chatflowId, provider, model, inputTokens, outputTokens, latencyMs, status, errorMessage } = req.body

        if (!userId || !provider || !model) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '缺少必要参数')
        }

        const log = await usageStatsService.logUsage({
            userId,
            chatflowId,
            provider,
            model,
            inputTokens: inputTokens || 0,
            outputTokens: outputTokens || 0,
            latencyMs,
            status,
            errorMessage
        })

        return res.status(StatusCodes.CREATED).json({
            success: true,
            data: log
        })
    } catch (error) {
        next(error)
    }
}

// 获取模型定价信息
const getPricing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        return res.status(StatusCodes.OK).json({
            success: true,
            data: usageStatsService.MODEL_PRICING
        })
    } catch (error) {
        next(error)
    }
}

// 清除使用日志（普通用户软删除自己的，管理员硬删除）
const clearAllLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isAdmin = req.user?.role === 'admin'
        let userId: string | undefined

        if (isAdmin) {
            // 管理员可以指定用户ID，不指定则删除所有
            userId = req.query.userId as string | undefined
        } else {
            // 普通用户只能删除自己的数据
            userId = req.user?.userId
        }

        const result = await usageStatsService.clearAllLogs(userId, isAdmin)

        const message = isAdmin
            ? `成功永久删除 ${result.deletedCount} 条使用记录`
            : `成功清除 ${result.deletedCount} 条使用记录（管理员仍可查看）`

        return res.status(StatusCodes.OK).json({
            success: true,
            message,
            data: result
        })
    } catch (error) {
        next(error)
    }
}

export default {
    getOverview,
    getTrend,
    getModelDistribution,
    getProviderDistribution,
    getLogs,
    getUserRanking,
    exportData,
    logUsage,
    getPricing,
    clearAllLogs
}
