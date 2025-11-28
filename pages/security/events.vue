<template>
  <div class="security-events-page">
    <div class="security-events-page__header">
      <h1 class="security-events-page__title">Security Events</h1>
      <p class="security-events-page__subtitle">
        Monitor and manage security events
      </p>
    </div>

    <div class="security-events-page__filters">
      <div class="security-events-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search events..."
          class="security-events-page__search"
        />
      </div>

      <div class="security-events-page__filter-group">
        <FormSelect
          v-model="typeFilter"
          :options="typeOptions"
          placeholder="All Types"
          class="security-events-page__filter"
        />

        <FormSelect
          v-model="severityFilter"
          :options="severityOptions"
          placeholder="All Severities"
          class="security-events-page__filter"
        />

        <FormSelect
          v-model="resolvedFilter"
          :options="resolvedOptions"
          placeholder="All Status"
          class="security-events-page__filter"
        />

        <FormInput
          v-model="ipAddressFilter"
          placeholder="Filter by IP..."
          class="security-events-page__filter"
        />

        <FormInput
          v-model="fromDateFilter"
          type="date"
          placeholder="From date"
          class="security-events-page__filter"
        />

        <FormInput
          v-model="toDateFilter"
          type="date"
          placeholder="To date"
          class="security-events-page__filter"
        />

        <button
          v-if="hasFilters"
          class="security-events-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <div v-if="error" class="security-events-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <DataTable
      :columns="columns"
      :data="events"
      :searchable="false"
      :paginated="false"
      empty-message="No security events found"
    >
      <template #cell-timestamp="{ value }">
        {{ formatDateTime(value) }}
      </template>

      <template #cell-severity="{ value }">
        <span :class="['severity-badge', `severity-badge--${value}`]">
          {{ value }}
        </span>
      </template>

      <template #cell-resolved="{ value }">
        <span :class="['status-badge', value ? 'status-badge--resolved' : 'status-badge--unresolved']">
          {{ value ? 'Resolved' : 'Unresolved' }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="security-events-page__actions">
          <button
            class="security-events-page__action-btn security-events-page__action-btn--view"
            @click="viewEventDetails(row.id)"
          >
            View Details
          </button>
          <button
            v-if="!row.resolved"
            class="security-events-page__action-btn security-events-page__action-btn--resolve"
            @click="resolveEvent(row.id)"
          >
            Resolve
          </button>
        </div>
      </template>
    </DataTable>

    <div v-if="totalPages > 1" class="security-events-page__pagination">
      <div class="security-events-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} events
      </div>
      <div class="security-events-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="security-events-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'security-events-page__pagination-btn',
            { 'security-events-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="security-events-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <div v-if="loading" class="security-events-page__loading">
      <div class="security-events-page__spinner"/>
    </div>

    <SecurityEventDetailModal
      :show="showDetailModal"
      :event-id="selectedEventId"
      @close="closeDetailModal"
      @resolved="handleEventResolved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSecurityStore } from '~/stores/security'
import { formatDateTime } from '~/utils/date'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const securityStore = useSecurityStore()
const { showSuccess } = useNotification()

const searchQuery = ref('')
const typeFilter = ref('')
const severityFilter = ref('')
const resolvedFilter = ref('')
const ipAddressFilter = ref('')
const fromDateFilter = ref('')
const toDateFilter = ref('')

const showDetailModal = ref(false)
const selectedEventId = ref<string | null>(null)

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'failed_login', label: 'Failed Login' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'ip_blocked', label: 'IP Blocked' },
  { value: 'brute_force', label: 'Brute Force' },
  { value: 'unauthorized_access', label: 'Unauthorized Access' },
  { value: 'data_breach_attempt', label: 'Data Breach Attempt' },
]

const severityOptions = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
]

const resolvedOptions = [
  { value: '', label: 'All Status' },
  { value: 'false', label: 'Unresolved' },
  { value: 'true', label: 'Resolved' },
]

const columns = [
  { key: 'timestamp', label: 'Timestamp', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'severity', label: 'Severity', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'ipAddress', label: 'IP Address', sortable: false },
  { key: 'resolved', label: 'Status', sortable: true },
]

const events = computed(() => securityStore.events)
const loading = computed(() => securityStore.loading)
const error = computed(() => securityStore.error)
const currentPage = computed(() => securityStore.pagination.page)
const totalPages = computed(() => securityStore.pagination.totalPages)
const total = computed(() => securityStore.pagination.total)
const limit = computed(() => securityStore.pagination.limit)

const hasFilters = computed(() => {
  return !!(
    searchQuery.value ||
    typeFilter.value ||
    severityFilter.value ||
    resolvedFilter.value ||
    ipAddressFilter.value ||
    fromDateFilter.value ||
    toDateFilter.value
  )
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * limit.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + limit.value, total.value)
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

function viewEventDetails(eventId: string): void {
  selectedEventId.value = eventId
  showDetailModal.value = true
}

function closeDetailModal(): void {
  showDetailModal.value = false
  selectedEventId.value = null
}

function handleEventResolved(): void {
  fetchEvents()
}

async function resolveEvent(eventId: string): Promise<void> {
  const { confirm } = useConfirm()
  const confirmed = await confirm({
    title: 'Resolve Security Event',
    message: 'Are you sure you want to mark this event as resolved?',
    confirmText: 'Resolve',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await securityStore.resolveEvent(eventId)
    showSuccess('Security event resolved successfully')
    await fetchEvents()
  } catch (error) {
    console.error('Failed to resolve event:', error)
  }
}

function clearFilters(): void {
  searchQuery.value = ''
  typeFilter.value = ''
  severityFilter.value = ''
  resolvedFilter.value = ''
  ipAddressFilter.value = ''
  fromDateFilter.value = ''
  toDateFilter.value = ''
  securityStore.clearFilters()
  fetchEvents()
}

async function goToPage(page: number): Promise<void> {
  securityStore.setPage(page)
  await fetchEvents()
}

async function fetchEvents(): Promise<void> {
  try {
    await securityStore.fetchEvents(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch security events:', error)
  }
}

async function retryFetch(): Promise<void> {
  securityStore.clearError()
  await fetchEvents()
}

watch(
  [searchQuery, typeFilter, severityFilter, resolvedFilter, ipAddressFilter, fromDateFilter, toDateFilter],
  () => {
    securityStore.setFilters({
      search: searchQuery.value,
      type: typeFilter.value,
      severity: severityFilter.value as any,
      resolved: resolvedFilter.value === '' ? '' : resolvedFilter.value === 'true',
      ipAddress: ipAddressFilter.value,
      fromDate: fromDateFilter.value,
      toDate: toDateFilter.value,
    })
    securityStore.setPage(1)
    fetchEvents()
  },
  { debounce: 300 }
)

onMounted(() => {
  fetchEvents()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.security-events-page {
  padding: $spacing-lg;
}

.security-events-page__header {
  margin-bottom: $spacing-xl;
}

.security-events-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.security-events-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.security-events-page__filters {
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.security-events-page__filter-group {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.security-events-page__search {
  flex: 1;
  min-width: 300px;
}

.security-events-page__filter {
  min-width: 180px;
}

.security-events-page__clear-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;
  font-weight: 600;

  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.security-events-page__error {
  padding: $spacing-md;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    color: $error-color;
    margin: 0;
  }

  button {
    padding: $spacing-xs $spacing-md;
    background: $error-color;
    color: white;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      background: darken($error-color, 10%);
    }
  }
}

.severity-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge--critical {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.severity-badge--warning {
  background: lighten($warning-color, 40%);
  color: darken($warning-color, 20%);
}

.severity-badge--info {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--resolved {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--unresolved {
  background: lighten($warning-color, 40%);
  color: darken($warning-color, 20%);
}

.security-events-page__actions {
  display: flex;
  gap: $spacing-xs;
}

.security-events-page__action-btn {
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: white;
  color: $text-primary;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
  }
}

.security-events-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.security-events-page__action-btn--resolve {
  color: $success-color;
  border-color: $success-color;

  &:hover {
    background: lighten($success-color, 45%);
  }
}

.security-events-page__pagination {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.security-events-page__pagination-info {
  color: $text-secondary;
  font-size: 0.875rem;
}

.security-events-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.security-events-page__pagination-btn {
  padding: $spacing-xs $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: white;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.security-events-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.security-events-page__loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.security-events-page__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid $bg-secondary;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: $breakpoint-md) {
  .security-events-page__filter-group {
    flex-direction: column;
  }

  .security-events-page__search,
  .security-events-page__filter {
    width: 100%;
    min-width: auto;
  }
}
</style>
