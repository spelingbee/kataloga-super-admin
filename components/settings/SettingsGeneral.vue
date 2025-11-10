<template>
  <div class="settings-general">
    <div class="settings-general__header">
      <h2 class="settings-general__title">General Settings</h2>
      <p class="settings-general__description">
        Configure basic platform settings and feature flags
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="settings-general__form">
      <!-- Platform Information -->
      <div class="form-section">
        <h3 class="form-section__title">Platform Information</h3>
        
        <div class="form-group">
          <label for="platformName" class="form-group__label">
            Platform Name <span class="required">*</span>
          </label>
          <input
            id="platformName"
            v-model="formData.platformName"
            type="text"
            class="form-group__input"
            required
          />
        </div>

        <div class="form-group">
          <label for="platformDescription" class="form-group__label">
            Platform Description
          </label>
          <textarea
            id="platformDescription"
            v-model="formData.platformDescription"
            class="form-group__textarea"
            rows="3"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="supportEmail" class="form-group__label">
              Support Email <span class="required">*</span>
            </label>
            <input
              id="supportEmail"
              v-model="formData.supportEmail"
              type="email"
              class="form-group__input"
              required
            />
          </div>

          <div class="form-group">
            <label for="supportPhone" class="form-group__label">
              Support Phone
            </label>
            <input
              id="supportPhone"
              v-model="formData.supportPhone"
              type="tel"
              class="form-group__input"
            />
          </div>
        </div>
      </div>

      <!-- Default Settings -->
      <div class="form-section">
        <h3 class="form-section__title">Default Settings</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="defaultTimezone" class="form-group__label">
              Default Timezone <span class="required">*</span>
            </label>
            <select
              id="defaultTimezone"
              v-model="formData.defaultTimezone"
              class="form-group__select"
              required
            >
              <option value="">Select timezone</option>
              <option v-for="tz in timezones" :key="tz" :value="tz">
                {{ tz }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="defaultCurrency" class="form-group__label">
              Default Currency <span class="required">*</span>
            </label>
            <select
              id="defaultCurrency"
              v-model="formData.defaultCurrency"
              class="form-group__select"
              required
            >
              <option value="">Select currency</option>
              <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                {{ curr.code }} - {{ curr.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="defaultLanguage" class="form-group__label">
              Default Language <span class="required">*</span>
            </label>
            <select
              id="defaultLanguage"
              v-model="formData.defaultLanguage"
              class="form-group__select"
              required
            >
              <option value="">Select language</option>
              <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                {{ lang.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- System Controls -->
      <div class="form-section">
        <h3 class="form-section__title">System Controls</h3>
        
        <div class="form-group">
          <label class="form-group__checkbox">
            <input
              v-model="formData.maintenanceMode"
              type="checkbox"
              class="form-group__checkbox-input"
            />
            <span class="form-group__checkbox-label">
              <strong>Maintenance Mode</strong>
              <span class="form-group__checkbox-description">
                Enable maintenance mode to prevent tenant access
              </span>
            </span>
          </label>
        </div>

        <div class="form-group">
          <label class="form-group__checkbox">
            <input
              v-model="formData.registrationEnabled"
              type="checkbox"
              class="form-group__checkbox-input"
            />
            <span class="form-group__checkbox-label">
              <strong>Registration Enabled</strong>
              <span class="form-group__checkbox-description">
                Allow new tenant registrations
              </span>
            </span>
          </label>
        </div>
      </div>

      <!-- Feature Flags -->
      <div class="form-section">
        <h3 class="form-section__title">Feature Flags</h3>
        <p class="form-section__description">
          Enable or disable platform features
        </p>
        
        <div class="feature-flags">
          <div
            v-for="(value, key) in formData.featureFlags"
            :key="key"
            class="feature-flag"
          >
            <label class="form-group__checkbox">
              <input
                v-model="formData.featureFlags[key]"
                type="checkbox"
                class="form-group__checkbox-input"
              />
              <span class="form-group__checkbox-label">
                <strong>{{ formatFeatureName(key) }}</strong>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button
          type="button"
          @click="handleCancel"
          class="btn btn--secondary"
          :disabled="saving"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn--primary"
          :disabled="saving || !hasChanges"
        >
          <span v-if="saving">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import type { GeneralSettings } from '~/types'

const settingsStore = useSettingsStore()

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
]

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
]

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
]

const formData = ref<GeneralSettings>({
  platformName: '',
  platformDescription: '',
  supportEmail: '',
  supportPhone: '',
  defaultTimezone: 'UTC',
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  maintenanceMode: false,
  registrationEnabled: true,
  featureFlags: {
    enableAnalytics: true,
    enableEmailNotifications: true,
    enableTelegramBot: false,
    enableAdvancedReporting: true,
    enableMultiLanguage: false,
  },
})

const originalData = ref<string>('')
const saving = computed(() => settingsStore.saving)

const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== originalData.value
})

const loadSettings = () => {
  const settings = settingsStore.generalSettings
  if (settings) {
    formData.value = { ...settings }
    originalData.value = JSON.stringify(settings)
  }
}

const handleSubmit = async () => {
  try {
    await settingsStore.updateGeneralSettings(formData.value)
    originalData.value = JSON.stringify(formData.value)
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

const handleCancel = () => {
  loadSettings()
}

const formatFeatureName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

watch(
  () => settingsStore.generalSettings,
  () => {
    loadSettings()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.settings-general {
  max-width: 800px;
}

.settings-general__header {
  margin-bottom: $spacing-xl;
}

.settings-general__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
}

.settings-general__description {
  margin-top: $spacing-xs;
  color: $text-secondary;
  font-size: 0.875rem;
}

.settings-general__form {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.form-section {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.form-section__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.form-section__description {
  color: $text-secondary;
  font-size: 0.875rem;
  margin-bottom: $spacing-md;
}

.form-group {
  margin-bottom: $spacing-lg;
  
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
.form-group__textarea,
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

.form-group__textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.feature-flags {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $spacing-md;
}

.feature-flag {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.btn {
  padding: $spacing-sm $spacing-lg;
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

@media (max-width: $breakpoint-md) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .feature-flags {
    grid-template-columns: 1fr;
  }
}
</style>
