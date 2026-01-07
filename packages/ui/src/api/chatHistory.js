import client from './client'

// 获取会话列表
const getSessions = (params) => client.get('/chat-history/sessions', { params })

// 获取会话消息
const getSessionMessages = (sessionId, params) => client.get(`/chat-history/sessions/${sessionId}/messages`, { params })

// 搜索消息
const searchMessages = (params) => client.get('/chat-history/search', { params })

// 更新会话标题
const updateSessionTitle = (sessionId, title) => client.put(`/chat-history/sessions/${sessionId}/title`, { title })

// 删除会话
const deleteSession = (sessionId) => client.delete(`/chat-history/sessions/${sessionId}`)

// 批量删除会话
const deleteSessions = (sessionIds) => client.post('/chat-history/sessions/batch-delete', { sessionIds })

// 导出会话
const exportSession = (sessionId) => client.get(`/chat-history/sessions/${sessionId}/export`, { responseType: 'blob' })

// 获取统计信息
const getStats = () => client.get('/chat-history/stats')

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
