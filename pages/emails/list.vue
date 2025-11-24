<template>
  <div class="email-list-page">
    <div class="email-list-page__header">
      <div>
        <h1 class="email-list-page__title">Email List</h1>
        <p class="email-list-page__subtitle">
          View and manage all sent emails
        </p>
      </div>
      <NuxtLink to="/emails" class="email-list-page__back-btn">
        ← Back to Dashboard
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="email-list-page__filters">
      <div class="email-list-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search by recipient, subject..."
          class="email-list-page__search"
        />
      </div>

      <div class="email-list-page__filter-group">
        <FormSelect
          v-model="typeFilter"
          :options="typeOptions"
          placeholder="All Types"
          class="email-list-page__filter"
        />

        <FormSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="email-list-page__filter"
        />

        <FormInput
          v-model="fromDateFilter"
          type="date"
          placeholder="From Date"
          class="email-list-page__filter"
        />

        <FormInput
          v-model="toDateFilter"
          type="date"
          placeholder="To Date"
          class="email-list-page__filter"
        />

        <button
          v-if="hasFilters"
          class="email-list-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedCount > 0" class="email-list-page__bulk-actions">
      <span class="email-list-page__bulk-count">
        {{ selectedCount }} email{{ selectedCount > 1 ? 's' : '' }} selected
      </span>
      <button
        class="email-list-page__bulk-btn email-list-page__bulk-btn--resend"
        @click="handleBulkResend"
      >
        Resend Selected
      </button>
      <button
        class="email-list-page__bulk-btn email-list-page__bulk-btn--delete"
        @click="handleBulkDelete"
      >
        Delete Selected
      </button>
      <button
        class="email-list-page__bulk-btn email-list-page__bulk-btn--clear"
        @click="emailStore.clearSelection()"
      >
        Clear Selection
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="email-list-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Data Table -->
    <DataTable
      :columns="columns"
      :data="emails"
      :searchable="false"
      :paginated="false"
      :selectable="true"
      :selected-ids="emailStore.selectedIds"
      empty-message="No emails found"
      @select="handleSelect"
      @select-all="handleSelectAll"
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

      <!-- Recipient -->
      <template #cell-recipient="{ row }">
        <div class="email-list-page__recipient">
          <div class="email-list-page__recipient-name">
            {{ row.recipientName || row.recipient }}
          </div>
          <div v-if="row.recipientName" class="email-list-page__recipient-email">
            {{ row.recipient }}
          </div>
        </div>
      </template>

      <!-- Subject -->
      <template #cell-subject="{ value }">
        <div class="email-list-page__subject">
          {{ truncateText(value, 50) }}
        </div>
      </template>

      <!-- Tenant -->
      <template #cell-tenantName="{ value }">
        <span v-if="value" class="email-list-page__tenant">
          {{ value }}
        </span>
        <span v-else class="email-list-page__tenant-empty">—</span>
      </template>

      <!-- Sent Date -->
      <template #cell-sentAt="{ value }">
        {{ formatDateTime(value) }}
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="email-list-page__actions">
          <button
            class="email-list-page__action-btn email-list-page__action-btn--view"
            @click="viewEmail(row.id)"
          >
            View
          </button>
          <button
            v-if="row.status === 'failed' || row.status === 'bounced'"
            class="email-list-page__action-btn email-list-page__action-btn--resend"
            @click="handleResend(row.id)"
          >
            Resend
          </button>
          <button
            class="email-list-page__action-btn email-list-page__action-btn--delete"
            @click="handleDelete(row.id)"
          >
            Delete
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="email-list-page__pagination">
      <div class="email-list-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} emails
      </div>
      <div class="email-list-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="email-list-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'email-list-page__pagination-btn',
            { 'email-list-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="email-list-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmailStore } from '~/stores/email'
import DataTable from '~/components/ui/DataTable/DataTable.vue'
import FormInput from '~/components/ui/FormInput.vue'
import FormSelect from '~/components/ui/FormSelect.vue'

const emailStore = useEmailStore()
const router = useRouter()

// Filter state
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const fromDateFilter = ref('')
const toDateFilter = ref('')

// Filter options
const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'approval', label: 'Approval' },
  { value: 'rejection', label: 'Rejection' },
  { value: 'notification', label: 'Notification' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'system', label: 'System' },
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'opened', label: 'Opened' },
  { value: 'clicked', label: 'Clicked' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
]

// Table columns
const columns = [
  { key: 'type', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'recipient', label: 'Recipient', sortable: true },
  { key: 'subject', label: 'Subject', sortable: false },
  { key: 'tenantName', label: 'Tenant', sortable: true },
  { key: 'sentAt', label: 'Sent At', sortable: true },
]

// Computed
const emails = computed(() => emailStore.emails)
const error = computed(() => emailStore.error)
const currentPage = computed(() => emailStore.pagination.page)
const totalPages = computed(() => emailStore.pagination.totalPages)
const total = computed(() => emailStore.pagination.total)
const selectedCount = computed(() => emailStore.selectedIds.length)

const hasFilters = computed(() => {
  return !!(
    searchQuery.value ||
    typeFilter.value ||
    statusFilter.value ||
    fromDateFilter.value ||
    toDateFilter.value
  )
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * emailStore.pagination.limit
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + emailStore.pagination.limit, total.value)
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
watch([searchQuery, typeFilter, statusFilter, fromDateFilter, toDateFilter], () => {
  applyFilters()
})

// Methods
const applyFilters = useDebounceFn(() => {
  emailStore.setFilters({
    search: searchQuery.value,
    type: typeFilter.value as any,
    status: statusFilter.value as any,
    fromDate: fromDateFilter.value,
    toDate: toDateFilter.value,
  })
  fetchEmails()
}, 300)

const clearFilters = () => {
  searchQuery.value = ''
  typeFilter.value = ''
  statusFilter.value = ''
  fromDateFilter.value = ''
  toDateFilter.value = ''
  emailStore.clearFilters()
  fetchEmails()
}

const fetchEmails = async () => {
  try {
    await emailStore.fetchEmails(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch emails:', error)
  }
}

const retryFetch = () => {
  emailStore.clearError()
  fetchEmails()
}

const goToPage = (page: number) => {
  emailStore.setPage(page)
  fetchEmails()
}

const viewEmail = (emailId: string) => {
  router.push(`/emails/${emailId}`)
}

const handleResend = async (emailId: string) => {
  if (!confirm('Are you sure you want to resend this email?')) return

  try {
    await emailStore.resendEmail(emailId)
    alert('Email resent successfully')
  } catch (error) {
    alert('Failed to resend email')
  }
}

const handleDelete = async (emailId: string) => {
  if (!confirm('Are you sure you want to delete this email?')) return

  try {
    await emailStore.deleteEmail(emailId)
    alert('Email deleted successfully')
  } catch (error) {
    alert('Failed to delete email')
  }
}

const handleSelect = (emailId: string) => {
  emailStore.toggleSelection(emailId)
}

const handleSelectAll = () => {
  if (selectedCount.value === emails.value.length) {
    emailStore.clearSelection()
  } else {
    emailStore.selectAll()
  }
}

const handleBulkResend = async () => {
  if (!confirm(`Are you sure you want to resend ${selectedCount.value} email(s)?`)) return

  try {
    await emailStore.bulkResend(emailStore.selectedIds)
    alert('Emails resent successfully')
    emailStore.clearSelection()
  } catch (error) {
    alert('Failed to resend emails')
  }
}

const handleBulkDelete = async () => {
  if (!confirm(`Are you sure you want to delete ${selectedCount.value} email(s)?`)) return

  try {
    await emailStore.bulkDelete(emailStore.selectedIds)
    alert('Emails deleted successfully')
  } catch (error) {
    alert('Failed to delete emails')
  }
}

// Format helpers
const formatType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1)
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

// Fetch emails on mount
onMounted(() => {
  fetchEmails()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.email-list-page {
  padding: $spacing-xl;
}

.email-list-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.email-list-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-list-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.email-list-page__back-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  text-decoration: none;
  font-weight: 500;
  transition: background $transition-base;
  
  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.email-list-page__filters {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
}

.email-list-page__filter-group {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  
  &:not(:last-child) {
    margin-bottom: $spacing-md;
  }
}

.email-list-page__search {
  flex: 1;
  min-width: 300px;
}

.email-list-page__filter {
  min-width: 180px;
}

.email-list-page__clear-btn {
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

.email-list-page__bulk-actions {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  padding: $spacing-md $spacing-lg;
  background: $info-color;
  color: white;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
}

.email-list-page__bulk-count {
  font-weight: 600;
  margin-right: auto;
}

.email-list-page__bulk-btn {
  padding: $spacing-xs $spacing-md;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: background $transition-base;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.email-list-page__bulk-btn--delete {
  background: $error-color;
  border-color: darken($error-color, 10%);
  
  &:hover {
    background: darken($error-color, 10%);
  }
}

.email-list-page__bulk-btn--clear {
  background: transparent;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.email-list-page__error {
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

.type-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge--welcome {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.type-badge--approval {
  background: lighten($primary-color, 40%);
  color: $primary-color;
}

.type-badge--rejection {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.type-badge--notification {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.type-badge--announcement {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.type-badge--system {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--sent {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge--delivered {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--opened {
  background: lighten($primary-color, 40%);
  color: $primary-color;
}

.status-badge--clicked {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.status-badge--bounced {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.status-badge--failed {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge--pending {
  background: lighten($secondary-color, 45%);
  color: $secondary-color;
}

.email-list-page__recipient {
  display: flex;
  flex-direction: column;
}

.email-list-page__recipient-name {
  font-weight: 500;
  color: $text-primary;
}

.email-list-page__recipient-email {
  font-size: 0.75rem;
  color: $text-secondary;
}

.email-list-page__subject {
  color: $text-primary;
}

.email-list-page__tenant {
  font-size: 0.875rem;
  color: $text-secondary;
}

.email-list-page__tenant-empty {
  color: $text-light;
}

.email-list-page__actions {
  display: flex;
  gap: $spacing-xs;
}

.email-list-page__action-btn {
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

.email-list-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;
  
  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.email-list-page__action-btn--resend {
  color: $success-color;
  border-color: $success-color;
  
  &:hover {
    background: lighten($success-color, 45%);
  }
}

.email-list-page__action-btn--delete {
  color: $error-color;
  border-color: $error-color;
  
  &:hover {
    background: lighten($error-color, 45%);
  }
}

.email-list-page__pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-lg;
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.email-list-page__pagination-info {
  font-size: 0.875rem;
  color: $text-secondary;
}

.email-list-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.email-list-page__pagination-btn {
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

.email-list-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .email-list-page {
    padding: $spacing-lg;
  }
  
  .email-list-page__header {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .email-list-page__filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .email-list-page__search,
  .email-list-page__filter {
    min-width: auto;
    width: 100%;
  }
  
  .email-list-page__pagination {
    flex-direction: column;
    gap: $spacing-md;
  }
}
</style>
