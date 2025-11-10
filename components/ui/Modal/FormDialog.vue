<template>
  <Modal
    v-model="isOpen"
    :title="title"
    :size="size"
    :closable="closable"
  >
    <form @submit.prevent="handleSubmit">
      <slot></slot>
    </form>

    <template #footer>
      <slot name="footer">
        <button
          type="button"
          class="form-dialog__btn form-dialog__btn--cancel"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          class="form-dialog__btn form-dialog__btn--submit"
          :disabled="loading"
          @click="handleSubmit"
        >
          <span v-if="loading" class="form-dialog__spinner"></span>
          {{ loading ? loadingText : submitText }}
        </button>
      </slot>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from './Modal.vue'

interface Props {
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
  submitText?: string
  cancelText?: string
  loadingText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  submitText: 'Submit',
  cancelText: 'Cancel',
  loadingText: 'Submitting...',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: []
  cancel: []
}>()

const isOpen = ref(props.modelValue)

watch(() => props.modelValue, (value) => {
  isOpen.value = value
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function handleSubmit() {
  emit('submit')
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use './base';
@use './form-dialog';
</style>
