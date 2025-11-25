<template>
  <div class="tenant-menu-list">
    <!-- Loading State -->
    <div v-if="loading && menus.length === 0" class="tenant-menu-list__loading">
      <div class="tenant-menu-list__spinner"></div>
      <p>Loading menus...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && menus.length === 0" class="tenant-menu-list__error">
      <h3>Failed to load menus</h3>
      <p>{{ error }}</p>
      <button @click="handleRetry">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="menus.length === 0" class="tenant-menu-list__empty">
      <div class="tenant-menu-list__empty-icon">📋</div>
      <h3>No menus found</h3>
      <p>This tenant doesn't have any menus yet.</p>
      <button class="tenant-menu-list__create-btn" @click="handleCreateMenu">
        Create First Menu
      </button>
    </div>

    <!-- Menu List -->
    <div v-else class="tenant-menu-list__content">
      <!-- Header -->
      <div class="tenant-menu-list__header">
        <div class="tenant-menu-list__title-section">
          <h2 class="tenant-menu-list__title">Menus</h2>
          <span class="tenant-menu-list__count">{{ pagination.total }} total</span>
        </div>
        <button class="tenant-menu-list__create-btn" @click="handleCreateMenu">
          + Create Menu
        </button>
      </div>

      <!-- Statistics -->
      <div class="tenant-menu-list__stats">
        <div class="tenant-menu-list__stat">
          <span class="tenant-menu-list__stat-label">Total Menus</span>
          <span class="tenant-menu-list__stat-value">{{ menus.length }}</span>
        </div>
        <div class="tenant-menu-list__stat">
          <span class="tenant-menu-list__stat-label">Active Menus</span>
          <span class="tenant-menu-list__stat-value">{{ activeMenusCount }}</span>
        </div>
        <div class="tenant-menu-list__stat">
          <span class="tenant-menu-list__stat-label">Total Items</span>
          <span class="tenant-menu-list__stat-value">{{ totalItems }}</span>
        </div>
        <div class="tenant-menu-list__stat">
          <span class="tenant-menu-list__stat-label">Active Items</span>
          <span class="tenant-menu-list__stat-value">{{ totalActiveItems }}</span>
        </div>
      </div>

      <!-- Menu Cards -->
      <div class="tenant-menu-list__grid">
        <div
          v-for="menu in menus"
          :key="menu.id"
          class="menu-card"
          :class="{ 'menu-card--inactive': !menu.isActive }"
          @click="handleMenuClick(menu.id)"
        >
          <div class="menu-card__header">
            <h3 class="menu-card__name">{{ menu.name }}</h3>
            <span
              :class="[
                'menu-card__status',
                menu.isActive ? 'menu-card__status--active' : 'menu-card__status--inactive'
              ]"
            >
              {{ menu.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <p v-if="menu.description" class="menu-card__description">
            {{ menu.description }}
          </p>

          <div class="menu-card__stats">
            <div class="menu-card__stat">
              <span class="menu-card__stat-icon">📄</span>
              <span class="menu-card__stat-text">
                {{ menu.itemCount }} {{ menu.itemCount === 1 ? 'item' : 'items' }}
              </span>
            </div>
            <div class="menu-card__stat">
              <span class="menu-card__stat-icon">✓</span>
              <span class="menu-card__stat-text">
                {{ menu.activeItemCount }} active
              </span>
            </div>
          </div>

          <div class="menu-card__footer">
            <span class="menu-card__date">
              Updated {{ formatRelativeTime(menu.updatedAt) }}
            </span>
            <button
              class="menu-card__view-btn"
              @click.stop="handleMenuClick(menu.id)"
            >
              View Items →
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="tenant-menu-list__pagination">
        <button
          class="tenant-menu-list__pagination-btn"
          :disabled="pagination.page === 1"
          @click="handlePageChange(pagination.page - 1)"
        >
          ← Previous
        </button>
        <span class="tenant-menu-list__pagination-info">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <button
          class="tenant-menu-list__pagination-btn"
          :disabled="pagination.page === pagination.totalPages"
          @click="handlePageChange(pagination.page + 1)"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuStore } from '~/stores/menu'
import { formatRelativeTime } from '~/utils/date'

interface Props {
  tenantId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  createMenu: []
  selectMenu: [menuId: string]
}>()

const router = useRouter()
const menuStore = useMenuStore()

const menus = computed(() => menuStore.menus)
const loading = computed(() => menuStore.loading)
const error = computed(() => menuStore.error)
const pagination = computed(() => menuStore.pagination)

const activeMenusCount = computed(() => {
  return menus.value.filter(m => m.isActive).length
})

const totalItems = computed(() => {
  return menus.value.reduce((sum, menu) => sum + menu.itemCount, 0)
})

const totalActiveItems = computed(() => {
  return menus.value.reduce((sum, menu) => sum + menu.activeItemCount, 0)
})

async function fetchMenus(page = 1): Promise<void> {
  try {
    await menuStore.fetchMenus(props.tenantId, page)
  } catch (error) {
    console.error('Failed to fetch menus:', error)
  }
}

function handleRetry(): void {
  menuStore.clearError()
  fetchMenus()
}

function handleCreateMenu(): void {
  emit('createMenu')
}

function handleMenuClick(menuId: string): void {
  emit('selectMenu', menuId)
  router.push(`/tenants/${props.tenantId}/menus/${menuId}`)
}

function handlePageChange(page: number): void {
  menuStore.setPage(page)
  fetchMenus(page)
}

onMounted(() => {
  fetchMenus()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.tenant-menu-list {
  width: 100%;
}

.tenant-menu-list__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: $spacing-md;

  p {
    color: $text-secondary;
  }
}

.tenant-menu-list__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $bg-secondary;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tenant-menu-list__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: $spacing-md;
  text-align: center;

  h3 {
    color: $error-color;
    font-size: 1.25rem;
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
  }
}

.tenant-menu-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: $spacing-md;
  text-align: center;
}

.tenant-menu-list__empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.tenant-menu-list__empty h3 {
  font-size: 1.5rem;
  color: $text-primary;
  margin: 0;
}

.tenant-menu-list__empty p {
  color: $text-secondary;
  margin: 0;
}

.tenant-menu-list__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.tenant-menu-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-md;
}

.tenant-menu-list__title-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.tenant-menu-list__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.tenant-menu-list__count {
  padding: $spacing-xs $spacing-sm;
  background: $bg-secondary;
  color: $text-secondary;
  border-radius: $radius-md;
  font-size: 0.875rem;
}

.tenant-menu-list__create-btn {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

.tenant-menu-list__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: $spacing-md;
}

.tenant-menu-list__stat {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.tenant-menu-list__stat-label {
  font-size: 0.875rem;
  color: $text-secondary;
}

.tenant-menu-list__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
}

.tenant-menu-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;
}

.menu-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    border-color: $primary-color;
    box-shadow: $shadow-md;
  }
}

.menu-card--inactive {
  opacity: 0.7;
}

.menu-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-sm;
}

.menu-card__name {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  flex: 1;
}

.menu-card__status {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.menu-card__status--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.menu-card__status--inactive {
  background: $bg-secondary;
  color: $text-secondary;
}

.menu-card__description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-card__stats {
  display: flex;
  gap: $spacing-md;
}

.menu-card__stat {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.menu-card__stat-icon {
  font-size: 1rem;
}

.menu-card__stat-text {
  font-size: 0.875rem;
  color: $text-secondary;
}

.menu-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
}

.menu-card__date {
  font-size: 0.75rem;
  color: $text-secondary;
}

.menu-card__view-btn {
  padding: $spacing-xs $spacing-sm;
  background: transparent;
  color: $primary-color;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    color: darken($primary-color, 10%);
  }
}

.tenant-menu-list__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-lg 0;
}

.tenant-menu-list__pagination-btn {
  padding: $spacing-sm $spacing-md;
  background: white;
  color: $primary-color;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover:not(:disabled) {
    background: $bg-secondary;
    border-color: $primary-color;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.tenant-menu-list__pagination-info {
  font-size: 0.875rem;
  color: $text-secondary;
}

@media (max-width: $breakpoint-md) {
  .tenant-menu-list__header {
    flex-direction: column;
    align-items: stretch;
  }

  .tenant-menu-list__create-btn {
    width: 100%;
  }

  .tenant-menu-list__grid {
    grid-template-columns: 1fr;
  }

  .tenant-menu-list__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
