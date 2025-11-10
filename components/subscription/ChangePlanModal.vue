<template>
  <FormDialog
    v-model="isOpen"
    title="Change Subscription Plan"
    submit-text="Change Plan"
    cancel-text="Cancel"
    :loading="loading"
    loading-text="Changing plan..."
    size="lg"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="change-plan-modal">
      <div class="change-plan-modal__info">
        <p class="change-plan-modal__current">
          Current Plan: <strong>{{ currentPlan?.name }}</strong> 
          ({{ formatCurrency(currentPlan?.price || 0) }}/{{ billingCycle === 'monthly' ? 'month' : 'year' }})
        </p>
      </div>

      <div class="change-plan-modal__plans">
        <div
          v-for="plan in availablePlans"
          :key="plan.id"
          :class="[
            'plan-card',
            { 'plan-card--selected': selectedPlanId === plan.id },
            { 'plan-card--current': plan.id === currentPlan?.id }
          ]"
          @click="selectPlan(plan)"
        >
          <div class="plan-card__header">
            <h4 class="plan-card__name">{{ plan.name }}</h4>
            <div class="plan-card__price">
              {{ formatCurrency(plan.price) }}
              <span class="plan-card__period">/{{ billingCycle === 'monthly' ? 'mo' : 'yr' }}</span>
            </div>
          </div>

          <ul class="plan-card__features">
            <li v-for="feature in plan.features" :key="feature" class="plan-card__feature">
              <span class="plan-card__feature-icon">✓</span>
              {{ feature }}
            </li>
          </ul>

          <div v-if="plan.id === currentPlan?.id" class="plan-card__badge">
            Current Plan
          </div>
        </div>
      </div>

      <div v-if="selectedPlanId && selectedPlanId !== currentPlan?.id" class="change-plan-modal__proration">
        <div class="proration-info">
          <h4 class="proration-info__title">Proration Details</h4>
          <div class="proration-info__row">
            <span class="proration-info__label">New Plan Price:</span>
            <span class="proration-info__value">{{ formatCurrency(selectedPlanPrice) }}</span>
          </div>
          <div class="proration-info__row">
            <span class="proration-info__label">Prorated Amount:</span>
            <span class="proration-info__value">{{ formatCurrency(proratedAmount) }}</span>
          </div>
          <div class="proration-info__row proration-info__row--total">
            <span class="proration-info__label">Amount Due Today:</span>
            <span class="proration-info__value">{{ formatCurrency(amountDueToday) }}</span>
          </div>
          <p class="proration-info__note">
            {{ proratedAmount >= 0 
              ? 'You will be charged the prorated amount for the remainder of the current billing period.' 
              : 'The credit will be applied to your next billing cycle.' 
            }}
          </p>
        </div>
      </div>

      <div v-if="selectedPlanId && selectedPlanId !== currentPlan?.id" class="change-plan-modal__confirmation">
        <FormCheckbox
          v-model="confirmed"
          label="I understand that this change will take effect immediately"
        />
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '~/components/ui/Modal/FormDialog.vue'
import FormCheckbox from '~/components/ui/FormCheckbox.vue'

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
}

interface Props {
  modelValue: boolean
  currentPlan: Plan | null
  billingCycle: 'monthly' | 'yearly'
  availablePlans: Plan[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  availablePlans: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'change-plan': [planId: string]
  cancel: []
}>()

const isOpen = ref(props.modelValue)
const selectedPlanId = ref<string | null>(null)
const confirmed = ref(false)

const selectedPlan = computed(() => {
  return props.availablePlans.find(p => p.id === selectedPlanId.value)
})

const selectedPlanPrice = computed(() => {
  return selectedPlan.value?.price || 0
})

// Simplified proration calculation (in real app, this would come from backend)
const proratedAmount = computed(() => {
  if (!selectedPlan.value || !props.currentPlan) return 0
  
  const priceDiff = selectedPlan.value.price - props.currentPlan.price
  // Assume 15 days remaining in billing period for demo
  const daysRemaining = 15
  const daysInPeriod = props.billingCycle === 'monthly' ? 30 : 365
  
  return (priceDiff * daysRemaining) / daysInPeriod
})

const amountDueToday = computed(() => {
  return Math.max(0, proratedAmount.value)
})

watch(() => props.modelValue, (value) => {
  isOpen.value = value
  if (value) {
    selectedPlanId.value = null
    confirmed.value = false
  }
})

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

function selectPlan(plan: Plan) {
  if (plan.id === props.currentPlan?.id) return
  selectedPlanId.value = plan.id
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function handleSubmit() {
  if (!selectedPlanId.value || selectedPlanId.value === props.currentPlan?.id) {
    return
  }
  
  if (!confirmed.value) {
    return
  }
  
  emit('change-plan', selectedPlanId.value)
}

function handleCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.change-plan-modal__info {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.change-plan-modal__current {
  margin: 0;
  font-size: 0.875rem;
  color: $text-secondary;

  strong {
    color: $text-primary;
    font-weight: 600;
  }
}

.change-plan-modal__plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.plan-card {
  position: relative;
  padding: $spacing-lg;
  border: 2px solid $border-color;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    border-color: $primary-color;
    box-shadow: $shadow-md;
  }
}

.plan-card--selected {
  border-color: $primary-color;
  background: lighten($primary-color, 45%);
}

.plan-card--current {
  border-color: $success-color;
  cursor: default;

  &:hover {
    border-color: $success-color;
    box-shadow: none;
  }
}

.plan-card__header {
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.plan-card__name {
  margin: 0 0 $spacing-xs 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
}

.plan-card__price {
  font-size: 1.5rem;
  font-weight: 700;
  color: $primary-color;
}

.plan-card__period {
  font-size: 0.875rem;
  font-weight: 400;
  color: $text-secondary;
}

.plan-card__features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.plan-card__feature {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.875rem;
  color: $text-primary;
}

.plan-card__feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: lighten($success-color, 40%);
  color: $success-color;
  border-radius: 50%;
  font-size: 0.625rem;
  font-weight: 700;
}

.plan-card__badge {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  padding: $spacing-xs $spacing-sm;
  background: $success-color;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: $radius-sm;
}

.change-plan-modal__proration {
  margin-bottom: $spacing-lg;
}

.proration-info {
  padding: $spacing-lg;
  background: lighten($info-color, 45%);
  border: 1px solid lighten($info-color, 30%);
  border-radius: $radius-md;
}

.proration-info__title {
  margin: 0 0 $spacing-md 0;
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
}

.proration-info__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1px solid lighten($info-color, 35%);

  &:last-of-type {
    border-bottom: none;
  }
}

.proration-info__row--total {
  margin-top: $spacing-sm;
  padding-top: $spacing-md;
  border-top: 2px solid lighten($info-color, 30%);
  font-weight: 600;
  font-size: 1.125rem;
}

.proration-info__label {
  color: $text-secondary;
}

.proration-info__value {
  color: $text-primary;
  font-weight: 500;
}

.proration-info__note {
  margin: $spacing-md 0 0 0;
  font-size: 0.75rem;
  color: $text-secondary;
  font-style: italic;
}

.change-plan-modal__confirmation {
  padding: $spacing-md;
  background: lighten($warning-color, 45%);
  border: 1px solid lighten($warning-color, 30%);
  border-radius: $radius-md;
}

@media (max-width: $breakpoint-md) {
  .change-plan-modal__plans {
    grid-template-columns: 1fr;
  }
}
</style>
