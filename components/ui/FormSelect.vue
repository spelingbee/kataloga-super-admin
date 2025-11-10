<template>
  <div class="form-select">
    <label v-if="label" :for="selectId" class="form-select__label">
      {{ label }}
      <span v-if="required" class="form-select__required">*</span>
    </label>
    <div class="form-select__wrapper">
      <select
        :id="selectId"
        v-model="selectValue"
        :disabled="disabled"
        :required="required"
        :class="[
          'form-select__field',
          {
            'form-select__field--error': error,
            'form-select__field--disabled': disabled,
          },
        ]"
        @change="handleChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
    </div>
    <p v-if="error" class="form-select__error">{{ error }}</p>
    <p v-else-if="hint" class="form-select__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue: string | number
  label?: string
  options: any[]
  optionLabel?: string
  optionValue?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  optionLabel: 'label',
  optionValue: 'value',
  placeholder: 'Select an option',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const selectId = ref(`select-${Math.random().toString(36).substr(2, 9)}`)

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function getOptionValue(option: any): string | number {
  return typeof option === 'object' ? option[props.optionValue] : option
}

function getOptionLabel(option: any): string {
  return typeof option === 'object' ? option[props.optionLabel] : String(option)
}

function handleChange() {
  emit('change', selectValue.value)
}
</script>

<style scoped lang="scss">
@use './forms';
</style>
