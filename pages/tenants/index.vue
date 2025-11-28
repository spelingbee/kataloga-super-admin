<template>
  <div class="tenants-page">
    <div class="tenants-page__header">
      <h1 class="tenants-page__title">Tenant Management</h1>
      <p class="tenants-page__subtitle">
        Manage all tenants on the platform
      </p>
    </div>

    <!-- Filters -->
    <div class="tenants-page__filters">
      <div class="tenants-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search by name, slug, or email..."
          class="tenants-page__search"
        />
      </div>

      <div class="tenants-page__filter-group">
        <FormSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="tenants-page__filter"
        />

        <FormSelect
          v-model="businessTypeFilter"
          :options="businessTypeOptions"
          placeholder="All Business Types"
          class="tenants-page__filter"
        />

        <FormSelect
          v-model="subscriptionPlanFilter"
          :options="subscriptionPlanOptions"
          placeholder="All Plans"
          class="tenants-page__filter"
        />

        <button
          v-if="hasFilters"
          class="tenants-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="tenants-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Data Table -->
    <DataTable
      :columns="columns"
      :data="tenants"
      :searchable="false"
      :paginated="false"
      empty-message="No tenants found"
    >
      <!-- Status Badge -->
      <template #cell-status="{ value }">
        <span :class="['status-badge', `status-badge--${value}`]">
          {{ value }}
        </span>
      </template>

      <!-- Subscription Status -->
      <template #cell-subscriptionStatus="{ value }">
        <span :class="['subscription-badge', `subscription-badge--${value}`]">
          {{ value }}
        </span>
      </template>

      <!-- Revenue -->
      <template #cell-revenue="{ value }">
        {{ formatCurrency(value) }}
      </template>

      <!-- Created Date -->
      <template #cell-createdAt="{ value }">
        {{ formatDate(value) }}
      </template>

      <!-- Last Active -->
      <template #cell-lastActive="{ value }">
        {{ formatRelativeTime(value) }}
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="tenants-page__actions">
          <button
            class="tenants-page__action-btn tenants-page__action-btn--view"
            @click="viewTenant(row.id)"
          >
            View
          </button>
          <button
            v-if="row.status === 'suspended'"
            class="tenants-page__action-btn tenants-page__action-btn--activate"
            @click="handleActivate(row.id)"
          >
            Activate
          </button>
          <button
            v-if="row.status === 'active'"
            class="tenants-page__action-btn tenants-page__action-btn--suspend"
            @click="handleSuspend(row.id)"
          >
            Suspend
          </button>
          <button
            class="tenants-page__action-btn tenants-page__action-btn--more"
            @click="showQuickActions(row)"
          >
            ⋮
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="tenants-page__pagination">
      <div class="tenants-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} tenants
      </div>
      <div class="tenants-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="tenants-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'tenants-page__pagination-btn',
            { 'tenants-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="tenants-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="tenants-page__loading">
      <div class="tenants-page__spinner"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTenantStore } from '~/stores/tenant'
import type { TenantListItem } from '~/types'
import { formatDate, formatRelativeTime } from '~/utils/date'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const tenantStore = useTenantStore()
const { showNotification } = useNotification()
const { confirm } = useConfirm()

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const businessTypeFilter = ref('')
const subscriptionPlanFilter = ref('')

// Filter options
const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deleted', label: 'Deleted' },
]

const businessTypeOptions = [
  { value: '', label: 'All Business Types' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bar', label: 'Bar' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'bakery', label: 'Bakery' },
]

const subscriptionPlanOptions = [
  { value: '', label: 'All Plans' },
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

// Table columns
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug', sortable: true },
  { key: 'businessType', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'subscriptionPlan', label: 'Plan', sortable: true },
  { key: 'subscriptionStatus', label: 'Subscription', sortable: true },
  { key: 'revenue', label: 'Revenue', sortable: true },
  { key: 'orderCount', label: 'Orders', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'lastActive', label: 'Last Active', sortable: true },
]

// Computed
const tenants = computed(() => tenantStore.tenants)
const loading = computed(() => tenantStore.loading)
const error = computed(() => tenantStore.error)
const currentPage = computed(() => tenantStore.pagination.page)
const totalPages = computed(() => tenantStore.pagination.totalPages)
const total = computed(() => tenantStore.pagination.total)
const limit = computed(() => tenantStore.pagination.limit)

const hasFilters = computed(() => {
  return !!(searchQuery.value || statusFilter.value || businessTypeFilter.value || subscriptionPlanFilter.value)
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

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function viewTenant(tenantId: string): void {
  router.push(`/tenants/${tenantId}`)
}

async function handleActivate(tenantId: string): Promise<void> {
  const confirmed = await confirm({
    title: 'Activate Tenant',
    message: 'Are you sure you want to activate this tenant?',
    confirmText: 'Activate',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await tenantStore.activateTenant(tenantId)
    showNotification({
      type: 'success',
      message: 'Tenant activated successfully',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to activate tenant',
    })
  }
}

async function handleSuspend(tenantId: string): Promise<void> {
  const confirmed = await confirm({
    title: 'Suspend Tenant',
    message: 'Are you sure you want to suspend this tenant? They will lose access to the platform.',
    confirmText: 'Suspend',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await tenantStore.suspendTenant(tenantId)
    showNotification({
      type: 'success',
      message: 'Tenant suspended successfully',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to suspend tenant',
    })
  }
}

function showQuickActions(tenant: TenantListItem): void {
  // TODO: Implement quick actions menu
  console.log('Quick actions for tenant:', tenant)
}

function clearFilters(): void {
  searchQuery.value = ''
  statusFilter.value = ''
  businessTypeFilter.value = ''
  subscriptionPlanFilter.value = ''
  tenantStore.clearFilters()
  fetchTenants()
}

async function goToPage(page: number): Promise<void> {
  tenantStore.setPage(page)
  await fetchTenants()
}

async function fetchTenants(): Promise<void> {
  try {
    await tenantStore.fetchTenants(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch tenants:', error)
  }
}

async function retryFetch(): Promise<void> {
  tenantStore.clearError()
  await fetchTenants()
}

// Watch filters and refetch
watch([searchQuery, statusFilter, businessTypeFilter, subscriptionPlanFilter], () => {
  tenantStore.setFilters({
    search: searchQuery.value,
    status: statusFilter.value as any,
    businessType: businessTypeFilter.value,
    subscriptionPlan: subscriptionPlanFilter.value,
  })
  tenantStore.setPage(1)
  fetchTenants()
}, { debounce: 300 })

// Fetch on mount
onMounted(() => {
  fetchTenants()
})
</script>

<style scoped lang="scss">
.tenants-page {
  padding: $spacing-lg;
}

.tenants-page__header {
  margin-bottom: $spacing-xl;
}

.tenants-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.tenants-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.tenants-page__filters {
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tenants-page__filter-group {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.tenants-page__search {
  flex: 1;
  min-width: 300px;
}

.tenants-page__filter {
  min-width: 200px;
}

.tenants-page__clear-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.tenants-page__error {
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

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--pending {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.status-badge--suspended {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge--deleted {
  background: $bg-secondary;
  color: $text-secondary;
}

.subscription-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.subscription-badge--trial {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.subscription-badge--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.subscription-badge--cancelled,
.subscription-badge--expired {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.tenants-page__actions {
  display: flex;
  gap: $spacing-xs;
}

.tenants-page__action-btn {
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

.tenants-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.tenants-page__action-btn--activate {
  color: $success-color;
  border-color: $success-color;

  &:hover {
    background: lighten($success-color, 45%);
  }
}

.tenants-page__action-btn--suspend {
  color: $warning-color;
  border-color: $warning-color;

  &:hover {
    background: lighten($warning-color, 45%);
  }
}

.tenants-page__action-btn--more {
  padding: $spacing-xs $spacing-sm;
  font-weight: 700;
}

.tenants-page__pagination {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tenants-page__pagination-info {
  color: $text-secondary;
  font-size: 0.875rem;
}

.tenants-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.tenants-page__pagination-btn {
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

.tenants-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.tenants-page__loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.tenants-page__spinner {
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
  .tenants-page__filter-group {
    flex-direction: column;
  }

  .tenants-page__search,
  .tenants-page__filter {
    width: 100%;
    min-width: auto;
  }
}
</style>
