<template>
  <div>
    <!-- Mobile sidebar overlay -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
      role="presentation"
      aria-hidden="true"
      @click="$emit('close')"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
      role="navigation"
      aria-label="Main navigation"
      :aria-hidden="!isOpen && 'true'"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900">Super Admin</h1>
        <button
          type="button"
          class="lg:hidden text-gray-500 hover:text-gray-700"
          aria-label="Close navigation menu"
          @click="$emit('close')"
        >
          <svg 
            class="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav 
        class="flex-1 px-4 py-6 space-y-1 overflow-y-auto"
        aria-label="Primary navigation"
      >
        <AppNavItem
          v-for="item in navigationItems"
          :key="item.path"
          :item="item"
          @click="$emit('close')"
        />
      </nav>
    </aside>
  </div>
</template>

<script setup lang="ts">
interface NavigationItem {
  name: string
  path: string
  icon: string
  badge?: number
}

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
}>()

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', path: '/', icon: 'dashboard' },
  { name: 'Tenants', path: '/tenants', icon: 'tenants' },
  { name: 'Registrations', path: '/registrations', icon: 'registrations', badge: 5 },
  { name: 'Subscriptions', path: '/subscriptions', icon: 'subscriptions' },
  { name: 'Analytics', path: '/analytics', icon: 'analytics' },
  { name: 'Reports', path: '/reports', icon: 'reports' },
  { name: 'Emails', path: '/emails', icon: 'emails' },
  { name: 'Security', path: '/security', icon: 'security' },
  { name: 'Audit Logs', path: '/audit', icon: 'audit' },
  { name: 'Settings', path: '/settings', icon: 'settings' },
  { name: 'Help Center', path: '/help', icon: 'help-circle' },
]
</script>
