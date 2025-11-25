# Menu Components

This directory contains components for managing tenant menus in the super admin panel.

## MenuItemList.vue

A comprehensive component for displaying, filtering, and managing menu items for a specific menu.

### Features

- **Display**: Grid layout showing menu items with images, prices, categories, and status
- **Search**: Real-time search by menu item name (debounced for performance)
- **Filtering**:
  - Category filter (dropdown)
  - Active status filter (all/active/inactive)
  - Price range filter (min/max)
- **Pagination**: Full pagination support with page numbers
- **Actions**: Edit and delete actions for each menu item
- **Responsive**: Mobile-friendly layout

### Props

```typescript
interface Props {
  tenantId: string      // Tenant ID
  menuId: string        // Menu ID
  categories: MenuCategory[]  // Available categories for filtering
}
```

### Events

```typescript
emit('createItem')              // Emitted when "Add Item" button is clicked
emit('editItem', item)          // Emitted when edit button is clicked
emit('deleteItem', item)        // Emitted when delete button is clicked
```

### Usage Example

```vue
<template>
  <MenuItemList
    :tenant-id="tenantId"
    :menu-id="menuId"
    :categories="categories"
    @create-item="handleCreateItem"
    @edit-item="handleEditItem"
    @delete-item="handleDeleteItem"
  />
</template>

<script setup lang="ts">
import MenuItemList from '~/components/menu/MenuItemList.vue'
import type { MenuItem, MenuCategory } from '~/types'

const tenantId = ref('tenant-123')
const menuId = ref('menu-456')
const categories = ref<MenuCategory[]>([
  { id: 'cat-1', name: 'Appetizers' },
  { id: 'cat-2', name: 'Main Courses' },
  { id: 'cat-3', name: 'Desserts' }
])

function handleCreateItem() {
  // Open create item modal/form
}

function handleEditItem(item: MenuItem) {
  // Open edit item modal/form with item data
}

function handleDeleteItem(item: MenuItem) {
  // Show confirmation dialog and delete item
}
</script>
```

### State Management

The component uses the `useMenuStore` Pinia store for:
- Fetching menu items with filters
- Managing pagination state
- Handling loading and error states
- Applying filters

### Filtering Behavior

- **Search**: Debounced by 500ms to avoid excessive API calls
- **Filters**: Applied immediately on change
- **Clear Filters**: Resets all filters and fetches first page
- **Filter Persistence**: Filters are stored in the Pinia store

### Pagination

- Shows up to 7 page numbers with ellipsis for large page counts
- Previous/Next buttons for navigation
- Disabled state for first/last pages
- Mobile-responsive layout

### Styling

Follows the SCSS style guide:
- BEM methodology without nested selectors
- Uses SCSS variables for colors, spacing, and transitions
- Responsive design with mobile breakpoints
- Scoped styles to avoid conflicts

### Requirements Coverage

This component satisfies the following requirements:

- **6.1**: Display tenant's menus with list of menu items ✓
- **6.2**: Display all menu items organized by category ✓
- **6.3**: Filter menu items by name, category, or price range ✓
- **6.4**: Display item details including name, description, price, image, and active status ✓
- **6.5**: Display menu statistics (total items count) ✓

### Performance Considerations

- Search is debounced to reduce API calls
- Images use lazy loading
- Pagination limits items per page (default: 50)
- Filters are applied server-side for efficiency

### Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Clear focus states
- Screen reader friendly labels

## MenuItemForm.vue

A comprehensive form component for creating and editing menu items with validation and image preview.

### Features

- **Create/Edit Mode**: Automatically detects if editing existing item or creating new one
- **Form Validation**: Client-side validation for all fields with error messages
- **Image Preview**: Real-time preview of menu item image with error handling
- **Category Selection**: Dropdown for selecting menu item category
- **Status Toggle**: Checkbox to set item as active/inactive
- **Responsive**: Mobile-friendly layout with stacked fields on small screens

### Props

```typescript
interface Props {
  item?: MenuItem | null        // Item to edit (null for create mode)
  categories: MenuCategory[]    // Available categories
  loading?: boolean             // Loading state during submission
}
```

### Events

```typescript
emit('submit', data: MenuItemFormData)  // Emitted when form is submitted with valid data
emit('cancel')                          // Emitted when cancel button is clicked
```

### Form Data Structure

```typescript
interface MenuItemFormData {
  name: string          // Item name (required, 2-100 chars)
  description: string   // Item description (optional, max 500 chars)
  price: number         // Item price (required, >= 0, max 999999.99)
  imageUrl: string      // Image URL (optional, must be valid URL)
  categoryId: string    // Category ID (required)
  isActive: boolean     // Active status (default: true)
}
```

### Usage Example

```vue
<template>
  <MenuItemForm
    :item="selectedItem"
    :categories="categories"
    :loading="isSubmitting"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
import MenuItemForm from '~/components/menu/MenuItemForm.vue'
import { useMenuStore } from '~/stores/menu'
import type { MenuItem, MenuCategory } from '~/types'

const menuStore = useMenuStore()
const selectedItem = ref<MenuItem | null>(null)
const isSubmitting = ref(false)

const categories = ref<MenuCategory[]>([
  { id: 'cat-1', name: 'Appetizers' },
  { id: 'cat-2', name: 'Main Courses' },
  { id: 'cat-3', name: 'Desserts' }
])

async function handleSubmit(data: MenuItemFormData) {
  isSubmitting.value = true
  try {
    if (selectedItem.value) {
      // Edit mode
      await menuStore.updateMenuItem(tenantId, menuId, selectedItem.value.id, data)
    } else {
      // Create mode
      await menuStore.createMenuItem(tenantId, menuId, data)
    }
    // Close form/modal
  } catch (error) {
    console.error('Failed to save menu item:', error)
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  // Close form/modal
}
</script>
```

### Validation Rules

**Name:**
- Required
- Minimum 2 characters
- Maximum 100 characters

**Description:**
- Optional
- Maximum 500 characters

**Price:**
- Required
- Must be a valid number
- Cannot be negative
- Maximum 999999.99

**Category:**
- Required
- Must select from available categories

**Image URL:**
- Optional
- Must be a valid URL format if provided

### Image Preview

- Displays real-time preview when valid image URL is entered
- Shows error state if image fails to load
- Responsive container with max-width of 400px
- Fallback error message with icon

### Form Behavior

- **Create Mode**: Empty form with default values (isActive: true)
- **Edit Mode**: Pre-populated with existing item data
- **Validation**: Real-time validation on submit
- **Error Display**: Inline error messages below each field
- **Submit Button**: Disabled when form is invalid or loading
- **Cancel Button**: Always enabled unless loading

### Styling

Follows the SCSS style guide:
- BEM methodology without nested selectors
- Uses SCSS variables for colors, spacing, and transitions
- Responsive design with mobile breakpoints
- Scoped styles to avoid conflicts
- Consistent with other form components (SubscriptionForm)

### Requirements Coverage

This component satisfies the following requirements:

- **7.1**: Create menu item with required fields (name, price, category) ✓
- **7.2**: Add description and image URL to menu items ✓
- **7.3**: Set isActive status and associate with correct tenant ✓
- **7.4**: Edit menu item and modify all properties ✓
- **7.5**: Validate data and update database record ✓

### Accessibility

- Semantic HTML form structure
- Proper label associations with form fields
- Required field indicators
- Error messages linked to fields
- Keyboard navigation support
- Focus management



## CategoryManagement.vue

A comprehensive component for managing menu categories for a tenant with CRUD operations and validation.

### Features

- **List Categories**: Display all categories with item counts in a grid layout
- **Create Category**: Modal-based form for creating new categories
- **Edit Category**: Modal-based form for editing existing categories
- **Delete Category**: Delete categories with validation to prevent deletion if items exist
- **Item Count Display**: Shows number of menu items per category
- **Responsive**: Mobile-friendly layout with stacked cards on small screens

### Props

```typescript
interface Props {
  tenantId: string      // Tenant ID
}
```

### Events

```typescript
emit('categoryCreated', category: CategoryWithItemCount)   // Emitted when category is created
emit('categoryUpdated', category: CategoryWithItemCount)   // Emitted when category is updated
emit('categoryDeleted', categoryId: string)                // Emitted when category is deleted
```

### Usage Example

```vue
<template>
  <CategoryManagement
    :tenant-id="tenantId"
    @category-created="handleCategoryCreated"
    @category-updated="handleCategoryUpdated"
    @category-deleted="handleCategoryDeleted"
  />
</template>

<script setup lang="ts">
import CategoryManagement from '~/components/menu/CategoryManagement.vue'
import type { CategoryWithItemCount } from '~/types'

const tenantId = ref('tenant-123')

function handleCategoryCreated(category: CategoryWithItemCount) {
  console.log('Category created:', category)
  // Optionally refresh menu items or show success message
}

function handleCategoryUpdated(category: CategoryWithItemCount) {
  console.log('Category updated:', category)
  // Optionally refresh menu items or show success message
}

function handleCategoryDeleted(categoryId: string) {
  console.log('Category deleted:', categoryId)
  // Optionally refresh menu items or show success message
}
</script>
```

### State Management

The component uses the `useMenuStore` Pinia store for:
- Fetching categories with item counts
- Creating new categories
- Updating existing categories
- Deleting categories
- Managing loading and error states

### Category Operations

**Create:**
- Opens modal with empty form
- Validates category name (required)
- Calls API to create category
- Updates local state and emits event

**Edit:**
- Opens modal with pre-populated form
- Validates category name (required)
- Calls API to update category
- Updates local state and emits event

**Delete:**
- Validates that category has no items (itemCount === 0)
- Shows confirmation dialog
- Calls API to delete category
- Updates local state and emits event
- Disabled button if category has items

### Validation Rules

**Category Name:**
- Required
- Maximum 100 characters
- Trimmed before submission

**Delete Validation:**
- Cannot delete category if itemCount > 0
- Delete button is disabled for categories with items
- Tooltip shows reason when disabled

### Modal Behavior

- **Overlay Click**: Closes modal when clicking outside
- **Close Button**: X button in header to close modal
- **Cancel Button**: Closes modal without saving
- **Submit Button**: Disabled when form is invalid or saving
- **Escape Key**: Closes modal (browser default)

### Styling

Follows the SCSS style guide:
- BEM methodology without nested selectors
- Uses SCSS variables for colors, spacing, and transitions
- Responsive design with mobile breakpoints
- Scoped styles to avoid conflicts
- Modal overlay with proper z-index
- Grid layout for category cards

### Requirements Coverage

This component satisfies the following requirements:

- **8.1**: Display all categories for a tenant with item counts ✓
- **8.2**: Create and update categories with tenant association ✓
- **8.3**: Prevent deletion of categories with associated menu items ✓
- **8.4**: Display item count per category ✓

### Error Handling

- **Fetch Error**: Shows error state with retry button
- **Create/Update Error**: Displays inline error in form
- **Delete Error**: Shows alert with error message
- **Network Error**: Gracefully handles and displays user-friendly messages

### Empty States

- **No Categories**: Shows empty state with icon and create button
- **Loading**: Shows spinner with loading message
- **Error**: Shows error message with retry button

### Accessibility

- Semantic HTML structure
- Proper ARIA labels for buttons
- Modal focus management
- Keyboard navigation support
- Required field indicators
- Disabled state with tooltips
- Screen reader friendly

### Performance Considerations

- Categories fetched once on mount
- Local state updates for immediate UI feedback
- Optimistic UI updates where appropriate
- Minimal re-renders with computed properties

## BulkMenuOperations.vue

A comprehensive component for performing bulk operations on multiple menu items with multi-select functionality and confirmation dialogs.

### Features

- **Multi-Select**: Checkbox-based selection with "select all" functionality
- **Bulk Activation/Deactivation**: Activate or deactivate multiple items at once
- **Bulk Price Update**: Update price for multiple items simultaneously
- **Bulk Category Change**: Change category for multiple items at once
- **Confirmation Dialogs**: Modal dialogs with affected item count before performing operations
- **Selection Header**: Sticky header showing selected count and available actions
- **Responsive**: Mobile-friendly layout with stacked actions on small screens

### Props

```typescript
interface Props {
  items: MenuItem[]         // Menu items to display
  categories: MenuCategory[] // Available categories for bulk category change
  tenantId: string          // Tenant ID
  menuId: string            // Menu ID
}
```

### Events

```typescript
emit('refresh')  // Emitted after successful bulk operation to refresh the list
```

### Usage Example

```vue
<template>
  <BulkMenuOperations
    :items="menuItems"
    :categories="categories"
    :tenant-id="tenantId"
    :menu-id="menuId"
    @refresh="handleRefresh"
  />
</template>

<script setup lang="ts">
import BulkMenuOperations from '~/components/menu/BulkMenuOperations.vue'
import { useMenuStore } from '~/stores/menu'
import type { MenuItem, MenuCategory } from '~/types'

const menuStore = useMenuStore()
const tenantId = ref('tenant-123')
const menuId = ref('menu-456')

const menuItems = computed(() => menuStore.menuItems)
const categories = computed(() => menuStore.categories)

async function handleRefresh() {
  // Refresh menu items after bulk operation
  await menuStore.fetchMenuItems(tenantId.value, menuId.value, menuStore.pagination.page)
}
</script>
```

### Bulk Operations

**Activate Items:**
- Shows confirmation dialog with affected count
- Sets `isActive: true` for all selected items
- Updates items in database via API
- Refreshes list after success

**Deactivate Items:**
- Shows confirmation dialog with affected count
- Sets `isActive: false` for all selected items
- Updates items in database via API
- Refreshes list after success

**Update Price:**
- Opens modal with price input field
- Validates price (must be > 0)
- Updates price for all selected items
- Shows affected count in modal
- Refreshes list after success

**Change Category:**
- Opens modal with category dropdown
- Validates category selection (required)
- Updates category for all selected items
- Shows affected count in modal
- Refreshes list after success

### Selection Behavior

- **Individual Selection**: Click checkbox or entire item card to toggle selection
- **Select All**: Checkbox in header to select/deselect all items
- **Indeterminate State**: Header checkbox shows indeterminate when some items selected
- **Clear Selection**: Button to clear all selections
- **Visual Feedback**: Selected items have highlighted background

### Modal Dialogs

**Confirmation Dialog:**
- Used for activate/deactivate operations
- Shows operation title and description
- Displays affected item count prominently
- Confirm/Cancel buttons

**Price Update Dialog:**
- Number input for new price
- Validation for positive numbers
- Shows affected item count
- Error message for invalid input
- Update/Cancel buttons

**Category Change Dialog:**
- Dropdown with available categories
- Validation for required selection
- Shows affected item count
- Error message for missing selection
- Change/Cancel buttons

### State Management

The component uses the `useMenuStore` Pinia store for:
- Calling `bulkUpdateMenuItems()` action
- Handling API requests and responses
- Managing loading states during operations

### Validation

**Price Update:**
- Price must be a number
- Price must be greater than 0
- Shows inline error message if invalid

**Category Change:**
- Category must be selected
- Shows inline error message if not selected

**Selection:**
- At least one item must be selected
- Bulk action buttons only visible when items selected

### Error Handling

- **API Errors**: Shows alert with error message
- **Validation Errors**: Shows inline error in modal
- **Network Errors**: Gracefully handles and displays user-friendly messages
- **Success**: Shows success alert with affected count

### Styling

Follows the SCSS style guide:
- BEM methodology without nested selectors
- Uses SCSS variables for colors, spacing, and transitions
- Responsive design with mobile breakpoints
- Scoped styles to avoid conflicts
- Modal overlay with proper z-index
- Color-coded action buttons (green for activate, red for deactivate, etc.)

### Requirements Coverage

This component satisfies the following requirements:

- **9.1**: Multi-select functionality for menu items ✓
- **9.2**: Bulk activation/deactivation of menu items ✓
- **9.3**: Bulk price and category updates ✓
- **9.4**: Confirmation dialog with affected item count ✓
- **9.5**: Display success message with number of updated items ✓

### Accessibility

- Semantic HTML structure
- Proper checkbox labels and associations
- Keyboard navigation support
- Modal focus management
- Clear focus states
- Disabled state indicators
- Screen reader friendly labels

### Performance Considerations

- Efficient selection state management with array operations
- Optimistic UI updates where appropriate
- Single API call for bulk operations
- Minimal re-renders with computed properties
- Debounced operations where needed

### User Experience

- **Visual Feedback**: Selected items clearly highlighted
- **Action Visibility**: Bulk actions only shown when items selected
- **Confirmation**: All destructive operations require confirmation
- **Progress Indication**: Loading states during API calls
- **Success Feedback**: Clear success messages with counts
- **Error Recovery**: Clear error messages with retry options

## Store Integration

All menu components use the `useMenuStore()` Pinia store for state management.

### Store State

```typescript
interface MenuState {
  menus: MenuListItem[]
  currentMenu: MenuDetails | null
  menuItems: MenuItem[]
  categories: CategoryWithItemCount[]
  itemFilters: MenuItemFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: boolean
  error: string | null
}
```

### Store Actions

**Menu Items:**
- `fetchMenuItems(tenantId, menuId, page)`: Fetch paginated menu items
- `createMenuItem(tenantId, menuId, itemData)`: Create a new menu item
- `updateMenuItem(tenantId, menuId, itemId, itemData)`: Update an existing menu item
- `deleteMenuItem(tenantId, menuId, itemId)`: Delete a menu item
- `bulkUpdateMenuItems(tenantId, menuId, itemIds, updates)`: Bulk update menu items

**Categories:**
- `fetchCategories(tenantId, page)`: Fetch categories for a tenant
- `createCategory(tenantId, categoryData)`: Create a new category
- `updateCategory(tenantId, categoryId, categoryData)`: Update a category
- `deleteCategory(tenantId, categoryId)`: Delete a category

**Filters:**
- `setItemFilters(filters)`: Update filter state
- `clearItemFilters()`: Clear all filters

**Utility:**
- `setPage(page)`: Update current page
- `clearError()`: Clear error state
- `clearCurrentMenu()`: Clear current menu state
- `resetState()`: Reset entire store state

## API Endpoints

### Menu Items

- `GET /api/admin/tenants/:tenantId/menus/:menuId/items` - List menu items with filters
- `POST /api/admin/tenants/:tenantId/menus/:menuId/items` - Create menu item
- `PATCH /api/admin/tenants/:tenantId/menus/:menuId/items/:itemId` - Update menu item
- `DELETE /api/admin/tenants/:tenantId/menus/:menuId/items/:itemId` - Delete menu item
- `POST /api/admin/tenants/:tenantId/menus/:menuId/items/bulk-update` - Bulk update items

### Categories

- `GET /api/admin/tenants/:tenantId/menus/categories` - List categories with item counts
- `POST /api/admin/tenants/:tenantId/menus/categories` - Create category
- `PATCH /api/admin/tenants/:tenantId/menus/categories/:categoryId` - Update category
- `DELETE /api/admin/tenants/:tenantId/menus/categories/:categoryId` - Delete category

## Type Definitions

```typescript
interface MenuCategory {
  id: string
  name: string
}

interface CategoryWithItemCount {
  id: string
  name: string
  itemCount: number
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isActive: boolean
  category: MenuCategory
  createdAt: string
  updatedAt: string
}

interface MenuItemFilters {
  search?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  isActive?: boolean
}
```

## Complete Requirements Coverage

All menu components together satisfy the following requirements:

- **6.1**: Display tenant's menus with list of menu items ✓
- **6.2**: Display all menu items organized by category ✓
- **6.3**: Filter menu items by name, category, or price range ✓
- **6.4**: Display item details including name, description, price, image, and active status ✓
- **6.5**: Display menu statistics (total items, active items, categories) ✓
- **7.1**: Create menu item with required fields (name, price, category) ✓
- **7.2**: Add description and image URL to menu items ✓
- **7.3**: Set isActive status and associate with correct tenant ✓
- **7.4**: Edit menu item and modify all properties ✓
- **7.5**: Validate data and update database record ✓
- **8.1**: Display all categories for a tenant with item counts ✓
- **8.2**: Create and update categories with tenant association ✓
- **8.3**: Prevent deletion of categories with associated menu items ✓
- **8.4**: Display item count per category ✓
- **9.1**: Multi-select functionality for menu items ✓
- **9.2**: Bulk activation/deactivation of menu items ✓
- **9.3**: Bulk price and category updates ✓
- **9.4**: Confirmation dialog with affected item count ✓
- **9.5**: Display success message with number of updated items ✓
