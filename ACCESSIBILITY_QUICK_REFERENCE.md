# Accessibility Quick Reference

Quick guide for developers working on the Super Admin application.

## Common Patterns

### Buttons

```vue
<!-- Icon button -->
<button 
  type="button"
  aria-label="Close dialog"
>
  <span aria-hidden="true">✕</span>
</button>

<!-- Button with loading state -->
<button 
  type="button"
  :aria-busy="isLoading"
  :disabled="isLoading"
>
  {{ isLoading ? 'Loading...' : 'Submit' }}
</button>
```

### Forms

```vue
<!-- Input with label -->
<label for="email">Email Address</label>
<input
  id="email"
  v-model="email"
  type="email"
  :aria-invalid="hasError"
  :aria-describedby="hasError ? 'email-error' : undefined"
/>
<span v-if="hasError" id="email-error" role="alert">
  Please enter a valid email
</span>

<!-- Required field -->
<label for="name">
  Name <span aria-label="required">*</span>
</label>
<input
  id="name"
  v-model="name"
  required
  aria-required="true"
/>
```

### Links vs Buttons

```vue
<!-- Use <a> for navigation -->
<NuxtLink to="/tenants" aria-label="View all tenants">
  Tenants
</NuxtLink>

<!-- Use <button> for actions -->
<button type="button" @click="handleDelete">
  Delete
</button>
```

### Tables

```vue
<DataTable
  :columns="columns"
  :data="data"
  aria-label="Tenants list"
  searchable
  paginated
/>
```

### Modals

```vue
<Modal
  v-model="isOpen"
  title="Confirm Action"
  description="This action cannot be undone"
>
  <p>Are you sure you want to continue?</p>
  
  <template #footer>
    <button type="button" @click="isOpen = false">
      Cancel
    </button>
    <button type="button" @click="handleConfirm">
      Confirm
    </button>
  </template>
</Modal>
```

### Icons

```vue
<!-- Decorative icon -->
<AppIcon name="search" aria-hidden="true" />

<!-- Meaningful icon -->
<AppIcon name="warning" aria-label="Warning" />
```

### Loading States

```vue
<div v-if="isLoading" role="status" aria-live="polite">
  Loading data...
</div>
```

### Notifications

```vue
<!-- Use the accessibility composable -->
<script setup>
const accessibility = useAccessibility()

function handleSuccess() {
  accessibility.announceSuccess('Data saved successfully')
}

function handleError() {
  accessibility.announceError('Failed to save data')
}
</script>
```

## Keyboard Shortcuts

### Global
- `Cmd/Ctrl + K`: Open global search
- `Cmd/Ctrl + /`: Show keyboard shortcuts
- `Escape`: Close modals and dropdowns

### Navigation
- `Tab`: Move forward
- `Shift + Tab`: Move backward
- `Enter`: Activate links and buttons
- `Space`: Activate buttons

### Tables
- `Enter/Space`: Sort column
- `Tab`: Navigate between cells

## Testing Checklist

### Before Committing
- [ ] All interactive elements have accessible names
- [ ] Forms have proper labels
- [ ] Buttons have `type="button"` (unless submit)
- [ ] Images have alt text
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible

### Quick Test
1. Navigate with Tab key only
2. Check focus indicators
3. Test with screen reader
4. Verify ARIA labels

### Development Tools
```bash
# Press Ctrl+Shift+A in browser to log accessibility report
# Or in console:
import { logAccessibilityReport } from '~/utils/accessibility-testing'
logAccessibilityReport()
```

## Common Mistakes to Avoid

### ❌ Don't
```vue
<!-- Missing accessible name -->
<button @click="close">
  <span>✕</span>
</button>

<!-- Div as button -->
<div @click="handleClick">Click me</div>

<!-- Missing label -->
<input v-model="search" placeholder="Search" />

<!-- Color only for errors -->
<span style="color: red">Error</span>
```

### ✅ Do
```vue
<!-- Proper accessible name -->
<button type="button" aria-label="Close" @click="close">
  <span aria-hidden="true">✕</span>
</button>

<!-- Use button element -->
<button type="button" @click="handleClick">
  Click me
</button>

<!-- Proper label -->
<label for="search" class="sr-only">Search</label>
<input id="search" v-model="search" placeholder="Search" />

<!-- Text + icon for errors -->
<span role="alert">
  <AppIcon name="error" aria-hidden="true" />
  Error: Invalid input
</span>
```

## Resources

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Documentation
- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Full Accessibility Guide](./ACCESSIBILITY.md)

## Need Help?

1. Check [ACCESSIBILITY.md](./ACCESSIBILITY.md) for detailed guide
2. Review [ACCESSIBILITY_IMPLEMENTATION.md](./ACCESSIBILITY_IMPLEMENTATION.md) for examples
3. Test with screen readers
4. Ask the team for review
