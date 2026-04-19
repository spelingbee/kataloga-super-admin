# Multi-stage Docker build for Super Admin (Nuxt 4)
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the specific package and app needed for the build
COPY packages/api-types ./packages/api-types
COPY apps/super-admin ./apps/super-admin

# Install dependencies for the super-admin and its workspace dependencies
RUN pnpm install --filter super-admin...

# Development stage
FROM base AS development
WORKDIR /app/apps/super-admin
EXPOSE 3002
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
WORKDIR /app/apps/super-admin

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nuxt -u 1001

# Copy built application
COPY --from=build --chown=nuxt:nodejs /app/apps/super-admin/.output /app/.output
COPY --from=build --chown=nuxt:nodejs /app/apps/super-admin/package.json /app/package.json

# Set environment variables
ENV NODE_ENV=production
ENV NITRO_PORT=3002
ENV NITRO_HOST=0.0.0.0

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", ".output/server/index.mjs"]
