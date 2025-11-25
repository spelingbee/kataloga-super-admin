# Subscription Management Components

This directory contains all components related to subscription management in the Super Admin panel.

## Components Overview

### SubscriptionDetails.vue
Main component for displaying subscription information including:
- Subscription overview (tenant, status, plan, billing cycle)
- Plan features list
- Payment method information
- Action buttons for subscription modifications

**Props:**
- `subscription: Subscription | null` - Subscription data
- `loading?: boolean` - Loading state
- `error?: string | null` - Error message

**Events:**
- `extend-trial` - Triggered when user clicks "Extend Trial" button
- `change-plan` - Triggered when user clicks "Change Plan" button
- `apply-discount` - Triggered when user clicks "Apply Discount" button
- `cancel-subscription` - Triggered when user clicks "Cancel Subscription" button
- `retry` - Triggered when user clicks retry on error

### ChangePlanModal.vue
Modal for changing subscription plan with:
- Visual plan selection cards
- Proration calculation display
- Confirmation checkbox
- Real-time price comparison

**Props:**
- `modelValue: boolean` - Modal visibility state
- `currentPlan: Plan | null` - Current subscription plan
- `billingCycle: 'monthly' | 'yearly'` - Current billing cycle
- `availablePlans: Plan[]` - List of available plans
- `loading?: boolean` - Loading state during plan change

**Events:**
- `update:modelValue` - Updates modal visibility
- `change-plan` - Emits selected plan ID
- `cancel` - Triggered when user cancels

### ExtendTrialModal.vue
Modal for extending trial period with:
- Date picker for new trial end date
- Reason input field (required for audit)
- Extension summary with additional days calculation
- Validation for date selection

**Props:**
- `modelValue: boolean` - Modal visibility state
- `currentTrialEndDate: string` - Current trial end date
- `loading?: boolean` - Loading state during extension

**Events:**
- `update:modelValue` - Updates modal visibility
- `extend-trial` - Emits `{ newTrialEndDate: string, reason: string }`
- `cancel` - Triggered when user cancels

### ApplyDiscountModal.vue
Modal for applying discounts with:
- Discount type selection (percentage or fixed amount)
- Discount value input with validation
- Duration in months (optional for permanent discount)
- Real-time discount preview with savings calculation
- Reason field for audit purposes

**Props:**
- `modelValue: boolean` - Modal visibility state
- `planName: string` - Current plan name
- `planPrice: number` - Current plan price
- `billingCycle: 'monthly' | 'yearly'` - Current billing cycle
- `loading?: boolean` - Loading state during discount application

**Events:**
- `update:modelValue` - Updates modal visibility
- `apply-discount` - Emits discount data object
- `cancel` - Triggered when user cancels

### CancelSubscriptionModal.vue
Modal for cancelling subscriptions with:
- Warning message about cancellation
- Cancellation details (current plan, period end, access end date)
- Reason selection dropdown
- Additional notes field (required for "Other" reason)
- Confirmation checkbox

**Props:**
- `modelValue: boolean` - Modal visibility state
- `tenantName: string` - Tenant name
- `planName: string` - Current plan name
- `currentPeriodEnd: string` - Current period end date
- `loading?: boolean` - Loading state during cancellation

**Events:**
- `update:modelValue` - Updates modal visibility
- `cancel-subscription` - Emits `{ reason: string, notes?: string }`
- `cancel` - Triggered when user cancels

### BillingHistory.vue
Component for displaying billing history with:
- Filterable transaction list (date range, status)
- Transaction details (date, amount, status, invoice link)
- Summary statistics (total transactions, amounts, paid, refunded)
- Responsive grid layout

**Props:**
- `history: BillingHistoryItem[]` - Array of billing history items
- `loading?: boolean` - Loading state

**Events:**
- `filterChange` - Emits filter object when filters change

## Usage Example

```vue
<template>
  <div>
    <!-- Subscription Details -->
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

    <!-- Modals -->
    <ChangePlanModal
      v-model="showChangePlan"
      :current-plan="subscription.plan"
      :billing-cycle="subscription.billingCycle"
      :available-plans="availablePlans"
      :loading="modalLoading"
      @change-plan="handleChangePlan"
    />

    <ExtendTrialModal
      v-model="showExtendTrial"
      :current-trial-end-date="subscription.trialEndsAt"
      :loading="modalLoading"
      @extend-trial="handleExtendTrial"
    />

    <ApplyDiscountModal
      v-model="showApplyDiscount"
      :plan-name="subscription.plan.name"
      :plan-price="subscription.plan.price"
      :billing-cycle="subscription.billingCycle"
      :loading="modalLoading"
      @apply-discount="handleApplyDiscount"
    />

    <CancelSubscriptionModal
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
import { ref } from 'vue'
import { useSubscriptionStore } from '~/stores/subscription'

const subscriptionStore = useSubscriptionStore()
const subscription = computed(() => subscriptionStore.currentSubscription)

// Modal states
const showChangePlan = ref(false)
const showExtendTrial = ref(false)
const showApplyDiscount = ref(false)
const showCancelSubscription = ref(false)
const modalLoading = ref(false)

// Handlers
async function handleChangePlan(planId: string) {
  modalLoading.value = true
  try {
    await subscriptionStore.changePlan(subscription.value.id, planId)
    showChangePlan.value = false
  } finally {
    modalLoading.value = false
  }
}

async function handleExtendTrial(data: { newTrialEndDate: string; reason: string }) {
  modalLoading.value = true
  try {
    await subscriptionStore.extendTrial(subscription.value.id, data.newTrialEndDate, data.reason)
    showExtendTrial.value = false
  } finally {
    modalLoading.value = false
  }
}

async function handleApplyDiscount(data: any) {
  modalLoading.value = true
  try {
    await subscriptionStore.applyDiscount(
      subscription.value.id,
      data.type,
      data.value,
      data.durationMonths
    )
    showApplyDiscount.value = false
  } finally {
    modalLoading.value = false
  }
}

async function handleCancelSubscription(data: { reason: string; notes?: string }) {
  modalLoading.value = true
  try {
    const reason = data.notes ? `${data.reason}: ${data.notes}` : data.reason
    await subscriptionStore.cancelSubscription(subscription.value.id, reason)
    showCancelSubscription.value = false
  } finally {
    modalLoading.value = false
  }
}
</script>
```

## Requirements Coverage

These components implement the following requirements from the specification:

### Requirement 3: Modify Subscriptions
- ✅ 3.1: Plan change functionality with confirmation dialog
- ✅ 3.2: Trial extension with date picker and reason
- ✅ 3.3: Discount application with percentage/fixed options
- ✅ 3.4: All modifications create change records (handled by store/backend)
- ✅ 3.5: Notification emails sent (handled by store/backend)

### Requirement 4: Cancel and Manage Subscription Lifecycle
- ✅ 4.1: Subscription cancellation with status update
- ✅ 4.2: Cancellation reason input
- ✅ 4.3: Automatic expiration handling (backend)
- ✅ 4.4: Feature access restriction (backend)
- ✅ 4.5: Cancellation email notification (backend)

## Styling

All components follow the SCSS style guide with:
- BEM naming convention (no nested `&__` selectors)
- Variables for colors, spacing, and other design tokens
- Responsive design with mobile breakpoints
- Consistent spacing and typography
- Accessible color contrasts and focus states

## Integration

These components integrate with:
- **Subscription Store** (`~/stores/subscription.ts`) - State management and API calls
- **Notification System** (`useNotification`) - Success/error messages
- **Type Definitions** (`~/types/index.ts`) - TypeScript interfaces
- **Utility Functions** (`~/utils/date.ts`) - Date formatting

## Testing

When testing these components:
1. Test all form validations
2. Test modal open/close behavior
3. Test API integration with loading states
4. Test error handling and retry functionality
5. Test responsive behavior on mobile devices
6. Test accessibility (keyboard navigation, screen readers)
