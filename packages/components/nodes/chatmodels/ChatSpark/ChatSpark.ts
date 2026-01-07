import { BaseCache } from '@langchain/core/caches'
import { BaseChatModel, BaseChatModelParams } from '@langchain/core/language_models/chat_models'
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatResult, ChatGeneration } from '@langchain/core/outputs'
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import crypto from 'crypto'
import WebSocket from 'ws'

/**
 * 讯飞星火大模型
 * 参考: https://www.xfyun.cn/doc/spark/Web.html
 */

interface SparkConfig {
    appId: string
    apiKey: string
    apiSecret: string
    model: string
    temperature?: number
    maxTokens?: number
    topK?: number
}

class ChatSparkModel extends BaseChatModel {
    private config: SparkConfig

    constructor(config: SparkConfig & BaseChatModelParams) {
        super(config)
        this.config = config
    }

    _llmType(): string {
        return 'spark'
    }

    async _generate(
        messages: BaseMessage[],
        _options: this['ParsedCallOptions'],
        _runManager?: CallbackManagerForLLMRun
    ): Promise<ChatResult> {
        const url = this.getWebSocketUrl()
        const requestData = this.buildRequestData(messages)

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url)
            let fullContent = ''

            ws.on('open', () => {
                ws.send(JSON.stringify(requestData))
            })

            ws.on('message', (data: Buffer) => {
                const response = JSON.parse(data.toString())
                if (response.header.code !== 0) {
                    reject(new Error(`Spark API Error: ${response.header.message}`))
                    ws.close()
                    return
                }

                const content = response.payload?.choices?.text?.[0]?.content || ''
                fullContent += content

                if (response.header.status === 2) {
                    ws.close()
                    const generation: ChatGeneration = {
                        text: fullContent,
                        message: new AIMessage(fullContent)
                    }
                    resolve({ generations: [generation] })
                }
            })

            ws.on('error', (error) => {
                reject(error)
            })

            ws.on('close', () => {
                if (!fullContent) {
                    reject(new Error('WebSocket closed without response'))
                }
            })
        })
    }

    private getWebSocketUrl(): string {
        const host = 'spark-api.xf-yun.com'
        const path = this.getApiPath()
        const date = new Date().toUTCString()

        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
        const signature = crypto.createHmac('sha256', this.config.apiSecret).update(signatureOrigin).digest('base64')

        const authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
        const authorization = Buffer.from(authorizationOrigin).toString('base64')

        return `wss://${host}${path}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`
    }

    private getApiPath(): string {
        const modelPaths: Record<string, string> = {
            'spark-lite': '/v1.1/chat',
            'spark-v2': '/v2.1/chat',
            'spark-pro': '/v3.1/chat',
            'spark-max': '/v3.5/chat',
            'spark-ultra': '/v4.0/chat'
        }
        return modelPaths[this.config.model] || '/v3.5/chat'
    }

    private getDomain(): string {
        const domains: Record<string, string> = {
            'spark-lite': 'lite',
            'spark-v2': 'generalv2',
            'spark-pro': 'generalv3',
            'spark-max': 'generalv3.5',
            'spark-ultra': '4.0Ultra'
        }
        return domains[this.config.model] || 'generalv3.5'
    }

    private buildRequestData(messages: BaseMessage[]) {
        const text = messages.map((msg) => {
            if (msg instanceof SystemMessage) {
                return { role: 'system', content: msg.content }
            } else if (msg instanceof HumanMessage) {
                return { role: 'user', content: msg.content }
            } else if (msg instanceof AIMessage) {
                return { role: 'assistant', content: msg.content }
            }
            return { role: 'user', content: String(msg.content) }
        })

        return {
            header: { app_id: this.config.appId },
            parameter: {
                chat: {
                    domain: this.getDomain(),
                    temperature: this.config.temperature ?? 0.5,
                    max_tokens: this.config.maxTokens ?? 4096,
                    top_k: this.config.topK ?? 4
                }
            },
            payload: { message: { text } }
        }
    }
}

class ChatSpark_ChatModels implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = '讯飞星火'
        this.name = 'chatSpark'
        this.version = 1.0
        this.type = 'chatSpark'
        this.icon = 'spark.svg'
        this.category = 'Chat Models'
        this.description = '讯飞星火大语言模型'
        this.baseClasses = [this.type, ...getBaseClasses(ChatSparkModel)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['sparkApi']
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model',
                name: 'modelName',
                type: 'options',
                options: [
                    { label: 'Spark Lite', name: 'spark-lite' },
                    { label: 'Spark V2.0', name: 'spark-v2' },
                    { label: 'Spark Pro', name: 'spark-pro' },
                    { label: 'Spark Max', name: 'spark-max' },
                    { label: 'Spark Ultra', name: 'spark-ultra' }
                ],
                default: 'spark-max'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.5,
                optional: true
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                default: 4096,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top K',
                name: 'topK',
                type: 'number',
                step: 1,
                default: 4,
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const modelName = nodeData.inputs?.modelName as string
        const temperature = nodeData.inputs?.temperature as string
        const maxTokens = nodeData.inputs?.maxTokens as string
        const topK = nodeData.inputs?.topK as string
        const cache = nodeData.inputs?.cache as BaseCache

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const appId = getCredentialParam('sparkAppId', credentialData, nodeData)
        const apiKey = getCredentialParam('sparkApiKey', credentialData, nodeData)
        const apiSecret = getCredentialParam('sparkApiSecret', credentialData, nodeData)

        const config: SparkConfig & BaseChatModelParams = {
            appId,
            apiKey,
            apiSecret,
            model: modelName,
            temperature: temperature ? parseFloat(temperature) : 0.5,
            maxTokens: maxTokens ? parseInt(maxTokens, 10) : 4096,
            topK: topK ? parseInt(topK, 10) : 4
        }

        if (cache) config.cache = cache

        return new ChatSparkModel(config)
    }
}

module.exports = { nodeClass: ChatSpark_ChatModels }
