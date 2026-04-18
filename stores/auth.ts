import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { User, LoginCredentials, LoginResponse } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)

  // Getters
  const currentUser = computed((): User | null => user.value || null)
  const isLoggedIn = computed((): boolean => !!isAuthenticated.value && !!token.value)
  const userRole = computed((): string | null => user.value?.role || null)
  const hasPermission = computed(() => (permission: string): boolean => {
    if (!user.value || !permission) return false
    return user.value?.permissions?.includes(permission) || false
  })

  // Actions
  const
login = async (credentials: LoginCredentials): Promise<void> => {
    loading.value = true
    try {
      const { apiService } = useApi()
      const response = await apiService.post<LoginResponse>('/auth/admin/login', credentials)

      // Store tokens and user data
      token.value = response.accessToken
      refreshToken.value = response.refreshToken
      user.value = response.user
      isAuthenticated.value = true

      // Persist to localStorage
      if (import.meta.client) {
        localStorage.setItem('admin_token', response.accessToken)
        localStorage.setItem('admin_refresh_token', response.refreshToken)
        localStorage.setItem('admin_user', JSON.stringify(response.user))
      }
    } catch (error: any) {
      clearAuth()
      throw new Error(error.response?.data?.message || 'Login failed')
    } finally {
      loading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const { apiService } = useApi()
      await apiService.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      if (import.meta.client) {
        window.location.href = '/login'
      }
    }
  }

  const refreshSession = async (): Promise<void> => {
    try {
      const { apiService } = useApi()
      const response = await apiService.post<LoginResponse>('/auth/refresh', {
        refreshToken: refreshToken.value,
      })

      token.value = response.accessToken
      refreshToken.value = response.refreshToken
      user.value = response.user
      isAuthenticated.value = true

      if (import.meta.client) {
        localStorage.setItem('admin_token', response.accessToken)
        localStorage.setItem('admin_refresh_token', response.refreshToken)
        localStorage.setItem('admin_user', JSON.stringify(response.user))
      }
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  const fetchCurrentUser = async (): Promise<void> => {
    try {
      const { apiService } = useApi()
      const response = await apiService.get<User>('/auth/me')
      user.value = response
      isAuthenticated.value = true
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  let initializationPromise: Promise<void> | null = null

  const initializeAuth = async (): Promise<void> => {
    if (!import.meta.client) return
    if (initializationPromise) return initializationPromise

    initializationPromise = (async () => {
      try {
        // With httpOnly cookies, we prioritize active session check
        await fetchCurrentUser()
      } catch (error: any) {
        // If it's a 401, we are definitely NOT authenticated. 
        // Stop here and clear everything to avoid loops.
        if (error.response?.status === 401) {
          clearAuth()
          return
        }

        // For other errors (network issues), we can try to restore state 
        // from localStorage as a best-effort fallback
        const storedToken = localStorage.getItem('admin_token')
        const storedRefreshToken = localStorage.getItem('admin_refresh_token')
        const userStr = localStorage.getItem('admin_user')

        if (storedToken && storedRefreshToken && userStr) {
          try {
            token.value = storedToken
            refreshToken.value = storedRefreshToken
            user.value = JSON.parse(userStr)
            isAuthenticated.value = true
          } catch (e) {
            clearAuth()
          }
        }
      } finally {
        // We keep the promise null so it can be re-tried if needed 
        // (though clearAuth handles the state usually)
        initializationPromise = null
      }
    })()

    return initializationPromise
  }

  const clearAuth = (): void => {
    user.value = null
    token.value = null
    refreshToken.value = null
    isAuthenticated.value = false

    if (import.meta.client) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_refresh_token')
      localStorage.removeItem('admin_user')
    }
  }

  const checkSessionExpiry = (): void => {
    // Check if session is about to expire and refresh if needed
    if (isAuthenticated.value && refreshToken.value) {
      // This would typically check token expiry time
      // For now, we'll rely on the API interceptor to handle 401s
    }
  }

  return {
    // State
    user: readonly(user),
    token: readonly(token),
    refreshToken: readonly(refreshToken),
    isAuthenticated: readonly(isAuthenticated),
    loading: readonly(loading),
    
    // Getters
    currentUser,
    isLoggedIn,
    userRole,
    hasPermission,
    
    // Actions
    login,
    logout,
    refreshSession,
    fetchCurrentUser,
    initializeAuth,
    clearAuth,
    checkSessionExpiry,
  }
})
