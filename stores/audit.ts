import { defineStore } from 'pinia'
import type { 
  AuditState, 
  AuditLog, 
  AuditLogListItem, 
  AuditAnalytics,
  AuditFilters,
  PaginatedResponse 
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useAuditStore = defineStore('audit', {
  state: (): AuditState => ({
    logs: [],
    currentLog: null,
    analytics: null,
    filters: {
      action: '',
      user: '',
      resource: '',
      result: '',
      fromDate: '',
      toDate: '',
      search: '',
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
    successfulLogs: (state): AuditLogListItem[] => {
      return state.logs.filter(log => log.result === 'success')
    },

    failedLogs: (state): AuditLogListItem[] => {
      return state.logs.filter(log => log.result === 'failure')
    },

    hasFilters: (state): boolean => {
      return !!(
        state.filters.action ||
        state.filters.user ||
        state.filters.resource ||
        state.filters.result ||
        state.filters.fromDate ||
        state.filters.toDate ||
        state.filters.search
      )
    },

    successRate: (state): number => {
      if (!state.analytics) return 0
      return state.analytics.successRate
    },

    totalActions: (state): number => {
      if (!state.analytics) return 0
      return state.analytics.totalActions
    },
  },

  actions: {
    async fetchLogs(page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        // Build query parameters
        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        if (this.filters.action) {
          params.action = this.filters.action
        }
        if (this.filters.user) {
          params.user = this.filters.user
        }
        if (this.filters.resource) {
          params.resource = this.filters.resource
        }
        if (this.filters.result) {
          params.result = this.filters.result
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

        const response = await apiService.get<PaginatedResponse<AuditLogListItem>>(
          '/api/admin/audit/logs',
          { params }
        )

        this.logs = response.data
        this.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages || Math.ceil(response.total / response.limit),
        }
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch audit logs'
        console.error('Audit logs fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchLogDetails(logId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<AuditLog>(
          `/api/admin/audit/logs/${logId}`
        )

        this.currentLog = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch audit log details'
        console.error('Audit log details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAnalytics(fromDate?: string, toDate?: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        const params: Record<string, any> = {}
        if (fromDate) {
          params.fromDate = fromDate
        }
        if (toDate) {
          params.toDate = toDate
        }

        const response = await apiService.get<AuditAnalytics>(
          '/api/admin/audit/analytics',
          { params }
        )

        this.analytics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch audit analytics'
        console.error('Audit analytics fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async exportLogs(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
      try {
        const { apiService } = useApi()
        
        // Build query parameters with current filters
        const params: Record<string, any> = {
          format,
        }

        if (this.filters.action) {
          params.action = this.filters.action
        }
        if (this.filters.user) {
          params.user = this.filters.user
        }
        if (this.filters.resource) {
          params.resource = this.filters.resource
        }
        if (this.filters.result) {
          params.result = this.filters.result
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

        const response = await apiService.get(
          '/api/admin/audit/logs/export',
          { 
            params,
            responseType: 'blob'
          }
        )

        return response.data as Blob
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to export audit logs'
        console.error('Audit logs export error:', error)
        throw error
      }
    },

    setFilters(filters: Partial<AuditFilters>): void {
      this.filters = { ...this.filters, ...filters }
      // Reset to page 1 when filters change
      this.pagination.page = 1
    },

    clearFilters(): void {
      this.filters = {
        action: '',
        user: '',
        resource: '',
        result: '',
        fromDate: '',
        toDate: '',
        search: '',
      }
      this.pagination.page = 1
    },

    setPage(page: number): void {
      this.pagination.page = page
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentLog(): void {
      this.currentLog = null
    },

    resetState(): void {
      this.logs = []
      this.currentLog = null
      this.analytics = null
      this.filters = {
        action: '',
        user: '',
        resource: '',
        result: '',
        fromDate: '',
        toDate: '',
        search: '',
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
