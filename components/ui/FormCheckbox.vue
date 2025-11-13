<template>
  <div class="form-checkbox">
    <div class="form-checkbox__wrapper">
      <input
        :id="checkboxId"
        v-model="checkboxValue"
        type="checkbox"
        :disabled="disabled"
        :required="required"
        :class="[
          'form-checkbox__field',
          {
            'form-checkbox__field--disabled': disabled,
          },
        ]"
        @change="handleChange"
      >
      <label :for="checkboxId" class="form-checkbox__label">
        {{ label }}
        <span v-if="required" class="form-checkbox__required">*</span>
      </label>
    </div>
    <p v-if="error" class="form-checkbox__error">{{ error }}</p>
    <p v-else-if="hint" class="form-checkbox__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue: boolean
  label: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const checkboxId = ref(`checkbox-${Math.random().toString(36).substr(2, 9)}`)

const checkboxValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function handleChange() {
  emit('change', checkboxValue.value)
}
</script>

<style scoped lang="scss">
@use './forms';
</style>
