export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  // Initialize auth state from localStorage
  authStore.initializeAuth().catch(err => console.error('Auth initialization failed:', err))

  // Set up session expiry check interval (every 5 minutes)
  if (import.meta.client) {
    setInterval(() => {
      authStore.checkSessionExpiry()
    }, 5 * 60 * 1000)
  }
})
