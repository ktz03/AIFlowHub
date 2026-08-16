import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { LLMResult } from '@langchain/core/outputs'
import { Serialized } from '@langchain/core/load/serializable'
import axios from 'axios'

/**
 * Token使用追踪回调处理器
 * 参考自 GitHub 优秀案例:
 * - KasarLabs/snak: token-tracking.ts
 * - cratas/langchain-explorer: token-usage-tracker.ts
 */

// Token估算常量
const TOKENS_PER_WORD = 1.3
const TOKENS_PER_SPECIAL_CHAR = 0.5
const TOKENS_PER_CHINESE_CHAR = 0.5

interface UsageData {
    userId?: string
    chatflowId?: string
    provider: string
    model: string
    inputTokens: number
    outputTokens: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
    latencyMs: number
    status: 'success' | 'failed'
    errorMessage?: string
}

interface TokenUsage {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
}

/**
 * 估算文本的token数量
 * 支持中英文混合文本
 */
export const estimateTokensFromText = (text: string): number => {
    if (!text) return 0

    // 检测中文字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    // 英文单词数
    const words = text.split(/\s+/).filter(Boolean).length
    // 特殊字符数
    const specialChars = (text.match(/[^a-zA-Z0-9\s\u4e00-\u9fa5]/g) || []).length

    // 中文按0.5 token/字符，英文按1.3 token/词
    const chineseTokens = chineseChars * TOKENS_PER_CHINESE_CHAR
    const englishTokens = (words - chineseChars) * TOKENS_PER_WORD
    const specialTokens = specialChars * TOKENS_PER_SPECIAL_CHAR

    return Math.ceil(Math.max(chineseTokens + englishTokens + specialTokens, 1))
}

/**
 * 从模型名称推断提供商
 */
export const inferProvider = (modelName: string): string => {
    const lowerModel = modelName.toLowerCase()
    if (lowerModel.includes('gpt') || lowerModel.includes('openai')) return 'openai'
    if (lowerModel.includes('claude')) return 'anthropic'
    if (lowerModel.includes('qwen') || lowerModel.includes('tongyi')) return 'alibaba'
    if (lowerModel.includes('ernie') || lowerModel.includes('wenxin')) return 'baidu'
    if (lowerModel.includes('glm') || lowerModel.includes('chatglm')) return 'zhipu'
    if (lowerModel.includes('spark')) return 'xunfei'
    if (lowerModel.includes('deepseek')) return 'deepseek'
    if (lowerModel.includes('llama')) return 'meta'
    if (lowerModel.includes('gemini')) return 'google'
    if (lowerModel.includes('mistral')) return 'mistral'
    if (lowerModel.includes('moonshot') || lowerModel.includes('kimi')) return 'moonshot'
    return 'unknown'
}

/**
 * 从LLM结果中提取token使用信息
 * 支持多种格式: OpenAI, Anthropic, 通用LangChain格式
 * 支持缓存 token 提取（DeepSeek 等模型）
 */
export const extractTokenUsage = (output: LLMResult): TokenUsage => {
    let promptTokens = 0
    let completionTokens = 0
    let totalTokens = 0
    let cacheReadTokens: number | undefined
    let cacheCreationTokens: number | undefined

    // 1. 尝试从 llmOutput.tokenUsage 获取 (OpenAI格式)
    if (output.llmOutput?.tokenUsage) {
        const usage = output.llmOutput.tokenUsage
        promptTokens = usage.promptTokens || 0
        completionTokens = usage.completionTokens || 0
        totalTokens = usage.totalTokens || promptTokens + completionTokens
        // 提取缓存相关 token（DeepSeek 等模型）
        cacheReadTokens = usage.cache_read_input_tokens
        cacheCreationTokens = usage.cache_creation_input_tokens
        return { promptTokens, completionTokens, totalTokens, cacheReadTokens, cacheCreationTokens }
    }

    // 2. 尝试从 llmOutput.usage 获取 (Anthropic格式)
    if (output.llmOutput?.usage) {
        const usage = output.llmOutput.usage
        promptTokens = usage.input_tokens || 0
        completionTokens = usage.output_tokens || 0
        totalTokens = promptTokens + completionTokens
        // Anthropic 也支持缓存
        cacheReadTokens = usage.cache_read_input_tokens
        cacheCreationTokens = usage.cache_creation_input_tokens
        return { promptTokens, completionTokens, totalTokens, cacheReadTokens, cacheCreationTokens }
    }

    // 3. 尝试从 generations[0][0].message.usage_metadata 获取
    if (output.generations?.[0]?.[0]) {
        const gen = output.generations[0][0] as any
        if (gen.message?.usage_metadata) {
            const usage = gen.message.usage_metadata
            promptTokens = usage.input_tokens || 0
            completionTokens = usage.output_tokens || 0
            totalTokens = usage.total_tokens || promptTokens + completionTokens
            cacheReadTokens = usage.cache_read_input_tokens
            cacheCreationTokens = usage.cache_creation_input_tokens
            return { promptTokens, completionTokens, totalTokens, cacheReadTokens, cacheCreationTokens }
        }

        // 4. 尝试从 response_metadata.tokenUsage 获取
        if (gen.message?.response_metadata?.tokenUsage) {
            const usage = gen.message.response_metadata.tokenUsage
            promptTokens = usage.promptTokens || 0
            completionTokens = usage.completionTokens || 0
            totalTokens = usage.totalTokens || promptTokens + completionTokens
            cacheReadTokens = usage.cache_read_input_tokens
            cacheCreationTokens = usage.cache_creation_input_tokens
            return { promptTokens, completionTokens, totalTokens, cacheReadTokens, cacheCreationTokens }
        }
    }

    return { promptTokens, completionTokens, totalTokens, cacheReadTokens, cacheCreationTokens }
}

/**
 * 使用统计回调处理器
 * 在LLM调用开始和结束时追踪token使用
 */
export class UsageTrackingHandler extends BaseCallbackHandler {
    name = 'usage_tracking_handler'

    private userId?: string
    private chatflowId?: string
    private baseURL: string
    private startTime: number = 0
    private promptText: string = ''
    private modelName: string = 'unknown'
    private provider: string = 'unknown'

    constructor(options: { userId?: string; chatflowId?: string; baseURL?: string }) {
        super()
        this.userId = options.userId
        this.chatflowId = options.chatflowId
        this.baseURL = options.baseURL || 'http://localhost:3000'
    }

    /**
     * LLM调用开始时触发
     */
    async handleLLMStart(
        llm: Serialized,
        prompts: string[],
        runId: string,
        parentRunId?: string,
        extraParams?: Record<string, unknown>
    ): Promise<void> {
        this.startTime = Date.now()
        this.promptText = prompts.join('\n')

        // 尝试从llm对象获取模型名称
        const llmId = llm.id || []
        this.modelName =
            (extraParams?.invocation_params as any)?.model ||
            (extraParams?.invocation_params as any)?.modelName ||
            llmId[llmId.length - 1] ||
            'unknown'

        this.provider = inferProvider(this.modelName)
    }

    /**
     * LLM调用结束时触发
     */
    async handleLLMEnd(output: LLMResult, runId: string): Promise<void> {
        const latencyMs = Date.now() - this.startTime

        // 提取token使用信息（包括缓存 token）
        let { promptTokens, completionTokens, totalTokens, cacheReadTokens, cacheCreationTokens } = extractTokenUsage(output)

        // 如果没有获取到token信息，使用估算
        if (totalTokens === 0) {
            promptTokens = estimateTokensFromText(this.promptText)

            // 从输出中提取文本进行估算
            let outputText = ''
            if (output.generations?.[0]?.[0]) {
                const gen = output.generations[0][0]
                outputText = gen.text || (gen as any).message?.content || ''
            }
            completionTokens = estimateTokensFromText(outputText)
            totalTokens = promptTokens + completionTokens
        }

        // 记录使用日志
        await this.logUsage({
            userId: this.userId,
            chatflowId: this.chatflowId,
            provider: this.provider,
            model: this.modelName,
            inputTokens: promptTokens,
            outputTokens: completionTokens,
            cacheReadTokens,
            cacheCreationTokens,
            latencyMs,
            status: 'success'
        })
    }

    /**
     * LLM调用出错时触发
     */
    async handleLLMError(err: Error, runId: string): Promise<void> {
        const latencyMs = Date.now() - this.startTime
        const promptTokens = estimateTokensFromText(this.promptText)

        await this.logUsage({
            userId: this.userId,
            chatflowId: this.chatflowId,
            provider: this.provider,
            model: this.modelName,
            inputTokens: promptTokens,
            outputTokens: 0,
            latencyMs,
            status: 'failed',
            errorMessage: err.message
        })
    }

    /**
     * 发送使用日志到服务器
     */
    private async logUsage(data: UsageData): Promise<void> {
        // 如果没有userId，跳过记录
        if (!data.userId) {
            return
        }

        try {
            await axios.post(`${this.baseURL}/api/v1/usage-stats/log`, data, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            })
        } catch (error) {
            // 静默失败，不影响主流程
            console.warn('[UsageTrackingHandler] Failed to log usage:', error)
        }
    }
}

/**
 * 创建使用统计回调处理器的工厂函数
 */
export const createUsageTrackingHandler = (options: { userId?: string; chatflowId?: string; baseURL?: string }): UsageTrackingHandler => {
    return new UsageTrackingHandler(options)
}

export default UsageTrackingHandler
