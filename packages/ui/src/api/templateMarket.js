import client from './client'

// 获取公开模板列表
const getPublicTemplates = (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.category) queryParams.append('category', params.category)
    if (params.type) queryParams.append('type', params.type)
    if (params.search) queryParams.append('search', params.search)
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    return client.get(`/template-market/public?${queryParams.toString()}`)
}

// 获取热门模板
const getPopularTemplates = (limit = 10) => client.get(`/template-market/popular?limit=${limit}`)

// 获取分类列表
const getCategories = () => client.get('/template-market/categories')

// 获取分类统计
const getCategoryStats = () => client.get('/template-market/categories/stats')

// 获取模板详情
const getTemplateById = (id) => client.get(`/template-market/${id}`)

// 获取用户自己的模板
const getUserTemplates = (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.category) queryParams.append('category', params.category)
    if (params.search) queryParams.append('search', params.search)

    return client.get(`/template-market/user/templates?${queryParams.toString()}`)
}

// 获取用户收藏的模板
const getUserFavorites = () => client.get('/template-market/user/favorites')

// 分享工作流为模板
const shareAsTemplate = (data) => client.post('/template-market/share', data)

// 使用模板
const useTemplate = (id) => client.post(`/template-market/${id}/use`)

// 收藏/取消收藏模板
const toggleFavorite = (id) => client.post(`/template-market/${id}/favorite`)

// 评分模板
const rateTemplate = (id, rating, comment) => client.post(`/template-market/${id}/rate`, { rating, comment })

// 更新模板
const updateTemplate = (id, data) => client.put(`/template-market/${id}`, data)

// 删除模板
const deleteTemplate = (id) => client.delete(`/template-market/${id}`)

export default {
    getPublicTemplates,
    getPopularTemplates,
    getCategories,
    getCategoryStats,
    getTemplateById,
    getUserTemplates,
    getUserFavorites,
    shareAsTemplate,
    useTemplate,
    toggleFavorite,
    rateTemplate,
    updateTemplate,
    deleteTemplate
}
