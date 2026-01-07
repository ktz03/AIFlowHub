import client from './client'

// 获取预设评测场景
export const getEvaluationScenarios = () => client.get('/model-evaluation/scenarios')

// 获取可用工作流列表
export const getAvailableChatflows = () => client.get('/model-evaluation/chatflows')

// 执行评测
export const runEvaluation = (data) => client.post('/model-evaluation/run', data)

// 批量评测
export const runBatchEvaluation = (data) => client.post('/model-evaluation/batch', data)

// 获取评测历史
export const getEvaluationHistory = (page = 1, limit = 20) => client.get(`/model-evaluation/history?page=${page}&limit=${limit}`)

// 获取评测详情
export const getEvaluationById = (id) => client.get(`/model-evaluation/${id}`)

// 删除评测记录
export const deleteEvaluation = (id) => client.delete(`/model-evaluation/${id}`)
