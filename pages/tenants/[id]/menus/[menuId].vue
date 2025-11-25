<template>
  <div class="menu-items-page">
    <!-- Breadcrumbs -->
    <nav class="menu-items-page__breadcrumbs">
      <NuxtLink to="/tenants" class="menu-items-page__breadcrumb">
        Tenants
      </NuxtLink>
      <span class="menu-items-page__breadcrumb-separator">/</span>
      <NuxtLink :to="`/tenants/${tenantId}`" class="menu-items-page__breadcrumb">
        {{ tenantName || 'Tenant Details' }}
      </NuxtLink>
      <span class="menu-items-page__breadcrumb-separator">/</span>
      <NuxtLink :to="`/tenants/${tenantId}/menus`" class="menu-items-page__breadcrumb">
        Menus
      </NuxtLink>
      <span class="menu-items-page__breadcrumb-separator">/</span>
      <span class="menu-items-page__breadcrumb menu-items-page__breadcrumb--active">
        {{ menuName || 'Menu Items' }}
      </span>
    </nav>

    <!-- Loading State -->
    <div v-if="loading && !currentMenu" class="menu-items-page__loading">
      <div class="menu-items-page__spinner"></div>
      <p>Loading menu details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="menu-items-page__error">
      <h2>Failed to load menu</h2>
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
      <button @click="goBack">Go Back</button>
    </div>

    <!-- Menu Content -->
    <div v-else-if="currentMenu" class="menu-items-page__content">
      <!-- Page Header -->
      <div class="menu-items-page__header">
        <div class="menu-items-page__title-section">
          <h1 class="menu-items-page__title">{{ currentMenu.name }}</h1>
          <span
            :class="[
              'menu-items-page__status',
              currentMenu.isActive
                ? 'menu-items-page__status--active'
                : 'menu-items-page__status--inactive'
            ]"
          >
            {{ currentMenu.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
        <p v-if="currentMenu.description" class="menu-items-page__description">
          {{ currentMenu.description }}
        </p>
        <div class="menu-items-page__actions">
          <button
            class="menu-items-page__action-btn menu-items-page__action-btn--primary"
            @click="handleCreateItem"
          >
            + Add Menu Item
          </button>
          <button
            class="menu-items-page__action-btn menu-items-page__action-btn--secondary"
            @click="handleManageCategories"
          >
            Manage Categories
          </button>
          <button
            class="menu-items-page__action-btn menu-items-page__action-btn--secondary"
            @click="handleBulkOperations"
          >
            Bulk Operations
          </button>
        </div>
      </div>

      <!-- Menu Statistics -->
      <div class="menu-items-page__stats">
        <div class="menu-items-page__stat">
          <span class="menu-items-page__stat-label">Total Items</span>
          <span class="menu-items-page__stat-value">{{ currentMenu.itemCount }}</span>
        </div>
        <div class="menu-items-page__stat">
          <span class="menu-items-page__stat-label">Active Items</span>
          <span class="menu-items-page__stat-value">{{ currentMenu.activeItemCount }}</span>
        </div>
        <div class="menu-items-page__stat">
          <span class="menu-items-page__stat-label">Categories</span>
          <span class="menu-items-page__stat-value">{{ categories.length }}</span>
        </div>
      </div>

      <!-- Menu Item List -->
      <MenuItemList
        :tenant-id="tenantId"
        :menu-id="menuId"
        :categories="categories"
        @create-item="handleCreateItem"
        @edit-item="handleEditItem"
        @delete-item="handleDeleteItem"
      />

      <!-- Menu History -->
      <div class="menu-items-page__section">
        <MenuHistory
          :history="menuHistory"
          :loading="historyLoading"
          :error="historyError"
          @export="handleExportHistory"
          @retry="fetchMenuHistory"
          @filter-change="handleHistoryFilterChange"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Delete Menu Item"
      :message="`Are you sure you want to delete '${itemToDelete?.name}'? This action cannot be undone.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTenantStore } from '~/stores/tenant'
import { useMenuStore } from '~/stores/menu'
import MenuItemList from '~/components/menu/MenuItemList.vue'
import MenuHistory from '~/components/menu/MenuHistory.vue'
import ConfirmModal from '~/components/ui/ConfirmModal.vue'
import type { MenuItem } from '~/types'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const tenantStore = useTenantStore()
const menuStore = useMenuStore()
const { showNotification } = useNotification()

const tenantId = computed(() => route.params.id as string)
const menuId = computed(() => route.params.menuId as string)
const tenant = computed(() => tenantStore.currentTenant)
const tenantName = computed(() => tenant.value?.name || '')
const currentMenu = computed(() => menuStore.currentMenu)
const menuName = computed(() => currentMenu.value?.name || '')
const categories = computed(() => menuStore.categories)
const menuHistory = computed(() => menuStore.menuHistory?.history || [])
const loading = computed(() => menuStore.loading)
const error = computed(() => menuStore.error)

const showDeleteModal = ref(false)
const itemToDelete = ref<MenuItem | null>(null)
const deleteLoading = ref(false)
const historyLoading = ref(false)
const historyError = ref<string | null>(null)
const historyFilters = ref<any>({})

async function fetchMenuDetails(): Promise<void> {
  try {
    await menuStore.fetchMenuDetails(tenantId.value, menuId.value)
    await menuStore.fetchCategories(tenantId.value)
  } catch (error) {
    console.error('Failed to fetch menu details:', error)
  }
}

async function fetchTenantDetails(): Promise<void> {
  try {
    await tenantStore.fetchTenantDetails(tenantId.value)
  } catch (error) {
    console.error('Failed to fetch tenant details:', error)
  }
}

async function fetchMenuHistory(): Promise<void> {
  historyLoading.value = true
  historyError.value = null
  try {
    await menuStore.fetchMenuHistory(tenantId.value, {
      menuId: menuId.value,
      ...historyFilters.value,
    })
  } catch (error: any) {
    historyError.value = error.message || 'Failed to fetch menu history'
    console.error('Failed to fetch menu history:', error)
  } finally {
    historyLoading.value = false
  }
}

function handleHistoryFilterChange(filters: any): void {
  historyFilters.value = filters
  fetchMenuHistory()
}

async function handleExportHistory(): Promise<void> {
  try {
    const apiService = useApiService()
    const response = await apiService.get(
      `/api/admin/audit/export`,
      {
        params: {
          type: 'menu',
          tenantId: tenantId.value,
          format: 'csv',
          ...historyFilters.value,
        },
        responseType: 'blob',
      }
    )

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `menu-history-${tenantId.value}-${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    showNotification({
      type: 'success',
      message: 'History exported successfully',
    })
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to export history',
    })
    console.error('Export error:', error)
  }
}

function retryFetch(): void {
  menuStore.clearError()
  fetchMenuDetails()
}

function goBack(): void {
  router.push(`/tenants/${tenantId.value}/menus`)
}

function handleCreateItem(): void {
  router.push(`/tenants/${tenantId.value}/menus/${menuId.value}/items/new`)
}

function handleEditItem(item: MenuItem): void {
  router.push(`/tenants/${tenantId.value}/menus/${menuId.value}/items/${item.id}/edit`)
}

function handleDeleteItem(item: MenuItem): void {
  itemToDelete.value = item
  showDeleteModal.value = true
}

async function handleConfirmDelete(): Promise<void> {
  if (!itemToDelete.value) return

  deleteLoading.value = true

  try {
    await menuStore.deleteMenuItem(tenantId.value, menuId.value, itemToDelete.value.id)
    showNotification({
      type: 'success',
      message: 'Menu item deleted successfully',
    })
    showDeleteModal.value = false
    itemToDelete.value = null
    
    // Refresh menu items
    await menuStore.fetchMenuItems(tenantId.value, menuId.value)
  } catch (error) {
    showNotification({
      type: 'error',
      message: 'Failed to delete menu item',
    })
  } finally {
    deleteLoading.value = false
  }
}

function handleCancelDelete(): void {
  showDeleteModal.value = false
  itemToDelete.value = null
}

function handleManageCategories(): void {
  // TODO: Navigate to category management page or open modal
  router.push(`/tenants/${tenantId.value}/menus/${menuId.value}/categories`)
}

function handleBulkOperations(): void {
  // TODO: Navigate to bulk operations page or open modal
  router.push(`/tenants/${tenantId.value}/menus/${menuId.value}/bulk`)
}

onMounted(() => {
  fetchTenantDetails()
  fetchMenuDetails()
  fetchMenuHistory()
})
</script>

<style scoped lang="scss">
@use '../../../../assets/scss/variables' as *;

.menu-items-page {
  padding: $spacing-lg;
  min-height: 100vh;
}

.menu-items-page__breadcrumbs {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
  font-size: 0.875rem;
}

.menu-items-page__breadcrumb {
  color: $primary-color;
  text-decoration: none;
  transition: $transition-base;

  &:hover {
    color: darken($primary-color, 10%);
    text-decoration: underline;
  }
}

.menu-items-page__breadcrumb--active {
  color: $text-secondary;
  pointer-events: none;
}

.menu-items-page__breadcrumb-separator {
  color: $text-secondary;
}

.menu-items-page__loading {
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

.menu-items-page__spinner {
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

.menu-items-page__error {
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
    margin: 0;
  }

  p {
    color: $text-secondary;
    margin: 0;
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

.menu-items-page__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.menu-items-page__header {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.menu-items-page__title-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.menu-items-page__title {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
  margin: 0;
}

.menu-items-page__status {
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.menu-items-page__status--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.menu-items-page__status--inactive {
  background: $bg-secondary;
  color: $text-secondary;
}

.menu-items-page__description {
  font-size: 1rem;
  color: $text-secondary;
  margin: 0;
  line-height: 1.5;
}

.menu-items-page__actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.menu-items-page__action-btn {
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
  border: none;
}

.menu-items-page__action-btn--primary {
  background: $primary-color;
  color: white;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.menu-items-page__action-btn--secondary {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover {
    background: $bg-secondary;
  }
}

.menu-items-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: $spacing-md;
}

.menu-items-page__stat {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.menu-items-page__stat-label {
  font-size: 0.875rem;
  color: $text-secondary;
}

.menu-items-page__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
}

.menu-items-page__section {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

@media (max-width: $breakpoint-md) {
  .menu-items-page {
    padding: $spacing-md;
  }

  .menu-items-page__title {
    font-size: 1.5rem;
  }

  .menu-items-page__breadcrumbs {
    flex-wrap: wrap;
  }

  .menu-items-page__actions {
    flex-direction: column;

    button {
      width: 100%;
    }
  }

  .menu-items-page__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
