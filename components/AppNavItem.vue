<template>
  <NuxtLink
    :to="item.path"
    :class="[
      'nav-item',
      { 'nav-item--active': isActive }
    ]"
    :aria-current="isActive ? 'page' : undefined"
    @click="$emit('click')"
  >
    <span class="nav-item__icon" aria-hidden="true">
      <AppIcon :name="item.icon" />
    </span>
    <span class="nav-item__label">{{ item.name }}</span>
    <span 
      v-if="item.badge" 
      class="nav-item__badge"
      :aria-label="`${item.badge} pending items`"
    >
      {{ item.badge }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
interface NavigationItem {
  name: string
  path: string
  icon: string
  badge?: number
}

interface Props {
  item: NavigationItem
}

const props = defineProps<Props>()

defineEmits<{
  click: []
}>()

const route = useRoute()

const isActive = computed(() => {
  if (props.item.path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(props.item.path)
})
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.nav-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  color: $text-secondary;
  text-decoration: none;
  transition: all $transition-fast;
  
  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
  
  &:focus-visible {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
  }
}

.nav-item--active {
  background: $primary-color;
  color: white;
  
  &:hover {
    background: darken($primary-color, 5%);
    color: white;
  }
}

.nav-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.nav-item__label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.nav-item__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 $spacing-xs;
  background: $error-color;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 10px;
}

.nav-item--active .nav-item__badge {
  background: rgba(255, 255, 255, 0.3);
}
</style>
