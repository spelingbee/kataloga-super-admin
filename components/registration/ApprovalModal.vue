<template>
  <FormDialog
    v-model="isOpen"
    title="Approve Registration"
    submit-text="Approve"
    cancel-text="Cancel"
    :loading="loading"
    loading-text="Approving..."
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="approval-modal">
      <div class="approval-modal__info">
        <p class="approval-modal__message">
          Are you sure you want to approve <strong>{{ tenantName }}</strong>?
        </p>
        <p class="approval-modal__description">
          This will create a tenant account and send a welcome email to the owner.
        </p>
      </div>

      <FormTextarea
        v-model="notes"
        label="Approval Notes (Optional)"
        placeholder="Add any notes about this approval..."
        :rows="4"
      />
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FormDialog from '~/components/ui/Modal/FormDialog.vue'
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
  approve: [notes: string]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const notes = ref('')

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (value) {
    notes.value = ''
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function handleSubmit() {
  emit('approve', notes.value)
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.approval-modal__info {
  margin-bottom: $spacing-lg;
}

.approval-modal__message {
  font-size: 1rem;
  color: $text-primary;
  margin-bottom: $spacing-sm;

  strong {
    color: $primary-color;
  }
}

.approval-modal__description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin: 0;
}
</style>
