export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Initialize auth state from localStorage if not already done
  if (!authStore.isAuthenticated && import.meta.client) {
    authStore.initializeAuth()
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Check session expiry
  authStore.checkSessionExpiry()
})
