<template>
  <div class="error-page">
    <div class="error-page__content">
      <div class="error-page__icon error-page__icon--unauthorized">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h1 class="error-page__code">401</h1>
      <h2 class="error-page__title">Unauthorized</h2>
      <p class="error-page__message">
        Your session has expired or you are not authenticated. Please log in to continue.
      </p>

      <div class="error-page__actions">
        <NuxtLink to="/login" class="btn btn--primary">
          <svg class="btn__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Go to Login
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

.error-page__icon--unauthorized {
  color: $warning-color;
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
</style>
