<template>
  <div class="audit-page">
    <div class="audit-page__header">
      <h1 class="audit-page__title">Audit & Security</h1>
      <p class="audit-page__subtitle">
        Monitor administrative actions and security events
      </p>
    </div>

    <div class="audit-page__cards">
      <!-- Audit Logs Card -->
      <div class="audit-page__card" @click="navigateTo('/audit/logs')">
        <div class="audit-page__card-icon audit-page__card-icon--logs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="audit-page__card-title">Audit Logs</h3>
        <p class="audit-page__card-description">
          View detailed logs of all administrative actions
        </p>
        <div class="audit-page__card-arrow">→</div>
      </div>

      <!-- Analytics Card -->
      <div class="audit-page__card" @click="navigateTo('/audit/analytics')">
        <div class="audit-page__card-icon audit-page__card-icon--analytics">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="audit-page__card-title">Audit Analytics</h3>
        <p class="audit-page__card-description">
          Analyze user activity and action trends
        </p>
        <div class="audit-page__card-arrow">→</div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div v-if="analytics" class="audit-page__stats">
      <h2 class="audit-page__stats-title">Quick Statistics</h2>
      <div class="audit-page__stats-grid">
        <div class="audit-page__stat">
          <div class="audit-page__stat-label">Total Actions (Last 30 Days)</div>
          <div class="audit-page__stat-value">{{ formatNumber(analytics.totalActions) }}</div>
        </div>
        <div class="audit-page__stat">
          <div class="audit-page__stat-label">Success Rate</div>
          <div class="audit-page__stat-value audit-page__stat-value--success">
            {{ formatPercentage(analytics.successRate) }}
          </div>
        </div>
        <div class="audit-page__stat">
          <div class="audit-page__stat-label">Active Users</div>
          <div class="audit-page__stat-value">{{ analytics.userActivityMetrics.length }}</div>
        </div>
        <div class="audit-page__stat">
          <div class="audit-page__stat-label">Recent Failures</div>
          <div class="audit-page__stat-value audit-page__stat-value--error">
            {{ analytics.recentFailures.length }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuditStore } from '~/stores/audit'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const auditStore = useAuditStore()

const analytics = computed(() => auditStore.analytics)

function navigateTo(path: string): void {
  router.push(path)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

// Fetch analytics on mount
onMounted(async () => {
  try {
    // Fetch last 30 days analytics
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    await auditStore.fetchAnalytics(
      thirtyDaysAgo.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    )
  } catch (error) {
    console.error('Failed to fetch audit analytics:', error)
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.audit-page {
  padding: $spacing-lg;
}

.audit-page__header {
  margin-bottom: $spacing-xl;
}

.audit-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.audit-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.audit-page__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.audit-page__card {
  position: relative;
  padding: $spacing-xl;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
}

.audit-page__card-icon {
  width: 48px;
  height: 48px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-md;

  svg {
    width: 28px;
    height: 28px;
  }
}

.audit-page__card-icon--logs {
  background: lighten($primary-color, 45%);
  color: $primary-color;
}

.audit-page__card-icon--analytics {
  background: lighten($success-color, 45%);
  color: $success-color;
}

.audit-page__card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.audit-page__card-description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-md;
}

.audit-page__card-arrow {
  position: absolute;
  top: $spacing-lg;
  right: $spacing-lg;
  font-size: 1.5rem;
  color: $text-secondary;
  transition: $transition-base;
}

.audit-page__card:hover .audit-page__card-arrow {
  transform: translateX(4px);
  color: $primary-color;
}

.audit-page__stats {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-sm;
}

.audit-page__stats-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-lg;
}

.audit-page__stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
}

.audit-page__stat {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.audit-page__stat-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.audit-page__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
}

.audit-page__stat-value--success {
  color: $success-color;
}

.audit-page__stat-value--error {
  color: $error-color;
}

@media (max-width: $breakpoint-md) {
  .audit-page__cards {
    grid-template-columns: 1fr;
  }

  .audit-page__stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
