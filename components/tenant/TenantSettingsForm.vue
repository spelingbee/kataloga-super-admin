<template>
  <div class="tenant-settings-form">
    <form @submit.prevent="handleSubmit">
      <div class="tenant-settings-form__section">
        <h3 class="tenant-settings-form__section-title">Regional Settings</h3>
        
        <div class="tenant-settings-form__field">
          <label class="tenant-settings-form__label" for="timezone">
            Timezone
          </label>
          <select
            id="timezone"
            v-model="formData.timezone"
            class="tenant-settings-form__input"
            required
          >
            <option value="">Select timezone</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New York (EST)</option>
            <option value="America/Chicago">America/Chicago (CST)</option>
            <option value="America/Denver">America/Denver (MST)</option>
            <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
          </select>
          <span v-if="errors.timezone" class="tenant-settings-form__error">
            {{ errors.timezone }}
          </span>
        </div>

        <div class="tenant-settings-form__field">
          <label class="tenant-settings-form__label" for="currency">
            Currency
          </label>
          <select
            id="currency"
            v-model="formData.currency"
            class="tenant-settings-form__input"
            required
          >
            <option value="">Select currency</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CNY">CNY - Chinese Yuan</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CAD">CAD - Canadian Dollar</option>
          </select>
          <span v-if="errors.currency" class="tenant-settings-form__error">
            {{ errors.currency }}
          </span>
        </div>

        <div class="tenant-settings-form__field">
          <label class="tenant-settings-form__label" for="language">
            Language
          </label>
          <select
            id="language"
            v-model="formData.language"
            class="tenant-settings-form__input"
            required
          >
            <option value="">Select language</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
          <span v-if="errors.language" class="tenant-settings-form__error">
            {{ errors.language }}
          </span>
        </div>
      </div>

      <div class="tenant-settings-form__actions">
        <button
          type="button"
          class="tenant-settings-form__btn tenant-settings-form__btn--cancel"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="tenant-settings-form__btn tenant-settings-form__btn--submit"
          :disabled="loading || !hasChanges"
        >
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TenantSettings } from '~/types'

interface Props {
  settings: TenantSettings
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  submit: [settings: Partial<TenantSettings>]
  cancel: []
}>()

const formData = ref<TenantSettings>({
  timezone: props.settings.timezone || '',
  currency: props.settings.currency || '',
  language: props.settings.language || '',
})

const errors = ref<Record<string, string>>({})

const hasChanges = computed(() => {
  return (
    formData.value.timezone !== props.settings.timezone ||
    formData.value.currency !== props.settings.currency ||
    formData.value.language !== props.settings.language
  )
})

watch(() => props.settings, (newSettings) => {
  formData.value = {
    timezone: newSettings.timezone || '',
    currency: newSettings.currency || '',
    language: newSettings.language || '',
  }
}, { deep: true })

function validateForm(): boolean {
  errors.value = {}
  let isValid = true

  if (!formData.value.timezone) {
    errors.value.timezone = 'Timezone is required'
    isValid = false
  }

  if (!formData.value.currency) {
    errors.value.currency = 'Currency is required'
    isValid = false
  }

  if (!formData.value.language) {
    errors.value.language = 'Language is required'
    isValid = false
  }

  return isValid
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }

  const changes: Partial<TenantSettings> = {}
  
  if (formData.value.timezone !== props.settings.timezone) {
    changes.timezone = formData.value.timezone
  }
  if (formData.value.currency !== props.settings.currency) {
    changes.currency = formData.value.currency
  }
  if (formData.value.language !== props.settings.language) {
    changes.language = formData.value.language
  }

  emit('submit', changes)
}

function handleCancel() {
  formData.value = {
    timezone: props.settings.timezone || '',
    currency: props.settings.currency || '',
    language: props.settings.language || '',
  }
  errors.value = {}
  emit('cancel')
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.tenant-settings-form {
  background: white;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.tenant-settings-form__section {
  margin-bottom: $spacing-xl;
}

.tenant-settings-form__section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-lg 0;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.tenant-settings-form__field {
  margin-bottom: $spacing-lg;
}

.tenant-settings-form__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.tenant-settings-form__input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  color: $text-primary;
  background: white;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }

  &:disabled {
    background: $bg-secondary;
    cursor: not-allowed;
  }
}

.tenant-settings-form__error {
  display: block;
  font-size: 0.75rem;
  color: $error-color;
  margin-top: $spacing-xs;
}

.tenant-settings-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.tenant-settings-form__btn {
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.tenant-settings-form__btn--cancel {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }
}

.tenant-settings-form__btn--submit {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .tenant-settings-form {
    padding: $spacing-md;
  }

  .tenant-settings-form__actions {
    flex-direction: column-reverse;
  }

  .tenant-settings-form__btn {
    width: 100%;
  }
}
</style>
