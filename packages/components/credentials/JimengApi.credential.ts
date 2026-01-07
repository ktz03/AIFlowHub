import { INodeParams, INodeCredential } from '../src/Interface'

class JimengApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = '即梦AI API'
        this.name = 'jimengApi'
        this.version = 1.0
        this.description = '火山引擎即梦AI图片生成服务凭证'
        this.inputs = [
            {
                label: 'Access Key ID',
                name: 'accessKeyId',
                type: 'string',
                description: '火山引擎 Access Key ID'
            },
            {
                label: 'Secret Access Key',
                name: 'secretAccessKey',
                type: 'password',
                description: '火山引擎 Secret Access Key'
            }
        ]
    }
}

module.exports = { credClass: JimengApi }
