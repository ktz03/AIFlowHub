import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import * as crypto from 'crypto'

/**
 * 火山引擎签名工具类
 * Region: cn-north-1, Service: cv
 */
class VolcengineSigner {
    private accessKeyId: string
    private secretAccessKey: string
    private region: string
    private service: string
    private host: string

    constructor(accessKeyId: string, secretAccessKey: string) {
        this.accessKeyId = accessKeyId
        this.secretAccessKey = secretAccessKey
        this.region = 'cn-north-1'
        this.service = 'cv'
        this.host = 'visual.volcengineapi.com'
    }

    private hmac(secret: string | Buffer, data: string): Buffer {
        return crypto.createHmac('sha256', secret).update(data, 'utf8').digest()
    }

    private hash(data: string): string {
        return crypto.createHash('sha256').update(data, 'utf8').digest('hex')
    }

    private getDateTimeNow(): string {
        return new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
    }

    private queryParamsToString(params: Record<string, string>): string {
        return Object.keys(params)
            .sort()
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&')
    }

    sign(method: string, query: Record<string, string>, body: string): { authorization: string; xDate: string } {
        const xDate = this.getDateTimeNow()
        const date = xDate.substring(0, 8)

        const signedHeaders = 'host;x-date'
        const canonicalHeaders = `host:${this.host}\nx-date:${xDate}`
        const bodyHash = this.hash(body)

        const canonicalRequest = [method, '/', this.queryParamsToString(query), canonicalHeaders + '\n', signedHeaders, bodyHash].join('\n')

        const credentialScope = `${date}/${this.region}/${this.service}/request`
        const stringToSign = ['HMAC-SHA256', xDate, credentialScope, this.hash(canonicalRequest)].join('\n')

        const kDate = this.hmac(this.secretAccessKey, date)
        const kRegion = this.hmac(kDate, this.region)
        const kService = this.hmac(kRegion, this.service)
        const kSigning = this.hmac(kService, 'request')
        const signature = this.hmac(kSigning, stringToSign).toString('hex')

        const authorization = `HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

        return { authorization, xDate }
    }

    getHost(): string {
        return this.host
    }
}

/**
 * 即梦AI图片生成工具 (即梦4.0)
 * 支持文生图、图像编辑及多图组合生成
 */
class JimengImageGenTool extends Tool {
    name = 'jimeng_image_generator'
    description = '即梦AI图片生成工具（即梦4.0），根据文本描述生成图片。支持中英文输入，可生成1K到4K分辨率图像。输入应该是图片的详细描述。'

    private signer: VolcengineSigner
    private size: number
    private scale: number
    private forceSingle: boolean

    constructor(accessKeyId: string, secretAccessKey: string, size = 4194304, scale = 0.5, forceSingle = true) {
        super()
        this.signer = new VolcengineSigner(accessKeyId, secretAccessKey)
        this.size = size
        this.scale = scale
        this.forceSingle = forceSingle
    }

    async _call(prompt: string): Promise<string> {
        try {
            // 提交生成任务
            const taskId = await this.submitTask(prompt)

            // 轮询获取结果
            const result = await this.pollResult(taskId)

            return JSON.stringify({
                success: true,
                taskId,
                imageUrls: result.image_urls || [],
                message: '图片生成成功'
            })
        } catch (error: any) {
            return JSON.stringify({
                success: false,
                error: error.message || '图片生成失败'
            })
        }
    }

    private async submitTask(prompt: string): Promise<string> {
        const query = {
            Action: 'CVSync2AsyncSubmitTask',
            Version: '2022-08-31'
        }

        const bodyObj: Record<string, any> = {
            req_key: 'jimeng_t2i_v40',
            prompt,
            size: this.size,
            scale: this.scale,
            seed: -1
        }

        if (this.forceSingle) {
            bodyObj.force_single = true
        }

        const body = JSON.stringify(bodyObj)
        const { authorization, xDate } = this.signer.sign('POST', query, body)

        const response = await fetch(`https://${this.signer.getHost()}/?${new URLSearchParams(query).toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Host: this.signer.getHost(),
                'X-Date': xDate,
                Authorization: authorization
            },
            body
        })

        const result = await response.json()

        if (result.code !== 10000) {
            throw new Error(`提交任务失败: ${result.message || JSON.stringify(result)}`)
        }

        return result.data.task_id
    }

    private async pollResult(taskId: string, maxAttempts = 120, interval = 3000): Promise<any> {
        const query = {
            Action: 'CVSync2AsyncGetResult',
            Version: '2022-08-31'
        }

        const bodyObj = {
            req_key: 'jimeng_t2i_v40',
            task_id: taskId,
            req_json: JSON.stringify({ return_url: true })
        }

        const body = JSON.stringify(bodyObj)

        for (let i = 0; i < maxAttempts; i++) {
            const { authorization, xDate } = this.signer.sign('POST', query, body)

            const response = await fetch(`https://${this.signer.getHost()}/?${new URLSearchParams(query).toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Host: this.signer.getHost(),
                    'X-Date': xDate,
                    Authorization: authorization
                },
                body
            })

            const result = await response.json()

            if (result.code !== 10000) {
                throw new Error(`查询结果失败: ${result.message || JSON.stringify(result)}`)
            }

            const status = result.data?.status
            if (status === 'done') {
                return result.data
            } else if (status === 'not_found' || status === 'expired') {
                throw new Error(`任务状态异常: ${status}`)
            }

            // in_queue 或 generating 状态，等待后重试
            await new Promise((resolve) => setTimeout(resolve, interval))
        }

        throw new Error('图片生成超时，请稍后重试')
    }
}

class JimengImageGen_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = '即梦AI图片生成'
        this.name = 'jimengImageGen'
        this.version = 1.0
        this.type = 'JimengImageGen'
        this.icon = 'jimeng.svg'
        this.category = 'Tools'
        this.description = '火山引擎即梦AI 4.0 图片生成工具，支持文生图、图像编辑，最高4K分辨率'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['jimengApi']
        }
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(Tool)]
        this.inputs = [
            {
                label: '图片分辨率',
                name: 'resolution',
                type: 'options',
                options: [
                    { label: '1K (1024x1024)', name: '1048576' },
                    { label: '2K (2048x2048) - 推荐', name: '4194304' },
                    { label: '4K (4096x4096)', name: '16777216' }
                ],
                default: '4194304',
                description: '生成图片的面积，建议使用2K以上分辨率'
            },
            {
                label: '文本影响程度',
                name: 'scale',
                type: 'number',
                step: 0.1,
                default: 0.5,
                optional: true,
                description: '文本描述影响程度，0-1之间，值越大文本影响越大'
            },
            {
                label: '强制单图输出',
                name: 'forceSingle',
                type: 'boolean',
                default: true,
                optional: true,
                description: '是否强制只生成1张图片，关闭后可能生成多张组图'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const resolution = parseInt(nodeData.inputs?.resolution as string) || 4194304
        const scale = parseFloat(nodeData.inputs?.scale as string) || 0.5
        const forceSingle = nodeData.inputs?.forceSingle !== false

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const accessKeyId = getCredentialParam('accessKeyId', credentialData, nodeData)
        const secretAccessKey = getCredentialParam('secretAccessKey', credentialData, nodeData)

        return new JimengImageGenTool(accessKeyId, secretAccessKey, resolution, scale, forceSingle)
    }
}

module.exports = { nodeClass: JimengImageGen_Tools }
