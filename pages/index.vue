<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard__header">
      <div>
        <h1 class="dashboard__title">
          Dashboard
          <Tooltip content="Your central hub for monitoring platform health and key metrics" position="right">
            <HelpButton tour-id="dashboard" aria-label="Start dashboard tour" />
          </Tooltip>
        </h1>
        <p class="dashboard__subtitle">
          Welcome back, {{ authStore.user?.firstName }}
        </p>
      </div>
      <div class="dashboard__actions">
        <Tooltip content="View help and documentation">
          <NuxtLink to="/help" class="btn btn--secondary">
            <AppIcon name="help-circle" />
            Help
          </NuxtLink>
        </Tooltip>
        <button 
          @click="refreshData" 
          class="btn btn--secondary"
          :disabled="dashboardStore.loading"
        >
          <AppIcon name="refresh" :class="{ 'animate-spin': dashboardStore.loading }" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="dashboardStore.error" class="alert alert--error">
      <AppIcon name="alert-circle" />
      <span>{{ dashboardStore.error }}</span>
      <button @click="dashboardStore.clearError" class="alert__close">
        <AppIcon name="x" />
      </button>
    </div>

    <!-- Metrics Grid -->
    <div class="dashboard__metrics dashboard-overview">
      <template v-if="dashboardStore.loading && !dashboardStore.hasData">
        <MetricCardSkeleton v-for="i in 8" :key="i" />
      </template>
      
      <template v-else-if="dashboardStore.metrics">
        <!-- Tenant Metrics -->
        <MetricCard
          title="Total Tenants"
          :value="dashboardStore.metrics.tenants.total"
          icon="tenants"
          variant="primary"
          :trend="dashboardStore.metrics.tenants.growth"
          format="number"
        />
        
        <MetricCard
          title="Active Tenants"
          :value="dashboardStore.metrics.tenants.active"
          icon="check-circle"
          variant="success"
          format="number"
        />
        
        <MetricCard
          title="Pending Registrations"
          :value="dashboardStore.metrics.tenants.pending"
          icon="clock"
          variant="warning"
          format="number"
        />
        
        <MetricCard
          title="Suspended"
          :value="dashboardStore.metrics.tenants.suspended"
          icon="alert-triangle"
          variant="danger"
          format="number"
        />

        <!-- Revenue Metrics -->
        <MetricCard
          title="Monthly Recurring Revenue"
          :value="dashboardStore.metrics.revenue.mrr"
          icon="dollar-sign"
          variant="success"
          :trend="dashboardStore.metrics.revenue.growth"
          format="currency"
        />
        
        <MetricCard
          title="Annual Recurring Revenue"
          :value="dashboardStore.metrics.revenue.arr"
          icon="trending-up"
          variant="primary"
          format="currency"
        />
        
        <MetricCard
          title="Churn Rate"
          :value="dashboardStore.metrics.revenue.churnRate"
          icon="trending-down"
          variant="danger"
          format="percentage"
        />

        <!-- Registration Metrics -->
        <MetricCard
          title="Registrations This Month"
          :value="dashboardStore.metrics.registrations.thisMonth"
          icon="user-plus"
          variant="info"
          format="number"
          :subtitle="`${dashboardStore.metrics.registrations.thisWeek} this week`"
        />
      </template>
    </div>

    <!-- System Health & Recent Activity -->
    <div class="dashboard__bottom">
      <!-- System Health -->
      <div class="dashboard__section">
        <h2 class="dashboard__section-title">
          System Health
          <Tooltip content="Monitor API uptime, database status, and email delivery rates" position="bottom">
            <HelpButton doc-link="/docs/system-health" />
          </Tooltip>
        </h2>
        <div v-if="dashboardStore.loading && !dashboardStore.systemHealth" class="dashboard__section-loading">
          <div class="skeleton-pulse" style="height: 200px; border-radius: 8px;"></div>
        </div>
        <DashboardSystemHealth v-else-if="dashboardStore.systemHealth" :health="dashboardStore.systemHealth" />
      </div>

      <!-- Recent Activity -->
      <div class="dashboard__section recent-activity">
        <h2 class="dashboard__section-title">
          Recent Activity
          <Tooltip content="View the latest tenant registrations and important events" position="bottom">
            <HelpButton doc-link="/docs/activity-feed" />
          </Tooltip>
        </h2>
        <div v-if="dashboardStore.loading && dashboardStore.recentActivity.length === 0" class="dashboard__section-loading">
          <div class="skeleton-pulse" style="height: 200px; border-radius: 8px;"></div>
        </div>
        <DashboardActivityFeed v-else :activities="dashboardStore.recentActivity" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useDashboardStore } from '~/stores/dashboard'

definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

let autoRefreshInterval: NodeJS.Timeout | null = null

// Fetch dashboard data on mount
onMounted(async () => {
  try {
    await dashboardStore.fetchDashboardData()
    // Start auto-refresh
    autoRefreshInterval = dashboardStore.startAutoRefresh()
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
})

// Clean up on unmount
onUnmounted(() => {
  if (autoRefreshInterval) {
    dashboardStore.stopAutoRefresh(autoRefreshInterval)
  }
})

const refreshData = async () => {
  try {
    await dashboardStore.fetchDashboardData(true)
  } catch (error) {
    console.error('Failed to refresh dashboard:', error)
  }
}
</script>

<style scoped lang="scss">
.dashboard {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  &__subtitle {
    margin-top: 0.5rem;
    color: #6b7280;
    font-size: 1rem;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  &__bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }

  &__section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &__section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  &__section-loading {
    margin-top: 1rem;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  }
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;

  &--error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  &__close {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      opacity: 0.7;
    }
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.skeleton-pulse {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #e5e7eb 50%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
