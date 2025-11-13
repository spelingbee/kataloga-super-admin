<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">
          {{ gateway ? 'Edit Payment Gateway' : 'Add Payment Gateway' }}
        </h3>
        <button class="modal__close" @click="$emit('close')">
          <AppIcon name="x" />
        </button>
      </div>

      <form class="modal__body" @submit.prevent="handleSubmit">
        <!-- Gateway Type -->
        <div class="form-group">
          <label for="gatewayType" class="form-group__label">
            Gateway Type <span class="required">*</span>
          </label>
          <select
            id="gatewayType"
            v-model="formData.type"
            class="form-group__select"
            required
            :disabled="!!gateway"
          >
            <option value="">Select gateway type</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>

        <!-- Stripe Configuration -->
        <div v-if="formData.type === 'stripe'" class="config-section">
          <h4 class="config-section__title">Stripe Configuration</h4>
          
          <div class="form-group">
            <label for="stripePublishableKey" class="form-group__label">
              Publishable Key <span class="required">*</span>
            </label>
            <input
              id="stripePublishableKey"
              v-model="formData.config.publishableKey"
              type="text"
              class="form-group__input"
              placeholder="pk_live_..."
              required
            >
            <p class="form-group__hint">
              Your Stripe publishable key (starts with pk_)
            </p>
          </div>

          <div class="form-group">
            <label for="stripeSecretKey" class="form-group__label">
              Secret Key <span class="required">*</span>
            </label>
            <input
              id="stripeSecretKey"
              v-model="formData.config.secretKey"
              type="password"
              class="form-group__input"
              placeholder="sk_live_..."
              required
            >
            <p class="form-group__hint">
              Your Stripe secret key (starts with sk_)
            </p>
          </div>

          <div class="form-group">
            <label for="stripeWebhookSecret" class="form-group__label">
              Webhook Secret
            </label>
            <input
              id="stripeWebhookSecret"
              v-model="formData.config.webhookSecret"
              type="password"
              class="form-group__input"
              placeholder="whsec_..."
            >
            <p class="form-group__hint">
              Your Stripe webhook signing secret (optional but recommended)
            </p>
          </div>
        </div>

        <!-- PayPal Configuration -->
        <div v-if="formData.type === 'paypal'" class="config-section">
          <h4 class="config-section__title">PayPal Configuration</h4>
          
          <div class="form-group">
            <label for="paypalMode" class="form-group__label">
              Mode <span class="required">*</span>
            </label>
            <select
              id="paypalMode"
              v-model="formData.config.mode"
              class="form-group__select"
              required
            >
              <option value="">Select mode</option>
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="live">Live (Production)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="paypalClientId" class="form-group__label">
              Client ID <span class="required">*</span>
            </label>
            <input
              id="paypalClientId"
              v-model="formData.config.clientId"
              type="text"
              class="form-group__input"
              required
            >
            <p class="form-group__hint">
              Your PayPal REST API Client ID
            </p>
          </div>

          <div class="form-group">
            <label for="paypalClientSecret" class="form-group__label">
              Client Secret <span class="required">*</span>
            </label>
            <input
              id="paypalClientSecret"
              v-model="formData.config.clientSecret"
              type="password"
              class="form-group__input"
              required
            >
            <p class="form-group__hint">
              Your PayPal REST API Client Secret
            </p>
          </div>
        </div>

        <!-- Status Toggles -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-group__checkbox">
              <input
                v-model="formData.isActive"
                type="checkbox"
                class="form-group__checkbox-input"
              >
              <span class="form-group__checkbox-label">
                <strong>Active</strong>
                <span class="form-group__checkbox-description">
                  Enable this gateway for processing payments
                </span>
              </span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-group__checkbox">
              <input
                v-model="formData.isPrimary"
                type="checkbox"
                class="form-group__checkbox-input"
              >
              <span class="form-group__checkbox-label">
                <strong>Primary Gateway</strong>
                <span class="form-group__checkbox-description">
                  Use this as the default payment gateway
                </span>
              </span>
            </label>
          </div>
        </div>

        <!-- Security Warning -->
        <div class="security-warning">
          <AppIcon name="alert-triangle" class="security-warning__icon" />
          <div class="security-warning__content">
            <strong>Security Notice</strong>
            <p>
              API keys and secrets are sensitive information. Ensure they are stored securely
              and never shared publicly. Use test/sandbox credentials for development.
            </p>
          </div>
        </div>

        <div class="modal__footer">
          <button
            type="button"
            class="btn btn--secondary"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn--primary"
          >
            {{ gateway ? 'Update Gateway' : 'Add Gateway' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PaymentGatewayConfig } from '~/types'

interface Props {
  gateway?: PaymentGatewayConfig | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [gateway: PaymentGatewayConfig]
}>()

const formData = ref<PaymentGatewayConfig>({
  type: 'stripe',
  isActive: true,
  isPrimary: false,
  config: {},
})

const initializeForm = () => {
  if (props.gateway) {
    formData.value = JSON.parse(JSON.stringify(props.gateway))
  }
}

const handleSubmit = () => {
  emit('save', formData.value)
}

watch(() => props.gateway, initializeForm, { immediate: true })
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-md;
}

.modal {
  background: $bg-primary;
  border-radius: $radius-lg;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.modal__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
}

.modal__close {
  padding: $spacing-xs;
  background: transparent;
  border: none;
  cursor: pointer;
  color: $text-secondary;
  transition: color $transition-base;
  
  &:hover {
    color: $text-primary;
  }
}

.modal__body {
  padding: $spacing-lg;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.config-section {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.config-section__title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.form-section {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.form-group {
  margin-bottom: $spacing-md;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-group__label {
  display: block;
  margin-bottom: $spacing-sm;
  font-weight: 500;
  color: $text-primary;
  font-size: 0.875rem;
}

.form-group__input,
.form-group__select {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  transition: border-color $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
  
  &:disabled {
    background: $bg-secondary;
    cursor: not-allowed;
  }
}

.form-group__hint {
  margin-top: $spacing-xs;
  font-size: 0.8125rem;
  color: $text-secondary;
}

.form-group__checkbox {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  cursor: pointer;
}

.form-group__checkbox-input {
  margin-top: 2px;
  cursor: pointer;
}

.form-group__checkbox-label {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  
  strong {
    color: $text-primary;
    font-size: 0.875rem;
  }
}

.form-group__checkbox-description {
  color: $text-secondary;
  font-size: 0.8125rem;
}

.required {
  color: $error-color;
}

.security-warning {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: rgba($warning-color, 0.1);
  border: 1px solid rgba($warning-color, 0.3);
  border-radius: $radius-md;
}

.security-warning__icon {
  width: 24px;
  height: 24px;
  color: $warning-color;
  flex-shrink: 0;
}

.security-warning__content {
  flex: 1;
  
  strong {
    display: block;
    color: $warning-color;
    margin-bottom: $spacing-xs;
    font-size: 0.875rem;
  }
  
  p {
    color: darken($warning-color, 10%);
    font-size: 0.8125rem;
    line-height: 1.5;
  }
}

.btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-base;
}

.btn--primary {
  background: $primary-color;
  color: white;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

.btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: darken($bg-secondary, 5%);
  }
}
</style>
