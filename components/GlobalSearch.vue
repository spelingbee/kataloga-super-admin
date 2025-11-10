<template>
  <div 
    v-if="isOpen" 
    class="global-search" 
    @click.self="close"
    role="dialog"
    aria-modal="true"
    aria-labelledby="global-search-label"
  >
    <div 
      v-focus-trap="{ active: isOpen }"
      class="global-search__content"
    >
      <div class="global-search__input-wrapper">
        <svg class="global-search__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <label id="global-search-label" class="sr-only">Global search</label>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Search tenants, subscriptions, emails..."
          class="global-search__input"
          aria-label="Search
          @keydown.down.prevent="selectNext"
          @keydown.up.prevent="selectPrevious"
          @keydown.enter.prevent="selectCurrent"
          @keydown.esc="close"
        />
        <button v-if="query" @click="clearQuery" class="global-search__clear">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="loading" class="global-search__loading">
        <div class="global-search__spinner"></div>
        <span>Searching...</span>
      </div>

      <div v-else-if="results.length > 0" class="global-search__results">
        <div
          v-for="(result, index) in results"
          :key="result.id"
          :class="[
            'global-search__result',
            { 'global-search__result--selected': index === selectedIndex }
          ]"
          @click="selectResult(result)"
          @mouseenter="selectedIndex = index"
        >
          <div class="global-search__result-icon">
            <component :is="getIcon(result.type)" />
          </div>
          <div class="global-search__result-content">
            <div class="global-search__result-title">{{ result.title }}</div>
            <div class="global-search__result-subtitle">{{ result.subtitle }}</div>
          </div>
          <div class="global-search__result-badge">{{ result.type }}</div>
        </div>
      </div>

      <div v-else-if="query && !loading" class="global-search__empty">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No results found for "{{ query }}"</p>
      </div>

      <div v-else class="global-search__hints">
        <div class="global-search__hint">
          <kbd>↑</kbd><kbd>↓</kbd> Navigate
        </div>
        <div class="global-search__hint">
          <kbd>Enter</kbd> Select
        </div>
        <div class="global-search__hint">
          <kbd>Esc</kbd> Close
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SearchResult {
  id: string
  type: 'tenant' | 'subscription' | 'email' | 'user'
  title: string
  subtitle: string
  url: string
}

const isOpen = ref(false)
const query = ref('')
const results = ref<SearchResult[]>([])
const selectedIndex = ref(0)
const loading = ref(false)
const searchInput = ref<HTMLInputElement>()

const router = useRouter()
const api = useApi()

// Debounced search
const debouncedSearch = useDebounceFn(async () => {
  if (!query.value.trim()) {
    results.value = []
    return
  }

  loading.value = true
  try {
    const response = await api.get<SearchResult[]>('/api/admin/search', {
      params: { q: query.value },
    })
    results.value = response.data || []
    selectedIndex.value = 0
  } catch (error) {
    console.error('Search error:', error)
    results.value = []
  } finally {
    loading.value = false
  }
}, 300)

watch(query, () => {
  debouncedSearch()
})

const open = () => {
  isOpen.value = true
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const close = () => {
  isOpen.value = false
  query.value = ''
  results.value = []
  selectedIndex.value = 0
}

const clearQuery = () => {
  query.value = ''
  searchInput.value?.focus()
}

const selectNext = () => {
  if (selectedIndex.value < results.value.length - 1) {
    selectedIndex.value++
  }
}

const selectPrevious = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--
  }
}

const selectCurrent = () => {
  if (results.value[selectedIndex.value]) {
    selectResult(results.value[selectedIndex.value])
  }
}

const selectResult = (result: SearchResult) => {
  router.push(result.url)
  close()
}

const getIcon = (type: string) => {
  const icons: Record<string, string> = {
    tenant: 'IconBuilding',
    subscription: 'IconCreditCard',
    email: 'IconMail',
    user: 'IconUser',
  }
  return icons[type] || 'IconFile'
}

// Expose methods
defineExpose({
  open,
  close,
})

// Helper for debounce
function useDebounceFn(fn: Function, delay: number) {
  let timeout: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.global-search {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 9999;
  padding-top: 10vh;
}

.global-search__content {
  background: white;
  border-radius: $radius-lg;
  max-width: 40rem;
  width: 100%;
  box-shadow: $shadow-lg;
  overflow: hidden;
}

.global-search__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.global-search__icon {
  width: 1.25rem;
  height: 1.25rem;
  color: $text-secondary;
  margin-right: $spacing-sm;
}

.global-search__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: $text-primary;
  
  &::placeholder {
    color: $text-secondary;
  }
}

.global-search__clear {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: $text-secondary;
  cursor: pointer;
  border-radius: $radius-sm;
  
  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
  
  svg {
    width: 1rem;
    height: 1rem;
  }
}

.global-search__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-xl;
  color: $text-secondary;
}

.global-search__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid $border-color;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.global-search__results {
  max-height: 24rem;
  overflow-y: auto;
}

.global-search__result {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  cursor: pointer;
  transition: $transition-base;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover,
  &--selected {
    background: $bg-secondary;
  }
}

.global-search__result-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-secondary;
  border-radius: $radius-md;
  color: $primary-color;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.global-search__result-content {
  flex: 1;
  min-width: 0;
}

.global-search__result-title {
  font-weight: 500;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.global-search__result-subtitle {
  font-size: 0.875rem;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.global-search__result-badge {
  padding: 0.25rem 0.5rem;
  background: $bg-secondary;
  border-radius: $radius-sm;
  font-size: 0.75rem;
  font-weight: 500;
  color: $text-secondary;
  text-transform: capitalize;
}

.global-search__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  color: $text-secondary;
  
  svg {
    width: 3rem;
    height: 3rem;
    margin-bottom: $spacing-md;
  }
  
  p {
    margin: 0;
  }
}

.global-search__hints {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-lg;
  padding: $spacing-md;
  background: $bg-secondary;
  border-top: 1px solid $border-color;
}

.global-search__hint {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: $text-secondary;
  
  kbd {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    background: white;
    border: 1px solid $border-color;
    border-radius: $radius-sm;
    font-family: monospace;
    font-size: 0.75rem;
  }
}
</style>
