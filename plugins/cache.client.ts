/**
 * Cache plugin for global cache management
 * Provides cache utilities and automatic cleanup
 */

import { CacheManager } from '~/utils/cache-manager'

export default defineNuxtPlugin(() => {
  // Initialize CacheManager singleton in the plugin context
  // This ensures it only runs after Nuxt is initialized
  const cacheManager = new CacheManager()
  
  // Start cleanup interval on client
  if (import.meta.client) {
    cacheManager.start()
  }

  const { clearCache, invalidatePattern } = useCache()

  // Clear cache on logout
  const authStore = useAuthStore()
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (!isAuth) {
      clearCache()
    }
  })

  // Invalidate tenant-related cache when tenant data changes
  const tenantStore = useTenantStore()
  watch(() => tenantStore.tenants, () => {
    invalidatePattern('/admin/tenants')
  }, { deep: true })

  // Provide cache utilities globally
  return {
    provide: {
      cacheManager, // Provide the raw manager
      cache: {      // Provide the utilities
        clear: clearCache,
        invalidate: invalidatePattern,
      },
    },
  }
})
