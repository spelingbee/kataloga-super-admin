<template>
  <div class="menu-history">
    <div class="menu-history__header">
      <h3 class="menu-history__title">Menu Change History</h3>
      <div class="menu-history__actions">
        <button
          v-if="history && history.length > 0"
          class="menu-history__export-btn"
          @click="$emit('export')"
        >
          Export
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="menu-history__filters">
      <input
        v-model="localFilters.action"
        type="text"
        placeholder="Filter by action..."
        class="menu-history__filter-input"
        @input="$emit('filter-change', localFilters)"
      />
      <input
        v-model="localFilters.startDate"
        type="date"
        class="menu-history__filter-input"
        @change="$emit('filter-change', localFilters)"
      />
      <input
        v-model="localFilters.endDate"
        type="date"
        class="menu-history__filter-input"
        @change="$emit('filter-change', localFilters)"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="menu-history__loading">
      <div class="menu-history__spinner"></div>
      <p>Loading history...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="menu-history__error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!history || history.length === 0" class="menu-history__empty">
      <p>No change history available</p>
    </div>

    <!-- History Table -->
    <div v-else class="menu-history__table-wrapper">
      <table class="menu-history__table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Action</th>
            <th>Resource</th>
            <th>User</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in history"
            :key="item.id"
            class="menu-history__row"
          >
            <td class="menu-history__cell">
              {{ formatDateTime(item.createdAt) }}
            </td>
            <td class="menu-history__cell">
              <span :class="['menu-history__action-badge', `menu-history__action-badge--${getActionType(item.action)}`]">
                {{ formatAction(item.action) }}
              </span>
            </td>
            <td class="menu-history__cell">
              <div class="menu-history__resource">
                <span class="menu-history__resource-type">{{ item.resource }}</span>
                <span v-if="item.resourceId" class="menu-history__resource-id">{{ item.resourceId }}</span>
              </div>
            </td>
            <td class="menu-history__cell">
              {{ item.userId || 'System' }}
            </td>
            <td class="menu-history__cell">
              <button
                class="menu-history__details-btn"
                @click="toggleDetails(item.id)"
              >
                {{ expandedItems.has(item.id) ? 'Hide' : 'Show' }} Details
              </button>
            </td>
          </tr>
          <tr
            v-if="expandedItems.has(item.id)"
            v-for="item in history"
            :key="`${item.id}-details`"
            class="menu-history__details-row"
          >
            <td colspan="5" class="menu-history__details-cell">
              <div class="menu-history__details-content">
                <pre>{{ JSON.stringify(item.details, null, 2) }}</pre>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { MenuHistoryItem } from '~/types'
import { formatDate } from '~/utils/date'

interface Props {
  history: MenuHistoryItem[] | null
  loading?: boolean
  error?: string | null
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<{
  export: []
  retry: []
  'filter-change': [filters: any]
}>()

const localFilters = reactive({
  action: '',
  startDate: '',
  endDate: '',
})

const expandedItems = ref(new Set<string>())

function toggleDetails(id: string) {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id)
  } else {
    expandedItems.value.add(id)
  }
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAction(action: string): string {
  return action.replace('MENU_', '').replace(/_/g, ' ')
}

function getActionType(action: string): string {
  if (action.includes('CREATE')) return 'create'
  if (action.includes('UPDATE')) return 'update'
  if (action.includes('DELETE')) return 'delete'
  if (action.includes('BULK')) return 'bulk'
  return 'default'
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.menu-history__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.menu-history__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.menu-history__actions {
  display: flex;
  gap: $spacing-sm;
}

.menu-history__export-btn {
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

.menu-history__filters {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
  flex-wrap: wrap;
}

.menu-history__filter-input {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  flex: 1;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.menu-history__loading {
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

.menu-history__spinner {
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

.menu-history__error {
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

.menu-history__empty {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;

  p {
    margin: 0;
  }
}

.menu-history__table-wrapper {
  overflow-x: auto;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.menu-history__table {
  width: 100%;
  border-collapse: collapse;
  background: white;

  thead {
    background: $bg-secondary;
    border-bottom: 2px solid $border-color;

    th {
      padding: $spacing-md;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      color: $text-primary;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid $border-color;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: $bg-secondary;
      }
    }
  }
}

.menu-history__cell {
  padding: $spacing-md;
  font-size: 0.875rem;
  color: $text-primary;
}

.menu-history__action-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.menu-history__action-badge--create {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.menu-history__action-badge--update {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.menu-history__action-badge--delete {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.menu-history__action-badge--bulk {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.menu-history__action-badge--default {
  background: $bg-secondary;
  color: $text-secondary;
}

.menu-history__resource {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.menu-history__resource-type {
  font-weight: 500;
}

.menu-history__resource-id {
  font-size: 0.75rem;
  color: $text-secondary;
  font-family: monospace;
}

.menu-history__details-btn {
  padding: $spacing-xs $spacing-sm;
  background: transparent;
  color: $primary-color;
  border: 1px solid $primary-color;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $primary-color;
    color: white;
  }
}

.menu-history__details-row {
  background: $bg-secondary;
}

.menu-history__details-cell {
  padding: $spacing-md;
}

.menu-history__details-content {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  padding: $spacing-md;
  overflow-x: auto;

  pre {
    margin: 0;
    font-size: 0.75rem;
    color: $text-secondary;
    font-family: monospace;
  }
}

@media (max-width: $breakpoint-md) {
  .menu-history__table {
    font-size: 0.75rem;
  }

  .menu-history__cell {
    padding: $spacing-sm;
  }

  .menu-history__filters {
    flex-direction: column;
  }

  .menu-history__filter-input {
    width: 100%;
  }
}
</style>
