import { BaseCache } from '@langchain/core/caches'
import { ChatOpenAI, ChatOpenAIFields } from '@langchain/openai'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

/**
 * 智谱 AI GLM 模型节点
 * 参考: https://open.bigmodel.cn/dev/api
 * 智谱 AI 提供兼容 OpenAI 的 API 接口
 */
class ChatZhipuAI_ChatModels implements INode {
    readonly baseURL: string = 'https://open.bigmodel.cn/api/paas/v4'
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
        this.label = '智谱 GLM'
        this.name = 'chatZhipuAI'
        this.version = 1.0
        this.type = 'chatZhipuAI'
        this.icon = 'zhipu.svg'
        this.category = 'Chat Models'
        this.description = '智谱 AI GLM 系列大语言模型，支持 GLM-4、GLM-3-Turbo 等'
        this.baseClasses = [this.type, ...getBaseClasses(ChatOpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['zhipuAIApi']
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
                    { label: 'GLM-4-Plus', name: 'glm-4-plus' },
                    { label: 'GLM-4-0520', name: 'glm-4-0520' },
                    { label: 'GLM-4-Air', name: 'glm-4-air' },
                    { label: 'GLM-4-AirX', name: 'glm-4-airx' },
                    { label: 'GLM-4-Long', name: 'glm-4-long' },
                    { label: 'GLM-4-Flash', name: 'glm-4-flash' },
                    { label: 'GLM-4', name: 'glm-4' },
                    { label: 'GLM-3-Turbo', name: 'glm-3-turbo' }
                ],
                default: 'glm-4-flash'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.7,
                optional: true,
                description: '控制生成文本的随机性，值越高越随机'
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
                additionalParams: true,
                description: '生成的最大 token 数量'
            },
            {
                label: 'Top P',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true,
                description: '核采样参数'
            },
            {
                label: 'Stop Sequence',
                name: 'stopSequence',
                type: 'string',
                rows: 4,
                optional: true,
                description: '停止词列表，用逗号分隔',
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const temperature = nodeData.inputs?.temperature as string
        const modelName = nodeData.inputs?.modelName as string
        const maxTokens = nodeData.inputs?.maxTokens as string
        const topP = nodeData.inputs?.topP as string
        const stopSequence = nodeData.inputs?.stopSequence as string
        const streaming = nodeData.inputs?.streaming as boolean
        const cache = nodeData.inputs?.cache as BaseCache

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const zhipuApiKey = getCredentialParam('zhipuApiKey', credentialData, nodeData)

        const obj: ChatOpenAIFields = {
            temperature: temperature ? parseFloat(temperature) : 0.7,
            modelName,
            openAIApiKey: zhipuApiKey,
            streaming: streaming ?? true
        }

        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (cache) obj.cache = cache
        if (stopSequence) {
            obj.stop = stopSequence.split(',').map((item) => item.trim())
        }

        const model = new ChatOpenAI({
            ...obj,
            configuration: {
                baseURL: this.baseURL
            }
        })
        return model
    }
}

module.exports = { nodeClass: ChatZhipuAI_ChatModels }
