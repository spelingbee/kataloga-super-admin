<template>
  <div class="email-templates-page">
    <div class="email-templates-page__header">
      <div>
        <h1 class="email-templates-page__title">Email Templates</h1>
        <p class="email-templates-page__subtitle">
          Manage email templates for automated communications
        </p>
      </div>
      <div class="email-templates-page__header-actions">
        <button
          class="email-templates-page__create-btn"
          @click="handleCreate"
        >
          + Create Template
        </button>
        <NuxtLink to="/emails" class="email-templates-page__back-btn">
          ← Back to Dashboard
        </NuxtLink>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="email-templates-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Templates Grid -->
    <div v-if="!loading && templates.length > 0" class="email-templates-page__grid">
      <div
        v-for="template in templates"
        :key="template.id"
        class="email-templates-page__card"
      >
        <div class="email-templates-page__card-header">
          <div>
            <h3 class="email-templates-page__card-title">{{ template.name }}</h3>
            <p class="email-templates-page__card-subject">{{ template.subject }}</p>
          </div>
          <span :class="['type-badge', `type-badge--${template.type}`]">
            {{ formatType(template.type) }}
          </span>
        </div>

        <div class="email-templates-page__card-meta">
          <div class="email-templates-page__card-meta-item">
            <span class="email-templates-page__card-meta-label">Status:</span>
            <span :class="['status-badge', template.isActive ? 'status-badge--active' : 'status-badge--inactive']">
              {{ template.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="email-templates-page__card-meta-item">
            <span class="email-templates-page__card-meta-label">Updated:</span>
            <span>{{ formatDate(template.updatedAt) }}</span>
          </div>
          <div v-if="template.usageCount !== undefined" class="email-templates-page__card-meta-item">
            <span class="email-templates-page__card-meta-label">Used:</span>
            <span>{{ template.usageCount }} times</span>
          </div>
        </div>

        <div class="email-templates-page__card-actions">
          <button
            class="email-templates-page__action-btn email-templates-page__action-btn--edit"
            @click="handleEdit(template.id)"
          >
            Edit
          </button>
          <button
            class="email-templates-page__action-btn email-templates-page__action-btn--preview"
            @click="handlePreview(template.id)"
          >
            Preview
          </button>
          <button
            :class="[
              'email-templates-page__action-btn',
              template.isActive ? 'email-templates-page__action-btn--deactivate' : 'email-templates-page__action-btn--activate'
            ]"
            @click="handleToggleStatus(template.id)"
          >
            {{ template.isActive ? 'Deactivate' : 'Activate' }}
          </button>
          <button
            class="email-templates-page__action-btn email-templates-page__action-btn--delete"
            @click="handleDelete(template.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && templates.length === 0" class="email-templates-page__empty">
      <p>No email templates found</p>
      <button
        class="email-templates-page__create-btn"
        @click="handleCreate"
      >
        Create Your First Template
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="email-templates-page__loading">
      <div class="email-templates-page__skeleton" />
      <div class="email-templates-page__skeleton" />
      <div class="email-templates-page__skeleton" />
    </div>

    <!-- Template Editor Modal -->
    <TemplateEditorModal
      v-if="showEditorModal"
      :template-id="selectedTemplateId"
      @close="closeEditorModal"
      @saved="handleTemplateSaved"
    />

    <!-- Template Preview Modal -->
    <TemplatePreviewModal
      v-if="showPreviewModal"
      :template-id="selectedTemplateId"
      @close="closePreviewModal"
    />
  </div>
</template>

<script setup lang="ts">
import { useEmailStore } from '~/stores/email'
import TemplateEditorModal from '~/components/email/TemplateEditorModal.vue'
import TemplatePreviewModal from '~/components/email/TemplatePreviewModal.vue'

const emailStore = useEmailStore()

const templates = computed(() => emailStore.templates)
const loading = computed(() => emailStore.loading)
const error = computed(() => emailStore.error)

const showEditorModal = ref(false)
const showPreviewModal = ref(false)
const selectedTemplateId = ref<string | null>(null)

// Fetch templates on mount
onMounted(async () => {
  try {
    await emailStore.fetchTemplates()
  } catch (error) {
    console.error('Failed to load templates:', error)
  }
})

// Methods
const retryFetch = async () => {
  emailStore.clearError()
  try {
    await emailStore.fetchTemplates()
  } catch (error) {
    console.error('Failed to retry fetch:', error)
  }
}

const handleCreate = () => {
  selectedTemplateId.value = null
  showEditorModal.value = true
}

const handleEdit = (templateId: string) => {
  selectedTemplateId.value = templateId
  showEditorModal.value = true
}

const handlePreview = (templateId: string) => {
  selectedTemplateId.value = templateId
  showPreviewModal.value = true
}

const handleToggleStatus = async (templateId: string) => {
  try {
    await emailStore.toggleTemplateStatus(templateId)
  } catch (error) {
    alert('Failed to toggle template status')
  }
}

const handleDelete = async (templateId: string) => {
  if (!confirm('Are you sure you want to delete this template?')) return

  try {
    await emailStore.deleteTemplate(templateId)
  } catch (error) {
    alert('Failed to delete template')
  }
}

const closeEditorModal = () => {
  showEditorModal.value = false
  selectedTemplateId.value = null
}

const closePreviewModal = () => {
  showPreviewModal.value = false
  selectedTemplateId.value = null
}

const handleTemplateSaved = () => {
  closeEditorModal()
  emailStore.fetchTemplates()
}

// Format helpers
const formatType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.email-templates-page {
  padding: $spacing-xl;
  max-width: 1400px;
  margin: 0 auto;
}

.email-templates-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.email-templates-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-templates-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.email-templates-page__header-actions {
  display: flex;
  gap: $spacing-md;
}

.email-templates-page__create-btn {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  font-weight: 600;
  transition: background $transition-base;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

.email-templates-page__back-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  text-decoration: none;
  font-weight: 500;
  transition: background $transition-base;
  
  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.email-templates-page__error {
  padding: $spacing-lg;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  p {
    color: $error-color;
    font-weight: 500;
    margin: 0;
  }
  
  button {
    padding: $spacing-xs $spacing-md;
    background: $error-color;
    color: white;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background: darken($error-color, 10%);
    }
  }
}

.email-templates-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $spacing-lg;
}

.email-templates-page__card {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  transition: box-shadow $transition-base;
  
  &:hover {
    box-shadow: $shadow-md;
  }
}

.email-templates-page__card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
  gap: $spacing-md;
}

.email-templates-page__card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-templates-page__card-subject {
  font-size: 0.875rem;
  color: $text-secondary;
}

.email-templates-page__card-meta {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  margin-bottom: $spacing-md;
  padding: $spacing-md 0;
  border-top: 1px solid $border-color;
  border-bottom: 1px solid $border-color;
}

.email-templates-page__card-meta-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: 0.875rem;
}

.email-templates-page__card-meta-label {
  font-weight: 500;
  color: $text-secondary;
}

.email-templates-page__card-actions {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.email-templates-page__action-btn {
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-primary;
  color: $text-primary;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all $transition-base;
  
  &:hover {
    background: $bg-secondary;
  }
}

.email-templates-page__action-btn--edit {
  color: $primary-color;
  border-color: $primary-color;
  
  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.email-templates-page__action-btn--preview {
  color: $info-color;
  border-color: $info-color;
  
  &:hover {
    background: lighten($info-color, 45%);
  }
}

.email-templates-page__action-btn--activate {
  color: $success-color;
  border-color: $success-color;
  
  &:hover {
    background: lighten($success-color, 45%);
  }
}

.email-templates-page__action-btn--deactivate {
  color: $warning-color;
  border-color: $warning-color;
  
  &:hover {
    background: lighten($warning-color, 45%);
  }
}

.email-templates-page__action-btn--delete {
  color: $error-color;
  border-color: $error-color;
  
  &:hover {
    background: lighten($error-color, 45%);
  }
}

.email-templates-page__empty {
  text-align: center;
  padding: $spacing-xl * 2;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  
  p {
    font-size: 1.125rem;
    color: $text-secondary;
    margin-bottom: $spacing-lg;
  }
}

.email-templates-page__loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $spacing-lg;
}

.email-templates-page__skeleton {
  background: linear-gradient(90deg, $bg-secondary 25%, $bg-primary 50%, $bg-secondary 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: $radius-lg;
  height: 250px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.type-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
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
  .email-templates-page {
    padding: $spacing-lg;
  }
  
  .email-templates-page__header {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .email-templates-page__header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .email-templates-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
