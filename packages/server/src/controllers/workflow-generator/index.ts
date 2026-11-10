import { Request, Response, NextFunction } from 'express'
import { WorkflowGeneratorService } from '../../services/workflow-generator'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'

/**
 * 从自然语言生成工作流
 */
const generateWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { description, llmProvider, llmApiKey, llmModel, mode } = req.body
        const userId = req.user?.userId

        if (!description) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请提供工作流描述')
        }

        // 如果没有提供 LLM 配置，从系统配置中读取
        let provider = llmProvider
        let apiKey = llmApiKey
        let model = llmModel

        if (!provider || !apiKey) {
            // 从系统配置读取
            const {
                getWorkflowGeneratorApiKey,
                getWorkflowGeneratorModel,
                getWorkflowGeneratorProvider
            } = require('../../services/system-config')

            apiKey = await getWorkflowGeneratorApiKey()
            model = await getWorkflowGeneratorModel()
            provider = await getWorkflowGeneratorProvider()

            if (!apiKey) {
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '系统未配置工作流生成器 API Key，请联系管理员在系统配置中设置')
            }
        }

        // 创建工作流生成器
        const generator = new WorkflowGeneratorService({
            provider,
            apiKey,
            model
        })

        // 生成工作流
        const result = await generator.generateFromNaturalLanguage({
            description,
            llmConfig: {
                provider,
                apiKey,
                model
            },
            userId,
            mode: mode || 'template' // 默认模板匹配模式
        })

        res.json(result)
    } catch (error) {
        next(new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `生成工作流失败: ${getErrorMessage(error)}`))
    }
}

/**
 * 验证工作流
 */
const validateWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { flowData, llmProvider, llmApiKey } = req.body

        if (!flowData) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请提供工作流数据')
        }

        // 创建工作流生成器（用于验证）
        const generator = new WorkflowGeneratorService({
            provider: llmProvider || 'openai',
            apiKey: llmApiKey || 'dummy'
        })

        // 验证工作流
        const validation = await generator.validateWorkflow(flowData)

        res.json(validation)
    } catch (error) {
        next(new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `验证工作流失败: ${getErrorMessage(error)}`))
    }
}

/**
 * 获取工作流生成建议
 */
const getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { description } = req.query

        if (!description || typeof description !== 'string') {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请提供描述')
        }

        // 返回一些预定义的建议
        const suggestions = [
            {
                category: 'chatbot',
                title: '智能客服机器人',
                description: '创建一个能够回答常见问题的客服机器人',
                keywords: ['客服', '问答', '对话']
            },
            {
                category: 'rag',
                title: '知识库问答系统',
                description: '基于文档库的智能问答系统',
                keywords: ['知识库', '文档', '检索']
            },
            {
                category: 'agent',
                title: 'AI 智能助手',
                description: '具有工具调用能力的智能助手',
                keywords: ['助手', '工具', '自动化']
            }
        ]

        // 简单的关键词匹配
        const matched = suggestions.filter((s) => s.keywords.some((k) => description.toLowerCase().includes(k)))

        res.json({
            suggestions: matched.length > 0 ? matched : suggestions
        })
    } catch (error) {
        next(new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `获取建议失败: ${getErrorMessage(error)}`))
    }
}

export default {
    generateWorkflow,
    validateWorkflow,
    getSuggestions
}
