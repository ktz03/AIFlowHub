import { INodeOptionsValue } from './Interface'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

const MASTER_MODEL_LIST = 'https://raw.githubusercontent.com/FlowiseAI/Flowise/main/packages/components/models.json'

export enum MODEL_TYPE {
    CHAT = 'chat',
    LLM = 'llm',
    EMBEDDING = 'embedding'
}

const getModelsJSONPath = (): string => {
    const checkModelsPaths = [path.join(__dirname, '..', 'models.json'), path.join(__dirname, '..', '..', 'models.json')]
    for (const checkPath of checkModelsPaths) {
        if (fs.existsSync(checkPath)) {
            return checkPath
        }
    }
    return ''
}

const isValidUrl = (urlString: string) => {
    let url
    try {
        url = new URL(urlString)
    } catch (e) {
        return false
    }
    return url.protocol === 'http:' || url.protocol === 'https:'
}

const getModelConfig = async (category: MODEL_TYPE, name: string) => {
    const modelFile = process.env.MODEL_LIST_CONFIG_JSON

    // 优先使用本地 models.json 文件，避免网络问题导致加载失败
    const localModelsPath = getModelsJSONPath()

    // 如果设置了环境变量且不是 URL，优先使用环境变量指定的文件
    if (modelFile && !isValidUrl(modelFile)) {
        try {
            if (fs.existsSync(modelFile)) {
                const models = await fs.promises.readFile(modelFile, 'utf8')
                if (models) {
                    const categoryModels = JSON.parse(models)[category]
                    return categoryModels.find((model: INodeOptionsValue) => model.name === name)
                }
            }
        } catch (e) {
            console.warn(`Failed to load models from ${modelFile}, falling back to local file`)
        }
    }

    // 优先使用本地文件
    if (localModelsPath) {
        try {
            const models = await fs.promises.readFile(localModelsPath, 'utf8')
            if (models) {
                const categoryModels = JSON.parse(models)[category]
                const found = categoryModels.find((model: INodeOptionsValue) => model.name === name)
                if (found) return found
            }
        } catch (e) {
            console.warn(`Failed to load local models.json: ${e}`)
        }
    }

    // 最后尝试从远程获取（如果设置了 URL 或使用默认 URL）
    const remoteUrl = modelFile && isValidUrl(modelFile) ? modelFile : MASTER_MODEL_LIST
    try {
        const resp = await axios.get(remoteUrl, { timeout: 5000 })
        if (resp.status === 200 && resp.data) {
            const models = resp.data
            const categoryModels = models[category]
            return categoryModels.find((model: INodeOptionsValue) => model.name === name)
        }
    } catch (e) {
        console.warn(`Failed to fetch models from remote: ${e}`)
    }

    return {}
}

export const getModels = async (category: MODEL_TYPE, name: string) => {
    const returnData: INodeOptionsValue[] = []
    try {
        const modelConfig = await getModelConfig(category, name)
        returnData.push(...modelConfig.models)
        return returnData
    } catch (e) {
        throw new Error(`Error: getModels - ${e}`)
    }
}

export const getRegions = async (category: MODEL_TYPE, name: string) => {
    const returnData: INodeOptionsValue[] = []
    try {
        const modelConfig = await getModelConfig(category, name)
        returnData.push(...modelConfig.regions)
        return returnData
    } catch (e) {
        throw new Error(`Error: getRegions - ${e}`)
    }
}
