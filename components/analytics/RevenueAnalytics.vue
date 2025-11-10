<template>
  <div class="revenue-analytics">
    <!-- Key Metrics Cards -->
    <div class="revenue-analytics__metrics">
      <div class="revenue-analytics__metric-card">
        <div class="revenue-analytics__metric-label">Total Revenue</div>
        <div class="revenue-analytics__metric-value">
          ${{ formatNumber(metrics?.totalRevenue || 0) }}
        </div>
      </div>

      <div class="revenue-analytics__metric-card">
        <div class="revenue-analytics__metric-label">MRR</div>
        <div class="revenue-analytics__metric-value revenue-analytics__metric-value--primary">
          ${{ formatNumber(metrics?.mrr || 0) }}
        </div>
      </div>

      <div class="revenue-analytics__metric-card">
        <div class="revenue-analytics__metric-label">ARR</div>
        <div class="revenue-analytics__metric-value revenue-analytics__metric-value--success">
          ${{ formatNumber(metrics?.arr || 0) }}
        </div>
      </div>

      <div class="revenue-analytics__metric-card">
        <div class="revenue-analytics__metric-label">Revenue Growth</div>
        <div
          :class="[
            'revenue-analytics__metric-value',
            metrics && metrics.revenueGrowth >= 0
              ? 'revenue-analytics__metric-value--success'
              : 'revenue-analytics__metric-value--error'
          ]"
        >
          {{ metrics && metrics.revenueGrowth >= 0 ? '+' : '' }}{{ formatPercentage(metrics?.revenueGrowth || 0) }}
        </div>
      </div>
    </div>

    <!-- Revenue Trend Chart -->
    <ChartContainer
      title="Revenue Trend"
      description="Total revenue and MRR over time"
      :loading="analyticsStore.loading"
      :error="analyticsStore.error"
    >
      <apexchart
        v-if="trendChartOptions"
        type="line"
        height="350"
        :options="trendChartOptions"
        :series="trendChartSeries"
      />
    </ChartContainer>

    <!-- Revenue by Plan Chart -->
    <ChartContainer
      title="Revenue by Plan"
      description="Revenue distribution across subscription plans"
      :loading="analyticsStore.loading"
      :error="analyticsStore.error"
    >
      <div class="revenue-analytics__plan-breakdown">
        <apexchart
          v-if="planChartOptions"
          type="donut"
          height="300"
          :options="planChartOptions"
          :series="planChartSeries"
        />
        <div class="revenue-analytics__plan-details">
          <div
            v-for="plan in metrics?.revenueByPlan || []"
            :key="plan.plan"
            class="revenue-analytics__plan-item"
          >
            <div class="revenue-analytics__plan-header">
              <span class="revenue-analytics__plan-name">{{ plan.plan }}</span>
              <span class="revenue-analytics__plan-percentage">{{ formatPercentage(plan.percentage) }}</span>
            </div>
            <div class="revenue-analytics__plan-stats">
              <span class="revenue-analytics__plan-revenue">${{ formatNumber(plan.revenue) }}</span>
              <span class="revenue-analytics__plan-subscribers">{{ formatNumber(plan.subscriberCount) }} subscribers</span>
            </div>
          </div>
        </div>
      </div>
    </ChartContainer>

    <!-- Revenue Projections -->
    <ChartContainer
      title="Revenue Projections"
      description="Forecasted revenue based on current trends"
      :loading="analyticsStore.loading"
      :error="analyticsStore.error"
    >
      <div class="revenue-analytics__projections">
        <div class="revenue-analytics__projection-card">
          <div class="revenue-analytics__projection-label">Next Month</div>
          <div class="revenue-analytics__projection-value">
            ${{ formatNumber(metrics?.projections?.nextMonth || 0) }}
          </div>
        </div>

        <div class="revenue-analytics__projection-card">
          <div class="revenue-analytics__projection-label">Next Quarter</div>
          <div class="revenue-analytics__projection-value">
            ${{ formatNumber(metrics?.projections?.nextQuarter || 0) }}
          </div>
        </div>

        <div class="revenue-analytics__projection-card">
          <div class="revenue-analytics__projection-label">Next Year</div>
          <div class="revenue-analytics__projection-value">
            ${{ formatNumber(metrics?.projections?.nextYear || 0) }}
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

const metrics = computed(() => analyticsStore.revenueMetrics)

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(value)
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const trendChartSeries = computed(() => {
  if (!metrics.value?.revenueTrend) return []

  return [
    {
      name: 'Total Revenue',
      data: metrics.value.revenueTrend.map((item) => item.amount),
    },
    {
      name: 'MRR',
      data: metrics.value.revenueTrend.map((item) => item.mrr),
    },
  ]
})

const trendChartOptions = computed(() => {
  if (!metrics.value?.revenueTrend) return null

  return {
    chart: {
      type: 'line',
      toolbar: {
        show: true,
      },
    },
    colors: ['#0ea5e9', '#10b981'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.3,
        opacityTo: 0.1,
      },
    },
    xaxis: {
      categories: metrics.value.revenueTrend.map((item) =>
        new Date(item.date).toLocaleDateString()
      ),
    },
    yaxis: [
      {
        title: {
          text: 'Total Revenue',
        },
        labels: {
          formatter: (value: number) => `$${formatNumber(value)}`,
        },
      },
      {
        opposite: true,
        title: {
          text: 'MRR',
        },
        labels: {
          formatter: (value: number) => `$${formatNumber(value)}`,
        },
      },
    ],
    legend: {
      position: 'top',
    },
    tooltip: {
      y: {
        formatter: (value: number) => `$${formatNumber(value)}`,
      },
    },
  }
})

const planChartSeries = computed(() => {
  if (!metrics.value?.revenueByPlan) return []
  return metrics.value.revenueByPlan.map((item) => item.revenue)
})

const planChartOptions = computed(() => {
  if (!metrics.value?.revenueByPlan) return null

  const colors = [
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
  ]

  return {
    chart: {
      type: 'donut',
    },
    labels: metrics.value.revenueByPlan.map((item) => item.plan),
    colors: colors.slice(0, metrics.value.revenueByPlan.length),
    legend: {
      show: false,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `$${formatNumber(value)}`,
      },
    },
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.revenue-analytics {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.revenue-analytics__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.revenue-analytics__metric-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.revenue-analytics__metric-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.revenue-analytics__metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: $text-primary;
}

.revenue-analytics__metric-value--primary {
  color: $primary-color;
}

.revenue-analytics__metric-value--success {
  color: $success-color;
}

.revenue-analytics__metric-value--error {
  color: $error-color;
}

.revenue-analytics__plan-breakdown {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-xl;
  align-items: center;

  canvas {
    max-height: 300px;
  }
}

.revenue-analytics__plan-details {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.revenue-analytics__plan-item {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-sm;
}

.revenue-analytics__plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.revenue-analytics__plan-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
}

.revenue-analytics__plan-percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: $primary-color;
}

.revenue-analytics__plan-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.revenue-analytics__plan-revenue {
  font-size: 1rem;
  font-weight: 700;
  color: $success-color;
}

.revenue-analytics__plan-subscribers {
  font-size: 0.75rem;
  color: $text-secondary;
}

.revenue-analytics__projections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.revenue-analytics__projection-card {
  padding: $spacing-lg;
  background: linear-gradient(135deg, $primary-color 0%, darken($primary-color, 10%) 100%);
  border-radius: $radius-md;
  color: white;
}

.revenue-analytics__projection-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: $spacing-sm;
}

.revenue-analytics__projection-value {
  font-size: 1.5rem;
  font-weight: 700;
}

@media (max-width: $breakpoint-md) {
  .revenue-analytics__metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .revenue-analytics__plan-breakdown {
    grid-template-columns: 1fr;
  }

  .revenue-analytics__projections {
    grid-template-columns: 1fr;
  }
}
</style>
