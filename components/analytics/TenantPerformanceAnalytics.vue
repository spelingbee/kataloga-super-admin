<template>
  <div class="tenant-performance">
    <!-- Key Metrics Cards -->
    <div class="tenant-performance__metrics">
      <div class="tenant-performance__metric-card">
        <div class="tenant-performance__metric-label">Total Tenants</div>
        <div class="tenant-performance__metric-value">
          {{ formatNumber(metrics?.totalTenants || 0) }}
        </div>
      </div>

      <div class="tenant-performance__metric-card">
        <div class="tenant-performance__metric-label">Active Tenants</div>
        <div class="tenant-performance__metric-value tenant-performance__metric-value--success">
          {{ formatNumber(metrics?.activeTenants || 0) }}
        </div>
      </div>

      <div class="tenant-performance__metric-card">
        <div class="tenant-performance__metric-label">Retention Rate</div>
        <div class="tenant-performance__metric-value tenant-performance__metric-value--primary">
          {{ formatPercentage(metrics?.retentionRate || 0) }}
        </div>
      </div>

      <div class="tenant-performance__metric-card">
        <div class="tenant-performance__metric-label">Churn Rate</div>
        <div class="tenant-performance__metric-value tenant-performance__metric-value--error">
          {{ formatPercentage(metrics?.churnRate || 0) }}
        </div>
      </div>
    </div>

    <!-- Tenant Growth Chart -->
    <ChartContainer
      title="Tenant Growth Trend"
      description="Total, active, and churned tenants over time"
      :loading="analyticsStore.loading"
      :error="analyticsStore.error"
    >
      <apexchart
        v-if="growthChartOptions"
        type="line"
        height="350"
        :options="growthChartOptions"
        :series="growthChartSeries"
      />
    </ChartContainer>

    <!-- Churn Analysis Chart -->
    <ChartContainer
      title="Churn Analysis"
      description="Monthly churn rate and churned tenant count"
      :loading="analyticsStore.loading"
      :error="analyticsStore.error"
    >
      <apexchart
        v-if="churnChartOptions"
        type="line"
        height="350"
        :options="churnChartOptions"
        :series="churnChartSeries"
      />
    </ChartContainer>

    <!-- Top Performers Table -->
    <ChartContainer
      title="Top Performing Tenants"
      description="Highest revenue generating tenants"
      :loading="analyticsStore.loading"
      :error="analyticsStore.error"
    >
      <div class="tenant-performance__table-wrapper">
        <table class="tenant-performance__table">
          <thead>
            <tr>
              <th>Tenant Name</th>
              <th>Revenue</th>
              <th>Orders</th>
              <th>Growth Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tenant in metrics?.topPerformers || []" :key="tenant.id">
              <td class="tenant-performance__tenant-name">{{ tenant.name }}</td>
              <td class="tenant-performance__revenue">${{ formatNumber(tenant.revenue) }}</td>
              <td>{{ formatNumber(tenant.orderCount) }}</td>
              <td>
                <span
                  :class="[
                    'tenant-performance__growth',
                    tenant.growthRate >= 0 ? 'tenant-performance__growth--positive' : 'tenant-performance__growth--negative'
                  ]"
                >
                  {{ tenant.growthRate >= 0 ? '+' : '' }}{{ formatPercentage(tenant.growthRate) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!metrics?.topPerformers?.length" class="tenant-performance__empty">
          No tenant data available for the selected period
        </div>
      </div>
    </ChartContainer>
  </div>
</template>

<script setup lang="ts">
import { useAnalyticsStore } from '~/stores/analytics'
import ChartContainer from './ChartContainer.vue'

const analyticsStore = useAnalyticsStore()

const metrics = computed(() => analyticsStore.tenantMetrics)

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(value)
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const growthChartSeries = computed(() => {
  if (!metrics.value?.growthTrend) return []

  return [
    {
      name: 'Total Tenants',
      data: metrics.value.growthTrend.map((item) => item.total),
    },
    {
      name: 'Active Tenants',
      data: metrics.value.growthTrend.map((item) => item.active),
    },
    {
      name: 'Churned Tenants',
      data: metrics.value.growthTrend.map((item) => item.churned),
    },
  ]
})

const growthChartOptions = computed(() => {
  if (!metrics.value?.growthTrend) return null

  return {
    chart: {
      type: 'line',
      toolbar: {
        show: true,
      },
    },
    colors: ['#0ea5e9', '#10b981', '#ef4444'],
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
      categories: metrics.value.growthTrend.map((item) =>
        new Date(item.date).toLocaleDateString()
      ),
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

const churnChartSeries = computed(() => {
  if (!metrics.value?.growthTrend) return []

  const churnRateData = metrics.value.growthTrend.map((item) => {
    if (item.total === 0) return 0
    return Number(((item.churned / item.total) * 100).toFixed(1))
  })

  return [
    {
      name: 'Churned Tenants',
      type: 'column',
      data: metrics.value.growthTrend.map((item) => item.churned),
    },
    {
      name: 'Churn Rate (%)',
      type: 'line',
      data: churnRateData,
    },
  ]
})

const churnChartOptions = computed(() => {
  if (!metrics.value?.growthTrend) return null

  return {
    chart: {
      type: 'line',
      toolbar: {
        show: true,
      },
    },
    colors: ['#ef4444', '#f59e0b'],
    stroke: {
      width: [0, 2],
      curve: 'smooth',
    },
    plotOptions: {
      bar: {
        columnWidth: '50%',
      },
    },
    xaxis: {
      categories: metrics.value.growthTrend.map((item) =>
        new Date(item.date).toLocaleDateString()
      ),
    },
    yaxis: [
      {
        title: {
          text: 'Churned Tenants',
        },
        labels: {
          formatter: (value: number) => Math.floor(value).toString(),
        },
      },
      {
        opposite: true,
        title: {
          text: 'Churn Rate (%)',
        },
      },
    ],
    legend: {
      position: 'top',
    },
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.tenant-performance {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.tenant-performance__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.tenant-performance__metric-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.tenant-performance__metric-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.tenant-performance__metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: $text-primary;
}

.tenant-performance__metric-value--success {
  color: $success-color;
}

.tenant-performance__metric-value--primary {
  color: $primary-color;
}

.tenant-performance__metric-value--error {
  color: $error-color;
}

.tenant-performance__table-wrapper {
  overflow-x: auto;
}

.tenant-performance__table {
  width: 100%;
  border-collapse: collapse;

  th {
    padding: $spacing-md;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-secondary;
    background: $bg-secondary;
    border-bottom: 2px solid $border-color;
  }

  td {
    padding: $spacing-md;
    font-size: 0.875rem;
    color: $text-primary;
    border-bottom: 1px solid $border-color;
  }

  tbody tr {
    transition: $transition-base;

    &:hover {
      background: $bg-secondary;
    }
  }
}

.tenant-performance__tenant-name {
  font-weight: 500;
}

.tenant-performance__revenue {
  font-weight: 600;
  color: $success-color;
}

.tenant-performance__growth {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-weight: 600;
  font-size: 0.75rem;
}

.tenant-performance__growth--positive {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.tenant-performance__growth--negative {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.tenant-performance__empty {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
  font-size: 0.875rem;
}

@media (max-width: $breakpoint-md) {
  .tenant-performance__metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .tenant-performance__table {
    font-size: 0.75rem;

    th,
    td {
      padding: $spacing-sm;
    }
  }
}
</style>
