<template>
  <Modal :show="show" @close="handleClose" size="medium">
    <template #header>
      <h2 class="block-ip-modal__title">Block IP Address</h2>
    </template>

    <template #body>
      <form @submit.prevent="handleSubmit" class="block-ip-modal__form">
        <FormInput
          v-model="formData.ipAddress"
          label="IP Address"
          placeholder="Enter IP address (e.g., 192.168.1.1)"
          required
          :error="errors.ipAddress"
        />

        <FormTextarea
          v-model="formData.reason"
          label="Reason"
          placeholder="Enter reason for blocking this IP..."
          rows="3"
          required
          :error="errors.reason"
        />

        <div class="block-ip-modal__checkbox">
          <input
            type="checkbox"
            id="isPermanent"
            v-model="formData.isPermanent"
          />
          <label for="isPermanent">Block permanently</label>
        </div>

        <FormInput
          v-if="!formData.isPermanent"
          v-model="formData.expiresAt"
          label="Expires At"
          type="datetime-local"
          :error="errors.expiresAt"
        />

        <div v-if="error" class="block-ip-modal__error">
          <AppIcon name="alert-circle" />
          <span>{{ error }}</span>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="block-ip-modal__footer">
        <button
          type="button"
          @click="handleClose"
          class="block-ip-modal__cancel-btn"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          class="block-ip-modal__submit-btn"
          :disabled="loading"
        >
          {{ loading ? 'Blocking...' : 'Block IP' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useSecurityStore } from '~/stores/security'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'blocked'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const securityStore = useSecurityStore()
const { showSuccess, showError } = useNotification()

const formData = reactive({
  ipAddress: '',
  reason: '',
  isPermanent: false,
  expiresAt: '',
})

const errors = reactive({
  ipAddress: '',
  reason: '',
  expiresAt: '',
})

const loading = ref(false)
const error = ref('')

watch(() => props.show, (newValue) => {
  if (newValue) {
    resetForm()
  }
})

function resetForm(): void {
  formData.ipAddress = ''
  formData.reason = ''
  formData.isPermanent = false
  formData.expiresAt = ''
  errors.ipAddress = ''
  errors.reason = ''
  errors.expiresAt = ''
  error.value = ''
}

function validateForm(): boolean {
  let isValid = true

  // Reset errors
  errors.ipAddress = ''
  errors.reason = ''
  errors.expiresAt = ''

  // Validate IP address
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!formData.ipAddress) {
    errors.ipAddress = 'IP address is required'
    isValid = false
  } else if (!ipRegex.test(formData.ipAddress)) {
    errors.ipAddress = 'Invalid IP address format'
    isValid = false
  }

  // Validate reason
  if (!formData.reason || formData.reason.trim().length < 10) {
    errors.reason = 'Reason must be at least 10 characters'
    isValid = false
  }

  // Validate expiration date if not permanent
  if (!formData.isPermanent && !formData.expiresAt) {
    errors.expiresAt = 'Expiration date is required for temporary blocks'
    isValid = false
  } else if (!formData.isPermanent && formData.expiresAt) {
    const expirationDate = new Date(formData.expiresAt)
    const now = new Date()
    if (expirationDate <= now) {
      errors.expiresAt = 'Expiration date must be in the future'
      isValid = false
    }
  }

  return isValid
}

async function handleSubmit(): Promise<void> {
  if (!validateForm()) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await securityStore.blockIP(
      formData.ipAddress,
      formData.reason,
      formData.isPermanent,
      formData.isPermanent ? undefined : formData.expiresAt
    )

    showSuccess(`IP ${formData.ipAddress} blocked successfully`)
    emit('blocked')
    handleClose()
  } catch (err: any) {
    error.value = err.message || 'Failed to block IP address'
    showError(error.value)
  } finally {
    loading.value = false
  }
}

function handleClose(): void {
  if (!loading.value) {
    emit('close')
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.block-ip-modal__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.block-ip-modal__form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.block-ip-modal__checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  label {
    font-size: 0.875rem;
    color: $text-primary;
    cursor: pointer;
  }
}

.block-ip-modal__error {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  color: $error-color;
  font-size: 0.875rem;
}

.block-ip-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}

.block-ip-modal__cancel-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: darken($bg-secondary, 3%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.block-ip-modal__submit-btn {
  padding: $spacing-sm $spacing-md;
  background: $error-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: darken($error-color, 10%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
