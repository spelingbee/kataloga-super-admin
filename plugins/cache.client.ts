/**
 * Cache plugin for global cache management
 * Provides cache utilities and automatic cleanup
 */

export default defineNuxtPlugin(() => {
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
    invalidatePattern('/api/admin/tenants')
  }, { deep: true })

  // Provide cache utilities globally
  return {
    provide: {
      cache: {
        clear: clearCache,
        invalidate: invalidatePattern,
      },
    },
  }
})
