<template>
  <Modal
    v-model="isOpen"
    :title="title"
    size="sm"
    :closable="false"
    :close-on-overlay="false"
  >
    <div class="confirm-dialog">
      <div v-if="icon" class="confirm-dialog__icon" :class="`confirm-dialog__icon--${type}`">
        <span v-if="type === 'danger'">⚠</span>
        <span v-else-if="type === 'warning'">⚠</span>
        <span v-else-if="type === 'info'">ℹ</span>
        <span v-else>?</span>
      </div>
      <p class="confirm-dialog__message">{{ message }}</p>
    </div>

    <template #footer>
      <button
        class="confirm-dialog__btn confirm-dialog__btn--cancel"
        @click="handleCancel"
      >
        {{ cancelText }}
      </button>
      <button
        :class="[
          'confirm-dialog__btn',
          `confirm-dialog__btn--${type}`,
        ]"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from './Modal.vue'

interface Props {
  modelValue: boolean
  title?: string
  message: string
  type?: 'danger' | 'warning' | 'info' | 'default'
  icon?: boolean
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  type: 'default',
  icon: true,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const isOpen = ref(props.modelValue)

watch(() => props.modelValue, (value) => {
  isOpen.value = value
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function handleConfirm() {
  emit('confirm')
  isOpen.value = false
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use './base';
@use './confirm-dialog';
</style>
