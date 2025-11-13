<template>
  <Modal :show="show" size="large" @close="handleClose">
    <template #header>
      <h2 class="activity-detail-modal__title">Suspicious Activity Details</h2>
    </template>

    <template #body>
      <div v-if="loading" class="activity-detail-modal__loading">
        <div class="activity-detail-modal__spinner"/>
        <p>Loading activity details...</p>
      </div>

      <div v-else-if="error" class="activity-detail-modal__error">
        <AppIcon name="alert-circle" />
        <p>{{ error }}</p>
        <button class="activity-detail-modal__retry-btn" @click="retryFetch">
          Retry
        </button>
      </div>

      <div v-else-if="activity" class="activity-detail-modal__content">
        <div class="activity-detail-modal__section">
          <h3 class="activity-detail-modal__section-title">Activity Information</h3>
          <div class="activity-detail-modal__grid">
            <div class="activity-detail-modal__field">
              <label>Type</label>
              <span class="activity-detail-modal__value">{{ formatType(activity.type) }}</span>
            </div>

            <div class="activity-detail-modal__field">
              <label>Risk Level</label>
              <div class="risk-indicator">
                <span :class="['risk-badge', `risk-badge--${activity.riskLevel}`]">
                  {{ activity.riskLevel }}
                </span>
                <span class="risk-score">{{ activity.riskScore }}/100</span>
              </div>
            </div>

            <div class="activity-detail-modal__field">
              <label>Status</label>
              <span :class="['status-badge', activity.resolved ? 'status-badge--resolved' : 'status-badge--unresolved']">
                {{ activity.resolved ? 'Resolved' : 'Unresolved' }}
              </span>
            </div>

            <div class="activity-detail-modal__field">
              <label>Detected At</label>
              <span class="activity-detail-modal__value">{{ formatDateTime(activity.detectedAt) }}</span>
            </div>

            <div class="activity-detail-modal__field">
              <label>IP Address</label>
              <span class="activity-detail-modal__value">{{ activity.ipAddress }}</span>
            </div>

            <div v-if="activity.userName" class="activity-detail-modal__field">
              <label>User</label>
              <span class="activity-detail-modal__value">{{ activity.userName }}</span>
            </div>
          </div>
        </div>

        <div class="activity-detail-modal__section">
          <h3 class="activity-detail-modal__section-title">Description</h3>
          <p class="activity-detail-modal__description">{{ activity.description }}</p>
        </div>

        <div v-if="activity.userAgent" class="activity-detail-modal__section">
          <h3 class="activity-detail-modal__section-title">User Agent</h3>
          <p class="activity-detail-modal__user-agent">{{ activity.userAgent }}</p>
        </div>

        <div v-if="activity.metadata && Object.keys(activity.metadata).length > 0" class="activity-detail-modal__section">
          <h3 class="activity-detail-modal__section-title">Additional Details</h3>
          <div class="activity-detail-modal__metadata">
            <pre>{{ JSON.stringify(activity.metadata, null, 2) }}</pre>
          </div>
        </div>

        <div v-if="activity.actions && activity.actions.length > 0" class="activity-detail-modal__section">
          <h3 class="activity-detail-modal__section-title">Actions Taken</h3>
          <div class="activity-detail-modal__actions-list">
            <div
              v-for="(action, index) in activity.actions"
              :key="index"
              class="action-item"
            >
              <div class="action-item__icon">
                <AppIcon name="check-circle" />
              </div>
              <div class="action-item__content">
                <p class="action-item__action">{{ action.action }}</p>
                <p class="action-item__meta">
                  By {{ action.takenBy }} • {{ formatDateTime(action.takenAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activity.resolved" class="activity-detail-modal__section">
          <h3 class="activity-detail-modal__section-title">Resolution</h3>
          <div class="activity-detail-modal__grid">
            <div class="activity-detail-modal__field">
              <label>Resolved By</label>
              <span class="activity-detail-modal__value">{{ activity.resolvedBy || 'N/A' }}</span>
            </div>

            <div class="activity-detail-modal__field">
              <label>Resolved At</label>
              <span class="activity-detail-modal__value">{{ activity.resolvedAt ? formatDateTime(activity.resolvedAt) : 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div v-if="!activity.resolved" class="activity-detail-modal__section">
          <h3 class="activity-detail-modal__section-title">Resolve Activity</h3>
          <FormTextarea
            v-model="resolutionNotes"
            placeholder="Add resolution notes (optional)..."
            rows="3"
          />
          <button
            class="activity-detail-modal__resolve-btn"
            :disabled="resolving"
            @click="handleResolve"
          >
            {{ resolving ? 'Resolving...' : 'Mark as Resolved' }}
          </button>
        </div>
      </div>
    </template>

    <template #footer>
      <button class="activity-detail-modal__close-btn" @click="handleClose">
        Close
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSecurityStore } from '~/stores/security'
import { formatDateTime } from '~/utils/date'

interface Props {
  show: boolean
  activityId: string | null
}

interface Emits {
  (e: 'close'): void
  (e: 'resolved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const securityStore = useSecurityStore()
const { showSuccess, showError } = useNotification()

const resolutionNotes = ref('')
const resolving = ref(false)

const activity = computed(() => securityStore.currentActivity)
const loading = computed(() => securityStore.loading)
const error = computed(() => securityStore.error)

watch(() => props.show, async (newValue) => {
  if (newValue && props.activityId) {
    await fetchActivityDetails()
  } else {
    resolutionNotes.value = ''
    securityStore.clearCurrentActivity()
  }
})

async function fetchActivityDetails(): Promise<void> {
  if (!props.activityId) return

  try {
    await securityStore.fetchActivityDetails(props.activityId)
  } catch (error) {
    console.error('Failed to fetch activity details:', error)
  }
}

async function retryFetch(): Promise<void> {
  securityStore.clearError()
  await fetchActivityDetails()
}

async function handleResolve(): Promise<void> {
  if (!props.activityId) return

  resolving.value = true
  try {
    await securityStore.resolveActivity(props.activityId, resolutionNotes.value || undefined)
    showSuccess('Suspicious activity resolved successfully')
    emit('resolved')
    handleClose()
  } catch (error: any) {
    showError(error.message || 'Failed to resolve activity')
  } finally {
    resolving.value = false
  }
}

function handleClose(): void {
  emit('close')
}

function formatType(type: string): string {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.activity-detail-modal__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.activity-detail-modal__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  color: $text-secondary;

  p {
    margin-top: $spacing-md;
  }
}

.activity-detail-modal__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid $bg-secondary;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.activity-detail-modal__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  color: $error-color;
  text-align: center;

  p {
    margin: $spacing-md 0;
  }
}

.activity-detail-modal__retry-btn {
  padding: $spacing-sm $spacing-md;
  background: $error-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($error-color, 10%);
  }
}

.activity-detail-modal__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.activity-detail-modal__section {
  &:not(:last-child) {
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid $border-color;
  }
}

.activity-detail-modal__section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-md 0;
}

.activity-detail-modal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.activity-detail-modal__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
  }
}

.activity-detail-modal__value {
  font-size: 1rem;
  color: $text-primary;
}

.activity-detail-modal__description {
  font-size: 1rem;
  color: $text-primary;
  line-height: 1.6;
  margin: 0;
}

.activity-detail-modal__user-agent {
  font-size: 0.875rem;
  color: $text-secondary;
  font-family: monospace;
  background: $bg-secondary;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  word-break: break-all;
  margin: 0;
}

.activity-detail-modal__metadata {
  background: $bg-secondary;
  padding: $spacing-md;
  border-radius: $radius-md;
  overflow-x: auto;

  pre {
    margin: 0;
    font-size: 0.875rem;
    color: $text-primary;
    font-family: monospace;
  }
}

.activity-detail-modal__actions-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.action-item {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.action-item__icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $success-color;
}

.action-item__content {
  flex: 1;
}

.action-item__action {
  font-size: 0.875rem;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
  font-weight: 500;
}

.action-item__meta {
  font-size: 0.75rem;
  color: $text-secondary;
  margin: 0;
}

.activity-detail-modal__resolve-btn {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: $success-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: darken($success-color, 10%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.activity-detail-modal__close-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;
  font-weight: 600;

  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.risk-indicator {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.risk-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.risk-badge--high {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.risk-badge--medium {
  background: lighten($warning-color, 40%);
  color: darken($warning-color, 20%);
}

.risk-badge--low {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.risk-score {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--resolved {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--unresolved {
  background: lighten($warning-color, 40%);
  color: darken($warning-color, 20%);
}
</style>
