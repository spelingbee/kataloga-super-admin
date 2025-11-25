# Frontend Developer API Integration Guide

Quick reference guide for integrating with the Super Admin API in the frontend application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Common Patterns](#common-patterns)
3. [Component Examples](#component-examples)
4. [Store Integration](#store-integration)
5. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Authentication token stored in localStorage
- SUPER_ADMIN role assigned to user
- `useApi` composable available

### Basic API Call

```typescript
import { useApi } from '~/composables/useApi';

const { data, error, loading, execute } = useApi('/admin/subscriptions', {
  method: 'GET',
  query: { status: 'ACTIVE' }
});

// Access data
console.log(data.value);

// Check for errors
if (error.value) {
  console.error(error.value);
}
```

---

## Common Patterns

### 1. List with Filters

```vue
<script setup lang="ts">
const filters = ref({
  status: 'ACTIVE',
  search: '',
  limit: 50,
  offset: 0
});

const { data: subscriptions, loading, execute } = useApi('/admin/subscriptions', {
  method: 'GET',
  query: filters
});

const applyFilters = () => {
  execute();
};
</script>

<template>
  <div>
    <input v-model="filters.search" @input="applyFilters" placeholder="Search..." />
    <select v-model="filters.status" @change="applyFilters">
      <option value="">All</option>
      <option value="ACTIVE">Active</option>
      <option value="TRIAL">Trial</option>
    </select>
    
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="sub in subscriptions?.data" :key="sub.id">
        {{ sub.tenant.name }} - {{ sub.status }}
      </div>
    </div>
  </div>
</template>
```


### 2. Create Form

```vue
<script setup lang="ts">
const formData = ref({
  tenantId: '',
  planId: '',
  billingCycle: 'monthly',
  trialDays: 14
});

const formErrors = ref({});
const toast = useToast();

const createSubscription = async () => {
  const { data, error } = await useApi('/admin/subscriptions', {
    method: 'POST',
    body: formData.value
  });
  
  if (error.value) {
    if (error.value.statusCode === 409) {
      toast.error('Tenant already has an active subscription');
    } else {
      toast.error(error.value.message || 'Failed to create subscription');
    }
    return;
  }
  
  toast.success('Subscription created successfully');
  navigateTo(`/subscriptions/${data.value.id}`);
};
</script>

<template>
  <form @submit.prevent="createSubscription">
    <select v-model="formData.tenantId" required>
      <option value="">Select Tenant</option>
      <!-- Tenant options -->
    </select>
    
    <select v-model="formData.planId" required>
      <option value="">Select Plan</option>
      <!-- Plan options -->
    </select>
    
    <input v-model.number="formData.trialDays" type="number" min="0" />
    
    <button type="submit">Create Subscription</button>
  </form>
</template>
```

### 3. Update Action

```vue
<script setup lang="ts">
const props = defineProps<{
  subscriptionId: string;
}>();

const changePlan = async (newPlanId: string) => {
  const confirmed = await showConfirmDialog({
    title: 'Change Plan',
    message: 'Are you sure you want to change the plan?'
  });
  
  if (!confirmed) return;
  
  const { data, error } = await useApi(
    `/admin/subscriptions/${props.subscriptionId}/change-plan`,
    {
      method: 'PATCH',
      body: {
        newPlanId,
        reason: 'Admin requested plan change'
      }
    }
  );
  
  if (error.value) {
    toast.error('Failed to change plan');
    return;
  }
  
  toast.success('Plan changed successfully');
  // Refresh subscription data
};
</script>
```


### 4. Bulk Operations

```vue
<script setup lang="ts">
const selectedItems = ref<string[]>([]);
const menuItems = ref([]);

const bulkUpdate = async (updates: any) => {
  if (selectedItems.value.length === 0) {
    toast.warning('Please select items to update');
    return;
  }
  
  const { data, error } = await useApi(
    `/admin/tenants/${tenantId}/menus/${menuId}/items/bulk-update`,
    {
      method: 'POST',
      body: {
        itemIds: selectedItems.value,
        ...updates
      }
    }
  );
  
  if (error.value) {
    toast.error('Bulk update failed');
    return;
  }
  
  toast.success(`Updated ${data.value.affectedCount} items`);
  selectedItems.value = [];
  // Refresh items
};

const bulkActivate = () => bulkUpdate({ isActive: true });
const bulkDeactivate = () => bulkUpdate({ isActive: false });
</script>

<template>
  <div>
    <button @click="bulkActivate" :disabled="selectedItems.length === 0">
      Activate Selected ({{ selectedItems.length }})
    </button>
    <button @click="bulkDeactivate" :disabled="selectedItems.length === 0">
      Deactivate Selected ({{ selectedItems.length }})
    </button>
    
    <div v-for="item in menuItems" :key="item.id">
      <input 
        type="checkbox" 
        :value="item.id" 
        v-model="selectedItems"
      />
      {{ item.name }}
    </div>
  </div>
</template>
```

---

## Component Examples

### Subscription List Component

```vue
<!-- components/subscription/SubscriptionList.vue -->
<script setup lang="ts">
const filters = ref({
  status: '',
  search: '',
  limit: 50,
  offset: 0
});

const { data, loading, execute } = useApi('/admin/subscriptions', {
  method: 'GET',
  query: filters,
  immediate: true
});

const subscriptions = computed(() => data.value?.data || []);
const total = computed(() => data.value?.total || 0);

const handleSearch = useDebounceFn(() => {
  filters.value.offset = 0;
  execute();
}, 300);

const handlePageChange = (page: number) => {
  filters.value.offset = (page - 1) * filters.value.limit;
  execute();
};
</script>

<template>
  <div class="subscription-list">
    <div class="filters">
      <input 
        v-model="filters.search" 
        @input="handleSearch"
        placeholder="Search tenants..."
      />
      <select v-model="filters.status" @change="execute">
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="TRIAL">Trial</option>
        <option value="CANCELED">Canceled</option>
        <option value="EXPIRED">Expired</option>
      </select>
    </div>
    
    <div v-if="loading" class="loading">Loading subscriptions...</div>
    
    <div v-else class="subscriptions">
      <div 
        v-for="subscription in subscriptions" 
        :key="subscription.id"
        class="subscription-card"
      >
        <h3>{{ subscription.tenant.name }}</h3>
        <p>Plan: {{ subscription.plan.name }}</p>
        <p>Status: <span :class="`status-${subscription.status.toLowerCase()}`">
          {{ subscription.status }}
        </span></p>
        <p>Billing: {{ subscription.billingCycle }}</p>
        <NuxtLink :to="`/subscriptions/${subscription.id}`">
          View Details
        </NuxtLink>
      </div>
    </div>
    
    <Pagination 
      :total="total"
      :limit="filters.limit"
      :current-page="Math.floor(filters.offset / filters.limit) + 1"
      @page-change="handlePageChange"
    />
  </div>
</template>
```


### Menu Item Form Component

```vue
<!-- components/menu/MenuItemForm.vue -->
<script setup lang="ts">
const props = defineProps<{
  tenantId: string;
  menuId: string;
  itemId?: string; // For edit mode
}>();

const emit = defineEmits(['success', 'cancel']);

const formData = ref({
  name: '',
  description: '',
  price: 0,
  categoryId: '',
  imageUrl: '',
  isActive: true
});

const formErrors = ref({});
const loading = ref(false);

// Load existing item for edit mode
onMounted(async () => {
  if (props.itemId) {
    const { data } = await useApi(
      `/admin/tenants/${props.tenantId}/menus/${props.menuId}/items/${props.itemId}`,
      { method: 'GET' }
    );
    if (data.value) {
      formData.value = { ...data.value };
    }
  }
});

const validateForm = () => {
  const errors: any = {};
  
  if (!formData.value.name.trim()) {
    errors.name = 'Name is required';
  }
  
  if (formData.value.price < 0) {
    errors.price = 'Price must be 0 or greater';
  }
  
  if (!formData.value.categoryId) {
    errors.categoryId = 'Category is required';
  }
  
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  
  const endpoint = props.itemId
    ? `/admin/tenants/${props.tenantId}/menus/${props.menuId}/items/${props.itemId}`
    : `/admin/tenants/${props.tenantId}/menus/${props.menuId}/items`;
  
  const method = props.itemId ? 'PATCH' : 'POST';
  
  const { data, error } = await useApi(endpoint, {
    method,
    body: formData.value
  });
  
  loading.value = false;
  
  if (error.value) {
    toast.error(error.value.message || 'Failed to save menu item');
    return;
  }
  
  toast.success(`Menu item ${props.itemId ? 'updated' : 'created'} successfully`);
  emit('success', data.value);
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="menu-item-form">
    <div class="form-group">
      <label for="name">Name *</label>
      <input 
        id="name"
        v-model="formData.name" 
        type="text"
        required
        :class="{ 'error': formErrors.name }"
      />
      <span v-if="formErrors.name" class="error-message">
        {{ formErrors.name }}
      </span>
    </div>
    
    <div class="form-group">
      <label for="description">Description</label>
      <textarea 
        id="description"
        v-model="formData.description"
        rows="3"
      />
    </div>
    
    <div class="form-group">
      <label for="price">Price *</label>
      <input 
        id="price"
        v-model.number="formData.price" 
        type="number"
        step="0.01"
        min="0"
        required
        :class="{ 'error': formErrors.price }"
      />
      <span v-if="formErrors.price" class="error-message">
        {{ formErrors.price }}
      </span>
    </div>
    
    <div class="form-group">
      <label for="category">Category *</label>
      <select 
        id="category"
        v-model="formData.categoryId"
        required
        :class="{ 'error': formErrors.categoryId }"
      >
        <option value="">Select Category</option>
        <!-- Category options loaded from API -->
      </select>
      <span v-if="formErrors.categoryId" class="error-message">
        {{ formErrors.categoryId }}
      </span>
    </div>
    
    <div class="form-group">
      <label for="imageUrl">Image URL</label>
      <input 
        id="imageUrl"
        v-model="formData.imageUrl" 
        type="url"
      />
    </div>
    
    <div class="form-group">
      <label>
        <input 
          v-model="formData.isActive" 
          type="checkbox"
        />
        Active
      </label>
    </div>
    
    <div class="form-actions">
      <button type="button" @click="emit('cancel')">Cancel</button>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Saving...' : (itemId ? 'Update' : 'Create') }}
      </button>
    </div>
  </form>
</template>
```


---

## Store Integration

### Subscription Store Example

```typescript
// stores/subscription.ts
import { defineStore } from 'pinia';

export const useSubscriptionStore = defineStore('subscription', () => {
  const subscriptions = ref([]);
  const currentSubscription = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  const filters = ref({
    status: '',
    planId: '',
    search: '',
    limit: 50,
    offset: 0
  });

  const fetchSubscriptions = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: apiError } = await useApi('/admin/subscriptions', {
        method: 'GET',
        query: filters.value
      });
      
      if (apiError.value) {
        throw apiError.value;
      }
      
      subscriptions.value = data.value.data;
    } catch (err) {
      error.value = err;
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchSubscription = async (id: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: apiError } = await useApi(`/admin/subscriptions/${id}`, {
        method: 'GET'
      });
      
      if (apiError.value) {
        throw apiError.value;
      }
      
      currentSubscription.value = data.value;
    } catch (err) {
      error.value = err;
      console.error('Failed to fetch subscription:', err);
    } finally {
      loading.value = false;
    }
  };

  const createSubscription = async (subscriptionData: any) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: apiError } = await useApi('/admin/subscriptions', {
        method: 'POST',
        body: subscriptionData
      });
      
      if (apiError.value) {
        throw apiError.value;
      }
      
      // Refresh list
      await fetchSubscriptions();
      
      return data.value;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const changePlan = async (subscriptionId: string, newPlanId: string, reason?: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: apiError } = await useApi(
        `/admin/subscriptions/${subscriptionId}/change-plan`,
        {
          method: 'PATCH',
          body: { newPlanId, reason }
        }
      );
      
      if (apiError.value) {
        throw apiError.value;
      }
      
      // Update current subscription if it's the one being changed
      if (currentSubscription.value?.id === subscriptionId) {
        currentSubscription.value = data.value.subscription;
      }
      
      // Refresh list
      await fetchSubscriptions();
      
      return data.value;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const cancelSubscription = async (subscriptionId: string, reason: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: apiError } = await useApi(
        `/admin/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          body: { reason }
        }
      );
      
      if (apiError.value) {
        throw apiError.value;
      }
      
      // Update current subscription
      if (currentSubscription.value?.id === subscriptionId) {
        currentSubscription.value = data.value.subscription;
      }
      
      // Refresh list
      await fetchSubscriptions();
      
      return data.value;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = () => {
    filters.value = {
      status: '',
      planId: '',
      search: '',
      limit: 50,
      offset: 0
    };
  };

  return {
    subscriptions,
    currentSubscription,
    loading,
    error,
    filters,
    fetchSubscriptions,
    fetchSubscription,
    createSubscription,
    changePlan,
    cancelSubscription,
    setFilters,
    resetFilters
  };
});
```

### Using the Store in Components

```vue
<script setup lang="ts">
import { useSubscriptionStore } from '~/stores/subscription';

const subscriptionStore = useSubscriptionStore();
const { subscriptions, loading, filters } = storeToRefs(subscriptionStore);

onMounted(() => {
  subscriptionStore.fetchSubscriptions();
});

const handleFilterChange = () => {
  subscriptionStore.fetchSubscriptions();
};

const handleCreateSubscription = async (data: any) => {
  try {
    const newSubscription = await subscriptionStore.createSubscription(data);
    toast.success('Subscription created successfully');
    navigateTo(`/subscriptions/${newSubscription.id}`);
  } catch (err) {
    toast.error('Failed to create subscription');
  }
};
</script>

<template>
  <div>
    <input v-model="filters.search" @input="handleFilterChange" />
    
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="sub in subscriptions" :key="sub.id">
        {{ sub.tenant.name }}
      </div>
    </div>
  </div>
</template>
```


---

## Troubleshooting

### Common Issues and Solutions

#### 1. 401 Unauthorized Error

**Problem:** API returns 401 Unauthorized

**Solutions:**
- Check if auth token exists in localStorage
- Verify token hasn't expired
- Ensure token is included in Authorization header
- Try logging out and logging back in

```typescript
// Check token
const token = localStorage.getItem('auth_token');
if (!token) {
  navigateTo('/login');
}

// Verify token format in request
console.log('Authorization header:', `Bearer ${token}`);
```

#### 2. 403 Forbidden Error

**Problem:** API returns 403 Forbidden

**Solutions:**
- Verify user has SUPER_ADMIN role
- Check user permissions in database
- Ensure role is included in JWT token

```typescript
// Decode JWT to check role
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
};

const payload = decodeToken(token);
console.log('User role:', payload?.role);
```

#### 3. CORS Errors

**Problem:** CORS policy blocking requests

**Solutions:**
- Ensure backend CORS is configured correctly
- Check if API URL is correct
- Verify credentials are included in requests

```typescript
// In development, ensure proxy is configured
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

#### 4. Data Not Updating

**Problem:** UI not reflecting API changes

**Solutions:**
- Ensure reactive refs are used
- Check if data is being reassigned correctly
- Verify computed properties are updating
- Force component re-render if needed

```typescript
// ❌ Wrong - mutating array doesn't trigger reactivity
subscriptions.value.push(newSubscription);

// ✅ Correct - create new array
subscriptions.value = [...subscriptions.value, newSubscription];

// Or use reactive assignment
subscriptions.value = data.value.data;
```

#### 5. Pagination Not Working

**Problem:** Pagination returns same data

**Solutions:**
- Verify offset calculation is correct
- Check if limit and offset are being sent
- Ensure page changes trigger new API calls

```typescript
// Correct offset calculation
const offset = (currentPage - 1) * itemsPerPage;

// Ensure filters are reactive
const filters = ref({
  limit: 50,
  offset: 0
});

// Update offset on page change
const goToPage = (page: number) => {
  filters.value.offset = (page - 1) * filters.value.limit;
  fetchData(); // Trigger new API call
};
```

#### 6. Filters Not Applied

**Problem:** Filters not affecting results

**Solutions:**
- Verify filter values are being sent in query
- Check if empty strings should be excluded
- Ensure API call is triggered after filter change

```typescript
// Remove empty filter values
const cleanFilters = computed(() => {
  const clean: any = {};
  Object.entries(filters.value).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      clean[key] = value;
    }
  });
  return clean;
});

// Use cleaned filters in API call
const { data } = await useApi('/admin/subscriptions', {
  method: 'GET',
  query: cleanFilters.value
});
```

---

## Performance Tips

1. **Debounce Search Inputs**
   ```typescript
   import { useDebounceFn } from '@vueuse/core';
   
   const debouncedSearch = useDebounceFn(() => {
     fetchData();
   }, 300);
   ```

2. **Cache Frequently Accessed Data**
   ```typescript
   const plansCache = ref(null);
   const fetchPlans = async (forceRefresh = false) => {
     if (!forceRefresh && plansCache.value) {
       return plansCache.value;
     }
     // Fetch and cache
   };
   ```

3. **Use Virtual Scrolling for Large Lists**
   ```typescript
   import { useVirtualList } from '@vueuse/core';
   
   const { list, containerProps, wrapperProps } = useVirtualList(
     items,
     { itemHeight: 60 }
   );
   ```

4. **Lazy Load Components**
   ```typescript
   const HeavyComponent = defineAsyncComponent(() =>
     import('~/components/HeavyComponent.vue')
   );
   ```

---

## Additional Resources

- [Backend API Documentation](../backend/API_DOCUMENTATION.md)
- [Subscription API Details](../backend/src/subscription/SUPER_ADMIN_API.md)
- [Menu API Details](../backend/src/menu/SUPER_ADMIN_MENU_API.md)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

