# Quick Start Guide

## 🚀 Start the Super Admin Panel

### 1. Install Dependencies (if not already done)
```bash
# From the root of the monorepo
pnpm install
```

### 2. Configure Environment
```bash
cd apps/super-admin
cp .env.example .env
# Edit .env if needed (default values should work for local development)
```

### 3. Start Development Server
```bash
# From apps/super-admin directory
pnpm dev

# Or from the root of the monorepo
pnpm --filter super-admin dev
```

The application will be available at: **http://localhost:3001**

### 4. Access the Application
Open your browser and navigate to:
- Dashboard: http://localhost:3001/
- The sidebar navigation will show all available sections

## 📋 What's Included

### ✅ Completed Features
- **Responsive Layout**: Desktop and mobile-friendly design
- **Navigation System**: Sidebar with 9 main sections
- **Header**: Search bar, notifications, user menu
- **Breadcrumbs**: Auto-generated navigation trail
- **API Client**: Configured with JWT authentication
- **Styling**: TailwindCSS + custom SCSS
- **State Management**: Pinia store ready
- **Charts**: ApexCharts integrated for analytics
- **Date Utilities**: dayjs with formatting functions
- **TypeScript**: Full type safety

### 🎨 UI Components
- `AppSidebar` - Main navigation sidebar
- `AppHeader` - Top header with search and user menu
- `AppNavItem` - Navigation menu items
- `AppIcon` - SVG icon library
- `AppBreadcrumbs` - Breadcrumb navigation

### 🔧 Utilities & Plugins
- `useApi()` - Composable for API calls
- `formatDate()` - Date formatting utilities
- API interceptors for authentication
- ApexCharts plugin for data visualization

## 🎯 Next Steps

The foundation is complete! You can now:

1. **Implement Authentication** (Task 2)
   - Create login page
   - Build auth store
   - Add route protection

2. **Build Dashboard** (Task 3)
   - Integrate with analytics API
   - Display key metrics
   - Add activity feed

3. **Create Shared Components** (Task 4)
   - Data tables
   - Form components
   - Modals and dialogs

## 🛠️ Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm type-check

# Run tests
pnpm test

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## 📝 Notes

- The app runs on port **3001** to avoid conflicts with the main frontend (port 3000)
- Backend API should be running on **http://localhost:3000**
- Authentication tokens are stored in localStorage as `admin_token`
- All API calls automatically include the JWT token if available

## 🐛 Troubleshooting

### Port Already in Use
If port 3001 is already in use, you can change it in `package.json`:
```json
"dev": "nuxt dev --port 3002"
```

### API Connection Issues
Make sure the backend is running and the `NUXT_PUBLIC_API_BASE_URL` in `.env` is correct.

### Dependencies Issues
Try cleaning and reinstalling:
```bash
rm -rf node_modules .nuxt
pnpm install
```

## 📚 Resources

- [Project Setup Documentation](./SETUP.md)
- [Nuxt 3 Docs](https://nuxt.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [Pinia Docs](https://pinia.vuejs.org/)
