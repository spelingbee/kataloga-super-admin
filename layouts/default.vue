<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar Navigation -->
    <AppSidebar 
      :is-open="isSidebarOpen" 
      role="navigation"
      aria-label="Main navigation"
      @close="isSidebarOpen = false"
    />

    <!-- Main Content -->
    <div class="lg:pl-64">
      <!-- Header -->
      <AppHeader 
        role="banner"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      />

      <!-- Breadcrumbs -->
      <AppBreadcrumbs role="navigation" aria-label="Breadcrumb" />

      <!-- Page Content -->
      <main 
        id="main-content"
        class="p-6"
        role="main"
        aria-label="Main content"
        tabindex="-1"
      >
        <slot />
      </main>
    </div>

    <!-- Global Modals -->
    <GlobalSearch 
      ref="globalSearchRef"
      role="dialog"
      aria-label="Global search"
    />
    <KeyboardShortcutsModal 
      ref="shortcutsModalRef"
      role="dialog"
      aria-label="Keyboard shortcuts"
    />
    
    <!-- Onboarding Tour -->
    <OnboardingTour />
  </div>
</template>

<script setup lang="ts">
const isSidebarOpen = ref(false)
const globalSearchRef = ref()
const shortcutsModalRef = ref()

// Listen for global events
onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('open-global-search', () => {
      globalSearchRef.value?.open()
    })

    window.addEventListener('close-modal', () => {
      globalSearchRef.value?.close()
      shortcutsModalRef.value?.close()
    })
  }
})
</script>
