<template>
  <div class="error-page">
    <div class="error-page__content">
      <div class="error-page__icon error-page__icon--not-found">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 class="error-page__code">404</h1>
      <h2 class="error-page__title">Page Not Found</h2>
      <p class="error-page__message">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div class="error-page__actions">
        <button
          @click="goBack"
          class="btn btn--secondary"
        >
          <svg class="btn__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
        <NuxtLink
          to="/"
          class="btn btn--primary"
        >
          <svg class="btn__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go to Dashboard
        </NuxtLink>
      </div>

      <div class="error-page__help">
        <p>Need help? <a href="mailto:support@example.com" class="error-page__link">Contact Support</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
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

.error-page__icon--not-found {
  color: $info-color;
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
