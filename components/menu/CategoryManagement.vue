<template>
  <div class="category-management">
    <!-- Header -->
    <div class="category-management__header">
      <div class="category-management__title-section">
        <h3 class="category-management__title">Categories</h3>
        <span class="category-management__count">
          {{ categories.length }} {{ categories.length === 1 ? 'category' : 'categories' }}
        </span>
      </div>
      <button class="category-management__create-btn" @click="handleCreateCategory">
        + Add Category
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && categories.length === 0" class="category-management__loading">
      <div class="category-management__spinner"></div>
      <p>Loading categories...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && categories.length === 0" class="category-management__error">
      <h3>Failed to load categories</h3>
      <p>{{ error }}</p>
      <button @click="handleRetry">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="categories.length === 0" class="category-management__empty">
      <div class="category-management__empty-icon">🏷️</div>
      <h3>No categories yet</h3>
      <p>Create your first category to organize menu items.</p>
      <button class="category-management__create-btn" @click="handleCreateCategory">
        Create First Category
      </button>
    </div>

    <!-- Categories List -->
    <div v-else class="category-management__list">
      <div
        v-for="category in categories"
        :key="category.id"
        class="category-card"
      >
        <div class="category-card__content">
          <div class="category-card__info">
            <h4 class="category-card__name">{{ category.name }}</h4>
            <span class="category-card__count">
              {{ category.itemCount }} {{ category.itemCount === 1 ? 'item' : 'items' }}
            </span>
          </div>

          <div class="category-card__actions">
            <button
              class="category-card__action-btn category-card__action-btn--edit"
              @click="handleEditCategory(category)"
              :aria-label="`Edit ${category.name}`"
            >
              Edit
            </button>
            <button
              class="category-card__action-btn category-card__action-btn--delete"
              @click="handleDeleteCategory(category)"
              :disabled="category.itemCount > 0"
              :aria-label="`Delete ${category.name}`"
              :title="category.itemCount > 0 ? 'Cannot delete category with items' : 'Delete category'"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="category-modal-overlay" @click="handleCloseModal">
      <div class="category-modal" @click.stop>
        <div class="category-modal__header">
          <h3 class="category-modal__title">
            {{ editingCategory ? 'Edit Category' : 'Create Category' }}
          </h3>
          <button
            class="category-modal__close"
            @click="handleCloseModal"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form class="category-modal__form" @submit.prevent="handleSubmit">
          <div class="category-modal__field">
            <label for="category-name" class="category-modal__label">
              Category Name <span class="category-modal__required">*</span>
            </label>
            <input
              id="category-name"
              v-model="formData.name"
              type="text"
              class="category-modal__input"
              :class="{ 'category-modal__input--error': formErrors.name }"
              placeholder="e.g., Pizza, Pasta, Desserts"
              required
              maxlength="100"
              @input="clearFieldError('name')"
            />
            <span v-if="formErrors.name" class="category-modal__error">
              {{ formErrors.name }}
            </span>
          </div>

          <div class="category-modal__actions">
            <button
              type="button"
              class="category-modal__btn category-modal__btn--cancel"
              @click="handleCloseModal"
              :disabled="saving"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="category-modal__btn category-modal__btn--submit"
              :disabled="saving || !formData.name.trim()"
            >
              {{ saving ? 'Saving...' : (editingCategory ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMenuStore } from '~/stores/menu'
import type { CategoryWithItemCount } from '~/types'

interface Props {
  tenantId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  categoryCreated: [category: CategoryWithItemCount]
  categoryUpdated: [category: CategoryWithItemCount]
  categoryDeleted: [categoryId: string]
}>()

const menuStore = useMenuStore()

const categories = computed(() => menuStore.categories)
const loading = computed(() => menuStore.loading)
const error = computed(() => menuStore.error)

const showModal = ref(false)
const editingCategory = ref<CategoryWithItemCount | null>(null)
const saving = ref(false)

const formData = ref({
  name: '',
})

const formErrors = ref<Record<string, string>>({})

async function fetchCategories(): Promise<void> {
  try {
    await menuStore.fetchCategories(props.tenantId)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

function handleCreateCategory(): void {
  editingCategory.value = null
  formData.value = { name: '' }
  formErrors.value = {}
  showModal.value = true
}

function handleEditCategory(category: CategoryWithItemCount): void {
  editingCategory.value = category
  formData.value = { name: category.name }
  formErrors.value = {}
  showModal.value = true
}

async function handleDeleteCategory(category: CategoryWithItemCount): Promise<void> {
  if (category.itemCount > 0) {
    return
  }

  const confirmed = confirm(
    `Are you sure you want to delete the category "${category.name}"?`
  )

  if (!confirmed) {
    return
  }

  try {
    await menuStore.deleteCategory(props.tenantId, category.id)
    emit('categoryDeleted', category.id)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete category')
  }
}

function handleCloseModal(): void {
  showModal.value = false
  editingCategory.value = null
  formData.value = { name: '' }
  formErrors.value = {}
}

async function handleSubmit(): Promise<void> {
  formErrors.value = {}

  if (!formData.value.name.trim()) {
    formErrors.value.name = 'Category name is required'
    return
  }

  saving.value = true

  try {
    if (editingCategory.value) {
      const updated = await menuStore.updateCategory(
        props.tenantId,
        editingCategory.value.id,
        { name: formData.value.name.trim() }
      )
      emit('categoryUpdated', updated)
    } else {
      const created = await menuStore.createCategory(
        props.tenantId,
        { name: formData.value.name.trim() }
      )
      emit('categoryCreated', created)
    }

    handleCloseModal()
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to save category'
    formErrors.value.name = message
  } finally {
    saving.value = false
  }
}

function clearFieldError(field: string): void {
  if (formErrors.value[field]) {
    delete formErrors.value[field]
  }
}

function handleRetry(): void {
  menuStore.clearError()
  fetchCategories()
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.category-management {
  width: 100%;
}

.category-management__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.category-management__title-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.category-management__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.category-management__count {
  padding: $spacing-xs $spacing-sm;
  background: $bg-secondary;
  color: $text-secondary;
  border-radius: $radius-md;
  font-size: 0.875rem;
}

.category-management__create-btn {
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

.category-management__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: $spacing-md;

  p {
    color: $text-secondary;
  }
}

.category-management__spinner {
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

.category-management__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
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

.category-management__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: $spacing-md;
  text-align: center;
}

.category-management__empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.category-management__empty h3 {
  font-size: 1.5rem;
  color: $text-primary;
  margin: 0;
}

.category-management__empty p {
  color: $text-secondary;
  margin: 0;
}

.category-management__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $spacing-md;
}

.category-card {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-md;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-md;
    border-color: $primary-color;
  }
}

.category-card__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.category-card__info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.category-card__name {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.category-card__count {
  font-size: 0.875rem;
  color: $text-secondary;
}

.category-card__actions {
  display: flex;
  gap: $spacing-sm;
}

.category-card__action-btn {
  flex: 1;
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color;
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

.category-card__action-btn--edit {
  background: white;
  color: $primary-color;

  &:hover:not(:disabled) {
    background: lighten($primary-color, 45%);
    border-color: $primary-color;
  }
}

.category-card__action-btn--delete {
  background: white;
  color: $error-color;

  &:hover:not(:disabled) {
    background: lighten($error-color, 45%);
    border-color: $error-color;
  }
}

.category-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-lg;
}

.category-modal {
  background: white;
  border-radius: $radius-lg;
  width: 100%;
  max-width: 500px;
  box-shadow: $shadow-lg;
}

.category-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.category-modal__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.category-modal__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: $text-secondary;
  cursor: pointer;
  border-radius: $radius-md;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
}

.category-modal__form {
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.category-modal__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.category-modal__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
}

.category-modal__required {
  color: $error-color;
}

.category-modal__input {
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

.category-modal__input--error {
  border-color: $error-color;
}

.category-modal__error {
  font-size: 0.75rem;
  color: $error-color;
}

.category-modal__actions {
  display: flex;
  gap: $spacing-sm;
  justify-content: flex-end;
}

.category-modal__btn {
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

.category-modal__btn--cancel {
  background: white;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }
}

.category-modal__btn--submit {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .category-management__header {
    flex-direction: column;
    align-items: stretch;
  }

  .category-management__create-btn {
    width: 100%;
  }

  .category-management__list {
    grid-template-columns: 1fr;
  }

  .category-modal-overlay {
    padding: $spacing-md;
  }
}
</style>
