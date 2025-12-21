import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

export interface NotificationAction {
  label: string
  handler: () => void
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  action?: NotificationAction
}

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])

  // Actions
  const add = (notification: Omit<Notification, 'id'>): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    notifications.value.push({
      id,
      ...notification,
    })
    return id
  }

  const remove = (id: string): void => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const success = (message: string, title?: string, duration?: number): string => {
    return add({
      type: 'success',
      title,
      message,
      duration: duration ?? 5000,
    })
  }

  const error = (message: string, title?: string, duration?: number): string => {
    return add({
      type: 'error',
      title,
      message,
      duration: duration ?? 7000,
    })
  }

  const warning = (message: string, title?: string, duration?: number): string => {
    return add({
      type: 'warning',
      title,
      message,
      duration: duration ?? 6000,
    })
  }

  const info = (message: string, title?: string, duration?: number): string => {
    return add({
      type: 'info',
      title,
      message,
      duration: duration ?? 5000,
    })
  }

  const clear = (): void => {
    notifications.value = []
  }

  return {
    // State
    notifications: readonly(notifications),
    
    // Actions
    add,
    remove,
    success,
    error,
    warning,
    info,
    clear,
  }
})
