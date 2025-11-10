<template>
  <div class="email-dashboard">
    <div class="email-dashboard__header">
      <h1 class="email-dashboard__title">Email Management</h1>
      <p class="email-dashboard__subtitle">Monitor email delivery and engagement metrics</p>
    </div>

    <!-- Dashboard Metrics -->
    <div v-if="emailStore.dashboardMetrics" class="email-dashboard__metrics">
      <div class="email-dashboard__metric-card">
        <div class="email-dashboard__metric-label">Total Sent</div>
        <div class="email-dashboard__metric-value">
          {{ formatNumber(emailStore.dashboardMetrics.totalSent) }}
        </div>
      </div>

      <div class="email-dashboard__metric-card">
        <div class="email-dashboard__metric-label">Delivery Rate</div>
        <div class="email-dashboard__metric-value email-dashboard__metric-value--success">
          {{ formatPercentage(emailStore.dashboardMetrics.deliveryRate) }}
        </div>
        <div class="email-dashboard__metric-detail">
          {{ formatNumber(emailStore.dashboardMetrics.delivered) }} delivered
        </div>
      </div>

      <div class="email-dashboard__metric-card">
        <div class="email-dashboard__metric-label">Open Rate</div>
        <div class="email-dashboard__metric-value email-dashboard__metric-value--primary">
          {{ formatPercentage(emailStore.dashboardMetrics.openRate) }}
        </div>
        <div class="email-dashboard__metric-detail">
          {{ formatNumber(emailStore.dashboardMetrics.opened) }} opened
        </div>
      </div>

      <div class="email-dashboard__metric-card">
        <div class="email-dashboard__metric-label">Click Rate</div>
        <div class="email-dashboard__metric-value email-dashboard__metric-value--info">
          {{ formatPercentage(emailStore.dashboardMetrics.clickRate) }}
        </div>
        <div class="email-dashboard__metric-detail">
          {{ formatNumber(emailStore.dashboardMetrics.clicked) }} clicked
        </div>
      </div>

      <div class="email-dashboard__metric-card">
        <div class="email-dashboard__metric-label">Bounce Rate</div>
        <div class="email-dashboard__metric-value email-dashboard__metric-value--warning">
          {{ formatPercentage(emailStore.dashboardMetrics.bounceRate) }}
        </div>
        <div class="email-dashboard__metric-detail">
          {{ formatNumber(emailStore.dashboardMetrics.bounced) }} bounced
        </div>
      </div>

      <div class="email-dashboard__metric-card">
        <div class="email-dashboard__metric-label">Failed</div>
        <div class="email-dashboard__metric-value email-dashboard__metric-value--error">
          {{ formatNumber(emailStore.dashboardMetrics.failed) }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="emailStore.loading" class="email-dashboard__loading">
      <div class="email-dashboard__skeleton-grid">
        <div v-for="i in 6" :key="i" class="email-dashboard__skeleton-card" />
      </div>
    </div>

    <!-- Email Volume Chart -->
    <ChartContainer
      title="Email Volume Trend"
      description="Email delivery and engagement over time"
      :loading="emailStore.loading"
      :error="emailStore.error"
    >
      <apexchart
        v-if="volumeChartOptions"
        type="line"
        height="350"
        :options="volumeChartOptions"
        :series="volumeChartSeries"
      />
    </ChartContainer>

    <!-- Email Type and Status Breakdown -->
    <div class="email-dashboard__breakdown">
      <ChartContainer
        title="Email Types"
        description="Distribution by email type"
        :loading="emailStore.loading"
        :error="emailStore.error"
      >
        <apexchart
          v-if="typeChartOptions"
          type="donut"
          height="300"
          :options="typeChartOptions"
          :series="typeChartSeries"
        />
      </ChartContainer>

      <ChartContainer
        title="Email Status"
        description="Distribution by delivery status"
        :loading="emailStore.loading"
        :error="emailStore.error"
      >
        <apexchart
          v-if="statusChartOptions"
          type="donut"
          height="300"
          :options="statusChartOptions"
          :series="statusChartSeries"
        />
      </ChartContainer>
    </div>

    <!-- Quick Actions -->
    <div class="email-dashboard__actions">
      <NuxtLink to="/emails/list" class="email-dashboard__action-button">
        View All Emails
      </NuxtLink>
      <button
        class="email-dashboard__action-button email-dashboard__action-button--secondary"
        @click="refreshDashboard"
      >
        Refresh Data
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmailStore } from '~/stores/email'
import ChartContainer from '~/components/analytics/ChartContainer.vue'

const emailStore = useEmailStore()

// Fetch dashboard metrics on mount
onMounted(async () => {
  try {
    await emailStore.fetchDashboardMetrics()
  } catch (error) {
    console.error('Failed to load email dashboard:', error)
  }
})

// Format helpers
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value)
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

// Volume Chart
const volumeChartSeries = computed(() => {
  if (!emailStore.dashboardMetrics?.volumeTrend) return []
  
  return [
    {
      name: 'Sent',
      data: emailStore.dashboardMetrics.volumeTrend.map(d => d.sent),
    },
    {
      name: 'Delivered',
      data: emailStore.dashboardMetrics.volumeTrend.map(d => d.delivered),
    },
    {
      name: 'Opened',
      data: emailStore.dashboardMetrics.volumeTrend.map(d => d.opened),
    },
    {
      name: 'Clicked',
      data: emailStore.dashboardMetrics.volumeTrend.map(d => d.clicked),
    },
  ]
})

const volumeChartOptions = computed(() => {
  if (!emailStore.dashboardMetrics?.volumeTrend) return null
  
  return {
    chart: {
      type: 'line',
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    colors: ['#64748b', '#10b981', '#3b82f6', '#8b5cf6'],
    xaxis: {
      categories: emailStore.dashboardMetrics.volumeTrend.map(d => 
        new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
    },
    yaxis: {
      title: { text: 'Email Count' },
    },
    legend: {
      position: 'top',
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  }
})

// Type Chart
const typeChartSeries = computed(() => {
  if (!emailStore.dashboardMetrics?.typeBreakdown) return []
  return emailStore.dashboardMetrics.typeBreakdown.map(t => t.count)
})

const typeChartOptions = computed(() => {
  if (!emailStore.dashboardMetrics?.typeBreakdown) return null
  
  return {
    chart: {
      type: 'donut',
    },
    labels: emailStore.dashboardMetrics.typeBreakdown.map(t => 
      t.type.charAt(0).toUpperCase() + t.type.slice(1)
    ),
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],
    legend: {
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
            },
          },
        },
      },
    },
  }
})

// Status Chart
const statusChartSeries = computed(() => {
  if (!emailStore.dashboardMetrics?.statusBreakdown) return []
  return emailStore.dashboardMetrics.statusBreakdown.map(s => s.count)
})

const statusChartOptions = computed(() => {
  if (!emailStore.dashboardMetrics?.statusBreakdown) return null
  
  return {
    chart: {
      type: 'donut',
    },
    labels: emailStore.dashboardMetrics.statusBreakdown.map(s => 
      s.status.charAt(0).toUpperCase() + s.status.slice(1)
    ),
    colors: ['#64748b', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
    legend: {
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
            },
          },
        },
      },
    },
  }
})

// Refresh dashboard
const refreshDashboard = async () => {
  try {
    await emailStore.fetchDashboardMetrics(true)
  } catch (error) {
    console.error('Failed to refresh dashboard:', error)
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.email-dashboard {
  padding: $spacing-xl;
}

.email-dashboard__header {
  margin-bottom: $spacing-xl;
}

.email-dashboard__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-dashboard__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.email-dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.email-dashboard__metric-card {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.email-dashboard__metric-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.email-dashboard__metric-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-dashboard__metric-value--success {
  color: $success-color;
}

.email-dashboard__metric-value--primary {
  color: $primary-color;
}

.email-dashboard__metric-value--info {
  color: $info-color;
}

.email-dashboard__metric-value--warning {
  color: $warning-color;
}

.email-dashboard__metric-value--error {
  color: $error-color;
}

.email-dashboard__metric-detail {
  font-size: 0.75rem;
  color: $text-light;
}

.email-dashboard__loading {
  margin-bottom: $spacing-xl;
}

.email-dashboard__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
}

.email-dashboard__skeleton-card {
  background: linear-gradient(90deg, $bg-secondary 25%, $bg-primary 50%, $bg-secondary 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: $radius-lg;
  height: 120px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.email-dashboard__breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.email-dashboard__actions {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
}

.email-dashboard__action-button {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background $transition-base;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

.email-dashboard__action-button--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

@media (max-width: $breakpoint-md) {
  .email-dashboard {
    padding: $spacing-lg;
  }
  
  .email-dashboard__metrics {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .email-dashboard__breakdown {
    grid-template-columns: 1fr;
  }
  
  .email-dashboard__actions {
    flex-direction: column;
  }
}
</style>
