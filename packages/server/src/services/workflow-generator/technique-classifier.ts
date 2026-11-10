/**
 * 工作流技术分类系统
 * 参考 n8n AI Workflow Builder 的分类方法
 */

import { LLMService } from '../llm'

/**
 * Flowise 工作流技术类别
 * 基于 n8n 的 WorkflowTechnique，适配 Flowise 场景
 */
export enum FlowiseTechnique {
    CHATBOT = 'CHATBOT', // 对话机器人
    CONTENT_GENERATION = 'CONTENT_GENERATION', // 内容生成
    DOCUMENT_PROCESSING = 'DOCUMENT_PROCESSING', // 文档处理
    DATA_ANALYSIS = 'DATA_ANALYSIS', // 数据分析
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE', // 知识库
    AGENT = 'AGENT', // AI Agent
    SCRAPING_AND_RESEARCH = 'SCRAPING_AND_RESEARCH', // 数据抓取
    DATA_TRANSFORMATION = 'DATA_TRANSFORMATION', // 数据转换
    NOTIFICATION = 'NOTIFICATION', // 通知
    SCHEDULING = 'SCHEDULING', // 定时任务
    FORM_INPUT = 'FORM_INPUT', // 表单输入
    MONITORING = 'MONITORING', // 监控
    ENRICHMENT = 'ENRICHMENT', // 数据增强
    TRIAGE = 'TRIAGE', // 分类路由
    HUMAN_IN_THE_LOOP = 'HUMAN_IN_THE_LOOP' // 人工审核
}

/**
 * 技术类别描述
 */
export const TechniqueDescription: Record<FlowiseTechnique, string> = {
    [FlowiseTechnique.CHATBOT]: '对话机器人 - 接收和回复用户消息，支持上下文记忆',
    [FlowiseTechnique.CONTENT_GENERATION]: '内容生成 - 使用 AI 生成文本、图片、视频等内容',
    [FlowiseTechnique.DOCUMENT_PROCESSING]: '文档处理 - 加载、解析、提取 PDF、Word、Excel 等文档内容',
    [FlowiseTechnique.DATA_ANALYSIS]: '数据分析 - 分析、分类、识别模式、理解数据',
    [FlowiseTechnique.KNOWLEDGE_BASE]: '知识库 - 存储和检索信息用于问答，包括向量数据库',
    [FlowiseTechnique.AGENT]: 'AI Agent - 能够使用工具、进行推理和决策的智能代理',
    [FlowiseTechnique.SCRAPING_AND_RESEARCH]: '数据抓取 - 从外部 API、网站、社交媒体获取数据',
    [FlowiseTechnique.DATA_TRANSFORMATION]: '数据转换 - 转换数据格式、创建报告、重构数据结构',
    [FlowiseTechnique.NOTIFICATION]: '通知 - 发送邮件、消息、Slack 通知等',
    [FlowiseTechnique.SCHEDULING]: '定时任务 - 按计划定期执行工作流',
    [FlowiseTechnique.FORM_INPUT]: '表单输入 - 接收用户提交的表单数据',
    [FlowiseTechnique.MONITORING]: '监控 - 监听外部事件触发工作流（新记录、状态变化、Webhook）',
    [FlowiseTechnique.ENRICHMENT]: '数据增强 - 从外部源补充和丰富现有数据',
    [FlowiseTechnique.TRIAGE]: '分类路由 - 选择、优先级排序、路由、筛选项目',
    [FlowiseTechnique.HUMAN_IN_THE_LOOP]: '人工审核 - 工作流暂停等待人工批准、审核或输入'
}

/**
 * 技术分类示例（Few-shot）
 * 参考 n8n 的 14 个示例，适配 Flowise 场景
 */
export const classificationExamples = [
    {
        prompt: '创建一个客服机器人，能够回答产品相关问题',
        techniques: [FlowiseTechnique.CHATBOT, FlowiseTechnique.KNOWLEDGE_BASE]
    },
    {
        prompt: '生成营销文案并通过邮件发送给客户',
        techniques: [FlowiseTechnique.CONTENT_GENERATION, FlowiseTechnique.NOTIFICATION]
    },
    {
        prompt: '处理上传的 PDF 合同，提取客户信息并更新数据库',
        techniques: [FlowiseTechnique.DOCUMENT_PROCESSING, FlowiseTechnique.DATA_ANALYSIS, FlowiseTechnique.DATA_TRANSFORMATION]
    },
    {
        prompt: '分析客户反馈数据，生成情感分析报告',
        techniques: [FlowiseTechnique.DATA_ANALYSIS, FlowiseTechnique.DATA_TRANSFORMATION]
    },
    {
        prompt: '创建一个能够搜索网络并回答问题的 AI 助手',
        techniques: [FlowiseTechnique.AGENT, FlowiseTechnique.SCRAPING_AND_RESEARCH]
    },
    {
        prompt: '每天定时抓取竞品价格并生成对比报告',
        techniques: [FlowiseTechnique.SCHEDULING, FlowiseTechnique.SCRAPING_AND_RESEARCH, FlowiseTechnique.DATA_ANALYSIS]
    },
    {
        prompt: '接收表单提交，提取文件内容，等待人工审核后发送通知',
        techniques: [
            FlowiseTechnique.FORM_INPUT,
            FlowiseTechnique.DOCUMENT_PROCESSING,
            FlowiseTechnique.HUMAN_IN_THE_LOOP,
            FlowiseTechnique.NOTIFICATION
        ]
    },
    {
        prompt: '监控社交媒体提及，自动回复相关内容',
        techniques: [FlowiseTechnique.MONITORING, FlowiseTechnique.CHATBOT, FlowiseTechnique.CONTENT_GENERATION]
    },
    {
        prompt: '从多个数据源收集信息，用 LinkedIn 数据增强客户资料',
        techniques: [FlowiseTechnique.SCRAPING_AND_RESEARCH, FlowiseTechnique.ENRICHMENT]
    },
    {
        prompt: '构建内部知识库，从历史工单中提取信息供员工查询',
        techniques: [FlowiseTechnique.DOCUMENT_PROCESSING, FlowiseTechnique.KNOWLEDGE_BASE]
    },
    {
        prompt: '接收客户咨询，根据问题类型路由到不同的处理流程',
        techniques: [FlowiseTechnique.CHATBOT, FlowiseTechnique.TRIAGE]
    },
    {
        prompt: '分析销售数据，识别趋势并生成可视化报告',
        techniques: [FlowiseTechnique.DATA_ANALYSIS, FlowiseTechnique.DATA_TRANSFORMATION]
    }
]

/**
 * 技术分类澄清说明
 * 帮助 LLM 正确区分相似的技术类别
 */
export const techniqueClarifications = `
常见技术类别区分：

- **NOTIFICATION vs CHATBOT**: 
  使用 NOTIFICATION 当需要发送邮件/消息/通知（单向）。
  使用 CHATBOT 当需要接收并回复对话消息（双向）。

- **MONITORING vs SCHEDULING**: 
  使用 MONITORING 当工作流由外部事件触发（新记录、状态变化、Webhook）。
  使用 SCHEDULING 当工作流按时间计划定期执行。

- **SCRAPING_AND_RESEARCH vs DATA_ANALYSIS**: 
  使用 SCRAPING_AND_RESEARCH 当从外部源获取数据（API、网站、社交媒体）。
  使用 DATA_ANALYSIS 当分析已有的内部数据。

- **TRIAGE**: 
  使用当需要选择、优先级排序、路由或筛选项目（如"选择最佳"、"路由到正确团队"、"筛选潜在客户"）。

- **DOCUMENT_PROCESSING**: 
  使用于任何文件处理 - PDF、图片、视频、Excel、Word、音频文件、表单上传。

- **HUMAN_IN_THE_LOOP**: 
  使用当工作流需要暂停等待人工批准、审核、签署文档或任何手动输入后才能继续。

- **DATA_ANALYSIS**: 
  使用当需要分析、分类、识别模式或理解数据（如"分析结果"、"从历史学习"、"按类型分类"、"识别趋势"）。

- **KNOWLEDGE_BASE**: 
  使用当存储/检索数据用于问答 - 包括向量数据库、用作数据库的电子表格、文档集合。

- **DATA_TRANSFORMATION**: 
  使用当转换数据格式、从分析数据创建报告/摘要或重构输出。

技术选择规则：
- 选择所有适用的技术（大多数工作流使用 2-4 个）
- 只选择你确信适用的技术
`

/**
 * 格式化示例为 Few-shot 格式
 */
function formatExamples(): string {
    return classificationExamples.map((ex) => `- ${ex.prompt} → ${ex.techniques.join(', ')}`).join('\n')
}

/**
 * 格式化技术列表
 */
function formatTechniqueList(): string {
    return Object.entries(TechniqueDescription)
        .map(([key, description]) => `- **${key}**: ${description}`)
        .join('\n')
}

/**
 * 分类工作流技术
 */
export async function classifyWorkflow(description: string, llmService: LLMService): Promise<FlowiseTechnique[]> {
    const prompt = `
分析以下用户需求，识别所需的工作流技术类别。

<user_request>
${description}
</user_request>

<available_techniques>
${formatTechniqueList()}
</available_techniques>

<technique_clarifications>
${techniqueClarifications}
</technique_clarifications>

<example_categorizations>
${formatExamples()}
</example_categorizations>

选择所有适用的技术类别。大多数工作流使用 2-4 个类别。
只选择你确信适用的类别。如果需求模糊或不明确，不要提供技术类别。

以 JSON 数组格式返回技术类别：
["TECHNIQUE1", "TECHNIQUE2", ...]

只返回 JSON 数组，不要包含其他文本。
`

    try {
        const response = await llmService.chat([
            { role: 'system', content: 'You are a workflow technique classifier.' },
            { role: 'user', content: prompt }
        ])

        // 提取 JSON 数组
        const jsonMatch = response.content.match(/\[[\s\S]*?\]/)
        if (!jsonMatch) {
            console.warn('Failed to extract JSON from LLM response:', response.content)
            return []
        }

        const techniques = JSON.parse(jsonMatch[0]) as string[]

        // 验证技术类别
        const validTechniques = techniques.filter((t) => Object.values(FlowiseTechnique).includes(t as FlowiseTechnique))

        return validTechniques as FlowiseTechnique[]
    } catch (error) {
        console.error('Error classifying workflow:', error)
        return []
    }
}

/**
 * 根据技术类别获取相关示例
 */
export function getRelevantExamples(techniques: FlowiseTechnique[], limit: number = 3): typeof classificationExamples {
    // 计算每个示例与目标技术的重叠度
    const scored = classificationExamples.map((example) => {
        const overlap = example.techniques.filter((t) => techniques.includes(t)).length
        return { example, score: overlap }
    })

    // 按重叠度排序并返回 top-k
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.example)
}

/**
 * 获取技术类别的描述
 */
export function getTechniqueDescription(technique: FlowiseTechnique): string {
    return TechniqueDescription[technique] || ''
}

/**
 * 获取所有技术类别
 */
export function getAllTechniques(): FlowiseTechnique[] {
    return Object.values(FlowiseTechnique)
}
