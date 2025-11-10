<template>
  <div class="subscription-details">
    <!-- Header -->
    <div class="subscription-details__header">
      <button class="subscription-details__back-btn" @click="goBack">
        ← Back to Subscriptions
      </button>
      <h1 class="subscription-details__title">Subscription Details</h1>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="subscription-details__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !subscription" class="subscription-details__loading">
      <div class="subscription-details__spinner"></div>
      <p>Loading subscription details...</p>
    </div>

    <!-- Content -->
    <div v-else-if="subscription" class="subscription-details__content">
      <!-- Overview Section -->
      <div class="subscription-details__section">
        <h2 class="subscription-details__section-title">Overview</h2>
        <div class="subscription-details__card">
          <div class="subscription-details__row">
            <div class="subscription-details__label">Tenant</div>
            <div class="subscription-details__value">
              <NuxtLink :to="`/tenants/${subscription.tenantId}`" class="subscription-details__link">
                {{ subscription.tenantName }}
              </NuxtLink>
            </div>
          </div>

          <div class="subscription-details__row">
            <div class="subscription-details__label">Status</div>
            <div class="subscription-details__value">
              <span :class="['status-badge', `status-badge--${subscription.status}`]">
                {{ subscription.status }}
              </span>
            </div>
          </div>

          <div class="subscription-details__row">
            <div class="subscription-details__label">Plan</div>
            <div class="subscription-details__value">
              <div class="subscription-details__plan">
                <div class="subscription-details__plan-name">{{ subscription.plan.name }}</div>
                <div class="subscription-details__plan-price">
                  {{ formatCurrency(subscription.plan.price) }}/{{ subscription.billingCycle === 'monthly' ? 'month' : 'year' }}
                </div>
              </div>
            </div>
          </div>

          <div class="subscription-details__row">
            <div class="subscription-details__label">Billing Cycle</div>
            <div class="subscription-details__value">
              {{ subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly' }}
            </div>
          </div>

          <div class="subscription-details__row">
            <div class="subscription-details__label">Current Period</div>
            <div class="subscription-details__value">
              {{ formatDate(subscription.currentPeriodStart) }} → {{ formatDate(subscription.currentPeriodEnd) }}
            </div>
          </div>

          <div v-if="subscription.status === 'trial' && subscription.trialEndsAt" class="subscription-details__row">
            <div class="subscription-details__label">Trial Ends</div>
            <div class="subscription-details__value subscription-details__value--highlight">
              {{ formatDate(subscription.trialEndsAt) }}
              <span class="subscription-details__days-left">({{ daysUntilTrialEnd }} days left)</span>
            </div>
          </div>

          <div v-if="subscription.cancelledAt" class="subscription-details__row">
            <div class="subscription-details__label">Cancelled At</div>
            <div class="subscription-details__value subscription-details__value--error">
              {{ formatDate(subscription.cancelledAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Plan Features -->
      <div class="subscription-details__section">
        <h2 class="subscription-details__section-title">Plan Features</h2>
        <div class="subscription-details__card">
          <ul class="subscription-details__features">
            <li v-for="feature in subscription.plan.features" :key="feature" class="subscription-details__feature">
              <span class="subscription-details__feature-icon">✓</span>
              {{ feature }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Payment Method -->
      <div v-if="subscription.paymentMethod" class="subscription-details__section">
        <h2 class="subscription-details__section-title">Payment Method</h2>
        <div class="subscription-details__card">
          <div class="subscription-details__payment">
            <div class="subscription-details__payment-icon">
              {{ getPaymentIcon(subscription.paymentMethod.type) }}
            </div>
            <div class="subscription-details__payment-info">
              <div class="subscription-details__payment-type">
                {{ formatPaymentType(subscription.paymentMethod.type) }}
                <span v-if="subscription.paymentMethod.brand">
                  ({{ subscription.paymentMethod.brand }})
                </span>
              </div>
              <div v-if="subscription.paymentMethod.last4" class="subscription-details__payment-last4">
                •••• {{ subscription.paymentMethod.last4 }}
              </div>
              <div v-if="subscription.paymentMethod.expiryMonth && subscription.paymentMethod.expiryYear" class="subscription-details__payment-expiry">
                Expires {{ subscription.paymentMethod.expiryMonth }}/{{ subscription.paymentMethod.expiryYear }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing History -->
      <div class="subscription-details__section">
        <h2 class="subscription-details__section-title">Billing History</h2>
        <div class="subscription-details__card">
          <BillingHistory
            :history="billingHistory"
            :loading="billingHistoryLoading"
            @filter-change="handleBillingFilterChange"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="subscription-details__actions">
        <button
          v-if="subscription.status === 'trial'"
          class="subscription-details__action-btn subscription-details__action-btn--primary"
          @click="showExtendTrialModal"
        >
          Extend Trial
        </button>
        <button
          class="subscription-details__action-btn subscription-details__action-btn--secondary"
          @click="showChangePlanModal"
        >
          Change Plan
        </button>
        <button
          class="subscription-details__action-btn subscription-details__action-btn--secondary"
          @click="showApplyDiscountModal"
        >
          Apply Discount
        </button>
        <button
          v-if="subscription.status === 'active' || subscription.status === 'trial'"
          class="subscription-details__action-btn subscription-details__action-btn--danger"
          @click="showCancelSubscriptionModal"
        >
          Cancel Subscription
        </button>
      </div>
    </div>

    <!-- Modals -->
    <ChangePlanModal
      v-if="subscription"
      v-model="showChangePlan"
      :current-plan="subscription.plan"
      :billing-cycle="subscription.billingCycle"
      :available-plans="availablePlans"
      :loading="modalLoading"
      @change-plan="handleChangePlan"
    />

    <ExtendTrialModal
      v-if="subscription && subscription.trialEndsAt"
      v-model="showExtendTrial"
      :current-trial-end-date="subscription.trialEndsAt"
      :loading="modalLoading"
      @extend-trial="handleExtendTrial"
    />

    <ApplyDiscountModal
      v-if="subscription"
      v-model="showApplyDiscount"
      :plan-name="subscription.plan.name"
      :plan-price="subscription.plan.price"
      :billing-cycle="subscription.billingCycle"
      :loading="modalLoading"
      @apply-discount="handleApplyDiscount"
    />

    <CancelSubscriptionModal
      v-if="subscription"
      v-model="showCancelSubscription"
      :tenant-name="subscription.tenantName"
      :plan-name="subscription.plan.name"
      :current-period-end="subscription.currentPeriodEnd"
      :loading="modalLoading"
      @cancel-subscription="handleCancelSubscription"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSubscriptionStore } from '~/stores/subscription'
import { formatDate } from '~/utils/date'
import ChangePlanModal from '~/components/subscription/ChangePlanModal.vue'
import ExtendTrialModal from '~/components/subscription/ExtendTrialModal.vue'
import ApplyDiscountModal from '~/components/subscription/ApplyDiscountModal.vue'
import CancelSubscriptionModal from '~/components/subscription/CancelSubscriptionModal.vue'
import BillingHistory from '~/components/subscription/BillingHistory.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const subscriptionStore = useSubscriptionStore()
const notification = useNotification()
const { confirm } = useConfirm()

const subscriptionId = computed(() => route.params.id as string)
const subscription = computed(() => subscriptionStore.currentSubscription)
const billingHistory = computed(() => subscriptionStore.billingHistory)
const loading = computed(() => subscriptionStore.loading)
const error = computed(() => subscriptionStore.error)

const billingHistoryLoading = ref(false)

const daysUntilTrialEnd = computed(() => {
  if (!subscription.value?.trialEndsAt) return 0
  const trialEnd = new Date(subscription.value.trialEndsAt)
  const now = new Date()
  const diff = trialEnd.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function getPaymentIcon(type: string): string {
  const icons: Record<string, string> = {
    card: '💳',
    bank_account: '🏦',
    paypal: 'P',
  }
  return icons[type] || '💳'
}

function formatPaymentType(type: string): string {
  const types: Record<string, string> = {
    card: 'Credit Card',
    bank_account: 'Bank Account',
    paypal: 'PayPal',
  }
  return types[type] || type
}

function goBack(): void {
  router.push('/subscriptions')
}

async function fetchSubscriptionDetails(): Promise<void> {
  try {
    await subscriptionStore.fetchSubscriptionDetails(subscriptionId.value)
  } catch (error) {
    console.error('Failed to fetch subscription details:', error)
  }
}

async function fetchBillingHistory(): Promise<void> {
  billingHistoryLoading.value = true
  try {
    await subscriptionStore.fetchBillingHistory(subscriptionId.value)
  } catch (error) {
    console.error('Failed to fetch billing history:', error)
  } finally {
    billingHistoryLoading.value = false
  }
}

async function retryFetch(): Promise<void> {
  subscriptionStore.clearError()
  await fetchSubscriptionDetails()
  await fetchBillingHistory()
}

// Modal states
const showChangePlan = ref(false)
const showExtendTrial = ref(false)
const showApplyDiscount = ref(false)
const showCancelSubscription = ref(false)
const modalLoading = ref(false)

// Mock available plans (in real app, fetch from API)
const availablePlans = ref([
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    features: ['Up to 100 orders/month', 'Basic analytics', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 79,
    features: ['Up to 500 orders/month', 'Advanced analytics', 'Priority support', 'Custom branding'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    features: ['Unlimited orders', 'Full analytics suite', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
  },
])

function showExtendTrialModal(): void {
  showExtendTrial.value = true
}

function showChangePlanModal(): void {
  showChangePlan.value = true
}

function showApplyDiscountModal(): void {
  showApplyDiscount.value = true
}

function showCancelSubscriptionModal(): void {
  showCancelSubscription.value = true
}

async function handleChangePlan(planId: string): Promise<void> {
  modalLoading.value = true
  try {
    await subscriptionStore.changePlan(subscriptionId.value, planId)
    notification.success('Plan changed successfully')
    showChangePlan.value = false
    await fetchSubscriptionDetails()
  } catch (error) {
    notification.error('Failed to change plan')
  } finally {
    modalLoading.value = false
  }
}

async function handleExtendTrial(data: { newTrialEndDate: string; reason: string }): Promise<void> {
  modalLoading.value = true
  try {
    await subscriptionStore.extendTrial(subscriptionId.value, data.newTrialEndDate, data.reason)
    notification.success('Trial period extended successfully')
    showExtendTrial.value = false
    await fetchSubscriptionDetails()
  } catch (error) {
    notification.error('Failed to extend trial')
  } finally {
    modalLoading.value = false
  }
}

async function handleApplyDiscount(data: {
  type: 'percentage' | 'fixed'
  value: number
  durationMonths?: number
  reason?: string
}): Promise<void> {
  modalLoading.value = true
  try {
    await subscriptionStore.applyDiscount(
      subscriptionId.value,
      data.type,
      data.value,
      data.durationMonths
    )
    notification.success('Discount applied successfully')
    showApplyDiscount.value = false
    await fetchSubscriptionDetails()
  } catch (error) {
    notification.error('Failed to apply discount')
  } finally {
    modalLoading.value = false
  }
}

async function handleCancelSubscription(data: { reason: string; notes?: string }): Promise<void> {
  modalLoading.value = true
  try {
    const reason = data.notes ? `${data.reason}: ${data.notes}` : data.reason
    await subscriptionStore.cancelSubscription(subscriptionId.value, reason)
    notification.success('Subscription cancelled successfully')
    showCancelSubscription.value = false
    await fetchSubscriptionDetails()
  } catch (error) {
    notification.error('Failed to cancel subscription')
  } finally {
    modalLoading.value = false
  }
}

function handleBillingFilterChange(filters: any): void {
  // Filters are applied client-side in the BillingHistory component
  // This handler is here for potential future server-side filtering
  console.log('Billing filters changed:', filters)
}

// Fetch on mount
onMounted(async () => {
  await fetchSubscriptionDetails()
  await fetchBillingHistory()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.subscription-details {
  padding: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;
}

.subscription-details__header {
  margin-bottom: $spacing-xl;
}

.subscription-details__back-btn {
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

.subscription-details__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
}

.subscription-details__error {
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

.subscription-details__loading {
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

.subscription-details__spinner {
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

.subscription-details__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.subscription-details__section {
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
}

.subscription-details__section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  padding: $spacing-lg;
  background: $bg-secondary;
  margin: 0;
  border-bottom: 1px solid $border-color;
}

.subscription-details__card {
  padding: $spacing-lg;
}

.subscription-details__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md 0;
  border-bottom: 1px solid $border-color;

  &:last-child {
    border-bottom: none;
  }
}

.subscription-details__label {
  font-weight: 500;
  color: $text-secondary;
  flex: 0 0 200px;
}

.subscription-details__value {
  color: $text-primary;
  flex: 1;
  text-align: right;
}

.subscription-details__value--highlight {
  color: $info-color;
  font-weight: 500;
}

.subscription-details__value--error {
  color: $error-color;
  font-weight: 500;
}

.subscription-details__link {
  color: $primary-color;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.subscription-details__plan {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: $spacing-xs;
}

.subscription-details__plan-name {
  font-weight: 600;
  color: $text-primary;
}

.subscription-details__plan-price {
  font-size: 0.875rem;
  color: $text-secondary;
}

.subscription-details__days-left {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-left: $spacing-xs;
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

.subscription-details__features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.subscription-details__feature {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  color: $text-primary;
}

.subscription-details__feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: lighten($success-color, 40%);
  color: $success-color;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.subscription-details__payment {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.subscription-details__payment-icon {
  font-size: 2rem;
}

.subscription-details__payment-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.subscription-details__payment-type {
  font-weight: 600;
  color: $text-primary;
}

.subscription-details__payment-last4 {
  font-size: 0.875rem;
  color: $text-secondary;
}

.subscription-details__payment-expiry {
  font-size: 0.875rem;
  color: $text-secondary;
}



.subscription-details__actions {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: $bg-secondary;
  border-radius: $radius-lg;
  flex-wrap: wrap;
}

.subscription-details__action-btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
}

.subscription-details__action-btn--primary {
  background: $primary-color;
  color: white;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.subscription-details__action-btn--secondary {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover {
    background: $bg-secondary;
  }
}

.subscription-details__action-btn--danger {
  background: $error-color;
  color: white;

  &:hover {
    background: darken($error-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .subscription-details__row {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
  }

  .subscription-details__label {
    flex: none;
  }

  .subscription-details__value {
    text-align: left;
  }

  .subscription-details__plan {
    align-items: flex-start;
  }

  .subscription-details__actions {
    flex-direction: column;
  }

  .subscription-details__action-btn {
    width: 100%;
  }
}
</style>
