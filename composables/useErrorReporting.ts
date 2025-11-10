interface ErrorReport {
  message: string
  stack?: string
  timestamp: string
  url: string
  userAgent: string
  context?: Record<string, any>
}

interface ErrorReportingOptions {
  enabled?: boolean
  endpoint?: string
  sampleRate?: number
}

export const useErrorReporting = () => {
  const config = useRuntimeConfig()
  const isDevelopment = process.env.NODE_ENV === 'development'

  const options: ErrorReportingOptions = {
    enabled: !isDevelopment,
    endpoint: `${config.public.apiBaseUrl}/api/admin/errors/report`,
    sampleRate: 1.0, // Report 100% of errors
  }

  /**
   * Report error to backend for monitoring
   */
  const reportError = async (
    error: Error | any,
    context?: Record<string, any>
  ): Promise<void> => {
    if (!options.enabled) {
      // In development, just log to console
      console.error('Error:', error, 'Context:', context)
      return
    }

    // Sample rate check
    if (Math.random() > (options.sampleRate || 1.0)) {
      return
    }

    try {
      const report: ErrorReport = {
        message: error?.message || String(error),
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        context: {
          ...context,
          // Add additional context
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          } : undefined,
        },
      }

      // Send to backend (fire and forget)
      if (options.endpoint) {
        fetch(options.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
          // Don't wait for response
          keepalive: true,
        }).catch(() => {
          // Silently fail - don't want error reporting to cause more errors
        })
      }

      // Also log to console in development
      if (isDevelopment) {
        console.error('Error Report:', report)
      }
    } catch (reportingError) {
      // Silently fail - error reporting should never break the app
      console.error('Failed to report error:', reportingError)
    }
  }

  /**
   * Report performance issue
   */
  const reportPerformance = async (
    metric: string,
    value: number,
    context?: Record<string, any>
  ): Promise<void> => {
    if (!options.enabled) return

    try {
      const report = {
        metric,
        value,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        context,
      }

      if (options.endpoint) {
        fetch(`${config.public.apiBaseUrl}/api/admin/performance/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
          keepalive: true,
        }).catch(() => {})
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Set up global error handlers
   */
  const setupGlobalHandlers = () => {
    if (!process.client) return

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      reportError(event.error || new Error(event.message), {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      reportError(event.reason, {
        type: 'unhandled_rejection',
        promise: String(event.promise),
      })
    })

    // Report performance metrics
    if ('PerformanceObserver' in window) {
      try {
        // Long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              reportPerformance('long_task', entry.duration, {
                name: entry.name,
                startTime: entry.startTime,
              })
            }
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })

        // Layout shifts
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue
            reportPerformance('layout_shift', (entry as any).value, {
              sources: (entry as any).sources,
            })
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        // PerformanceObserver not fully supported
      }
    }
  }

  return {
    reportError,
    reportPerformance,
    setupGlobalHandlers,
  }
}
