export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  // Initialize auth state from localStorage
  authStore.initializeAuth()

  // Set up session expiry check interval (every 5 minutes)
  if (process.client) {
    setInterval(() => {
      authStore.checkSessionExpiry()
    }, 5 * 60 * 1000)
  }
})
