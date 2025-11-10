<template>
  <div class="tenant-details">
    <!-- Loading State -->
    <div v-if="loading && !tenant" class="tenant-details__loading">
      <div class="tenant-details__spinner"></div>
      <p>Loading tenant details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="tenant-details__error">
      <h2>Failed to load tenant details</h2>
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
      <button @click="goBack">Go Back</button>
    </div>

    <!-- Tenant Details -->
    <div v-else-if="tenant" class="tenant-details__content">
      <!-- Header -->
      <div class="tenant-details__header">
        <button class="tenant-details__back-btn" @click="goBack">
          ← Back to Tenants
        </button>
        <div class="tenant-details__header-content">
          <div class="tenant-details__title-section">
            <h1 class="tenant-details__title">{{ tenant.name }}</h1>
            <span :class="['status-badge', `status-badge--${tenant.status}`]">
              {{ tenant.status }}
            </span>
          </div>
          <div class="tenant-details__actions">
            <button
              v-if="tenant.status === 'suspended' || tenant.status === 'pending'"
              class="tenant-details__action-btn tenant-details__action-btn--activate"
              @click="handleActivate"
            >
              Activate
            </button>
            <button
              v-if="tenant.status === 'active'"
              class="tenant-details__action-btn tenant-details__action-btn--deactivate"
              @click="handleDeactivate"
            >
              Deactivate
            </button>
            <button
              v-if="tenant.status === 'active'"
              class="tenant-details__action-btn tenant-details__action-btn--suspend"
              @click="handleSuspend"
            >
              Suspend
            </button>
            <button
              v-if="tenant.status === 'active' || tenant.status === 'suspended'"
              class="tenant-details__action-btn tenant-details__action-btn--impersonate"
              @click="handleImpersonate"
            >
              Impersonate
            </button>
            <button
              class="tenant-details__action-btn tenant-details__action-btn--delete"
              @click="handleDelete"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="tenant-details__grid">
        <!-- Business Information -->
        <div class="tenant-details__card">
          <h2 class="tenant-details__card-title">Business Information</h2>
          <div class="tenant-details__info-grid">
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Name</span>
              <span class="tenant-details__info-value">{{ tenant.name }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Slug</span>
              <span class="tenant-details__info-value">{{ tenant.slug }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Business Type</span>
              <span class="tenant-details__info-value">{{ tenant.businessType }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Created</span>
              <span class="tenant-details__info-value">{{ formatDate(tenant.createdAt) }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Last Active</span>
              <span class="tenant-details__info-value">{{ formatRelativeTime(tenant.lastActive) }}</span>
            </div>
          </div>
        </div>

        <!-- Owner Details -->
        <div class="tenant-details__card">
          <h2 class="tenant-details__card-title">Owner Details</h2>
          <div class="tenant-details__info-grid">
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Name</span>
              <span class="tenant-details__info-value">{{ tenant.owner.name }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Email</span>
              <span class="tenant-details__info-value">
                <a :href="`mailto:${tenant.owner.email}`">{{ tenant.owner.email }}</a>
              </span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Phone</span>
              <span class="tenant-details__info-value">
                <a :href="`tel:${tenant.owner.phone}`">{{ tenant.owner.phone }}</a>
              </span>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="tenant-details__card">
          <h2 class="tenant-details__card-title">Address</h2>
          <div class="tenant-details__info-grid">
            <div class="tenant-details__info-item tenant-details__info-item--full">
              <span class="tenant-details__info-label">Street</span>
              <span class="tenant-details__info-value">{{ tenant.address.street }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">City</span>
              <span class="tenant-details__info-value">{{ tenant.address.city }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">State</span>
              <span class="tenant-details__info-value">{{ tenant.address.state }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Postal Code</span>
              <span class="tenant-details__info-value">{{ tenant.address.postalCode }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Country</span>
              <span class="tenant-details__info-value">{{ tenant.address.country }}</span>
            </div>
          </div>
        </div>

        <!-- Subscription Information -->
        <div class="tenant-details__card">
          <h2 class="tenant-details__card-title">Subscription</h2>
          <div class="tenant-details__info-grid">
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Plan</span>
              <span class="tenant-details__info-value">{{ tenant.subscription.plan }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Status</span>
              <span :class="['subscription-badge', `subscription-badge--${tenant.subscription.status}`]">
                {{ tenant.subscription.status }}
              </span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Billing Cycle</span>
              <span class="tenant-details__info-value">{{ tenant.subscription.billingCycle }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Current Period Start</span>
              <span class="tenant-details__info-value">{{ formatDate(tenant.subscription.currentPeriodStart) }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Current Period End</span>
              <span class="tenant-details__info-value">{{ formatDate(tenant.subscription.currentPeriodEnd) }}</span>
            </div>
            <div v-if="tenant.subscription.trialEndsAt" class="tenant-details__info-item">
              <span class="tenant-details__info-label">Trial Ends</span>
              <span class="tenant-details__info-value">{{ formatDate(tenant.subscription.trialEndsAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="tenant-details__card tenant-details__card--full">
          <h2 class="tenant-details__card-title">Statistics</h2>
          <div class="tenant-details__stats-grid">
            <div class="tenant-details__stat">
              <span class="tenant-details__stat-label">Total Orders</span>
              <span class="tenant-details__stat-value">{{ formatNumber(tenant.statistics.totalOrders) }}</span>
            </div>
            <div class="tenant-details__stat">
              <span class="tenant-details__stat-label">Total Revenue</span>
              <span class="tenant-details__stat-value">{{ formatCurrency(tenant.statistics.totalRevenue) }}</span>
            </div>
            <div class="tenant-details__stat">
              <span class="tenant-details__stat-label">Average Order Value</span>
              <span class="tenant-details__stat-value">{{ formatCurrency(tenant.statistics.averageOrderValue) }}</span>
            </div>
            <div class="tenant-details__stat">
              <span class="tenant-details__stat-label">Menu Items</span>
              <span class="tenant-details__stat-value">{{ formatNumber(tenant.statistics.menuItemsCount) }}</span>
            </div>
            <div class="tenant-details__stat">
              <span class="tenant-details__stat-label">Active Users</span>
              <span class="tenant-details__stat-value">{{ formatNumber(tenant.statistics.activeUsersCount) }}</span>
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div class="tenant-details__card tenant-details__card--full">
          <div class="tenant-details__card-header">
            <h2 class="tenant-details__card-title">Settings</h2>
            <button
              class="tenant-details__edit-btn"
              @click="showSettingsForm = !showSettingsForm"
            >
              {{ showSettingsForm ? 'Cancel' : 'Edit Settings' }}
            </button>
          </div>
          
          <div v-if="!showSettingsForm" class="tenant-details__info-grid">
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Timezone</span>
              <span class="tenant-details__info-value">{{ tenant.settings.timezone }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Currency</span>
              <span class="tenant-details__info-value">{{ tenant.settings.currency }}</span>
            </div>
            <div class="tenant-details__info-item">
              <span class="tenant-details__info-label">Language</span>
              <span class="tenant-details__info-value">{{ tenant.settings.language }}</span>
            </div>
          </div>

          <TenantSettingsForm
            v-else
            :settings="tenant.settings"
            :loading="settingsLoading"
            @submit="handleUpdateSettings"
            @cancel="showSettingsForm = false"
          />
        </div>
      </div>
    </div>

    <!-- Impersonation Modal -->
    <ImpersonationModal
      v-if="tenant"
      v-model="showImpersonationModal"
      :tenant-name="tenant.name"
      :loading="impersonationLoading"
      @confirm="handleImpersonationConfirm"
      @cancel="showImpersonationModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTenantStore } from '~/stores/tenant'
import { formatDate, formatRelativeTime } from '~/utils/date'
import TenantSettingsForm from '~/components/tenant/TenantSettingsForm.vue'
import ImpersonationModal from '~/components/tenant/ImpersonationModal.vue'
import type { TenantSettings } from '~/types'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const tenantStore = useTenantStore()
const { showNotification } = useNotification()
const { confirm } = useConfirm()

const tenantId = computed(() => route.params.id as string)
const tenant = computed(() => tenantStore.currentTenant)
const loading = computed(() => tenantStore.loading)
const error = computed(() => tenantStore.error)

const showSettingsForm = ref(false)
const settingsLoading = ref(false)
const showImpersonationModal = ref(false)
const impersonationLoading = ref(false)

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function goBack(): void {
  router.push('/tenants')
}

async function handleActivate(): Promise<void> {
  const confirmed = await confirm({
    title: 'Activate Tenant',
    message: `Are you sure you want to activate "${tenant.value?.name}"? This will grant them full access to the platform.`,
    type: 'info',
    confirmText: 'Activate',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await tenantStore.activateTenant(tenantId.value)
    showNotification({
      type: 'success',
      message: 'Tenant activated successfully',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to activate tenant',
    })
  }
}

async function handleDeactivate(): Promise<void> {
  const confirmed = await confirm({
    title: 'Deactivate Tenant',
    message: `Are you sure you want to deactivate "${tenant.value?.name}"? They will lose access to the platform but can be reactivated later.`,
    type: 'warning',
    confirmText: 'Deactivate',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await tenantStore.deactivateTenant(tenantId.value)
    showNotification({
      type: 'success',
      message: 'Tenant deactivated successfully',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to deactivate tenant',
    })
  }
}

async function handleSuspend(): Promise<void> {
  const confirmed = await confirm({
    title: 'Suspend Tenant',
    message: `Are you sure you want to suspend "${tenant.value?.name}"? This action is typically used for policy violations or payment issues. They will lose access immediately.`,
    type: 'danger',
    confirmText: 'Suspend',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await tenantStore.suspendTenant(tenantId.value)
    showNotification({
      type: 'success',
      message: 'Tenant suspended successfully',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to suspend tenant',
    })
  }
}

function handleImpersonate(): void {
  showImpersonationModal.value = true
}

async function handleImpersonationConfirm(reason: string): Promise<void> {
  impersonationLoading.value = true

  try {
    const url = await tenantStore.impersonateTenant(tenantId.value, reason)
    
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer')
    
    showNotification({
      type: 'success',
      message: 'Impersonation session started in new tab',
    })
    
    showImpersonationModal.value = false
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to start impersonation session',
    })
  } finally {
    impersonationLoading.value = false
  }
}

async function handleDelete(): Promise<void> {
  const confirmed = await confirm({
    title: 'Delete Tenant',
    message: `Are you sure you want to permanently delete "${tenant.value?.name}"? This action cannot be undone and will remove all associated data.`,
    type: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })

  if (!confirmed) return

  try {
    await tenantStore.deleteTenant(tenantId.value)
    showNotification({
      type: 'success',
      message: 'Tenant deleted successfully',
    })
    router.push('/tenants')
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to delete tenant',
    })
  }
}

async function fetchTenantDetails(): Promise<void> {
  try {
    await tenantStore.fetchTenantDetails(tenantId.value)
  } catch (error) {
    console.error('Failed to fetch tenant details:', error)
  }
}

async function retryFetch(): Promise<void> {
  tenantStore.clearError()
  await fetchTenantDetails()
}

async function handleUpdateSettings(settings: Partial<TenantSettings>): Promise<void> {
  settingsLoading.value = true
  
  try {
    await tenantStore.updateTenantSettings(tenantId.value, settings)
    showNotification({
      type: 'success',
      message: 'Tenant settings updated successfully',
    })
    showSettingsForm.value = false
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to update tenant settings',
    })
  } finally {
    settingsLoading.value = false
  }
}

// Fetch on mount
onMounted(() => {
  fetchTenantDetails()
})
</script>

<style scoped lang="scss">
.tenant-details {
  padding: $spacing-lg;
  min-height: 100vh;
}

.tenant-details__loading {
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

.tenant-details__spinner {
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

.tenant-details__error {
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

.tenant-details__header {
  margin-bottom: $spacing-xl;
}

.tenant-details__back-btn {
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

.tenant-details__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.tenant-details__title-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.tenant-details__title {
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

.status-badge--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.status-badge--pending {
  background: lighten($warning-color, 40%);
  color: $warning-color;
}

.status-badge--suspended {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.status-badge--deleted {
  background: $bg-secondary;
  color: $text-secondary;
}

.tenant-details__actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.tenant-details__action-btn {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: white;
  color: $text-primary;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
  }
}

.tenant-details__action-btn--activate {
  background: $success-color;
  color: white;
  border-color: $success-color;

  &:hover {
    background: darken($success-color, 10%);
  }
}

.tenant-details__action-btn--deactivate {
  background: $secondary-color;
  color: white;
  border-color: $secondary-color;

  &:hover {
    background: darken($secondary-color, 10%);
  }
}

.tenant-details__action-btn--suspend {
  background: $warning-color;
  color: white;
  border-color: $warning-color;

  &:hover {
    background: darken($warning-color, 10%);
  }
}

.tenant-details__action-btn--impersonate {
  background: $info-color;
  color: white;
  border-color: $info-color;

  &:hover {
    background: darken($info-color, 10%);
  }
}

.tenant-details__action-btn--delete {
  background: $error-color;
  color: white;
  border-color: $error-color;

  &:hover {
    background: darken($error-color, 10%);
  }
}

.tenant-details__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: $spacing-lg;
}

.tenant-details__card {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.tenant-details__card--full {
  grid-column: 1 / -1;
}

.tenant-details__card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.tenant-details__card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.tenant-details__edit-btn {
  padding: $spacing-xs $spacing-md;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.tenant-details__info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
}

.tenant-details__info-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tenant-details__info-item--full {
  grid-column: 1 / -1;
}

.tenant-details__info-label {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 500;
}

.tenant-details__info-value {
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

.subscription-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  width: fit-content;
}

.subscription-badge--trial {
  background: lighten($info-color, 40%);
  color: $info-color;
}

.subscription-badge--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.subscription-badge--cancelled,
.subscription-badge--expired {
  background: lighten($error-color, 40%);
  color: $error-color;
}

.tenant-details__stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: $spacing-lg;
}

.tenant-details__stat {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  text-align: center;
}

.tenant-details__stat-label {
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 500;
}

.tenant-details__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
}

@media (max-width: $breakpoint-lg) {
  .tenant-details__grid {
    grid-template-columns: 1fr;
  }

  .tenant-details__header-content {
    flex-direction: column;
  }

  .tenant-details__actions {
    width: 100%;
  }

  .tenant-details__action-btn {
    flex: 1;
  }
}

@media (max-width: $breakpoint-md) {
  .tenant-details {
    padding: $spacing-md;
  }

  .tenant-details__title {
    font-size: 1.5rem;
  }

  .tenant-details__info-grid {
    grid-template-columns: 1fr;
  }

  .tenant-details__stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
