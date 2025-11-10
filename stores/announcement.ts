import { defineStore } from 'pinia'
import type {
  AnnouncementState,
  AnnouncementListItem,
  Announcement,
  AnnouncementFilters,
  AnnouncementTarget,
  AnnouncementDelivery,
  PaginatedResponse
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useAnnouncementStore = defineStore('announcement', {
  state: (): AnnouncementState => ({
    announcements: [],
    currentAnnouncement: null,
    deliveries: [],
    filters: {
      status: '',
      type: '',
      targetType: '',
      search: '',
      fromDate: '',
      toDate: '',
    },
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    saving: false,
    error: null,
    lastFetched: null,
  }),

  getters: {
    draftAnnouncements: (state): AnnouncementListItem[] => {
      return state.announcements.filter(a => a.status === 'draft')
    },

    scheduledAnnouncements: (state): AnnouncementListItem[] => {
      return state.announcements.filter(a => a.status === 'scheduled')
    },

    sentAnnouncements: (state): AnnouncementListItem[] => {
      return state.announcements.filter(a => a.status === 'sent')
    },

    failedAnnouncements: (state): AnnouncementListItem[] => {
      return state.announcements.filter(a => a.status === 'failed')
    },

    hasFilters: (state): boolean => {
      return !!(
        state.filters.status ||
        state.filters.type ||
        state.filters.targetType ||
        state.filters.search ||
        state.filters.fromDate ||
        state.filters.toDate
      )
    },

    totalSent: (state): number => {
      return state.announcements.reduce((sum, a) => {
        return sum + (a.deliveryStats?.sent || 0)
      }, 0)
    },

    totalDelivered: (state): number => {
      return state.announcements.reduce((sum, a) => {
        return sum + (a.deliveryStats?.delivered || 0)
      }, 0)
    },

    totalOpened: (state): number => {
      return state.announcements.reduce((sum, a) => {
        return sum + (a.deliveryStats?.opened || 0)
      }, 0)
    },
  },

  actions: {
    async fetchAnnouncements(page = 1): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()

        const params: Record<string, any> = {
          page,
          limit: this.pagination.limit,
        }

        if (this.filters.status) {
          params.status = this.filters.status
        }
        if (this.filters.type) {
          params.type = this.filters.type
        }
        if (this.filters.targetType) {
          params.targetType = this.filters.targetType
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

        const response = await apiService.get<PaginatedResponse<AnnouncementListItem>>(
          '/api/admin/announcements',
          { params }
        )

        this.announcements = response.data.data
        this.pagination = {
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        }
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch announcements'
        console.error('Announcement fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAnnouncementDetails(announcementId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<Announcement>(
          `/api/admin/announcements/${announcementId}`
        )

        this.currentAnnouncement = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch announcement details'
        console.error('Announcement details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createAnnouncement(data: {
      title: string
      content: string
      htmlContent?: string
      type: 'info' | 'warning' | 'success' | 'critical'
      target: AnnouncementTarget
      channels: ('email' | 'in_app' | 'telegram')[]
      priority: 'low' | 'medium' | 'high'
      scheduledFor?: string
      expiresAt?: string
    }): Promise<Announcement> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Announcement>(
          '/api/admin/announcements',
          data
        )

        // Add to local state
        const announcement = response.data
        if (announcement?.id && announcement.target) {
          const newAnnouncement: AnnouncementListItem = {
            id: announcement.id,
            title: announcement.title,
            type: announcement.type,
            status: announcement.status,
            targetType: announcement.target.type,
            targetCount: this.calculateTargetCount(announcement.target),
            scheduledFor: announcement.scheduledFor,
            sentAt: announcement.sentAt,
            createdBy: announcement.createdBy,
            createdAt: announcement.createdAt,
            deliveryStats: announcement.deliveryStats,
          }
          this.announcements.unshift(newAnnouncement)
          this.currentAnnouncement = announcement
        }

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create announcement'
        console.error('Announcement create error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateAnnouncement(
      announcementId: string,
      data: Partial<{
        title: string
        content: string
        htmlContent?: string
        type: 'info' | 'warning' | 'success' | 'critical'
        target: AnnouncementTarget
        channels: ('email' | 'in_app' | 'telegram')[]
        priority: 'low' | 'medium' | 'high'
        scheduledFor?: string
        expiresAt?: string
      }>
    ): Promise<Announcement> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.patch<Announcement>(
          `/api/admin/announcements/${announcementId}`,
          data
        )

        // Update local state
        const announcement = response.data
        if (announcement?.target && announcement.id) {
          const index = this.announcements.findIndex(a => a.id === announcementId)
          if (index !== -1) {
            const existing = this.announcements[index]
            if (existing) {
              this.announcements[index] = {
                id: existing.id,
                title: announcement.title,
                type: announcement.type,
                status: announcement.status,
                targetType: announcement.target.type,
                targetCount: this.calculateTargetCount(announcement.target),
                scheduledFor: announcement.scheduledFor,
                sentAt: existing.sentAt,
                createdBy: existing.createdBy,
                createdAt: existing.createdAt,
                deliveryStats: existing.deliveryStats,
              }
            }
          }

          if (this.currentAnnouncement?.id === announcementId) {
            this.currentAnnouncement = announcement
          }
        }

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update announcement'
        console.error('Announcement update error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async deleteAnnouncement(announcementId: string): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        await apiService.delete(`/api/admin/announcements/${announcementId}`)

        // Remove from local state
        this.announcements = this.announcements.filter(a => a.id !== announcementId)
        if (this.currentAnnouncement?.id === announcementId) {
          this.currentAnnouncement = null
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete announcement'
        console.error('Announcement delete error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async sendAnnouncement(announcementId: string): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Announcement>(
          `/api/admin/announcements/${announcementId}/send`
        )

        // Update local state
        const announcement = response.data
        if (announcement?.status && announcement.id) {
          const index = this.announcements.findIndex(a => a.id === announcementId)
          const existing = this.announcements[index]
          if (index !== -1 && existing) {
            existing.status = announcement.status
            if (announcement.sentAt) {
              existing.sentAt = announcement.sentAt
            }
          }

          if (this.currentAnnouncement?.id === announcementId) {
            this.currentAnnouncement = announcement
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to send announcement'
        console.error('Announcement send error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async scheduleAnnouncement(announcementId: string, scheduledFor: string): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Announcement>(
          `/api/admin/announcements/${announcementId}/schedule`,
          { scheduledFor }
        )

        // Update local state
        const announcement = response.data
        if (announcement?.status && announcement.id) {
          const index = this.announcements.findIndex(a => a.id === announcementId)
          const existing = this.announcements[index]
          if (index !== -1 && existing) {
            existing.status = 'scheduled'
            existing.scheduledFor = scheduledFor
          }

          if (this.currentAnnouncement?.id === announcementId) {
            this.currentAnnouncement = announcement
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to schedule announcement'
        console.error('Announcement schedule error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async cancelScheduledAnnouncement(announcementId: string): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Announcement>(
          `/api/admin/announcements/${announcementId}/cancel-schedule`
        )

        // Update local state
        const announcement = response.data
        if (announcement?.status && announcement.id) {
          const index = this.announcements.findIndex(a => a.id === announcementId)
          const existing = this.announcements[index]
          if (index !== -1 && existing) {
            existing.status = 'draft'
            existing.scheduledFor = undefined
          }

          if (this.currentAnnouncement?.id === announcementId) {
            this.currentAnnouncement = announcement
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to cancel scheduled announcement'
        console.error('Announcement cancel schedule error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async fetchDeliveryTracking(announcementId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<PaginatedResponse<AnnouncementDelivery>>(
          `/api/admin/announcements/${announcementId}/deliveries`
        )

        this.deliveries = response.data.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch delivery tracking'
        console.error('Delivery tracking fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async previewTargets(target: AnnouncementTarget): Promise<{ count: number; tenants: any[] }> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<{ count: number; tenants: any[] }>(
          '/api/admin/announcements/preview-targets',
          { target }
        )

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to preview targets'
        console.error('Preview targets error:', error)
        throw error
      }
    },

    calculateTargetCount(target: AnnouncementTarget): number {
      if (target.type === 'all') {
        return 0 // Will be calculated on backend
      }
      if (target.type === 'specific' && target.tenantIds) {
        return target.tenantIds.length
      }
      return 0
    },

    setFilters(filters: Partial<AnnouncementFilters>): void {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1
    },

    clearFilters(): void {
      this.filters = {
        status: '',
        type: '',
        targetType: '',
        search: '',
        fromDate: '',
        toDate: '',
      }
      this.pagination.page = 1
    },

    setPage(page: number): void {
      this.pagination.page = page
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentAnnouncement(): void {
      this.currentAnnouncement = null
      this.deliveries = []
    },

    resetState(): void {
      this.announcements = []
      this.currentAnnouncement = null
      this.deliveries = []
      this.filters = {
        status: '',
        type: '',
        targetType: '',
        search: '',
        fromDate: '',
        toDate: '',
      }
      this.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      }
      this.loading = false
      this.saving = false
      this.error = null
      this.lastFetched = null
    },
  },
})
