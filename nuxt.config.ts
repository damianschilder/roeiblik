// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  pages: true,
  ssr: true, // Enable Server-Side Rendering
  nitro: {
    preset: 'cloudflare' // Targets Cloudflare Workers
  },
  runtimeConfig: {
    public: {
      foodDataKey: process.env.NUXT_PUBLIC_FOODCENTRAL_API_KEY,
      gtagId: process.env.NUXT_PUBLIC_GTAG_ID
    }
  },

  app: {
    head: {
      title: "Roeiblik",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png?v=2' }]
    },
  },

  modules: [
    [
      '@pinia/nuxt',
      {
        autoImports: ['defineStore', 'acceptHMRUpdate'],
      },
    ],
    'nuxt-icons',
  ],

  imports: {
    dirs: ['stores', 'types'],
  },

  css: [
    "@/assets/style/app.scss", 
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData:
          '@use "@/assets/style/_variables.scss" as *; @use "@/assets/style/_breakpoints.scss" as *;'
        },
      },
    },
  },

  devtools: { enabled: true },
  compatibilityDate: '2024-11-20',
})