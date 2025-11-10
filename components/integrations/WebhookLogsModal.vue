<template>
  <AppModal
    :show="true"
    title="Webhook Logs"
    size="xlarge"
    @close="$emit('close')"
  >
    <div class="webhook-logs">
      <div v-if="loading" class="webhook-logs__loading">
        <div class="spinner"></div>
        <p>Loading logs...</p>
      </div>

      <div v-else-if="error" class="webhook-logs__error">
        <p>{{ error }}</p>
        <button @click="loadLogs" class="btn btn--primary btn--sm">
          Retry
        </button>
      </div>

      <div v-else-if="logs.length === 0" class="webhook-logs__empty">
        <AppIcon name="file-text" class="webhook-logs__empty-icon" />
        <p>No logs found</p>
      </div>

      <div v-else class="webhook-logs__content">
        <!-- Logs Table -->
        <div class="logs-table">
          <div class="logs-table__header">
            <div class="logs-table__cell logs-table__cell--timestamp">Timestamp</div>
            <div class="logs-table__cell logs-table__cell--event">Event</div>
            <div class="logs-table__cell logs-table__cell--status">Status</div>
            <div class="logs-table__cell logs-table__cell--attempt">Attempt</div>
            <div class="logs-table__cell logs-table__cell--duration">Duration</div>
            <div class="logs-table__cell logs-table__cell--actions">Actions</div>
          </div>

          <div
            v-for="log in logs"
            :key="log.id"
            class="logs-table__row"
          >
            <div class="logs-table__cell logs-table__cell--timestamp">
              {{ formatDate(log.timestamp) }}
            </div>
            <div class="logs-table__cell logs-table__cell--event">
              <span class="event-badge">{{ log.event }}</span>
            </div>
            <div class="logs-table__cell logs-table__cell--status">
              <span
                :class="[
                  'status-badge',
                  `status-badge--${getStatusColor(log.status)}`,
                ]"
              >
                {{ log.status }}
              </span>
              <span v-if="log.statusCode" class="status-code">
                {{ log.statusCode }}
              </span>
            </div>
            <div class="logs-table__cell logs-table__cell--attempt">
              {{ log.attempt }}
            </div>
            <div class="logs-table__cell logs-table__cell--duration">
              {{ log.duration ? `${log.duration}ms` : '-' }}
            </div>
            <div class="logs-table__cell logs-table__cell--actions">
              <button
                @click="viewLogDetails(log)"
                class="btn btn--secondary btn--sm"
              >
                <AppIcon name="eye" />
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Details Modal -->
    <AppModal
      v-if="selectedLog"
      :show="true"
      title="Log Details"
      size="large"
      @close="selectedLog = null"
    >
      <div class="log-details">
        <!-- Basic Info -->
        <div class="log-details__section">
          <h3 class="log-details__title">Basic Information</h3>
          <div class="log-details__grid">
            <div class="log-details__item">
              <span class="log-details__label">Webhook:</span>
              <span class="log-details__value">{{ selectedLog.webhookName }}</span>
            </div>
            <div class="log-details__item">
              <span class="log-details__label">Event:</span>
              <span class="log-details__value">{{ selectedLog.event }}</span>
            </div>
            <div class="log-details__item">
              <span class="log-details__label">Status:</span>
              <span
                :class="[
                  'status-badge',
                  `status-badge--${getStatusColor(selectedLog.status)}`,
                ]"
              >
                {{ selectedLog.status }}
              </span>
            </div>
            <div class="log-details__item">
              <span class="log-details__label">Status Code:</span>
              <span class="log-details__value">{{ selectedLog.statusCode || '-' }}</span>
            </div>
            <div class="log-details__item">
              <span class="log-details__label">Attempt:</span>
              <span class="log-details__value">{{ selectedLog.attempt }}</span>
            </div>
            <div class="log-details__item">
              <span class="log-details__label">Duration:</span>
              <span class="log-details__value">
                {{ selectedLog.duration ? `${selectedLog.duration}ms` : '-' }}
              </span>
            </div>
            <div class="log-details__item">
              <span class="log-details__label">Timestamp:</span>
              <span class="log-details__value">{{ formatDate(selectedLog.timestamp) }}</span>
            </div>
            <div class="log-details__item">
              <span class="log-details__label">URL:</span>
              <span class="log-details__value log-details__value--url">{{ selectedLog.url }}</span>
            </div>
          </div>
        </div>

        <!-- Request Payload -->
        <div class="log-details__section">
          <h3 class="log-details__title">Request Payload</h3>
          <pre class="log-details__code">{{ JSON.stringify(selectedLog.requestPayload, null, 2) }}</pre>
        </div>

        <!-- Response Body -->
        <div v-if="selectedLog.responseBody" class="log-details__section">
          <h3 class="log-details__title">Response Body</h3>
          <pre class="log-details__code">{{ selectedLog.responseBody }}</pre>
        </div>

        <!-- Error Message -->
        <div v-if="selectedLog.errorMessage" class="log-details__section">
          <h3 class="log-details__title">Error Message</h3>
          <div class="log-details__error">
            {{ selectedLog.errorMessage }}
          </div>
        </div>
      </div>
    </AppModal>
  </AppModal>
</template>

<script setup lang="ts">
import { useIntegrationStore } from '~/stores/integration'
import type { WebhookLog } from '~/types'

interface Props {
  webhookId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const integrationStore = useIntegrationStore()

const selectedLog = ref<WebhookLog | null>(null)

const logs = computed(() => integrationStore.webhookLogs)
const loading = computed(() => integrationStore.loading)
const error = computed(() => integrationStore.error)

const loadLogs = async () => {
  try {
    await integrationStore.fetchWebhookLogs(props.webhookId)
  } catch (err) {
    console.error('Failed to load webhook logs:', err)
  }
}

const viewLogDetails = (log: WebhookLog) => {
  selectedLog.value = log
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'secondary'
  }
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleString()
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.webhook-logs {
  min-height: 400px;
}

.webhook-logs__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  gap: $spacing-md;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $border-color;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.webhook-logs__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  gap: $spacing-md;
  
  p {
    color: $error-color;
  }
}

.webhook-logs__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  gap: $spacing-md;
}

.webhook-logs__empty-icon {
  width: 64px;
  height: 64px;
  color: $text-light;
}

.webhook-logs__content {
  overflow-x: auto;
}

.logs-table {
  min-width: 800px;
}

.logs-table__header {
  display: grid;
  grid-template-columns: 180px 150px 120px 80px 100px 120px;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md $radius-md 0 0;
  font-weight: 600;
  font-size: 0.875rem;
  color: $text-primary;
}

.logs-table__row {
  display: grid;
  grid-template-columns: 180px 150px 120px 80px 100px 120px;
  gap: $spacing-md;
  padding: $spacing-md;
  border-bottom: 1px solid $border-color;
  align-items: center;
  transition: background $transition-base;
  
  &:hover {
    background: $bg-secondary;
  }
}

.logs-table__cell {
  font-size: 0.875rem;
  color: $text-primary;
}

.logs-table__cell--status {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.event-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  color: $text-secondary;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge--success {
  background: rgba(16, 185, 129, 0.1);
  color: $success-color;
}

.status-badge--error {
  background: rgba(239, 68, 68, 0.1);
  color: $error-color;
}

.status-badge--warning {
  background: rgba(245, 158, 11, 0.1);
  color: $warning-color;
}

.status-badge--secondary {
  background: $bg-secondary;
  color: $text-secondary;
}

.status-code {
  font-size: 0.75rem;
  color: $text-light;
}

.log-details {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.log-details__section {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.log-details__title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
}

.log-details__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-md;
}

.log-details__item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.log-details__label {
  font-size: 0.75rem;
  color: $text-secondary;
  font-weight: 500;
}

.log-details__value {
  font-size: 0.875rem;
  color: $text-primary;
}

.log-details__value--url {
  word-break: break-all;
}

.log-details__code {
  padding: $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
  max-height: 400px;
}

.log-details__error {
  padding: $spacing-md;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  color: $error-color;
  font-size: 0.875rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: $breakpoint-md) {
  .logs-table__header,
  .logs-table__row {
    grid-template-columns: 1fr;
  }
  
  .logs-table__cell {
    display: flex;
    justify-content: space-between;
    
    &:before {
      content: attr(data-label);
      font-weight: 600;
      color: $text-secondary;
    }
  }
}
</style>
