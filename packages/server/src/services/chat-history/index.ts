import { StatusCodes } from 'http-status-codes'
import { Between, Like, In } from 'typeorm'
import { ChatMessage } from '../../database/entities/ChatMessage'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'

interface ChatSession {
    sessionId: string
    chatflowId: string
    chatflowName?: string
    sessionTitle?: string
    messageCount: number
    lastMessage: string
    lastMessageTime: Date
    createdAt: Date
}

interface SessionListResult {
    sessions: ChatSession[]
    total: number
    page: number
    totalPages: number
}

// 获取用户的会话列表
const getSessions = async (
    userId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    chatflowId?: string
): Promise<SessionListResult> => {
    try {
        const appServer = getRunningExpressApp()
        const chatMessageRepo = appServer.AppDataSource.getRepository(ChatMessage)
        const chatFlowRepo = appServer.AppDataSource.getRepository(ChatFlow)

        // 构建查询条件
        const whereConditions: any = { userId }
        if (chatflowId) whereConditions.chatflowid = chatflowId

        // 获取所有符合条件的消息，按sessionId分组
        const queryBuilder = chatMessageRepo
            .createQueryBuilder('msg')
            .select('msg.sessionId', 'sessionId')
            .addSelect('msg.chatflowid', 'chatflowId')
            .addSelect('MAX(msg.sessionTitle)', 'sessionTitle')
            .addSelect('COUNT(*)', 'messageCount')
            .addSelect('MAX(msg.createdDate)', 'lastMessageTime')
            .addSelect('MIN(msg.createdDate)', 'createdAt')
            .where('msg.userId = :userId', { userId })
            .andWhere('msg.sessionId IS NOT NULL')

        if (chatflowId) {
            queryBuilder.andWhere('msg.chatflowid = :chatflowId', { chatflowId })
        }

        if (search) {
            queryBuilder.andWhere('(msg.content LIKE :search OR msg.sessionTitle LIKE :search)', { search: `%${search}%` })
        }

        queryBuilder.groupBy('msg.sessionId').addGroupBy('msg.chatflowid').orderBy('MAX(msg.createdDate)', 'DESC')

        // 获取总数
        const totalQuery = await queryBuilder.getRawMany()
        const total = totalQuery.length

        // 分页
        const sessions = await queryBuilder
            .offset((page - 1) * limit)
            .limit(limit)
            .getRawMany()

        // 获取每个会话的最后一条消息和chatflow名称
        const result: ChatSession[] = await Promise.all(
            sessions.map(async (session) => {
                // 获取最后一条消息
                const lastMsg = await chatMessageRepo.findOne({
                    where: { sessionId: session.sessionId, userId },
                    order: { createdDate: 'DESC' }
                })

                // 获取chatflow名称
                const chatflow = await chatFlowRepo.findOne({
                    where: { id: session.chatflowId },
                    select: ['name']
                })

                return {
                    sessionId: session.sessionId,
                    chatflowId: session.chatflowId,
                    chatflowName: chatflow?.name || '未知工作流',
                    sessionTitle: session.sessionTitle || `会话 ${session.sessionId.substring(0, 8)}`,
                    messageCount: parseInt(session.messageCount),
                    lastMessage: lastMsg?.content?.substring(0, 100) || '',
                    lastMessageTime: new Date(session.lastMessageTime),
                    createdAt: new Date(session.createdAt)
                }
            })
        )

        return {
            sessions: result,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatHistoryService.getSessions - ${getErrorMessage(error)}`
        )
    }
}

// 获取会话的消息列表
const getSessionMessages = async (
    userId: string,
    sessionId: string,
    page: number = 1,
    limit: number = 50
): Promise<{ messages: ChatMessage[]; total: number; page: number; totalPages: number }> => {
    try {
        const appServer = getRunningExpressApp()
        const chatMessageRepo = appServer.AppDataSource.getRepository(ChatMessage)

        const [messages, total] = await chatMessageRepo.findAndCount({
            where: { userId, sessionId },
            order: { createdDate: 'ASC' },
            skip: (page - 1) * limit,
            take: limit
        })

        return {
            messages,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatHistoryService.getSessionMessages - ${getErrorMessage(error)}`
        )
    }
}

// 搜索消息
const searchMessages = async (
    userId: string,
    keyword: string,
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string
): Promise<{ messages: ChatMessage[]; total: number; page: number; totalPages: number }> => {
    try {
        const appServer = getRunningExpressApp()
        const chatMessageRepo = appServer.AppDataSource.getRepository(ChatMessage)

        const whereConditions: any = {
            userId,
            content: Like(`%${keyword}%`)
        }

        if (startDate && endDate) {
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            whereConditions.createdDate = Between(new Date(startDate), endDateTime)
        }

        const [messages, total] = await chatMessageRepo.findAndCount({
            where: whereConditions,
            order: { createdDate: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        })

        return {
            messages,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatHistoryService.searchMessages - ${getErrorMessage(error)}`
        )
    }
}

// 更新会话标题
const updateSessionTitle = async (userId: string, sessionId: string, title: string): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const chatMessageRepo = appServer.AppDataSource.getRepository(ChatMessage)

        await chatMessageRepo.update({ userId, sessionId }, { sessionTitle: title })
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatHistoryService.updateSessionTitle - ${getErrorMessage(error)}`
        )
    }
}

// 删除会话
const deleteSession = async (userId: string, sessionId: string): Promise<{ deletedCount: number }> => {
    try {
        const appServer = getRunningExpressApp()
        const chatMessageRepo = appServer.AppDataSource.getRepository(ChatMessage)

        const result = await chatMessageRepo.delete({ userId, sessionId })
        return { deletedCount: result.affected || 0 }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatHistoryService.deleteSession - ${getErrorMessage(error)}`
        )
    }
}

// 批量删除会话
const deleteSessions = async (userId: string, sessionIds: string[]): Promise<{ deletedCount: number }> => {
    try {
        const appServer = getRunningExpressApp()
        const chatMessageRepo = appServer.AppDataSource.getRepository(ChatMessage)

        const result = await chatMessageRepo.delete({
            userId,
            sessionId: In(sessionIds)
        })
        return { deletedCount: result.affected || 0 }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatHistoryService.deleteSessions - ${getErrorMessage(error)}`
        )
    }
}

// 导出会话为Markdown
const exportSessionAsMarkdown = async (userId: string, sessionId: string): Promise<string> => {
    try {
        const appServer = getRunningExpressApp()
        const chatMessageRepo = appServer.AppDataSource.getRepository(ChatMessage)
        const chatFlowRepo = appServer.AppDataSource.getRepository(ChatFlow)

        const messages = await chatMessageRepo.find({
            where: { userId, sessionId },
            order: { createdDate: 'ASC' }
        })

        if (messages.length === 0) {
            return '# 空会话\n\n没有找到消息记录。'
        }

        // 获取chatflow名称
        const chatflow = await chatFlowRepo.findOne({
            where: { id: messages[0].chatflowid },
            select: ['name']
        })

        const title = messages[0].sessionTitle || `会话 ${sessionId.substring(0, 8)}`
        const chatflowName = chatflow?.name || '未知工作流'
        const createdAt = messages[0].createdDate.toLocaleString('zh-CN')

        let markdown = `# ${title}\n\n`
        markdown += `- **工作流**: ${chatflowName}\n`
        markdown += `- **创建时间**: ${createdAt}\n`
        markdown += `- **消息数量**: ${messages.length}\n\n`
        markdown += `---\n\n`

        for (const msg of messages) {
            const role = msg.role === 'userMessage' ? '👤 用户' : '🤖 助手'
            const time = new Date(msg.createdDate).toLocaleString('zh-CN')
            markdown += `### ${role} (${time})\n\n`
            markdown += `${msg.content}\n\n`
        }

        return markdown
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatHistoryService.exportSessionAsMarkdown - ${getErrorMessage(error)}`
        )
    }
}

// 获取统计信息
const getStats = async (
    userId: string
): Promise<{
    totalSessions: number
    totalMessages: number
    recentSessions: number
}> => {
    try {
        const appServer = getRunningExpressApp()
        const chatMessageRepo = appServer.AppDataSource.getRepository(ChatMessage)

        // 总消息数
        const totalMessages = await chatMessageRepo.count({ where: { userId } })

        // 总会话数
        const sessionsResult = await chatMessageRepo
            .createQueryBuilder('msg')
            .select('COUNT(DISTINCT msg.sessionId)', 'count')
            .where('msg.userId = :userId', { userId })
            .andWhere('msg.sessionId IS NOT NULL')
            .getRawOne()
        const totalSessions = parseInt(sessionsResult?.count || '0')

        // 最近7天的会话数
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentResult = await chatMessageRepo
            .createQueryBuilder('msg')
            .select('COUNT(DISTINCT msg.sessionId)', 'count')
            .where('msg.userId = :userId', { userId })
            .andWhere('msg.sessionId IS NOT NULL')
            .andWhere('msg.createdDate >= :date', { date: sevenDaysAgo })
            .getRawOne()
        const recentSessions = parseInt(recentResult?.count || '0')

        return { totalSessions, totalMessages, recentSessions }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatHistoryService.getStats - ${getErrorMessage(error)}`)
    }
}

export default {
    getSessions,
    getSessionMessages,
    searchMessages,
    updateSessionTitle,
    deleteSession,
    deleteSessions,
    exportSessionAsMarkdown,
    getStats
}
