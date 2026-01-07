import { StatusCodes } from 'http-status-codes'
import { ModelEvaluation } from '../../database/entities/ModelEvaluation'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'
import chatflowsService from '../chatflows'

// 评测指标类型
export interface EvaluationMetrics {
    responseTime: number // 响应时间 (ms)
    totalTokens: number // 总 Token 数
    promptTokens: number // 输入 Token 数
    completionTokens: number // 输出 Token 数
    firstTokenTime?: number // 首 Token 时间 (ms)
    tokensPerSecond?: number // Token 生成速度
}

// 单个模型评测结果
export interface ModelResult {
    modelId: string // 模型/工作流 ID
    modelName: string // 模型名称
    response: string // 模型响应
    metrics: EvaluationMetrics
    error?: string // 错误信息
    success: boolean
}

// 评测任务参数
export interface EvaluationParams {
    testInput: string // 测试输入
    chatflowIds: string[] // 要评测的工作流 ID 列表
    userId: string
    title?: string
    systemPrompt?: string // 可选的系统提示
}

// 评测结果
export interface EvaluationResult {
    id: string
    testInput: string
    results: ModelResult[]
    createdDate: Date
    title?: string
    summary: EvaluationSummary
}

// 评测摘要
export interface EvaluationSummary {
    fastestModel: string
    slowestModel: string
    avgResponseTime: number
    totalModels: number
    successCount: number
    failCount: number
}

// 预设评测场景
export const EVALUATION_SCENARIOS = {
    GENERAL_QA: {
        id: 'general-qa',
        name: '通用问答',
        description: '测试模型的通用知识问答能力',
        prompts: ['什么是人工智能？请用简单的语言解释。', '请解释一下量子计算的基本原理。', '如何提高编程效率？给出5个建议。']
    },
    CODE_GENERATION: {
        id: 'code-generation',
        name: '代码生成',
        description: '测试模型的代码生成能力',
        prompts: ['用 Python 写一个快速排序算法。', '用 JavaScript 实现一个防抖函数。', '写一个 SQL 查询，找出销售额最高的前10个产品。']
    },
    CREATIVE_WRITING: {
        id: 'creative-writing',
        name: '创意写作',
        description: '测试模型的创意写作能力',
        prompts: ['写一首关于春天的五言绝句。', '用100字描述一个未来城市的场景。', '为一款智能手表写一段广告文案。']
    },
    REASONING: {
        id: 'reasoning',
        name: '逻辑推理',
        description: '测试模型的逻辑推理能力',
        prompts: [
            '如果所有的猫都是动物，所有的动物都需要食物，那么所有的猫都需要食物吗？请解释你的推理过程。',
            '一个农夫需要把狼、羊和白菜运过河，但船一次只能载农夫和一样东西。如果农夫不在，狼会吃羊，羊会吃白菜。请问农夫应该怎么做？',
            '有三个开关控制三盏灯，开关在一楼，灯在二楼。你只能上楼一次，如何确定每个开关控制哪盏灯？'
        ]
    },
    TRANSLATION: {
        id: 'translation',
        name: '翻译能力',
        description: '测试模型的翻译能力',
        prompts: [
            '将以下句子翻译成英文：人工智能正在改变我们的生活方式。',
            'Translate to Chinese: The quick brown fox jumps over the lazy dog.',
            '将以下技术文档翻译成中文：Machine learning is a subset of artificial intelligence that enables systems to learn from data.'
        ]
    },
    SUMMARIZATION: {
        id: 'summarization',
        name: '文本摘要',
        description: '测试模型的文本摘要能力',
        prompts: [
            '请用一句话总结以下内容：人工智能（AI）是计算机科学的一个分支，它试图理解智能的本质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。'
        ]
    }
}

/**
 * 执行单个模型评测
 */
const evaluateSingleModel = async (chatflowId: string, testInput: string, systemPrompt?: string): Promise<ModelResult> => {
    const startTime = Date.now()

    try {
        // 获取工作流信息
        const chatflow = await chatflowsService.getChatflowById(chatflowId)
        if (!chatflow) {
            return {
                modelId: chatflowId,
                modelName: 'Unknown',
                response: '',
                metrics: {
                    responseTime: 0,
                    totalTokens: 0,
                    promptTokens: 0,
                    completionTokens: 0
                },
                error: '工作流不存在',
                success: false
            }
        }

        // 直接调用预测接口
        const predictionResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/v1/prediction/${chatflowId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: testInput,
                overrideConfig: systemPrompt ? { systemMessage: systemPrompt } : undefined
            })
        })

        const endTime = Date.now()
        const responseTime = endTime - startTime

        if (!predictionResponse.ok) {
            const errorText = await predictionResponse.text()
            return {
                modelId: chatflowId,
                modelName: chatflow.name || 'Unknown',
                response: '',
                metrics: {
                    responseTime,
                    totalTokens: 0,
                    promptTokens: 0,
                    completionTokens: 0
                },
                error: `API 调用失败: ${errorText}`,
                success: false
            }
        }

        const result = await predictionResponse.json()

        // 提取响应文本
        let responseText = ''
        if (typeof result === 'string') {
            responseText = result
        } else if (result.text) {
            responseText = result.text
        } else if (result.json) {
            responseText = JSON.stringify(result.json)
        } else {
            responseText = JSON.stringify(result)
        }

        // 估算 Token 数（简单估算：中文约 2 字符/token，英文约 4 字符/token）
        const estimateTokens = (text: string): number => {
            const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
            const otherChars = text.length - chineseChars
            return Math.ceil(chineseChars / 2 + otherChars / 4)
        }

        const promptTokens = estimateTokens(testInput + (systemPrompt || ''))
        const completionTokens = estimateTokens(responseText)
        const totalTokens = promptTokens + completionTokens

        return {
            modelId: chatflowId,
            modelName: chatflow.name || 'Unknown',
            response: responseText,
            metrics: {
                responseTime,
                totalTokens,
                promptTokens,
                completionTokens,
                tokensPerSecond: completionTokens / (responseTime / 1000)
            },
            success: true
        }
    } catch (error) {
        const endTime = Date.now()
        return {
            modelId: chatflowId,
            modelName: 'Unknown',
            response: '',
            metrics: {
                responseTime: endTime - startTime,
                totalTokens: 0,
                promptTokens: 0,
                completionTokens: 0
            },
            error: getErrorMessage(error),
            success: false
        }
    }
}

/**
 * 执行多模型对比评测
 */
const runEvaluation = async (params: EvaluationParams): Promise<EvaluationResult> => {
    try {
        const appServer = getRunningExpressApp()
        const evaluationRepo = appServer.AppDataSource.getRepository(ModelEvaluation)

        // 并行执行所有模型评测
        const resultPromises = params.chatflowIds.map((chatflowId) =>
            evaluateSingleModel(chatflowId, params.testInput, params.systemPrompt)
        )

        const results = await Promise.all(resultPromises)

        // 计算摘要
        const successResults = results.filter((r) => r.success)
        const sortedByTime = [...successResults].sort((a, b) => a.metrics.responseTime - b.metrics.responseTime)

        const summary: EvaluationSummary = {
            fastestModel: sortedByTime[0]?.modelName || 'N/A',
            slowestModel: sortedByTime[sortedByTime.length - 1]?.modelName || 'N/A',
            avgResponseTime:
                successResults.length > 0 ? successResults.reduce((sum, r) => sum + r.metrics.responseTime, 0) / successResults.length : 0,
            totalModels: results.length,
            successCount: successResults.length,
            failCount: results.length - successResults.length
        }

        // 保存评测记录
        const evaluation = evaluationRepo.create({
            userId: params.userId,
            testInput: params.testInput,
            results: JSON.stringify(results),
            title: params.title || `评测 - ${new Date().toLocaleString('zh-CN')}`,
            notes: JSON.stringify(summary)
        })

        const savedEvaluation = await evaluationRepo.save(evaluation)

        return {
            id: savedEvaluation.id,
            testInput: params.testInput,
            results,
            createdDate: savedEvaluation.createdDate,
            title: savedEvaluation.title,
            summary
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: modelEvaluationService.runEvaluation - ${getErrorMessage(error)}`
        )
    }
}

/**
 * 获取用户的评测历史
 */
const getEvaluationHistory = async (userId: string, page: number = 1, limit: number = 20) => {
    try {
        const appServer = getRunningExpressApp()
        const evaluationRepo = appServer.AppDataSource.getRepository(ModelEvaluation)

        const [evaluations, total] = await evaluationRepo.findAndCount({
            where: { userId },
            order: { createdDate: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        })

        return {
            evaluations: evaluations.map((e) => ({
                id: e.id,
                title: e.title,
                testInput: e.testInput.substring(0, 100) + (e.testInput.length > 100 ? '...' : ''),
                createdDate: e.createdDate,
                summary: e.notes ? JSON.parse(e.notes) : null
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: modelEvaluationService.getEvaluationHistory - ${getErrorMessage(error)}`
        )
    }
}

/**
 * 获取评测详情
 */
const getEvaluationById = async (evaluationId: string, userId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const evaluationRepo = appServer.AppDataSource.getRepository(ModelEvaluation)

        const evaluation = await evaluationRepo.findOne({
            where: { id: evaluationId, userId }
        })

        if (!evaluation) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '评测记录不存在')
        }

        return {
            id: evaluation.id,
            title: evaluation.title,
            testInput: evaluation.testInput,
            results: JSON.parse(evaluation.results),
            createdDate: evaluation.createdDate,
            summary: evaluation.notes ? JSON.parse(evaluation.notes) : null
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: modelEvaluationService.getEvaluationById - ${getErrorMessage(error)}`
        )
    }
}

/**
 * 删除评测记录
 */
const deleteEvaluation = async (evaluationId: string, userId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const evaluationRepo = appServer.AppDataSource.getRepository(ModelEvaluation)

        const evaluation = await evaluationRepo.findOne({
            where: { id: evaluationId, userId }
        })

        if (!evaluation) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '评测记录不存在')
        }

        await evaluationRepo.delete({ id: evaluationId })
        return { success: true }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: modelEvaluationService.deleteEvaluation - ${getErrorMessage(error)}`
        )
    }
}

/**
 * 获取可用于评测的工作流列表
 */
const getAvailableChatflows = async () => {
    try {
        const chatflows = await chatflowsService.getAllChatflows()

        return chatflows.map((cf: any) => ({
            id: cf.id,
            name: cf.name,
            type: cf.type || 'Chatflow',
            category: cf.category
        }))
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: modelEvaluationService.getAvailableChatflows - ${getErrorMessage(error)}`
        )
    }
}

/**
 * 获取预设评测场景
 */
const getEvaluationScenarios = () => {
    return Object.values(EVALUATION_SCENARIOS)
}

/**
 * 批量评测（使用预设场景）
 */
const runBatchEvaluation = async (userId: string, chatflowIds: string[], scenarioId: string): Promise<EvaluationResult[]> => {
    const scenario = Object.values(EVALUATION_SCENARIOS).find((s) => s.id === scenarioId)
    if (!scenario) {
        throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '评测场景不存在')
    }

    const results: EvaluationResult[] = []

    for (const prompt of scenario.prompts) {
        const result = await runEvaluation({
            testInput: prompt,
            chatflowIds,
            userId,
            title: `${scenario.name} - ${prompt.substring(0, 20)}...`
        })
        results.push(result)
    }

    return results
}

export default {
    runEvaluation,
    getEvaluationHistory,
    getEvaluationById,
    deleteEvaluation,
    getAvailableChatflows,
    getEvaluationScenarios,
    runBatchEvaluation,
    EVALUATION_SCENARIOS
}
