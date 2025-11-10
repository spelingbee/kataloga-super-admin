# Performance Optimization Guide

This document describes all performance optimizations implemented in the Super Admin Panel.

## Overview

The application has been optimized for:
- Fast initial load times
- Efficient data fetching and caching
- Smooth user interactions
- Minimal bundle size
- Optimal resource loading

## 1. Caching Strategy

### API Response Caching

**Location:** `composables/useCache.ts`

The application implements an in-memory cache with TTL (Time To Live) support:

```typescript
import { useCache, CacheTTL } from '~/composables/useCache'

const { cachedGet } = useCache()

// Fetch with caching
const data = await cachedGet('/api/admin/tenants', {
  ttl: CacheTTL.MEDIUM, // 5 minutes
  force: false, // Use cache if available
})
```

**Cache TTL Presets:**
- `SHORT`: 1 minute - For frequently changing data
- `MEDIUM`: 5 minutes - For dashboard metrics
- `LONG`: 15 minutes - For analytics data
- `HOUR`: 1 hour - For static configuration
- `DAY`: 24 hours - For rarely changing data

**Features:**
- Automatic cache expiration
- Cache invalidation by key or pattern
- Periodic cleanup of expired entries
- Global cache management

**Usage in Stores:**

```typescript
// Dashboard store with caching
async fetchDashboardData(force = false): Promise<void> {
  const { cachedGet } = useCache()
  
  const [metrics, activity, health] = await Promise.all([
    cachedGet<DashboardMetrics>('/api/admin/analytics/dashboard', {
      ttl: CacheTTL.MEDIUM,
      force,
    }),
    cachedGet<Activity[]>('/api/admin/dashboard/activity', {
      ttl: CacheTTL.SHORT,
      force,
    }),
    cachedGet<SystemHealth>('/api/admin/dashboard/health', {
      ttl: CacheTTL.SHORT,
      force,
    }),
  ])
}
```

### Route Caching

**Location:** `nuxt.config.ts`

Static and dynamic routes are cached using Nuxt's `routeRules`:

```typescript
routeRules: {
  '/': { swr: 60 }, // Cache for 60 seconds
  '/login': { swr: 3600 }, // Cache for 1 hour
  '/tenants/**': { swr: 30 }, // Cache dynamic pages
}
```

### Cache Invalidation

**Location:** `plugins/cache.client.ts`

Automatic cache invalidation on:
- User logout (clear all cache)
- Data mutations (invalidate related cache)

```typescript
// Invalidate tenant cache when data changes
watch(() => tenantStore.tenants, () => {
  invalidatePattern('/api/admin/tenants')
})
```

## 2. Data Loading Optimization

### Virtual Scrolling

**Location:** `composables/useVirtualScroll.ts`

For large lists (1000+ items), use virtual scrolling to render only visible items:

```typescript
import { useVirtualScroll } from '~/composables/useVirtualScroll'

const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
  items,
  {
    itemHeight: 50, // Height of each item
    buffer: 5, // Extra items to render
  }
)
```

**Benefits:**
- Renders only visible items
- Smooth scrolling for large datasets
- Reduced memory usage
- Better performance

### Lazy Loading

**Location:** `composables/useLazyLoad.ts`

#### Lazy Load Images

```typescript
import { useLazyImage } from '~/composables/useLazyLoad'

const imageRef = ref<HTMLImageElement | null>(null)
const { isLoaded, isInView } = useLazyImage(imageRef)
```

```html
<img
  ref="imageRef"
  data-src="/path/to/image.jpg"
  alt="Description"
/>
```

#### Lazy Load Components

```typescript
import { useLazyComponent } from '~/composables/useLazyLoad'

const elementRef = ref<HTMLElement | null>(null)
const { shouldLoad } = useLazyComponent(elementRef)
```

```html
<div ref="elementRef">
  <HeavyComponent v-if="shouldLoad" />
</div>
```

### Loading Skeletons

**Location:** `components/ui/`

Use loading skeletons for better perceived performance:

```html
<!-- Table skeleton -->
<TableSkeleton v-if="loading" :rows="5" :columns="4" />

<!-- Card skeleton -->
<CardSkeleton v-if="loading" show-header show-footer />

<!-- Generic skeleton -->
<LoadingSkeleton type="text" :count="3" />
<LoadingSkeleton type="circle" width="50px" height="50px" />
<LoadingSkeleton type="card" height="200px" />
```

### Optimized Data Fetching

**Location:** `composables/useOptimizedFetch.ts`

#### Debouncing

Delay execution until user stops typing:

```typescript
import { debounce } from '~/composables/useOptimizedFetch'

const searchTenants = debounce(async (query: string) => {
  await fetchTenants(query)
}, 300) // Wait 300ms after last keystroke
```

#### Throttling

Limit execution frequency:

```typescript
import { throttle } from '~/composables/useOptimizedFetch'

const handleScroll = throttle(() => {
  // Handle scroll
}, 100) // Execute at most once per 100ms
```

#### Request Deduplication

Prevent duplicate simultaneous requests:

```typescript
const { data, loading, fetch } = useOptimizedFetch(
  () => apiService.get('/api/admin/tenants'),
  { dedupe: true }
)
```

#### Infinite Scroll

```typescript
import { useInfiniteScroll } from '~/composables/useOptimizedFetch'

const { items, loading, hasMore, loadMore } = useInfiniteScroll(
  (page) => fetchTenants(page),
  { pageSize: 20 }
)
```

#### Polling

```typescript
import { usePolling } from '~/composables/useOptimizedFetch'

const { data, startPolling, stopPolling } = usePolling(
  () => fetchSystemHealth(),
  5000 // Poll every 5 seconds
)

onMounted(() => startPolling())
onUnmounted(() => stopPolling())
```

## 3. Code Splitting

### Automatic Code Splitting

**Location:** `nuxt.config.ts`

The application automatically splits code into chunks:

```typescript
vite: {
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('vue')) return 'vendor-vue'
          if (id.includes('apexcharts')) return 'vendor-charts'
          if (id.includes('jspdf')) return 'vendor-export'
          
          // Component chunks
          if (id.includes('/components/analytics/')) return 'components-analytics'
          if (id.includes('/components/email/')) return 'components-email'
        }
      }
    }
  }
}
```

**Chunks Created:**
- `vendor-vue`: Vue, Pinia, Vue Router
- `vendor-charts`: ApexCharts
- `vendor-export`: jsPDF, html2canvas
- `vendor-utils`: Axios, dayjs
- `components-analytics`: Analytics components
- `components-email`: Email components
- `components-security`: Security components
- `stores`: Pinia stores

### Lazy Component Loading

**Location:** `utils/lazy-components.ts`

Heavy components are loaded on demand:

```typescript
import { LazyModalComponents } from '~/utils/lazy-components'

// In component
const ChangePlanModal = defineAsyncComponent(
  LazyModalComponents.ChangePlanModal
)
```

**Available Lazy Components:**
- Chart components (ApexCharts)
- Modal components
- Export utilities

### Route-Based Preloading

**Location:** `plugins/preload.client.ts`

Components are preloaded when hovering over navigation links:

```typescript
// Automatically preloads components for the route
preloadRouteComponents('analytics')
```

**Preload on:**
- Route navigation
- Link hover
- Manual trigger

## 4. Bundle Optimization

### Minification

Production builds are minified with Terser:

```typescript
vite: {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log
        drop_debugger: true,
      },
    },
  },
}
```

### Tree Shaking

Unused code is automatically removed during build.

### Dependency Optimization

```typescript
vite: {
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'dayjs'],
    exclude: ['apexcharts', 'jspdf', 'html2canvas'], // Lazy load
  },
}
```

### Compression

Assets are compressed in production:

```typescript
nitro: {
  compressPublicAssets: true,
  minify: true,
}
```

## 5. Performance Monitoring

### Performance Utilities

**Location:** `utils/performance.ts`

Track application performance:

```typescript
import { performanceMonitor, measureApiCall } from '~/utils/performance'

// Measure API calls
const data = await measureApiCall('fetchTenants', () => 
  apiService.get('/api/admin/tenants')
)

// Measure component render time
const { startTime } = useComponentPerformance('TenantList')

// Get Web Vitals
const vitals = performanceMonitor.getWebVitals()
console.log('FCP:', vitals.FCP)
console.log('LCP:', vitals.LCP)
console.log('FID:', vitals.FID)
console.log('CLS:', vitals.CLS)
```

### Performance Plugin

**Location:** `plugins/performance.client.ts`

Automatically tracks:
- Route navigation time
- Component render time
- API call duration
- Web Vitals

In development mode, logs performance report after 5 seconds.

## Best Practices

### 1. Use Caching for Expensive Operations

```typescript
// ✅ Good - Use cache for dashboard metrics
const metrics = await cachedGet('/api/admin/analytics/dashboard', {
  ttl: CacheTTL.MEDIUM,
})

// ❌ Bad - Fetch every time
const metrics = await apiService.get('/api/admin/analytics/dashboard')
```

### 2. Lazy Load Heavy Components

```typescript
// ✅ Good - Lazy load charts
const RevenueChart = defineAsyncComponent(
  () => import('~/components/analytics/RevenueAnalytics.vue')
)

// ❌ Bad - Import directly
import RevenueChart from '~/components/analytics/RevenueAnalytics.vue'
```

### 3. Use Loading Skeletons

```typescript
// ✅ Good - Show skeleton while loading
<TableSkeleton v-if="loading" />
<DataTable v-else :data="data" />

// ❌ Bad - Show nothing or spinner
<div v-if="loading">Loading...</div>
<DataTable v-else :data="data" />
```

### 4. Debounce Search Inputs

```typescript
// ✅ Good - Debounce search
const searchTenants = debounce(handleSearch, 300)

// ❌ Bad - Search on every keystroke
const searchTenants = handleSearch
```

### 5. Use Virtual Scrolling for Large Lists

```typescript
// ✅ Good - Virtual scroll for 1000+ items
const { visibleItems } = useVirtualScroll(items, { itemHeight: 50 })

// ❌ Bad - Render all items
<div v-for="item in items">...</div>
```

## Performance Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s
- **Bundle Size**: < 500KB (gzipped)

## Monitoring

Use browser DevTools to monitor:
- Network tab: Check request sizes and timing
- Performance tab: Analyze rendering performance
- Lighthouse: Run performance audits
- Coverage tab: Find unused code

## Future Optimizations

- [ ] Implement Service Worker for offline support
- [ ] Add HTTP/2 Server Push
- [ ] Implement Progressive Web App (PWA)
- [ ] Add image optimization with WebP
- [ ] Implement critical CSS extraction
- [ ] Add resource hints (preload, prefetch, preconnect)
