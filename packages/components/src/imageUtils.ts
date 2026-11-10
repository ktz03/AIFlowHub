import { addSingleFileToStorage } from './storageUtils'

/**
 * 图片类型
 */
export type ImageType = 'png' | 'jpeg' | 'webp'

/**
 * 图片 Artifact 接口
 */
export interface ImageArtifact {
    type: ImageType
    data: string // FILE-STORAGE::filename 格式
    metadata?: {
        originalUrl?: string
        taskId?: string
        width?: number
        height?: number
    }
}

/**
 * 从 Content-Type 或 URL 推断图片类型
 * @param url 图片 URL
 * @param contentType Content-Type 头
 * @returns 图片类型
 */
export function inferImageType(url: string, contentType?: string): ImageType {
    // 优先从 Content-Type 推断
    if (contentType) {
        const lowerContentType = contentType.toLowerCase()
        if (lowerContentType.includes('png')) return 'png'
        if (lowerContentType.includes('jpeg') || lowerContentType.includes('jpg')) return 'jpeg'
        if (lowerContentType.includes('webp')) return 'webp'
    }

    // 从 URL 扩展名推断
    const urlLower = url.toLowerCase()
    const ext = urlLower.split('.').pop()?.split('?')[0] // 移除查询参数
    if (ext === 'png') return 'png'
    if (ext === 'jpg' || ext === 'jpeg') return 'jpeg'
    if (ext === 'webp') return 'webp'

    // 默认返回 png
    return 'png'
}

/**
 * 生成唯一的图片文件名
 * @param index 图片索引
 * @param type 图片类型
 * @returns 文件名
 */
export function generateImageFileName(index: number, type: ImageType): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    return `image_${timestamp}_${index}_${random}.${type}`
}

/**
 * 从 URL 下载图片并存储到本地
 * @param imageUrl 图片 URL
 * @param chatflowId 工作流 ID
 * @param chatId 会话 ID
 * @param index 图片索引（用于生成文件名）
 * @param timeout 下载超时时间（毫秒），默认 30 秒
 * @param maxRetries 最大重试次数，默认 3 次
 * @param retryDelay 重试延迟（毫秒），默认 2 秒
 * @returns FILE-STORAGE:: 格式的路径
 */
export async function downloadImageFromUrl(
    imageUrl: string,
    chatflowId: string,
    chatId: string,
    index: number = 0,
    timeout: number = 30000,
    maxRetries: number = 3,
    retryDelay: number = 2000
): Promise<string> {
    // 验证 URL 格式
    let url: URL
    try {
        url = new URL(imageUrl)
    } catch (error) {
        throw new Error(`Invalid image URL: ${imageUrl}`)
    }

    // 安全检查：仅允许 http 和 https 协议
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`Unsupported protocol: ${url.protocol}. Only http and https are allowed.`)
    }

    // 安全检查：防止 SSRF 攻击，阻止访问内网 IP
    const hostname = url.hostname.toLowerCase()
    const privateIPPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./, // Link-local
        /^::1$/, // IPv6 localhost
        /^fe80:/i, // IPv6 link-local
        /^fc00:/i, // IPv6 unique local
        /^fd00:/i // IPv6 unique local
    ]

    if (privateIPPatterns.some((pattern) => pattern.test(hostname))) {
        throw new Error(`Access to private IP addresses is not allowed: ${hostname}`)
    }

    let lastError: Error | null = null

    // 重试机制
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // 如果不是第一次尝试，等待一段时间
        if (attempt > 0) {
            console.log(`[ImageUtils] Retry attempt ${attempt}/${maxRetries} for ${imageUrl}`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }

        // 创建 AbortController 用于超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
            // 下载图片
            const response = await fetch(imageUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'AIFlowHub/1.0'
                }
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            // 检查文件大小（最大 10MB）
            const contentLength = response.headers.get('content-length')
            const maxSize = 10 * 1024 * 1024 // 10MB
            if (contentLength && parseInt(contentLength) > maxSize) {
                throw new Error(`Image size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`)
            }

            // 获取 Content-Type
            const contentType = response.headers.get('content-type') || undefined

            // 推断图片类型
            const imageType = inferImageType(imageUrl, contentType)

            // 获取图片数据
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // 检查实际大小
            if (buffer.length > maxSize) {
                throw new Error(`Image size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`)
            }

            // 检查是否是有效的图片数据（简单检查：大小不能太小）
            if (buffer.length < 100) {
                throw new Error(`Downloaded data is too small (${buffer.length} bytes), might be a placeholder or error page`)
            }

            // 生成文件名
            const fileName = generateImageFileName(index, imageType)

            // 确定 MIME 类型
            const mimeType = contentType || `image/${imageType}`

            // 存储文件
            const storagePath = await addSingleFileToStorage(mimeType, buffer, fileName, chatflowId, chatId)

            console.log(`[ImageUtils] Successfully downloaded image from ${imageUrl} (${buffer.length} bytes)`)
            return storagePath
        } catch (error: any) {
            clearTimeout(timeoutId)
            lastError = error

            if (error.name === 'AbortError') {
                lastError = new Error(`Image download timeout after ${timeout}ms: ${imageUrl}`)
            }

            // 如果是最后一次尝试，抛出错误
            if (attempt === maxRetries) {
                break
            }

            // 否则记录错误并继续重试
            console.warn(`[ImageUtils] Download attempt ${attempt + 1} failed: ${error.message}`)
        }
    }

    // 所有重试都失败了
    throw new Error(`Failed to download image from ${imageUrl} after ${maxRetries + 1} attempts: ${lastError?.message}`)
}

/**
 * 并行下载多张图片
 * @param urls 图片 URL 数组
 * @param chatflowId 工作流 ID
 * @param chatId 会话 ID
 * @param maxConcurrent 最大并发数，默认 10
 * @returns 成功下载的图片路径数组
 */
export async function downloadImagesInParallel(
    urls: string[],
    chatflowId: string,
    chatId: string,
    maxConcurrent: number = 10
): Promise<string[]> {
    const results: string[] = []
    const errors: Array<{ index: number; url: string; error: string }> = []

    // 限制并发数
    const chunks: string[][] = []
    for (let i = 0; i < urls.length; i += maxConcurrent) {
        chunks.push(urls.slice(i, i + maxConcurrent))
    }

    // 逐批处理
    for (const chunk of chunks) {
        const promises = chunk.map(async (url) => {
            const globalIndex = urls.indexOf(url)
            try {
                const path = await downloadImageFromUrl(url, chatflowId, chatId, globalIndex)
                return { success: true, path, index: globalIndex }
            } catch (error: any) {
                return {
                    success: false,
                    error: error.message,
                    url,
                    index: globalIndex
                }
            }
        })

        const chunkResults = await Promise.all(promises)

        for (const result of chunkResults) {
            if (result.success && 'path' in result && result.path) {
                results.push(result.path)
            } else if (!result.success && 'error' in result && result.url && result.error) {
                errors.push({
                    index: result.index,
                    url: result.url,
                    error: result.error
                })
                console.error(`Failed to download image ${result.index} from ${result.url}: ${result.error}`)
            }
        }
    }

    // 记录错误但不中断流程
    if (errors.length > 0) {
        console.warn(`${errors.length} out of ${urls.length} images failed to download`)
    }

    return results
}
