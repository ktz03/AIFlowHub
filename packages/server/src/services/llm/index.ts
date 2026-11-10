import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// LLM 配置接口
export interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'deepseek'
    apiKey: string
    model?: string
    temperature?: number
    maxTokens?: number
}

// LLM 响应接口
export interface LLMResponse {
    content: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
}

// 统一的 LLM 服务类
export class LLMService {
    private config: LLMConfig

    constructor(config: LLMConfig) {
        this.config = config
    }

    async chat(messages: Array<{ role: string; content: string }>): Promise<LLMResponse> {
        switch (this.config.provider) {
            case 'openai':
            case 'deepseek':
                return this.chatOpenAI(messages)
            case 'anthropic':
                return this.chatAnthropic(messages)
            default:
                throw new Error(`Unsupported LLM provider: ${this.config.provider}`)
        }
    }

    private async chatOpenAI(messages: Array<{ role: string; content: string }>): Promise<LLMResponse> {
        const client = new OpenAI({
            apiKey: this.config.apiKey,
            baseURL: this.config.provider === 'deepseek' ? 'https://api.deepseek.com' : undefined
        })

        const response = await client.chat.completions.create({
            model: this.config.model || (this.config.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4'),
            messages: messages as any,
            temperature: this.config.temperature || 0.7,
            max_tokens: this.config.maxTokens || 2000
        })

        return {
            content: response.choices[0]?.message?.content || '',
            usage: {
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0
            }
        }
    }

    private async chatAnthropic(messages: Array<{ role: string; content: string }>): Promise<LLMResponse> {
        const client = new Anthropic({
            apiKey: this.config.apiKey
        })

        // 转换消息格式
        const systemMessage = messages.find((m) => m.role === 'system')
        const userMessages = messages.filter((m) => m.role !== 'system')

        const response = await client.messages.create({
            model: this.config.model || 'claude-3-5-sonnet-20241022',
            max_tokens: this.config.maxTokens || 2000,
            temperature: this.config.temperature || 0.7,
            system: systemMessage?.content,
            messages: userMessages as any
        })

        const content = response.content[0]
        return {
            content: content.type === 'text' ? content.text : '',
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens
            }
        }
    }
}

// 工厂函数
export function createLLMService(config: LLMConfig): LLMService {
    return new LLMService(config)
}
