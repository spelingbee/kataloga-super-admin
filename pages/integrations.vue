<template>
  <div class="integrations-page">
    <div class="integrations-page__header">
      <h1 class="integrations-page__title">Integrations</h1>
      <p class="integrations-page__description">
        Manage third-party integrations and webhooks
      </p>
    </div>

    <div v-if="loading && !integrations.length" class="integrations-page__loading">
      <div class="spinner"/>
      <p>Loading integrations...</p>
    </div>

    <div v-else-if="error && !integrations.length" class="integrations-page__error">
      <p>{{ error }}</p>
      <button class="btn btn--primary" @click="loadIntegrations">
        Retry
      </button>
    </div>

    <div v-else class="integrations-page__content">
      <!-- Integrations Grid -->
      <div class="integrations-grid">
        <div
          v-for="integration in integrations"
          :key="integration.id"
          class="integration-card"
        >
          <div class="integration-card__header">
            <div class="integration-card__icon-wrapper">
              <AppIcon :name="integration.icon" class="integration-card__icon" />
            </div>
            <div class="integration-card__toggle">
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="integration.isActive"
                  :disabled="!integration.isConfigured || saving"
                  @change="handleToggle(integration.id, !integration.isActive)"
                >
                <span class="toggle-switch__slider"/>
              </label>
            </div>
          </div>

          <div class="integration-card__body">
            <h3 class="integration-card__name">{{ integration.name }}</h3>
            <p class="integration-card__description">{{ integration.description }}</p>

            <div class="integration-card__status">
              <span
                :class="[
                  'status-badge',
                  `status-badge--${getStatusColor(integration)}`,
                ]"
              >
                {{ getStatusText(integration) }}
              </span>
              <span v-if="integration.lastSync" class="integration-card__sync">
                Last sync: {{ formatDate(integration.lastSync) }}
              </span>
            </div>
          </div>

          <div class="integration-card__footer">
            <button
              v-if="!integration.isConfigured"
              class="btn btn--primary btn--sm"
              @click="handleConfigure(integration)"
            >
              Configure
            </button>
            <button
              v-else
              class="btn btn--secondary btn--sm"
              @click="handleConfigure(integration)"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      <!-- Webhooks Section -->
      <div class="webhooks-section">
        <div class="webhooks-section__header">
          <h2 class="webhooks-section__title">Webhooks</h2>
          <button class="btn btn--primary" @click="showWebhookModal = true">
            <AppIcon name="plus" />
            Add Webhook
          </button>
        </div>

        <div v-if="webhooks.length === 0" class="webhooks-section__empty">
          <AppIcon name="webhook" class="webhooks-section__empty-icon" />
          <p>No webhooks configured</p>
          <button class="btn btn--primary" @click="showWebhookModal = true">
            Create Your First Webhook
          </button>
        </div>

        <div v-else class="webhooks-list">
          <div
            v-for="webhook in webhooks"
            :key="webhook.id"
            class="webhook-item"
          >
            <div class="webhook-item__main">
              <div class="webhook-item__info">
                <h4 class="webhook-item__name">{{ webhook.name }}</h4>
                <p class="webhook-item__url">{{ webhook.url }}</p>
                <div class="webhook-item__events">
                  <span
                    v-for="event in webhook.events.slice(0, 3)"
                    :key="event"
                    class="event-tag"
                  >
                    {{ event }}
                  </span>
                  <span v-if="webhook.events.length > 3" class="event-tag event-tag--more">
                    +{{ webhook.events.length - 3 }} more
                  </span>
                </div>
              </div>

              <div class="webhook-item__status">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="webhook.isActive"
                    :disabled="saving"
                    @change="handleWebhookToggle(webhook)"
                  >
                  <span class="toggle-switch__slider"/>
                </label>
                <span
                  v-if="webhook.lastDelivery"
                  :class="[
                    'status-badge',
                    `status-badge--${webhook.lastDelivery.status === 'success' ? 'success' : 'error'}`,
                  ]"
                >
                  {{ webhook.lastDelivery.status }}
                </span>
              </div>
            </div>

            <div class="webhook-item__actions">
              <button
                :disabled="testing"
                class="btn btn--secondary btn--sm"
                @click="handleTestWebhook(webhook.id!)"
              >
                <AppIcon name="play" />
                Test
              </button>
              <button
                class="btn btn--secondary btn--sm"
                @click="handleViewLogs(webhook.id!)"
              >
                <AppIcon name="file-text" />
                Logs
              </button>
              <button
                class="btn btn--secondary btn--sm"
                @click="handleEditWebhook(webhook)"
              >
                <AppIcon name="edit" />
                Edit
              </button>
              <button
                :disabled="saving"
                class="btn btn--danger btn--sm"
                @click="handleDeleteWebhook(webhook.id!)"
              >
                <AppIcon name="trash" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Telegram Config Modal -->
    <TelegramConfigModal
      v-if="showTelegramModal"
      @close="showTelegramModal = false"
    />

    <!-- Webhook Config Modal -->
    <WebhookConfigModal
      v-if="showWebhookModal"
      :webhook="selectedWebhook"
      @close="handleWebhookModalClose"
    />

    <!-- Webhook Logs Modal -->
    <WebhookLogsModal
      v-if="showLogsModal"
      :webhook-id="selectedWebhookId"
      @close="showLogsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { useIntegrationStore } from '~/stores/integration'
import type { Integration, WebhookConfig } from '~/types'

definePageMeta({
  middleware: ['auth', 'role'],
  roles: ['super_admin'],
})

const integrationStore = useIntegrationStore()

const showTelegramModal = ref(false)
const showWebhookModal = ref(false)
const showLogsModal = ref(false)
const selectedWebhook = ref<WebhookConfig | null>(null)
const selectedWebhookId = ref<string | null>(null)

const integrations = computed(() => integrationStore.integrations)
const webhooks = computed(() => integrationStore.webhooks)
const loading = computed(() => integrationStore.loading)
const saving = computed(() => integrationStore.saving)
const testing = computed(() => integrationStore.testing)
const error = computed(() => integrationStore.error)

const loadIntegrations = async () => {
  try {
    await integrationStore.fetchIntegrations()
    await integrationStore.fetchWebhooks()
  } catch (err) {
    console.error('Failed to load integrations:', err)
  }
}

const handleToggle = async (integrationId: string, isActive: boolean) => {
  try {
    await integrationStore.toggleIntegration(integrationId, isActive)
  } catch (err) {
    console.error('Failed to toggle integration:', err)
  }
}

const handleConfigure = (integration: Integration) => {
  if (integration.type === 'telegram') {
    showTelegramModal.value = true
  }
  // Add other integration types as needed
}

const handleWebhookToggle = async (webhook: WebhookConfig) => {
  try {
    await integrationStore.updateWebhook({
      ...webhook,
      isActive: !webhook.isActive,
    })
  } catch (err) {
    console.error('Failed to toggle webhook:', err)
  }
}

const handleTestWebhook = async (webhookId: string) => {
  try {
    await integrationStore.testWebhook(webhookId)
  } catch (err) {
    console.error('Failed to test webhook:', err)
  }
}

const handleViewLogs = (webhookId: string) => {
  selectedWebhookId.value = webhookId
  showLogsModal.value = true
}

const handleEditWebhook = (webhook: WebhookConfig) => {
  selectedWebhook.value = webhook
  showWebhookModal.value = true
}

const handleDeleteWebhook = async (webhookId: string) => {
  if (!confirm('Are you sure you want to delete this webhook?')) {
    return
  }

  try {
    await integrationStore.deleteWebhook(webhookId)
  } catch (err) {
    console.error('Failed to delete webhook:', err)
  }
}

const handleWebhookModalClose = () => {
  showWebhookModal.value = false
  selectedWebhook.value = null
}

const getStatusColor = (integration: Integration): string => {
  if (!integration.isConfigured) return 'warning'
  if (!integration.isActive) return 'secondary'
  if (integration.status === 'connected') return 'success'
  if (integration.status === 'error') return 'error'
  return 'secondary'
}

const getStatusText = (integration: Integration): string => {
  if (!integration.isConfigured) return 'Not Configured'
  if (!integration.isActive) return 'Disabled'
  if (integration.status === 'connected') return 'Connected'
  if (integration.status === 'error') return 'Error'
  return 'Disconnected'
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleString()
}

onMounted(() => {
  loadIntegrations()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.integrations-page {
  max-width: 1400px;
}

.integrations-page__header {
  margin-bottom: $spacing-xl;
}

.integrations-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
}

.integrations-page__description {
  margin-top: $spacing-sm;
  color: $text-secondary;
}

.integrations-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  gap: $spacing-md;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $border-color;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.integrations-page__error {
  padding: $spacing-xl;
  text-align: center;
  background: $bg-secondary;
  border-radius: $radius-lg;
  
  p {
    color: $error-color;
    margin-bottom: $spacing-md;
  }
}

.integrations-page__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-2xl;
}

.integrations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;
}

.integration-card {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  transition: all $transition-base;
  
  &:hover {
    box-shadow: $shadow-md;
  }
}

.integration-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
}

.integration-card__icon-wrapper {
  width: 48px;
  height: 48px;
  background: $bg-secondary;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
}

.integration-card__icon {
  width: 28px;
  height: 28px;
  color: $primary-color;
}

.integration-card__body {
  margin-bottom: $spacing-lg;
}

.integration-card__name {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.integration-card__description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-md;
}

.integration-card__status {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.integration-card__sync {
  font-size: 0.75rem;
  color: $text-light;
}

.integration-card__footer {
  display: flex;
  gap: $spacing-sm;
}

.webhooks-section {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-xl;
}

.webhooks-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.webhooks-section__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
}

.webhooks-section__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  text-align: center;
  gap: $spacing-md;
}

.webhooks-section__empty-icon {
  width: 64px;
  height: 64px;
  color: $text-light;
}

.webhooks-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.webhook-item {
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-lg;
}

.webhook-item__main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
  gap: $spacing-lg;
}

.webhook-item__info {
  flex: 1;
}

.webhook-item__name {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.webhook-item__url {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
  word-break: break-all;
}

.webhook-item__events {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.event-tag {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  color: $text-secondary;
}

.event-tag--more {
  background: $primary-color;
  color: white;
  border-color: $primary-color;
}

.webhook-item__status {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.webhook-item__actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + .toggle-switch__slider {
      background-color: $primary-color;
      
      &:before {
        transform: translateX(20px);
      }
    }
    
    &:disabled + .toggle-switch__slider {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.toggle-switch__slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: $border-dark;
  transition: $transition-base;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: $transition-base;
    border-radius: 50%;
  }
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge--success {
  background: rgba(16, 185, 129, 0.1);
  color: $success-color;
}

.status-badge--error {
  background: rgba(239, 68, 68, 0.1);
  color: $error-color;
}

.status-badge--warning {
  background: rgba(245, 158, 11, 0.1);
  color: $warning-color;
}

.status-badge--secondary {
  background: $bg-secondary;
  color: $text-secondary;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: $breakpoint-md) {
  .integrations-grid {
    grid-template-columns: 1fr;
  }
  
  .webhook-item__main {
    flex-direction: column;
  }
  
  .webhook-item__actions {
    width: 100%;
    
    button {
      flex: 1;
    }
  }
}
</style>
