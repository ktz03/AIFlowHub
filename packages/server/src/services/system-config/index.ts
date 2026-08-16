import { SystemConfig } from '../../database/entities/SystemConfig'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import * as crypto from 'crypto'

// 系统配置键常量
export const SYSTEM_CONFIG_KEYS = {
    WORKFLOW_GENERATOR_API_KEY: 'workflow_generator_api_key',
    WORKFLOW_GENERATOR_MODEL: 'workflow_generator_model'
}

// 加密密钥（实际应该从环境变量读取）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'flowise-system-config-key-32bit'
const ALGORITHM = 'aes-256-cbc'

/**
 * 加密敏感数据
 */
function encrypt(text: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return iv.toString('hex') + ':' + encrypted
}

/**
 * 解密敏感数据
 */
function decrypt(text: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const parts = text.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedText = parts[1]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

/**
 * 获取系统配置
 */
export const getSystemConfig = async (key: string): Promise<string | null> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(SystemConfig)
        const config = await repository.findOne({ where: { key } })

        if (!config) {
            return null
        }

        // 如果是加密的，解密后返回
        if (config.isEncrypted) {
            return decrypt(config.value)
        }

        return config.value
    } catch (error) {
        console.error(`[SystemConfig] 获取配置失败 ${key}:`, error)
        return null
    }
}

/**
 * 设置系统配置
 */
export const setSystemConfig = async (
    key: string,
    value: string,
    description?: string,
    isEncrypted: boolean = false,
    provider?: string
): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(SystemConfig)

        // 如果需要加密，先加密
        const finalValue = isEncrypted ? encrypt(value) : value

        // 查找是否已存在
        let config = await repository.findOne({ where: { key } })

        if (config) {
            // 更新
            config.value = finalValue
            config.isEncrypted = isEncrypted
            if (description) {
                config.description = description
            }
            if (provider) {
                config.provider = provider
            }
            await repository.save(config)
        } else {
            // 创建
            config = repository.create({
                key,
                value: finalValue,
                description,
                isEncrypted,
                provider
            })
            await repository.save(config)
        }

        console.log(`[SystemConfig] 配置已保存: ${key}`)
    } catch (error) {
        console.error(`[SystemConfig] 保存配置失败 ${key}:`, error)
        throw error
    }
}

/**
 * 删除系统配置
 */
export const deleteSystemConfig = async (key: string): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(SystemConfig)
        await repository.delete({ key })
        console.log(`[SystemConfig] 配置已删除: ${key}`)
    } catch (error) {
        console.error(`[SystemConfig] 删除配置失败 ${key}:`, error)
        throw error
    }
}

/**
 * 获取所有系统配置（不包含敏感值）
 */
export const getAllSystemConfigs = async (): Promise<
    Array<{
        key: string
        description?: string
        isEncrypted: boolean
        hasValue: boolean
        provider?: string
    }>
> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(SystemConfig)
        const configs = await repository.find()

        return configs.map((config: SystemConfig) => ({
            key: config.key,
            description: config.description,
            isEncrypted: config.isEncrypted,
            hasValue: !!config.value,
            provider: config.provider
        }))
    } catch (error) {
        console.error('[SystemConfig] 获取所有配置失败:', error)
        return []
    }
}

/**
 * 获取工作流生成器专用的 API Key
 * 这个函数只能被工作流生成服务调用
 */
export const getWorkflowGeneratorApiKey = async (): Promise<string | null> => {
    return await getSystemConfig(SYSTEM_CONFIG_KEYS.WORKFLOW_GENERATOR_API_KEY)
}

/**
 * 获取工作流生成器使用的模型
 */
export const getWorkflowGeneratorModel = async (): Promise<string> => {
    const model = await getSystemConfig(SYSTEM_CONFIG_KEYS.WORKFLOW_GENERATOR_MODEL)
    return model || 'deepseek-chat' // 默认模型
}

/**
 * 获取工作流生成器使用的提供商
 */
export const getWorkflowGeneratorProvider = async (): Promise<string> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(SystemConfig)
        const config = await repository.findOne({
            where: { key: SYSTEM_CONFIG_KEYS.WORKFLOW_GENERATOR_API_KEY }
        })
        return config?.provider || 'deepseek'
    } catch (error) {
        console.error('[SystemConfig] 获取提供商失败:', error)
        return 'deepseek'
    }
}
