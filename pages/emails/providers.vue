<template>
  <div class="email-providers-page">
    <div class="email-providers-page__header">
      <div>
        <h1 class="email-providers-page__title">Email Providers</h1>
        <p class="email-providers-page__subtitle">
          Configure and manage email service providers
        </p>
      </div>
      <NuxtLink to="/emails" class="email-providers-page__back-btn">
        ← Back to Dashboard
      </NuxtLink>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="email-providers-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Providers List -->
    <div v-if="!loading && providers.length > 0" class="email-providers-page__list">
      <div
        v-for="provider in providers"
        :key="provider.id"
        class="email-providers-page__card"
      >
        <div class="email-providers-page__card-header">
          <div class="email-providers-page__card-info">
            <h3 class="email-providers-page__card-title">{{ provider.name }}</h3>
            <span :class="['provider-type-badge', `provider-type-badge--${provider.type}`]">
              {{ formatProviderType(provider.type) }}
            </span>
          </div>
          <div class="email-providers-page__card-badges">
            <span
              v-if="provider.isPrimary"
              class="email-providers-page__primary-badge"
            >
              Primary
            </span>
            <span :class="['status-badge', `status-badge--${provider.status}`]">
              {{ formatStatus(provider.status) }}
            </span>
          </div>
        </div>

        <div class="email-providers-page__card-meta">
          <div class="email-providers-page__card-meta-item">
            <span class="email-providers-page__card-meta-label">Status:</span>
            <span :class="['status-indicator', `status-indicator--${provider.status}`]" />
            <span>{{ formatStatus(provider.status) }}</span>
          </div>
          <div class="email-providers-page__card-meta-item">
            <span class="email-providers-page__card-meta-label">Active:</span>
            <span>{{ provider.isActive ? 'Yes' : 'No' }}</span>
          </div>
          <div v-if="provider.lastTested" class="email-providers-page__card-meta-item">
            <span class="email-providers-page__card-meta-label">Last Tested:</span>
            <span>{{ formatDateTime(provider.lastTested) }}</span>
          </div>
        </div>

        <div class="email-providers-page__card-actions">
          <button
            class="email-providers-page__action-btn email-providers-page__action-btn--configure"
            @click="handleConfigure(provider.id)"
          >
            Configure
          </button>
          <button
            class="email-providers-page__action-btn email-providers-page__action-btn--test"
            :disabled="testingProvider === provider.id"
            @click="handleTest(provider.id)"
          >
            {{ testingProvider === provider.id ? 'Testing...' : 'Test Connection' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && providers.length === 0" class="email-providers-page__empty">
      <p>No email providers configured</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="email-providers-page__loading">
      <div class="email-providers-page__skeleton" />
      <div class="email-providers-page__skeleton" />
    </div>

    <!-- Provider Configuration Modal -->
    <ProviderConfigModal
      v-if="showConfigModal"
      :provider-id="selectedProviderId"
      @close="closeConfigModal"
      @saved="handleProviderSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { useEmailStore } from '~/stores/email'
import ProviderConfigModal from '~/components/email/ProviderConfigModal.vue'

const emailStore = useEmailStore()

const providers = computed(() => emailStore.providers)
const loading = computed(() => emailStore.loading)
const error = computed(() => emailStore.error)

const showConfigModal = ref(false)
const selectedProviderId = ref<string | null>(null)
const testingProvider = ref<string | null>(null)

// Fetch providers on mount
onMounted(async () => {
  try {
    await emailStore.fetchProviders()
  } catch (error) {
    console.error('Failed to load providers:', error)
  }
})

// Methods
const retryFetch = async () => {
  emailStore.clearError()
  try {
    await emailStore.fetchProviders()
  } catch (error) {
    console.error('Failed to retry fetch:', error)
  }
}

const handleConfigure = (providerId: string) => {
  selectedProviderId.value = providerId
  showConfigModal.value = true
}

const handleTest = async (providerId: string) => {
  testingProvider.value = providerId

  try {
    const result = await emailStore.testProvider(providerId)
    
    if (result.success) {
      alert(`✓ Connection successful!\n\n${result.message}`)
    } else {
      alert(`✗ Connection failed!\n\n${result.message}`)
    }
  } catch (error: any) {
    alert(`✗ Connection test failed!\n\n${error.message || 'Unknown error'}`)
  } finally {
    testingProvider.value = null
  }
}

const closeConfigModal = () => {
  showConfigModal.value = false
  selectedProviderId.value = null
}

const handleProviderSaved = () => {
  closeConfigModal()
  emailStore.fetchProviders()
}

// Format helpers
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

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.email-providers-page {
  padding: $spacing-xl;
  max-width: 1200px;
  margin: 0 auto;
}

.email-providers-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.email-providers-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-providers-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.email-providers-page__back-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  text-decoration: none;
  font-weight: 500;
  transition: background $transition-base;
  
  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.email-providers-page__error {
  padding: $spacing-lg;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  p {
    color: $error-color;
    font-weight: 500;
    margin: 0;
  }
  
  button {
    padding: $spacing-xs $spacing-md;
    background: $error-color;
    color: white;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background: darken($error-color, 10%);
    }
  }
}

.email-providers-page__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.email-providers-page__card {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  transition: box-shadow $transition-base;
  
  &:hover {
    box-shadow: $shadow-md;
  }
}

.email-providers-page__card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
}

.email-providers-page__card-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.email-providers-page__card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.email-providers-page__card-badges {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
}

.email-providers-page__primary-badge {
  padding: $spacing-xs $spacing-sm;
  background: lighten($primary-color, 40%);
  color: $primary-color;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.email-providers-page__card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  padding: $spacing-md 0;
  border-top: 1px solid $border-color;
  border-bottom: 1px solid $border-color;
  margin-bottom: $spacing-md;
}

.email-providers-page__card-meta-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.875rem;
}

.email-providers-page__card-meta-label {
  font-weight: 500;
  color: $text-secondary;
}

.email-providers-page__card-actions {
  display: flex;
  gap: $spacing-sm;
}

.email-providers-page__action-btn {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: $bg-primary;
  color: $text-primary;
  cursor: pointer;
  font-weight: 500;
  transition: all $transition-base;
  
  &:hover:not(:disabled) {
    background: $bg-secondary;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.email-providers-page__action-btn--configure {
  color: $primary-color;
  border-color: $primary-color;
  
  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.email-providers-page__action-btn--test {
  color: $info-color;
  border-color: $info-color;
  
  &:hover:not(:disabled) {
    background: lighten($info-color, 45%);
  }
}

.email-providers-page__empty {
  text-align: center;
  padding: $spacing-xl * 2;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  
  p {
    font-size: 1.125rem;
    color: $text-secondary;
  }
}

.email-providers-page__loading {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.email-providers-page__skeleton {
  background: linear-gradient(90deg, $bg-secondary 25%, $bg-primary 50%, $bg-secondary 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: $radius-lg;
  height: 180px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
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

.status-badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--connected {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--disconnected {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge--error {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator--connected {
  background: $success-color;
}

.status-indicator--disconnected {
  background: $secondary-color;
}

.status-indicator--error {
  background: $error-color;
}

@media (max-width: $breakpoint-md) {
  .email-providers-page {
    padding: $spacing-lg;
  }
  
  .email-providers-page__header {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .email-providers-page__card-header {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .email-providers-page__card-meta {
    flex-direction: column;
    gap: $spacing-sm;
  }
  
  .email-providers-page__card-actions {
    flex-direction: column;
  }
}
</style>
