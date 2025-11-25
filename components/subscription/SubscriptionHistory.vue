<template>
  <div class="subscription-history">
    <div class="subscription-history__header">
      <h3 class="subscription-history__title">Change History</h3>
      <button
        v-if="history && history.length > 0"
        class="subscription-history__export-btn"
        @click="$emit('export')"
      >
        Export
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="subscription-history__loading">
      <div class="subscription-history__spinner"></div>
      <p>Loading history...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="subscription-history__error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!history || history.length === 0" class="subscription-history__empty">
      <p>No change history available</p>
    </div>

    <!-- History Timeline -->
    <div v-else class="subscription-history__timeline">
      <div
        v-for="item in history"
        :key="item.id"
        class="subscription-history__item"
      >
        <div class="subscription-history__item-marker">
          <span :class="['subscription-history__item-icon', `subscription-history__item-icon--${item.changeType}`]">
            {{ getChangeIcon(item.changeType) }}
          </span>
        </div>
        <div class="subscription-history__item-content">
          <div class="subscription-history__item-header">
            <span :class="['subscription-history__item-type', `subscription-history__item-type--${item.changeType}`]">
              {{ formatChangeType(item.changeType) }}
            </span>
            <span class="subscription-history__item-date">
              {{ formatDate(item.createdAt) }}
            </span>
          </div>
          <div class="subscription-history__item-details">
            <div v-if="item.fromPlan !== item.toPlan" class="subscription-history__item-change">
              <span class="subscription-history__item-label">Plan:</span>
              <span class="subscription-history__item-value">
                {{ item.fromPlan }} → {{ item.toPlan }}
              </span>
            </div>
            <div v-if="item.reason" class="subscription-history__item-reason">
              <span class="subscription-history__item-label">Reason:</span>
              <span class="subscription-history__item-value">{{ item.reason }}</span>
            </div>
            <div v-if="item.metadata && Object.keys(item.metadata).length > 0" class="subscription-history__item-metadata">
              <span class="subscription-history__item-label">Details:</span>
              <pre class="subscription-history__item-metadata-content">{{ JSON.stringify(item.metadata, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SubscriptionHistoryItem } from '~/types'
import { formatDate } from '~/utils/date'

interface Props {
  history: SubscriptionHistoryItem[] | null
  loading?: boolean
  error?: string | null
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

defineEmits<{
  export: []
  retry: []
}>()

function formatChangeType(type: string): string {
  const types: Record<string, string> = {
    upgrade: 'Plan Upgrade',
    downgrade: 'Plan Downgrade',
    cancel: 'Subscription Cancelled',
    reactivate: 'Subscription Reactivated',
    extend: 'Trial Extended',
    discount: 'Discount Applied',
    expire: 'Subscription Expired',
  }
  return types[type] || type
}

function getChangeIcon(type: string): string {
  const icons: Record<string, string> = {
    upgrade: '⬆',
    downgrade: '⬇',
    cancel: '✕',
    reactivate: '↻',
    extend: '⏱',
    discount: '%',
    expire: '⏰',
  }
  return icons[type] || '•'
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.subscription-history__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.subscription-history__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.subscription-history__export-btn {
  padding: $spacing-xs $spacing-md;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.subscription-history__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  gap: $spacing-md;

  p {
    color: $text-secondary;
    margin: 0;
  }
}

.subscription-history__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $bg-secondary;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.subscription-history__error {
  padding: $spacing-md;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    color: $error-color;
    margin: 0;
  }

  button {
    padding: $spacing-xs $spacing-md;
    background: $error-color;
    color: white;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      background: darken($error-color, 10%);
    }
  }
}

.subscription-history__empty {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;

  p {
    margin: 0;
  }
}

.subscription-history__timeline {
  position: relative;
  padding-left: $spacing-lg;

  &::before {
    content: '';
    position: absolute;
    left: 16px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: $border-color;
  }
}

.subscription-history__item {
  position: relative;
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.subscription-history__item-marker {
  position: absolute;
  left: -$spacing-lg;
  top: 0;
  z-index: 1;
}

.subscription-history__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 600;
  background: white;
  border: 2px solid $border-color;
}

.subscription-history__item-icon--upgrade {
  background: lighten($success-color, 40%);
  border-color: $success-color;
  color: $success-color;
}

.subscription-history__item-icon--downgrade {
  background: lighten($warning-color, 40%);
  border-color: $warning-color;
  color: $warning-color;
}

.subscription-history__item-icon--cancel,
.subscription-history__item-icon--expire {
  background: lighten($error-color, 40%);
  border-color: $error-color;
  color: $error-color;
}

.subscription-history__item-icon--reactivate,
.subscription-history__item-icon--extend {
  background: lighten($info-color, 40%);
  border-color: $info-color;
  color: $info-color;
}

.subscription-history__item-icon--discount {
  background: lighten($primary-color, 40%);
  border-color: $primary-color;
  color: $primary-color;
}

.subscription-history__item-content {
  flex: 1;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-md;
}

.subscription-history__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.subscription-history__item-type {
  font-weight: 600;
  font-size: 0.875rem;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
}

.subscription-history__item-type--upgrade {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.subscription-history__item-type--downgrade {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.subscription-history__item-type--cancel,
.subscription-history__item-type--expire {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.subscription-history__item-type--reactivate,
.subscription-history__item-type--extend {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.subscription-history__item-type--discount {
  background: lighten($primary-color, 40%);
  color: $primary-color;
}

.subscription-history__item-date {
  font-size: 0.75rem;
  color: $text-secondary;
}

.subscription-history__item-details {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.subscription-history__item-change,
.subscription-history__item-reason {
  display: flex;
  gap: $spacing-xs;
  font-size: 0.875rem;
}

.subscription-history__item-label {
  font-weight: 500;
  color: $text-secondary;
}

.subscription-history__item-value {
  color: $text-primary;
}

.subscription-history__item-metadata {
  margin-top: $spacing-xs;
}

.subscription-history__item-metadata-content {
  margin: $spacing-xs 0 0 0;
  padding: $spacing-sm;
  background: $bg-secondary;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  color: $text-secondary;
  overflow-x: auto;
}

@media (max-width: $breakpoint-md) {
  .subscription-history__timeline {
    padding-left: $spacing-md;

    &::before {
      left: 12px;
    }
  }

  .subscription-history__item-marker {
    left: -$spacing-md;
  }

  .subscription-history__item-icon {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .subscription-history__item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
  }
}
</style>
