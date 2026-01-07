import { INodeCredential, INodeParams } from '../src/Interface'

class HunyuanApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = '腾讯混元 API'
        this.name = 'hunyuanApi'
        this.version = 1.0
        this.description = '腾讯混元大模型 API，获取地址: https://cloud.tencent.com/product/hunyuan'
        this.inputs = [
            {
                label: 'Secret ID',
                name: 'hunyuanSecretId',
                type: 'password',
                description: '腾讯云 SecretId'
            },
            {
                label: 'Secret Key',
                name: 'hunyuanSecretKey',
                type: 'password',
                description: '腾讯云 SecretKey'
            }
        ]
    }
}

module.exports = { credClass: HunyuanApi }
