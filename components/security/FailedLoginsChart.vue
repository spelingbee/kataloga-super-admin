<template>
  <div class="failed-logins-chart">
    <div v-if="!hasData" class="failed-logins-chart__empty">
      <AppIcon name="bar-chart" />
      <p>No failed login data available</p>
    </div>
    <apexchart
      v-else
      type="line"
      height="250"
      :options="chartOptions"
      :series="chartSeries"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TrendData {
  date: string
  count: number
}

interface Props {
  data: TrendData[]
}

const props = defineProps<Props>()

const hasData = computed(() => {
  return props.data && props.data.length > 0
})

const chartSeries = computed(() => {
  return [
    {
      name: 'Failed Logins',
      data: props.data.map(item => item.count),
    },
  ]
})

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'line',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: ['#ef4444'],
    xaxis: {
      categories: props.data.map(item => {
        const date = new Date(item.date)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value: number) => `${value} attempts`,
      },
    },
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.failed-logins-chart {
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-xl;
    color: $text-secondary;
    text-align: center;

    p {
      margin-top: $spacing-sm;
      font-size: 0.875rem;
    }
  }
}
</style>
