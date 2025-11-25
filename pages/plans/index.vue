<template>
  <div class="plans-page">
    <div class="plans-page__header">
      <div class="plans-page__header-content">
        <div>
          <h1 class="plans-page__title">Plan Management</h1>
          <p class="plans-page__subtitle">
            Manage subscription plans and pricing tiers
          </p>
        </div>
        <button class="plans-page__create-btn" @click="createNewPlan">
          + Create Plan
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="plans-page__stats">
      <div class="plans-page__stat-card">
        <div class="plans-page__stat-value">{{ plans.length }}</div>
        <div class="plans-page__stat-label">Total Plans</div>
      </div>
      <div class="plans-page__stat-card">
        <div class="plans-page__stat-value">{{ activePlansCount }}</div>
        <div class="plans-page__stat-label">Active Plans</div>
      </div>
      <div class="plans-page__stat-card">
        <div class="plans-page__stat-value">{{ totalSubscriptions }}</div>
        <div class="plans-page__stat-label">Total Subscriptions</div>
      </div>
    </div>

    <!-- Plan List Component -->
    <PlanList
      :plans="plans"
      :loading="loading"
      :error="error"
      :filters="filters"
      @view="viewPlan"
      @filter-change="handleFilterChange"
      @retry="retryFetch"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from '~/stores/plan'
import PlanList from '~/components/plan/PlanList.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const planStore = usePlanStore()

// Computed
const plans = computed(() => planStore.plans)
const loading = computed(() => planStore.loading)
const error = computed(() => planStore.error)
const filters = computed(() => planStore.filters)
const totalSubscriptions = computed(() => planStore.totalSubscriptions)

const activePlansCount = computed(() => {
  return plans.value.filter(p => p.isActive).length
})

// Methods
function createNewPlan(): void {
  router.push('/plans/new')
}

function viewPlan(planId: string): void {
  router.push(`/plans/${planId}`)
}

function handleFilterChange(newFilters: {
  isActive: boolean | null
  sortBy: string
  sortOrder: 'asc' | 'desc'
}): void {
  planStore.setFilters(newFilters)
  fetchPlans()
}

async function fetchPlans(): Promise<void> {
  try {
    await planStore.fetchPlans()
  } catch (error) {
    console.error('Failed to fetch plans:', error)
  }
}

async function retryFetch(): Promise<void> {
  planStore.clearError()
  await fetchPlans()
}

// Fetch on mount
onMounted(() => {
  fetchPlans()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.plans-page {
  padding: $spacing-lg;
}

.plans-page__header {
  margin-bottom: $spacing-xl;
}

.plans-page__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.plans-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.plans-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.plans-page__create-btn {
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

.plans-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.plans-page__stat-card {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.plans-page__stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.plans-page__stat-label {
  font-size: 0.875rem;
  color: $text-secondary;
}

@media (max-width: $breakpoint-md) {
  .plans-page__header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .plans-page__create-btn {
    width: 100%;
  }

  .plans-page__stats {
    grid-template-columns: 1fr;
  }
}
</style>
