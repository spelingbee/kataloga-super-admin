<template>
  <div class="alerts-list">
    <div v-if="!hasAlerts" class="alerts-list__empty">
      <AppIcon name="shield-check" />
      <p>No recent security alerts</p>
    </div>
    <div v-else class="alerts-list__items">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="alert-item"
        :class="`alert-item--${alert.severity}`"
      >
        <div class="alert-item__icon">
          <AppIcon :name="getAlertIcon(alert.severity)" />
        </div>
        <div class="alert-item__content">
          <div class="alert-item__header">
            <span class="alert-item__type">{{ alert.type }}</span>
            <span class="alert-item__time">{{ formatTime(alert.timestamp) }}</span>
          </div>
          <p class="alert-item__message">{{ alert.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNow } from '~/utils/date'

interface Alert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
}

interface Props {
  alerts: Alert[]
}

const props = defineProps<Props>()

const hasAlerts = computed(() => {
  return props.alerts && props.alerts.length > 0
})

const getAlertIcon = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'alert-octagon'
    case 'warning':
      return 'alert-triangle'
    case 'info':
      return 'info'
    default:
      return 'alert-circle'
  }
}

const formatTime = (timestamp: string): string => {
  return formatDistanceToNow(timestamp)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.alerts-list {
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-xl;
    color: $text-secondary;
    text-align: center;

    p {
      margin-top: $spacing-sm;
      font-size: 0.875rem;
    }
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    max-height: 400px;
    overflow-y: auto;
  }
}

.alert-item {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-radius: $radius-md;
  border-left: 3px solid;
  background: $bg-secondary;

  &--critical {
    border-left-color: $error-color;
    background: #fef2f2;
  }

  &--warning {
    border-left-color: $warning-color;
    background: #fffbeb;
  }

  &--info {
    border-left-color: $info-color;
    background: #eff6ff;
  }

  &__icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__type {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: $text-secondary;
  }

  &__time {
    font-size: 0.75rem;
    color: $text-light;
    white-space: nowrap;
  }

  &__message {
    font-size: 0.875rem;
    color: $text-primary;
    margin: 0;
    line-height: 1.4;
  }
}
</style>
