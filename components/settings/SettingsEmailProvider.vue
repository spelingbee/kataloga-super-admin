<template>
  <div class="settings-email">
    <div class="settings-email__header">
      <div>
        <h2 class="settings-email__title">Email Provider Configuration</h2>
        <p class="settings-email__description">
          Configure email providers for sending notifications and transactional emails
        </p>
      </div>
      <button class="btn btn--primary" @click="openAddModal">
        <AppIcon name="plus" class="btn__icon" />
        Add Provider
      </button>
    </div>

    <div v-if="providers.length === 0" class="settings-email__empty">
      <AppIcon name="mail" class="settings-email__empty-icon" />
      <p class="settings-email__empty-text">No email providers configured</p>
      <button class="btn btn--primary" @click="openAddModal">
        Add Your First Provider
      </button>
    </div>

    <div v-else class="settings-email__list">
      <div
        v-for="provider in providers"
        :key="provider.id"
        class="email-provider-card"
      >
        <div class="email-provider-card__header">
          <div class="email-provider-card__info">
            <div class="email-provider-card__name">
              {{ getProviderTypeName(provider.type) }}
              <span v-if="provider.isPrimary" class="badge badge--primary">Primary</span>
              <span v-if="provider.isActive" class="badge badge--success">Active</span>
              <span v-else class="badge badge--secondary">Inactive</span>
            </div>
            <div class="email-provider-card__meta">
              {{ provider.config.fromEmail || 'No email configured' }}
            </div>
          </div>
          <div class="email-provider-card__actions">
            <button
              class="btn btn--sm btn--secondary"
              :disabled="testing"
              @click="testProvider(provider.id!)"
            >
              <AppIcon name="check-circle" class="btn__icon" />
              Test
            </button>
            <button
              class="btn btn--sm btn--secondary"
              @click="openEditModal(provider)"
            >
              <AppIcon name="edit" class="btn__icon" />
              Edit
            </button>
            <button
              class="btn btn--sm btn--danger"
              :disabled="provider.isPrimary"
              @click="handleDelete(provider.id!)"
            >
              <AppIcon name="trash" class="btn__icon" />
              Delete
            </button>
          </div>
        </div>

        <div class="email-provider-card__details">
          <div class="detail-item">
            <span class="detail-item__label">Type:</span>
            <span class="detail-item__value">{{ provider.type.toUpperCase() }}</span>
          </div>
          <div v-if="provider.config.host" class="detail-item">
            <span class="detail-item__label">Host:</span>
            <span class="detail-item__value">{{ provider.config.host }}:{{ provider.config.port }}</span>
          </div>
          <div v-if="provider.config.fromName" class="detail-item">
            <span class="detail-item__label">From Name:</span>
            <span class="detail-item__value">{{ provider.config.fromName }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <EmailProviderModal
      v-if="showModal"
      :provider="selectedProvider"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import type { EmailProviderConfig } from '~/types'
import EmailProviderModal from './EmailProviderModal.vue'

const settingsStore = useSettingsStore()
const { showConfirm } = useConfirm()

const showModal = ref(false)
const selectedProvider = ref<EmailProviderConfig | null>(null)

const providers = computed(() => settingsStore.emailProviders)
const testing = computed(() => settingsStore.testing)

const getProviderTypeName = (type: string): string => {
  const names: Record<string, string> = {
    smtp: 'SMTP',
    sendgrid: 'SendGrid',
    aws_ses: 'AWS SES',
    mailgun: 'Mailgun',
    postmark: 'Postmark',
  }
  return names[type] || type
}

const openAddModal = () => {
  selectedProvider.value = null
  showModal.value = true
}

const openEditModal = (provider: EmailProviderConfig) => {
  selectedProvider.value = { ...provider }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedProvider.value = null
}

const handleSave = async (provider: EmailProviderConfig) => {
  try {
    await settingsStore.updateEmailProvider(provider)
    closeModal()
  } catch (error) {
    console.error('Failed to save email provider:', error)
  }
}

const testProvider = async (providerId: string) => {
  try {
    await settingsStore.testEmailProvider(providerId)
  } catch (error) {
    console.error('Failed to test email provider:', error)
  }
}

const handleDelete = async (providerId: string) => {
  const confirmed = await showConfirm({
    title: 'Delete Email Provider',
    message: 'Are you sure you want to delete this email provider? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })

  if (confirmed) {
    try {
      await settingsStore.deleteEmailProvider(providerId)
    } catch (error) {
      console.error('Failed to delete email provider:', error)
    }
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.settings-email__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
  gap: $spacing-md;
}

.settings-email__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
}

.settings-email__description {
  margin-top: $spacing-xs;
  color: $text-secondary;
  font-size: 0.875rem;
}

.settings-email__empty {
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

.settings-email__empty-icon {
  width: 64px;
  height: 64px;
  color: $text-light;
  margin-bottom: $spacing-md;
}

.settings-email__empty-text {
  color: $text-secondary;
  margin-bottom: $spacing-lg;
  font-size: 1.125rem;
}

.settings-email__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.email-provider-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  transition: box-shadow $transition-base;
  
  &:hover {
    box-shadow: $shadow-md;
  }
}

.email-provider-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
  gap: $spacing-md;
}

.email-provider-card__info {
  flex: 1;
}

.email-provider-card__name {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-provider-card__meta {
  color: $text-secondary;
  font-size: 0.875rem;
}

.email-provider-card__actions {
  display: flex;
  gap: $spacing-sm;
}

.email-provider-card__details {
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
  .settings-email__header {
    flex-direction: column;
  }
  
  .email-provider-card__header {
    flex-direction: column;
  }
  
  .email-provider-card__actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .email-provider-card__details {
    grid-template-columns: 1fr;
  }
}
</style>
