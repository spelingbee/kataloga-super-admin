# Super Admin Panel - API Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Client Setup](#api-client-setup)
4. [Available Endpoints](#available-endpoints)
5. [Request/Response Formats](#requestresponse-formats)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Best Practices](#best-practices)

---

## Overview

The Super Admin Panel communicates with the backend API using RESTful HTTP requests. All API endpoints are protected and require authentication via JWT tokens.

### Base URL

**Development:**
```
http://localhost:3000
```

**Production:**
```
https://api.yourplatform.com
```

### API Version

Current API version: `v1`

All endpoints are prefixed with `/api/`

---

## Authentication

### Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@yourplatform.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 604800,
  "user": {
    "id": "user-id",
    "email": "admin@yourplatform.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }
}
```

### Token Refresh

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 604800
}
```

### Using Tokens

Include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## API Client Setup

### Composable Implementation

The Super Admin Panel uses a custom composable for API calls:

```typescript
// composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const api = $fetch.create({
    baseURL: config.public.apiUrl,
    
    onRequest({ options }) {
      const token = authStore.token
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      }
    },

    onResponseError({ response }) {
      if (response.status === 401) {
        // Token expired, try refresh
        authStore.refreshToken()
      }
    }
  })

  return { api }
}
```

### Usage Example

```typescript
// In a component or composable
const { api } = useApi()

// GET request
const tenants = await api('/api/admin/tenants')

// POST request
const newTenant = await api('/api/admin/tenants', {
  method: 'POST',
  body: {
    name: 'New Tenant',
    email: 'tenant@example.com'
  }
})

// PUT request
const updated = await api(`/api/admin/tenants/${id}`, {
  method: 'PUT',
  body: { status: 'active' }
})

// DELETE request
await api(`/api/admin/tenants/${id}`, {
  method: 'DELETE'
})
```

---

## Available Endpoints

### Dashboard

#### Get Dashboard Metrics

**Endpoint:** `GET /api/admin/dashboard/metrics`

**Response:**
```json
{
  "tenants": {
    "total": 150,
    "active": 120,
    "pending": 15,
    "suspended": 10,
    "growth": 12.5
  },
  "revenue": {
    "mrr": 15000,
    "arr": 180000,
    "growth": 8.3,
    "churnRate": 2.1
  },
  "registrations": {
    "today": 3,
    "thisWeek": 12,
    "thisMonth": 45,
    "pending": 15
  },
  "system": {
    "apiUptime": 99.9,
    "databaseStatus": "healthy",
    "emailDeliveryRate": 98.5,
    "storageUsed": 45.2
  }
}
```

#### Get Recent Activity

**Endpoint:** `GET /api/admin/dashboard/activity`

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 20)

**Response:**
```json
{
  "activities": [
    {
      "id": "activity-1",
      "type": "registration",
      "title": "New tenant registration",
      "description": "Restaurant ABC submitted registration",
      "timestamp": "2025-11-10T10:30:00Z",
      "severity": "info",
      "metadata": {
        "tenantId": "tenant-123",
        "tenantName": "Restaurant ABC"
      }
    }
  ]
}
```

### Tenant Management

#### List Tenants

**Endpoint:** `GET /api/admin/tenants`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `status` (optional): Filter by status (active, pending, suspended, deleted)
- `search` (optional): Search by name or email
- `sortBy` (optional): Sort field (name, createdAt, revenue)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "data": [
    {
      "id": "tenant-123",
      "name": "Restaurant ABC",
      "slug": "restaurant-abc",
      "businessType": "restaurant",
      "status": "active",
      "subscriptionPlan": "premium",
      "subscriptionStatus": "active",
      "createdAt": "2025-01-15T10:00:00Z",
      "lastActive": "2025-11-10T09:30:00Z",
      "revenue": 5000,
      "orderCount": 1250
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

#### Get Tenant Details

**Endpoint:** `GET /api/admin/tenants/:id/details`

**Response:**
```json
{
  "id": "tenant-123",
  "name": "Restaurant ABC",
  "slug": "restaurant-abc",
  "businessType": "restaurant",
  "status": "active",
  "owner": {
    "name": "John Doe",
    "email": "john@restaurant-abc.com",
    "phone": "+1234567890"
  },
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "subscription": {
    "plan": "premium",
    "status": "active",
    "billingCycle": "monthly",
    "currentPeriodStart": "2025-11-01T00:00:00Z",
    "currentPeriodEnd": "2025-12-01T00:00:00Z",
    "trialEndsAt": null
  },
  "statistics": {
    "totalOrders": 1250,
    "totalRevenue": 50000,
    "averageOrderValue": 40,
    "menuItemsCount": 85,
    "activeUsersCount": 15
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-11-10T09:30:00Z"
}
```

#### Activate Tenant

**Endpoint:** `POST /api/admin/tenants/:id/activate`

**Response:**
```json
{
  "success": true,
  "message": "Tenant activated successfully",
  "tenant": {
    "id": "tenant-123",
    "status": "active"
  }
}
```

#### Suspend Tenant

**Endpoint:** `POST /api/admin/tenants/:id/suspend`

**Request:**
```json
{
  "reason": "Payment overdue"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant suspended successfully"
}
```

#### Delete Tenant

**Endpoint:** `DELETE /api/admin/tenants/:id`

**Response:**
```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

### Registration Management

#### List Pending Registrations

**Endpoint:** `GET /api/admin/tenants/pending`

**Query Parameters:**
- `page`, `limit`, `search` (same as tenant list)

**Response:**
```json
{
  "data": [
    {
      "id": "tenant-456",
      "name": "New Restaurant",
      "businessType": "restaurant",
      "status": "pending",
      "owner": {
        "name": "Jane Smith",
        "email": "jane@newrestaurant.com",
        "phone": "+1234567890"
      },
      "submittedAt": "2025-11-09T14:30:00Z",
      "daysWaiting": 1
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

#### Approve Registration

**Endpoint:** `POST /api/admin/tenants/:id/approve`

**Request:**
```json
{
  "notes": "All documents verified"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "tenant": {
    "id": "tenant-456",
    "status": "active"
  }
}
```

#### Reject Registration

**Endpoint:** `POST /api/admin/tenants/:id/reject`

**Request:**
```json
{
  "reason": "incomplete_information",
  "message": "Please provide valid business license"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration rejected"
}
```

#### Request More Information

**Endpoint:** `POST /api/admin/tenants/:id/request-info`

**Request:**
```json
{
  "fields": ["business_license", "tax_id"],
  "message": "Please upload your business license and provide tax ID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Information request sent"
}
```

### Subscription Management

#### List Subscriptions

**Endpoint:** `GET /api/admin/subscriptions`

**Query Parameters:**
- `status` (optional): trial, active, cancelled, expired
- `plan` (optional): Filter by plan ID
- `page`, `limit`

**Response:**
```json
{
  "data": [
    {
      "id": "sub-123",
      "tenantId": "tenant-123",
      "tenantName": "Restaurant ABC",
      "plan": {
        "id": "plan-premium",
        "name": "Premium",
        "price": 99
      },
      "status": "active",
      "billingCycle": "monthly",
      "currentPeriodStart": "2025-11-01T00:00:00Z",
      "currentPeriodEnd": "2025-12-01T00:00:00Z",
      "trialEndsAt": null,
      "cancelledAt": null
    }
  ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

#### Get Subscription Details

**Endpoint:** `GET /api/admin/subscriptions/:id`

**Response:**
```json
{
  "id": "sub-123",
  "tenantId": "tenant-123",
  "tenantName": "Restaurant ABC",
  "plan": {
    "id": "plan-premium",
    "name": "Premium",
    "price": 99,
    "features": ["unlimited_orders", "advanced_analytics", "priority_support"]
  },
  "status": "active",
  "billingCycle": "monthly",
  "currentPeriodStart": "2025-11-01T00:00:00Z",
  "currentPeriodEnd": "2025-12-01T00:00:00Z",
  "trialEndsAt": null,
  "cancelledAt": null,
  "paymentMethod": {
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "expiryMonth": 12,
    "expiryYear": 2026
  }
}
```

#### Change Subscription Plan

**Endpoint:** `PATCH /api/admin/subscriptions/:id/change-plan`

**Request:**
```json
{
  "planId": "plan-enterprise",
  "prorate": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan changed successfully",
  "subscription": {
    "id": "sub-123",
    "plan": "enterprise",
    "proratedAmount": 150
  }
}
```

#### Extend Trial

**Endpoint:** `POST /api/admin/subscriptions/:id/extend-trial`

**Request:**
```json
{
  "trialEndsAt": "2025-12-01T00:00:00Z",
  "reason": "Customer requested extension"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trial extended successfully"
}
```

#### Apply Discount

**Endpoint:** `POST /api/admin/subscriptions/:id/apply-discount`

**Request:**
```json
{
  "type": "percentage",
  "value": 20,
  "durationMonths": 3,
  "reason": "Promotional discount"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Discount applied successfully",
  "discount": {
    "type": "percentage",
    "value": 20,
    "endsAt": "2026-02-01T00:00:00Z"
  }
}
```

#### Cancel Subscription

**Endpoint:** `POST /api/admin/subscriptions/:id/cancel`

**Request:**
```json
{
  "reason": "customer_request",
  "immediate": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled",
  "cancelledAt": "2025-12-01T00:00:00Z"
}
```

#### Get Billing History

**Endpoint:** `GET /api/admin/subscriptions/:id/billing-history`

**Response:**
```json
{
  "data": [
    {
      "id": "payment-123",
      "amount": 99,
      "status": "paid",
      "date": "2025-11-01T00:00:00Z",
      "invoiceUrl": "https://invoice.stripe.com/...",
      "paymentMethod": "card_****4242"
    }
  ]
}
```

### Analytics

#### Get Registration Analytics

**Endpoint:** `GET /api/admin/analytics/registrations`

**Query Parameters:**
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)

**Response:**
```json
{
  "metrics": {
    "total": 145,
    "approved": 120,
    "rejected": 15,
    "pending": 10,
    "conversionRate": 82.8
  },
  "timeline": [
    {
      "date": "2025-11-01",
      "registrations": 5,
      "approvals": 4,
      "rejections": 1
    }
  ]
}
```

#### Get Revenue Analytics

**Endpoint:** `GET /api/admin/analytics/revenue`

**Query Parameters:**
- `from`, `to`

**Response:**
```json
{
  "metrics": {
    "mrr": 15000,
    "arr": 180000,
    "growth": 8.3,
    "averageRevenuePerTenant": 125
  },
  "timeline": [
    {
      "date": "2025-11-01",
      "revenue": 15000,
      "newRevenue": 1200,
      "churnedRevenue": 300
    }
  ],
  "byPlan": [
    {
      "plan": "premium",
      "revenue": 9900,
      "tenants": 100
    },
    {
      "plan": "enterprise",
      "revenue": 5100,
      "tenants": 20
    }
  ]
}
```

### Email Management

#### Get Email Dashboard

**Endpoint:** `GET /api/admin/email/dashboard`

**Response:**
```json
{
  "metrics": {
    "totalSent": 10000,
    "delivered": 9850,
    "opened": 4925,
    "clicked": 1970,
    "bounced": 150,
    "deliveryRate": 98.5,
    "openRate": 50.0,
    "clickRate": 20.0,
    "bounceRate": 1.5
  }
}
```

#### List Emails

**Endpoint:** `GET /api/admin/email/list`

**Query Parameters:**
- `page`, `limit`
- `type`: Email type (welcome, notification, etc.)
- `status`: sent, delivered, bounced, opened
- `search`: Search by recipient or subject

**Response:**
```json
{
  "data": [
    {
      "id": "email-123",
      "type": "welcome",
      "subject": "Welcome to Platform",
      "recipient": "user@example.com",
      "status": "delivered",
      "sentAt": "2025-11-10T10:00:00Z",
      "deliveredAt": "2025-11-10T10:00:05Z",
      "openedAt": "2025-11-10T10:15:00Z"
    }
  ],
  "meta": {
    "total": 10000,
    "page": 1,
    "limit": 50,
    "totalPages": 200
  }
}
```

### Audit Logs

#### Get Audit Logs

**Endpoint:** `GET /api/admin/audit/logs`

**Query Parameters:**
- `page`, `limit`
- `action`: Filter by action type
- `user`: Filter by admin user
- `from`, `to`: Date range

**Response:**
```json
{
  "data": [
    {
      "id": "audit-123",
      "timestamp": "2025-11-10T10:30:00Z",
      "adminUser": "admin@platform.com",
      "action": "tenant.approve",
      "resource": "tenant",
      "resourceId": "tenant-123",
      "details": {
        "tenantName": "Restaurant ABC",
        "notes": "All documents verified"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "result": "success"
    }
  ],
  "meta": {
    "total": 5000,
    "page": 1,
    "limit": 50,
    "totalPages": 100
  }
}
```

### Security

#### Get Security Dashboard

**Endpoint:** `GET /api/admin/security/dashboard`

**Response:**
```json
{
  "metrics": {
    "failedLoginAttempts": 25,
    "blockedIPs": 5,
    "suspiciousActivities": 3,
    "activeAlerts": 2
  }
}
```

#### Get Security Events

**Endpoint:** `GET /api/admin/security/events`

**Query Parameters:**
- `page`, `limit`
- `severity`: low, medium, high, critical
- `from`, `to`

**Response:**
```json
{
  "data": [
    {
      "id": "event-123",
      "type": "failed_login",
      "severity": "medium",
      "timestamp": "2025-11-10T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "details": {
        "email": "admin@platform.com",
        "attempts": 5
      }
    }
  ]
}
```

#### Block IP Address

**Endpoint:** `POST /api/admin/security/block-ip`

**Request:**
```json
{
  "ipAddress": "192.168.1.100",
  "duration": "24h",
  "reason": "Multiple failed login attempts"
}
```

**Response:**
```json
{
  "success": true,
  "message": "IP address blocked",
  "expiresAt": "2025-11-11T10:30:00Z"
}
```

---

## Request/Response Formats

### Standard Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Pagination

Paginated responses include metadata:

```json
{
  "data": [ /* items */ ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Invalid credentials |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

### Error Handling Example

```typescript
try {
  const tenant = await api('/api/admin/tenants/123')
} catch (error) {
  if (error.statusCode === 404) {
    console.error('Tenant not found')
  } else if (error.statusCode === 401) {
    // Redirect to login
    navigateTo('/login')
  } else {
    console.error('An error occurred:', error.message)
  }
}
```

---

## Rate Limiting

### Limits

- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699632000
```

### Handling Rate Limits

```typescript
const { api } = useApi()

try {
  const data = await api('/api/admin/tenants')
} catch (error) {
  if (error.statusCode === 429) {
    const resetTime = error.headers['x-ratelimit-reset']
    console.log(`Rate limit exceeded. Resets at ${new Date(resetTime * 1000)}`)
  }
}
```

---

## Best Practices

### 1. Use Proper HTTP Methods

- `GET`: Retrieve data
- `POST`: Create resources
- `PUT/PATCH`: Update resources
- `DELETE`: Delete resources

### 2. Handle Errors Gracefully

```typescript
const { api } = useApi()
const toast = useToast()

try {
  const tenant = await api('/api/admin/tenants/123')
} catch (error) {
  toast.error(error.message || 'Failed to load tenant')
  console.error('API Error:', error)
}
```

### 3. Implement Retry Logic

```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await api(url)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 4. Cache Responses

```typescript
const { data, refresh } = await useAsyncData(
  'dashboard-metrics',
  () => api('/api/admin/dashboard/metrics'),
  {
    // Cache for 5 minutes
    getCachedData: (key) => {
      const cached = nuxtApp.payload.data[key]
      if (!cached) return null
      
      const age = Date.now() - cached.fetchedAt
      if (age > 5 * 60 * 1000) return null
      
      return cached
    }
  }
)
```

### 5. Use TypeScript Types

```typescript
interface Tenant {
  id: string
  name: string
  status: 'active' | 'pending' | 'suspended'
  // ... other fields
}

const tenant = await api<Tenant>('/api/admin/tenants/123')
// tenant is now typed as Tenant
```

### 6. Implement Loading States

```typescript
const loading = ref(false)
const error = ref<Error | null>(null)

async function loadTenants() {
  loading.value = true
  error.value = null
  
  try {
    const data = await api('/api/admin/tenants')
    return data
  } catch (e) {
    error.value = e as Error
  } finally {
    loading.value = false
  }
}
```

### 7. Debounce Search Requests

```typescript
import { useDebounceFn } from '@vueuse/core'

const searchQuery = ref('')
const searchResults = ref([])

const debouncedSearch = useDebounceFn(async (query: string) => {
  if (!query) {
    searchResults.value = []
    return
  }
  
  const results = await api('/api/admin/tenants', {
    params: { search: query }
  })
  searchResults.value = results.data
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})
```

---

## Testing API Integration

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost.dev","password":"Admin123!"}'

# Get tenants (with token)
curl http://localhost:3000/api/admin/tenants \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create tenant
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Tenant","email":"tenant@example.com"}'
```

### Using Postman

1. Import API collection
2. Set environment variables:
   - `baseUrl`: http://localhost:3000
   - `token`: (obtained from login)
3. Use `{{baseUrl}}` and `{{token}}` in requests

---

*Last Updated: November 2025*
