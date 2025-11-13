<template>
  <div class="blocked-ips-page">
    <div class="blocked-ips-page__header">
      <div>
        <h1 class="blocked-ips-page__title">Blocked IP Addresses</h1>
        <p class="blocked-ips-page__subtitle">
          Manage blocked IP addresses
        </p>
      </div>
      <button
        class="blocked-ips-page__add-btn"
        @click="showBlockModal = true"
      >
        <AppIcon name="plus" />
        Block IP Address
      </button>
    </div>

    <div class="blocked-ips-page__filters">
      <div class="blocked-ips-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search by IP address..."
          class="blocked-ips-page__search"
        />

        <button
          v-if="hasFilters"
          class="blocked-ips-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <div v-if="error" class="blocked-ips-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <DataTable
      :columns="columns"
      :data="blockedIPs"
      :searchable="false"
      :paginated="false"
      empty-message="No blocked IP addresses found"
    >
      <template #cell-blockedAt="{ value }">
        {{ formatDateTime(value) }}
      </template>

      <template #cell-expiresAt="{ value, row }">
        <span v-if="row.isPermanent" class="permanent-badge">
          Permanent
        </span>
        <span v-else-if="value">
          {{ formatDateTime(value) }}
        </span>
        <span v-else>
          Never
        </span>
      </template>

      <template #cell-isPermanent="{ value }">
        <span :class="['status-badge', value ? 'status-badge--permanent' : 'status-badge--temporary']">
          {{ value ? 'Permanent' : 'Temporary' }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="blocked-ips-page__actions">
          <button
            class="blocked-ips-page__action-btn blocked-ips-page__action-btn--unblock"
            @click="unblockIP(row.id, row.ipAddress)"
          >
            Unblock
          </button>
        </div>
      </template>
    </DataTable>

    <div v-if="totalPages > 1" class="blocked-ips-page__pagination">
      <div class="blocked-ips-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} IPs
      </div>
      <div class="blocked-ips-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="blocked-ips-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'blocked-ips-page__pagination-btn',
            { 'blocked-ips-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="blocked-ips-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <div v-if="loading" class="blocked-ips-page__loading">
      <div class="blocked-ips-page__spinner"/>
    </div>

    <BlockIPModal
      :show="showBlockModal"
      @close="showBlockModal = false"
      @blocked="handleIPBlocked"
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
const showBlockModal = ref(false)

const columns = [
  { key: 'ipAddress', label: 'IP Address', sortable: true },
  { key: 'reason', label: 'Reason', sortable: false },
  { key: 'attemptCount', label: 'Attempts', sortable: true },
  { key: 'blockedAt', label: 'Blocked At', sortable: true },
  { key: 'expiresAt', label: 'Expires At', sortable: true },
  { key: 'isPermanent', label: 'Type', sortable: true },
]

const blockedIPs = computed(() => securityStore.blockedIPs)
const loading = computed(() => securityStore.loading)
const error = computed(() => securityStore.error)
const currentPage = computed(() => securityStore.pagination.page)
const totalPages = computed(() => securityStore.pagination.totalPages)
const total = computed(() => securityStore.pagination.total)
const limit = computed(() => securityStore.pagination.limit)

const hasFilters = computed(() => {
  return !!searchQuery.value
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

function handleIPBlocked(): void {
  fetchBlockedIPs()
}

async function unblockIP(ipId: string, ipAddress: string): Promise<void> {
  const { confirm } = useConfirm()
  const confirmed = await confirm({
    title: 'Unblock IP Address',
    message: `Are you sure you want to unblock ${ipAddress}?`,
    confirmText: 'Unblock',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await securityStore.unblockIP(ipId)
    showSuccess(`IP ${ipAddress} unblocked successfully`)
    await fetchBlockedIPs()
  } catch (error) {
    console.error('Failed to unblock IP:', error)
  }
}

function clearFilters(): void {
  searchQuery.value = ''
  securityStore.clearFilters()
  fetchBlockedIPs()
}

async function goToPage(page: number): Promise<void> {
  securityStore.setPage(page)
  await fetchBlockedIPs()
}

async function fetchBlockedIPs(): Promise<void> {
  try {
    await securityStore.fetchBlockedIPs(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch blocked IPs:', error)
  }
}

async function retryFetch(): Promise<void> {
  securityStore.clearError()
  await fetchBlockedIPs()
}

watch(
  searchQuery,
  () => {
    securityStore.setFilters({
      search: searchQuery.value,
    })
    securityStore.setPage(1)
    fetchBlockedIPs()
  },
  { debounce: 300 }
)

onMounted(() => {
  fetchBlockedIPs()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.blocked-ips-page {
  padding: $spacing-lg;
}

.blocked-ips-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
  gap: $spacing-md;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.blocked-ips-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.blocked-ips-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.blocked-ips-page__add-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;
  font-weight: 600;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.blocked-ips-page__filters {
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.blocked-ips-page__filter-group {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.blocked-ips-page__search {
  flex: 1;
  min-width: 300px;
}

.blocked-ips-page__clear-btn {
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

.blocked-ips-page__error {
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

.permanent-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
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

.status-badge--permanent {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge--temporary {
  background: lighten($warning-color, 40%);
  color: darken($warning-color, 20%);
}

.blocked-ips-page__actions {
  display: flex;
  gap: $spacing-xs;
}

.blocked-ips-page__action-btn {
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

.blocked-ips-page__action-btn--unblock {
  color: $success-color;
  border-color: $success-color;

  &:hover {
    background: lighten($success-color, 45%);
  }
}

.blocked-ips-page__pagination {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.blocked-ips-page__pagination-info {
  color: $text-secondary;
  font-size: 0.875rem;
}

.blocked-ips-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.blocked-ips-page__pagination-btn {
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

.blocked-ips-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.blocked-ips-page__loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.blocked-ips-page__spinner {
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
  .blocked-ips-page__filter-group {
    flex-direction: column;
  }

  .blocked-ips-page__search {
    width: 100%;
    min-width: auto;
  }
}
</style>
