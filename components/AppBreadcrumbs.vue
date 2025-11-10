<template>
  <nav v-if="breadcrumbs.length > 0" class="px-6 py-4 bg-white border-b border-gray-200">
    <ol class="flex items-center space-x-2 text-sm">
      <li v-for="(crumb, index) in breadcrumbs" :key="crumb.path" class="flex items-center">
        <NuxtLink
          v-if="index < breadcrumbs.length - 1"
          :to="crumb.path"
          class="text-gray-500 hover:text-gray-700"
        >
          {{ crumb.name }}
        </NuxtLink>
        <span v-else class="font-medium text-gray-900">
          {{ crumb.name }}
        </span>
        <svg
          v-if="index < breadcrumbs.length - 1"
          class="w-4 h-4 mx-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface Breadcrumb {
  name: string
  path: string
}

const route = useRoute()

const breadcrumbs = computed<Breadcrumb[]>(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  
  if (pathSegments.length === 0) {
    return []
  }

  const crumbs: Breadcrumb[] = [{ name: 'Home', path: '/' }]
  
  let currentPath = ''
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`
    const name = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    crumbs.push({ name, path: currentPath })
  })

  return crumbs
})
</script>
