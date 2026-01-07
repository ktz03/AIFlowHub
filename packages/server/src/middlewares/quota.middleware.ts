import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import quotaService from '../services/quota'

/**
 * 配额检查中间件
 * 在模型调用前检查用户配额是否充足
 */
export const checkQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 从请求中获取用户信息（由 auth 中间件设置）
        const user = (req as any).user

        if (!user || !user.id) {
            // 如果没有用户信息，跳过配额检查（可能是公开 API）
            return next()
        }

        // 检查配额
        const result = await quotaService.checkQuota(user.id)

        if (!result.allowed) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: result.reason,
                quotaInfo: {
                    quotaLimit: result.quotaInfo.quotaLimit,
                    quotaUsed: result.quotaInfo.quotaUsed,
                    quotaRemaining: result.quotaInfo.quotaRemaining,
                    usagePercentage: result.quotaInfo.usagePercentage
                }
            })
        }

        // 将配额信息附加到请求对象，供后续使用
        ;(req as any).quotaInfo = result.quotaInfo

        next()
    } catch (error: any) {
        console.error('Quota check error:', error)
        // 配额检查失败时，允许请求继续（降级处理）
        next()
    }
}

/**
 * 配额预警中间件
 * 在响应中添加配额预警信息
 */
export const quotaWarning = async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res)

    res.json = (body: any) => {
        const quotaInfo = (req as any).quotaInfo

        if (quotaInfo && quotaInfo.isWarning) {
            // 在响应中添加配额预警
            body._quotaWarning = {
                message: `配额使用已达 ${quotaInfo.usagePercentage}%，请注意配额使用情况`,
                quotaRemaining: quotaInfo.quotaRemaining,
                quotaLimit: quotaInfo.quotaLimit
            }
        }

        return originalJson(body)
    }

    next()
}

/**
 * 管理员配额检查中间件
 * 管理员不受配额限制
 */
export const checkQuotaWithAdminBypass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user

        if (!user || !user.id) {
            return next()
        }

        // 管理员跳过配额检查
        if (user.role === 'admin') {
            return next()
        }

        // 普通用户检查配额
        return checkQuota(req, res, next)
    } catch (error) {
        next()
    }
}
