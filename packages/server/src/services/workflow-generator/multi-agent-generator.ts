/**
 * 多 Agent 工作流生成器
 * 参考 n8n 的三阶段架构：Discovery → Builder → Configurator
 */

import { LLMService } from '../llm'
import { classifyWorkflow, FlowiseTechnique } from './technique-classifier'
import { getExamplesByTechniques, WorkflowExample } from './examples-library'
import { WorkflowEngine, WorkflowData } from './workflow-engine'

/**
 * Discovery 阶段结果
 */
export interface DiscoveryResult {
    techniques: FlowiseTechnique[]
    relevantExamples: WorkflowExample[]
    suggestedNodes: string[]
    confidence: number
}

/**
 * Builder 阶段结果
 */
export interface BuilderResult {
    nodes: Array<{
        id: string
        type: string
        name: string
        position: { x: number; y: number }
    }>
    connections: Array<{
        source: string
        target: string
    }>
    layout: 'horizontal' | 'vertical' | 'grid'
}

/**
 * Configurator 阶段结果
 */
export interface ConfiguratorResult extends WorkflowData {
    configurationNotes: string[]
    requiredCredentials: string[]
}

/**
 * 生成进度
 */
export interface GenerationProgress {
    step: 'discovering' | 'building' | 'configuring' | 'complete'
    progress: number
    message: string
    data?: any
}

/**
 * Discovery Agent
 * 职责：分析需求，识别技术类别，选择相关示例
 */
export class DiscoveryAgent {
    constructor(private llmService: LLMService) {}

    async discover(description: string): Promise<DiscoveryResult> {
        // 1. 分类工作流技术
        const techniques = await classifyWorkflow(description, this.llmService)

        // 2. 获取相关示例
        const relevantExamples = getExamplesByTechniques(techniques, 3)

        // 3. 推荐节点类型
        const suggestedNodes = this.suggestNodes(techniques, relevantExamples)

        // 4. 计算置信度
        const confidence = this.calculateConfidence(techniques, relevantExamples)

        return {
            techniques,
            relevantExamples,
            suggestedNodes,
            confidence
        }
    }

    /**
     * 根据技术类别推荐节点
     */
    private suggestNodes(techniques: FlowiseTechnique[], examples: WorkflowExample[]): string[] {
        const nodeSet = new Set<string>()

        // 从示例中提取节点类型
        examples.forEach((example) => {
            example.workflow.nodes.forEach((node) => {
                nodeSet.add(node.type)
            })
        })

        // 根据技术类别添加必需节点
        if (techniques.includes(FlowiseTechnique.CHATBOT)) {
            nodeSet.add('chatTrigger')
            nodeSet.add('bufferMemory')
        }

        if (techniques.includes(FlowiseTechnique.KNOWLEDGE_BASE)) {
            nodeSet.add('openAIEmbeddings')
            nodeSet.add('pinecone')
            nodeSet.add('conversationalRetrievalQAChain')
        }

        if (techniques.includes(FlowiseTechnique.AGENT)) {
            nodeSet.add('agent')
            nodeSet.add('chatOpenAI')
        }

        if (techniques.includes(FlowiseTechnique.DOCUMENT_PROCESSING)) {
            nodeSet.add('pdfLoader')
            nodeSet.add('recursiveCharacterTextSplitter')
        }

        return Array.from(nodeSet)
    }

    /**
     * 计算置信度
     */
    private calculateConfidence(techniques: FlowiseTechnique[], examples: WorkflowExample[]): number {
        // 基础置信度
        let confidence = 0.5

        // 有技术分类 +0.2
        if (techniques.length > 0) {
            confidence += 0.2
        }

        // 有相关示例 +0.2
        if (examples.length > 0) {
            confidence += 0.2
        }

        // 技术类别数量合理（2-4个）+0.1
        if (techniques.length >= 2 && techniques.length <= 4) {
            confidence += 0.1
        }

        return Math.min(confidence, 1.0)
    }
}

/**
 * Builder Agent
 * 职责：构建工作流结构，创建节点和连接
 */
export class BuilderAgent {
    constructor(private llmService: LLMService) {}

    async build(description: string, discoveryResult: DiscoveryResult): Promise<BuilderResult> {
        const { relevantExamples, suggestedNodes } = discoveryResult

        // 1. 选择最佳示例作为模板
        const template = relevantExamples[0]

        // 2. 生成节点
        const nodes = this.generateNodes(template, suggestedNodes)

        // 3. 生成连接
        const connections = this.generateConnections(nodes, template)

        // 4. 计算布局
        const layout = this.determineLayout(nodes.length)

        // 5. 计算节点位置
        this.calculatePositions(nodes, layout)

        return {
            nodes,
            connections,
            layout
        }
    }

    /**
     * 生成节点
     */
    private generateNodes(template: WorkflowExample, suggestedNodes: string[]): BuilderResult['nodes'] {
        const nodes: BuilderResult['nodes'] = []

        // 使用模板节点
        template.workflow.nodes.forEach((node, index) => {
            nodes.push({
                id: `node_${index}`,
                type: node.type,
                name: node.name,
                position: { x: 0, y: 0 } // 稍后计算
            })
        })

        return nodes
    }

    /**
     * 生成连接
     */
    private generateConnections(nodes: BuilderResult['nodes'], template: WorkflowExample): BuilderResult['connections'] {
        const connections: BuilderResult['connections'] = []

        // 使用模板连接
        template.workflow.connections.forEach((conn) => {
            // 查找对应的节点 ID
            const sourceNode = nodes.find((n) => n.name === conn.source)
            const targetNode = nodes.find((n) => n.name === conn.target)

            if (sourceNode && targetNode) {
                connections.push({
                    source: sourceNode.id,
                    target: targetNode.id
                })
            }
        })

        return connections
    }

    /**
     * 确定布局方式
     */
    private determineLayout(nodeCount: number): 'horizontal' | 'vertical' | 'grid' {
        if (nodeCount <= 4) {
            return 'horizontal'
        } else if (nodeCount <= 8) {
            return 'vertical'
        } else {
            return 'grid'
        }
    }

    /**
     * 计算节点位置
     */
    private calculatePositions(nodes: BuilderResult['nodes'], layout: string): void {
        const spacing = 300

        if (layout === 'horizontal') {
            nodes.forEach((node, index) => {
                node.position = {
                    x: index * spacing,
                    y: 200
                }
            })
        } else if (layout === 'vertical') {
            nodes.forEach((node, index) => {
                node.position = {
                    x: 300,
                    y: index * spacing
                }
            })
        } else {
            // grid layout
            const cols = Math.ceil(Math.sqrt(nodes.length))
            nodes.forEach((node, index) => {
                const row = Math.floor(index / cols)
                const col = index % cols
                node.position = {
                    x: col * spacing,
                    y: row * spacing
                }
            })
        }
    }
}

/**
 * Configurator Agent
 * 职责：配置节点参数，添加默认值
 */
export class ConfiguratorAgent {
    constructor(private llmService: LLMService) {}

    async configure(description: string, builderResult: BuilderResult): Promise<ConfiguratorResult> {
        const { nodes, connections } = builderResult

        // 1. 为每个节点添加配置
        const configuredNodes = await this.configureNodes(nodes, description)

        // 2. 生成配置说明
        const configurationNotes = this.generateConfigurationNotes(configuredNodes)

        // 3. 识别需要的凭证
        const requiredCredentials = this.identifyRequiredCredentials(configuredNodes)

        // 4. 转换为 WorkflowData 格式
        const workflow: WorkflowData = {
            nodes: configuredNodes.map((node) => ({
                id: node.id,
                type: node.type,
                data: {
                    label: node.name,
                    name: node.name,
                    inputs: {},
                    outputs: {}
                },
                position: node.position
            })),
            edges: connections.map((conn, index) => ({
                id: `edge_${index}`,
                source: conn.source,
                target: conn.target
            }))
        }

        return {
            ...workflow,
            configurationNotes,
            requiredCredentials
        }
    }

    /**
     * 配置节点参数
     */
    private async configureNodes(nodes: BuilderResult['nodes'], description: string): Promise<BuilderResult['nodes']> {
        // 为每个节点添加默认配置
        return nodes.map((node) => {
            // 根据节点类型添加默认配置
            const config = this.getDefaultConfig(node.type)
            return {
                ...node,
                ...config
            }
        })
    }

    /**
     * 获取节点默认配置
     */
    private getDefaultConfig(nodeType: string): any {
        const configs: Record<string, any> = {
            chatOpenAI: {
                model: 'gpt-4',
                temperature: 0.7,
                maxTokens: 2000
            },
            openAIEmbeddings: {
                model: 'text-embedding-ada-002'
            },
            bufferMemory: {
                memoryKey: 'chat_history'
            },
            recursiveCharacterTextSplitter: {
                chunkSize: 1000,
                chunkOverlap: 200
            }
        }

        return configs[nodeType] || {}
    }

    /**
     * 生成配置说明
     */
    private generateConfigurationNotes(nodes: BuilderResult['nodes']): string[] {
        const notes: string[] = []

        nodes.forEach((node) => {
            if (node.type === 'chatOpenAI') {
                notes.push('需要配置 OpenAI API Key')
            }
            if (node.type === 'pinecone') {
                notes.push('需要配置 Pinecone API Key 和 Index Name')
            }
            if (node.type === 'gmail') {
                notes.push('需要配置 Gmail OAuth 凭证')
            }
        })

        return notes
    }

    /**
     * 识别需要的凭证
     */
    private identifyRequiredCredentials(nodes: BuilderResult['nodes']): string[] {
        const credentials = new Set<string>()

        nodes.forEach((node) => {
            if (node.type.includes('OpenAI') || node.type.includes('openAI')) {
                credentials.add('openAIApi')
            }
            if (node.type === 'pinecone') {
                credentials.add('pineconeApi')
            }
            if (node.type === 'gmail') {
                credentials.add('gmailOAuth')
            }
            if (node.type === 'slack') {
                credentials.add('slackApi')
            }
        })

        return Array.from(credentials)
    }
}

/**
 * 多 Agent 工作流生成器
 * 协调三个 Agent 完成工作流生成
 */
export class MultiAgentWorkflowGenerator {
    private discoveryAgent: DiscoveryAgent
    private builderAgent: BuilderAgent
    private configuratorAgent: ConfiguratorAgent
    private workflowEngine: WorkflowEngine

    constructor(llmService: LLMService) {
        this.discoveryAgent = new DiscoveryAgent(llmService)
        this.builderAgent = new BuilderAgent(llmService)
        this.configuratorAgent = new ConfiguratorAgent(llmService)
        this.workflowEngine = new WorkflowEngine(llmService)
    }

    /**
     * 生成工作流（流式）
     */
    async *generateStream(description: string): AsyncGenerator<GenerationProgress> {
        try {
            // Phase 1: Discovery
            yield {
                step: 'discovering',
                progress: 0.1,
                message: '分析需求，识别技术类别...'
            }

            const discoveryResult = await this.discoveryAgent.discover(description)

            yield {
                step: 'discovering',
                progress: 0.3,
                message: `识别到 ${discoveryResult.techniques.length} 个技术类别`,
                data: { techniques: discoveryResult.techniques }
            }

            // Phase 2: Builder
            yield {
                step: 'building',
                progress: 0.5,
                message: '构建工作流结构...'
            }

            const builderResult = await this.builderAgent.build(description, discoveryResult)

            yield {
                step: 'building',
                progress: 0.7,
                message: `创建了 ${builderResult.nodes.length} 个节点`,
                data: { nodeCount: builderResult.nodes.length }
            }

            // Phase 3: Configurator
            yield {
                step: 'configuring',
                progress: 0.85,
                message: '配置节点参数...'
            }

            const workflow = await this.configuratorAgent.configure(description, builderResult)

            yield {
                step: 'complete',
                progress: 1.0,
                message: '工作流生成完成！',
                data: {
                    workflow,
                    confidence: discoveryResult.confidence,
                    techniques: discoveryResult.techniques
                }
            }
        } catch (error) {
            console.error('Error in multi-agent generation:', error)
            throw error
        }
    }

    /**
     * 生成工作流（非流式）
     */
    async generate(description: string): Promise<ConfiguratorResult> {
        // 1. Discovery Phase
        const discoveryResult = await this.discoveryAgent.discover(description)

        // 2. Builder Phase
        const builderResult = await this.builderAgent.build(description, discoveryResult)

        // 3. Configurator Phase
        const workflow = await this.configuratorAgent.configure(description, builderResult)

        return workflow
    }

    /**
     * 使用原有的 WorkflowEngine 生成（作为备选）
     */
    async generateWithEngine(description: string, mode: 'template' | 'generate' = 'generate'): Promise<WorkflowData> {
        const result = await this.workflowEngine.generateFromDescription(description)
        return result.workflow
    }
}
