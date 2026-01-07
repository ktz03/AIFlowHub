import { INodeCredential, INodeParams } from '../src/Interface'

class ZhipuAIApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = '智谱 AI API'
        this.name = 'zhipuAIApi'
        this.version = 1.0
        this.description = '智谱 AI GLM 系列模型 API 密钥，获取地址: https://open.bigmodel.cn/'
        this.inputs = [
            {
                label: 'API Key',
                name: 'zhipuApiKey',
                type: 'password',
                description: '智谱 AI 平台的 API Key'
            }
        ]
    }
}

module.exports = { credClass: ZhipuAIApi }
