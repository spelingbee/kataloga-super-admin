<template>
  <div v-if="modelValue" class="document-viewer">
    <div class="document-viewer__overlay" @click="handleClose"/>
    <div class="document-viewer__modal">
      <div class="document-viewer__header">
        <h3 class="document-viewer__title">{{ document.name }}</h3>
        <button class="document-viewer__close-btn" @click="handleClose">
          ✕
        </button>
      </div>
      
      <div class="document-viewer__content">
        <!-- Image Preview -->
        <div v-if="isImage" class="document-viewer__image-container">
          <img :src="document.url" :alt="document.name" class="document-viewer__image" >
        </div>

        <!-- PDF Preview -->
        <div v-else-if="isPdf" class="document-viewer__pdf-container">
          <iframe
            :src="document.url"
            class="document-viewer__pdf"
            title="PDF Document"
          />
        </div>

        <!-- Other Files -->
        <div v-else class="document-viewer__unsupported">
          <div class="document-viewer__unsupported-icon">📄</div>
          <p class="document-viewer__unsupported-text">
            Preview not available for this file type
          </p>
          <a
            :href="document.url"
            :download="document.name"
            class="document-viewer__download-btn"
          >
            Download File
          </a>
        </div>
      </div>

      <div class="document-viewer__footer">
        <div class="document-viewer__info">
          <span>{{ document.type }}</span>
          <span>•</span>
          <span>{{ formatFileSize(document.size) }}</span>
          <span>•</span>
          <span>Uploaded {{ formatDate(document.uploadedAt) }}</span>
        </div>
        <a
          :href="document.url"
          :download="document.name"
          class="document-viewer__footer-btn"
        >
          Download
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RegistrationDocument } from '~/types'
import { formatDate } from '~/utils/date'

interface Props {
  modelValue: boolean
  document: RegistrationDocument
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isImage = computed(() => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return imageTypes.includes(props.document.type.toLowerCase())
})

const isPdf = computed(() => {
  return props.document.type.toLowerCase() === 'application/pdf'
})

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function handleClose(): void {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.document-viewer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
}

.document-viewer__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
}

.document-viewer__modal {
  position: relative;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  background: white;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-lg;
}

.document-viewer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.document-viewer__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: $spacing-md;
}

.document-viewer__close-btn {
  padding: $spacing-xs;
  background: transparent;
  border: none;
  color: $text-secondary;
  font-size: 1.5rem;
  cursor: pointer;
  transition: $transition-base;
  flex-shrink: 0;

  &:hover {
    color: $text-primary;
  }
}

.document-viewer__content {
  flex: 1;
  overflow: auto;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-viewer__image-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-viewer__image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: $radius-md;
}

.document-viewer__pdf-container {
  width: 100%;
  height: 70vh;
}

.document-viewer__pdf {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: $radius-md;
}

.document-viewer__unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-xl;
  text-align: center;
}

.document-viewer__unsupported-icon {
  font-size: 4rem;
}

.document-viewer__unsupported-text {
  color: $text-secondary;
  margin: 0;
}

.document-viewer__download-btn {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  text-decoration: none;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.document-viewer__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  background: $bg-secondary;
  border-bottom-left-radius: $radius-lg;
  border-bottom-right-radius: $radius-lg;
}

.document-viewer__info {
  display: flex;
  gap: $spacing-sm;
  font-size: 0.875rem;
  color: $text-secondary;
}

.document-viewer__footer-btn {
  padding: $spacing-xs $spacing-md;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  text-decoration: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .document-viewer {
    padding: $spacing-md;
  }

  .document-viewer__modal {
    max-height: 95vh;
  }

  .document-viewer__header,
  .document-viewer__content,
  .document-viewer__footer {
    padding: $spacing-md;
  }

  .document-viewer__footer {
    flex-direction: column;
    gap: $spacing-md;
    align-items: flex-start;
  }

  .document-viewer__info {
    flex-wrap: wrap;
  }

  .document-viewer__footer-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
