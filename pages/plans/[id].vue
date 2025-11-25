<template>
  <div class="plan-details-page">
    <!-- Header -->
    <div class="plan-details-page__header">
      <button class="plan-details-page__back-btn" @click="goBack">
        ← Back to Plans
      </button>
      <div class="plan-details-page__header-content">
        <div>
          <h1 class="plan-details-page__title">
            {{ plan?.name || 'Plan Details' }}
          </h1>
          <span
            v-if="plan"
            class="plan-details-page__status"
            :class="{
              'plan-details-page__status--active': plan.isActive,
              'plan-details-page__status--inactive': !plan.isActive,
            }"
          >
            {{ plan.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
        <div v-if="plan && !isEditing" class="plan-details-page__actions">
          <button
            class="plan-details-page__action-btn plan-details-page__action-btn--secondary"
            @click="toggleEdit"
          >
            Edit Plan
          </button>
          <button
            v-if="plan.isActive"
            class="plan-details-page__action-btn plan-details-page__action-btn--danger"
            @click="handleDeactivate"
            :disabled="loading"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="plan-details-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !plan" class="plan-details-page__loading">
      <div class="plan-details-page__spinner"></div>
      <p>Loading plan details...</p>
    </div>

    <!-- Edit Mode -->
    <div v-else-if="isEditing && plan">
      <PlanForm
        :plan="plan"
        :loading="loading"
        @submit="handleUpdate"
        @cancel="cancelEdit"
      />
    </div>

    <!-- View Mode -->
    <div v-else-if="plan" class="plan-details-page__content">
      <!-- Plan Info Card -->
      <div class="plan-details-page__card">
        <h2 class="plan-details-page__card-title">Plan Information</h2>
        <div class="plan-details-page__info-grid">
          <div class="plan-details-page__info-item">
            <span class="plan-details-page__info-label">Plan Name</span>
            <span class="plan-details-page__info-value">{{ plan.name }}</span>
          </div>
          <div class="plan-details-page__info-item">
            <span class="plan-details-page__info-label">Price</span>
            <span class="plan-details-page__info-value plan-details-page__info-value--price">
              ${{ plan.price.toFixed(2) }}/month
            </span>
          </div>
          <div class="plan-details-page__info-item">
            <span class="plan-details-page__info-label">Max Users</span>
            <span class="plan-details-page__info-value">{{ plan.maxUsers }}</span>
          </div>
          <div class="plan-details-page__info-item">
            <span class="plan-details-page__info-label">Max Sites</span>
            <span class="plan-details-page__info-value">{{ plan.maxSites }}</span>
          </div>
          <div class="plan-details-page__info-item">
            <span class="plan-details-page__info-label">Trial Days</span>
            <span class="plan-details-page__info-value">{{ plan.trialDays }}</span>
          </div>
          <div class="plan-details-page__info-item">
            <span class="plan-details-page__info-label">Active Subscriptions</span>
            <span class="plan-details-page__info-value plan-details-page__info-value--highlight">
              {{ plan.subscriptionCount }}
            </span>
          </div>
        </div>
      </div>

      <!-- Features Card -->
      <div class="plan-details-page__card">
        <h2 class="plan-details-page__card-title">Features</h2>
        <ul class="plan-details-page__features-list">
          <li
            v-for="(feature, index) in plan.features"
            :key="index"
            class="plan-details-page__feature"
          >
            {{ feature }}
          </li>
        </ul>
      </div>

      <!-- Subscriptions Card -->
      <div v-if="plan.subscriptions && plan.subscriptions.length > 0" class="plan-details-page__card">
        <h2 class="plan-details-page__card-title">Active Subscriptions</h2>
        <div class="plan-details-page__subscriptions">
          <div
            v-for="subscription in plan.subscriptions"
            :key="subscription.id"
            class="plan-details-page__subscription-item"
          >
            <div class="plan-details-page__subscription-info">
              <span class="plan-details-page__subscription-tenant">
                {{ subscription.tenantName }}
              </span>
              <span class="plan-details-page__subscription-status">
                {{ subscription.status }}
              </span>
            </div>
            <span class="plan-details-page__subscription-date">
              Started: {{ formatDate(subscription.startDate) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlanStore } from '~/stores/plan'
import PlanForm from '~/components/plan/PlanForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const planStore = usePlanStore()
const notification = useNotification()
const { confirm } = useConfirm()

const planId = computed(() => route.params.id as string)
const plan = computed(() => planStore.currentPlan)
const loading = computed(() => planStore.loading)
const error = computed(() => planStore.error)

const isEditing = ref(false)

function goBack(): void {
  router.push('/plans')
}

function toggleEdit(): void {
  isEditing.value = true
}

function cancelEdit(): void {
  isEditing.value = false
}

async function fetchPlanDetails(): Promise<void> {
  try {
    await planStore.fetchPlanDetails(planId.value)
  } catch (error) {
    console.error('Failed to fetch plan details:', error)
  }
}

async function retryFetch(): Promise<void> {
  planStore.clearError()
  await fetchPlanDetails()
}

async function handleUpdate(data: {
  name: string
  maxUsers: number
  maxSites: number
  price: number
  features: string[]
  trialDays: number
  isActive: boolean
}): Promise<void> {
  try {
    await planStore.updatePlan(planId.value, data)
    notification.success('Plan updated successfully')
    isEditing.value = false
    await fetchPlanDetails()
  } catch (error: any) {
    notification.error('Failed to update plan')
    console.error('Failed to update plan:', error)
  }
}

async function handleDeactivate(): Promise<void> {
  const confirmed = await confirm({
    title: 'Deactivate Plan',
    message: `Are you sure you want to deactivate the ${plan.value?.name} plan? It will no longer be available for new subscriptions, but existing subscriptions will remain active.`,
    confirmText: 'Deactivate',
    cancelText: 'Cancel',
  })

  if (!confirmed) {
    return
  }

  try {
    await planStore.deactivatePlan(planId.value)
    notification.success('Plan deactivated successfully')
    await fetchPlanDetails()
  } catch (error: any) {
    notification.error('Failed to deactivate plan')
    console.error('Failed to deactivate plan:', error)
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Fetch on mount
onMounted(() => {
  fetchPlanDetails()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.plan-details-page {
  padding: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;
}

.plan-details-page__header {
  margin-bottom: $spacing-xl;
}

.plan-details-page__back-btn {
  padding: $spacing-xs $spacing-md;
  background: transparent;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition-base;
  margin-bottom: $spacing-md;

  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
}

.plan-details-page__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.plan-details-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.plan-details-page__status {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  font-weight: 500;
}

.plan-details-page__status--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.plan-details-page__status--inactive {
  background: lighten($text-secondary, 40%);
  color: $text-secondary;
}

.plan-details-page__actions {
  display: flex;
  gap: $spacing-md;
}

.plan-details-page__action-btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.plan-details-page__action-btn--secondary {
  background: transparent;
  border: 1px solid $border-color;
  color: $text-secondary;

  &:hover:not(:disabled) {
    background: $bg-secondary;
    color: $text-primary;
  }
}

.plan-details-page__action-btn--danger {
  background: $error-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($error-color, 10%);
  }
}

.plan-details-page__error {
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

.plan-details-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  gap: $spacing-md;

  p {
    color: $text-secondary;
  }
}

.plan-details-page__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $border-color;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.plan-details-page__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.plan-details-page__card {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-xl;
}

.plan-details-page__card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-lg 0;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.plan-details-page__info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
}

.plan-details-page__info-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.plan-details-page__info-label {
  font-size: 0.875rem;
  color: $text-secondary;
}

.plan-details-page__info-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
}

.plan-details-page__info-value--price {
  color: $primary-color;
}

.plan-details-page__info-value--highlight {
  color: $success-color;
}

.plan-details-page__features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-md;
}

.plan-details-page__feature {
  font-size: 0.875rem;
  color: $text-secondary;
  padding: $spacing-sm;
  padding-left: calc($spacing-md + $spacing-sm);
  position: relative;
  background: $bg-secondary;
  border-radius: $radius-sm;

  &::before {
    content: '✓';
    position: absolute;
    left: $spacing-sm;
    color: $success-color;
    font-weight: 600;
  }
}

.plan-details-page__subscriptions {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.plan-details-page__subscription-item {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-details-page__subscription-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.plan-details-page__subscription-tenant {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
}

.plan-details-page__subscription-status {
  font-size: 0.75rem;
  color: $text-secondary;
  text-transform: uppercase;
}

.plan-details-page__subscription-date {
  font-size: 0.75rem;
  color: $text-secondary;
}

@media (max-width: $breakpoint-md) {
  .plan-details-page__header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .plan-details-page__actions {
    flex-direction: column;

    button {
      width: 100%;
    }
  }

  .plan-details-page__info-grid {
    grid-template-columns: 1fr;
  }

  .plan-details-page__features-list {
    grid-template-columns: 1fr;
  }

  .plan-details-page__subscription-item {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
  }
}
</style>
