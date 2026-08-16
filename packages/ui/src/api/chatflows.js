import client from './client'

const getAllChatflows = () => client.get('/chatflows?type=CHATFLOW')

const getAllAgentflows = () => client.get('/chatflows?type=MULTIAGENT')

const getSpecificChatflow = (id) => client.get(`/chatflows/${id}`)

const getSpecificChatflowFromPublicEndpoint = (id) => client.get(`/public-chatflows/${id}`)

const createNewChatflow = (body) => client.post(`/chatflows`, body)

const importChatflows = (body) => client.post(`/chatflows/importchatflows`, body)

const updateChatflow = (id, body) => client.put(`/chatflows/${id}`, body)

const deleteChatflow = (id) => client.delete(`/chatflows/${id}`)

const getIsChatflowStreaming = (id) => client.get(`/chatflows-streaming/${id}`)

const getAllowChatflowUploads = (id) => client.get(`/chatflows-uploads/${id}`)

// 管理员功能 - 孤儿 chatflow 管理
const getOrphanedChatflows = (type) => client.get(`/chatflows/orphaned${type ? `?type=${type}` : ''}`)

const assignChatflowOwner = (chatflowId, userId) => client.post(`/chatflows/${chatflowId}/assign-owner`, { userId })

const batchAssignChatflowOwner = (chatflowIds, userId) => client.post(`/chatflows/batch-assign-owner`, { chatflowIds, userId })

export default {
    getAllChatflows,
    getAllAgentflows,
    getSpecificChatflow,
    getSpecificChatflowFromPublicEndpoint,
    createNewChatflow,
    importChatflows,
    updateChatflow,
    deleteChatflow,
    getIsChatflowStreaming,
    getAllowChatflowUploads,
    getOrphanedChatflows,
    assignChatflowOwner,
    batchAssignChatflowOwner
}
