<template>
  <div class="new-plan-page">
    <!-- Header -->
    <div class="new-plan-page__header">
      <button class="new-plan-page__back-btn" @click="goBack">
        ← Back to Plans
      </button>
      <h1 class="new-plan-page__title">Create New Plan</h1>
      <p class="new-plan-page__subtitle">
        Define a new subscription plan with features and pricing
      </p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="new-plan-page__error">
      <p>{{ error }}</p>
      <button @click="clearError">Dismiss</button>
    </div>

    <!-- Plan Form -->
    <PlanForm
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from '~/stores/plan'
import PlanForm from '~/components/plan/PlanForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'default',
})

const router = useRouter()
const planStore = usePlanStore()
const notification = useNotification()

const loading = ref(false)
const error = ref<string | null>(null)

function goBack(): void {
  router.push('/plans')
}

function handleCancel(): void {
  router.push('/plans')
}

async function handleSubmit(data: {
  name: string
  maxUsers: number
  maxSites: number
  price: number
  features: string[]
  trialDays: number
  isActive: boolean
}): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const plan = await planStore.createPlan(data)
    notification.success('Plan created successfully')
    router.push(`/plans/${plan.id}`)
  } catch (err: any) {
    error.value = err.message || 'Failed to create plan'
    notification.error('Failed to create plan')
    console.error('Failed to create plan:', err)
  } finally {
    loading.value = false
  }
}

function clearError(): void {
  error.value = null
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.new-plan-page {
  padding: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;
}

.new-plan-page__header {
  margin-bottom: $spacing-xl;
}

.new-plan-page__back-btn {
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

.new-plan-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.new-plan-page__subtitle {
  font-size: 1rem;
  color: $text-secondary;
}

.new-plan-page__error {
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
