/**
 * Preload plugin for route-based component preloading
 * Preloads components when hovering over navigation links
 */

import { customPreloadRouteComponents } from '~/utils/lazy-components'

export default defineNuxtPlugin(() => {
  const router = useRouter()

  // Preload components on route change
  router.beforeEach((to) => {
    if (to.name && typeof to.name === 'string') {
      customPreloadRouteComponents(to.name)
    }
  })

  // Preload on link hover
  if (import.meta.client) {
    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement
      
      if (link && link.href) {
        const url = new URL(link.href)
        const path = url.pathname
        
        // Extract route name from path
        const routeName = path.split('/')[1]
        if (routeName) {
          preloadRouteComponents(routeName)
        }
      }
    }

    // Add hover listeners to navigation
    document.addEventListener('mouseover', handleLinkHover, { passive: true })

    // Cleanup on unmount
    onUnmounted(() => {
      document.removeEventListener('mouseover', handleLinkHover)
    })
  }
})
