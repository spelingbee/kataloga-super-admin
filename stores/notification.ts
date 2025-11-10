import { defineStore } from 'pinia'

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

interface NotificationState {
  notifications: Notification[]
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
  }),

  actions: {
    add(notification: Omit<Notification, 'id'>) {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this.notifications.push({
        id,
        ...notification,
      })
      return id
    },

    remove(id: string) {
      const index = this.notifications.findIndex((n) => n.id === id)
      if (index !== -1) {
        this.notifications.splice(index, 1)
      }
    },

    success(message: string, title?: string, duration?: number) {
      return this.add({
        type: 'success',
        title,
        message,
        duration: duration ?? 5000,
      })
    },

    error(message: string, title?: string, duration?: number) {
      return this.add({
        type: 'error',
        title,
        message,
        duration: duration ?? 7000,
      })
    },

    warning(message: string, title?: string, duration?: number) {
      return this.add({
        type: 'warning',
        title,
        message,
        duration: duration ?? 6000,
      })
    },

    info(message: string, title?: string, duration?: number) {
      return this.add({
        type: 'info',
        title,
        message,
        duration: duration ?? 5000,
      })
    },

    clear() {
      this.notifications = []
    },
  },
})
