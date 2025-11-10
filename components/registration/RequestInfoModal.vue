<template>
  <FormDialog
    v-model="isOpen"
    title="Request Additional Information"
    submit-text="Send Request"
    cancel-text="Cancel"
    :loading="loading"
    loading-text="Sending..."
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="request-info-modal">
      <div class="request-info-modal__info">
        <p class="request-info-modal__message">
          Request additional information from <strong>{{ tenantName }}</strong>
        </p>
        <p class="request-info-modal__description">
          The applicant will receive an email with your request and can provide the needed information.
        </p>
      </div>

      <FormSelect
        v-model="selectedTemplate"
        label="Quick Templates (Optional)"
        :options="templates"
        @update:model-value="handleTemplateChange"
      />

      <FormTextarea
        v-model="message"
        label="Information Request Message"
        placeholder="Please describe what information you need..."
        :rows="6"
        required
      />

      <div class="request-info-modal__examples">
        <p class="request-info-modal__examples-title">Example requests:</p>
        <ul class="request-info-modal__examples-list">
          <li>Please provide a copy of your business license</li>
          <li>We need additional details about your business operations</li>
          <li>Please clarify your business address</li>
        </ul>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
  'request-info': [message: string]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const selectedTemplate = ref('')
const message = ref('')

const templates = [
  { value: '', label: 'Select a template...' },
  { 
    value: 'business_license', 
    label: 'Request Business License',
    text: 'Please provide a copy of your valid business license or registration certificate. This is required to verify your business legitimacy.'
  },
  { 
    value: 'tax_documents', 
    label: 'Request Tax Documents',
    text: 'Please provide your tax identification documents (Tax ID or EIN). This information is required for compliance purposes.'
  },
  { 
    value: 'address_verification', 
    label: 'Request Address Verification',
    text: 'Please provide proof of your business address (utility bill, lease agreement, or official correspondence). The address provided needs to be verified.'
  },
  { 
    value: 'business_details', 
    label: 'Request Business Details',
    text: 'Please provide more detailed information about your business operations, including the types of products/services you offer and your target market.'
  },
  { 
    value: 'owner_identification', 
    label: 'Request Owner Identification',
    text: 'Please provide a valid government-issued ID for the business owner. This is required for identity verification.'
  },
]

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (value) {
    selectedTemplate.value = ''
    message.value = ''
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function handleTemplateChange() {
  if (selectedTemplate.value) {
    const template = templates.find(t => t.value === selectedTemplate.value)
    if (template && 'text' in template) {
      message.value = template.text
    }
  }
}

function handleSubmit() {
  if (!message.value.trim()) {
    return
  }
  
  emit('request-info', message.value)
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.request-info-modal__info {
  margin-bottom: $spacing-lg;
}

.request-info-modal__message {
  font-size: 1rem;
  color: $text-primary;
  margin-bottom: $spacing-sm;

  strong {
    color: $info-color;
  }
}

.request-info-modal__description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin: 0;
}

.request-info-modal__examples {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.request-info-modal__examples-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-secondary;
  margin: 0 0 $spacing-sm 0;
}

.request-info-modal__examples-list {
  margin: 0;
  padding-left: $spacing-lg;
  font-size: 0.875rem;
  color: $text-secondary;

  li {
    margin-bottom: $spacing-xs;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
