// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxt/eslint', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' }
    ],
    langDir: 'locales',
    defaultLocale: 'en',
    strategy: 'no_prefix'
  },

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.kataloga.org/api',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Super Admin Panel',
      enable2FA: process.env.NUXT_PUBLIC_ENABLE_2FA === 'true',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // Отключено для ускорения dev сервера
  },

  css: ['~/assets/scss/main.scss'],

  devServer: {
    port: 3002,
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/variables" as *;',
        },
      },
    },
    build: {
      // Let Nuxt/Vite handle code splitting automatically
      // Custom manualChunks was causing "Cannot access before initialization" errors
      // by splitting Vue internals across chunks with incorrect load order
      chunkSizeWarningLimit: 1000,
      // Minify options
      minify: false,
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
    minify: false,
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
        { rel: 'preconnect', href: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001' },
      ],
    },
  },
})