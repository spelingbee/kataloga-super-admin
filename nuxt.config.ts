// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Super Admin Panel',
      enable2FA: process.env.NUXT_PUBLIC_ENABLE_2FA === 'true',
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  css: ['~/assets/scss/main.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/variables" as *;',
        },
      },
    },
    build: {
      // Enable code splitting
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // Vue ecosystem
              if (id.includes('vue') || id.includes('pinia') || id.includes('@vue')) {
                return 'vendor-vue'
              }
              // Charts
              if (id.includes('apexcharts')) {
                return 'vendor-charts'
              }
              // Export utilities
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'vendor-export'
              }
              // HTTP and utilities
              if (id.includes('axios') || id.includes('dayjs')) {
                return 'vendor-utils'
              }
              // Other vendors
              return 'vendor-other'
            }
            
            // Component chunks
            if (id.includes('/components/analytics/')) {
              return 'components-analytics'
            }
            if (id.includes('/components/email/')) {
              return 'components-email'
            }
            if (id.includes('/components/security/')) {
              return 'components-security'
            }
            if (id.includes('/components/subscription/')) {
              return 'components-subscription'
            }
            if (id.includes('/components/tenant/')) {
              return 'components-tenant'
            }
            
            // Store chunks
            if (id.includes('/stores/')) {
              return 'stores'
            }
          },
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Minify options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
        },
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'axios', 'dayjs'],
      exclude: ['apexcharts', 'jspdf', 'html2canvas'], // Lazy load heavy deps
    },
  },

  // Enable route caching
  routeRules: {
    // Cache static pages
    '/': { swr: 60 }, // Cache for 60 seconds with stale-while-revalidate
    '/login': { swr: 3600 }, // Cache login page for 1 hour
    '/401': { swr: 3600 },
    '/403': { swr: 3600 },
    
    // Dynamic pages with shorter cache
    '/tenants/**': { swr: 30 },
    '/subscriptions/**': { swr: 30 },
    '/analytics': { swr: 60 },
    '/emails/**': { swr: 30 },
    '/audit/**': { swr: 60 },
    '/security/**': { swr: 30 },
  },

  // Optimize component auto-imports
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  // Optimize imports
  imports: {
    dirs: ['composables', 'stores', 'utils'],
  },

  // Optimize build
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
  },

  // Enable compression
  nitro: {
    compressPublicAssets: true,
    minify: true,
  },

  app: {
    head: {
      title: 'Super Admin Panel',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Super Admin Panel for Platform Management' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000' },
      ],
    },
  },
})
