<template>
  <div class="new-subscription-page">
    <!-- Header -->
    <div class="new-subscription-page__header">
      <button class="new-subscription-page__back-btn" @click="goBack">
        ← Back to Subscriptions
      </button>
      <h1 class="new-subscription-page__title">Create New Subscription</h1>
      <p class="new-subscription-page__subtitle">
        Create and assign a subscription to a tenant
      </p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="new-subscription-page__error">
      <p>{{ error }}</p>
      <button @click="clearError">Dismiss</button>
    </div>

    <!-- Subscription Form -->
    <SubscriptionForm
      :available-plans="availablePlans"
      :tenants="tenants"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '~/stores/subscription'
import SubscriptionForm from '~/components/subscription/SubscriptionForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const subscriptionStore = useSubscriptionStore()
const notification = useNotification()

const loading = ref(false)
const error = ref<string | null>(null)
const availablePlans = ref<any[]>([])
const tenants = ref<any[]>([])

function goBack(): void {
  router.push('/subscriptions')
}

function handleCancel(): void {
  router.push('/subscriptions')
}

async function handleSubmit(data: any): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const subscription = await subscriptionStore.createSubscription(data)
    notification.success('Subscription created successfully')
    router.push(`/subscriptions/${subscription.id}`)
  } catch (err: any) {
    error.value = err.message || 'Failed to create subscription'
    notification.error('Failed to create subscription')
    console.error('Failed to create subscription:', err)
  } finally {
    loading.value = false
  }
}

function clearError(): void {
  error.value = null
}

async function fetchPlans(): Promise<void> {
  try {
    // Fetch available plans from the store or API
    const plans = await subscriptionStore.fetchPlans()
    availablePlans.value = plans
  } catch (err) {
    console.error('Failed to fetch plans:', err)
    error.value = 'Failed to load plans'
  }
}

async function fetchTenants(): Promise<void> {
  try {
    const { apiService } = useApi()
    const response = await apiService.get('/api/admin/tenants', {
      params: { limit: 1000 }, // Get all tenants for selection
    })
    tenants.value = response.data || []
  } catch (err) {
    console.error('Failed to fetch tenants:', err)
    error.value = 'Failed to load tenants'
  }
}

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    fetchPlans(),
    fetchTenants(),
  ])
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.new-subscription-page {
  padding: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;
}

.new-subscription-page__header {
  margin-bottom: $spacing-xl;
}

.new-subscription-page__back-btn {
  padding: $spacing-xs $spacing-md;
  background: transparent;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition-base;
  margin-bottom: $spacing-md;

  &:hover {
    background: $bg-secondary;
    color: $text-primary;
  }
}

.new-subscription-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.new-subscription-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.new-subscription-page__error {
  padding: $spacing-md;
  background: lighten($error-color, 40%);
  border: 1px solid $error-color;
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;

  p {
    color: $error-color;
    margin: 0;
  }

  button {
    padding: $spacing-xs $spacing-md;
    background: $error-color;
    color: white;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      background: darken($error-color, 10%);
    }
  }
}
</style>
