import client from './client'

/**
 * 用户注册
 */
const register = (data) => client.post('/auth/register', data)

/**
 * 用户登录
 */
const login = (data) => client.post('/auth/login', data)

/**
 * 刷新 Token
 */
const refreshToken = (refreshToken) => client.post('/auth/refresh-token', { refreshToken })

/**
 * 退出登录
 */
const logout = () => client.post('/auth/logout')

/**
 * 获取当前用户信息
 */
const getCurrentUser = () => client.get('/auth/me')

/**
 * 更新当前用户信息
 */
const updateCurrentUser = (data) => client.put('/auth/me', data)

/**
 * 修改密码
 */
const changePassword = (data) => client.put('/auth/change-password', data)

/**
 * 获取所有用户（管理员）
 */
const getAllUsers = () => client.get('/auth/users')

/**
 * 获取指定用户（管理员）
 */
const getUserById = (id) => client.get(`/auth/users/${id}`)

/**
 * 更新用户角色（管理员）
 */
const updateUserRole = (id, role) => client.put(`/auth/users/${id}/role`, { role })

/**
 * 更新用户状态（管理员）
 */
const updateUserStatus = (id, status) => client.put(`/auth/users/${id}/status`, { status })

/**
 * 更新用户配额（管理员）
 */
const updateUserQuota = (id, quotaLimit) => client.put(`/auth/users/${id}/quota`, { quotaLimit })

/**
 * 删除用户（管理员）
 */
const deleteUser = (id) => client.delete(`/auth/users/${id}`)

export default {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser,
    updateCurrentUser,
    changePassword,
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    updateUserQuota,
    deleteUser
}
