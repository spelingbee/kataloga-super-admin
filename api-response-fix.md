# API Response Structure Fix

## Problem
The frontend was expecting a nested pagination structure, but the backend actually returns a flat structure.

## Backend Structure (ACTUAL)
```json
{
  "data": [...],
  "total": 9,
  "page": 1,
  "limit": 50
}
```

## API Service Wrapper
The API service wraps this in `ApiResponse<T>`:
```typescript
interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
  statusCode?: number
}
```

## Final Structure
So the actual response structure is:
```typescript
{
  data: {
    data: T[],
    total: number,
    page: number,
    limit: number,
    totalPages?: number
  },
  message?: string,
  success: boolean,
  statusCode?: number
}
```

## Fixed Files
- ✅ types/index.ts - Updated PaginatedResponse interface
- ✅ stores/tenant.ts - Fixed pagination access
- ✅ stores/registration.ts - Fixed pagination access
- ✅ stores/subscription.ts - Fixed pagination access
- ✅ stores/security.ts - Fixed pagination access (3 methods)
- ✅ stores/menu.ts - Fixed pagination access (2 methods)
- ✅ stores/email.ts - Fixed pagination access
- ✅ stores/audit.ts - Fixed pagination access
- ✅ stores/announcement.ts - Fixed pagination access
- ✅ stores/ticket.ts - Fixed pagination access

## Changes Made
1. Updated `PaginatedResponse<T>` interface to match backend's flat structure
2. Changed all `response.data` to `response.data.data` (for array items)
3. Changed all `response.page` to `response.data.page`
4. Changed all `response.limit` to `response.data.limit`
5. Changed all `response.total` to `response.data.total`
6. Added fallback for `totalPages`: `response.data.totalPages || Math.ceil(response.data.total / response.data.limit)`

## Result
Now the frontend correctly handles the backend's flat pagination structure with proper API service wrapping.