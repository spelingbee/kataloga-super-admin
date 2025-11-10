<template>
  <div class="registration-details">
    <!-- Loading State -->
    <div v-if="loading && !registration" class="registration-details__loading">
      <div class="registration-details__spinner"></div>
      <p>Loading registration details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="registration-details__error">
      <h2>Failed to load registration details</h2>
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
      <button @click="goBack">Go Back</button>
    </div>

    <!-- Registration Details -->
    <div v-else-if="registration" class="registration-details__content">
      <!-- Header -->
      <div class="registration-details__header">
        <button class="registration-details__back-btn" @click="goBack">
          ← Back to Registrations
        </button>
        <div class="registration-details__header-content">
          <div class="registration-details__title-section">
            <h1 class="registration-details__title">{{ registration.name }}</h1>
            <span :class="['status-badge', `status-badge--${registration.status}`]">
              {{ formatStatus(registration.status) }}
            </span>
            <span v-if="registration.priority" :class="['priority-badge', `priority-badge--${registration.priority}`]">
              {{ registration.priority }} priority
            </span>
          </div>
          <div v-if="registration.status === 'pending'" class="registration-details__actions">
            <button
              class="registration-details__action-btn registration-details__action-btn--approve"
              @click="handleApprove"
            >
              Approve
            </button>
            <button
              class="registration-details__action-btn registration-details__action-btn--reject"
              @click="handleReject"
            >
              Reject
            </button>
            <button
              class="registration-details__action-btn registration-details__action-btn--info"
              @click="handleRequestInfo"
            >
              Request Info
            </button>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="registration-details__grid">
        <!-- Business Information -->
        <div class="registration-details__card">
          <h2 class="registration-details__card-title">Business Information</h2>
          <div class="registration-details__info-grid">
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Business Name</span>
              <span class="registration-details__info-value">{{ registration.name }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Slug</span>
              <span class="registration-details__info-value">{{ registration.slug }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Business Type</span>
              <span class="registration-details__info-value">{{ registration.businessType }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Submitted</span>
              <span class="registration-details__info-value">{{ formatDate(registration.createdAt) }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Registration Age</span>
              <span :class="['age-badge', getAgePriorityClass(registration.registrationAge)]">
                {{ registration.registrationAge }} day{{ registration.registrationAge !== 1 ? 's' : '' }} ago
              </span>
            </div>
            <div v-if="registration.businessDetails?.description" class="registration-details__info-item registration-details__info-item--full">
              <span class="registration-details__info-label">Description</span>
              <span class="registration-details__info-value">{{ registration.businessDetails.description }}</span>
            </div>
            <div v-if="registration.businessDetails?.website" class="registration-details__info-item">
              <span class="registration-details__info-label">Website</span>
              <span class="registration-details__info-value">
                <a :href="registration.businessDetails.website" target="_blank" rel="noopener noreferrer">
                  {{ registration.businessDetails.website }}
                </a>
              </span>
            </div>
            <div v-if="registration.businessDetails?.taxId" class="registration-details__info-item">
              <span class="registration-details__info-label">Tax ID</span>
              <span class="registration-details__info-value">{{ registration.businessDetails.taxId }}</span>
            </div>
            <div v-if="registration.businessDetails?.registrationNumber" class="registration-details__info-item">
              <span class="registration-details__info-label">Registration Number</span>
              <span class="registration-details__info-value">{{ registration.businessDetails.registrationNumber }}</span>
            </div>
          </div>
        </div>

        <!-- Owner Details -->
        <div class="registration-details__card">
          <h2 class="registration-details__card-title">Owner Details</h2>
          <div class="registration-details__info-grid">
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Name</span>
              <span class="registration-details__info-value">{{ registration.owner.name }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Email</span>
              <span class="registration-details__info-value">
                <a :href="`mailto:${registration.owner.email}`">{{ registration.owner.email }}</a>
              </span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Phone</span>
              <span class="registration-details__info-value">
                <a :href="`tel:${registration.owner.phone}`">{{ registration.owner.phone }}</a>
              </span>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="registration-details__card">
          <h2 class="registration-details__card-title">Address</h2>
          <div class="registration-details__info-grid">
            <div class="registration-details__info-item registration-details__info-item--full">
              <span class="registration-details__info-label">Street</span>
              <span class="registration-details__info-value">{{ registration.address.street }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">City</span>
              <span class="registration-details__info-value">{{ registration.address.city }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">State</span>
              <span class="registration-details__info-value">{{ registration.address.state }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Postal Code</span>
              <span class="registration-details__info-value">{{ registration.address.postalCode }}</span>
            </div>
            <div class="registration-details__info-item">
              <span class="registration-details__info-label">Country</span>
              <span class="registration-details__info-value">{{ registration.address.country }}</span>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div v-if="registration.documents && registration.documents.length > 0" class="registration-details__card registration-details__card--full">
          <h2 class="registration-details__card-title">Uploaded Documents</h2>
          <div class="registration-details__documents">
            <div
              v-for="document in registration.documents"
              :key="document.id"
              class="registration-details__document"
            >
              <div class="registration-details__document-icon">
                📄
              </div>
              <div class="registration-details__document-info">
                <div class="registration-details__document-name">{{ document.name }}</div>
                <div class="registration-details__document-meta">
                  {{ document.type }} • {{ formatFileSize(document.size) }} • {{ formatDate(document.uploadedAt) }}
                </div>
              </div>
              <div class="registration-details__document-actions">
                <button
                  class="registration-details__document-btn"
                  @click="viewDocument(document)"
                >
                  View
                </button>
                <a
                  :href="document.url"
                  :download="document.name"
                  class="registration-details__document-btn"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Review Information -->
        <div v-if="registration.status !== 'pending'" class="registration-details__card registration-details__card--full">
          <h2 class="registration-details__card-title">Review Information</h2>
          <div class="registration-details__info-grid">
            <div v-if="registration.reviewedBy" class="registration-details__info-item">
              <span class="registration-details__info-label">Reviewed By</span>
              <span class="registration-details__info-value">{{ registration.reviewedBy }}</span>
            </div>
            <div v-if="registration.reviewedAt" class="registration-details__info-item">
              <span class="registration-details__info-label">Reviewed At</span>
              <span class="registration-details__info-value">{{ formatDate(registration.reviewedAt) }}</span>
            </div>
            <div v-if="registration.notes" class="registration-details__info-item registration-details__info-item--full">
              <span class="registration-details__info-label">Notes</span>
              <span class="registration-details__info-value">{{ registration.notes }}</span>
            </div>
            <div v-if="registration.rejectionReason" class="registration-details__info-item registration-details__info-item--full">
              <span class="registration-details__info-label">Rejection Reason</span>
              <span class="registration-details__info-value registration-details__info-value--error">
                {{ registration.rejectionReason }}
              </span>
            </div>
            <div v-if="registration.infoRequestMessage" class="registration-details__info-item registration-details__info-item--full">
              <span class="registration-details__info-label">Information Request</span>
              <span class="registration-details__info-value registration-details__info-value--info">
                {{ registration.infoRequestMessage }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Viewer Modal -->
    <DocumentViewer
      v-if="selectedDocument"
      v-model="showDocumentViewer"
      :document="selectedDocument"
      @close="closeDocumentViewer"
    />

    <!-- Approval Modal -->
    <ApprovalModal
      v-if="registration"
      v-model="showApprovalModal"
      :tenant-name="registration.name"
      :loading="actionLoading"
      @approve="onApprove"
      @cancel="showApprovalModal = false"
    />

    <!-- Rejection Modal -->
    <RejectionModal
      v-if="registration"
      v-model="showRejectionModal"
      :tenant-name="registration.name"
      :loading="actionLoading"
      @reject="onReject"
      @cancel="showRejectionModal = false"
    />

    <!-- Request Info Modal -->
    <RequestInfoModal
      v-if="registration"
      v-model="showRequestInfoModal"
      :tenant-name="registration.name"
      :loading="actionLoading"
      @request-info="onRequestInfo"
      @cancel="showRequestInfoModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRegistrationStore } from '~/stores/registration'
import { formatDate } from '~/utils/date'
import DocumentViewer from '~/components/registration/DocumentViewer.vue'
import ApprovalModal from '~/components/registration/ApprovalModal.vue'
import RejectionModal from '~/components/registration/RejectionModal.vue'
import RequestInfoModal from '~/components/registration/RequestInfoModal.vue'
import type { RegistrationDocument } from '~/types'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const registrationStore = useRegistrationStore()
const { success, error: showError } = useNotification()

const registrationId = computed(() => route.params.id as string)
const registration = computed(() => registrationStore.currentRegistration)
const loading = computed(() => registrationStore.loading)
const error = computed(() => registrationStore.error)

const showDocumentViewer = ref(false)
const selectedDocument = ref<RegistrationDocument | null>(null)
const showApprovalModal = ref(false)
const showRejectionModal = ref(false)
const showRequestInfoModal = ref(false)
const actionLoading = ref(false)

// Methods
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    info_requested: 'Info Requested',
  }
  return statusMap[status] || status
}

function getAgePriorityClass(age: number): string {
  if (age > 7) return 'age-badge--high'
  if (age > 3) return 'age-badge--medium'
  return 'age-badge--low'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function goBack(): void {
  router.push('/registrations')
}

function viewDocument(document: RegistrationDocument): void {
  selectedDocument.value = document
  showDocumentViewer.value = true
}

function closeDocumentViewer(): void {
  showDocumentViewer.value = false
  selectedDocument.value = null
}

function handleApprove(): void {
  showApprovalModal.value = true
}

function handleReject(): void {
  showRejectionModal.value = true
}

function handleRequestInfo(): void {
  showRequestInfoModal.value = true
}

async function onApprove(notes: string): Promise<void> {
  actionLoading.value = true
  try {
    await registrationStore.approveRegistration(registrationId.value, notes || undefined)
    success('Registration approved successfully')
    showApprovalModal.value = false
    await fetchRegistrationDetails()
  } catch (err) {
    showError('Failed to approve registration')
  } finally {
    actionLoading.value = false
  }
}

async function onReject(reason: string): Promise<void> {
  actionLoading.value = true
  try {
    await registrationStore.rejectRegistration(registrationId.value, reason)
    success('Registration rejected')
    showRejectionModal.value = false
    await fetchRegistrationDetails()
  } catch (err) {
    showError('Failed to reject registration')
  } finally {
    actionLoading.value = false
  }
}

async function onRequestInfo(message: string): Promise<void> {
  actionLoading.value = true
  try {
    await registrationStore.requestInformation(registrationId.value, message)
    success('Information request sent')
    showRequestInfoModal.value = false
    await fetchRegistrationDetails()
  } catch (err) {
    showError('Failed to send information request')
  } finally {
    actionLoading.value = false
  }
}

async function fetchRegistrationDetails(): Promise<void> {
  try {
    await registrationStore.fetchRegistrationDetails(registrationId.value)
  } catch (error) {
    console.error('Failed to fetch registration details:', error)
  }
}

async function retryFetch(): Promise<void> {
  registrationStore.clearError()
  await fetchRegistrationDetails()
}

// Fetch on mount
onMounted(() => {
  fetchRegistrationDetails()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.registration-details {
  padding: $spacing-lg;
  min-height: 100vh;
}

.registration-details__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: $spacing-md;

  p {
    color: $text-secondary;
  }
}

.registration-details__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid $bg-secondary;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.registration-details__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: $spacing-md;
  text-align: center;

  h2 {
    color: $error-color;
    font-size: 1.5rem;
  }

  p {
    color: $text-secondary;
  }

  button {
    padding: $spacing-sm $spacing-lg;
    background: $primary-color;
    color: white;
    border: none;
    border-radius: $radius-md;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      background: darken($primary-color, 10%);
    }

    & + button {
      background: $bg-secondary;
      color: $text-primary;
      border: 1px solid $border-color;

      &:hover {
        background: darken($bg-secondary, 3%);
      }
    }
  }
}

.registration-details__header {
  margin-bottom: $spacing-xl;
}

.registration-details__back-btn {
  padding: $spacing-xs $spacing-md;
  background: transparent;
  border: none;
  color: $primary-color;
  cursor: pointer;
  font-size: 0.875rem;
  margin-bottom: $spacing-md;
  transition: $transition-base;

  &:hover {
    color: darken($primary-color, 10%);
  }
}

.registration-details__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.registration-details__title-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.registration-details__title {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--pending {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.status-badge--approved {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--rejected {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge--info_requested {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.priority-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge--high {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.priority-badge--medium {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.priority-badge--low {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.age-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
}

.age-badge--low {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.age-badge--medium {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.age-badge--high {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.registration-details__actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.registration-details__action-btn {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: white;
  color: $text-primary;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;
  white-space: nowrap;

  &:hover {
    background: $bg-secondary;
  }
}

.registration-details__action-btn--approve {
  background: $success-color;
  color: white;
  border-color: $success-color;

  &:hover {
    background: darken($success-color, 10%);
  }
}

.registration-details__action-btn--reject {
  background: $error-color;
  color: white;
  border-color: $error-color;

  &:hover {
    background: darken($error-color, 10%);
  }
}

.registration-details__action-btn--info {
  background: $info-color;
  color: white;
  border-color: $info-color;

  &:hover {
    background: darken($info-color, 10%);
  }
}

.registration-details__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: $spacing-lg;
}

.registration-details__card {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.registration-details__card--full {
  grid-column: 1 / -1;
}

.registration-details__card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-md 0;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.registration-details__info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.registration-details__info-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.registration-details__info-item--full {
  grid-column: 1 / -1;
}

.registration-details__info-label {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 500;
}

.registration-details__info-value {
  font-size: 1rem;
  color: $text-primary;

  a {
    color: $primary-color;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.registration-details__info-value--error {
  color: $error-color;
  background: lighten($error-color, 45%);
  padding: $spacing-sm;
  border-radius: $radius-sm;
}

.registration-details__info-value--info {
  color: $info-color;
  background: lighten($info-color, 45%);
  padding: $spacing-sm;
  border-radius: $radius-sm;
}

.registration-details__documents {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.registration-details__document {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  transition: $transition-base;

  &:hover {
    background: darken($bg-secondary, 2%);
  }
}

.registration-details__document-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.registration-details__document-info {
  flex: 1;
  min-width: 0;
}

.registration-details__document-name {
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.registration-details__document-meta {
  font-size: 0.875rem;
  color: $text-secondary;
}

.registration-details__document-actions {
  display: flex;
  gap: $spacing-xs;
  flex-shrink: 0;
}

.registration-details__document-btn {
  padding: $spacing-xs $spacing-md;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-primary;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: none;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
  }
}

@media (max-width: $breakpoint-lg) {
  .registration-details__grid {
    grid-template-columns: 1fr;
  }

  .registration-details__header-content {
    flex-direction: column;
  }

  .registration-details__actions {
    width: 100%;
  }

  .registration-details__action-btn {
    flex: 1;
  }
}

@media (max-width: $breakpoint-md) {
  .registration-details {
    padding: $spacing-md;
  }

  .registration-details__title {
    font-size: 1.5rem;
  }

  .registration-details__info-grid {
    grid-template-columns: 1fr;
  }

  .registration-details__document {
    flex-direction: column;
    align-items: flex-start;
  }

  .registration-details__document-actions {
    width: 100%;
  }

  .registration-details__document-btn {
    flex: 1;
  }
}
</style>
