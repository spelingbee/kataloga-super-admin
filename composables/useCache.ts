/**
 * Cache composable for API responses with TTL support
 * Connects the zero-dependency CacheManager to the Nuxt framework
 */

import { type CacheOptions } from '~/utils/cache-manager'

export const useCache = () => {
  const { $cacheManager, $apiService } = useNuxtApp() as any
  
  // Use provided instances
  const cacheManager = $cacheManager
  const apiService = $apiService

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
    const data = response

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

// Re-export constants and types from the utility file for backward compatibility
export { type CacheOptions, CacheTTL } from '~/utils/cache-manager'
