# Super Admin Panel - Environment Setup Guide

## Table of Contents

1. [Development Environment](#development-environment)
2. [Local Setup](#local-setup)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Development Tools](#development-tools)
7. [Common Issues](#common-issues)

---

## Development Environment

### Required Software

1. **Node.js** (v18.x or higher, v20.x LTS recommended)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **pnpm** (v8.x or higher)
   ```bash
   npm install -g pnpm
   # Verify
   pnpm --version
   ```

3. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

4. **PostgreSQL** (v14 or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

5. **Code Editor** (recommended: VS Code)
   - Download: https://code.visualstudio.com/

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "Prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## Local Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourorg/your-platform.git
cd your-platform
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This will install dependencies for:
- Root workspace
- Backend (`apps/backend`)
- Super Admin (`apps/super-admin`)
- Frontend (`apps/frontend`)

### 3. Verify Installation

```bash
# Check workspace structure
pnpm list --depth=0

# Verify all apps
ls -la apps/
```

---

## Environment Variables

### Backend Configuration

Create `apps/backend/.env`:

```bash
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env`:

```env
# ==============================================
# DATABASE CONFIGURATION
# ==============================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/platform_dev"

# ==============================================
# JWT CONFIGURATION
# ==============================================
JWT_SECRET="dev-jwt-secret-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
JWT_REFRESH_EXPIRES_IN="30d"

# ==============================================
# SUPER ADMIN CREDENTIALS
# ==============================================
SUPER_ADMIN_EMAIL="admin@localhost.dev"
SUPER_ADMIN_PASSWORD="Admin123!"
SUPER_ADMIN_FIRST_NAME="Super"
SUPER_ADMIN_LAST_NAME="Admin"

# ==============================================
# EMAIL CONFIGURATION
# ==============================================
# Options: smtp, sendgrid, ses, console
EMAIL_PROVIDER="console"

# SMTP Configuration (if using smtp)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-mailtrap-user"
SMTP_PASSWORD="your-mailtrap-password"
SMTP_FROM="noreply@localhost.dev"
SMTP_FROM_NAME="Platform Dev"

# SendGrid (if using sendgrid)
SENDGRID_API_KEY=""

# AWS SES (if using ses)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
SES_FROM_EMAIL="noreply@localhost.dev"

# ==============================================
# PAYMENT CONFIGURATION
# ==============================================
# Stripe Test Keys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal Sandbox
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_MODE="sandbox"

# ==============================================
# STORAGE CONFIGURATION
# ==============================================
# Options: local, s3
STORAGE_TYPE="local"
STORAGE_LOCAL_PATH="./uploads"

# AWS S3 (if using s3)
AWS_S3_BUCKET=""
AWS_S3_REGION="us-east-1"
AWS_S3_ACCESS_KEY_ID=""
AWS_S3_SECRET_ACCESS_KEY=""

# ==============================================
# REDIS CONFIGURATION (Optional)
# ==============================================
REDIS_URL="redis://localhost:6379"
REDIS_ENABLED="false"

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
NODE_ENV="development"
PORT="3000"
API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3002"
ADMIN_URL="http://localhost:3001"

# ==============================================
# CORS CONFIGURATION
# ==============================================
CORS_ORIGINS="http://localhost:3001,http://localhost:3002"
CORS_CREDENTIALS="true"

# ==============================================
# RATE LIMITING
# ==============================================
RATE_LIMIT_MAX="1000"
RATE_LIMIT_WINDOW="15m"

# ==============================================
# LOGGING
# ==============================================
LOG_LEVEL="debug"
LOG_FILE="logs/app.log"

# ==============================================
# TELEGRAM BOT (Optional)
# ==============================================
TELEGRAM_BOT_TOKEN=""
TELEGRAM_WEBHOOK_URL="http://localhost:3000/webhooks/telegram"

# ==============================================
# FEATURE FLAGS
# ==============================================
ENABLE_REGISTRATION="true"
ENABLE_TELEGRAM_NOTIFICATIONS="false"
ENABLE_EMAIL_VERIFICATION="true"
ENABLE_TWO_FACTOR_AUTH="true"

# ==============================================
# SECURITY
# ==============================================
BCRYPT_ROUNDS="10"
SESSION_SECRET="dev-session-secret"
COOKIE_SECURE="false"
COOKIE_SAME_SITE="lax"
```

### Super Admin Frontend Configuration

Create `apps/super-admin/.env`:

```bash
cd apps/super-admin
cp .env.example .env
```

Edit `apps/super-admin/.env`:

```env
# ==============================================
# API CONFIGURATION
# ==============================================
NUXT_PUBLIC_API_URL="http://localhost:3000"
NUXT_PUBLIC_API_TIMEOUT="30000"

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
NUXT_PUBLIC_APP_NAME="Super Admin Panel (Dev)"
NUXT_PUBLIC_APP_URL="http://localhost:3001"
NUXT_PUBLIC_APP_VERSION="1.0.0"

# ==============================================
# FEATURE FLAGS
# ==============================================
NUXT_PUBLIC_ENABLE_2FA="true"
NUXT_PUBLIC_ENABLE_IMPERSONATION="true"
NUXT_PUBLIC_ENABLE_ANALYTICS="true"
NUXT_PUBLIC_ENABLE_EXPORT="true"

# ==============================================
# DEVELOPMENT SETTINGS
# ==============================================
NODE_ENV="development"
NUXT_DEVTOOLS="true"

# ==============================================
# ANALYTICS (Optional - for production)
# ==============================================
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=""
NUXT_PUBLIC_MIXPANEL_TOKEN=""

# ==============================================
# ERROR TRACKING (Optional)
# ==============================================
NUXT_PUBLIC_SENTRY_DSN=""
NUXT_PUBLIC_SENTRY_ENVIRONMENT="development"

# ==============================================
# CACHE CONFIGURATION
# ==============================================
NUXT_PUBLIC_CACHE_DASHBOARD_TTL="300000"
NUXT_PUBLIC_CACHE_ANALYTICS_TTL="600000"
NUXT_PUBLIC_CACHE_LISTS_TTL="120000"
```

---

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE platform_dev;

# Create user (optional)
CREATE USER platform_user WITH PASSWORD 'platform_pass';
GRANT ALL PRIVILEGES ON DATABASE platform_dev TO platform_user;

# Exit
\q
```

### 2. Run Migrations

```bash
cd apps/backend

# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database (creates super admin user)
pnpm prisma db seed
```

### 3. Verify Database

```bash
# Open Prisma Studio
pnpm prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit data.

### 4. Reset Database (if needed)

```bash
# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Run seed script
```

---

## Running the Application

### Development Mode

**Option 1: Run All Applications**

From project root:

```bash
# Start all applications concurrently
pnpm dev
```

This starts:
- Backend API: `http://localhost:3000`
- Super Admin: `http://localhost:3001`
- Frontend: `http://localhost:3002`

**Option 2: Run Applications Individually**

Terminal 1 - Backend:
```bash
cd apps/backend
pnpm dev
```

Terminal 2 - Super Admin:
```bash
cd apps/super-admin
pnpm dev
```

Terminal 3 - Frontend (optional):
```bash
cd apps/frontend
pnpm dev
```

### Access Applications

- **Backend API**: http://localhost:3000
  - API Docs: http://localhost:3000/api/docs
  - Health Check: http://localhost:3000/health

- **Super Admin Panel**: http://localhost:3001
  - Login with credentials from `.env`:
    - Email: `admin@localhost.dev`
    - Password: `Admin123!`

- **Frontend App**: http://localhost:3002

### Production Build (Local Testing)

```bash
# Build all applications
pnpm build

# Start backend
cd apps/backend
pnpm start

# Start super admin (in new terminal)
cd apps/super-admin
pnpm preview
```

---

## Development Tools

### Prisma Studio

Visual database editor:

```bash
cd apps/backend
pnpm prisma studio
```

Opens at: http://localhost:5555

### API Documentation

Swagger/OpenAPI documentation:

```bash
# Start backend
cd apps/backend
pnpm dev

# Access docs
open http://localhost:3000/api/docs
```

### Database Migrations

```bash
cd apps/backend

# Create new migration
pnpm prisma migrate dev --name add_new_field

# Apply migrations
pnpm prisma migrate deploy

# Reset database
pnpm prisma migrate reset

# View migration status
pnpm prisma migrate status
```

### Code Formatting

```bash
# Format all code
pnpm format

# Format specific app
cd apps/super-admin
pnpm format

# Check formatting
pnpm format:check
```

### Linting

```bash
# Lint all code
pnpm lint

# Lint specific app
cd apps/super-admin
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Type Checking

```bash
# Type check all apps
pnpm type-check

# Type check specific app
cd apps/super-admin
pnpm type-check
```

---

## Common Issues

### Issue 1: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3005 pnpm dev
```

### Issue 2: Database Connection Failed

**Error:**
```
Error: Can't reach database server at localhost:5432
```

**Solution:**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify connection
psql -U postgres -h localhost
```

### Issue 3: Prisma Client Not Generated

**Error:**
```
Error: @prisma/client did not initialize yet
```

**Solution:**

```bash
cd apps/backend
pnpm prisma generate
```

### Issue 4: Module Not Found

**Error:**
```
Error: Cannot find module '@/components/...'
```

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear Nuxt cache (for super-admin)
cd apps/super-admin
rm -rf .nuxt .output
pnpm dev
```

### Issue 5: Environment Variables Not Loading

**Solution:**

```bash
# Verify .env file exists
ls -la apps/backend/.env
ls -la apps/super-admin/.env

# Restart development server
# Environment variables are loaded on startup
```

### Issue 6: CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:3001' has been blocked by CORS policy
```

**Solution:**

Check `apps/backend/.env`:
```env
CORS_ORIGINS="http://localhost:3001,http://localhost:3002"
CORS_CREDENTIALS="true"
```

Restart backend server.

### Issue 7: Hot Reload Not Working

**Solution:**

```bash
# Clear cache
cd apps/super-admin
rm -rf .nuxt

# Restart dev server
pnpm dev
```

### Issue 8: TypeScript Errors

**Solution:**

```bash
# Regenerate types
cd apps/super-admin
pnpm nuxt prepare

# Or for backend
cd apps/backend
pnpm prisma generate
```

---

## Development Workflow

### 1. Starting Work

```bash
# Pull latest changes
git pull origin main

# Install dependencies (if package.json changed)
pnpm install

# Run migrations (if schema changed)
cd apps/backend
pnpm prisma migrate dev

# Start development servers
pnpm dev
```

### 2. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ...

# Format code
pnpm format

# Lint code
pnpm lint

# Type check
pnpm type-check

# Test changes
# ...
```

### 3. Committing Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name
```

### 4. Database Changes

```bash
# Edit schema
nano apps/backend/prisma/schema.prisma

# Create migration
cd apps/backend
pnpm prisma migrate dev --name describe_your_changes

# Commit migration files
git add prisma/migrations
git commit -m "db: add new table"
```

---

## Testing Setup

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests for specific app
cd apps/super-admin
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Install Playwright (first time only)
cd apps/super-admin
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui
```

---

## Useful Commands

### Package Management

```bash
# Add dependency to specific app
pnpm --filter super-admin add package-name

# Add dev dependency
pnpm --filter super-admin add -D package-name

# Remove dependency
pnpm --filter super-admin remove package-name

# Update dependencies
pnpm update

# Update specific package
pnpm update package-name
```

### Database Commands

```bash
cd apps/backend

# View database
pnpm prisma studio

# Generate client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev

# Apply migrations
pnpm prisma migrate deploy

# Reset database
pnpm prisma migrate reset

# Seed database
pnpm prisma db seed

# Pull schema from database
pnpm prisma db pull

# Push schema to database (dev only)
pnpm prisma db push
```

### Build Commands

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter super-admin build

# Clean build artifacts
pnpm clean

# Clean and rebuild
pnpm clean && pnpm build
```

---

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["class:\\s*?[\"'`]([^\"'`]*).*?[\"'`]", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/apps/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Super Admin",
      "url": "http://localhost:3001",
      "webRoot": "${workspaceFolder}/apps/super-admin"
    }
  ]
}
```

---

## Next Steps

After completing the environment setup:

1. **Read the User Guide**: `docs/USER_GUIDE.md`
2. **Review API Documentation**: http://localhost:3000/api/docs
3. **Explore the Codebase**: Start with `apps/super-admin/pages/index.vue`
4. **Check Troubleshooting Guide**: `docs/TROUBLESHOOTING.md`
5. **Review Deployment Guide**: `docs/DEPLOYMENT.md`

---

## Getting Help

- **Documentation**: Check all docs in `apps/super-admin/docs/`
- **API Docs**: http://localhost:3000/api/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Nuxt Docs**: https://nuxt.com/docs
- **NestJS Docs**: https://docs.nestjs.com

---

*Last Updated: November 2025*
