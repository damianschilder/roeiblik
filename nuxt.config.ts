// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  pages: true,
  ssr: true,

  nitro: {
    // Cloudflare Workers with static assets (Workers Sites, the old `cloudflare` preset, is deprecated).
    // `deployConfig` writes .output/server/wrangler.json, so `npx wrangler deploy` needs no extra file.
    preset: 'cloudflare-module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      // Use the name of the Worker that already serves roeiblik.com (Cloudflare dashboard →
      // Workers & Pages), so a deploy replaces it instead of creating a second Worker.
      wrangler: { name: 'roeiblik' },
    },
  },

  site: { url: 'https://roeiblik.com/', name: 'Roeiblik' },

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
      ],
    },
  },

  modules: ['@pinia/nuxt', 'nuxt-icons', '@nuxtjs/sitemap', '@nuxtjs/robots'],

  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        'Strict-Transport-Security': 'max-age=31536000',
        'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'; upgrade-insecure-requests",
      },
    },
    // Person pages show other people's names and results: findable on Roeiblik, not via search
    // engines. The pages also set <meta name="robots">, which holds for any spelling of the URL.
    '/Time-Team/persoon/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/KNRB/persoon/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/api/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },

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

  runtimeConfig: {
    // NUXT_BLOCKED_PERSON_IDS: comma-separated Time-Team/KNRB ids of people who asked to be hidden.
    blockedPersonIds: '',
    public: {
      // NUXT_PUBLIC_CF_BEACON_TOKEN: Cloudflare Web Analytics (cookieless, no personal data).
      // Empty means no analytics script at all.
      cfBeaconToken: '',
    },
  },

  devtools: { enabled: true },
  compatibilityDate: '2026-11-01',
})
