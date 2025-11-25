<template>
  <div class="menu-item-list">
    <!-- Filters Section -->
    <div class="menu-item-list__filters">
      <div class="menu-item-list__filters-row">
        <!-- Search -->
        <div class="menu-item-list__search">
          <input
            v-model="localFilters.search"
            type="text"
            placeholder="Search menu items..."
            class="menu-item-list__search-input"
            @input="handleSearchChange"
          />
          <span class="menu-item-list__search-icon">🔍</span>
        </div>

        <!-- Category Filter -->
        <select
          v-model="localFilters.categoryId"
          class="menu-item-list__filter-select"
          @change="handleFilterChange"
        >
          <option value="">All Categories</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>

        <!-- Active Status Filter -->
        <select
          v-model="localFilters.isActive"
          class="menu-item-list__filter-select"
          @change="handleFilterChange"
        >
          <option :value="undefined">All Status</option>
          <option :value="true">Active Only</option>
          <option :value="false">Inactive Only</option>
        </select>
      </div>

      <!-- Price Range Filter -->
      <div class="menu-item-list__filters-row">
        <div class="menu-item-list__price-filter">
          <label class="menu-item-list__price-label">Price Range:</label>
          <input
            v-model.number="localFilters.minPrice"
            type="number"
            placeholder="Min"
            class="menu-item-list__price-input"
            min="0"
            step="0.01"
            @input="handleFilterChange"
          />
          <span class="menu-item-list__price-separator">-</span>
          <input
            v-model.number="localFilters.maxPrice"
            type="number"
            placeholder="Max"
            class="menu-item-list__price-input"
            min="0"
            step="0.01"
            @input="handleFilterChange"
          />
        </div>

        <!-- Clear Filters -->
        <button
          v-if="hasActiveFilters"
          class="menu-item-list__clear-btn"
          @click="handleClearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && menuItems.length === 0" class="menu-item-list__loading">
      <div class="menu-item-list__spinner"></div>
      <p>Loading menu items...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && menuItems.length === 0" class="menu-item-list__error">
      <h3>Failed to load menu items</h3>
      <p>{{ error }}</p>
      <button @click="handleRetry">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="menuItems.length === 0" class="menu-item-list__empty">
      <div class="menu-item-list__empty-icon">🍽️</div>
      <h3>No menu items found</h3>
      <p v-if="hasActiveFilters">Try adjusting your filters</p>
      <p v-else>This menu doesn't have any items yet.</p>
      <button
        v-if="!hasActiveFilters"
        class="menu-item-list__create-btn"
        @click="handleCreateItem"
      >
        Create First Item
      </button>
    </div>

    <!-- Menu Items List -->
    <div v-else class="menu-item-list__content">
      <!-- Header -->
      <div class="menu-item-list__header">
        <div class="menu-item-list__title-section">
          <h3 class="menu-item-list__title">Menu Items</h3>
          <span class="menu-item-list__count">
            {{ pagination.total }} {{ pagination.total === 1 ? 'item' : 'items' }}
          </span>
        </div>
        <button class="menu-item-list__create-btn" @click="handleCreateItem">
          + Add Item
        </button>
      </div>

      <!-- Items Grid -->
      <div class="menu-item-list__grid">
        <div
          v-for="item in menuItems"
          :key="item.id"
          class="menu-item-card"
          :class="{ 'menu-item-card--inactive': !item.isActive }"
        >
          <!-- Image -->
          <div class="menu-item-card__image">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              @error="handleImageError"
            />
            <div v-else class="menu-item-card__image-placeholder">
              <span>📷</span>
            </div>
            <span
              :class="[
                'menu-item-card__status-badge',
                item.isActive
                  ? 'menu-item-card__status-badge--active'
                  : 'menu-item-card__status-badge--inactive'
              ]"
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <!-- Content -->
          <div class="menu-item-card__content">
            <div class="menu-item-card__header">
              <h4 class="menu-item-card__name">{{ item.name }}</h4>
              <span class="menu-item-card__price">{{ formatPrice(item.price) }}</span>
            </div>

            <p v-if="item.description" class="menu-item-card__description">
              {{ item.description }}
            </p>

            <div class="menu-item-card__meta">
              <span class="menu-item-card__category">
                <span class="menu-item-card__category-icon">🏷️</span>
                {{ item.category.name }}
              </span>
            </div>

            <!-- Actions -->
            <div class="menu-item-card__actions">
              <button
                class="menu-item-card__action-btn menu-item-card__action-btn--edit"
                @click="handleEditItem(item)"
              >
                Edit
              </button>
              <button
                class="menu-item-card__action-btn menu-item-card__action-btn--delete"
                @click="handleDeleteItem(item)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="menu-item-list__pagination">
        <button
          class="menu-item-list__pagination-btn"
          :disabled="pagination.page === 1"
          @click="handlePageChange(pagination.page - 1)"
        >
          ← Previous
        </button>
        <div class="menu-item-list__pagination-pages">
          <button
            v-for="page in visiblePages"
            :key="page"
            :class="[
              'menu-item-list__pagination-page',
              { 'menu-item-list__pagination-page--active': page === pagination.page }
            ]"
            @click="handlePageChange(page)"
          >
            {{ page }}
          </button>
        </div>
        <button
          class="menu-item-list__pagination-btn"
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
import { computed, onMounted, ref, watch } from 'vue'
import { useMenuStore } from '~/stores/menu'
import type { MenuItem, MenuCategory, MenuItemFilters } from '~/types'

interface Props {
  tenantId: string
  menuId: string
  categories: MenuCategory[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  createItem: []
  editItem: [item: MenuItem]
  deleteItem: [item: MenuItem]
}>()

const menuStore = useMenuStore()

const menuItems = computed(() => menuStore.menuItems)
const loading = computed(() => menuStore.loading)
const error = computed(() => menuStore.error)
const pagination = computed(() => menuStore.pagination)

const localFilters = ref<MenuItemFilters>({
  search: '',
  categoryId: '',
  minPrice: undefined,
  maxPrice: undefined,
  isActive: undefined,
})

const searchTimeout = ref<NodeJS.Timeout | null>(null)

const hasActiveFilters = computed(() => {
  return !!(
    localFilters.value.search ||
    localFilters.value.categoryId ||
    localFilters.value.minPrice !== undefined ||
    localFilters.value.maxPrice !== undefined ||
    localFilters.value.isActive !== undefined
  )
})

const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const pages: number[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push(-1) // ellipsis
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push(-1) // ellipsis
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push(-1) // ellipsis
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push(-1) // ellipsis
      pages.push(total)
    }
  }

  return pages
})

async function fetchMenuItems(page = 1): Promise<void> {
  try {
    await menuStore.fetchMenuItems(props.tenantId, props.menuId, page)
  } catch (error) {
    console.error('Failed to fetch menu items:', error)
  }
}

function handleSearchChange(): void {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    handleFilterChange()
  }, 500)
}

function handleFilterChange(): void {
  menuStore.setItemFilters(localFilters.value)
  fetchMenuItems(1)
}

function handleClearFilters(): void {
  localFilters.value = {
    search: '',
    categoryId: '',
    minPrice: undefined,
    maxPrice: undefined,
    isActive: undefined,
  }
  menuStore.clearItemFilters()
  fetchMenuItems(1)
}

function handlePageChange(page: number): void {
  if (page < 1 || page > pagination.value.totalPages) {
    return
  }
  menuStore.setPage(page)
  fetchMenuItems(page)
}

function handleRetry(): void {
  menuStore.clearError()
  fetchMenuItems()
}

function handleCreateItem(): void {
  emit('createItem')
}

function handleEditItem(item: MenuItem): void {
  emit('editItem', item)
}

function handleDeleteItem(item: MenuItem): void {
  emit('deleteItem', item)
}

function handleImageError(event: Event): void {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  const placeholder = target.nextElementSibling as HTMLElement
  if (placeholder) {
    placeholder.style.display = 'flex'
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

onMounted(() => {
  fetchMenuItems()
})

watch(
  () => props.menuId,
  () => {
    handleClearFilters()
    fetchMenuItems()
  }
)
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.menu-item-list {
  width: 100%;
}

.menu-item-list__filters {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  margin-bottom: $spacing-lg;
}

.menu-item-list__filters-row {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  flex-wrap: wrap;
}

.menu-item-list__search {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.menu-item-list__search-input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  padding-right: 40px;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.menu-item-list__search-icon {
  position: absolute;
  right: $spacing-md;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.5;
}

.menu-item-list__filter-select {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.menu-item-list__price-filter {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.menu-item-list__price-label {
  font-size: 0.875rem;
  color: $text-secondary;
  white-space: nowrap;
}

.menu-item-list__price-input {
  width: 100px;
  padding: $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.menu-item-list__price-separator {
  color: $text-secondary;
}

.menu-item-list__clear-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;
  white-space: nowrap;

  &:hover {
    background: darken($bg-secondary, 5%);
  }
}

.menu-item-list__loading {
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

.menu-item-list__spinner {
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

.menu-item-list__error {
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

.menu-item-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: $spacing-md;
  text-align: center;
}

.menu-item-list__empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.menu-item-list__empty h3 {
  font-size: 1.5rem;
  color: $text-primary;
  margin: 0;
}

.menu-item-list__empty p {
  color: $text-secondary;
  margin: 0;
}

.menu-item-list__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.menu-item-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-md;
}

.menu-item-list__title-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.menu-item-list__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.menu-item-list__count {
  padding: $spacing-xs $spacing-sm;
  background: $bg-secondary;
  color: $text-secondary;
  border-radius: $radius-md;
  font-size: 0.875rem;
}

.menu-item-list__create-btn {
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

.menu-item-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $spacing-lg;
}

.menu-item-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  overflow: hidden;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-md;
    border-color: $primary-color;
  }
}

.menu-item-card--inactive {
  opacity: 0.7;
}

.menu-item-card__image {
  position: relative;
  width: 100%;
  height: 200px;
  background: $bg-secondary;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.menu-item-card__image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 3rem;
  opacity: 0.3;
}

.menu-item-card__status-badge {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.menu-item-card__status-badge--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.menu-item-card__status-badge--inactive {
  background: rgba(0, 0, 0, 0.6);
  color: white;
}

.menu-item-card__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-md;
}

.menu-item-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-sm;
}

.menu-item-card__name {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  flex: 1;
}

.menu-item-card__price {
  font-size: 1.125rem;
  font-weight: 700;
  color: $primary-color;
  white-space: nowrap;
}

.menu-item-card__description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.menu-item-card__meta {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $border-color;
}

.menu-item-card__category {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.75rem;
  color: $text-secondary;
}

.menu-item-card__category-icon {
  font-size: 0.875rem;
}

.menu-item-card__actions {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
}

.menu-item-card__action-btn {
  flex: 1;
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
}

.menu-item-card__action-btn--edit {
  background: white;
  color: $primary-color;

  &:hover {
    background: lighten($primary-color, 45%);
    border-color: $primary-color;
  }
}

.menu-item-card__action-btn--delete {
  background: white;
  color: $error-color;

  &:hover {
    background: lighten($error-color, 45%);
    border-color: $error-color;
  }
}

.menu-item-list__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-lg 0;
}

.menu-item-list__pagination-btn {
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

.menu-item-list__pagination-pages {
  display: flex;
  gap: $spacing-xs;
}

.menu-item-list__pagination-page {
  min-width: 36px;
  padding: $spacing-xs $spacing-sm;
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
  }
}

.menu-item-list__pagination-page--active {
  background: $primary-color;
  color: white;
  border-color: $primary-color;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .menu-item-list__filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .menu-item-list__search {
    min-width: 100%;
  }

  .menu-item-list__filter-select {
    width: 100%;
  }

  .menu-item-list__price-filter {
    flex-wrap: wrap;
  }

  .menu-item-list__header {
    flex-direction: column;
    align-items: stretch;
  }

  .menu-item-list__create-btn {
    width: 100%;
  }

  .menu-item-list__grid {
    grid-template-columns: 1fr;
  }

  .menu-item-list__pagination {
    flex-wrap: wrap;
  }

  .menu-item-list__pagination-pages {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>
