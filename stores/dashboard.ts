import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { DashboardMetrics, Activity, SystemHealth } from '~/types'
import { CacheTTL } from '~/composables/useCache'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const AUTO_REFRESH_INTERVAL = 60 * 1000 // 1 minute

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const metrics = ref<DashboardMetrics | null>(null)
  const recentActivity = ref<Activity[]>([])
  const systemHealth = ref<SystemHealth | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number | null>(null)

  // Getters
  const isDataStale = computed((): boolean => {
    if (!lastFetched.value) return true
    return Date.now() - lastFetched.value > CACHE_DURATION
  })

  const hasData = computed((): boolean => {
    return metrics.value !== null
  })

  const tenantGrowthPercentage = computed((): number => {
    return metrics.value?.tenants.growth || 0
  })

  const revenueGrowthPercentage = computed((): number => {
    return metrics.value?.revenue.growth || 0
  })

  const pendingRegistrationsCount = computed((): number => {
    return metrics.value?.registrations.pending || 0
  })

  const criticalActivities = computed((): Activity[] => {
    return recentActivity.value.filter(a => a.severity === 'error' || a.severity === 'warning')
  })

  const isSystemHealthy = computed((): boolean => {
    if (!systemHealth.value) return true
    return (
      systemHealth.value.databaseStatus === 'healthy' &&
      systemHealth.value.apiUptime > 95 &&
      systemHealth.value.emailDeliveryRate > 90
    )
  })

  // Actions
  const
fetchDashboardData = async (force = false): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const { cachedGet } = useCache()
      
      // Fetch all dashboard data in parallel with caching
      const [metricsData, activityData, healthData] = await Promise.all([
        cachedGet<DashboardMetrics>('/api/admin/analytics/dashboard', {
          ttl: CacheTTL.MEDIUM,
          force,
        }),
        cachedGet<Activity[]>('/api/admin/dashboard/activity', {
          ttl: CacheTTL.SHORT,
          force,
        }),
        cachedGet<SystemHealth>('/api/admin/dashboard/health', {
          ttl: CacheTTL.SHORT,
          force,
        }),
      ])

      metrics.value = metricsData
      recentActivity.value = activityData
      systemHealth.value = healthData
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch dashboard data'
      console.error('Dashboard fetch error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMetrics = async (): Promise<void> => {
    try {
      const { cachedGet } = useCache()
      metrics.value = await cachedGet<DashboardMetrics>('/api/admin/analytics/dashboard', {
        ttl: CacheTTL.MEDIUM,
      })
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch metrics'
      throw err
    }
  }

  const fetchRecentActivity = async (): Promise<void> => {
    try {
      const { cachedGet } = useCache()
      recentActivity.value = await cachedGet<Activity[]>('/api/admin/dashboard/activity', {
        ttl: CacheTTL.SHORT,
      })
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch activity'
      throw err
    }
  }

  const fetchSystemHealth = async (): Promise<void> => {
    try {
      const { cachedGet } = useCache()
      systemHealth.value = await cachedGet<SystemHealth>('/api/admin/dashboard/health', {
        ttl: CacheTTL.SHORT,
      })
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch system health'
      throw err
    }
  }

  const startAutoRefresh = (): NodeJS.Timeout => {
    return setInterval(() => {
      if (!loading.value) {
        fetchDashboardData(false).catch(console.error)
      }
    }, AUTO_REFRESH_INTERVAL)
  }

  const stopAutoRefresh = (intervalId: NodeJS.Timeout): void => {
    clearInterval(intervalId)
  }

  const clearError = (): void => {
    error.value = null
  }

  const resetState = (): void => {
    metrics.value = null
    recentActivity.value = []
    systemHealth.value = null
    loading.value = false
    error.value = null
    lastFetched.value = null
  }

  return {
    // State
    metrics: readonly(metrics),
    recentActivity: readonly(recentActivity),
    systemHealth: readonly(systemHealth),
    loading: readonly(loading),
    error: readonly(error),
    lastFetched: readonly(lastFetched),
    
    // Getters
    isDataStale,
    hasData,
    tenantGrowthPercentage,
    revenueGrowthPercentage,
    pendingRegistrationsCount,
    criticalActivities,
    isSystemHealthy,
    
    // Actions
    fetchDashboardData,
    fetchMetrics,
    fetchRecentActivity,
    fetchSystemHealth,
    startAutoRefresh,
    stopAutoRefresh,
    clearError,
    resetState,
  }
})
