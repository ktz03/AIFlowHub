/**
 * 通用图片 URL 处理器
 *
 * 该模块提供平台级别的图片 URL 检测和 Markdown 转换功能，
 * 使得所有图片生成工具都能自动在聊天窗口中显示图片。
 */

// 简单的 logger 实现
const logger = {
    debug: (...args: any[]) => console.debug('[ImageUrlProcessor]', ...args),
    info: (...args: any[]) => console.log('[ImageUrlProcessor]', ...args),
    warn: (...args: any[]) => console.warn('[ImageUrlProcessor]', ...args),
    error: (...args: any[]) => console.error('[ImageUrlProcessor]', ...args)
}

/**
 * 处理配置
 */
export interface ProcessConfig {
    /** 是否启用自动转换 */
    enabled?: boolean
    /** 最大图片数量 */
    maxImages?: number
    /** 白名单域名 */
    allowedDomains?: string[]
    /** 图片尺寸配置 */
    imageSize?: {
        maxWidth?: number
        maxHeight?: number
    }
}

/**
 * 处理结果
 */
export interface ProcessResult {
    /** 处理后的文本 */
    text: string
    /** 检测到的图片 URL */
    detectedUrls: string[]
    /** 转换的图片数量 */
    convertedCount: number
    /** 是否发生了转换 */
    wasConverted: boolean
    /** 处理时间（毫秒） */
    processingTime: number
}

/**
 * 图片 URL 检测器
 *
 * 从文本中检测图片 URL，支持多种模式：
 * 1. 扩展名模式：.jpg、.png、.gif、.webp 等
 * 2. 域名模式：volcengineapi.com、cloudinary.com 等
 * 3. 过滤已在 Markdown 中的 URL
 */
export class ImageUrlDetector {
    private readonly imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
    private readonly imageDomains = [
        'volcengineapi.com',
        'visual.volcengineapi.com',
        'byteimg.com', // 字节跳动图片 CDN
        'p3-aiop-sign.byteimg.com', // 即梦 AI 签名图片
        'cloudinary.com',
        'res.cloudinary.com',
        'imgur.com',
        'i.imgur.com',
        'imagekit.io',
        'ik.imagekit.io',
        'oaidalleapiprodscus.blob.core.windows.net', // DALL-E
        'cdn.openai.com',
        'replicate.delivery', // Replicate/Stable Diffusion
        'pbxt.replicate.delivery'
    ]

    /**
     * 检测文本中的图片 URL
     * @param text 输入文本
     * @returns 检测到的图片 URL 数组
     */
    detectImageUrls(text: string): string[] {
        if (!text || typeof text !== 'string') {
            return []
        }

        const urls: string[] = []

        // 1. 检测扩展名模式
        const extPattern = new RegExp(`https?://[^\\s<>"]+\\.(${this.imageExtensions.join('|')})(?:[?#][^\\s<>"]*)?`, 'gi')
        const extMatches = text.match(extPattern)
        if (extMatches) {
            logger.info(`[ImageUrlDetector] Found ${extMatches.length} URLs by extension:`, extMatches)
            urls.push(...extMatches)
        }

        // 2. 检测域名模式
        for (const domain of this.imageDomains) {
            const escapedDomain = domain.replace(/\./g, '\\.')
            const domainPattern = new RegExp(`https?://[^\\s<>"]*${escapedDomain}[^\\s<>"]*`, 'gi')
            const domainMatches = text.match(domainPattern)
            if (domainMatches) {
                logger.info(`[ImageUrlDetector] Found ${domainMatches.length} URLs for domain ${domain}:`, domainMatches)
                urls.push(...domainMatches)
            }
        }

        // 3. 过滤已在 Markdown 中的 URL
        const markdownUrls = this.extractMarkdownImageUrls(text)
        if (markdownUrls.length > 0) {
            logger.info(`[ImageUrlDetector] Found ${markdownUrls.length} existing Markdown URLs:`, markdownUrls)
        }
        const filteredUrls = urls.filter((url) => !markdownUrls.includes(url))

        // 4. 去重
        const uniqueUrls = [...new Set(filteredUrls)]
        logger.info(`[ImageUrlDetector] Final unique URLs: ${uniqueUrls.length}`, uniqueUrls)

        return uniqueUrls
    }

    /**
     * 验证 URL 是否为有效的图片 URL
     * @param url 待验证的 URL
     * @returns 是否为有效图片 URL
     */
    isValidImageUrl(url: string): boolean {
        if (!url || typeof url !== 'string') {
            return false
        }

        try {
            const urlObj = new URL(url)

            // 检查协议
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                return false
            }

            // 检查扩展名
            const hasValidExtension = this.imageExtensions.some((ext) => urlObj.pathname.toLowerCase().includes(`.${ext}`))

            // 检查域名
            const hasValidDomain = this.imageDomains.some((domain) => urlObj.hostname.includes(domain))

            return hasValidExtension || hasValidDomain
        } catch (error) {
            return false
        }
    }

    /**
     * 提取 Markdown 中的图片 URL
     * @param text 文本
     * @returns Markdown 图片 URL 数组
     */
    private extractMarkdownImageUrls(text: string): string[] {
        const markdownPattern = /!\[.*?\]\((.*?)\)/g
        const matches = [...text.matchAll(markdownPattern)]
        return matches.map((m) => m[1])
    }
}

/**
 * Markdown 转换器
 *
 * 将图片 URL 转换为 Markdown 格式：![图片](url)
 */
export class MarkdownConverter {
    /**
     * 将图片 URL 转换为 Markdown 格式
     * @param text 原始文本
     * @param imageUrls 检测到的图片 URL
     * @returns 转换后的 Markdown 文本
     */
    convertToMarkdown(text: string, imageUrls: string[]): string {
        if (!text || !imageUrls || imageUrls.length === 0) {
            return text
        }

        let result = text
        logger.info('[MarkdownConverter] Starting conversion for', imageUrls.length, 'URLs')

        imageUrls.forEach((url, index) => {
            const altText = `图片${index + 1}`
            const markdown = `![${altText}](${url})`

            logger.info(`[MarkdownConverter] Converting URL ${index + 1}:`, url)
            logger.info(`[MarkdownConverter] To markdown:`, markdown)

            // 如果 URL 单独成行，替换为 Markdown
            const linePattern = new RegExp(`^${this.escapeRegExp(url)}$`, 'gm')
            if (linePattern.test(result)) {
                logger.info(`[MarkdownConverter] URL is on its own line, replacing`)
                result = result.replace(linePattern, markdown)
            }
            // 如果 URL 在行中但前后有空白，替换为 Markdown
            else {
                logger.info(`[MarkdownConverter] URL is inline, replacing with spaces`)
                const inlinePattern = new RegExp(`(\\s|^)${this.escapeRegExp(url)}(\\s|$)`, 'g')
                result = result.replace(inlinePattern, `$1${markdown}$2`)
            }
        })

        logger.info('[MarkdownConverter] Conversion complete. Result:', result.substring(0, 300))
        return result
    }

    /**
     * 检查文本是否已包含 Markdown 图片格式
     * @param text 待检查的文本
     * @returns 是否已包含 Markdown 图片
     */
    hasMarkdownImages(text: string): boolean {
        if (!text || typeof text !== 'string') {
            return false
        }

        const markdownPattern = /!\[.*?\]\(https?:\/\/[^\s)]+\)/
        return markdownPattern.test(text)
    }

    /**
     * 转义正则表达式特殊字符
     * @param str 字符串
     * @returns 转义后的字符串
     */
    private escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
}

/**
 * 工具输出后处理器
 *
 * 统一处理所有工具的输出，自动检测并转换图片 URL 为 Markdown 格式
 */
export class ToolOutputPostProcessor {
    private detector: ImageUrlDetector
    private converter: MarkdownConverter
    private defaultConfig: ProcessConfig = {
        enabled: true,
        maxImages: 10,
        allowedDomains: ['*'], // * 表示允许所有域名
        imageSize: {
            maxWidth: 800,
            maxHeight: 600
        }
    }

    constructor(config?: ProcessConfig) {
        this.detector = new ImageUrlDetector()
        this.converter = new MarkdownConverter()
        if (config) {
            this.defaultConfig = { ...this.defaultConfig, ...config }
        }
    }

    /**
     * 处理工具输出
     * @param output 原始工具输出
     * @param config 配置选项（可选）
     * @returns 处理后的输出
     */
    process(output: string, config?: ProcessConfig): string {
        const startTime = Date.now()

        try {
            logger.info('[ToolOutputPostProcessor] Starting to process output:', output.substring(0, 200))

            // 合并配置
            const finalConfig = { ...this.defaultConfig, ...config }

            // 如果禁用，直接返回
            if (finalConfig.enabled === false) {
                logger.info('[ToolOutputPostProcessor] Processing disabled')
                return output
            }

            // 如果输入无效，直接返回
            if (!output || typeof output !== 'string') {
                logger.info('[ToolOutputPostProcessor] Invalid output')
                return output || ''
            }

            // 如果已经包含 Markdown 图片，直接返回
            if (this.converter.hasMarkdownImages(output)) {
                logger.info('[ToolOutputPostProcessor] Output already contains Markdown images, skipping')
                return output
            }

            // 检测图片 URL
            let imageUrls = this.detector.detectImageUrls(output)
            logger.info(`[ToolOutputPostProcessor] Detected ${imageUrls.length} image URLs:`, imageUrls)

            if (imageUrls.length === 0) {
                logger.info('[ToolOutputPostProcessor] No image URLs detected')
                return output
            }

            // 应用白名单过滤
            if (finalConfig.allowedDomains && !finalConfig.allowedDomains.includes('*')) {
                imageUrls = imageUrls.filter((url) => {
                    try {
                        const urlObj = new URL(url)
                        return finalConfig.allowedDomains!.some((domain) => urlObj.hostname.includes(domain))
                    } catch {
                        return false
                    }
                })
                logger.info(`[ToolOutputPostProcessor] After whitelist filter: ${imageUrls.length} URLs`)
            }

            // 应用数量限制
            if (finalConfig.maxImages && imageUrls.length > finalConfig.maxImages) {
                logger.warn(`[ToolOutputPostProcessor] Detected ${imageUrls.length} images, limiting to ${finalConfig.maxImages}`)
                imageUrls = imageUrls.slice(0, finalConfig.maxImages)
            }

            if (imageUrls.length === 0) {
                logger.info('[ToolOutputPostProcessor] No URLs after filtering')
                return output
            }

            // 转换为 Markdown
            const result = this.converter.convertToMarkdown(output, imageUrls)
            logger.info('[ToolOutputPostProcessor] Converted result:', result.substring(0, 200))

            const processingTime = Date.now() - startTime
            logger.info(`[ToolOutputPostProcessor] Processed ${imageUrls.length} images in ${processingTime}ms`)

            return result
        } catch (error: any) {
            const processingTime = Date.now() - startTime
            logger.error(`[ToolOutputPostProcessor] Processing failed after ${processingTime}ms:`, error.message, error.stack)
            // 失败时返回原始输出，不影响正常流程
            return output
        }
    }

    /**
     * 处理工具输出（带详细结果）
     * @param output 原始工具输出
     * @param config 配置选项（可选）
     * @returns 处理结果
     */
    processWithResult(output: string, config?: ProcessConfig): ProcessResult {
        const startTime = Date.now()

        try {
            const finalConfig = { ...this.defaultConfig, ...config }

            if (finalConfig.enabled === false || !output || typeof output !== 'string') {
                return {
                    text: output || '',
                    detectedUrls: [],
                    convertedCount: 0,
                    wasConverted: false,
                    processingTime: Date.now() - startTime
                }
            }

            if (this.converter.hasMarkdownImages(output)) {
                return {
                    text: output,
                    detectedUrls: [],
                    convertedCount: 0,
                    wasConverted: false,
                    processingTime: Date.now() - startTime
                }
            }

            let imageUrls = this.detector.detectImageUrls(output)

            if (imageUrls.length === 0) {
                return {
                    text: output,
                    detectedUrls: [],
                    convertedCount: 0,
                    wasConverted: false,
                    processingTime: Date.now() - startTime
                }
            }

            // 应用过滤和限制
            if (finalConfig.allowedDomains && !finalConfig.allowedDomains.includes('*')) {
                imageUrls = imageUrls.filter((url) => {
                    try {
                        const urlObj = new URL(url)
                        return finalConfig.allowedDomains!.some((domain) => urlObj.hostname.includes(domain))
                    } catch {
                        return false
                    }
                })
            }

            if (finalConfig.maxImages && imageUrls.length > finalConfig.maxImages) {
                imageUrls = imageUrls.slice(0, finalConfig.maxImages)
            }

            const result = this.converter.convertToMarkdown(output, imageUrls)

            return {
                text: result,
                detectedUrls: imageUrls,
                convertedCount: imageUrls.length,
                wasConverted: imageUrls.length > 0,
                processingTime: Date.now() - startTime
            }
        } catch (error: any) {
            return {
                text: output,
                detectedUrls: [],
                convertedCount: 0,
                wasConverted: false,
                processingTime: Date.now() - startTime
            }
        }
    }
}

// 导出单例实例
export const toolOutputPostProcessor = new ToolOutputPostProcessor()
