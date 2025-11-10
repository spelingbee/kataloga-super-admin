<template>
  <slot v-if="hasAccess" />
  <slot v-else name="fallback" />
</template>

<script setup lang="ts">
import { usePermissions } from '~/composables/usePermissions'

interface Props {
  permissions?: string | string[]
  roles?: string | string[]
  requireAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  requireAll: true,
})

const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, isSuperAdmin } = usePermissions()

const hasAccess = computed(() => {
  // Super admin has access to everything
  if (isSuperAdmin()) {
    return true
  }

  let roleCheck = true
  let permissionCheck = true

  // Check roles
  if (props.roles) {
    if (typeof props.roles === 'string') {
      roleCheck = hasRole(props.roles)
    } else if (Array.isArray(props.roles)) {
      roleCheck = hasAnyRole(props.roles)
    }
  }

  // Check permissions
  if (props.permissions) {
    if (typeof props.permissions === 'string') {
      permissionCheck = hasPermission(props.permissions)
    } else if (Array.isArray(props.permissions)) {
      permissionCheck = props.requireAll
        ? hasAllPermissions(props.permissions)
        : hasAnyPermission(props.permissions)
    }
  }

  return roleCheck && permissionCheck
})
</script>
