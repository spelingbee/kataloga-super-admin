/**
 * Cache Manager utility for global cache management
 * Independent of Nuxt framework to avoid circular dependencies
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key?: string // Custom cache key
  force?: boolean // Force refresh, bypass cache
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

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private intervalId: any = null

  constructor() {
    // Initializer
  }

  public start(): void {
    // Run cleanup every 5 minutes on the client
    if (typeof window !== 'undefined') {
      this.startCleanup()
    }
  }

  private startCleanup(): void {
    if (this.intervalId) return

    this.intervalId = window.setInterval(() => {
      this.cleanup()
    }, this.DEFAULT_TTL)
  }

  public stopCleanup(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  public set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  public get<T>(key: string): T | null {
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

  public has(key: string): boolean {
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

  public invalidate(key: string): void {
    this.cache.delete(key)
  }

  public invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  public clear(): void {
    this.cache.clear()
  }

  public getSize(): number {
    return this.cache.size
  }

  // Clean up expired entries
  public cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// NOTE: singleton is now created and provided in plugins/cache.client.ts
