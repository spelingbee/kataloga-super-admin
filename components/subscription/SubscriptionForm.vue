<template>
  <div class="subscription-form">
    <form @submit.prevent="handleSubmit">
      <div class="subscription-form__section">
        <h3 class="subscription-form__section-title">Tenant Information</h3>
        
        <FormSelect
          v-model="formData.tenantId"
          label="Tenant"
          :options="tenantOptions"
          option-label="label"
          option-value="value"
          placeholder="Select a tenant"
          required
          :error="errors.tenantId"
          hint="Select the tenant for this subscription"
          @change="handleTenantChange"
        />
      </div>

      <div class="subscription-form__section">
        <h3 class="subscription-form__section-title">Plan Selection</h3>
        
        <div class="subscription-form__plans">
          <div
            v-for="plan in availablePlans"
            :key="plan.id"
            :class="[
              'plan-card',
              { 'plan-card--selected': formData.planId === plan.id }
            ]"
            @click="selectPlan(plan)"
          >
            <div class="plan-card__header">
              <h4 class="plan-card__name">{{ plan.name }}</h4>
              <div class="plan-card__price">
                {{ formatCurrency(plan.price) }}
                <span class="plan-card__period">/{{ formData.billingCycle === 'monthly' ? 'mo' : 'yr' }}</span>
              </div>
            </div>

            <ul class="plan-card__features">
              <li v-for="feature in plan.features" :key="feature" class="plan-card__feature">
                <span class="plan-card__feature-icon">✓</span>
                {{ feature }}
              </li>
            </ul>

            <div class="plan-card__limits">
              <div class="plan-card__limit">
                <span class="plan-card__limit-label">Max Users:</span>
                <span class="plan-card__limit-value">{{ plan.maxUsers }}</span>
              </div>
              <div class="plan-card__limit">
                <span class="plan-card__limit-label">Max Sites:</span>
                <span class="plan-card__limit-value">{{ plan.maxSites }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <p v-if="errors.planId" class="subscription-form__error">{{ errors.planId }}</p>
      </div>

      <div class="subscription-form__section">
        <h3 class="subscription-form__section-title">Billing Configuration</h3>
        
        <div class="subscription-form__row">
          <FormSelect
            v-model="formData.billingCycle"
            label="Billing Cycle"
            :options="billingCycleOptions"
            required
            :error="errors.billingCycle"
            hint="Select monthly or yearly billing"
          />
        </div>

        <div class="subscription-form__row subscription-form__row--two-cols">
          <FormDatePicker
            v-model="formData.startDate"
            label="Start Date"
            :min="minStartDate"
            :error="errors.startDate"
            hint="Subscription start date"
          />

          <FormDatePicker
            v-model="formData.endDate"
            label="End Date"
            :min="formData.startDate || minStartDate"
            :error="errors.endDate"
            hint="Subscription end date"
          />
        </div>
      </div>

      <div class="subscription-form__section">
        <h3 class="subscription-form__section-title">Trial Period</h3>
        
        <FormInput
          v-model="formData.trialDays"
          type="number"
          label="Trial Period (days)"
          placeholder="0"
          :min="0"
          :error="errors.trialDays"
          hint="Enter 0 for no trial period"
        />

        <div v-if="trialEndDate" class="subscription-form__trial-info">
          <p class="subscription-form__trial-text">
            Trial will end on: <strong>{{ formatDate(trialEndDate) }}</strong>
          </p>
        </div>
      </div>

      <div class="subscription-form__actions">
        <button
          type="button"
          class="subscription-form__button subscription-form__button--secondary"
          @click="handleCancel"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="subscription-form__button subscription-form__button--primary"
          :disabled="loading || !isFormValid"
        >
          {{ loading ? 'Creating...' : 'Create Subscription' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import FormInput from '~/components/ui/FormInput.vue'
import FormSelect from '~/components/ui/FormSelect.vue'
import FormDatePicker from '~/components/ui/FormDatePicker.vue'

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  maxUsers: number
  maxSites: number
  isActive: boolean
}

interface Tenant {
  id: string
  name: string
  slug: string
}

interface Props {
  availablePlans?: Plan[]
  tenants?: Tenant[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  availablePlans: () => [],
  tenants: () => [],
  loading: false,
})

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const formData = ref({
  tenantId: '',
  planId: '',
  billingCycle: 'monthly',
  startDate: '',
  endDate: '',
  trialDays: 0,
})

const errors = ref({
  tenantId: '',
  planId: '',
  billingCycle: '',
  startDate: '',
  endDate: '',
  trialDays: '',
})

const billingCycleOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const tenantOptions = computed(() => {
  return props.tenants.map(tenant => ({
    label: `${tenant.name} (${tenant.slug})`,
    value: tenant.id,
  }))
})

const minStartDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const trialEndDate = computed(() => {
  if (!formData.value.startDate || !formData.value.trialDays || formData.value.trialDays === 0) {
    return null
  }
  
  const startDate = new Date(formData.value.startDate)
  const trialEnd = new Date(startDate)
  trialEnd.setDate(trialEnd.getDate() + Number(formData.value.trialDays))
  
  return trialEnd
})

const isFormValid = computed(() => {
  return (
    formData.value.tenantId &&
    formData.value.planId &&
    formData.value.billingCycle &&
    !Object.values(errors.value).some(error => error !== '')
  )
})

watch(() => formData.value.billingCycle, (newCycle) => {
  if (formData.value.startDate && !formData.value.endDate) {
    calculateEndDate(newCycle)
  }
})

watch(() => formData.value.startDate, (newStartDate) => {
  if (newStartDate && !formData.value.endDate) {
    calculateEndDate(formData.value.billingCycle)
  }
  
  if (newStartDate && formData.value.endDate) {
    validateDates()
  }
})

watch(() => formData.value.endDate, () => {
  validateDates()
})

onMounted(() => {
  const today = new Date()
  formData.value.startDate = today.toISOString().split('T')[0]
  calculateEndDate(formData.value.billingCycle)
})

function selectPlan(plan: Plan) {
  formData.value.planId = plan.id
  errors.value.planId = ''
}

function handleTenantChange() {
  errors.value.tenantId = ''
}

function calculateEndDate(billingCycle: string) {
  if (!formData.value.startDate) return
  
  const startDate = new Date(formData.value.startDate)
  const endDate = new Date(startDate)
  
  if (billingCycle === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }
  
  formData.value.endDate = endDate.toISOString().split('T')[0]
}

function validateDates() {
  if (formData.value.startDate && formData.value.endDate) {
    const start = new Date(formData.value.startDate)
    const end = new Date(formData.value.endDate)
    
    if (end <= start) {
      errors.value.endDate = 'End date must be after start date'
    } else {
      errors.value.endDate = ''
    }
  }
}

function validateForm(): boolean {
  let isValid = true
  
  if (!formData.value.tenantId) {
    errors.value.tenantId = 'Please select a tenant'
    isValid = false
  }
  
  if (!formData.value.planId) {
    errors.value.planId = 'Please select a plan'
    isValid = false
  }
  
  if (!formData.value.billingCycle) {
    errors.value.billingCycle = 'Please select a billing cycle'
    isValid = false
  }
  
  if (formData.value.trialDays < 0) {
    errors.value.trialDays = 'Trial days cannot be negative'
    isValid = false
  }
  
  validateDates()
  if (errors.value.endDate) {
    isValid = false
  }
  
  return isValid
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }
  
  const submitData = {
    tenantId: formData.value.tenantId,
    planId: formData.value.planId,
    billingCycle: formData.value.billingCycle,
    startDate: formData.value.startDate ? new Date(formData.value.startDate).toISOString() : undefined,
    endDate: formData.value.endDate ? new Date(formData.value.endDate).toISOString() : undefined,
    trialDays: Number(formData.value.trialDays),
  }
  
  emit('submit', submitData)
}

function handleCancel() {
  emit('cancel')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.subscription-form {
  max-width: 1200px;
  margin: 0 auto;
}

.subscription-form__section {
  margin-bottom: $spacing-2xl;
  padding: $spacing-lg;
  background: $bg-primary;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.subscription-form__section-title {
  margin: 0 0 $spacing-lg 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  padding-bottom: $spacing-md;
  border-bottom: 2px solid $border-color;
}

.subscription-form__plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-md;
}

.plan-card {
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
  box-shadow: $shadow-md;
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
  margin: 0 0 $spacing-md 0;
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

.plan-card__limits {
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  gap: $spacing-md;
}

.plan-card__limit {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.plan-card__limit-label {
  font-size: 0.75rem;
  color: $text-secondary;
}

.plan-card__limit-value {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
}

.subscription-form__row {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.subscription-form__row--two-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;
}

.subscription-form__trial-info {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: lighten($info-color, 45%);
  border: 1px solid lighten($info-color, 30%);
  border-radius: $radius-md;
}

.subscription-form__trial-text {
  margin: 0;
  font-size: 0.875rem;
  color: $text-primary;

  strong {
    color: $info-color;
    font-weight: 600;
  }
}

.subscription-form__error {
  margin: $spacing-sm 0 0 0;
  font-size: 0.875rem;
  color: $error-color;
}

.subscription-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-2xl;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
}

.subscription-form__button {
  padding: $spacing-sm $spacing-lg;
  font-size: 1rem;
  font-weight: 500;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.subscription-form__button--primary {
  background: $primary-color;
  color: white;

  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
}

.subscription-form__button--secondary {
  background: $bg-secondary;
  color: $text-primary;
  border: 1px solid $border-color;

  &:hover:not(:disabled) {
    background: darken($bg-secondary, 5%);
  }
}

@media (max-width: $breakpoint-md) {
  .subscription-form__plans {
    grid-template-columns: 1fr;
  }

  .subscription-form__row--two-cols {
    grid-template-columns: 1fr;
  }

  .subscription-form__actions {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}
</style>
