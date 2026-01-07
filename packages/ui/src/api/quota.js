import client from './client'

// 获取当前用户配额
const getMyQuota = () => client.get('/quota/my')

// 检查配额是否充足
const checkQuota = (requiredTokens) => client.get('/quota/check', { params: { requiredTokens } })

// 设置预警阈值
const setWarningThreshold = (threshold) => client.put('/quota/warning-threshold', { threshold })

// 同步当前用户配额
const syncMyQuota = () => client.post('/quota/sync')

// 管理员：获取所有用户配额
const getAllUsersQuota = () => client.get('/quota/all')

// 管理员：获取指定用户配额
const getUserQuota = (userId) => client.get(`/quota/user/${userId}`)

// 管理员：设置用户配额上限
const setUserQuota = (userId, quotaLimit) => client.put(`/quota/user/${userId}`, { quotaLimit })

// 管理员：重置用户配额使用量
const resetUserQuota = (userId) => client.post(`/quota/user/${userId}/reset`)

// 管理员：增加用户配额
const addUserQuota = (userId, amount) => client.post(`/quota/user/${userId}/add`, { amount })

// 管理员：同步指定用户配额
const syncUserQuota = (userId) => client.post(`/quota/user/${userId}/sync`)

// 管理员：同步所有用户配额
const syncAllUsersQuota = () => client.post('/quota/sync-all')

export default {
    getMyQuota,
    checkQuota,
    setWarningThreshold,
    syncMyQuota,
    getAllUsersQuota,
    getUserQuota,
    setUserQuota,
    resetUserQuota,
    addUserQuota,
    syncUserQuota,
    syncAllUsersQuota
}
