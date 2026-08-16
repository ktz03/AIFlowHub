import { downloadImagesInParallel, ImageArtifact } from './imageUtils'

/**
 * 工具输出中的图片生成结果接口
 */
export interface ImageGenToolOutput {
    success: boolean
    taskId?: string
    imageUrls?: string[]
    error?: string
    message?: string
}

/**
 * 解析工具输出，提取图片 URL 并下载
 * @param toolOutput 工具返回的字符串
 * @param chatflowId 工作流 ID
 * @param chatId 会话 ID
 * @returns artifacts 数组
 */
export async function parseToolOutputForImages(toolOutput: string, chatflowId: string, chatId: string): Promise<ImageArtifact[]> {
    console.log('[parseToolOutputForImages] Starting to parse tool output')
    console.log('[parseToolOutputForImages] chatflowId:', chatflowId, 'chatId:', chatId)
    console.log('[parseToolOutputForImages] toolOutput (first 500 chars):', toolOutput.substring(0, 500))

    const artifacts: ImageArtifact[] = []

    // 尝试解析 JSON
    let parsedOutput: ImageGenToolOutput
    try {
        parsedOutput = JSON.parse(toolOutput)
        console.log('[parseToolOutputForImages] Successfully parsed JSON:', JSON.stringify(parsedOutput, null, 2))
    } catch (error) {
        // 不是 JSON 格式，返回空数组
        console.log('[parseToolOutputForImages] Not a valid JSON, returning empty array')
        return artifacts
    }

    // 检查是否包含 imageUrls 字段
    if (!parsedOutput.imageUrls || !Array.isArray(parsedOutput.imageUrls) || parsedOutput.imageUrls.length === 0) {
        console.log('[parseToolOutputForImages] No imageUrls found or empty array')
        return artifacts
    }

    const imageUrls = parsedOutput.imageUrls
    console.log(`[parseToolOutputForImages] Found ${imageUrls.length} image URLs:`, imageUrls)

    try {
        // 并行下载所有图片
        console.log('[parseToolOutputForImages] Starting parallel download...')
        const downloadedPaths = await downloadImagesInParallel(imageUrls, chatflowId, chatId)
        console.log(`[parseToolOutputForImages] Downloaded ${downloadedPaths.length} images:`, downloadedPaths)

        // 为每个成功下载的图片创建 artifact
        for (let i = 0; i < downloadedPaths.length; i++) {
            const path = downloadedPaths[i]
            const originalUrl = imageUrls[i]

            // 从路径推断图片类型
            const fileName = path.replace('FILE-STORAGE::', '')
            const ext = fileName.split('.').pop()?.toLowerCase()
            let type: 'png' | 'jpeg' | 'webp' = 'png'
            if (ext === 'jpeg' || ext === 'jpg') type = 'jpeg'
            else if (ext === 'webp') type = 'webp'

            const artifact: ImageArtifact = {
                type,
                data: path,
                metadata: {
                    originalUrl,
                    taskId: parsedOutput.taskId
                }
            }

            artifacts.push(artifact)
            console.log(`[parseToolOutputForImages] Created artifact ${i + 1}:`, artifact)
        }

        console.log(`[parseToolOutputForImages] Successfully created ${artifacts.length} image artifacts`)
    } catch (error: any) {
        console.error(`[parseToolOutputForImages] Error processing images: ${error.message}`)
        console.error(`[parseToolOutputForImages] Error stack:`, error.stack)
        // 即使出错也返回已成功的 artifacts
    }

    return artifacts
}

/**
 * 检查工具输出是否包含图片 URL
 * @param toolOutput 工具返回的字符串
 * @returns 是否包含图片 URL
 */
export function hasImageUrls(toolOutput: string): boolean {
    try {
        const parsed = JSON.parse(toolOutput)
        return parsed.imageUrls && Array.isArray(parsed.imageUrls) && parsed.imageUrls.length > 0
    } catch {
        return false
    }
}
