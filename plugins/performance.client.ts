/**
 * Performance monitoring plugin
 * Tracks application performance and Web Vitals
 */

import { performanceMonitor, isPerformanceDegraded, getBundleInfo } from '~/utils/performance'

export default defineNuxtPlugin(() => {
  const router = useRouter()

  // Track route changes
  router.beforeEach((to) => {
    performanceMonitor.mark(`route-${to.path}-start`)
  })

  router.afterEach((to) => {
    performanceMonitor.mark(`route-${to.path}-end`)
    performanceMonitor.measure(
      `route-${to.path}`,
      `route-${to.path}-start`,
      `route-${to.path}-end`
    )
  })

  // Log performance report in development
  if (import.meta.dev) {
    setTimeout(() => {
      performanceMonitor.logReport()
      console.log('Bundle Info:', getBundleInfo())
      
      if (isPerformanceDegraded()) {
        console.warn('⚠️ Performance degraded! Check Web Vitals.')
      }
    }, 5000)
  }

  // Provide performance utilities globally
  return {
    provide: {
      performance: performanceMonitor,
    },
  }
})
