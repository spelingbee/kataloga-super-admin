<template>
  <div class="card-skeleton">
    <LoadingSkeleton
      v-if="showHeader"
      type="text"
      width="60%"
      height="1.25rem"
      class="card-skeleton__title"
    />
    <LoadingSkeleton
      type="rect"
      :height="contentHeight"
      class="card-skeleton__content"
    />
    <div v-if="showFooter" class="card-skeleton__footer">
      <LoadingSkeleton type="text" width="40%" height="0.875rem" />
      <LoadingSkeleton type="text" width="30%" height="0.875rem" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showHeader?: boolean
  showFooter?: boolean
  contentHeight?: string
}

withDefaults(defineProps<Props>(), {
  showHeader: true,
  showFooter: false,
  contentHeight: '150px',
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.card-skeleton {
  background: $bg-primary;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  border: 1px solid $border-color;
}

.card-skeleton__title {
  margin-bottom: $spacing-md;
}

.card-skeleton__content {
  margin-bottom: $spacing-md;
}

.card-skeleton__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
}
</style>
