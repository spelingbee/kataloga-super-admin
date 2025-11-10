<template>
  <div class="form-textarea">
    <label v-if="label" :for="textareaId" class="form-textarea__label">
      {{ label }}
      <span v-if="required" class="form-textarea__required">*</span>
    </label>
    <div class="form-textarea__wrapper">
      <textarea
        :id="textareaId"
        v-model="textareaValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :class="[
          'form-textarea__field',
          {
            'form-textarea__field--error': error,
            'form-textarea__field--disabled': disabled,
          },
        ]"
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </div>
    <p v-if="error" class="form-textarea__error">{{ error }}</p>
    <p v-else-if="hint" class="form-textarea__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  rows?: number
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  readonly: false,
  required: false,
  rows: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  focus: []
}>()

const textareaId = ref(`textarea-${Math.random().toString(36).substr(2, 9)}`)

const textareaValue = computed({
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
