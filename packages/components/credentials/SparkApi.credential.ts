import { INodeCredential, INodeParams } from '../src/Interface'

class SparkApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = '讯飞星火 API'
        this.name = 'sparkApi'
        this.version = 1.0
        this.description = '讯飞星火大模型 API，获取地址: https://xinghuo.xfyun.cn/'
        this.inputs = [
            {
                label: 'App ID',
                name: 'sparkAppId',
                type: 'string',
                description: '讯飞开放平台 App ID'
            },
            {
                label: 'API Key',
                name: 'sparkApiKey',
                type: 'password',
                description: '讯飞开放平台 API Key'
            },
            {
                label: 'API Secret',
                name: 'sparkApiSecret',
                type: 'password',
                description: '讯飞开放平台 API Secret'
            }
        ]
    }
}

module.exports = { credClass: SparkApi }
