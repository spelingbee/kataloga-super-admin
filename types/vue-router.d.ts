import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    permissions?: string[]
    roles?: string[]
    requiresAuth?: boolean
  }
}
