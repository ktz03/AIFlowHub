/**
 * Few-shot 示例库
 * 扩充到 10+ 个高质量示例，覆盖主要场景
 */

import { FlowiseTechnique } from './technique-classifier'

export interface WorkflowExample {
    id: string
    category: string
    prompt: string
    techniques: FlowiseTechnique[]
    workflow: {
        nodes: Array<{
            type: string
            name: string
            description?: string
        }>
        connections: Array<{
            source: string
            target: string
        }>
    }
    explanation: string
}

/**
 * 扩充的示例库（10+ 个）
 */
export const examplesLibrary: WorkflowExample[] = [
    // 1. 客服机器人
    {
        id: 'customer-service-bot',
        category: 'chatbot',
        prompt: '创建一个客服机器人，能够回答产品相关问题',
        techniques: [FlowiseTechnique.CHATBOT, FlowiseTechnique.KNOWLEDGE_BASE],
        workflow: {
            nodes: [
                { type: 'chatTrigger', name: '接收消息', description: '接收用户的聊天消息' },
                {
                    type: 'conversationalRetrievalQAChain',
                    name: 'RAG 链',
                    description: '使用检索增强生成回答问题'
                },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 生成回复' },
                { type: 'openAIEmbeddings', name: '向量嵌入', description: '将文本转换为向量' },
                { type: 'pinecone', name: '向量数据库', description: '存储和检索产品知识' },
                { type: 'bufferMemory', name: '对话记忆', description: '记住对话历史' }
            ],
            connections: [
                { source: 'chatTrigger', target: 'conversationalRetrievalQAChain' },
                { source: 'chatOpenAI', target: 'conversationalRetrievalQAChain' },
                { source: 'openAIEmbeddings', target: 'pinecone' },
                { source: 'pinecone', target: 'conversationalRetrievalQAChain' },
                { source: 'bufferMemory', target: 'conversationalRetrievalQAChain' }
            ]
        },
        explanation: '使用 RAG 链结合向量数据库，让机器人能够基于产品知识库回答问题，并保持对话上下文。'
    },

    // 2. 内容生成 + 通知
    {
        id: 'content-generation-email',
        category: 'content-generation',
        prompt: '生成营销文案并通过邮件发送给客户',
        techniques: [FlowiseTechnique.CONTENT_GENERATION, FlowiseTechnique.NOTIFICATION],
        workflow: {
            nodes: [
                { type: 'manualTrigger', name: '手动触发', description: '手动启动工作流' },
                { type: 'llmChain', name: 'LLM 链', description: '生成营销文案' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 生成内容' },
                {
                    type: 'promptTemplate',
                    name: '提示模板',
                    description: '定义文案生成的提示词'
                },
                { type: 'gmail', name: '发送邮件', description: '通过 Gmail 发送邮件' }
            ],
            connections: [
                { source: 'manualTrigger', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'promptTemplate', target: 'llmChain' },
                { source: 'llmChain', target: 'gmail' }
            ]
        },
        explanation: '使用 LLM 链生成个性化营销文案，然后通过 Gmail 自动发送给客户列表。'
    },

    // 3. 文档处理
    {
        id: 'document-processing',
        category: 'document-processing',
        prompt: '处理上传的 PDF 文档并提取关键信息',
        techniques: [FlowiseTechnique.DOCUMENT_PROCESSING, FlowiseTechnique.DATA_ANALYSIS],
        workflow: {
            nodes: [
                { type: 'documentTrigger', name: '文档上传', description: '接收上传的文档' },
                { type: 'pdfLoader', name: 'PDF 加载器', description: '加载 PDF 文件' },
                {
                    type: 'recursiveCharacterTextSplitter',
                    name: '文本分割',
                    description: '将文档分割成小块'
                },
                { type: 'llmChain', name: 'LLM 提取', description: '提取关键信息' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 分析' },
                { type: 'jsonOutput', name: 'JSON 输出', description: '输出结构化数据' }
            ],
            connections: [
                { source: 'documentTrigger', target: 'pdfLoader' },
                { source: 'pdfLoader', target: 'recursiveCharacterTextSplitter' },
                { source: 'recursiveCharacterTextSplitter', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'llmChain', target: 'jsonOutput' }
            ]
        },
        explanation: '加载 PDF 文档，分割成小块，使用 LLM 提取关键信息（如姓名、日期、金额等），输出为结构化 JSON。'
    },

    // 4. 数据分析
    {
        id: 'sentiment-analysis',
        category: 'data-analysis',
        prompt: '分析客户反馈并生成情感分析报告',
        techniques: [FlowiseTechnique.DATA_ANALYSIS, FlowiseTechnique.DATA_TRANSFORMATION],
        workflow: {
            nodes: [
                { type: 'scheduleTrigger', name: '定时触发', description: '每天定时执行' },
                { type: 'csvLoader', name: '加载数据', description: '从 CSV 加载反馈数据' },
                { type: 'llmChain', name: '情感分析', description: '分析每条反馈的情感' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 分析' },
                { type: 'aggregate', name: '聚合结果', description: '汇总分析结果' },
                { type: 'htmlOutput', name: 'HTML 报告', description: '生成可视化报告' }
            ],
            connections: [
                { source: 'scheduleTrigger', target: 'csvLoader' },
                { source: 'csvLoader', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'llmChain', target: 'aggregate' },
                { source: 'aggregate', target: 'htmlOutput' }
            ]
        },
        explanation: '定时加载客户反馈数据，使用 LLM 进行情感分析（正面/负面/中性），聚合结果并生成可视化报告。'
    },

    // 5. AI Agent
    {
        id: 'research-agent',
        category: 'agent',
        prompt: '创建一个能够搜索网络并回答问题的 AI 助手',
        techniques: [FlowiseTechnique.AGENT, FlowiseTechnique.SCRAPING_AND_RESEARCH],
        workflow: {
            nodes: [
                { type: 'chatTrigger', name: '接收问题', description: '接收用户问题' },
                { type: 'agent', name: 'AI Agent', description: '智能代理协调工具使用' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 推理' },
                { type: 'serpAPI', name: '搜索工具', description: 'Google 搜索 API' },
                { type: 'calculator', name: '计算器工具', description: '执行数学计算' },
                { type: 'bufferMemory', name: '对话记忆', description: '记住对话历史' }
            ],
            connections: [
                { source: 'chatTrigger', target: 'agent' },
                { source: 'chatOpenAI', target: 'agent' },
                { source: 'serpAPI', target: 'agent' },
                { source: 'calculator', target: 'agent' },
                { source: 'bufferMemory', target: 'agent' }
            ]
        },
        explanation: 'AI Agent 可以自主决定何时使用搜索工具查找信息，何时使用计算器进行计算，然后综合信息回答问题。'
    },

    // 6. 定时抓取
    {
        id: 'scheduled-scraping',
        category: 'scraping',
        prompt: '每天定时抓取竞品价格并生成对比报告',
        techniques: [FlowiseTechnique.SCHEDULING, FlowiseTechnique.SCRAPING_AND_RESEARCH, FlowiseTechnique.DATA_ANALYSIS],
        workflow: {
            nodes: [
                { type: 'scheduleTrigger', name: '定时触发', description: '每天早上 8 点执行' },
                { type: 'httpRequest', name: 'API 请求', description: '调用价格 API' },
                { type: 'jsonParser', name: 'JSON 解析', description: '解析 API 响应' },
                { type: 'llmChain', name: '价格分析', description: '分析价格变化' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 分析' },
                { type: 'slack', name: 'Slack 通知', description: '发送报告到 Slack' }
            ],
            connections: [
                { source: 'scheduleTrigger', target: 'httpRequest' },
                { source: 'httpRequest', target: 'jsonParser' },
                { source: 'jsonParser', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'llmChain', target: 'slack' }
            ]
        },
        explanation: '定时抓取竞品价格数据，使用 LLM 分析价格趋势和变化，生成对比报告并发送到 Slack。'
    },

    // 7. 表单处理 + 人工审核
    {
        id: 'form-approval-workflow',
        category: 'form-processing',
        prompt: '接收表单提交，提取文件内容，等待人工审核后发送通知',
        techniques: [
            FlowiseTechnique.FORM_INPUT,
            FlowiseTechnique.DOCUMENT_PROCESSING,
            FlowiseTechnique.HUMAN_IN_THE_LOOP,
            FlowiseTechnique.NOTIFICATION
        ],
        workflow: {
            nodes: [
                { type: 'webhookTrigger', name: '表单提交', description: '接收表单 Webhook' },
                { type: 'pdfLoader', name: 'PDF 加载', description: '加载上传的 PDF' },
                { type: 'llmChain', name: '内容提取', description: '提取关键信息' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 提取' },
                { type: 'humanApproval', name: '人工审核', description: '等待人工批准' },
                { type: 'gmail', name: '发送通知', description: '发送审核结果邮件' }
            ],
            connections: [
                { source: 'webhookTrigger', target: 'pdfLoader' },
                { source: 'pdfLoader', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'llmChain', target: 'humanApproval' },
                { source: 'humanApproval', target: 'gmail' }
            ]
        },
        explanation: '接收表单提交，提取上传文件的内容，暂停工作流等待人工审核，审核通过后自动发送通知邮件。'
    },

    // 8. 社交媒体监控
    {
        id: 'social-media-monitoring',
        category: 'monitoring',
        prompt: '监控社交媒体提及，自动回复相关内容',
        techniques: [FlowiseTechnique.MONITORING, FlowiseTechnique.CHATBOT, FlowiseTechnique.CONTENT_GENERATION],
        workflow: {
            nodes: [
                { type: 'twitterTrigger', name: 'Twitter 监控', description: '监听品牌提及' },
                { type: 'llmChain', name: '内容分析', description: '分析提及内容' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 分析' },
                { type: 'ifElse', name: '条件判断', description: '判断是否需要回复' },
                { type: 'llmChain', name: '生成回复', description: '生成回复内容' },
                { type: 'twitterPost', name: '发送回复', description: '发送 Twitter 回复' }
            ],
            connections: [
                { source: 'twitterTrigger', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'llmChain', target: 'ifElse' },
                { source: 'ifElse', target: 'llmChain' },
                { source: 'llmChain', target: 'twitterPost' }
            ]
        },
        explanation: '实时监控 Twitter 上的品牌提及，使用 LLM 分析内容情感和意图，自动生成并发送合适的回复。'
    },

    // 9. 数据增强
    {
        id: 'data-enrichment',
        category: 'enrichment',
        prompt: '从多个数据源收集信息，用 LinkedIn 数据增强客户资料',
        techniques: [FlowiseTechnique.SCRAPING_AND_RESEARCH, FlowiseTechnique.ENRICHMENT],
        workflow: {
            nodes: [
                { type: 'csvLoader', name: '加载客户列表', description: '从 CSV 加载客户' },
                { type: 'linkedInAPI', name: 'LinkedIn API', description: '查询 LinkedIn 资料' },
                { type: 'httpRequest', name: '公司信息 API', description: '获取公司信息' },
                { type: 'merge', name: '合并数据', description: '合并多个数据源' },
                { type: 'llmChain', name: '数据清洗', description: '清洗和标准化数据' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 处理' },
                { type: 'csvOutput', name: '输出 CSV', description: '保存增强后的数据' }
            ],
            connections: [
                { source: 'csvLoader', target: 'linkedInAPI' },
                { source: 'csvLoader', target: 'httpRequest' },
                { source: 'linkedInAPI', target: 'merge' },
                { source: 'httpRequest', target: 'merge' },
                { source: 'merge', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'llmChain', target: 'csvOutput' }
            ]
        },
        explanation: '从客户列表出发，并行查询 LinkedIn 和公司信息 API，合并数据后使用 LLM 清洗和标准化，输出增强后的客户资料。'
    },

    // 10. 知识库构建
    {
        id: 'knowledge-base-builder',
        category: 'knowledge-base',
        prompt: '构建内部知识库，从历史工单中提取信息供员工查询',
        techniques: [FlowiseTechnique.DOCUMENT_PROCESSING, FlowiseTechnique.KNOWLEDGE_BASE],
        workflow: {
            nodes: [
                { type: 'manualTrigger', name: '手动触发', description: '手动启动构建' },
                { type: 'directoryLoader', name: '加载工单', description: '加载所有工单文件' },
                {
                    type: 'recursiveCharacterTextSplitter',
                    name: '文本分割',
                    description: '分割成小块'
                },
                { type: 'openAIEmbeddings', name: '向量嵌入', description: '生成向量' },
                { type: 'pinecone', name: '向量数据库', description: '存储到 Pinecone' },
                { type: 'chatTrigger', name: '查询接口', description: '接收员工查询' },
                {
                    type: 'conversationalRetrievalQAChain',
                    name: 'RAG 链',
                    description: '检索并回答'
                },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 回答' }
            ],
            connections: [
                { source: 'manualTrigger', target: 'directoryLoader' },
                { source: 'directoryLoader', target: 'recursiveCharacterTextSplitter' },
                { source: 'recursiveCharacterTextSplitter', target: 'openAIEmbeddings' },
                { source: 'openAIEmbeddings', target: 'pinecone' },
                { source: 'chatTrigger', target: 'conversationalRetrievalQAChain' },
                { source: 'pinecone', target: 'conversationalRetrievalQAChain' },
                { source: 'chatOpenAI', target: 'conversationalRetrievalQAChain' }
            ]
        },
        explanation: '批量加载历史工单，分割并向量化后存储到 Pinecone，然后提供聊天接口让员工查询知识库。'
    },

    // 11. 智能路由
    {
        id: 'intelligent-routing',
        category: 'triage',
        prompt: '接收客户咨询，根据问题类型路由到不同的处理流程',
        techniques: [FlowiseTechnique.CHATBOT, FlowiseTechnique.TRIAGE],
        workflow: {
            nodes: [
                { type: 'chatTrigger', name: '接收咨询', description: '接收客户消息' },
                { type: 'llmChain', name: '问题分类', description: '分类问题类型' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 分类' },
                { type: 'switch', name: '路由分发', description: '根据类型路由' },
                { type: 'llmChain', name: '技术支持', description: '技术问题处理' },
                { type: 'llmChain', name: '销售咨询', description: '销售问题处理' },
                { type: 'llmChain', name: '账单问题', description: '账单问题处理' }
            ],
            connections: [
                { source: 'chatTrigger', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'llmChain', target: 'switch' },
                { source: 'switch', target: 'llmChain' },
                { source: 'switch', target: 'llmChain' },
                { source: 'switch', target: 'llmChain' }
            ]
        },
        explanation: '使用 LLM 分析客户咨询的问题类型（技术、销售、账单等），然后路由到对应的专门处理流程。'
    },

    // 12. 数据可视化
    {
        id: 'data-visualization',
        category: 'data-analysis',
        prompt: '分析销售数据，识别趋势并生成可视化报告',
        techniques: [FlowiseTechnique.DATA_ANALYSIS, FlowiseTechnique.DATA_TRANSFORMATION],
        workflow: {
            nodes: [
                { type: 'scheduleTrigger', name: '定时触发', description: '每周一执行' },
                { type: 'sqlDatabase', name: '查询数据库', description: '查询销售数据' },
                { type: 'llmChain', name: '趋势分析', description: '分析销售趋势' },
                { type: 'chatOpenAI', name: 'OpenAI 模型', description: '使用 GPT-4 分析' },
                { type: 'chartGenerator', name: '生成图表', description: '生成可视化图表' },
                { type: 'htmlOutput', name: 'HTML 报告', description: '生成完整报告' },
                { type: 'gmail', name: '发送报告', description: '邮件发送报告' }
            ],
            connections: [
                { source: 'scheduleTrigger', target: 'sqlDatabase' },
                { source: 'sqlDatabase', target: 'llmChain' },
                { source: 'chatOpenAI', target: 'llmChain' },
                { source: 'llmChain', target: 'chartGenerator' },
                { source: 'chartGenerator', target: 'htmlOutput' },
                { source: 'htmlOutput', target: 'gmail' }
            ]
        },
        explanation: '定时查询销售数据库，使用 LLM 分析趋势和洞察，生成可视化图表和 HTML 报告，自动发送给管理层。'
    }
]

/**
 * 根据技术类别获取相关示例
 */
export function getExamplesByTechniques(techniques: FlowiseTechnique[], limit: number = 3): WorkflowExample[] {
    // 计算每个示例与目标技术的重叠度
    const scored = examplesLibrary.map((example) => {
        const overlap = example.techniques.filter((t) => techniques.includes(t)).length
        const score = overlap / Math.max(example.techniques.length, techniques.length)
        return { example, score }
    })

    // 按重叠度排序并返回 top-k
    return scored
        .filter((s) => s.score > 0) // 至少有一个技术重叠
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.example)
}

/**
 * 根据类别获取示例
 */
export function getExamplesByCategory(category: string): WorkflowExample[] {
    return examplesLibrary.filter((ex) => ex.category === category)
}

/**
 * 获取所有示例
 */
export function getAllExamples(): WorkflowExample[] {
    return examplesLibrary
}

/**
 * 根据 ID 获取示例
 */
export function getExampleById(id: string): WorkflowExample | undefined {
    return examplesLibrary.find((ex) => ex.id === id)
}
