<template>
  <div 
    class="data-table"
    role="region"
    :aria-label="ariaLabel || 'Data table'"
  >
    <!-- Search Bar -->
    <div v-if="searchable" class="data-table__search">
      <label :for="`search-${tableId}`" class="sr-only">
        {{ searchPlaceholder }}
      </label>
      <input
        :id="`search-${tableId}`"
        v-model="searchQuery"
        type="search"
        :placeholder="searchPlaceholder"
        class="data-table__search-input"
        :aria-label="searchPlaceholder"
        aria-describedby="search-results-count"
      >
      <span :id="`search-results-count-${tableId}`" class="sr-only" aria-live="polite">
        {{ filteredData.length }} results found
      </span>
    </div>

    <!-- Table -->
    <div class="data-table__wrapper">
      <table 
        class="data-table__table"
        role="table"
        :aria-label="ariaLabel || 'Data table'"
        :aria-rowcount="filteredData.length"
        :aria-colcount="columns.length + (hasActions ? 1 : 0)"
      >
        <thead role="rowgroup">
          <tr role="row">
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'data-table__header',
                {
                  'data-table__header--sortable': column.sortable !== false,
                  'data-table__header--sorted': sortKey === column.key,
                },
              ]"
              role="columnheader"
              :aria-sort="getSortAriaValue(column.key)"
              :tabindex="column.sortable !== false ? 0 : undefined"
              @click="column.sortable !== false && handleSort(column.key)"
              @keydown.enter="column.sortable !== false && handleSort(column.key)"
              @keydown.space.prevent="column.sortable !== false && handleSort(column.key)"
            >
              <div class="data-table__header-content">
                <span>{{ column.label }}</span>
                <span
                  v-if="column.sortable !== false && sortKey === column.key"
                  class="data-table__sort-icon"
                  :aria-label="`Sorted ${sortOrder === 'asc' ? 'ascending' : 'descending'}`"
                >
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
                <span v-if="column.sortable !== false" class="sr-only">
                  {{ sortKey === column.key ? `Sorted ${sortOrder === 'asc' ? 'ascending' : 'descending'}` : 'Not sorted' }}. Press Enter or Space to sort.
                </span>
              </div>
            </th>
            <th 
              v-if="hasActions" 
              class="data-table__header"
              role="columnheader"
              aria-label="Actions"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          <tr
            v-for="(row, index) in paginatedData"
            :key="getRowKey(row, index)"
            class="data-table__row"
            role="row"
            :aria-rowindex="startIndex + index + 1"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="data-table__cell"
              role="cell"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getNestedValue(row, column.key)"
              >
                {{ formatCell(row, column) }}
              </slot>
            </td>
            <td 
              v-if="hasActions" 
              class="data-table__cell data-table__actions"
              role="cell"
              aria-label="Row actions"
            >
              <slot name="actions" :row="row"/>
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0" role="row">
            <td 
              :colspan="columns.length + (hasActions ? 1 : 0)" 
              class="data-table__empty"
              role="cell"
            >
              {{ emptyMessage }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav 
      v-if="paginated && totalPages > 1" 
      class="data-table__pagination"
      role="navigation"
      aria-label="Table pagination"
    >
      <div 
        class="data-table__pagination-info"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredData.length }} entries
      </div>
      <div class="data-table__pagination-controls">
        <button
          :disabled="currentPage === 1"
          class="data-table__pagination-btn"
          type="button"
          aria-label="Go to previous page"
          :aria-disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'data-table__pagination-btn',
            { 'data-table__pagination-btn--active': page === currentPage },
          ]"
          type="button"
          :aria-label="`Go to page ${page}`"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="data-table__pagination-btn"
          type="button"
          aria-label="Go to next page"
          :aria-disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Column {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any, row: any) => string
}

interface Props {
  columns: Column[]
  data: any[]
  searchable?: boolean
  searchPlaceholder?: string
  paginated?: boolean
  perPage?: number
  rowKey?: string
  emptyMessage?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  searchable: true,
  searchPlaceholder: 'Search...',
  paginated: true,
  perPage: 10,
  rowKey: 'id',
  emptyMessage: 'No data available',
})

// Generate unique table ID for accessibility
const tableId = ref(`table-${Math.random().toString(36).substr(2, 9)}`)

const emit = defineEmits<{
  'page-change': [page: number]
  'sort-change': [key: string, order: 'asc' | 'desc']
}>()

const slots = defineSlots()
const hasActions = computed(() => !!slots.actions)

// Search
const searchQuery = ref('')

// Sorting
const sortKey = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Pagination
const currentPage = ref(1)

// Filtered data based on search
const filteredData = computed(() => {
  if (!searchQuery.value) return props.data

  const query = searchQuery.value.toLowerCase()
  return props.data.filter((row) => {
    return props.columns.some((column) => {
      const value = getNestedValue(row, column.key)
      return String(value).toLowerCase().includes(query)
    })
  })
})

// Sorted data
const sortedData = computed(() => {
  if (!sortKey.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    const aVal = getNestedValue(a, sortKey.value)
    const bVal = getNestedValue(b, sortKey.value)

    let comparison = 0
    if (aVal > bVal) comparison = 1
    if (aVal < bVal) comparison = -1

    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

// Paginated data
const totalPages = computed(() => {
  if (!props.paginated) return 1
  return Math.ceil(sortedData.value.length / props.perPage)
})

const startIndex = computed(() => {
  if (!props.paginated) return 0
  return (currentPage.value - 1) * props.perPage
})

const endIndex = computed(() => {
  if (!props.paginated) return sortedData.value.length
  return Math.min(startIndex.value + props.perPage, sortedData.value.length)
})

const paginatedData = computed(() => {
  if (!props.paginated) return sortedData.value
  return sortedData.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Methods
function handleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  emit('sort-change', sortKey.value, sortOrder.value)
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    emit('page-change', page)
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

function formatCell(row: any, column: Column): string {
  const value = getNestedValue(row, column.key)
  if (column.formatter) {
    return column.formatter(value, row)
  }
  return value ?? '-'
}

function getRowKey(row: any, index: number): string | number {
  return getNestedValue(row, props.rowKey) ?? index
}

function getSortAriaValue(columnKey: string): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== columnKey) return 'none'
  return sortOrder.value === 'asc' ? 'ascending' : 'descending'
}

// Reset to page 1 when search changes
watch(searchQuery, () => {
  currentPage.value = 1
})

// Reset to page 1 when data changes
watch(() => props.data, () => {
  currentPage.value = 1
})
</script>

<style scoped lang="scss">
@use './data-table';
</style>
