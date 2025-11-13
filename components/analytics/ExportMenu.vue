<template>
  <div class="export-menu">
    <button
      class="export-menu__trigger"
      :disabled="exporting"
      @click="toggleMenu"
    >
      <AppIcon name="download" />
      <span>Export</span>
      <AppIcon :name="isOpen ? 'chevron-up' : 'chevron-down'" />
    </button>

    <div v-if="isOpen" class="export-menu__dropdown">
      <button
        class="export-menu__item"
        :disabled="exporting"
        @click="handleExportCSV"
      >
        <AppIcon name="file-text" />
        <span>Export as CSV</span>
      </button>

      <button
        v-if="showChartExport"
        class="export-menu__item"
        :disabled="exporting"
        @click="handleExportChart"
      >
        <AppIcon name="image" />
        <span>Export Chart (PNG)</span>
      </button>

      <button
        class="export-menu__item"
        :disabled="exporting"
        @click="handleExportPDF"
      >
        <AppIcon name="file" />
        <span>Export as PDF</span>
      </button>

      <button
        class="export-menu__item"
        :disabled="exporting"
        @click="handleEmailReport"
      >
        <AppIcon name="mail" />
        <span>Email Report</span>
      </button>
    </div>

    <!-- Email Report Modal -->
    <div v-if="showEmailModal" class="export-menu__modal-overlay" @click="closeEmailModal">
      <div class="export-menu__modal" @click.stop>
        <div class="export-menu__modal-header">
          <h3>Email Report</h3>
          <button @click="closeEmailModal">
            <AppIcon name="x" />
          </button>
        </div>

        <div class="export-menu__modal-body">
          <div class="export-menu__form-group">
            <label for="email">Recipient Email</label>
            <input
              id="email"
              v-model="emailRecipient"
              type="email"
              placeholder="admin@example.com"
              required
            >
          </div>

          <div class="export-menu__form-group">
            <label for="reportType">Report Type</label>
            <select id="reportType" v-model="selectedReportType">
              <option value="full">Full Analytics Report</option>
              <option value="registration">Registration Analytics</option>
              <option value="tenant">Tenant Performance</option>
              <option value="revenue">Revenue Analytics</option>
            </select>
          </div>
        </div>

        <div class="export-menu__modal-footer">
          <button
            class="export-menu__button export-menu__button--secondary"
            @click="closeEmailModal"
          >
            Cancel
          </button>
          <button
            class="export-menu__button export-menu__button--primary"
            :disabled="!emailRecipient || exporting"
            @click="sendEmailReport"
          >
            {{ exporting ? 'Sending...' : 'Send Report' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useExport } from '~/composables/useExport'
import type { DateRange } from '~/types'

interface Props {
  data?: any
  dataType?: 'registration' | 'tenant' | 'revenue'
  filename?: string
  dateRange: DateRange
  chartElement?: HTMLElement | null
  showChartExport?: boolean
  analyticsData?: {
    registration?: any
    tenant?: any
    revenue?: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  filename: 'export',
  showChartExport: false,
})

const { exporting, exportToCSV, exportChart, exportAnalyticsPDF, exportAnalyticsData, emailReport } = useExport()

const isOpen = ref(false)
const showEmailModal = ref(false)
const emailRecipient = ref('')
const selectedReportType = ref('full')

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleExportCSV = async () => {
  closeMenu()
  
  if (props.data && props.dataType) {
    await exportAnalyticsData(props.data, props.dataType, props.filename)
  } else if (props.data) {
    await exportToCSV(props.data, props.filename)
  }
}

const handleExportChart = async () => {
  closeMenu()
  
  if (props.chartElement) {
    await exportChart(props.chartElement, props.filename, 'png')
  }
}

const handleExportPDF = async () => {
  closeMenu()
  
  if (props.analyticsData) {
    await exportAnalyticsPDF(props.dateRange, props.analyticsData)
  }
}

const handleEmailReport = () => {
  closeMenu()
  showEmailModal.value = true
}

const closeEmailModal = () => {
  showEmailModal.value = false
  emailRecipient.value = ''
  selectedReportType.value = 'full'
}

const sendEmailReport = async () => {
  if (!emailRecipient.value) return
  
  await emailReport(selectedReportType.value, props.dateRange, emailRecipient.value)
  closeEmailModal()
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.export-menu')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.export-menu {
  position: relative;
}

.export-menu__trigger {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: $transition-base;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.export-menu__dropdown {
  position: absolute;
  top: calc(100% + $spacing-xs);
  right: 0;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  box-shadow: $shadow-lg;
  min-width: 200px;
  z-index: 100;
  overflow: hidden;
}

.export-menu__item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  padding: $spacing-sm $spacing-md;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.875rem;
  color: $text-primary;
  transition: $transition-base;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.export-menu__modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.export-menu__modal {
  background: white;
  border-radius: $radius-lg;
  width: 90%;
  max-width: 500px;
  box-shadow: $shadow-lg;
}

.export-menu__modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: $text-primary;
  }

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: $spacing-xs;
    color: $text-secondary;
    transition: $transition-base;

    &:hover {
      color: $text-primary;
    }
  }
}

.export-menu__modal-body {
  padding: $spacing-lg;
}

.export-menu__form-group {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: 0.875rem;
    font-weight: 500;
    color: $text-primary;
  }

  input,
  select {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    border: 1px solid $border-color;
    border-radius: $radius-sm;
    font-size: 0.875rem;
    transition: $transition-base;

    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
    }
  }
}

.export-menu__modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

.export-menu__button {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.export-menu__button--secondary {
  background: transparent;
  color: $text-secondary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }
}

.export-menu__button--primary {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}
</style>
