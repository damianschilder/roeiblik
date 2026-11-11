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
      wrangler: {
        name: 'roeiblik',
        // Roeiblik is only reachable on roeiblik.com: no *.workers.dev address and no preview URL
        // per version. www.roeiblik.com reaches the Worker too and is redirected by
        // server/middleware/canonical-host.js. (roeiblik.nl has its own redirect rule in Cloudflare.)
        workers_dev: false,
        preview_urls: false,
        routes: [
          { pattern: 'roeiblik.com', custom_domain: true },
          { pattern: 'www.roeiblik.com', custom_domain: true },
        ],
        vars: { NUXT_CANONICAL_HOST: 'roeiblik.com' },
        // NUXT_BLOCKED_PERSON_IDS and NUXT_PUBLIC_CF_BEACON_TOKEN are set in the dashboard.
        keep_vars: true,
      },
    },
  },

  experimental: {
    // The client fetched /_nuxt/builds/meta/<build>.json on start-up. When that failed (Google's
    // renderer, or a page cached from an older deploy) Nuxt replaced the page with a 500 error,
    // which ended up in Google's snippet. Roeiblik uses no client-side route rules, so turn it off.
    appManifest: false,
  },

  site: { url: 'https://roeiblik.com/', name: 'Roeiblik' },

  app: {
    head: {
      htmlAttrs: { lang: 'nl' },
      // Pages set a short title; plugins/title.js turns it into "<title> · Roeiblik".
      title: "Roeiblik",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Zoek op naam de uitslagen van roeiers, stuurtjes en coaches: compo- en wedstrijdresultaten uit Time-Team en klasserende uitslagen van de KNRB.' },
        // The browser bar on phones in the page's beige. Canonical, Open Graph and JSON-LD: plugins/seo.js.
        { name: 'theme-color', content: '#f1f0eb' },
      ],
      link: [
        // Square icons (Google shows a favicon only if it is square, 48 px or a multiple).
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/png', href: '/favicon-96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/png', href: '/favicon-192.png', sizes: '192x192' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  modules: ['@pinia/nuxt', 'nuxt-icons', '@nuxtjs/sitemap', '@nuxtjs/robots'],

  // The sitemap names the public pages itself, in their one (lowercase) spelling, instead of
  // deriving them from the page files. Person pages never go in: they are noindex, and robots.txt
  // (public/_robots.txt) keeps crawlers out of them and out of /api/. plugins/seo.js gives the same
  // six pages a canonical address.
  sitemap: {
    excludeAppSources: true,
    urls: ['/', '/time-team', '/knrb', '/faq', '/bronnen', '/privacy'],
  },

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
    '/time-team/persoon/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/knrb/persoon/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    // API answers: not stored by browsers or proxies by default. The server already caches the
    // upstream data (server/utils/upstream.js), errors are answered with HTTP 200 and must not
    // stick, and a removal request has to take effect at once. A route may still choose a short
    // private cache for itself with setResponseHeader.
    '/api/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } },
    // (/_nuxt/* gets `public, max-age=31536000, immutable` from Nuxt itself.)
    // No redirects here. The old capitalised addresses (/Time-Team, /KNRB, /api/...) and the
    // removed statistics page (/knrb/statistieken, in Google's index) are redirected by
    // server/middleware/lowercase-sections.js, together with the host: a route rule runs before
    // the middleware, so www plus an old address would otherwise take two hops.
  },

  imports: {
    dirs: ['stores', 'types'],
  },

  css: [
    "@/assets/style/app.scss",
  ],

  vite: {
    build: {
      // Fonts stay files, also the 4 kB logo font that Vite would inline: inlined it made the
      // stylesheet, which blocks the first paint, 5 kB bigger on every page; as a file it is
      // preloaded (plugins/fonts.js) and cached for a year.
      assetsInlineLimit: (file: string) => (file.endsWith('.woff2') ? false : undefined),
    },
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
    // NUXT_CANONICAL_HOST: the one host Roeiblik answers on; set by the Worker config above.
    canonicalHost: '',
    public: {
      // NUXT_PUBLIC_CF_BEACON_TOKEN: Cloudflare Web Analytics (cookieless, no personal data).
      // Empty means no analytics script at all. /privacy and /bronnen say "Roeiblik telt geen
      // bezoekers": setting a token means changing those sentences in the same deploy.
      cfBeaconToken: '',
    },
  },

  devtools: { enabled: true },
  compatibilityDate: '2026-11-01',
})
