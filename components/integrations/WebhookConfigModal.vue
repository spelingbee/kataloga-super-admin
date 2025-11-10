<template>
  <AppModal
    :show="true"
    :title="isEdit ? 'Edit Webhook' : 'Create Webhook'"
    size="large"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="webhook-config-form">
      <div v-if="error" class="webhook-config-form__error">
        <AppIcon name="alert-circle" />
        <span>{{ error }}</span>
      </div>

      <!-- Webhook Name -->
      <div class="form-group">
        <label for="name" class="form-group__label">
          Webhook Name
          <span class="form-group__required">*</span>
        </label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          class="form-group__input"
          placeholder="My Webhook"
          required
        />
      </div>

      <!-- Webhook URL -->
      <div class="form-group">
        <label for="url" class="form-group__label">
          Webhook URL
          <span class="form-group__required">*</span>
        </label>
        <input
          id="url"
          v-model="formData.url"
          type="url"
          class="form-group__input"
          placeholder="https://your-domain.com/webhook"
          required
        />
        <p class="form-group__hint">
          The endpoint where webhook events will be sent
        </p>
      </div>

      <!-- Events -->
      <div class="form-group">
        <label class="form-group__label">
          Events
          <span class="form-group__required">*</span>
        </label>
        <div class="events-grid">
          <label
            v-for="event in availableEvents"
            :key="event.value"
            class="event-checkbox"
          >
            <input
              v-model="formData.events"
              type="checkbox"
              :value="event.value"
              class="event-checkbox__input"
            />
            <div class="event-checkbox__content">
              <span class="event-checkbox__label">{{ event.label }}</span>
              <span class="event-checkbox__description">{{ event.description }}</span>
            </div>
          </label>
        </div>
        <p v-if="formData.events.length === 0" class="form-group__error">
          Please select at least one event
        </p>
      </div>

      <!-- Secret -->
      <div class="form-group">
        <label for="secret" class="form-group__label">
          Secret (Optional)
        </label>
        <input
          id="secret"
          v-model="formData.secret"
          type="text"
          class="form-group__input"
          placeholder="your-webhook-secret"
        />
        <p class="form-group__hint">
          Used to verify webhook authenticity via signature
        </p>
      </div>

      <!-- Custom Headers -->
      <div class="form-group">
        <label class="form-group__label">Custom Headers (Optional)</label>
        <div class="headers-list">
          <div
            v-for="(value, key, index) in formData.headers"
            :key="index"
            class="header-item"
          >
            <input
              v-model="headerKeys[index]"
              type="text"
              class="header-item__input"
              placeholder="Header Name"
              @blur="updateHeaderKey(index, key)"
            />
            <input
              v-model="formData.headers[key]"
              type="text"
              class="header-item__input"
              placeholder="Header Value"
            />
            <button
              type="button"
              @click="removeHeader(key)"
              class="header-item__remove"
            >
              <AppIcon name="x" />
            </button>
          </div>
        </div>
        <button
          type="button"
          @click="addHeader"
          class="btn btn--secondary btn--sm"
        >
          <AppIcon name="plus" />
          Add Header
        </button>
      </div>

      <!-- Retry Policy -->
      <div class="form-group">
        <label class="form-group__label">Retry Policy</label>
        <div class="retry-policy">
          <div class="retry-policy__field">
            <label for="maxRetries" class="retry-policy__label">Max Retries</label>
            <input
              id="maxRetries"
              v-model.number="formData.retryPolicy.maxRetries"
              type="number"
              min="0"
              max="10"
              class="retry-policy__input"
            />
          </div>
          <div class="retry-policy__field">
            <label for="retryDelay" class="retry-policy__label">Retry Delay (seconds)</label>
            <input
              id="retryDelay"
              v-model.number="formData.retryPolicy.retryDelay"
              type="number"
              min="1"
              max="3600"
              class="retry-policy__input"
            />
          </div>
        </div>
      </div>

      <!-- Active Status -->
      <div class="form-group">
        <label class="checkbox-item">
          <input
            v-model="formData.isActive"
            type="checkbox"
            class="checkbox-item__input"
          />
          <span class="checkbox-item__label">Enable Webhook</span>
        </label>
      </div>

      <!-- Actions -->
      <div class="webhook-config-form__actions">
        <button
          type="button"
          @click="$emit('close')"
          class="btn btn--secondary"
          :disabled="saving"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn--primary"
          :disabled="saving || formData.events.length === 0"
        >
          <div v-if="saving" class="btn-spinner"></div>
          {{ saving ? 'Saving...' : isEdit ? 'Update Webhook' : 'Create Webhook' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import { useIntegrationStore } from '~/stores/integration'
import type { WebhookConfig } from '~/types'

interface Props {
  webhook?: WebhookConfig | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const integrationStore = useIntegrationStore()

const isEdit = computed(() => !!props.webhook?.id)

const formData = ref<WebhookConfig>({
  name: '',
  url: '',
  events: [],
  isActive: true,
  secret: '',
  headers: {},
  retryPolicy: {
    maxRetries: 3,
    retryDelay: 60,
  },
})

const headerKeys = ref<string[]>([])

const availableEvents = [
  {
    value: 'tenant.created',
    label: 'Tenant Created',
    description: 'When a new tenant is created',
  },
  {
    value: 'tenant.approved',
    label: 'Tenant Approved',
    description: 'When a tenant registration is approved',
  },
  {
    value: 'tenant.rejected',
    label: 'Tenant Rejected',
    description: 'When a tenant registration is rejected',
  },
  {
    value: 'tenant.suspended',
    label: 'Tenant Suspended',
    description: 'When a tenant is suspended',
  },
  {
    value: 'subscription.created',
    label: 'Subscription Created',
    description: 'When a new subscription is created',
  },
  {
    value: 'subscription.updated',
    label: 'Subscription Updated',
    description: 'When a subscription is updated',
  },
  {
    value: 'subscription.cancelled',
    label: 'Subscription Cancelled',
    description: 'When a subscription is cancelled',
  },
  {
    value: 'payment.succeeded',
    label: 'Payment Succeeded',
    description: 'When a payment is successful',
  },
  {
    value: 'payment.failed',
    label: 'Payment Failed',
    description: 'When a payment fails',
  },
  {
    value: 'security.alert',
    label: 'Security Alert',
    description: 'When a security event occurs',
  },
]

const saving = computed(() => integrationStore.saving)
const error = computed(() => integrationStore.error)

const initializeForm = () => {
  if (props.webhook) {
    formData.value = { ...props.webhook }
    if (formData.value.headers) {
      headerKeys.value = Object.keys(formData.value.headers)
    }
  }
}

const addHeader = () => {
  const newKey = `Header-${Object.keys(formData.value.headers || {}).length + 1}`
  if (!formData.value.headers) {
    formData.value.headers = {}
  }
  formData.value.headers[newKey] = ''
  headerKeys.value.push(newKey)
}

const removeHeader = (key: string) => {
  if (formData.value.headers) {
    delete formData.value.headers[key]
    headerKeys.value = headerKeys.value.filter(k => k !== key)
  }
}

const updateHeaderKey = (index: number, oldKey: string) => {
  const newKey = headerKeys.value[index]
  if (newKey !== oldKey && formData.value.headers) {
    const value = formData.value.headers[oldKey]
    delete formData.value.headers[oldKey]
    formData.value.headers[newKey] = value
  }
}

const handleSubmit = async () => {
  try {
    if (isEdit.value) {
      await integrationStore.updateWebhook(formData.value)
    } else {
      await integrationStore.createWebhook(formData.value)
    }
    emit('close')
  } catch (err) {
    console.error('Failed to save webhook:', err)
  }
}

onMounted(() => {
  initializeForm()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.webhook-config-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.webhook-config-form__error {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  color: $error-color;
  font-size: 0.875rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.form-group__label {
  font-weight: 500;
  color: $text-primary;
  font-size: 0.875rem;
}

.form-group__required {
  color: $error-color;
}

.form-group__input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  transition: all $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }
  
  &::placeholder {
    color: $text-light;
  }
}

.form-group__hint {
  font-size: 0.75rem;
  color: $text-secondary;
}

.form-group__error {
  font-size: 0.75rem;
  color: $error-color;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $spacing-sm;
}

.event-checkbox {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover {
    border-color: $primary-color;
    background: rgba(14, 165, 233, 0.05);
  }
}

.event-checkbox__input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
}

.event-checkbox__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.event-checkbox__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
}

.event-checkbox__description {
  font-size: 0.75rem;
  color: $text-secondary;
}

.headers-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.header-item {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
}

.header-item__input {
  flex: 1;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.header-item__remove {
  padding: $spacing-sm;
  background: transparent;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  color: $error-color;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: $error-color;
  }
}

.retry-policy {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.retry-policy__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.retry-policy__label {
  font-size: 0.75rem;
  color: $text-secondary;
}

.retry-policy__input {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
}

.checkbox-item__input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-item__label {
  font-size: 0.875rem;
  color: $text-primary;
  cursor: pointer;
}

.webhook-config-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: $breakpoint-md) {
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .webhook-config-form__actions {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
}
</style>
