import { BaseCache } from '@langchain/core/caches'
import { ChatOpenAI, ChatOpenAIFields } from '@langchain/openai'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

/**
 * Moonshot AI (Kimi) 模型节点
 * 参考: https://platform.moonshot.cn/docs/api-reference
 * Moonshot 提供兼容 OpenAI 的 API 接口
 */
class ChatMoonshot_ChatModels implements INode {
    readonly baseURL: string = 'https://api.moonshot.cn/v1'
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
        this.label = 'Kimi (Moonshot)'
        this.name = 'chatMoonshot'
        this.version = 1.0
        this.type = 'chatMoonshot'
        this.icon = 'moonshot.svg'
        this.category = 'Chat Models'
        this.description = '月之暗面 Kimi 大语言模型，支持超长上下文'
        this.baseClasses = [this.type, ...getBaseClasses(ChatOpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['moonshotApi']
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'options',
                options: [
                    { label: 'moonshot-v1-8k', name: 'moonshot-v1-8k' },
                    { label: 'moonshot-v1-32k', name: 'moonshot-v1-32k' },
                    { label: 'moonshot-v1-128k', name: 'moonshot-v1-128k' }
                ],
                default: 'moonshot-v1-8k',
                description: '8k/32k/128k 表示支持的上下文长度'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.3,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top P',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const temperature = nodeData.inputs?.temperature as string
        const modelName = nodeData.inputs?.modelName as string
        const maxTokens = nodeData.inputs?.maxTokens as string
        const topP = nodeData.inputs?.topP as string
        const streaming = nodeData.inputs?.streaming as boolean
        const cache = nodeData.inputs?.cache as BaseCache

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const moonshotApiKey = getCredentialParam('moonshotApiKey', credentialData, nodeData)

        const obj: ChatOpenAIFields = {
            temperature: temperature ? parseFloat(temperature) : 0.3,
            modelName,
            openAIApiKey: moonshotApiKey,
            streaming: streaming ?? true
        }

        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (cache) obj.cache = cache

        const model = new ChatOpenAI({
            ...obj,
            configuration: {
                baseURL: this.baseURL
            }
        })
        return model
    }
}

module.exports = { nodeClass: ChatMoonshot_ChatModels }
