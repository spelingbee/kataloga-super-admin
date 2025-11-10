/**
 * Optimized data fetching composable
 * Provides debouncing, throttling, and request deduplication
 */

import { ref, type Ref } from 'vue'

interface FetchOptions {
  debounce?: number
  throttle?: number
  dedupe?: boolean
  cache?: boolean
  cacheTTL?: number
}

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Optimized fetch composable
 */
export const useOptimizedFetch = <T>(
  fetchFn: () => Promise<T>,
  options: FetchOptions = {}
) => {
  const {
    debounce: debounceMs = 0,
    throttle: throttleMs = 0,
    dedupe = true,
    cache: useCache = true,
    cacheTTL = 5 * 60 * 1000,
  } = options

  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const executeFetch = async (force = false) => {
    const requestKey = fetchFn.toString()

    // Request deduplication
    if (dedupe && !force && pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)
    }

    loading.value = true
    error.value = null

    const fetchPromise = (async () => {
      try {
        const result = await fetchFn()
        data.value = result
        return result
      } catch (err) {
        error.value = err as Error
        throw err
      } finally {
        loading.value = false
        if (dedupe) {
          pendingRequests.delete(requestKey)
        }
      }
    })()

    if (dedupe) {
      pendingRequests.set(requestKey, fetchPromise)
    }

    return fetchPromise
  }

  let fetchMethod: (force?: boolean) => Promise<T>

  if (debounceMs > 0) {
    const debouncedFetch = debounce(executeFetch, debounceMs)
    fetchMethod = (force?: boolean) => {
      debouncedFetch(force)
      return executeFetch(force)
    }
  } else if (throttleMs > 0) {
    const throttledFetch = throttle(executeFetch, throttleMs)
    fetchMethod = (force?: boolean) => {
      throttledFetch(force)
      return executeFetch(force)
    }
  } else {
    fetchMethod = executeFetch
  }

  const fetch = fetchMethod

  const refresh = () => executeFetch(true)

  return {
    data,
    loading,
    error,
    fetch,
    refresh,
  }
}

/**
 * Batch multiple requests
 */
export const useBatchFetch = () => {
  const batchFetch = async <T>(
    requests: Array<() => Promise<T>>
  ): Promise<T[]> => {
    return Promise.all(requests.map(req => req()))
  }

  const batchFetchSettled = async <T>(
    requests: Array<() => Promise<T>>
  ): Promise<PromiseSettledResult<T>[]> => {
    return Promise.allSettled(requests.map(req => req()))
  }

  return {
    batchFetch,
    batchFetchSettled,
  }
}

/**
 * Infinite scroll data fetching
 */
export const useInfiniteScroll = <T>(
  fetchFn: (page: number) => Promise<T[]>,
  options: { pageSize?: number } = {}
) => {
  const { pageSize = 20 } = options

  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(0)

  const loadMore = async () => {
    if (loading.value || !hasMore.value) return

    loading.value = true
    error.value = null

    try {
      const nextPage = currentPage.value + 1
      const newItems = await fetchFn(nextPage)

      if (newItems.length < pageSize) {
        hasMore.value = false
      }

      items.value = [...items.value, ...newItems]
      currentPage.value = nextPage
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    items.value = []
    currentPage.value = 0
    hasMore.value = true
    error.value = null
  }

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
  }
}

/**
 * Polling with automatic cleanup
 */
export const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number = 5000
) => {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const isPolling = ref(false)

  let intervalId: NodeJS.Timeout | null = null

  const fetch = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await fetchFn()
      data.value = result
      return result
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }

  const startPolling = () => {
    if (isPolling.value) return

    isPolling.value = true
    fetch() // Initial fetch

    intervalId = setInterval(() => {
      fetch()
    }, interval)
  }

  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isPolling.value = false
  }

  onUnmounted(() => {
    stopPolling()
  })

  return {
    data,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    fetch,
  }
}
