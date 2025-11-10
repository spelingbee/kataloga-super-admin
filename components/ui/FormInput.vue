<template>
  <div class="form-input">
    <label v-if="label" :for="inputId" class="form-input__label">
      {{ label }}
      <span v-if="required" class="form-input__required">*</span>
    </label>
    <div class="form-input__wrapper">
      <input
        :id="inputId"
        v-model="inputValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="[
          'form-input__field',
          {
            'form-input__field--error': error,
            'form-input__field--disabled': disabled,
          },
        ]"
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </div>
    <p v-if="error" class="form-input__error">{{ error }}</p>
    <p v-else-if="hint" class="form-input__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue: string | number
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: []
  focus: []
}>()

const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`)

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function handleBlur() {
  emit('blur')
}

function handleFocus() {
  emit('focus')
}
</script>

<style scoped lang="scss">
@use './forms';
</style>
