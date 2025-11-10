<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">
          {{ provider ? 'Edit Email Provider' : 'Add Email Provider' }}
        </h3>
        <button @click="$emit('close')" class="modal__close">
          <AppIcon name="x" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal__body">
        <!-- Provider Type -->
        <div class="form-group">
          <label for="providerType" class="form-group__label">
            Provider Type <span class="required">*</span>
          </label>
          <select
            id="providerType"
            v-model="formData.type"
            class="form-group__select"
            required
            :disabled="!!provider"
          >
            <option value="">Select provider type</option>
            <option value="smtp">SMTP</option>
            <option value="sendgrid">SendGrid</option>
            <option value="aws_ses">AWS SES</option>
            <option value="mailgun">Mailgun</option>
            <option value="postmark">Postmark</option>
          </select>
        </div>

        <!-- Common Fields -->
        <div class="form-row">
          <div class="form-group">
            <label for="fromEmail" class="form-group__label">
              From Email <span class="required">*</span>
            </label>
            <input
              id="fromEmail"
              v-model="formData.config.fromEmail"
              type="email"
              class="form-group__input"
              required
            />
          </div>

          <div class="form-group">
            <label for="fromName" class="form-group__label">
              From Name <span class="required">*</span>
            </label>
            <input
              id="fromName"
              v-model="formData.config.fromName"
              type="text"
              class="form-group__input"
              required
            />
          </div>
        </div>

        <!-- SMTP Configuration -->
        <div v-if="formData.type === 'smtp'" class="config-section">
          <h4 class="config-section__title">SMTP Configuration</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="smtpHost" class="form-group__label">
                Host <span class="required">*</span>
              </label>
              <input
                id="smtpHost"
                v-model="formData.config.host"
                type="text"
                class="form-group__input"
                placeholder="smtp.example.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="smtpPort" class="form-group__label">
                Port <span class="required">*</span>
              </label>
              <input
                id="smtpPort"
                v-model.number="formData.config.port"
                type="number"
                class="form-group__input"
                placeholder="587"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="smtpUsername" class="form-group__label">
                Username <span class="required">*</span>
              </label>
              <input
                id="smtpUsername"
                v-model="formData.config.username"
                type="text"
                class="form-group__input"
                required
              />
            </div>

            <div class="form-group">
              <label for="smtpPassword" class="form-group__label">
                Password <span class="required">*</span>
              </label>
              <input
                id="smtpPassword"
                v-model="formData.config.password"
                type="password"
                class="form-group__input"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-group__checkbox">
              <input
                v-model="formData.config.secure"
                type="checkbox"
                class="form-group__checkbox-input"
              />
              <span class="form-group__checkbox-label">
                Use SSL/TLS
              </span>
            </label>
          </div>
        </div>

        <!-- SendGrid Configuration -->
        <div v-if="formData.type === 'sendgrid'" class="config-section">
          <h4 class="config-section__title">SendGrid Configuration</h4>
          
          <div class="form-group">
            <label for="sendgridApiKey" class="form-group__label">
              API Key <span class="required">*</span>
            </label>
            <input
              id="sendgridApiKey"
              v-model="formData.config.apiKey"
              type="password"
              class="form-group__input"
              required
            />
          </div>
        </div>

        <!-- AWS SES Configuration -->
        <div v-if="formData.type === 'aws_ses'" class="config-section">
          <h4 class="config-section__title">AWS SES Configuration</h4>
          
          <div class="form-group">
            <label for="awsRegion" class="form-group__label">
              Region <span class="required">*</span>
            </label>
            <select
              id="awsRegion"
              v-model="formData.config.region"
              class="form-group__select"
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

          <div class="form-row">
            <div class="form-group">
              <label for="awsAccessKey" class="form-group__label">
                Access Key ID <span class="required">*</span>
              </label>
              <input
                id="awsAccessKey"
                v-model="formData.config.apiKey"
                type="text"
                class="form-group__input"
                required
              />
            </div>

            <div class="form-group">
              <label for="awsSecretKey" class="form-group__label">
                Secret Access Key <span class="required">*</span>
              </label>
              <input
                id="awsSecretKey"
                v-model="formData.config.apiSecret"
                type="password"
                class="form-group__input"
                required
              />
            </div>
          </div>
        </div>

        <!-- Mailgun Configuration -->
        <div v-if="formData.type === 'mailgun'" class="config-section">
          <h4 class="config-section__title">Mailgun Configuration</h4>
          
          <div class="form-group">
            <label for="mailgunDomain" class="form-group__label">
              Domain <span class="required">*</span>
            </label>
            <input
              id="mailgunDomain"
              v-model="formData.config.domain"
              type="text"
              class="form-group__input"
              placeholder="mg.example.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="mailgunApiKey" class="form-group__label">
              API Key <span class="required">*</span>
            </label>
            <input
              id="mailgunApiKey"
              v-model="formData.config.apiKey"
              type="password"
              class="form-group__input"
              required
            />
          </div>
        </div>

        <!-- Postmark Configuration -->
        <div v-if="formData.type === 'postmark'" class="config-section">
          <h4 class="config-section__title">Postmark Configuration</h4>
          
          <div class="form-group">
            <label for="postmarkApiKey" class="form-group__label">
              Server API Token <span class="required">*</span>
            </label>
            <input
              id="postmarkApiKey"
              v-model="formData.config.apiKey"
              type="password"
              class="form-group__input"
              required
            />
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
              />
              <span class="form-group__checkbox-label">
                <strong>Active</strong>
                <span class="form-group__checkbox-description">
                  Enable this provider for sending emails
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
              />
              <span class="form-group__checkbox-label">
                <strong>Primary Provider</strong>
                <span class="form-group__checkbox-description">
                  Use this as the default email provider
                </span>
              </span>
            </label>
          </div>
        </div>

        <div class="modal__footer">
          <button
            type="button"
            @click="$emit('close')"
            class="btn btn--secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn--primary"
          >
            {{ provider ? 'Update Provider' : 'Add Provider' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EmailProviderConfig } from '~/types'

interface Props {
  provider?: EmailProviderConfig | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [provider: EmailProviderConfig]
}>()

const formData = ref<EmailProviderConfig>({
  type: 'smtp',
  isActive: true,
  isPrimary: false,
  config: {
    fromEmail: '',
    fromName: '',
  },
})

const initializeForm = () => {
  if (props.provider) {
    formData.value = JSON.parse(JSON.stringify(props.provider))
  }
}

const handleSubmit = () => {
  emit('save', formData.value)
}

watch(() => props.provider, initializeForm, { immediate: true })
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

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
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

@media (max-width: $breakpoint-md) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
