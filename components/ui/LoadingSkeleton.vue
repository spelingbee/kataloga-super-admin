<template>
  <div :class="['loading-skeleton', `loading-skeleton--${variant}`]">
    <div
      v-for="i in count"
      :key="i"
      :class="['loading-skeleton__item', `loading-skeleton__item--${type}`]"
      :style="itemStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'text' | 'circle' | 'rect' | 'card'
  count?: number
  width?: string
  height?: string
  variant?: 'default' | 'wave'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  count: 1,
  width: '100%',
  height: '1rem',
  variant: 'wave',
})

const itemStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.loading-skeleton__item {
  background: linear-gradient(
    90deg,
    $bg-secondary 0%,
    lighten($bg-secondary, 2%) 50%,
    $bg-secondary 100%
  );
  border-radius: $radius-sm;
  overflow: hidden;
  position: relative;
}

.loading-skeleton__item--text {
  height: 1rem;
  border-radius: $radius-sm;
}

.loading-skeleton__item--circle {
  border-radius: 50%;
  aspect-ratio: 1;
}

.loading-skeleton__item--rect {
  border-radius: $radius-md;
}

.loading-skeleton__item--card {
  height: 200px;
  border-radius: $radius-lg;
}

.loading-skeleton--wave {
  .loading-skeleton__item::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: skeleton-wave 1.5s infinite;
  }
}

@keyframes skeleton-wave {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
