// What search engines and link previews read on every page:
// - the canonical address, only on the public pages and always in lowercase (person pages are
//   noindex, so they get none, and neither does an error page);
// - Open Graph and the X/Twitter card, with the share image public/og-image.png (1200x630). The
//   title and description follow the page's own (InferSeoMetaPlugin copies them);
// - on the homepage, a JSON-LD description of the site (schema.org WebSite), which Google uses
//   for the site name in its results.
import { InferSeoMetaPlugin } from '@unhead/vue/plugins';

const SITE = 'https://roeiblik.com';
// The public pages, each in its one spelling. The sitemap lists the same pages (nuxt.config.ts).
const PUBLIC = new Set(['/', '/time-team', '/knrb', '/faq', '/privacy']);

const WEBSITE = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Roeiblik',
  url: `${SITE}/`,
  inLanguage: 'nl',
  description: 'Roeiuitslagen per persoon, van Time-Team en de KNRB.',
});

export default defineNuxtPlugin(() => {
  injectHead().use(InferSeoMetaPlugin());

  const route = useRouter().currentRoute;
  const error = useError();
  const canonical = computed(() => {
    if (error.value) return null;
    const path = route.value.path.replace(/\/+$/, '').toLowerCase() || '/';
    return PUBLIC.has(path) ? SITE + path : null;
  });

  useHead({
    link: computed(() => (canonical.value ? [{ rel: 'canonical', href: canonical.value }] : [])),
    meta: computed(() => [
      { property: 'og:site_name', content: 'Roeiblik' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'nl_NL' },
      ...(canonical.value ? [{ property: 'og:url', content: canonical.value }] : []),
      { property: 'og:image', content: `${SITE}/og-image.png` },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Roeiblik: roeiuitslagen per persoon, van Time-Team en de KNRB' },
    ]),
    script: computed(() => (canonical.value === `${SITE}/`
      ? [{ type: 'application/ld+json', key: 'website', innerHTML: WEBSITE }]
      : [])),
  });
});
