<template>
  <Teleport to="body">
    <Transition name="onboarding-fade">
      <div v-if="isActive && currentStep" class="onboarding-overlay" @click="handleOverlayClick">
        <!-- Spotlight effect -->
        <div class="onboarding-spotlight" :style="spotlightStyle"/>

        <!-- Tour card -->
        <div
          ref="cardRef"
          class="onboarding-card"
          :style="cardStyle"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`onboarding-title-${currentStep.id}`"
          @click.stop
        >
          <!-- Progress bar -->
          <div class="onboarding-card__progress">
            <div class="onboarding-card__progress-bar" :style="{ width: `${progress}%` }"/>
          </div>

          <!-- Content -->
          <div class="onboarding-card__content">
            <h3 :id="`onboarding-title-${currentStep.id}`" class="onboarding-card__title">
              {{ currentStep.title }}
            </h3>
            <p class="onboarding-card__text">
              {{ currentStep.content }}
            </p>
          </div>

          <!-- Footer -->
          <div class="onboarding-card__footer">
            <div class="onboarding-card__step-info">
              Step {{ currentStepIndex + 1 }} of {{ currentTour?.steps.length }}
            </div>
            <div class="onboarding-card__actions">
              <button
                v-if="!isFirstStep"
                class="onboarding-card__button onboarding-card__button--secondary"
                aria-label="Previous step"
                @click="previousStep"
              >
                Previous
              </button>
              <button
                class="onboarding-card__button onboarding-card__button--text"
                aria-label="Skip tour"
                @click="skipTour"
              >
                Skip Tour
              </button>
              <button
                class="onboarding-card__button onboarding-card__button--primary"
                :aria-label="isLastStep ? 'Finish tour' : 'Next step'"
                @click="nextStep"
              >
                {{ isLastStep ? 'Finish' : 'Next' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useOnboarding } from '~/composables/useOnboarding'

const {
  isActive,
  currentTour,
  currentStep,
  currentStepIndex,
  isFirstStep,
  isLastStep,
  progress,
  nextStep,
  previousStep,
  skipTour
} = useOnboarding()

const cardRef = ref<HTMLElement | null>(null)
const spotlightStyle = ref({})
const cardStyle = ref({})

const handleOverlayClick = () => {
  // Allow clicking overlay to skip tour
  skipTour()
}

const calculatePositions = async () => {
  if (!currentStep.value) return

  await nextTick()

  const targetElement = document.querySelector(currentStep.value.target)
  if (!targetElement) {
    console.warn(`Target element "${currentStep.value.target}" not found`)
    return
  }

  const targetRect = targetElement.getBoundingClientRect()
  const padding = 8

  // Spotlight style
  spotlightStyle.value = {
    top: `${targetRect.top - padding}px`,
    left: `${targetRect.left - padding}px`,
    width: `${targetRect.width + padding * 2}px`,
    height: `${targetRect.height + padding * 2}px`
  }

  // Card position
  if (!cardRef.value) return

  const cardRect = cardRef.value.getBoundingClientRect()
  const spacing = 16
  let top = 0
  let left = 0

  const position = currentStep.value.position || 'bottom'

  switch (position) {
    case 'top':
      top = targetRect.top - cardRect.height - spacing
      left = targetRect.left + (targetRect.width - cardRect.width) / 2
      break
    case 'bottom':
      top = targetRect.bottom + spacing
      left = targetRect.left + (targetRect.width - cardRect.width) / 2
      break
    case 'left':
      top = targetRect.top + (targetRect.height - cardRect.height) / 2
      left = targetRect.left - cardRect.width - spacing
      break
    case 'right':
      top = targetRect.top + (targetRect.height - cardRect.height) / 2
      left = targetRect.right + spacing
      break
  }

  // Keep card within viewport
  const viewportPadding = 16
  if (left < viewportPadding) left = viewportPadding
  if (left + cardRect.width > window.innerWidth - viewportPadding) {
    left = window.innerWidth - cardRect.width - viewportPadding
  }
  if (top < viewportPadding) top = viewportPadding
  if (top + cardRect.height > window.innerHeight - viewportPadding) {
    top = window.innerHeight - cardRect.height - viewportPadding
  }

  cardStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  }

  // Scroll target into view if needed
  targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch([currentStep, isActive], () => {
  if (isActive.value && currentStep.value) {
    calculatePositions()
  }
})

onMounted(() => {
  window.addEventListener('resize', calculatePositions)
})

onUnmounted(() => {
  window.removeEventListener('resize', calculatePositions)
})
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
}

.onboarding-spotlight {
  position: fixed;
  border-radius: $radius-md;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  transition: all $transition-base;
  z-index: 10001;
}

.onboarding-card {
  position: fixed;
  z-index: 10002;
  width: 400px;
  max-width: calc(100vw - 32px);
  background: $bg-primary;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  overflow: hidden;
  transition: all $transition-base;
}

.onboarding-card__progress {
  height: 4px;
  background: $bg-secondary;
}

.onboarding-card__progress-bar {
  height: 100%;
  background: $primary-color;
  transition: width $transition-base;
}

.onboarding-card__content {
  padding: $spacing-lg;
}

.onboarding-card__title {
  margin: 0 0 $spacing-md 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
}

.onboarding-card__text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: $text-secondary;
}

.onboarding-card__footer {
  padding: $spacing-md $spacing-lg;
  background: $bg-secondary;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
}

.onboarding-card__step-info {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 500;
}

.onboarding-card__actions {
  display: flex;
  gap: $spacing-sm;
}

.onboarding-card__button {
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:focus-visible {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
  }
}

.onboarding-card__button--primary {
  background: $primary-color;
  color: #ffffff;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

.onboarding-card__button--secondary {
  background: $bg-primary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: $bg-secondary;
  }
}

.onboarding-card__button--text {
  background: transparent;
  color: $text-secondary;
  
  &:hover {
    color: $text-primary;
    background: rgba(0, 0, 0, 0.05);
  }
}

.onboarding-fade-enter-active,
.onboarding-fade-leave-active {
  transition: opacity $transition-base;
}

.onboarding-fade-enter-from,
.onboarding-fade-leave-to {
  opacity: 0;
}

@media (max-width: $breakpoint-md) {
  .onboarding-card {
    width: calc(100vw - 32px);
    bottom: 16px;
    left: 16px !important;
    top: auto !important;
  }
  
  .onboarding-card__footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .onboarding-card__actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
