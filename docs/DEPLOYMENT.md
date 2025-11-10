# Super Admin Panel - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Production Configuration](#production-configuration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Scaling](#scaling)
9. [Security Hardening](#security-hardening)

---

## Prerequisites

### System Requirements

**Minimum Requirements:**
- Node.js 18.x or higher
- pnpm 8.x or higher
- 2GB RAM
- 10GB disk space

**Recommended Requirements:**
- Node.js 20.x LTS
- pnpm 8.x or higher
- 4GB RAM
- 20GB disk space
- SSD storage

### Required Services

- PostgreSQL 14+ (backend database)
- Redis (optional, for caching)
- SMTP server or email service (SendGrid, AWS SES)
- Payment gateway (Stripe, PayPal)
- Storage service (AWS S3 or local)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourorg/your-platform.git
cd your-platform
```

### 2. Install Dependencies

```bash
# Install pnpm globally if not installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Configure Environment Variables

Create environment files for each application:

**Backend (.env)**

```bash
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/platform_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="30d"

# Super Admin
SUPER_ADMIN_EMAIL="admin@yourplatform.com"
SUPER_ADMIN_PASSWORD="SecurePassword123!"

# Email
EMAIL_PROVIDER="smtp" # or "sendgrid", "ses"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourplatform.com"

# SendGrid (if using)
SENDGRID_API_KEY="your-sendgrid-api-key"

# AWS SES (if using)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# Payment
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage
STORAGE_TYPE="s3" # or "local"
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="us-east-1"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="production"
PORT="3000"
API_URL="https://api.yourplatform.com"
FRONTEND_URL="https://app.yourplatform.com"
ADMIN_URL="https://admin.yourplatform.com"

# Security
CORS_ORIGINS="https://app.yourplatform.com,https://admin.yourplatform.com"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="15m"

# Telegram (optional)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_URL="https://api.yourplatform.com/webhooks/telegram"
```

**Super Admin Frontend (.env)**

```bash
cd apps/super-admin
cp .env.example .env
```

Edit `apps/super-admin/.env`:

```env
# API Configuration
NUXT_PUBLIC_API_URL="https://api.yourplatform.com"
NUXT_PUBLIC_API_TIMEOUT="30000"

# Application
NUXT_PUBLIC_APP_NAME="Super Admin Panel"
NUXT_PUBLIC_APP_URL="https://admin.yourplatform.com"

# Features
NUXT_PUBLIC_ENABLE_2FA="true"
NUXT_PUBLIC_ENABLE_IMPERSONATION="true"

# Analytics (optional)
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"

# Error Tracking (optional)
NUXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"

# Environment
NODE_ENV="production"
```

### 4. Database Setup

```bash
cd apps/backend

# Run migrations
pnpm prisma migrate deploy

# Seed initial data (creates super admin user)
pnpm prisma db seed
```

---

## Build Process

### Development Build

```bash
# Build backend
cd apps/backend
pnpm run build

# Build super admin frontend
cd apps/super-admin
pnpm run build
```

### Production Build

```bash
# From project root
pnpm run build

# Or build individually
cd apps/backend && pnpm run build
cd apps/super-admin && pnpm run build
```

### Build Output

**Backend:**
- Output: `apps/backend/dist/`
- Entry point: `dist/main.js`

**Super Admin:**
- Output: `apps/super-admin/.output/`
- Server: `.output/server/index.mjs`
- Public: `.output/public/`

---

## Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### Using PM2

**Install PM2:**

```bash
npm install -g pm2
```

**Create PM2 Ecosystem File:**

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'backend-api',
      cwd: './apps/backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'super-admin',
      cwd: './apps/super-admin',
      script: '.output/server/index.mjs',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NITRO_PORT: 3001
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
```

**Deploy:**

```bash
# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Monitor applications
pm2 monit

# View logs
pm2 logs

# Restart applications
pm2 restart all

# Stop applications
pm2 stop all
```

#### Nginx Configuration

Create `/etc/nginx/sites-available/super-admin`:

```nginx
# Backend API
upstream backend_api {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Super Admin Frontend
upstream super_admin {
    server 127.0.0.1:3001;
    keepalive 64;
}

# API Server
server {
    listen 80;
    listen [::]:80;
    server_name api.yourplatform.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourplatform.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourplatform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourplatform.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Backend
    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;
}

# Super Admin Panel
server {
    listen 80;
    listen [::]:80;
    server_name admin.yourplatform.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.yourplatform.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.yourplatform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourplatform.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Proxy to Super Admin
    location / {
        proxy_pass http://super_admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://super_admin;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable Site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/super-admin /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Option 2: Docker Deployment

**Create Dockerfile for Backend:**

`apps/backend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY prisma ./prisma

# Build application
WORKDIR /app/apps/backend
RUN pnpm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]
```

**Create Dockerfile for Super Admin:**

`apps/super-admin/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/super-admin/package.json ./apps/super-admin/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/super-admin ./apps/super-admin

# Build application
WORKDIR /app/apps/super-admin
RUN pnpm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/super-admin/.output ./.output

# Expose port
EXPOSE 3001

# Start application
CMD ["node", ".output/server/index.mjs"]
```

**Docker Compose:**

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: platform_db
      POSTGRES_USER: platform_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U platform_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://platform_user:secure_password@postgres:5432/platform_db
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  super-admin:
    build:
      context: .
      dockerfile: apps/super-admin/Dockerfile
    ports:
      - "3001:3001"
    environment:
      NUXT_PUBLIC_API_URL: http://backend:3000
      NODE_ENV: production
      NITRO_PORT: 3001
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Deploy with Docker:**

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Option 3: Cloud Platforms

#### Vercel (Super Admin Frontend Only)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/super-admin
vercel --prod
```

#### AWS (Complete Stack)

**Using AWS Elastic Beanstalk:**

1. Create Elastic Beanstalk application
2. Upload Docker Compose configuration
3. Configure environment variables
4. Deploy application

**Using AWS ECS:**

1. Build and push Docker images to ECR
2. Create ECS task definitions
3. Configure ECS service
4. Set up Application Load Balancer
5. Deploy containers

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy application

---

## Production Configuration

### SSL/TLS Certificates

**Using Let's Encrypt:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d api.yourplatform.com
sudo certbot --nginx -d admin.yourplatform.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Database Optimization

**PostgreSQL Configuration:**

Edit `/etc/postgresql/14/main/postgresql.conf`:

```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# Connections
max_connections = 100

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Create Indexes:**

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_admin_user ON audit_logs(admin_user);
```

### Caching Strategy

**Redis Configuration:**

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
```

Set:
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## Monitoring & Logging

### Application Monitoring

**PM2 Monitoring:**

```bash
# Real-time monitoring
pm2 monit

# Web dashboard
pm2 install pm2-server-monit
```

**Using Sentry for Error Tracking:**

```bash
# Install Sentry
pnpm add @sentry/node @sentry/nuxt
```

Configure in `apps/super-admin/nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@sentry/nuxt/module'],
  sentry: {
    dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV
  }
})
```

### Log Management

**Centralized Logging:**

```bash
# Install Winston for backend
pnpm add winston winston-daily-rotate-file
```

**Log Rotation:**

Create `/etc/logrotate.d/super-admin`:

```conf
/var/www/super-admin/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Health Checks

**Backend Health Endpoint:**

```typescript
// apps/backend/src/health/health.controller.ts
@Get('health')
async health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await this.checkDatabase(),
    redis: await this.checkRedis()
  };
}
```

**Monitoring Script:**

```bash
#!/bin/bash
# health-check.sh

API_URL="https://api.yourplatform.com/health"
ADMIN_URL="https://admin.yourplatform.com"

# Check API
if curl -f -s "$API_URL" > /dev/null; then
    echo "API is healthy"
else
    echo "API is down!"
    # Send alert
fi

# Check Admin Panel
if curl -f -s "$ADMIN_URL" > /dev/null; then
    echo "Admin Panel is healthy"
else
    echo "Admin Panel is down!"
    # Send alert
fi
```

**Add to Crontab:**

```bash
# Run health check every 5 minutes
*/5 * * * * /path/to/health-check.sh
```

---

## Backup & Recovery

### Database Backups

**Automated Backup Script:**

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="platform_db"
DB_USER="platform_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER -F c -b -v -f "$BACKUP_DIR/${DB_NAME}_${DATE}.backup" $DB_NAME

# Compress backup
gzip "$BACKUP_DIR/${DB_NAME}_${DATE}.backup"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.backup.gz" -mtime +30 -delete

echo "Backup completed: ${DB_NAME}_${DATE}.backup.gz"
```

**Schedule Backups:**

```bash
# Add to crontab
0 2 * * * /path/to/backup-database.sh
```

### Restore Database

```bash
# Restore from backup
gunzip platform_db_20250110_020000.backup.gz
pg_restore -U platform_user -d platform_db -v platform_db_20250110_020000.backup
```

### Application Backups

```bash
#!/bin/bash
# backup-application.sh

BACKUP_DIR="/var/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/super-admin"

# Create backup
tar -czf "$BACKUP_DIR/app_${DATE}.tar.gz" \
    -C $APP_DIR \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='.git' \
    .

# Delete backups older than 7 days
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete
```

---

## Scaling

### Horizontal Scaling

**Load Balancer Configuration (Nginx):**

```nginx
upstream backend_cluster {
    least_conn;
    server backend1.internal:3000 max_fails=3 fail_timeout=30s;
    server backend2.internal:3000 max_fails=3 fail_timeout=30s;
    server backend3.internal:3000 max_fails=3 fail_timeout=30s;
}

upstream admin_cluster {
    least_conn;
    server admin1.internal:3001 max_fails=3 fail_timeout=30s;
    server admin2.internal:3001 max_fails=3 fail_timeout=30s;
}
```

### Database Scaling

**Read Replicas:**

Configure PostgreSQL replication for read-heavy operations.

**Connection Pooling:**

Use PgBouncer:

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure
sudo nano /etc/pgbouncer/pgbouncer.ini
```

### Caching Layer

Implement Redis caching for:
- Dashboard metrics (5 min TTL)
- Analytics data (10 min TTL)
- Tenant lists (2 min TTL)

---

## Security Hardening

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Fail2Ban

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local
```

Add:
```conf
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600
```

### Security Headers

Already configured in Nginx configuration above.

### Regular Updates

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Application updates
cd /var/www/super-admin
git pull
pnpm install
pnpm run build
pm2 restart all
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs

# Check port availability
sudo netstat -tulpn | grep :3000

# Check environment variables
pm2 env 0
```

### Database Connection Issues

```bash
# Test connection
psql -U platform_user -d platform_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### High Memory Usage

```bash
# Check memory
free -h

# Check PM2 processes
pm2 list

# Restart applications
pm2 restart all
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check application health
- Review security alerts

**Weekly:**
- Review database performance
- Check disk space
- Analyze traffic patterns

**Monthly:**
- Update dependencies
- Review and optimize queries
- Generate performance reports
- Test backup restoration

---

*Last Updated: November 2025*
