import { defineStore } from 'pinia'
import type { 
  TenantState, 
  TenantListItem, 
  TenantDetails, 
  TenantFilters,
  TenantSettings,
  PaginatedResponse 
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    tenants: [],
    currentTenant: null,
    filters: {
      status: '',
      search: '',
      businessType: '',
      subscriptionPlan: '',
    },
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
  }),

  getters: {
    activeTenants: (state): TenantListItem[] => {
      return state.tenants.filter(t => t.status === 'active')
    },

    pendingTenants: (state): TenantListItem[] => {
      return state.tenants.filter(t => t.status === 'pending')
    },

    suspendedTenants: (state): TenantListItem[] => {
      return state.tenants.filter(t => t.status === 'suspended')
    },

    hasFilters: (state): boolean => {
      return !!(
        state.filters.status ||
        state.filters.search ||
        state.filters.businessType ||
        state.filters.subscriptionPlan
      )
    },

    totalRevenue: (state): number => {
      return state.tenants.reduce((sum, tenant) => sum + tenant.revenue, 0)
    },

    totalOrders: (state): number => {
      return state.tenants.reduce((sum, tenant) => sum + tenant.orderCount, 0)
    },
  },

  actions: {
    async fetchTenants(page = 1): Promise<void> {
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
        if (this.filters.subscriptionPlan) {
          params.subscriptionPlan = this.filters.subscriptionPlan
        }

        const response = await apiService.get<PaginatedResponse<TenantListItem>>(
          '/api/admin/tenants',
          { params }
        )

        this.tenants = response.data.data
        this.pagination = {
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch tenants'
        console.error('Tenant fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTenantDetails(tenantId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<TenantDetails>(
          `/api/admin/tenants/${tenantId}/details`
        )

        this.currentTenant = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch tenant details'
        console.error('Tenant details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async activateTenant(tenantId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.patch(`/api/admin/tenants/${tenantId}/status`, {
          status: 'active'
        })

        // Update local state
        const tenant = this.tenants.find(t => t.id === tenantId)
        if (tenant) {
          tenant.status = 'active'
        }
        if (this.currentTenant?.id === tenantId) {
          this.currentTenant.status = 'active'
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to activate tenant'
        throw error
      }
    },

    async deactivateTenant(tenantId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.patch(`/api/admin/tenants/${tenantId}/status`, {
          status: 'inactive'
        })

        // Update local state
        const tenant = this.tenants.find(t => t.id === tenantId)
        if (tenant) {
          tenant.status = 'suspended'
        }
        if (this.currentTenant?.id === tenantId) {
          this.currentTenant.status = 'suspended'
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to deactivate tenant'
        throw error
      }
    },

    async suspendTenant(tenantId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.patch(`/api/admin/tenants/${tenantId}/status`, {
          status: 'suspended'
        })

        // Update local state
        const tenant = this.tenants.find(t => t.id === tenantId)
        if (tenant) {
          tenant.status = 'suspended'
        }
        if (this.currentTenant?.id === tenantId) {
          this.currentTenant.status = 'suspended'
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to suspend tenant'
        throw error
      }
    },

    async deleteTenant(tenantId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.delete(`/api/admin/tenants/${tenantId}`)

        // Remove from local state
        this.tenants = this.tenants.filter(t => t.id !== tenantId)
        if (this.currentTenant?.id === tenantId) {
          this.currentTenant = null
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete tenant'
        throw error
      }
    },

    async impersonateTenant(tenantId: string, reason?: string): Promise<string> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<{ token: string; url: string }>(
          `/api/admin/tenants/${tenantId}/impersonate`,
          { reason }
        )

        return response.data.url || response.data.token
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to impersonate tenant'
        throw error
      }
    },

    async fetchTenantStatistics(tenantId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        const response = await apiService.get<any>(
          `/api/admin/tenants/${tenantId}/statistics`
        )

        if (this.currentTenant?.id === tenantId) {
          this.currentTenant.statistics = response.data
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch tenant statistics'
        throw error
      }
    },

    async updateTenantSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<void> {
      try {
        const { apiService } = useApi()
        const response = await apiService.patch<TenantSettings>(
          `/api/admin/tenants/${tenantId}/settings`,
          settings
        )

        // Update local state
        if (this.currentTenant?.id === tenantId) {
          this.currentTenant.settings = { ...this.currentTenant.settings, ...response.data }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update tenant settings'
        throw error
      }
    },

    setFilters(filters: Partial<TenantFilters>): void {
      this.filters = { ...this.filters, ...filters }
      // Reset to page 1 when filters change
      this.pagination.page = 1
    },

    clearFilters(): void {
      this.filters = {
        status: '',
        search: '',
        businessType: '',
        subscriptionPlan: '',
      }
      this.pagination.page = 1
    },

    setPage(page: number): void {
      this.pagination.page = page
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentTenant(): void {
      this.currentTenant = null
    },

    resetState(): void {
      this.tenants = []
      this.currentTenant = null
      this.filters = {
        status: '',
        search: '',
        businessType: '',
        subscriptionPlan: '',
      }
      this.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      }
      this.loading = false
      this.error = null
    },
  },
})
