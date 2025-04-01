// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  pages: true,
  ssr: true, // Enable Server-Side Rendering
  nitro: {
    preset: 'cloudflare', // Targets Cloudflare Workers
  },

  site: {  url: 'https://roeiblik.com/',  name: 'Roeiblik'  },

  app: {
    head: {
      title: "Roeiblik",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Zoek naar uitslagen van roeiers, stuurtjes en coaches binnen Time-Team en KNRB'},
        { name: 'keywords', content: 'roeiblik, roei blik, taarten, roei taarten, roeien, uitslagen, time-team, time team, winsten, stuurtjes, roeiers, coaches, knrb' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png?v=2' },
        { rel: 'preload', as: 'font', type: 'font/ttf', href: '/assets/fonts/Mulish/Mulish-VariableFont.ttf', crossorigin: 'anonymous' },
        { rel: 'preload', as: 'font', type: 'font/ttf', href: '/assets/fonts/Racing-Sans-One/RacingSansOne-Regular.ttf', crossorigin: 'anonymous' }
      ],
    },
  },

  modules: [[
    '@pinia/nuxt',
    {
      autoImports: ['defineStore', 'acceptHMRUpdate'],
    },
  ], 'nuxt-icons', '@nuxtjs/sitemap', '@nuxtjs/robots', 'nuxt-gtag'],

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

  // Make the environment variable available client-side
  runtimeConfig: {
    public: {
      gtagId: process.env.NUXT_PUBLIC_GTAG_ID,
    }
  },

  gtag: {
    id: process.env.NUXT_PUBLIC_GTAG_ID, // Use the env variable
    initialConsent: false, // Important: Start with consent denied
    config: {
      // user_id: '123', // Example: If you have user IDs
      // anonymize_ip: true, // Deprecated in GA4, handled automatically
      // send_page_view: false, // Set to false if you want to trigger manually after consent
    },
  },

  devtools: { enabled: true },
  compatibilityDate: '2024-11-20',
})