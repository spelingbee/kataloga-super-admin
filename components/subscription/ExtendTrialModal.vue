<template>
  <FormDialog
    v-model="isOpen"
    title="Extend Trial Period"
    submit-text="Extend Trial"
    cancel-text="Cancel"
    :loading="loading"
    loading-text="Extending trial..."
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="extend-trial-modal">
      <div class="extend-trial-modal__info">
        <p class="extend-trial-modal__current">
          Current Trial End Date: <strong>{{ formatDate(currentTrialEndDate) }}</strong>
        </p>
        <p class="extend-trial-modal__description">
          Extend the trial period for this tenant. They will receive a notification about the extension.
        </p>
      </div>

      <FormDatePicker
        v-model="newTrialEndDate"
        label="New Trial End Date"
        :min="minDate"
        required
        :error="dateError"
      />

      <FormTextarea
        v-model="reason"
        label="Reason for Extension"
        placeholder="Enter the reason for extending the trial period (for audit purposes)..."
        :rows="4"
        required
        :error="reasonError"
      />

      <div class="extend-trial-modal__summary">
        <div class="summary-card">
          <h4 class="summary-card__title">Extension Summary</h4>
          <div class="summary-card__row">
            <span class="summary-card__label">Current Trial End:</span>
            <span class="summary-card__value">{{ formatDate(currentTrialEndDate) }}</span>
          </div>
          <div class="summary-card__row">
            <span class="summary-card__label">New Trial End:</span>
            <span class="summary-card__value summary-card__value--highlight">
              {{ newTrialEndDate ? formatDate(newTrialEndDate) : 'Not set' }}
            </span>
          </div>
          <div class="summary-card__row">
            <span class="summary-card__label">Additional Days:</span>
            <span class="summary-card__value summary-card__value--highlight">
              {{ additionalDays }} days
            </span>
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '~/components/ui/Modal/FormDialog.vue'
import FormDatePicker from '~/components/ui/FormDatePicker.vue'
import FormTextarea from '~/components/ui/FormTextarea.vue'
import { formatDate } from '~/utils/date'

interface Props {
  modelValue: boolean
  currentTrialEndDate: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'extend-trial': [data: { newTrialEndDate: string; reason: string }]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const newTrialEndDate = ref('')
const reason = ref('')
const dateError = ref('')
const reasonError = ref('')

const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const additionalDays = computed(() => {
  if (!newTrialEndDate.value) return 0
  
  const current = new Date(props.currentTrialEndDate)
  const newDate = new Date(newTrialEndDate.value)
  const diff = newDate.getTime() - current.getTime()
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (value) {
    newTrialEndDate.value = ''
    reason.value = ''
    dateError.value = ''
    reasonError.value = ''
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function validateForm(): boolean {
  let isValid = true
  
  dateError.value = ''
  reasonError.value = ''
  
  if (!newTrialEndDate.value) {
    dateError.value = 'Please select a new trial end date'
    isValid = false
  } else {
    const current = new Date(props.currentTrialEndDate)
    const newDate = new Date(newTrialEndDate.value)
    
    if (newDate <= current) {
      dateError.value = 'New trial end date must be after the current trial end date'
      isValid = false
    }
  }
  
  if (!reason.value.trim()) {
    reasonError.value = 'Please provide a reason for the extension'
    isValid = false
  }
  
  return isValid
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }
  
  emit('extend-trial', {
    newTrialEndDate: newTrialEndDate.value,
    reason: reason.value.trim(),
  })
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.extend-trial-modal__info {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.extend-trial-modal__current {
  margin: 0 0 $spacing-sm 0;
  font-size: 0.875rem;
  color: $text-secondary;

  strong {
    color: $text-primary;
    font-weight: 600;
  }
}

.extend-trial-modal__description {
  margin: 0;
  font-size: 0.875rem;
  color: $text-secondary;
}

.extend-trial-modal__summary {
  margin-top: $spacing-lg;
}

.summary-card {
  padding: $spacing-lg;
  background: lighten($info-color, 45%);
  border: 1px solid lighten($info-color, 30%);
  border-radius: $radius-md;
}

.summary-card__title {
  margin: 0 0 $spacing-md 0;
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
}

.summary-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1px solid lighten($info-color, 35%);

  &:last-child {
    border-bottom: none;
  }
}

.summary-card__label {
  color: $text-secondary;
  font-size: 0.875rem;
}

.summary-card__value {
  color: $text-primary;
  font-weight: 500;
  font-size: 0.875rem;
}

.summary-card__value--highlight {
  color: $primary-color;
  font-weight: 600;
}
</style>
