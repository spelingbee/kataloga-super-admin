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
      <div class="subscription-details__spinner"/>
      <p>Loading subscription details...</p>
    </div>

    <!-- Subscription Details Component -->
    <SubscriptionDetails
      :subscription="subscription"
      :loading="loading"
      :error="error"
      @extend-trial="showExtendTrialModal"
      @change-plan="showChangePlanModal"
      @apply-discount="showApplyDiscountModal"
      @cancel-subscription="showCancelSubscriptionModal"
      @retry="retryFetch"
    />

    <!-- Subscription History -->
    <div v-if="subscription" class="subscription-page__section">
      <h2 class="subscription-page__section-title">Change History</h2>
      <div class="subscription-page__card">
        <SubscriptionHistory
          :history="subscriptionHistory"
          :loading="historyLoading"
          :error="historyError"
          @export="handleExportHistory"
          @retry="fetchSubscriptionHistory"
        />
      </div>
    </div>

    <!-- Billing History -->
    <div v-if="subscription" class="subscription-page__section">
      <h2 class="subscription-page__section-title">Billing History</h2>
      <div class="subscription-page__card">
        <BillingHistory
          :history="billingHistory"
          :loading="billingHistoryLoading"
          @filter-change="handleBillingFilterChange"
        />
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
import SubscriptionDetails from '~/components/subscription/SubscriptionDetails.vue'
import SubscriptionHistory from '~/components/subscription/SubscriptionHistory.vue'
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
const subscriptionHistory = computed(() => subscriptionStore.subscriptionHistory?.history || [])
const loading = computed(() => subscriptionStore.loading)
const error = computed(() => subscriptionStore.error)

const billingHistoryLoading = ref(false)
const historyLoading = ref(false)
const historyError = ref<string | null>(null)

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

async function fetchSubscriptionHistory(): Promise<void> {
  historyLoading.value = true
  historyError.value = null
  try {
    await subscriptionStore.fetchSubscriptionHistory(subscriptionId.value)
  } catch (error: any) {
    historyError.value = error.message || 'Failed to fetch subscription history'
    console.error('Failed to fetch subscription history:', error)
  } finally {
    historyLoading.value = false
  }
}

async function handleExportHistory(): Promise<void> {
  try {
    const apiService = useApiService()
    const response = await apiService.get(
      `/api/admin/audit/export`,
      {
        params: {
          type: 'subscription',
          subscriptionId: subscriptionId.value,
          format: 'csv',
        },
        responseType: 'blob',
      }
    )

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `subscription-history-${subscriptionId.value}-${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    notification.success('History exported successfully')
  } catch (error) {
    notification.error('Failed to export history')
    console.error('Export error:', error)
  }
}

async function retryFetch(): Promise<void> {
  subscriptionStore.clearError()
  await fetchSubscriptionDetails()
  await fetchBillingHistory()
  await fetchSubscriptionHistory()
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
  await fetchSubscriptionHistory()
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

.subscription-page__section {
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  margin-top: $spacing-xl;
}

.subscription-page__section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  padding: $spacing-lg;
  background: $bg-secondary;
  margin: 0;
  border-bottom: 1px solid $border-color;
}

.subscription-page__card {
  padding: $spacing-lg;
}
</style>
