import client from './client'

// 获取使用概览
const getOverview = (params = {}) => client.get('/usage-stats/overview', { params })

// 获取使用趋势
const getTrend = (params = {}) => client.get('/usage-stats/trend', { params })

// 获取模型分布
const getModelDistribution = (params = {}) => client.get('/usage-stats/model-distribution', { params })

// 获取提供商分布
const getProviderDistribution = (params = {}) => client.get('/usage-stats/provider-distribution', { params })

// 获取使用日志列表
const getLogs = (params = {}) => client.get('/usage-stats/logs', { params })

// 获取用户排行榜（管理员）
const getUserRanking = (params = {}) => client.get('/usage-stats/ranking', { params })

// 导出使用数据
const exportData = (params = {}) =>
    client.get('/usage-stats/export', {
        params,
        responseType: 'blob'
    })

// 获取模型定价
const getPricing = () => client.get('/usage-stats/pricing')

// 清除使用记录
const clearAll = (params = {}) => client.delete('/usage-stats/clear-all', { params })

export default {
    getOverview,
    getTrend,
    getModelDistribution,
    getProviderDistribution,
    getLogs,
    getUserRanking,
    exportData,
    getPricing,
    clearAll
}
