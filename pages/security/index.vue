<template>
  <div class="security-dashboard">
    <div class="security-dashboard__header">
      <div>
        <h1 class="security-dashboard__title">Security Dashboard</h1>
        <p class="security-dashboard__subtitle">
          Monitor security events and threats
        </p>
      </div>
      <div class="security-dashboard__actions">
        <button 
          @click="refreshData" 
          class="btn btn--secondary"
          :disabled="securityStore.loading"
        >
          <AppIcon name="refresh" :class="{ 'animate-spin': securityStore.loading }" />
          Refresh
        </button>
      </div>
    </div>

    <div v-if="securityStore.error" class="alert alert--error">
      <AppIcon name="alert-circle" />
      <span>{{ securityStore.error }}</span>
      <button @click="securityStore.clearError" class="alert__close">
        <AppIcon name="x" />
      </button>
    </div>

    <div class="security-dashboard__metrics">
      <template v-if="securityStore.loading && !securityStore.dashboardMetrics">
        <MetricCardSkeleton v-for="i in 4" :key="i" />
      </template>
      
      <template v-else-if="securityStore.dashboardMetrics">
        <MetricCard
          title="Failed Login Attempts (24h)"
          :value="securityStore.dashboardMetrics.failedLoginAttempts.last24Hours"
          icon="alert-triangle"
          variant="warning"
          format="number"
          :subtitle="`${securityStore.dashboardMetrics.failedLoginAttempts.total} total`"
        />
        
        <MetricCard
          title="Blocked IPs"
          :value="securityStore.dashboardMetrics.blockedIPs.active"
          icon="shield-off"
          variant="danger"
          format="number"
          :subtitle="`${securityStore.dashboardMetrics.blockedIPs.total} total`"
        />
        
        <MetricCard
          title="Suspicious Activities"
          :value="securityStore.dashboardMetrics.suspiciousActivity.highRisk"
          icon="alert-octagon"
          variant="danger"
          format="number"
          :subtitle="`${securityStore.dashboardMetrics.suspiciousActivity.total} total`"
        />
        
        <MetricCard
          title="Security Events"
          :value="securityStore.dashboardMetrics.securityEvents.critical"
          icon="shield"
          variant="danger"
          format="number"
          :subtitle="`${securityStore.dashboardMetrics.securityEvents.total} total events`"
        />
      </template>
    </div>

    <div class="security-dashboard__content">
      <div class="security-dashboard__section">
        <div class="security-dashboard__section-header">
          <h2 class="security-dashboard__section-title">Failed Login Attempts</h2>
          <NuxtLink to="/security/events?type=failed_login" class="link">
            View All
            <AppIcon name="arrow-right" />
          </NuxtLink>
        </div>
        <div v-if="securityStore.loading && !securityStore.dashboardMetrics" class="skeleton-pulse" style="height: 250px; border-radius: 8px;"></div>
        <SecurityFailedLoginsChart 
          v-else-if="securityStore.dashboardMetrics" 
          :data="securityStore.dashboardMetrics.failedLoginAttempts.trend" 
        />
      </div>

      <div class="security-dashboard__section">
        <div class="security-dashboard__section-header">
          <h2 class="security-dashboard__section-title">Recent Security Alerts</h2>
          <NuxtLink to="/security/events" class="link">
            View All
            <AppIcon name="arrow-right" />
          </NuxtLink>
        </div>
        <div v-if="securityStore.loading && !securityStore.dashboardMetrics" class="skeleton-pulse" style="height: 250px; border-radius: 8px;"></div>
        <SecurityAlertsList 
          v-else-if="securityStore.dashboardMetrics" 
          :alerts="securityStore.dashboardMetrics.recentAlerts" 
        />
      </div>
    </div>

    <div class="security-dashboard__quick-links">
      <h2 class="security-dashboard__section-title">Quick Actions</h2>
      <div class="security-dashboard__links-grid">
        <NuxtLink to="/security/events" class="quick-link">
          <AppIcon name="alert-circle" />
          <div>
            <h3 class="quick-link__title">Security Events</h3>
            <p class="quick-link__description">View and manage security events</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/security/blocked-ips" class="quick-link">
          <AppIcon name="shield-off" />
          <div>
            <h3 class="quick-link__title">Blocked IPs</h3>
            <p class="quick-link__description">Manage blocked IP addresses</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/security/suspicious-activity" class="quick-link">
          <AppIcon name="alert-octagon" />
          <div>
            <h3 class="quick-link__title">Suspicious Activity</h3>
            <p class="quick-link__description">Monitor fraud detection results</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/audit/logs" class="quick-link">
          <AppIcon name="file-text" />
          <div>
            <h3 class="quick-link__title">Audit Logs</h3>
            <p class="quick-link__description">View system audit trail</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSecurityStore } from '~/stores/security'

definePageMeta({
  middleware: 'auth',
})

const securityStore = useSecurityStore()

onMounted(async () => {
  try {
    await securityStore.fetchDashboardMetrics()
  } catch (error) {
    console.error('Failed to load security dashboard:', error)
  }
})

const refreshData = async () => {
  try {
    await securityStore.fetchDashboardMetrics()
  } catch (error) {
    console.error('Failed to refresh security dashboard:', error)
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.security-dashboard {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-xl;
    gap: $spacing-md;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
  }

  &__subtitle {
    margin-top: $spacing-sm;
    color: $text-secondary;
    font-size: 1rem;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: $spacing-lg;
    margin-bottom: $spacing-xl;
  }

  &__content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-lg;
    margin-bottom: $spacing-xl;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }

  &__section {
    background: $bg-primary;
    border-radius: $radius-lg;
    padding: $spacing-lg;
    box-shadow: $shadow-sm;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
  }

  &__section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  &__quick-links {
    background: $bg-primary;
    border-radius: $radius-lg;
    padding: $spacing-lg;
    box-shadow: $shadow-sm;
  }

  &__links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: $spacing-md;
    margin-top: $spacing-md;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  font-weight: 500;
  font-size: 0.875rem;
  transition: $transition-base;
  border: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--secondary {
    background: $bg-primary;
    color: $text-primary;
    border: 1px solid $border-color;

    &:hover:not(:disabled) {
      background: $bg-secondary;
      border-color: $border-dark;
    }
  }
}

.alert {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;

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
    padding: $spacing-xs;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      opacity: 0.7;
    }
  }
}

.link {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  color: $primary-color;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: $transition-base;

  &:hover {
    color: darken($primary-color, 10%);
  }
}

.quick-link {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  text-decoration: none;
  color: $text-primary;
  transition: $transition-base;

  &:hover {
    border-color: $primary-color;
    background: $bg-secondary;
  }

  &__title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 $spacing-xs 0;
    color: $text-primary;
  }

  &__description {
    font-size: 0.875rem;
    color: $text-secondary;
    margin: 0;
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
    $bg-secondary 0%,
    darken($bg-secondary, 3%) 50%,
    $bg-secondary 100%
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
