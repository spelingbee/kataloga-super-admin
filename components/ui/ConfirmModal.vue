<template>
  <div v-if="modelValue" class="confirm-modal-overlay" @click.self="handleCancel">
    <div class="confirm-modal">
      <div class="confirm-modal__header">
        <h3 class="confirm-modal__title">{{ title }}</h3>
        <button
          class="confirm-modal__close"
          @click="handleCancel"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div class="confirm-modal__body">
        <p class="confirm-modal__message">{{ message }}</p>
      </div>

      <div class="confirm-modal__footer">
        <button
          class="confirm-modal__button confirm-modal__button--cancel"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          :class="[
            'confirm-modal__button',
            'confirm-modal__button--confirm',
            `confirm-modal__button--${type}`
          ]"
          :disabled="loading"
          @click="handleConfirm"
        >
          {{ loading ? 'Processing...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger' | 'success'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'info',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-lg;
}

.confirm-modal {
  background: white;
  border-radius: $radius-lg;
  max-width: 500px;
  width: 100%;
  box-shadow: $shadow-lg;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.confirm-modal__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.confirm-modal__close {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: $text-secondary;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
}

.confirm-modal__body {
  padding: $spacing-lg;
}

.confirm-modal__message {
  font-size: 1rem;
  color: $text-secondary;
  line-height: 1.5;
  margin: 0;
}

.confirm-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

.confirm-modal__button {
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

.confirm-modal__button--cancel {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: darken($bg-secondary, 5%);
  }
}

.confirm-modal__button--confirm {
  color: white;
}

.confirm-modal__button--info {
  background: $info-color;

  &:hover:not(:disabled) {
    background: darken($info-color, 10%);
  }
}

.confirm-modal__button--warning {
  background: $warning-color;

  &:hover:not(:disabled) {
    background: darken($warning-color, 10%);
  }
}

.confirm-modal__button--danger {
  background: $error-color;

  &:hover:not(:disabled) {
    background: darken($error-color, 10%);
  }
}

.confirm-modal__button--success {
  background: $success-color;

  &:hover:not(:disabled) {
    background: darken($success-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .confirm-modal-overlay {
    padding: $spacing-md;
  }

  .confirm-modal__footer {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}
</style>
