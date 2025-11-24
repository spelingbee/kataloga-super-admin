<template>
  <div class="announcement-details-page">
    <div class="announcement-details-page__header">
      <div>
        <NuxtLink to="/announcements" class="announcement-details-page__back-link">
          ← Back to Announcements
        </NuxtLink>
        <h1 class="announcement-details-page__title">Announcement Details</h1>
      </div>
      <div class="announcement-details-page__actions">
        <button
          v-if="announcement?.status === 'draft'"
          class="announcement-details-page__action-btn announcement-details-page__action-btn--edit"
          @click="handleEdit"
        >
          Edit
        </button>
        <button
          v-if="announcement?.status === 'draft'"
          class="announcement-details-page__action-btn announcement-details-page__action-btn--send"
          @click="handleSend"
        >
          Send Now
        </button>
        <button
          v-if="announcement?.status === 'scheduled'"
          class="announcement-details-page__action-btn announcement-details-page__action-btn--cancel"
          @click="handleCancelSchedule"
        >
          Cancel Schedule
        </button>
        <button
          class="announcement-details-page__action-btn announcement-details-page__action-btn--delete"
          @click="handleDelete"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="announcement-details-page__loading">
      <p>Loading announcement details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="announcement-details-page__error">
      <p>{{ error }}</p>
      <button @click="fetchDetails">Retry</button>
    </div>

    <!-- Content -->
    <div v-else-if="announcement" class="announcement-details-page__content">
      <!-- Basic Info Card -->
      <div class="announcement-details-page__card">
        <h2 class="announcement-details-page__card-title">Basic Information</h2>
        <div class="announcement-details-page__info-grid">
          <div class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Title</span>
            <span class="announcement-details-page__info-value">{{ announcement.title }}</span>
          </div>
          <div class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Type</span>
            <span :class="['type-badge', `type-badge--${announcement.type}`]">
              {{ formatType(announcement.type) }}
            </span>
          </div>
          <div class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Status</span>
            <span :class="['status-badge', `status-badge--${announcement.status}`]">
              {{ formatStatus(announcement.status) }}
            </span>
          </div>
          <div class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Priority</span>
            <span class="announcement-details-page__info-value">{{ announcement.priority }}</span>
          </div>
          <div class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Created By</span>
            <span class="announcement-details-page__info-value">{{ announcement.createdBy }}</span>
          </div>
          <div class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Created At</span>
            <span class="announcement-details-page__info-value">{{ formatDateTime(announcement.createdAt) }}</span>
          </div>
          <div v-if="announcement.scheduledFor" class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Scheduled For</span>
            <span class="announcement-details-page__info-value">{{ formatDateTime(announcement.scheduledFor) }}</span>
          </div>
          <div v-if="announcement.sentAt" class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Sent At</span>
            <span class="announcement-details-page__info-value">{{ formatDateTime(announcement.sentAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Content Card -->
      <div class="announcement-details-page__card">
        <h2 class="announcement-details-page__card-title">Content</h2>
        <div class="announcement-details-page__content-text">
          {{ announcement.content }}
        </div>
        <div v-if="announcement.htmlContent" class="announcement-details-page__html-content">
          <h3 class="announcement-details-page__section-title">HTML Content</h3>
          <div class="announcement-details-page__html-preview" v-html="announcement.htmlContent" />
        </div>
      </div>

      <!-- Target Audience Card -->
      <div class="announcement-details-page__card">
        <h2 class="announcement-details-page__card-title">Target Audience</h2>
        <div class="announcement-details-page__info-grid">
          <div class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Target Type</span>
            <span class="announcement-details-page__info-value">{{ formatTargetType(announcement.target.type) }}</span>
          </div>
          <div v-if="announcement.target.tenantIds?.length" class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Specific Tenants</span>
            <span class="announcement-details-page__info-value">{{ announcement.target.tenantIds.length }} tenant(s)</span>
          </div>
          <div v-if="announcement.target.plans?.length" class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Plans</span>
            <span class="announcement-details-page__info-value">{{ announcement.target.plans.join(', ') }}</span>
          </div>
          <div v-if="announcement.target.statuses?.length" class="announcement-details-page__info-item">
            <span class="announcement-details-page__info-label">Statuses</span>
            <span class="announcement-details-page__info-value">{{ announcement.target.statuses.join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- Delivery Channels Card -->
      <div class="announcement-details-page__card">
        <h2 class="announcement-details-page__card-title">Delivery Channels</h2>
        <div class="announcement-details-page__channels">
          <span
            v-for="channel in announcement.channels"
            :key="channel"
            class="announcement-details-page__channel-badge"
          >
            {{ formatChannel(channel) }}
          </span>
        </div>
      </div>

      <!-- Delivery Statistics Card -->
      <div v-if="announcement.deliveryStats" class="announcement-details-page__card">
        <h2 class="announcement-details-page__card-title">Delivery Statistics</h2>
        <div class="announcement-details-page__stats-grid">
          <div class="announcement-details-page__stat-card">
            <div class="announcement-details-page__stat-label">Sent</div>
            <div class="announcement-details-page__stat-value">{{ announcement.deliveryStats.sent }}</div>
          </div>
          <div class="announcement-details-page__stat-card">
            <div class="announcement-details-page__stat-label">Delivered</div>
            <div class="announcement-details-page__stat-value">{{ announcement.deliveryStats.delivered }}</div>
          </div>
          <div class="announcement-details-page__stat-card">
            <div class="announcement-details-page__stat-label">Opened</div>
            <div class="announcement-details-page__stat-value">{{ announcement.deliveryStats.opened }}</div>
          </div>
          <div class="announcement-details-page__stat-card">
            <div class="announcement-details-page__stat-label">Failed</div>
            <div class="announcement-details-page__stat-value">{{ announcement.deliveryStats.failed }}</div>
          </div>
        </div>
        <button
          v-if="announcement.status === 'sent'"
          class="announcement-details-page__view-deliveries-btn"
          @click="showDeliveries = !showDeliveries"
        >
          {{ showDeliveries ? 'Hide' : 'View' }} Delivery Details
        </button>
      </div>

      <!-- Delivery Details Table -->
      <div v-if="showDeliveries && deliveries.length > 0" class="announcement-details-page__card">
        <h2 class="announcement-details-page__card-title">Delivery Details</h2>
        <DataTable
          :columns="deliveryColumns"
          :data="deliveries"
          :searchable="false"
          :paginated="false"
          empty-message="No delivery details available"
        >
          <template #cell-status="{ value }">
            <span :class="['delivery-status-badge', `delivery-status-badge--${value}`]">
              {{ formatStatus(value) }}
            </span>
          </template>
          <template #cell-sentAt="{ value }">
            {{ value ? formatDateTime(value) : '—' }}
          </template>
          <template #cell-deliveredAt="{ value }">
            {{ value ? formatDateTime(value) : '—' }}
          </template>
          <template #cell-openedAt="{ value }">
            {{ value ? formatDateTime(value) : '—' }}
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnnouncementStore } from '~/stores/announcement'
import DataTable from '~/components/ui/DataTable/DataTable.vue'

const route = useRoute()
const router = useRouter()
const announcementStore = useAnnouncementStore()
const { showNotification } = useNotification()

const announcementId = computed(() => route.params.id as string)
const showDeliveries = ref(false)

// Computed
const announcement = computed(() => announcementStore.currentAnnouncement)
const deliveries = computed(() => announcementStore.deliveries)
const loading = computed(() => announcementStore.loading)
const error = computed(() => announcementStore.error)

// Delivery table columns
const deliveryColumns = [
  { key: 'tenantName', label: 'Tenant', sortable: true },
  { key: 'channel', label: 'Channel', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'sentAt', label: 'Sent At', sortable: true },
  { key: 'deliveredAt', label: 'Delivered At', sortable: true },
  { key: 'openedAt', label: 'Opened At', sortable: true },
]

// Methods
const fetchDetails = async () => {
  try {
    await announcementStore.fetchAnnouncementDetails(announcementId.value)
    if (announcement.value?.status === 'sent') {
      await announcementStore.fetchDeliveryTracking(announcementId.value)
    }
  } catch (error) {
    console.error('Failed to fetch announcement details:', error)
  }
}

const handleEdit = () => {
  router.push(`/announcements?edit=${announcementId.value}`)
}

const handleSend = async () => {
  if (!confirm('Are you sure you want to send this announcement now?')) return

  try {
    await announcementStore.sendAnnouncement(announcementId.value)
    showNotification({
      type: 'success',
      message: 'Announcement sent successfully',
    })
    fetchDetails()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to send announcement',
    })
  }
}

const handleCancelSchedule = async () => {
  if (!confirm('Are you sure you want to cancel this scheduled announcement?')) return

  try {
    await announcementStore.cancelScheduledAnnouncement(announcementId.value)
    showNotification({
      type: 'success',
      message: 'Scheduled announcement cancelled',
    })
    fetchDetails()
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to cancel scheduled announcement',
    })
  }
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return

  try {
    await announcementStore.deleteAnnouncement(announcementId.value)
    showNotification({
      type: 'success',
      message: 'Announcement deleted successfully',
    })
    router.push('/announcements')
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to delete announcement',
    })
  }
}

// Format helpers
const formatType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatTargetType = (type: string): string => {
  const labels: Record<string, string> = {
    all: 'All Tenants',
    specific: 'Specific Tenants',
    plan: 'By Subscription Plan',
    status: 'By Status',
  }
  return labels[type] || type
}

const formatChannel = (channel: string): string => {
  const labels: Record<string, string> = {
    email: 'Email',
    in_app: 'In-App Notification',
    telegram: 'Telegram',
  }
  return labels[channel] || channel
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

// Fetch details on mount
onMounted(() => {
  fetchDetails()
})

// Cleanup on unmount
onUnmounted(() => {
  announcementStore.clearCurrentAnnouncement()
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.announcement-details-page {
  padding: $spacing-xl;
}

.announcement-details-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.announcement-details-page__back-link {
  display: inline-block;
  color: $primary-color;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: $spacing-sm;
  transition: color $transition-base;

  &:hover {
    color: darken($primary-color, 10%);
  }
}

.announcement-details-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
}

.announcement-details-page__actions {
  display: flex;
  gap: $spacing-sm;
}

.announcement-details-page__action-btn {
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

.announcement-details-page__action-btn--edit {
  color: $info-color;
  border-color: $info-color;

  &:hover {
    background: lighten($info-color, 45%);
  }
}

.announcement-details-page__action-btn--send {
  color: $success-color;
  border-color: $success-color;

  &:hover {
    background: lighten($success-color, 45%);
  }
}

.announcement-details-page__action-btn--cancel {
  color: $warning-color;
  border-color: $warning-color;

  &:hover {
    background: lighten($warning-color, 45%);
  }
}

.announcement-details-page__action-btn--delete {
  color: $error-color;
  border-color: $error-color;

  &:hover {
    background: lighten($error-color, 45%);
  }
}

.announcement-details-page__loading,
.announcement-details-page__error {
  padding: $spacing-xl;
  text-align: center;
}

.announcement-details-page__error {
  p {
    color: $error-color;
    font-weight: 500;
    margin-bottom: $spacing-md;
  }

  button {
    padding: $spacing-sm $spacing-md;
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

.announcement-details-page__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.announcement-details-page__card {
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-xl;
}

.announcement-details-page__card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-lg 0;
}

.announcement-details-page__info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;
}

.announcement-details-page__info-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.announcement-details-page__info-label {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 500;
}

.announcement-details-page__info-value {
  font-size: 1rem;
  color: $text-primary;
}

.type-badge,
.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  width: fit-content;
}

.type-badge--info {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.type-badge--warning {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.type-badge--success {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.type-badge--critical {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge--draft {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.status-badge--scheduled {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.status-badge--sent {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--failed {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.announcement-details-page__content-text {
  font-size: 1rem;
  color: $text-primary;
  line-height: 1.6;
  white-space: pre-wrap;
}

.announcement-details-page__html-content {
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.announcement-details-page__section-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 $spacing-md 0;
}

.announcement-details-page__html-preview {
  padding: $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  line-height: 1.6;
}

.announcement-details-page__channels {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.announcement-details-page__channel-badge {
  padding: $spacing-sm $spacing-md;
  background: lighten($primary-color, 40%);
  color: $primary-color;
  border-radius: $radius-md;
  font-weight: 500;
  font-size: 0.875rem;
}

.announcement-details-page__stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;
}

.announcement-details-page__stat-card {
  padding: $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  text-align: center;
}

.announcement-details-page__stat-label {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.announcement-details-page__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
}

.announcement-details-page__view-deliveries-btn {
  padding: $spacing-sm $spacing-md;
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

.delivery-status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.delivery-status-badge--pending {
  background: lighten($secondary-color, 40%);
  color: $secondary-color;
}

.delivery-status-badge--sent {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.delivery-status-badge--delivered {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.delivery-status-badge--opened {
  background: lighten($primary-color, 40%);
  color: $primary-color;
}

.delivery-status-badge--failed {
  background: lighten($error-color, 40%);
  color: $error-color;
}

@media (max-width: $breakpoint-md) {
  .announcement-details-page {
    padding: $spacing-lg;
  }

  .announcement-details-page__header {
    flex-direction: column;
    gap: $spacing-md;
  }

  .announcement-details-page__actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .announcement-details-page__action-btn {
    flex: 1;
  }

  .announcement-details-page__info-grid,
  .announcement-details-page__stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
