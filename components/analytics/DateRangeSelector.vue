<template>
  <div class="date-range-selector">
    <div class="date-range-selector__presets">
      <button
        v-for="preset in presets"
        :key="preset.value"
        :class="['date-range-selector__preset-btn', { 'is-active': activePreset === preset.value }]"
        @click="selectPreset(preset.value)"
      >
        {{ preset.label }}
      </button>
    </div>

    <div class="date-range-selector__custom">
      <div class="date-range-selector__input-group">
        <label class="date-range-selector__label">From</label>
        <input
          v-model="localFrom"
          type="date"
          class="date-range-selector__input"
          :max="localTo"
          @change="onDateChange"
        >
      </div>

      <div class="date-range-selector__input-group">
        <label class="date-range-selector__label">To</label>
        <input
          v-model="localTo"
          type="date"
          class="date-range-selector__input"
          :min="localFrom"
          :max="today"
          @change="onDateChange"
        >
      </div>

      <button class="date-range-selector__apply-btn" @click="applyDateRange">
        Apply
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DateRange } from '~/types'

interface Props {
  modelValue: DateRange
}

interface Emits {
  (e: 'update:modelValue', value: DateRange): void
  (e: 'change', value: DateRange): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFrom = ref(props.modelValue.from)
const localTo = ref(props.modelValue.to)
const activePreset = ref<string | null>(null)

const today = computed(() => new Date().toISOString().split('T')[0])

const presets = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This year', value: 'year' },
  { label: 'All time', value: 'all' },
]

const selectPreset = (preset: string) => {
  activePreset.value = preset
  const now = new Date()
  let from: Date

  switch (preset) {
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      from = new Date(now.getFullYear(), 0, 1)
      break
    case 'all':
      from = new Date(2020, 0, 1) // Platform start date
      break
    default:
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  localFrom.value = from.toISOString().split('T')[0]
  localTo.value = now.toISOString().split('T')[0]

  applyDateRange()
}

const onDateChange = () => {
  activePreset.value = null
}

const applyDateRange = () => {
  const dateRange: DateRange = {
    from: localFrom.value,
    to: localTo.value,
  }
  emit('update:modelValue', dateRange)
  emit('change', dateRange)
}

watch(
  () => props.modelValue,
  (newValue) => {
    localFrom.value = newValue.from
    localTo.value = newValue.to
  }
)
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.date-range-selector {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.date-range-selector__presets {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.date-range-selector__preset-btn {
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($bg-secondary, 3%);
    border-color: $primary-color;
  }

  &.is-active {
    background: $primary-color;
    color: white;
    border-color: $primary-color;
  }
}

.date-range-selector__custom {
  display: flex;
  gap: $spacing-md;
  align-items: flex-end;
  flex-wrap: wrap;
}

.date-range-selector__input-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  flex: 1;
  min-width: 150px;
}

.date-range-selector__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-secondary;
}

.date-range-selector__input {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  color: $text-primary;
  transition: $transition-base;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }
}

.date-range-selector__apply-btn {
  padding: $spacing-sm $spacing-lg;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: darken($primary-color, 10%);
  }
}

@media (max-width: $breakpoint-md) {
  .date-range-selector__custom {
    flex-direction: column;
    align-items: stretch;
  }

  .date-range-selector__apply-btn {
    width: 100%;
  }
}
</style>
