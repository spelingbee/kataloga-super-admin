<template>
  <Modal
    v-model="isOpen"
    title="Impersonate Tenant"
    size="md"
  >
    <div class="impersonation-modal">
      <div class="impersonation-modal__warning">
        <div class="impersonation-modal__warning-icon">⚠</div>
        <div class="impersonation-modal__warning-content">
          <h4 class="impersonation-modal__warning-title">Security Warning</h4>
          <p class="impersonation-modal__warning-text">
            You are about to impersonate <strong>{{ tenantName }}</strong>. 
            This will give you full access to their account and data.
          </p>
        </div>
      </div>

      <div class="impersonation-modal__info">
        <h4 class="impersonation-modal__info-title">Important Information</h4>
        <ul class="impersonation-modal__info-list">
          <li>All actions performed will be logged in the audit trail</li>
          <li>The tenant will not be notified of this session</li>
          <li>The session will open in a new browser tab</li>
          <li>You can end the session at any time by logging out</li>
          <li>Use this feature responsibly and only for support purposes</li>
        </ul>
      </div>

      <div class="impersonation-modal__reason">
        <label class="impersonation-modal__label" for="reason">
          Reason for Impersonation (Optional)
        </label>
        <textarea
          id="reason"
          v-model="reason"
          class="impersonation-modal__textarea"
          placeholder="e.g., Troubleshooting reported issue with order processing..."
          rows="3"
        />
        <span class="impersonation-modal__hint">
          This will be recorded in the audit log
        </span>
      </div>
    </div>

    <template #footer>
      <button
        class="impersonation-modal__btn impersonation-modal__btn--cancel"
        :disabled="loading"
        @click="handleCancel"
      >
        Cancel
      </button>
      <button
        class="impersonation-modal__btn impersonation-modal__btn--confirm"
        :disabled="loading"
        @click="handleConfirm"
      >
        {{ loading ? 'Starting Session...' : 'Start Impersonation' }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '~/components/ui/Modal/Modal.vue'

interface Props {
  modelValue: boolean
  tenantName: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [reason: string]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const reason = ref('')

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (!value) {
    reason.value = ''
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function handleConfirm() {
  emit('confirm', reason.value)
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.impersonation-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.impersonation-modal__warning {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: lighten($warning-color, 45%);
  border: 1px solid lighten($warning-color, 30%);
  border-radius: $radius-md;
}

.impersonation-modal__warning-icon {
  font-size: 1.5rem;
  color: $warning-color;
  flex-shrink: 0;
}

.impersonation-modal__warning-content {
  flex: 1;
}

.impersonation-modal__warning-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: darken($warning-color, 10%);
  margin: 0 0 $spacing-xs 0;
}

.impersonation-modal__warning-text {
  font-size: 0.875rem;
  color: darken($warning-color, 15%);
  margin: 0;
  line-height: 1.5;

  strong {
    font-weight: 600;
  }
}

.impersonation-modal__info {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.impersonation-modal__info-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-sm 0;
}

.impersonation-modal__info-list {
  margin: 0;
  padding-left: $spacing-lg;
  font-size: 0.875rem;
  color: $text-secondary;
  line-height: 1.6;

  li {
    margin-bottom: $spacing-xs;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.impersonation-modal__reason {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.impersonation-modal__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
}

.impersonation-modal__textarea {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  color: $text-primary;
  font-family: inherit;
  resize: vertical;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }

  &::placeholder {
    color: $text-light;
  }
}

.impersonation-modal__hint {
  font-size: 0.75rem;
  color: $text-secondary;
}

.impersonation-modal__btn {
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

.impersonation-modal__btn--cancel {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }
}

.impersonation-modal__btn--confirm {
  background: $info-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($info-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .impersonation-modal__warning {
    flex-direction: column;
    text-align: center;
  }

  .impersonation-modal__warning-icon {
    font-size: 2rem;
  }
}
</style>
