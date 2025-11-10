<template>
  <header 
    class="sticky top-0 z-30 bg-white border-b border-gray-200"
    role="banner"
  >
    <div class="flex items-center justify-between h-16 px-6">
      <!-- Mobile menu button -->
      <button
        type="button"
        class="lg:hidden text-gray-500 hover:text-gray-700"
        aria-label="Open navigation menu"
        aria-expanded="false"
        aria-controls="main-navigation"
        @click="$emit('toggle-sidebar')"
      >
        <AppIcon name="menu" aria-hidden="true" />
      </button>

      <!-- Search bar -->
      <div class="flex-1 max-w-2xl mx-4">
        <div class="relative">
          <label for="global-search" class="sr-only">
            Search tenants, subscriptions, and more
          </label>
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <AppIcon name="search" class="text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="global-search"
            type="search"
            placeholder="Search tenants, subscriptions..."
            class="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Search tenants, subscriptions, and more"
            role="searchbox"
          />
        </div>
      </div>

      <!-- Right side actions -->
      <div class="flex items-center space-x-4">
        <!-- Notifications -->
        <button 
          type="button"
          class="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          aria-label="Notifications (3 unread)"
        >
          <AppIcon name="bell" aria-hidden="true" />
          <span 
            class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
            aria-hidden="true"
          ></span>
          <span class="sr-only">3 unread notifications</span>
        </button>

        <!-- User menu -->
        <div class="relative">
          <button
            type="button"
            class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
            aria-label="User menu"
            aria-expanded="isUserMenuOpen"
            aria-haspopup="true"
            :aria-controls="isUserMenuOpen ? 'user-menu' : undefined"
            @click="isUserMenuOpen = !isUserMenuOpen"
          >
            <div 
              class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold"
              aria-hidden="true"
            >
              {{ userInitials }}
            </div>
            <div class="hidden md:block text-left">
              <div class="text-sm font-medium text-gray-900">{{ userName }}</div>
              <div class="text-xs text-gray-500">{{ authStore.user?.email }}</div>
            </div>
            <AppIcon name="chevron-down" class="text-gray-400" aria-hidden="true" />
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="isUserMenuOpen"
            id="user-menu"
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
          >
            <NuxtLink
              to="/profile"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              @click="isUserMenuOpen = false"
            >
              Profile
            </NuxtLink>
            <NuxtLink
              to="/settings"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              @click="isUserMenuOpen = false"
            >
              Settings
            </NuxtLink>
            <hr class="my-1 border-gray-200" role="separator" />
            <button
              type="button"
              class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              role="menuitem"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

defineEmits<{
  'toggle-sidebar': []
}>()

const authStore = useAuthStore()
const isUserMenuOpen = ref(false)

const userName = computed(() => {
  const user = authStore.user
  if (!user) return 'Admin'
  return `${user.firstName} ${user.lastName}`.trim() || user.email
})

const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return 'SA'
  const first = user.firstName?.[0] || ''
  const last = user.lastName?.[0] || ''
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || 'A'
})

const handleLogout = async () => {
  isUserMenuOpen.value = false
  await authStore.logout()
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      isUserMenuOpen.value = false
    }
  })
})
</script>
