<template>
  <div class="menu-item-new-page">
    <!-- Breadcrumbs -->
    <nav class="menu-item-new-page__breadcrumbs">
      <NuxtLink to="/tenants" class="menu-item-new-page__breadcrumb">
        Tenants
      </NuxtLink>
      <span class="menu-item-new-page__breadcrumb-separator">/</span>
      <NuxtLink :to="`/tenants/${tenantId}`" class="menu-item-new-page__breadcrumb">
        {{ tenantName || 'Tenant Details' }}
      </NuxtLink>
      <span class="menu-item-new-page__breadcrumb-separator">/</span>
      <NuxtLink :to="`/tenants/${tenantId}/menus`" class="menu-item-new-page__breadcrumb">
        Menus
      </NuxtLink>
      <span class="menu-item-new-page__breadcrumb-separator">/</span>
      <NuxtLink
        :to="`/tenants/${tenantId}/menus/${menuId}`"
        class="menu-item-new-page__breadcrumb"
      >
        {{ menuName || 'Menu Items' }}
      </NuxtLink>
      <span class="menu-item-new-page__breadcrumb-separator">/</span>
      <span class="menu-item-new-page__breadcrumb menu-item-new-page__breadcrumb--active">
        New Item
      </span>
    </nav>

    <!-- Loading State -->
    <div v-if="loading && categories.length === 0" class="menu-item-new-page__loading">
      <div class="menu-item-new-page__spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="menu-item-new-page__error">
      <h2>Failed to load categories</h2>
      <p>{{ error }}</p>
      <button @click="retryFetch">Retry</button>
      <button @click="goBack">Go Back</button>
    </div>

    <!-- Page Content -->
    <div v-else class="menu-item-new-page__content">
      <!-- Page Header -->
      <div class="menu-item-new-page__header">
        <h1 class="menu-item-new-page__title">Create Menu Item</h1>
        <p class="menu-item-new-page__subtitle">
          Add a new item to {{ menuName || 'this menu' }}
        </p>
      </div>

      <!-- Form Card -->
      <div class="menu-item-new-page__card">
        <MenuItemForm
          :categories="categories"
          :loading="createLoading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTenantStore } from '~/stores/tenant'
import { useMenuStore } from '~/stores/menu'
import MenuItemForm from '~/components/menu/MenuItemForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const tenantStore = useTenantStore()
const menuStore = useMenuStore()
const { showNotification } = useNotification()

const tenantId = computed(() => route.params.id as string)
const menuId = computed(() => route.params.menuId as string)
const tenant = computed(() => tenantStore.currentTenant)
const tenantName = computed(() => tenant.value?.name || '')
const currentMenu = computed(() => menuStore.currentMenu)
const menuName = computed(() => currentMenu.value?.name || '')
const categories = computed(() => menuStore.categories)
const loading = computed(() => menuStore.loading)
const error = computed(() => menuStore.error)

const createLoading = ref(false)

async function fetchData(): Promise<void> {
  try {
    await Promise.all([
      tenantStore.fetchTenantDetails(tenantId.value),
      menuStore.fetchMenuDetails(tenantId.value, menuId.value),
      menuStore.fetchCategories(tenantId.value),
    ])
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

function retryFetch(): void {
  menuStore.clearError()
  fetchData()
}

function goBack(): void {
  router.push(`/tenants/${tenantId.value}/menus/${menuId.value}`)
}

function handleCancel(): void {
  goBack()
}

async function handleSubmit(data: any): Promise<void> {
  createLoading.value = true

  try {
    await menuStore.createMenuItem(tenantId.value, menuId.value, data)
    
    showNotification({
      type: 'success',
      message: 'Menu item created successfully',
    })

    // Navigate back to menu items list
    router.push(`/tenants/${tenantId.value}/menus/${menuId.value}`)
  } catch (error: any) {
    showNotification({
      type: 'error',
      message: error.message || 'Failed to create menu item',
    })
  } finally {
    createLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
@use '../../../../../../assets/scss/variables' as *;

.menu-item-new-page {
  padding: $spacing-lg;
  min-height: 100vh;
}

.menu-item-new-page__breadcrumbs {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
  font-size: 0.875rem;
  flex-wrap: wrap;
}

.menu-item-new-page__breadcrumb {
  color: $primary-color;
  text-decoration: none;
  transition: $transition-base;

  &:hover {
    color: darken($primary-color, 10%);
    text-decoration: underline;
  }
}

.menu-item-new-page__breadcrumb--active {
  color: $text-secondary;
  pointer-events: none;
}

.menu-item-new-page__breadcrumb-separator {
  color: $text-secondary;
}

.menu-item-new-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: $spacing-md;

  p {
    color: $text-secondary;
  }
}

.menu-item-new-page__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid $bg-secondary;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.menu-item-new-page__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: $spacing-md;
  text-align: center;

  h2 {
    color: $error-color;
    font-size: 1.5rem;
    margin: 0;
  }

  p {
    color: $text-secondary;
    margin: 0;
  }

  button {
    padding: $spacing-sm $spacing-lg;
    background: $primary-color;
    color: white;
    border: none;
    border-radius: $radius-md;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      background: darken($primary-color, 10%);
    }

    & + button {
      background: $bg-secondary;
      color: $text-primary;
      border: 1px solid $border-color;

      &:hover {
        background: darken($bg-secondary, 3%);
      }
    }
  }
}

.menu-item-new-page__content {
  max-width: 1200px;
  margin: 0 auto;
}

.menu-item-new-page__header {
  margin-bottom: $spacing-xl;
}

.menu-item-new-page__title {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
}

.menu-item-new-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
  margin: 0;
}

.menu-item-new-page__card {
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-xl;
}

@media (max-width: $breakpoint-md) {
  .menu-item-new-page {
    padding: $spacing-md;
  }

  .menu-item-new-page__title {
    font-size: 1.5rem;
  }

  .menu-item-new-page__card {
    padding: $spacing-lg;
  }
}
</style>
