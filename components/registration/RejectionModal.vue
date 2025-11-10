<template>
  <FormDialog
    v-model="isOpen"
    title="Reject Registration"
    submit-text="Reject"
    cancel-text="Cancel"
    :loading="loading"
    loading-text="Rejecting..."
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="rejection-modal">
      <div class="rejection-modal__warning">
        <span class="rejection-modal__warning-icon">⚠</span>
        <div>
          <p class="rejection-modal__message">
            You are about to reject <strong>{{ tenantName }}</strong>
          </p>
          <p class="rejection-modal__description">
            The applicant will receive an email with the rejection reason.
          </p>
        </div>
      </div>

      <FormSelect
        v-model="selectedReason"
        label="Rejection Reason"
        :options="predefinedReasons"
        required
        @update:model-value="handleReasonChange"
      />

      <FormTextarea
        v-model="customReason"
        :label="selectedReason === 'other' ? 'Custom Reason (Required)' : 'Additional Details (Optional)'"
        :placeholder="selectedReason === 'other' ? 'Please provide a detailed reason...' : 'Add any additional details...'"
        :rows="4"
        :required="selectedReason === 'other'"
      />
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '~/components/ui/Modal/FormDialog.vue'
import FormSelect from '~/components/ui/FormSelect.vue'
import FormTextarea from '~/components/ui/FormTextarea.vue'

interface Props {
  modelValue: boolean
  tenantName: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reject: [reason: string]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const selectedReason = ref('')
const customReason = ref('')

const predefinedReasons = [
  { value: '', label: 'Select a reason...' },
  { value: 'incomplete_information', label: 'Incomplete Information' },
  { value: 'invalid_documents', label: 'Invalid or Missing Documents' },
  { value: 'business_type_not_supported', label: 'Business Type Not Supported' },
  { value: 'duplicate_registration', label: 'Duplicate Registration' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'does_not_meet_requirements', label: 'Does Not Meet Requirements' },
  { value: 'other', label: 'Other (Specify Below)' },
]

const finalReason = computed(() => {
  if (selectedReason.value === 'other') {
    return customReason.value
  }
  
  const reason = predefinedReasons.find(r => r.value === selectedReason.value)?.label || ''
  return customReason.value ? `${reason}\n\n${customReason.value}` : reason
})

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (value) {
    selectedReason.value = ''
    customReason.value = ''
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function handleReasonChange() {
  if (selectedReason.value !== 'other') {
    customReason.value = ''
  }
}

function handleSubmit() {
  if (!selectedReason.value) {
    return
  }
  
  if (selectedReason.value === 'other' && !customReason.value.trim()) {
    return
  }
  
  emit('reject', finalReason.value)
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.rejection-modal__warning {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: lighten($error-color, 45%);
  border: 1px solid lighten($error-color, 30%);
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
}

.rejection-modal__warning-icon {
  font-size: 1.5rem;
  color: $error-color;
  flex-shrink: 0;
}

.rejection-modal__message {
  font-size: 1rem;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;

  strong {
    color: $error-color;
  }
}

.rejection-modal__description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin: 0;
}
</style>
