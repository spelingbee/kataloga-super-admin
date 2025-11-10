import { useAuthStore } from '~/stores/auth'

export const usePermissions = () => {
  const authStore = useAuthStore()

  const hasPermission = (permission: string): boolean => {
    return authStore.hasPermission(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => authStore.hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => authStore.hasPermission(permission))
  }

  const hasRole = (role: string): boolean => {
    return authStore.userRole === role
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(authStore.userRole || '')
  }

  const isSuperAdmin = (): boolean => {
    return authStore.userRole === 'super_admin'
  }

  const canAccessRoute = (requiredPermissions?: string[], requiredRoles?: string[]): boolean => {
    // Super admin has access to everything
    if (isSuperAdmin()) {
      return true
    }

    // Check role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasAnyRole(requiredRoles)) {
        return false
      }
    }

    // Check permission requirements
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAllPermissions(requiredPermissions)) {
        return false
      }
    }

    return true
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    canAccessRoute,
  }
}
