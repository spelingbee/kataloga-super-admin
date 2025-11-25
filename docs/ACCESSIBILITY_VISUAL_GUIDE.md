# Accessibility Visual Guide

Visual examples of accessibility features implemented in the Super Admin application.

## Focus Indicators

### Before (No Focus Indicator)
```
[Button]  ← No visible focus
```

### After (Clear Focus Indicator)
```
┌─────────────────┐
│ [Button]        │ ← 2px blue outline with 2px offset
└─────────────────┘
```

## Skip Links

### Hidden by Default
```
┌──────────────────────────────────┐
│ [Header]                         │
│ [Navigation]                     │
│ [Main Content]                   │
└──────────────────────────────────┘
```

### Visible on Keyboard Focus
```
┌──────────────────────────────────┐
│ ┌──────────────────────────────┐ │
│ │ Skip to main content         │ │ ← Appears on Tab
│ └──────────────────────────────┘ │
│ [Header]                         │
│ [Navigation]                     │
│ [Main Content]                   │
└──────────────────────────────────┘
```

## Data Table Accessibility

### Visual Structure
```
┌─────────────────────────────────────────────────┐
│ Search: [____________]  (3 results found)       │ ← aria-live
├─────────────────────────────────────────────────┤
│ Name ↑    │ Email        │ Status   │ Actions  │ ← Sortable
├───────────┼──────────────┼──────────┼──────────┤
│ John Doe  │ john@ex.com  │ Active   │ [Edit]   │
│ Jane Smith│ jane@ex.com  │ Pending  │ [Edit]   │
├─────────────────────────────────────────────────┤
│ Showing 1 to 2 of 3 entries                     │ ← aria-live
│ [Previous] [1] [2] [Next]                       │
└─────────────────────────────────────────────────┘

Keyboard Navigation:
- Tab: Navigate between elements
- Enter/Space: Sort columns
- Arrow keys: Navigate table cells
```

### Screen Reader Announces
```
"Data table with 3 rows and 4 columns"
"Name column header, sorted ascending, press Enter to sort"
"Row 1, Name: John Doe"
"3 results found"
"Showing 1 to 2 of 3 entries"
```

## Modal Accessibility

### Visual Structure
```
┌─────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════╗   │
│ ║ Confirm Action                      [X]   ║   │ ← aria-label="Close"
│ ║                                           ║   │
│ ║ This action cannot be undone.             ║   │ ← aria-describedby
│ ║                                           ║   │
│ ║ Are you sure you want to continue?        ║   │
│ ║                                           ║   │
│ ║           [Cancel]  [Confirm]             ║   │
│ ╚═══════════════════════════════════════════╝   │
└─────────────────────────────────────────────────┘

Focus Trap:
Tab → [X] → [Cancel] → [Confirm] → [X] (loops)
Escape → Closes modal
```

### Screen Reader Announces
```
"Dialog opened: Confirm Action"
"This action cannot be undone. Are you sure you want to continue?"
"Cancel button"
"Confirm button"
"Close dialog button"
```

## Navigation Accessibility

### Visual Structure
```
┌─────────────────────┐
│ Super Admin         │
├─────────────────────┤
│ ► Dashboard         │ ← aria-current="page"
│   Tenants           │
│   Registrations (5) │ ← Badge announced
│   Subscriptions     │
│   Analytics         │
│   Settings          │
└─────────────────────┘

Keyboard Navigation:
- Tab: Navigate items
- Enter: Activate link
- Arrow keys: Navigate menu
```

### Screen Reader Announces
```
"Main navigation"
"Dashboard, current page"
"Tenants link"
"Registrations link, 5 pending items"
"Subscriptions link"
```

## Form Accessibility

### Visual Structure
```
┌─────────────────────────────────────────────────┐
│ Email Address *                                 │ ← Label
│ [john@example.com___________________________]   │
│ ⚠ Please enter a valid email                   │ ← aria-describedby
├─────────────────────────────────────────────────┤
│ Password *                                      │
│ [••••••••••_________________________________]   │
│                                                 │
├─────────────────────────────────────────────────┤
│              [Cancel]  [Submit]                 │
└─────────────────────────────────────────────────┘

States:
- Normal: Black border
- Focus: Blue border + outline
- Error: Red border + error message
- Disabled: Gray background
```

### Screen Reader Announces
```
"Email Address, required, edit text"
"Invalid, Please enter a valid email"
"Password, required, password edit text"
"Cancel button"
"Submit button"
```

## Button States

### Visual Examples
```
Normal Button:
┌──────────┐
│  Submit  │
└──────────┘

Focused Button:
┌──────────┐
│  Submit  │ ← Blue outline
└──────────┘

Loading Button:
┌──────────┐
│ Loading..│ ← aria-busy="true"
└──────────┘

Disabled Button:
┌──────────┐
│  Submit  │ ← Gray, aria-disabled="true"
└──────────┘
```

## Icon Accessibility

### Decorative Icon (Hidden from Screen Readers)
```vue
<AppIcon name="search" aria-hidden="true" />
```
Screen Reader: (skips)

### Meaningful Icon (Announced)
```vue
<AppIcon name="warning" aria-label="Warning" />
```
Screen Reader: "Warning"

### Icon Button
```vue
<button aria-label="Close dialog">
  <span aria-hidden="true">✕</span>
</button>
```
Screen Reader: "Close dialog button"

## Live Regions

### Search Results
```
┌─────────────────────────────────────────────────┐
│ Search: [john_______________________________]   │
│                                                 │
│ Results:                                        │
│ - John Doe                                      │
│ - John Smith                                    │
│                                                 │
│ (2 results found) ← Announced automatically     │
└─────────────────────────────────────────────────┘
```

Screen Reader: "2 results found" (polite)

### Success Message
```
┌─────────────────────────────────────────────────┐
│ ✓ Data saved successfully                       │ ← Toast notification
└─────────────────────────────────────────────────┘
```

Screen Reader: "Success: Data saved successfully" (polite)

### Error Message
```
┌─────────────────────────────────────────────────┐
│ ✗ Failed to save data                           │ ← Toast notification
└─────────────────────────────────────────────────┘
```

Screen Reader: "Error: Failed to save data" (assertive)

## Keyboard Shortcuts

### Visual Indicator
```
┌─────────────────────────────────────────────────┐
│ Keyboard Shortcuts                              │
├─────────────────────────────────────────────────┤
│ Cmd/Ctrl + K    Open search                     │
│ Cmd/Ctrl + /    Show shortcuts                  │
│ Escape          Close modal                     │
│ Tab             Next element                    │
│ Shift + Tab     Previous element                │
│ Enter/Space     Activate                        │
└─────────────────────────────────────────────────┘
```

## Color Contrast

### Good Contrast (WCAG AA)
```
┌─────────────────────────────────────────────────┐
│ ████████████████████████████████████████████    │
│ ██ Normal Text (4.5:1 minimum)          ██    │
│ ████████████████████████████████████████████    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ████████████████████████████████████████████    │
│ ██ Large Text (3:1 minimum)             ██    │
│ ████████████████████████████████████████████    │
└─────────────────────────────────────────────────┘
```

### Color + Text (Not Color Alone)
```
❌ Bad:
[Red text] Error

✅ Good:
⚠ [Red text] Error: Invalid input
```

## Responsive Focus Management

### Desktop
```
┌─────────────────────────────────────────────────┐
│ [Logo]  [Search]  [Notifications]  [Profile]   │
│                                                 │
│ [Sidebar]  [Main Content]                      │
│                                                 │
└─────────────────────────────────────────────────┘

Tab Order: Logo → Search → Notifications → Profile → Sidebar → Content
```

### Mobile
```
┌─────────────────────────────────────────────────┐
│ [☰]  [Logo]  [Search]  [Profile]               │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Main Content]                                  │
│                                                 │
└─────────────────────────────────────────────────┘

Tab Order: Menu → Logo → Search → Profile → Content
Menu Opens: Focus trapped in sidebar
```

## Testing Mode

### Enable Visual Testing
```javascript
import { enableAccessibilityTestingMode } from '~/utils/accessibility-testing'
enableAccessibilityTestingMode()
```

### Visual Indicators
```
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ │
│ │ [Button] ← Blue dashed outline              │ │ Focusable
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ <nav> ← Green outline                       │ │ Landmark
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ <h1> ← Orange outline                       │ │ Heading
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Summary

All visual elements in the application have been enhanced with:
- ✅ Clear focus indicators
- ✅ Proper ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast compliance
- ✅ Responsive design
- ✅ Testing tools

The application provides an inclusive experience for all users, regardless of their abilities or assistive technologies used.
