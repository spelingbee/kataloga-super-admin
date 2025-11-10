/**
 * Virtual scrolling composable for large lists
 * Renders only visible items for better performance
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

interface VirtualScrollOptions {
  itemHeight: number // Height of each item in pixels
  buffer?: number // Number of items to render outside viewport
  containerHeight?: number // Container height (auto-detected if not provided)
}

export const useVirtualScroll = <T>(
  items: Ref<T[]>,
  options: VirtualScrollOptions
) => {
  const {
    itemHeight,
    buffer = 5,
    containerHeight: providedHeight,
  } = options

  const scrollTop = ref(0)
  const containerHeight = ref(providedHeight || 600)
  const containerRef = ref<HTMLElement | null>(null)

  // Calculate visible range
  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const visibleCount = Math.ceil(containerHeight.value / itemHeight)
    const end = start + visibleCount

    return {
      start: Math.max(0, start - buffer),
      end: Math.min(items.value.length, end + buffer),
    }
  })

  // Visible items
  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end).map((item, index) => ({
      item,
      index: start + index,
    }))
  })

  // Total height of all items
  const totalHeight = computed(() => items.value.length * itemHeight)

  // Offset for visible items
  const offsetY = computed(() => visibleRange.value.start * itemHeight)

  // Handle scroll event
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  // Update container height
  const updateContainerHeight = () => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight
    }
  }

  // Setup
  onMounted(() => {
    if (!providedHeight) {
      updateContainerHeight()
      window.addEventListener('resize', updateContainerHeight)
    }
  })

  // Cleanup
  onUnmounted(() => {
    if (!providedHeight) {
      window.removeEventListener('resize', updateContainerHeight)
    }
  })

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  }
}
