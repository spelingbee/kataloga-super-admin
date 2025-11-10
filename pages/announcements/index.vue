<template>
  <div class="announcements-page">
    <div class="announcements-page__header">
      <div>
        <h1 class="announcements-page__title">Announcements</h1>
        <p class="announcements-page__subtitle">
          Create and manage announcements to tenants
        </p>
      </div>
      <button
        class="announcements-page__create-btn"
        @click="openComposer"
      >
        + Create Announcement
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="announcements-page__stats">
      <div class="announcements-page__stat-card">
        <div class="announcements-page__stat-label">Total Sent</div>
        <div class="announcements-page__stat-value">{{ totalSent }}</div>
      </div>
      <div class="announcements-page__stat-card">
        <div class="announcements-page__stat-label">Delivered</div>
        <div class="announcements-page__stat-value">{{ totalDelivered }}</div>
      </div>
      <div class="announcements-page__stat-card">
        <div class="announcements-page__stat-label">Opened</div>
        <div class="announcements-page__stat-value">{{ totalOpened }}</div>
      </div>
      <div class="announcements-page__stat-card">
        <div class="announcements-page__stat-label">Scheduled</div>
        <div class="announcements-page__stat-value">{{ scheduledCount }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="announcements-page__filters">
      <div class="announcements-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search announcements..."
          class="announcements-page__search"
        />
      </div>

      <div class="announcements-page__filter-group">
        <FormSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="announcements-page__filter"
        />

        <FormSelect
          v-model="typeFilter"
          :options="typeOptions"
          placeholder="All Types"
          class="announcements-page__filter"
        />

        <FormSelect
          v-model="targetTypeFilter"
          :options="targetTypeOptions"
          placeholder="All Targets"
          class="announcements-page__filter"
        />

        <FormInput
          v-model="fromDateFilter"
          type="date"
          placeholder="From Date"
          class="announcements-page__filter"
        />

        <FormInput
          v-model="toDateFilter"
          type="date"
          placeholder="To Date"
          class="announcements-page__filter"
        />

        <button
          v-if="hasFilters"
          class="announcements-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="announcements-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && announcements.length === 0" class="announcements-page__loading">
      <p>Loading announcements...</p>
    </div>

    <!-- Data Table -->
    <DataTable
      v-else
      :columns="columns"
      :data="announcements"
      :searchable="false"
      :paginated="false"
      empty-message="No announcements found"
    >
      <!-- Type Badge -->
      <template #cell-type="{ value }">
        <span :class="['type-badge', `type-badge--${value}`]">
          {{ formatType(value) }}
        </span>
      </template>

      <!-- Status Badge -->
      <template #cell-status="{ value }">
        <span :class="['status-badge', `status-badge--${value}`]">
          {{ formatStatus(value) }}
        </span>
      </template>

      <!-- Title -->
      <template #cell-title="{ value }">
        <div class="announcements-page__title-cell">
          {{ truncateText(value, 60) }}
        </div>
      </template>

      <!-- Target -->
      <template #cell-targetType="{ row }">
        <div class="announcements-page__target">
          <span class="announcements-page__target-type">
            {{ formatTargetType(row.targetType) }}
          </span>
          <span class="announcements-page__target-count">
            ({{ row.targetCount }} tenant{{ row.targetCount !== 1 ? 's' : '' }})
          </span>
        </div>
      </template>

      <!-- Delivery Stats -->
      <template #cell-deliveryStats="{ row }">
        <div v-if="row.deliveryStats" class="announcements-page__delivery-stats">
          <span class="announcements-page__stat-item">
            <span class="announcements-page__stat-label">Sent:</span>
            <span class="announcements-page__stat-value">{{ row.deliveryStats.sent }}</span>
          </span>
          <span class="announcements-page__stat-item">
            <span class="announcements-page__stat-label">Delivered:</span>
            <span class="announcements-page__stat-value">{{ row.deliveryStats.delivered }}</span>
          </span>
          <span class="announcements-page__stat-item">
            <span class="announcements-page__stat-label">Opened:</span>
            <span class="announcements-page__stat-value">{{ row.deliveryStats.opened }}</span>
          </span>
        </div>
        <span v-else class="announcements-page__no-stats">—</span>
      </template>

      <!-- Scheduled/Sent Date -->
      <template #cell-date="{ row }">
        <div class="announcements-page__date">
          <span v-if="row.scheduledFor && row.status === 'scheduled'">
            {{ formatDateTime(row.scheduledFor) }}
          </span>
          <span v-else-if="row.sentAt">
            {{ formatDateTime(row.sentAt) }}
          </span>
          <span v-else class="announcements-page__no-date">—</span>
        </div>
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="announcements-page__actions">
          <button
            class="announcements-page__action-btn announcements-page__action-btn--view"
            @click="viewAnnouncement(row.id)"
          >
            View
          </button>
          <button
            v-if="row.status === 'draft'"
            class="announcements-page__action-btn announcements-page__action-btn--edit"
            @click="editAnnouncement(row.id)"
          >
            Edit
          </button>
          <button
            v-if="row.status === 'draft'"
            class="announcements-page__action-btn announcements-page__action-btn--send"
            @click="handleSend(row.id)"
          >
            Send Now
          </button>
          <button
            v-if="row.status === 'scheduled'"
            class="announcements-page__action-btn announcements-page__action-btn--cancel"
            @click="handleCancelSchedule(row.id)"
          >
            Cancel
          </button>
          <button
            class="announcements-page__action-btn announcements-page__action-btn--delete"
            @click="handleDelete(row.id)"
          >
            Delete
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="announcements-page__pagination">
      <div class="announcements-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} announcements
      </div>
      <div class="announcements-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="announcements-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'announcements-page__pagination-btn',
            { 'announcements-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="announcements-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Announcement Composer Modal -->
    <AnnouncementComposer
      v-model="showComposer"
      :announcement="selectedAnnouncement"
      :loading="saving"
      @submit="handleSubmit"
      @cancel="closeComposer"
    />
  </div>
</template>

<script setup lang="ts">
import { useAnnouncementStore } from '~/stores/announcement'
import DataTable from '~/components/ui/DataTable.vue'
import FormInput from '~/components/ui/FormInput.vue'
import FormSelect from '~/components/ui/FormSelect.vue'
import AnnouncementComposer from '~/components/announcement/AnnouncementComposer.vue'

const announcementStore = useAnnouncementStore()
const router = useRouter()
const { showNotification } = useNotification()

// State
const showComposer = ref(false)
const selectedAnnouncement = ref(null)

// Filter state
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const targetTypeFilter = ref('')
const fromDateFilter = ref('')
const toDateFilter = ref('')

// Filter options
const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
]

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'success', label: 'Success' },
  { value: 'critical', label: 'Critical' },
]

const targetTypeOptions = [
  { value: '', label: 'All Targets' },
  { value: 'all', label: 'All Tenants' },
  { value: 'specific', label: 'Specific Tenants' },
  { value: 'plan', label: 'By Plan' },
  { value: 'status', label: 'By Status' },
]

// Table columns
const columns = [
  { key: 'type', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'targetType', label: 'Target', sortable: false },
  { key: 'deliveryStats', label: 'Delivery Stats', sortable: false },
  { key: 'date', label: 'Date', sortable: true },
]

// Computed
const announcements = computed(() => announcementStore.announcements)
const error = computed(() => announcementStore.error)
const loading = computed(() => announcementStore.loading)
const saving = computed(() => announcementStore.saving)
const currentPage = computed(() => announcementStore.pagination.page)
const totalPages = computed(() => announcementStore.pagination.totalPages)
const total = computed(() => announcementStore.pagination.total)

const totalSent = computed(() => announcementStore.totalSent)
const totalDelivered = computed(() => announcementStore.totalDelivered)
const totalOpened = computed(() => announcementStore.totalOpened)
const scheduledCount = computed(() => announcementStore.scheduledAnnouncements.length)

const hasFilters = computed(() => {
  return !!(
    searchQuery.value ||
    statusFilter.value ||
    typeFilter.value ||
    targetTypeFilter.value ||
    fromDateFilter.value ||
    toDateFilter.value
  )
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * announcementStore.pagination.limit
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + announcementStore.pagination.limit, total.value)
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
watch([searchQuery, statusFilter, typeFilter, targetTypeFilter, fromDateFilter, toDateFilter], () => {
  applyFilters()
})

// Methods
const applyFilters = useDebounceFn(() => {
  announcementStore.setFilters({
    search: searchQuery.value,
    status: statusFilter.value as any,
    type: typeFilter.value as any,
    targetType: targetTypeFilter.value as any,
    fromDate: fromDateFilter.value,
    toDate: toDateFilter.value,
  })
  fetchAnnouncements()
}, 300)

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  typeFilter.value = ''
  targetTypeFilter.value = ''
  fromDateFilter.value = ''
  toDateFilter.value = ''
  announcementStore.clearFilters()
  fetchAnnouncements()
}

const fetchAnnouncements = async () => {
  try {
    await announcementStore.fetchAnnouncements(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
  }
}

const retryFetch = () => {
  announcementStore.clearError()
  fetchAnnouncements()
}

const goToPage = (page: number) => {
  announcementStore.setPage(page)
  fetchAnnouncements()
}

const openComposer = () => {
  selectedAnnouncement.value = null
  showComposer.value = true
}

const closeComposer = () => {
  showComposer.value = false
  selectedAnnouncement.value = null
}

const viewAnnouncement = (announcementId: string) => {
  router.push(`/announcements/${announcementId}`)
}

const editAnnouncement = async (announcementId: string) => {
  try {
    await announcementStore.fetchAnnouncementDetails(announcementId)
    selectedAnnouncement.value = announcementStore.currentAnnouncement
    showComposer.value = true
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to load announcement details',
    })
  }
}

const handleSubmit = async (data: any) => {
  try {
    if (selectedAnnouncement.value) {
      await announcementStore.updateAnnouncement(selectedAnnouncement.value.id, data)
      showNotification({
        type: 'success',
        message: 'Announcement updated successfully',
      })
    } else {
      await announcementStore.createAnnouncement(data)
      showNotification({
        type: 'success',
        message: 'Announcement created successfully',
      })
    }
    closeComposer()
    fetchAnnouncements()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to save announcement',
    })
  }
}

const handleSend = async (announcementId: string) => {
  if (!confirm('Are you sure you want to send this announcement now?')) return

  try {
    await announcementStore.sendAnnouncement(announcementId)
    showNotification({
      type: 'success',
      message: 'Announcement sent successfully',
    })
    fetchAnnouncements()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to send announcement',
    })
  }
}

const handleCancelSchedule = async (announcementId: string) => {
  if (!confirm('Are you sure you want to cancel this scheduled announcement?')) return

  try {
    await announcementStore.cancelScheduledAnnouncement(announcementId)
    showNotification({
      type: 'success',
      message: 'Scheduled announcement cancelled',
    })
    fetchAnnouncements()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to cancel scheduled announcement',
    })
  }
}

const handleDelete = async (announcementId: string) => {
  if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return

  try {
    await announcementStore.deleteAnnouncement(announcementId)
    showNotification({
      type: 'success',
      message: 'Announcement deleted successfully',
    })
    fetchAnnouncements()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to delete announcement',
    })
  }
}

// Format helpers
const formatType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatTargetType = (type: string): string => {
  const labels: Record<string, string> = {
    all: 'All Tenants',
    specific: 'Specific',
    plan: 'By Plan',
    status: 'By Status',
  }
  return labels[type] || type
}

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Fetch announcements on mount
onMounted(() => {
  fetchAnnouncements()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.announcements-page {
  padding: $spacing-xl;
}

.announcements-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.announcements-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.announcements-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.announcements-page__create-btn {
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

.announcements-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.announcements-page__stat-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.announcements-page__stat-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.announcements-page__stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
}

.announcements-page__filters {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
}

.announcements-page__filter-group {
  display: flex;
  gap: $spacing-md;
  align-items: center;

  &:not(:last-child) {
    margin-bottom: $spacing-md;
  }
}

.announcements-page__search {
  flex: 1;
  min-width: 300px;
}

.announcements-page__filter {
  min-width: 180px;
}

.announcements-page__clear-btn {
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

.announcements-page__error {
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

.announcements-page__loading {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
}

.type-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge--info {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.type-badge--warning {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.type-badge--success {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.type-badge--critical {
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

.status-badge--draft {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge--scheduled {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.status-badge--sent {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--failed {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.announcements-page__title-cell {
  color: $text-primary;
  font-weight: 500;
}

.announcements-page__target {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.announcements-page__target-type {
  font-weight: 500;
  color: $text-primary;
}

.announcements-page__target-count {
  font-size: 0.75rem;
  color: $text-secondary;
}

.announcements-page__delivery-stats {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.announcements-page__stat-item {
  display: flex;
  gap: $spacing-xs;
  font-size: 0.75rem;
}

.announcements-page__stat-item .announcements-page__stat-label {
  color: $text-secondary;
}

.announcements-page__stat-item .announcements-page__stat-value {
  color: $text-primary;
  font-weight: 600;
}

.announcements-page__no-stats,
.announcements-page__no-date {
  color: $text-light;
}

.announcements-page__date {
  font-size: 0.875rem;
  color: $text-secondary;
}

.announcements-page__actions {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.announcements-page__action-btn {
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

.announcements-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.announcements-page__action-btn--edit {
  color: $info-color;
  border-color: $info-color;

  &:hover {
    background: lighten($info-color, 45%);
  }
}

.announcements-page__action-btn--send {
  color: $success-color;
  border-color: $success-color;

  &:hover {
    background: lighten($success-color, 45%);
  }
}

.announcements-page__action-btn--cancel {
  color: $warning-color;
  border-color: $warning-color;

  &:hover {
    background: lighten($warning-color, 45%);
  }
}

.announcements-page__action-btn--delete {
  color: $error-color;
  border-color: $error-color;

  &:hover {
    background: lighten($error-color, 45%);
  }
}

.announcements-page__pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-lg;
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.announcements-page__pagination-info {
  font-size: 0.875rem;
  color: $text-secondary;
}

.announcements-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.announcements-page__pagination-btn {
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

.announcements-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .announcements-page {
    padding: $spacing-lg;
  }

  .announcements-page__header {
    flex-direction: column;
    gap: $spacing-md;
  }

  .announcements-page__stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .announcements-page__filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .announcements-page__search,
  .announcements-page__filter {
    min-width: auto;
    width: 100%;
  }

  .announcements-page__pagination {
    flex-direction: column;
    gap: $spacing-md;
  }
}
</style>
