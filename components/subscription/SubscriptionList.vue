<template>
  <div class="subscription-list">
    <!-- Summary Cards -->
    <div class="subscription-list__summary">
      <div class="subscription-list__summary-card">
        <div class="subscription-list__summary-label">Total Subscriptions</div>
        <div class="subscription-list__summary-value">{{ total }}</div>
      </div>
      <div class="subscription-list__summary-card">
        <div class="subscription-list__summary-label">MRR</div>
        <div class="subscription-list__summary-value">{{ formatCurrency(monthlyRecurringRevenue) }}</div>
      </div>
      <div class="subscription-list__summary-card">
        <div class="subscription-list__summary-label">ARR</div>
        <div class="subscription-list__summary-value">{{ formatCurrency(annualRecurringRevenue) }}</div>
      </div>
      <div class="subscription-list__summary-card">
        <div class="subscription-list__summary-label">Active</div>
        <div class="subscription-list__summary-value">{{ activeCount }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="subscription-list__filters">
      <div class="subscription-list__filter-group">
        <FormInput
          v-model="localSearchQuery"
          placeholder="Search by tenant name..."
          class="subscription-list__search"
        />
      </div>

      <div class="subscription-list__filter-group">
        <FormSelect
          v-model="localStatusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="subscription-list__filter"
        />

        <FormSelect
          v-model="localPlanFilter"
          :options="planOptions"
          placeholder="All Plans"
          class="subscription-list__filter"
        />

        <FormSelect
          v-model="localBillingCycleFilter"
          :options="billingCycleOptions"
          placeholder="All Billing Cycles"
          class="subscription-list__filter"
        />

        <button
          v-if="hasFilters"
          class="subscription-list__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="subscription-list__error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')">Retry</button>
    </div>

    <!-- Data Table -->
    <DataTable
      :columns="columns"
      :data="subscriptions"
      :searchable="false"
      :paginated="false"
      empty-message="No subscriptions found"
    >
      <!-- Tenant Name -->
      <template #cell-tenantName="{ row }">
        <NuxtLink :to="`/tenants/${row.tenantId}`" class="subscription-list__tenant-link">
          {{ row.tenantName }}
        </NuxtLink>
      </template>

      <!-- Plan -->
      <template #cell-plan="{ row }">
        <div class="subscription-list__plan">
          <div class="subscription-list__plan-name">{{ row.plan.name }}</div>
          <div class="subscription-list__plan-price">{{ formatCurrency(row.plan.price) }}/{{ row.billingCycle === 'monthly' ? 'mo' : 'yr' }}</div>
        </div>
      </template>

      <!-- Status Badge -->
      <template #cell-status="{ value }">
        <span :class="['status-badge', `status-badge--${value}`]">
          {{ value }}
        </span>
      </template>

      <!-- Billing Cycle -->
      <template #cell-billingCycle="{ value }">
        <span class="subscription-list__billing-cycle">
          {{ value === 'monthly' ? 'Monthly' : 'Yearly' }}
        </span>
      </template>

      <!-- Current Period -->
      <template #cell-currentPeriod="{ row }">
        <div class="subscription-list__period">
          <div>{{ formatDate(row.currentPeriodStart) }}</div>
          <div class="subscription-list__period-separator">→</div>
          <div>{{ formatDate(row.currentPeriodEnd) }}</div>
        </div>
      </template>

      <!-- Trial Info -->
      <template #cell-trialEndsAt="{ value, row }">
        <span v-if="row.status === 'trial' && value" class="subscription-list__trial">
          {{ formatDate(value) }}
        </span>
        <span v-else class="subscription-list__no-trial">—</span>
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="subscription-list__actions">
          <button
            class="subscription-list__action-btn subscription-list__action-btn--view"
            @click="$emit('view', row.id)"
          >
            View
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="subscription-list__pagination">
      <div class="subscription-list__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} subscriptions
      </div>
      <div class="subscription-list__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="subscription-list__pagination-btn"
          @click="$emit('page-change', currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'subscription-list__pagination-btn',
            { 'subscription-list__pagination-btn--active': page === currentPage },
          ]"
          @click="$emit('page-change', page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="subscription-list__pagination-btn"
          @click="$emit('page-change', currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="subscription-list__loading">
      <div class="subscription-list__spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Subscription } from '~/types'
import { formatDate } from '~/utils/date'

interface Props {
  subscriptions: Subscription[]
  loading?: boolean
  error?: string | null
  currentPage?: number
  totalPages?: number
  total?: number
  limit?: number
  monthlyRecurringRevenue?: number
  annualRecurringRevenue?: number
  activeCount?: number
  searchQuery?: string
  statusFilter?: string
  planFilter?: string
  billingCycleFilter?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 50,
  monthlyRecurringRevenue: 0,
  annualRecurringRevenue: 0,
  activeCount: 0,
  searchQuery: '',
  statusFilter: '',
  planFilter: '',
  billingCycleFilter: '',
})

const emit = defineEmits<{
  view: [id: string]
  'page-change': [page: number]
  'filter-change': [filters: {
    search: string
    status: string
    plan: string
    billingCycle: string
  }]
  retry: []
}>()

// Local filter state
const localSearchQuery = ref(props.searchQuery)
const localStatusFilter = ref(props.statusFilter)
const localPlanFilter = ref(props.planFilter)
const localBillingCycleFilter = ref(props.billingCycleFilter)

// Filter options
const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
]

const planOptions = [
  { value: '', label: 'All Plans' },
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

const billingCycleOptions = [
  { value: '', label: 'All Billing Cycles' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

// Table columns
const columns = [
  { key: 'tenantName', label: 'Tenant', sortable: true },
  { key: 'plan', label: 'Plan', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'billingCycle', label: 'Billing', sortable: true },
  { key: 'currentPeriod', label: 'Current Period', sortable: false },
  { key: 'trialEndsAt', label: 'Trial Ends', sortable: true },
]

// Computed
const hasFilters = computed(() => {
  return !!(localSearchQuery.value || localStatusFilter.value || localPlanFilter.value || localBillingCycleFilter.value)
})

const startIndex = computed(() => {
  return (props.currentPage - 1) * props.limit
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + props.limit, props.total)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(props.totalPages, start + maxVisible - 1)

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

function clearFilters(): void {
  localSearchQuery.value = ''
  localStatusFilter.value = ''
  localPlanFilter.value = ''
  localBillingCycleFilter.value = ''
  emitFilterChange()
}

function emitFilterChange(): void {
  emit('filter-change', {
    search: localSearchQuery.value,
    status: localStatusFilter.value,
    plan: localPlanFilter.value,
    billingCycle: localBillingCycleFilter.value,
  })
}

// Watch filters and emit changes with debounce
let filterTimeout: ReturnType<typeof setTimeout> | null = null
watch([localSearchQuery, localStatusFilter, localPlanFilter, localBillingCycleFilter], () => {
  if (filterTimeout) {
    clearTimeout(filterTimeout)
  }
  filterTimeout = setTimeout(() => {
    emitFilterChange()
  }, 300)
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.subscription-list__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
}

.subscription-list__summary-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.subscription-list__summary-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.subscription-list__summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
}

.subscription-list__filters {
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.subscription-list__filter-group {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.subscription-list__search {
  flex: 1;
  min-width: 300px;
}

.subscription-list__filter {
  min-width: 200px;
}

.subscription-list__clear-btn {
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

.subscription-list__error {
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

.subscription-list__tenant-link {
  color: $primary-color;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.subscription-list__plan {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.subscription-list__plan-name {
  font-weight: 600;
  color: $text-primary;
}

.subscription-list__plan-price {
  font-size: 0.875rem;
  color: $text-secondary;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--trial {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.status-badge--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--cancelled,
.status-badge--expired {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.subscription-list__billing-cycle {
  color: $text-secondary;
  font-size: 0.875rem;
}

.subscription-list__period {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.875rem;
  color: $text-secondary;
}

.subscription-list__period-separator {
  color: $text-light;
}

.subscription-list__trial {
  color: $info-color;
  font-size: 0.875rem;
  font-weight: 500;
}

.subscription-list__no-trial {
  color: $text-light;
}

.subscription-list__actions {
  display: flex;
  gap: $spacing-xs;
}

.subscription-list__action-btn {
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

.subscription-list__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.subscription-list__pagination {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subscription-list__pagination-info {
  color: $text-secondary;
  font-size: 0.875rem;
}

.subscription-list__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.subscription-list__pagination-btn {
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

.subscription-list__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.subscription-list__loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.subscription-list__spinner {
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
  .subscription-list__filter-group {
    flex-direction: column;
  }

  .subscription-list__search,
  .subscription-list__filter {
    width: 100%;
    min-width: auto;
  }

  .subscription-list__summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
