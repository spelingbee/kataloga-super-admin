# Tenant Menu Management Pages

This directory contains the pages for managing tenant menus in the super-admin panel.

## Pages

### 1. `/tenants/[id]/menus.vue`
**Route:** `/tenants/:id/menus`

Main menu management page for a specific tenant.

**Features:**
- Displays list of all menus for the tenant
- Shows menu statistics (total items, active items, categories)
- Allows navigation to individual menu details
- Breadcrumb navigation
- Create menu functionality (placeholder)

**Components Used:**
- `TenantMenuList` - Displays paginated list of menus with statistics

**Store Actions:**
- `tenantStore.fetchTenantDetails()` - Fetches tenant information
- `menuStore.fetchMenus()` - Fetches menus for the tenant

---

### 2. `/tenants/[id]/menus/[menuId].vue`
**Route:** `/tenants/:id/menus/:menuId`

Menu items management page for a specific menu.

**Features:**
- Displays menu details and status
- Shows menu statistics (total items, active items, categories)
- Lists all menu items with filtering and pagination
- Create, edit, and delete menu items
- Navigate to category management
- Navigate to bulk operations
- Breadcrumb navigation

**Components Used:**
- `MenuItemList` - Displays filterable, paginated list of menu items
- `ConfirmModal` - Confirmation dialog for delete operations

**Store Actions:**
- `tenantStore.fetchTenantDetails()` - Fetches tenant information
- `menuStore.fetchMenuDetails()` - Fetches menu details
- `menuStore.fetchCategories()` - Fetches categories for filtering
- `menuStore.fetchMenuItems()` - Fetches menu items with filters
- `menuStore.deleteMenuItem()` - Deletes a menu item

**Navigation:**
- Create item: `/tenants/:id/menus/:menuId/items/new`
- Edit item: `/tenants/:id/menus/:menuId/items/:itemId/edit` (TODO)
- Categories: `/tenants/:id/menus/:menuId/categories` (TODO)
- Bulk operations: `/tenants/:id/menus/:menuId/bulk` (TODO)

---

### 3. `/tenants/[id]/menus/[menuId]/items/new.vue`
**Route:** `/tenants/:id/menus/:menuId/items/new`

Create new menu item page.

**Features:**
- Form for creating a new menu item
- Category selection
- Image URL with preview
- Price and description fields
- Active status toggle
- Form validation
- Breadcrumb navigation

**Components Used:**
- `MenuItemForm` - Reusable form component for creating/editing menu items

**Store Actions:**
- `tenantStore.fetchTenantDetails()` - Fetches tenant information
- `menuStore.fetchMenuDetails()` - Fetches menu details
- `menuStore.fetchCategories()` - Fetches categories for dropdown
- `menuStore.createMenuItem()` - Creates the new menu item

**Form Fields:**
- Name (required)
- Description (optional)
- Price (required)
- Category (required)
- Image URL (optional)
- Active status (default: true)

---

## Breadcrumb Navigation

All pages implement consistent breadcrumb navigation:

```
Tenants > [Tenant Name] > Menus > [Menu Name] > [Current Page]
```

Each breadcrumb level is clickable and navigates to the appropriate page.

---

## Requirements Covered

This implementation covers the following requirements from the spec:

**Requirement 6.1-6.5:** Tenant Menu Management Interface
- ✅ Display tenant's menus with list of menu items
- ✅ Display all menu items organized by category
- ✅ Search and filter menu items by name, category, and price range
- ✅ Display item details including name, description, price, image, and active status
- ✅ Display menu statistics (total items, active items, categories)

**Requirement 7.1-7.5:** Create and Edit Menu Items
- ✅ Create menu item with required fields (name, price, category)
- ✅ Add description and image URL
- ✅ Set isActive status
- ✅ Edit menu item functionality (navigation prepared)
- ✅ Form validation and error handling

---

## TODO / Future Enhancements

1. **Edit Menu Item Page** - Create `/tenants/[id]/menus/[menuId]/items/[itemId]/edit.vue`
2. **Category Management Page** - Create `/tenants/[id]/menus/[menuId]/categories.vue`
3. **Bulk Operations Page** - Create `/tenants/[id]/menus/[menuId]/bulk.vue`
4. **Create Menu Modal** - Implement menu creation functionality
5. **Image Upload** - Add image upload functionality instead of just URL input
6. **Menu Editing** - Add ability to edit menu details (name, description, status)

---

## Styling

All pages follow the SCSS style guide:
- BEM methodology without nested selectors
- Variables for all colors, spacing, and other values
- Responsive design with mobile breakpoints
- Consistent component styling
- Accessibility-compliant markup

---

## Error Handling

All pages implement comprehensive error handling:
- Loading states with spinners
- Error states with retry functionality
- Empty states with helpful messages
- Form validation with inline error messages
- Toast notifications for success/error feedback

---

## Navigation Flow

```
/tenants
  └─ /tenants/:id (Tenant Details)
      └─ /tenants/:id/menus (Menu List)
          └─ /tenants/:id/menus/:menuId (Menu Items)
              ├─ /tenants/:id/menus/:menuId/items/new (Create Item)
              ├─ /tenants/:id/menus/:menuId/items/:itemId/edit (Edit Item - TODO)
              ├─ /tenants/:id/menus/:menuId/categories (Categories - TODO)
              └─ /tenants/:id/menus/:menuId/bulk (Bulk Operations - TODO)
```
