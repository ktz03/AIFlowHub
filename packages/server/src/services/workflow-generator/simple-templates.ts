/**
 * 简单的工作流模�?
 * 使用已知可用的节点类型，确保生成的工作流可以正常使用
 */

import { WorkflowData } from './workflow-engine'

/**
 * 简单的客服机器人模�?
 * 使用正确�?handle ID 格式
 */
export function getSimpleCustomerServiceTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Wrapper around Deepseek large language models',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [
                                { label: 'deepseek-chat', name: 'deepseek-chat' },
                                { label: 'deepseek-coder', name: 'deepseek-coder' }
                            ],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.7,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        modelName: 'deepseek-chat',
                        temperature: 0.7
                    },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous conversational back and forths directly',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Chat models specific conversational chain with memory',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            placeholder: '你是一个友好的客服助手',
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个友好的客服助手，负责回答用户的产品相关问题。请保持礼貌、专业，并尽可能提供有用的信息。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 根据用户描述选择合适的模板
 */
export function selectTemplateByDescription(description: string): WorkflowData | null {
    const lowerDesc = description.toLowerCase()

    // 文档问答、知识库、RAG 相关
    if (
        lowerDesc.includes('文档') ||
        lowerDesc.includes('知识库') ||
        lowerDesc.includes('问答') ||
        lowerDesc.includes('检索') ||
        lowerDesc.includes('rag') ||
        lowerDesc.includes('pdf') ||
        lowerDesc.includes('向量')
    ) {
        return getDocumentQATemplate()
    }

    // 代码相关
    if (
        lowerDesc.includes('代码') ||
        lowerDesc.includes('编程') ||
        lowerDesc.includes('code') ||
        lowerDesc.includes('程序') ||
        lowerDesc.includes('开发') ||
        lowerDesc.includes('debug') ||
        lowerDesc.includes('调试')
    ) {
        return getCodeAssistantTemplate()
    }

    // 图片生成相关
    if (
        lowerDesc.includes('图片') ||
        lowerDesc.includes('图像') ||
        lowerDesc.includes('绘画') ||
        lowerDesc.includes('画') ||
        lowerDesc.includes('image') ||
        lowerDesc.includes('生成图') ||
        lowerDesc.includes('ai绘画')
    ) {
        return getImageGenerationTemplate()
    }

    // 创意写作相关
    if (
        lowerDesc.includes('写作') ||
        lowerDesc.includes('创作') ||
        lowerDesc.includes('故事') ||
        lowerDesc.includes('文章') ||
        lowerDesc.includes('诗歌') ||
        lowerDesc.includes('小说') ||
        lowerDesc.includes('剧本') ||
        lowerDesc.includes('散文')
    ) {
        return getCreativeWritingTemplate()
    }

    // 翻译相关
    if (
        lowerDesc.includes('翻译') ||
        lowerDesc.includes('translate') ||
        lowerDesc.includes('英译中') ||
        lowerDesc.includes('中译英') ||
        lowerDesc.includes('多语言')
    ) {
        return getTranslationTemplate()
    }

    // 数据分析相关
    if (
        lowerDesc.includes('数据分析') ||
        lowerDesc.includes('数据处理') ||
        lowerDesc.includes('csv') ||
        lowerDesc.includes('excel') ||
        lowerDesc.includes('统计') ||
        lowerDesc.includes('报表')
    ) {
        return getDataAnalysisTemplate()
    }

    // 内容总结相关
    if (
        lowerDesc.includes('总结') ||
        lowerDesc.includes('摘要') ||
        lowerDesc.includes('概括') ||
        lowerDesc.includes('提炼') ||
        lowerDesc.includes('summary')
    ) {
        return getContentSummaryTemplate()
    }

    // 邮件助手相关
    if (lowerDesc.includes('邮件') || lowerDesc.includes('email') || lowerDesc.includes('写信') || lowerDesc.includes('商务信函')) {
        return getEmailAssistantTemplate()
    }

    // 教育辅导相关
    if (
        lowerDesc.includes('教学') ||
        lowerDesc.includes('辅导') ||
        lowerDesc.includes('学习') ||
        lowerDesc.includes('教育') ||
        lowerDesc.includes('老师') ||
        lowerDesc.includes('tutor')
    ) {
        return getTutorTemplate()
    }

    // 客服、对话、聊天相关
    if (
        lowerDesc.includes('客服') ||
        lowerDesc.includes('对话') ||
        lowerDesc.includes('聊天') ||
        lowerDesc.includes('机器人') ||
        lowerDesc.includes('助手')
    ) {
        return getSimpleCustomerServiceTemplate()
    }

    // 默认返回客服模板
    return getSimpleCustomerServiceTemplate()
}

/**
 * 文档问答模板 (RAG) - 带记忆功能
 */
function getDocumentQATemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Wrapper around Deepseek large language models',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-chat', name: 'deepseek-chat' }],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.7,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-chat', temperature: 0.7 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous conversational back and forths directly',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Chat models specific conversational chain with memory',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个专业的文档问答助手，请根据提供的文档内容回答用户问题。支持多轮对话，可以记住之前的问答内容。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 代码助手模板 - 带记忆功能
 */
function getCodeAssistantTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Deepseek Coder model for code generation',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-coder', name: 'deepseek-coder' }],
                            default: 'deepseek-coder',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.3,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-coder', temperature: 0.3 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous conversational back and forths directly',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Code assistant chain with memory',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个专业的代码助手，擅长编写高质量的代码。请根据用户需求生成代码，并提供详细的解释。支持多轮对话，可以记住之前的代码上下文。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 图片生成模板 - 使用Tool Agent架构
 * 用户可以通过对话描述需求，Agent调用即梦AI生成图片
 */
function getImageGenerationTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'jimengImageGen_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'jimengImageGen_0',
                    label: '即梦AI图片生成工具',
                    version: 1,
                    name: 'jimengImageGen',
                    type: 'JimengImageGen',
                    baseClasses: ['JimengImageGen', 'Tool', 'StructuredTool'],
                    category: 'Tools',
                    description: '即梦AI图片生成工具（即梦4.0），根据文本描述生成图片',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['jimengApi'],
                            id: 'jimengImageGen_0-input-credential-credential'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {},
                    outputAnchors: [
                        {
                            id: 'jimengImageGen_0-output-jimengImageGen-JimengImageGen|Tool|StructuredTool',
                            name: 'jimengImageGen',
                            label: 'JimengImageGen',
                            type: 'JimengImageGen | Tool | StructuredTool'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 450 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous image generation requests',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 1000 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: '图像创意生成器 ChatDeepseek',
                    version: 2,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Chat model for understanding image generation requests',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-chat', name: 'deepseek-chat' }],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.7,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-chat', temperature: 0.7 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'toolAgent_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'toolAgent_0',
                    label: 'Tool Agent',
                    version: 2,
                    name: 'toolAgent',
                    type: 'AgentExecutor',
                    baseClasses: ['AgentExecutor', 'BaseChain', 'Runnable'],
                    category: 'Agents',
                    description: 'Agent that uses Function Calling to pick the tools and args to call',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessage',
                            type: 'string',
                            rows: 4,
                            default: 'You are a helpful AI assistant.',
                            optional: true,
                            additionalParams: true,
                            id: 'toolAgent_0-input-systemMessage-string'
                        },
                        {
                            label: 'Max Iterations',
                            name: 'maxIterations',
                            type: 'number',
                            optional: true,
                            additionalParams: true,
                            id: 'toolAgent_0-input-maxIterations-number'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Tools',
                            name: 'tools',
                            type: 'Tool',
                            list: true,
                            id: 'toolAgent_0-input-tools-Tool'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseChatMemory',
                            id: 'toolAgent_0-input-memory-BaseChatMemory'
                        },
                        {
                            label: 'Tool Calling Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'toolAgent_0-input-model-BaseChatModel'
                        }
                    ],
                    inputs: {
                        tools: ['{{jimengImageGen_0.data.instance}}'],
                        memory: '{{bufferMemory_0.data.instance}}',
                        model: '{{chatDeepseek_0.data.instance}}',
                        systemMessage:
                            '你是一个AI图片生成助手。用户会描述他们想要生成的图片，你需要理解他们的需求并使用jimeng_image_generator工具生成图片。支持多轮对话，可以根据用户反馈调整图片描述。'
                    },
                    outputAnchors: [
                        {
                            id: 'toolAgent_0-output-toolAgent-AgentExecutor|BaseChain|Runnable',
                            name: 'toolAgent',
                            label: 'Tool Agent',
                            type: 'AgentExecutor | BaseChain | Runnable'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'jimengImageGen_0-jimengImageGen_0-output-jimengImageGen-JimengImageGen|Tool|StructuredTool-toolAgent_0-toolAgent_0-input-tools-Tool',
                source: 'jimengImageGen_0',
                sourceHandle: 'jimengImageGen_0-output-jimengImageGen-JimengImageGen|Tool|StructuredTool',
                target: 'toolAgent_0',
                targetHandle: 'toolAgent_0-input-tools-Tool',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-toolAgent_0-toolAgent_0-input-memory-BaseChatMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'toolAgent_0',
                targetHandle: 'toolAgent_0-input-memory-BaseChatMemory',
                type: 'buttonedge'
            },
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-toolAgent_0-toolAgent_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'toolAgent_0',
                targetHandle: 'toolAgent_0-input-model-BaseChatModel',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 创意写作模板 - 带记忆功能
 */
function getCreativeWritingTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Creative writing model',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-chat', name: 'deepseek-chat' }],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.9,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-chat', temperature: 0.9 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous conversational back and forths directly',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Creative writing chain with memory',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个富有创意的作家,擅长创作引人入胜的故事、诗歌和文章。请发挥想象力,创作出独特而精彩的内容。支持多轮对话，可以根据反馈不断完善作品。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 翻译助手模板 - 带记忆功能
 */
function getTranslationTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Translation model',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-chat', name: 'deepseek-chat' }],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.3,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-chat', temperature: 0.3 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous conversational back and forths directly',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Translation chain with memory',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个专业的翻译助手,能够准确、流畅地在多种语言之间进行翻译。请保持原文的语气和风格,确保翻译的准确性和地道性。支持多轮对话，可以记住之前的翻译上下文。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 数据分析模板 - 带记忆功能
 */
function getDataAnalysisTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Data analysis model',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-chat', name: 'deepseek-chat' }],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.3,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-chat', temperature: 0.3 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous conversational back and forths directly',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Data analysis chain with memory',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个专业的数据分析师,擅长分析数据、发现趋势、提供洞察。请帮助用户理解数据,并提供清晰的分析结论和建议。支持多轮对话，可以记住之前的分析上下文。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 内容总结模板 - 带记忆功能
 */
function getContentSummaryTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Content summary model',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-chat', name: 'deepseek-chat' }],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.3,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-chat', temperature: 0.3 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous conversational back and forths directly',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Content summary chain with memory',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个专业的内容总结助手,擅长提炼关键信息、概括要点。请用简洁清晰的语言总结内容,突出重点,保持客观准确。支持多轮对话，可以记住之前的总结上下文。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 邮件助手模板 - 带记忆功能
 */
function getEmailAssistantTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Email assistant model',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-chat', name: 'deepseek-chat' }],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.5,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-chat', temperature: 0.5 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers previous conversational back and forths directly',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Email assistant chain with memory',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个专业的邮件写作助手,擅长撰写各类商务邮件、正式信函。请根据用户需求,撰写格式规范、语气得体、表达清晰的邮件内容。支持多轮对话，可以记住之前的邮件写作上下文。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}

/**
 * 教育辅导模板
 */
function getTutorTemplate(): WorkflowData {
    return {
        nodes: [
            {
                id: 'chatDeepseek_0',
                position: { x: 100, y: 100 },
                type: 'customNode',
                data: {
                    id: 'chatDeepseek_0',
                    label: 'ChatDeepseek',
                    version: 1,
                    name: 'chatDeepseek',
                    type: 'ChatDeepseek',
                    baseClasses: ['ChatDeepseek', 'BaseChatModel', 'BaseLanguageModel'],
                    category: 'Chat Models',
                    description: 'Educational tutor model',
                    inputParams: [
                        {
                            label: 'Connect Credential',
                            name: 'credential',
                            type: 'credential',
                            credentialNames: ['deepseekApi'],
                            id: 'chatDeepseek_0-input-credential-credential'
                        },
                        {
                            label: 'Model Name',
                            name: 'modelName',
                            type: 'options',
                            options: [{ label: 'deepseek-chat', name: 'deepseek-chat' }],
                            default: 'deepseek-chat',
                            id: 'chatDeepseek_0-input-modelName-options'
                        },
                        {
                            label: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            default: 0.6,
                            optional: true,
                            id: 'chatDeepseek_0-input-temperature-number'
                        }
                    ],
                    inputAnchors: [],
                    inputs: { modelName: 'deepseek-chat', temperature: 0.6 },
                    outputAnchors: [
                        {
                            id: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                            name: 'chatDeepseek',
                            label: 'ChatDeepseek',
                            type: 'ChatDeepseek | BaseChatModel | BaseLanguageModel'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'bufferMemory_0',
                position: { x: 100, y: 700 },
                type: 'customNode',
                data: {
                    id: 'bufferMemory_0',
                    label: 'Buffer Memory',
                    version: 1,
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    baseClasses: ['BufferMemory', 'BaseChatMemory', 'BaseMemory'],
                    category: 'Memory',
                    description: 'Remembers conversation history',
                    inputParams: [
                        {
                            label: 'Memory Key',
                            name: 'memoryKey',
                            type: 'string',
                            default: 'chat_history',
                            id: 'bufferMemory_0-input-memoryKey-string'
                        },
                        {
                            label: 'Input Key',
                            name: 'inputKey',
                            type: 'string',
                            default: 'input',
                            id: 'bufferMemory_0-input-inputKey-string'
                        }
                    ],
                    inputAnchors: [],
                    inputs: {
                        memoryKey: 'chat_history',
                        inputKey: 'input'
                    },
                    outputAnchors: [
                        {
                            id: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                            name: 'bufferMemory',
                            label: 'BufferMemory',
                            type: 'BufferMemory | BaseChatMemory | BaseMemory'
                        }
                    ],
                    outputs: {}
                }
            },
            {
                id: 'conversationChain_0',
                position: { x: 600, y: 400 },
                type: 'customNode',
                data: {
                    id: 'conversationChain_0',
                    label: 'Conversation Chain',
                    version: 1,
                    name: 'conversationChain',
                    type: 'ConversationChain',
                    baseClasses: ['ConversationChain', 'LLMChain', 'BaseChain'],
                    category: 'Chains',
                    description: 'Educational tutor chain',
                    inputParams: [
                        {
                            label: 'System Message',
                            name: 'systemMessagePrompt',
                            type: 'string',
                            rows: 4,
                            optional: true,
                            id: 'conversationChain_0-input-systemMessagePrompt-string'
                        }
                    ],
                    inputAnchors: [
                        {
                            label: 'Chat Model',
                            name: 'model',
                            type: 'BaseChatModel',
                            id: 'conversationChain_0-input-model-BaseChatModel'
                        },
                        {
                            label: 'Memory',
                            name: 'memory',
                            type: 'BaseMemory',
                            optional: true,
                            id: 'conversationChain_0-input-memory-BaseMemory'
                        }
                    ],
                    inputs: {
                        model: '{{chatDeepseek_0.data.instance}}',
                        memory: '{{bufferMemory_0.data.instance}}',
                        systemMessagePrompt:
                            '你是一个耐心的教育辅导老师,擅长用简单易懂的方式解释复杂概念。请循序渐进地引导学生理解知识,鼓励思考,并提供适当的练习建议。'
                    },
                    outputAnchors: [
                        {
                            id: 'conversationChain_0-output-conversationChain-ConversationChain|LLMChain|BaseChain',
                            name: 'conversationChain',
                            label: 'ConversationChain',
                            type: 'ConversationChain | LLMChain | BaseChain'
                        }
                    ],
                    outputs: {}
                }
            }
        ],
        edges: [
            {
                id: 'chatDeepseek_0-chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel',
                source: 'chatDeepseek_0',
                sourceHandle: 'chatDeepseek_0-output-chatDeepseek-ChatDeepseek|BaseChatModel|BaseLanguageModel',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-model-BaseChatModel',
                type: 'buttonedge'
            },
            {
                id: 'bufferMemory_0-bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory-conversationChain_0-conversationChain_0-input-memory-BaseMemory',
                source: 'bufferMemory_0',
                sourceHandle: 'bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory',
                target: 'conversationChain_0',
                targetHandle: 'conversationChain_0-input-memory-BaseMemory',
                type: 'buttonedge'
            }
        ]
    }
}
