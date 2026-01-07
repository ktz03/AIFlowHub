import * as fs from 'fs'
import * as path from 'path'

// 官方模板接口
export interface OfficialTemplate {
    id: string
    name: string
    description: string
    category: string
    type: string
    framework: string
    tags: string[]
    usecases: string[]
    author: string
    version: string
    isPublic: boolean
    isOfficial: boolean
    useCount: number
    likeCount: number
    viewCount: number
    requiredCredentials: string[]
    flowData: any
}

// 加载所有官方模板
export const loadOfficialTemplates = (): OfficialTemplate[] => {
    const templatesDir = path.join(__dirname)
    const templates: OfficialTemplate[] = []

    try {
        const files = fs.readdirSync(templatesDir)

        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(templatesDir, file)
                const content = fs.readFileSync(filePath, 'utf-8')
                const template = JSON.parse(content) as OfficialTemplate
                templates.push(template)
            }
        }
    } catch (error) {
        console.error('Error loading official templates:', error)
    }

    return templates
}

// 根据ID获取官方模板
export const getOfficialTemplateById = (id: string): OfficialTemplate | undefined => {
    const templates = loadOfficialTemplates()
    return templates.find((t) => t.id === id)
}

// 根据分类获取官方模板
export const getOfficialTemplatesByCategory = (category: string): OfficialTemplate[] => {
    const templates = loadOfficialTemplates()
    return templates.filter((t) => t.category === category)
}

// 搜索官方模板
export const searchOfficialTemplates = (keyword: string): OfficialTemplate[] => {
    const templates = loadOfficialTemplates()
    const lowerKeyword = keyword.toLowerCase()

    return templates.filter(
        (t) =>
            t.name.toLowerCase().includes(lowerKeyword) ||
            t.description.toLowerCase().includes(lowerKeyword) ||
            t.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword))
    )
}

export default {
    loadOfficialTemplates,
    getOfficialTemplateById,
    getOfficialTemplatesByCategory,
    searchOfficialTemplates
}
