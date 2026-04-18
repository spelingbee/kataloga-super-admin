import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { DashboardMetrics, Activity, SystemHealth } from '~/types'
import { CacheTTL } from '~/utils/cache-manager'

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
      
      // Fetch dashboard metrics (includes all data we need)
      const metricsData = await cachedGet<DashboardMetrics>('/admin/analytics/dashboard', {
        ttl: CacheTTL.MEDIUM,
        force,
      })

      metrics.value = metricsData
      
      // Populate activity and health from metrics data
      recentActivity.value = (metricsData as any).recentActivity || []
      systemHealth.value = metricsData.system ? {
        apiUptime: metricsData.system.apiUptime,
        databaseStatus: metricsData.system.databaseStatus,
        emailDeliveryRate: metricsData.system.emailDeliveryRate,
        storageUsed: metricsData.system.storageUsed,
      } : null
      
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch dashboard data'
      console.error('Dashboard fetch error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMetrics = async (): Promise<void> => {
    try {
      const { cachedGet } = useCache()
      metrics.value = await cachedGet<DashboardMetrics>('/admin/analytics/dashboard', {
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
      // Activity endpoint not implemented yet
      // For now, return empty array
      recentActivity.value = []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch activity'
      throw err
    }
  }

  const fetchSystemHealth = async (): Promise<void> => {
    try {
      // Health endpoint not implemented yet
      // Get health data from metrics instead
      if (metrics.value?.system) {
        systemHealth.value = {
          apiUptime: metrics.value.system.apiUptime,
          databaseStatus: metrics.value.system.databaseStatus,
          emailDeliveryRate: metrics.value.system.emailDeliveryRate,
          storageUsed: metrics.value.system.storageUsed,
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch system health'
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
