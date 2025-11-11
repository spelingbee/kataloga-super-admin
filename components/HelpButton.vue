<template>
  <Tooltip :content="tooltip" position="left">
    <button
      class="help-button"
      :aria-label="ariaLabel"
      @click="handleClick"
    >
      <AppIcon name="help-circle" :size="size" />
    </button>
  </Tooltip>
</template>

<script setup lang="ts">
import { useOnboarding } from '~/composables/useOnboarding'

interface Props {
  tooltip?: string
  ariaLabel?: string
  size?: number
  docLink?: string
  tourId?: string
}

const props = withDefaults(defineProps<Props>(), {
  tooltip: 'Get help',
  ariaLabel: 'Get help',
  size: 20
})

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  if (props.docLink) {
    window.open(props.docLink, '_blank', 'noopener,noreferrer')
  } else if (props.tourId) {
    const { startTour } = useOnboarding()
    startTour(props.tourId)
  }
  emit('click')
}
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.help-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xs;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover {
    background: $bg-secondary;
    color: $primary-color;
  }
  
  &:focus-visible {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
  }
}
</style>
