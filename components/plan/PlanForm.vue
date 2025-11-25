<template>
  <div class="plan-form">
    <form @submit.prevent="handleSubmit">
      <!-- Plan Name -->
      <div class="plan-form__field">
        <label class="plan-form__label" for="plan-name">
          Plan Name <span class="plan-form__required">*</span>
        </label>
        <input
          id="plan-name"
          v-model="formData.name"
          type="text"
          class="plan-form__input"
          :class="{ 'plan-form__input--error': errors.name }"
          placeholder="e.g., PRO, ENTERPRISE"
          required
        />
        <span v-if="errors.name" class="plan-form__error">{{ errors.name }}</span>
      </div>

      <!-- Price -->
      <div class="plan-form__field">
        <label class="plan-form__label" for="plan-price">
          Price (per month) <span class="plan-form__required">*</span>
        </label>
        <div class="plan-form__input-group">
          <span class="plan-form__input-prefix">$</span>
          <input
            id="plan-price"
            v-model.number="formData.price"
            type="number"
            step="0.01"
            min="0"
            class="plan-form__input plan-form__input--with-prefix"
            :class="{ 'plan-form__input--error': errors.price }"
            placeholder="29.99"
            required
          />
        </div>
        <span v-if="errors.price" class="plan-form__error">{{ errors.price }}</span>
      </div>

      <!-- Max Users and Max Sites -->
      <div class="plan-form__row">
        <div class="plan-form__field">
          <label class="plan-form__label" for="max-users">
            Max Users <span class="plan-form__required">*</span>
          </label>
          <input
            id="max-users"
            v-model.number="formData.maxUsers"
            type="number"
            min="1"
            class="plan-form__input"
            :class="{ 'plan-form__input--error': errors.maxUsers }"
            placeholder="10"
            required
          />
          <span v-if="errors.maxUsers" class="plan-form__error">{{ errors.maxUsers }}</span>
        </div>

        <div class="plan-form__field">
          <label class="plan-form__label" for="max-sites">
            Max Sites <span class="plan-form__required">*</span>
          </label>
          <input
            id="max-sites"
            v-model.number="formData.maxSites"
            type="number"
            min="1"
            class="plan-form__input"
            :class="{ 'plan-form__input--error': errors.maxSites }"
            placeholder="3"
            required
          />
          <span v-if="errors.maxSites" class="plan-form__error">{{ errors.maxSites }}</span>
        </div>
      </div>

      <!-- Trial Days -->
      <div class="plan-form__field">
        <label class="plan-form__label" for="trial-days">
          Trial Days
        </label>
        <input
          id="trial-days"
          v-model.number="formData.trialDays"
          type="number"
          min="0"
          class="plan-form__input"
          :class="{ 'plan-form__input--error': errors.trialDays }"
          placeholder="14"
        />
        <span v-if="errors.trialDays" class="plan-form__error">{{ errors.trialDays }}</span>
        <span class="plan-form__hint">Number of days for free trial period</span>
      </div>

      <!-- Features -->
      <div class="plan-form__field">
        <label class="plan-form__label">
          Features <span class="plan-form__required">*</span>
        </label>
        <div class="plan-form__features">
          <div
            v-for="(feature, index) in formData.features"
            :key="index"
            class="plan-form__feature-item"
          >
            <input
              v-model="formData.features[index]"
              type="text"
              class="plan-form__input"
              placeholder="Enter feature"
            />
            <button
              type="button"
              class="plan-form__remove-btn"
              @click="removeFeature(index)"
            >
              ×
            </button>
          </div>
        </div>
        <button
          type="button"
          class="plan-form__add-btn"
          @click="addFeature"
        >
          + Add Feature
        </button>
        <span v-if="errors.features" class="plan-form__error">{{ errors.features }}</span>
      </div>

      <!-- Is Active -->
      <div class="plan-form__field">
        <label class="plan-form__checkbox-label">
          <input
            v-model="formData.isActive"
            type="checkbox"
            class="plan-form__checkbox"
          />
          <span>Active (available for new subscriptions)</span>
        </label>
      </div>

      <!-- Actions -->
      <div class="plan-form__actions">
        <button
          type="button"
          class="plan-form__btn plan-form__btn--secondary"
          @click="$emit('cancel')"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="plan-form__btn plan-form__btn--primary"
          :disabled="loading"
        >
          {{ loading ? 'Saving...' : (isEdit ? 'Update Plan' : 'Create Plan') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Plan } from '~/stores/plan'

interface Props {
  plan?: Plan | null
  loading?: boolean
}

interface Emits {
  (e: 'submit', data: {
    name: string
    maxUsers: number
    maxSites: number
    price: number
    features: string[]
    trialDays: number
    isActive: boolean
  }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  plan: null,
  loading: false,
})

const emit = defineEmits<Emits>()

const isEdit = ref(!!props.plan)

const formData = ref({
  name: props.plan?.name || '',
  maxUsers: props.plan?.maxUsers || 1,
  maxSites: props.plan?.maxSites || 1,
  price: props.plan?.price || 0,
  features: props.plan?.features?.length ? [...props.plan.features] : [''],
  trialDays: props.plan?.trialDays ?? 14,
  isActive: props.plan?.isActive ?? true,
})

const errors = ref<Record<string, string>>({})

watch(
  () => props.plan,
  (newPlan) => {
    if (newPlan) {
      isEdit.value = true
      formData.value = {
        name: newPlan.name,
        maxUsers: newPlan.maxUsers,
        maxSites: newPlan.maxSites,
        price: newPlan.price,
        features: newPlan.features?.length ? [...newPlan.features] : [''],
        trialDays: newPlan.trialDays,
        isActive: newPlan.isActive,
      }
    }
  }
)

function addFeature(): void {
  formData.value.features.push('')
}

function removeFeature(index: number): void {
  if (formData.value.features.length > 1) {
    formData.value.features.splice(index, 1)
  }
}

function validateForm(): boolean {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = 'Plan name is required'
  }

  if (formData.value.price < 0) {
    errors.value.price = 'Price must be 0 or greater'
  }

  if (formData.value.maxUsers < 1) {
    errors.value.maxUsers = 'Max users must be at least 1'
  }

  if (formData.value.maxSites < 1) {
    errors.value.maxSites = 'Max sites must be at least 1'
  }

  if (formData.value.trialDays < 0) {
    errors.value.trialDays = 'Trial days must be 0 or greater'
  }

  const validFeatures = formData.value.features.filter(f => f.trim())
  if (validFeatures.length === 0) {
    errors.value.features = 'At least one feature is required'
  }

  return Object.keys(errors.value).length === 0
}

function handleSubmit(): void {
  if (!validateForm()) {
    return
  }

  const validFeatures = formData.value.features.filter(f => f.trim())

  emit('submit', {
    name: formData.value.name.trim(),
    maxUsers: formData.value.maxUsers,
    maxSites: formData.value.maxSites,
    price: formData.value.price,
    features: validFeatures,
    trialDays: formData.value.trialDays,
    isActive: formData.value.isActive,
  })
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.plan-form {
  background: white;
  border-radius: $radius-lg;
  padding: $spacing-xl;
}

.plan-form__field {
  margin-bottom: $spacing-lg;
}

.plan-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;
}

.plan-form__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.plan-form__required {
  color: $error-color;
}

.plan-form__input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 0.875rem;
  color: $text-primary;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }

  &::placeholder {
    color: $text-light;
  }
}

.plan-form__input--error {
  border-color: $error-color;

  &:focus {
    box-shadow: 0 0 0 3px rgba($error-color, 0.1);
  }
}

.plan-form__input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.plan-form__input-prefix {
  position: absolute;
  left: $spacing-md;
  font-size: 0.875rem;
  color: $text-secondary;
  font-weight: 500;
}

.plan-form__input--with-prefix {
  padding-left: calc($spacing-md + 1rem);
}

.plan-form__error {
  display: block;
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $error-color;
}

.plan-form__hint {
  display: block;
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $text-secondary;
}

.plan-form__features {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.plan-form__feature-item {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
}

.plan-form__remove-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $error-color;
  color: white;
  border: none;
  border-radius: $radius-sm;
  font-size: 1.25rem;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($error-color, 10%);
  }
}

.plan-form__add-btn {
  padding: $spacing-sm $spacing-md;
  background: transparent;
  border: 1px dashed $border-color;
  border-radius: $radius-md;
  color: $primary-color;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $bg-secondary;
    border-color: $primary-color;
  }
}

.plan-form__checkbox-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  font-size: 0.875rem;
  color: $text-primary;
}

.plan-form__checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.plan-form__actions {
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
  margin-top: $spacing-xl;
  padding-top: $spacing-xl;
  border-top: 1px solid $border-color;
}

.plan-form__btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.plan-form__btn--secondary {
  background: transparent;
  border: 1px solid $border-color;
  color: $text-secondary;

  &:hover:not(:disabled) {
    background: $bg-secondary;
    color: $text-primary;
  }
}

.plan-form__btn--primary {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .plan-form__row {
    grid-template-columns: 1fr;
  }

  .plan-form__actions {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}
</style>
