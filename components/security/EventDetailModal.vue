<template>
  <Modal :show="show" size="large" @close="handleClose">
    <template #header>
      <h2 class="event-detail-modal__title">Security Event Details</h2>
    </template>

    <template #body>
      <div v-if="loading" class="event-detail-modal__loading">
        <div class="event-detail-modal__spinner"/>
        <p>Loading event details...</p>
      </div>

      <div v-else-if="error" class="event-detail-modal__error">
        <AppIcon name="alert-circle" />
        <p>{{ error }}</p>
        <button class="event-detail-modal__retry-btn" @click="retryFetch">
          Retry
        </button>
      </div>

      <div v-else-if="event" class="event-detail-modal__content">
        <div class="event-detail-modal__section">
          <h3 class="event-detail-modal__section-title">Event Information</h3>
          <div class="event-detail-modal__grid">
            <div class="event-detail-modal__field">
              <label>Type</label>
              <span class="event-detail-modal__value">{{ formatType(event.type) }}</span>
            </div>

            <div class="event-detail-modal__field">
              <label>Severity</label>
              <span :class="['severity-badge', `severity-badge--${event.severity}`]">
                {{ event.severity }}
              </span>
            </div>

            <div class="event-detail-modal__field">
              <label>Status</label>
              <span :class="['status-badge', event.resolved ? 'status-badge--resolved' : 'status-badge--unresolved']">
                {{ event.resolved ? 'Resolved' : 'Unresolved' }}
              </span>
            </div>

            <div class="event-detail-modal__field">
              <label>Timestamp</label>
              <span class="event-detail-modal__value">{{ formatDateTime(event.timestamp) }}</span>
            </div>

            <div class="event-detail-modal__field">
              <label>IP Address</label>
              <span class="event-detail-modal__value">{{ event.ipAddress }}</span>
            </div>

            <div v-if="event.userName" class="event-detail-modal__field">
              <label>User</label>
              <span class="event-detail-modal__value">{{ event.userName }}</span>
            </div>
          </div>
        </div>

        <div class="event-detail-modal__section">
          <h3 class="event-detail-modal__section-title">Description</h3>
          <p class="event-detail-modal__description">{{ event.description }}</p>
        </div>

        <div v-if="event.userAgent" class="event-detail-modal__section">
          <h3 class="event-detail-modal__section-title">User Agent</h3>
          <p class="event-detail-modal__user-agent">{{ event.userAgent }}</p>
        </div>

        <div v-if="event.metadata && Object.keys(event.metadata).length > 0" class="event-detail-modal__section">
          <h3 class="event-detail-modal__section-title">Additional Details</h3>
          <div class="event-detail-modal__metadata">
            <pre>{{ JSON.stringify(event.metadata, null, 2) }}</pre>
          </div>
        </div>

        <div v-if="event.resolved" class="event-detail-modal__section">
          <h3 class="event-detail-modal__section-title">Resolution</h3>
          <div class="event-detail-modal__grid">
            <div class="event-detail-modal__field">
              <label>Resolved By</label>
              <span class="event-detail-modal__value">{{ event.resolvedBy || 'N/A' }}</span>
            </div>

            <div class="event-detail-modal__field">
              <label>Resolved At</label>
              <span class="event-detail-modal__value">{{ event.resolvedAt ? formatDateTime(event.resolvedAt) : 'N/A' }}</span>
            </div>
          </div>

          <div v-if="event.notes" class="event-detail-modal__notes">
            <label>Notes</label>
            <p>{{ event.notes }}</p>
          </div>
        </div>

        <div v-if="!event.resolved" class="event-detail-modal__section">
          <h3 class="event-detail-modal__section-title">Resolve Event</h3>
          <FormTextarea
            v-model="resolutionNotes"
            placeholder="Add resolution notes (optional)..."
            rows="3"
          />
          <button
            class="event-detail-modal__resolve-btn"
            :disabled="resolving"
            @click="handleResolve"
          >
            {{ resolving ? 'Resolving...' : 'Mark as Resolved' }}
          </button>
        </div>
      </div>
    </template>

    <template #footer>
      <button class="event-detail-modal__close-btn" @click="handleClose">
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
  eventId: string | null
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

const event = computed(() => securityStore.currentEvent)
const loading = computed(() => securityStore.loading)
const error = computed(() => securityStore.error)

watch(() => props.show, async (newValue) => {
  if (newValue && props.eventId) {
    await fetchEventDetails()
  } else {
    resolutionNotes.value = ''
    securityStore.clearCurrentEvent()
  }
})

async function fetchEventDetails(): Promise<void> {
  if (!props.eventId) return

  try {
    await securityStore.fetchEventDetails(props.eventId)
  } catch (error) {
    console.error('Failed to fetch event details:', error)
  }
}

async function retryFetch(): Promise<void> {
  securityStore.clearError()
  await fetchEventDetails()
}

async function handleResolve(): Promise<void> {
  if (!props.eventId) return

  resolving.value = true
  try {
    await securityStore.resolveEvent(props.eventId, resolutionNotes.value || undefined)
    showSuccess('Security event resolved successfully')
    emit('resolved')
    handleClose()
  } catch (error: any) {
    showError(error.message || 'Failed to resolve event')
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

.event-detail-modal__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.event-detail-modal__loading {
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

.event-detail-modal__spinner {
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

.event-detail-modal__error {
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

.event-detail-modal__retry-btn {
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

.event-detail-modal__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.event-detail-modal__section {
  &:not(:last-child) {
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid $border-color;
  }
}

.event-detail-modal__section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-md 0;
}

.event-detail-modal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.event-detail-modal__field {
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

.event-detail-modal__value {
  font-size: 1rem;
  color: $text-primary;
}

.event-detail-modal__description {
  font-size: 1rem;
  color: $text-primary;
  line-height: 1.6;
  margin: 0;
}

.event-detail-modal__user-agent {
  font-size: 0.875rem;
  color: $text-secondary;
  font-family: monospace;
  background: $bg-secondary;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  word-break: break-all;
  margin: 0;
}

.event-detail-modal__metadata {
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

.event-detail-modal__notes {
  margin-top: $spacing-md;

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    margin-bottom: $spacing-xs;
  }

  p {
    font-size: 1rem;
    color: $text-primary;
    line-height: 1.6;
    margin: 0;
  }
}

.event-detail-modal__resolve-btn {
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

.event-detail-modal__close-btn {
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

.severity-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge--critical {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.severity-badge--warning {
  background: lighten($warning-color, 40%);
  color: darken($warning-color, 20%);
}

.severity-badge--info {
  background: lighten($info-color, 40%);
  color: $info-color;
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
