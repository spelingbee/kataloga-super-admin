<template>
  <div class="template-editor-modal">
    <div class="template-editor-modal__overlay" @click="handleClose" />
    <div class="template-editor-modal__content">
      <div class="template-editor-modal__header">
        <h2 class="template-editor-modal__title">
          {{ isEditMode ? 'Edit Template' : 'Create Template' }}
        </h2>
        <button
          class="template-editor-modal__close"
          @click="handleClose"
        >
          ×
        </button>
      </div>

      <div v-if="loading" class="template-editor-modal__loading">
        Loading template...
      </div>

      <form v-else class="template-editor-modal__form" @submit.prevent="handleSubmit">
        <div class="template-editor-modal__form-group">
          <label class="template-editor-modal__label">Template Name *</label>
          <input
            v-model="form.name"
            type="text"
            class="template-editor-modal__input"
            placeholder="e.g., Welcome Email"
            required
          >
        </div>

        <div class="template-editor-modal__form-group">
          <label class="template-editor-modal__label">Type *</label>
          <select
            v-model="form.type"
            class="template-editor-modal__select"
            required
          >
            <option value="">Select type</option>
            <option value="welcome">Welcome</option>
            <option value="approval">Approval</option>
            <option value="rejection">Rejection</option>
            <option value="notification">Notification</option>
            <option value="announcement">Announcement</option>
            <option value="system">System</option>
          </select>
        </div>

        <div class="template-editor-modal__form-group">
          <label class="template-editor-modal__label">Subject *</label>
          <input
            v-model="form.subject"
            type="text"
            class="template-editor-modal__input"
            placeholder="e.g., Welcome to {{platform_name}}"
            required
          >
          <p class="template-editor-modal__hint">
            Use {{variable_name}} for dynamic content
          </p>
        </div>

        <div class="template-editor-modal__form-group">
          <label class="template-editor-modal__label">HTML Content *</label>
          <textarea
            v-model="form.htmlContent"
            class="template-editor-modal__textarea"
            rows="12"
            placeholder="Enter HTML content..."
            required
          />
          <p class="template-editor-modal__hint">
            Available variables: {{tenant_name}}, {{owner_name}}, {{platform_name}}, {{action_url}}
          </p>
        </div>

        <div class="template-editor-modal__form-group">
          <label class="template-editor-modal__label">Plain Text Content</label>
          <textarea
            v-model="form.textContent"
            class="template-editor-modal__textarea"
            rows="8"
            placeholder="Enter plain text version (optional)..."
          />
        </div>

        <div class="template-editor-modal__form-group">
          <label class="template-editor-modal__checkbox-label">
            <input
              v-model="form.isActive"
              type="checkbox"
              class="template-editor-modal__checkbox"
            >
            <span>Active (template will be used for sending emails)</span>
          </label>
        </div>

        <div class="template-editor-modal__actions">
          <button
            type="button"
            class="template-editor-modal__btn template-editor-modal__btn--secondary"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            type="button"
            class="template-editor-modal__btn template-editor-modal__btn--preview"
            @click="handlePreview"
          >
            Preview
          </button>
          <button
            type="submit"
            class="template-editor-modal__btn template-editor-modal__btn--primary"
            :disabled="submitting"
          >
            {{ submitting ? 'Saving...' : 'Save Template' }}
          </button>
        </div>
      </form>

      <!-- Preview Section -->
      <div v-if="showPreview" class="template-editor-modal__preview">
        <h3 class="template-editor-modal__preview-title">Preview</h3>
        <div class="template-editor-modal__preview-subject">
          <strong>Subject:</strong> {{ form.subject }}
        </div>
        <div class="template-editor-modal__preview-content">
          <iframe
            :srcdoc="form.htmlContent"
            class="template-editor-modal__preview-iframe"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmailStore } from '~/stores/email'
import type { EmailTemplate } from '~/types'

const props = defineProps<{
  templateId?: string | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const emailStore = useEmailStore()

const isEditMode = computed(() => !!props.templateId)
const loading = ref(false)
const submitting = ref(false)
const showPreview = ref(false)

const form = reactive({
  name: '',
  type: '' as any,
  subject: '',
  htmlContent: '',
  textContent: '',
  isActive: true,
})

// Load template if editing
onMounted(async () => {
  if (props.templateId) {
    loading.value = true
    try {
      await emailStore.fetchTemplateDetails(props.templateId)
      const template = emailStore.currentTemplate
      if (template) {
        form.name = template.name
        form.type = template.type
        form.subject = template.subject
        form.htmlContent = template.htmlContent
        form.textContent = template.textContent || ''
        form.isActive = template.isActive
      }
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

const handlePreview = () => {
  showPreview.value = !showPreview.value
}

const handleSubmit = async () => {
  submitting.value = true

  try {
    if (isEditMode.value && props.templateId) {
      await emailStore.updateTemplate(props.templateId, form)
    } else {
      await emailStore.createTemplate(form)
    }

    emit('saved')
  } catch (error) {
    console.error('Failed to save template:', error)
    alert('Failed to save template')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.template-editor-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
}

.template-editor-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.template-editor-modal__content {
  position: relative;
  background: $bg-primary;
  border-radius: $radius-lg;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: $shadow-lg;
}

.template-editor-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  background: $bg-primary;
  z-index: 1;
}

.template-editor-modal__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.template-editor-modal__close {
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

.template-editor-modal__loading {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
}

.template-editor-modal__form {
  padding: $spacing-lg;
}

.template-editor-modal__form-group {
  margin-bottom: $spacing-lg;
}

.template-editor-modal__label {
  display: block;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.template-editor-modal__input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 1rem;
  transition: border-color $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.template-editor-modal__select {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 1rem;
  background: $bg-primary;
  cursor: pointer;
  transition: border-color $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.template-editor-modal__textarea {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  transition: border-color $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.template-editor-modal__hint {
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $text-secondary;
}

.template-editor-modal__checkbox-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  
  span {
    color: $text-primary;
  }
}

.template-editor-modal__checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.template-editor-modal__actions {
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.template-editor-modal__btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-weight: 600;
  cursor: pointer;
  transition: all $transition-base;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.template-editor-modal__btn--primary {
  background: $primary-color;
  color: white;
  
  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

.template-editor-modal__btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.template-editor-modal__btn--preview {
  background: $info-color;
  color: white;
  
  &:hover {
    background: darken($info-color, 10%);
  }
}

.template-editor-modal__preview {
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  background: $bg-secondary;
}

.template-editor-modal__preview-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.template-editor-modal__preview-subject {
  padding: $spacing-md;
  background: $bg-primary;
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
  
  strong {
    color: $text-secondary;
  }
}

.template-editor-modal__preview-content {
  background: $bg-primary;
  border-radius: $radius-md;
  overflow: hidden;
}

.template-editor-modal__preview-iframe {
  width: 100%;
  min-height: 400px;
  border: none;
}

@media (max-width: $breakpoint-md) {
  .template-editor-modal {
    padding: 0;
  }
  
  .template-editor-modal__content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .template-editor-modal__actions {
    flex-direction: column;
  }
}
</style>
