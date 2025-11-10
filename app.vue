<template>
  <div>
    <!-- Screen reader announcements -->
    <div
      id="sr-announcements"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    ></div>
    
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
if (process.dev && process.client) {
  onMounted(() => {
    // Log accessibility report on Ctrl+Shift+A
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        const { logAccessibilityReport } = await import('~/utils/accessibility-testing')
        logAccessibilityReport()
      }
    })
  })
}
</script>
