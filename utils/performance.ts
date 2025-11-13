/**
 * Performance monitoring utilities
 * Track and optimize application performance
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly MAX_METRICS = 100

  /**
   * Mark a performance point
   */
  mark(name: string): void {
    if (import.meta.client && 'performance' in window) {
      performance.mark(name)
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark: string): number | null {
    if (import.meta.client && 'performance' in window) {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name)[0] as PerformanceEntry
        
        this.addMetric({
          name,
          value: measure.duration,
          timestamp: Date.now(),
        })

        return measure.duration
      } catch (error) {
        console.warn('Performance measurement failed:', error)
        return null
      }
    }
    return null
  }

  /**
   * Add a custom metric
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift()
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name)
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    if (import.meta.client && 'performance' in window) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }

  /**
   * Get Web Vitals
   */
  getWebVitals(): Record<string, number> {
    if (!import.meta.client || !('performance' in window)) {
      return {}
    }

    const vitals: Record<string, number> = {}

    // First Contentful Paint
    const fcp = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry
    if (fcp) {
      vitals.FCP = fcp.startTime
    }

    // Largest Contentful Paint
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop() as any
    if (lcp) {
      vitals.LCP = lcp.renderTime || lcp.loadTime
    }

    // First Input Delay (requires user interaction)
    const fid = performance.getEntriesByType('first-input').pop() as any
    if (fid) {
      vitals.FID = fid.processingStart - fid.startTime
    }

    // Cumulative Layout Shift
    const cls = performance.getEntriesByType('layout-shift') as any[]
    if (cls.length > 0) {
      vitals.CLS = cls.reduce((sum, entry) => sum + entry.value, 0)
    }

    return vitals
  }

  /**
   * Log performance report
   */
  logReport(): void {
    if (!import.meta.client) return

    console.group('Performance Report')
    console.table(this.getMetrics())
    console.log('Web Vitals:', this.getWebVitals())
    console.groupEnd()
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Performance decorator for async functions
 */
export const measurePerformance = (name: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startMark = `${name}-start`
      const endMark = `${name}-end`

      performanceMonitor.mark(startMark)
      
      try {
        const result = await originalMethod.apply(this, args)
        performanceMonitor.mark(endMark)
        performanceMonitor.measure(name, startMark, endMark)
        return result
      } catch (error) {
        performanceMonitor.mark(endMark)
        performanceMonitor.measure(name, startMark, endMark)
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Measure component render time
 */
export const useComponentPerformance = (componentName: string) => {
  const startTime = ref(0)

  onBeforeMount(() => {
    startTime.value = performance.now()
    performanceMonitor.mark(`${componentName}-mount-start`)
  })

  onMounted(() => {
    performanceMonitor.mark(`${componentName}-mount-end`)
    const duration = performanceMonitor.measure(
      `${componentName}-mount`,
      `${componentName}-mount-start`,
      `${componentName}-mount-end`
    )

    if (duration && duration > 100) {
      console.warn(`Slow component mount: ${componentName} took ${duration.toFixed(2)}ms`)
    }
  })

  return {
    startTime,
  }
}

/**
 * Measure API call performance
 */
export const measureApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startMark = `api-${name}-start`
  const endMark = `api-${name}-end`

  performanceMonitor.mark(startMark)

  try {
    const result = await apiCall()
    performanceMonitor.mark(endMark)
    performanceMonitor.measure(`api-${name}`, startMark, endMark)
    return result
  } catch (error) {
    performanceMonitor.mark(endMark)
    performanceMonitor.measure(`api-${name}`, startMark, endMark)
    throw error
  }
}

/**
 * Check if performance is degraded
 */
export const isPerformanceDegraded = (): boolean => {
  if (!import.meta.client) return false

  const vitals = performanceMonitor.getWebVitals()

  // Check against Web Vitals thresholds
  return Boolean(
    (vitals.FCP && vitals.FCP > 2500) || // FCP > 2.5s
    (vitals.LCP && vitals.LCP > 4000) || // LCP > 4s
    (vitals.FID && vitals.FID > 300) ||  // FID > 300ms
    (vitals.CLS && vitals.CLS > 0.25)    // CLS > 0.25
  )
}

/**
 * Get bundle size information
 */
export const getBundleInfo = (): Record<string, number> => {
  if (!import.meta.client || !('performance' in window)) {
    return {}
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const bundleInfo: Record<string, number> = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    imageSize: 0,
    fontSize: 0,
  }

  resources.forEach((resource) => {
    const size = resource.transferSize || 0
    bundleInfo.totalSize = (bundleInfo.totalSize || 0) + size

    if (resource.name.endsWith('.js')) {
      bundleInfo.jsSize = (bundleInfo.jsSize || 0) + size
    } else if (resource.name.endsWith('.css')) {
      bundleInfo.cssSize = (bundleInfo.cssSize || 0) + size
    } else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
      bundleInfo.imageSize = (bundleInfo.imageSize || 0) + size
    } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/)) {
      bundleInfo.fontSize = (bundleInfo.fontSize || 0) + size
    }
  })

  return bundleInfo
}
