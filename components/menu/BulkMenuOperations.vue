<template>
  <div class="bulk-operations">
    <!-- Selection Header -->
    <div v-if="selectedItems.length > 0" class="bulk-operations__header">
      <div class="bulk-operations__selection-info">
        <input
          type="checkbox"
          :checked="isAllSelected"
          :indeterminate="isPartiallySelected"
          class="bulk-operations__checkbox"
          @change="handleToggleAll"
        />
        <span class="bulk-operations__selection-text">
          {{ selectedItems.length }} {{ selectedItems.length === 1 ? 'item' : 'items' }} selected
        </span>
      </div>

      <div class="bulk-operations__actions">
        <button
          class="bulk-operations__action-btn bulk-operations__action-btn--activate"
          @click="handleBulkActivate"
          :disabled="loading"
        >
          ✓ Activate
        </button>
        <button
          class="bulk-operations__action-btn bulk-operations__action-btn--deactivate"
          @click="handleBulkDeactivate"
          :disabled="loading"
        >
          ✕ Deactivate
        </button>
        <button
          class="bulk-operations__action-btn bulk-operations__action-btn--price"
          @click="showPriceDialog = true"
          :disabled="loading"
        >
          💲 Update Price
        </button>
        <button
          class="bulk-operations__action-btn bulk-operations__action-btn--category"
          @click="showCategoryDialog = true"
          :disabled="loading"
        >
          🏷️ Change Category
        </button>
        <button
          class="bulk-operations__action-btn bulk-operations__action-btn--clear"
          @click="handleClearSelection"
          :disabled="loading"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Menu Items with Selection -->
    <div class="bulk-operations__items">
      <div
        v-for="item in items"
        :key="item.id"
        class="bulk-item"
        :class="{ 
          'bulk-item--selected': isSelected(item.id),
          'bulk-item--inactive': !item.isActive 
        }"
        @click="handleItemClick(item.id)"
      >
        <input
          type="checkbox"
          :checked="isSelected(item.id)"
          class="bulk-item__checkbox"
          @click.stop
          @change="handleToggleItem(item.id)"
        />
        
        <div class="bulk-item__image">
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.name"
            @error="handleImageError"
          />
          <div v-else class="bulk-item__image-placeholder">
            <span>📷</span>
          </div>
        </div>

        <div class="bulk-item__content">
          <div class="bulk-item__header">
            <h4 class="bulk-item__name">{{ item.name }}</h4>
            <span class="bulk-item__price">{{ formatPrice(item.price) }}</span>
          </div>
          <div class="bulk-item__meta">
            <span class="bulk-item__category">{{ item.category.name }}</span>
            <span
              :class="[
                'bulk-item__status',
                item.isActive ? 'bulk-item__status--active' : 'bulk-item__status--inactive'
              ]"
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Price Update Dialog -->
    <div v-if="showPriceDialog" class="bulk-operations__dialog-overlay" @click="handleCloseDialogs">
      <div class="bulk-operations__dialog" @click.stop>
        <div class="bulk-operations__dialog-header">
          <h3 class="bulk-operations__dialog-title">Update Price</h3>
          <button class="bulk-operations__dialog-close" @click="handleCloseDialogs">✕</button>
        </div>

        <div class="bulk-operations__dialog-body">
          <p class="bulk-operations__dialog-description">
            Set a new price for {{ selectedItems.length }} selected {{ selectedItems.length === 1 ? 'item' : 'items' }}
          </p>

          <div class="bulk-operations__form-group">
            <label class="bulk-operations__form-label">New Price</label>
            <input
              v-model.number="bulkPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter new price"
              class="bulk-operations__form-input"
              @keyup.enter="handleConfirmPriceUpdate"
            />
          </div>

          <div v-if="priceError" class="bulk-operations__error">
            {{ priceError }}
          </div>
        </div>

        <div class="bulk-operations__dialog-footer">
          <button
            class="bulk-operations__dialog-btn bulk-operations__dialog-btn--cancel"
            @click="handleCloseDialogs"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            class="bulk-operations__dialog-btn bulk-operations__dialog-btn--confirm"
            @click="handleConfirmPriceUpdate"
            :disabled="loading || !bulkPrice || bulkPrice <= 0"
          >
            {{ loading ? 'Updating...' : 'Update Price' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Category Update Dialog -->
    <div v-if="showCategoryDialog" class="bulk-operations__dialog-overlay" @click="handleCloseDialogs">
      <div class="bulk-operations__dialog" @click.stop>
        <div class="bulk-operations__dialog-header">
          <h3 class="bulk-operations__dialog-title">Change Category</h3>
          <button class="bulk-operations__dialog-close" @click="handleCloseDialogs">✕</button>
        </div>

        <div class="bulk-operations__dialog-body">
          <p class="bulk-operations__dialog-description">
            Change category for {{ selectedItems.length }} selected {{ selectedItems.length === 1 ? 'item' : 'items' }}
          </p>

          <div class="bulk-operations__form-group">
            <label class="bulk-operations__form-label">New Category</label>
            <select
              v-model="bulkCategoryId"
              class="bulk-operations__form-select"
            >
              <option value="">Select a category</option>
              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <div v-if="categoryError" class="bulk-operations__error">
            {{ categoryError }}
          </div>
        </div>

        <div class="bulk-operations__dialog-footer">
          <button
            class="bulk-operations__dialog-btn bulk-operations__dialog-btn--cancel"
            @click="handleCloseDialogs"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            class="bulk-operations__dialog-btn bulk-operations__dialog-btn--confirm"
            @click="handleConfirmCategoryUpdate"
            :disabled="loading || !bulkCategoryId"
          >
            {{ loading ? 'Updating...' : 'Change Category' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="bulk-operations__dialog-overlay" @click="handleCloseDialogs">
      <div class="bulk-operations__dialog" @click.stop>
        <div class="bulk-operations__dialog-header">
          <h3 class="bulk-operations__dialog-title">{{ confirmTitle }}</h3>
          <button class="bulk-operations__dialog-close" @click="handleCloseDialogs">✕</button>
        </div>

        <div class="bulk-operations__dialog-body">
          <p class="bulk-operations__dialog-description">
            {{ confirmMessage }}
          </p>
          <p class="bulk-operations__dialog-count">
            <strong>{{ selectedItems.length }}</strong> {{ selectedItems.length === 1 ? 'item' : 'items' }} will be affected
          </p>
        </div>

        <div class="bulk-operations__dialog-footer">
          <button
            class="bulk-operations__dialog-btn bulk-operations__dialog-btn--cancel"
            @click="handleCloseDialogs"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            class="bulk-operations__dialog-btn bulk-operations__dialog-btn--confirm"
            @click="handleConfirmAction"
            :disabled="loading"
          >
            {{ loading ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMenuStore } from '~/stores/menu'
import type { MenuItem, MenuCategory } from '~/types'

interface Props {
  items: MenuItem[]
  categories: MenuCategory[]
  tenantId: string
  menuId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
}>()

const menuStore = useMenuStore()

const selectedItems = ref<string[]>([])
const loading = ref(false)

// Dialog states
const showPriceDialog = ref(false)
const showCategoryDialog = ref(false)
const showConfirmDialog = ref(false)

// Form data
const bulkPrice = ref<number | null>(null)
const bulkCategoryId = ref('')
const priceError = ref('')
const categoryError = ref('')

// Confirmation dialog data
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)

const isAllSelected = computed(() => {
  return props.items.length > 0 && selectedItems.value.length === props.items.length
})

const isPartiallySelected = computed(() => {
  return selectedItems.value.length > 0 && selectedItems.value.length < props.items.length
})

function isSelected(itemId: string): boolean {
  return selectedItems.value.includes(itemId)
}

function handleToggleItem(itemId: string): void {
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(itemId)
  }
}

function handleItemClick(itemId: string): void {
  handleToggleItem(itemId)
}

function handleToggleAll(): void {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = props.items.map(item => item.id)
  }
}

function handleClearSelection(): void {
  selectedItems.value = []
}

function handleBulkActivate(): void {
  confirmTitle.value = 'Activate Items'
  confirmMessage.value = 'Are you sure you want to activate the selected items?'
  confirmAction.value = async () => {
    await performBulkUpdate({ isActive: true })
  }
  showConfirmDialog.value = true
}

function handleBulkDeactivate(): void {
  confirmTitle.value = 'Deactivate Items'
  confirmMessage.value = 'Are you sure you want to deactivate the selected items?'
  confirmAction.value = async () => {
    await performBulkUpdate({ isActive: false })
  }
  showConfirmDialog.value = true
}

function handleConfirmPriceUpdate(): void {
  priceError.value = ''

  if (!bulkPrice.value || bulkPrice.value <= 0) {
    priceError.value = 'Please enter a valid price greater than 0'
    return
  }

  performBulkUpdate({ price: bulkPrice.value })
}

function handleConfirmCategoryUpdate(): void {
  categoryError.value = ''

  if (!bulkCategoryId.value) {
    categoryError.value = 'Please select a category'
    return
  }

  performBulkUpdate({ categoryId: bulkCategoryId.value })
}

async function handleConfirmAction(): Promise<void> {
  if (confirmAction.value) {
    await confirmAction.value()
  }
}

async function performBulkUpdate(updates: {
  isActive?: boolean
  price?: number
  categoryId?: string
}): Promise<void> {
  if (selectedItems.value.length === 0) {
    return
  }

  loading.value = true

  try {
    const result = await menuStore.bulkUpdateMenuItems(
      props.tenantId,
      props.menuId,
      selectedItems.value,
      updates
    )

    // Show success message
    alert(`✓ ${result.message}`)

    // Clear selection and close dialogs
    selectedItems.value = []
    handleCloseDialogs()

    // Refresh the list
    emit('refresh')
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Failed to update menu items'
    alert(`✕ ${errorMessage}`)
  } finally {
    loading.value = false
  }
}

function handleCloseDialogs(): void {
  showPriceDialog.value = false
  showCategoryDialog.value = false
  showConfirmDialog.value = false
  priceError.value = ''
  categoryError.value = ''
  bulkPrice.value = null
  bulkCategoryId.value = ''
  confirmAction.value = null
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
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.bulk-operations {
  width: 100%;
}

.bulk-operations__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  background: lighten($primary-color, 45%);
  border: 2px solid $primary-color;
  border-radius: $radius-lg;
  margin-bottom: $spacing-lg;
}

.bulk-operations__selection-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.bulk-operations__checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.bulk-operations__selection-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
}

.bulk-operations__actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.bulk-operations__action-btn {
  padding: $spacing-xs $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.bulk-operations__action-btn--activate {
  background: white;
  color: $success-color;

  &:hover:not(:disabled) {
    background: lighten($success-color, 45%);
    border-color: $success-color;
  }
}

.bulk-operations__action-btn--deactivate {
  background: white;
  color: $error-color;

  &:hover:not(:disabled) {
    background: lighten($error-color, 45%);
    border-color: $error-color;
  }
}

.bulk-operations__action-btn--price {
  background: white;
  color: $info-color;

  &:hover:not(:disabled) {
    background: lighten($info-color, 45%);
    border-color: $info-color;
  }
}

.bulk-operations__action-btn--category {
  background: white;
  color: $warning-color;

  &:hover:not(:disabled) {
    background: lighten($warning-color, 45%);
    border-color: $warning-color;
  }
}

.bulk-operations__action-btn--clear {
  background: white;
  color: $text-secondary;

  &:hover:not(:disabled) {
    background: $bg-secondary;
    border-color: $text-secondary;
  }
}

.bulk-operations__items {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.bulk-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: white;
  border: 2px solid $border-color;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    border-color: $primary-color;
    box-shadow: $shadow-sm;
  }
}

.bulk-item--selected {
  background: lighten($primary-color, 48%);
  border-color: $primary-color;
}

.bulk-item--inactive {
  opacity: 0.7;
}

.bulk-item__checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.bulk-item__image {
  width: 60px;
  height: 60px;
  border-radius: $radius-md;
  overflow: hidden;
  background: $bg-secondary;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.bulk-item__image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.5rem;
  opacity: 0.3;
}

.bulk-item__content {
  flex: 1;
  min-width: 0;
}

.bulk-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.bulk-item__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bulk-item__price {
  font-size: 0.875rem;
  font-weight: 700;
  color: $primary-color;
  white-space: nowrap;
}

.bulk-item__meta {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.bulk-item__category {
  font-size: 0.75rem;
  color: $text-secondary;
}

.bulk-item__status {
  padding: 2px $spacing-xs;
  border-radius: $radius-sm;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.bulk-item__status--active {
  background: lighten($success-color, 40%);
  color: $success-color;
}

.bulk-item__status--inactive {
  background: $bg-secondary;
  color: $text-secondary;
}

.bulk-operations__dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-lg;
}

.bulk-operations__dialog {
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
}

.bulk-operations__dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.bulk-operations__dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.bulk-operations__dialog-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  font-size: 1.25rem;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
}

.bulk-operations__dialog-body {
  padding: $spacing-lg;
}

.bulk-operations__dialog-description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin: 0 0 $spacing-lg 0;
}

.bulk-operations__dialog-count {
  font-size: 0.875rem;
  color: $text-primary;
  margin: $spacing-md 0 0 0;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  text-align: center;

  strong {
    color: $primary-color;
    font-size: 1.25rem;
  }
}

.bulk-operations__form-group {
  margin-bottom: $spacing-md;
}

.bulk-operations__form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.bulk-operations__form-input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.bulk-operations__form-select {
  width: 100%;
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

.bulk-operations__error {
  padding: $spacing-sm $spacing-md;
  background: lighten($error-color, 45%);
  color: $error-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  margin-top: $spacing-sm;
}

.bulk-operations__dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
}

.bulk-operations__dialog-btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.bulk-operations__dialog-btn--cancel {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }
}

.bulk-operations__dialog-btn--confirm {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .bulk-operations__header {
    flex-direction: column;
    align-items: stretch;
  }

  .bulk-operations__actions {
    justify-content: stretch;

    button {
      flex: 1;
    }
  }

  .bulk-item {
    flex-wrap: wrap;
  }

  .bulk-item__content {
    flex: 1 1 100%;
  }

  .bulk-operations__dialog {
    max-width: 100%;
    margin: $spacing-md;
  }
}
</style>
