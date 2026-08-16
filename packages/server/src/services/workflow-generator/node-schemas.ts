/**
 * 节点 Schema 定义
 * 用于 LLM 理解可用的节点类型及其配置
 */

export interface NodeSchema {
    type: string
    category: string
    inputs: string[]
    outputs: string[]
    description: string
    requiredCredentials?: string[]
    commonConfigs?: Record<string, any>
}

// 对话模型节点
export const chatModelSchemas: NodeSchema[] = [
    {
        type: 'chatDeepseek',
        category: 'chatModel',
        inputs: ['systemPrompt', 'temperature', 'maxTokens'],
        outputs: ['text'],
        description: 'DeepSeek 对话模型，适合文本生成、问答、代码生成等任务。性价比高，推荐用于大多数场景。',
        requiredCredentials: ['deepseekApi'],
        commonConfigs: {
            temperature: 0.7,
            maxTokens: 2000
        }
    },
    {
        type: 'chatZhipuAI',
        category: 'chatModel',
        inputs: ['systemPrompt', 'temperature', 'maxTokens'],
        outputs: ['text'],
        description: '智谱 GLM-4 对话模型，适合中文理解和生成任务。',
        requiredCredentials: ['zhipuApi'],
        commonConfigs: {
            temperature: 0.7,
            maxTokens: 2000
        }
    },
    {
        type: 'chatMoonshot',
        category: 'chatModel',
        inputs: ['systemPrompt', 'temperature', 'maxTokens'],
        outputs: ['text'],
        description: 'Moonshot (Kimi) 对话模型，支持超长上下文，适合处理长文档。',
        requiredCredentials: ['moonshotApi'],
        commonConfigs: {
            temperature: 0.7,
            maxTokens: 2000
        }
    },
    {
        type: 'chatSpark',
        category: 'chatModel',
        inputs: ['systemPrompt', 'temperature', 'maxTokens'],
        outputs: ['text'],
        description: '讯飞星火对话模型，适合中文对话和内容生成。',
        requiredCredentials: ['sparkApi'],
        commonConfigs: {
            temperature: 0.7,
            maxTokens: 2000
        }
    },
    {
        type: 'chatHunyuan',
        category: 'chatModel',
        inputs: ['systemPrompt', 'temperature', 'maxTokens'],
        outputs: ['text'],
        description: '腾讯混元对话模型，适合中文理解和生成。',
        requiredCredentials: ['hunyuanApi'],
        commonConfigs: {
            temperature: 0.7,
            maxTokens: 2000
        }
    }
]

// 工具节点
export const toolSchemas: NodeSchema[] = [
    {
        type: 'jimengImageGen',
        category: 'tool',
        inputs: ['prompt', 'width', 'height'],
        outputs: ['imageUrl'],
        description: '即梦 AI 图像生成工具，根据文本描述生成图片。适合营销海报、插图等场景。',
        requiredCredentials: ['jimengApi'],
        commonConfigs: {
            width: 1024,
            height: 1024
        }
    },
    {
        type: 'calculator',
        category: 'tool',
        inputs: ['expression'],
        outputs: ['result'],
        description: '计算器工具，执行数学计算。',
        requiredCredentials: []
    },
    {
        type: 'webBrowser',
        category: 'tool',
        inputs: ['url'],
        outputs: ['content'],
        description: '网页浏览器工具，获取网页内容。',
        requiredCredentials: []
    }
]

// 文档加载器节点
export const documentLoaderSchemas: NodeSchema[] = [
    {
        type: 'pdfLoader',
        category: 'documentLoader',
        inputs: ['file'],
        outputs: ['documents'],
        description: 'PDF 文档加载器，提取 PDF 文件中的文本内容。',
        requiredCredentials: []
    },
    {
        type: 'textLoader',
        category: 'documentLoader',
        inputs: ['file'],
        outputs: ['documents'],
        description: '文本文件加载器，读取 TXT 文件内容。',
        requiredCredentials: []
    },
    {
        type: 'csvLoader',
        category: 'documentLoader',
        inputs: ['file'],
        outputs: ['documents'],
        description: 'CSV 文件加载器，读取表格数据。',
        requiredCredentials: []
    }
]

// 输入输出节点
export const ioSchemas: NodeSchema[] = [
    {
        type: 'textInput',
        category: 'input',
        inputs: [],
        outputs: ['text'],
        description: '文本输入节点，接收用户输入的文本。',
        requiredCredentials: []
    },
    {
        type: 'fileInput',
        category: 'input',
        inputs: [],
        outputs: ['file'],
        description: '文件输入节点，接收用户上传的文件。',
        requiredCredentials: []
    },
    {
        type: 'output',
        category: 'output',
        inputs: ['data'],
        outputs: [],
        description: '输出节点，展示工作流的最终结果。',
        requiredCredentials: []
    }
]

// 向量存储节点
export const vectorStoreSchemas: NodeSchema[] = [
    {
        type: 'faiss',
        category: 'vectorStore',
        inputs: ['documents', 'embeddings'],
        outputs: ['vectorStore'],
        description: 'FAISS 向量数据库，用于文档检索和相似度搜索。',
        requiredCredentials: []
    },
    {
        type: 'pinecone',
        category: 'vectorStore',
        inputs: ['documents', 'embeddings'],
        outputs: ['vectorStore'],
        description: 'Pinecone 向量数据库，云端向量存储服务。',
        requiredCredentials: ['pineconeApi']
    }
]

// 链节点
export const chainSchemas: NodeSchema[] = [
    {
        type: 'conversationChain',
        category: 'chain',
        inputs: ['chatModel', 'memory'],
        outputs: ['chain'],
        description: '对话链，支持多轮对话和上下文记忆。',
        requiredCredentials: []
    },
    {
        type: 'retrievalQAChain',
        category: 'chain',
        inputs: ['chatModel', 'vectorStore'],
        outputs: ['chain'],
        description: '检索问答链，基于文档库回答问题（RAG）。',
        requiredCredentials: []
    },
    {
        type: 'llmChain',
        category: 'chain',
        inputs: ['chatModel', 'prompt'],
        outputs: ['chain'],
        description: '基础 LLM 链，执行单次 LLM 调用。',
        requiredCredentials: []
    }
]

// Agent 节点
export const agentSchemas: NodeSchema[] = [
    {
        type: 'conversationalAgent',
        category: 'agent',
        inputs: ['chatModel', 'tools'],
        outputs: ['agent'],
        description: '对话式 Agent，能够使用工具并进行多轮对话。',
        requiredCredentials: []
    },
    {
        type: 'openAIFunctionAgent',
        category: 'agent',
        inputs: ['chatModel', 'tools'],
        outputs: ['agent'],
        description: 'OpenAI Function Calling Agent，使用函数调用能力。',
        requiredCredentials: []
    }
]

// 所有节点 Schema
export const allNodeSchemas: NodeSchema[] = [
    ...chatModelSchemas,
    ...toolSchemas,
    ...documentLoaderSchemas,
    ...ioSchemas,
    ...vectorStoreSchemas,
    ...chainSchemas,
    ...agentSchemas
]

// 节点类别映射
export const nodeCategoryMap: Record<string, NodeSchema[]> = {
    chatModel: chatModelSchemas,
    tool: toolSchemas,
    documentLoader: documentLoaderSchemas,
    input: ioSchemas.filter((s) => s.category === 'input'),
    output: ioSchemas.filter((s) => s.category === 'output'),
    vectorStore: vectorStoreSchemas,
    chain: chainSchemas,
    agent: agentSchemas
}

// 根据类型获取节点 Schema
export function getNodeSchema(type: string): NodeSchema | undefined {
    return allNodeSchemas.find((s) => s.type === type)
}

// 根据类别获取节点 Schema 列表
export function getNodeSchemasByCategory(category: string): NodeSchema[] {
    return nodeCategoryMap[category] || []
}

// 生成节点 Schema 的文本描述（用于 LLM Prompt）
export function generateNodeSchemasText(): string {
    let text = '# 可用节点类型\n\n'

    for (const [category, schemas] of Object.entries(nodeCategoryMap)) {
        text += `## ${category}\n\n`
        for (const schema of schemas) {
            text += `### ${schema.type}\n`
            text += `- 描述: ${schema.description}\n`
            text += `- 输入: ${schema.inputs.join(', ') || '无'}\n`
            text += `- 输出: ${schema.outputs.join(', ') || '无'}\n`
            if (schema.requiredCredentials && schema.requiredCredentials.length > 0) {
                text += `- 需要凭证: ${schema.requiredCredentials.join(', ')}\n`
            }
            text += '\n'
        }
    }

    return text
}
