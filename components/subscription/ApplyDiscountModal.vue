<template>
  <FormDialog
    v-model="isOpen"
    title="Apply Discount"
    submit-text="Apply Discount"
    cancel-text="Cancel"
    :loading="loading"
    loading-text="Applying discount..."
    size="lg"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="apply-discount-modal">
      <div class="apply-discount-modal__info">
        <p class="apply-discount-modal__current">
          Current Plan: <strong>{{ planName }}</strong> - {{ formatCurrency(planPrice) }}/{{ billingCycle === 'monthly' ? 'month' : 'year' }}
        </p>
      </div>

      <div class="apply-discount-modal__form">
        <FormRadio
          v-model="discountType"
          group-label="Discount Type"
          :options="[
            { label: 'Percentage Discount', value: 'percentage' },
            { label: 'Fixed Amount Discount', value: 'fixed' }
          ]"
        />

        <FormInput
          v-model="discountValue"
          :label="discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'"
          type="number"
          :min="0"
          :max="discountType === 'percentage' ? 100 : planPrice"
          :step="discountType === 'percentage' ? 1 : 0.01"
          :placeholder="discountType === 'percentage' ? 'e.g., 20' : 'e.g., 10.00'"
          required
          :error="discountValueError"
        >
          <template #suffix>
            {{ discountType === 'percentage' ? '%' : '$' }}
          </template>
        </FormInput>

        <FormInput
          v-model="durationMonths"
          label="Duration (Months)"
          type="number"
          :min="1"
          :max="24"
          placeholder="e.g., 3"
          help-text="Leave empty for permanent discount"
          :error="durationError"
        />

        <FormTextarea
          v-model="reason"
          label="Reason for Discount (Optional)"
          placeholder="Enter the reason for applying this discount (for audit purposes)..."
          :rows="3"
        />
      </div>

      <div v-if="discountValue" class="apply-discount-modal__preview">
        <div class="discount-preview">
          <h4 class="discount-preview__title">Discount Preview</h4>
          
          <div class="discount-preview__row">
            <span class="discount-preview__label">Original Price:</span>
            <span class="discount-preview__value">{{ formatCurrency(planPrice) }}</span>
          </div>
          
          <div class="discount-preview__row">
            <span class="discount-preview__label">Discount:</span>
            <span class="discount-preview__value discount-preview__value--discount">
              -{{ formatCurrency(discountAmount) }}
              <span class="discount-preview__percentage">
                ({{ discountType === 'percentage' ? discountValue + '%' : Math.round((discountAmount / planPrice) * 100) + '%' }})
              </span>
            </span>
          </div>
          
          <div class="discount-preview__row discount-preview__row--total">
            <span class="discount-preview__label">New Price:</span>
            <span class="discount-preview__value discount-preview__value--highlight">
              {{ formatCurrency(newPrice) }}
            </span>
          </div>
          
          <div class="discount-preview__row">
            <span class="discount-preview__label">Savings per {{ billingCycle === 'monthly' ? 'month' : 'year' }}:</span>
            <span class="discount-preview__value discount-preview__value--success">
              {{ formatCurrency(discountAmount) }}
            </span>
          </div>
          
          <div v-if="durationMonths" class="discount-preview__row">
            <span class="discount-preview__label">Total Savings ({{ durationMonths }} months):</span>
            <span class="discount-preview__value discount-preview__value--success">
              {{ formatCurrency(totalSavings) }}
            </span>
          </div>
          
          <div class="discount-preview__duration">
            <strong>Duration:</strong> 
            {{ durationMonths ? `${durationMonths} month${parseInt(durationMonths) > 1 ? 's' : ''}` : 'Permanent' }}
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '~/components/ui/Modal/FormDialog.vue'
import FormInput from '~/components/ui/FormInput.vue'
import FormRadio from '~/components/ui/FormRadio.vue'
import FormTextarea from '~/components/ui/FormTextarea.vue'

interface Props {
  modelValue: boolean
  planName: string
  planPrice: number
  billingCycle: 'monthly' | 'yearly'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply-discount': [data: {
    type: 'percentage' | 'fixed'
    value: number
    durationMonths?: number
    reason?: string
  }]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const discountType = ref<'percentage' | 'fixed'>('percentage')
const discountValue = ref('')
const durationMonths = ref('')
const reason = ref('')
const discountValueError = ref('')
const durationError = ref('')

const discountAmount = computed(() => {
  const value = parseFloat(discountValue.value)
  if (isNaN(value) || value <= 0) return 0
  
  if (discountType.value === 'percentage') {
    return (props.planPrice * value) / 100
  } else {
    return Math.min(value, props.planPrice)
  }
})

const newPrice = computed(() => {
  return Math.max(0, props.planPrice - discountAmount.value)
})

const totalSavings = computed(() => {
  if (!durationMonths.value) return 0
  
  const months = parseInt(durationMonths.value)
  if (isNaN(months) || months <= 0) return 0
  
  // Calculate based on billing cycle
  if (props.billingCycle === 'monthly') {
    return discountAmount.value * months
  } else {
    // For yearly, calculate monthly equivalent
    const monthlyDiscount = discountAmount.value / 12
    return monthlyDiscount * months
  }
})

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (value) {
    discountType.value = 'percentage'
    discountValue.value = ''
    durationMonths.value = ''
    reason.value = ''
    discountValueError.value = ''
    durationError.value = ''
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function validateForm(): boolean {
  let isValid = true
  
  discountValueError.value = ''
  durationError.value = ''
  
  const value = parseFloat(discountValue.value)
  
  if (!discountValue.value || isNaN(value) || value <= 0) {
    discountValueError.value = 'Please enter a valid discount value'
    isValid = false
  } else if (discountType.value === 'percentage' && value > 100) {
    discountValueError.value = 'Percentage cannot exceed 100%'
    isValid = false
  } else if (discountType.value === 'fixed' && value > props.planPrice) {
    discountValueError.value = 'Discount amount cannot exceed plan price'
    isValid = false
  }
  
  if (durationMonths.value) {
    const duration = parseInt(durationMonths.value)
    if (isNaN(duration) || duration < 1) {
      durationError.value = 'Duration must be at least 1 month'
      isValid = false
    } else if (duration > 24) {
      durationError.value = 'Duration cannot exceed 24 months'
      isValid = false
    }
  }
  
  return isValid
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }
  
  const data: any = {
    type: discountType.value,
    value: parseFloat(discountValue.value),
  }
  
  if (durationMonths.value) {
    data.durationMonths = parseInt(durationMonths.value)
  }
  
  if (reason.value.trim()) {
    data.reason = reason.value.trim()
  }
  
  emit('apply-discount', data)
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.apply-discount-modal__info {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.apply-discount-modal__current {
  margin: 0;
  font-size: 0.875rem;
  color: $text-secondary;

  strong {
    color: $text-primary;
    font-weight: 600;
  }
}

.apply-discount-modal__form {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.apply-discount-modal__preview {
  margin-top: $spacing-lg;
}

.discount-preview {
  padding: $spacing-lg;
  background: lighten($success-color, 45%);
  border: 1px solid lighten($success-color, 30%);
  border-radius: $radius-md;
}

.discount-preview__title {
  margin: 0 0 $spacing-md 0;
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
}

.discount-preview__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1px solid lighten($success-color, 35%);

  &:last-of-type {
    border-bottom: none;
  }
}

.discount-preview__row--total {
  margin-top: $spacing-sm;
  padding-top: $spacing-md;
  border-top: 2px solid lighten($success-color, 30%);
  font-size: 1.125rem;
}

.discount-preview__label {
  color: $text-secondary;
  font-size: 0.875rem;
}

.discount-preview__value {
  color: $text-primary;
  font-weight: 500;
  font-size: 0.875rem;
}

.discount-preview__value--discount {
  color: $error-color;
}

.discount-preview__value--highlight {
  color: $primary-color;
  font-weight: 700;
  font-size: 1.25rem;
}

.discount-preview__value--success {
  color: $success-color;
  font-weight: 600;
}

.discount-preview__percentage {
  font-size: 0.75rem;
  color: $text-secondary;
  margin-left: $spacing-xs;
}

.discount-preview__duration {
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid lighten($success-color, 35%);
  font-size: 0.875rem;
  color: $text-secondary;

  strong {
    color: $text-primary;
  }
}
</style>
