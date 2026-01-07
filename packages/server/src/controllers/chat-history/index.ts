import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import chatHistoryService from '../../services/chat-history'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

// 获取会话列表
const getSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未授权')
        }

        const { page, limit, search, chatflowId } = req.query
        const result = await chatHistoryService.getSessions(
            userId,
            parseInt(page as string) || 1,
            parseInt(limit as string) || 20,
            search as string,
            chatflowId as string
        )

        return res.status(StatusCodes.OK).json({
            success: true,
            data: result
        })
    } catch (error) {
        next(error)
    }
}

// 获取会话消息
const getSessionMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未授权')
        }

        const { sessionId } = req.params
        const { page, limit } = req.query

        const result = await chatHistoryService.getSessionMessages(
            userId,
            sessionId,
            parseInt(page as string) || 1,
            parseInt(limit as string) || 50
        )

        return res.status(StatusCodes.OK).json({
            success: true,
            data: result
        })
    } catch (error) {
        next(error)
    }
}

// 搜索消息
const searchMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未授权')
        }

        const { keyword, page, limit, startDate, endDate } = req.query
        if (!keyword) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请提供搜索关键词')
        }

        const result = await chatHistoryService.searchMessages(
            userId,
            keyword as string,
            parseInt(page as string) || 1,
            parseInt(limit as string) || 20,
            startDate as string,
            endDate as string
        )

        return res.status(StatusCodes.OK).json({
            success: true,
            data: result
        })
    } catch (error) {
        next(error)
    }
}

// 更新会话标题
const updateSessionTitle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未授权')
        }

        const { sessionId } = req.params
        const { title } = req.body

        if (!title) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请提供会话标题')
        }

        await chatHistoryService.updateSessionTitle(userId, sessionId, title)

        return res.status(StatusCodes.OK).json({
            success: true,
            message: '会话标题已更新'
        })
    } catch (error) {
        next(error)
    }
}

// 删除会话
const deleteSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未授权')
        }

        const { sessionId } = req.params
        const result = await chatHistoryService.deleteSession(userId, sessionId)

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `已删除 ${result.deletedCount} 条消息`,
            data: result
        })
    } catch (error) {
        next(error)
    }
}

// 批量删除会话
const deleteSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未授权')
        }

        const { sessionIds } = req.body
        if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请提供要删除的会话ID列表')
        }

        const result = await chatHistoryService.deleteSessions(userId, sessionIds)

        return res.status(StatusCodes.OK).json({
            success: true,
            message: `已删除 ${result.deletedCount} 条消息`,
            data: result
        })
    } catch (error) {
        next(error)
    }
}

// 导出会话
const exportSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未授权')
        }

        const { sessionId } = req.params
        const markdown = await chatHistoryService.exportSessionAsMarkdown(userId, sessionId)

        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=chat-${sessionId.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.md`
        )
        return res.status(StatusCodes.OK).send(markdown)
    } catch (error) {
        next(error)
    }
}

// 获取统计信息
const getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未授权')
        }

        const stats = await chatHistoryService.getStats(userId)

        return res.status(StatusCodes.OK).json({
            success: true,
            data: stats
        })
    } catch (error) {
        next(error)
    }
}

export default {
    getSessions,
    getSessionMessages,
    searchMessages,
    updateSessionTitle,
    deleteSession,
    deleteSessions,
    exportSession,
    getStats
}
