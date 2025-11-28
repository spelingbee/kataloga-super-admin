<template>
  <Modal
    :show="show"
    title="Export Audit Logs"
    size="medium"
    @close="handleClose"
  >
    <div class="export-audit-logs-modal">
      <p class="export-audit-logs-modal__description">
        Export audit logs based on current filters or select a custom date range.
      </p>

      <!-- Export Format -->
      <div class="export-audit-logs-modal__field">
        <label class="export-audit-logs-modal__label">Export Format</label>
        <FormSelect
          v-model="exportFormat"
          :options="formatOptions"
          placeholder="Select format"
        />
      </div>

      <!-- Date Range -->
      <div class="export-audit-logs-modal__field">
        <label class="export-audit-logs-modal__label">Date Range</label>
        <div class="export-audit-logs-modal__date-range">
          <FormInput
            v-model="fromDate"
            type="date"
            placeholder="From date"
          />
          <FormInput
            v-model="toDate"
            type="date"
            placeholder="To date"
          />
        </div>
      </div>

      <!-- Include Filters -->
      <div class="export-audit-logs-modal__field">
        <label class="export-audit-logs-modal__checkbox-label">
          <input
            v-model="includeCurrentFilters"
            type="checkbox"
          >
          <span>Include current filters</span>
        </label>
      </div>

      <!-- Report Type -->
      <div class="export-audit-logs-modal__field">
        <label class="export-audit-logs-modal__label">Report Type</label>
        <FormSelect
          v-model="reportType"
          :options="reportTypeOptions"
          placeholder="Select report type"
        />
      </div>

      <!-- Summary -->
      <div class="export-audit-logs-modal__summary">
        <h4>Export Summary</h4>
        <ul>
          <li>Format: {{ formatOptions.find(o => o.value === exportFormat)?.label }}</li>
          <li v-if="fromDate && toDate">Date Range: {{ fromDate }} to {{ toDate }}</li>
          <li v-else>Date Range: All time</li>
          <li>Filters: {{ includeCurrentFilters ? 'Applied' : 'Not applied' }}</li>
          <li>Report Type: {{ reportTypeOptions.find(o => o.value === reportType)?.label }}</li>
        </ul>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="export-audit-logs-modal__error">
        {{ error }}
      </div>
    </div>

    <template #footer>
      <button
        class="export-audit-logs-modal__btn export-audit-logs-modal__btn--secondary"
        @click="handleClose"
      >
        Cancel
      </button>
      <button
        class="export-audit-logs-modal__btn export-audit-logs-modal__btn--primary"
        :disabled="loading"
        @click="handleExport"
      >
        {{ loading ? 'Exporting...' : 'Export' }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuditStore } from '~/stores/audit'

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  exported: []
}>()

const auditStore = useAuditStore()
const { showNotification } = useNotification()

// Form state
const exportFormat = ref<'csv' | 'pdf'>('csv')
const fromDate = ref('')
const toDate = ref('')
const includeCurrentFilters = ref(true)
const reportType = ref('standard')
const loading = ref(false)
const error = ref('')

// Options
const formatOptions = [
  { value: 'csv', label: 'CSV (Comma Separated Values)' },
  { value: 'pdf', label: 'PDF (Portable Document Format)' },
]

const reportTypeOptions = [
  { value: 'standard', label: 'Standard Report' },
  { value: 'detailed', label: 'Detailed Report (with full details)' },
  { value: 'compliance', label: 'Compliance Report' },
  { value: 'summary', label: 'Summary Report' },
]

// Methods
async function handleExport(): Promise<void> {
  error.value = ''
  loading.value = true

  try {
    // Temporarily update filters if custom date range is provided
    const originalFilters = { ...auditStore.filters }
    
    if (!includeCurrentFilters.value) {
      auditStore.clearFilters()
    }
    
    if (fromDate.value) {
      auditStore.setFilters({ fromDate: fromDate.value })
    }
    if (toDate.value) {
      auditStore.setFilters({ toDate: toDate.value })
    }

    // Export logs
    const blob = await auditStore.exportLogs(exportFormat.value)
    
    // Restore original filters
    if (!includeCurrentFilters.value) {
      auditStore.setFilters(originalFilters)
    }

    // Download file
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const timestamp = new Date().toISOString().split('T')[0]
    const extension = exportFormat.value
    link.download = `audit-logs-${reportType.value}-${timestamp}.${extension}`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showNotification({
      type: 'success',
      message: 'Audit logs exported successfully',
    })

    emit('exported')
    handleClose()
  } catch (err: any) {
    error.value = err.message || 'Failed to export audit logs'
    showNotification({
      type: 'error',
      message: 'Failed to export audit logs',
    })
  } finally {
    loading.value = false
  }
}

function handleClose(): void {
  emit('close')
  resetForm()
}

function resetForm(): void {
  exportFormat.value = 'csv'
  fromDate.value = ''
  toDate.value = ''
  includeCurrentFilters.value = true
  reportType.value = 'standard'
  error.value = ''
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.export-audit-logs-modal {
  padding: $spacing-md;
}

.export-audit-logs-modal__description {
  color: $text-secondary;
  margin-bottom: $spacing-lg;
  font-size: 0.875rem;
}

.export-audit-logs-modal__field {
  margin-bottom: $spacing-lg;
}

.export-audit-logs-modal__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.export-audit-logs-modal__date-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.export-audit-logs-modal__checkbox-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  font-size: 0.875rem;
  color: $text-primary;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.export-audit-logs-modal__summary {
  padding: $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $spacing-sm;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      font-size: 0.875rem;
      color: $text-secondary;
      padding: $spacing-xs 0;
    }
  }
}

.export-audit-logs-modal__error {
  padding: $spacing-md;
  background: lighten($error-color, 45%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  color: $error-color;
  font-size: 0.875rem;
  margin-bottom: $spacing-md;
}

.export-audit-logs-modal__btn {
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: $transition-base;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.export-audit-logs-modal__btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: darken($bg-secondary, 3%);
  }
}

.export-audit-logs-modal__btn--primary {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .export-audit-logs-modal__date-range {
    grid-template-columns: 1fr;
  }
}
</style>
