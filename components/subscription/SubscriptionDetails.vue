<template>
  <div class="subscription-details">
    <!-- Error Message -->
    <div v-if="error" class="subscription-details__error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')">Retry</button>
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

      <!-- Actions -->
      <div class="subscription-details__actions">
        <button
          v-if="subscription.status === 'trial'"
          class="subscription-details__action-btn subscription-details__action-btn--primary"
          @click="$emit('extend-trial')"
        >
          Extend Trial
        </button>
        <button
          class="subscription-details__action-btn subscription-details__action-btn--secondary"
          @click="$emit('change-plan')"
        >
          Change Plan
        </button>
        <button
          class="subscription-details__action-btn subscription-details__action-btn--secondary"
          @click="$emit('apply-discount')"
        >
          Apply Discount
        </button>
        <button
          v-if="subscription.status === 'active' || subscription.status === 'trial'"
          class="subscription-details__action-btn subscription-details__action-btn--danger"
          @click="$emit('cancel-subscription')"
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Subscription } from '~/types'
import { formatDate } from '~/utils/date'

interface Props {
  subscription: Subscription | null
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

defineEmits<{
  'extend-trial': []
  'change-plan': []
  'apply-discount': []
  'cancel-subscription': []
  retry: []
}>()

const daysUntilTrialEnd = computed(() => {
  if (!props.subscription?.trialEndsAt) return 0
  const trialEnd = new Date(props.subscription.trialEndsAt)
  const now = new Date()
  const diff = trialEnd.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

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
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

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
    margin: 0;
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
