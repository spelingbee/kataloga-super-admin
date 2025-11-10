export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  const { canAccessRoute } = usePermissions()

  // Get route meta for required permissions/roles
  const requiredPermissions = to.meta.permissions as string[] | undefined
  const requiredRoles = to.meta.roles as string[] | undefined

  // Check if user has required permissions/roles
  if (!canAccessRoute(requiredPermissions, requiredRoles)) {
    // User doesn't have permission, redirect to 403
    return navigateTo('/403')
  }
})
