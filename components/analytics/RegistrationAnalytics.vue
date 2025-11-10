<template>
  <div class="registration-analytics">
    <!-- Key Metrics Cards -->
    <div class="registration-analytics__metrics">
      <div class="registration-analytics__metric-card">
        <div class="registration-analytics__metric-label">Total Registrations</div>
        <div class="registration-analytics__metric-value">
          {{ formatNumber(metrics?.total || 0) }}
        </div>
      </div>

      <div class="registration-analytics__metric-card">
        <div class="registration-analytics__metric-label">Approved</div>
        <div class="registration-analytics__metric-value registration-analytics__metric-value--success">
          {{ formatNumber(metrics?.approved || 0) }}
        </div>
      </div>

      <div class="registration-analytics__metric-card">
        <div class="registration-analytics__metric-label">Pending</div>
        <div class="registration-analytics__metric-value registration-analytics__metric-value--warning">
          {{ formatNumber(metrics?.pending || 0) }}
        </div>
      </div>

      <div class="registration-analytics__metric-card">
        <div class="registration-analytics__metric-label">Conversion Rate</div>
        <div class="registration-analytics__metric-value registration-analytics__metric-value--primary">
          {{ formatPercentage(metrics?.conversionRate || 0) }}
        </div>
      </div>
    </div>

    <!-- Registration Trends Chart -->
    <ChartContainer
      title="Registration Trends"
      description="Daily registration submissions over time"
      :loading="analyticsStore.loading"
      :error="analyticsStore.error"
    >
      <apexchart
        v-if="trendsChartOptions"
        type="line"
        height="350"
        :options="trendsChartOptions"
        :series="trendsChartSeries"
      />
    </ChartContainer>

    <!-- Status Breakdown Chart -->
    <ChartContainer
      title="Registration Status Breakdown"
      description="Distribution of registrations by status"
      :loading="analyticsStore.loading"
      :error="analyticsStore.error"
    >
      <div class="registration-analytics__breakdown">
        <apexchart
          v-if="statusChartOptions"
          type="donut"
          height="300"
          :options="statusChartOptions"
          :series="statusChartSeries"
        />
        <div class="registration-analytics__breakdown-legend">
          <div
            v-for="item in metrics?.statusBreakdown || []"
            :key="item.status"
            class="registration-analytics__legend-item"
          >
            <span class="registration-analytics__legend-label">{{ item.status }}</span>
            <span class="registration-analytics__legend-value">
              {{ formatNumber(item.count) }} ({{ formatPercentage(item.percentage) }})
            </span>
          </div>
        </div>
      </div>
    </ChartContainer>
  </div>
</template>

<script setup lang="ts">
import { useAnalyticsStore } from '~/stores/analytics'
import ChartContainer from './ChartContainer.vue'

const analyticsStore = useAnalyticsStore()

const metrics = computed(() => analyticsStore.registrationMetrics)

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(value)
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const trendsChartSeries = computed(() => {
  if (!metrics.value?.trends) return []

  const dateMap = new Map<string, { approved: number; rejected: number; pending: number }>()
  
  metrics.value.trends.forEach((trend) => {
    if (!dateMap.has(trend.date)) {
      dateMap.set(trend.date, { approved: 0, rejected: 0, pending: 0 })
    }
    const data = dateMap.get(trend.date)!
    data[trend.status] = trend.count
  })

  const dates = Array.from(dateMap.keys()).sort()

  return [
    {
      name: 'Approved',
      data: dates.map((date) => dateMap.get(date)!.approved),
    },
    {
      name: 'Rejected',
      data: dates.map((date) => dateMap.get(date)!.rejected),
    },
    {
      name: 'Pending',
      data: dates.map((date) => dateMap.get(date)!.pending),
    },
  ]
})

const trendsChartOptions = computed(() => {
  if (!metrics.value?.trends) return null

  const dateMap = new Map<string, { approved: number; rejected: number; pending: number }>()
  
  metrics.value.trends.forEach((trend) => {
    if (!dateMap.has(trend.date)) {
      dateMap.set(trend.date, { approved: 0, rejected: 0, pending: 0 })
    }
  })

  const dates = Array.from(dateMap.keys()).sort()

  return {
    chart: {
      type: 'line',
      toolbar: {
        show: true,
      },
    },
    colors: ['#10b981', '#ef4444', '#f59e0b'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: dates.map((date) => new Date(date).toLocaleDateString()),
    },
    yaxis: {
      labels: {
        formatter: (value: number) => Math.floor(value).toString(),
      },
    },
    legend: {
      position: 'top',
    },
  }
})

const statusChartSeries = computed(() => {
  if (!metrics.value?.statusBreakdown) return []
  return metrics.value.statusBreakdown.map((item) => item.count)
})

const statusChartOptions = computed(() => {
  if (!metrics.value?.statusBreakdown) return null

  const colors: Record<string, string> = {
    approved: '#10b981',
    rejected: '#ef4444',
    pending: '#f59e0b',
    info_requested: '#3b82f6',
  }

  return {
    chart: {
      type: 'donut',
    },
    labels: metrics.value.statusBreakdown.map((item) => item.status),
    colors: metrics.value.statusBreakdown.map(
      (item) => colors[item.status] || '#64748b'
    ),
    legend: {
      show: false,
    },
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.registration-analytics {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.registration-analytics__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.registration-analytics__metric-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.registration-analytics__metric-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.registration-analytics__metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: $text-primary;
}

.registration-analytics__metric-value--success {
  color: $success-color;
}

.registration-analytics__metric-value--warning {
  color: $warning-color;
}

.registration-analytics__metric-value--primary {
  color: $primary-color;
}

.registration-analytics__breakdown {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-xl;
  align-items: center;

  canvas {
    max-height: 300px;
  }
}

.registration-analytics__breakdown-legend {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.registration-analytics__legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm;
  background: $bg-secondary;
  border-radius: $radius-sm;
}

.registration-analytics__legend-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
  text-transform: capitalize;
}

.registration-analytics__legend-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-secondary;
}

@media (max-width: $breakpoint-md) {
  .registration-analytics__metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .registration-analytics__breakdown {
    grid-template-columns: 1fr;
  }
}
</style>
