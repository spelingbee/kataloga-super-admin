<template>
  <div class="audit-analytics-page">
    <div class="audit-analytics-page__header">
      <h1 class="audit-analytics-page__title">Audit Analytics</h1>
      <p class="audit-analytics-page__subtitle">
        Analyze administrative actions and user activity
      </p>
    </div>

    <!-- Date Range Selector -->
    <div class="audit-analytics-page__date-range">
      <FormInput
        v-model="fromDate"
        type="date"
        label="From Date"
        class="audit-analytics-page__date-input"
      />
      <FormInput
        v-model="toDate"
        type="date"
        label="To Date"
        class="audit-analytics-page__date-input"
      />
      <button
        class="audit-analytics-page__apply-btn"
        @click="applyDateRange"
      >
        Apply
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="audit-analytics-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="audit-analytics-page__loading">
      <div class="audit-analytics-page__spinner"></div>
    </div>

    <!-- Analytics Content -->
    <div v-else-if="analytics" class="audit-analytics-page__content">
      <!-- Summary Cards -->
      <div class="audit-analytics-page__summary">
        <div class="audit-analytics-page__card">
          <div class="audit-analytics-page__card-label">Total Actions</div>
          <div class="audit-analytics-page__card-value">{{ formatNumber(analytics.totalActions) }}</div>
        </div>
        <div class="audit-analytics-page__card audit-analytics-page__card--success">
          <div class="audit-analytics-page__card-label">Success Rate</div>
          <div class="audit-analytics-page__card-value">{{ formatPercentage(analytics.successRate) }}</div>
        </div>
        <div class="audit-analytics-page__card audit-analytics-page__card--error">
          <div class="audit-analytics-page__card-label">Failure Rate</div>
          <div class="audit-analytics-page__card-value">{{ formatPercentage(analytics.failureRate) }}</div>
        </div>
      </div>

      <!-- Action Breakdown -->
      <div class="audit-analytics-page__section">
        <h2 class="audit-analytics-page__section-title">Action Breakdown</h2>
        <div class="audit-analytics-page__chart-container">
          <apexchart
            v-if="actionBreakdownChartOptions"
            type="pie"
            :options="actionBreakdownChartOptions"
            :series="actionBreakdownSeries"
            height="350"
          />
        </div>
      </div>

      <!-- Trend Analysis -->
      <div class="audit-analytics-page__section">
        <h2 class="audit-analytics-page__section-title">Trend Analysis</h2>
        <div class="audit-analytics-page__chart-container">
          <apexchart
            v-if="trendChartOptions"
            type="line"
            :options="trendChartOptions"
            :series="trendSeries"
            height="350"
          />
        </div>
      </div>

      <!-- User Activity Metrics -->
      <div class="audit-analytics-page__section">
        <h2 class="audit-analytics-page__section-title">User Activity Metrics</h2>
        <div class="audit-analytics-page__table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action Count</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in analytics.userActivityMetrics" :key="user.userId">
                <td>{{ user.userName }}</td>
                <td>{{ formatNumber(user.actionCount) }}</td>
                <td>{{ formatDateTime(user.lastActivity) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top Resources -->
      <div class="audit-analytics-page__section">
        <h2 class="audit-analytics-page__section-title">Top Resources</h2>
        <div class="audit-analytics-page__chart-container">
          <apexchart
            v-if="topResourcesChartOptions"
            type="bar"
            :options="topResourcesChartOptions"
            :series="topResourcesSeries"
            height="350"
          />
        </div>
      </div>

      <!-- Recent Failures -->
      <div v-if="analytics.recentFailures.length > 0" class="audit-analytics-page__section">
        <h2 class="audit-analytics-page__section-title">Recent Failures</h2>
        <div class="audit-analytics-page__failures">
          <div
            v-for="failure in analytics.recentFailures"
            :key="failure.id"
            class="audit-analytics-page__failure-card"
          >
            <div class="audit-analytics-page__failure-header">
              <span class="audit-analytics-page__failure-action">{{ failure.action }}</span>
              <span class="audit-analytics-page__failure-time">{{ formatRelativeTime(failure.timestamp) }}</span>
            </div>
            <div class="audit-analytics-page__failure-resource">
              Resource: {{ failure.resource }}
            </div>
            <div class="audit-analytics-page__failure-error">
              {{ failure.errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuditStore } from '~/stores/audit'
import { formatDateTime, formatRelativeTime } from '~/utils/date'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const auditStore = useAuditStore()
const { showNotification } = useNotification()

// Date range
const fromDate = ref('')
const toDate = ref('')

// Computed
const analytics = computed(() => auditStore.analytics)
const loading = computed(() => auditStore.loading)
const error = computed(() => auditStore.error)

// Chart data
const actionBreakdownChartOptions = computed(() => {
  if (!analytics.value) return null

  return {
    chart: {
      type: 'pie',
    },
    labels: analytics.value.actionBreakdown.map(item => item.action),
    legend: {
      position: 'bottom',
    },
    colors: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  }
})

const actionBreakdownSeries = computed(() => {
  if (!analytics.value) return []
  return analytics.value.actionBreakdown.map(item => item.count)
})

const trendChartOptions = computed(() => {
  if (!analytics.value) return null

  return {
    chart: {
      type: 'line',
      toolbar: {
        show: true,
      },
    },
    xaxis: {
      categories: analytics.value.trendAnalysis.map(item => item.date),
      title: {
        text: 'Date',
      },
    },
    yaxis: {
      title: {
        text: 'Actions',
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    colors: ['#0ea5e9', '#10b981', '#ef4444'],
    legend: {
      position: 'top',
    },
  }
})

const trendSeries = computed(() => {
  if (!analytics.value) return []

  return [
    {
      name: 'Total Actions',
      data: analytics.value.trendAnalysis.map(item => item.totalActions),
    },
    {
      name: 'Success',
      data: analytics.value.trendAnalysis.map(item => item.successCount),
    },
    {
      name: 'Failure',
      data: analytics.value.trendAnalysis.map(item => item.failureCount),
    },
  ]
})

const topResourcesChartOptions = computed(() => {
  if (!analytics.value) return null

  return {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    xaxis: {
      categories: analytics.value.topResources.map(item => item.resource),
    },
    colors: ['#0ea5e9'],
  }
})

const topResourcesSeries = computed(() => {
  if (!analytics.value) return []

  return [
    {
      name: 'Actions',
      data: analytics.value.topResources.map(item => item.count),
    },
  ]
})

// Methods
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

async function applyDateRange(): Promise<void> {
  if (!fromDate.value || !toDate.value) {
    showNotification({
      type: 'warning',
      message: 'Please select both from and to dates',
    })
    return
  }

  await fetchAnalytics()
}

async function fetchAnalytics(): Promise<void> {
  try {
    await auditStore.fetchAnalytics(fromDate.value, toDate.value)
  } catch (error) {
    console.error('Failed to fetch audit analytics:', error)
  }
}

async function retryFetch(): Promise<void> {
  auditStore.clearError()
  await fetchAnalytics()
}

// Initialize date range (last 30 days)
function initializeDateRange(): void {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  toDate.value = today.toISOString().split('T')[0]
  fromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
}

// Fetch on mount
onMounted(() => {
  initializeDateRange()
  fetchAnalytics()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.audit-analytics-page {
  padding: $spacing-lg;
}

.audit-analytics-page__header {
  margin-bottom: $spacing-xl;
}

.audit-analytics-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.audit-analytics-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.audit-analytics-page__date-range {
  display: flex;
  gap: $spacing-md;
  align-items: flex-end;
  margin-bottom: $spacing-xl;
}

.audit-analytics-page__date-input {
  flex: 1;
  max-width: 250px;
}

.audit-analytics-page__apply-btn {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.audit-analytics-page__error {
  padding: $spacing-md;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
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

.audit-analytics-page__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $spacing-xl;
}

.audit-analytics-page__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid $bg-secondary;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.audit-analytics-page__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.audit-analytics-page__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;
}

.audit-analytics-page__card {
  padding: $spacing-lg;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.audit-analytics-page__card--success {
  border-left: 4px solid $success-color;
}

.audit-analytics-page__card--error {
  border-left: 4px solid $error-color;
}

.audit-analytics-page__card-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.audit-analytics-page__card-value {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
}

.audit-analytics-page__section {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}

.audit-analytics-page__section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-lg;
}

.audit-analytics-page__chart-container {
  width: 100%;
}

.audit-analytics-page__table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: $bg-secondary;

      th {
        padding: $spacing-md;
        text-align: left;
        font-weight: 600;
        color: $text-primary;
        border-bottom: 2px solid $border-color;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid $border-color;

        &:hover {
          background: $bg-secondary;
        }

        td {
          padding: $spacing-md;
          color: $text-primary;
        }
      }
    }
  }
}

.audit-analytics-page__failures {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.audit-analytics-page__failure-card {
  padding: $spacing-md;
  background: lighten($error-color, 45%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
}

.audit-analytics-page__failure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.audit-analytics-page__failure-action {
  font-weight: 600;
  color: $error-color;
}

.audit-analytics-page__failure-time {
  font-size: 0.875rem;
  color: $text-secondary;
}

.audit-analytics-page__failure-resource {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.audit-analytics-page__failure-error {
  font-size: 0.875rem;
  color: $text-primary;
}

@media (max-width: $breakpoint-md) {
  .audit-analytics-page__date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .audit-analytics-page__date-input {
    max-width: none;
  }

  .audit-analytics-page__summary {
    grid-template-columns: 1fr;
  }
}
</style>
