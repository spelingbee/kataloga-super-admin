<template>
  <div class="metric-card">
    <div class="metric-card__header">
      <div class="metric-card__icon" :class="`metric-card__icon--${variant}`">
        <AppIcon :name="icon" />
      </div>
      <div class="metric-card__info">
        <h3 class="metric-card__title">{{ title }}</h3>
        <p class="metric-card__value">{{ formattedValue }}</p>
      </div>
    </div>
    
    <div v-if="trend !== undefined" class="metric-card__trend">
      <span 
        class="metric-card__trend-value" 
        :class="trendClass"
      >
        <AppIcon :name="trendIcon" size="sm" />
        {{ Math.abs(trend) }}%
      </span>
      <span class="metric-card__trend-label">{{ trendLabel }}</span>
    </div>

    <div v-if="subtitle" class="metric-card__subtitle">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: number | string
  icon: string
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  trend?: number
  trendLabel?: string
  subtitle?: string
  format?: 'number' | 'currency' | 'percentage'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  format: 'number',
  trendLabel: 'vs last period',
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value

  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(props.value)
    case 'percentage':
      return `${props.value}%`
    case 'number':
    default:
      return new Intl.NumberFormat('en-US').format(props.value)
  }
})

const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'metric-card__trend-value--positive' : 'metric-card__trend-value--negative'
})

const trendIcon = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'trending-up' : 'trending-down'
})
</script>

<style scoped lang="scss">
.metric-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

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
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    &--success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    &--warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    &--danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    &--info {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
  }

  &__value {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  }

  &__trend-value {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;

    &--positive {
      color: #10b981;
    }

    &--negative {
      color: #ef4444;
    }
  }

  &__trend-label {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  &__subtitle {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
}
</style>
