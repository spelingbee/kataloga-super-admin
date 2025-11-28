<template>
  <div class="geographic-distribution">
    <ChartContainer
      title="Geographic Distribution"
      description="Regional breakdown and performance by region"
      :loading="loading"
      :error="error"
    >
      <div v-if="geoData" class="geographic-distribution__content">
        <div class="geographic-distribution__top-regions">
          <h4 class="geographic-distribution__section-title">Top Regions</h4>
          <div class="geographic-distribution__top-list">
            <div
              v-for="(region, index) in geoData.topRegions"
              :key="region.country"
              class="geographic-distribution__top-item"
            >
              <div class="geographic-distribution__top-rank">{{ index + 1 }}</div>
              <div class="geographic-distribution__top-info">
                <span class="geographic-distribution__top-country">{{ region.country }}</span>
                <div class="geographic-distribution__top-metrics">
                  <span class="geographic-distribution__top-metric">
                    {{ region.tenantCount }} tenants
                  </span>
                  <span class="geographic-distribution__top-metric">
                    ${{ formatRevenue(region.revenue) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="geographic-distribution__regions">
          <h4 class="geographic-distribution__section-title">All Regions</h4>
          <div class="geographic-distribution__table-wrapper">
            <table class="geographic-distribution__table">
              <thead>
                <tr>
                  <th class="geographic-distribution__header">Country</th>
                  <th class="geographic-distribution__header">Tenants</th>
                  <th class="geographic-distribution__header">Revenue</th>
                  <th class="geographic-distribution__header">Share</th>
                  <th class="geographic-distribution__header">Growth</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="region in geoData.regions"
                  :key="region.countryCode"
                  class="geographic-distribution__row"
                >
                  <td class="geographic-distribution__cell geographic-distribution__cell--country">
                    <span class="geographic-distribution__flag">{{ getCountryFlag(region.countryCode) }}</span>
                    <span>{{ region.country }}</span>
                  </td>
                  <td class="geographic-distribution__cell">
                    {{ region.tenantCount }}
                  </td>
                  <td class="geographic-distribution__cell">
                    ${{ formatRevenue(region.revenue) }}
                  </td>
                  <td class="geographic-distribution__cell">
                    <div class="geographic-distribution__percentage-bar">
                      <div
                        class="geographic-distribution__percentage-fill"
                        :style="{ width: `${region.percentage}%` }"
                      />
                      <span class="geographic-distribution__percentage-text">
                        {{ region.percentage.toFixed(1) }}%
                      </span>
                    </div>
                  </td>
                  <td class="geographic-distribution__cell">
                    <span
                      class="geographic-distribution__growth"
                      :class="{
                        'geographic-distribution__growth--positive': region.growthRate > 0,
                        'geographic-distribution__growth--negative': region.growthRate < 0,
                      }"
                    >
                      {{ region.growthRate > 0 ? '+' : '' }}{{ region.growthRate.toFixed(1) }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="geoData.trends.length > 0" class="geographic-distribution__trends">
          <h4 class="geographic-distribution__section-title">Geographic Trends</h4>
          <div class="geographic-distribution__trends-chart">
            <canvas ref="trendsChartRef"/>
          </div>
        </div>
      </div>
    </ChartContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAnalyticsStore } from '~/stores/analytics'
import ChartContainer from './ChartContainer.vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const analyticsStore = useAnalyticsStore()

const loading = computed(() => analyticsStore.loading)
const error = computed(() => analyticsStore.error)
const geoData = computed(() => analyticsStore.geographicMetrics)

const trendsChartRef = ref<HTMLCanvasElement | null>(null)
let trendsChart: Chart | null = null

const formatRevenue = (revenue: number): string => {
  if (revenue >= 1000000) {
    return `${(revenue / 1000000).toFixed(1)}M`
  }
  if (revenue >= 1000) {
    return `${(revenue / 1000).toFixed(1)}K`
  }
  return revenue.toFixed(0)
}

const getCountryFlag = (countryCode: string): string => {
  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

const createTrendsChart = () => {
  if (!trendsChartRef.value || !geoData.value) return

  // Destroy existing chart
  if (trendsChart) {
    trendsChart.destroy()
  }

  // Group trends by country
  const countries = [...new Set(geoData.value.trends.map(t => t.country))]
  const dates = [...new Set(geoData.value.trends.map(t => t.date))].sort()

  const datasets = countries.map((country, index) => {
    const countryTrends = geoData.value!.trends.filter(t => t.country === country)
    const data = dates.map(date => {
      const trend = countryTrends.find(t => t.date === date)
      return trend ? trend.tenantCount : 0
    })

    const colors = [
      'rgba(14, 165, 233, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(139, 92, 246, 0.8)',
    ]

    return {
      label: country,
      data,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace('0.8', '0.2'),
      tension: 0.4,
      fill: false,
    }
  })

  trendsChart = new Chart(trendsChartRef.value, {
    type: 'line',
    data: {
      labels: dates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Tenant Count',
          },
        },
      },
    },
  })
}

watch(geoData, () => {
  if (geoData.value && trendsChartRef.value) {
    createTrendsChart()
  }
})

onMounted(async () => {
  if (!geoData.value) {
    try {
      await analyticsStore.fetchGeographicAnalytics()
    } catch (err) {
      console.error('Failed to fetch geographic analytics:', err)
    }
  }

  // Wait for next tick to ensure canvas is rendered
  await nextTick()
  if (geoData.value) {
    createTrendsChart()
  }
})

onUnmounted(() => {
  if (trendsChart) {
    trendsChart.destroy()
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.geographic-distribution__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.geographic-distribution__section-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.geographic-distribution__top-regions {
  padding: $spacing-lg;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.geographic-distribution__top-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-md;
}

.geographic-distribution__top-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-primary;
  border-radius: $radius-md;
  border: 1px solid $border-color;
  transition: $transition-base;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
}

.geographic-distribution__top-rank {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $primary-color, lighten($primary-color, 10%));
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.geographic-distribution__top-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  flex: 1;
}

.geographic-distribution__top-country {
  font-weight: 600;
  color: $text-primary;
  font-size: 0.875rem;
}

.geographic-distribution__top-metrics {
  display: flex;
  gap: $spacing-md;
  font-size: 0.75rem;
  color: $text-secondary;
}

.geographic-distribution__top-metric {
  font-weight: 500;
}

.geographic-distribution__regions {
  display: flex;
  flex-direction: column;
}

.geographic-distribution__table-wrapper {
  overflow-x: auto;
  border-radius: $radius-md;
  border: 1px solid $border-color;
}

.geographic-distribution__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.geographic-distribution__header {
  background: $bg-secondary;
  padding: $spacing-sm $spacing-md;
  text-align: left;
  font-weight: 600;
  color: $text-primary;
  border-bottom: 2px solid $border-color;
  white-space: nowrap;
}

.geographic-distribution__row {
  &:hover {
    background: lighten($bg-secondary, 2%);
  }
}

.geographic-distribution__cell {
  padding: $spacing-sm $spacing-md;
  border-bottom: 1px solid $border-color;
  color: $text-secondary;
}

.geographic-distribution__cell--country {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-weight: 600;
  color: $text-primary;
}

.geographic-distribution__flag {
  font-size: 1.25rem;
}

.geographic-distribution__percentage-bar {
  position: relative;
  width: 100%;
  height: 24px;
  background: lighten($border-color, 5%);
  border-radius: $radius-sm;
  overflow: hidden;
}

.geographic-distribution__percentage-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, $primary-color, lighten($primary-color, 10%));
  transition: $transition-base;
}

.geographic-distribution__percentage-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: $text-primary;
  z-index: 1;
}

.geographic-distribution__growth {
  font-weight: 600;
  font-size: 0.875rem;
}

.geographic-distribution__growth--positive {
  color: $success-color;
}

.geographic-distribution__growth--negative {
  color: $error-color;
}

.geographic-distribution__trends {
  display: flex;
  flex-direction: column;
}

.geographic-distribution__trends-chart {
  height: 300px;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

@media (max-width: $breakpoint-md) {
  .geographic-distribution__top-list {
    grid-template-columns: 1fr;
  }

  .geographic-distribution__table {
    font-size: 0.75rem;
  }

  .geographic-distribution__header,
  .geographic-distribution__cell {
    padding: $spacing-xs $spacing-sm;
  }

  .geographic-distribution__trends-chart {
    height: 250px;
  }
}
</style>
