<template>
  <div class="settings-payment">
    <div class="settings-payment__header">
      <div>
        <h2 class="settings-payment__title">Payment Gateway Configuration</h2>
        <p class="settings-payment__description">
          Configure payment gateways for processing subscription payments
        </p>
      </div>
      <button class="btn btn--primary" @click="openAddModal">
        <AppIcon name="plus" class="btn__icon" />
        Add Gateway
      </button>
    </div>

    <div v-if="gateways.length === 0" class="settings-payment__empty">
      <AppIcon name="credit-card" class="settings-payment__empty-icon" />
      <p class="settings-payment__empty-text">No payment gateways configured</p>
      <button class="btn btn--primary" @click="openAddModal">
        Add Your First Gateway
      </button>
    </div>

    <div v-else class="settings-payment__list">
      <div
        v-for="gateway in gateways"
        :key="gateway.id"
        class="payment-gateway-card"
      >
        <div class="payment-gateway-card__header">
          <div class="payment-gateway-card__info">
            <div class="payment-gateway-card__name">
              {{ getGatewayTypeName(gateway.type) }}
              <span v-if="gateway.isPrimary" class="badge badge--primary">Primary</span>
              <span v-if="gateway.isActive" class="badge badge--success">Active</span>
              <span v-else class="badge badge--secondary">Inactive</span>
            </div>
            <div class="payment-gateway-card__meta">
              {{ gateway.type === 'stripe' ? 'Stripe' : 'PayPal' }} Payment Gateway
            </div>
          </div>
          <div class="payment-gateway-card__actions">
            <button
              class="btn btn--sm btn--secondary"
              :disabled="testing"
              @click="testGateway(gateway.id!)"
            >
              <AppIcon name="check-circle" class="btn__icon" />
              Test
            </button>
            <button
              class="btn btn--sm btn--secondary"
              @click="openEditModal(gateway)"
            >
              <AppIcon name="edit" class="btn__icon" />
              Edit
            </button>
            <button
              class="btn btn--sm btn--danger"
              :disabled="gateway.isPrimary"
              @click="handleDelete(gateway.id!)"
            >
              <AppIcon name="trash" class="btn__icon" />
              Delete
            </button>
          </div>
        </div>

        <div class="payment-gateway-card__details">
          <div class="detail-item">
            <span class="detail-item__label">Type:</span>
            <span class="detail-item__value">{{ gateway.type.toUpperCase() }}</span>
          </div>
          <div v-if="gateway.type === 'stripe' && gateway.config.publishableKey" class="detail-item">
            <span class="detail-item__label">Publishable Key:</span>
            <span class="detail-item__value">{{ maskKey(gateway.config.publishableKey) }}</span>
          </div>
          <div v-if="gateway.type === 'paypal' && gateway.config.mode" class="detail-item">
            <span class="detail-item__label">Mode:</span>
            <span class="detail-item__value">{{ gateway.config.mode }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <PaymentGatewayModal
      v-if="showModal"
      :gateway="selectedGateway"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import type { PaymentGatewayConfig } from '~/types'
import PaymentGatewayModal from './PaymentGatewayModal.vue'

const settingsStore = useSettingsStore()
const { showConfirm } = useConfirm()

const showModal = ref(false)
const selectedGateway = ref<PaymentGatewayConfig | null>(null)

const gateways = computed(() => settingsStore.paymentGateways)
const testing = computed(() => settingsStore.testing)

const getGatewayTypeName = (type: string): string => {
  const names: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
  }
  return names[type] || type
}

const maskKey = (key: string): string => {
  if (!key) return ''
  const visibleChars = 8
  if (key.length <= visibleChars) return key
  return key.substring(0, 4) + '•'.repeat(key.length - visibleChars) + key.substring(key.length - 4)
}

const openAddModal = () => {
  selectedGateway.value = null
  showModal.value = true
}

const openEditModal = (gateway: PaymentGatewayConfig) => {
  selectedGateway.value = { ...gateway }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedGateway.value = null
}

const handleSave = async (gateway: PaymentGatewayConfig) => {
  try {
    await settingsStore.updatePaymentGateway(gateway)
    closeModal()
  } catch (error) {
    console.error('Failed to save payment gateway:', error)
  }
}

const testGateway = async (gatewayId: string) => {
  try {
    await settingsStore.testPaymentGateway(gatewayId)
  } catch (error) {
    console.error('Failed to test payment gateway:', error)
  }
}

const handleDelete = async (gatewayId: string) => {
  const confirmed = await showConfirm({
    title: 'Delete Payment Gateway',
    message: 'Are you sure you want to delete this payment gateway? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })

  if (confirmed) {
    try {
      await settingsStore.deletePaymentGateway(gatewayId)
    } catch (error) {
      console.error('Failed to delete payment gateway:', error)
    }
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.settings-payment__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
  gap: $spacing-md;
}

.settings-payment__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
}

.settings-payment__description {
  margin-top: $spacing-xs;
  color: $text-secondary;
  font-size: 0.875rem;
}

.settings-payment__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  background: $bg-secondary;
  border: 2px dashed $border-color;
  border-radius: $radius-lg;
  text-align: center;
}

.settings-payment__empty-icon {
  width: 64px;
  height: 64px;
  color: $text-light;
  margin-bottom: $spacing-md;
}

.settings-payment__empty-text {
  color: $text-secondary;
  margin-bottom: $spacing-lg;
  font-size: 1.125rem;
}

.settings-payment__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.payment-gateway-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  transition: box-shadow $transition-base;
  
  &:hover {
    box-shadow: $shadow-md;
  }
}

.payment-gateway-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
  gap: $spacing-md;
}

.payment-gateway-card__info {
  flex: 1;
}

.payment-gateway-card__name {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.payment-gateway-card__meta {
  color: $text-secondary;
  font-size: 0.875rem;
}

.payment-gateway-card__actions {
  display: flex;
  gap: $spacing-sm;
}

.payment-gateway-card__details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.detail-item__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item__value {
  font-size: 0.875rem;
  color: $text-primary;
  font-family: monospace;
}

.badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge--primary {
  background: rgba($primary-color, 0.1);
  color: $primary-color;
}

.badge--success {
  background: rgba($success-color, 0.1);
  color: $success-color;
}

.badge--secondary {
  background: $bg-secondary;
  color: $text-secondary;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-base;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn__icon {
  width: 16px;
  height: 16px;
}

.btn--primary {
  background: $primary-color;
  color: white;
  
  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

.btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover:not(:disabled) {
    background: darken($bg-secondary, 5%);
  }
}

.btn--danger {
  background: rgba($error-color, 0.1);
  color: $error-color;
  border: 1px solid rgba($error-color, 0.2);
  
  &:hover:not(:disabled) {
    background: rgba($error-color, 0.2);
  }
}

.btn--sm {
  padding: $spacing-xs $spacing-sm;
  font-size: 0.875rem;
}

@media (max-width: $breakpoint-md) {
  .settings-payment__header {
    flex-direction: column;
  }
  
  .payment-gateway-card__header {
    flex-direction: column;
  }
  
  .payment-gateway-card__actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .payment-gateway-card__details {
    grid-template-columns: 1fr;
  }
}
</style>
