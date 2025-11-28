<template>
  <Modal
    :show="show"
    :title="'Audit Log Details'"
    size="large"
    @close="handleClose"
  >
    <div v-if="loading" class="audit-log-detail-modal__loading">
      <div class="audit-log-detail-modal__spinner"/>
    </div>

    <div v-else-if="log" class="audit-log-detail-modal">
      <!-- Header Info -->
      <div class="audit-log-detail-modal__header">
        <div class="audit-log-detail-modal__status">
          <span :class="['audit-log-detail-modal__badge', `audit-log-detail-modal__badge--${log.result}`]">
            {{ log.result }}
          </span>
        </div>
        <div class="audit-log-detail-modal__timestamp">
          {{ formatDateTime(log.timestamp) }}
        </div>
      </div>

      <!-- Main Info -->
      <div class="audit-log-detail-modal__section">
        <h3 class="audit-log-detail-modal__section-title">Action Information</h3>
        <div class="audit-log-detail-modal__grid">
          <div class="audit-log-detail-modal__field">
            <label>Action</label>
            <span>{{ log.action }}</span>
          </div>
          <div class="audit-log-detail-modal__field">
            <label>Resource</label>
            <span>{{ log.resource }}</span>
          </div>
          <div class="audit-log-detail-modal__field">
            <label>Resource ID</label>
            <span>{{ log.resourceId }}</span>
          </div>
          <div class="audit-log-detail-modal__field">
            <label>Admin User</label>
            <span>{{ log.adminUser }}</span>
          </div>
        </div>
      </div>

      <!-- Request Info -->
      <div class="audit-log-detail-modal__section">
        <h3 class="audit-log-detail-modal__section-title">Request Information</h3>
        <div class="audit-log-detail-modal__grid">
          <div class="audit-log-detail-modal__field">
            <label>IP Address</label>
            <span>{{ log.ipAddress }}</span>
          </div>
          <div class="audit-log-detail-modal__field audit-log-detail-modal__field--full">
            <label>User Agent</label>
            <span>{{ log.userAgent }}</span>
          </div>
        </div>
      </div>

      <!-- Error Message (if failed) -->
      <div v-if="log.result === 'failure' && log.errorMessage" class="audit-log-detail-modal__section">
        <h3 class="audit-log-detail-modal__section-title">Error Details</h3>
        <div class="audit-log-detail-modal__error">
          {{ log.errorMessage }}
        </div>
      </div>

      <!-- Details -->
      <div v-if="log.details && Object.keys(log.details).length > 0" class="audit-log-detail-modal__section">
        <h3 class="audit-log-detail-modal__section-title">Additional Details</h3>
        <div class="audit-log-detail-modal__json">
          <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="audit-log-detail-modal__btn audit-log-detail-modal__btn--secondary" @click="handleClose">
        Close
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuditStore } from '~/stores/audit'
import type { AuditLog } from '~/types'
import { formatDateTime } from '~/utils/date'

interface Props {
  show: boolean
  logId: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const auditStore = useAuditStore()
const loading = ref(false)
const log = ref<AuditLog | null>(null)

watch(() => props.show, async (newShow) => {
  if (newShow && props.logId) {
    await fetchLogDetails()
  }
})

async function fetchLogDetails(): Promise<void> {
  if (!props.logId) return

  loading.value = true
  try {
    await auditStore.fetchLogDetails(props.logId)
    log.value = auditStore.currentLog
  } catch (error) {
    console.error('Failed to fetch log details:', error)
  } finally {
    loading.value = false
  }
}

function handleClose(): void {
  emit('close')
  log.value = null
  auditStore.clearCurrentLog()
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.audit-log-detail-modal {
  padding: $spacing-md;
}

.audit-log-detail-modal__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $spacing-xl;
}

.audit-log-detail-modal__spinner {
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

.audit-log-detail-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.audit-log-detail-modal__badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.audit-log-detail-modal__badge--success {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.audit-log-detail-modal__badge--failure {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.audit-log-detail-modal__timestamp {
  color: $text-secondary;
  font-size: 0.875rem;
}

.audit-log-detail-modal__section {
  margin-bottom: $spacing-lg;
}

.audit-log-detail-modal__section-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.audit-log-detail-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.audit-log-detail-modal__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  label {
    font-size: 0.75rem;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
  }

  span {
    font-size: 0.875rem;
    color: $text-primary;
    word-break: break-word;
  }
}

.audit-log-detail-modal__field--full {
  grid-column: 1 / -1;
}

.audit-log-detail-modal__error {
  padding: $spacing-md;
  background: lighten($error-color, 45%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  color: $error-color;
  font-size: 0.875rem;
  word-break: break-word;
}

.audit-log-detail-modal__json {
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-md;
  overflow-x: auto;

  pre {
    margin: 0;
    font-size: 0.875rem;
    color: $text-primary;
    font-family: 'Courier New', monospace;
  }
}

.audit-log-detail-modal__btn {
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: $transition-base;
  border: none;
}

.audit-log-detail-modal__btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

@media (max-width: $breakpoint-md) {
  .audit-log-detail-modal__grid {
    grid-template-columns: 1fr;
  }
}
</style>
