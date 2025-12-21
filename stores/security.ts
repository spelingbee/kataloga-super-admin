import { defineStore } from 'pinia'
import type {
  SecurityState,
  SecurityDashboardMetrics,
  SecurityEvent,
  SecurityEventListItem,
  BlockedIP,
  BlockedIPListItem,
  SuspiciousActivity,
  SuspiciousActivityListItem,
  SecurityFilters,
  PaginatedResponse,
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useSecurityStore = defineStore('security', {
  state: (): SecurityState => ({
    dashboardMetrics: null,
    events: [],
    currentEvent: null,
    blockedIPs: [],
    currentBlockedIP: null,
    suspiciousActivities: [],
    currentActivity: null,
    filters: {
      type: '',
      severity: '',
      resolved: '',
      fromDate: '',
      toDate: '',
      search: '',
      ipAddress: '',
    },
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
    lastFetched: null,
  }),

  getters: {
    criticalEvents: (state): SecurityEventListItem[] => {
      return state.events.filter(event => event.severity === 'critical')
    },

    unresolvedEvents: (state): SecurityEventListItem[] => {
      return state.events.filter(event => !event.resolved)
    },

    highRiskActivities: (state): SuspiciousActivityListItem[] => {
      return state.suspiciousActivities.filter(activity => activity.riskLevel === 'high')
    },

    activeBlockedIPs: (state): BlockedIPListItem[] => {
      const now = new Date()
      return state.blockedIPs.filter(ip => {
        if (ip.isPermanent) return true
        if (!ip.expiresAt) return true
        return new Date(ip.expiresAt) > now
      })
    },

    hasFilters: (state): boolean => {
      return !!(
        state.filters.type ||
        state.filters.severity ||
        state.filters.resolved !== '' ||
        state.filters.fromDate ||
        state.filters.toDate ||
        state.filters.search ||
        state.filters.ipAddress
      )
    },

    totalFailedLogins: (state): number => {
      return state.dashboardMetrics?.failedLoginAttempts.total || 0
    },

    totalBlockedIPs: (state): number => {
      return state.dashboardMetrics?.blockedIPs.total || 0
    },

    totalSuspiciousActivities: (state): number => {
      return state.dashboardMetrics?.suspiciousActivity.total || 0
    },
  },

  actions: {
    async fetchDashboardMetrics(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<SecurityDashboardMetrics>(
          '/api/admin/security/dashboard'
        )

        this.dashboardMetrics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch security dashboard metrics'
        console.error('Security dashboard fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchEvents(page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()

        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        if (this.filters.type) {
          params.type = this.filters.type
        }
        if (this.filters.severity) {
          params.severity = this.filters.severity
        }
        if (this.filters.resolved !== '') {
          params.resolved = this.filters.resolved
        }
        if (this.filters.fromDate) {
          params.fromDate = this.filters.fromDate
        }
        if (this.filters.toDate) {
          params.toDate = this.filters.toDate
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }
        if (this.filters.ipAddress) {
          params.ipAddress = this.filters.ipAddress
        }

        const response = await apiService.get<PaginatedResponse<SecurityEventListItem>>(
          '/api/admin/security/events',
          { params }
        )

        this.events = response.data
        this.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages || Math.ceil(response.total / response.limit),
        }
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch security events'
        console.error('Security events fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchEventDetails(eventId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<SecurityEvent>(
          `/api/admin/security/events/${eventId}`
        )

        this.currentEvent = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch event details'
        console.error('Event details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async resolveEvent(eventId: string, notes?: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        await apiService.post(
          `/api/admin/security/events/${eventId}/resolve`,
          { notes }
        )

        // Update local state
        const eventIndex = this.events.findIndex(e => e.id === eventId)
        if (eventIndex !== -1 && this.events[eventIndex]) {
          this.events[eventIndex].resolved = true
        }

        if (this.currentEvent && this.currentEvent.id === eventId) {
          this.currentEvent.resolved = true
          if (notes) {
            this.currentEvent.notes = notes
          }
        }

        const { success } = useNotification()
        success('Security event resolved successfully')
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to resolve event'
        console.error('Resolve event error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchBlockedIPs(page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()

        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        if (this.filters.search) {
          params.search = this.filters.search
        }

        const response = await apiService.get<PaginatedResponse<BlockedIPListItem>>(
          '/api/admin/security/blocked-ips',
          { params }
        )

        this.blockedIPs = response.data
        this.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages || Math.ceil(response.total / response.limit),
        }
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch blocked IPs'
        console.error('Blocked IPs fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchBlockedIPDetails(ipId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<BlockedIP>(
          `/api/admin/security/blocked-ips/${ipId}`
        )

        this.currentBlockedIP = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch blocked IP details'
        console.error('Blocked IP details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async blockIP(ipAddress: string, reason: string, isPermanent = false, expiresAt?: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        await apiService.post('/api/admin/security/block-ip', {
          ipAddress,
          reason,
          isPermanent,
          expiresAt,
        })

        // Refresh blocked IPs list
        await this.fetchBlockedIPs(this.pagination.page)

        const { success } = useNotification()
        success(`IP ${ipAddress} blocked successfully`)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to block IP'
        console.error('Block IP error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async unblockIP(ipId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        await apiService.delete(`/api/admin/security/unblock-ip/${ipId}`)

        // Remove from local state
        this.blockedIPs = this.blockedIPs.filter(ip => ip.id !== ipId)

        if (this.currentBlockedIP && this.currentBlockedIP.id === ipId) {
          this.currentBlockedIP = null
        }

        const { success } = useNotification()
        success('IP unblocked successfully')
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to unblock IP'
        console.error('Unblock IP error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSuspiciousActivities(page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()

        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        if (this.filters.type) {
          params.type = this.filters.type
        }
        if (this.filters.resolved !== '') {
          params.resolved = this.filters.resolved
        }
        if (this.filters.fromDate) {
          params.fromDate = this.filters.fromDate
        }
        if (this.filters.toDate) {
          params.toDate = this.filters.toDate
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }
        if (this.filters.ipAddress) {
          params.ipAddress = this.filters.ipAddress
        }

        const response = await apiService.get<PaginatedResponse<SuspiciousActivityListItem>>(
          '/api/admin/security/suspicious-activity',
          { params }
        )

        this.suspiciousActivities = response.data
        this.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages || Math.ceil(response.total / response.limit),
        }
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch suspicious activities'
        console.error('Suspicious activities fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchActivityDetails(activityId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<SuspiciousActivity>(
          `/api/admin/security/suspicious-activity/${activityId}`
        )

        this.currentActivity = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch activity details'
        console.error('Activity details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async resolveActivity(activityId: string, notes?: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        await apiService.post(
          `/api/admin/security/suspicious-activity/${activityId}/resolve`,
          { notes }
        )

        // Update local state
        const activityIndex = this.suspiciousActivities.findIndex(a => a.id === activityId)
        if (activityIndex !== -1 && this.suspiciousActivities[activityIndex]) {
          this.suspiciousActivities[activityIndex].resolved = true
        }

        if (this.currentActivity && this.currentActivity.id === activityId) {
          this.currentActivity.resolved = true
        }

        const { success } = useNotification()
        success('Suspicious activity resolved successfully')
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to resolve activity'
        console.error('Resolve activity error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    setFilters(filters: Partial<SecurityFilters>): void {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1
    },

    clearFilters(): void {
      this.filters = {
        type: '',
        severity: '',
        resolved: '',
        fromDate: '',
        toDate: '',
        search: '',
        ipAddress: '',
      }
      this.pagination.page = 1
    },

    setPage(page: number): void {
      this.pagination.page = page
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentEvent(): void {
      this.currentEvent = null
    },

    clearCurrentBlockedIP(): void {
      this.currentBlockedIP = null
    },

    clearCurrentActivity(): void {
      this.currentActivity = null
    },

    resetState(): void {
      this.dashboardMetrics = null
      this.events = []
      this.currentEvent = null
      this.blockedIPs = []
      this.currentBlockedIP = null
      this.suspiciousActivities = []
      this.currentActivity = null
      this.filters = {
        type: '',
        severity: '',
        resolved: '',
        fromDate: '',
        toDate: '',
        search: '',
        ipAddress: '',
      }
      this.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      }
      this.loading = false
      this.error = null
      this.lastFetched = null
    },
  },
})
