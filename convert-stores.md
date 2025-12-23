# Stores Converted to Composition API

## Completed:
- ✅ auth.ts
- ✅ tenant.ts
- ✅ dashboard.ts
- ✅ notification.ts

## Remaining:
- analytics.ts
- announcement.ts
- audit.ts
- email.ts
- integration.ts
- menu.ts
- plan.ts
- registration.ts
- security.ts
- settings.ts
- subscription.ts
- ticket.ts

## Pattern for Conversion:

### Before (Options API):
```typescript
export const useStore = defineStore('name', {
  state: () => ({ ... }),
  getters: { ... },
  actions: { ... }
})
```

### After (Composition API):
```typescript
export const useStore = defineStore('name', () => {
  // State
  const value = ref(...)
  
  // Getters
  const computed = computed(() => ...)
  
  // Actions
  const action = async () => { ... }
  
  return {
    value: readonly(value),
    computed,
    action
  }
})
```

### Key Changes:
1. `this.` → direct variable access
2. `state` → `ref()`
3. `getters` → `computed()`
4. `actions` → regular functions
5. Return object with `readonly()` for state
