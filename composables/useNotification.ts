import { useNotificationStore, type NotificationAction } from '~/stores/notification'

export function useNotification() {
  const notificationStore = useNotificationStore()

  return {
    success: (message: string, title?: string, duration?: number) => {
      return notificationStore.success(message, title, duration)
    },

    error: (message: string, title?: string, duration?: number) => {
      return notificationStore.error(message, title, duration)
    },

    warning: (message: string, title?: string, duration?: number) => {
      return notificationStore.warning(message, title, duration)
    },

    info: (message: string, title?: string, duration?: number) => {
      return notificationStore.info(message, title, duration)
    },

    notify: (
      type: 'success' | 'error' | 'warning' | 'info',
      message: string,
      title?: string,
      duration?: number,
      action?: NotificationAction
    ) => {
      return notificationStore.add({
        type,
        title,
        message,
        duration,
        action,
      })
    },

    remove: (id: string) => {
      notificationStore.remove(id)
    },

    clear: () => {
      notificationStore.clear()
    },
  }
}
