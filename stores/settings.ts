import { defineStore } from 'pinia'
import type {
  SettingsState,
  SystemSettings,
  GeneralSettings,
  EmailProviderConfig,
  PaymentGatewayConfig,
  StorageConfig,
} from '~/types'

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    settings: null,
    loading: false,
    saving: false,
    testing: false,
    error: null,
    lastFetched: null,
  }),

  getters: {
    generalSettings: (state): GeneralSettings | null => {
      return state.settings?.general || null
    },

    emailProviders: (state): EmailProviderConfig[] => {
      return state.settings?.emailProviders || []
    },

    primaryEmailProvider: (state): EmailProviderConfig | null => {
      return state.settings?.emailProviders.find(p => p.isPrimary && p.isActive) || null
    },

    paymentGateways: (state): PaymentGatewayConfig[] => {
      return state.settings?.paymentGateways || []
    },

    primaryPaymentGateway: (state): PaymentGatewayConfig | null => {
      return state.settings?.paymentGateways.find(g => g.isPrimary && g.isActive) || null
    },

    storageConfigs: (state): StorageConfig[] => {
      return state.settings?.storage || []
    },

    primaryStorage: (state): StorageConfig | null => {
      return state.settings?.storage.find(s => s.isPrimary && s.isActive) || null
    },

    isMaintenanceMode: (state): boolean => {
      return state.settings?.general.maintenanceMode || false
    },

    isRegistrationEnabled: (state): boolean => {
      return state.settings?.general.registrationEnabled || false
    },

    featureFlags: (state): Record<string, boolean> => {
      return state.settings?.general.featureFlags || {}
    },
  },

  actions: {
    async fetchSettings() {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.get<SystemSettings>('/admin/settings')
        
        this.settings = response.data
        this.lastFetched = Date.now()
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch settings'
        console.error('Error fetching settings:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateGeneralSettings(settings: Partial<GeneralSettings>) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.put<GeneralSettings>('/admin/settings/general', settings)
        
        if (this.settings) {
          this.settings.general = response.data
        }

        const { success } = useNotification()
        success('General settings updated successfully')
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update general settings'
        console.error('Error updating general settings:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateEmailProvider(provider: EmailProviderConfig) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const endpoint = provider.id 
          ? `/admin/settings/email/${provider.id}`
          : '/admin/settings/email'
        
        const method = provider.id ? 'put' : 'post'
        const response = await $api[method]<EmailProviderConfig>(endpoint, provider)
        
        if (this.settings) {
          if (provider.id) {
            const index = this.settings.emailProviders.findIndex(p => p.id === provider.id)
            if (index !== -1) {
              this.settings.emailProviders[index] = response.data
            }
          } else {
            this.settings.emailProviders.push(response.data)
          }
        }

        const { success } = useNotification()
        success('Email provider updated successfully')
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update email provider'
        console.error('Error updating email provider:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async deleteEmailProvider(providerId: string) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.delete(`/admin/settings/email/${providerId}`)
        
        if (this.settings) {
          this.settings.emailProviders = this.settings.emailProviders.filter(
            p => p.id !== providerId
          )
        }

        const { success } = useNotification()
        success('Email provider deleted successfully')
      } catch (error: any) {
        this.error = error.message || 'Failed to delete email provider'
        console.error('Error deleting email provider:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async testEmailProvider(providerId: string) {
      this.testing = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.post<{ success: boolean; message: string }>(
          `/admin/settings/email/${providerId}/test`
        )
        
        const { success, error: showError } = useNotification()
        if (response.data.success) {
          success(response.data.message || 'Email provider connection successful')
        } else {
          showError(response.data.message || 'Email provider connection failed')
        }
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to test email provider'
        console.error('Error testing email provider:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.testing = false
      }
    },

    async updatePaymentGateway(gateway: PaymentGatewayConfig) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const endpoint = gateway.id 
          ? `/admin/settings/payment/${gateway.id}`
          : '/admin/settings/payment'
        
        const method = gateway.id ? 'put' : 'post'
        const response = await $api[method]<PaymentGatewayConfig>(endpoint, gateway)
        
        if (this.settings) {
          if (gateway.id) {
            const index = this.settings.paymentGateways.findIndex(g => g.id === gateway.id)
            if (index !== -1) {
              this.settings.paymentGateways[index] = response.data
            }
          } else {
            this.settings.paymentGateways.push(response.data)
          }
        }

        const { success } = useNotification()
        success('Payment gateway updated successfully')
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update payment gateway'
        console.error('Error updating payment gateway:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async deletePaymentGateway(gatewayId: string) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.delete(`/admin/settings/payment/${gatewayId}`)
        
        if (this.settings) {
          this.settings.paymentGateways = this.settings.paymentGateways.filter(
            g => g.id !== gatewayId
          )
        }

        const { success } = useNotification()
        success('Payment gateway deleted successfully')
      } catch (error: any) {
        this.error = error.message || 'Failed to delete payment gateway'
        console.error('Error deleting payment gateway:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async testPaymentGateway(gatewayId: string) {
      this.testing = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.post<{ success: boolean; message: string }>(
          `/admin/settings/payment/${gatewayId}/test`
        )
        
        const { success, error: showError } = useNotification()
        if (response.data.success) {
          success(response.data.message || 'Payment gateway connection successful')
        } else {
          showError(response.data.message || 'Payment gateway connection failed')
        }
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to test payment gateway'
        console.error('Error testing payment gateway:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.testing = false
      }
    },

    async updateStorageConfig(storage: StorageConfig) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const endpoint = storage.id 
          ? `/admin/settings/storage/${storage.id}`
          : '/admin/settings/storage'
        
        const method = storage.id ? 'put' : 'post'
        const response = await $api[method]<StorageConfig>(endpoint, storage)
        
        if (this.settings) {
          if (storage.id) {
            const index = this.settings.storage.findIndex(s => s.id === storage.id)
            if (index !== -1) {
              this.settings.storage[index] = response.data
            }
          } else {
            this.settings.storage.push(response.data)
          }
        }

        const { success } = useNotification()
        success('Storage configuration updated successfully')
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to update storage configuration'
        console.error('Error updating storage configuration:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async deleteStorageConfig(storageId: string) {
      this.saving = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.delete(`/admin/settings/storage/${storageId}`)
        
        if (this.settings) {
          this.settings.storage = this.settings.storage.filter(
            s => s.id !== storageId
          )
        }

        const { success } = useNotification()
        success('Storage configuration deleted successfully')
      } catch (error: any) {
        this.error = error.message || 'Failed to delete storage configuration'
        console.error('Error deleting storage configuration:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.saving = false
      }
    },

    async testStorageConnection(storageId: string) {
      this.testing = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.post<{ success: boolean; message: string }>(
          `/admin/settings/storage/${storageId}/test`
        )
        
        const { success, error: showError } = useNotification()
        if (response.data.success) {
          success(response.data.message || 'Storage connection successful')
        } else {
          showError(response.data.message || 'Storage connection failed')
        }
        
        return response.data
      } catch (error: any) {
        this.error = error.message || 'Failed to test storage connection'
        console.error('Error testing storage connection:', error)
        
        const { error: showError } = useNotification()
        showError(this.error || 'An error occurred')
        throw error
      } finally {
        this.testing = false
      }
    },

    async fetchStorageUsage(storageId: string) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get<StorageConfig['usage']>(
          `/admin/settings/storage/${storageId}/usage`
        )
        
        if (this.settings) {
          const storage = this.settings.storage.find(s => s.id === storageId)
          if (storage && response.data) {
            storage.usage = response.data
          }
        }
        
        return response.data
      } catch (error: any) {
        console.error('Error fetching storage usage:', error)
        throw error
      }
    },

    clearError() {
      this.error = null
    },

    resetState() {
      this.settings = null
      this.loading = false
      this.saving = false
      this.testing = false
      this.error = null
      this.lastFetched = null
    },
  },
})
