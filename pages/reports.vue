<template>
  <div class="reports-page">
    <div class="reports-page__header">
      <h1 class="reports-page__title">Custom Reports</h1>
      <p class="reports-page__subtitle">
        Build and generate custom analytics reports with your preferred metrics
      </p>
    </div>

    <ReportBuilder />
  </div>
</template>

<script setup lang="ts">
import ReportBuilder from '~/components/analytics/ReportBuilder.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default',
})
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.reports-page {
  padding: $spacing-lg;
  max-width: 1400px;
  margin: 0 auto;
}

.reports-page__header {
  margin-bottom: $spacing-xl;
}

.reports-page__title {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.reports-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

@media (max-width: $breakpoint-md) {
  .reports-page {
    padding: $spacing-md;
  }

  .reports-page__title {
    font-size: 1.5rem;
  }
}
</style>
