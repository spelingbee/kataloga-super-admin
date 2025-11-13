<template>
  <div class="billing-history">
    <!-- Header with Filters -->
    <div class="billing-history__header">
      <h3 class="billing-history__title">Billing History</h3>
      
      <div class="billing-history__filters">
        <div class="billing-history__filter-group">
          <label class="billing-history__filter-label">From Date</label>
          <input
            v-model="filters.fromDate"
            type="date"
            class="billing-history__filter-input"
            @change="handleFilterChange"
          >
        </div>
        
        <div class="billing-history__filter-group">
          <label class="billing-history__filter-label">To Date</label>
          <input
            v-model="filters.toDate"
            type="date"
            class="billing-history__filter-input"
            @change="handleFilterChange"
          >
        </div>
        
        <div class="billing-history__filter-group">
          <label class="billing-history__filter-label">Status</label>
          <select
            v-model="filters.status"
            class="billing-history__filter-select"
            @change="handleFilterChange"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        
        <button
          v-if="hasActiveFilters"
          class="billing-history__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="billing-history__loading">
      <div class="billing-history__spinner"/>
      <p>Loading billing history...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredHistory.length === 0" class="billing-history__empty">
      <p v-if="hasActiveFilters">
        No billing records found matching your filters.
      </p>
      <p v-else>
        No billing history available yet.
      </p>
    </div>

    <!-- Billing List -->
    <div v-else class="billing-history__list">
      <div
        v-for="item in filteredHistory"
        :key="item.id"
        class="billing-history__item"
      >
        <div class="billing-history__item-date">
          <div class="billing-history__date-primary">
            {{ formatDate(item.date) }}
          </div>
          <div class="billing-history__date-secondary">
            {{ formatTime(item.date) }}
          </div>
        </div>

        <div class="billing-history__item-description">
          <div class="billing-history__description-text">
            {{ item.description || 'Subscription payment' }}
          </div>
        </div>

        <div class="billing-history__item-amount">
          <div class="billing-history__amount-value">
            {{ formatCurrency(item.amount) }}
          </div>
        </div>

        <div class="billing-history__item-status">
          <span :class="['billing-history__status-badge', `billing-history__status-badge--${item.status}`]">
            {{ item.status }}
          </span>
        </div>

        <div class="billing-history__item-actions">
          <a
            v-if="item.invoiceUrl"
            :href="item.invoiceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="billing-history__invoice-link"
          >
            <span class="billing-history__invoice-icon">📄</span>
            Invoice
          </a>
          <span v-else class="billing-history__no-invoice">
            No invoice
          </span>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div v-if="filteredHistory.length > 0" class="billing-history__summary">
      <div class="billing-history__summary-item">
        <span class="billing-history__summary-label">Total Transactions:</span>
        <span class="billing-history__summary-value">{{ filteredHistory.length }}</span>
      </div>
      <div class="billing-history__summary-item">
        <span class="billing-history__summary-label">Total Amount:</span>
        <span class="billing-history__summary-value">{{ formatCurrency(totalAmount) }}</span>
      </div>
      <div class="billing-history__summary-item">
        <span class="billing-history__summary-label">Paid:</span>
        <span class="billing-history__summary-value billing-history__summary-value--success">
          {{ formatCurrency(paidAmount) }}
        </span>
      </div>
      <div v-if="refundedAmount > 0" class="billing-history__summary-item">
        <span class="billing-history__summary-label">Refunded:</span>
        <span class="billing-history__summary-value billing-history__summary-value--info">
          {{ formatCurrency(refundedAmount) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BillingHistoryItem } from '~/types'

interface Props {
  history: BillingHistoryItem[]
  loading?: boolean
}

interface Filters {
  fromDate: string
  toDate: string
  status: '' | 'paid' | 'pending' | 'failed' | 'refunded'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  filterChange: [filters: Filters]
}>()

// Filters state
const filters = ref<Filters>({
  fromDate: '',
  toDate: '',
  status: '',
})

// Computed
const hasActiveFilters = computed(() => {
  return !!(filters.value.fromDate || filters.value.toDate || filters.value.status)
})

const filteredHistory = computed(() => {
  let result = [...props.history]

  // Filter by date range
  if (filters.value.fromDate) {
    const fromDate = new Date(filters.value.fromDate)
    result = result.filter(item => new Date(item.date) >= fromDate)
  }

  if (filters.value.toDate) {
    const toDate = new Date(filters.value.toDate)
    toDate.setHours(23, 59, 59, 999) // End of day
    result = result.filter(item => new Date(item.date) <= toDate)
  }

  // Filter by status
  if (filters.value.status) {
    result = result.filter(item => item.status === filters.value.status)
  }

  // Sort by date (newest first)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return result
})

const totalAmount = computed(() => {
  return filteredHistory.value.reduce((sum, item) => sum + item.amount, 0)
})

const paidAmount = computed(() => {
  return filteredHistory.value
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0)
})

const refundedAmount = computed(() => {
  return filteredHistory.value
    .filter(item => item.status === 'refunded')
    .reduce((sum, item) => sum + item.amount, 0)
})

// Methods
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function handleFilterChange(): void {
  emit('filterChange', { ...filters.value })
}

function clearFilters(): void {
  filters.value = {
    fromDate: '',
    toDate: '',
    status: '',
  }
  handleFilterChange()
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.billing-history {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.billing-history__header {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.billing-history__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.billing-history__filters {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
  align-items: flex-end;
}

.billing-history__filter-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  min-width: 150px;
}

.billing-history__filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-secondary;
}

.billing-history__filter-input,
.billing-history__filter-select {
  padding: $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  color: $text-primary;
  background: white;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
}

.billing-history__clear-btn {
  padding: $spacing-sm $spacing-md;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;
  align-self: flex-end;

  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
}

.billing-history__loading {
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

.billing-history__spinner {
  width: 40px;
  height: 40px;
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

.billing-history__empty {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
  background: $bg-secondary;
  border-radius: $radius-md;

  p {
    margin: 0;
  }
}

.billing-history__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.billing-history__item {
  display: grid;
  grid-template-columns: 140px 1fr 120px 100px 100px;
  gap: $spacing-md;
  align-items: center;
  padding: $spacing-md;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
    box-shadow: $shadow-sm;
  }
}

.billing-history__item-date {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.billing-history__date-primary {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
}

.billing-history__date-secondary {
  font-size: 0.75rem;
  color: $text-secondary;
}

.billing-history__item-description {
  display: flex;
  flex-direction: column;
}

.billing-history__description-text {
  color: $text-primary;
  font-size: 0.875rem;
}

.billing-history__item-amount {
  text-align: right;
}

.billing-history__amount-value {
  font-weight: 600;
  font-size: 1rem;
  color: $text-primary;
}

.billing-history__item-status {
  display: flex;
  justify-content: center;
}

.billing-history__status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  text-align: center;
  white-space: nowrap;
}

.billing-history__status-badge--paid {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.billing-history__status-badge--pending {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.billing-history__status-badge--failed {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.billing-history__status-badge--refunded {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.billing-history__item-actions {
  display: flex;
  justify-content: center;
}

.billing-history__invoice-link {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  color: $primary-color;
  text-decoration: none;
  font-size: 0.875rem;
  border-radius: $radius-sm;
  transition: $transition-base;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.billing-history__invoice-icon {
  font-size: 1rem;
}

.billing-history__no-invoice {
  font-size: 0.75rem;
  color: $text-light;
}

.billing-history__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  padding: $spacing-lg;
  background: $bg-secondary;
  border-radius: $radius-md;
  border: 1px solid $border-color;
}

.billing-history__summary-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.billing-history__summary-label {
  font-size: 0.875rem;
  color: $text-secondary;
}

.billing-history__summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
}

.billing-history__summary-value--success {
  color: $success-color;
}

.billing-history__summary-value--info {
  color: $info-color;
}

@media (max-width: $breakpoint-lg) {
  .billing-history__item {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }

  .billing-history__item-amount {
    text-align: left;
  }

  .billing-history__item-status,
  .billing-history__item-actions {
    justify-content: flex-start;
  }
}

@media (max-width: $breakpoint-md) {
  .billing-history__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .billing-history__filter-group {
    min-width: 100%;
  }

  .billing-history__clear-btn {
    align-self: stretch;
  }

  .billing-history__summary {
    grid-template-columns: 1fr;
  }
}
</style>
