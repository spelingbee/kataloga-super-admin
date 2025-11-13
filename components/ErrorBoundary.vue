<template>
  <div v-if="error" class="error-boundary">
    <div class="error-boundary__content">
      <div class="error-boundary__icon">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h3 class="error-boundary__title">Something went wrong</h3>
      <p class="error-boundary__message">{{ errorMessage }}</p>
      
      <div v-if="showDetails && isDevelopment" class="error-boundary__details">
        <details>
          <summary>Error Details</summary>
          <pre>{{ error }}</pre>
        </details>
      </div>
      
      <div class="error-boundary__actions">
        <button class="error-boundary__btn error-boundary__btn--primary" @click="retry">
          Try Again
        </button>
        <button v-if="onReset" class="error-boundary__btn error-boundary__btn--secondary" @click="reset">
          Reset
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
interface Props {
  onReset?: () => void
  fallbackMessage?: string
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fallbackMessage: 'An unexpected error occurred. Please try again.',
  showDetails: true,
})

const error = ref<Error | null>(null)
const isDevelopment = process.env.NODE_ENV === 'development'

const errorMessage = computed(() => {
  if (!error.value) return props.fallbackMessage
  return error.value.message || props.fallbackMessage
})

const retry = () => {
  error.value = null
  window.location.reload()
}

const reset = () => {
  error.value = null
  if (props.onReset) {
    props.onReset()
  }
}

// Catch errors in child components
onErrorCaptured((err: Error) => {
  error.value = err
  console.error('Error caught by boundary:', err)
  
  // Report error
  if (import.meta.client) {
    useErrorReporting().reportError(err, {
      component: 'ErrorBoundary',
      context: 'Component Error',
    })
  }
  
  // Prevent error from propagating
  return false
})

// Handle unhandled promise rejections
if (import.meta.client) {
  window.addEventListener('unhandledrejection', (event) => {
    error.value = new Error(event.reason?.message || 'Unhandled promise rejection')
    console.error('Unhandled rejection:', event.reason)
    
    useErrorReporting().reportError(event.reason, {
      component: 'ErrorBoundary',
      context: 'Unhandled Rejection',
    })
  })
}
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.error-boundary {
  padding: $spacing-xl;
  background: $bg-secondary;
  border-radius: $radius-lg;
  margin: $spacing-lg;
}

.error-boundary__content {
  max-width: 32rem;
  margin: 0 auto;
  text-align: center;
}

.error-boundary__icon {
  margin: 0 auto $spacing-lg;
  height: 4rem;
  width: 4rem;
  color: $warning-color;
}

.error-boundary__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.error-boundary__message {
  color: $text-secondary;
  margin-bottom: $spacing-lg;
}

.error-boundary__details {
  margin-bottom: $spacing-lg;
  text-align: left;
  
  details {
    background: white;
    border: 1px solid $border-color;
    border-radius: $radius-md;
    padding: $spacing-sm;
    
    summary {
      cursor: pointer;
      font-weight: 500;
      color: $text-primary;
      padding: $spacing-xs;
      
      &:hover {
        color: $primary-color;
      }
    }
    
    pre {
      margin-top: $spacing-sm;
      padding: $spacing-sm;
      background: $bg-dark;
      color: white;
      border-radius: $radius-sm;
      font-size: 0.75rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}

.error-boundary__actions {
  display: flex;
  gap: $spacing-sm;
  justify-content: center;
}

.error-boundary__btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
  border: none;
}

.error-boundary__btn--primary {
  background: $primary-color;
  color: white;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

.error-boundary__btn--secondary {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: $bg-secondary;
  }
}
</style>
