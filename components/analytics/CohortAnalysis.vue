<template>
  <div class="cohort-analysis">
    <ChartContainer
      title="Cohort Analysis"
      description="Retention by cohort and behavior patterns"
      :loading="loading"
      :error="error"
    >
      <div v-if="cohortData" class="cohort-analysis__content">
        <div class="cohort-analysis__table-wrapper">
          <table class="cohort-analysis__table">
            <thead>
              <tr>
                <th class="cohort-analysis__header">Cohort</th>
                <th class="cohort-analysis__header">Size</th>
                <th
                  v-for="month in maxMonths"
                  :key="month"
                  class="cohort-analysis__header"
                >
                  Month {{ month }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="cohort in cohortData.cohorts"
                :key="cohort.cohortDate"
                class="cohort-analysis__row"
              >
                <td class="cohort-analysis__cell cohort-analysis__cell--cohort">
                  {{ formatCohortDate(cohort.cohortDate) }}
                </td>
                <td class="cohort-analysis__cell cohort-analysis__cell--size">
                  {{ cohort.cohortSize }}
                </td>
                <td
                  v-for="month in maxMonths"
                  :key="month"
                  class="cohort-analysis__cell"
                >
                  <div
                    v-if="getRetentionForMonth(cohort, month)"
                    class="cohort-analysis__retention"
                    :style="{ background: getRetentionColor(getRetentionForMonth(cohort, month)?.retentionRate || 0) }"
                  >
                    {{ getRetentionForMonth(cohort, month)?.retentionRate.toFixed(0) }}%
                  </div>
                  <div v-else class="cohort-analysis__retention cohort-analysis__retention--empty">
                    -
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="cohort-analysis__average">
          <h4 class="cohort-analysis__average-title">Average Retention by Month</h4>
          <div class="cohort-analysis__average-chart">
            <div
              v-for="avg in cohortData.averageRetention"
              :key="avg.month"
              class="cohort-analysis__average-bar"
            >
              <div
                class="cohort-analysis__average-bar-fill"
                :style="{ height: `${avg.rate}%` }"
              >
                <span class="cohort-analysis__average-bar-label">{{ avg.rate.toFixed(0) }}%</span>
              </div>
              <span class="cohort-analysis__average-bar-month">M{{ avg.month }}</span>
            </div>
          </div>
        </div>

        <div v-if="cohortData.behaviorPatterns.length > 0" class="cohort-analysis__patterns">
          <h4 class="cohort-analysis__patterns-title">Behavior Patterns</h4>
          <div
            v-for="(pattern, index) in cohortData.behaviorPatterns"
            :key="index"
            class="cohort-analysis__pattern"
          >
            <div class="cohort-analysis__pattern-header">
              <span class="cohort-analysis__pattern-icon">📊</span>
              <strong class="cohort-analysis__pattern-name">{{ pattern.pattern }}</strong>
            </div>
            <p class="cohort-analysis__pattern-description">{{ pattern.description }}</p>
            <div class="cohort-analysis__pattern-cohorts">
              <span class="cohort-analysis__pattern-label">Affected cohorts:</span>
              <span class="cohort-analysis__pattern-list">{{ pattern.affectedCohorts.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </ChartContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAnalyticsStore } from '~/stores/analytics'
import ChartContainer from './ChartContainer.vue'

const analyticsStore = useAnalyticsStore()

const loading = computed(() => analyticsStore.loading)
const error = computed(() => analyticsStore.error)
const cohortData = computed(() => analyticsStore.cohortAnalysisMetrics)

const maxMonths = computed(() => {
  if (!cohortData.value) return 0
  const maxMonth = Math.max(
    ...cohortData.value.cohorts.flatMap(c => c.retentionByMonth.map(r => r.month))
  )
  return maxMonth
})

const formatCohortDate = (date: string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

const getRetentionForMonth = (cohort: any, month: number) => {
  return cohort.retentionByMonth.find((r: any) => r.month === month)
}

const getRetentionColor = (rate: number): string => {
  if (rate >= 80) return 'rgba(16, 185, 129, 0.8)' // Green
  if (rate >= 60) return 'rgba(59, 130, 246, 0.7)' // Blue
  if (rate >= 40) return 'rgba(245, 158, 11, 0.7)' // Orange
  if (rate >= 20) return 'rgba(239, 68, 68, 0.6)' // Red
  return 'rgba(148, 163, 184, 0.3)' // Gray
}

onMounted(async () => {
  if (!cohortData.value) {
    try {
      await analyticsStore.fetchCohortAnalytics()
    } catch (err) {
      console.error('Failed to fetch cohort analysis:', err)
    }
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.cohort-analysis__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.cohort-analysis__table-wrapper {
  overflow-x: auto;
  border-radius: $radius-md;
  border: 1px solid $border-color;
}

.cohort-analysis__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.cohort-analysis__header {
  background: $bg-secondary;
  padding: $spacing-sm $spacing-md;
  text-align: left;
  font-weight: 600;
  color: $text-primary;
  border-bottom: 2px solid $border-color;
  white-space: nowrap;
}

.cohort-analysis__row {
  &:hover {
    background: lighten($bg-secondary, 2%);
  }
}

.cohort-analysis__cell {
  padding: $spacing-sm $spacing-md;
  border-bottom: 1px solid $border-color;
  text-align: center;
}

.cohort-analysis__cell--cohort {
  font-weight: 600;
  color: $text-primary;
  text-align: left;
  white-space: nowrap;
}

.cohort-analysis__cell--size {
  font-weight: 600;
  color: $text-secondary;
}

.cohort-analysis__retention {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  color: white;
  font-weight: 600;
  min-width: 50px;
}

.cohort-analysis__retention--empty {
  background: transparent;
  color: $text-light;
}

.cohort-analysis__average {
  padding: $spacing-lg;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.cohort-analysis__average-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-lg;
}

.cohort-analysis__average-chart {
  display: flex;
  gap: $spacing-md;
  align-items: flex-end;
  height: 200px;
}

.cohort-analysis__average-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
}

.cohort-analysis__average-bar-fill {
  width: 100%;
  background: linear-gradient(180deg, $primary-color, lighten($primary-color, 10%));
  border-radius: $radius-sm $radius-sm 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: $spacing-xs;
  min-height: 30px;
  transition: $transition-base;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-md;
  }
}

.cohort-analysis__average-bar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.cohort-analysis__average-bar-month {
  font-size: 0.75rem;
  color: $text-secondary;
  font-weight: 500;
}

.cohort-analysis__patterns {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.cohort-analysis__patterns-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.cohort-analysis__pattern {
  padding: $spacing-md;
  background: lighten($info-color, 45%);
  border-left: 3px solid $info-color;
  border-radius: $radius-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.cohort-analysis__pattern-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.cohort-analysis__pattern-icon {
  font-size: 1.25rem;
}

.cohort-analysis__pattern-name {
  color: $text-primary;
  font-size: 0.875rem;
}

.cohort-analysis__pattern-description {
  color: $text-secondary;
  font-size: 0.875rem;
  margin: 0;
}

.cohort-analysis__pattern-cohorts {
  display: flex;
  gap: $spacing-xs;
  font-size: 0.75rem;
}

.cohort-analysis__pattern-label {
  color: $text-secondary;
  font-weight: 500;
}

.cohort-analysis__pattern-list {
  color: $text-primary;
  font-weight: 600;
}

@media (max-width: $breakpoint-md) {
  .cohort-analysis__table {
    font-size: 0.75rem;
  }

  .cohort-analysis__header,
  .cohort-analysis__cell {
    padding: $spacing-xs $spacing-sm;
  }

  .cohort-analysis__average-chart {
    height: 150px;
  }
}
</style>
