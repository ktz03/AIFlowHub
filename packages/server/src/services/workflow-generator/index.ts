import { LLMService, LLMConfig } from '../llm'
import { IntentAnalyzer, WorkflowIntent } from './intent-analyzer'
import { TemplateMatcher, TemplateMatch } from './template-matcher'
import { WorkflowEngine, WorkflowData, GenerationResult } from './workflow-engine'
import { MultiAgentWorkflowGenerator, GenerationProgress } from './multi-agent-generator'
import { selectTemplateByDescription } from './simple-templates'
import { TemplateCustomizer } from './template-customizer'
import { WorkflowValidator } from './workflow-validator'

// 工作流生成请求
export interface WorkflowGenerationRequest {
    description: string // 用户描述
    llmConfig: LLMConfig // LLM 配置
    userId?: string // 用户 ID
    mode?: 'template' | 'generate' | 'multi-agent' // 生成模式：模板匹配 | 直接生成 | 多Agent
    useMultiAgent?: boolean // 是否使用多 Agent 架构
}

// 工作流生成结果
export interface WorkflowGenerationResult {
    intent: WorkflowIntent // 识别的意图
    matches: TemplateMatch[] // 匹配的模板
    recommendedTemplate: TemplateMatch | null // 推荐的模板
    generatedWorkflow?: WorkflowData // 生成的工作流（如果有）
    explanation?: string // 工作流说明
    confidence?: number // 生成置信度
}

// 工作流生成器服务
export class WorkflowGeneratorService {
    private llmService: LLMService
    private intentAnalyzer: IntentAnalyzer
    private templateMatcher: TemplateMatcher
    private workflowEngine: WorkflowEngine
    private multiAgentGenerator: MultiAgentWorkflowGenerator
    private templateCustomizer: TemplateCustomizer
    private workflowValidator: WorkflowValidator

    constructor(llmConfig: LLMConfig) {
        this.llmService = new LLMService(llmConfig)
        this.intentAnalyzer = new IntentAnalyzer(this.llmService)
        this.templateMatcher = new TemplateMatcher()
        this.workflowEngine = new WorkflowEngine(this.llmService)
        this.multiAgentGenerator = new MultiAgentWorkflowGenerator(this.llmService)
        this.templateCustomizer = new TemplateCustomizer(this.llmService)
        this.workflowValidator = new WorkflowValidator()
    }

    /**
     * 从自然语言生成工作流
     */
    async generateFromNaturalLanguage(request: WorkflowGenerationRequest): Promise<WorkflowGenerationResult> {
        try {
            const mode = request.mode || 'template' // 默认使用模板匹配模式

            // 如果启用多 Agent 模式
            if (mode === 'multi-agent' || request.useMultiAgent) {
                console.log('[WorkflowGenerator] 使用多 Agent 架构生成工作流...')
                return await this.generateWithMultiAgent(request.description)
            }

            // 1. 分析用户意图
            console.log('[WorkflowGenerator] 分析用户意图...')
            const intent = await this.intentAnalyzer.analyze(request.description)
            console.log('[WorkflowGenerator] 意图分析结果:', intent)

            // 2. 匹配模板
            console.log('[WorkflowGenerator] 匹配模板...')
            const matches = await this.templateMatcher.findMatches(intent, 5)
            const recommendedTemplate = matches.length > 0 ? matches[0] : null
            console.log('[WorkflowGenerator] 找到 %d 个匹配模板', matches.length)

            // 3. 根据意图使用简单模板生成工作流
            console.log('[WorkflowGenerator] 根据意图选择模板...')
            const simpleTemplate = selectTemplateByDescription(request.description)
            let generatedWorkflow: WorkflowData | undefined
            let explanation: string | undefined
            let confidence: number | undefined

            if (simpleTemplate) {
                console.log('[WorkflowGenerator] 使用简单模板生成工作流')

                // 调试：打印模板原始位置
                console.log('[WorkflowGenerator] 模板原始节点位置:')
                simpleTemplate.nodes.forEach((node) => {
                    console.log(`  ${node.id}: x=${node.position.x}, y=${node.position.y}`)
                })

                // 定制模板以适应用户的具体需求
                console.log('[WorkflowGenerator] 定制模板以适应用户需求...')
                const customizationResult = await this.templateCustomizer.customizeTemplate(simpleTemplate, intent, request.description)

                generatedWorkflow = customizationResult.workflow

                // 验证并修复工作流
                console.log('[WorkflowGenerator] 验证工作流可用性...')
                const validationResult = this.workflowValidator.validateAndFix(generatedWorkflow)

                if (!validationResult.valid) {
                    console.error('[WorkflowGenerator] 工作流验证失败:', validationResult.errors)
                    throw new Error(`工作流验证失败: ${validationResult.errors.join(', ')}`)
                }

                if (validationResult.warnings.length > 0) {
                    console.warn('[WorkflowGenerator] 工作流警告:', validationResult.warnings)
                }

                if (validationResult.fixes.length > 0) {
                    console.log('[WorkflowGenerator] 应用了 %d 项自动修复', validationResult.fixes.length)
                }

                // 生成包含定制信息和验证信息的说明
                const baseExplanation = this.getExplanationForIntent(intent)
                const customizationInfo =
                    customizationResult.customizations.length > 0
                        ? `\n\n定制内容:\n${customizationResult.customizations.map((c) => `- ${c}`).join('\n')}`
                        : ''
                const validationInfo =
                    validationResult.fixes.length > 0 ? `\n\n自动修复:\n${validationResult.fixes.map((f) => `- ${f}`).join('\n')}` : ''
                explanation = baseExplanation + customizationInfo + validationInfo
                confidence = intent.confidence

                console.log('[WorkflowGenerator] 工作流生成完成，已验证可用')
            } else if (mode === 'generate' || matches.length === 0) {
                // 直接生成模式 或 没有匹配的模板时
                console.log('[WorkflowGenerator] 使用 LLM 直接生成工作流...')
                const result = await this.workflowEngine.generateFromDescription(request.description)
                generatedWorkflow = result.workflow
                explanation = result.explanation
                confidence = result.confidence
                console.log('[WorkflowGenerator] 工作流生成完成，置信度:', confidence)
            }

            // 4. 返回结果
            return {
                intent,
                matches,
                recommendedTemplate,
                generatedWorkflow,
                explanation,
                confidence
            }
        } catch (error) {
            console.error('[WorkflowGenerator] 生成工作流失败:', error)
            throw error
        }
    }

    /**
     * 根据意图生成说明文本
     */
    private getExplanationForIntent(intent: WorkflowIntent): string {
        const categoryExplanations: Record<string, string> = {
            chatbot: '使用预定义的聊天机器人模板，包含 DeepSeek 对话模型、缓冲记忆和对话链，支持多轮对话。',
            rag: '使用文档问答模板，基于 DeepSeek 模型，适合构建知识库问答系统。',
            'code-assistant': '使用代码助手模板，采用 DeepSeek Coder 模型，专门优化代码生成任务。',
            'image-generation': '使用图片生成模板，集成即梦 AI 图片生成工具，支持文生图功能。',
            agent: '使用智能体模板，支持工具调用和多步推理。',
            automation: '使用自动化流程模板，支持任务调度和批处理。',
            'data-analysis': '使用数据分析模板，支持数据处理和可视化。',
            other: '使用通用对话模板。'
        }
        return categoryExplanations[intent.category] || categoryExplanations.other
    }

    /**
     * 使用多 Agent 架构生成工作流
     */
    private async generateWithMultiAgent(description: string): Promise<WorkflowGenerationResult> {
        console.log('[WorkflowGenerator] 使用多 Agent 架构生成...')

        try {
            const result = await this.multiAgentGenerator.generate(description)

            // 转换为标准格式
            return {
                intent: {
                    description,
                    category: 'other' as const,
                    requirements: [],
                    suggestedNodes: result.nodes.map((n) => n.type),
                    confidence: 0.85
                },
                matches: [],
                recommendedTemplate: null,
                generatedWorkflow: result,
                explanation: `使用多 Agent 架构生成工作流，包含 ${result.nodes.length} 个节点。配置说明：${result.configurationNotes.join(
                    '; '
                )}`,
                confidence: 0.85
            }
        } catch (error) {
            console.error('[WorkflowGenerator] 多 Agent 生成失败:', error)
            throw error
        }
    }

    /**
     * 流式生成工作流（支持实时进度）
     */
    async *generateStream(description: string): AsyncGenerator<GenerationProgress> {
        yield* this.multiAgentGenerator.generateStream(description)
    }

    /**
     * 基于模板定制工作流
     */
    async customizeTemplate(templateId: string, customization: string): Promise<WorkflowData> {
        console.log('[WorkflowGenerator] 定制模板:', templateId)
        console.log('[WorkflowGenerator] 定制需求:', customization)

        // TODO: 实现模板定制逻辑
        // 1. 获取模板数据
        // 2. 使用 LLM 分析定制需求
        // 3. 调整节点配置
        // 4. 返回定制后的工作流

        throw new Error('模板定制功能尚未实现')
    }

    /**
     * 直接从描述生成工作流（不使用模板）
     */
    async generateDirectly(description: string): Promise<GenerationResult> {
        console.log('[WorkflowGenerator] 直接生成工作流...')
        return await this.workflowEngine.generateFromDescription(description)
    }

    /**
     * 验证生成的工作流
     */
    async validateWorkflow(flowData: any): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = []

        try {
            // 1. 检查基本结构
            if (!flowData || !flowData.nodes || !flowData.edges) {
                errors.push('工作流缺少必要的节点或连接')
                return { valid: false, errors }
            }

            // 2. 检查节点连接
            const nodeIds = new Set(flowData.nodes.map((n: any) => n.id))
            for (const edge of flowData.edges) {
                if (!nodeIds.has(edge.source)) {
                    errors.push(`边的源节点 ${edge.source} 不存在`)
                }
                if (!nodeIds.has(edge.target)) {
                    errors.push(`边的目标节点 ${edge.target} 不存在`)
                }
            }

            // 3. 检查是否有孤立节点
            const connectedNodes = new Set()
            for (const edge of flowData.edges) {
                connectedNodes.add(edge.source)
                connectedNodes.add(edge.target)
            }
            const isolatedNodes = flowData.nodes.filter((n: any) => !connectedNodes.has(n.id))
            if (isolatedNodes.length > 0 && flowData.nodes.length > 1) {
                errors.push(`发现 ${isolatedNodes.length} 个孤立节点`)
            }

            return {
                valid: errors.length === 0,
                errors
            }
        } catch (error) {
            errors.push(`验证过程出错: ${error}`)
            return { valid: false, errors }
        }
    }
}

// 导出类型和服务
export { WorkflowIntent, TemplateMatch, WorkflowData, GenerationResult, GenerationProgress }
