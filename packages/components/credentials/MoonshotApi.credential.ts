import { INodeCredential, INodeParams } from '../src/Interface'

class MoonshotApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Moonshot AI API (Kimi)'
        this.name = 'moonshotApi'
        this.version = 1.0
        this.description = '月之暗面 Kimi 模型 API 密钥，获取地址: https://platform.moonshot.cn/'
        this.inputs = [
            {
                label: 'API Key',
                name: 'moonshotApiKey',
                type: 'password',
                description: 'Moonshot AI 平台的 API Key'
            }
        ]
    }
}

module.exports = { credClass: MoonshotApi }
