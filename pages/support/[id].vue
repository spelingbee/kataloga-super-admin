<template>
  <div class="ticket-details-page">
    <!-- Loading State -->
    <div v-if="loading && !ticket" class="ticket-details-page__loading">
      <p>Loading ticket details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="ticket-details-page__error">
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
    </div>

    <!-- Ticket Details -->
    <div v-else-if="ticket" class="ticket-details-page__content">
      <!-- Header -->
      <div class="ticket-details-page__header">
        <button
          class="ticket-details-page__back-btn"
          @click="goBack"
        >
          ← Back to Tickets
        </button>

        <div class="ticket-details-page__header-content">
          <div class="ticket-details-page__header-left">
            <h1 class="ticket-details-page__title">{{ ticket.subject }}</h1>
            <div class="ticket-details-page__meta">
              <span :class="['priority-badge', `priority-badge--${ticket.priority}`]">
                {{ formatPriority(ticket.priority) }}
              </span>
              <span :class="['status-badge', `status-badge--${ticket.status}`]">
                {{ formatStatus(ticket.status) }}
              </span>
              <span class="ticket-details-page__ticket-id">
                #{{ ticket.id.slice(0, 8) }}
              </span>
            </div>
          </div>

          <div class="ticket-details-page__header-actions">
            <button
              v-if="ticket.status !== 'closed'"
              class="ticket-details-page__action-btn ticket-details-page__action-btn--close"
              @click="handleCloseTicket"
            >
              Close Ticket
            </button>
            <button
              v-else
              class="ticket-details-page__action-btn ticket-details-page__action-btn--reopen"
              @click="handleReopenTicket"
            >
              Reopen Ticket
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="ticket-details-page__main">
        <!-- Left Column: Conversation -->
        <div class="ticket-details-page__conversation">
          <div class="ticket-details-page__section-title">Conversation</div>

          <!-- Initial Description -->
          <div class="ticket-details-page__message ticket-details-page__message--initial">
            <div class="ticket-details-page__message-header">
              <div class="ticket-details-page__message-author">
                <span class="ticket-details-page__author-name">{{ ticket.createdBy }}</span>
                <span class="ticket-details-page__author-role">Tenant</span>
              </div>
              <span class="ticket-details-page__message-time">
                {{ formatDateTime(ticket.createdAt) }}
              </span>
            </div>
            <div class="ticket-details-page__message-content">
              {{ ticket.description }}
            </div>
          </div>

          <!-- Messages -->
          <div
            v-for="message in ticket.messages"
            :key="message.id"
            :class="[
              'ticket-details-page__message',
              {
                'ticket-details-page__message--internal': message.isInternal,
                'ticket-details-page__message--admin': message.createdByRole === 'admin',
              },
            ]"
          >
            <div class="ticket-details-page__message-header">
              <div class="ticket-details-page__message-author">
                <span class="ticket-details-page__author-name">{{ message.createdByName }}</span>
                <span class="ticket-details-page__author-role">
                  {{ message.createdByRole === 'admin' ? 'Admin' : 'Tenant' }}
                </span>
                <span v-if="message.isInternal" class="ticket-details-page__internal-badge">
                  Internal Note
                </span>
              </div>
              <span class="ticket-details-page__message-time">
                {{ formatDateTime(message.createdAt) }}
              </span>
            </div>
            <div class="ticket-details-page__message-content">
              {{ message.content }}
            </div>
            <div v-if="message.attachments && message.attachments.length > 0" class="ticket-details-page__attachments">
              <div
                v-for="attachment in message.attachments"
                :key="attachment.id"
                class="ticket-details-page__attachment"
              >
                <a :href="attachment.url" target="_blank" class="ticket-details-page__attachment-link">
                  📎 {{ attachment.name }} ({{ formatFileSize(attachment.size) }})
                </a>
              </div>
            </div>
          </div>

          <!-- Reply Form -->
          <div v-if="ticket.status !== 'closed'" class="ticket-details-page__reply-form">
            <div class="ticket-details-page__section-title">Reply</div>
            <FormTextarea
              v-model="replyContent"
              placeholder="Type your reply..."
              :rows="6"
              class="ticket-details-page__reply-textarea"
            />

            <div class="ticket-details-page__reply-actions">
              <label class="ticket-details-page__checkbox">
                <input
                  v-model="isInternalNote"
                  type="checkbox"
                />
                <span>Internal note (not visible to tenant)</span>
              </label>

              <div class="ticket-details-page__reply-buttons">
                <button
                  class="ticket-details-page__reply-btn"
                  :disabled="!replyContent.trim() || saving"
                  @click="handleReply"
                >
                  {{ saving ? 'Sending...' : 'Send Reply' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Ticket Info -->
        <div class="ticket-details-page__sidebar">
          <!-- Tenant Information -->
          <div class="ticket-details-page__info-card">
            <div class="ticket-details-page__info-title">Tenant Information</div>
            <div class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Name:</span>
              <span class="ticket-details-page__info-value">{{ ticket.tenant.name }}</span>
            </div>
            <div class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Email:</span>
              <span class="ticket-details-page__info-value">{{ ticket.tenant.email }}</span>
            </div>
            <div v-if="ticket.tenant.phone" class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Phone:</span>
              <span class="ticket-details-page__info-value">{{ ticket.tenant.phone }}</span>
            </div>
            <div class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Plan:</span>
              <span class="ticket-details-page__info-value">{{ ticket.tenant.subscriptionPlan }}</span>
            </div>
            <div class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Status:</span>
              <span class="ticket-details-page__info-value">{{ ticket.tenant.subscriptionStatus }}</span>
            </div>
            <button
              class="ticket-details-page__view-tenant-btn"
              @click="viewTenant"
            >
              View Tenant Details
            </button>
          </div>

          <!-- Ticket Details -->
          <div class="ticket-details-page__info-card">
            <div class="ticket-details-page__info-title">Ticket Details</div>
            <div class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Created:</span>
              <span class="ticket-details-page__info-value">{{ formatDateTime(ticket.createdAt) }}</span>
            </div>
            <div class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Updated:</span>
              <span class="ticket-details-page__info-value">{{ formatDateTime(ticket.updatedAt) }}</span>
            </div>
            <div class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Age:</span>
              <span class="ticket-details-page__info-value">{{ formatTicketAge(ticket.ticketAge) }}</span>
            </div>
            <div class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Replies:</span>
              <span class="ticket-details-page__info-value">{{ ticket.responseCount }}</span>
            </div>
            <div v-if="ticket.closedAt" class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Closed:</span>
              <span class="ticket-details-page__info-value">{{ formatDateTime(ticket.closedAt) }}</span>
            </div>
            <div v-if="ticket.resolutionTime" class="ticket-details-page__info-item">
              <span class="ticket-details-page__info-label">Resolution Time:</span>
              <span class="ticket-details-page__info-value">{{ formatTicketAge(ticket.resolutionTime) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="ticket-details-page__info-card">
            <div class="ticket-details-page__info-title">Actions</div>

            <div class="ticket-details-page__action-group">
              <label class="ticket-details-page__action-label">Status:</label>
              <FormSelect
                v-model="selectedStatus"
                :options="statusOptions"
                class="ticket-details-page__action-select"
                @change="handleStatusChange"
              />
            </div>

            <div class="ticket-details-page__action-group">
              <label class="ticket-details-page__action-label">Priority:</label>
              <FormSelect
                v-model="selectedPriority"
                :options="priorityOptions"
                class="ticket-details-page__action-select"
                @change="handlePriorityChange"
              />
            </div>

            <div class="ticket-details-page__action-group">
              <label class="ticket-details-page__action-label">Assign To:</label>
              <FormSelect
                v-model="selectedAssignee"
                :options="assigneeOptions"
                class="ticket-details-page__action-select"
                @change="handleAssigneeChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTicketStore } from '~/stores/ticket'
import FormTextarea from '~/components/ui/FormTextarea.vue'
import FormSelect from '~/components/ui/FormSelect.vue'

const route = useRoute()
const router = useRouter()
const ticketStore = useTicketStore()
const { showNotification } = useNotification()

const ticketId = route.params.id as string

// State
const replyContent = ref('')
const isInternalNote = ref(false)
const selectedStatus = ref('')
const selectedPriority = ref('')
const selectedAssignee = ref('')

// Computed
const ticket = computed(() => ticketStore.currentTicket)
const loading = computed(() => ticketStore.loading)
const saving = computed(() => ticketStore.saving)
const error = computed(() => ticketStore.error)

// Options
const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_response', label: 'Waiting Response' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const assigneeOptions = [
  { value: '', label: 'Unassigned' },
  // TODO: Load from admin users API
]

// Methods
const fetchTicket = async () => {
  try {
    await ticketStore.fetchTicketDetails(ticketId)
    if (ticket.value) {
      selectedStatus.value = ticket.value.status
      selectedPriority.value = ticket.value.priority
      selectedAssignee.value = ticket.value.assignedTo || ''
    }
  } catch (error) {
    console.error('Failed to fetch ticket:', error)
  }
}

const retryFetch = () => {
  ticketStore.clearError()
  fetchTicket()
}

const goBack = () => {
  router.push('/support')
}

const viewTenant = () => {
  if (ticket.value) {
    router.push(`/tenants/${ticket.value.tenantId}`)
  }
}

const handleReply = async () => {
  if (!replyContent.value.trim()) return

  try {
    await ticketStore.replyToTicket(ticketId, {
      content: replyContent.value,
      isInternal: isInternalNote.value,
    })

    showNotification({
      type: 'success',
      message: isInternalNote.value ? 'Internal note added' : 'Reply sent successfully',
    })

    replyContent.value = ''
    isInternalNote.value = false
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to send reply',
    })
  }
}

const handleStatusChange = async () => {
  if (!ticket.value || selectedStatus.value === ticket.value.status) return

  try {
    await ticketStore.updateTicketStatus(ticketId, selectedStatus.value as any)
    showNotification({
      type: 'success',
      message: 'Ticket status updated',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to update status',
    })
    selectedStatus.value = ticket.value.status
  }
}

const handlePriorityChange = async () => {
  if (!ticket.value || selectedPriority.value === ticket.value.priority) return

  try {
    await ticketStore.updateTicketPriority(ticketId, selectedPriority.value as any)
    showNotification({
      type: 'success',
      message: 'Ticket priority updated',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to update priority',
    })
    selectedPriority.value = ticket.value.priority
  }
}

const handleAssigneeChange = async () => {
  if (!ticket.value || selectedAssignee.value === (ticket.value.assignedTo || '')) return

  try {
    if (selectedAssignee.value) {
      await ticketStore.assignTicket(ticketId, selectedAssignee.value)
      showNotification({
        type: 'success',
        message: 'Ticket assigned successfully',
      })
    }
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to assign ticket',
    })
    selectedAssignee.value = ticket.value.assignedTo || ''
  }
}

const handleCloseTicket = async () => {
  if (!confirm('Are you sure you want to close this ticket?')) return

  try {
    await ticketStore.closeTicket(ticketId)
    showNotification({
      type: 'success',
      message: 'Ticket closed successfully',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to close ticket',
    })
  }
}

const handleReopenTicket = async () => {
  if (!confirm('Are you sure you want to reopen this ticket?')) return

  try {
    await ticketStore.reopenTicket(ticketId)
    showNotification({
      type: 'success',
      message: 'Ticket reopened successfully',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to reopen ticket',
    })
  }
}

// Format helpers
const formatPriority = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

const formatStatus = (status: string): string => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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

const formatTicketAge = (hours: number): string => {
  if (hours < 1) return '< 1 hour'
  if (hours < 24) return `${Math.round(hours)} hours`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''}`
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Fetch ticket on mount
onMounted(() => {
  fetchTicket()
})

// Cleanup on unmount
onUnmounted(() => {
  ticketStore.clearCurrentTicket()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.ticket-details-page {
  padding: $spacing-xl;
  max-width: 1400px;
  margin: 0 auto;
}

.ticket-details-page__loading,
.ticket-details-page__error {
  padding: $spacing-xl;
  text-align: center;
}

.ticket-details-page__error {
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

.ticket-details-page__back-btn {
  padding: $spacing-xs $spacing-md;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: $spacing-lg;
  transition: background $transition-base;

  &:hover {
    background: darken($bg-secondary, 3%);
  }
}

.ticket-details-page__header {
  margin-bottom: $spacing-xl;
}

.ticket-details-page__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.ticket-details-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.ticket-details-page__meta {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  flex-wrap: wrap;
}

.ticket-details-page__ticket-id {
  font-size: 0.875rem;
  color: $text-secondary;
  font-family: monospace;
}

.ticket-details-page__header-actions {
  display: flex;
  gap: $spacing-sm;
}

.ticket-details-page__action-btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all $transition-base;
}

.ticket-details-page__action-btn--close {
  background: $success-color;
  color: white;

  &:hover {
    background: darken($success-color, 10%);
  }
}

.ticket-details-page__action-btn--reopen {
  background: $info-color;
  color: white;

  &:hover {
    background: darken($info-color, 10%);
  }
}

.ticket-details-page__main {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: $spacing-xl;
}

.ticket-details-page__conversation {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-xl;
}

.ticket-details-page__section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-lg;
}

.ticket-details-page__message {
  padding: $spacing-lg;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
}

.ticket-details-page__message--initial {
  background: lighten($info-color, 45%);
  border-color: lighten($info-color, 30%);
}

.ticket-details-page__message--internal {
  background: lighten($warning-color, 45%);
  border-color: lighten($warning-color, 30%);
  border-left: 4px solid $warning-color;
}

.ticket-details-page__message--admin {
  background: lighten($primary-color, 45%);
  border-color: lighten($primary-color, 30%);
}

.ticket-details-page__message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.ticket-details-page__message-author {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.ticket-details-page__author-name {
  font-weight: 600;
  color: $text-primary;
}

.ticket-details-page__author-role {
  font-size: 0.75rem;
  padding: $spacing-xs $spacing-sm;
  background: $bg-primary;
  border-radius: $radius-sm;
  color: $text-secondary;
  text-transform: uppercase;
}

.ticket-details-page__internal-badge {
  font-size: 0.75rem;
  padding: $spacing-xs $spacing-sm;
  background: $warning-color;
  color: white;
  border-radius: $radius-sm;
  text-transform: uppercase;
  font-weight: 600;
}

.ticket-details-page__message-time {
  font-size: 0.875rem;
  color: $text-secondary;
}

.ticket-details-page__message-content {
  color: $text-primary;
  line-height: 1.6;
  white-space: pre-wrap;
}

.ticket-details-page__attachments {
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
}

.ticket-details-page__attachment {
  margin-bottom: $spacing-xs;
}

.ticket-details-page__attachment-link {
  color: $primary-color;
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    text-decoration: underline;
  }
}

.ticket-details-page__reply-form {
  margin-top: $spacing-xl;
  padding-top: $spacing-xl;
  border-top: 2px solid $border-color;
}

.ticket-details-page__reply-textarea {
  width: 100%;
  margin-bottom: $spacing-md;
}

.ticket-details-page__reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-details-page__checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
  user-select: none;

  input[type="checkbox"] {
    cursor: pointer;
  }

  span {
    font-size: 0.875rem;
    color: $text-primary;
  }
}

.ticket-details-page__reply-buttons {
  display: flex;
  gap: $spacing-sm;
}

.ticket-details-page__reply-btn {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  font-weight: 600;
  transition: background $transition-base;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ticket-details-page__sidebar {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.ticket-details-page__info-card {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.ticket-details-page__info-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color;
}

.ticket-details-page__info-item {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm 0;
  border-bottom: 1px solid lighten($border-color, 5%);

  &:last-child {
    border-bottom: none;
  }
}

.ticket-details-page__info-label {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 500;
}

.ticket-details-page__info-value {
  font-size: 0.875rem;
  color: $text-primary;
  text-align: right;
}

.ticket-details-page__view-tenant-btn {
  width: 100%;
  margin-top: $spacing-md;
  padding: $spacing-sm;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  font-weight: 500;
  transition: background $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.ticket-details-page__action-group {
  margin-bottom: $spacing-md;

  &:last-child {
    margin-bottom: 0;
  }
}

.ticket-details-page__action-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.ticket-details-page__action-select {
  width: 100%;
}

.priority-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge--low {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.priority-badge--medium {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.priority-badge--high {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.priority-badge--urgent {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge--open {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.status-badge--in_progress {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.status-badge--waiting_response {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge--resolved {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--closed {
  background: lighten($text-light, 20%);
  color: $text-secondary;
}

@media (max-width: $breakpoint-lg) {
  .ticket-details-page__main {
    grid-template-columns: 1fr;
  }

  .ticket-details-page__sidebar {
    order: -1;
  }
}

@media (max-width: $breakpoint-md) {
  .ticket-details-page {
    padding: $spacing-lg;
  }

  .ticket-details-page__header-content {
    flex-direction: column;
  }

  .ticket-details-page__header-actions {
    width: 100%;
  }

  .ticket-details-page__action-btn {
    flex: 1;
  }
}
</style>
