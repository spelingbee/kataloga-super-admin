import { defineStore } from 'pinia'
import type { 
  RegistrationState, 
  RegistrationListItem, 
  RegistrationDetails, 
  RegistrationFilters,
  PaginatedResponse 
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useRegistrationStore = defineStore('registration', {
  state: (): RegistrationState => ({
    registrations: [],
    currentRegistration: null,
    filters: {
      status: 'pending',
      search: '',
      businessType: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
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
  }),

  getters: {
    pendingRegistrations: (state): RegistrationListItem[] => {
      return state.registrations.filter(r => r.status === 'pending')
    },

    approvedRegistrations: (state): RegistrationListItem[] => {
      return state.registrations.filter(r => r.status === 'approved')
    },

    rejectedRegistrations: (state): RegistrationListItem[] => {
      return state.registrations.filter(r => r.status === 'rejected')
    },

    infoRequestedRegistrations: (state): RegistrationListItem[] => {
      return state.registrations.filter(r => r.status === 'info_requested')
    },

    hasFilters: (state): boolean => {
      return !!(
        state.filters.status ||
        state.filters.search ||
        state.filters.businessType
      )
    },

    hasSelection: (state): boolean => {
      return state.selectedIds.length > 0
    },

    selectedCount: (state): number => {
      return state.selectedIds.length
    },
  },

  actions: {
    async fetchRegistrations(page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        // Build query parameters
        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        if (this.filters.status) {
          params.status = this.filters.status
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }
        if (this.filters.businessType) {
          params.businessType = this.filters.businessType
        }
        if (this.filters.sortBy) {
          params.sortBy = this.filters.sortBy
        }
        if (this.filters.sortOrder) {
          params.sortOrder = this.filters.sortOrder
        }

        const response = await apiService.get<PaginatedResponse<RegistrationListItem>>(
          '/api/admin/tenants',
          { params }
        )

        this.registrations = response.data
        this.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages || Math.ceil(response.total / response.limit),
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch registrations'
        console.error('Registration fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchRegistrationDetails(registrationId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<RegistrationDetails>(
          `/api/admin/tenants/${registrationId}/details`
        )

        this.currentRegistration = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch registration details'
        console.error('Registration details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async approveRegistration(registrationId: string, notes?: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post(`/api/admin/tenants/${registrationId}/approve`, {
          notes
        })

        // Update local state
        const registration = this.registrations.find(r => r.id === registrationId)
        if (registration) {
          registration.status = 'approved'
        }
        if (this.currentRegistration?.id === registrationId) {
          this.currentRegistration.status = 'approved'
        }

        // Remove from selected if present
        this.selectedIds = this.selectedIds.filter(id => id !== registrationId)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to approve registration'
        throw error
      }
    },

    async rejectRegistration(registrationId: string, reason: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post(`/api/admin/tenants/${registrationId}/reject`, {
          reason
        })

        // Update local state
        const registration = this.registrations.find(r => r.id === registrationId)
        if (registration) {
          registration.status = 'rejected'
        }
        if (this.currentRegistration?.id === registrationId) {
          this.currentRegistration.status = 'rejected'
        }

        // Remove from selected if present
        this.selectedIds = this.selectedIds.filter(id => id !== registrationId)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to reject registration'
        throw error
      }
    },

    async requestInformation(registrationId: string, message: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post(`/api/admin/tenants/${registrationId}/request-info`, {
          message
        })

        // Update local state
        const registration = this.registrations.find(r => r.id === registrationId)
        if (registration) {
          registration.status = 'info_requested'
        }
        if (this.currentRegistration?.id === registrationId) {
          this.currentRegistration.status = 'info_requested'
        }

        // Remove from selected if present
        this.selectedIds = this.selectedIds.filter(id => id !== registrationId)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to request information'
        throw error
      }
    },

    async bulkApprove(registrationIds: string[], notes?: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post('/api/admin/tenants/bulk-approve', {
          registrationIds,
          notes
        })

        // Update local state
        registrationIds.forEach(id => {
          const registration = this.registrations.find(r => r.id === id)
          if (registration) {
            registration.status = 'approved'
          }
        })

        // Clear selection
        this.selectedIds = []
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to bulk approve registrations'
        throw error
      }
    },

    async bulkReject(registrationIds: string[], reason: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post('/api/admin/tenants/bulk-reject', {
          registrationIds,
          reason
        })

        // Update local state
        registrationIds.forEach(id => {
          const registration = this.registrations.find(r => r.id === id)
          if (registration) {
            registration.status = 'rejected'
          }
        })

        // Clear selection
        this.selectedIds = []
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to bulk reject registrations'
        throw error
      }
    },

    setFilters(filters: Partial<RegistrationFilters>): void {
      this.filters = { ...this.filters, ...filters }
      // Reset to page 1 when filters change
      this.pagination.page = 1
    },

    clearFilters(): void {
      this.filters = {
        status: 'pending',
        search: '',
        businessType: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }
      this.pagination.page = 1
    },

    setPage(page: number): void {
      this.pagination.page = page
    },

    toggleSelection(registrationId: string): void {
      const index = this.selectedIds.indexOf(registrationId)
      if (index > -1) {
        this.selectedIds.splice(index, 1)
      } else {
        this.selectedIds.push(registrationId)
      }
    },

    selectAll(): void {
      this.selectedIds = this.registrations.map(r => r.id)
    },

    clearSelection(): void {
      this.selectedIds = []
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentRegistration(): void {
      this.currentRegistration = null
    },

    resetState(): void {
      this.registrations = []
      this.currentRegistration = null
      this.filters = {
        status: 'pending',
        search: '',
        businessType: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
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
    },
  },
})
