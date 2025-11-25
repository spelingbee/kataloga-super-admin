<template>
  <div class="menu-item-form">
    <form @submit.prevent="handleSubmit">
      <!-- Basic Information Section -->
      <div class="menu-item-form__section">
        <h3 class="menu-item-form__section-title">Basic Information</h3>

        <FormInput
          v-model="formData.name"
          label="Item Name"
          placeholder="Enter item name"
          required
          :error="errors.name"
          hint="The name of the menu item as it will appear to customers"
        />

        <FormTextarea
          v-model="formData.description"
          label="Description"
          placeholder="Enter item description (optional)"
          :rows="4"
          :error="errors.description"
          hint="A brief description of the menu item"
        />

        <div class="menu-item-form__row menu-item-form__row--two-cols">
          <FormInput
            v-model="formData.price"
            type="number"
            label="Price"
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            :error="errors.price"
            hint="Item price in USD"
          />

          <FormSelect
            v-model="formData.categoryId"
            label="Category"
            :options="categories"
            option-label="name"
            option-value="id"
            placeholder="Select a category"
            required
            :error="errors.categoryId"
            hint="Select the category for this item"
          />
        </div>
      </div>

      <!-- Image Section -->
      <div class="menu-item-form__section">
        <h3 class="menu-item-form__section-title">Image</h3>

        <FormInput
          v-model="formData.imageUrl"
          label="Image URL"
          placeholder="https://example.com/image.jpg"
          :error="errors.imageUrl"
          hint="Enter the URL of the item image"
        />

        <!-- Image Preview -->
        <div v-if="imagePreviewUrl" class="menu-item-form__image-preview">
          <p class="menu-item-form__preview-label">Preview:</p>
          <div class="menu-item-form__preview-container">
            <img
              :src="imagePreviewUrl"
              alt="Item preview"
              class="menu-item-form__preview-image"
              @error="handleImageError"
            />
            <div v-if="imageError" class="menu-item-form__preview-error">
              <span class="menu-item-form__preview-error-icon">⚠️</span>
              <p class="menu-item-form__preview-error-text">Failed to load image</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Section -->
      <div class="menu-item-form__section">
        <h3 class="menu-item-form__section-title">Status</h3>

        <FormCheckbox
          v-model="formData.isActive"
          label="Active"
          hint="When active, this item will be visible to customers"
        />
      </div>

      <!-- Form Actions -->
      <div class="menu-item-form__actions">
        <button
          type="button"
          class="menu-item-form__button menu-item-form__button--secondary"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="menu-item-form__button menu-item-form__button--primary"
          :disabled="loading || !isFormValid"
        >
          {{ loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Item' : 'Create Item') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import FormInput from '~/components/ui/FormInput.vue'
import FormTextarea from '~/components/ui/FormTextarea.vue'
import FormSelect from '~/components/ui/FormSelect.vue'
import FormCheckbox from '~/components/ui/FormCheckbox.vue'
import type { MenuItem, MenuCategory } from '~/types'

interface Props {
  item?: MenuItem | null
  categories: MenuCategory[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  item: null,
  loading: false,
})

const emit = defineEmits<{
  submit: [data: MenuItemFormData]
  cancel: []
}>()

interface MenuItemFormData {
  name: string
  description: string
  price: number | string
  imageUrl: string
  categoryId: string
  isActive: boolean
}

const formData = ref<MenuItemFormData>({
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  categoryId: '',
  isActive: true,
})

const errors = ref({
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  categoryId: '',
})

const imageError = ref(false)
const imagePreviewUrl = ref('')

const isEditMode = computed(() => !!props.item)

const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.price !== '' &&
    Number(formData.value.price) >= 0 &&
    formData.value.categoryId !== '' &&
    !Object.values(errors.value).some(error => error !== '')
  )
})

// Watch for image URL changes to update preview
watch(() => formData.value.imageUrl, (newUrl) => {
  imageError.value = false
  if (newUrl && newUrl.trim() !== '') {
    imagePreviewUrl.value = newUrl.trim()
  } else {
    imagePreviewUrl.value = ''
  }
})

// Initialize form with item data if editing
onMounted(() => {
  if (props.item) {
    formData.value = {
      name: props.item.name,
      description: props.item.description || '',
      price: props.item.price,
      imageUrl: props.item.imageUrl || '',
      categoryId: props.item.category.id,
      isActive: props.item.isActive,
    }
  }
})

function validateForm(): boolean {
  let isValid = true

  // Reset errors
  errors.value = {
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
  }

  // Validate name
  if (!formData.value.name.trim()) {
    errors.value.name = 'Item name is required'
    isValid = false
  } else if (formData.value.name.trim().length < 2) {
    errors.value.name = 'Item name must be at least 2 characters'
    isValid = false
  } else if (formData.value.name.trim().length > 100) {
    errors.value.name = 'Item name must not exceed 100 characters'
    isValid = false
  }

  // Validate description (optional but has max length)
  if (formData.value.description && formData.value.description.length > 500) {
    errors.value.description = 'Description must not exceed 500 characters'
    isValid = false
  }

  // Validate price
  if (formData.value.price === '' || formData.value.price === null) {
    errors.value.price = 'Price is required'
    isValid = false
  } else {
    const priceNum = Number(formData.value.price)
    if (isNaN(priceNum)) {
      errors.value.price = 'Price must be a valid number'
      isValid = false
    } else if (priceNum < 0) {
      errors.value.price = 'Price cannot be negative'
      isValid = false
    } else if (priceNum > 999999.99) {
      errors.value.price = 'Price is too large'
      isValid = false
    }
  }

  // Validate category
  if (!formData.value.categoryId) {
    errors.value.categoryId = 'Please select a category'
    isValid = false
  }

  // Validate image URL (optional but must be valid URL if provided)
  if (formData.value.imageUrl && formData.value.imageUrl.trim() !== '') {
    try {
      new URL(formData.value.imageUrl.trim())
    } catch {
      errors.value.imageUrl = 'Please enter a valid URL'
      isValid = false
    }
  }

  return isValid
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }

  const submitData: MenuItemFormData = {
    name: formData.value.name.trim(),
    description: formData.value.description.trim(),
    price: Number(formData.value.price),
    imageUrl: formData.value.imageUrl.trim() || '',
    categoryId: formData.value.categoryId,
    isActive: formData.value.isActive,
  }

  emit('submit', submitData)
}

function handleCancel() {
  emit('cancel')
}

function handleImageError() {
  imageError.value = true
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.menu-item-form {
  max-width: 800px;
  margin: 0 auto;
}

.menu-item-form__section {
  margin-bottom: $spacing-2xl;
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.menu-item-form__section-title {
  margin: 0 0 $spacing-lg 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  padding-bottom: $spacing-md;
  border-bottom: 2px solid $border-color;
}

.menu-item-form__row {
  display: flex;
  gap: $spacing-lg;
}

.menu-item-form__row--two-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;
}

.menu-item-form__image-preview {
  margin-top: $spacing-lg;
}

.menu-item-form__preview-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.menu-item-form__preview-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 250px;
  border: 2px dashed $border-color;
  border-radius: $radius-md;
  overflow: hidden;
  background: $bg-secondary;
}

.menu-item-form__preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-item-form__preview-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  gap: $spacing-sm;
}

.menu-item-form__preview-error-icon {
  font-size: 2rem;
}

.menu-item-form__preview-error-text {
  margin: 0;
  font-size: 0.875rem;
  color: $error-color;
  font-weight: 500;
}

.menu-item-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-2xl;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.menu-item-form__button {
  padding: $spacing-sm $spacing-lg;
  font-size: 1rem;
  font-weight: 500;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.menu-item-form__button--primary {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

.menu-item-form__button--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: darken($bg-secondary, 5%);
  }
}

@media (max-width: $breakpoint-md) {
  .menu-item-form__row--two-cols {
    grid-template-columns: 1fr;
  }

  .menu-item-form__actions {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }

  .menu-item-form__preview-container {
    max-width: 100%;
  }
}
</style>
