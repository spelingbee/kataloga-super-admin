<template>
  <div class="system-health">
    <div 
      class="system-health__status" 
      :class="`system-health__status--${overallStatus}`"
    >
      <AppIcon :name="statusIcon" />
      <span>{{ statusText }}</span>
    </div>

    <div class="system-health__metrics">
      <div class="health-metric">
        <div class="health-metric__header">
          <span class="health-metric__label">API Uptime</span>
          <span class="health-metric__value">{{ health.apiUptime }}%</span>
        </div>
        <div class="health-metric__bar">
          <div 
            class="health-metric__progress" 
            :class="getStatusClass(health.apiUptime, 95)"
            :style="{ width: `${health.apiUptime}%` }"
          />
        </div>
      </div>

      <div class="health-metric">
        <div class="health-metric__header">
          <span class="health-metric__label">Database</span>
          <span 
            class="health-metric__badge"
            :class="`health-metric__badge--${health.databaseStatus}`"
          >
            {{ health.databaseStatus }}
          </span>
        </div>
      </div>

      <div class="health-metric">
        <div class="health-metric__header">
          <span class="health-metric__label">Email Delivery Rate</span>
          <span class="health-metric__value">{{ health.emailDeliveryRate }}%</span>
        </div>
        <div class="health-metric__bar">
          <div 
            class="health-metric__progress" 
            :class="getStatusClass(health.emailDeliveryRate, 90)"
            :style="{ width: `${health.emailDeliveryRate}%` }"
          />
        </div>
      </div>

      <div class="health-metric">
        <div class="health-metric__header">
          <span class="health-metric__label">Storage Used</span>
          <span class="health-metric__value">{{ formatStorage(health.storageUsed) }}</span>
        </div>
        <div class="health-metric__bar">
          <div 
            class="health-metric__progress" 
            :class="getStorageStatusClass(health.storageUsed)"
            :style="{ width: `${getStoragePercentage(health.storageUsed)}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SystemHealth } from '~/types'

interface Props {
  health: SystemHealth
}

const props = defineProps<Props>()

const overallStatus = computed(() => {
  if (props.health.databaseStatus === 'down' || props.health.apiUptime < 90) {
    return 'critical'
  }
  if (props.health.databaseStatus === 'degraded' || props.health.apiUptime < 95 || props.health.emailDeliveryRate < 90) {
    return 'warning'
  }
  return 'healthy'
})

const statusIcon = computed(() => {
  switch (overallStatus.value) {
    case 'critical':
      return 'alert-circle'
    case 'warning':
      return 'alert-triangle'
    default:
      return 'check-circle'
  }
})

const statusText = computed(() => {
  switch (overallStatus.value) {
    case 'critical':
      return 'System Issues Detected'
    case 'warning':
      return 'System Degraded'
    default:
      return 'All Systems Operational'
  }
})

const getStatusClass = (value: number, threshold: number) => {
  if (value >= threshold) return 'health-metric__progress--success'
  if (value >= threshold - 10) return 'health-metric__progress--warning'
  return 'health-metric__progress--danger'
}

const formatStorage = (bytes: number) => {
  const gb = bytes / (1024 ** 3)
  return `${gb.toFixed(2)} GB`
}

const getStoragePercentage = (bytes: number) => {
  const maxStorage = 100 * (1024 ** 3) // 100 GB
  return Math.min((bytes / maxStorage) * 100, 100)
}

const getStorageStatusClass = (bytes: number) => {
  const percentage = getStoragePercentage(bytes)
  if (percentage < 70) return 'health-metric__progress--success'
  if (percentage < 85) return 'health-metric__progress--warning'
  return 'health-metric__progress--danger'
}
</script>

<style scoped lang="scss">
.system-health {
  &__status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 8px;
    font-weight: 600;
    margin-bottom: 1.5rem;

    &--healthy {
      background: #d1fae5;
      color: #065f46;
    }

    &--warning {
      background: #fef3c7;
      color: #92400e;
    }

    &--critical {
      background: #fee2e2;
      color: #991b1b;
    }
  }

  &__metrics {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
}

.health-metric {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  &__label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }

  &__value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
  }

  &__badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;

    &--healthy {
      background: #d1fae5;
      color: #065f46;
    }

    &--degraded {
      background: #fef3c7;
      color: #92400e;
    }

    &--down {
      background: #fee2e2;
      color: #991b1b;
    }
  }

  &__bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
  }

  &__progress {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.3s ease;

    &--success {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    &--warning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    &--danger {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }
  }
}
</style>
