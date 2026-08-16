import { WorkflowIntent } from './intent-analyzer'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

// 模板匹配结果
export interface TemplateMatch {
    templateId: string
    name: string
    description: string
    category: string
    flowData: any
    similarity: number // 相似度 0-1
}

// 模板匹配器
export class TemplateMatcher {
    /**
     * 根据意图匹配最相似的模板
     */
    async findBestMatch(intent: WorkflowIntent): Promise<TemplateMatch | null> {
        try {
            const appServer = getRunningExpressApp()
            if (!appServer) {
                throw new Error('Express app not initialized')
            }

            // 获取所有公开模板
            const templates = await appServer.AppDataSource.getRepository('CustomTemplate')
                .createQueryBuilder('template')
                .where('template.isPublic = :isPublic', { isPublic: true })
                .andWhere('template.category = :category', { category: intent.category })
                .orderBy('template.useCount', 'DESC')
                .limit(10)
                .getMany()

            if (!templates || templates.length === 0) {
                return null
            }

            // 计算相似度并排序
            const matches: TemplateMatch[] = templates.map((template: any) => {
                const similarity = this.calculateSimilarity(intent, template)
                return {
                    templateId: template.id,
                    name: template.name,
                    description: template.description || '',
                    category: template.category,
                    flowData: template.flowData,
                    similarity
                }
            })

            // 按相似度排序
            matches.sort((a, b) => b.similarity - a.similarity)

            return matches[0] || null
        } catch (error) {
            console.error('模板匹配失败:', error)
            return null
        }
    }

    /**
     * 计算意图与模板的相似度
     */
    private calculateSimilarity(intent: WorkflowIntent, template: any): number {
        let score = 0

        // 1. 分类匹配 (40%)
        if (intent.category === template.category) {
            score += 0.4
        }

        // 2. 标签匹配 (30%)
        if (template.tags && Array.isArray(template.tags)) {
            const matchedTags = intent.requirements.filter((req) =>
                template.tags.some(
                    (tag: string) => req.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(req.toLowerCase())
                )
            )
            score += (matchedTags.length / Math.max(intent.requirements.length, 1)) * 0.3
        }

        // 3. 描述相似度 (20%)
        if (template.description) {
            const descWords = template.description.toLowerCase().split(/\s+/)
            const intentWords = intent.description.toLowerCase().split(/\s+/)
            const commonWords = descWords.filter((word: string) => intentWords.includes(word))
            score += (commonWords.length / Math.max(descWords.length, intentWords.length)) * 0.2
        }

        // 4. 使用次数加成 (10%)
        const useCountScore = Math.min(template.useCount / 100, 1) * 0.1
        score += useCountScore

        return Math.min(score, 1)
    }

    /**
     * 获取多个匹配的模板
     */
    async findMatches(intent: WorkflowIntent, limit: number = 5): Promise<TemplateMatch[]> {
        try {
            const appServer = getRunningExpressApp()
            if (!appServer) {
                throw new Error('Express app not initialized')
            }

            const templates = await appServer.AppDataSource.getRepository('CustomTemplate')
                .createQueryBuilder('template')
                .where('template.isPublic = :isPublic', { isPublic: true })
                .orderBy('template.useCount', 'DESC')
                .limit(20)
                .getMany()

            if (!templates || templates.length === 0) {
                return []
            }

            const matches: TemplateMatch[] = templates
                .map((template: any) => {
                    const similarity = this.calculateSimilarity(intent, template)
                    return {
                        templateId: template.id,
                        name: template.name,
                        description: template.description || '',
                        category: template.category,
                        flowData: template.flowData,
                        similarity
                    }
                })
                .filter((match) => match.similarity > 0.3) // 过滤低相似度
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)

            return matches
        } catch (error) {
            console.error('获取模板匹配失败:', error)
            return []
        }
    }
}
