<template>
  <div class="form-datepicker">
    <label v-if="label" :for="inputId" class="form-datepicker__label">
      {{ label }}
      <span v-if="required" class="form-datepicker__required">*</span>
    </label>
    <div class="form-datepicker__wrapper">
      <input
        :id="inputId"
        v-model="dateValue"
        type="date"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :class="[
          'form-datepicker__field',
          {
            'form-datepicker__field--error': error,
            'form-datepicker__field--disabled': disabled,
          },
        ]"
        @change="handleChange"
      >
    </div>
    <p v-if="error" class="form-datepicker__error">{{ error }}</p>
    <p v-else-if="hint" class="form-datepicker__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue: string
  label?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  min?: string
  max?: string
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const inputId = ref(`datepicker-${Math.random().toString(36).substr(2, 9)}`)

const dateValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function handleChange() {
  emit('change', dateValue.value)
}
</script>

<style scoped lang="scss">
@use './forms';
</style>
