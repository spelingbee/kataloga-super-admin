<template>
  <div class="chart-container">
    <div class="chart-container__header">
      <h3 class="chart-container__title">{{ title }}</h3>
      <p v-if="description" class="chart-container__description">{{ description }}</p>
    </div>

    <div v-if="loading" class="chart-container__loading">
      <div class="chart-container__spinner"></div>
      <p>Loading chart data...</p>
    </div>

    <div v-else-if="error" class="chart-container__error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="chart-container__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  loading?: boolean
  error?: string | null
}

withDefaults(defineProps<Props>(), {
  description: '',
  loading: false,
  error: null,
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.chart-container {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-lg;
}

.chart-container__header {
  margin-bottom: $spacing-lg;
}

.chart-container__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.chart-container__description {
  font-size: 0.875rem;
  color: $text-secondary;
}

.chart-container__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  gap: $spacing-md;

  p {
    font-size: 0.875rem;
    color: $text-secondary;
  }
}

.chart-container__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $border-color;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chart-container__error {
  padding: $spacing-lg;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-sm;
  color: $error-color;
  text-align: center;
}

.chart-container__content {
  min-height: 300px;
}
</style>
