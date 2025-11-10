<template>
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="modelValue"
        class="modal-overlay"
        role="presentation"
        @click="handleOverlayClick"
        @keydown.esc="closable && close()"
      >
        <div
          :id="modalId"
          ref="modalRef"
          :class="[
            'modal',
            `modal--${size}`,
          ]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? `${modalId}-title` : undefined"
          :aria-describedby="description ? `${modalId}-description` : undefined"
          tabindex="-1"
          @click.stop
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="modal__header">
            <slot name="header">
              <h3 
                :id="`${modalId}-title`"
                class="modal__title"
              >
                {{ title }}
              </h3>
            </slot>
            <button
              v-if="closable"
              type="button"
              class="modal__close"
              aria-label="Close dialog"
              @click="close"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <!-- Body -->
          <div 
            class="modal__body"
            :id="description ? `${modalId}-description` : undefined"
          >
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal__footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { watch, ref, nextTick, onMounted } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnOverlay: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const modalRef = ref<HTMLElement>()
const modalId = ref(`modal-${Math.random().toString(36).substr(2, 9)}`)
const previouslyFocusedElement = ref<HTMLElement | null>(null)

const accessibility = useAccessibility()
let focusTrap: ReturnType<typeof accessibility.createFocusTrap> | null = null

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    close()
  }
}

// Manage focus trap and accessibility
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    // Store previously focused element
    previouslyFocusedElement.value = document.activeElement as HTMLElement
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    
    // Wait for modal to render
    await nextTick()
    
    // Create and activate focus trap
    if (modalRef.value) {
      focusTrap = accessibility.createFocusTrap(modalRef.value, {
        returnFocus: true
      })
      focusTrap.activate()
      
      // Focus the modal
      modalRef.value.focus()
    }
    
    // Announce to screen readers
    accessibility.announce(`${props.title || 'Dialog'} opened`, 'polite')
  } else {
    // Deactivate focus trap
    if (focusTrap) {
      focusTrap.deactivate()
      focusTrap = null
    }
    
    // Restore body scroll
    document.body.style.overflow = ''
    
    // Announce to screen readers
    accessibility.announce('Dialog closed', 'polite')
  }
})
</script>

<style scoped lang="scss">
@use './base';
@use './modal';
</style>
