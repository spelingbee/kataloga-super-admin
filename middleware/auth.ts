export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // Skip on server
  if (import.meta.server) return

  // Initialize auth state if not already done
  if (!authStore.isAuthenticated) {
    await authStore.initializeAuth()
  }

  // Define public routes
  const publicRoutes = ['/login']
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Check session expiry
  authStore.checkSessionExpiry()
})
