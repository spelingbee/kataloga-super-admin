export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // Initialize auth state from localStorage if not already done
  if (!authStore.isAuthenticated && import.meta.client) {
    await authStore.initializeAuth()
  }

  // If user is already authenticated, redirect to dashboard
  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
