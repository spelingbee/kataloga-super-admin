<template>
  <div class="form-radio">
    <label v-if="groupLabel" class="form-radio__group-label">
      {{ groupLabel }}
      <span v-if="required" class="form-radio__required">*</span>
    </label>
    <div class="form-radio__options">
      <div
        v-for="option in options"
        :key="getOptionValue(option)"
        class="form-radio__option"
      >
        <input
          :id="`${radioId}-${getOptionValue(option)}`"
          v-model="radioValue"
          type="radio"
          :value="getOptionValue(option)"
          :disabled="disabled"
          :required="required"
          :class="[
            'form-radio__field',
            {
              'form-radio__field--disabled': disabled,
            },
          ]"
          @change="handleChange"
        >
        <label
          :for="`${radioId}-${getOptionValue(option)}`"
          class="form-radio__label"
        >
          {{ getOptionLabel(option) }}
        </label>
      </div>
    </div>
    <p v-if="error" class="form-radio__error">{{ error }}</p>
    <p v-else-if="hint" class="form-radio__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue: string | number
  options: any[]
  groupLabel?: string
  optionLabel?: string
  optionValue?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  optionLabel: 'label',
  optionValue: 'value',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const radioId = ref(`radio-${Math.random().toString(36).substr(2, 9)}`)

const radioValue = computed({
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
  emit('change', radioValue.value)
}
</script>

<style scoped lang="scss">
@use './forms';
</style>
