// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  pages: true,
  ssr: true, // Enable Server-Side Rendering
  nitro: {
    preset: 'cloudflare' // Targets Cloudflare Workers
  },

  site: {  url: 'https://roeiblik.com/',  name: 'Roeiblik'  },

  app: {
    head: {
      title: "Roeiblik",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Zoek naar uitslagen van roeiers, stuurtjes en coaches binnen Time-Team.'},
        { name: 'keywords', content: 'roeiblik, roei blik, taarten, roei taarten, roeien, uitslagen, time-team, time team, winsten, stuurtjes, roeiers, coaches' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png?v=2' },
        { rel: 'preload', as: 'font', type: 'font/ttf', href: '/assets/fonts/Mulish/Mulish-VariableFont.ttf', crossorigin: 'anonymous' },
        { rel: 'preload', as: 'font', type: 'font/ttf', href: '/assets/fonts/Racing Sans One/RacingSansOne-Regular.ttf', crossorigin: 'anonymous' }
      ],
    },
  },

  modules: [[
    '@pinia/nuxt',
    {
      autoImports: ['defineStore', 'acceptHMRUpdate'],
    },
  ], 'nuxt-icons', '@nuxtjs/sitemap', '@nuxtjs/robots'],

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