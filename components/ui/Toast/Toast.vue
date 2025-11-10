<template>
  <transition name="toast">
    <div
      v-if="visible"
      :class="[
        'toast',
        `toast--${type}`,
      ]"
      role="alert"
    >
      <div class="toast__icon">
        <span v-if="type === 'success'">✓</span>
        <span v-else-if="type === 'error'">✕</span>
        <span v-else-if="type === 'warning'">⚠</span>
        <span v-else>ℹ</span>
      </div>
      <div class="toast__content">
        <p v-if="title" class="toast__title">{{ title }}</p>
        <p class="toast__message">{{ message }}</p>
      </div>
      <button
        v-if="action"
        class="toast__action"
        @click="handleAction"
      >
        {{ action.label }}
      </button>
      <button
        class="toast__close"
        @click="close"
      >
        ✕
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Action {
  label: string
  handler: () => void
}

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  action?: Action
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000,
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(false)
let timeoutId: NodeJS.Timeout | null = null

onMounted(() => {
  visible.value = true
  
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
})

function close() {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  setTimeout(() => {
    emit('close')
  }, 300) // Wait for animation
}

function handleAction() {
  if (props.action) {
    props.action.handler()
    close()
  }
}
</script>

<style scoped lang="scss">
@use './toast';
</style>
