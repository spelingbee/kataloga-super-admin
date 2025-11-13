<template>
  <div class="subscriptions-page">
    <div class="subscriptions-page__header">
      <h1 class="subscriptions-page__title">Subscription Management</h1>
      <p class="subscriptions-page__subtitle">
        Manage all tenant subscriptions and billing
      </p>
    </div>

    <!-- Summary Cards -->
    <div class="subscriptions-page__summary">
      <div class="subscriptions-page__summary-card">
        <div class="subscriptions-page__summary-label">Total Subscriptions</div>
        <div class="subscriptions-page__summary-value">{{ total }}</div>
      </div>
      <div class="subscriptions-page__summary-card">
        <div class="subscriptions-page__summary-label">MRR</div>
        <div class="subscriptions-page__summary-value">{{ formatCurrency(monthlyRecurringRevenue) }}</div>
      </div>
      <div class="subscriptions-page__summary-card">
        <div class="subscriptions-page__summary-label">ARR</div>
        <div class="subscriptions-page__summary-value">{{ formatCurrency(annualRecurringRevenue) }}</div>
      </div>
      <div class="subscriptions-page__summary-card">
        <div class="subscriptions-page__summary-label">Active</div>
        <div class="subscriptions-page__summary-value">{{ activeCount }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="subscriptions-page__filters">
      <div class="subscriptions-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search by tenant name..."
          class="subscriptions-page__search"
        />
      </div>

      <div class="subscriptions-page__filter-group">
        <FormSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="subscriptions-page__filter"
        />

        <FormSelect
          v-model="planFilter"
          :options="planOptions"
          placeholder="All Plans"
          class="subscriptions-page__filter"
        />

        <FormSelect
          v-model="billingCycleFilter"
          :options="billingCycleOptions"
          placeholder="All Billing Cycles"
          class="subscriptions-page__filter"
        />

        <button
          v-if="hasFilters"
          class="subscriptions-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="subscriptions-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
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
        <NuxtLink :to="`/tenants/${row.tenantId}`" class="subscriptions-page__tenant-link">
          {{ row.tenantName }}
        </NuxtLink>
      </template>

      <!-- Plan -->
      <template #cell-plan="{ row }">
        <div class="subscriptions-page__plan">
          <div class="subscriptions-page__plan-name">{{ row.plan.name }}</div>
          <div class="subscriptions-page__plan-price">{{ formatCurrency(row.plan.price) }}/{{ row.billingCycle === 'monthly' ? 'mo' : 'yr' }}</div>
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
        <span class="subscriptions-page__billing-cycle">
          {{ value === 'monthly' ? 'Monthly' : 'Yearly' }}
        </span>
      </template>

      <!-- Current Period -->
      <template #cell-currentPeriod="{ row }">
        <div class="subscriptions-page__period">
          <div>{{ formatDate(row.currentPeriodStart) }}</div>
          <div class="subscriptions-page__period-separator">→</div>
          <div>{{ formatDate(row.currentPeriodEnd) }}</div>
        </div>
      </template>

      <!-- Trial Info -->
      <template #cell-trialEndsAt="{ value, row }">
        <span v-if="row.status === 'trial' && value" class="subscriptions-page__trial">
          {{ formatDate(value) }}
        </span>
        <span v-else class="subscriptions-page__no-trial">—</span>
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="subscriptions-page__actions">
          <button
            class="subscriptions-page__action-btn subscriptions-page__action-btn--view"
            @click="viewSubscription(row.id)"
          >
            View
          </button>
          <button
            class="subscriptions-page__action-btn subscriptions-page__action-btn--more"
            @click="showQuickActions(row)"
          >
            ⋮
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="subscriptions-page__pagination">
      <div class="subscriptions-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} subscriptions
      </div>
      <div class="subscriptions-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="subscriptions-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'subscriptions-page__pagination-btn',
            { 'subscriptions-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="subscriptions-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="subscriptions-page__loading">
      <div class="subscriptions-page__spinner"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '~/stores/subscription'
import type { Subscription } from '~/types'
import { formatDate } from '~/utils/date'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const subscriptionStore = useSubscriptionStore()
const { showNotification } = useNotification()

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const planFilter = ref('')
const billingCycleFilter = ref('')

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
const subscriptions = computed(() => subscriptionStore.subscriptions)
const loading = computed(() => subscriptionStore.loading)
const error = computed(() => subscriptionStore.error)
const currentPage = computed(() => subscriptionStore.pagination.page)
const totalPages = computed(() => subscriptionStore.pagination.totalPages)
const total = computed(() => subscriptionStore.pagination.total)
const limit = computed(() => subscriptionStore.pagination.limit)

const monthlyRecurringRevenue = computed(() => subscriptionStore.monthlyRecurringRevenue)
const annualRecurringRevenue = computed(() => subscriptionStore.annualRecurringRevenue)
const activeCount = computed(() => subscriptionStore.activeSubscriptions.length)

const hasFilters = computed(() => {
  return !!(searchQuery.value || statusFilter.value || planFilter.value || billingCycleFilter.value)
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

function viewSubscription(subscriptionId: string): void {
  router.push(`/subscriptions/${subscriptionId}`)
}

function showQuickActions(subscription: Subscription): void {
  // TODO: Implement quick actions menu
  console.log('Quick actions for subscription:', subscription)
}

function clearFilters(): void {
  searchQuery.value = ''
  statusFilter.value = ''
  planFilter.value = ''
  billingCycleFilter.value = ''
  subscriptionStore.clearFilters()
  fetchSubscriptions()
}

async function goToPage(page: number): Promise<void> {
  subscriptionStore.setPage(page)
  await fetchSubscriptions()
}

async function fetchSubscriptions(): Promise<void> {
  try {
    await subscriptionStore.fetchSubscriptions(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
  }
}

async function retryFetch(): Promise<void> {
  subscriptionStore.clearError()
  await fetchSubscriptions()
}

// Watch filters and refetch
watch([searchQuery, statusFilter, planFilter, billingCycleFilter], () => {
  subscriptionStore.setFilters({
    search: searchQuery.value,
    status: statusFilter.value as any,
    plan: planFilter.value,
    billingCycle: billingCycleFilter.value as any,
  })
  subscriptionStore.setPage(1)
  fetchSubscriptions()
}, { debounce: 300 })

// Fetch on mount
onMounted(() => {
  fetchSubscriptions()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.subscriptions-page {
  padding: $spacing-lg;
}

.subscriptions-page__header {
  margin-bottom: $spacing-xl;
}

.subscriptions-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.subscriptions-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.subscriptions-page__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
}

.subscriptions-page__summary-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.subscriptions-page__summary-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.subscriptions-page__summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
}

.subscriptions-page__filters {
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.subscriptions-page__filter-group {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.subscriptions-page__search {
  flex: 1;
  min-width: 300px;
}

.subscriptions-page__filter {
  min-width: 200px;
}

.subscriptions-page__clear-btn {
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

.subscriptions-page__error {
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

.subscriptions-page__tenant-link {
  color: $primary-color;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.subscriptions-page__plan {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.subscriptions-page__plan-name {
  font-weight: 600;
  color: $text-primary;
}

.subscriptions-page__plan-price {
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

.subscriptions-page__billing-cycle {
  color: $text-secondary;
  font-size: 0.875rem;
}

.subscriptions-page__period {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.875rem;
  color: $text-secondary;
}

.subscriptions-page__period-separator {
  color: $text-light;
}

.subscriptions-page__trial {
  color: $info-color;
  font-size: 0.875rem;
  font-weight: 500;
}

.subscriptions-page__no-trial {
  color: $text-light;
}

.subscriptions-page__actions {
  display: flex;
  gap: $spacing-xs;
}

.subscriptions-page__action-btn {
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

.subscriptions-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.subscriptions-page__action-btn--more {
  padding: $spacing-xs $spacing-sm;
  font-weight: 700;
}

.subscriptions-page__pagination {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subscriptions-page__pagination-info {
  color: $text-secondary;
  font-size: 0.875rem;
}

.subscriptions-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.subscriptions-page__pagination-btn {
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

.subscriptions-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.subscriptions-page__loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.subscriptions-page__spinner {
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
  .subscriptions-page__filter-group {
    flex-direction: column;
  }

  .subscriptions-page__search,
  .subscriptions-page__filter {
    width: 100%;
    min-width: auto;
  }

  .subscriptions-page__summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
