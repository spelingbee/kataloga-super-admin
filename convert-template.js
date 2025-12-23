// Utility script to help convert stores from Options API to Composition API
// This is a template/guide, not an executable script

const conversionPattern = `
// BEFORE (Options API):
export const useStore = defineStore('name', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  
  getters: {
    hasItems: (state) => state.items.length > 0
  },
  
  actions: {
    async fetchItems() {
      this.loading = true
      try {
        const response = await api.get('/items')
        this.items = response.data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
})

// AFTER (Composition API):
export const useStore = defineStore('name', () => {
  // State
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Getters
  const hasItems = computed(() => items.value.length > 0)
  
  // Actions
  const fetchItems = async () => {
    loading.value = true
    try {
      const response = await api.get('/items')
      items.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  return {
    // State (readonly for external access)
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    
    // Getters
    hasItems,
    
    // Actions
    fetchItems
  }
})
`

console.log('Conversion pattern:', conversionPattern)