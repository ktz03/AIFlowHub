/**
 * 工作流生成引擎
 * 使用 LLM 从自然语言生成完整的工作流 JSON
 */

import { LLMService } from '../llm'
import { generateNodeSchemasText, getNodeSchema } from './node-schemas'

// 工作流节点定义
export interface WorkflowNode {
    id: string
    type: string
    position: { x: number; y: number }
    data: {
        label: string
        inputs?: Record<string, any>
        [key: string]: any
    }
}

// 工作流边定义
export interface WorkflowEdge {
    id?: string
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
    type?: string
}

// 工作流数据
export interface WorkflowData {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
}

// 生成结果
export interface GenerationResult {
    workflow: WorkflowData
    explanation: string
    confidence: number
}

export class WorkflowEngine {
    private llmService: LLMService

    constructor(llmService: LLMService) {
        this.llmService = llmService
    }

    /**
     * 从自然语言生成工作流
     */
    async generateFromDescription(description: string): Promise<GenerationResult> {
        console.log('[WorkflowEngine] 开始生成工作流...')
        console.log('[WorkflowEngine] 用户描述:', description)

        // 1. 构建 Prompt
        const prompt = this.buildGenerationPrompt(description)

        // 2. 调用 LLM 生成
        const response = await this.llmService.chat([
            { role: 'system', content: 'You are a workflow generation assistant.' },
            { role: 'user', content: prompt }
        ])
        console.log('[WorkflowEngine] LLM 响应长度:', response.content.length)

        // 3. 解析 JSON
        const result = this.parseGenerationResponse(response.content)

        // 4. 验证和修复
        const validatedWorkflow = this.validateAndFix(result.workflow)

        // 5. 自动布局
        const layoutedWorkflow = this.autoLayout(validatedWorkflow)

        return {
            workflow: layoutedWorkflow,
            explanation: result.explanation,
            confidence: result.confidence
        }
    }

    /**
     * 构建生成 Prompt
     */
    private buildGenerationPrompt(description: string): string {
        const nodeSchemas = generateNodeSchemasText()

        const fewShotExamples = this.getFewShotExamples()

        return `你是一个 AI 工作流生成助手。根据用户的需求描述，生成 AIFlowHub 工作流 JSON。

${nodeSchemas}

# 工作流 JSON 格式

\`\`\`json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "节点类型",
      "data": {
        "label": "节点名称",
        "inputs": {
          "参数名": "参数值"
        }
      }
    }
  ],
  "edges": [
    {
      "source": "node_1",
      "target": "node_2"
    }
  ],
  "explanation": "工作流说明",
  "confidence": 0.9
}
\`\`\`

# 示例

${fewShotExamples}

# 规则

1. 节点 ID 必须唯一，使用 "node_1", "node_2" 等格式
2. 节点类型必须从上面的可用节点类型中选择
3. 边的 source 和 target 必须是存在的节点 ID
4. 工作流应该有明确的输入和输出
5. 对于需要凭证的节点，在 data.inputs 中不要包含 API Key
6. systemPrompt 应该根据用户需求定制
7. confidence 表示生成的置信度（0-1），如果需求不明确或无法实现，应该降低置信度

# 用户需求

${description}

# 输出

请生成符合上述格式的 JSON，只输出 JSON，不要有其他文字。`
    }

    /**
     * 获取 Few-shot 示例
     */
    private getFewShotExamples(): string {
        return `## 示例 1：AI 文案助手

用户需求：创建一个能生成小红书风格文案的工具

\`\`\`json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "textInput",
      "data": {
        "label": "产品描述输入"
      }
    },
    {
      "id": "node_2",
      "type": "chatDeepSeek",
      "data": {
        "label": "文案生成",
        "inputs": {
          "systemPrompt": "你是一位小红书文案专家。请根据产品描述，生成吸引人的小红书风格文案。要求：1. 使用emoji表情 2. 标题要有吸引力 3. 内容要有代入感 4. 结尾要有互动引导",
          "temperature": 0.8,
          "maxTokens": 500
        }
      }
    },
    {
      "id": "node_3",
      "type": "output",
      "data": {
        "label": "文案输出"
      }
    }
  ],
  "edges": [
    { "source": "node_1", "target": "node_2" },
    { "source": "node_2", "target": "node_3" }
  ],
  "explanation": "这个工作流接收产品描述，使用 DeepSeek 模型生成小红书风格的营销文案，最后输出结果。",
  "confidence": 0.95
}
\`\`\`

## 示例 2：智能客服问答

用户需求：创建一个智能客服机器人，能回答产品相关问题

\`\`\`json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "textInput",
      "data": {
        "label": "用户问题"
      }
    },
    {
      "id": "node_2",
      "type": "chatZhipuAI",
      "data": {
        "label": "智能客服",
        "inputs": {
          "systemPrompt": "你是一位专业的客服人员。请礼貌、准确地回答用户的问题。如果不确定答案，请诚实告知并建议联系人工客服。",
          "temperature": 0.3,
          "maxTokens": 300
        }
      }
    },
    {
      "id": "node_3",
      "type": "output",
      "data": {
        "label": "客服回复"
      }
    }
  ],
  "edges": [
    { "source": "node_1", "target": "node_2" },
    { "source": "node_2", "target": "node_3" }
  ],
  "explanation": "这个工作流接收用户问题，使用智谱 GLM-4 模型生成专业的客服回复。",
  "confidence": 0.9
}
\`\`\`

## 示例 3：营销海报生成

用户需求：输入产品描述，自动生成营销文案和配图

\`\`\`json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "textInput",
      "data": {
        "label": "产品描述"
      }
    },
    {
      "id": "node_2",
      "type": "chatDeepSeek",
      "data": {
        "label": "文案生成",
        "inputs": {
          "systemPrompt": "根据产品描述，生成简洁有力的营销文案（20字以内）和详细的图片描述（用于AI绘图）。输出格式：文案：xxx\\n图片描述：xxx",
          "temperature": 0.7,
          "maxTokens": 200
        }
      }
    },
    {
      "id": "node_3",
      "type": "jimengImageGen",
      "data": {
        "label": "配图生成",
        "inputs": {
          "width": 1024,
          "height": 1024
        }
      }
    },
    {
      "id": "node_4",
      "type": "output",
      "data": {
        "label": "海报输出"
      }
    }
  ],
  "edges": [
    { "source": "node_1", "target": "node_2" },
    { "source": "node_2", "target": "node_3" },
    { "source": "node_3", "target": "node_4" }
  ],
  "explanation": "这个工作流接收产品描述，先用 DeepSeek 生成营销文案和图片描述，再用即梦 AI 生成配图，最后输出完整的营销海报。",
  "confidence": 0.85
}
\`\`\`
`
    }

    /**
     * 解析 LLM 响应
     */
    private parseGenerationResponse(response: string): {
        workflow: WorkflowData
        explanation: string
        confidence: number
    } {
        try {
            // 提取 JSON（可能被包裹在 ```json ``` 中）
            let jsonStr = response.trim()

            // 移除 markdown 代码块标记
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
            if (jsonMatch) {
                jsonStr = jsonMatch[1]
            }

            // 解析 JSON
            const parsed = JSON.parse(jsonStr)

            return {
                workflow: {
                    nodes: parsed.nodes || [],
                    edges: parsed.edges || []
                },
                explanation: parsed.explanation || '工作流已生成',
                confidence: parsed.confidence || 0.8
            }
        } catch (error) {
            console.error('[WorkflowEngine] JSON 解析失败:', error)
            console.error('[WorkflowEngine] 原始响应:', response)

            // 尝试修复常见的 JSON 错误
            return this.attemptJsonFix(response)
        }
    }

    /**
     * 尝试修复 JSON 错误
     */
    private attemptJsonFix(response: string): {
        workflow: WorkflowData
        explanation: string
        confidence: number
    } {
        // 简单的修复策略：返回空工作流
        console.warn('[WorkflowEngine] 无法解析 JSON，返回空工作流')
        return {
            workflow: {
                nodes: [],
                edges: []
            },
            explanation: 'JSON 解析失败，请重试',
            confidence: 0
        }
    }

    /**
     * 验证和修复工作流
     */
    private validateAndFix(workflow: WorkflowData): WorkflowData {
        const { nodes, edges } = workflow

        // 1. 验证节点类型
        const validNodes = nodes.filter((node) => {
            const schema = getNodeSchema(node.type)
            if (!schema) {
                console.warn(`[WorkflowEngine] 未知节点类型: ${node.type}`)
                return false
            }
            return true
        })

        // 2. 验证边的连接
        const nodeIds = new Set(validNodes.map((n) => n.id))
        const validEdges = edges.filter((edge) => {
            if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
                console.warn(`[WorkflowEngine] 无效的边: ${edge.source} -> ${edge.target}`)
                return false
            }
            return true
        })

        // 3. 为边生成 ID
        const edgesWithIds = validEdges.map((edge, index) => ({
            ...edge,
            id: edge.id || `edge_${index + 1}`
        }))

        return {
            nodes: validNodes,
            edges: edgesWithIds
        }
    }

    /**
     * 自动布局
     * 使用简单的层次布局算法
     */
    private autoLayout(workflow: WorkflowData): WorkflowData {
        const { nodes, edges } = workflow

        if (nodes.length === 0) {
            return workflow
        }

        // 1. 构建邻接表
        const adjacency = new Map<string, string[]>()
        const inDegree = new Map<string, number>()

        for (const node of nodes) {
            adjacency.set(node.id, [])
            inDegree.set(node.id, 0)
        }

        for (const edge of edges) {
            adjacency.get(edge.source)?.push(edge.target)
            inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
        }

        // 2. 拓扑排序（层次分组）
        const layers: string[][] = []
        const queue: string[] = []

        // 找到所有入度为 0 的节点（起始节点）
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(nodeId)
            }
        }

        while (queue.length > 0) {
            const currentLayer = [...queue]
            layers.push(currentLayer)
            queue.length = 0

            for (const nodeId of currentLayer) {
                const neighbors = adjacency.get(nodeId) || []
                for (const neighbor of neighbors) {
                    const newDegree = (inDegree.get(neighbor) || 0) - 1
                    inDegree.set(neighbor, newDegree)
                    if (newDegree === 0) {
                        queue.push(neighbor)
                    }
                }
            }
        }

        // 3. 计算位置
        const LAYER_SPACING = 600 // 层间距（水平）
        const NODE_SPACING = 600 // 节点间距（垂直），节点高度约500px，所以需要至少600px间距
        const START_X = 100
        const START_Y = 100

        const nodePositions = new Map<string, { x: number; y: number }>()

        for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
            const layer = layers[layerIndex]
            const x = START_X + layerIndex * LAYER_SPACING

            for (let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
                const nodeId = layer[nodeIndex]
                const y = START_Y + nodeIndex * NODE_SPACING
                nodePositions.set(nodeId, { x, y })
            }
        }

        // 4. 应用位置
        const layoutedNodes = nodes.map((node) => ({
            ...node,
            position: nodePositions.get(node.id) || { x: 0, y: 0 }
        }))

        return {
            nodes: layoutedNodes,
            edges
        }
    }
}
