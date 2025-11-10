import { defineStore } from 'pinia'
import type {
  IntegrationState,
  Integration,
  TelegramBotConfig,
  WebhookConfig,
  WebhookLog,
} from '~/types'

export const useIntegrationStore = defineStore('integration', {
  state: (): IntegrationState => ({
    integrations: [],
    telegramConfig: null,
    webhooks: [],
    webhookLogs: [],
    currentWebhook: null,
    loading: false,
    saving: false,
    testing: false,
    error: null,
    lastFetched: null,
  }),

  getters: {
    activeIntegrations: (state): Integration[] => {
      return state.integrations.filter(i => i.isActive)
    },

    configuredIntegrations: (state): Integration[] => {
      return state.integrations.filter(i => i.isConfigured)
    },

    telegramIntegration: (state): Integration | null => {
      return state.integrations.find(i => i.type === 'telegram') || null
    },

    activeWebhooks: (state): WebhookConfig[] => {
      return state.webhooks.filter(w => w.isActive)
    },

    isTelegramConfigured: (state): boolean => {
      return !!state.telegramConfig?.botToken && state.telegramConfig.isActive
    },
  },

  actions: {
    async fetchIntegrations() {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.get<Integration[]>('/admin/integrations')
        
        this.integrations = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch integrations'
        console.error('Error fetching integrations:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async toggleIntegration(integrationId: string, isActive: boolean) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.patch<Integration>(
          `/admin/integrations/${integrationId}/toggle`,
          { isActive }
        )
        
        const index = this.integrations.findIndex(i => i.id === integrationId)
        if (index !== -1) {
          this.integrations[index] = response.data
        }

        const { success } = useNotification()
        success(`Integration ${isActive ? 'enabled' : 'disabled'} successfully`)
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to toggle integration'
        console.error('Error toggling integration:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async fetchTelegramConfig() {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.get<TelegramBotConfig>('/admin/integrations/telegram')
        
        this.telegramConfig = response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch Telegram configuration'
        console.error('Error fetching Telegram config:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateTelegramConfig(config: TelegramBotConfig) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.put<TelegramBotConfig>(
          '/admin/integrations/telegram',
          config
        )
        
        this.telegramConfig = response.data

        // Update integration status
        const telegramIntegration = this.integrations.find(i => i.type === 'telegram')
        if (telegramIntegration) {
          telegramIntegration.isActive = config.isActive
          telegramIntegration.isConfigured = true
          telegramIntegration.status = 'connected'
        }

        const { success } = useNotification()
        success('Telegram bot configuration updated successfully')
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update Telegram configuration'
        console.error('Error updating Telegram config:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async testTelegramConnection() {
      this.testing = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.post<{ success: boolean; message: string }>(
          '/admin/integrations/telegram/test'
        )
        
        const { success, error: showError } = useNotification()
        if (response.data.success) {
          success(response.data.message || 'Telegram bot connection successful')
          
          if (this.telegramConfig) {
            this.telegramConfig.status = 'connected'
            this.telegramConfig.lastTested = new Date().toISOString()
          }
        } else {
          showError(response.data.message || 'Telegram bot connection failed')
          
          if (this.telegramConfig) {
            this.telegramConfig.status = 'error'
          }
        }
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to test Telegram connection'
        console.error('Error testing Telegram connection:', error)
        
        if (this.telegramConfig) {
          this.telegramConfig.status = 'error'
        }
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.testing = false
      }
    },

    async fetchWebhooks() {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.get<WebhookConfig[]>('/admin/integrations/webhooks')
        
        this.webhooks = response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch webhooks'
        console.error('Error fetching webhooks:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createWebhook(webhook: WebhookConfig) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.post<WebhookConfig>(
          '/admin/integrations/webhooks',
          webhook
        )
        
        this.webhooks.push(response.data)

        const { success } = useNotification()
        success('Webhook created successfully')
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to create webhook'
        console.error('Error creating webhook:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateWebhook(webhook: WebhookConfig) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.put<WebhookConfig>(
          `/admin/integrations/webhooks/${webhook.id}`,
          webhook
        )
        
        const index = this.webhooks.findIndex(w => w.id === webhook.id)
        if (index !== -1) {
          this.webhooks[index] = response.data
        }

        const { success } = useNotification()
        success('Webhook updated successfully')
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update webhook'
        console.error('Error updating webhook:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async deleteWebhook(webhookId: string) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.delete(`/admin/integrations/webhooks/${webhookId}`)
        
        this.webhooks = this.webhooks.filter(w => w.id !== webhookId)

        const { success } = useNotification()
        success('Webhook deleted successfully')
      } catch (error: any) {
        this.error = error.message || 'Failed to delete webhook'
        console.error('Error deleting webhook:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async testWebhook(webhookId: string) {
      this.testing = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.post<{ success: boolean; message: string }>(
          `/admin/integrations/webhooks/${webhookId}/test`
        )
        
        const { success, error: showError } = useNotification()
        if (response.data.success) {
          success(response.data.message || 'Webhook test successful')
        } else {
          showError(response.data.message || 'Webhook test failed')
        }
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to test webhook'
        console.error('Error testing webhook:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.testing = false
      }
    },

    async fetchWebhookLogs(webhookId?: string) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const url = webhookId 
          ? `/admin/integrations/webhooks/${webhookId}/logs`
          : '/admin/integrations/webhooks/logs'
        
        const response = await $api.get<WebhookLog[]>(url)
        
        this.webhookLogs = response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch webhook logs'
        console.error('Error fetching webhook logs:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    },

    resetState() {
      this.integrations = []
      this.telegramConfig = null
      this.webhooks = []
      this.webhookLogs = []
      this.currentWebhook = null
      this.loading = false
      this.saving = false
      this.testing = false
      this.error = null
      this.lastFetched = null
    },
  },
})
