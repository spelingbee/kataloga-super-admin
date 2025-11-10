export default defineNuxtPlugin(() => {
  const errorReporting = useErrorReporting()
  
  // Set up global error handlers
  errorReporting.setupGlobalHandlers()
  
  // Handle Vue errors
  const nuxtApp = useNuxtApp()
  
  nuxtApp.hook('vue:error', (error, instance, info) => {
    console.error('Vue error:', error, info)
    errorReporting.reportError(error, {
      type: 'vue_error',
      component: instance?.$options?.name || 'Unknown',
      info,
    })
  })
  
  // Handle Nuxt errors
  nuxtApp.hook('app:error', (error) => {
    console.error('App error:', error)
    errorReporting.reportError(error, {
      type: 'app_error',
    })
  })
})
