import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { verifyToken, JwtPayload } from '../utils/auth'
import { UserRole } from '../database/entities/User'

// 扩展 Express Request 类型
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

/**
 * JWT 认证中间件
 * 验证 Access Token 并将用户信息附加到请求对象
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: '未提供认证令牌'
            })
            return
        }

        const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
        const payload = verifyToken(token)

        if (!payload) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: '认证令牌无效或已过期'
            })
            return
        }

        if (payload.type !== 'access') {
            res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: '令牌类型错误'
            })
            return
        }

        // 将用户信息附加到请求对象
        req.user = payload
        next()
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: '认证失败'
        })
    }
}

/**
 * 可选认证中间件
 * 如果提供了 Token 则验证，否则继续
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization
        console.log(`[optionalAuth] Authorization header: ${authHeader ? authHeader.substring(0, 20) + '...' : 'none'}`)

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = verifyToken(token)

            if (payload && payload.type === 'access') {
                req.user = payload
                console.log(`[optionalAuth] User authenticated: ${payload.userId}`)
            } else {
                console.log(`[optionalAuth] Token invalid or wrong type`)
            }
        } else {
            console.log(`[optionalAuth] No Bearer token provided`)
        }

        next()
    } catch (error) {
        console.log(`[optionalAuth] Error: ${error}`)
        next()
    }
}

/**
 * 角色授权中间件
 * 检查用户是否具有指定角色
 */
export const authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: '请先登录'
            })
            return
        }

        if (!roles.includes(req.user.role)) {
            res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: '没有权限执行此操作'
            })
            return
        }

        next()
    }
}

/**
 * 管理员权限中间件
 */
export const adminOnly = authorize(UserRole.ADMIN)

/**
 * 检查是否是当前用户或管理员
 */
export const selfOrAdmin = (userIdParam: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: '请先登录'
            })
            return
        }

        const targetUserId = req.params[userIdParam]
        const isAdmin = req.user.role === UserRole.ADMIN
        const isSelf = req.user.userId === targetUserId

        if (!isAdmin && !isSelf) {
            res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: '没有权限执行此操作'
            })
            return
        }

        next()
    }
}
