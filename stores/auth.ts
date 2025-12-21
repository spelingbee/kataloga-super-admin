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
      const response = await apiService.post<LoginResponse>('/api/auth/admin/login', credentials)

      // Backend returns tokens directly without ApiResponse wrapper
      const { accessToken, refreshToken: newRefreshToken, user: newUser } = response as any

      // Store tokens
      token.value = accessToken
      refreshToken.value = newRefreshToken
      user.value = newUser
      isAuthenticated.value = true

      // Persist to localStorage
      if (import.meta.client) {
        localStorage.setItem('admin_token', accessToken)
        localStorage.setItem('admin_refresh_token', newRefreshToken)
        localStorage.setItem('admin_user', JSON.stringify(newUser))
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
      await apiService.post('/api/auth/logout')
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
      const response = await apiService.post<LoginResponse>('/api/auth/refresh', {
        refreshToken: refreshToken.value,
      })

      const data = response
      const { accessToken, refreshToken: newRefreshToken, user: newUser } = data

      if (!accessToken || !newUser) {
        throw new Error('Invalid refresh response')
      }

      token.value = accessToken
      refreshToken.value = newRefreshToken
      user.value = newUser
      isAuthenticated.value = true

      if (import.meta.client) {
        localStorage.setItem('admin_token', accessToken)
        localStorage.setItem('admin_refresh_token', newRefreshToken)
        localStorage.setItem('admin_user', JSON.stringify(newUser))
      }
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  const fetchCurrentUser = async (): Promise<void> => {
    try {
      const { apiService } = useApi()
      const response = await apiService.get<User>('/api/auth/me')
      user.value = response
      isAuthenticated.value = true
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  const initializeAuth = (): void => {
    if (import.meta.client) {
      const storedToken = localStorage.getItem('admin_token')
      const storedRefreshToken = localStorage.getItem('admin_refresh_token')
      const userStr = localStorage.getItem('admin_user')

      if (storedToken && storedRefreshToken && userStr) {
        try {
          token.value = storedToken
          refreshToken.value = storedRefreshToken
          user.value = JSON.parse(userStr)
          isAuthenticated.value = true
        } catch (error) {
          console.error('Failed to parse stored user:', error)
          clearAuth()
        }
      }
    }
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
