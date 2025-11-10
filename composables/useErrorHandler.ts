import type { AxiosError } from 'axios'

interface ErrorContext {
  component?: string
  action?: string
  metadata?: Record<string, any>
}

interface ErrorDetails {
  message: string
  code?: string
  statusCode?: number
  details?: any
}

export const useErrorHandler = () => {
  const notification = useNotification()
  const router = useRouter()
  const errorReporting = useErrorReporting()

  /**
   * Handle API errors with appropriate user feedback
   */
  const handleApiError = (error: AxiosError | Error, context?: ErrorContext): ErrorDetails => {
    const errorDetails: ErrorDetails = {
      message: 'An unexpected error occurred',
    }

    if ('isAxiosError' in error && error.isAxiosError) {
      const axiosError = error as AxiosError<any>
      const response = axiosError.response

      if (response) {
        errorDetails.statusCode = response.status
        errorDetails.code = response.data?.code
        errorDetails.details = response.data?.details

        switch (response.status) {
          case 400:
            errorDetails.message = response.data?.message || 'Invalid request. Please check your input.'
            notification.error(errorDetails.message)
            break

          case 401:
            errorDetails.message = 'Your session has expired. Please log in again.'
            notification.error(errorDetails.message)
            router.push('/login')
            break

          case 403:
            errorDetails.message = 'You don\'t have permission to perform this action.'
            notification.error(errorDetails.message)
            router.push('/403')
            break

          case 404:
            errorDetails.message = response.data?.message || 'The requested resource was not found.'
            notification.error(errorDetails.message)
            break

          case 422:
            errorDetails.message = response.data?.message || 'Validation failed. Please check your input.'
            notification.error(errorDetails.message)
            break

          case 429:
            errorDetails.message = 'Too many requests. Please try again later.'
            notification.warning(errorDetails.message)
            break

          case 500:
          case 502:
          case 503:
          case 504:
            errorDetails.message = 'Server error. Please try again later.'
            notification.error(errorDetails.message)
            break

          default:
            errorDetails.message = response.data?.message || 'An unexpected error occurred.'
            notification.error(errorDetails.message)
        }
      } else if (axiosError.code === 'ECONNABORTED') {
        errorDetails.message = 'Request timeout. Please check your connection and try again.'
        notification.error(errorDetails.message)
      } else if (axiosError.code === 'ERR_NETWORK') {
        errorDetails.message = 'Network error. Please check your internet connection.'
        notification.error(errorDetails.message)
      } else {
        errorDetails.message = 'Unable to connect to the server. Please try again.'
        notification.error(errorDetails.message)
      }
    } else {
      // Handle non-Axios errors
      errorDetails.message = error.message || 'An unexpected error occurred.'
      notification.error(errorDetails.message)
    }

    // Report error for monitoring
    errorReporting.reportError(error, {
      ...context,
      errorDetails,
    })

    return errorDetails
  }

  /**
   * Handle errors with retry mechanism
   */
  const handleWithRetry = async <T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number
      retryDelay?: number
      context?: ErrorContext
      onRetry?: (attempt: number) => void
    } = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      context,
      onRetry,
    } = options

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          if (onRetry) {
            onRetry(attempt)
          }
          
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed
    if (lastError) {
      handleApiError(lastError, {
        ...context,
        metadata: {
          ...context?.metadata,
          retries: maxRetries,
        },
      })
      throw lastError
    }

    throw new Error('Operation failed after retries')
  }

  /**
   * Wrap async operations with error handling
   */
  const withErrorHandling = async <T>(
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> => {
    try {
      return await fn()
    } catch (error) {
      handleApiError(error as Error, context)
      return null
    }
  }

  /**
   * Show user-friendly error message
   */
  const showError = (message: string, options?: {
    title?: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }) => {
    notification.error(message, options?.duration)
  }

  /**
   * Show validation errors
   */
  const showValidationErrors = (errors: Record<string, string[]>) => {
    const messages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n')
    
    notification.error(`Validation failed:\n${messages}`, 5000)
  }

  return {
    handleApiError,
    handleWithRetry,
    withErrorHandling,
    showError,
    showValidationErrors,
  }
}
