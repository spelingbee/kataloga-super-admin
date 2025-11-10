import type { Directive } from 'vue'
import { useAuthStore } from '~/stores/auth'

export const vPermission: Directive = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    const { value } = binding

    if (!value) {
      return
    }

    let hasPermission = false

    if (typeof value === 'string') {
      // Single permission
      hasPermission = authStore.hasPermission(value)
    } else if (Array.isArray(value)) {
      // Multiple permissions (user needs all)
      hasPermission = value.every(permission => authStore.hasPermission(permission))
    } else if (typeof value === 'object') {
      // Object with permissions and/or roles
      const { permissions, roles, requireAll = true } = value

      // Check roles
      if (roles) {
        const roleCheck = Array.isArray(roles)
          ? roles.includes(authStore.userRole)
          : roles === authStore.userRole

        if (!roleCheck) {
          hasPermission = false
        } else {
          hasPermission = true
        }
      }

      // Check permissions
      if (permissions && hasPermission !== false) {
        if (Array.isArray(permissions)) {
          hasPermission = requireAll
            ? permissions.every(p => authStore.hasPermission(p))
            : permissions.some(p => authStore.hasPermission(p))
        } else {
          hasPermission = authStore.hasPermission(permissions)
        }
      }
    }

    // Super admin has access to everything
    if (authStore.userRole === 'super_admin') {
      hasPermission = true
    }

    // Remove element if user doesn't have permission
    if (!hasPermission) {
      el.style.display = 'none'
      // Or completely remove from DOM:
      // el.parentNode?.removeChild(el)
    }
  },
}
