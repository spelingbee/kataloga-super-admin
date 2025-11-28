import { defineStore } from 'pinia'
import type { User, LoginCredentials, LoginResponse, AuthState } from '~/types'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
  }),

  getters: {
    currentUser: (state): User | null => state.user || null,
    isLoggedIn: (state): boolean => !!state.isAuthenticated && !!state.token,
    userRole: (state): string | null => state.user?.role || null,
    hasPermission: (state) => (permission: string): boolean => {
      if (!state.user || !permission) return false
      return state.user?.permissions?.includes(permission) || false
    },
  },

  actions: {
    async login(credentials: LoginCredentials): Promise<void> {
      this.loading = true
      try {
        const { apiService } = useApi()
        const response = await apiService.post<LoginResponse>('/api/auth/admin/login', credentials)

        // Backend returns tokens directly without ApiResponse wrapper
        const { accessToken, refreshToken, user } = response as any

        // Store tokens
        this.token = accessToken
        this.refreshToken = refreshToken
        this.user = user
        this.isAuthenticated = true

        // Persist to localStorage
        if (import.meta.client) {
          localStorage.setItem('admin_token', accessToken)
          localStorage.setItem('admin_refresh_token', refreshToken)
          localStorage.setItem('admin_user', JSON.stringify(user))
        }
      } catch (error: any) {
        this.clearAuth()
        throw new Error(error.response?.data?.message || 'Login failed')
      } finally {
        this.loading = false
      }
    },

    async logout(): Promise<void> {
      try {
        const { apiService } = useApi()
        await apiService.post('/api/auth/logout')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
        if (import.meta.client) {
          window.location.href = '/login'
        }
      }
    },

    async refreshSession(): Promise<void> {
      try {
        const { apiService } = useApi()
        const response = await apiService.post<LoginResponse>('/api/auth/refresh', {
          refreshToken: this.refreshToken,
        })

        const data = response.data || response
        const { accessToken, refreshToken, user } = data

        if (!accessToken || !user) {
          throw new Error('Invalid refresh response')
        }

        this.token = accessToken
        this.refreshToken = refreshToken
        this.user = user
        this.isAuthenticated = true

        if (import.meta.client) {
          localStorage.setItem('admin_token', accessToken)
          localStorage.setItem('admin_refresh_token', refreshToken)
          localStorage.setItem('admin_user', JSON.stringify(user))
        }
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    async fetchCurrentUser(): Promise<void> {
      try {
        const { apiService } = useApi()
        const response = await apiService.get<User>('/api/auth/me')
        this.user = response.data
        this.isAuthenticated = true
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    initializeAuth(): void {
      if (import.meta.client) {
        const token = localStorage.getItem('admin_token')
        const refreshToken = localStorage.getItem('admin_refresh_token')
        const userStr = localStorage.getItem('admin_user')

        if (token && refreshToken && userStr) {
          try {
            this.token = token
            this.refreshToken = refreshToken
            this.user = JSON.parse(userStr)
            this.isAuthenticated = true
          } catch (error) {
            console.error('Failed to parse stored user:', error)
            this.clearAuth()
          }
        }
      }
    },

    clearAuth(): void {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.isAuthenticated = false

      if (import.meta.client) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_refresh_token')
        localStorage.removeItem('admin_user')
      }
    },

    checkSessionExpiry(): void {
      // Check if session is about to expire and refresh if needed
      if (this.isAuthenticated && this.refreshToken) {
        // This would typically check token expiry time
        // For now, we'll rely on the API interceptor to handle 401s
      }
    },
  },
})
