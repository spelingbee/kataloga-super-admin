# Plan Management Components

This directory contains components for managing subscription plans in the super-admin panel.

## Components

### PlanList.vue

Displays a grid of subscription plans with filtering and sorting capabilities.

**Props:**
- `plans`: Array of plan objects
- `loading`: Boolean indicating loading state
- `error`: Error message string (nullable)
- `filters`: Object containing filter settings (isActive, sortBy, sortOrder)

**Events:**
- `view(planId)`: Emitted when user clicks to view plan details
- `filter-change(filters)`: Emitted when filters are changed
- `retry()`: Emitted when user clicks retry after an error

**Features:**
- Grid layout with responsive design
- Filter by active/inactive status
- Sort by name, price, or creation date
- Display plan features, limits, and subscription count
- Visual indicators for active/inactive plans

### PlanForm.vue

Form component for creating and editing subscription plans.

**Props:**
- `plan`: Plan object for editing (optional, null for create mode)
- `loading`: Boolean indicating form submission state

**Events:**
- `submit(data)`: Emitted when form is submitted with valid data
- `cancel()`: Emitted when user cancels the form

**Features:**
- Create and edit modes
- Form validation
- Dynamic feature list management
- Price input with currency prefix
- Trial days configuration
- Active/inactive toggle

**Form Fields:**
- Plan Name (required)
- Price per month (required, min: 0)
- Max Users (required, min: 1)
- Max Sites (required, min: 1)
- Trial Days (optional, default: 14)
- Features (required, at least one)
- Active status (checkbox)

## Pages

### /plans (index.vue)

Main plan management page displaying all plans with statistics.

**Features:**
- Total plans count
- Active plans count
- Total subscriptions count
- Plan list with filtering
- Create new plan button

### /plans/new (new.vue)

Page for creating a new subscription plan.

**Features:**
- Plan creation form
- Form validation
- Error handling
- Success notification
- Redirect to plan details on success

### /plans/[id] ([id].vue)

Plan details and edit page.

**Features:**
- View plan information
- Edit plan details
- Deactivate plan
- View active subscriptions
- Display plan features
- Breadcrumb navigation

**View Mode:**
- Plan information card (name, price, limits, trial days)
- Features list
- Active subscriptions list

**Edit Mode:**
- Inline editing with PlanForm component
- Save/cancel actions

## Store

### usePlanStore

Pinia store for managing plan state and API interactions.

**State:**
- `plans`: Array of all plans
- `currentPlan`: Currently selected plan
- `loading`: Loading state
- `error`: Error message
- `filters`: Filter settings

**Getters:**
- `activePlans`: Filtered list of active plans
- `inactivePlans`: Filtered list of inactive plans
- `totalSubscriptions`: Sum of all subscription counts

**Actions:**
- `fetchPlans()`: Fetch all plans with filters
- `fetchPlanDetails(planId)`: Fetch single plan details
- `createPlan(data)`: Create new plan
- `updatePlan(planId, data)`: Update existing plan
- `deactivatePlan(planId)`: Deactivate plan (soft delete)
- `setFilters(filters)`: Update filter settings
- `clearFilters()`: Reset filters
- `clearError()`: Clear error state
- `clearCurrentPlan()`: Clear current plan
- `resetState()`: Reset entire store state

## API Endpoints

All endpoints are prefixed with `/api/admin/plans`

- `GET /api/admin/plans` - List all plans
- `GET /api/admin/plans/:id` - Get plan details
- `POST /api/admin/plans` - Create new plan
- `PATCH /api/admin/plans/:id` - Update plan
- `DELETE /api/admin/plans/:id` - Deactivate plan

## Usage Example

```vue
<script setup>
import { usePlanStore } from '~/stores/plan'
import PlanList from '~/components/plan/PlanList.vue'

const planStore = usePlanStore()

onMounted(() => {
  planStore.fetchPlans()
})
</script>

<template>
  <PlanList
    :plans="planStore.plans"
    :loading="planStore.loading"
    :error="planStore.error"
    :filters="planStore.filters"
    @view="viewPlan"
    @filter-change="handleFilterChange"
  />
</template>
```

## Styling

All components follow the SCSS style guide:
- BEM methodology without nested selectors
- Variables for colors, spacing, and other design tokens
- Responsive design with mobile-first approach
- Consistent spacing and typography

## Requirements Coverage

This implementation covers requirements 5.1-5.5:
- **5.1**: List all plans with subscription count, create new plans
- **5.2**: Get plan details with features and pricing, update plans
- **5.3**: Update plan details (changes apply to new subscriptions only)
- **5.4**: Deactivate plans without affecting existing subscriptions
- **5.5**: Display subscription count per plan
