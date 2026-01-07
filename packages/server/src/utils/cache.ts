/**
 * 简单的内存缓存实现
 * 用于缓存频繁访问的数据，减少数据库查询
 */

interface CacheItem<T> {
    value: T
    expireAt: number
}

class MemoryCache {
    private cache: Map<string, CacheItem<any>> = new Map()
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor() {
        // 每分钟清理过期缓存
        this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000)
    }

    /**
     * 获取缓存值
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key)
        if (!item) return null

        if (Date.now() > item.expireAt) {
            this.cache.delete(key)
            return null
        }

        return item.value as T
    }

    /**
     * 设置缓存值
     * @param key 缓存键
     * @param value 缓存值
     * @param ttlSeconds 过期时间（秒），默认 5 分钟
     */
    set<T>(key: string, value: T, ttlSeconds: number = 300): void {
        this.cache.set(key, {
            value,
            expireAt: Date.now() + ttlSeconds * 1000
        })
    }

    /**
     * 删除缓存
     */
    delete(key: string): boolean {
        return this.cache.delete(key)
    }

    /**
     * 删除匹配前缀的所有缓存
     */
    deleteByPrefix(prefix: string): number {
        let count = 0
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key)
                count++
            }
        }
        return count
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear()
    }

    /**
     * 获取缓存统计
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        }
    }

    /**
     * 清理过期缓存
     */
    private cleanup(): void {
        const now = Date.now()
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expireAt) {
                this.cache.delete(key)
            }
        }
    }

    /**
     * 销毁缓存实例
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }
        this.cache.clear()
    }
}

// 导出单例
export const cache = new MemoryCache()

// 缓存键前缀常量
export const CACHE_KEYS = {
    USER_QUOTA: 'user:quota:',
    TEMPLATE_LIST: 'templates:list:',
    TEMPLATE_DETAIL: 'templates:detail:',
    CATEGORY_STATS: 'templates:category:stats',
    USAGE_OVERVIEW: 'usage:overview:',
    MODEL_PRICING: 'model:pricing'
}

// 缓存装饰器（用于服务方法）
export function cached(keyPrefix: string, ttlSeconds: number = 300) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value

        descriptor.value = async function (...args: any[]) {
            const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`
            const cachedValue = cache.get(cacheKey)

            if (cachedValue !== null) {
                return cachedValue
            }

            const result = await originalMethod.apply(this, args)
            cache.set(cacheKey, result, ttlSeconds)
            return result
        }

        return descriptor
    }
}

export default cache
