<template>
  <div 
    v-if="isOpen" 
    class="shortcuts-modal" 
    role="dialog"
    aria-modal="true"
    aria-labelledby="shortcuts-modal-title"
    @click.self="close"
  >
    <div 
      v-focus-trap="{ active: isOpen }"
      class="shortcuts-modal__content"
    >
      <div class="shortcuts-modal__header">
        <h2 id="shortcuts-modal-title" class="shortcuts-modal__title">Keyboard Shortcuts</h2>
        <button 
          class="shortcuts-modal__close"
          aria-label="Close keyboard shortcuts dialog"
          @click="close"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="shortcuts-modal__body">
        <div
          v-for="(shortcuts, category) in groupedShortcuts"
          :key="category"
          class="shortcuts-modal__category"
        >
          <h3 class="shortcuts-modal__category-title">{{ category }}</h3>
          <div class="shortcuts-modal__list">
            <div
              v-for="(shortcut, index) in shortcuts"
              :key="index"
              class="shortcuts-modal__item"
            >
              <span class="shortcuts-modal__description">{{ shortcut.description }}</span>
              <kbd class="shortcuts-modal__keys">{{ getDisplay(shortcut) }}</kbd>
            </div>
          </div>
        </div>
      </div>

      <div class="shortcuts-modal__footer">
        <p class="shortcuts-modal__hint">
          Press <kbd>?</kbd> to toggle this dialog
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false)
const keyboardShortcuts = useKeyboardShortcuts()

const groupedShortcuts = computed(() => keyboardShortcuts.getAllShortcuts())

const getDisplay = (shortcut: any) => {
  return keyboardShortcuts.getShortcutDisplay(shortcut)
}

const open = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const toggle = () => {
  isOpen.value = !isOpen.value
}

// Register shortcut to open this modal
onMounted(() => {
  keyboardShortcuts.register({
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    action: toggle,
    category: 'General',
  })
})

// Expose methods for parent components
defineExpose({
  open,
  close,
  toggle,
})
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.shortcuts-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: $spacing-lg;
}

.shortcuts-modal__content {
  background: white;
  border-radius: $radius-lg;
  max-width: 48rem;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-lg;
}

.shortcuts-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.shortcuts-modal__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.shortcuts-modal__close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: $text-secondary;
  cursor: pointer;
  border-radius: $radius-sm;
  transition: $transition-base;
  
  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.shortcuts-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
}

.shortcuts-modal__category {
  margin-bottom: $spacing-xl;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.shortcuts-modal__category-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: $spacing-md;
}

.shortcuts-modal__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.shortcuts-modal__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  
  &:hover {
    background: $bg-secondary;
  }
}

.shortcuts-modal__description {
  color: $text-primary;
  font-size: 0.875rem;
}

.shortcuts-modal__keys {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-family: monospace;
  font-size: 0.75rem;
  color: $text-primary;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.shortcuts-modal__footer {
  padding: $spacing-md $spacing-lg;
  border-top: 1px solid $border-color;
  background: $bg-secondary;
  border-bottom-left-radius: $radius-lg;
  border-bottom-right-radius: $radius-lg;
}

.shortcuts-modal__hint {
  text-align: center;
  color: $text-secondary;
  font-size: 0.875rem;
  margin: 0;
  
  kbd {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    background: white;
    border: 1px solid $border-color;
    border-radius: $radius-sm;
    font-family: monospace;
    font-size: 0.75rem;
    margin: 0 0.25rem;
  }
}
</style>
