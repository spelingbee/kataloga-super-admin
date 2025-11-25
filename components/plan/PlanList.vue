<template>
  <div class="plan-list">
    <!-- Filters -->
    <div class="plan-list__filters">
      <div class="plan-list__filter-group">
        <label class="plan-list__filter-label">Status</label>
        <select
          v-model="localFilters.isActive"
          class="plan-list__filter-select"
          @change="handleFilterChange"
        >
          <option :value="null">All Plans</option>
          <option :value="true">Active Only</option>
          <option :value="false">Inactive Only</option>
        </select>
      </div>

      <div class="plan-list__filter-group">
        <label class="plan-list__filter-label">Sort By</label>
        <select
          v-model="localFilters.sortBy"
          class="plan-list__filter-select"
          @change="handleFilterChange"
        >
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="createdAt">Created Date</option>
        </select>
      </div>

      <div class="plan-list__filter-group">
        <label class="plan-list__filter-label">Order</label>
        <select
          v-model="localFilters.sortOrder"
          class="plan-list__filter-select"
          @change="handleFilterChange"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="plan-list__error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && plans.length === 0" class="plan-list__loading">
      <div class="plan-list__spinner"></div>
      <p>Loading plans...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && plans.length === 0" class="plan-list__empty">
      <p>No plans found</p>
    </div>

    <!-- Plans Grid -->
    <div v-else class="plan-list__grid">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :class="{ 'plan-card--inactive': !plan.isActive }"
      >
        <div class="plan-card__header">
          <div>
            <h3 class="plan-card__name">{{ plan.name }}</h3>
            <span
              class="plan-card__status"
              :class="{
                'plan-card__status--active': plan.isActive,
                'plan-card__status--inactive': !plan.isActive,
              }"
            >
              {{ plan.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="plan-card__price">
            ${{ plan.price.toFixed(2) }}
            <span class="plan-card__price-period">/month</span>
          </div>
        </div>

        <div class="plan-card__body">
          <div class="plan-card__limits">
            <div class="plan-card__limit">
              <span class="plan-card__limit-label">Max Users:</span>
              <span class="plan-card__limit-value">{{ plan.maxUsers }}</span>
            </div>
            <div class="plan-card__limit">
              <span class="plan-card__limit-label">Max Sites:</span>
              <span class="plan-card__limit-value">{{ plan.maxSites }}</span>
            </div>
            <div class="plan-card__limit">
              <span class="plan-card__limit-label">Trial Days:</span>
              <span class="plan-card__limit-value">{{ plan.trialDays }}</span>
            </div>
          </div>

          <div class="plan-card__features">
            <h4 class="plan-card__features-title">Features</h4>
            <ul class="plan-card__features-list">
              <li
                v-for="(feature, index) in plan.features.slice(0, 3)"
                :key="index"
                class="plan-card__feature"
              >
                {{ feature }}
              </li>
              <li v-if="plan.features.length > 3" class="plan-card__feature plan-card__feature--more">
                +{{ plan.features.length - 3 }} more
              </li>
            </ul>
          </div>

          <div class="plan-card__subscriptions">
            <span class="plan-card__subscriptions-count">
              {{ plan.subscriptionCount }}
            </span>
            <span class="plan-card__subscriptions-label">
              {{ plan.subscriptionCount === 1 ? 'Subscription' : 'Subscriptions' }}
            </span>
          </div>
        </div>

        <div class="plan-card__actions">
          <button
            class="plan-card__action-btn plan-card__action-btn--primary"
            @click="$emit('view', plan.id)"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Plan } from '~/stores/plan'

interface Props {
  plans: Plan[]
  loading: boolean
  error: string | null
  filters: {
    isActive: boolean | null
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
}

interface Emits {
  (e: 'view', planId: string): void
  (e: 'filter-change', filters: { isActive: boolean | null; sortBy: string; sortOrder: 'asc' | 'desc' }): void
  (e: 'retry'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = ref({ ...props.filters })

watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters }
  },
  { deep: true }
)

function handleFilterChange(): void {
  emit('filter-change', { ...localFilters.value })
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.plan-list {
  width: 100%;
}

.plan-list__filters {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
}

.plan-list__filter-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.plan-list__filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-secondary;
}

.plan-list__filter-select {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: white;
  color: $text-primary;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    border-color: $primary-color;
  }

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
}

.plan-list__error {
  padding: $spacing-lg;
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

.plan-list__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  gap: $spacing-md;

  p {
    color: $text-secondary;
  }
}

.plan-list__spinner {
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

.plan-list__empty {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
}

.plan-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-lg;
}

.plan-card {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  overflow: hidden;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-md;
  }
}

.plan-card--inactive {
  opacity: 0.7;
}

.plan-card__header {
  padding: $spacing-lg;
  background: $bg-secondary;
  border-bottom: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plan-card__name {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
}

.plan-card__status {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 500;
}

.plan-card__status--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.plan-card__status--inactive {
  background: lighten($text-secondary, 40%);
  color: $text-secondary;
}

.plan-card__price {
  font-size: 1.5rem;
  font-weight: 700;
  color: $primary-color;
  text-align: right;
}

.plan-card__price-period {
  font-size: 0.875rem;
  font-weight: 400;
  color: $text-secondary;
}

.plan-card__body {
  padding: $spacing-lg;
}

.plan-card__limits {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
}

.plan-card__limit {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-card__limit-label {
  font-size: 0.875rem;
  color: $text-secondary;
}

.plan-card__limit-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
}

.plan-card__features {
  margin-bottom: $spacing-lg;
}

.plan-card__features-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-sm 0;
}

.plan-card__features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-card__feature {
  font-size: 0.875rem;
  color: $text-secondary;
  padding: $spacing-xs 0;
  padding-left: $spacing-md;
  position: relative;

  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: $success-color;
    font-weight: 600;
  }
}

.plan-card__feature--more {
  color: $primary-color;
  font-weight: 500;

  &::before {
    content: '';
  }
}

.plan-card__subscriptions {
  display: flex;
  align-items: baseline;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.plan-card__subscriptions-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: $primary-color;
}

.plan-card__subscriptions-label {
  font-size: 0.875rem;
  color: $text-secondary;
}

.plan-card__actions {
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

.plan-card__action-btn {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
}

.plan-card__action-btn--primary {
  background: $primary-color;
  color: white;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .plan-list__grid {
    grid-template-columns: 1fr;
  }
}
</style>
