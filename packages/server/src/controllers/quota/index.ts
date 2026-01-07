import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import quotaService from '../../services/quota'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'

// 获取当前用户配额信息
const getMyQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user
        if (!user || !user.userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未登录')
        }

        const quotaInfo = await quotaService.getQuotaInfo(user.userId)
        return res.json({ success: true, data: quotaInfo })
    } catch (error) {
        next(error)
    }
}

// 获取指定用户配额信息（管理员）
const getUserQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '缺少用户ID')
        }

        const quotaInfo = await quotaService.getQuotaInfo(userId)
        return res.json({ success: true, data: quotaInfo })
    } catch (error) {
        next(error)
    }
}

// 获取所有用户配额概览（管理员）
const getAllUsersQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const quotaList = await quotaService.getAllUsersQuota()
        return res.json({ success: true, data: quotaList })
    } catch (error) {
        next(error)
    }
}

// 设置用户配额上限（管理员）
const setUserQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params
        const { quotaLimit } = req.body

        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '缺少用户ID')
        }
        if (quotaLimit === undefined || quotaLimit < 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '配额上限必须为非负数')
        }

        const quotaInfo = await quotaService.setUserQuota(userId, quotaLimit)
        return res.json({
            success: true,
            message: '配额设置成功',
            data: quotaInfo
        })
    } catch (error) {
        next(error)
    }
}

// 重置用户配额使用量（管理员）
const resetUserQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params

        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '缺少用户ID')
        }

        const quotaInfo = await quotaService.resetUserQuota(userId)
        return res.json({
            success: true,
            message: '配额已重置',
            data: quotaInfo
        })
    } catch (error) {
        next(error)
    }
}

// 增加用户配额（管理员充值）
const addUserQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params
        const { amount } = req.body

        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '缺少用户ID')
        }
        if (!amount || amount <= 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '充值数量必须为正数')
        }

        const quotaInfo = await quotaService.addUserQuota(userId, amount)
        return res.json({
            success: true,
            message: `已为用户增加 ${amount} 配额`,
            data: quotaInfo
        })
    } catch (error) {
        next(error)
    }
}

// 设置预警阈值
const setWarningThreshold = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user
        if (!user || !user.userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未登录')
        }

        const { threshold } = req.body
        if (threshold === undefined || threshold < 0 || threshold > 100) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '预警阈值必须在 0-100 之间')
        }

        const quotaInfo = await quotaService.setWarningThreshold(user.userId, threshold)
        return res.json({
            success: true,
            message: '预警阈值设置成功',
            data: quotaInfo
        })
    } catch (error) {
        next(error)
    }
}

// 检查配额是否充足
const checkQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user
        if (!user || !user.userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未登录')
        }

        const { requiredTokens } = req.query
        const tokens = requiredTokens ? parseInt(requiredTokens as string) : 0

        const result = await quotaService.checkQuota(user.userId, tokens)
        return res.json({
            success: true,
            data: {
                allowed: result.allowed,
                reason: result.reason,
                quotaInfo: result.quotaInfo
            }
        })
    } catch (error) {
        next(error)
    }
}

// 同步当前用户配额（从UsageLog汇总）
const syncMyQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user
        if (!user || !user.userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未登录')
        }

        const quotaInfo = await quotaService.syncUserQuota(user.userId)
        return res.json({
            success: true,
            message: '配额同步成功',
            data: quotaInfo
        })
    } catch (error) {
        next(error)
    }
}

// 同步指定用户配额（管理员）
const syncUserQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '缺少用户ID')
        }

        const quotaInfo = await quotaService.syncUserQuota(userId)
        return res.json({
            success: true,
            message: '配额同步成功',
            data: quotaInfo
        })
    } catch (error) {
        next(error)
    }
}

// 同步所有用户配额（管理员）
const syncAllUsersQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await quotaService.syncAllUsersQuota()
        return res.json({
            success: true,
            message: `已同步 ${result.synced} 个用户的配额`,
            data: result.results
        })
    } catch (error) {
        next(error)
    }
}

export default {
    getMyQuota,
    getUserQuota,
    getAllUsersQuota,
    setUserQuota,
    resetUserQuota,
    addUserQuota,
    setWarningThreshold,
    checkQuota,
    syncMyQuota,
    syncUserQuota,
    syncAllUsersQuota
}
