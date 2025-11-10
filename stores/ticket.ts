import { defineStore } from 'pinia'
import type {
  TicketState,
  TicketListItem,
  Ticket,
  TicketFilters,
  TicketMessage,
  PaginatedResponse
} from '~/types'

const DEFAULT_PAGE_SIZE = 50

export const useTicketStore = defineStore('ticket', {
  state: (): TicketState => ({
    tickets: [],
    currentTicket: null,
    filters: {
      status: '',
      priority: '',
      assignedTo: '',
      tenantId: '',
      search: '',
      fromDate: '',
      toDate: '',
      hasUnread: undefined,
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
    openTickets: (state): TicketListItem[] => {
      return state.tickets.filter(t => t.status === 'open')
    },

    inProgressTickets: (state): TicketListItem[] => {
      return state.tickets.filter(t => t.status === 'in_progress')
    },

    waitingResponseTickets: (state): TicketListItem[] => {
      return state.tickets.filter(t => t.status === 'waiting_response')
    },

    resolvedTickets: (state): TicketListItem[] => {
      return state.tickets.filter(t => t.status === 'resolved')
    },

    closedTickets: (state): TicketListItem[] => {
      return state.tickets.filter(t => t.status === 'closed')
    },

    urgentTickets: (state): TicketListItem[] => {
      return state.tickets.filter(t => t.priority === 'urgent')
    },

    highPriorityTickets: (state): TicketListItem[] => {
      return state.tickets.filter(t => t.priority === 'high')
    },

    unreadTickets: (state): TicketListItem[] => {
      return state.tickets.filter(t => t.hasUnreadMessages)
    },

    hasFilters: (state): boolean => {
      return !!(
        state.filters.status ||
        state.filters.priority ||
        state.filters.assignedTo ||
        state.filters.tenantId ||
        state.filters.search ||
        state.filters.fromDate ||
        state.filters.toDate ||
        state.filters.hasUnread !== undefined
      )
    },

    totalUnread: (state): number => {
      return state.tickets.filter(t => t.hasUnreadMessages).length
    },

    averageResponseTime: (state): number => {
      const resolvedTickets = state.tickets.filter(t => t.status === 'resolved' || t.status === 'closed')
      if (resolvedTickets.length === 0) return 0
      
      const totalTime = resolvedTickets.reduce((sum, t) => sum + t.ticketAge, 0)
      return Math.round(totalTime / resolvedTickets.length)
    },
  },

  actions: {
    async fetchTickets(page = 1): Promise<void> {
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
        if (this.filters.priority) {
          params.priority = this.filters.priority
        }
        if (this.filters.assignedTo) {
          params.assignedTo = this.filters.assignedTo
        }
        if (this.filters.tenantId) {
          params.tenantId = this.filters.tenantId
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
        if (this.filters.hasUnread !== undefined) {
          params.hasUnread = this.filters.hasUnread
        }

        const response = await apiService.get<PaginatedResponse<TicketListItem>>(
          '/api/admin/support/tickets',
          { params }
        )

        this.tickets = response.data.data
        this.pagination = {
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        }
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch tickets'
        console.error('Ticket fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTicketDetails(ticketId: string): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.get<Ticket>(
          `/api/admin/support/tickets/${ticketId}`
        )

        this.currentTicket = response.data

        // Mark ticket as read in local state
        const index = this.tickets.findIndex(t => t.id === ticketId)
        if (index !== -1 && this.tickets[index]) {
          this.tickets[index]!.hasUnreadMessages = false
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch ticket details'
        console.error('Ticket details fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createTicket(data: {
      subject: string
      description: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
      tenantId: string
      assignedTo?: string
    }): Promise<Ticket> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Ticket>(
          '/api/admin/support/tickets',
          data
        )

        // Add to local state
        const ticket = response.data
        if (ticket?.id) {
          const newTicket: TicketListItem = {
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            tenantId: ticket.tenantId,
            tenantName: ticket.tenantName,
            createdBy: ticket.createdBy,
            createdByEmail: ticket.createdByEmail,
            assignedTo: ticket.assignedTo,
            assignedToName: ticket.assignedToName,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            lastReplyAt: ticket.lastReplyAt,
            ticketAge: ticket.ticketAge,
            responseCount: ticket.responseCount,
            hasUnreadMessages: ticket.hasUnreadMessages,
          }
          this.tickets.unshift(newTicket)
          this.currentTicket = ticket
        }

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create ticket'
        console.error('Ticket create error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateTicketStatus(
      ticketId: string,
      status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
    ): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.patch<Ticket>(
          `/api/admin/support/tickets/${ticketId}/status`,
          { status }
        )

        // Update local state
        const ticket = response.data
        if (ticket?.id) {
          const index = this.tickets.findIndex(t => t.id === ticketId)
          if (index !== -1 && this.tickets[index]) {
            this.tickets[index]!.status = status
            this.tickets[index]!.updatedAt = ticket.updatedAt
          }

          if (this.currentTicket?.id === ticketId) {
            this.currentTicket.status = status
            this.currentTicket.updatedAt = ticket.updatedAt
            if (status === 'closed') {
              this.currentTicket.closedAt = ticket.closedAt
              this.currentTicket.closedBy = ticket.closedBy
            }
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update ticket status'
        console.error('Ticket status update error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateTicketPriority(
      ticketId: string,
      priority: 'low' | 'medium' | 'high' | 'urgent'
    ): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.patch<Ticket>(
          `/api/admin/support/tickets/${ticketId}/priority`,
          { priority }
        )

        // Update local state
        const ticket = response.data
        if (ticket?.id) {
          const index = this.tickets.findIndex(t => t.id === ticketId)
          if (index !== -1 && this.tickets[index]) {
            this.tickets[index]!.priority = priority
            this.tickets[index]!.updatedAt = ticket.updatedAt
          }

          if (this.currentTicket?.id === ticketId) {
            this.currentTicket.priority = priority
            this.currentTicket.updatedAt = ticket.updatedAt
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update ticket priority'
        console.error('Ticket priority update error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async assignTicket(ticketId: string, adminUserId: string): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.patch<Ticket>(
          `/api/admin/support/tickets/${ticketId}/assign`,
          { adminUserId }
        )

        // Update local state
        const ticket = response.data
        if (ticket?.id) {
          const index = this.tickets.findIndex(t => t.id === ticketId)
          if (index !== -1 && this.tickets[index]) {
            this.tickets[index]!.assignedTo = ticket.assignedTo
            this.tickets[index]!.assignedToName = ticket.assignedToName
            this.tickets[index]!.updatedAt = ticket.updatedAt
          }

          if (this.currentTicket?.id === ticketId) {
            this.currentTicket.assignedTo = ticket.assignedTo
            this.currentTicket.assignedToName = ticket.assignedToName
            this.currentTicket.updatedAt = ticket.updatedAt
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to assign ticket'
        console.error('Ticket assign error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async replyToTicket(
      ticketId: string,
      data: {
        content: string
        isInternal: boolean
        attachments?: File[]
      }
    ): Promise<TicketMessage> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()

        // Create FormData if there are attachments
        let requestData: any = {
          content: data.content,
          isInternal: data.isInternal,
        }

        if (data.attachments && data.attachments.length > 0) {
          const formData = new FormData()
          formData.append('content', data.content)
          formData.append('isInternal', String(data.isInternal))
          data.attachments.forEach((file) => {
            formData.append('attachments', file)
          })
          requestData = formData
        }

        const response = await apiService.post<TicketMessage>(
          `/api/admin/support/tickets/${ticketId}/reply`,
          requestData
        )

        // Update local state
        const message = response.data
        if (message && this.currentTicket?.id === ticketId) {
          this.currentTicket.messages.push(message)
          this.currentTicket.responseCount++
          this.currentTicket.lastReplyAt = message.createdAt
          this.currentTicket.updatedAt = message.createdAt
        }

        // Update ticket list
        const index = this.tickets.findIndex(t => t.id === ticketId)
        if (index !== -1 && this.tickets[index]) {
          this.tickets[index]!.responseCount++
          this.tickets[index]!.lastReplyAt = message.createdAt
          this.tickets[index]!.updatedAt = message.createdAt
        }

        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to reply to ticket'
        console.error('Ticket reply error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async addInternalNote(ticketId: string, content: string): Promise<TicketMessage> {
      return this.replyToTicket(ticketId, {
        content,
        isInternal: true,
      })
    },

    async closeTicket(ticketId: string, resolution?: string): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Ticket>(
          `/api/admin/support/tickets/${ticketId}/close`,
          { resolution }
        )

        // Update local state
        const ticket = response.data
        if (ticket?.id) {
          const index = this.tickets.findIndex(t => t.id === ticketId)
          if (index !== -1 && this.tickets[index]) {
            this.tickets[index]!.status = 'closed'
            this.tickets[index]!.updatedAt = ticket.updatedAt
          }

          if (this.currentTicket?.id === ticketId) {
            this.currentTicket.status = 'closed'
            this.currentTicket.closedAt = ticket.closedAt
            this.currentTicket.closedBy = ticket.closedBy
            this.currentTicket.resolutionTime = ticket.resolutionTime
            this.currentTicket.updatedAt = ticket.updatedAt
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to close ticket'
        console.error('Ticket close error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async reopenTicket(ticketId: string): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        const response = await apiService.post<Ticket>(
          `/api/admin/support/tickets/${ticketId}/reopen`
        )

        // Update local state
        const ticket = response.data
        if (ticket?.id) {
          const index = this.tickets.findIndex(t => t.id === ticketId)
          if (index !== -1 && this.tickets[index]) {
            this.tickets[index]!.status = 'open'
            this.tickets[index]!.updatedAt = ticket.updatedAt
          }

          if (this.currentTicket?.id === ticketId) {
            this.currentTicket.status = 'open'
            this.currentTicket.closedAt = undefined
            this.currentTicket.closedBy = undefined
            this.currentTicket.updatedAt = ticket.updatedAt
          }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to reopen ticket'
        console.error('Ticket reopen error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async deleteTicket(ticketId: string): Promise<void> {
      this.saving = true
      this.error = null

      try {
        const { apiService } = useApi()
        await apiService.delete(`/api/admin/support/tickets/${ticketId}`)

        // Remove from local state
        this.tickets = this.tickets.filter(t => t.id !== ticketId)
        if (this.currentTicket?.id === ticketId) {
          this.currentTicket = null
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete ticket'
        console.error('Ticket delete error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    setFilters(filters: Partial<TicketFilters>): void {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1
    },

    clearFilters(): void {
      this.filters = {
        status: '',
        priority: '',
        assignedTo: '',
        tenantId: '',
        search: '',
        fromDate: '',
        toDate: '',
        hasUnread: undefined,
      }
      this.pagination.page = 1
    },

    setPage(page: number): void {
      this.pagination.page = page
    },

    clearError(): void {
      this.error = null
    },

    clearCurrentTicket(): void {
      this.currentTicket = null
    },

    resetState(): void {
      this.tickets = []
      this.currentTicket = null
      this.filters = {
        status: '',
        priority: '',
        assignedTo: '',
        tenantId: '',
        search: '',
        fromDate: '',
        toDate: '',
        hasUnread: undefined,
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
