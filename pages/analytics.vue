<template>
  <div class="analytics-page">
    <div class="analytics-page__header">
      <div class="analytics-page__header-content">
        <div>
          <h1 class="analytics-page__title">Analytics & Reports</h1>
          <p class="analytics-page__subtitle">
            Comprehensive insights into platform performance and growth
          </p>
        </div>
        <ExportMenu
          :date-range="analyticsStore.dateRange"
          :analytics-data="{
            registration: analyticsStore.registrationMetrics,
            tenant: analyticsStore.tenantMetrics,
            revenue: analyticsStore.revenueMetrics,
          }"
        />
      </div>
    </div>

    <DateRangeSelector
      v-model="analyticsStore.dateRange"
      class="analytics-page__date-selector"
      @change="handleDateRangeChange"
    />

    <div v-if="analyticsStore.error" class="analytics-page__error">
      <p>{{ analyticsStore.error }}</p>
      <button @click="refreshData">Retry</button>
    </div>

    <div class="analytics-page__grid">
      <!-- Registration Analytics Section -->
      <div class="analytics-page__section">
        <h2 class="analytics-page__section-title">Registration Analytics</h2>
        <RegistrationAnalytics />
      </div>

      <!-- Tenant Performance Section -->
      <div class="analytics-page__section">
        <h2 class="analytics-page__section-title">Tenant Performance</h2>
        <TenantPerformanceAnalytics />
      </div>

      <!-- Revenue Analytics Section -->
      <div class="analytics-page__section">
        <h2 class="analytics-page__section-title">Revenue Analytics</h2>
        <RevenueAnalytics />
      </div>

      <!-- Conversion Funnel Section -->
      <div class="analytics-page__section">
        <h2 class="analytics-page__section-title">Conversion Funnel</h2>
        <ConversionFunnelAnalytics />
      </div>

      <!-- Cohort Analysis Section -->
      <div class="analytics-page__section">
        <h2 class="analytics-page__section-title">Cohort Analysis</h2>
        <CohortAnalysis />
      </div>

      <!-- Geographic Distribution Section -->
      <div class="analytics-page__section">
        <h2 class="analytics-page__section-title">Geographic Distribution</h2>
        <GeographicDistribution />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnalyticsStore } from '~/stores/analytics'
import DateRangeSelector from '~/components/analytics/DateRangeSelector.vue'
import RegistrationAnalytics from '~/components/analytics/RegistrationAnalytics.vue'
import TenantPerformanceAnalytics from '~/components/analytics/TenantPerformanceAnalytics.vue'
import RevenueAnalytics from '~/components/analytics/RevenueAnalytics.vue'
import ConversionFunnelAnalytics from '~/components/analytics/ConversionFunnelAnalytics.vue'
import CohortAnalysis from '~/components/analytics/CohortAnalysis.vue'
import GeographicDistribution from '~/components/analytics/GeographicDistribution.vue'
import ExportMenu from '~/components/analytics/ExportMenu.vue'
import type { DateRange } from '~/types'

definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const analyticsStore = useAnalyticsStore()

const handleDateRangeChange = async (dateRange: DateRange) => {
  analyticsStore.setDateRange(dateRange)
  await refreshData()
}

const refreshData = async () => {
  try {
    await analyticsStore.fetchAllAnalytics(true)
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  }
}

onMounted(async () => {
  await refreshData()
})

onUnmounted(() => {
  analyticsStore.clearError()
})
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.analytics-page {
  padding: $spacing-lg;
  max-width: 1400px;
  margin: 0 auto;
}

.analytics-page__header {
  margin-bottom: $spacing-xl;
}

.analytics-page__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.analytics-page__title {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.analytics-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.analytics-page__date-selector {
  margin-bottom: $spacing-xl;
}

.analytics-page__error {
  padding: $spacing-lg;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    color: $error-color;
    font-weight: 500;
  }

  button {
    padding: $spacing-sm $spacing-md;
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

.analytics-page__grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.analytics-page__section {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.analytics-page__section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  padding-bottom: $spacing-sm;
  border-bottom: 2px solid $border-color;
}

@media (max-width: $breakpoint-md) {
  .analytics-page {
    padding: $spacing-md;
  }

  .analytics-page__header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .analytics-page__title {
    font-size: 1.5rem;
  }

  .analytics-page__section-title {
    font-size: 1.25rem;
  }
}
</style>
