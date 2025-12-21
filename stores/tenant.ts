import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  TenantListItem, 
  TenantDetails, 
  TenantFilters,
  TenantSettings,
  PaginatedResponse 
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useTenantStore = defineStore('tenant', () => {
  // State
  const tenants = ref<TenantListItem[]>([])
  const currentTenant = ref<TenantDetails | null>(null)
  const filters = ref<TenantFilters>({
    status: '',
    search: '',
    businessType: '',
    subscriptionPlan: '',
  })
  const pagination = ref({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeTenants = computed((): TenantListItem[] => {
    return tenants.value.filter(t => t.status === 'active')
  })

  const pendingTenants = computed((): TenantListItem[] => {
    return tenants.value.filter(t => t.status === 'pending')
  })

  const suspendedTenants = computed((): TenantListItem[] => {
    return tenants.value.filter(t => t.status === 'suspended')
  })

  const hasFilters = computed((): boolean => {
    return !!(
      filters.value.status ||
      filters.value.search ||
      filters.value.businessType ||
      filters.value.subscriptionPlan
    )
  })

  const totalRevenue = computed((): number => {
    return tenants.value.reduce((sum, tenant) => sum + tenant.revenue, 0)
  })

  const totalOrders = computed((): number => {
    return tenants.value.reduce((sum, tenant) => sum + tenant.orderCount, 0)
  })

  // Actions
  const fetchTenants = async (page = 1): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const { apiService } = useApi()
      
      // Build query parameters
      const params: Record<string, any> = {
        page,
        limit: pagination.value.limit,
      }

      if (filters.value.status) {
        params.status = filters.value.status
      }
      if (filters.value.search) {
        params.search = filters.value.search
      }
      if (filters.value.businessType) {
        params.businessType = filters.value.businessType
      }
      if (filters.value.subscriptionPlan) {
        params.subscriptionPlan = filters.value.subscriptionPlan
      }

      const response = await apiService.get<PaginatedResponse<TenantListItem>>(
        '/api/admin/tenants',
        { params }
      )

      tenants.value = response.data
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages || Math.ceil(response.total / response.limit),
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch tenants'
      console.error('Tenant fetch error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTenantDetails = async (tenantId: string): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const { apiService } = useApi()
      const response = await apiService.get<TenantDetails>(
        `/api/admin/tenants/${tenantId}/details`
      )

      currentTenant.value = response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch tenant details'
      console.error('Tenant details fetch error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const activateTenant = async (tenantId: string): Promise<void> => {
    try {
      const { apiService } = useApi()
      await apiService.patch(`/api/admin/tenants/${tenantId}/status`, {
        status: 'active'
      })

      // Update local state
      const tenant = tenants.value.find(t => t.id === tenantId)
      if (tenant) {
        tenant.status = 'active'
      }
      if (currentTenant.value?.id === tenantId) {
        currentTenant.value.status = 'active'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to activate tenant'
      throw err
    }
  }

  const deactivateTenant = async (tenantId: string): Promise<void> => {
    try {
      const { apiService } = useApi()
      await apiService.patch(`/api/admin/tenants/${tenantId}/status`, {
        status: 'inactive'
      })

      // Update local state
      const tenant = tenants.value.find(t => t.id === tenantId)
      if (tenant) {
        tenant.status = 'suspended'
      }
      if (currentTenant.value?.id === tenantId) {
        currentTenant.value.status = 'suspended'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to deactivate tenant'
      throw err
    }
  }

  const suspendTenant = async (tenantId: string): Promise<void> => {
    try {
      const { apiService } = useApi()
      await apiService.patch(`/api/admin/tenants/${tenantId}/status`, {
        status: 'suspended'
      })

      // Update local state
      const tenant = tenants.value.find(t => t.id === tenantId)
      if (tenant) {
        tenant.status = 'suspended'
      }
      if (currentTenant.value?.id === tenantId) {
        currentTenant.value.status = 'suspended'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to suspend tenant'
      throw err
    }
  }

  const deleteTenant = async (tenantId: string): Promise<void> => {
    try {
      const { apiService } = useApi()
      await apiService.delete(`/api/admin/tenants/${tenantId}`)

      // Remove from local state
      tenants.value = tenants.value.filter(t => t.id !== tenantId)
      if (currentTenant.value?.id === tenantId) {
        currentTenant.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete tenant'
      throw err
    }
  }

  const impersonateTenant = async (tenantId: string, reason?: string): Promise<string> => {
    try {
      const { apiService } = useApi()
      const response = await apiService.post<{ token: string; url: string }>(
        `/api/admin/tenants/${tenantId}/impersonate`,
        { reason }
      )

      return response.url || response.token
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to impersonate tenant'
      throw err
    }
  }

  const fetchTenantStatistics = async (tenantId: string): Promise<void> => {
    try {
      const { apiService } = useApi()
      const response = await apiService.get<any>(
        `/api/admin/tenants/${tenantId}/statistics`
      )

      if (currentTenant.value?.id === tenantId) {
        currentTenant.value.statistics = response
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch tenant statistics'
      throw err
    }
  }

  const updateTenantSettings = async (tenantId: string, settings: Partial<TenantSettings>): Promise<void> => {
    try {
      const { apiService } = useApi()
      const response = await apiService.patch<TenantSettings>(
        `/api/admin/tenants/${tenantId}/settings`,
        settings
      )

      // Update local state
      if (currentTenant.value?.id === tenantId) {
        currentTenant.value.settings = { ...currentTenant.value.settings, ...response }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update tenant settings'
      throw err
    }
  }

  const setFilters = (newFilters: Partial<TenantFilters>): void => {
    filters.value = { ...filters.value, ...newFilters }
    // Reset to page 1 when filters change
    pagination.value.page = 1
  }

  const clearFilters = (): void => {
    filters.value = {
      status: '',
      search: '',
      businessType: '',
      subscriptionPlan: '',
    }
    pagination.value.page = 1
  }

  const setPage = (page: number): void => {
    pagination.value.page = page
  }

  const clearError = (): void => {
    error.value = null
  }

  const clearCurrentTenant = (): void => {
    currentTenant.value = null
  }

  const resetState = (): void => {
    tenants.value = []
    currentTenant.value = null
    filters.value = {
      status: '',
      search: '',
      businessType: '',
      subscriptionPlan: '',
    }
    pagination.value = {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    }
    loading.value = false
    error.value = null
  }

  return {
    // State
    tenants: readonly(tenants),
    currentTenant: readonly(currentTenant),
    filters: readonly(filters),
    pagination: readonly(pagination),
    loading: readonly(loading),
    error: readonly(error),
    
    // Getters
    activeTenants,
    pendingTenants,
    suspendedTenants,
    hasFilters,
    totalRevenue,
    totalOrders,
    
    // Actions
    fetchTenants,
    fetchTenantDetails,
    activateTenant,
    deactivateTenant,
    suspendTenant,
    deleteTenant,
    impersonateTenant,
    fetchTenantStatistics,
    updateTenantSettings,
    setFilters,
    clearFilters,
    setPage,
    clearError,
    clearCurrentTenant,
    resetState,
  }
})