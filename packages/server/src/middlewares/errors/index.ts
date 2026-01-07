import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

// 错误码映射
const ERROR_CODES: Record<number, string> = {
    [StatusCodes.BAD_REQUEST]: 'BAD_REQUEST',
    [StatusCodes.UNAUTHORIZED]: 'UNAUTHORIZED',
    [StatusCodes.FORBIDDEN]: 'FORBIDDEN',
    [StatusCodes.NOT_FOUND]: 'NOT_FOUND',
    [StatusCodes.CONFLICT]: 'CONFLICT',
    [StatusCodes.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
    [StatusCodes.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
    [StatusCodes.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
    [StatusCodes.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE'
}

// 用户友好的错误消息
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
    BAD_REQUEST: '请求参数错误',
    UNAUTHORIZED: '请先登录',
    FORBIDDEN: '没有权限执行此操作',
    NOT_FOUND: '请求的资源不存在',
    CONFLICT: '资源冲突',
    VALIDATION_ERROR: '数据验证失败',
    RATE_LIMIT_EXCEEDED: '请求过于频繁，请稍后再试',
    INTERNAL_ERROR: '服务器内部错误',
    SERVICE_UNAVAILABLE: '服务暂时不可用'
}

// we need eslint because we have to pass next arg for the error middleware
// eslint-disable-next-line
async function errorHandlerMiddleware(err: InternalFlowiseError, req: Request, res: Response, next: NextFunction) {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    const errorCode = ERROR_CODES[statusCode] || 'UNKNOWN_ERROR'

    // 构建统一错误响应
    const displayedError = {
        success: false,
        error: {
            code: errorCode,
            message: err.message || USER_FRIENDLY_MESSAGES[errorCode] || '未知错误',
            statusCode: statusCode
        },
        // 仅在开发环境提供堆栈信息
        ...(process.env.NODE_ENV === 'development' && {
            debug: {
                stack: err.stack,
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            }
        })
    }

    // 记录错误日志
    if (statusCode >= 500) {
        console.error(`[ERROR] ${req.method} ${req.path}:`, err.message, err.stack)
    }

    if (!req.body || !req.body.streaming || req.body.streaming === 'false') {
        res.setHeader('Content-Type', 'application/json')
        res.status(statusCode).json(displayedError)
    }
}

export default errorHandlerMiddleware
