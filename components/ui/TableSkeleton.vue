<template>
  <div class="table-skeleton">
    <div class="table-skeleton__header">
      <LoadingSkeleton
        v-for="i in columns"
        :key="`header-${i}`"
        type="text"
        width="100px"
        height="1rem"
      />
    </div>
    <div
      v-for="row in rows"
      :key="`row-${row}`"
      class="table-skeleton__row"
    >
      <LoadingSkeleton
        v-for="col in columns"
        :key="`cell-${row}-${col}`"
        type="text"
        :width="getColumnWidth(col)"
        height="0.875rem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 4,
})

const getColumnWidth = (col: number): string => {
  // Vary column widths for more realistic skeleton
  const widths = ['120px', '180px', '150px', '100px', '200px']
  return widths[(col - 1) % widths.length]
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.table-skeleton {
  width: 100%;
  background: $bg-primary;
  border-radius: $radius-lg;
  padding: $spacing-lg;
}

.table-skeleton__header {
  display: flex;
  gap: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
  margin-bottom: $spacing-md;
}

.table-skeleton__row {
  display: flex;
  gap: $spacing-lg;
  padding: $spacing-md 0;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
}
</style>
