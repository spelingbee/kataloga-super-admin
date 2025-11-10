<template>
  <div class="email-details-page">
    <!-- Loading State -->
    <div v-if="loading" class="email-details-page__loading">
      <div class="email-details-page__skeleton" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="email-details-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Email Details -->
    <div v-else-if="email" class="email-details-page__content">
      <!-- Header -->
      <div class="email-details-page__header">
        <div>
          <h1 class="email-details-page__title">Email Details</h1>
          <p class="email-details-page__subtitle">
            Sent {{ formatDateTime(email.sentAt) }}
          </p>
        </div>
        <div class="email-details-page__header-actions">
          <button
            v-if="email.status === 'failed' || email.status === 'bounced'"
            class="email-details-page__action-btn email-details-page__action-btn--resend"
            @click="handleResend"
          >
            Resend Email
          </button>
          <NuxtLink to="/emails/list" class="email-details-page__back-btn">
            ← Back to List
          </NuxtLink>
        </div>
      </div>

      <!-- Email Info Cards -->
      <div class="email-details-page__info-grid">
        <!-- Status Card -->
        <div class="email-details-page__info-card">
          <div class="email-details-page__info-label">Status</div>
          <span :class="['status-badge', `status-badge--${email.status}`]">
            {{ formatStatus(email.status) }}
          </span>
        </div>

        <!-- Type Card -->
        <div class="email-details-page__info-card">
          <div class="email-details-page__info-label">Type</div>
          <span :class="['type-badge', `type-badge--${email.type}`]">
            {{ formatType(email.type) }}
          </span>
        </div>

        <!-- Provider Card -->
        <div class="email-details-page__info-card">
          <div class="email-details-page__info-label">Provider</div>
          <div class="email-details-page__info-value">{{ email.provider }}</div>
        </div>

        <!-- Tenant Card -->
        <div v-if="email.tenantName" class="email-details-page__info-card">
          <div class="email-details-page__info-label">Tenant</div>
          <div class="email-details-page__info-value">{{ email.tenantName }}</div>
        </div>
      </div>

      <!-- Email Content -->
      <div class="email-details-page__section">
        <h2 class="email-details-page__section-title">Email Content</h2>
        
        <div class="email-details-page__email-meta">
          <div class="email-details-page__meta-row">
            <span class="email-details-page__meta-label">From:</span>
            <span class="email-details-page__meta-value">
              {{ email.fromName }} &lt;{{ email.fromEmail }}&gt;
            </span>
          </div>
          
          <div class="email-details-page__meta-row">
            <span class="email-details-page__meta-label">To:</span>
            <span class="email-details-page__meta-value">
              {{ email.recipientName ? `${email.recipientName} <${email.recipient}>` : email.recipient }}
            </span>
          </div>
          
          <div v-if="email.replyTo" class="email-details-page__meta-row">
            <span class="email-details-page__meta-label">Reply-To:</span>
            <span class="email-details-page__meta-value">{{ email.replyTo }}</span>
          </div>
          
          <div class="email-details-page__meta-row">
            <span class="email-details-page__meta-label">Subject:</span>
            <span class="email-details-page__meta-value email-details-page__meta-value--subject">
              {{ email.subject }}
            </span>
          </div>
        </div>

        <!-- HTML Preview -->
        <div class="email-details-page__preview">
          <div class="email-details-page__preview-header">
            <span class="email-details-page__preview-title">HTML Preview</span>
            <button
              class="email-details-page__preview-toggle"
              @click="showRawHtml = !showRawHtml"
            >
              {{ showRawHtml ? 'Show Preview' : 'Show Raw HTML' }}
            </button>
          </div>
          
          <div v-if="showRawHtml" class="email-details-page__raw-html">
            <pre>{{ email.htmlContent }}</pre>
          </div>
          
          <iframe
            v-else
            class="email-details-page__iframe"
            :srcdoc="email.htmlContent"
            sandbox="allow-same-origin"
          />
        </div>

        <!-- Text Content -->
        <div v-if="email.textContent" class="email-details-page__text-content">
          <h3 class="email-details-page__subsection-title">Plain Text Version</h3>
          <pre class="email-details-page__text-preview">{{ email.textContent }}</pre>
        </div>

        <!-- Attachments -->
        <div v-if="email.attachments && email.attachments.length > 0" class="email-details-page__attachments">
          <h3 class="email-details-page__subsection-title">Attachments</h3>
          <div class="email-details-page__attachment-list">
            <div
              v-for="attachment in email.attachments"
              :key="attachment.name"
              class="email-details-page__attachment"
            >
              <span class="email-details-page__attachment-name">{{ attachment.name }}</span>
              <span class="email-details-page__attachment-size">{{ formatFileSize(attachment.size) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tracking Events -->
      <div class="email-details-page__section">
        <h2 class="email-details-page__section-title">Tracking Events</h2>
        
        <div v-if="email.trackingEvents.length > 0" class="email-details-page__timeline">
          <div
            v-for="event in email.trackingEvents"
            :key="event.id"
            class="email-details-page__timeline-item"
          >
            <div :class="['email-details-page__timeline-marker', `email-details-page__timeline-marker--${event.type}`]" />
            <div class="email-details-page__timeline-content">
              <div class="email-details-page__timeline-type">{{ formatEventType(event.type) }}</div>
              <div class="email-details-page__timeline-time">{{ formatDateTime(event.timestamp) }}</div>
              <div v-if="event.metadata" class="email-details-page__timeline-metadata">
                <pre>{{ JSON.stringify(event.metadata, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="email-details-page__empty">
          No tracking events recorded
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="email.errorMessage" class="email-details-page__section">
        <h2 class="email-details-page__section-title">Error Details</h2>
        <div class="email-details-page__error-box">
          {{ email.errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmailStore } from '~/stores/email'

const route = useRoute()
const emailStore = useEmailStore()

const emailId = computed(() => route.params.id as string)
const email = computed(() => emailStore.currentEmail)
const loading = computed(() => emailStore.loading)
const error = computed(() => emailStore.error)

const showRawHtml = ref(false)

// Fetch email details on mount
onMounted(async () => {
  try {
    await emailStore.fetchEmailDetails(emailId.value)
  } catch (error) {
    console.error('Failed to load email details:', error)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  emailStore.clearCurrentEmail()
})

// Methods
const retryFetch = async () => {
  emailStore.clearError()
  try {
    await emailStore.fetchEmailDetails(emailId.value)
  } catch (error) {
    console.error('Failed to retry fetch:', error)
  }
}

const handleResend = async () => {
  if (!confirm('Are you sure you want to resend this email?')) return

  try {
    await emailStore.resendEmail(emailId.value)
    alert('Email resent successfully')
  } catch (error) {
    alert('Failed to resend email')
  }
}

// Format helpers
const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatEventType = (type: string): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.email-details-page {
  padding: $spacing-xl;
  max-width: 1200px;
  margin: 0 auto;
}

.email-details-page__loading {
  padding: $spacing-xl;
}

.email-details-page__skeleton {
  background: linear-gradient(90deg, $bg-secondary 25%, $bg-primary 50%, $bg-secondary 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: $radius-lg;
  height: 600px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.email-details-page__error {
  padding: $spacing-xl;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-lg;
  text-align: center;
  
  p {
    color: $error-color;
    font-weight: 500;
    margin-bottom: $spacing-md;
  }
  
  button {
    padding: $spacing-sm $spacing-lg;
    background: $error-color;
    color: white;
    border: none;
    border-radius: $radius-md;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background: darken($error-color, 10%);
    }
  }
}

.email-details-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.email-details-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-details-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.email-details-page__header-actions {
  display: flex;
  gap: $spacing-md;
}

.email-details-page__action-btn {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: $bg-primary;
  color: $text-primary;
  cursor: pointer;
  font-weight: 500;
  transition: all $transition-base;
  
  &:hover {
    background: $bg-secondary;
  }
}

.email-details-page__action-btn--resend {
  background: $success-color;
  color: white;
  border-color: $success-color;
  
  &:hover {
    background: darken($success-color, 10%);
  }
}

.email-details-page__back-btn {
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

.email-details-page__info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.email-details-page__info-card {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.email-details-page__info-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.email-details-page__info-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
}

.email-details-page__section {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
}

.email-details-page__section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-lg;
}

.email-details-page__subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
  margin-top: $spacing-lg;
}

.email-details-page__email-meta {
  margin-bottom: $spacing-lg;
}

.email-details-page__meta-row {
  display: flex;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
}

.email-details-page__meta-label {
  font-weight: 600;
  color: $text-secondary;
  min-width: 100px;
}

.email-details-page__meta-value {
  color: $text-primary;
  flex: 1;
}

.email-details-page__meta-value--subject {
  font-weight: 600;
}

.email-details-page__preview {
  margin-top: $spacing-lg;
}

.email-details-page__preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.email-details-page__preview-title {
  font-weight: 600;
  color: $text-primary;
}

.email-details-page__preview-toggle {
  padding: $spacing-xs $spacing-sm;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background $transition-base;
  
  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.email-details-page__iframe {
  width: 100%;
  min-height: 500px;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: white;
}

.email-details-page__raw-html {
  background: $bg-dark;
  color: #e2e8f0;
  padding: $spacing-md;
  border-radius: $radius-md;
  overflow-x: auto;
  
  pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}

.email-details-page__text-preview {
  background: $bg-secondary;
  padding: $spacing-md;
  border-radius: $radius-md;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: $text-primary;
  margin: 0;
}

.email-details-page__attachment-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.email-details-page__attachment {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.email-details-page__attachment-name {
  font-weight: 500;
  color: $text-primary;
}

.email-details-page__attachment-size {
  color: $text-secondary;
  font-size: 0.875rem;
}

.email-details-page__timeline {
  position: relative;
  padding-left: $spacing-xl;
  
  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: $border-color;
  }
}

.email-details-page__timeline-item {
  position: relative;
  padding-bottom: $spacing-lg;
  
  &:last-child {
    padding-bottom: 0;
  }
}

.email-details-page__timeline-marker {
  position: absolute;
  left: -28px;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid $bg-primary;
}

.email-details-page__timeline-marker--sent {
  background: $secondary-color;
}

.email-details-page__timeline-marker--delivered {
  background: $success-color;
}

.email-details-page__timeline-marker--opened {
  background: $primary-color;
}

.email-details-page__timeline-marker--clicked {
  background: $info-color;
}

.email-details-page__timeline-marker--bounced {
  background: $warning-color;
}

.email-details-page__timeline-marker--failed {
  background: $error-color;
}

.email-details-page__timeline-marker--spam_report {
  background: $error-color;
}

.email-details-page__timeline-content {
  padding-left: $spacing-md;
}

.email-details-page__timeline-type {
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.email-details-page__timeline-time {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.email-details-page__timeline-metadata {
  background: $bg-secondary;
  padding: $spacing-sm;
  border-radius: $radius-sm;
  margin-top: $spacing-xs;
  
  pre {
    margin: 0;
    font-size: 0.75rem;
    color: $text-secondary;
  }
}

.email-details-page__empty {
  text-align: center;
  padding: $spacing-xl;
  color: $text-secondary;
}

.email-details-page__error-box {
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  padding: $spacing-md;
  color: $error-color;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--sent {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge--delivered {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--opened {
  background: lighten($primary-color, 40%);
  color: $primary-color;
}

.status-badge--clicked {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.status-badge--bounced {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.status-badge--failed {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge--pending {
  background: lighten($secondary-color, 45%);
  color: $secondary-color;
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

@media (max-width: $breakpoint-md) {
  .email-details-page {
    padding: $spacing-lg;
  }
  
  .email-details-page__header {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .email-details-page__header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .email-details-page__info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
