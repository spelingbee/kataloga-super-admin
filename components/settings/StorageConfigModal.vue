<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">
          {{ storage ? 'Edit Storage Configuration' : 'Add Storage Configuration' }}
        </h3>
        <button class="modal__close" @click="$emit('close')">
          <AppIcon name="x" />
        </button>
      </div>

      <form class="modal__body" @submit.prevent="handleSubmit">
        <!-- Storage Type -->
        <div class="form-group">
          <label for="storageType" class="form-group__label">
            Storage Type <span class="required">*</span>
          </label>
          <select
            id="storageType"
            v-model="formData.type"
            class="form-group__select"
            required
            :disabled="!!storage"
          >
            <option value="">Select storage type</option>
            <option value="local">Local Storage</option>
            <option value="s3">Amazon S3</option>
            <option value="gcs">Google Cloud Storage</option>
            <option value="azure">Azure Blob Storage</option>
          </select>
        </div>

        <!-- Local Storage Configuration -->
        <div v-if="formData.type === 'local'" class="config-section">
          <h4 class="config-section__title">Local Storage Configuration</h4>
          
          <div class="form-group">
            <label for="localPath" class="form-group__label">
              Storage Path <span class="required">*</span>
            </label>
            <input
              id="localPath"
              v-model="formData.config.path"
              type="text"
              class="form-group__input"
              placeholder="/var/www/uploads"
              required
            >
            <p class="form-group__hint">
              Absolute path to the storage directory on the server
            </p>
          </div>

          <div class="form-group">
            <label for="localBaseUrl" class="form-group__label">
              Base URL <span class="required">*</span>
            </label>
            <input
              id="localBaseUrl"
              v-model="formData.config.baseUrl"
              type="url"
              class="form-group__input"
              placeholder="https://example.com/uploads"
              required
            >
            <p class="form-group__hint">
              Public URL to access stored files
            </p>
          </div>
        </div>

        <!-- Amazon S3 Configuration -->
        <div v-if="formData.type === 's3'" class="config-section">
          <h4 class="config-section__title">Amazon S3 Configuration</h4>
          
          <div class="form-group">
            <label for="s3Bucket" class="form-group__label">
              Bucket Name <span class="required">*</span>
            </label>
            <input
              id="s3Bucket"
              v-model="formData.config.bucket"
              type="text"
              class="form-group__input"
              placeholder="my-bucket"
              required
            >
          </div>

          <div class="form-group">
            <label for="s3Region" class="form-group__label">
              Region <span class="required">*</span>
            </label>
            <select
              id="s3Region"
              v-model="formData.config.region"
              class="form-group__select"
              required
            >
              <option value="">Select region</option>
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-east-2">US East (Ohio)</option>
              <option value="us-west-1">US West (N. California)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">EU (Ireland)</option>
              <option value="eu-west-2">EU (London)</option>
              <option value="eu-central-1">EU (Frankfurt)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
              <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="s3AccessKey" class="form-group__label">
                Access Key ID <span class="required">*</span>
              </label>
              <input
                id="s3AccessKey"
                v-model="formData.config.accessKeyId"
                type="text"
                class="form-group__input"
                required
              >
            </div>

            <div class="form-group">
              <label for="s3SecretKey" class="form-group__label">
                Secret Access Key <span class="required">*</span>
              </label>
              <input
                id="s3SecretKey"
                v-model="formData.config.secretAccessKey"
                type="password"
                class="form-group__input"
                required
              >
            </div>
          </div>

          <div class="form-group">
            <label for="s3Endpoint" class="form-group__label">
              Custom Endpoint (Optional)
            </label>
            <input
              id="s3Endpoint"
              v-model="formData.config.endpoint"
              type="url"
              class="form-group__input"
              placeholder="https://s3.example.com"
            >
            <p class="form-group__hint">
              Use for S3-compatible services like MinIO or DigitalOcean Spaces
            </p>
          </div>
        </div>

        <!-- Google Cloud Storage Configuration -->
        <div v-if="formData.type === 'gcs'" class="config-section">
          <h4 class="config-section__title">Google Cloud Storage Configuration</h4>
          
          <div class="form-group">
            <label for="gcsBucket" class="form-group__label">
              Bucket Name <span class="required">*</span>
            </label>
            <input
              id="gcsBucket"
              v-model="formData.config.bucket"
              type="text"
              class="form-group__input"
              placeholder="my-bucket"
              required
            >
          </div>

          <div class="form-group">
            <label for="gcsKeyFile" class="form-group__label">
              Service Account Key (JSON) <span class="required">*</span>
            </label>
            <textarea
              id="gcsKeyFile"
              v-model="formData.config.accessKeyId"
              class="form-group__textarea"
              rows="6"
              placeholder='{"type": "service_account", ...}'
              required
            />
            <p class="form-group__hint">
              Paste your GCS service account JSON key file content
            </p>
          </div>
        </div>

        <!-- Azure Blob Storage Configuration -->
        <div v-if="formData.type === 'azure'" class="config-section">
          <h4 class="config-section__title">Azure Blob Storage Configuration</h4>
          
          <div class="form-group">
            <label for="azureContainer" class="form-group__label">
              Container Name <span class="required">*</span>
            </label>
            <input
              id="azureContainer"
              v-model="formData.config.bucket"
              type="text"
              class="form-group__input"
              placeholder="my-container"
              required
            >
          </div>

          <div class="form-group">
            <label for="azureAccountName" class="form-group__label">
              Storage Account Name <span class="required">*</span>
            </label>
            <input
              id="azureAccountName"
              v-model="formData.config.accessKeyId"
              type="text"
              class="form-group__input"
              required
            >
          </div>

          <div class="form-group">
            <label for="azureAccountKey" class="form-group__label">
              Storage Account Key <span class="required">*</span>
            </label>
            <input
              id="azureAccountKey"
              v-model="formData.config.secretAccessKey"
              type="password"
              class="form-group__input"
              required
            >
          </div>
        </div>

        <!-- Status Toggles -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-group__checkbox">
              <input
                v-model="formData.isActive"
                type="checkbox"
                class="form-group__checkbox-input"
              >
              <span class="form-group__checkbox-label">
                <strong>Active</strong>
                <span class="form-group__checkbox-description">
                  Enable this storage for file uploads
                </span>
              </span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-group__checkbox">
              <input
                v-model="formData.isPrimary"
                type="checkbox"
                class="form-group__checkbox-input"
              >
              <span class="form-group__checkbox-label">
                <strong>Primary Storage</strong>
                <span class="form-group__checkbox-description">
                  Use this as the default storage provider
                </span>
              </span>
            </label>
          </div>
        </div>

        <div class="modal__footer">
          <button
            type="button"
            class="btn btn--secondary"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn--primary"
          >
            {{ storage ? 'Update Storage' : 'Add Storage' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StorageConfig } from '~/types'

interface Props {
  storage?: StorageConfig | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [storage: StorageConfig]
}>()

const formData = ref<StorageConfig>({
  type: 'local',
  isActive: true,
  isPrimary: false,
  config: {},
})

const initializeForm = () => {
  if (props.storage) {
    formData.value = JSON.parse(JSON.stringify(props.storage))
  }
}

const handleSubmit = () => {
  emit('save', formData.value)
}

watch(() => props.storage, initializeForm, { immediate: true })
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-md;
}

.modal {
  background: $bg-primary;
  border-radius: $radius-lg;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.modal__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
}

.modal__close {
  padding: $spacing-xs;
  background: transparent;
  border: none;
  cursor: pointer;
  color: $text-secondary;
  transition: color $transition-base;
  
  &:hover {
    color: $text-primary;
  }
}

.modal__body {
  padding: $spacing-lg;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.config-section {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.config-section__title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.form-section {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.form-group {
  margin-bottom: $spacing-md;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-group__label {
  display: block;
  margin-bottom: $spacing-sm;
  font-weight: 500;
  color: $text-primary;
  font-size: 0.875rem;
}

.form-group__input,
.form-group__textarea,
.form-group__select {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  transition: border-color $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
  }
  
  &:disabled {
    background: $bg-secondary;
    cursor: not-allowed;
  }
}

.form-group__textarea {
  resize: vertical;
  font-family: monospace;
  font-size: 0.8125rem;
}

.form-group__hint {
  margin-top: $spacing-xs;
  font-size: 0.8125rem;
  color: $text-secondary;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.form-group__checkbox {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  cursor: pointer;
}

.form-group__checkbox-input {
  margin-top: 2px;
  cursor: pointer;
}

.form-group__checkbox-label {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  
  strong {
    color: $text-primary;
    font-size: 0.875rem;
  }
}

.form-group__checkbox-description {
  color: $text-secondary;
  font-size: 0.8125rem;
}

.required {
  color: $error-color;
}

.btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-base;
}

.btn--primary {
  background: $primary-color;
  color: white;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

.btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover {
    background: darken($bg-secondary, 5%);
  }
}

@media (max-width: $breakpoint-md) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
