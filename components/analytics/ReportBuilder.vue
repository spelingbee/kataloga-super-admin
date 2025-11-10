<template>
  <div class="report-builder">
    <div class="report-builder__header">
      <h2 class="report-builder__title">Custom Report Builder</h2>
      <p class="report-builder__subtitle">
        Create and save custom analytics reports with selected metrics
      </p>
    </div>

    <div class="report-builder__content">
      <!-- Report Configuration -->
      <div class="report-builder__section">
        <h3 class="report-builder__section-title">Report Configuration</h3>
        
        <div class="report-builder__form">
          <div class="report-builder__form-group">
            <label for="reportName">Report Name</label>
            <input
              id="reportName"
              v-model="reportConfig.name"
              type="text"
              placeholder="e.g., Monthly Performance Report"
            />
          </div>

          <div class="report-builder__form-group">
            <label for="reportDescription">Description (Optional)</label>
            <textarea
              id="reportDescription"
              v-model="reportConfig.description"
              rows="3"
              placeholder="Brief description of this report"
            />
          </div>
        </div>
      </div>

      <!-- Date Range Selection -->
      <div class="report-builder__section">
        <h3 class="report-builder__section-title">Date Range</h3>
        
        <div class="report-builder__date-options">
          <button
            v-for="preset in datePresets"
            :key="preset.value"
            class="report-builder__date-preset"
            :class="{ 'report-builder__date-preset--active': selectedPreset === preset.value }"
            @click="selectDatePreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="report-builder__custom-date">
          <div class="report-builder__form-group">
            <label for="dateFrom">From</label>
            <input
              id="dateFrom"
              v-model="reportConfig.dateRange.from"
              type="date"
            />
          </div>
          <div class="report-builder__form-group">
            <label for="dateTo">To</label>
            <input
              id="dateTo"
              v-model="reportConfig.dateRange.to"
              type="date"
            />
          </div>
        </div>
      </div>

      <!-- Metric Selection -->
      <div class="report-builder__section">
        <h3 class="report-builder__section-title">Select Metrics</h3>
        
        <div class="report-builder__metrics">
          <div
            v-for="category in metricCategories"
            :key="category.name"
            class="report-builder__metric-category"
          >
            <h4 class="report-builder__category-title">{{ category.label }}</h4>
            
            <div class="report-builder__metric-list">
              <label
                v-for="metric in category.metrics"
                :key="metric.value"
                class="report-builder__metric-item"
              >
                <input
                  v-model="reportConfig.selectedMetrics"
                  type="checkbox"
                  :value="metric.value"
                />
                <span>{{ metric.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Options -->
      <div class="report-builder__section">
        <h3 class="report-builder__section-title">Export Options</h3>
        
        <div class="report-builder__export-options">
          <label class="report-builder__checkbox">
            <input
              v-model="reportConfig.includeCharts"
              type="checkbox"
            />
            <span>Include Charts</span>
          </label>
          
          <label class="report-builder__checkbox">
            <input
              v-model="reportConfig.includeTables"
              type="checkbox"
            />
            <span>Include Data Tables</span>
          </label>
          
          <label class="report-builder__checkbox">
            <input
              v-model="reportConfig.includeRawData"
              type="checkbox"
            />
            <span>Include Raw Data (CSV)</span>
          </label>
        </div>
      </div>

      <!-- Saved Templates -->
      <div v-if="savedTemplates.length > 0" class="report-builder__section">
        <h3 class="report-builder__section-title">Saved Templates</h3>
        
        <div class="report-builder__templates">
          <div
            v-for="template in savedTemplates"
            :key="template.id"
            class="report-builder__template-card"
          >
            <div class="report-builder__template-info">
              <h4>{{ template.name }}</h4>
              <p v-if="template.description">{{ template.description }}</p>
              <span class="report-builder__template-meta">
                {{ template.selectedMetrics.length }} metrics selected
              </span>
            </div>
            <div class="report-builder__template-actions">
              <button
                class="report-builder__template-btn"
                @click="loadTemplate(template)"
              >
                Load
              </button>
              <button
                class="report-builder__template-btn report-builder__template-btn--danger"
                @click="deleteTemplate(template.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="report-builder__actions">
      <button
        class="report-builder__button report-builder__button--secondary"
        @click="saveTemplate"
        :disabled="!canSaveTemplate"
      >
        Save as Template
      </button>
      
      <button
        class="report-builder__button report-builder__button--primary"
        @click="generateReport"
        :disabled="!canGenerateReport || generating"
      >
        {{ generating ? 'Generating...' : 'Generate Report' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExport } from '~/composables/useExport'
import { useAnalyticsStore } from '~/stores/analytics'
import type { DateRange } from '~/types'

interface ReportConfig {
  name: string
  description: string
  dateRange: DateRange
  selectedMetrics: string[]
  includeCharts: boolean
  includeTables: boolean
  includeRawData: boolean
}

interface ReportTemplate extends ReportConfig {
  id: string
  createdAt: string
}

const { exportAnalyticsPDF } = useExport()

const reportConfig = ref<ReportConfig>({
  name: '',
  description: '',
  dateRange: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    to: new Date().toISOString().split('T')[0] || '',
  },
  selectedMetrics: [],
  includeCharts: true,
  includeTables: true,
  includeRawData: false,
})

const selectedPreset = ref<string>('last30days')
const generating = ref(false)
const savedTemplates = ref<ReportTemplate[]>([])

const datePresets = [
  { label: 'Last 7 Days', value: 'last7days' },
  { label: 'Last 30 Days', value: 'last30days' },
  { label: 'Last 90 Days', value: 'last90days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'thisYear' },
]

const metricCategories = [
  {
    name: 'registration',
    label: 'Registration Metrics',
    metrics: [
      { label: 'Total Registrations', value: 'registration.total' },
      { label: 'Approved Registrations', value: 'registration.approved' },
      { label: 'Rejected Registrations', value: 'registration.rejected' },
      { label: 'Pending Registrations', value: 'registration.pending' },
      { label: 'Conversion Rate', value: 'registration.conversionRate' },
      { label: 'Registration Trends', value: 'registration.trends' },
    ],
  },
  {
    name: 'tenant',
    label: 'Tenant Performance',
    metrics: [
      { label: 'Total Tenants', value: 'tenant.total' },
      { label: 'Active Tenants', value: 'tenant.active' },
      { label: 'Retention Rate', value: 'tenant.retention' },
      { label: 'Churn Rate', value: 'tenant.churn' },
      { label: 'Growth Trend', value: 'tenant.growth' },
      { label: 'Top Performers', value: 'tenant.topPerformers' },
    ],
  },
  {
    name: 'revenue',
    label: 'Revenue Analytics',
    metrics: [
      { label: 'MRR (Monthly Recurring Revenue)', value: 'revenue.mrr' },
      { label: 'ARR (Annual Recurring Revenue)', value: 'revenue.arr' },
      { label: 'Total Revenue', value: 'revenue.total' },
      { label: 'Revenue Growth', value: 'revenue.growth' },
      { label: 'Revenue by Plan', value: 'revenue.byPlan' },
      { label: 'Revenue Projections', value: 'revenue.projections' },
    ],
  },
]

const canSaveTemplate = computed(() => {
  return reportConfig.value.name.trim() !== '' && reportConfig.value.selectedMetrics.length > 0
})

const canGenerateReport = computed(() => {
  return reportConfig.value.selectedMetrics.length > 0
})

const selectDatePreset = (preset: string) => {
  selectedPreset.value = preset
  const today = new Date()
  let from: Date
  let to: Date = today

  switch (preset) {
    case 'last7days':
      from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'last30days':
      from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'last90days':
      from = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'thisMonth':
      from = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'lastMonth':
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      to = new Date(today.getFullYear(), today.getMonth(), 0)
      break
    case 'thisYear':
      from = new Date(today.getFullYear(), 0, 1)
      break
    default:
      from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  reportConfig.value.dateRange = {
    from: from.toISOString().split('T')[0] || '',
    to: to.toISOString().split('T')[0] || '',
  }
}

const saveTemplate = () => {
  const template: ReportTemplate = {
    ...reportConfig.value,
    id: `template_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }

  savedTemplates.value.push(template)
  
  // Save to localStorage
  localStorage.setItem('reportTemplates', JSON.stringify(savedTemplates.value))
  
  const { success } = useNotification()
  success('Report template saved successfully')
}

const loadTemplate = (template: ReportTemplate) => {
  reportConfig.value = {
    name: template.name,
    description: template.description,
    dateRange: template.dateRange,
    selectedMetrics: [...template.selectedMetrics],
    includeCharts: template.includeCharts,
    includeTables: template.includeTables,
    includeRawData: template.includeRawData,
  }
  
  const { success } = useNotification()
  success('Template loaded successfully')
}

const deleteTemplate = (templateId: string) => {
  savedTemplates.value = savedTemplates.value.filter(t => t.id !== templateId)
  localStorage.setItem('reportTemplates', JSON.stringify(savedTemplates.value))
  
  const { success } = useNotification()
  success('Template deleted successfully')
}

const generateReport = async () => {
  generating.value = true
  
  try {
    // Fetch analytics data based on selected metrics
    const analyticsStore = useAnalyticsStore()
    analyticsStore.setDateRange(reportConfig.value.dateRange)
    await analyticsStore.fetchAllAnalytics(true)
    
    // Filter data based on selected metrics
    const analyticsData: any = {}
    
    if (reportConfig.value.selectedMetrics.some(m => m.startsWith('registration.'))) {
      analyticsData.registration = analyticsStore.registrationMetrics
    }
    
    if (reportConfig.value.selectedMetrics.some(m => m.startsWith('tenant.'))) {
      analyticsData.tenant = analyticsStore.tenantMetrics
    }
    
    if (reportConfig.value.selectedMetrics.some(m => m.startsWith('revenue.'))) {
      analyticsData.revenue = analyticsStore.revenueMetrics
    }
    
    // Generate PDF report
    await exportAnalyticsPDF(reportConfig.value.dateRange, analyticsData)
  } catch (error) {
    console.error('Failed to generate report:', error)
  } finally {
    generating.value = false
  }
}

// Load saved templates on mount
onMounted(() => {
  const saved = localStorage.getItem('reportTemplates')
  if (saved) {
    try {
      savedTemplates.value = JSON.parse(saved)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.report-builder {
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  overflow: hidden;
}

.report-builder__header {
  padding: $spacing-xl;
  border-bottom: 1px solid $border-color;
  background: $bg-secondary;
}

.report-builder__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.report-builder__subtitle {
  font-size: 0.875rem;
  color: $text-secondary;
}

.report-builder__content {
  padding: $spacing-xl;
}

.report-builder__section {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }
}

.report-builder__section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.report-builder__form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.report-builder__form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: $text-primary;
  }

  input,
  textarea {
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

  textarea {
    resize: vertical;
  }
}

.report-builder__date-options {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.report-builder__date-preset {
  padding: $spacing-sm $spacing-md;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    border-color: $primary-color;
    background: lighten($primary-color, 45%);
  }
}

.report-builder__date-preset--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 5%);
  }
}

.report-builder__custom-date {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.report-builder__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-lg;
}

.report-builder__metric-category {
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-md;
}

.report-builder__category-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.report-builder__metric-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.report-builder__metric-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  font-size: 0.875rem;
  color: $text-primary;

  input[type="checkbox"] {
    cursor: pointer;
  }
}

.report-builder__export-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.report-builder__checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  font-size: 0.875rem;
  color: $text-primary;

  input[type="checkbox"] {
    cursor: pointer;
  }
}

.report-builder__templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-md;
}

.report-builder__template-card {
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.report-builder__template-info {
  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $spacing-xs;
  }

  p {
    font-size: 0.875rem;
    color: $text-secondary;
    margin-bottom: $spacing-xs;
  }
}

.report-builder__template-meta {
  font-size: 0.75rem;
  color: $text-light;
}

.report-builder__template-actions {
  display: flex;
  gap: $spacing-sm;
}

.report-builder__template-btn {
  flex: 1;
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
  }
}

.report-builder__template-btn--danger {
  color: $error-color;
  border-color: $error-color;

  &:hover {
    background: lighten($error-color, 45%);
  }
}

.report-builder__actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding: $spacing-xl;
  border-top: 1px solid $border-color;
  background: $bg-secondary;
}

.report-builder__button {
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

.report-builder__button--secondary {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }
}

.report-builder__button--primary {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .report-builder__custom-date {
    grid-template-columns: 1fr;
  }

  .report-builder__metrics {
    grid-template-columns: 1fr;
  }

  .report-builder__actions {
    flex-direction: column;
  }
}
</style>
