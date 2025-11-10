import { defineStore } from 'pinia'
import type { 
  EmailState, 
  EmailListItem, 
  EmailDetails, 
  EmailFilters,
  EmailDashboardMetrics,
  EmailTemplate,
  EmailTemplateListItem,
  EmailProvider,
  PaginatedResponse 
} from '~/types'

const DEFAULT_PAGE_SIZE = 50
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useEmailStore = defineStore('email', {
  state: (): EmailState => ({
    emails: [],
    currentEmail: null,
    dashboardMetrics: null,
    templates: [],
    currentTemplate: null,
    providers: [],
    filters: {
      type: '',
      status: '',
      search: '',
      fromDate: '',
      toDate: '',
      tenantId: '',
    },
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    },
    selectedIds: [],
    loading: false,
    error: null,
    lastFetched: null,
  }),

  getters: {
    deliveredEmails: (state): EmailListItem[] => {
      return state.emails.filter(e => e.status === 'delivered')
    },

    openedEmails: (state): EmailListItem[] => {
      return state.emails.filter(e => e.status === 'opened')
    },

    bouncedEmails: (state): EmailListItem[] => {
      return state.emails.filter(e => e.status === 'bounced')
    },

    failedEmails: (state): EmailListItem[] => {
      return state.emails.filter(e => e.status === 'failed')
    },

    hasFilters: (state): boolean => {
      return !!(
        state.filters.type ||
        state.filters.status ||
        state.filters.search ||
        state.filters.fromDate ||
        state.filters.toDate ||
        state.filters.tenantId
      )
    },

    deliveryRate: (state): number => {
      if (!state.dashboardMetrics) return 0
      return state.dashboardMetrics.deliveryRate
    },

    openRate: (state): number => {
      if (!state.dashboardMetrics) return 0
      return state.dashboardMetrics.openRate
    },

    clickRate: (state): number => {
      if (!state.dashboardMetrics) return 0
      return state.dashboardMetrics.clickRate
    },

    bounceRate: (state): number => {
      if (!state.dashboardMetrics) return 0
      return state.dashboardMetrics.bounceRate
    },

    isCacheValid: (state): boolean => {
      if (!state.lastFetched) return false
      return Date.now() - state.lastFetched < CACHE_DURATION
    },
  },

  actions: {
    async fetchDashboardMetrics(force = false): Promise<void> {
      // Use cache if valid and not forcing refresh
      if (!force && this.isCacheValid && this.dashboardMetrics) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<EmailDashboardMetrics>(
          '/api/admin/email/dashboard'
        )

        this.dashboardMetrics = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch email dashboard metrics'
        console.error('Email dashboard fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchEmails(page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        // Build query parameters
        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        if (this.filters.type) {
          params.type = this.filters.type
        }
        if (this.filters.status) {
          params.status = this.filters.status
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }
        if (this.filters.fromDate) {
          params.fromDate = this.filters.fromDate
        }
        if (this.filters.toDate) {
          params.toDate = this.filters.toDate
        }
        if (this.filters.tenantId) {
          params.tenantId = this.filters.tenantId
        }

        const response = await apiService.get<PaginatedResponse<EmailListItem>>(
          '/api/admin/email/list',
          { params }
        )

        this.emails = response.data.data
        this.pagination = {
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch emails'
        console.error('Email fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchEmailDetails(emailId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<EmailDetails>(
          `/api/admin/email/${emailId}`
        )

        this.currentEmail = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch email details'
        console.error('Email details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async resendEmail(emailId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post(`/api/admin/email/${emailId}/resend`)

        // Refresh email details if currently viewing
        if (this.currentEmail?.id === emailId) {
          await this.fetchEmailDetails(emailId)
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to resend email'
        throw error
      }
    },

    async bulkResend(emailIds: string[]): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post('/api/admin/email/bulk-resend', { emailIds })

        // Refresh email list
        await this.fetchEmails(this.pagination.page)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to bulk resend emails'
        throw error
      }
    },

    async deleteEmail(emailId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.delete(`/api/admin/email/${emailId}`)

        // Remove from local state
        this.emails = this.emails.filter(e => e.id !== emailId)
        if (this.currentEmail?.id === emailId) {
          this.currentEmail = null
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete email'
        throw error
      }
    },

    async bulkDelete(emailIds: string[]): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post('/api/admin/email/bulk-delete', { emailIds })

        // Remove from local state
        this.emails = this.emails.filter(e => !emailIds.includes(e.id))
        this.selectedIds = []
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to bulk delete emails'
        throw error
      }
    },

    setFilters(filters: Partial<EmailFilters>): void {
      this.filters = { ...this.filters, ...filters }
      // Reset to page 1 when filters change
      this.pagination.page = 1
    },

    clearFilters(): void {
      this.filters = {
        type: '',
        status: '',
        search: '',
        fromDate: '',
        toDate: '',
        tenantId: '',
      }
      this.pagination.page = 1
    },

    setPage(page: number): void {
      this.pagination.page = page
    },

    toggleSelection(emailId: string): void {
      const index = this.selectedIds.indexOf(emailId)
      if (index > -1) {
        this.selectedIds.splice(index, 1)
      } else {
        this.selectedIds.push(emailId)
      }
    },

    selectAll(): void {
      this.selectedIds = this.emails.map(e => e.id)
    },

    clearSelection(): void {
      this.selectedIds = []
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentEmail(): void {
      this.currentEmail = null
    },

    // Template Management Actions
    async fetchTemplates(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<EmailTemplateListItem[]>(
          '/api/admin/email/templates'
        )

        this.templates = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch email templates'
        console.error('Template fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTemplateDetails(templateId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<EmailTemplate>(
          `/api/admin/email/templates/${templateId}`
        )

        this.currentTemplate = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch template details'
        console.error('Template details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createTemplate(template: Partial<EmailTemplate>): Promise<EmailTemplate> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<EmailTemplate>(
          '/api/admin/email/templates',
          template
        )

        this.templates.push({
          id: response.data.id,
          name: response.data.name,
          subject: response.data.subject,
          type: response.data.type,
          isActive: response.data.isActive,
          updatedAt: response.data.updatedAt,
        })

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create template'
        console.error('Template create error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateTemplate(templateId: string, template: Partial<EmailTemplate>): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.put<EmailTemplate>(
          `/api/admin/email/templates/${templateId}`,
          template
        )

        // Update in list
        const index = this.templates.findIndex(t => t.id === templateId)
        if (index > -1) {
          this.templates[index] = {
            id: response.data.id,
            name: response.data.name,
            subject: response.data.subject,
            type: response.data.type,
            isActive: response.data.isActive,
            updatedAt: response.data.updatedAt,
          }
        }

        // Update current template if viewing
        if (this.currentTemplate?.id === templateId) {
          this.currentTemplate = response.data
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update template'
        console.error('Template update error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteTemplate(templateId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.delete(`/api/admin/email/templates/${templateId}`)

        // Remove from local state
        this.templates = this.templates.filter(t => t.id !== templateId)
        if (this.currentTemplate?.id === templateId) {
          this.currentTemplate = null
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete template'
        throw error
      }
    },

    async toggleTemplateStatus(templateId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        const response = await apiService.patch<EmailTemplate>(
          `/api/admin/email/templates/${templateId}/toggle`
        )

        // Update in list
        const index = this.templates.findIndex(t => t.id === templateId)
        if (index > -1 && this.templates[index]) {
          this.templates[index].isActive = response.data.isActive
        }

        // Update current template if viewing
        if (this.currentTemplate?.id === templateId) {
          this.currentTemplate.isActive = response.data.isActive
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to toggle template status'
        throw error
      }
    },

    // Provider Management Actions
    async fetchProviders(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<EmailProvider[]>(
          '/api/admin/email/providers'
        )

        this.providers = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch email providers'
        console.error('Provider fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async testProvider(providerId: string): Promise<{ success: boolean; message: string }> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<{ success: boolean; message: string }>(
          `/api/admin/email/providers/${providerId}/test`
        )

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to test provider'
        throw error
      }
    },

    async updateProvider(providerId: string, config: Record<string, any>): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.put<EmailProvider>(
          `/api/admin/email/providers/${providerId}`,
          config
        )

        // Update in list
        const index = this.providers.findIndex(p => p.id === providerId)
        if (index > -1) {
          this.providers[index] = response.data
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update provider'
        console.error('Provider update error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    clearCurrentTemplate(): void {
      this.currentTemplate = null
    },

    resetState(): void {
      this.emails = []
      this.currentEmail = null
      this.dashboardMetrics = null
      this.templates = []
      this.currentTemplate = null
      this.providers = []
      this.filters = {
        type: '',
        status: '',
        search: '',
        fromDate: '',
        toDate: '',
        tenantId: '',
      }
      this.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      }
      this.selectedIds = []
      this.loading = false
      this.error = null
      this.lastFetched = null
    },
  },
})
