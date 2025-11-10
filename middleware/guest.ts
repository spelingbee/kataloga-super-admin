export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Initialize auth state from localStorage if not already done
  if (!authStore.isAuthenticated && process.client) {
    authStore.initializeAuth()
  }

  // If user is already authenticated, redirect to dashboard
  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
