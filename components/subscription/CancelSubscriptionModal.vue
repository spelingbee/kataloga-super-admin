<template>
  <FormDialog
    v-model="isOpen"
    title="Cancel Subscription"
    submit-text="Cancel Subscription"
    cancel-text="Keep Subscription"
    :loading="loading"
    loading-text="Cancelling..."
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="cancel-subscription-modal">
      <div class="cancel-subscription-modal__warning">
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
          <h4 class="warning-content__title">Are you sure you want to cancel this subscription?</h4>
          <p class="warning-content__message">
            This action will cancel the subscription for <strong>{{ tenantName }}</strong>.
          </p>
        </div>
      </div>

      <div class="cancel-subscription-modal__info">
        <div class="info-card">
          <h4 class="info-card__title">Cancellation Details</h4>
          
          <div class="info-card__row">
            <span class="info-card__label">Current Plan:</span>
            <span class="info-card__value">{{ planName }}</span>
          </div>
          
          <div class="info-card__row">
            <span class="info-card__label">Current Period End:</span>
            <span class="info-card__value">{{ formatDate(currentPeriodEnd) }}</span>
          </div>
          
          <div class="info-card__row info-card__row--highlight">
            <span class="info-card__label">Access End Date:</span>
            <span class="info-card__value">{{ formatDate(currentPeriodEnd) }}</span>
          </div>
          
          <div class="info-card__note">
            <strong>Note:</strong> The tenant will retain access until the end of the current billing period ({{ formatDate(currentPeriodEnd) }}). 
            After this date, their account will be downgraded and they will lose access to premium features.
          </div>
        </div>
      </div>

      <FormSelect
        v-model="cancellationReason"
        label="Cancellation Reason"
        placeholder="Select a reason..."
        :options="[
          { label: 'Customer Request', value: 'customer_request' },
          { label: 'Payment Failed', value: 'payment_failed' },
          { label: 'Policy Violation', value: 'policy_violation' },
          { label: 'Business Closure', value: 'business_closure' },
          { label: 'Switching to Different Plan', value: 'switching_plan' },
          { label: 'Service Issues', value: 'service_issues' },
          { label: 'Other', value: 'other' }
        ]"
        required
        :error="reasonError"
      />

      <FormTextarea
        v-if="cancellationReason === 'other' || additionalNotes"
        v-model="additionalNotes"
        label="Additional Notes"
        placeholder="Provide additional details about the cancellation..."
        :rows="4"
        :required="cancellationReason === 'other'"
        :error="notesError"
      />

      <div class="cancel-subscription-modal__confirmation">
        <FormCheckbox
          v-model="confirmed"
          :label="`I understand that ${tenantName} will lose access after ${formatDate(currentPeriodEnd)}`"
        />
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '~/components/ui/Modal/FormDialog.vue'
import FormSelect from '~/components/ui/FormSelect.vue'
import FormTextarea from '~/components/ui/FormTextarea.vue'
import FormCheckbox from '~/components/ui/FormCheckbox.vue'
import { formatDate } from '~/utils/date'

interface Props {
  modelValue: boolean
  tenantName: string
  planName: string
  currentPeriodEnd: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'cancel-subscription': [data: { reason: string; notes?: string }]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const cancellationReason = ref('')
const additionalNotes = ref('')
const confirmed = ref(false)
const reasonError = ref('')
const notesError = ref('')

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (value) {
    cancellationReason.value = ''
    additionalNotes.value = ''
    confirmed.value = false
    reasonError.value = ''
    notesError.value = ''
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function validateForm(): boolean {
  let isValid = true
  
  reasonError.value = ''
  notesError.value = ''
  
  if (!cancellationReason.value) {
    reasonError.value = 'Please select a cancellation reason'
    isValid = false
  }
  
  if (cancellationReason.value === 'other' && !additionalNotes.value.trim()) {
    notesError.value = 'Please provide additional details'
    isValid = false
  }
  
  if (!confirmed.value) {
    isValid = false
  }
  
  return isValid
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }
  
  const data: any = {
    reason: cancellationReason.value,
  }
  
  if (additionalNotes.value.trim()) {
    data.notes = additionalNotes.value.trim()
  }
  
  emit('cancel-subscription', data)
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.cancel-subscription-modal__warning {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: lighten($error-color, 45%);
  border: 2px solid lighten($error-color, 30%);
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
}

.warning-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.warning-content__title {
  margin: 0 0 $spacing-xs 0;
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
}

.warning-content__message {
  margin: 0;
  font-size: 0.875rem;
  color: $text-secondary;

  strong {
    color: $text-primary;
    font-weight: 600;
  }
}

.cancel-subscription-modal__info {
  margin-bottom: $spacing-lg;
}

.info-card {
  padding: $spacing-lg;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.info-card__title {
  margin: 0 0 $spacing-md 0;
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
}

.info-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-color;

  &:last-of-type {
    border-bottom: none;
    margin-bottom: $spacing-md;
  }
}

.info-card__row--highlight {
  background: lighten($warning-color, 45%);
  padding: $spacing-sm $spacing-md;
  margin: $spacing-sm (-$spacing-md) $spacing-md;
  border-radius: $radius-sm;
  border: 1px solid lighten($warning-color, 30%);
}

.info-card__label {
  color: $text-secondary;
  font-size: 0.875rem;
}

.info-card__value {
  color: $text-primary;
  font-weight: 500;
  font-size: 0.875rem;
}

.info-card__note {
  padding: $spacing-md;
  background: lighten($info-color, 45%);
  border: 1px solid lighten($info-color, 30%);
  border-radius: $radius-sm;
  font-size: 0.75rem;
  color: $text-secondary;
  line-height: 1.5;

  strong {
    color: $text-primary;
  }
}

.cancel-subscription-modal__confirmation {
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background: lighten($warning-color, 45%);
  border: 1px solid lighten($warning-color, 30%);
  border-radius: $radius-md;
}

@media (max-width: $breakpoint-md) {
  .cancel-subscription-modal__warning {
    flex-direction: column;
    text-align: center;
  }

  .info-card__row {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
  }
}
</style>
