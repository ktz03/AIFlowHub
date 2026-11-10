import client from './client'

/**
 * 获取所有系统配置
 */
const getAllSystemConfigs = () => client.get('/system-config')

/**
 * 获取单个系统配置
 */
const getSystemConfig = (key) => client.get(`/system-config/${key}`)

/**
 * 设置系统配置
 */
const setSystemConfig = (key, value, description, isEncrypted) => client.post('/system-config', { key, value, description, isEncrypted })

/**
 * 删除系统配置
 */
const deleteSystemConfig = (key) => client.delete(`/system-config/${key}`)

/**
 * 设置工作流生成器 API Key
 */
const setWorkflowGeneratorApiKey = (apiKey, model, provider) =>
    client.post('/system-config/workflow-generator/api-key', { apiKey, model, provider })

/**
 * 检查工作流生成器配置状态
 */
const checkWorkflowGeneratorConfig = () => client.get('/system-config/workflow-generator/status')

export default {
    getAllSystemConfigs,
    getSystemConfig,
    setSystemConfig,
    deleteSystemConfig,
    setWorkflowGeneratorApiKey,
    checkWorkflowGeneratorConfig
}
