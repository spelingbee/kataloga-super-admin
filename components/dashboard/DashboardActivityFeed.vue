<template>
  <div class="activity-feed">
    <!-- Filter Tabs -->
    <div class="activity-feed__filters">
      <button
        v-for="filter in filters"
        :key="filter.value"
        class="activity-feed__filter"
        :class="{ 'activity-feed__filter--active': activeFilter === filter.value }"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Activity List -->
    <div v-if="filteredActivities.length > 0" class="activity-feed__list">
      <div
        v-for="activity in filteredActivities"
        :key="activity.id"
        class="activity-item"
      >
        <div 
          class="activity-item__icon"
          :class="`activity-item__icon--${activity.severity}`"
        >
          <AppIcon :name="getActivityIcon(activity.type)" />
        </div>
        
        <div class="activity-item__content">
          <div class="activity-item__header">
            <h4 class="activity-item__title">{{ activity.title }}</h4>
            <span class="activity-item__time">{{ formatTime(activity.timestamp) }}</span>
          </div>
          <p class="activity-item__description">{{ activity.description }}</p>
          
          <div v-if="activity.metadata" class="activity-item__metadata">
            <span
              v-for="(value, key) in activity.metadata"
              :key="key"
              class="activity-item__tag"
            >
              {{ key }}: {{ value }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="activity-feed__empty">
      <AppIcon name="inbox" size="lg" />
      <p>No recent activity</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Activity } from '~/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

interface Props {
  activities: Activity[]
}

const props = defineProps<Props>()

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Registrations', value: 'registration' },
  { label: 'Approvals', value: 'approval' },
  { label: 'Subscriptions', value: 'subscription' },
  { label: 'Payments', value: 'payment' },
  { label: 'System', value: 'system' },
]

const activeFilter = ref<string>('all')

const filteredActivities = computed(() => {
  if (!props.activities || !Array.isArray(props.activities)) return []
  if (activeFilter.value === 'all') {
    return props.activities
  }
  return props.activities.filter(a => a.type === activeFilter.value)
})

const getActivityIcon = (type: Activity['type']): string => {
  const icons: Record<Activity['type'], string> = {
    registration: 'user-plus',
    approval: 'check-circle',
    subscription: 'credit-card',
    payment: 'dollar-sign',
    system: 'settings',
  }
  return icons[type] || 'activity'
}

const formatTime = (timestamp: string): string => {
  return dayjs(timestamp).fromNow()
}
</script>

<style scoped lang="scss">
.activity-feed {
  &__filters {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }
  }

  &__filter {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
      border-color: #9ca3af;
      background: #f9fafb;
    }

    &--active {
      background: #667eea;
      color: white;
      border-color: #667eea;

      &:hover {
        background: #5568d3;
        border-color: #5568d3;
      }
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 500px;
    overflow-y: auto;
    padding-right: 0.5rem;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: #9ca3af;
    text-align: center;

    p {
      margin-top: 0.75rem;
      font-size: 0.875rem;
    }
  }
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--info {
      background: #dbeafe;
      color: #1e40af;
    }

    &--warning {
      background: #fef3c7;
      color: #92400e;
    }

    &--error {
      background: #fee2e2;
      color: #991b1b;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.25rem;
  }

  &__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  &__time {
    font-size: 0.75rem;
    color: #9ca3af;
    white-space: nowrap;
  }

  &__description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }

  &__metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  &__tag {
    padding: 0.25rem 0.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #6b7280;
  }
}
</style>
