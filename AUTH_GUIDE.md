# Authentication & Authorization Guide

This guide explains how authentication and authorization work in the Super Admin Panel.

## Authentication Flow

### 1. Login Process

Users authenticate via the `/login` page:

```typescript
// Login with credentials
await authStore.login({
  email: 'admin@example.com',
  password: 'password'
})
```

The login process:
1. Sends credentials to `/api/auth/admin/login`
2. Receives JWT access token and refresh token
3. Stores tokens in localStorage
4. Stores user info in Pinia store
5. Redirects to dashboard

### 2. Token Management

The API service automatically:
- Adds JWT token to all requests via interceptor
- Refreshes expired tokens automatically
- Handles 401 errors by attempting token refresh
- Redirects to login if refresh fails

### 3. Session Persistence

Auth state is persisted across page reloads:
- Tokens stored in localStorage
- Auth store initialized on app startup
- Session checked every 5 minutes

### 4. Logout

```typescript
await authStore.logout()
```

Clears all auth data and redirects to login.

## Route Protection

### Basic Auth Middleware

Protect routes that require authentication:

```vue
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

### Role-Based Access Control

Restrict routes to specific roles:

```vue
<script setup>
definePageMeta({
  middleware: ['auth', 'role'],
  roles: ['super_admin']
})
</script>
```

### Permission-Based Access

Restrict routes to specific permissions:

```vue
<script setup>
definePageMeta({
  middleware: ['auth', 'role'],
  permissions: ['manage_tenants', 'view_analytics']
})
</script>
```

## UI-Level Authorization

### Using PermissionGuard Component

Conditionally render components based on permissions:

```vue
<PermissionGuard :permissions="['manage_tenants']">
  <button>Delete Tenant</button>
  
  <template #fallback>
    <p>You don't have permission to delete tenants</p>
  </template>
</PermissionGuard>
```

With roles:

```vue
<PermissionGuard :roles="['super_admin', 'support_admin']">
  <AdminPanel />
</PermissionGuard>
```

### Using v-permission Directive

Hide elements based on permissions:

```vue
<button v-permission="'delete_tenant'">
  Delete
</button>

<!-- Multiple permissions (requires all) -->
<button v-permission="['edit_tenant', 'manage_subscriptions']">
  Edit & Manage
</button>

<!-- With roles -->
<button v-permission="{ roles: 'super_admin' }">
  Super Admin Only
</button>

<!-- Complex conditions -->
<button v-permission="{ 
  permissions: ['edit', 'delete'], 
  roles: ['super_admin', 'support_admin'],
  requireAll: false 
}">
  Advanced Action
</button>
```

### Using usePermissions Composable

Check permissions programmatically:

```vue
<script setup>
const { hasPermission, hasRole, isSuperAdmin, canAccessRoute } = usePermissions()

const canDelete = hasPermission('delete_tenant')
const isAdmin = hasRole('super_admin')
const canAccess = canAccessRoute(['view_analytics'], ['super_admin'])

const handleAction = () => {
  if (!hasPermission('perform_action')) {
    alert('No permission')
    return
  }
  // Perform action
}
</script>
```

## User Roles

Available roles:
- `super_admin` - Full access to everything
- `support_admin` - Limited admin access
- `analytics_viewer` - Read-only analytics access

## Permissions

Permissions are granular access controls. Examples:
- `manage_tenants`
- `approve_registrations`
- `manage_subscriptions`
- `view_analytics`
- `manage_settings`
- `view_audit_logs`

## API Integration

### Making Authenticated Requests

```typescript
const { apiService } = useApi()

// GET request
const response = await apiService.get('/api/admin/tenants')

// POST request
const response = await apiService.post('/api/admin/tenants', {
  name: 'New Tenant'
})

// With error handling
try {
  const response = await apiService.get('/api/admin/tenants')
  console.log(response.data)
} catch (error) {
  if (error.response?.status === 403) {
    // Handle forbidden
  }
}
```

### Automatic Token Refresh

The API service automatically handles token refresh:
1. Request fails with 401
2. Attempts to refresh token
3. Retries original request with new token
4. If refresh fails, redirects to login

## Error Pages

- `/login` - Login page (redirects if already authenticated)
- `/401` - Unauthorized (session expired)
- `/403` - Forbidden (insufficient permissions)

## Best Practices

1. **Always use middleware** for route protection
2. **Use PermissionGuard** for conditional rendering
3. **Use v-permission** for simple show/hide
4. **Check permissions** before API calls
5. **Handle errors gracefully** with try/catch
6. **Super admin bypass** - Super admins automatically have all permissions

## Example: Protected Feature

```vue
<template>
  <div>
    <h1>Tenant Management</h1>
    
    <!-- Only show to users with permission -->
    <PermissionGuard :permissions="['create_tenant']">
      <button @click="createTenant">Create Tenant</button>
    </PermissionGuard>
    
    <!-- Only show delete to super admins -->
    <button 
      v-permission="{ roles: 'super_admin' }"
      @click="deleteTenant"
    >
      Delete Tenant
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePermissions } from '~/composables/usePermissions'

definePageMeta({
  middleware: ['auth', 'role'],
  permissions: ['view_tenants']
})

const { hasPermission } = usePermissions()
const { apiService } = useApi()

const createTenant = async () => {
  if (!hasPermission('create_tenant')) {
    alert('No permission')
    return
  }
  
  try {
    await apiService.post('/api/admin/tenants', { /* data */ })
  } catch (error) {
    console.error('Failed to create tenant:', error)
  }
}

const deleteTenant = async () => {
  // Super admin only - already checked by v-permission
  await apiService.delete('/api/admin/tenants/123')
}
</script>
```

## Testing Authentication

For development, you can test with different roles by modifying the user object in localStorage:

```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('admin_user'))
user.role = 'support_admin'
user.permissions = ['view_tenants', 'view_analytics']
localStorage.setItem('admin_user', JSON.stringify(user))
location.reload()
```
