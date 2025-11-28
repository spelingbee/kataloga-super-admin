<template>
  <div>
    <!-- Screen reader announcements -->
    <div
      id="sr-announcements"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    />
    
    <NuxtLayout>
      <NuxtPage />
      <ToastContainer />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Set page title for accessibility
useHead({
  titleTemplate: (title) => title ? `${title} - Super Admin` : 'Super Admin Panel',
  htmlAttrs: {
    lang: 'en'
  }
})

// Add accessibility testing in development
if (import.meta.dev && import.meta.client) {
  onMounted(() => {
    // Log accessibility report on Ctrl+Shift+A
    document.addEventListener('keydown', async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        const { logAccessibilityReport } = await import('~/utils/accessibility-testing')
        logAccessibilityReport()
      }
    })
  })
}
</script>
