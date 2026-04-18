import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '~/types'

export class ApiService {
  private api: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor(baseURL: string) {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      withCredentials: true,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    )
  }

  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const token = this.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }

  private async handleError(error: AxiosError): Promise<never> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - try to refresh token
    // Skip refresh for login/register endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/admin/login') ||
                          originalRequest.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      try {
        const newToken = await this.refreshToken()
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return this.api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        this.clearAuth()
        
        if (typeof window !== 'undefined') {
          // Prevent infinite reload loops if already on login page
          const currentPath = window.location.pathname
          if (currentPath !== '/login') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(refreshError)
      }
    }

    // Extract error message from backend response structure
    const errorData = error.response?.data as any
    if (errorData && errorData.error) {
      const enhancedError = new Error(errorData.error.message || 'Request failed')
      Object.assign(enhancedError, {
        code: errorData.error.code,
        statusCode: errorData.statusCode,
        response: error.response
      })
      return Promise.reject(enhancedError)
    }

    return Promise.reject(error)
  }

  private async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(
          `${this.api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        )

        // Backend returns { success, statusCode, data: { accessToken, refreshToken, user }, error, meta }
        const responseData = response.data
        if (responseData && responseData.data) {
          const { accessToken, refreshToken: newRefreshToken } = responseData.data
          this.setToken(accessToken)
          this.setRefreshToken(newRefreshToken)
          return accessToken
        }

        throw new Error('Invalid refresh response')
      } finally {
        this.refreshTokenPromise = null
      }
    })()

    return this.refreshTokenPromise
  }

  // Token management
  private getToken(): string | null {
    if (process.client) {
      return localStorage.getItem('admin_token')
    }
    return null
  }

  private setToken(token: string): void {
    if (process.client) {
      localStorage.setItem('admin_token', token)
    }
  }

  private getRefreshToken(): string | null {
    if (process.client) {
      return localStorage.getItem('admin_refresh_token')
    }
    return null
  }

  private setRefreshToken(token: string): void {
    if (process.client) {
      localStorage.setItem('admin_refresh_token', token)
    }
  }

  private clearAuth(): void {
    if (process.client) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_refresh_token')
      localStorage.removeItem('admin_user')
    }
  }

  // Public API methods
  public getInstance(): AxiosInstance {
    return this.api
  }

  public async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.get(url, config)
    // Backend returns { success, statusCode, data, error, meta }
    // We need to extract the actual data from response.data.data
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data as T
    }
    return response.data as T
  }

  public async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post(url, data, config)
    // Backend returns { success, statusCode, data, error, meta }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data as T
    }
    return response.data as T
  }

  public async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put(url, data, config)
    // Backend returns { success, statusCode, data, error, meta }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data as T
    }
    return response.data as T
  }

  public async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.patch(url, data, config)
    // Backend returns { success, statusCode, data, error, meta }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data as T
    }
    return response.data as T
  }

  public async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete(url, config)
    // Backend returns { success, statusCode, data, error, meta }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data as T
    }
    return response.data as T
  }
}
