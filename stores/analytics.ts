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
          apiService.get<any>('/admin/analytics/registrations', { params }),
          apiService.get<any>('/admin/analytics/tenants', { params }),
          apiService.get<any>('/admin/analytics/revenue', { params }),
        ])

        // Map Registration Metrics
        this.registrationMetrics = {
          total: registrationResponse.totalRegistrations,
          approved: registrationResponse.approvedRegistrations,
          rejected: registrationResponse.rejectedRegistrations,
          pending: registrationResponse.pendingRegistrations,
          conversionRate: registrationResponse.conversionRate,
          trends: (registrationResponse.registrationsByPeriod || []).flatMap((p: any) => [
            { date: p.period, count: p.approved, status: 'approved' },
            { date: p.period, count: p.rejected, status: 'rejected' },
            { date: p.period, count: p.count - (p.approved + p.rejected), status: 'pending' },
          ]),
          statusBreakdown: [
            { status: 'approved', count: registrationResponse.approvedRegistrations, percentage: registrationResponse.totalRegistrations > 0 ? (registrationResponse.approvedRegistrations / registrationResponse.totalRegistrations) * 100 : 0 },
            { status: 'pending', count: registrationResponse.pendingRegistrations, percentage: registrationResponse.totalRegistrations > 0 ? (registrationResponse.pendingRegistrations / registrationResponse.totalRegistrations) * 100 : 0 },
            { status: 'rejected', count: registrationResponse.rejectedRegistrations, percentage: registrationResponse.totalRegistrations > 0 ? (registrationResponse.rejectedRegistrations / registrationResponse.totalRegistrations) * 100 : 0 },
          ]
        }

        // Map Tenant Metrics
        this.tenantMetrics = {
          totalTenants: tenantResponse.totalActiveTenants,
          activeTenants: tenantResponse.totalActiveTenants, // Simplified
          retentionRate: tenantResponse.tenantRetentionRate,
          churnRate: tenantResponse.churnRate,
          topPerformers: (tenantResponse.topPerformingTenants || []).map((t: any) => ({
            id: t.tenantId,
            name: t.businessName,
            revenue: t.monthlyRevenue,
            orderCount: t.totalOrders,
            growthRate: 0 // Mock growth rate for now
          })),
          growthTrend: [
            { date: new Date().toISOString(), total: tenantResponse.totalActiveTenants, active: tenantResponse.totalActiveTenants, churned: 0 }
          ]
        }

        // Map Revenue Metrics
        this.revenueMetrics = {
          mrr: revenueResponse.monthlyRecurringRevenue,
          arr: revenueResponse.annualRecurringRevenue,
          totalRevenue: revenueResponse.totalRevenue,
          revenueGrowth: revenueResponse.revenueGrowthRate,
          revenueTrend: (revenueResponse.revenueByPeriod || []).map((p: any) => ({
            date: p.period,
            amount: p.revenue,
            mrr: revenueResponse.monthlyRecurringRevenue // Simplified mapping
          })),
          revenueByPlan: (revenueResponse.revenueByPlan || []).map((p: any) => ({
            plan: p.planName,
            revenue: p.revenue,
            percentage: p.percentage,
            subscriberCount: p.tenantCount
          })),
          projections: {
            nextMonth: revenueResponse.revenueProjection?.[0]?.projectedRevenue || 0,
            nextQuarter: revenueResponse.revenueProjection?.[1]?.projectedRevenue || 0,
            nextYear: revenueResponse.revenueProjection?.[2]?.projectedRevenue || 0,
          }
        }

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

        const response = await apiService.get<any>(
          '/admin/analytics/registrations',
          { params }
        )
        
        this.registrationMetrics = {
          total: response.totalRegistrations,
          approved: response.approvedRegistrations,
          rejected: response.rejectedRegistrations,
          pending: response.pendingRegistrations,
          conversionRate: response.conversionRate,
          trends: (response.registrationsByPeriod || []).flatMap((p: any) => [
            { date: p.period, count: p.approved, status: 'approved' },
            { date: p.period, count: p.rejected, status: 'rejected' },
            { date: p.period, count: p.count - (p.approved + p.rejected), status: 'pending' },
          ]),
          statusBreakdown: [
            { status: 'approved', count: response.approvedRegistrations, percentage: response.totalRegistrations > 0 ? (response.approvedRegistrations / response.totalRegistrations) * 100 : 0 },
            { status: 'pending', count: response.pendingRegistrations, percentage: response.totalRegistrations > 0 ? (response.pendingRegistrations / response.totalRegistrations) * 100 : 0 },
            { status: 'rejected', count: response.rejectedRegistrations, percentage: response.totalRegistrations > 0 ? (response.rejectedRegistrations / response.totalRegistrations) * 100 : 0 },
          ]
        }
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

        const response = await apiService.get<any>(
          '/admin/analytics/tenants',
          { params }
        )
        
        this.tenantMetrics = {
          totalTenants: response.totalActiveTenants,
          activeTenants: response.totalActiveTenants,
          retentionRate: response.tenantRetentionRate,
          churnRate: response.churnRate,
          topPerformers: (response.topPerformingTenants || []).map((t: any) => ({
            id: t.tenantId,
            name: t.businessName,
            revenue: t.monthlyRevenue,
            orderCount: t.totalOrders,
            growthRate: 0
          })),
          growthTrend: [
            { date: new Date().toISOString(), total: response.totalActiveTenants, active: response.totalActiveTenants, churned: 0 }
          ]
        }
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

        const response = await apiService.get<any>(
          '/admin/analytics/revenue',
          { params }
        )
        
        this.revenueMetrics = {
          mrr: response.monthlyRecurringRevenue,
          arr: response.annualRecurringRevenue,
          totalRevenue: response.totalRevenue,
          revenueGrowth: response.revenueGrowthRate,
          revenueTrend: (response.revenueByPeriod || []).map((p: any) => ({
            date: p.period,
            amount: p.revenue,
            mrr: response.monthlyRecurringRevenue
          })),
          revenueByPlan: (response.revenueByPlan || []).map((p: any) => ({
            plan: p.planName,
            revenue: p.revenue,
            percentage: p.percentage,
            subscriberCount: p.tenantCount
          })),
          projections: {
            nextMonth: response.revenueProjection?.[0]?.projectedRevenue || 0,
            nextQuarter: response.revenueProjection?.[1]?.projectedRevenue || 0,
            nextYear: response.revenueProjection?.[2]?.projectedRevenue || 0,
          }
        }
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
      this.loading = true
      this.error = null
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<any>(
          '/admin/analytics/conversion-funnel',
          { params }
        )
        
        // Map backend funnel data to component format
        this.conversionFunnelMetrics = {
          totalStarted: response.steps?.[0]?.count || 0,
          totalCompleted: response.steps?.[response.steps.length - 1]?.count || 0,
          overallConversionRate: response.conversionRate,
          stages: (response.steps || []).map((s: any, idx: number) => {
            const dropOffPoint = response.dropOffPoints?.[idx - 1]
            return {
              name: s.name,
              count: s.count,
              percentage: s.percentage,
              dropOffRate: dropOffPoint ? dropOffPoint.percentage : 0
            }
          }),
          insights: (response.dropOffPoints || []).map((d: any) => ({
            bottleneck: d.step,
            recommendation: `Optimize the ${d.step} phase to reduce drop-off by ${d.dropOff} users.`
          }))
        }
        
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch conversion funnel analytics'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCohortAnalytics(): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<any>(
          '/admin/analytics/cohort-analysis',
          { params }
        )
        
        // Map backend cohort data to component format
        this.cohortAnalysisMetrics = {
          cohorts: (response.cohorts || []).map((c: any) => ({
            cohortDate: c.month,
            cohortSize: c.registrations,
            retentionByMonth: Object.entries(c.retention || {}).map(([key, rate]) => ({
              month: parseInt(key.replace('month', '')),
              retentionRate: rate as number
            }))
          })),
          averageRetention: Object.entries(response.averageRetention || {}).map(([key, rate]) => ({
            month: parseInt(key.replace('month', '')),
            rate: rate as number
          })),
          behaviorPatterns: response.behaviorPatterns || []
        }
        
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch cohort analysis'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchGeographicAnalytics(): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const { apiService } = useApi()
        const params = {
          from: this.dateRange.from,
          to: this.dateRange.to,
        }

        const response = await apiService.get<any>(
          '/admin/analytics/geographic-distribution',
          { params }
        )
        
        // Map backend geographic data
        this.geographicMetrics = {
          regions: (response.byRegion || []).map((r: any) => ({
            name: r.region,
            count: r.count,
            percentage: r.percentage,
            revenue: r.revenue
          })),
          cities: (response.byCity || []).map((c: any) => ({
            name: c.city,
            count: c.count,
            percentage: c.percentage,
            revenue: c.revenue
          }))
        }
        
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch geographic analytics'
        throw error
      } finally {
        this.loading = false
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
