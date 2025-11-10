<template>
  <div class="audit-logs-page">
    <div class="audit-logs-page__header">
      <h1 class="audit-logs-page__title">Audit Logs</h1>
      <p class="audit-logs-page__subtitle">
        View and monitor all administrative actions
      </p>
    </div>

    <!-- Filters -->
    <div class="audit-logs-page__filters">
      <div class="audit-logs-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search logs..."
          class="audit-logs-page__search"
        />
      </div>

      <div class="audit-logs-page__filter-group">
        <FormInput
          v-model="actionFilter"
          placeholder="Filter by action..."
          class="audit-logs-page__filter"
        />

        <FormInput
          v-model="userFilter"
          placeholder="Filter by user..."
          class="audit-logs-page__filter"
        />

        <FormInput
          v-model="resourceFilter"
          placeholder="Filter by resource..."
          class="audit-logs-page__filter"
        />

        <FormSelect
          v-model="resultFilter"
          :options="resultOptions"
          placeholder="All Results"
          class="audit-logs-page__filter"
        />

        <FormInput
          v-model="fromDateFilter"
          type="date"
          placeholder="From date"
          class="audit-logs-page__filter"
        />

        <FormInput
          v-model="toDateFilter"
          type="date"
          placeholder="To date"
          class="audit-logs-page__filter"
        />

        <button
          v-if="hasFilters"
          class="audit-logs-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>

        <button
          class="audit-logs-page__export-btn"
          @click="showExportModal = true"
        >
          Export
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="audit-logs-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Data Table -->
    <DataTable
      :columns="columns"
      :data="logs"
      :searchable="false"
      :paginated="false"
      empty-message="No audit logs found"
    >
      <!-- Timestamp -->
      <template #cell-timestamp="{ value }">
        {{ formatDateTime(value) }}
      </template>

      <!-- Result Badge -->
      <template #cell-result="{ value }">
        <span :class="['result-badge', `result-badge--${value}`]">
          {{ value }}
        </span>
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="audit-logs-page__actions">
          <button
            class="audit-logs-page__action-btn audit-logs-page__action-btn--view"
            @click="viewLogDetails(row.id)"
          >
            View Details
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="audit-logs-page__pagination">
      <div class="audit-logs-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} logs
      </div>
      <div class="audit-logs-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="audit-logs-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'audit-logs-page__pagination-btn',
            { 'audit-logs-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="audit-logs-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="audit-logs-page__loading">
      <div class="audit-logs-page__spinner"></div>
    </div>

    <!-- Log Detail Modal -->
    <AuditLogDetailModal
      :show="showDetailModal"
      :log-id="selectedLogId"
      @close="closeDetailModal"
    />

    <!-- Export Modal -->
    <ExportAuditLogsModal
      :show="showExportModal"
      @close="showExportModal = false"
      @exported="handleExported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuditStore } from '~/stores/audit'
import { formatDateTime } from '~/utils/date'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const auditStore = useAuditStore()
const { showNotification } = useNotification()

// Filters
const searchQuery = ref('')
const actionFilter = ref('')
const userFilter = ref('')
const resourceFilter = ref('')
const resultFilter = ref('')
const fromDateFilter = ref('')
const toDateFilter = ref('')

// Modal state
const showDetailModal = ref(false)
const selectedLogId = ref<string | null>(null)
const showExportModal = ref(false)

// Filter options
const resultOptions = [
  { value: '', label: 'All Results' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
]

// Table columns
const columns = [
  { key: 'timestamp', label: 'Timestamp', sortable: true },
  { key: 'adminUser', label: 'Admin User', sortable: true },
  { key: 'action', label: 'Action', sortable: true },
  { key: 'resource', label: 'Resource', sortable: true },
  { key: 'resourceId', label: 'Resource ID', sortable: true },
  { key: 'result', label: 'Result', sortable: true },
  { key: 'ipAddress', label: 'IP Address', sortable: false },
]

// Computed
const logs = computed(() => auditStore.logs)
const loading = computed(() => auditStore.loading)
const error = computed(() => auditStore.error)
const currentPage = computed(() => auditStore.pagination.page)
const totalPages = computed(() => auditStore.pagination.totalPages)
const total = computed(() => auditStore.pagination.total)
const limit = computed(() => auditStore.pagination.limit)

const hasFilters = computed(() => {
  return !!(
    searchQuery.value ||
    actionFilter.value ||
    userFilter.value ||
    resourceFilter.value ||
    resultFilter.value ||
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
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Methods
function viewLogDetails(logId: string): void {
  selectedLogId.value = logId
  showDetailModal.value = true
}

function closeDetailModal(): void {
  showDetailModal.value = false
  selectedLogId.value = null
}

function handleExported(): void {
  // Refresh logs after export if needed
  fetchLogs()
}

function clearFilters(): void {
  searchQuery.value = ''
  actionFilter.value = ''
  userFilter.value = ''
  resourceFilter.value = ''
  resultFilter.value = ''
  fromDateFilter.value = ''
  toDateFilter.value = ''
  auditStore.clearFilters()
  fetchLogs()
}

async function goToPage(page: number): Promise<void> {
  auditStore.setPage(page)
  await fetchLogs()
}

async function fetchLogs(): Promise<void> {
  try {
    await auditStore.fetchLogs(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
  }
}

async function retryFetch(): Promise<void> {
  auditStore.clearError()
  await fetchLogs()
}

// Watch filters and refetch
watch(
  [searchQuery, actionFilter, userFilter, resourceFilter, resultFilter, fromDateFilter, toDateFilter],
  () => {
    auditStore.setFilters({
      search: searchQuery.value,
      action: actionFilter.value,
      user: userFilter.value,
      resource: resourceFilter.value,
      result: resultFilter.value as any,
      fromDate: fromDateFilter.value,
      toDate: toDateFilter.value,
    })
    auditStore.setPage(1)
    fetchLogs()
  },
  { debounce: 300 }
)

// Fetch on mount
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.audit-logs-page {
  padding: $spacing-lg;
}

.audit-logs-page__header {
  margin-bottom: $spacing-xl;
}

.audit-logs-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.audit-logs-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.audit-logs-page__filters {
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.audit-logs-page__filter-group {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.audit-logs-page__search {
  flex: 1;
  min-width: 300px;
}

.audit-logs-page__filter {
  min-width: 180px;
}

.audit-logs-page__clear-btn,
.audit-logs-page__export-btn {
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

.audit-logs-page__export-btn {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.audit-logs-page__error {
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

.result-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.result-badge--success {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.result-badge--failure {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.audit-logs-page__actions {
  display: flex;
  gap: $spacing-xs;
}

.audit-logs-page__action-btn {
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

.audit-logs-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.audit-logs-page__pagination {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.audit-logs-page__pagination-info {
  color: $text-secondary;
  font-size: 0.875rem;
}

.audit-logs-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.audit-logs-page__pagination-btn {
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

.audit-logs-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.audit-logs-page__loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.audit-logs-page__spinner {
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
  .audit-logs-page__filter-group {
    flex-direction: column;
  }

  .audit-logs-page__search,
  .audit-logs-page__filter {
    width: 100%;
    min-width: auto;
  }
}
</style>
