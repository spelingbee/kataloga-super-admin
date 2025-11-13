<template>
  <div class="provider-config-modal">
    <div class="provider-config-modal__overlay" @click="handleClose" />
    <div class="provider-config-modal__content">
      <div class="provider-config-modal__header">
        <h2 class="provider-config-modal__title">Configure Email Provider</h2>
        <button
          class="provider-config-modal__close"
          @click="handleClose"
        >
          ×
        </button>
      </div>

      <div v-if="loading" class="provider-config-modal__loading">
        Loading provider configuration...
      </div>

      <form v-else class="provider-config-modal__form" @submit.prevent="handleSubmit">
        <div v-if="provider" class="provider-config-modal__provider-info">
          <div class="provider-config-modal__provider-name">
            {{ provider.name }}
          </div>
          <span :class="['provider-type-badge', `provider-type-badge--${provider.type}`]">
            {{ formatProviderType(provider.type) }}
          </span>
        </div>

        <!-- SMTP Configuration -->
        <template v-if="provider?.type === 'smtp'">
          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">SMTP Host *</label>
            <input
              v-model="form.host"
              type="text"
              class="provider-config-modal__input"
              placeholder="smtp.example.com"
              required
            >
          </div>

          <div class="provider-config-modal__form-row">
            <div class="provider-config-modal__form-group">
              <label class="provider-config-modal__label">Port *</label>
              <input
                v-model.number="form.port"
                type="number"
                class="provider-config-modal__input"
                placeholder="587"
                required
              >
            </div>

            <div class="provider-config-modal__form-group">
              <label class="provider-config-modal__label">Encryption</label>
              <select
                v-model="form.encryption"
                class="provider-config-modal__select"
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">Username *</label>
            <input
              v-model="form.username"
              type="text"
              class="provider-config-modal__input"
              placeholder="your-email@example.com"
              required
            >
          </div>

          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">Password *</label>
            <input
              v-model="form.password"
              type="password"
              class="provider-config-modal__input"
              placeholder="••••••••"
              required
            >
          </div>
        </template>

        <!-- SendGrid Configuration -->
        <template v-else-if="provider?.type === 'sendgrid'">
          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">API Key *</label>
            <input
              v-model="form.apiKey"
              type="password"
              class="provider-config-modal__input"
              placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
              required
            >
            <p class="provider-config-modal__hint">
              Get your API key from SendGrid dashboard
            </p>
          </div>
        </template>

        <!-- AWS SES Configuration -->
        <template v-else-if="provider?.type === 'aws_ses'">
          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">AWS Region *</label>
            <select
              v-model="form.region"
              class="provider-config-modal__select"
              required
            >
              <option value="">Select region</option>
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">EU (Ireland)</option>
              <option value="eu-central-1">EU (Frankfurt)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
            </select>
          </div>

          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">Access Key ID *</label>
            <input
              v-model="form.accessKeyId"
              type="text"
              class="provider-config-modal__input"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required
            >
          </div>

          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">Secret Access Key *</label>
            <input
              v-model="form.secretAccessKey"
              type="password"
              class="provider-config-modal__input"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              required
            >
          </div>
        </template>

        <!-- Mailgun Configuration -->
        <template v-else-if="provider?.type === 'mailgun'">
          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">Domain *</label>
            <input
              v-model="form.domain"
              type="text"
              class="provider-config-modal__input"
              placeholder="mg.example.com"
              required
            >
          </div>

          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">API Key *</label>
            <input
              v-model="form.apiKey"
              type="password"
              class="provider-config-modal__input"
              placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxx"
              required
            >
          </div>
        </template>

        <!-- Postmark Configuration -->
        <template v-else-if="provider?.type === 'postmark'">
          <div class="provider-config-modal__form-group">
            <label class="provider-config-modal__label">Server Token *</label>
            <input
              v-model="form.serverToken"
              type="password"
              class="provider-config-modal__input"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              required
            >
            <p class="provider-config-modal__hint">
              Get your server token from Postmark dashboard
            </p>
          </div>
        </template>

        <!-- Common Fields -->
        <div class="provider-config-modal__form-group">
          <label class="provider-config-modal__label">From Email *</label>
          <input
            v-model="form.fromEmail"
            type="email"
            class="provider-config-modal__input"
            placeholder="noreply@example.com"
            required
          >
        </div>

        <div class="provider-config-modal__form-group">
          <label class="provider-config-modal__label">From Name *</label>
          <input
            v-model="form.fromName"
            type="text"
            class="provider-config-modal__input"
            placeholder="Your Platform"
            required
          >
        </div>

        <div class="provider-config-modal__form-group">
          <label class="provider-config-modal__checkbox-label">
            <input
              v-model="form.isActive"
              type="checkbox"
              class="provider-config-modal__checkbox"
            >
            <span>Enable this provider</span>
          </label>
        </div>

        <div class="provider-config-modal__form-group">
          <label class="provider-config-modal__checkbox-label">
            <input
              v-model="form.isPrimary"
              type="checkbox"
              class="provider-config-modal__checkbox"
            >
            <span>Set as primary provider</span>
          </label>
          <p class="provider-config-modal__hint">
            Primary provider will be used by default for sending emails
          </p>
        </div>

        <div class="provider-config-modal__actions">
          <button
            type="button"
            class="provider-config-modal__btn provider-config-modal__btn--secondary"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="provider-config-modal__btn provider-config-modal__btn--primary"
            :disabled="submitting"
          >
            {{ submitting ? 'Saving...' : 'Save Configuration' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmailStore } from '~/stores/email'

const props = defineProps<{
  providerId: string | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const emailStore = useEmailStore()

const loading = ref(false)
const submitting = ref(false)

const provider = computed(() => 
  emailStore.providers.find(p => p.id === props.providerId)
)

const form = reactive({
  // SMTP
  host: '',
  port: 587,
  encryption: 'tls',
  username: '',
  password: '',
  // API-based
  apiKey: '',
  serverToken: '',
  domain: '',
  region: '',
  accessKeyId: '',
  secretAccessKey: '',
  // Common
  fromEmail: '',
  fromName: '',
  isActive: true,
  isPrimary: false,
})

// Load provider config
onMounted(() => {
  if (provider.value) {
    const config = provider.value.config
    
    // Load existing config
    Object.keys(form).forEach(key => {
      if (config[key] !== undefined) {
        (form as any)[key] = config[key]
      }
    })
    
    form.isActive = provider.value.isActive
    form.isPrimary = provider.value.isPrimary
  }
})

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!props.providerId) return

  submitting.value = true

  try {
    // Build config object based on provider type
    const config: Record<string, any> = {
      fromEmail: form.fromEmail,
      fromName: form.fromName,
      isActive: form.isActive,
      isPrimary: form.isPrimary,
    }

    if (provider.value?.type === 'smtp') {
      config.host = form.host
      config.port = form.port
      config.encryption = form.encryption
      config.username = form.username
      config.password = form.password
    } else if (provider.value?.type === 'sendgrid') {
      config.apiKey = form.apiKey
    } else if (provider.value?.type === 'aws_ses') {
      config.region = form.region
      config.accessKeyId = form.accessKeyId
      config.secretAccessKey = form.secretAccessKey
    } else if (provider.value?.type === 'mailgun') {
      config.domain = form.domain
      config.apiKey = form.apiKey
    } else if (provider.value?.type === 'postmark') {
      config.serverToken = form.serverToken
    }

    await emailStore.updateProvider(props.providerId, config)
    emit('saved')
  } catch (error) {
    console.error('Failed to save provider config:', error)
    alert('Failed to save configuration')
  } finally {
    submitting.value = false
  }
}

const formatProviderType = (type: string): string => {
  const typeMap: Record<string, string> = {
    smtp: 'SMTP',
    sendgrid: 'SendGrid',
    aws_ses: 'AWS SES',
    mailgun: 'Mailgun',
    postmark: 'Postmark',
  }
  return typeMap[type] || type
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.provider-config-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
}

.provider-config-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.provider-config-modal__content {
  position: relative;
  background: $bg-primary;
  border-radius: $radius-lg;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: $shadow-lg;
}

.provider-config-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  background: $bg-primary;
  z-index: 1;
}

.provider-config-modal__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.provider-config-modal__close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: $text-secondary;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transition: color $transition-base;
  
  &:hover {
    color: $text-primary;
  }
}

.provider-config-modal__loading {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
}

.provider-config-modal__form {
  padding: $spacing-lg;
}

.provider-config-modal__provider-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
}

.provider-config-modal__provider-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
}

.provider-config-modal__form-group {
  margin-bottom: $spacing-lg;
}

.provider-config-modal__form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.provider-config-modal__label {
  display: block;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.provider-config-modal__input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 1rem;
  transition: border-color $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.provider-config-modal__select {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 1rem;
  background: $bg-primary;
  cursor: pointer;
  transition: border-color $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.provider-config-modal__hint {
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $text-secondary;
}

.provider-config-modal__checkbox-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  
  span {
    color: $text-primary;
  }
}

.provider-config-modal__checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.provider-config-modal__actions {
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.provider-config-modal__btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: all $transition-base;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.provider-config-modal__btn--primary {
  background: $primary-color;
  color: white;
  
  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

.provider-config-modal__btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.provider-type-badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.provider-type-badge--smtp {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.provider-type-badge--sendgrid {
  background: lighten($primary-color, 40%);
  color: $primary-color;
}

.provider-type-badge--aws_ses {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.provider-type-badge--mailgun {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.provider-type-badge--postmark {
  background: lighten($info-color, 40%);
  color: $info-color;
}

@media (max-width: $breakpoint-md) {
  .provider-config-modal {
    padding: 0;
  }
  
  .provider-config-modal__content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .provider-config-modal__form-row {
    grid-template-columns: 1fr;
  }
  
  .provider-config-modal__actions {
    flex-direction: column;
  }
}
</style>
