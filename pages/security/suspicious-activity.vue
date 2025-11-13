<template>
  <div class="suspicious-activity-page">
    <div class="suspicious-activity-page__header">
      <h1 class="suspicious-activity-page__title">Suspicious Activity</h1>
      <p class="suspicious-activity-page__subtitle">
        Monitor and investigate suspicious activities
      </p>
    </div>

    <div class="suspicious-activity-page__filters">
      <div class="suspicious-activity-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search activities..."
          class="suspicious-activity-page__search"
        />
      </div>

      <div class="suspicious-activity-page__filter-group">
        <FormSelect
          v-model="typeFilter"
          :options="typeOptions"
          placeholder="All Types"
          class="suspicious-activity-page__filter"
        />

        <FormSelect
          v-model="resolvedFilter"
          :options="resolvedOptions"
          placeholder="All Status"
          class="suspicious-activity-page__filter"
        />

        <FormInput
          v-model="ipAddressFilter"
          placeholder="Filter by IP..."
          class="suspicious-activity-page__filter"
        />

        <FormInput
          v-model="fromDateFilter"
          type="date"
          placeholder="From date"
          class="suspicious-activity-page__filter"
        />

        <FormInput
          v-model="toDateFilter"
          type="date"
          placeholder="To date"
          class="suspicious-activity-page__filter"
        />

        <button
          v-if="hasFilters"
          class="suspicious-activity-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <div v-if="error" class="suspicious-activity-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <DataTable
      :columns="columns"
      :data="activities"
      :searchable="false"
      :paginated="false"
      empty-message="No suspicious activities found"
    >
      <template #cell-detectedAt="{ value }">
        {{ formatDateTime(value) }}
      </template>

      <template #cell-riskLevel="{ value, row }">
        <div class="risk-indicator">
          <span :class="['risk-badge', `risk-badge--${value}`]">
            {{ value }}
          </span>
          <span class="risk-score">{{ row.riskScore }}/100</span>
        </div>
      </template>

      <template #cell-resolved="{ value }">
        <span :class="['status-badge', value ? 'status-badge--resolved' : 'status-badge--unresolved']">
          {{ value ? 'Resolved' : 'Unresolved' }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="suspicious-activity-page__actions">
          <button
            class="suspicious-activity-page__action-btn suspicious-activity-page__action-btn--view"
            @click="viewActivityDetails(row.id)"
          >
            View Details
          </button>
          <button
            v-if="!row.resolved"
            class="suspicious-activity-page__action-btn suspicious-activity-page__action-btn--resolve"
            @click="resolveActivity(row.id)"
          >
            Resolve
          </button>
        </div>
      </template>
    </DataTable>

    <div v-if="totalPages > 1" class="suspicious-activity-page__pagination">
      <div class="suspicious-activity-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} activities
      </div>
      <div class="suspicious-activity-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="suspicious-activity-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'suspicious-activity-page__pagination-btn',
            { 'suspicious-activity-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="suspicious-activity-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <div v-if="loading" class="suspicious-activity-page__loading">
      <div class="suspicious-activity-page__spinner"/>
    </div>

    <SuspiciousActivityDetailModal
      :show="showDetailModal"
      :activity-id="selectedActivityId"
      @close="closeDetailModal"
      @resolved="handleActivityResolved"
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
const resolvedFilter = ref('')
const ipAddressFilter = ref('')
const fromDateFilter = ref('')
const toDateFilter = ref('')

const showDetailModal = ref(false)
const selectedActivityId = ref<string | null>(null)

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'multiple_failed_logins', label: 'Multiple Failed Logins' },
  { value: 'unusual_location', label: 'Unusual Location' },
  { value: 'rapid_requests', label: 'Rapid Requests' },
  { value: 'data_scraping', label: 'Data Scraping' },
  { value: 'sql_injection', label: 'SQL Injection' },
  { value: 'xss_attempt', label: 'XSS Attempt' },
]

const resolvedOptions = [
  { value: '', label: 'All Status' },
  { value: 'false', label: 'Unresolved' },
  { value: 'true', label: 'Resolved' },
]

const columns = [
  { key: 'detectedAt', label: 'Detected At', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'riskLevel', label: 'Risk Level', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'ipAddress', label: 'IP Address', sortable: false },
  { key: 'resolved', label: 'Status', sortable: true },
]

const activities = computed(() => securityStore.suspiciousActivities)
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

function viewActivityDetails(activityId: string): void {
  selectedActivityId.value = activityId
  showDetailModal.value = true
}

function closeDetailModal(): void {
  showDetailModal.value = false
  selectedActivityId.value = null
}

function handleActivityResolved(): void {
  fetchActivities()
}

async function resolveActivity(activityId: string): Promise<void> {
  const { confirm } = useConfirm()
  const confirmed = await confirm({
    title: 'Resolve Suspicious Activity',
    message: 'Are you sure you want to mark this activity as resolved?',
    confirmText: 'Resolve',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await securityStore.resolveActivity(activityId)
    showSuccess('Suspicious activity resolved successfully')
    await fetchActivities()
  } catch (error) {
    console.error('Failed to resolve activity:', error)
  }
}

function clearFilters(): void {
  searchQuery.value = ''
  typeFilter.value = ''
  resolvedFilter.value = ''
  ipAddressFilter.value = ''
  fromDateFilter.value = ''
  toDateFilter.value = ''
  securityStore.clearFilters()
  fetchActivities()
}

async function goToPage(page: number): Promise<void> {
  securityStore.setPage(page)
  await fetchActivities()
}

async function fetchActivities(): Promise<void> {
  try {
    await securityStore.fetchSuspiciousActivities(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch suspicious activities:', error)
  }
}

async function retryFetch(): Promise<void> {
  securityStore.clearError()
  await fetchActivities()
}

watch(
  [searchQuery, typeFilter, resolvedFilter, ipAddressFilter, fromDateFilter, toDateFilter],
  () => {
    securityStore.setFilters({
      search: searchQuery.value,
      type: typeFilter.value,
      resolved: resolvedFilter.value === '' ? '' : resolvedFilter.value === 'true',
      ipAddress: ipAddressFilter.value,
      fromDate: fromDateFilter.value,
      toDate: toDateFilter.value,
    })
    securityStore.setPage(1)
    fetchActivities()
  },
  { debounce: 300 }
)

onMounted(() => {
  fetchActivities()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.suspicious-activity-page {
  padding: $spacing-lg;
}

.suspicious-activity-page__header {
  margin-bottom: $spacing-xl;
}

.suspicious-activity-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.suspicious-activity-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.suspicious-activity-page__filters {
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.suspicious-activity-page__filter-group {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.suspicious-activity-page__search {
  flex: 1;
  min-width: 300px;
}

.suspicious-activity-page__filter {
  min-width: 180px;
}

.suspicious-activity-page__clear-btn {
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

.suspicious-activity-page__error {
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

.risk-indicator {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.risk-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.risk-badge--high {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.risk-badge--medium {
  background: lighten($warning-color, 40%);
  color: darken($warning-color, 20%);
}

.risk-badge--low {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.risk-score {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 600;
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

.suspicious-activity-page__actions {
  display: flex;
  gap: $spacing-xs;
}

.suspicious-activity-page__action-btn {
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

.suspicious-activity-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.suspicious-activity-page__action-btn--resolve {
  color: $success-color;
  border-color: $success-color;

  &:hover {
    background: lighten($success-color, 45%);
  }
}

.suspicious-activity-page__pagination {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suspicious-activity-page__pagination-info {
  color: $text-secondary;
  font-size: 0.875rem;
}

.suspicious-activity-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.suspicious-activity-page__pagination-btn {
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

.suspicious-activity-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.suspicious-activity-page__loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.suspicious-activity-page__spinner {
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
  .suspicious-activity-page__filter-group {
    flex-direction: column;
  }

  .suspicious-activity-page__search,
  .suspicious-activity-page__filter {
    width: 100%;
    min-width: auto;
  }
}
</style>
