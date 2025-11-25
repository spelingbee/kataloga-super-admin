<template>
  <div class="tenant-menus-page">
    <!-- Breadcrumbs -->
    <nav class="tenant-menus-page__breadcrumbs">
      <NuxtLink to="/tenants" class="tenant-menus-page__breadcrumb">
        Tenants
      </NuxtLink>
      <span class="tenant-menus-page__breadcrumb-separator">/</span>
      <NuxtLink :to="`/tenants/${tenantId}`" class="tenant-menus-page__breadcrumb">
        {{ tenantName || 'Tenant Details' }}
      </NuxtLink>
      <span class="tenant-menus-page__breadcrumb-separator">/</span>
      <span class="tenant-menus-page__breadcrumb tenant-menus-page__breadcrumb--active">
        Menus
      </span>
    </nav>

    <!-- Page Header -->
    <div class="tenant-menus-page__header">
      <div class="tenant-menus-page__title-section">
        <h1 class="tenant-menus-page__title">Menu Management</h1>
        <p class="tenant-menus-page__subtitle">
          Manage menus for {{ tenantName || 'this tenant' }}
        </p>
      </div>
    </div>

    <!-- Menu List Component -->
    <TenantMenuList
      :tenant-id="tenantId"
      @create-menu="handleCreateMenu"
      @select-menu="handleSelectMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTenantStore } from '~/stores/tenant'
import TenantMenuList from '~/components/tenant/TenantMenuList.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const tenantStore = useTenantStore()

const tenantId = computed(() => route.params.id as string)
const tenant = computed(() => tenantStore.currentTenant)
const tenantName = computed(() => tenant.value?.name || '')

async function fetchTenantDetails(): Promise<void> {
  try {
    await tenantStore.fetchTenantDetails(tenantId.value)
  } catch (error) {
    console.error('Failed to fetch tenant details:', error)
  }
}

function handleCreateMenu(): void {
  // TODO: Implement menu creation modal or navigate to creation page
  console.log('Create menu for tenant:', tenantId.value)
}

function handleSelectMenu(menuId: string): void {
  router.push(`/tenants/${tenantId.value}/menus/${menuId}`)
}

onMounted(() => {
  fetchTenantDetails()
})
</script>

<style scoped lang="scss">
@use '../../../assets/scss/variables' as *;

.tenant-menus-page {
  padding: $spacing-lg;
  min-height: 100vh;
}

.tenant-menus-page__breadcrumbs {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
  font-size: 0.875rem;
}

.tenant-menus-page__breadcrumb {
  color: $primary-color;
  text-decoration: none;
  transition: $transition-base;

  &:hover {
    color: darken($primary-color, 10%);
    text-decoration: underline;
  }
}

.tenant-menus-page__breadcrumb--active {
  color: $text-secondary;
  pointer-events: none;
}

.tenant-menus-page__breadcrumb-separator {
  color: $text-secondary;
}

.tenant-menus-page__header {
  margin-bottom: $spacing-xl;
}

.tenant-menus-page__title-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.tenant-menus-page__title {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
  margin: 0;
}

.tenant-menus-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
  margin: 0;
}

@media (max-width: $breakpoint-md) {
  .tenant-menus-page {
    padding: $spacing-md;
  }

  .tenant-menus-page__title {
    font-size: 1.5rem;
  }

  .tenant-menus-page__breadcrumbs {
    flex-wrap: wrap;
  }
}
</style>
