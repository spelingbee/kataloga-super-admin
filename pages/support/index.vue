<template>
  <div class="support-tickets-page">
    <div class="support-tickets-page__header">
      <div>
        <h1 class="support-tickets-page__title">Support Tickets</h1>
        <p class="support-tickets-page__subtitle">
          Manage tenant support inquiries and requests
        </p>
      </div>
      <button
        class="support-tickets-page__create-btn"
        @click="openCreateModal"
      >
        + Create Ticket
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="support-tickets-page__stats">
      <div class="support-tickets-page__stat-card">
        <div class="support-tickets-page__stat-label">Open Tickets</div>
        <div class="support-tickets-page__stat-value">{{ openCount }}</div>
      </div>
      <div class="support-tickets-page__stat-card">
        <div class="support-tickets-page__stat-label">In Progress</div>
        <div class="support-tickets-page__stat-value">{{ inProgressCount }}</div>
      </div>
      <div class="support-tickets-page__stat-card">
        <div class="support-tickets-page__stat-label">Unread</div>
        <div class="support-tickets-page__stat-value">{{ unreadCount }}</div>
      </div>
      <div class="support-tickets-page__stat-card">
        <div class="support-tickets-page__stat-label">Avg Response Time</div>
        <div class="support-tickets-page__stat-value">{{ avgResponseTime }}h</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="support-tickets-page__filters">
      <div class="support-tickets-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search tickets..."
          class="support-tickets-page__search"
        />
      </div>

      <div class="support-tickets-page__filter-group">
        <FormSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="support-tickets-page__filter"
        />

        <FormSelect
          v-model="priorityFilter"
          :options="priorityOptions"
          placeholder="All Priorities"
          class="support-tickets-page__filter"
        />

        <FormSelect
          v-model="assignedToFilter"
          :options="assignedToOptions"
          placeholder="All Assignees"
          class="support-tickets-page__filter"
        />

        <FormInput
          v-model="fromDateFilter"
          type="date"
          placeholder="From Date"
          class="support-tickets-page__filter"
        />

        <FormInput
          v-model="toDateFilter"
          type="date"
          placeholder="To Date"
          class="support-tickets-page__filter"
        />

        <label class="support-tickets-page__checkbox">
          <input
            v-model="hasUnreadFilter"
            type="checkbox"
          />
          <span>Unread only</span>
        </label>

        <button
          v-if="hasFilters"
          class="support-tickets-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="support-tickets-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && tickets.length === 0" class="support-tickets-page__loading">
      <p>Loading tickets...</p>
    </div>

    <!-- Data Table -->
    <DataTable
      v-else
      :columns="columns"
      :data="tickets"
      :searchable="false"
      :paginated="false"
      empty-message="No tickets found"
    >
      <!-- Priority Badge -->
      <template #cell-priority="{ value }">
        <span :class="['priority-badge', `priority-badge--${value}`]">
          {{ formatPriority(value) }}
        </span>
      </template>

      <!-- Status Badge -->
      <template #cell-status="{ value }">
        <span :class="['status-badge', `status-badge--${value}`]">
          {{ formatStatus(value) }}
        </span>
      </template>

      <!-- Subject with unread indicator -->
      <template #cell-subject="{ row }">
        <div class="support-tickets-page__subject-cell">
          <span v-if="row.hasUnreadMessages" class="support-tickets-page__unread-indicator">●</span>
          <span class="support-tickets-page__subject-text">{{ truncateText(row.subject, 60) }}</span>
        </div>
      </template>

      <!-- Tenant -->
      <template #cell-tenant="{ row }">
        <div class="support-tickets-page__tenant">
          <span class="support-tickets-page__tenant-name">{{ row.tenantName }}</span>
          <span class="support-tickets-page__tenant-email">{{ row.createdByEmail }}</span>
        </div>
      </template>

      <!-- Assigned To -->
      <template #cell-assignedTo="{ row }">
        <span v-if="row.assignedToName" class="support-tickets-page__assigned">
          {{ row.assignedToName }}
        </span>
        <span v-else class="support-tickets-page__unassigned">Unassigned</span>
      </template>

      <!-- Ticket Age -->
      <template #cell-ticketAge="{ row }">
        <div class="support-tickets-page__age">
          <span :class="{ 'support-tickets-page__age--old': row.ticketAge > 48 }">
            {{ formatTicketAge(row.ticketAge) }}
          </span>
        </div>
      </template>

      <!-- Response Count -->
      <template #cell-responseCount="{ value }">
        <span class="support-tickets-page__response-count">
          {{ value }} {{ value === 1 ? 'reply' : 'replies' }}
        </span>
      </template>

      <!-- Last Reply -->
      <template #cell-lastReplyAt="{ row }">
        <span v-if="row.lastReplyAt" class="support-tickets-page__last-reply">
          {{ formatDateTime(row.lastReplyAt) }}
        </span>
        <span v-else class="support-tickets-page__no-reply">No replies</span>
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="support-tickets-page__actions">
          <button
            class="support-tickets-page__action-btn support-tickets-page__action-btn--view"
            @click="viewTicket(row.id)"
          >
            View
          </button>
          <button
            v-if="row.status !== 'closed'"
            class="support-tickets-page__action-btn support-tickets-page__action-btn--close"
            @click="handleCloseTicket(row.id)"
          >
            Close
          </button>
          <button
            class="support-tickets-page__action-btn support-tickets-page__action-btn--delete"
            @click="handleDelete(row.id)"
          >
            Delete
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="support-tickets-page__pagination">
      <div class="support-tickets-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} tickets
      </div>
      <div class="support-tickets-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="support-tickets-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'support-tickets-page__pagination-btn',
            { 'support-tickets-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="support-tickets-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTicketStore } from '~/stores/ticket'
import DataTable from '~/components/ui/DataTable/DataTable.vue'
import FormInput from '~/components/ui/FormInput.vue'
import FormSelect from '~/components/ui/FormSelect.vue'

const ticketStore = useTicketStore()
const router = useRouter()
const { showNotification } = useNotification()

// Filter state
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const assignedToFilter = ref('')
const fromDateFilter = ref('')
const toDateFilter = ref('')
const hasUnreadFilter = ref(false)

// Filter options
const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_response', label: 'Waiting Response' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const assignedToOptions = [
  { value: '', label: 'All Assignees' },
  // TODO: Load from admin users API
]

// Table columns
const columns = [
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'subject', label: 'Subject', sortable: true },
  { key: 'tenant', label: 'Tenant', sortable: false },
  { key: 'assignedTo', label: 'Assigned To', sortable: false },
  { key: 'ticketAge', label: 'Age', sortable: true },
  { key: 'responseCount', label: 'Replies', sortable: true },
  { key: 'lastReplyAt', label: 'Last Reply', sortable: true },
]

// Computed
const tickets = computed(() => ticketStore.tickets)
const error = computed(() => ticketStore.error)
const loading = computed(() => ticketStore.loading)
const currentPage = computed(() => ticketStore.pagination.page)
const totalPages = computed(() => ticketStore.pagination.totalPages)
const total = computed(() => ticketStore.pagination.total)

const openCount = computed(() => ticketStore.openTickets.length)
const inProgressCount = computed(() => ticketStore.inProgressTickets.length)
const unreadCount = computed(() => ticketStore.totalUnread)
const avgResponseTime = computed(() => ticketStore.averageResponseTime)

const hasFilters = computed(() => {
  return !!(
    searchQuery.value ||
    statusFilter.value ||
    priorityFilter.value ||
    assignedToFilter.value ||
    fromDateFilter.value ||
    toDateFilter.value ||
    hasUnreadFilter.value
  )
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * ticketStore.pagination.limit
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + ticketStore.pagination.limit, total.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Watch filters and apply them
watch([searchQuery, statusFilter, priorityFilter, assignedToFilter, fromDateFilter, toDateFilter, hasUnreadFilter], () => {
  applyFilters()
})

// Methods
const applyFilters = useDebounceFn(() => {
  ticketStore.setFilters({
    search: searchQuery.value,
    status: statusFilter.value as any,
    priority: priorityFilter.value as any,
    assignedTo: assignedToFilter.value,
    fromDate: fromDateFilter.value,
    toDate: toDateFilter.value,
    hasUnread: hasUnreadFilter.value || undefined,
  })
  fetchTickets()
}, 300)

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  priorityFilter.value = ''
  assignedToFilter.value = ''
  fromDateFilter.value = ''
  toDateFilter.value = ''
  hasUnreadFilter.value = false
  ticketStore.clearFilters()
  fetchTickets()
}

const fetchTickets = async () => {
  try {
    await ticketStore.fetchTickets(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
  }
}

const retryFetch = () => {
  ticketStore.clearError()
  fetchTickets()
}

const goToPage = (page: number) => {
  ticketStore.setPage(page)
  fetchTickets()
}

const openCreateModal = () => {
  // TODO: Implement create ticket modal
  showNotification({
    type: 'info',
    message: 'Create ticket modal not yet implemented',
  })
}

const viewTicket = (ticketId: string) => {
  router.push(`/support/${ticketId}`)
}

const handleCloseTicket = async (ticketId: string) => {
  if (!confirm('Are you sure you want to close this ticket?')) return

  try {
    await ticketStore.closeTicket(ticketId)
    showNotification({
      type: 'success',
      message: 'Ticket closed successfully',
    })
    fetchTickets()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to close ticket',
    })
  }
}

const handleDelete = async (ticketId: string) => {
  if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return

  try {
    await ticketStore.deleteTicket(ticketId)
    showNotification({
      type: 'success',
      message: 'Ticket deleted successfully',
    })
    fetchTickets()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to delete ticket',
    })
  }
}

// Format helpers
const formatPriority = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

const formatStatus = (status: string): string => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const formatTicketAge = (hours: number): string => {
  if (hours < 1) return '< 1h'
  if (hours < 24) return `${Math.round(hours)}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Fetch tickets on mount
onMounted(() => {
  fetchTickets()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.support-tickets-page {
  padding: $spacing-xl;
}

.support-tickets-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.support-tickets-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.support-tickets-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.support-tickets-page__create-btn {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.support-tickets-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.support-tickets-page__stat-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.support-tickets-page__stat-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.support-tickets-page__stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
}

.support-tickets-page__filters {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
}

.support-tickets-page__filter-group {
  display: flex;
  gap: $spacing-md;
  align-items: center;

  &:not(:last-child) {
    margin-bottom: $spacing-md;
  }
}

.support-tickets-page__search {
  flex: 1;
  min-width: 300px;
}

.support-tickets-page__filter {
  min-width: 180px;
}

.support-tickets-page__checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
  user-select: none;

  input[type="checkbox"] {
    cursor: pointer;
  }

  span {
    font-size: 0.875rem;
    color: $text-primary;
  }
}

.support-tickets-page__clear-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  cursor: pointer;
  font-weight: 500;
  transition: background $transition-base;

  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.support-tickets-page__error {
  padding: $spacing-lg;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    color: $error-color;
    font-weight: 500;
    margin: 0;
  }

  button {
    padding: $spacing-xs $spacing-md;
    background: $error-color;
    color: white;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      background: darken($error-color, 10%);
    }
  }
}

.support-tickets-page__loading {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
}

.priority-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge--low {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.priority-badge--medium {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.priority-badge--high {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.priority-badge--urgent {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--open {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.status-badge--in_progress {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.status-badge--waiting_response {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge--resolved {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--closed {
  background: lighten($text-light, 20%);
  color: $text-secondary;
}

.support-tickets-page__subject-cell {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.support-tickets-page__unread-indicator {
  color: $primary-color;
  font-size: 1.25rem;
  line-height: 1;
}

.support-tickets-page__subject-text {
  color: $text-primary;
  font-weight: 500;
}

.support-tickets-page__tenant {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.support-tickets-page__tenant-name {
  font-weight: 500;
  color: $text-primary;
}

.support-tickets-page__tenant-email {
  font-size: 0.75rem;
  color: $text-secondary;
}

.support-tickets-page__assigned {
  color: $text-primary;
  font-weight: 500;
}

.support-tickets-page__unassigned {
  color: $text-light;
  font-style: italic;
}

.support-tickets-page__age {
  font-size: 0.875rem;
  color: $text-secondary;
}

.support-tickets-page__age--old {
  color: $error-color;
  font-weight: 600;
}

.support-tickets-page__response-count {
  font-size: 0.875rem;
  color: $text-secondary;
}

.support-tickets-page__last-reply {
  font-size: 0.875rem;
  color: $text-secondary;
}

.support-tickets-page__no-reply {
  color: $text-light;
  font-style: italic;
}

.support-tickets-page__actions {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.support-tickets-page__action-btn {
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-primary;
  color: $text-primary;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all $transition-base;

  &:hover {
    background: $bg-secondary;
  }
}

.support-tickets-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.support-tickets-page__action-btn--close {
  color: $success-color;
  border-color: $success-color;

  &:hover {
    background: lighten($success-color, 45%);
  }
}

.support-tickets-page__action-btn--delete {
  color: $error-color;
  border-color: $error-color;

  &:hover {
    background: lighten($error-color, 45%);
  }
}

.support-tickets-page__pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-lg;
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.support-tickets-page__pagination-info {
  font-size: 0.875rem;
  color: $text-secondary;
}

.support-tickets-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.support-tickets-page__pagination-btn {
  padding: $spacing-xs $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-primary;
  color: $text-primary;
  cursor: pointer;
  font-weight: 500;
  transition: all $transition-base;

  &:hover:not(:disabled) {
    background: $bg-secondary;
    border-color: $primary-color;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.support-tickets-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .support-tickets-page {
    padding: $spacing-lg;
  }

  .support-tickets-page__header {
    flex-direction: column;
    gap: $spacing-md;
  }

  .support-tickets-page__stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .support-tickets-page__filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .support-tickets-page__search,
  .support-tickets-page__filter {
    min-width: auto;
    width: 100%;
  }

  .support-tickets-page__pagination {
    flex-direction: column;
    gap: $spacing-md;
  }
}
</style>
