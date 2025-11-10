<template>
  <div class="conversion-funnel">
    <ChartContainer
      title="Conversion Funnel"
      description="Registration to activation flow with drop-off rates"
      :loading="loading"
      :error="error"
    >
      <div v-if="funnelData" class="conversion-funnel__content">
        <div class="conversion-funnel__stages">
          <div
            v-for="(stage, index) in funnelData.stages"
            :key="index"
            class="conversion-funnel__stage"
          >
            <div
              class="conversion-funnel__stage-bar"
              :style="{ width: `${stage.percentage}%` }"
            >
              <div class="conversion-funnel__stage-info">
                <span class="conversion-funnel__stage-name">{{ stage.name }}</span>
                <span class="conversion-funnel__stage-count">{{ stage.count.toLocaleString() }}</span>
              </div>
            </div>
            <div class="conversion-funnel__stage-metrics">
              <span class="conversion-funnel__stage-percentage">{{ stage.percentage.toFixed(1) }}%</span>
              <span
                v-if="index > 0"
                class="conversion-funnel__stage-dropoff"
              >
                -{{ stage.dropOffRate.toFixed(1) }}% drop-off
              </span>
            </div>
          </div>
        </div>

        <div class="conversion-funnel__summary">
          <div class="conversion-funnel__summary-item">
            <span class="conversion-funnel__summary-label">Total Started</span>
            <span class="conversion-funnel__summary-value">{{ funnelData.totalStarted.toLocaleString() }}</span>
          </div>
          <div class="conversion-funnel__summary-item">
            <span class="conversion-funnel__summary-label">Total Completed</span>
            <span class="conversion-funnel__summary-value">{{ funnelData.totalCompleted.toLocaleString() }}</span>
          </div>
          <div class="conversion-funnel__summary-item">
            <span class="conversion-funnel__summary-label">Overall Conversion</span>
            <span class="conversion-funnel__summary-value conversion-funnel__summary-value--highlight">
              {{ funnelData.overallConversionRate.toFixed(1) }}%
            </span>
          </div>
        </div>

        <div v-if="funnelData.insights.length > 0" class="conversion-funnel__insights">
          <h4 class="conversion-funnel__insights-title">Optimization Insights</h4>
          <div
            v-for="(insight, index) in funnelData.insights"
            :key="index"
            class="conversion-funnel__insight"
          >
            <div class="conversion-funnel__insight-icon">💡</div>
            <div class="conversion-funnel__insight-content">
              <strong>{{ insight.bottleneck }}</strong>
              <p>{{ insight.recommendation }}</p>
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
const funnelData = computed(() => analyticsStore.conversionFunnelMetrics)

onMounted(async () => {
  if (!funnelData.value) {
    try {
      await analyticsStore.fetchConversionFunnelAnalytics()
    } catch (err) {
      console.error('Failed to fetch conversion funnel analytics:', err)
    }
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.conversion-funnel__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.conversion-funnel__stages {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.conversion-funnel__stage {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.conversion-funnel__stage-bar {
  background: linear-gradient(90deg, $primary-color, lighten($primary-color, 10%));
  border-radius: $radius-md;
  padding: $spacing-md;
  transition: $transition-base;
  min-width: 200px;

  &:hover {
    transform: translateX(4px);
    box-shadow: $shadow-md;
  }
}

.conversion-funnel__stage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.conversion-funnel__stage-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.conversion-funnel__stage-count {
  font-weight: 700;
  font-size: 1.125rem;
}

.conversion-funnel__stage-metrics {
  display: flex;
  gap: $spacing-md;
  padding-left: $spacing-sm;
  font-size: 0.875rem;
}

.conversion-funnel__stage-percentage {
  color: $text-primary;
  font-weight: 600;
}

.conversion-funnel__stage-dropoff {
  color: $error-color;
  font-weight: 500;
}

.conversion-funnel__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  padding: $spacing-lg;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.conversion-funnel__summary-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.conversion-funnel__summary-label {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 500;
}

.conversion-funnel__summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
}

.conversion-funnel__summary-value--highlight {
  color: $success-color;
}

.conversion-funnel__insights {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.conversion-funnel__insights-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.conversion-funnel__insight {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: lighten($info-color, 45%);
  border-left: 3px solid $info-color;
  border-radius: $radius-sm;
}

.conversion-funnel__insight-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.conversion-funnel__insight-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  strong {
    color: $text-primary;
    font-size: 0.875rem;
  }

  p {
    color: $text-secondary;
    font-size: 0.875rem;
    margin: 0;
  }
}

@media (max-width: $breakpoint-md) {
  .conversion-funnel__summary {
    grid-template-columns: 1fr;
  }

  .conversion-funnel__stage-bar {
    min-width: 150px;
  }
}
</style>
