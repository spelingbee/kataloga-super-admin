<template>
  <div class="subscriptions-page">
    <div class="subscriptions-page__header">
      <div class="subscriptions-page__header-content">
        <div>
          <h1 class="subscriptions-page__title">Subscription Management</h1>
          <p class="subscriptions-page__subtitle">
            Manage all tenant subscriptions and billing
          </p>
        </div>
        <button class="subscriptions-page__create-btn" @click="createNewSubscription">
          + Create Subscription
        </button>
      </div>
    </div>

    <!-- Subscription List Component -->
    <SubscriptionList
      :subscriptions="subscriptions"
      :loading="loading"
      :error="error"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total="total"
      :limit="limit"
      :monthly-recurring-revenue="monthlyRecurringRevenue"
      :annual-recurring-revenue="annualRecurringRevenue"
      :active-count="activeCount"
      :search-query="searchQuery"
      :status-filter="statusFilter"
      :plan-filter="planFilter"
      :billing-cycle-filter="billingCycleFilter"
      @view="viewSubscription"
      @page-change="goToPage"
      @filter-change="handleFilterChange"
      @retry="retryFetch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '~/stores/subscription'
import SubscriptionList from '~/components/subscription/SubscriptionList.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const subscriptionStore = useSubscriptionStore()

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const planFilter = ref('')
const billingCycleFilter = ref('')

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

// Methods
function createNewSubscription(): void {
  router.push('/subscriptions/new')
}

function viewSubscription(subscriptionId: string): void {
  router.push(`/subscriptions/${subscriptionId}`)
}

async function goToPage(page: number): Promise<void> {
  subscriptionStore.setPage(page)
  await fetchSubscriptions()
}

function handleFilterChange(filters: {
  search: string
  status: string
  plan: string
  billingCycle: string
}): void {
  searchQuery.value = filters.search
  statusFilter.value = filters.status
  planFilter.value = filters.plan
  billingCycleFilter.value = filters.billingCycle

  subscriptionStore.setFilters({
    search: filters.search,
    status: filters.status as any,
    plan: filters.plan,
    billingCycle: filters.billingCycle as any,
  })
  subscriptionStore.setPage(1)
  fetchSubscriptions()
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

.subscriptions-page__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
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

.subscriptions-page__create-btn {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
  white-space: nowrap;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .subscriptions-page__header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .subscriptions-page__create-btn {
    width: 100%;
  }
}
</style>
