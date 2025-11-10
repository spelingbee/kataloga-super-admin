<template>
  <div class="metric-card-skeleton">
    <div class="metric-card-skeleton__header">
      <div class="metric-card-skeleton__icon skeleton-pulse"></div>
      <div class="metric-card-skeleton__info">
        <div class="metric-card-skeleton__title skeleton-pulse"></div>
        <div class="metric-card-skeleton__value skeleton-pulse"></div>
      </div>
    </div>
    <div class="metric-card-skeleton__trend">
      <div class="metric-card-skeleton__trend-value skeleton-pulse"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.metric-card-skeleton {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__title {
    height: 14px;
    width: 60%;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  &__value {
    height: 32px;
    width: 80%;
    border-radius: 4px;
  }

  &__trend {
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  }

  &__trend-value {
    height: 14px;
    width: 40%;
    border-radius: 4px;
  }
}

.skeleton-pulse {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #e5e7eb 50%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
