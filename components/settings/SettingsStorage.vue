<template>
  <div class="settings-storage">
    <div class="settings-storage__header">
      <div>
        <h2 class="settings-storage__title">Storage Configuration</h2>
        <p class="settings-storage__description">
          Configure storage providers for file uploads and media management
        </p>
      </div>
      <button @click="openAddModal" class="btn btn--primary">
        <AppIcon name="plus" class="btn__icon" />
        Add Storage
      </button>
    </div>

    <div v-if="storageConfigs.length === 0" class="settings-storage__empty">
      <AppIcon name="database" class="settings-storage__empty-icon" />
      <p class="settings-storage__empty-text">No storage configurations</p>
      <button @click="openAddModal" class="btn btn--primary">
        Add Your First Storage
      </button>
    </div>

    <div v-else class="settings-storage__list">
      <div
        v-for="storage in storageConfigs"
        :key="storage.id"
        class="storage-card"
      >
        <div class="storage-card__header">
          <div class="storage-card__info">
            <div class="storage-card__name">
              {{ getStorageTypeName(storage.type) }}
              <span v-if="storage.isPrimary" class="badge badge--primary">Primary</span>
              <span v-if="storage.isActive" class="badge badge--success">Active</span>
              <span v-else class="badge badge--secondary">Inactive</span>
            </div>
            <div class="storage-card__meta">
              {{ storage.config.bucket || storage.config.path || 'No location configured' }}
            </div>
          </div>
          <div class="storage-card__actions">
            <button
              @click="testStorage(storage.id!)"
              class="btn btn--sm btn--secondary"
              :disabled="testing"
            >
              <AppIcon name="check-circle" class="btn__icon" />
              Test
            </button>
            <button
              @click="openEditModal(storage)"
              class="btn btn--sm btn--secondary"
            >
              <AppIcon name="edit" class="btn__icon" />
              Edit
            </button>
            <button
              @click="handleDelete(storage.id!)"
              class="btn btn--sm btn--danger"
              :disabled="storage.isPrimary"
            >
              <AppIcon name="trash" class="btn__icon" />
              Delete
            </button>
          </div>
        </div>

        <div class="storage-card__details">
          <div class="detail-item">
            <span class="detail-item__label">Type:</span>
            <span class="detail-item__value">{{ storage.type.toUpperCase() }}</span>
          </div>
          <div v-if="storage.config.region" class="detail-item">
            <span class="detail-item__label">Region:</span>
            <span class="detail-item__value">{{ storage.config.region }}</span>
          </div>
          <div v-if="storage.config.baseUrl" class="detail-item">
            <span class="detail-item__label">Base URL:</span>
            <span class="detail-item__value">{{ storage.config.baseUrl }}</span>
          </div>
        </div>

        <!-- Storage Usage -->
        <div v-if="storage.usage" class="storage-card__usage">
          <div class="usage-header">
            <span class="usage-header__label">Storage Usage</span>
            <span class="usage-header__value">
              {{ formatBytes(storage.usage.used) }} / {{ formatBytes(storage.usage.total) }}
            </span>
          </div>
          <div class="usage-bar">
            <div
              class="usage-bar__fill"
              :style="{ width: `${storage.usage.percentage}%` }"
              :class="{
                'usage-bar__fill--warning': storage.usage.percentage >= 80,
                'usage-bar__fill--danger': storage.usage.percentage >= 95,
              }"
            />
          </div>
          <div class="usage-footer">
            <span class="usage-footer__percentage">{{ storage.usage.percentage.toFixed(1) }}% used</span>
            <button
              @click="refreshUsage(storage.id!)"
              class="usage-footer__refresh"
            >
              <AppIcon name="refresh-cw" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <StorageConfigModal
      v-if="showModal"
      :storage="selectedStorage"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import type { StorageConfig } from '~/types'
import StorageConfigModal from './StorageConfigModal.vue'

const settingsStore = useSettingsStore()
const { showConfirm } = useConfirm()

const showModal = ref(false)
const selectedStorage = ref<StorageConfig | null>(null)

const storageConfigs = computed(() => settingsStore.storageConfigs)
const testing = computed(() => settingsStore.testing)

const getStorageTypeName = (type: string): string => {
  const names: Record<string, string> = {
    local: 'Local Storage',
    s3: 'Amazon S3',
    gcs: 'Google Cloud Storage',
    azure: 'Azure Blob Storage',
  }
  return names[type] || type
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const openAddModal = () => {
  selectedStorage.value = null
  showModal.value = true
}

const openEditModal = (storage: StorageConfig) => {
  selectedStorage.value = { ...storage }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedStorage.value = null
}

const handleSave = async (storage: StorageConfig) => {
  try {
    await settingsStore.updateStorageConfig(storage)
    closeModal()
  } catch (error) {
    console.error('Failed to save storage configuration:', error)
  }
}

const testStorage = async (storageId: string) => {
  try {
    await settingsStore.testStorageConnection(storageId)
  } catch (error) {
    console.error('Failed to test storage connection:', error)
  }
}

const refreshUsage = async (storageId: string) => {
  try {
    await settingsStore.fetchStorageUsage(storageId)
  } catch (error) {
    console.error('Failed to refresh storage usage:', error)
  }
}

const handleDelete = async (storageId: string) => {
  const confirmed = await showConfirm({
    title: 'Delete Storage Configuration',
    message: 'Are you sure you want to delete this storage configuration? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })

  if (confirmed) {
    try {
      await settingsStore.deleteStorageConfig(storageId)
    } catch (error) {
      console.error('Failed to delete storage configuration:', error)
    }
  }
}

// Load usage for all storage configs on mount
onMounted(() => {
  storageConfigs.value.forEach(storage => {
    if (storage.id && !storage.usage) {
      refreshUsage(storage.id)
    }
  })
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.settings-storage__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
  gap: $spacing-md;
}

.settings-storage__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
}

.settings-storage__description {
  margin-top: $spacing-xs;
  color: $text-secondary;
  font-size: 0.875rem;
}

.settings-storage__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  background: $bg-secondary;
  border: 2px dashed $border-color;
  border-radius: $radius-lg;
  text-align: center;
}

.settings-storage__empty-icon {
  width: 64px;
  height: 64px;
  color: $text-light;
  margin-bottom: $spacing-md;
}

.settings-storage__empty-text {
  color: $text-secondary;
  margin-bottom: $spacing-lg;
  font-size: 1.125rem;
}

.settings-storage__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.storage-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  transition: box-shadow $transition-base;
  
  &:hover {
    box-shadow: $shadow-md;
  }
}

.storage-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
  gap: $spacing-md;
}

.storage-card__info {
  flex: 1;
}

.storage-card__name {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.storage-card__meta {
  color: $text-secondary;
  font-size: 0.875rem;
  font-family: monospace;
}

.storage-card__actions {
  display: flex;
  gap: $spacing-sm;
}

.storage-card__details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.detail-item__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item__value {
  font-size: 0.875rem;
  color: $text-primary;
}

.storage-card__usage {
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.usage-header__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
}

.usage-header__value {
  font-size: 0.875rem;
  color: $text-secondary;
  font-family: monospace;
}

.usage-bar {
  height: 8px;
  background: $bg-secondary;
  border-radius: $radius-sm;
  overflow: hidden;
  margin-bottom: $spacing-sm;
}

.usage-bar__fill {
  height: 100%;
  background: $primary-color;
  transition: width $transition-base;
}

.usage-bar__fill--warning {
  background: $warning-color;
}

.usage-bar__fill--danger {
  background: $error-color;
}

.usage-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-footer__percentage {
  font-size: 0.8125rem;
  color: $text-secondary;
}

.usage-footer__refresh {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: transparent;
  border: none;
  color: $primary-color;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: color $transition-base;
  
  &:hover {
    color: darken($primary-color, 10%);
  }
}

.badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge--primary {
  background: rgba($primary-color, 0.1);
  color: $primary-color;
}

.badge--success {
  background: rgba($success-color, 0.1);
  color: $success-color;
}

.badge--secondary {
  background: $bg-secondary;
  color: $text-secondary;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-base;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn__icon {
  width: 16px;
  height: 16px;
}

.btn--primary {
  background: $primary-color;
  color: white;
  
  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

.btn--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  
  &:hover:not(:disabled) {
    background: darken($bg-secondary, 5%);
  }
}

.btn--danger {
  background: rgba($error-color, 0.1);
  color: $error-color;
  border: 1px solid rgba($error-color, 0.2);
  
  &:hover:not(:disabled) {
    background: rgba($error-color, 0.2);
  }
}

.btn--sm {
  padding: $spacing-xs $spacing-sm;
  font-size: 0.875rem;
}

@media (max-width: $breakpoint-md) {
  .settings-storage__header {
    flex-direction: column;
  }
  
  .storage-card__header {
    flex-direction: column;
  }
  
  .storage-card__actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .storage-card__details {
    grid-template-columns: 1fr;
  }
}
</style>
