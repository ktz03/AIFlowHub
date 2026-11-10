/**
 * 图片 URL 处理器单元测试
 */

import { ImageUrlDetector, MarkdownConverter, ToolOutputPostProcessor } from './imageUrlProcessor'

describe('ImageUrlDetector', () => {
    let detector: ImageUrlDetector

    beforeEach(() => {
        detector = new ImageUrlDetector()
    })

    test('should detect image URLs with extensions', () => {
        const text = 'Check this image: https://example.com/cat.jpg and this one: https://example.com/dog.png'
        const urls = detector.detectImageUrls(text)

        expect(urls).toContain('https://example.com/cat.jpg')
        expect(urls).toContain('https://example.com/dog.png')
        expect(urls).toHaveLength(2)
    })

    test('should detect volcengine image URLs', () => {
        const text = 'Image: https://visual.volcengineapi.com/tos-cn-i-xxx/image123'
        const urls = detector.detectImageUrls(text)

        expect(urls).toContain('https://visual.volcengineapi.com/tos-cn-i-xxx/image123')
        expect(urls).toHaveLength(1)
    })

    test('should not detect URLs already in Markdown', () => {
        const text = '![Image](https://example.com/cat.jpg)'
        const urls = detector.detectImageUrls(text)

        expect(urls).toHaveLength(0)
    })

    test('should detect multiple images', () => {
        const text = `
            Image 1: https://example.com/1.jpg
            Image 2: https://example.com/2.png
            Image 3: https://visual.volcengineapi.com/3.webp
        `
        const urls = detector.detectImageUrls(text)

        expect(urls.length).toBeGreaterThanOrEqual(3)
    })

    test('should handle empty input', () => {
        expect(detector.detectImageUrls('')).toEqual([])
        expect(detector.detectImageUrls(null as any)).toEqual([])
        expect(detector.detectImageUrls(undefined as any)).toEqual([])
    })

    test('should validate image URLs', () => {
        expect(detector.isValidImageUrl('https://example.com/image.jpg')).toBe(true)
        expect(detector.isValidImageUrl('https://visual.volcengineapi.com/image')).toBe(true)
        expect(detector.isValidImageUrl('http://example.com/image.png')).toBe(true)
        expect(detector.isValidImageUrl('ftp://example.com/image.jpg')).toBe(false)
        expect(detector.isValidImageUrl('not-a-url')).toBe(false)
        expect(detector.isValidImageUrl('')).toBe(false)
    })
})

describe('MarkdownConverter', () => {
    let converter: MarkdownConverter

    beforeEach(() => {
        converter = new MarkdownConverter()
    })

    test('should convert URLs to Markdown', () => {
        const text = 'Check this image: https://example.com/cat.jpg'
        const urls = ['https://example.com/cat.jpg']
        const result = converter.convertToMarkdown(text, urls)

        expect(result).toContain('![图片1](https://example.com/cat.jpg)')
    })

    test('should convert multiple URLs', () => {
        const text = `
            https://example.com/1.jpg
            https://example.com/2.png
        `
        const urls = ['https://example.com/1.jpg', 'https://example.com/2.png']
        const result = converter.convertToMarkdown(text, urls)

        expect(result).toContain('![图片1](https://example.com/1.jpg)')
        expect(result).toContain('![图片2](https://example.com/2.png)')
    })

    test('should preserve original text', () => {
        const text = 'Here is an image: https://example.com/cat.jpg and some text after'
        const urls = ['https://example.com/cat.jpg']
        const result = converter.convertToMarkdown(text, urls)

        expect(result).toContain('Here is an image:')
        expect(result).toContain('and some text after')
    })

    test('should detect existing Markdown images', () => {
        const text = '![Image](https://example.com/cat.jpg)'
        expect(converter.hasMarkdownImages(text)).toBe(true)

        const textWithoutMarkdown = 'https://example.com/cat.jpg'
        expect(converter.hasMarkdownImages(textWithoutMarkdown)).toBe(false)
    })

    test('should handle empty input', () => {
        expect(converter.convertToMarkdown('', [])).toBe('')
        expect(converter.convertToMarkdown('text', [])).toBe('text')
        expect(converter.hasMarkdownImages('')).toBe(false)
    })

    test('should be idempotent', () => {
        const text = 'Image: https://example.com/cat.jpg'
        const urls = ['https://example.com/cat.jpg']

        const result1 = converter.convertToMarkdown(text, urls)
        const result2 = converter.convertToMarkdown(result1, urls)

        // 第二次转换不应该再次转换已经是 Markdown 的内容
        expect(result1).toBe(result2)
    })
})

describe('ToolOutputPostProcessor', () => {
    let processor: ToolOutputPostProcessor

    beforeEach(() => {
        processor = new ToolOutputPostProcessor()
    })

    test('should process tool output with image URLs', () => {
        const output = 'Generated image: https://example.com/cat.jpg'
        const result = processor.process(output)

        expect(result).toContain('![图片1](https://example.com/cat.jpg)')
    })

    test('should not process if already Markdown', () => {
        const output = 'Generated image: ![Cat](https://example.com/cat.jpg)'
        const result = processor.process(output)

        expect(result).toBe(output)
    })

    test('should handle multiple images', () => {
        const output = `
            Image 1: https://example.com/1.jpg
            Image 2: https://example.com/2.png
        `
        const result = processor.process(output)

        expect(result).toContain('![图片1](https://example.com/1.jpg)')
        expect(result).toContain('![图片2](https://example.com/2.png)')
    })

    test('should respect maxImages config', () => {
        const output = `
            https://example.com/1.jpg
            https://example.com/2.jpg
            https://example.com/3.jpg
        `
        const result = processor.process(output, { maxImages: 2 })

        const markdownCount = (result.match(/!\[/g) || []).length
        expect(markdownCount).toBeLessThanOrEqual(2)
    })

    test('should handle disabled config', () => {
        const output = 'Image: https://example.com/cat.jpg'
        const result = processor.process(output, { enabled: false })

        expect(result).toBe(output)
    })

    test('should handle errors gracefully', () => {
        const output = 'Normal text without images'
        const result = processor.process(output)

        expect(result).toBe(output)
    })

    test('should handle empty input', () => {
        expect(processor.process('')).toBe('')
        expect(processor.process(null as any)).toBe('')
        expect(processor.process(undefined as any)).toBe('')
    })

    test('should return detailed result', () => {
        const output = 'Image: https://example.com/cat.jpg'
        const result = processor.processWithResult(output)

        expect(result.wasConverted).toBe(true)
        expect(result.convertedCount).toBe(1)
        expect(result.detectedUrls).toContain('https://example.com/cat.jpg')
        expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    test('should process volcengine URLs', () => {
        const output = 'Generated: https://visual.volcengineapi.com/tos-cn-i-xxx/image123'
        const result = processor.process(output)

        expect(result).toContain('![图片1](https://visual.volcengineapi.com/tos-cn-i-xxx/image123)')
    })

    test('should handle mixed content', () => {
        const output = `
            Here is the generated image:
            https://example.com/cat.jpg
            
            Hope you like it!
        `
        const result = processor.process(output)

        expect(result).toContain('Here is the generated image:')
        expect(result).toContain('![图片1](https://example.com/cat.jpg)')
        expect(result).toContain('Hope you like it!')
    })
})
