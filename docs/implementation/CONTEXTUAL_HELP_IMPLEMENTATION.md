# Contextual Help System Implementation

## Overview

This document describes the implementation of the contextual help system for the Super Admin Panel, including tooltips, onboarding tours, help buttons, and FAQ section.

## Components Implemented

### 1. Tooltip Component (`components/ui/Tooltip.vue`)

A reusable tooltip component that displays contextual help on hover or focus.

**Features:**
- Supports 4 positions: top, bottom, left, right
- Auto-positioning to stay within viewport
- Configurable delay
- Wide mode for longer content
- Accessible with ARIA attributes
- Teleports to body for proper z-index handling

**Usage:**
```vue
<Tooltip content="This is a helpful tooltip" position="top">
  <button>Hover me</button>
</Tooltip>

<!-- With custom content -->
<Tooltip position="right">
  <button>Info</button>
  <template #content>
    <strong>Custom Content</strong>
    <p>With HTML formatting</p>
  </template>
</Tooltip>
```

**Props:**
- `content` (string): Tooltip text
- `position` ('top' | 'bottom' | 'left' | 'right'): Tooltip position
- `delay` (number): Show delay in ms (default: 200)
- `wide` (boolean): Enable wide mode for longer content
- `disabled` (boolean): Disable tooltip

### 2. Onboarding Tour System

#### Composable (`composables/useOnboarding.ts`)

Manages onboarding tour state and logic.

**Features:**
- Multiple predefined tours (dashboard, tenants, registrations, analytics)
- Progress tracking
- Completion persistence (localStorage)
- Step navigation (next, previous, skip)
- Tour reset functionality

**Available Tours:**
1. **Dashboard Tour** - Introduction to the main dashboard
2. **Tenant Management Tour** - How to manage tenants
3. **Registration Approval Tour** - Registration review process
4. **Analytics Tour** - Using analytics features

**API:**
```typescript
const {
  // State
  currentTour,
  currentStep,
  currentStepIndex,
  isActive,
  completedTours,
  availableTours,
  
  // Computed
  isFirstStep,
  isLastStep,
  progress,
  
  // Methods
  startTour,
  nextStep,
  previousStep,
  skipTour,
  completeTour,
  isTourCompleted,
  resetTour,
  resetAllTours
} = useOnboarding()
```

**Usage:**
```typescript
// Start a tour
startTour('dashboard')

// Check if tour is completed
if (isTourCompleted('dashboard')) {
  // Show different UI
}

// Reset a tour
resetTour('dashboard')
```

#### Component (`components/OnboardingTour.vue`)

Visual component that displays the tour overlay and steps.

**Features:**
- Spotlight effect on target elements
- Floating tour card with positioning
- Progress bar
- Step navigation buttons
- Responsive design (mobile-friendly)
- Smooth transitions
- Auto-scroll to target elements

**Tour Step Structure:**
```typescript
interface OnboardingStep {
  id: string
  title: string
  content: string
  target: string // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void // Optional action to run
}
```

### 3. Help Button Component (`components/HelpButton.vue`)

A reusable button that triggers help actions.

**Features:**
- Opens documentation links
- Starts onboarding tours
- Integrated with tooltip
- Accessible with ARIA labels
- Customizable size

**Usage:**
```vue
<!-- Link to documentation -->
<HelpButton 
  doc-link="/docs/tenants" 
  tooltip="Learn about tenant management"
/>

<!-- Start a tour -->
<HelpButton 
  tour-id="dashboard" 
  tooltip="Take the dashboard tour"
/>

<!-- Custom size -->
<HelpButton 
  :size="24"
  doc-link="/docs/analytics"
/>
```

**Props:**
- `tooltip` (string): Tooltip text
- `ariaLabel` (string): Accessibility label
- `size` (number): Icon size (default: 20)
- `docLink` (string): Documentation URL to open
- `tourId` (string): Tour ID to start

### 4. FAQ Page (`pages/help/faq.vue`)

Comprehensive FAQ section with search and filtering.

**Features:**
- Category-based filtering (7 categories)
- Full-text search
- Expandable/collapsible answers
- Related resource links
- Contact support CTA
- 16 pre-written FAQs covering common topics

**Categories:**
1. Getting Started
2. Tenants
3. Subscriptions
4. Analytics
5. Security
6. Troubleshooting
7. All (default)

**FAQ Topics Covered:**
- What is the Super Admin Panel
- Approving/rejecting registrations
- Managing subscriptions
- Extending trials
- Applying discounts
- Viewing analytics
- Exporting reports
- Audit logs
- Blocking IPs
- Tenant impersonation
- Email templates
- System settings
- Troubleshooting
- Keyboard shortcuts

### 5. Help Center (`pages/help/index.vue`)

Central hub for all help resources.

**Features:**
- Quick links to FAQ, Documentation, Tours, Support
- List of available tours with completion status
- Tour management (start, restart, reset)
- Keyboard shortcuts access
- Visual card-based layout

**Sections:**
1. **Quick Links** - Fast access to help resources
2. **Interactive Tours** - Manage onboarding tours
3. **Keyboard Shortcuts** - View shortcuts modal

## Integration Points

### 1. Layout Integration

The onboarding tour component is added to the default layout:

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <!-- ... other content ... -->
    <OnboardingTour />
  </div>
</template>
```

### 2. Dashboard Integration

Help buttons and tooltips added to the dashboard:

```vue
<!-- pages/index.vue -->
<h1 class="dashboard__title">
  Dashboard
  <Tooltip content="Your central hub..." position="right">
    <HelpButton tour-id="dashboard" />
  </Tooltip>
</h1>
```

### 3. Sidebar Navigation

Help Center link added to the main navigation:

```typescript
const navigationItems = [
  // ... other items ...
  { name: 'Help Center', path: '/help', icon: 'help-circle' }
]
```

## Usage Guidelines

### Adding Tooltips to Components

1. **Import the Tooltip component:**
```vue
<script setup>
// Auto-imported by Nuxt
</script>
```

2. **Wrap elements with tooltips:**
```vue
<Tooltip content="Helpful information">
  <button>Action</button>
</Tooltip>
```

3. **Use appropriate positions:**
- `top` - For elements near the bottom
- `bottom` - For elements near the top (default for headers)
- `left` - For elements on the right side
- `right` - For elements on the left side

### Creating New Tours

1. **Add tour definition to `useOnboarding.ts`:**
```typescript
const tours: Record<string, OnboardingTour> = {
  // ... existing tours ...
  myNewTour: {
    id: 'myNewTour',
    name: 'My New Feature Tour',
    steps: [
      {
        id: 'step1',
        title: 'Step 1 Title',
        content: 'Step 1 description',
        target: '.css-selector',
        position: 'bottom'
      },
      // ... more steps
    ]
  }
}
```

2. **Ensure target elements have the correct CSS classes:**
```vue
<div class="css-selector">
  <!-- Content -->
</div>
```

3. **Add tour trigger:**
```vue
<HelpButton tour-id="myNewTour" />
```

### Adding FAQ Items

1. **Edit `pages/help/faq.vue`:**
```typescript
const faqs: FAQ[] = [
  // ... existing FAQs ...
  {
    id: 'unique-id',
    category: 'category-name',
    question: 'Your question?',
    answer: '<p>Your answer with <strong>HTML</strong> formatting</p>',
    relatedLinks: [
      { text: 'Related Doc', url: '/docs/related' }
    ]
  }
]
```

2. **Use appropriate categories:**
- `getting-started`
- `tenants`
- `subscriptions`
- `analytics`
- `security`
- `troubleshooting`

3. **Format answers with HTML:**
- Use `<p>` for paragraphs
- Use `<ol>` or `<ul>` for lists
- Use `<strong>` for emphasis
- Use `<kbd>` for keyboard keys

## Best Practices

### Tooltip Usage

1. **Keep tooltips concise** - 1-2 sentences max
2. **Use for clarification** - Not for essential information
3. **Position appropriately** - Avoid covering important content
4. **Don't overuse** - Only for complex or unclear features

### Tour Design

1. **Keep tours short** - 3-5 steps ideal, max 7 steps
2. **Focus on key features** - Don't try to cover everything
3. **Use clear language** - Avoid jargon
4. **Test target selectors** - Ensure elements exist and are visible
5. **Provide skip option** - Don't force users through tours

### FAQ Content

1. **Answer common questions** - Based on user feedback
2. **Use clear titles** - Questions should be searchable
3. **Provide examples** - Show, don't just tell
4. **Link to docs** - For detailed information
5. **Keep updated** - Review and update regularly

## Accessibility

All help components follow accessibility best practices:

1. **Tooltips:**
   - `role="tooltip"`
   - `aria-hidden` state management
   - Keyboard accessible (focus/blur)

2. **Onboarding Tour:**
   - `role="dialog"`
   - `aria-modal="true"`
   - `aria-labelledby` for titles
   - Keyboard navigation support

3. **Help Buttons:**
   - `aria-label` attributes
   - Focus indicators
   - Keyboard accessible

4. **FAQ:**
   - `aria-expanded` for collapsible items
   - Semantic HTML structure
   - Keyboard navigation

## Performance Considerations

1. **Tooltip positioning** - Calculated on-demand, not continuously
2. **Tour persistence** - Uses localStorage for completion tracking
3. **FAQ search** - Client-side filtering with computed properties
4. **Lazy loading** - Components auto-imported by Nuxt

## Future Enhancements

Potential improvements for the contextual help system:

1. **Video tutorials** - Embed video guides in help center
2. **Interactive demos** - Sandbox environment for testing features
3. **Contextual search** - AI-powered help search
4. **User feedback** - "Was this helpful?" buttons
5. **Analytics tracking** - Track which help resources are used
6. **Multi-language support** - Translate help content
7. **Custom tour builder** - Admin UI for creating tours
8. **Inline help** - Contextual help panels within pages
9. **Chatbot integration** - AI assistant for instant help
10. **Help widget** - Floating help button on all pages

## Testing

### Manual Testing Checklist

- [ ] Tooltips appear on hover/focus
- [ ] Tooltips position correctly in all viewports
- [ ] Tours start and navigate correctly
- [ ] Tour spotlight highlights correct elements
- [ ] Tour completion persists across sessions
- [ ] FAQ search filters correctly
- [ ] FAQ categories filter correctly
- [ ] FAQ items expand/collapse
- [ ] Help buttons trigger correct actions
- [ ] Help center links work
- [ ] Mobile responsive design works
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

### Browser Testing

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### Common Issues

**Issue: Tour target not found**
- Solution: Ensure target element exists and has correct CSS class
- Check: Element is rendered before tour starts

**Issue: Tooltip positioning incorrect**
- Solution: Check viewport boundaries and parent positioning
- Try: Different position prop value

**Issue: Tour completion not persisting**
- Solution: Check localStorage is enabled
- Verify: No errors in browser console

**Issue: FAQ search not working**
- Solution: Check search query is trimmed and lowercased
- Verify: FAQ content includes searchable text

## Conclusion

The contextual help system provides comprehensive support for Super Admin Panel users through tooltips, interactive tours, FAQ, and help center. The system is designed to be:

- **User-friendly** - Easy to understand and use
- **Accessible** - Follows WCAG guidelines
- **Maintainable** - Well-structured and documented
- **Extensible** - Easy to add new content and features
- **Performant** - Optimized for speed and efficiency

For questions or issues, refer to the main documentation or contact the development team.
