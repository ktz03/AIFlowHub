import { BaseCache } from '@langchain/core/caches'
import { ChatOpenAI, ChatOpenAIFields } from '@langchain/openai'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import crypto from 'crypto'

/**
 * 腾讯混元大模型节点
 * 参考: https://cloud.tencent.com/document/product/1729
 * 腾讯混元提供兼容 OpenAI 的 API 接口
 */
class ChatHunyuan_ChatModels implements INode {
    readonly baseURL: string = 'https://api.hunyuan.cloud.tencent.com/v1'
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
        this.label = '腾讯混元'
        this.name = 'chatHunyuan'
        this.version = 1.0
        this.type = 'chatHunyuan'
        this.icon = 'hunyuan.svg'
        this.category = 'Chat Models'
        this.description = '腾讯混元大语言模型'
        this.baseClasses = [this.type, ...getBaseClasses(ChatOpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['hunyuanApi']
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
                    { label: 'hunyuan-lite', name: 'hunyuan-lite' },
                    { label: 'hunyuan-standard', name: 'hunyuan-standard' },
                    { label: 'hunyuan-standard-256K', name: 'hunyuan-standard-256K' },
                    { label: 'hunyuan-pro', name: 'hunyuan-pro' },
                    { label: 'hunyuan-turbo', name: 'hunyuan-turbo' },
                    { label: 'hunyuan-turbo-latest', name: 'hunyuan-turbo-latest' }
                ],
                default: 'hunyuan-lite'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.7,
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
        const secretId = getCredentialParam('hunyuanSecretId', credentialData, nodeData)
        const secretKey = getCredentialParam('hunyuanSecretKey', credentialData, nodeData)

        // 生成腾讯云 API 签名作为 Bearer Token
        const token = this.generateToken(secretId, secretKey)

        const obj: ChatOpenAIFields = {
            temperature: temperature ? parseFloat(temperature) : 0.7,
            modelName,
            openAIApiKey: token,
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

    /**
     * 生成腾讯云混元 API Token
     * 格式: SecretId:Timestamp:Signature
     */
    private generateToken(secretId: string, secretKey: string): string {
        const timestamp = Math.floor(Date.now() / 1000)
        const expireTime = timestamp + 86400 // 24小时有效期
        const signStr = `${secretId}${timestamp}${expireTime}`
        const signature = crypto.createHmac('sha256', secretKey).update(signStr).digest('hex')
        return `${secretId}:${timestamp}:${expireTime}:${signature}`
    }
}

module.exports = { nodeClass: ChatHunyuan_ChatModels }
