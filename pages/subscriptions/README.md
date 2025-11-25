# Subscription Management Pages

This directory contains the pages for managing tenant subscriptions in the super-admin panel.

## Pages

### `/subscriptions` (index.vue)
The main subscription management page that displays a list of all subscriptions.

**Features:**
- Summary cards showing total subscriptions, MRR, ARR, and active count
- Filtering by status, plan, billing cycle, and search
- Paginated subscription list
- Navigation to subscription details
- Create new subscription button

**Components Used:**
- `SubscriptionList` - Main list component with filters and pagination

### `/subscriptions/new` (new.vue)
Page for creating a new subscription for a tenant.

**Features:**
- Tenant selection dropdown
- Plan selection with visual cards
- Billing cycle configuration (monthly/yearly)
- Start and end date selection
- Trial period configuration
- Form validation

**Components Used:**
- `SubscriptionForm` - Form component for creating subscriptions

### `/subscriptions/[id]` ([id].vue)
Detailed view of a specific subscription with modification capabilities.

**Features:**
- Subscription overview with status and plan details
- Plan features display
- Payment method information
- Action buttons for:
  - Extending trial period
  - Changing plan
  - Applying discounts
  - Canceling subscription
- Billing history section
- Modal dialogs for each action

**Components Used:**
- `SubscriptionDetails` - Main details component
- `BillingHistory` - Billing history table
- `ChangePlanModal` - Modal for changing subscription plan
- `ExtendTrialModal` - Modal for extending trial period
- `ApplyDiscountModal` - Modal for applying discounts
- `CancelSubscriptionModal` - Modal for canceling subscription

## Navigation Flow

```
/subscriptions (List)
    ├─> /subscriptions/new (Create)
    │       └─> /subscriptions/[id] (Details) [on success]
    │
    └─> /subscriptions/[id] (Details)
            └─> Back to /subscriptions
```

## State Management

All pages use the `useSubscriptionStore` Pinia store for:
- Fetching subscriptions with filters and pagination
- Creating new subscriptions
- Fetching subscription details
- Modifying subscriptions (plan change, trial extension, discount, cancellation)
- Fetching billing history

## Requirements Covered

This implementation covers the following requirements from the spec:

- **1.1-1.5**: Subscription list with filtering, search, and status indicators
- **2.1-2.5**: Subscription creation with tenant/plan selection and trial configuration
- **3.1-3.5**: Subscription modification (plan change, trial extension, discount)
- **4.1-4.5**: Subscription cancellation and lifecycle management

## API Endpoints Used

- `GET /api/admin/subscriptions` - List subscriptions with filters
- `POST /api/admin/subscriptions` - Create new subscription
- `GET /api/admin/subscriptions/:id` - Get subscription details
- `PATCH /api/admin/subscriptions/:id/change-plan` - Change subscription plan
- `POST /api/admin/subscriptions/:id/extend-trial` - Extend trial period
- `POST /api/admin/subscriptions/:id/apply-discount` - Apply discount
- `POST /api/admin/subscriptions/:id/cancel` - Cancel subscription
- `GET /api/admin/subscriptions/:id/billing-history` - Get billing history
- `GET /api/admin/plans` - Get available plans
- `GET /api/admin/tenants` - Get tenants for selection
