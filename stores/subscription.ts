import { defineStore } from 'pinia'
import type { 
  SubscriptionState, 
  Subscription, 
  SubscriptionFilters,
  BillingHistoryItem,
  PaginatedResponse 
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useSubscriptionStore = defineStore('subscription', {
  state: (): SubscriptionState => ({
    subscriptions: [],
    currentSubscription: null,
    billingHistory: [],
    filters: {
      status: '',
      plan: '',
      billingCycle: '',
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
  }),

  getters: {
    activeSubscriptions: (state): Subscription[] => {
      return state.subscriptions.filter(s => s.status === 'active')
    },

    trialSubscriptions: (state): Subscription[] => {
      return state.subscriptions.filter(s => s.status === 'trial')
    },

    cancelledSubscriptions: (state): Subscription[] => {
      return state.subscriptions.filter(s => s.status === 'cancelled')
    },

    expiredSubscriptions: (state): Subscription[] => {
      return state.subscriptions.filter(s => s.status === 'expired')
    },

    hasFilters: (state): boolean => {
      return !!(
        state.filters.status ||
        state.filters.plan ||
        state.filters.billingCycle ||
        state.filters.search
      )
    },

    totalRevenue: (state): number => {
      return state.subscriptions
        .filter(s => s.status === 'active' || s.status === 'trial')
        .reduce((sum, sub) => sum + sub.plan.price, 0)
    },

    monthlyRecurringRevenue: (state): number => {
      return state.subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, sub) => {
          const monthlyPrice = sub.billingCycle === 'yearly' 
            ? sub.plan.price / 12 
            : sub.plan.price
          return sum + monthlyPrice
        }, 0)
    },

    annualRecurringRevenue: (state): number => {
      return state.subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, sub) => {
          const annualPrice = sub.billingCycle === 'monthly' 
            ? sub.plan.price * 12 
            : sub.plan.price
          return sum + annualPrice
        }, 0)
    },
  },

  actions: {
    async fetchSubscriptions(page = 1): Promise<void> {
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
        if (this.filters.plan) {
          params.plan = this.filters.plan
        }
        if (this.filters.billingCycle) {
          params.billingCycle = this.filters.billingCycle
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }

        const response = await apiService.get<PaginatedResponse<Subscription>>(
          '/api/admin/subscriptions',
          { params }
        )

        this.subscriptions = response.data.data
        this.pagination = {
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch subscriptions'
        console.error('Subscription fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSubscriptionDetails(subscriptionId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<Subscription>(
          `/api/admin/subscriptions/${subscriptionId}`
        )

        this.currentSubscription = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch subscription details'
        console.error('Subscription details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchBillingHistory(
      subscriptionId: string, 
      filters?: { fromDate?: string; toDate?: string; status?: string }
    ): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        
        // Build query parameters
        const params: Record<string, any> = {}
        
        if (filters?.fromDate) {
          params.fromDate = filters.fromDate
        }
        if (filters?.toDate) {
          params.toDate = filters.toDate
        }
        if (filters?.status) {
          params.status = filters.status
        }

        const response = await apiService.get<BillingHistoryItem[]>(
          `/api/admin/subscriptions/${subscriptionId}/billing-history`,
          { params }
        )

        this.billingHistory = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch billing history'
        console.error('Billing history fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async changePlan(subscriptionId: string, newPlanId: string): Promise<void> {
      try {
        const { apiService } = useApi()
        const response = await apiService.patch<Subscription>(
          `/api/admin/subscriptions/${subscriptionId}/change-plan`,
          { planId: newPlanId }
        )

        // Update local state
        const subscription = this.subscriptions.find(s => s.id === subscriptionId)
        if (subscription) {
          subscription.plan = response.data.plan
        }
        if (this.currentSubscription?.id === subscriptionId) {
          this.currentSubscription = response.data
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to change plan'
        throw error
      }
    },

    async extendTrial(subscriptionId: string, newTrialEndDate: string, reason?: string): Promise<void> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<Subscription>(
          `/api/admin/subscriptions/${subscriptionId}/extend-trial`,
          { trialEndsAt: newTrialEndDate, reason }
        )

        // Update local state
        const subscription = this.subscriptions.find(s => s.id === subscriptionId)
        if (subscription) {
          subscription.trialEndsAt = response.data.trialEndsAt
        }
        if (this.currentSubscription?.id === subscriptionId) {
          this.currentSubscription.trialEndsAt = response.data.trialEndsAt
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to extend trial'
        throw error
      }
    },

    async applyDiscount(
      subscriptionId: string, 
      discountType: 'percentage' | 'fixed',
      discountValue: number,
      durationMonths?: number
    ): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post(
          `/api/admin/subscriptions/${subscriptionId}/apply-discount`,
          { 
            type: discountType,
            value: discountValue,
            durationMonths
          }
        )

        // Refresh subscription details
        await this.fetchSubscriptionDetails(subscriptionId)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to apply discount'
        throw error
      }
    },

    async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<Subscription>(
          `/api/admin/subscriptions/${subscriptionId}/cancel`,
          { reason }
        )

        // Update local state
        const subscription = this.subscriptions.find(s => s.id === subscriptionId)
        if (subscription) {
          subscription.status = 'cancelled'
          subscription.cancelledAt = response.data.cancelledAt
        }
        if (this.currentSubscription?.id === subscriptionId) {
          this.currentSubscription.status = 'cancelled'
          this.currentSubscription.cancelledAt = response.data.cancelledAt
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to cancel subscription'
        throw error
      }
    },

    async refundPayment(subscriptionId: string, paymentId: string, amount?: number): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post(
          `/api/admin/subscriptions/${subscriptionId}/refund`,
          { paymentId, amount }
        )

        // Refresh billing history
        await this.fetchBillingHistory(subscriptionId)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to refund payment'
        throw error
      }
    },

    setFilters(filters: Partial<SubscriptionFilters>): void {
      this.filters = { ...this.filters, ...filters }
      // Reset to page 1 when filters change
      this.pagination.page = 1
    },

    clearFilters(): void {
      this.filters = {
        status: '',
        plan: '',
        billingCycle: '',
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

    clearCurrentSubscription(): void {
      this.currentSubscription = null
      this.billingHistory = []
    },

    resetState(): void {
      this.subscriptions = []
      this.currentSubscription = null
      this.billingHistory = []
      this.filters = {
        status: '',
        plan: '',
        billingCycle: '',
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
    },
  },
})
