import { defineStore } from 'pinia'
import type { DashboardState, DashboardMetrics, Activity, SystemHealth } from '~/types'
import { CacheTTL } from '~/composables/useCache'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const AUTO_REFRESH_INTERVAL = 60 * 1000 // 1 minute

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    metrics: null,
    recentActivity: [],
    systemHealth: null,
    loading: false,
    error: null,
    lastFetched: null,
  }),

  getters: {
    isDataStale: (state): boolean => {
      if (!state.lastFetched) return true
      return Date.now() - state.lastFetched > CACHE_DURATION
    },

    hasData: (state): boolean => {
      return state.metrics !== null
    },

    tenantGrowthPercentage: (state): number => {
      return state.metrics?.tenants.growth || 0
    },

    revenueGrowthPercentage: (state): number => {
      return state.metrics?.revenue.growth || 0
    },

    pendingRegistrationsCount: (state): number => {
      return state.metrics?.registrations.pending || 0
    },

    criticalActivities: (state): Activity[] => {
      return state.recentActivity.filter(a => a.severity === 'error' || a.severity === 'warning')
    },

    isSystemHealthy: (state): boolean => {
      if (!state.systemHealth) return true
      return (
        state.systemHealth.databaseStatus === 'healthy' &&
        state.systemHealth.apiUptime > 95 &&
        state.systemHealth.emailDeliveryRate > 90
      )
    },
  },

  actions: {
    async fetchDashboardData(force = false): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { cachedGet } = useCache()
        
        // Fetch all dashboard data in parallel with caching
        const [metrics, activity, health] = await Promise.all([
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

        this.metrics = metrics
        this.recentActivity = activity
        this.systemHealth = health
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch dashboard data'
        console.error('Dashboard fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMetrics(): Promise<void> {
      try {
        const { cachedGet } = useCache()
        this.metrics = await cachedGet<DashboardMetrics>('/api/admin/analytics/dashboard', {
          ttl: CacheTTL.MEDIUM,
        })
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch metrics'
        throw error
      }
    },

    async fetchRecentActivity(): Promise<void> {
      try {
        const { cachedGet } = useCache()
        this.recentActivity = await cachedGet<Activity[]>('/api/admin/dashboard/activity', {
          ttl: CacheTTL.SHORT,
        })
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch activity'
        throw error
      }
    },

    async fetchSystemHealth(): Promise<void> {
      try {
        const { cachedGet } = useCache()
        this.systemHealth = await cachedGet<SystemHealth>('/api/admin/dashboard/health', {
          ttl: CacheTTL.SHORT,
        })
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch system health'
        throw error
      }
    },

    startAutoRefresh(): NodeJS.Timeout {
      return setInterval(() => {
        if (!this.loading) {
          this.fetchDashboardData(false).catch(console.error)
        }
      }, AUTO_REFRESH_INTERVAL)
    },

    stopAutoRefresh(intervalId: NodeJS.Timeout): void {
      clearInterval(intervalId)
    },

    clearError(): void {
      this.error = null
    },

    resetState(): void {
      this.metrics = null
      this.recentActivity = []
      this.systemHealth = null
      this.loading = false
      this.error = null
      this.lastFetched = null
    },
  },
})
