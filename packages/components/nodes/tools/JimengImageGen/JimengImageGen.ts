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
    returnDirect = true // 直接返回工具输出，不经过 LLM 总结

    private signer: VolcengineSigner
    private size: number
    private width?: number
    private height?: number
    private aspectRatio?: string
    private scale: number
    private forceSingle: boolean

    constructor(
        accessKeyId: string,
        secretAccessKey: string,
        size = 4194304,
        scale = 0.5,
        forceSingle = true,
        width?: number,
        height?: number,
        aspectRatio?: string
    ) {
        super()
        this.signer = new VolcengineSigner(accessKeyId, secretAccessKey)
        this.size = size
        this.scale = scale
        this.forceSingle = forceSingle
        this.width = width
        this.height = height
        this.aspectRatio = aspectRatio
    }

    async _call(prompt: string): Promise<string> {
        try {
            // 提交生成任务
            const taskId = await this.submitTask(prompt)

            // 轮询获取结果
            const result = await this.pollResult(taskId)

            const imageUrls = result.image_urls || []

            console.log('[JimengImageGen] Generated image URLs:', imageUrls)

            if (imageUrls.length === 0) {
                return '图片生成失败：未获取到图片URL'
            }

            // Best-effort: detect actual image dimensions for debugging mismatches
            const expected = this.width && this.height ? { width: this.width, height: this.height } : undefined
            const detectedDims: Array<{ url: string; width?: number; height?: number; note?: string }> = []
            for (const url of imageUrls.slice(0, 3)) {
                try {
                    const dim = await detectImageDimensions(url)
                    detectedDims.push({ url, ...dim })
                } catch (e: any) {
                    detectedDims.push({ url, note: e?.message || 'detect failed' })
                }
            }

            // 直接返回 Markdown 格式，不依赖后端处理器
            let response = '图片生成成功！\n\n'
            imageUrls.forEach((url: string, index: number) => {
                const markdown = `![图片${index + 1}](${url})`
                console.log(`[JimengImageGen] Adding markdown for image ${index + 1}:`, markdown)
                response += markdown + '\n\n'
            })

            if (expected) {
                const mismatch = detectedDims.find(
                    (d) => d.width && d.height && (d.width !== expected.width || d.height !== expected.height)
                )
                const diagLines = detectedDims
                    .map((d, i) => {
                        const wh = d.width && d.height ? `${d.width}x${d.height}` : 'unknown'
                        const note = d.note ? ` (${d.note})` : ''
                        return `- 图片${i + 1}: ${wh}${note}`
                    })
                    .join('\n')
                response += `期望尺寸: ${expected.width}x${expected.height}\n实际尺寸(检测):\n${diagLines}\n\n`
                if (mismatch) {
                    response += `⚠️ 检测到实际尺寸与选择不一致。即梦接口可能忽略了 width/height/aspect_ratio 参数或需要使用不同字段/req_json 结构。\n\n`
                }
            }

            const finalResponse = response.trim()
            console.log('[JimengImageGen] Final response length:', finalResponse.length)
            console.log('[JimengImageGen] Final response:', finalResponse)

            return finalResponse
        } catch (error: any) {
            console.error('[JimengImageGen] Error:', error)
            return `图片生成失败：${error.message || '未知错误'}`
        }
    }

    private async submitTask(prompt: string): Promise<string> {
        const query = {
            Action: 'CVSync2AsyncSubmitTask',
            Version: '2022-08-31'
        }

        const baseBodyObj: Record<string, any> = {
            req_key: 'jimeng_t2i_v40',
            prompt,
            size: this.size,
            scale: this.scale,
            seed: -1
        }

        if (this.forceSingle) {
            baseBodyObj.force_single = true
        }

        const trySubmit = async (bodyObj: Record<string, any>) => {
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

            return await response.json()
        }

        // Prefer explicit width/height/aspectRatio when provided, and fallback to legacy "size" only if API rejects.
        const hasExplicitSize =
            Number.isFinite(this.width) && Number.isFinite(this.height) && (this.width as number) > 0 && (this.height as number) > 0
        if (hasExplicitSize) {
            const bodyObjWithWH: Record<string, any> = { ...baseBodyObj, width: this.width, height: this.height }
            if (this.aspectRatio && this.aspectRatio !== 'smart') {
                bodyObjWithWH.aspect_ratio = this.aspectRatio
            }
            const result1 = await trySubmit(bodyObjWithWH)
            if (result1?.code === 10000) return result1.data.task_id
            console.warn('[JimengImageGen] Submit with width/height rejected, will try req_json style then fallback. Response:', result1)

            // Some Volcengine visual APIs expect parameters inside req_json
            const reqJsonObj: Record<string, any> = {
                prompt,
                scale: this.scale,
                seed: -1,
                width: this.width,
                height: this.height
            }
            if (this.aspectRatio && this.aspectRatio !== 'smart') reqJsonObj.aspect_ratio = this.aspectRatio

            const bodyObjWithReqJson: Record<string, any> = {
                req_key: 'jimeng_t2i_v40',
                req_json: JSON.stringify(reqJsonObj)
            }
            if (this.forceSingle) bodyObjWithReqJson.force_single = true
            const result2 = await trySubmit(bodyObjWithReqJson)
            if (result2?.code === 10000) return result2.data.task_id
            console.warn('[JimengImageGen] Submit with req_json rejected, fallback to size only. Response:', result2)
        }

        const result = await trySubmit(baseBodyObj)
        if (result?.code !== 10000) {
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

type AspectRatioKey = 'smart' | '21:9' | '16:9' | '3:2' | '4:3' | '1:1' | '3:4' | '2:3' | '9:16'
type QualityKey = '2k' | '4k'

const SIZE_PRESETS: Record<QualityKey, Record<AspectRatioKey, { width: number; height: number }>> = {
    '2k': {
        smart: { width: 2048, height: 2048 },
        '21:9': { width: 3072, height: 1344 },
        '16:9': { width: 2688, height: 1536 },
        '3:2': { width: 2496, height: 1664 },
        '4:3': { width: 2304, height: 1728 },
        '1:1': { width: 2048, height: 2048 },
        '3:4': { width: 1728, height: 2304 },
        '2:3': { width: 1664, height: 2496 },
        '9:16': { width: 1536, height: 2688 }
    },
    '4k': {
        smart: { width: 4096, height: 4096 },
        '21:9': { width: 4096, height: 1792 },
        '16:9': { width: 4096, height: 2304 },
        '3:2': { width: 3840, height: 2560 },
        '4:3': { width: 3584, height: 2688 },
        '1:1': { width: 4096, height: 4096 },
        '3:4': { width: 2688, height: 3584 },
        '2:3': { width: 2560, height: 3840 },
        '9:16': { width: 2304, height: 4096 }
    }
}

const LEGACY_RESOLUTION_TO_QUALITY: Record<string, QualityKey> = {
    '1048576': '2k',
    '4194304': '2k',
    '16777216': '4k'
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
        this.version = 1.1
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
                label: '选择比例',
                name: 'aspectRatio',
                type: 'options',
                options: [
                    { label: '智能', name: 'smart' },
                    { label: '21:9', name: '21:9' },
                    { label: '16:9', name: '16:9' },
                    { label: '3:2', name: '3:2' },
                    { label: '4:3', name: '4:3' },
                    { label: '1:1', name: '1:1' },
                    { label: '3:4', name: '3:4' },
                    { label: '2:3', name: '2:3' },
                    { label: '9:16', name: '9:16' }
                ],
                default: 'smart',
                description: '图片宽高比例，支持横图、方图和竖图。'
            },
            {
                label: '选择分辨率',
                name: 'quality',
                type: 'options',
                options: [
                    { label: '高清 2K', name: '2k' },
                    { label: '超清 4K', name: '4k' }
                ],
                default: '2k',
                description: '分辨率档位。默认 2K，4K 生成时间更长。'
            },
            {
                label: '宽度 (W)',
                name: 'width',
                type: 'number',
                optional: true,
                default: 0,
                description: '可选：手动覆盖宽度像素。留空时按比例与分辨率自动计算。'
            },
            {
                label: '高度 (H)',
                name: 'height',
                type: 'number',
                optional: true,
                default: 0,
                description: '可选：手动覆盖高度像素。留空时按比例与分辨率自动计算。'
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
        const aspectRatioInput = (nodeData.inputs?.aspectRatio as string) || 'smart'
        const qualityInput = (nodeData.inputs?.quality as string) || '2k'
        const legacyResolution = (nodeData.inputs?.resolution as string) || '4194304'
        const widthInput = parseInt(nodeData.inputs?.width as string)
        const heightInput = parseInt(nodeData.inputs?.height as string)
        const scale = parseFloat(nodeData.inputs?.scale as string) || 0.5
        const forceSingle = nodeData.inputs?.forceSingle !== false

        const quality = (
            qualityInput === '2k' || qualityInput === '4k' ? qualityInput : LEGACY_RESOLUTION_TO_QUALITY[legacyResolution] || '2k'
        ) as QualityKey
        const aspectRatio = (Object.keys(SIZE_PRESETS[quality]).includes(aspectRatioInput) ? aspectRatioInput : 'smart') as AspectRatioKey

        const hasManualSize = Number.isFinite(widthInput) && Number.isFinite(heightInput) && widthInput > 0 && heightInput > 0
        const selectedSize = hasManualSize ? { width: widthInput, height: heightInput } : SIZE_PRESETS[quality][aspectRatio]
        const resolution = selectedSize.width * selectedSize.height

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const accessKeyId = getCredentialParam('accessKeyId', credentialData, nodeData)
        const secretAccessKey = getCredentialParam('secretAccessKey', credentialData, nodeData)

        return new JimengImageGenTool(
            accessKeyId,
            secretAccessKey,
            resolution,
            scale,
            forceSingle,
            selectedSize.width,
            selectedSize.height,
            aspectRatio
        )
    }
}

module.exports = { nodeClass: JimengImageGen_Tools }

async function detectImageDimensions(url: string): Promise<{ width?: number; height?: number }> {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
    const buf = new Uint8Array(await res.arrayBuffer())
    // PNG
    if (
        buf.length >= 24 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
    ) {
        // IHDR chunk starts at byte 8+8, width/height at 16/20 big-endian
        const width = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19]
        const height = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23]
        return { width, height }
    }
    // JPEG (baseline)
    if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
        let offset = 2
        while (offset + 9 < buf.length) {
            if (buf[offset] !== 0xff) break
            const marker = buf[offset + 1]
            const length = (buf[offset + 2] << 8) | buf[offset + 3]
            // SOF0/SOF2
            if (marker === 0xc0 || marker === 0xc2) {
                const height = (buf[offset + 5] << 8) | buf[offset + 6]
                const width = (buf[offset + 7] << 8) | buf[offset + 8]
                return { width, height }
            }
            offset += 2 + length
        }
    }
    return {}
}
