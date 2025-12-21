import { defineStore } from 'pinia'

export interface Plan {
  id: string
  name: string
  maxUsers: number
  maxSites: number
  price: number
  features: string[]
  isActive: boolean
  trialDays: number
  subscriptionCount: number
  subscriptions?: Array<{
    id: string
    tenantName: string
    status: string
    startDate: string
  }>
}

export interface PlanState {
  plans: Plan[]
  currentPlan: Plan | null
  loading: boolean
  error: string | null
  filters: {
    isActive: boolean | null
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
}

export const usePlanStore = defineStore('plan', {
  state: (): PlanState => ({
    plans: [],
    currentPlan: null,
    loading: false,
    error: null,
    filters: {
      isActive: null,
      sortBy: 'name',
      sortOrder: 'asc',
    },
  }),

  getters: {
    activePlans: (state): Plan[] => {
      if (!state.plans || !Array.isArray(state.plans)) return []
      return state.plans.filter(p => p?.isActive)
    },

    inactivePlans: (state): Plan[] => {
      if (!state.plans || !Array.isArray(state.plans)) return []
      return state.plans.filter(p => !p?.isActive)
    },

    totalSubscriptions: (state): number => {
      if (!state.plans || !Array.isArray(state.plans)) return 0
      return state.plans.reduce((sum, plan) => sum + (plan?.subscriptionCount || 0), 0)
    },
  },

  actions: {
    async fetchPlans(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        const params: Record<string, any> = {}
        
        if (this.filters.isActive !== null) {
          params.isActive = this.filters.isActive
        }
        if (this.filters.sortBy) {
          params.sortBy = this.filters.sortBy
        }
        if (this.filters.sortOrder) {
          params.sortOrder = this.filters.sortOrder
        }

        const response = await apiService.get<{ data: Plan[]; total: number }>(
          '/api/admin/plans',
          { params }
        )

        this.plans = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch plans'
        console.error('Plan fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPlanDetails(planId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<Plan>(
          `/api/admin/plans/${planId}`
        )

        this.currentPlan = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch plan details'
        console.error('Plan details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createPlan(data: {
      name: string
      maxUsers: number
      maxSites: number
      price: number
      features: string[]
      trialDays?: number
      isActive?: boolean
    }): Promise<Plan> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Plan>(
          '/api/admin/plans',
          data
        )

        this.plans.unshift(response.data)
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create plan'
        console.error('Plan creation error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePlan(planId: string, data: Partial<{
      name: string
      maxUsers: number
      maxSites: number
      price: number
      features: string[]
      trialDays: number
      isActive: boolean
    }>): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.patch<Plan>(
          `/api/admin/plans/${planId}`,
          data
        )

        const index = this.plans.findIndex(p => p.id === planId)
        if (index !== -1) {
          this.plans[index] = response.data
        }
        if (this.currentPlan?.id === planId) {
          this.currentPlan = response.data
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update plan'
        console.error('Plan update error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deactivatePlan(planId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.delete<Plan>(
          `/api/admin/plans/${planId}`
        )

        const index = this.plans.findIndex(p => p.id === planId)
        if (index !== -1) {
          this.plans[index] = response.data
        }
        if (this.currentPlan?.id === planId) {
          this.currentPlan = response.data
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to deactivate plan'
        console.error('Plan deactivation error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    setFilters(filters: Partial<PlanState['filters']>): void {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters(): void {
      this.filters = {
        isActive: null,
        sortBy: 'name',
        sortOrder: 'asc',
      }
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentPlan(): void {
      this.currentPlan = null
    },

    resetState(): void {
      this.plans = []
      this.currentPlan = null
      this.loading = false
      this.error = null
      this.filters = {
        isActive: null,
        sortBy: 'name',
        sortOrder: 'asc',
      }
    },
  },
})
