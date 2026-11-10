/**
 * 模板定制器
 * 根据用户的具体需求定制工作流模板
 */

import { LLMService } from '../llm'
import { WorkflowData } from './workflow-engine'
import { WorkflowIntent } from './intent-analyzer'

export interface CustomizationResult {
    workflow: WorkflowData
    customizations: string[]
}

export class TemplateCustomizer {
    private llmService: LLMService

    constructor(llmService: LLMService) {
        this.llmService = llmService
    }

    /**
     * 定制模板
     */
    async customizeTemplate(baseTemplate: WorkflowData, intent: WorkflowIntent, userDescription: string): Promise<CustomizationResult> {
        console.log('[TemplateCustomizer] 开始定制模板...')
        console.log('[TemplateCustomizer] 用户描述:', userDescription)
        console.log('[TemplateCustomizer] 意图类别:', intent.category)

        // 调试：打印原始节点位置
        console.log('[TemplateCustomizer] 原始节点位置:')
        baseTemplate.nodes.forEach((node) => {
            console.log(`  ${node.id}: x=${node.position.x}, y=${node.position.y}`)
        })

        const customizations: string[] = []

        // 1. 提取定制需求
        const customizationNeeds = await this.extractCustomizationNeeds(userDescription, intent)
        console.log('[TemplateCustomizer] 定制需求:', customizationNeeds)

        // 2. 定制 System Message
        if (customizationNeeds.systemMessage) {
            this.customizeSystemMessage(baseTemplate, customizationNeeds.systemMessage)
            customizations.push(`定制系统提示词: ${customizationNeeds.systemMessage}`)
        }

        // 3. 定制模型参数
        if (customizationNeeds.temperature !== undefined) {
            this.customizeModelParameters(baseTemplate, customizationNeeds)
            customizations.push(`调整模型参数: temperature=${customizationNeeds.temperature}`)
        }

        // 4. 定制节点标签
        if (customizationNeeds.nodeLabels) {
            this.customizeNodeLabels(baseTemplate, customizationNeeds.nodeLabels)
            customizations.push('定制节点标签以反映具体场景')
        }

        console.log('[TemplateCustomizer] 定制完成，应用了 %d 项定制', customizations.length)

        // 调试：打印定制后的节点位置
        console.log('[TemplateCustomizer] 定制后节点位置:')
        baseTemplate.nodes.forEach((node) => {
            console.log(`  ${node.id}: x=${node.position.x}, y=${node.position.y}`)
        })

        return {
            workflow: baseTemplate,
            customizations
        }
    }

    /**
     * 提取定制需求
     */
    private async extractCustomizationNeeds(description: string, intent: WorkflowIntent): Promise<any> {
        const systemPrompt = `你是一个工作流定制专家。根据用户的描述，提取定制需求。

用户描述: ${description}
工作流类型: ${intent.category}

请分析用户的具体需求，提取以下信息：
1. 系统提示词 (systemMessage): 根据用户场景定制的角色描述
2. 温度参数 (temperature): 0.1-1.0，创意性任务用高值，精确任务用低值
3. 节点标签 (nodeLabels): 反映用户场景的节点名称

返回 JSON 格式：
{
  "systemMessage": "你是一个...",
  "temperature": 0.7,
  "nodeLabels": {
    "chatModel": "场景相关的名称",
    "chain": "场景相关的名称"
  },
  "scenario": "用户的具体场景描述"
}

只返回 JSON，不要其他内容。`

        try {
            const response = await this.llmService.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: description }
            ])

            const jsonMatch = response.content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0])
            }
        } catch (error) {
            console.error('[TemplateCustomizer] 提取定制需求失败:', error)
        }

        // 返回默认定制需求
        return this.getDefaultCustomization(description, intent)
    }

    /**
     * 获取默认定制需求
     */
    private getDefaultCustomization(description: string, intent: WorkflowIntent): any {
        const lowerDesc = description.toLowerCase()

        // 根据类别和关键词生成默认定制
        const customization: any = {
            temperature: 0.7,
            nodeLabels: {},
            scenario: description
        }

        switch (intent.category) {
            case 'chatbot':
                if (lowerDesc.includes('客服')) {
                    customization.systemMessage = '你是一个专业的客服助手，负责解答用户的问题。请保持礼貌、耐心，提供准确的信息。'
                    customization.nodeLabels = {
                        chatModel: '客服对话模型',
                        memory: '对话历史记忆',
                        chain: '客服对话链'
                    }
                } else if (lowerDesc.includes('助手') || lowerDesc.includes('助理')) {
                    customization.systemMessage = '你是一个智能助手，帮助用户完成各种任务。请提供有用、准确的建议。'
                    customization.nodeLabels = {
                        chatModel: '智能助手模型',
                        memory: '对话记忆',
                        chain: '助手对话链'
                    }
                } else {
                    customization.systemMessage = '你是一个友好的聊天机器人，负责与用户进行对话交流。'
                    customization.nodeLabels = {
                        chatModel: '对话模型',
                        memory: '对话记忆',
                        chain: '对话链'
                    }
                }
                break

            case 'code-assistant':
                if (lowerDesc.includes('python')) {
                    customization.systemMessage = '你是一个 Python 编程专家，擅长编写高质量的 Python 代码。请提供清晰的代码和详细的注释。'
                    customization.temperature = 0.3
                } else if (lowerDesc.includes('javascript') || lowerDesc.includes('js')) {
                    customization.systemMessage = '你是一个 JavaScript 编程专家，擅长现代 JavaScript 开发。请提供最佳实践的代码。'
                    customization.temperature = 0.3
                } else {
                    customization.systemMessage = '你是一个编程助手，擅长多种编程语言。请根据需求生成高质量的代码。'
                    customization.temperature = 0.3
                }
                customization.nodeLabels = {
                    chatModel: '代码生成模型',
                    chain: '代码助手链'
                }
                break

            case 'rag':
                if (lowerDesc.includes('技术文档') || lowerDesc.includes('api')) {
                    customization.systemMessage = '你是一个技术文档问答专家，基于提供的文档内容回答技术问题。请给出准确、专业的答案。'
                } else if (lowerDesc.includes('知识库')) {
                    customization.systemMessage = '你是一个知识库问答助手，基于知识库内容回答用户问题。请确保答案准确可靠。'
                } else {
                    customization.systemMessage = '你是一个文档问答助手，基于提供的文档内容回答问题。'
                }
                customization.nodeLabels = {
                    chatModel: '问答模型',
                    chain: '文档问答链'
                }
                break

            case 'image-generation':
                if (lowerDesc.includes('风景') || lowerDesc.includes('景色')) {
                    customization.systemMessage = '生成美丽的风景图片'
                } else if (lowerDesc.includes('人物') || lowerDesc.includes('肖像')) {
                    customization.systemMessage = '生成人物肖像图片'
                } else if (lowerDesc.includes('抽象') || lowerDesc.includes('艺术')) {
                    customization.systemMessage = '生成抽象艺术图片'
                } else {
                    customization.systemMessage = '根据描述生成图片'
                }
                customization.nodeLabels = {
                    imageGen: '图片生成器'
                }
                break

            case 'data-analysis':
                customization.systemMessage = '你是一个数据分析专家，帮助用户分析和理解数据。请提供清晰的分析结果和见解。'
                customization.nodeLabels = {
                    chatModel: '数据分析模型',
                    chain: '数据分析链'
                }
                break

            default:
                customization.systemMessage = '你是一个智能助手，帮助用户完成任务。'
        }

        return customization
    }

    /**
     * 定制 System Message
     */
    private customizeSystemMessage(workflow: WorkflowData, systemMessage: string): void {
        for (const node of workflow.nodes) {
            // 查找 ConversationChain 或类似的节点
            if (node.data.type === 'ConversationChain' || node.data.type === 'LLMChain' || node.data.name === 'conversationChain') {
                if (node.data.inputs) {
                    node.data.inputs.systemMessagePrompt = systemMessage
                }
                console.log('[TemplateCustomizer] 已定制 System Message:', systemMessage.substring(0, 50) + '...')
            }
        }
    }

    /**
     * 定制模型参数
     */
    private customizeModelParameters(workflow: WorkflowData, customization: any): void {
        for (const node of workflow.nodes) {
            // 查找 ChatModel 节点
            if (node.data.type?.includes('Chat') || node.data.baseClasses?.includes('BaseChatModel')) {
                if (node.data.inputs) {
                    if (customization.temperature !== undefined) {
                        node.data.inputs.temperature = customization.temperature
                    }
                    if (customization.modelName) {
                        node.data.inputs.modelName = customization.modelName
                    }
                }
                console.log('[TemplateCustomizer] 已定制模型参数:', {
                    temperature: customization.temperature,
                    modelName: customization.modelName
                })
            }
        }
    }

    /**
     * 定制节点标签
     */
    private customizeNodeLabels(workflow: WorkflowData, nodeLabels: Record<string, string>): void {
        for (const node of workflow.nodes) {
            const nodeType = node.data.type || node.data.name

            // 根据节点类型匹配标签
            if (nodeType?.includes('Chat') && nodeLabels.chatModel) {
                node.data.label = nodeLabels.chatModel
            } else if (nodeType?.includes('Memory') && nodeLabels.memory) {
                node.data.label = nodeLabels.memory
            } else if (nodeType?.includes('Chain') && nodeLabels.chain) {
                node.data.label = nodeLabels.chain
            } else if (nodeType?.includes('Image') && nodeLabels.imageGen) {
                node.data.label = nodeLabels.imageGen
            }
        }
        console.log('[TemplateCustomizer] 已定制节点标签')
    }
}
