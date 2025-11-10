<template>
  <div class="template-preview-modal">
    <div class="template-preview-modal__overlay" @click="handleClose" />
    <div class="template-preview-modal__content">
      <div class="template-preview-modal__header">
        <h2 class="template-preview-modal__title">Template Preview</h2>
        <button
          class="template-preview-modal__close"
          @click="handleClose"
        >
          ×
        </button>
      </div>

      <div v-if="loading" class="template-preview-modal__loading">
        Loading template...
      </div>

      <div v-else-if="template" class="template-preview-modal__body">
        <div class="template-preview-modal__info">
          <div class="template-preview-modal__info-row">
            <span class="template-preview-modal__info-label">Name:</span>
            <span class="template-preview-modal__info-value">{{ template.name }}</span>
          </div>
          <div class="template-preview-modal__info-row">
            <span class="template-preview-modal__info-label">Type:</span>
            <span :class="['type-badge', `type-badge--${template.type}`]">
              {{ formatType(template.type) }}
            </span>
          </div>
          <div class="template-preview-modal__info-row">
            <span class="template-preview-modal__info-label">Status:</span>
            <span :class="['status-badge', template.isActive ? 'status-badge--active' : 'status-badge--inactive']">
              {{ template.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="template-preview-modal__subject">
          <strong>Subject:</strong> {{ template.subject }}
        </div>

        <div class="template-preview-modal__variables" v-if="template.variables.length > 0">
          <strong>Available Variables:</strong>
          <div class="template-preview-modal__variable-list">
            <span
              v-for="variable in template.variables"
              :key="variable"
              class="template-preview-modal__variable"
            >
              {{ `{{${variable}}}` }}
            </span>
          </div>
        </div>

        <div class="template-preview-modal__tabs">
          <button
            :class="['template-preview-modal__tab', { 'template-preview-modal__tab--active': activeTab === 'html' }]"
            @click="activeTab = 'html'"
          >
            HTML Preview
          </button>
          <button
            v-if="template.textContent"
            :class="['template-preview-modal__tab', { 'template-preview-modal__tab--active': activeTab === 'text' }]"
            @click="activeTab = 'text'"
          >
            Plain Text
          </button>
          <button
            :class="['template-preview-modal__tab', { 'template-preview-modal__tab--active': activeTab === 'code' }]"
            @click="activeTab = 'code'"
          >
            HTML Code
          </button>
        </div>

        <div class="template-preview-modal__content-area">
          <iframe
            v-if="activeTab === 'html'"
            :srcdoc="template.htmlContent"
            class="template-preview-modal__iframe"
            sandbox="allow-same-origin"
          />
          <pre v-else-if="activeTab === 'text'" class="template-preview-modal__text">{{ template.textContent }}</pre>
          <pre v-else-if="activeTab === 'code'" class="template-preview-modal__code">{{ template.htmlContent }}</pre>
        </div>
      </div>

      <div class="template-preview-modal__footer">
        <button
          class="template-preview-modal__btn template-preview-modal__btn--secondary"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmailStore } from '~/stores/email'

const props = defineProps<{
  templateId: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const emailStore = useEmailStore()

const loading = ref(false)
const activeTab = ref<'html' | 'text' | 'code'>('html')

const template = computed(() => emailStore.currentTemplate)

// Load template
onMounted(async () => {
  if (props.templateId) {
    loading.value = true
    try {
      await emailStore.fetchTemplateDetails(props.templateId)
    } catch (error) {
      console.error('Failed to load template:', error)
      alert('Failed to load template')
      handleClose()
    } finally {
      loading.value = false
    }
  }
})

const handleClose = () => {
  emit('close')
}

const formatType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.template-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
}

.template-preview-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.template-preview-modal__content {
  position: relative;
  background: $bg-primary;
  border-radius: $radius-lg;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-lg;
}

.template-preview-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.template-preview-modal__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.template-preview-modal__close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: $text-secondary;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transition: color $transition-base;
  
  &:hover {
    color: $text-primary;
  }
}

.template-preview-modal__loading {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
}

.template-preview-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
}

.template-preview-modal__info {
  display: flex;
  gap: $spacing-lg;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
}

.template-preview-modal__info-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.template-preview-modal__info-label {
  font-weight: 600;
  color: $text-secondary;
}

.template-preview-modal__info-value {
  color: $text-primary;
}

.template-preview-modal__subject {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
  
  strong {
    color: $text-secondary;
    margin-right: $spacing-sm;
  }
}

.template-preview-modal__variables {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
  
  strong {
    display: block;
    color: $text-secondary;
    margin-bottom: $spacing-sm;
  }
}

.template-preview-modal__variable-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.template-preview-modal__variable {
  padding: $spacing-xs $spacing-sm;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  color: $primary-color;
}

.template-preview-modal__tabs {
  display: flex;
  gap: $spacing-xs;
  margin-bottom: $spacing-md;
  border-bottom: 2px solid $border-color;
}

.template-preview-modal__tab {
  padding: $spacing-sm $spacing-md;
  border: none;
  background: transparent;
  color: $text-secondary;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all $transition-base;
  
  &:hover {
    color: $text-primary;
  }
}

.template-preview-modal__tab--active {
  color: $primary-color;
  border-bottom-color: $primary-color;
}

.template-preview-modal__content-area {
  background: $bg-secondary;
  border-radius: $radius-md;
  overflow: hidden;
  min-height: 400px;
}

.template-preview-modal__iframe {
  width: 100%;
  min-height: 500px;
  border: none;
  background: white;
}

.template-preview-modal__text {
  padding: $spacing-md;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: $text-primary;
}

.template-preview-modal__code {
  padding: $spacing-md;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: $text-primary;
  background: $bg-dark;
  color: #e2e8f0;
}

.template-preview-modal__footer {
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: flex-end;
}

.template-preview-modal__btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: all $transition-base;
}

.template-preview-modal__btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.type-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge--welcome {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.type-badge--approval {
  background: lighten($primary-color, 40%);
  color: $primary-color;
}

.type-badge--rejection {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.type-badge--notification {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.type-badge--announcement {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.type-badge--system {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--inactive {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

@media (max-width: $breakpoint-md) {
  .template-preview-modal {
    padding: 0;
  }
  
  .template-preview-modal__content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .template-preview-modal__info {
    flex-direction: column;
    gap: $spacing-sm;
  }
}
</style>
