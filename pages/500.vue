<template>
  <div class="error-page">
    <div class="error-page__content">
      <div class="error-page__icon error-page__icon--server-error">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 class="error-page__code">500</h1>
      <h2 class="error-page__title">Internal Server Error</h2>
      <p class="error-page__message">
        Something went wrong on our end. We're working to fix the issue. Please try again later.
      </p>

      <div v-if="errorDetails" class="error-page__details">
        <button
          class="error-page__details-toggle"
          @click="showDetails = !showDetails"
        >
          {{ showDetails ? 'Hide' : 'Show' }} Error Details
        </button>
        <div v-if="showDetails" class="error-page__details-content">
          <pre>{{ errorDetails }}</pre>
        </div>
      </div>

      <div class="error-page__actions">
        <button
          class="btn btn--primary"
          @click="retry"
        >
          <svg class="btn__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
        <NuxtLink
          to="/"
          class="btn btn--secondary"
        >
          <svg class="btn__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go to Dashboard
        </NuxtLink>
      </div>

      <div class="error-page__help">
        <p>If the problem persists, <a href="mailto:support@example.com" class="error-page__link">contact support</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const route = useRoute()
const router = useRouter()

const showDetails = ref(false)
const errorDetails = computed(() => route.query.error as string | undefined)

const retry = () => {
  router.go(-1)
  setTimeout(() => {
    window.location.reload()
  }, 100)
}
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-secondary;
  padding: $spacing-xl;
}

.error-page__content {
  max-width: 32rem;
  width: 100%;
  text-align: center;
}

.error-page__icon {
  margin: 0 auto $spacing-xl;
  height: 6rem;
  width: 6rem;
}

.error-page__icon--server-error {
  color: $error-color;
}

.error-page__code {
  font-size: 4rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.error-page__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.error-page__message {
  color: $text-secondary;
  margin-bottom: $spacing-xl;
  line-height: 1.6;
}

.error-page__details {
  margin-bottom: $spacing-xl;
}

.error-page__details-toggle {
  color: $primary-color;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: underline;
  
  &:hover {
    color: darken($primary-color, 10%);
  }
}

.error-page__details-content {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: $bg-dark;
  border-radius: $radius-md;
  text-align: left;
  max-height: 12rem;
  overflow-y: auto;
  
  pre {
    color: white;
    font-size: 0.75rem;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.error-page__actions {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  margin-bottom: $spacing-lg;
}

.error-page__help {
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
  color: $text-secondary;
  font-size: 0.875rem;
}

.error-page__link {
  color: $primary-color;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  transition: $transition-base;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn__icon {
  width: 1.25rem;
  height: 1.25rem;
}

.btn--primary {
  background: $primary-color;
  color: white;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

.btn--secondary {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: $bg-secondary;
  }
}
</style>
