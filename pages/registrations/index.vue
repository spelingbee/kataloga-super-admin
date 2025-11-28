<template>
  <div class="registrations-page">
    <div class="registrations-page__header">
      <h1 class="registrations-page__title">Registration Management</h1>
      <p class="registrations-page__subtitle">
        Review and approve tenant registrations
      </p>
    </div>

    <!-- Filters -->
    <div class="registrations-page__filters">
      <div class="registrations-page__filter-group">
        <FormInput
          v-model="searchQuery"
          placeholder="Search by name, email, or business..."
          class="registrations-page__search"
        />
      </div>

      <div class="registrations-page__filter-group">
        <FormSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="registrations-page__filter"
        />

        <FormSelect
          v-model="businessTypeFilter"
          :options="businessTypeOptions"
          placeholder="All Business Types"
          class="registrations-page__filter"
        />

        <FormSelect
          v-model="sortByFilter"
          :options="sortByOptions"
          placeholder="Sort By"
          class="registrations-page__filter"
        />

        <button
          v-if="hasFilters"
          class="registrations-page__clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="hasSelection" class="registrations-page__bulk-actions">
      <div class="registrations-page__bulk-info">
        {{ selectedCount }} registration(s) selected
      </div>
      <div class="registrations-page__bulk-buttons">
        <button
          class="registrations-page__bulk-btn registrations-page__bulk-btn--approve"
          @click="handleBulkApprove"
        >
          Approve Selected
        </button>
        <button
          class="registrations-page__bulk-btn registrations-page__bulk-btn--reject"
          @click="handleBulkReject"
        >
          Reject Selected
        </button>
        <button
          class="registrations-page__bulk-btn"
          @click="clearSelection"
        >
          Clear Selection
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="registrations-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Data Table -->
    <DataTable
      :columns="columns"
      :data="registrations"
      :searchable="false"
      :paginated="false"
      :selectable="true"
      :selected-ids="selectedIds"
      empty-message="No registrations found"
      @select="handleSelect"
      @select-all="handleSelectAll"
    >
      <!-- Status Badge -->
      <template #cell-status="{ value }">
        <span :class="['status-badge', `status-badge--${value}`]">
          {{ formatStatus(value) }}
        </span>
      </template>

      <!-- Owner -->
      <template #cell-owner="{ row }">
        <div class="registrations-page__owner">
          <div class="registrations-page__owner-name">{{ row.owner.name }}</div>
          <div class="registrations-page__owner-email">{{ row.owner.email }}</div>
        </div>
      </template>

      <!-- Registration Age -->
      <template #cell-registrationAge="{ value }">
        <span :class="['age-badge', getAgePriorityClass(value)]">
          {{ value }} day{{ value !== 1 ? 's' : '' }} ago
        </span>
      </template>

      <!-- Priority -->
      <template #cell-priority="{ value }">
        <span v-if="value" :class="['priority-badge', `priority-badge--${value}`]">
          {{ value }}
        </span>
      </template>

      <!-- Created Date -->
      <template #cell-createdAt="{ value }">
        {{ formatDate(value) }}
      </template>

      <!-- Actions -->
      <template #actions="{ row }">
        <div class="registrations-page__actions">
          <button
            class="registrations-page__action-btn registrations-page__action-btn--view"
            @click="viewRegistration(row.id)"
          >
            View Details
          </button>
          <button
            v-if="row.status === 'pending'"
            class="registrations-page__action-btn registrations-page__action-btn--approve"
            @click="handleApprove(row.id)"
          >
            Approve
          </button>
          <button
            v-if="row.status === 'pending'"
            class="registrations-page__action-btn registrations-page__action-btn--reject"
            @click="handleReject(row.id)"
          >
            Reject
          </button>
          <button
            v-if="row.status === 'pending'"
            class="registrations-page__action-btn registrations-page__action-btn--info"
            @click="handleRequestInfo(row.id)"
          >
            Request Info
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="registrations-page__pagination">
      <div class="registrations-page__pagination-info">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ total }} registrations
      </div>
      <div class="registrations-page__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="registrations-page__pagination-btn"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'registrations-page__pagination-btn',
            { 'registrations-page__pagination-btn--active': page === currentPage },
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="registrations-page__pagination-btn"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="registrations-page__loading">
      <div class="registrations-page__spinner"/>
    </div>

    <!-- Approval Modal -->
    <ApprovalModal
      v-model="showApprovalModal"
      :tenant-name="currentRegistrationName"
      :loading="actionLoading"
      @approve="onApprove"
      @cancel="showApprovalModal = false"
    />

    <!-- Rejection Modal -->
    <RejectionModal
      v-model="showRejectionModal"
      :tenant-name="currentRegistrationName"
      :loading="actionLoading"
      @reject="onReject"
      @cancel="showRejectionModal = false"
    />

    <!-- Request Info Modal -->
    <RequestInfoModal
      v-model="showRequestInfoModal"
      :tenant-name="currentRegistrationName"
      :loading="actionLoading"
      @request-info="onRequestInfo"
      @cancel="showRequestInfoModal = false"
    />

    <!-- Bulk Approval Confirm Dialog -->
    <ConfirmDialog
      v-model="showBulkApprovalConfirm"
      title="Bulk Approve Registrations"
      :message="`Are you sure you want to approve ${selectedCount} registration(s)? This will create tenant accounts and send welcome emails.`"
      type="default"
      confirm-text="Approve All"
      cancel-text="Cancel"
      @confirm="onBulkApproveConfirm"
      @cancel="showBulkApprovalConfirm = false"
    />

    <!-- Bulk Rejection Modal -->
    <RejectionModal
      v-model="showBulkRejectionModal"
      :tenant-name="currentRegistrationName"
      :loading="actionLoading"
      @reject="onBulkReject"
      @cancel="showBulkRejectionModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRegistrationStore } from '~/stores/registration'
import { formatDate } from '~/utils/date'
import ApprovalModal from '~/components/registration/ApprovalModal.vue'
import RejectionModal from '~/components/registration/RejectionModal.vue'
import RequestInfoModal from '~/components/registration/RequestInfoModal.vue'
import ConfirmDialog from '~/components/ui/Modal/ConfirmDialog.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const registrationStore = useRegistrationStore()
const { success, error: showError } = useNotification()

// Modal states
const showApprovalModal = ref(false)
const showRejectionModal = ref(false)
const showRequestInfoModal = ref(false)
const showBulkApprovalConfirm = ref(false)
const showBulkRejectionModal = ref(false)
const actionLoading = ref(false)
const currentRegistrationId = ref<string | null>(null)
const currentRegistrationName = ref('')

// Filters
const searchQuery = ref('')
const statusFilter = ref('pending')
const businessTypeFilter = ref('')
const sortByFilter = ref('createdAt')

// Filter options
const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'info_requested', label: 'Info Requested' },
]

const businessTypeOptions = [
  { value: '', label: 'All Business Types' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bar', label: 'Bar' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'bakery', label: 'Bakery' },
]

const sortByOptions = [
  { value: 'createdAt', label: 'Date (Newest)' },
  { value: 'name', label: 'Name' },
  { value: 'businessType', label: 'Business Type' },
]

// Table columns
const columns = [
  { key: 'name', label: 'Business Name', sortable: true },
  { key: 'businessType', label: 'Type', sortable: true },
  { key: 'owner', label: 'Owner', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'registrationAge', label: 'Age', sortable: true },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'createdAt', label: 'Submitted', sortable: true },
]

// Computed
const registrations = computed(() => registrationStore.registrations)
const loading = computed(() => registrationStore.loading)
const error = computed(() => registrationStore.error)
const currentPage = computed(() => registrationStore.pagination.page)
const totalPages = computed(() => registrationStore.pagination.totalPages)
const total = computed(() => registrationStore.pagination.total)
const limit = computed(() => registrationStore.pagination.limit)
const selectedIds = computed(() => registrationStore.selectedIds)
const selectedCount = computed(() => registrationStore.selectedCount)
const hasSelection = computed(() => registrationStore.hasSelection)

const hasFilters = computed(() => {
  return !!(searchQuery.value || statusFilter.value || businessTypeFilter.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * limit.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + limit.value, total.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

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

function viewRegistration(registrationId: string): void {
  router.push(`/registrations/${registrationId}`)
}

function handleApprove(registrationId: string): void {
  const registration = registrations.value.find(r => r.id === registrationId)
  if (!registration) return
  
  currentRegistrationId.value = registrationId
  currentRegistrationName.value = registration.name
  showApprovalModal.value = true
}

function handleReject(registrationId: string): void {
  const registration = registrations.value.find(r => r.id === registrationId)
  if (!registration) return
  
  currentRegistrationId.value = registrationId
  currentRegistrationName.value = registration.name
  showRejectionModal.value = true
}

function handleRequestInfo(registrationId: string): void {
  const registration = registrations.value.find(r => r.id === registrationId)
  if (!registration) return
  
  currentRegistrationId.value = registrationId
  currentRegistrationName.value = registration.name
  showRequestInfoModal.value = true
}

async function onApprove(notes: string): Promise<void> {
  if (!currentRegistrationId.value) return
  
  actionLoading.value = true
  try {
    await registrationStore.approveRegistration(currentRegistrationId.value, notes || undefined)
    success('Registration approved successfully')
    showApprovalModal.value = false
    await fetchRegistrations()
  } catch (err) {
    showError('Failed to approve registration')
  } finally {
    actionLoading.value = false
    currentRegistrationId.value = null
  }
}

async function onReject(reason: string): Promise<void> {
  if (!currentRegistrationId.value) return
  
  actionLoading.value = true
  try {
    await registrationStore.rejectRegistration(currentRegistrationId.value, reason)
    success('Registration rejected')
    showRejectionModal.value = false
    await fetchRegistrations()
  } catch (err) {
    showError('Failed to reject registration')
  } finally {
    actionLoading.value = false
    currentRegistrationId.value = null
  }
}

async function onRequestInfo(message: string): Promise<void> {
  if (!currentRegistrationId.value) return
  
  actionLoading.value = true
  try {
    await registrationStore.requestInformation(currentRegistrationId.value, message)
    success('Information request sent')
    showRequestInfoModal.value = false
    await fetchRegistrations()
  } catch (err) {
    showError('Failed to send information request')
  } finally {
    actionLoading.value = false
    currentRegistrationId.value = null
  }
}

function handleBulkApprove(): void {
  showBulkApprovalConfirm.value = true
}

function handleBulkReject(): void {
  currentRegistrationName.value = `${selectedCount.value} registration(s)`
  showBulkRejectionModal.value = true
}

async function onBulkApproveConfirm(): Promise<void> {
  actionLoading.value = true
  try {
    await registrationStore.bulkApprove(selectedIds.value)
    success(`${selectedCount.value} registration(s) approved successfully`)
    showBulkApprovalConfirm.value = false
    await fetchRegistrations()
  } catch (err) {
    showError('Failed to bulk approve registrations')
  } finally {
    actionLoading.value = false
  }
}

async function onBulkReject(reason: string): Promise<void> {
  actionLoading.value = true
  try {
    await registrationStore.bulkReject(selectedIds.value, reason)
    success(`${selectedCount.value} registration(s) rejected`)
    showBulkRejectionModal.value = false
    await fetchRegistrations()
  } catch (err) {
    showError('Failed to bulk reject registrations')
  } finally {
    actionLoading.value = false
  }
}

function handleSelect(registrationId: string): void {
  registrationStore.toggleSelection(registrationId)
}

function handleSelectAll(): void {
  if (hasSelection.value) {
    registrationStore.clearSelection()
  } else {
    registrationStore.selectAll()
  }
}

function clearSelection(): void {
  registrationStore.clearSelection()
}

function clearFilters(): void {
  searchQuery.value = ''
  statusFilter.value = 'pending'
  businessTypeFilter.value = ''
  sortByFilter.value = 'createdAt'
  registrationStore.clearFilters()
  fetchRegistrations()
}

async function goToPage(page: number): Promise<void> {
  registrationStore.setPage(page)
  await fetchRegistrations()
}

async function fetchRegistrations(): Promise<void> {
  try {
    await registrationStore.fetchRegistrations(currentPage.value)
  } catch (error) {
    console.error('Failed to fetch registrations:', error)
  }
}

async function retryFetch(): Promise<void> {
  registrationStore.clearError()
  await fetchRegistrations()
}

// Watch filters and refetch
watch([searchQuery, statusFilter, businessTypeFilter, sortByFilter], () => {
  registrationStore.setFilters({
    search: searchQuery.value,
    status: statusFilter.value as any,
    businessType: businessTypeFilter.value,
    sortBy: sortByFilter.value as any,
  })
  registrationStore.setPage(1)
  fetchRegistrations()
}, { debounce: 300 })

// Fetch on mount
onMounted(() => {
  fetchRegistrations()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.registrations-page {
  padding: $spacing-lg;
}

.registrations-page__header {
  margin-bottom: $spacing-xl;
}

.registrations-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.registrations-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.registrations-page__filters {
  margin-bottom: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.registrations-page__filter-group {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.registrations-page__search {
  flex: 1;
  min-width: 300px;
}

.registrations-page__filter {
  min-width: 200px;
}

.registrations-page__clear-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.registrations-page__bulk-actions {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: lighten($primary-color, 45%);
  border: 1px solid $primary-color;
  border-radius: $radius-md;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.registrations-page__bulk-info {
  font-weight: 600;
  color: $primary-color;
}

.registrations-page__bulk-buttons {
  display: flex;
  gap: $spacing-sm;
}

.registrations-page__bulk-btn {
  padding: $spacing-xs $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: white;
  color: $text-primary;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
  }
}

.registrations-page__bulk-btn--approve {
  background: $success-color;
  color: white;
  border-color: $success-color;

  &:hover {
    background: darken($success-color, 10%);
  }
}

.registrations-page__bulk-btn--reject {
  background: $error-color;
  color: white;
  border-color: $error-color;

  &:hover {
    background: darken($error-color, 10%);
  }
}

.registrations-page__error {
  padding: $spacing-md;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    color: $error-color;
    margin: 0;
  }

  button {
    padding: $spacing-xs $spacing-md;
    background: $error-color;
    color: white;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      background: darken($error-color, 10%);
    }
  }
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
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

.registrations-page__owner {
  display: flex;
  flex-direction: column;
}

.registrations-page__owner-name {
  font-weight: 600;
  color: $text-primary;
}

.registrations-page__owner-email {
  font-size: 0.875rem;
  color: $text-secondary;
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

.priority-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
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

.registrations-page__actions {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.registrations-page__action-btn {
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
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

.registrations-page__action-btn--view {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
  }
}

.registrations-page__action-btn--approve {
  color: $success-color;
  border-color: $success-color;

  &:hover {
    background: lighten($success-color, 45%);
  }
}

.registrations-page__action-btn--reject {
  color: $error-color;
  border-color: $error-color;

  &:hover {
    background: lighten($error-color, 45%);
  }
}

.registrations-page__action-btn--info {
  color: $info-color;
  border-color: $info-color;

  &:hover {
    background: lighten($info-color, 45%);
  }
}

.registrations-page__pagination {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.registrations-page__pagination-info {
  color: $text-secondary;
  font-size: 0.875rem;
}

.registrations-page__pagination-controls {
  display: flex;
  gap: $spacing-xs;
}

.registrations-page__pagination-btn {
  padding: $spacing-xs $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: white;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.registrations-page__pagination-btn--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.registrations-page__loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.registrations-page__spinner {
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

@media (max-width: $breakpoint-md) {
  .registrations-page__filter-group {
    flex-direction: column;
  }

  .registrations-page__search,
  .registrations-page__filter {
    width: 100%;
    min-width: auto;
  }

  .registrations-page__bulk-actions {
    flex-direction: column;
    gap: $spacing-md;
    align-items: flex-start;
  }

  .registrations-page__bulk-buttons {
    width: 100%;
    flex-wrap: wrap;
  }

  .registrations-page__pagination {
    flex-direction: column;
    gap: $spacing-md;
  }
}
</style>
