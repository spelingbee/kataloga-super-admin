import { defineStore } from 'pinia'
import type { 
  Plan, 
  PlanFeatures,
  PlanFilters, 
  PlanState,
  ApiResponse,
  PaginatedResponse
} from '~/types'

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

        const response = await apiService.get<PaginatedResponse<Plan>>(
          '/admin/plans',
          { params }
        )

        this.plans = response.data || []
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
          `/admin/plans/${planId}`
        )

        this.currentPlan = response
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
      price: number
      features: PlanFeatures
      trialDays?: number
      isActive?: boolean
      maxLocations?: number
      billingCycle?: 'monthly' | 'yearly'
      displayName?: string | null
      maxCategories?: number
      maxMenuItems?: number
      maxSites?: number
      maxUsers?: number
    }): Promise<Plan> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Plan>(
          '/admin/plans',
          data
        )

        this.plans.unshift(response)
        return response
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
      price: number
      features: PlanFeatures
      trialDays: number
      isActive: boolean
      maxLocations: number
      billingCycle: 'monthly' | 'yearly'
      displayName: string | null
      maxCategories: number
      maxMenuItems: number
      maxSites: number
      maxUsers: number
    }>): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.patch<Plan>(
          `/admin/plans/${planId}`,
          data
        )

        const index = this.plans.findIndex(p => p.id === planId)
        if (index !== -1) {
          this.plans[index] = response
        }
        if (this.currentPlan?.id === planId) {
          this.currentPlan = response
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
          `/admin/plans/${planId}`
        )

        const index = this.plans.findIndex(p => p.id === planId)
        if (index !== -1) {
          this.plans[index] = response
        }
        if (this.currentPlan?.id === planId) {
          this.currentPlan = response
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
