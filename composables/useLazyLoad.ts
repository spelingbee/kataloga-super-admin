/**
 * Lazy loading composable for components and images
 * Provides utilities for deferred loading of resources
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number
}

/**
 * Lazy load images using Intersection Observer
 */
export const useLazyImage = (
  imageRef: Ref<HTMLImageElement | null>,
  options: LazyLoadOptions = {}
) => {
  const { rootMargin = '50px', threshold = 0.01 } = options
  const isLoaded = ref(false)
  const isInView = ref(false)

  let observer: IntersectionObserver | null = null

  const load = () => {
    if (!imageRef.value || isLoaded.value) return

    const img = imageRef.value
    const src = img.dataset.src

    if (src) {
      img.src = src
      img.removeAttribute('data-src')
      isLoaded.value = true
    }
  }

  onMounted(() => {
    if (!imageRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isInView.value = true
            load()
            observer?.unobserve(entry.target)
          }
        })
      },
      { rootMargin, threshold }
    )

    observer.observe(imageRef.value)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    isLoaded,
    isInView,
    load,
  }
}

/**
 * Lazy load component when it enters viewport
 */
export const useLazyComponent = (
  elementRef: Ref<HTMLElement | null>,
  options: LazyLoadOptions = {}
) => {
  const { rootMargin = '100px', threshold = 0.01 } = options
  const shouldLoad = ref(false)

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            shouldLoad.value = true
            observer?.unobserve(entry.target)
          }
        })
      },
      { rootMargin, threshold }
    )

    observer.observe(elementRef.value)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    shouldLoad,
  }
}

/**
 * Preload route data
 */
export const useRoutePreload = () => {
  const router = useRouter()

  const preloadRoute = async (routeName: string) => {
    // Prefetch route component
    const route = router.resolve({ name: routeName })
    if (route) {
      // Nuxt will handle component preloading
      router.push(route)
    }
  }

  return {
    preloadRoute,
  }
}

/**
 * Defer execution until idle
 */
export const useIdleCallback = () => {
  const defer = (callback: () => void, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout })
    } else {
      setTimeout(callback, 1)
    }
  }

  return {
    defer,
  }
}

/**
 * Progressive image loading with blur effect
 */
export const useProgressiveImage = (
  lowQualitySrc: string,
  highQualitySrc: string
) => {
  const currentSrc = ref(lowQualitySrc)
  const isLoaded = ref(false)

  const loadHighQuality = () => {
    const img = new Image()
    img.src = highQualitySrc
    img.onload = () => {
      currentSrc.value = highQualitySrc
      isLoaded.value = true
    }
  }

  onMounted(() => {
    loadHighQuality()
  })

  return {
    currentSrc,
    isLoaded,
  }
}
