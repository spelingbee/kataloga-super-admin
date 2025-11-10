# Accessibility Implementation Guide

## Overview

This document outlines the accessibility features implemented in the Super Admin application to ensure WCAG 2.1 Level AA compliance and provide an inclusive experience for all users.

## Key Features

### 1. ARIA Labels and Roles

All interactive elements have appropriate ARIA labels and roles:

- **Navigation**: `role="navigation"` with `aria-label` for context
- **Tables**: Full ARIA table semantics with `role="table"`, `role="row"`, `role="cell"`
- **Modals**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- **Buttons**: Descriptive `aria-label` attributes for icon-only buttons
- **Forms**: Associated labels with `for` attributes and `aria-describedby` for errors
- **Live Regions**: `aria-live` for dynamic content updates

### 2. Keyboard Navigation

Full keyboard support throughout the application:

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Focus Trap**: Modals trap focus within the dialog
- **Skip Links**: "Skip to main content" link for keyboard users
- **Sortable Tables**: Enter/Space to sort columns
- **Dropdown Menus**: Arrow keys for navigation
- **Escape Key**: Closes modals and dropdowns

#### Keyboard Shortcuts

- `Cmd/Ctrl + K`: Open global search
- `Cmd/Ctrl + /`: Show keyboard shortcuts
- `Escape`: Close modals and dropdowns
- `Tab`: Navigate forward
- `Shift + Tab`: Navigate backward
- `Enter/Space`: Activate buttons and links

### 3. Focus Indicators

Clear visual focus indicators for all interactive elements:

- **2px solid outline** in primary color (#0ea5e9)
- **2px offset** for better visibility
- **Focus-visible**: Only shows for keyboard navigation, not mouse clicks
- **Custom focus styles** for complex components

### 4. Screen Reader Support

Comprehensive screen reader support:

- **Semantic HTML**: Proper use of headings, landmarks, and lists
- **Alt Text**: All images have descriptive alt text
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Live Announcements**: Dynamic content changes announced via `aria-live`
- **Hidden Content**: Decorative elements hidden with `aria-hidden="true"`
- **Screen Reader Only**: `.sr-only` class for visually hidden but accessible content

### 5. Color Contrast

All text meets WCAG AA contrast requirements:

- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **Interactive Elements**: Clear visual distinction
- **Error States**: Not relying on color alone

### 6. Responsive Design

Accessible on all devices and screen sizes:

- **Mobile Navigation**: Touch-friendly targets (minimum 44x44px)
- **Responsive Tables**: Horizontal scroll with keyboard support
- **Flexible Layouts**: Adapts to different viewport sizes
- **Zoom Support**: Works at 200% zoom level

### 7. Motion and Animation

Respects user preferences:

- **Reduced Motion**: Animations disabled when `prefers-reduced-motion` is set
- **Smooth Transitions**: Subtle animations that don't cause disorientation
- **No Auto-play**: No automatically playing videos or carousels

## Component-Specific Accessibility

### DataTable Component

```vue
<DataTable
  :columns="columns"
  :data="data"
  aria-label="Tenants list"
  searchable
  paginated
/>
```

Features:
- Full ARIA table semantics
- Sortable columns with keyboard support
- Search with live results count
- Pagination with descriptive labels
- Row and column counts announced

### Modal Component

```vue
<Modal
  v-model="isOpen"
  title="Confirm Action"
  description="This action cannot be undone"
>
  <!-- Content -->
</Modal>
```

Features:
- Focus trap within modal
- Escape key to close
- Return focus on close
- Descriptive title and description
- Close button with aria-label

### Navigation

Features:
- Skip link to main content
- Current page indicated with `aria-current="page"`
- Badge counts announced to screen readers
- Mobile menu with proper ARIA attributes

### Forms

Features:
- Associated labels for all inputs
- Error messages linked with `aria-describedby`
- Required fields indicated
- Validation feedback announced
- Clear focus indicators

## Testing

### Manual Testing Checklist

- [ ] Navigate entire app using only keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify focus indicators are visible
- [ ] Check color contrast with tools
- [ ] Test at 200% zoom level
- [ ] Verify skip links work
- [ ] Test with reduced motion enabled
- [ ] Check mobile touch targets

### Automated Testing

Run accessibility tests:

```bash
# Install axe-core
pnpm add -D @axe-core/playwright

# Run tests
pnpm test:a11y
```

### Screen Reader Testing

#### NVDA (Windows)
1. Download from https://www.nvaccess.org/
2. Press `Insert + Down Arrow` to start reading
3. Use `Tab` to navigate interactive elements

#### JAWS (Windows)
1. Commercial screen reader
2. Press `Insert + Down Arrow` to start reading
3. Use `Tab` to navigate interactive elements

#### VoiceOver (macOS)
1. Enable: System Preferences > Accessibility > VoiceOver
2. Press `Cmd + F5` to toggle
3. Use `VO + Right Arrow` to navigate

## Best Practices

### When Adding New Components

1. **Use Semantic HTML**: Start with the right HTML element
2. **Add ARIA When Needed**: Only when semantic HTML isn't enough
3. **Test with Keyboard**: Ensure full keyboard accessibility
4. **Add Focus Styles**: Clear visual focus indicators
5. **Test with Screen Reader**: Verify announcements make sense
6. **Check Contrast**: Use tools to verify color contrast
7. **Document Accessibility**: Add notes for complex interactions

### Common Patterns

#### Button vs Link
- Use `<button>` for actions (submit, open modal, toggle)
- Use `<a>` for navigation (go to another page)

#### Icon Buttons
```vue
<button type="button" aria-label="Close dialog">
  <span aria-hidden="true">✕</span>
</button>
```

#### Loading States
```vue
<button aria-busy="true" aria-live="polite">
  Loading...
</button>
```

#### Error Messages
```vue
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid="true"
/>
<span id="email-error" role="alert">
  Please enter a valid email
</span>
```

## Resources

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension for accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome DevTools
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Web Content Accessibility Guidelines
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - Patterns and widgets
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Comprehensive guide

### Screen Readers
- [NVDA](https://www.nvaccess.org/) - Free screen reader for Windows
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) - Commercial screen reader
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - Built into macOS and iOS

## Support

For accessibility issues or questions:
1. Check this documentation
2. Review WCAG guidelines
3. Test with screen readers
4. Consult with accessibility experts

## Compliance

This application aims to meet:
- **WCAG 2.1 Level AA** compliance
- **Section 508** standards
- **ADA** requirements

Regular audits are conducted to ensure ongoing compliance.
