import { LLMService } from '../llm'
import * as fs from 'fs'
import * as path from 'path'

// 工作流意图接口
export interface WorkflowIntent {
    description: string // 用户原始描述
    category: 'chatbot' | 'rag' | 'agent' | 'automation' | 'data-analysis' | 'image-generation' | 'code-assistant' | 'other' // 工作流类型
    requirements: string[] // 功能需求列表
    suggestedNodes: string[] // 建议的节点类型
    confidence: number // 置信度 0-1
}

// Skills 配置接口
interface WorkflowPattern {
    name: string
    description: string
    keywords: string[]
    indicators: string[]
    requiredNodes: string[]
    optionalNodes: string[]
    confidence_boost: number
    complexity: string
    bestPractices: string[]
    aliases?: string[]
    negativeKeywords?: string[]
}

interface SkillsConfig {
    categories: Record<string, WorkflowPattern>
    fallback_rules: Array<{
        condition: string
        category: string
        confidence: number
        reason: string
    }>
}

// 意图分析器
export class IntentAnalyzer {
    private llmService: LLMService
    private skillsConfig: SkillsConfig | null = null

    constructor(llmService: LLMService) {
        this.llmService = llmService
        this.loadSkills()
    }

    /**
     * 加载 Skills 配置
     */
    private loadSkills(): void {
        try {
            // 尝试多个可能的路径
            const possiblePaths = [
                path.join(__dirname, 'skills', 'workflow-patterns.json'), // 编译后的路径
                path.join(__dirname, '..', '..', 'src', 'services', 'workflow-generator', 'skills', 'workflow-patterns.json'), // 源码路径
                path.join(process.cwd(), 'packages', 'server', 'src', 'services', 'workflow-generator', 'skills', 'workflow-patterns.json') // 绝对路径
            ]

            for (const skillsPath of possiblePaths) {
                if (fs.existsSync(skillsPath)) {
                    const content = fs.readFileSync(skillsPath, 'utf-8')
                    this.skillsConfig = JSON.parse(content)
                    console.log('[IntentAnalyzer] Skills 配置加载成功，路径:', skillsPath)
                    return
                }
            }

            console.warn('[IntentAnalyzer] Skills 配置文件不存在，尝试的路径:', possiblePaths)
            console.warn('[IntentAnalyzer] 使用默认配置')
        } catch (error) {
            console.error('[IntentAnalyzer] 加载 Skills 配置失败:', error)
        }
    }

    /**
     * 获取增强的 System Prompt（使用 Skills 知识）
     */
    private getEnhancedSystemPrompt(): string {
        if (!this.skillsConfig) {
            return this.getDefaultSystemPrompt()
        }

        const categories = Object.entries(this.skillsConfig.categories)
            .map(([key, pattern]) => {
                return `- ${key}: ${pattern.description}
  关键词: ${pattern.keywords.join(', ')}
  必需节点: ${pattern.requiredNodes.join(', ')}
  复杂度: ${pattern.complexity}`
            })
            .join('\n\n')

        const bestPractices = Object.entries(this.skillsConfig.categories)
            .map(([key, pattern]) => {
                return `${key} 最佳实践:\n${pattern.bestPractices.map((p) => `  - ${p}`).join('\n')}`
            })
            .join('\n\n')

        return `你是一个 AI 工作流专家，负责分析用户的需求并识别他们想要创建的工作流类型。

# 工作流类型（基于 Claude Skills Registry 知识库）

${categories}

# 最佳实践指南

${bestPractices}

# 输出格式

请分析用户描述，返回 JSON 格式的结果：
{
  "category": "工作流类型",
  "requirements": ["需求1", "需求2", ...],
  "suggestedNodes": ["建议的节点类型1", "建议的节点类型2", ...],
  "confidence": 0.95
}

# Few-shot 示例

示例 1:
用户: "创建一个客服机器人"
输出: {
  "category": "chatbot",
  "requirements": ["对话交互", "客服问答", "多轮对话"],
  "suggestedNodes": ["ChatDeepseek", "BufferMemory", "ConversationChain"],
  "confidence": 0.95
}

示例 2:
用户: "我想做一个文档问答系统"
输出: {
  "category": "rag",
  "requirements": ["文档检索", "知识库问答", "语义搜索"],
  "suggestedNodes": ["DocumentLoader", "VectorStore", "RetrievalQAChain", "ChatDeepseek"],
  "confidence": 0.90
}

示例 3:
用户: "帮我生成代码"
输出: {
  "category": "code-assistant",
  "requirements": ["代码生成", "编程辅助"],
  "suggestedNodes": ["ChatDeepseek", "ConversationChain"],
  "confidence": 0.92
}

示例 4:
用户: "生成一张图片"
输出: {
  "category": "image-generation",
  "requirements": ["图片生成", "AI 绘画"],
  "suggestedNodes": ["JimengImageGen"],
  "confidence": 0.95
}

示例 5:
用户: "分析 CSV 数据"
输出: {
  "category": "data-analysis",
  "requirements": ["数据加载", "数据分析", "结果展示"],
  "suggestedNodes": ["CSVLoader", "DataAnalyzer", "ChatDeepseek"],
  "confidence": 0.88
}`
    }

    /**
     * 获取默认 System Prompt（无 Skills）
     */
    private getDefaultSystemPrompt(): string {
        return `你是一个 AI 工作流专家，负责分析用户的需求并识别他们想要创建的工作流类型。

工作流类型包括：
- chatbot: 聊天机器人，用于对话交互、客服问答
- rag: 检索增强生成，用于基于知识库的问答、文档检索
- agent: AI 智能体，具有工具调用和多步推理能力
- automation: 自动化流程，用于任务自动化、批处理
- data-analysis: 数据分析，用于数据处理、报表生成、可视化
- image-generation: 图片生成，用于 AI 绘画、图片处理
- code-assistant: 代码助手，用于代码生成、代码解释、编程辅助
- other: 其他类型

请分析用户描述，返回 JSON 格式的结果。`
    }

    async analyze(userDescription: string): Promise<WorkflowIntent> {
        // 需求变更：意图分析改为纯规则匹配，不再依赖 LLM。
        return this.fallbackAnalysis(userDescription)
    }

    /**
     * 增强的后备分析方法（使用 Skills 规则）
     */
    private fallbackAnalysis(description: string): WorkflowIntent {
        const lowerDesc = this.normalizeText(description)

        // If skills config is missing, fallback to simple deterministic rules.
        if (!this.skillsConfig) {
            return this.defaultFallbackAnalysis(lowerDesc, description)
        }

        const categoryScores: Record<string, number> = {}
        const matchedRequirements: Record<string, Set<string>> = {}
        const matchedNodes: Record<string, Set<string>> = {}
        const matchDetails: Record<string, { keywords: number; indicators: number; fallback: number }> = {}

        for (const [category, pattern] of Object.entries(this.skillsConfig.categories)) {
            categoryScores[category] = 0
            matchedRequirements[category] = new Set<string>()
            matchedNodes[category] = new Set<string>()
            matchDetails[category] = { keywords: 0, indicators: 0, fallback: 0 }
            this.applyPatternScore(lowerDesc, category, pattern, categoryScores, matchedRequirements, matchedNodes, matchDetails)
        }

        // Add fallback rules as extra scoring signals instead of hard return.
        for (const rule of this.skillsConfig.fallback_rules) {
            if (!(rule.category in categoryScores)) continue
            if (this.matchCondition(lowerDesc, rule.condition)) {
                const inc = Math.max(0.08, Math.min(rule.confidence, 0.25))
                categoryScores[rule.category] += inc
                matchDetails[rule.category].fallback += 1
            }
        }

        this.applyConflictPenalty(lowerDesc, categoryScores)

        const ranked = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])
        const bestCategory = ranked[0]
        const second = ranked[1]
        if (!bestCategory || bestCategory[1] <= 0.1) {
            return this.defaultFallbackAnalysis(lowerDesc, description)
        }

        const [category, rawScore] = bestCategory
        const pattern = this.skillsConfig.categories[category]
        const confidence = this.normalizeScore(rawScore, lowerDesc, second?.[1] ?? 0)
        const requirements = Array.from(matchedRequirements[category]).slice(0, 4)
        const suggestedNodes = Array.from(matchedNodes[category])

        // If uncertainty is high, fallback to safe chatbot category.
        if (confidence < 0.58 && !requirements.length) {
            return this.defaultFallbackAnalysis(lowerDesc, description)
        }

        return {
            description,
            category: category as any,
            requirements: requirements.length ? requirements : pattern.indicators.slice(0, 2),
            suggestedNodes: suggestedNodes.length ? suggestedNodes : pattern.requiredNodes,
            confidence
        }
    }

    private applyPatternScore(
        lowerDesc: string,
        category: string,
        pattern: WorkflowPattern,
        categoryScores: Record<string, number>,
        matchedRequirements: Record<string, Set<string>>,
        matchedNodes: Record<string, Set<string>>,
        matchDetails: Record<string, { keywords: number; indicators: number; fallback: number }>
    ): void {
        const keywordPool = [...pattern.keywords, ...(pattern.aliases || [])]
        const keywordMatches = keywordPool.filter((kw) => this.containsTerm(lowerDesc, kw))
        const indicatorMatches = pattern.indicators.filter((ind) => this.containsTerm(lowerDesc, ind))
        const negated = this.hasNegationNearKeywords(lowerDesc, [...keywordMatches, ...indicatorMatches])
        const negativeHits = (pattern.negativeKeywords || []).filter((kw) => this.containsTerm(lowerDesc, kw))

        // Weighted scoring: keywords + indicators + synergy boost.
        categoryScores[category] += keywordMatches.length * 0.11
        categoryScores[category] += indicatorMatches.length * 0.15
        if (keywordMatches.length > 0 && indicatorMatches.length > 0) {
            categoryScores[category] += Math.min(pattern.confidence_boost, 0.2)
        }
        if (keywordMatches.length >= 2) {
            categoryScores[category] += 0.06
        }
        if (indicatorMatches.length >= 2) {
            categoryScores[category] += 0.07
        }
        if (negated) {
            categoryScores[category] = Math.max(0, categoryScores[category] - 0.18)
        }
        if (negativeHits.length > 0) {
            categoryScores[category] = Math.max(0, categoryScores[category] - Math.min(0.22, negativeHits.length * 0.1))
        }

        matchDetails[category].keywords = keywordMatches.length
        matchDetails[category].indicators = indicatorMatches.length

        for (const ind of indicatorMatches) {
            matchedRequirements[category].add(ind)
        }
        pattern.requiredNodes.forEach((n) => matchedNodes[category].add(n))
    }

    private hasNegationNearKeywords(lowerDesc: string, matchedTerms: string[]): boolean {
        if (!matchedTerms.length) return false
        const negationTerms = ['不', '不要', '不是', '无需', '无须', '非', 'no ', 'not ']
        return matchedTerms.some((term) => {
            const idx = lowerDesc.indexOf(term.toLowerCase())
            if (idx < 0) return false
            const windowStart = Math.max(0, idx - 6)
            const windowText = lowerDesc.slice(windowStart, idx)
            return negationTerms.some((neg) => windowText.includes(neg))
        })
    }

    private normalizeScore(rawScore: number, lowerDesc: string, secondScore: number): number {
        // Longer descriptions naturally hit more rules; compress score to stable confidence band.
        const lengthFactor = lowerDesc.length > 80 ? 0.94 : 1
        const adjusted = rawScore * lengthFactor
        const margin = Math.max(0, rawScore - secondScore)
        const marginBoost = Math.min(0.12, margin * 0.4)
        const normalized = 0.43 + Math.min(adjusted, 0.52) + marginBoost
        return Math.max(0.5, Math.min(0.97, Number(normalized.toFixed(2))))
    }

    /**
     * 匹配条件字符串
     */
    private matchCondition(text: string, condition: string): boolean {
        // Supports conditions like:
        // 1) 包含'A'或'B'或'C'
        // 2) 包含'A'和('B'或'C')
        // 3) 包含'A'
        const andParts = condition
            .split('和')
            .map((s) => s.trim())
            .filter(Boolean)
        if (!andParts.length) return false

        return andParts.every((part) => {
            const terms = Array.from(part.matchAll(/'([^']+)'/g))
                .map((m) => m[1])
                .filter(Boolean)
            if (!terms.length) return false
            return terms.some((term) => this.containsTerm(text, term))
        })
    }

    /**
     * 默认后备分析（无 Skills 配置时）
     */
    private defaultFallbackAnalysis(lowerDesc: string, description: string): WorkflowIntent {
        // 图片生成
        if (lowerDesc.includes('图片') || lowerDesc.includes('图像') || lowerDesc.includes('画') || lowerDesc.includes('image')) {
            return {
                description,
                category: 'image-generation',
                requirements: ['图片生成'],
                suggestedNodes: ['JimengImageGen'],
                confidence: 0.85
            }
        }

        // 代码助手
        if (lowerDesc.includes('代码') || lowerDesc.includes('编程') || lowerDesc.includes('code')) {
            return {
                description,
                category: 'code-assistant',
                requirements: ['代码生成', '编程辅助'],
                suggestedNodes: ['ChatDeepseek', 'ConversationChain'],
                confidence: 0.85
            }
        }

        // 文档问答/RAG
        if (lowerDesc.includes('文档') || lowerDesc.includes('知识库') || lowerDesc.includes('检索') || lowerDesc.includes('rag')) {
            return {
                description,
                category: 'rag',
                requirements: ['文档检索', '知识库问答'],
                suggestedNodes: ['DocumentLoader', 'VectorStore', 'ChatDeepseek'],
                confidence: 0.8
            }
        }

        // 数据分析
        if (lowerDesc.includes('数据') || lowerDesc.includes('分析') || lowerDesc.includes('csv') || lowerDesc.includes('excel')) {
            return {
                description,
                category: 'data-analysis',
                requirements: ['数据分析', '数据处理'],
                suggestedNodes: ['CSVLoader', 'ChatDeepseek'],
                confidence: 0.8
            }
        }

        // 默认：聊天机器人
        return {
            description,
            category: 'chatbot',
            requirements: ['对话交互'],
            suggestedNodes: ['ChatDeepseek', 'BufferMemory', 'ConversationChain'],
            confidence: 0.7
        }
    }

    private containsTerm(text: string, term: string): boolean {
        return text.includes(this.normalizeText(term))
    }

    private normalizeText(text: string): string {
        return (text || '')
            .toLowerCase()
            .replace(/[，。！？；：“”"'`~!@#$%^&*()_\-+=[\]{}|<>/?,.]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    }

    private applyConflictPenalty(text: string, scores: Record<string, number>): void {
        // If user explicitly asks for "工具调用/agent", reduce chatbot/rag misfires.
        const hasAgentSignal = /智能体|agent|工具调用|tool calling|function call|函数调用/.test(text)
        if (hasAgentSignal) {
            scores['agent'] += 0.08
            scores['chatbot'] = Math.max(0, scores['chatbot'] - 0.06)
        }

        // If user asks for data/report, suppress image-generation false positives from "图表/图".
        const hasDataSignal = /报表|统计|分析|dashboard|csv|excel/.test(text)
        if (hasDataSignal) {
            scores['data-analysis'] += 0.06
            scores['image-generation'] = Math.max(0, scores['image-generation'] - 0.08)
        }
    }
}
