import { defineStore } from 'pinia'
import type {
  AnalyticsState,
  DateRange,
  RegistrationMetrics,
  TenantPerformanceMetrics,
  RevenueMetrics,
  ConversionFunnelMetrics,
  CohortAnalysisMetrics,
  GeographicDistributionMetrics,
} from '~/types'

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
const DEFAULT_DATE_RANGE: DateRange = {
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '', // 30 days ago
  to: new Date().toISOString().split('T')[0] || '', // today
}

export const useAnalyticsStore = defineStore('analytics', {
  state: (): AnalyticsState => ({
    registrationMetrics: null,
    tenantMetrics: null,
    revenueMetrics: null,
    conversionFunnelMetrics: null,
    cohortAnalysisMetrics: null,
    geographicMetrics: null,
    dateRange: { ...DEFAULT_DATE_RANGE },
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
      return (
        state.registrationMetrics !== null ||
        state.tenantMetrics !== null ||
        state.revenueMetrics !== null
      )
    },

    totalRegistrations: (state): number => {
      return state.registrationMetrics?.total || 0
    },

    registrationConversionRate: (state): number => {
      return state.registrationMetrics?.conversionRate || 0
    },

    tenantRetentionRate: (state): number => {
      return state.tenantMetrics?.retentionRate || 0
    },

    tenantChurnRate: (state): number => {
      return state.tenantMetrics?.churnRate || 0
    },

    currentMRR: (state): number => {
      return state.revenueMetrics?.mrr || 0
    },

    currentARR: (state): number => {
      return state.revenueMetrics?.arr || 0
    },

    revenueGrowthRate: (state): number => {
      return state.revenueMetrics?.revenueGrowth || 0
    },

    topPerformingTenants: (state) => {
      return state.tenantMetrics?.topPerformers || []
    },

    revenueByPlanData: (state) => {
      return state.revenueMetrics?.revenueByPlan || []
    },
  },

  actions: {
    setDateRange(dateRange: DateRange): void {
      this.dateRange = dateRange
      // Clear cache when date range changes
      this.lastFetched = null
    },

    resetDateRange(): void {
      this.dateRange = { ...DEFAULT_DATE_RANGE }
      this.lastFetched = null
    },

    async fetchAllAnalytics(force = false): Promise<void> {
      // Use cache if data is fresh and not forced
      if (!force && !this.isDataStale && this.hasData) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        // Fetch all analytics data in parallel
        const [registrationResponse, tenantResponse, revenueResponse] = await Promise.all([
          apiService.get<RegistrationMetrics>('/api/admin/analytics/registrations', { params }),
          apiService.get<TenantPerformanceMetrics>('/api/admin/analytics/tenants', { params }),
          apiService.get<RevenueMetrics>('/api/admin/analytics/revenue', { params }),
        ])

        this.registrationMetrics = registrationResponse.data
        this.tenantMetrics = tenantResponse.data
        this.revenueMetrics = revenueResponse.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch analytics data'
        console.error('Analytics fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchRegistrationAnalytics(): Promise<void> {
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<RegistrationMetrics>(
          '/api/admin/analytics/registrations',
          { params }
        )
        this.registrationMetrics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch registration analytics'
        throw error
      }
    },

    async fetchTenantAnalytics(): Promise<void> {
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<TenantPerformanceMetrics>(
          '/api/admin/analytics/tenants',
          { params }
        )
        this.tenantMetrics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch tenant analytics'
        throw error
      }
    },

    async fetchRevenueAnalytics(): Promise<void> {
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<RevenueMetrics>(
          '/api/admin/analytics/revenue',
          { params }
        )
        this.revenueMetrics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch revenue analytics'
        throw error
      }
    },

    clearError(): void {
      this.error = null
    },

    async fetchConversionFunnelAnalytics(): Promise<void> {
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<ConversionFunnelMetrics>(
          '/api/admin/analytics/conversion-funnel',
          { params }
        )
        this.conversionFunnelMetrics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch conversion funnel analytics'
        throw error
      }
    },

    async fetchCohortAnalytics(): Promise<void> {
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<CohortAnalysisMetrics>(
          '/api/admin/analytics/cohort-analysis',
          { params }
        )
        this.cohortAnalysisMetrics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch cohort analysis'
        throw error
      }
    },

    async fetchGeographicAnalytics(): Promise<void> {
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<GeographicDistributionMetrics>(
          '/api/admin/analytics/geographic-distribution',
          { params }
        )
        this.geographicMetrics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch geographic analytics'
        throw error
      }
    },

    resetState(): void {
      this.registrationMetrics = null
      this.tenantMetrics = null
      this.revenueMetrics = null
      this.conversionFunnelMetrics = null
      this.cohortAnalysisMetrics = null
      this.geographicMetrics = null
      this.dateRange = { ...DEFAULT_DATE_RANGE }
      this.loading = false
      this.error = null
      this.lastFetched = null
    },
  },
})
