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
        // Refresh failed, clear auth but don't redirect automatically
        // Let the middleware handle the redirect
        this.clearAuth()
        return Promise.reject(refreshError)
      }
    }

    // Don't retry network errors automatically - just fail
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

        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${this.api.defaults.baseURL}/api/auth/refresh`,
          { refreshToken }
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data.data
        this.setToken(accessToken)
        this.setRefreshToken(newRefreshToken)

        return accessToken
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
    const response = await this.api.get<ApiResponse<T>>(url, config)
    return response.data
  }

  public async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  public async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  public async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  public async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete<ApiResponse<T>>(url, config)
    return response.data
  }
}
