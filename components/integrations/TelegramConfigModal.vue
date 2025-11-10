<template>
  <AppModal
    :show="true"
    title="Telegram Bot Configuration"
    size="large"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="telegram-config-form">
      <div v-if="error" class="telegram-config-form__error">
        <AppIcon name="alert-circle" />
        <span>{{ error }}</span>
      </div>

      <!-- Bot Token -->
      <div class="form-group">
        <label for="botToken" class="form-group__label">
          Bot Token
          <span class="form-group__required">*</span>
        </label>
        <input
          id="botToken"
          v-model="formData.botToken"
          type="text"
          class="form-group__input"
          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
          required
        />
        <p class="form-group__hint">
          Get your bot token from <a href="https://t.me/BotFather" target="_blank">@BotFather</a>
        </p>
      </div>

      <!-- Webhook URL -->
      <div class="form-group">
        <label for="webhookUrl" class="form-group__label">
          Webhook URL
          <span class="form-group__required">*</span>
        </label>
        <input
          id="webhookUrl"
          v-model="formData.webhookUrl"
          type="url"
          class="form-group__input"
          placeholder="https://your-domain.com/api/telegram/webhook"
          required
        />
        <p class="form-group__hint">
          The URL where Telegram will send updates
        </p>
      </div>

      <!-- Notification Settings -->
      <div class="form-group">
        <label class="form-group__label">Notification Settings</label>
        <div class="notification-settings">
          <label class="checkbox-item">
            <input
              v-model="formData.notificationSettings.newRegistrations"
              type="checkbox"
              class="checkbox-item__input"
            />
            <span class="checkbox-item__label">New Registrations</span>
          </label>

          <label class="checkbox-item">
            <input
              v-model="formData.notificationSettings.approvals"
              type="checkbox"
              class="checkbox-item__input"
            />
            <span class="checkbox-item__label">Approvals & Rejections</span>
          </label>

          <label class="checkbox-item">
            <input
              v-model="formData.notificationSettings.subscriptionChanges"
              type="checkbox"
              class="checkbox-item__input"
            />
            <span class="checkbox-item__label">Subscription Changes</span>
          </label>

          <label class="checkbox-item">
            <input
              v-model="formData.notificationSettings.securityAlerts"
              type="checkbox"
              class="checkbox-item__input"
            />
            <span class="checkbox-item__label">Security Alerts</span>
          </label>

          <label class="checkbox-item">
            <input
              v-model="formData.notificationSettings.systemAlerts"
              type="checkbox"
              class="checkbox-item__input"
            />
            <span class="checkbox-item__label">System Alerts</span>
          </label>
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
          <span class="checkbox-item__label">Enable Telegram Bot</span>
        </label>
      </div>

      <!-- Connection Status -->
      <div v-if="config?.status" class="connection-status">
        <div
          :class="[
            'connection-status__indicator',
            `connection-status__indicator--${config.status}`,
          ]"
        ></div>
        <div class="connection-status__info">
          <span class="connection-status__label">Status:</span>
          <span class="connection-status__value">{{ config.status }}</span>
        </div>
        <div v-if="config.lastTested" class="connection-status__info">
          <span class="connection-status__label">Last Tested:</span>
          <span class="connection-status__value">{{ formatDate(config.lastTested) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="telegram-config-form__actions">
        <button
          type="button"
          @click="handleTest"
          :disabled="!formData.botToken || testing"
          class="btn btn--secondary"
        >
          <AppIcon v-if="!testing" name="play" />
          <div v-else class="btn-spinner"></div>
          {{ testing ? 'Testing...' : 'Test Connection' }}
        </button>
        <div class="telegram-config-form__actions-right">
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
            :disabled="saving || !formData.botToken || !formData.webhookUrl"
          >
            <div v-if="saving" class="btn-spinner"></div>
            {{ saving ? 'Saving...' : 'Save Configuration' }}
          </button>
        </div>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import { useIntegrationStore } from '~/stores/integration'
import type { TelegramBotConfig } from '~/types'

const emit = defineEmits<{
  close: []
}>()

const integrationStore = useIntegrationStore()

const formData = ref<TelegramBotConfig>({
  botToken: '',
  webhookUrl: '',
  isActive: false,
  notificationSettings: {
    newRegistrations: true,
    approvals: true,
    subscriptionChanges: true,
    securityAlerts: true,
    systemAlerts: true,
  },
})

const config = computed(() => integrationStore.telegramConfig)
const saving = computed(() => integrationStore.saving)
const testing = computed(() => integrationStore.testing)
const error = computed(() => integrationStore.error)

const loadConfig = async () => {
  try {
    await integrationStore.fetchTelegramConfig()
    if (config.value) {
      formData.value = { ...config.value }
    }
  } catch (err) {
    console.error('Failed to load Telegram config:', err)
  }
}

const handleSubmit = async () => {
  try {
    await integrationStore.updateTelegramConfig(formData.value)
    emit('close')
  } catch (err) {
    console.error('Failed to save Telegram config:', err)
  }
}

const handleTest = async () => {
  try {
    // Save first if there are changes
    if (formData.value.botToken !== config.value?.botToken) {
      await integrationStore.updateTelegramConfig(formData.value)
    }
    await integrationStore.testTelegramConnection()
  } catch (err) {
    console.error('Failed to test Telegram connection:', err)
  }
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleString()
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.telegram-config-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.telegram-config-form__error {
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
  
  a {
    color: $primary-color;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.notification-settings {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
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

.connection-status {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.connection-status__indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connection-status__indicator--connected {
  background: $success-color;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.connection-status__indicator--disconnected {
  background: $text-light;
}

.connection-status__indicator--error {
  background: $error-color;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.connection-status__info {
  display: flex;
  gap: $spacing-xs;
  font-size: 0.875rem;
}

.connection-status__label {
  color: $text-secondary;
}

.connection-status__value {
  color: $text-primary;
  font-weight: 500;
  text-transform: capitalize;
}

.telegram-config-form__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-md;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.telegram-config-form__actions-right {
  display: flex;
  gap: $spacing-sm;
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
  .telegram-config-form__actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .telegram-config-form__actions-right {
    width: 100%;
    
    button {
      flex: 1;
    }
  }
}
</style>
