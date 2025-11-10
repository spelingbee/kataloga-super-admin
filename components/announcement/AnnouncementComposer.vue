<template>
  <FormDialog
    v-model="isOpen"
    :title="isEdit ? 'Edit Announcement' : 'Create Announcement'"
    :submit-text="isEdit ? 'Update' : 'Create'"
    cancel-text="Cancel"
    :loading="loading"
    :loading-text="isEdit ? 'Updating...' : 'Creating...'"
    size="large"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="announcement-composer">
      <div class="announcement-composer__section">
        <h4 class="announcement-composer__section-title">Basic Information</h4>
        
        <FormInput
          v-model="form.title"
          label="Title"
          placeholder="Enter announcement title"
          required
        />

        <div class="announcement-composer__row">
          <FormSelect
            v-model="form.type"
            label="Type"
            :options="typeOptions"
            required
          />

          <FormSelect
            v-model="form.priority"
            label="Priority"
            :options="priorityOptions"
            required
          />
        </div>

        <FormTextarea
          v-model="form.content"
          label="Content"
          placeholder="Enter announcement content (plain text)"
          :rows="6"
          required
        />

        <div class="announcement-composer__editor-toggle">
          <label class="announcement-composer__checkbox">
            <input
              v-model="useRichText"
              type="checkbox"
            >
            <span>Use rich text editor (HTML)</span>
          </label>
        </div>

        <FormTextarea
          v-if="useRichText"
          v-model="form.htmlContent"
          label="HTML Content (Optional)"
          placeholder="Enter HTML content for email formatting"
          :rows="8"
        />
      </div>

      <div class="announcement-composer__section">
        <h4 class="announcement-composer__section-title">Target Audience</h4>

        <FormSelect
          v-model="form.targetType"
          label="Target Type"
          :options="targetTypeOptions"
          required
          @update:model-value="handleTargetTypeChange"
        />

        <div v-if="form.targetType === 'specific'" class="announcement-composer__target-specific">
          <label class="announcement-composer__label">Select Tenants</label>
          <div class="announcement-composer__tenant-search">
            <FormInput
              v-model="tenantSearch"
              placeholder="Search tenants..."
              @update:model-value="handleTenantSearch"
            />
          </div>
          <div class="announcement-composer__tenant-list">
            <div
              v-for="tenant in filteredTenants"
              :key="tenant.id"
              class="announcement-composer__tenant-item"
            >
              <label class="announcement-composer__checkbox">
                <input
                  v-model="form.tenantIds"
                  type="checkbox"
                  :value="tenant.id"
                >
                <span>{{ tenant.name }} ({{ tenant.slug }})</span>
              </label>
            </div>
          </div>
          <p class="announcement-composer__selected-count">
            Selected: {{ form.tenantIds.length }} tenant(s)
          </p>
        </div>

        <div v-if="form.targetType === 'plan'" class="announcement-composer__target-plan">
          <label class="announcement-composer__label">Select Plans</label>
          <div
            v-for="plan in planOptions"
            :key="plan.value"
            class="announcement-composer__plan-item"
          >
            <label class="announcement-composer__checkbox">
              <input
                v-model="form.plans"
                type="checkbox"
                :value="plan.value"
              >
              <span>{{ plan.label }}</span>
            </label>
          </div>
        </div>

        <div v-if="form.targetType === 'status'" class="announcement-composer__target-status">
          <label class="announcement-composer__label">Select Statuses</label>
          <div
            v-for="status in statusOptions"
            :key="status.value"
            class="announcement-composer__status-item"
          >
            <label class="announcement-composer__checkbox">
              <input
                v-model="form.statuses"
                type="checkbox"
                :value="status.value"
              >
              <span>{{ status.label }}</span>
            </label>
          </div>
        </div>

        <button
          v-if="form.targetType !== 'all'"
          type="button"
          class="announcement-composer__preview-btn"
          :disabled="previewLoading"
          @click="handlePreviewTargets"
        >
          {{ previewLoading ? 'Loading...' : 'Preview Target Count' }}
        </button>

        <div v-if="targetPreview" class="announcement-composer__preview-result">
          <p>This announcement will be sent to <strong>{{ targetPreview.count }}</strong> tenant(s)</p>
        </div>
      </div>

      <div class="announcement-composer__section">
        <h4 class="announcement-composer__section-title">Delivery Channels</h4>

        <div class="announcement-composer__channels">
          <label
            v-for="channel in channelOptions"
            :key="channel.value"
            class="announcement-composer__checkbox"
          >
            <input
              v-model="form.channels"
              type="checkbox"
              :value="channel.value"
            >
            <span>{{ channel.label }}</span>
          </label>
        </div>
      </div>

      <div class="announcement-composer__section">
        <h4 class="announcement-composer__section-title">Scheduling (Optional)</h4>

        <div class="announcement-composer__row">
          <FormInput
            v-model="form.scheduledFor"
            label="Schedule For"
            type="datetime-local"
            placeholder="Leave empty to send immediately"
          />

          <FormInput
            v-model="form.expiresAt"
            label="Expires At"
            type="datetime-local"
            placeholder="Leave empty for no expiration"
          />
        </div>
      </div>

      <div class="announcement-composer__preview">
        <h4 class="announcement-composer__section-title">Preview</h4>
        <div class="announcement-composer__preview-card">
          <div class="announcement-composer__preview-header">
            <span :class="`announcement-composer__preview-badge announcement-composer__preview-badge--${form.type}`">
              {{ form.type.toUpperCase() }}
            </span>
            <span class="announcement-composer__preview-priority">
              Priority: {{ form.priority }}
            </span>
          </div>
          <h5 class="announcement-composer__preview-title">{{ form.title || 'Announcement Title' }}</h5>
          <div class="announcement-composer__preview-content">
            {{ form.content || 'Announcement content will appear here...' }}
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '~/components/ui/Modal/FormDialog.vue'
import FormInput from '~/components/ui/FormInput.vue'
import FormSelect from '~/components/ui/FormSelect.vue'
import FormTextarea from '~/components/ui/FormTextarea.vue'
import type { Announcement, AnnouncementTarget } from '~/types'

interface Props {
  modelValue: boolean
  announcement?: Announcement | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  announcement: null,
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: any]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const useRichText = ref(false)
const tenantSearch = ref('')
const previewLoading = ref(false)
const targetPreview = ref<{ count: number; tenants: any[] } | null>(null)

const isEdit = computed(() => !!props.announcement)

const form = ref({
  title: '',
  content: '',
  htmlContent: '',
  type: 'info' as 'info' | 'warning' | 'success' | 'critical',
  priority: 'medium' as 'low' | 'medium' | 'high',
  targetType: 'all' as 'all' | 'specific' | 'plan' | 'status',
  tenantIds: [] as string[],
  plans: [] as string[],
  statuses: [] as ('active' | 'trial' | 'suspended')[],
  channels: ['email'] as ('email' | 'in_app' | 'telegram')[],
  scheduledFor: '',
  expiresAt: '',
})

// Mock tenant data - in real app, fetch from API
const allTenants = ref([
  { id: '1', name: 'Restaurant A', slug: 'restaurant-a' },
  { id: '2', name: 'Cafe B', slug: 'cafe-b' },
  { id: '3', name: 'Store C', slug: 'store-c' },
])

const filteredTenants = computed(() => {
  if (!tenantSearch.value) {
    return allTenants.value
  }
  const search = tenantSearch.value.toLowerCase()
  return allTenants.value.filter(t =>
    t.name.toLowerCase().includes(search) || t.slug.toLowerCase().includes(search)
  )
})

const typeOptions = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'success', label: 'Success' },
  { value: 'critical', label: 'Critical' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const targetTypeOptions = [
  { value: 'all', label: 'All Tenants' },
  { value: 'specific', label: 'Specific Tenants' },
  { value: 'plan', label: 'By Subscription Plan' },
  { value: 'status', label: 'By Status' },
]

const planOptions = [
  { value: 'free', label: 'Free Plan' },
  { value: 'basic', label: 'Basic Plan' },
  { value: 'pro', label: 'Pro Plan' },
  { value: 'enterprise', label: 'Enterprise Plan' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspended' },
]

const channelOptions = [
  { value: 'email', label: 'Email' },
  { value: 'in_app', label: 'In-App Notification' },
  { value: 'telegram', label: 'Telegram' },
]

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (value && props.announcement) {
    loadAnnouncementData()
  } else if (value) {
    resetForm()
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function loadAnnouncementData() {
  if (!props.announcement) return

  form.value = {
    title: props.announcement.title,
    content: props.announcement.content,
    htmlContent: props.announcement.htmlContent || '',
    type: props.announcement.type,
    priority: props.announcement.priority,
    targetType: props.announcement.target.type,
    tenantIds: props.announcement.target.tenantIds || [],
    plans: props.announcement.target.plans || [],
    statuses: props.announcement.target.statuses || [],
    channels: props.announcement.channels,
    scheduledFor: props.announcement.scheduledFor || '',
    expiresAt: props.announcement.expiresAt || '',
  }

  useRichText.value = !!props.announcement.htmlContent
}

function resetForm() {
  form.value = {
    title: '',
    content: '',
    htmlContent: '',
    type: 'info',
    priority: 'medium',
    targetType: 'all',
    tenantIds: [],
    plans: [],
    statuses: [],
    channels: ['email'],
    scheduledFor: '',
    expiresAt: '',
  }
  useRichText.value = false
  tenantSearch.value = ''
  targetPreview.value = null
}

function handleTargetTypeChange() {
  form.value.tenantIds = []
  form.value.plans = []
  form.value.statuses = []
  targetPreview.value = null
}

function handleTenantSearch() {
  // Debounce search in real implementation
}

async function handlePreviewTargets() {
  previewLoading.value = true
  try {
    const announcementStore = useAnnouncementStore()
    const target: AnnouncementTarget = {
      type: form.value.targetType,
      tenantIds: form.value.tenantIds,
      plans: form.value.plans,
      statuses: form.value.statuses,
    }
    targetPreview.value = await announcementStore.previewTargets(target)
  } catch (error) {
    console.error('Failed to preview targets:', error)
  } finally {
    previewLoading.value = false
  }
}

function handleSubmit() {
  if (!form.value.title || !form.value.content) {
    return
  }

  if (form.value.channels.length === 0) {
    return
  }

  const target: AnnouncementTarget = {
    type: form.value.targetType,
  }

  if (form.value.targetType === 'specific') {
    target.tenantIds = form.value.tenantIds
  } else if (form.value.targetType === 'plan') {
    target.plans = form.value.plans
  } else if (form.value.targetType === 'status') {
    target.statuses = form.value.statuses
  }

  const data = {
    title: form.value.title,
    content: form.value.content,
    htmlContent: useRichText.value ? form.value.htmlContent : undefined,
    type: form.value.type,
    priority: form.value.priority,
    target,
    channels: form.value.channels,
    scheduledFor: form.value.scheduledFor || undefined,
    expiresAt: form.value.expiresAt || undefined,
  }

  emit('submit', data)
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.announcement-composer__section {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-xl;
  border-bottom: 1px solid $border-color;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}

.announcement-composer__section-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-md 0;
}

.announcement-composer__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.announcement-composer__editor-toggle {
  margin-top: $spacing-md;
}

.announcement-composer__checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  padding: $spacing-sm 0;

  input[type="checkbox"] {
    cursor: pointer;
  }

  span {
    color: $text-primary;
    font-size: 0.875rem;
  }
}

.announcement-composer__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.announcement-composer__target-specific {
  margin-top: $spacing-md;
}

.announcement-composer__tenant-search {
  margin-bottom: $spacing-md;
}

.announcement-composer__tenant-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: $spacing-sm;
}

.announcement-composer__tenant-item {
  padding: $spacing-xs 0;
}

.announcement-composer__selected-count {
  margin-top: $spacing-sm;
  font-size: 0.875rem;
  color: $text-secondary;
}

.announcement-composer__target-plan,
.announcement-composer__target-status {
  margin-top: $spacing-md;
}

.announcement-composer__plan-item,
.announcement-composer__status-item {
  padding: $spacing-xs 0;
}

.announcement-composer__preview-btn {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  font-size: 0.875rem;
  transition: $transition-base;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.announcement-composer__preview-result {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: lighten($primary-color, 45%);
  border: 1px solid lighten($primary-color, 30%);
  border-radius: $radius-md;

  p {
    margin: 0;
    font-size: 0.875rem;
    color: $text-primary;

    strong {
      color: $primary-color;
    }
  }
}

.announcement-composer__channels {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.announcement-composer__preview {
  margin-top: $spacing-lg;
}

.announcement-composer__preview-card {
  padding: $spacing-lg;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.announcement-composer__preview-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
}

.announcement-composer__preview-badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  &--info {
    background: lighten($info-color, 40%);
    color: $info-color;
  }

  &--warning {
    background: lighten($warning-color, 40%);
    color: $warning-color;
  }

  &--success {
    background: lighten($success-color, 40%);
    color: $success-color;
  }

  &--critical {
    background: lighten($error-color, 40%);
    color: $error-color;
  }
}

.announcement-composer__preview-priority {
  font-size: 0.75rem;
  color: $text-secondary;
}

.announcement-composer__preview-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-sm 0;
}

.announcement-composer__preview-content {
  font-size: 0.875rem;
  color: $text-secondary;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
