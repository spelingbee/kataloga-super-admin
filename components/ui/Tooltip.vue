<template>
  <div class="tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
    <slot />
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="isVisible"
          ref="tooltipRef"
          :class="['tooltip', `tooltip--${position}`, { 'tooltip--wide': wide }]"
          :style="tooltipStyle"
          role="tooltip"
          :aria-hidden="!isVisible"
        >
          <div class="tooltip__content">
            <slot name="content">{{ content }}</slot>
          </div>
          <div class="tooltip__arrow" :style="arrowStyle"></div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

interface Props {
  content?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  wide?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  delay: 200,
  wide: false,
  disabled: false
})

const isVisible = ref(false)
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipStyle = ref({})
const arrowStyle = ref({})
let showTimeout: NodeJS.Timeout | null = null

const show = async () => {
  if (props.disabled) return
  
  if (showTimeout) clearTimeout(showTimeout)
  
  showTimeout = setTimeout(async () => {
    isVisible.value = true
    await nextTick()
    calculatePosition()
  }, props.delay)
}

const hide = () => {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }
  isVisible.value = false
}

const calculatePosition = () => {
  if (!tooltipRef.value) return
  
  const trigger = tooltipRef.value.parentElement
  if (!trigger) return
  
  const triggerRect = trigger.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  
  const spacing = 8
  let top = 0
  let left = 0
  
  switch (props.position) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - spacing
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'bottom':
      top = triggerRect.bottom + spacing
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.left - tooltipRect.width - spacing
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.right + spacing
      break
  }
  
  // Keep tooltip within viewport
  const padding = 8
  if (left < padding) left = padding
  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding
  }
  if (top < padding) top = padding
  if (top + tooltipRect.height > window.innerHeight - padding) {
    top = window.innerHeight - tooltipRect.height - padding
  }
  
  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.tooltip-wrapper {
  display: inline-block;
  position: relative;
}

.tooltip {
  position: fixed;
  z-index: 9999;
  padding: $spacing-sm $spacing-md;
  background: $bg-dark;
  color: #ffffff;
  border-radius: $radius-md;
  font-size: 0.875rem;
  line-height: 1.4;
  max-width: 250px;
  box-shadow: $shadow-lg;
  pointer-events: none;
}

.tooltip--wide {
  max-width: 400px;
}

.tooltip__content {
  position: relative;
  z-index: 1;
}

.tooltip__arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: $bg-dark;
  transform: rotate(45deg);
  z-index: 0;
}

.tooltip--top .tooltip__arrow {
  bottom: -4px;
  left: 50%;
  margin-left: -4px;
}

.tooltip--bottom .tooltip__arrow {
  top: -4px;
  left: 50%;
  margin-left: -4px;
}

.tooltip--left .tooltip__arrow {
  right: -4px;
  top: 50%;
  margin-top: -4px;
}

.tooltip--right .tooltip__arrow {
  left: -4px;
  top: 50%;
  margin-top: -4px;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity $transition-fast;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
