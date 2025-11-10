/**
 * Cache composable for API responses with TTL support
 * Provides in-memory caching with automatic expiration
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key?: string // Custom cache key
  force?: boolean // Force refresh, bypass cache
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  getSize(): number {
    return this.cache.size
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton cache manager
const cacheManager = new CacheManager()

// Run cleanup every 5 minutes
if (process.client) {
  setInterval(() => {
    cacheManager.cleanup()
  }, 5 * 60 * 1000)
}

export const useCache = () => {
  const { apiService } = useApi()

  /**
   * Cached GET request
   */
  const cachedGet = async <T>(
    url: string,
    options: CacheOptions = {}
  ): Promise<T> => {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      key = url,
      force = false,
    } = options

    // Return cached data if available and not forced
    if (!force && cacheManager.has(key)) {
      const cached = cacheManager.get<T>(key)
      if (cached !== null) {
        return cached
      }
    }

    // Fetch fresh data
    const response = await apiService.get<T>(url)
    const data = response.data

    // Cache the response
    cacheManager.set(key, data, ttl)

    return data
  }

  /**
   * Invalidate cache by key
   */
  const invalidate = (key: string): void => {
    cacheManager.invalidate(key)
  }

  /**
   * Invalidate cache by pattern (regex)
   */
  const invalidatePattern = (pattern: string): void => {
    cacheManager.invalidatePattern(pattern)
  }

  /**
   * Clear all cache
   */
  const clearCache = (): void => {
    cacheManager.clear()
  }

  /**
   * Check if cache has key
   */
  const hasCache = (key: string): boolean => {
    return cacheManager.has(key)
  }

  /**
   * Get cache size
   */
  const getCacheSize = (): number => {
    return cacheManager.getSize()
  }

  /**
   * Prefetch data and cache it
   */
  const prefetch = async <T>(
    url: string,
    options: CacheOptions = {}
  ): Promise<void> => {
    await cachedGet<T>(url, options)
  }

  return {
    cachedGet,
    invalidate,
    invalidatePattern,
    clearCache,
    hasCache,
    getCacheSize,
    prefetch,
  }
}

/**
 * Cache TTL presets
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
} as const
